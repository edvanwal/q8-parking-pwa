/**
 * Q8 Parking - Services & Business Logic
 * Namespace: Q8.Services
 *
 * - Firebase init (Auth, Firestore)
 * - loadZones: Firestore zones listener (db.collection('zones'))
 * - Auth: login, register, logout
 * - Parking: start/end session, plates, overlays
 * - DIAG: Set window.Q8_DIAG = true for Firestore loading logs
 */

window.Q8 = window.Q8 || {};

Q8.Services = (function() {
    'use strict';

    // --- FIREBASE INITIALIZATION ---
    // Assumes firebaseConfig is loaded globally
    if (typeof firebase !== 'undefined' && typeof firebaseConfig !== 'undefined') {
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
    }
    const auth = (typeof firebase !== 'undefined') ? firebase.auth() : null;
    const db = (typeof firebase !== 'undefined') ? firebase.firestore() : null;

    // Helper shortcuts
    const S = Q8.State;
    const U = Q8.Utils;

    // --- AUTH SERVICES ---

    function initAuthListener() {
        if (!auth) return;
        auth.onAuthStateChanged(user => {
            if (user) {
                if (U && U.debug) U.debug('AUTH', "User Logged In", user.email);
                if (S.get.screen === 'login' || S.get.screen === 'register') {
                    setScreen('parking');
                }
            } else {
                if (U && U.debug) U.debug('AUTH', "No User / Logged Out");
                if (S.get.screen !== 'register') {
                    setScreen('login');
                }
            }
        });
    }

    function loginUser(email, password) {
        if (U && U.debug) U.debug('AUTH', 'Attempting Login', email);
        return auth.signInWithEmailAndPassword(email, password)
            .then(() => {
                S.save();
                // updateUI handled by listener
            });
    }

    function registerUser(email, password) {
        if (U && U.debug) U.debug('AUTH', 'Attempting Register', email);
        return auth.createUserWithEmailAndPassword(email, password)
            .then(() => {
                S.save();
            });
    }

    function logoutUser() {
        if (U && U.debug) U.debug('AUTH', 'Logging Out');
        return auth.signOut().then(() => {
            S.update({
                activeOverlay: null,
                session: null
            });
            localStorage.removeItem('q8_parking_session');
        });
    }

    // --- DATA SERVICES ---

    // DIAG: Set window.Q8_DIAG = true to log Firestore/Maps loading steps
    function diag(tag, msg, data) {
        if (window.Q8_DIAG) console.log('[DIAG_FIREBASE]', tag, msg, data || '');
    }

    function loadZones() {
        return new Promise((resolve, reject) => {
            if (U && U.debug) U.debug('DATA', "Setting up Firestore zones listener...");
            diag('loadZones', 'start', { db: !!db });
            if (!db) { diag('loadZones', 'no-db-fallback'); return resolve([]); }

            db.collection('zones').limit(2000).onSnapshot((snapshot) => {
                const zones = [];
                snapshot.forEach((doc) => {
                    const data = doc.data();
                    zones.push({
                        ...data,
                        uid: doc.id,
                        lat: parseFloat(data.lat),
                        lng: parseFloat(data.lng),
                        price: parseFloat(data.price)
                    });
                });

                diag('onSnapshot', 'received', { count: zones.length });
                if (zones.length > 0) {
                    S.update({ zones: zones });
                    if (U && U.debug) U.debug('DATA', `Live sync: ${zones.length} zones loaded.`);
                    diag('onSnapshot', 'zones-updated');

                    // Update Map Markers (Check Q8.UI or fallback)
                    if (Q8.UI && typeof Q8.UI.renderMapMarkers === 'function') Q8.UI.renderMapMarkers();
                    else if (typeof window.renderMapMarkers === 'function') window.renderMapMarkers();

                    if (Q8.UI && typeof Q8.UI.centerMapOnZones === 'function') Q8.UI.centerMapOnZones();
                    else if (typeof window.centerMapOnZones === 'function') window.centerMapOnZones();

                    // Debug Overlay
                    const debugEl = document.getElementById('debug-status');
                    if(debugEl) debugEl.innerText = `Zones: ${zones.length}`;
                }
                resolve(zones);
            }, (error) => {
                diag('onSnapshot', 'error', error && error.message);
                console.error("Firestore zones sync error:", error);
                reject(error);
            });
        });
    }

    // --- APP ACTIONS (CONTROLLERS) ---

    function setScreen(name) {
        if (U && U.debug) U.debug('NAV', `Switching to screen: ${name}`);

        // Reset specific states on navigate
        const updates = {
            screen: name,
            activeOverlay: null,
            selectedZone: null
        };

        if (name === 'plates') updates.selectedPlateId = null;

        S.update(updates);

        // Map: init when parking visible, resize when map exists
        if (name === 'parking' && !S.get.installMode.active) {
            if (Q8.UI && typeof Q8.UI.initGoogleMap === 'function') Q8.UI.initGoogleMap();
            else if (typeof window.initGoogleMap === 'function') window.initGoogleMap();
            requestAnimationFrame(() => {
                if (Q8.UI && typeof Q8.UI.ensureMapResized === 'function') Q8.UI.ensureMapResized();
            });
        }
    }

    function tryOpenOverlay(id, contextData = null) {
        const allowedSwitches = ['menu-overlay', 'sheet-plate-selector', 'sheet-zone'];

        // Guard: Prevent overlap unless allowed
        if (S.get.activeOverlay && S.get.activeOverlay !== id && !allowedSwitches.includes(id)) {
            return;
        }

        // --- ZONE SELECTION (fragile) ---
        // Risk: sheet-zone opened without context (e.g. from plate selector) leaves selectedZone stale.
        // Risk: contextData.uid/zone missing when clicked from marker with wrong data-* attributes.
        if (id === 'sheet-zone') {
            if (S.get.session !== null) {
                if(Q8.UI && Q8.UI.showToast) Q8.UI.showToast("You have an active session.");
                else if(typeof window.showToast === 'function') window.showToast("You have an active session.");
                return;
            }

            // Context Data Processing (matches app_recovery: uid/zone, price, rates, duration=120)
            if (contextData) {
                const zoneUid = contextData.uid || contextData.zone;
                if (!zoneUid) {
                    console.warn('[ZONE_SELECT] tryOpenOverlay(sheet-zone) called with no uid/zone in context', contextData);
                }
                const rates = (contextData.rates && contextData.rates.length > 0) ? contextData.rates : null;

                S.update({
                    selectedZone: zoneUid,
                    selectedZoneRate: contextData.price || 2.0,
                    selectedZoneRates: rates,
                    duration: 120 // Original: 2h default when opening zone sheet
                });
            } else if (!S.get.selectedZone) {
                console.warn('[ZONE_SELECT] tryOpenOverlay(sheet-zone) called with no context and no selectedZone');
            }
        }

        // Logic: Context Checks
        if (id === 'modal-confirm' && S.get.session === null) return;
        if (id === 'modal-add-plate' && S.get.screen !== 'plates') return;
        if (id === 'sheet-filter' && S.get.screen !== 'history') return;

        S.update({ activeOverlay: id });

        // Auto-focus logic
        if (id === 'modal-add-plate') {
            setTimeout(() => {
                const inp = document.getElementById('inp-plate');
                if (inp) { inp.value = ''; inp.focus(); }
                const modal = document.getElementById('modal-add-plate');
                const inpDesc = modal ? modal.querySelectorAll('input')[1] : null;
                if (inpDesc) inpDesc.value = '';
            }, 100);
        }
    }

    // --- PARKING START (fragile) ---
    // Risk: Silent return if guard fails (user thinks they started but didn't).
    // Risk: zoneObj undefined if zones not loaded or uid/id mismatch.
    // Risk: plates empty - session would have no plate; UI may show wrong label.
    function handleStartParking() {
        if (S.get.session) {
            console.warn('[PARKING_START] Blocked: session already active');
            return;
        }
        if (!S.get.selectedZone) {
            console.warn('[PARKING_START] Blocked: no selectedZone');
            return;
        }
        if (S.get.activeOverlay !== 'sheet-zone') {
            console.warn('[PARKING_START] Blocked: overlay is not sheet-zone', S.get.activeOverlay);
            return;
        }

        const zoneObj = S.get.zones.find(z => z.uid === S.get.selectedZone) || S.get.zones.find(z => z.id === S.get.selectedZone);
        if (!zoneObj) {
            console.warn('[PARKING_START] Zone not found in zones list', S.get.selectedZone, 'zones count:', S.get.zones.length);
        }
        const displayId = zoneObj ? zoneObj.id : 'Unknown';

        const now = new Date();
        const session = {
            zone: displayId,
            zoneUid: S.get.selectedZone,
            start: now,
            end: S.get.duration === 0 ? null : new Date(now.getTime() + S.get.duration * 60000)
        };

        S.update({
            session: session,
            activeOverlay: null,
            selectedZone: null
        });

        S.save();
        if(Q8.UI && Q8.UI.showToast) Q8.UI.showToast('Parking session started');
        else if(typeof window.showToast === 'function') window.showToast('Parking session started');
    }

    // --- PARKING END (fragile) ---
    // Risk: Silent return if no session (e.g. already ended, or state desync).
    function handleEndParking() {
        if (!S.get.session) {
            console.warn('[PARKING_END] Blocked: no active session');
            return;
        }

        S.update({
            session: null,
            activeOverlay: null
        });

        S.save();
        if(Q8.UI && Q8.UI.showToast) Q8.UI.showToast('Parking session ended');
        else if(typeof window.showToast === 'function') window.showToast('Parking session ended');
    }

    // --- PLATE MANAGEMENT ---

    // --- LICENSE PLATE ADD (fragile) ---
    // Risk: inp-plate or modal missing (DOM structure changed) causes empty rawVal.
    function saveNewPlate() {
        const inp = document.getElementById('inp-plate');
        if (!inp) {
            console.warn('[PLATES] saveNewPlate: #inp-plate not found');
        }
        const rawVal = inp ? inp.value.trim().toUpperCase() : '';

        const modal = document.getElementById('modal-add-plate');
        const inpDesc = modal ? modal.querySelectorAll('input')[1] : null;
        const description = inpDesc ? inpDesc.value.trim() : '';

        const toast = (msg) => {
            if(Q8.UI && Q8.UI.showToast) Q8.UI.showToast(msg);
            else if(typeof window.showToast === 'function') window.showToast(msg);
        };

        if (!rawVal) return toast('Please enter a license plate');
        if (rawVal.length > 12) return toast('License plate too long (max 12)');
        if (!/^[A-Z0-9-]+$/.test(rawVal)) return toast('Invalid characters');
        if (S.get.plates.some(p => p.text === rawVal)) return toast('License plate already exists');

        const isFirst = S.get.plates.length === 0;
        const newPlates = [...S.get.plates, {
            id: rawVal,
            text: rawVal,
            description: description,
            default: isFirst
        }];

        S.update({
            plates: newPlates,
            activeOverlay: null
        });

        S.savePlates();
        toast('License plate added');
    }

    // --- LICENSE PLATE DELETE (fragile) ---
    // Risk: id from data-id may not match (type coercion: id vs text).
    function deletePlate(id) {
        if (id == null || id === '') {
            console.warn('[PLATES] deletePlate: no id provided');
            return;
        }
        const plateIdx = S.get.plates.findIndex(p => p.id == id || p.text == id);
        if (plateIdx === -1) {
            console.warn('[PLATES] deletePlate: plate not found', id);
            return;
        }

        const newPlates = [...S.get.plates];
        const removed = newPlates.splice(plateIdx, 1)[0];

        if (removed.default && newPlates.length > 0) {
            newPlates[0].default = true;
        }

        let newSelected = S.get.selectedPlateId;
        if (S.get.selectedPlateId === id) {
            newSelected = null;
        }

        S.update({
            plates: newPlates,
            selectedPlateId: newSelected
        });

        S.savePlates();
        const toast = (msg) => {
            if(Q8.UI && Q8.UI.showToast) Q8.UI.showToast(msg);
            else if(typeof window.showToast === 'function') window.showToast(msg);
        };
        toast('License plate deleted');
    }

    // --- DURATION CHANGE (fragile) ---
    // Risk: Silent return if sheet-zone not active (e.g. +/− clicked when overlay closed).
    // Risk: delta is NaN if data-delta attribute missing or invalid.
    function modifyDuration(delta) {
        if (S.get.activeOverlay !== 'sheet-zone') {
            console.warn('[DURATION] modifyDuration ignored: overlay not sheet-zone', S.get.activeOverlay);
            return;
        }
        if (typeof delta !== 'number' || isNaN(delta)) {
            console.warn('[DURATION] modifyDuration ignored: invalid delta', delta);
            return;
        }

        const zone = S.get.zones.find(z => z.uid === S.get.selectedZone) ||
                     S.get.zones.find(z => z.id === S.get.selectedZone);

        const maxDur = (zone && zone.max_duration_mins && zone.max_duration_mins > 0)
            ? zone.max_duration_mins
            : 1440;

        let newDur = S.get.duration;

        if (delta > 0) {
            if (S.get.duration === 0) newDur = 30;
            else if (S.get.duration < 120) newDur += 30;
            else newDur += 60;
        } else {
            if (S.get.duration <= 30) newDur = 0;
            else if (S.get.duration <= 120) newDur -= 30;
            else newDur -= 60;
        }

        S.update({ duration: Math.min(newDur, maxDur) });
    }

    // --- LICENSE PLATE SET DEFAULT (fragile) ---
    // Risk: selectedPlateId not in plates (e.g. deleted plate still selected).
    function setDefaultPlate() {
        if (!S.get.selectedPlateId) {
            console.warn('[PLATES] setDefaultPlate: no selectedPlateId');
            return;
        }
        const targetPlate = S.get.plates.find(p => p.id === S.get.selectedPlateId);
        if (!targetPlate) {
            console.warn('[PLATES] setDefaultPlate: selected plate not in list', S.get.selectedPlateId);
        }

        const newPlates = S.get.plates.map(p => ({
            ...p,
            default: (p.id === S.get.selectedPlateId)
        }));

        S.update({
            plates: newPlates,
            selectedPlateId: null
        });

        S.savePlates();
        if(Q8.UI && Q8.UI.showToast) Q8.UI.showToast('Default plate updated');
        else if(typeof window.showToast === 'function') window.showToast('Default plate updated');
    }

    function checkInstallMode() {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('forceInstall')) {
            S.update({ installMode: { ...S.get.installMode, active: true } });
            return;
        }

        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
        const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

        if (isTouch && isIOS && !isStandalone) {
            S.update({ installMode: { ...S.get.installMode, active: true, platform: 'ios' } });
        } else {
            S.update({ installMode: { ...S.get.installMode, active: false } });
        }
    }

    return {
        initAuthListener,
        loginUser,
        registerUser,
        logoutUser,
        loadZones,
        setScreen,
        tryOpenOverlay,
        handleStartParking,
        handleEndParking,
        saveNewPlate,
        deletePlate,
        modifyDuration,
        setDefaultPlate,
        checkInstallMode
    };
})();
