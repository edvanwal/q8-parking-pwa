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
                case 'toggle-search-mode':
                    const newMode = S.get.searchMode === 'zone' ? 'address' : 'zone';
                    S.update({ searchMode: newMode, searchQuery: '' });
                    const inp = document.getElementById('inp-search');
                    if (inp) { inp.value = ''; inp.focus(); }
                    break;

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

                case 'open-overlay':
                    // Risk: JSON.parse on data-rates throws if malformed. data-zone-uid/zone missing = empty context.
                    const context = {
                        uid: target.getAttribute('data-zone-uid'),
                        zone: target.getAttribute('data-zone'),
                        price: parseFloat(target.getAttribute('data-price')),
                        rates: JSON.parse(target.getAttribute('data-rates') || 'null')
                    };
                    Services.tryOpenOverlay(targetId, context);
                    break;

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

                case 'delete-plate':
                    Services.deletePlate(target.getAttribute('data-id'));
                    break;

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
                        const next = { ...S.get.notificationSettings, [key]: !!target.checked };
                        S.update({ notificationSettings: next });
                        if (S.saveNotifications) S.saveNotifications();
                    }
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
                    // Check if filter sheet is active. If so, do nothing or toggle?
                    // User click "Filters" button.
                    S.update({ activeOverlay: 'sheet-filter' }); // Fixed singular ID
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
        const searchInput = document.getElementById('inp-search');
        if(searchInput) {
            searchInput.addEventListener('input', (e) => {
                S.update({ searchQuery: e.target.value });
                UI.renderSearchResults();
            });
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
    Q8.App.init();
});
