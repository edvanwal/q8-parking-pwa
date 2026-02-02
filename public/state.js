/**
 * Q8 Parking - State Management
 * Namespace: Q8.State
 */

window.Q8 = window.Q8 || {};

Q8.State = (function() {
    'use strict';

    const _state = {
        screen: 'login',      // 'login' | 'register' | 'parking' | 'history' | 'plates' | 'notifications' | 'car-specs'
        language: 'en',       // 'nl' | 'en'
        rememberMe: false,
        passwordVisible: false,
        infoBanner: null,     // { type: 'info', text: string, dismissible: boolean }
        activeOverlay: null,
        session: null,        // Start on fresh load with null
        selectedZone: null,   // De momenteel geselecteerde zone (door klik op marker)
        selectedZoneRate: 2.0, // Default uurtarief
        searchMode: 'zone',   // 'zone' | 'address'
        searchQuery: '',      // Current input in search bar
        geocodeMatches: [],
        geocodeLoading: false,
        duration: 0,          // 0 = "Until stopped" (No fixed end time)
        zones: [],            // Populated continuously via Firestore
        zonesLoading: true,   // True while zones are being loaded
        // State "live" in localStorage, fallback naar 1 default
        plates: [],
        selectedPlateId: null, // Track currently selected plate in list
        history: [],          // Populated via Firestore
        historyFilters: {
            active: false,
            vehicles: [],
            dateRange: 'all', // 'all' | 'week' | '30days' | 'custom'
            customStart: null,
            customEnd: null
        },
        installMode: {
            active: false,
            platform: 'ios',
            language: 'en'
        },
        notifications: [],     // { type, message, detail, at (ISO string) }
        notificationSettings: {
            sessionStarted: true,
            sessionExpiringSoon: true,
            sessionEndedByUser: true,
            sessionEndedByMaxTime: true,
            expiringSoonMinutes: 10
        },
        favorites: [],    // [{ zoneUid, zoneId }]
        driverSettings: {}, // { canAddPlates, maxPlates, platesLocked } - from Firestore
        adminPlates: [],   // Plates toegevoegd door fleetmanager - from Firestore
        tenantId: null,    // Set when user logs in, for session writes
        vehicleDataByPlate: {} // { [normalizedPlateId]: { merk, handelsbenaming, brandstof_omschrijving, emissiecode_omschrijving } } - from RDW lookup, for milieuzone
    };

    /**
     * Update State & Trigger UI
     * @param {Object} changes - Partial state object to merge
     */
    function update(changes) {
        // Audit log using Q8.Utils
        if (typeof Q8.Utils.debug === 'function') {
            const keys = Object.keys(changes).join(', ');
            if (changes.zones) {
                Q8.Utils.debug('STATE', `Updated: ${keys} (Zones count: ${changes.zones.length})`);
            } else {
                Q8.Utils.debug('STATE', `Updated: ${keys}`, changes);
            }
        }

        Object.assign(_state, changes);

        // Auto-Trigger UI Update
        if (Q8.UI && typeof Q8.UI.update === 'function') {
            Q8.UI.update();
        } else if (typeof window.updateUI === 'function') {
            // Legacy Fallback (temporary until UI is refactored)
            window.updateUI();
        }
    }

    // --- PERSISTENCE (fragile) ---
    // Risk: localStorage unavailable (private mode, quota). Risk: Corrupted JSON.
    // Risk: Date(parsed.start/end) invalid if stored format changed.

    function load() {
        Q8.Utils.debug('STATE', 'Loading local state...');

        // 1. Session
        const savedSession = localStorage.getItem('q8_parking_session');
        if (savedSession) {
            try {
                const parsed = JSON.parse(savedSession);
                if (parsed) {
                    parsed.start = new Date(parsed.start);
                    parsed.end = parsed.end != null ? new Date(parsed.end) : null;
                    if (isNaN(parsed.start.getTime())) console.warn('[PERSIST] Session start date invalid', parsed.start);
                    if (parsed.end && isNaN(parsed.end.getTime())) console.warn('[PERSIST] Session end date invalid', parsed.end);
                }
                _state.session = parsed;
            } catch (e) {
                console.warn('[PERSIST] Session load failed, clearing', e);
                _state.session = null;
            }
        }

        // 2. Plates
        const savedPlates = localStorage.getItem('q8_plates_v1');
        if (savedPlates) {
            try {
                _state.plates = JSON.parse(savedPlates);
            } catch (e) {
                console.warn('[PERSIST] Plates load failed, using empty', e);
                _state.plates = [];
            }
        }

        // Seed default if empty
        if (_state.plates.length === 0) {
            _state.plates = [{ id: '1-ABC-123', text: '1-ABC-123', description: 'Lease', default: true }];
            savePlates(); // Persist initial seed
        }

        // 3. Notifications
        loadNotifications();

        // 4. Favorites
        loadFavorites();
    }

    // Risk: localStorage.setItem can throw (quota exceeded, private mode) - would propagate to caller.
    function save() {
        localStorage.setItem('q8_parking_session', JSON.stringify(_state.session));
    }

    function savePlates() {
        localStorage.setItem('q8_plates_v1', JSON.stringify(_state.plates));
    }

    function saveNotifications() {
        try {
            localStorage.setItem('q8_notifications_v1', JSON.stringify(_state.notifications));
            localStorage.setItem('q8_notif_settings_v1', JSON.stringify(_state.notificationSettings));
        } catch (e) { console.warn('[PERSIST] Notifications save failed', e); }
    }

    function loadNotifications() {
        try {
            const notifs = localStorage.getItem('q8_notifications_v1');
            if (notifs) _state.notifications = JSON.parse(notifs);
            const settings = localStorage.getItem('q8_notif_settings_v1');
            if (settings) _state.notificationSettings = { ..._state.notificationSettings, ...JSON.parse(settings) };
        } catch (e) { console.warn('[PERSIST] Notifications load failed', e); }
    }

    function saveFavorites() {
        try {
            localStorage.setItem('q8_favorites_v1', JSON.stringify(_state.favorites));
        } catch (e) { console.warn('[PERSIST] Favorites save failed', e); }
    }

    function loadFavorites() {
        try {
            const saved = localStorage.getItem('q8_favorites_v1');
            if (saved) _state.favorites = JSON.parse(saved);
        } catch (e) { console.warn('[PERSIST] Favorites load failed', e); }
    }

    return {
        get: _state,
        update: update,
        load: load,
        save: save,
        savePlates: savePlates,
        saveNotifications: saveNotifications,
        loadNotifications: loadNotifications,
        saveFavorites: saveFavorites,
        loadFavorites: loadFavorites
    };
})();
