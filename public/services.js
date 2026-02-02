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
    const messaging = (typeof firebase !== 'undefined' && firebase.messaging) ? firebase.messaging() : null;

    // Helper shortcuts
    const S = Q8.State;
    const U = Q8.Utils;

    // --- AUTH SERVICES ---

    let _historyUnsub = null;
    const DEFAULT_TENANT = 'default';

    function ensureAppUser(user) {
        if (!db || !user) return Promise.resolve();
        const email = (user.email || '').toLowerCase();
        return db.collection('users').doc(user.uid).get().then(doc => {
            if (doc.exists) {
                const data = doc.data();
                S.update({
                    driverSettings: data.driverSettings || {},
                    adminPlates: data.adminPlates || [],
                    tenantId: data.tenantId || DEFAULT_TENANT
                });
                fetchDriverSettings(user.uid);
                return data;
            }
            return db.collection('invites').where('email', '==', email).limit(1).get().then(invSnap => {
                const invite = !invSnap.empty ? invSnap.docs[0].data() : null;
                const tenantId = invite ? invite.tenantId : DEFAULT_TENANT;
                const role = invite ? (invite.role || 'driver') : 'driver';
                return db.collection('users').doc(user.uid).set({
                    email: user.email,
                    displayName: user.displayName || user.email.split('@')[0],
                    tenantId,
                    role,
                    driverSettings: { canAddPlates: true, maxPlates: 0, platesLocked: false },
                    userPlates: [],
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                }).then(() => {
                    S.update({ tenantId });
                    fetchDriverSettings(user.uid);
                    return { tenantId, role, driverSettings: {} };
                });
            });
        });
    }

    function fetchDriverSettings(uid) {
        if (!db || !uid) return;
        db.collection('users').doc(uid).onSnapshot(doc => {
            if (doc.exists) {
                const data = doc.data();
                const adminPlates = data.adminPlates || [];
                const userPlates = data.userPlates || [];
                S.update({
                    driverSettings: data.driverSettings || {},
                    adminPlates,
                    tenantId: data.tenantId || DEFAULT_TENANT
                });
                if (userPlates.length > 0) {
                    S.update({ plates: userPlates });
                    if (S.savePlates) S.savePlates();
                } else if (S.get.plates.length > 0) {
                    syncUserPlatesToFirestore(S.get.plates);
                }
            }
        }, () => {});
    }

    function syncUserPlatesToFirestore(plates) {
        const uid = auth && auth.currentUser ? auth.currentUser.uid : null;
        if (!db || !uid) return Promise.resolve();
        const userPlates = (plates || S.get.plates || []).filter(p => !(S.get.adminPlates || []).some(a => a.id === p.id));
        return db.collection('users').doc(uid).update({
            userPlates,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }).catch(() => {});
    }

    function removeUserPlateFromFirestore(plateId) {
        const plates = (S.get.plates || []).filter(p => p.id !== plateId);
        return syncUserPlatesToFirestore(plates);
    }

    function restoreSessionFromFirestore(uid) {
        if (!db || !uid || S.get.session) return Promise.resolve();
        return db.collection('sessions')
            .where('userId', '==', uid)
            .where('status', '==', 'active')
            .limit(1)
            .get()
            .then(snap => {
                if (snap.empty) return;
                const doc = snap.docs[0];
                const d = doc.data();
                const toDate = (v) => v && (v.toDate ? v.toDate() : new Date(v));
                const session = {
                    zone: d.zone,
                    zoneUid: d.zoneUid || d.zone,
                    plate: d.plate || '',
                    start: toDate(d.start),
                    end: d.end ? toDate(d.end) : null,
                    sessionDocId: doc.id
                };
                if (session.start && !isNaN(session.start.getTime())) {
                    S.update({ session });
                    if (S.save) S.save();
                    if (U && U.debug) U.debug('AUTH', 'Session restored from Firestore after localStorage cleared');
                }
            })
            .catch(() => {});
    }

    function initFCMAndSaveToken(uid) {
        if (!messaging || !db || !uid) return Promise.resolve();
        const vapidKey = (typeof firebaseConfig !== 'undefined' && firebaseConfig.messagingVapidKey) ? firebaseConfig.messagingVapidKey : '';
        if (!vapidKey) return Promise.resolve();
        return Notification.requestPermission().then(perm => {
            if (perm !== 'granted') return;
            return navigator.serviceWorker.ready.then(reg => {
                return messaging.getToken({ vapidKey, serviceWorkerRegistration: reg });
            }).then(token => {
                if (token) {
                    return db.collection('users').doc(uid).update({
                        fcmToken: token,
                        fcmTokenUpdatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    }).catch(() => {});
                }
            });
        }).catch(err => { if (U && U.debug) U.debug('FCM', 'Token failed', err); });
    }

    function syncNotificationSettingsToFirestore(settings) {
        if (!db || !auth || !auth.currentUser) return;
        const uid = auth.currentUser.uid;
        if (!uid || !settings) return;
        db.collection('users').doc(uid).update({
            notificationSettings: {
                sessionStarted: !!settings.sessionStarted,
                sessionExpiringSoon: !!settings.sessionExpiringSoon,
                sessionEndedByUser: !!settings.sessionEndedByUser,
                sessionEndedByMaxTime: !!settings.sessionEndedByMaxTime,
                expiringSoonMinutes: typeof settings.expiringSoonMinutes === 'number' ? settings.expiringSoonMinutes : 10
            },
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }).catch(() => {});
    }

    function initAuthListener() {
        if (!auth) return;
        auth.onAuthStateChanged(user => {
            if (user) {
                if (U && U.debug) U.debug('AUTH', "User Logged In", user.email);
                restoreSessionFromFirestore(user.uid);
                ensureAppUser(user);
                initFCMAndSaveToken(user.uid);
                if (S.get.notificationSettings) syncNotificationSettingsToFirestore(S.get.notificationSettings);
                if (S.get.screen === 'login' || S.get.screen === 'register') {
                    setScreen('parking');
                }
                if (db) loadHistory(user.uid);
            } else {
                if (U && U.debug) U.debug('AUTH', "No User / Logged Out");
                if (_historyUnsub) { _historyUnsub(); _historyUnsub = null; }
                S.update({ history: [], driverSettings: {}, adminPlates: [] });
                if (S.get.screen !== 'register') {
                    setScreen('login');
                }
            }
        });
    }

    function getTenantId() {
        return S.get.tenantId || DEFAULT_TENANT;
    }

    function haversineKm(lat1, lon1, lat2, lon2) {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2)*Math.sin(dLat/2) + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)*Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    function geocodeAndSearch(query) {
        const q = (query || '').trim();
        if (q.length < 3) {
            S.update({ geocodeMatches: [], geocodeLoading: false });
            return Promise.resolve([]);
        }
        S.update({ geocodeLoading: true });
        const key = (typeof firebaseConfig !== 'undefined' && firebaseConfig.googleMapsApiKey) ? firebaseConfig.googleMapsApiKey : '';
        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(q + ', Netherlands')}&key=${key}`;
        return fetch(url).then(r => r.json()).then(data => {
            const matches = [];
            if (data.status === 'OK' && data.results && data.results[0]) {
                const loc = data.results[0].geometry.location;
                const lat = loc.lat, lng = loc.lng;
                const zones = (S.get.zones || []).map(z => ({
                    ...z,
                    _dist: haversineKm(lat, lng, parseFloat(z.lat) || 0, parseFloat(z.lng) || 0)
                })).filter(z => z._dist < 2).sort((a, b) => a._dist - b._dist).slice(0, 15);
                zones.forEach(z => { delete z._dist; });
                matches.push(...zones);
            }
            S.update({ geocodeMatches: matches, geocodeLoading: false });
            return matches;
        }).catch(err => {
            console.warn('Geocode error:', err);
            S.update({ geocodeMatches: [], geocodeLoading: false });
            return [];
        });
    }

    function loadHistory(userId) {
        if (!db || !userId) return;
        if (_historyUnsub) _historyUnsub();
        _historyUnsub = db.collection('transactions')
            .where('userId', '==', userId)
            .orderBy('endedAt', 'desc')
            .limit(200)
            .onSnapshot((snapshot) => {
                const items = [];
                snapshot.forEach((doc) => {
                    const d = doc.data();
                    const startDate = d.start && (d.start.toDate ? d.start.toDate() : new Date(d.start));
                    const endDate = d.end && (d.end.toDate ? d.end.toDate() : new Date(d.end));
                    const dd = (n) => String(n).padStart(2, '0');
                    items.push({
                        id: doc.id,
                        zone: d.zone,
                        zoneUid: d.zoneUid,
                        plate: d.plate || '',
                        street: d.street || '',
                        date: startDate ? `${dd(startDate.getDate())}-${dd(startDate.getMonth() + 1)}-${startDate.getFullYear()}` : '',
                        start: startDate ? `${dd(startDate.getHours())}:${dd(startDate.getMinutes())}` : '',
                        end: endDate ? `${dd(endDate.getHours())}:${dd(endDate.getMinutes())}` : '',
                        price: d.cost != null ? Number(d.cost).toFixed(2) : ''
                    });
                });
                S.update({ history: items });
            }, (err) => {
                console.error('Transactions listener error:', err);
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

    function sendPasswordResetEmail(email) {
        if (!auth) return Promise.reject(new Error('Auth not available'));
        return auth.sendPasswordResetEmail(email);
    }

    function logoutUser() {
        if (U && U.debug) U.debug('AUTH', 'Logging Out');
        return auth.signOut().then(() => {
            S.update({
                activeOverlay: null,
                session: null
            });
            try { localStorage.removeItem('q8_parking_session'); } catch (e) { /* ignore */ }
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
            S.update({ zonesLoading: true });
            if (!db) { S.update({ zonesLoading: false }); diag('loadZones', 'no-db-fallback'); return resolve([]); }

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
                        S.update({ zones: zones, zonesLoading: false, zonesLoadError: null });
                        if (U && U.debug) U.debug('DATA', `Live sync: ${zones.length} zones loaded.`);
                        diag('onSnapshot', 'zones-updated');

                        if (Q8.UI && typeof Q8.UI.renderMapMarkers === 'function') Q8.UI.renderMapMarkers();
                        else if (typeof window.renderMapMarkers === 'function') window.renderMapMarkers();

                        if (Q8.UI && typeof Q8.UI.centerMapOnZones === 'function') Q8.UI.centerMapOnZones();
                        else if (typeof window.centerMapOnZones === 'function') window.centerMapOnZones();

                        const debugEl = document.getElementById('debug-status');
                        if(debugEl) debugEl.innerText = `Zones: ${zones.length}`;
                    });
                } else {
                    S.update({ zones: zones, zonesLoading: false, zonesLoadError: null });
                }
                resolve(zones);
            }, (error) => {
                const msg = error && error.message ? error.message : 'Network error';
                S.update({ zonesLoading: false, zonesLoadError: msg });
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
        const allowedSwitches = ['menu-overlay', 'sheet-plate-selector', 'sheet-zone', 'modal-add-plate', 'modal-edit-plate', 'modal-forgot-password', 'modal-confirm-delete-plate', 'modal-confirm-daypass'];

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
        if (id === 'modal-forgot-password') {
            setTimeout(() => {
                const inpEmail = document.getElementById('inp-email');
                const inpForgot = document.getElementById('inp-forgot-email');
                if (inpForgot && inpEmail) inpForgot.value = inpEmail.value || '';
                const resultEl = document.getElementById('forgot-password-result');
                if (resultEl) { resultEl.style.display = 'none'; resultEl.textContent = ''; }
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

    // Dagkaart detection: zone has day pass (from isDayPass or rates with "Dagkaart" in detail)
    function hasDayPass(zone) {
        if (!zone) return false;
        if (zone.isDayPass === true) return true;
        const rates = zone.rates || [];
        return rates.some(r => /dagkaart|day.?pass/i.test(r.detail || ''));
    }

    function getDayPassCost(zone) {
        if (!zone) return null;
        const rates = zone.rates || [];
        const dagkaartRate = rates.find(r => /dagkaart|day.?pass/i.test(r.detail || ''));
        if (!dagkaartRate) return null;
        const detail = (dagkaartRate.detail || '').replace(',', '.');
        const match = detail.match(/[\d]+[.,]?\d*/);
        return match ? match[0].replace(',', '.') : (dagkaartRate.price || null);
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
            S.update({ selectedZone: null, selectedZoneRates: null });
            toast(S.get.language === 'nl' ? 'Zone niet meer beschikbaar. Selecteer de zone opnieuw.' : 'Zone no longer available. Please select the zone again.');
            return;
        }
        const ds = S.get.driverSettings || {};
        const nowCheck = new Date();
        const dayOfWeek = nowCheck.getDay();
        const allowedDays = ds.allowedDays;
        if (Array.isArray(allowedDays) && allowedDays.length > 0 && !allowedDays.includes(dayOfWeek)) {
            toast(S.get.language === 'nl' ? 'Parkeren is niet toegestaan op deze dag.' : 'Parking is not allowed on this day.');
            return;
        }
        if (ds.allowedTimeStart || ds.allowedTimeEnd) {
            const mins = nowCheck.getHours() * 60 + nowCheck.getMinutes();
            const parseTime = (t) => {
                if (!t) return null;
                const m = String(t).match(/^(\d{1,2}):(\d{2})/);
                return m ? parseInt(m[1], 10) * 60 + parseInt(m[2], 10) : null;
            };
            const startM = parseTime(ds.allowedTimeStart), endM = parseTime(ds.allowedTimeEnd);
            if (startM != null && mins < startM) {
                toast(S.get.language === 'nl' ? 'Parkeren nog niet toegestaan.' : 'Parking not yet allowed.');
                return;
            }
            if (endM != null && mins > endM) {
                toast(S.get.language === 'nl' ? 'Parkeren niet meer toegestaan vandaag.' : 'Parking no longer allowed today.');
                return;
            }
        }
        const displayId = zoneObj.id;

        const adminPlates = (S.get.adminPlates || []).map(p => ({ id: p.id, text: p.text || p.id, default: false }));
        const allPlates = [...adminPlates, ...(S.get.plates || [])];
        const selPlate = allPlates.find(p => p.id === S.get.selectedPlateId) ||
                         allPlates.find(p => p.default) ||
                         allPlates[0];
        const plateText = selPlate ? (selPlate.text || selPlate.id) : '';

        const now = new Date();
        const endDate = S.get.duration === 0 ? null : new Date(now.getTime() + S.get.duration * 60000);
        const session = {
            zone: displayId,
            zoneUid: S.get.selectedZone,
            plate: plateText,
            start: now,
            end: endDate
        };

        const userId = auth && auth.currentUser ? auth.currentUser.uid : null;
        const tenantId = getTenantId();

        S.update({ session, activeOverlay: null, selectedZone: null });
        S.save();

        if (db && userId) {
            const sessionData = {
                userId,
                tenantId,
                zone: displayId,
                zoneUid: S.get.selectedZone,
                plate: plateText,
                start: firebase.firestore.Timestamp.fromDate(now),
                end: endDate ? firebase.firestore.Timestamp.fromDate(endDate) : null,
                status: 'active',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            db.collection('sessions').add(sessionData).then((docRef) => {
                session.sessionDocId = docRef.id;
                S.update({ session });
                S.save();
            }).catch((err) => {
                console.error('Firestore session create failed:', err);
            });
        }

        toast('Parking session started');
        addNotification('sessionStarted', S.get.language === 'nl' ? 'Parkeersessie gestart' : 'Parking session started', `${displayId} · ${plateText}`);
        if (endDate && requestNotificationPermission) requestNotificationPermission();
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

        if (type === 'sessionExpiringSoon' && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            try {
                new Notification('Q8 Parking', { body: message, icon: '/icons/favicon-32x32.png', tag: 'parking-expiring' });
            } catch (e) { /* ignore */ }
        }
    }

    function requestNotificationPermission() {
        if (typeof Notification === 'undefined') return;
        if (Notification.permission === 'default') {
            Notification.requestPermission().then(() => {});
        }
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
        const session = S.get.session;
        if (!session) {
            console.warn('[PARKING_END] Blocked: no active session');
            return;
        }

        const now = new Date();
        const startDate = session.start instanceof Date ? session.start : new Date(session.start);
        const endDate = session.end ? (session.end instanceof Date ? session.end : new Date(session.end)) : now;

        const zone = S.get.zones.find(z => z.uid === session.zoneUid || z.id === session.zoneUid) || S.get.zones.find(z => z.id === session.zone);
        const hourlyRate = (zone && zone.price != null) ? parseFloat(zone.price) : (S.get.selectedZoneRate || 2.0);
        const durationMins = Math.round((endDate.getTime() - startDate.getTime()) / 60000);
        const cost = U && U.calculateCost ? U.calculateCost(durationMins, hourlyRate) : (durationMins / 60) * hourlyRate;

        S.update({ session: null, activeOverlay: null });
        S.save();

        if (db && auth && auth.currentUser) {
            const userId = auth.currentUser.uid;
            const tenantId = getTenantId();

            const transactionData = {
                userId,
                tenantId,
                zone: session.zone,
                zoneUid: session.zoneUid,
                plate: session.plate || '',
                street: (zone && zone.street) ? zone.street : '',
                start: firebase.firestore.Timestamp.fromDate(startDate),
                end: firebase.firestore.Timestamp.fromDate(endDate),
                cost: Math.round(cost * 100) / 100,
                endedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            if (session.sessionDocId) {
                db.collection('sessions').doc(session.sessionDocId).update({
                    status: 'ended',
                    endedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    endedBy: 'user'
                }).catch((err) => console.warn('Session update failed:', err));
            }

            db.collection('transactions').add(transactionData).catch((err) => {
                console.error('Transaction add failed:', err);
            });
        }

        addNotification('sessionEndedByUser', S.get.language === 'nl' ? 'Parkeersessie beëindigd' : 'Parking session ended', `${session.zone} · ${session.plate || ''}`);
        if (Q8.UI && Q8.UI.showToast) Q8.UI.showToast('Parking session ended');
        else if (typeof window.showToast === 'function') window.showToast('Parking session ended');
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

        if (!rawVal) return toast('Please enter a license plate');

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
            if (normalized.length > 8) return toast('License plate too long');
            if (!/^[A-Z0-9]+$/.test(normalized)) return toast('Letters and digits only');
        }

        if (!formatValid) return toast(formatError || 'Invalid license plate format');
        if (S.get.plates.some(p => p.text === normalized || p.id === normalized)) return toast('License plate already exists');

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
        if (!rawVal) return toast('Please enter a license plate');

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
            if (normalized.length > 8) return toast('License plate too long');
            if (!/^[A-Z0-9]+$/.test(normalized)) return toast('Letters and digits only');
        }

        if (!formatValid) return toast(formatError || 'Invalid license plate format');
        if (S.get.plates.some(p => (p.id != id && p.text != id) && (p.text === normalized || p.id === normalized))) return toast('License plate already exists');

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
                const brand = ((result.data.merk || '') + (result.data.handelsbenaming ? ' ' + result.data.handelsbenaming : '')).trim();
                const soort = result.data.voertuigsoort || '';
                resultEl.textContent = (S.get.language === 'nl' ? 'Gevonden: ' : 'Found: ') + (brand || soort || 'RDW');
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
        sendPasswordResetEmail,
        loadZones,
        geocodeAndSearch,
        setScreen,
        tryOpenOverlay,
        handleStartParking,
        hasDayPass,
        getDayPassCost,
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
        handleAutoEndSession,
        requestNotificationPermission,
        syncNotificationSettingsToFirestore
    };
})();
