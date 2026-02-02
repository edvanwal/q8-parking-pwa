/**
 * Q8 Parking PWA - Main Entry Point
 * Namespace: Q8.App
 */

window.Q8 = window.Q8 || {};

Q8.App = (function() {
    'use strict';

    const S = Q8.State;
    const U = Q8.Utils;
    const Services = Q8.Services;
    const UI = Q8.UI;

    // Debug Init
    if (U && U.debug) U.debug('APP', "Initializing application...");

    function closeSideMenu() {
        const menu = document.getElementById('side-menu');
        const backdrop = document.getElementById('menu-overlay-backdrop');
        if (menu) menu.classList.remove('open');
        if (backdrop) backdrop.classList.remove('open');
    }

    function handleClick(e) {
        try {
            // 1. Handle Backdrop Clicks (exact target = dark overlay, not sheet content)
            if (e.target.classList.contains('overlay-backdrop')) {
                if (e.target.id === 'menu-overlay-backdrop') {
                    closeSideMenu();
                } else {
                    if (S && S.update) S.update({ activeOverlay: null });
                }
                e.preventDefault();
                e.stopPropagation();
                return;
            }

            // 2. Find data-action element
            const target = e.target.closest('[data-action]');
            if (!target) return;

            // 3. BUBBLING GUARD
            if (target.classList.contains('overlay-backdrop') && e.target !== target) {
                return;
            }

            const action = target.getAttribute('data-action');
            const targetId = target.getAttribute('data-target');

            switch (action) {
                case 'toggle-menu': {
                    const menu = document.getElementById('side-menu');
                    const backdrop = document.getElementById('menu-overlay-backdrop');
                    if (menu) menu.classList.toggle('open');
                    if (backdrop) backdrop.classList.toggle('open');
                    break;
                }

                case 'nav-to':
                    closeSideMenu(); // Close menu when navigating
                    if (Services && Services.setScreen) Services.setScreen(targetId);
                    break;
                case 'set-search-mode': {
                    const mode = target.getAttribute('data-mode') || 'zone';
                    if (S.get.searchMode === mode) break;
                    S.update({ searchMode: mode, searchQuery: '', geocodeMatches: [], geocodeLoading: false });
                    const inp = document.getElementById('inp-search');
                    if (inp) {
                        inp.value = '';
                        inp.placeholder = mode === 'address' ? (S.get.language === 'nl' ? 'Straat en plaats' : 'Street and city') : (S.get.language === 'nl' ? 'Zone of straatnaam' : 'Zone or street name');
                        inp.focus();
                    }
                    document.querySelectorAll('.search-mode-btn').forEach(b => b.classList.toggle('active', b.getAttribute('data-mode') === mode));
                    break;
                }
                case 'toggle-search-mode': {
                    const newMode = S.get.searchMode === 'zone' ? 'address' : 'zone';
                    S.update({ searchMode: newMode, searchQuery: '', geocodeMatches: [], geocodeLoading: false });
                    const inp = document.getElementById('inp-search');
                    if (inp) {
                        inp.value = '';
                        inp.placeholder = newMode === 'address' ? (S.get.language === 'nl' ? 'Straat en plaats' : 'Street and city') : (S.get.language === 'nl' ? 'Zone of straatnaam' : 'Zone or street name');
                        inp.focus();
                    }
                    break;
                }

                case 'open-plate-selector':
                    UI.renderQuickPlateSelector();
                    Services.tryOpenOverlay('sheet-plate-selector');
                    break;

                case 'select-quick-plate':
                    // Risk: selectedZone can be null if sheet was closed and reopened, or zone not yet set.
                    const qId = target.getAttribute('data-id');
                    if (!qId) console.warn('[PLATE_SELECT] select-quick-plate: no data-id');
                    S.update({ selectedPlateId: qId });
                    if (!S.get.selectedZone) console.warn('[PLATE_SELECT] Reopening zone sheet with no selectedZone');
                    Services.tryOpenOverlay('sheet-zone', { uid: S.get.selectedZone });
                    break;

                case 'open-overlay': {
                    // Risk: JSON.parse on data-rates throws if malformed. data-zone-uid/zone missing = empty context.
                    const context = {
                        uid: target.getAttribute('data-zone-uid'),
                        zone: target.getAttribute('data-zone'),
                        price: parseFloat(target.getAttribute('data-price')),
                        rates: (() => { try { return JSON.parse(target.getAttribute('data-rates') || 'null'); } catch (_) { return null; } })()
                    };
                    if (targetId === 'modal-confirm-delete-plate') {
                        const plateId = target.getAttribute('data-id');
                        const modal = document.getElementById('modal-confirm-delete-plate');
                        if (modal) modal.setAttribute('data-delete-plate-id', plateId || '');
                        const descEl = document.getElementById('confirm-delete-plate-desc');
                        const plate = plateId ? (S.get.plates.find(p => p.id == plateId || p.text == plateId)) : null;
                        if (descEl) descEl.textContent = plate
                            ? (S.get.language === 'nl' ? `Weet u zeker dat u kenteken ${plate.text} wilt verwijderen? Dit kan niet ongedaan worden gemaakt.` : `Are you sure you want to remove license plate ${plate.text}? This cannot be undone.`)
                            : (S.get.language === 'nl' ? 'Weet u zeker dat u dit kenteken wilt verwijderen?' : 'Are you sure you want to remove this license plate? This cannot be undone.');
                    }
                    Services.tryOpenOverlay(targetId, context);
                    break;
                }

                case 'close-overlay':
                    S.update({ activeOverlay: null });
                    break;

                case 'mod-duration':
                    const delta = parseInt(target.getAttribute('data-delta'), 10);
                    if (isNaN(delta)) console.warn('[DURATION] mod-duration: invalid data-delta', target.getAttribute('data-delta'));
                    Services.modifyDuration(delta);
                    break;

                case 'mod-active-end': {
                    const endDelta = parseInt(target.getAttribute('data-delta'), 10);
                    if (!isNaN(endDelta) && Services.modifyActiveSessionEnd) Services.modifyActiveSessionEnd(endDelta);
                    break;
                }

                case 'start-session': Services.handleStartParking(); break;
                case 'confirm-end': Services.handleEndParking(); break;
                case 'save-plate': Services.saveNewPlate(); break;
                case 'check-plate': if (Services.checkPlateRDW) Services.checkPlateRDW(); break;

                case 'edit-plate': {
                    const plateId = target.getAttribute('data-id');
                    const plate = S.get.plates.find(p => p.id == plateId || p.text == plateId);
                    if (plate) {
                        const inpPlate = document.getElementById('inp-edit-plate');
                        const inpDesc = document.getElementById('inp-edit-plate-desc');
                        if (inpPlate) inpPlate.value = plate.text || '';
                        if (inpDesc) inpDesc.value = plate.description || '';
                        const modal = document.getElementById('modal-edit-plate');
                        if (modal) modal.setAttribute('data-editing-id', plate.id);
                        Services.tryOpenOverlay('modal-edit-plate');
                    }
                    break;
                }

                case 'save-edit-plate': {
                    const modal = document.getElementById('modal-edit-plate');
                    const editingId = modal ? modal.getAttribute('data-editing-id') : null;
                    const inpPlate = document.getElementById('inp-edit-plate');
                    const inpDesc = document.getElementById('inp-edit-plate-desc');
                    if (editingId && inpPlate) {
                        Services.updatePlate(editingId, inpPlate.value, inpDesc ? inpDesc.value : '');
                    }
                    break;
                }

                case 'delete-plate': {
                    const plateId = target.getAttribute('data-id');
                    const modal = document.getElementById('modal-confirm-delete-plate');
                    if (modal) modal.setAttribute('data-delete-plate-id', plateId || '');
                    const plate = plateId ? (S.get.plates.find(p => p.id == plateId || p.text == plateId)) : null;
                    const descEl = document.getElementById('confirm-delete-plate-desc');
                    if (descEl) descEl.textContent = plate
                        ? (S.get.language === 'nl' ? `Weet u zeker dat u kenteken ${plate.text} wilt verwijderen? Dit kan niet ongedaan worden gemaakt.` : `Are you sure you want to remove license plate ${plate.text}? This cannot be undone.`)
                        : (S.get.language === 'nl' ? 'Weet u zeker dat u dit kenteken wilt verwijderen?' : 'Are you sure you want to remove this license plate? This cannot be undone.');
                    Services.tryOpenOverlay('modal-confirm-delete-plate');
                    break;
                }

                case 'confirm-delete-plate': {
                    const modal = document.getElementById('modal-confirm-delete-plate');
                    const plateId = modal ? modal.getAttribute('data-delete-plate-id') : null;
                    S.update({ activeOverlay: null });
                    if (plateId) Services.deletePlate(plateId);
                    break;
                }

                case 'submit-forgot-password': {
                    const inp = document.getElementById('inp-forgot-email');
                    const email = inp ? inp.value.trim() : '';
                    const resultEl = document.getElementById('forgot-password-result');
                    if (!email) {
                        if (resultEl) { resultEl.style.display = 'block'; resultEl.textContent = S.get.language === 'nl' ? 'Voer een e-mailadres in.' : 'Please enter your email address.'; resultEl.style.color = 'var(--danger)'; }
                        return;
                    }
                    if (Services.sendPasswordResetEmail) {
                        Services.sendPasswordResetEmail(email).then(() => {
                            if (resultEl) { resultEl.style.display = 'block'; resultEl.textContent = S.get.language === 'nl' ? 'Resetlink verzonden! Check je e-mail.' : 'Reset link sent! Check your email.'; resultEl.style.color = 'var(--success, #10b981)'; }
                            S.update({ activeOverlay: null });
                        }).catch((err) => {
                            if (resultEl) { resultEl.style.display = 'block'; resultEl.textContent = err.message || (S.get.language === 'nl' ? 'Fout bij verzenden.' : 'Failed to send.'); resultEl.style.color = 'var(--danger)'; }
                        });
                    }
                    break;
                }

                case 'select-plate':
                    const sId = target.getAttribute('data-id');
                    const newSel = (S.get.selectedPlateId === sId) ? null : sId;
                    S.update({ selectedPlateId: newSel });
                    break;

                case 'set-default-plate':
                    Services.setDefaultPlate();
                    break;

                case 'toggle-notif-setting': {
                    const key = target.getAttribute('data-key');
                    if (key && S.get.notificationSettings) {
                        const curr = !!S.get.notificationSettings[key];
                        const next = { ...S.get.notificationSettings, [key]: !curr };
                        S.update({ notificationSettings: next });
                        if (S.saveNotifications) S.saveNotifications();
                    }
                    break;
                }

                case 'toggle-favorite': {
                    const zoneUid = S.get.selectedZone;
                    if (!zoneUid) break;
                    const zone = S.get.zones.find(z => z.uid === zoneUid || z.id === zoneUid);
                    const zoneId = zone ? zone.id : zoneUid;
                    const favs = S.get.favorites || [];
                    const exists = favs.some(f => f.zoneUid === zoneUid || f.zoneId === zoneId);
                    let next;
                    if (exists) {
                        next = favs.filter(f => !(f.zoneUid === zoneUid || f.zoneId === zoneId));
                    } else {
                        next = [...favs, { zoneUid, zoneId }];
                    }
                    S.update({ favorites: next });
                    if (S.saveFavorites) S.saveFavorites();
                    if (UI.showToast) UI.showToast(exists ? (S.get.language === 'nl' ? 'Verwijderd uit favorieten' : 'Removed from favorites') : (S.get.language === 'nl' ? 'Toegevoegd aan favorieten' : 'Added to favorites'));
                    break;
                }
                case 'remove-favorite': {
                    const zoneUid = target.getAttribute('data-zone-uid');
                    const favs = (S.get.favorites || []).filter(f => f.zoneUid !== zoneUid);
                    S.update({ favorites: favs });
                    if (S.saveFavorites) S.saveFavorites();
                    if (UI.showToast) UI.showToast(S.get.language === 'nl' ? 'Verwijderd uit favorieten' : 'Removed from favorites');
                    break;
                }
                case 'add-favorite-from-history': {
                    const zoneUid = target.getAttribute('data-zone-uid');
                    const zoneId = target.getAttribute('data-zone-id');
                    if (!zoneUid && !zoneId) break;
                    const favs = S.get.favorites || [];
                    const exists = favs.some(f => f.zoneUid === zoneUid || f.zoneId === zoneId);
                    if (exists) break;
                    const next = [...favs, { zoneUid: zoneUid || zoneId, zoneId: zoneId || zoneUid }];
                    S.update({ favorites: next });
                    if (S.saveFavorites) S.saveFavorites();
                    if (UI.showToast) UI.showToast(S.get.language === 'nl' ? 'Toegevoegd aan favorieten' : 'Added to favorites');
                    break;
                }

                case 'select-zone':
                    // Logic handled by search results clicking usually
                    break;

                case 'close-info-banner':
                    S.update({ infoBanner: null });
                    break;

                case 'set-lang':
                    S.update({ language: target.getAttribute('data-lang') });
                    closeSideMenu();
                    break;
                case 'set-gate-lang':
                     S.update({ installMode: { ...S.get.installMode, language: target.getAttribute('data-lang') } });
                     UI.renderInstallGate();
                    break;
                case 'toggle-password':
                    S.update({ passwordVisible: !S.get.passwordVisible });
                    break;
                case 'toggle-remember':
                    S.update({ rememberMe: !S.get.rememberMe });
                    break;
                case 'login':
                    const email = document.getElementById('inp-email')?.value;
                    const password = document.getElementById('inp-password')?.value;
                    if (!email || !password) {
                         if(UI.showToast) UI.showToast('Please enter email and password');
                         return;
                    }
                    target.innerText = 'SIGNING IN...';
                    target.disabled = true;
                    Services.loginUser(email, password).catch(err => {
                         console.error(err);
                         if(UI.showToast) UI.showToast(err.message);
                    }).finally(() => {
                         target.innerText = 'SIGN IN';
                         target.disabled = false;
                    });
                    break;

                case 'logout':
                    closeSideMenu();
                    Services.logoutUser();
                    break;

                case 'open-filters':
                    S.update({ activeOverlay: 'sheet-filter' });
                    break;

                case 'export-history-csv':
                    if (Q8.Utils && Q8.Utils.exportHistoryToCSV) Q8.Utils.exportHistoryToCSV(S.get);
                    if (UI.showToast) UI.showToast(S.get.language === 'nl' ? 'CSV gedownload' : 'CSV downloaded');
                    break;

                case 'export-history-print':
                    if (Q8.Utils && Q8.Utils.exportHistoryToPrint) Q8.Utils.exportHistoryToPrint(S.get);
                    break;

                case 'toggle-filter-vehicle':
                    const vPlate = target.getAttribute('data-plate');
                    const currentVehicles = S.get.historyFilters.vehicles;
                    let newVehicles;
                    if (currentVehicles.includes(vPlate)) {
                        newVehicles = currentVehicles.filter(p => p !== vPlate);
                    } else {
                        newVehicles = [...currentVehicles, vPlate];
                    }
                    S.update({ historyFilters: { ...S.get.historyFilters, vehicles: newVehicles } });
                    // Re-render only the sheet content if possible, or full UI update
                    // UI.update() is triggered by S.update(), which re-renders renderHistoryFilters() if overlay is active.
                    break;

                case 'clear-filters':
                    S.update({
                        historyFilters: {
                            ...S.get.historyFilters,
                            vehicles: [],
                            dateRange: 'all',
                            customStart: null,
                            customEnd: null
                        }
                    });
                    break;

                case 'toggle-filter-daterange': {
                    const range = target.getAttribute('data-range');
                    S.update({
                        historyFilters: {
                            ...S.get.historyFilters,
                            dateRange: range || 'all',
                            customStart: range === 'custom' ? S.get.historyFilters.customStart : null,
                            customEnd: range === 'custom' ? S.get.historyFilters.customEnd : null
                        }
                    });
                    break;
                }

                case 'apply-filters': {
                    const updates = { activeOverlay: null };
                    if (S.get.historyFilters.dateRange === 'custom') {
                        const inpStart = document.getElementById('filter-date-start');
                        const inpEnd = document.getElementById('filter-date-end');
                        if (inpStart || inpEnd) {
                            updates.historyFilters = {
                                ...S.get.historyFilters,
                                customStart: inpStart?.value || null,
                                customEnd: inpEnd?.value || null
                            };
                        }
                    }
                    S.update(updates);
                    break;
                }

                case 'register':
                    const rEmail = document.getElementById('reg-email')?.value;
                    const rPass = document.getElementById('reg-password')?.value;
                    const rConf = document.getElementById('reg-password-confirm')?.value;

                    if (!rEmail || !rPass) {
                        if(UI.showToast) UI.showToast('Please fill in all fields');
                        return;
                    }
                    if (rPass !== rConf) {
                        if(UI.showToast) UI.showToast('Passwords do not match');
                        return;
                    }

                    target.innerText = 'CREATING ACCOUNT...';
                    target.disabled = true;
                    Services.registerUser(rEmail, rPass).catch(err => {
                         if(UI.showToast) UI.showToast(err.message);
                    }).finally(() => {
                         target.innerText = 'REGISTER';
                         target.disabled = false;
                    });
                    break;
            }
        } catch (err) {
            console.error('[Q8] Click handler error:', err);
        }
    }

    function initListeners() {
        document.body.addEventListener('click', handleClick, { passive: false });

        // Event Listener for Date Filters
        document.body.addEventListener('change', (e) => {
            if (e.target.id === 'filter-date-start') {
                S.update({ historyFilters: { ...S.get.historyFilters, customStart: e.target.value } });
            }
            if (e.target.id === 'filter-date-end') {
                S.update({ historyFilters: { ...S.get.historyFilters, customEnd: e.target.value } });
            }
            if (e.target.getAttribute && e.target.getAttribute('data-action') === 'change-expiring-interval') {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val) && S.get.notificationSettings) {
                    const next = { ...S.get.notificationSettings, expiringSoonMinutes: val };
                    S.update({ notificationSettings: next });
                    if (S.saveNotifications) S.saveNotifications();
                }
            }
        });

        // Event Listener for Search Input
        let geocodeTimeout = null;
        const searchInput = document.getElementById('inp-search');
        if(searchInput) {
            searchInput.addEventListener('input', (e) => {
                const q = e.target.value;
                S.update({ searchQuery: q });
                UI.renderSearchResults();
                if (S.get.searchMode === 'address' && Services.geocodeAndSearch) {
                    if (geocodeTimeout) clearTimeout(geocodeTimeout);
                    geocodeTimeout = setTimeout(() => {
                        geocodeTimeout = null;
                        Services.geocodeAndSearch(q);
                    }, 600);
                } else {
                    S.update({ geocodeMatches: [], geocodeLoading: false });
                }
            });
        }

        // Live kenteken format validation (add-plate modal)
        const inpPlate = document.getElementById('inp-plate');
        if (inpPlate && typeof Q8 !== 'undefined' && Q8.Kenteken) {
            function updatePlateFormatFeedback() {
                const errEl = document.getElementById('plate-format-error');
                if (!errEl) return;
                const raw = inpPlate.value.trim();
                if (!raw) { errEl.textContent = ''; errEl.style.display = 'none'; return; }
                const v = Q8.Kenteken.validate(raw);
                if (v.valid) { errEl.textContent = ''; errEl.style.display = 'none'; }
                else { errEl.textContent = v.errorMessage || ''; errEl.style.display = 'block'; }
            }
            inpPlate.addEventListener('input', updatePlateFormatFeedback);
            inpPlate.addEventListener('blur', updatePlateFormatFeedback);
        }

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeSideMenu();
                if (S && S.update) S.update({ activeOverlay: null });
            }
        });
    }

    function init() {
        if(S.load) S.load();
        if(Services.checkInstallMode) Services.checkInstallMode();
        if(UI.update) UI.update();

        if (S.get.installMode.active) {
            S.update({ zonesLoading: false });
            if(UI.renderInstallGate) UI.renderInstallGate();
        } else {
            if(Services.initAuthListener) Services.initAuthListener();

            // Load map immediately - don't wait for zones
            if(UI.initGoogleMap) UI.initGoogleMap();

            if(Services.loadZones) {
                Services.loadZones().then(() => {
                     if(UI.update) UI.update();
                }).catch(err => {
                     console.error("Zones critical fail:", err);
                     if(UI.update) UI.update();
                });
            } else {
                if(UI.update) UI.update();
            }
        }
    }

    // Initialize listeners immediately
    initListeners();

    // Export public init if needed, or just auto-run
    return {
        init: init
    };
})();

// --- INITIALIZATION ---

document.addEventListener('DOMContentLoaded', () => {
    // Apply platform-specific optimizations
    if (typeof PlatformDetection !== 'undefined') {
        const platform = PlatformDetection.getInfo();
        
        // Log platform info in development
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.group('🔍 Q8 Parking - Platform Info');
            console.log('OS:', platform.os);
            console.log('Device:', platform.deviceType);
            console.log('Standalone:', platform.standalone);
            console.log('Has Touch:', platform.hasTouch);
            console.log('Has Notch:', platform.hasNotch);
            console.groupEnd();
        }
        
        // iOS-specific fixes
        if (platform.isIOS) {
            // Prevent pull-to-refresh on iOS
            document.body.style.overscrollBehavior = 'none';
            
            // Prevent iOS zoom on input focus (for inputs with font-size < 16px)
            const inputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="password"], input[type="tel"]');
            inputs.forEach(input => {
                input.style.fontSize = '16px';
            });
            
            // Handle iOS keyboard
            const visualViewport = window.visualViewport;
            if (visualViewport) {
                visualViewport.addEventListener('resize', () => {
                    // Adjust for virtual keyboard
                    document.body.style.height = `${visualViewport.height}px`;
                });
            }
        }
        
        // Android-specific fixes
        if (platform.isAndroid) {
            // Handle Android back button in standalone mode
            if (platform.standalone) {
                window.addEventListener('popstate', (e) => {
                    // Close overlays instead of navigating back
                    const overlay = document.querySelector('.overlay-backdrop.open');
                    if (overlay) {
                        e.preventDefault();
                        Q8.State.update({ activeOverlay: null });
                        history.pushState(null, '', window.location.href);
                    }
                });
                // Push initial state for back button handling
                history.pushState(null, '', window.location.href);
            }
        }
        
        // Track standalone mode for analytics
        if (platform.standalone) {
            console.log('[Q8] Running as installed PWA');
        }
    }
    
    // Initialize app
    Q8.App.init();
    
    // Register for app install events
    window.addEventListener('beforeinstallprompt', (e) => {
        // Prevent Chrome 67 and earlier from automatically showing the prompt
        e.preventDefault();
        // Stash the event so it can be triggered later
        window.deferredPrompt = e;
        console.log('[Q8] App install available');
    });
    
    window.addEventListener('appinstalled', () => {
        console.log('[Q8] App installed successfully');
        window.deferredPrompt = null;
        // Optionally show a thank you message
        if (Q8.UI && Q8.UI.showToast) {
            Q8.UI.showToast('App installed successfully!');
        }
    });
    
    // Online/Offline handling
    window.addEventListener('online', () => {
        console.log('[Q8] Connection restored');
        document.body.classList.remove('offline');
        if (Q8.UI && Q8.UI.showToast) {
            Q8.UI.showToast('Connection restored');
        }
    });
    
    window.addEventListener('offline', () => {
        console.log('[Q8] Connection lost');
        document.body.classList.add('offline');
        if (Q8.UI && Q8.UI.showToast) {
            Q8.UI.showToast('You are offline');
        }
    });
});
