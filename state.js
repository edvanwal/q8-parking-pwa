/**
 * Q8 Parking - State Management
 * Namespace: Q8.State
 */

window.Q8 = window.Q8 || {};

Q8.State = (function() {
    'use strict';

    const _state = {
        screen: 'login',      // 'login' | 'register' | 'parking' | 'history' | 'plates' | 'notifications' | 'car-specs' | 'favorites'
        language: 'en',       // 'nl' | 'en'
        darkMode: 'system',   // 'light' | 'dark' | 'system' (follow phone)
        rememberMe: false,
        rememberMeUntil: null, // epoch ms when remember-me expires
        passwordVisible: false,
        infoBanner: null,     // { type: 'info', text: string, dismissible: boolean }
        activeOverlay: null,
        plateSelectorReturnTo: null, // When plate selector opened from confirm-start modal: 'modal-confirm-start'
        session: null,        // Start on fresh load with null
        selectedZone: null,   // De momenteel geselecteerde zone (door klik op marker)
        selectedZoneRate: 2.0, // Default uurtarief
        userLocation: null,   // { lat, lng } when user grants geolocation
        searchMode: 'zone',   // 'zone' | 'address'
        searchQuery: '',      // Current input in search bar
        geocodeMatches: [],   // Zones near geocoded address (address search)
        geocodeLoading: false,
        duration: 0,          // 0 = "Until stopped" (No fixed end time)
        defaultDurationMinutes: 0, // 0 = Until stopped; else prefill zone sheet (e.g. 120 = 2h)
        zones: [],            // Populated continuously via Firestore
        zonesLoading: true,   // True while zones are being loaded
        zonesLoadError: null, // Error message when zones fail to load (network etc.)
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
        favorites: [],        // [{ zoneUid, zoneId, name?, order? }]
        driverSettings: {},   // Fleet manager settings (public only)
        adminPlates: [],      // Plates from fleet manager (public only)
        tenantId: 'default'
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
        let savedSession, savedPlates, savedAuthPrefs;
        try {
            savedSession = localStorage.getItem('q8_parking_session');
            savedPlates = localStorage.getItem('q8_plates_v1');
            savedAuthPrefs = localStorage.getItem('q8_auth_prefs_v1');
        } catch (e) {
            console.warn('[PERSIST] localStorage access failed (private mode?)', e);
            savedSession = null;
            savedPlates = null;
            savedAuthPrefs = null;
        }

        // 1. Session
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
        if (savedPlates) {
            try {
                _state.plates = JSON.parse(savedPlates);
            } catch (e) {
                console.warn('[PERSIST] Plates load failed, using empty', e);
                _state.plates = [];
            }
        }

        // 2b. Auth prefs (Remember me)
        if (savedAuthPrefs) {
            try {
                const p = JSON.parse(savedAuthPrefs);
                _state.rememberMe = !!p.rememberMe;
                _state.rememberMeUntil = (typeof p.rememberMeUntil === 'number') ? p.rememberMeUntil : null;
            } catch (e) {
                console.warn('[PERSIST] Auth prefs load failed, using defaults', e);
                _state.rememberMe = false;
                _state.rememberMeUntil = null;
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

        // 4b. Default duration (minutes; 0 = Until stopped)
        try {
            const dd = localStorage.getItem('q8_default_duration');
            if (dd !== null) {
                const n = parseInt(dd, 10);
                if (!isNaN(n) && n >= 0) _state.defaultDurationMinutes = Math.min(1440, n);
            }
        } catch (e) { /* ignore */ }

        // 5. Dark mode ('light'|'dark'|'system')
        try {
            const d = localStorage.getItem('q8_dark_v2');
            if (d === 'light' || d === 'dark' || d === 'system') _state.darkMode = d;
            else {
                const legacy = localStorage.getItem('q8_dark_v1');
                if (legacy !== null) _state.darkMode = legacy === 'true' ? 'dark' : 'light';
            }
        } catch (e) { /* ignore */ }
        initThemeListener();
        applyThemeFromPref();
    }

    function getEffectiveDark() {
        if (_state.darkMode === 'system') {
            return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
        return _state.darkMode === 'dark';
    }
    function applyThemeFromPref() {
        const dark = getEffectiveDark();
        const html = document.documentElement;
        if (dark) {
            html.setAttribute('data-theme', 'dark');
            html.style.colorScheme = 'dark';
        } else {
            html.setAttribute('data-theme', 'light');
            html.style.colorScheme = 'light';
        }
    }
    function initThemeListener() {
        applyThemeFromPref();
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
                if (_state.darkMode === 'system') applyThemeFromPref();
            });
        }
    }

    // Risk: localStorage can throw (quota exceeded, private mode) - wrap in try-catch.
    function save() {
        try {
            localStorage.setItem('q8_parking_session', JSON.stringify(_state.session));
        } catch (e) { console.warn('[PERSIST] Session save failed', e); }
    }

    function savePlates() {
        try {
            localStorage.setItem('q8_plates_v1', JSON.stringify(_state.plates));
        } catch (e) { console.warn('[PERSIST] Plates save failed', e); }
    }

    function saveAuthPrefs() {
        try {
            localStorage.setItem('q8_auth_prefs_v1', JSON.stringify({
                rememberMe: !!_state.rememberMe,
                rememberMeUntil: _state.rememberMeUntil
            }));
        } catch (e) { console.warn('[PERSIST] Auth prefs save failed', e); }
    }

    function clearRememberMe() {
        _state.rememberMe = false;
        _state.rememberMeUntil = null;
        try { localStorage.removeItem('q8_auth_prefs_v1'); } catch (e) { /* ignore */ }
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
            if (saved) {
                const parsed = JSON.parse(saved);
                _state.favorites = (Array.isArray(parsed) ? parsed : []).map((f, i) => ({
                    zoneUid: f.zoneUid,
                    zoneId: f.zoneId || f.zoneUid,
                    name: typeof f.name === 'string' ? f.name.trim() || undefined : undefined,
                    order: typeof f.order === 'number' ? f.order : i
                }));
            }
        } catch (e) { console.warn('[PERSIST] Favorites load failed', e); }
    }

    function setDarkMode(value) {
        _state.darkMode = (value === 'light' || value === 'dark' || value === 'system') ? value : 'system';
        applyThemeFromPref();
        try { localStorage.setItem('q8_dark_v2', _state.darkMode); } catch (e) {}
    }

    function saveDefaultDuration() {
        try { localStorage.setItem('q8_default_duration', String(_state.defaultDurationMinutes)); } catch (e) {}
    }

    return {
        get: _state,
        update: update,
        load: load,
        save: save,
        savePlates: savePlates,
        saveAuthPrefs: saveAuthPrefs,
        clearRememberMe: clearRememberMe,
        saveNotifications: saveNotifications,
        loadNotifications: loadNotifications,
        saveFavorites: saveFavorites,
        loadFavorites: loadFavorites,
        setDarkMode: setDarkMode,
        applyThemeFromPref: applyThemeFromPref,
        saveDefaultDuration: saveDefaultDuration
    };
})();
