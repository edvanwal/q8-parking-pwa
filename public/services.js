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

    // Exclude garage and non-street-parking zones (alleen straatparkeren)
    const EXCLUDED_USAGE = ['VERGUNP', 'BEWONERP', 'DEELAUTOP', 'VERGUNZ', 'GPK', 'BEDRIJFP', 'BEZOEKBDP', 'ONTHEFFING', 'GARAGEP', 'CARPOOL', 'GEBIEDVRIJ', 'MILIEUZONE', 'ZE_ONTHEF', 'GSL_ONTHEF', 'GPKB', 'TERREINP'];
    const NON_STREET_PATTERNS = /garage|p\+r|p&r|carpool|transferium|parkeergarage/i;
    function isStreetParkingZone(z) {
        const uid = (z.usageid || z.usage || '').toUpperCase();
        if (uid && EXCLUDED_USAGE.includes(uid)) return false;
        const name = (z.name || z.id || '').toLowerCase();
        if (NON_STREET_PATTERNS.test(name)) return false;
        const rates = z.rates || [];
        if (rates.some(r => NON_STREET_PATTERNS.test(r.detail || ''))) return false;
        return true;
    }

    function loadZones() {
        return new Promise((resolve, reject) => {
            if (U && U.debug) U.debug('DATA', "Setting up Firestore zones listener...");
            diag('loadZones', 'start', { db: !!db });
            if (!db) { diag('loadZones', 'no-db-fallback'); return resolve([]); }

            db.collection('zones').limit(2000).onSnapshot((snapshot) => {
                const raw = [];
                snapshot.forEach((doc) => {
                    const data = doc.data();
                    raw.push({
                        ...data,
                        uid: doc.id,
                        lat: parseFloat(data.lat),
                        lng: parseFloat(data.lng),
                        price: parseFloat(data.price)
                    });
                });
                const zones = raw.filter(isStreetParkingZone);
                diag('onSnapshot', 'received', { raw: raw.length, streetOnly: zones.length });
                if (zones.length > 0) {
                    requestAnimationFrame(() => {
                        S.update({ zones: zones });
                        if (U && U.debug) U.debug('DATA', `Live sync: ${zones.length} zones loaded.`);
                        diag('onSnapshot', 'zones-updated');

                        if (Q8.UI && typeof Q8.UI.renderMapMarkers === 'function') Q8.UI.renderMapMarkers();
                        else if (typeof window.renderMapMarkers === 'function') window.renderMapMarkers();

                        if (Q8.UI && typeof Q8.UI.centerMapOnZones === 'function') Q8.UI.centerMapOnZones();
                        else if (typeof window.centerMapOnZones === 'function') window.centerMapOnZones();

                        const debugEl = document.getElementById('debug-status');
                        if(debugEl) debugEl.innerText = `Zones: ${zones.length}`;
                    });
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
                const inp = document.getElementById('inp-search');
                if (inp && !S.get.session) inp.focus();
            });
        }
    }

    function tryOpenOverlay(id, contextData = null) {
        const allowedSwitches = ['menu-overlay', 'sheet-plate-selector', 'sheet-zone', 'modal-add-plate', 'modal-edit-plate'];

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

            // Context Data Processing (uid/zone, price, rates; duration default = 0 = Until stopped)
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
                    duration: 0   // Default: Until stopped
                });
            } else if (!S.get.selectedZone) {
                console.warn('[ZONE_SELECT] tryOpenOverlay(sheet-zone) called with no context and no selectedZone');
            }
        }

        // Logic: Context Checks
        if (id === 'modal-confirm' && S.get.session === null) return;
        if ((id === 'modal-add-plate' || id === 'modal-edit-plate') && S.get.screen !== 'plates') return;
        if (id === 'sheet-filter' && S.get.screen !== 'history') return;

        S.update({ activeOverlay: id });

        if (id === 'sheet-zone' && contextData && (contextData.uid || contextData.zone)) {
            if (Q8.UI && Q8.UI.centerMapOnZones) setTimeout(() => Q8.UI.centerMapOnZones(), 50);
        }

        // Auto-focus logic
        if (id === 'modal-add-plate') {
            setTimeout(() => {
                const inp = document.getElementById('inp-plate');
                if (inp) { inp.value = ''; inp.focus(); }
                const inpDesc = document.getElementById('inp-plate-desc');
                if (inpDesc) inpDesc.value = '';
            }, 100);
        }
    }

    // --- PARKING START (fragile) ---
    // Risk: Silent return if guard fails (user thinks they started but didn't).
    // Risk: zoneObj undefined if zones not loaded or uid/id mismatch.
    // Risk: plates empty - session would have no plate; UI may show wrong label.
    function toast(msg) {
        if (Q8.UI && Q8.UI.showToast) Q8.UI.showToast(msg);
        else if (typeof window.showToast === 'function') window.showToast(msg);
    }

    function handleStartParking() {
        if (S.get.session) {
            console.warn('[PARKING_START] Blocked: session already active');
            toast('You already have an active parking session.');
            return;
        }
        if (!S.get.selectedZone) {
            console.warn('[PARKING_START] Blocked: no selectedZone');
            toast('Select a parking zone first.');
            return;
        }
        if (S.get.activeOverlay !== 'sheet-zone') {
            console.warn('[PARKING_START] Blocked: overlay is not sheet-zone', S.get.activeOverlay);
            toast('Open a zone to start parking.');
            return;
        }

        const zoneObj = S.get.zones.find(z => z.uid === S.get.selectedZone) || S.get.zones.find(z => z.id === S.get.selectedZone);
        if (!zoneObj) {
            console.warn('[PARKING_START] Zone not found in zones list', S.get.selectedZone, 'zones count:', S.get.zones.length);
            toast('Parking could not be started. Please select the zone again.');
            return;
        }
        const displayId = zoneObj.id;

        const selPlate = S.get.plates.find(p => p.id === S.get.selectedPlateId) ||
                         S.get.plates.find(p => p.default) ||
                         S.get.plates[0];
        const plateText = selPlate ? selPlate.text : '';

        const now = new Date();
        const session = {
            zone: displayId,
            zoneUid: S.get.selectedZone,
            plate: plateText,
            start: now,
            end: S.get.duration === 0 ? null : new Date(now.getTime() + S.get.duration * 60000)
        };

        S.update({
            session: session,
            activeOverlay: null,
            selectedZone: null
        });

        S.save();
        toast('Parking session started');
        addNotification('sessionStarted', S.get.language === 'nl' ? 'Parkeersessie gestart' : 'Parking session started', `${displayId} · ${plateText}`);
    }

    // --- NOTIFICATIONS ---
    function addNotification(type, message, detail) {
        const settings = S.get.notificationSettings;
        const key = type === 'sessionStarted' ? 'sessionStarted' :
            type === 'sessionExpiringSoon' ? 'sessionExpiringSoon' :
            type === 'sessionEndedByUser' ? 'sessionEndedByUser' :
            type === 'sessionEndedByMaxTime' ? 'sessionEndedByMaxTime' : null;
        if (key && !settings[key]) return;
        const item = { type, message, detail: detail || '', at: new Date().toISOString() };
        const notifs = [...(S.get.notifications || []), item];
        if (notifs.length > 100) notifs.shift();
        S.update({ notifications: notifs });
        if (S.saveNotifications) S.saveNotifications();
        if (Q8.UI && Q8.UI.showToast) Q8.UI.showToast(message);
        else if (typeof window.showToast === 'function') window.showToast(message);
    }

    function handleAutoEndSession(reason) {
        const session = S.get.session;
        if (!session) return;
        const zone = S.get.zones.find(z => z.uid === session.zoneUid || z.id === session.zoneUid) || S.get.zones.find(z => z.id === session.zone);
        const zoneLabel = zone ? zone.id : session.zone || '?';
        const plate = session.plate || '?';
        S.update({ session: null, activeOverlay: null });
        S.save();
        if (reason === 'sessionEndedByUser') {
            addNotification('sessionEndedByUser', S.get.language === 'nl' ? 'Parkeersessie automatisch beëindigd (eindtijd bereikt)' : 'Parking session ended automatically (end time reached)', `${zoneLabel} · ${plate}`);
        } else {
            addNotification('sessionEndedByMaxTime', S.get.language === 'nl' ? 'Parkeersessie beëindigd (maximale parkeertijd bereikt)' : 'Parking session ended (maximum parking time reached)', `${zoneLabel} · ${plate}`);
        }
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

    // --- MODIFY ACTIVE SESSION END TIME ---
    function modifyActiveSessionEnd(delta) {
        const session = S.get.session;
        if (!session) return;

        const zone = S.get.zones.find(z => z.uid === session.zoneUid || z.id === session.zoneUid) ||
                     S.get.zones.find(z => z.id === session.zone);
        const maxDurMins = (zone && zone.max_duration_mins && zone.max_duration_mins > 0) ? zone.max_duration_mins : 1440;

        const now = new Date();
        const stepMins = Math.abs(delta) >= 60 ? 60 : 30;
        const stepMs = (delta > 0 ? stepMins : -stepMins) * 60000;

        let newEnd;

        if (!session.end) {
            if (delta > 0) {
                newEnd = new Date(now.getTime() + stepMins * 60000);
                if (newEnd.getTime() - now.getTime() > maxDurMins * 60000) newEnd = new Date(now.getTime() + maxDurMins * 60000);
            } else return;
        } else {
            const endDate = session.end instanceof Date ? session.end : new Date(session.end);
            if (delta > 0) {
                newEnd = new Date(endDate.getTime() + stepMs);
                const maxEnd = new Date(now.getTime() + maxDurMins * 60000);
                if (newEnd > maxEnd) newEnd = maxEnd;
            } else {
                const newEndTime = endDate.getTime() + stepMs;
                if (newEndTime <= now.getTime()) newEnd = null;
                else newEnd = new Date(newEndTime);
            }
        }

        S.update({ session: { ...session, end: newEnd } });
        S.save();
    }

    // --- PLATE MANAGEMENT ---

    // --- LICENSE PLATE ADD (with free kenteken validation) ---
    function saveNewPlate() {
        const inp = document.getElementById('inp-plate');
        if (!inp) {
            console.warn('[PLATES] saveNewPlate: #inp-plate not found');
        }
        const rawVal = inp ? inp.value.trim() : '';

        const inpDesc = document.getElementById('inp-plate-desc');
        const description = inpDesc ? inpDesc.value.trim() : '';

        const toast = (msg) => {
            if (Q8.UI && Q8.UI.showToast) Q8.UI.showToast(msg);
            else if (typeof window.showToast === 'function') window.showToast(msg);
        };

        if (!rawVal) return toast(S.get.language === 'nl' ? 'Voer een kenteken in' : 'Please enter a license plate');

        const Kenteken = (typeof Q8 !== 'undefined' && Q8.Kenteken) ? Q8.Kenteken : null;
        let normalized = rawVal.replace(/[\s\-]/g, '').toUpperCase();
        let formatValid = true;
        let formatError = '';

        if (Kenteken) {
            const v = Kenteken.validate(rawVal);
            formatValid = v.valid;
            formatError = v.errorMessage || '';
            normalized = v.normalized;
        } else {
            if (normalized.length > 8) return toast(S.get.language === 'nl' ? 'Kenteken te lang' : 'License plate too long');
            if (!/^[A-Z0-9]+$/.test(normalized)) return toast(S.get.language === 'nl' ? 'Alleen letters en cijfers' : 'Letters and digits only');
        }

        if (!formatValid) return toast(formatError || (S.get.language === 'nl' ? 'Ongeldig kentekenformaat' : 'Invalid license plate format'));
        if (S.get.plates.some(p => p.text === normalized || p.id === normalized)) return toast(S.get.language === 'nl' ? 'Dit kenteken bestaat al' : 'License plate already exists');

        const isFirst = S.get.plates.length === 0;
        const displayText = Kenteken && Kenteken.formatDisplay ? Kenteken.formatDisplay(normalized) : normalized;
        const newPlates = [...S.get.plates, {
            id: normalized,
            text: displayText || normalized,
            description: description,
            default: isFirst
        }];

        S.update({
            plates: newPlates,
            activeOverlay: null
        });

        S.savePlates();

        if (Kenteken && Kenteken.lookupRDW) {
            Kenteken.lookupRDW(normalized).then(function(result) {
                if (result.found && result.data) {
                    const brand = (result.data.merk || '') + (result.data.handelsbenaming ? ' ' + result.data.handelsbenaming : '');
                    toast(S.get.language === 'nl' ? 'Kenteken toegevoegd (gecontroleerd: ' + (brand.trim() || 'RDW') + ')' : 'License plate added (verified: ' + (brand.trim() || 'RDW') + ')');
                } else if (result.error) {
                    toast(S.get.language === 'nl' ? 'Kenteken toegevoegd (controle RDW tijdelijk niet beschikbaar)' : 'License plate added (RDW check temporarily unavailable)');
                } else {
                    toast(S.get.language === 'nl' ? 'Kenteken toegevoegd (niet in RDW gevonden)' : 'License plate added (not found in RDW)');
                }
            }).catch(function() {
                toast(S.get.language === 'nl' ? 'Kenteken toegevoegd' : 'License plate added');
            });
        } else {
            toast(S.get.language === 'nl' ? 'Kenteken toegevoegd' : 'License plate added');
        }
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

    function updatePlate(id, newText, newDescription) {
        if (id == null || id === '') {
            console.warn('[PLATES] updatePlate: no id provided');
            return;
        }
        const plateIdx = S.get.plates.findIndex(p => p.id == id || p.text == id);
        if (plateIdx === -1) {
            console.warn('[PLATES] updatePlate: plate not found', id);
            return;
        }
        const rawVal = (newText || '').trim();

        const toast = (msg) => {
            if (Q8.UI && Q8.UI.showToast) Q8.UI.showToast(msg);
            else if (typeof window.showToast === 'function') window.showToast(msg);
        };
        if (!rawVal) return toast(S.get.language === 'nl' ? 'Voer een kenteken in' : 'Please enter a license plate');

        const Kenteken = (typeof Q8 !== 'undefined' && Q8.Kenteken) ? Q8.Kenteken : null;
        let normalized = rawVal.replace(/[\s\-]/g, '').toUpperCase();
        let formatValid = true;
        let formatError = '';

        if (Kenteken) {
            const v = Kenteken.validate(rawVal);
            formatValid = v.valid;
            formatError = v.errorMessage || '';
            normalized = v.normalized;
        } else {
            if (normalized.length > 8) return toast(S.get.language === 'nl' ? 'Kenteken te lang' : 'License plate too long');
            if (!/^[A-Z0-9]+$/.test(normalized)) return toast(S.get.language === 'nl' ? 'Alleen letters en cijfers' : 'Letters and digits only');
        }

        if (!formatValid) return toast(formatError || (S.get.language === 'nl' ? 'Ongeldig kentekenformaat' : 'Invalid license plate format'));
        if (S.get.plates.some(p => (p.id != id && p.text != id) && (p.text === normalized || p.id === normalized))) return toast(S.get.language === 'nl' ? 'Dit kenteken bestaat al' : 'License plate already exists');

        const displayText = Kenteken && Kenteken.formatDisplay ? Kenteken.formatDisplay(normalized) : normalized;
        const newPlates = [...S.get.plates];
        const plate = newPlates[plateIdx];
        const wasDefault = plate.default;
        newPlates[plateIdx] = {
            id: normalized,
            text: displayText || normalized,
            description: (newDescription || '').trim(),
            default: wasDefault
        };

        let newSelected = S.get.selectedPlateId;
        if (S.get.selectedPlateId === id || S.get.selectedPlateId === plate.text) {
            newSelected = normalized;
        }

        S.update({
            plates: newPlates,
            selectedPlateId: newSelected,
            activeOverlay: null
        });

        S.savePlates();
        toast(S.get.language === 'nl' ? 'Kenteken bijgewerkt' : 'License plate updated');
    }

    /**
     * Controleren bij RDW (gratis): valideer kenteken en toon RDW-resultaat in #plate-rdw-result.
     */
    function checkPlateRDW() {
        const inp = document.getElementById('inp-plate');
        const resultEl = document.getElementById('plate-rdw-result');
        const Kenteken = (typeof Q8 !== 'undefined' && Q8.Kenteken) ? Q8.Kenteken : null;
        const toast = (msg) => {
            if (Q8.UI && Q8.UI.showToast) Q8.UI.showToast(msg);
            else if (typeof window.showToast === 'function') window.showToast(msg);
        };

        if (!resultEl) return;
        resultEl.textContent = '';
        resultEl.className = 'plate-rdw-result';

        const rawVal = inp ? inp.value.trim() : '';
        if (!rawVal) {
            resultEl.textContent = S.get.language === 'nl' ? 'Voer eerst een kenteken in.' : 'Enter a license plate first.';
            resultEl.classList.add('plate-rdw-error');
            return;
        }

        if (!Kenteken) {
            resultEl.textContent = S.get.language === 'nl' ? 'Validatie niet beschikbaar.' : 'Validation not available.';
            resultEl.classList.add('plate-rdw-error');
            return;
        }

        const v = Kenteken.validate(rawVal);
        if (!v.valid) {
            resultEl.textContent = v.errorMessage || (S.get.language === 'nl' ? 'Ongeldig kentekenformaat' : 'Invalid format');
            resultEl.classList.add('plate-rdw-error');
            return;
        }

        resultEl.textContent = S.get.language === 'nl' ? 'Controleren bij RDW...' : 'Checking RDW...';
        resultEl.classList.add('plate-rdw-loading');

        Kenteken.lookupRDW(v.normalized).then(function(result) {
            resultEl.classList.remove('plate-rdw-loading');
            if (result.error) {
                resultEl.textContent = S.get.language === 'nl' ? 'RDW tijdelijk niet bereikbaar.' : 'RDW temporarily unavailable.';
                resultEl.classList.add('plate-rdw-error');
                return;
            }
            if (result.found && result.data) {
                const brand = (result.data.merk || '') + (result.data.handelsbenaming ? ' ' + result.data.handelsbenaming : '').trim();
                const soort = result.data.voertuigsoort || '';
                resultEl.textContent = (S.get.language === 'nl' ? 'Gevonden: ' : 'Found: ') + (brand.trim() || soort || 'RDW');
                resultEl.classList.add('plate-rdw-ok');
            } else {
                resultEl.textContent = S.get.language === 'nl' ? 'Niet gevonden in RDW-register.' : 'Not found in RDW register.';
                resultEl.classList.add('plate-rdw-warn');
            }
        }).catch(function() {
            resultEl.classList.remove('plate-rdw-loading');
            resultEl.textContent = S.get.language === 'nl' ? 'Controle mislukt.' : 'Check failed.';
            resultEl.classList.add('plate-rdw-error');
        });
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
        modifyActiveSessionEnd,
        saveNewPlate,
        updatePlate,
        checkPlateRDW,
        deletePlate,
        modifyDuration,
        setDefaultPlate,
        checkInstallMode,
        addNotification,
        handleAutoEndSession
    };
})();
