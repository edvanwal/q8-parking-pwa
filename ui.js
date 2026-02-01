/**
 * Q8 Parking - UI Renderer
 * Namespace: Q8.UI
 *
 * - Screens, overlays, lists (plates, history)
 * - Google Maps: initGoogleMap, PriceOverlay, renderMapMarkers
 * - DIAG: Set window.Q8_DIAG = true for Maps loading logs
 */

window.Q8 = window.Q8 || {};

Q8.UI = (function() {
    'use strict';

    const S = Q8.State;
    let _lastMarkerKey = '';
    const U = Q8.Utils;
    // Services might be circular, so access via Q8.Services literal if needed

    // --- CORE RENDERER ---

    function update() {
        const state = S.get; // Access raw state object

        // 1. Screens
        const activeViewId = `view-${state.screen === 'parking' ? 'map' : state.screen}`;
        document.querySelectorAll('.screen').forEach(el => {
            el.style.display = (el.id === activeViewId) ? 'flex' : 'none';
            el.classList.toggle('hidden', el.id !== activeViewId);
        });

        // 2. Overlays
        document.querySelectorAll('.overlay-backdrop').forEach(el => {
            const isOpen = el.id === state.activeOverlay;
            el.classList.toggle('open', isOpen);
        });

        // 3. Parking View (Map Interaction & UI Overlays)
        if (state.screen === 'parking') {
            renderParkingView();
        }

        // 4. Content Lists
        if (state.screen === 'plates') {
            renderPlates();
            const btnAdd = document.querySelector('[data-target="modal-add-plate"] span');
            if (btnAdd) {
                btnAdd.innerText = state.language === 'nl' ? 'Nieuw kenteken toevoegen' : 'Add new license plate';
            }
        }
        if (state.screen === 'history') renderHistory();
        if (state.screen === 'login') renderLoginUI();

        renderInfoBanner();

        // PWA Gate
        if (state.installMode.active) {
            renderInstallGate();
        }
    }

    function renderParkingView() {
        const state = S.get;
        const isActive = state.session !== null;
        const idleSearch = document.getElementById('ui-idle-search');
        const activeParking = document.getElementById('ui-active-parking');

        // Greeting
        const greetingEl = document.getElementById('personal-greeting');
        if (greetingEl && !isActive) {
            const user = (typeof firebase !== 'undefined') ? firebase.auth().currentUser : null;
            let name = "Driver";
            if (user) {
                if (user.displayName) name = user.displayName;
                else if (user.email) {
                    const part = user.email.split('@')[0];
                    name = part.charAt(0).toUpperCase() + part.slice(1).split('.')[0];
                }
            }

            const h = new Date().getHours();
            let greet = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
            let sub = 'Ready to park?';

            greetingEl.innerHTML = `
                <div style="padding: 16px 20px 0 20px;">
                    <h2 style="font-size: 1.5rem; font-weight: 800; color: var(--text-primary); margin: 0;">${greet}, ${name}</h2>
                    <p style="font-size: 0.9rem; color: var(--text-secondary); margin: 2px 0 0 0;">${sub}</p>
                </div>
            `;
            greetingEl.style.display = 'block';
        } else if (greetingEl) {
            greetingEl.style.display = 'none';
        }

        // Visibility
        if (idleSearch) idleSearch.style.display = isActive ? 'none' : 'block';
        if (activeParking) activeParking.style.display = isActive ? 'block' : 'none';

        // Markers: only re-render when zones, selectedZone, or session changed (not on search keystrokes)
        const markerKey = `${state.zones.length}|${state.selectedZone || ''}|${state.session ? '1' : '0'}`;
        if (markerKey !== _lastMarkerKey) {
            _lastMarkerKey = markerKey;
            renderMapMarkers();
        }

        // Marker cursor (legacy DOM markers if any)
        document.querySelectorAll('.marker').forEach(m => {
            m.style.cursor = isActive ? 'default' : 'pointer';
            m.style.opacity = isActive ? '0.6' : '1';
        });

        // Active Session Card
        if (isActive && state.session) {
            const fmt = (d) => d ? `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}` : '--:--';
            const elZoneLabel = document.getElementById('active-zone-label');
            if (elZoneLabel) elZoneLabel.innerText = state.session.zone;

            const plateDisplay = (state.session.plate && state.session.plate.trim()) ? state.session.plate.trim() : null;
            const fallbackPlate = state.plates.find(p => p.id === state.selectedPlateId) || state.plates.find(p => p.default) || state.plates[0];
            const elLabel = document.getElementById('active-plate-label');
            if (elLabel) elLabel.innerText = plateDisplay || (fallbackPlate ? fallbackPlate.text : '');

            const elStart = document.getElementById('lbl-start');
            const elEnd = document.getElementById('lbl-end');
            if (elStart) elStart.innerText = fmt(state.session.start);
            if (elEnd) {
                elEnd.innerText = state.session.end ? fmt(state.session.end) : "Until stopped";
            }

            startTimerTicker();
            updateActiveTimerDisplay();
        }

        // Zone Sheet
        if (state.selectedZone) renderZoneSheet();

        // Search input sync (app herkent zelf zone vs adres)
        const inpSearch = document.getElementById('inp-search');
        if (inpSearch && document.activeElement !== inpSearch) {
            inpSearch.value = state.searchQuery;
        }

        renderSearchResults();
    }

    function renderZoneSheet() {
        const state = S.get;
        // Find zone object
        const zone = state.zones.find(z => z.uid === state.selectedZone) ||
                     state.zones.find(z => z.id === state.selectedZone);

        const elZoneId = document.getElementById('details-zone-id');

        const existingDetails = document.getElementById('zone-extra-details');
        if (existingDetails) existingDetails.remove();

        if (elZoneId) {
            const zoneLabel = !zone ? (state.selectedZone || 'Unknown') : zone.id;
            elZoneId.innerText = 'ZONE ' + zoneLabel;

            if (zone) {
                const maxDurLabel = zone.max_duration_mins && zone.max_duration_mins < 1440
                    ? `${Math.floor(zone.max_duration_mins/60)}u ${zone.max_duration_mins%60}m limiet`
                    : null;
                const holidayWarning = zone.has_special_rules
                    ? `<div style="color: #f59e0b; font-size: 0.85rem; font-weight:600; display: flex; align-items: center; gap: 4px; margin-top:2px;"><span>⚠️ Let op: Feestdag regels</span></div>`
                    : '';
                const limitBadge = maxDurLabel
                    ? `<span style="font-size: 0.8rem; background: var(--bg-secondary); color: var(--text-secondary); padding: 2px 8px; border-radius: 12px; font-weight: 500;">${maxDurLabel}</span>`
                    : '';
                const detailsHTML = `
                    <div id="zone-extra-details" class="flex-col gap-xs" style="width:100%; margin-top: 8px;">
                        <div class="flex items-center justify-between">
                            <span style="font-size: 1.1rem; font-weight: 700; color: var(--text-primary);">${zone.city || ''}</span>
                            ${limitBadge}
                        </div>
                        ${holidayWarning}
                    </div>
                `;
                const sheetZoneHeader = document.querySelector('#sheet-zone .sheet-zone-header');
                if (sheetZoneHeader) {
                    const firstChild = sheetZoneHeader.querySelector('.sheet-zone-title-row') || sheetZoneHeader.children[0];
                    if (firstChild) firstChild.insertAdjacentHTML('afterend', detailsHTML);
                }
            }
        }

        const selPlate = state.plates.find(p => p.id === state.selectedPlateId) ||
                         state.plates.find(p => p.default) ||
                         state.plates[0];
        const elPlate = document.getElementById('details-plate');
        if (elPlate && selPlate) {
            elPlate.innerText = selPlate.text;
        }

        // Duration Display
        const elDur = document.getElementById('val-duration');
        const elMaxMsg = document.getElementById('duration-max-msg');

        // Buttons
        const btnSheetPlus = document.querySelector('.sheet-duration-control [data-delta="15"]') || document.querySelector('.sheet-duration-control [data-delta="30"]') || document.querySelector('.sheet-duration-control [data-delta="60"]');
        const btnSheetMinus = document.querySelector('.sheet-duration-control [data-delta="-15"]') || document.querySelector('.sheet-duration-control [data-delta="-30"]') || document.querySelector('.sheet-duration-control [data-delta="-60"]');

        if (elDur) {
            if (state.duration === 0) {
                elDur.innerText = "Until stopped";
            } else {
                const h = Math.floor(state.duration / 60);
                const m = state.duration % 60;
                elDur.innerText = m === 0 ? String(h) : `${h}h ${m.toString().padStart(2,'0')}m`;
            }
        }

        const zoneMax = (zone && zone.max_duration_mins && zone.max_duration_mins > 0)
            ? zone.max_duration_mins
            : 1440;

        if (state.duration >= zoneMax) {
            if (!elMaxMsg) {
                 const msg = document.createElement('div');
                 msg.id = 'duration-max-msg';
                 msg.style.cssText = 'color: #D92D20; font-size: 0.75rem; font-weight: 600; margin-top: 4px; text-align: center; width: 100%;';
                 msg.innerText = 'Maximum parking duration reached';
                 elDur?.parentNode?.appendChild(msg);
            }
            if (btnSheetPlus) btnSheetPlus.style.opacity = '0.3';
        } else {
            if (elMaxMsg) elMaxMsg.remove();
            if (btnSheetPlus) btnSheetPlus.style.opacity = '1';
        }

        if (state.duration <= 0) {
            if (btnSheetMinus) btnSheetMinus.style.opacity = '0.3';
        } else {
            if (btnSheetMinus) btnSheetMinus.style.opacity = '1';
        }

        // Rates
        const list = document.getElementById('details-rates-list');
        if (list) {
            const rates = state.selectedZoneRates || [];
            if (rates.length === 0 && zone && zone.rates) rates.push(...zone.rates);
            renderRatesList(list, rates);
        }
    }

    function renderRatesList(container, rates) {
        if (!rates || rates.length === 0) {
            container.innerHTML = '<div class="rate-item">No rate info</div>';
            return;
        }

        const daysNL = ["Zondag", "Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag"];
        const todayNL = daysNL[new Date().getDay()];

        const filtered = rates.filter(r => {
            const t = (r.time || '').toLowerCase();
            return t.includes(todayNL.toLowerCase()) || t.includes('dagelijks') || t.includes('daily') || t === '24/7' || t.includes('check zone');
        });

        const unique = [];
        const seen = new Set();
        filtered.forEach(r => {
            const k = `${r.time}|${r.price}`;
            if(!seen.has(k)) { seen.add(k); unique.push(r); }
        });

        const finalRates = unique.length > 0 ? unique : [{time: `Geen tarieven voor ${todayNL}`, price: ''}];

        container.innerHTML = finalRates.map(r => {
             let displayTime = r.time.replace(new RegExp(todayNL, 'gi'), '').replace(/Dagelijks/gi,'').trim();
             const timeMatch = displayTime.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
             if (timeMatch) {
                 const fmt = (h, m) => (parseInt(h, 10) < 10 ? String(h).replace(/^0/, '') : h) + ':' + m;
                 displayTime = `${fmt(timeMatch[1], timeMatch[2])} – ${fmt(timeMatch[3], timeMatch[4])}`;
             }
             const isFree = r.price.toLowerCase().includes('free') || r.price.toLowerCase().includes('gratis');
             const color = isFree ? '#10b981' : 'var(--q8-blue)';
             const label = isFree ? 'Free parking' : r.price;

             let detail = '';
             if (r.detail) {
                 const lines = r.detail.split('|').filter(l => l && l.trim() !== '' && l !== 'Vrij parkeren');
                 if (lines.length > 0) {
                     detail = `<ul class="rate-detail-list">${lines.map(l => `<li>${l}</li>`).join('')}</ul>`;
                 }
             }

             return `
                <div class="rate-item">
                    <div class="rate-dot"></div>
                    <div class="rate-info">
                        <span class="rate-time">${displayTime}</span>
                        ${detail}
                    </div>
                    ${!isFree || label !== 'Free parking' ? `<span class="rate-price" style="color: ${color};">${label}</span>` : ''}
                </div>
             `;
        }).join('');
    }

    function renderLoginUI() {
        const state = S.get;
        document.querySelectorAll('.lang-btn').forEach(btn => {
            const lang = btn.getAttribute('data-lang');
            btn.className = state.language === lang ? 'btn btn-primary lang-btn' : 'btn btn-outline lang-btn';
        });
        const cb = document.querySelector('.custom-checkbox');
        if (cb) cb.classList.toggle('checked', state.rememberMe);
        const inpPass = document.getElementById('inp-password');
        if (inpPass) inpPass.type = state.passwordVisible ? 'text' : 'password';
    }

    function renderPlates() {
        const state = S.get;
        const list = document.getElementById('list-plates');
        const btnSetDefault = document.getElementById('btn-set-default');
        if (!list) return;
        list.innerHTML = '';

        const sorted = [...state.plates].sort((a,b) => a.text.localeCompare(b.text));
        let selectionValid = false;

        sorted.forEach(p => {
            const isSelected = state.selectedPlateId === p.id;
            const div = document.createElement('div');
            div.className = `card flex justify-between items-center mb-md ${isSelected ? 'selected' : ''}`;
            div.style.padding = '16px 20px';
            div.setAttribute('data-action', 'select-plate');
            div.setAttribute('data-id', p.id);
            div.style.cursor = 'pointer';

            const badgeLabel = state.language === 'nl' ? 'STANDAARD' : 'DEFAULT';

            div.innerHTML = `
                <div class="flex flex-col pointer-events-none" style="flex:1; gap: 2px;">
                   <div class="font-bold text-lg" style="line-height: 1.2;">${p.text}</div>
                   ${p.description ? `<div class="text-secondary text-sm" style="font-weight: 400;">${p.description}</div>` : ''}
                </div>
                <div class="flex items-center gap-md pointer-events-none" style="margin-left: 16px;">
                    ${p.default ? `<div class="badge badge-success">${badgeLabel}</div>` : ''}
                    <button class="icon-btn ptr-enabled" style="color:var(--text-secondary); padding: 4px;" data-action="delete-plate" data-id="${p.id}">
                         <svg class="no-pointer" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2-2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    </button>
                </div>
            `;
            div.querySelector('.ptr-enabled').style.pointerEvents = 'auto';
            list.appendChild(div);

            if (isSelected && !p.default) selectionValid = true;
        });

        if (btnSetDefault) btnSetDefault.disabled = !selectionValid;
    }

    function renderQuickPlateSelector() {
        const state = S.get;
        const list = document.getElementById('quick-plate-list');
        if (!list) return;
        list.innerHTML = '';
        const activePlateId = state.selectedPlateId || (state.plates.find(p => p.default) || state.plates[0])?.id;

        state.plates.forEach(p => {
            const isSelected = p.id === activePlateId;
            const div = document.createElement('div');
            div.className = `card flex justify-between items-center ${isSelected ? 'selected' : ''}`;
            div.style.padding = '16px 20px';
            div.style.cursor = 'pointer';
            div.setAttribute('data-action', 'select-quick-plate');
            div.setAttribute('data-id', p.id);

            div.innerHTML = `
               <div class="flex flex-col no-pointer">
                  <div class="font-bold text-lg no-pointer" style="line-height:1.2;">${p.text}</div>
                  ${p.description ? `<div class="text-secondary text-sm no-pointer" style="font-weight:400;">${p.description}</div>` : ''}
               </div>
               ${isSelected ? '<div class="badge badge-success no-pointer">SELECTED</div>' : ''}
            `;
            list.appendChild(div);
        });
    }

    function renderHistory() {
        const state = S.get;
        const list = document.getElementById('list-history');
        if (!list) return;
        list.innerHTML = '';

        // 1. FILTER LOGIC
        const filters = state.historyFilters;
        let filteredHistory = state.history;

        // A. Vehicle Filter
        if (filters.vehicles.length > 0) {
            filteredHistory = filteredHistory.filter(h => filters.vehicles.includes(h.plate));
        }

        // B. Date Filter
        if (filters.customStart || filters.customEnd) {
            filteredHistory = filteredHistory.filter(h => {
                if (!h.date) return true;

                // Parse "DD-MM-YYYY" from h.date
                const parts = h.date.split('-');
                if (parts.length !== 3) return true;

                // Construct Date object at 00:00:00 for comparison
                const itemDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
                itemDate.setHours(0,0,0,0);

                let validStart = true;
                if (filters.customStart) {
                    const startRaw = new Date(filters.customStart);
                    startRaw.setHours(0,0,0,0);
                    if (itemDate < startRaw) validStart = false;
                }

                let validEnd = true;
                if (filters.customEnd) {
                    const endRaw = new Date(filters.customEnd);
                    endRaw.setHours(0,0,0,0);
                    if (itemDate > endRaw) validEnd = false; // Strictly greater than end date 00:00 means we might miss "today"?
                    // Actually if end date is 2024-01-20, we want to include items ON that day.
                    // So itemDate <= endRaw?
                    // if itemDate is 20th 00:00 and endRaw is 20th 00:00, it matches.
                    if (itemDate > endRaw) validEnd = false;
                }

                return validStart && validEnd;
            });
        }

        // 2. RENDER LIST
        if (filteredHistory.length === 0) {
            list.innerHTML = '<div class="history-empty-state">No parking history found.</div>';
        } else {
            filteredHistory.forEach(h => {
                const div = document.createElement('div');
                div.className = 'card mb-md';
                div.innerHTML = `
                    <div class="history-card-header">
                       <span class="font-bold text-lg">${h.plate}</span>
                       <div class="zone-badge-box">
                          <span class="icon-p" style="font-size:0.8rem;">P</span>
                          <span style="font-weight:700;">${h.zone}</span>
                       </div>
                    </div>
                    <div class="text-secondary text-sm mb-md">${h.street}</div>
                    <div class="history-card-details">
                       <div>
                          <div class="history-date-label">${h.date}</div>
                          <div class="history-time-range">${h.start} - ${h.end}</div>
                       </div>
                       <div class="history-price-tag">€ ${h.price.replace('.', ',')}</div>
                    </div>
                `;
                list.appendChild(div);
            });
        }

        // 3. RENDER FILTER BUTTON (Sticky Bottom or spacer)
        // We append a spacer so the button doesn't overlap content
        const spacer = document.createElement('div');
        spacer.style.height = '80px';
        list.appendChild(spacer);

        // Inject Filter Button into the view container, NOT the list, to make it sticky
        // Check if button already exists in view-history
        const view = document.getElementById('view-history');
        let btnContainer = document.getElementById('history-filter-container');
        if (!btnContainer) {
            btnContainer = document.createElement('div');
            btnContainer.id = 'history-filter-container';
            // CSS handles styles now
            view.appendChild(btnContainer);
        }

        // Only show button if we have history (or if filters are active to allow clearing)
        if (state.history.length > 0 || filters.vehicles.length > 0 || filters.dateRange !== 'all' || filters.customStart || filters.customEnd) {
            const activeCount = filters.vehicles.length + (filters.customStart ? 1 : 0) + (filters.customEnd ? 1 : 0);
            const badge = activeCount > 0 ? `<span class="filter-badge-count">${activeCount}</span>` : '';

            btnContainer.innerHTML = `
                <button class="btn btn-outline btn-filter-floating" data-action="open-filters">
                    Filters ${badge}
                </button>
            `;
        } else {
            btnContainer.innerHTML = '';
        }

        renderHistoryFilters();
    }

    function renderHistoryFilters() {
        const state = S.get;
        // Fix ID: index.html has 'sheet-filter' (singular)
        const sheet = document.getElementById('sheet-filter');
        if (!sheet) return;

        // Ensure we're targeting the content container, preserving the overall sheet structure if needed.
        // index.html structure: .overlay-backdrop > .bottom-sheet > .sheet-handle, .sheet-header, .sheet-section...
        const bottomSheet = sheet.querySelector('.bottom-sheet');
        if (!bottomSheet) return;

        if (state.activeOverlay !== 'sheet-filter' && state.activeOverlay !== 'sheet-filters') return;

        // Unique Vehicles
        const allPlates = [...new Set(state.history.map(h => h.plate))];

        const vehiclesHTML = allPlates.map(plate => {
            const isSelected = state.historyFilters.vehicles.includes(plate);
            return `
                <button class="filter-pill ${isSelected ? 'selected' : ''}"
                        data-action="toggle-filter-vehicle"
                        data-plate="${plate}">
                    ${plate}
                </button>
            `;
        }).join('');

        const startDateVal = state.historyFilters.customStart || '';
        const endDateVal = state.historyFilters.customEnd || '';

        // Helper to simulate placeholder for date inputs
        const startType = startDateVal ? 'date' : 'text';
        const endType = endDateVal ? 'date' : 'text';

        // We replace the content of .bottom-sheet but KEEP .sheet-handle if we want, OR just rewrite it all.
        // index.html has: .sheet-handle, .sheet-header, .sheet-section...
        // We'll rewrite it all to match our desired dynamic state, ensuring we keep the classes that might render styles.
        // Note: The original generic markup in index.html had .sheet-handle. We should keep it.

        bottomSheet.innerHTML = `
             <div class="sheet-handle"></div>

             <div class="sheet-header" style="padding: 20px; border-bottom: none; display: flex; justify-content: space-between; align-items: center;">
                <h3 style="margin: 0; font-size: 1.2rem; font-weight: 800;">Filters</h3>
                <button data-action="clear-filters" style="background:none; border:none; color: var(--text-secondary); font-size: 0.9rem; font-weight: 600; cursor: pointer;">Clear all</button>
             </div>

             <div class="sheet-scroll-content" style="padding: 0 20px 20px 20px; max-height: 60vh; overflow-y: auto;">

                <div style="margin-bottom: 24px;">
                    <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-secondary); margin-bottom: 12px; letter-spacing: 0.5px;">VEHICLE</div>
                    <div class="flex flex-wrap gap-sm">
                        ${vehiclesHTML.length > 0 ? vehiclesHTML : '<span style="color:var(--text-secondary); font-size:0.9rem;">No vehicles found</span>'}
                    </div>
                </div>

                <div style="margin-bottom: 24px;">
                    <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-secondary); margin-bottom: 12px; letter-spacing: 0.5px;">DATE RANGE</div>
                    <div class="flex gap-md">
                        <input type="${startType}" id="filter-date-start" value="${startDateVal}" placeholder="Start Date"
                               onfocus="(this.type='date')"
                               onblur="(this.value ? this.type='date' : this.type='text')"
                               style="flex: 1; padding: 12px; border: 1px solid var(--border); border-radius: 12px; font-size: 1rem; color: var(--text-primary); outline: none;">

                        <input type="${endType}" id="filter-date-end" value="${endDateVal}" placeholder="End Date"
                               onfocus="(this.type='date')"
                               onblur="(this.value ? this.type='date' : this.type='text')"
                               style="flex: 1; padding: 12px; border: 1px solid var(--border); border-radius: 12px; font-size: 1rem; color: var(--text-primary); outline: none;">
                    </div>
                </div>

             </div>

             <div class="sheet-footer" style="padding: 20px; border-top: 1px solid var(--border); display: flex;">
                 <button class="btn btn-primary" data-action="apply-filters" style="flex: 1; justify-content: center; font-size: 1.1rem; padding: 14px;">APPLY</button>
             </div>
        `;

        // Add listeners for date inputs manually since they don't bubble nicely with data-action sometimes
        // or just rely on change events handled in app.css?? No, app.js logic.
        // We will bind them in app.js or add simple inline change dispatchers?
        // Better: render them, then app.js global listener 'change' picks them up.
    }

    function renderSearchResults() {
        const state = S.get;
        const container = document.getElementById('ui-search-results');
        if (!container) return;

        const shouldShow = state.screen === 'parking' && state.searchMode === 'zone' && state.searchQuery.length >= 2 && state.activeOverlay === null;
        if (!shouldShow) {
            container.style.display = 'none';
            return;
        }

        const query = state.searchQuery.toLowerCase();
        const matches = state.zones.filter(z => z.id.includes(query) || z.name.toLowerCase().includes(query))
            .sort((a,b) => {
                if (a.id === query) return -1;
                if (b.id === query) return 1;
                return 0;
            });

        if (matches.length === 0) {
            container.style.display = 'none';
            return;
        }

        container.className = 'search-results-panel search-results-panel--pill';
        container.style.display = 'block';
        const q = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = q ? new RegExp(`(${q})`, 'gi') : null;
        container.innerHTML = matches.map(z => {
            const addr = [z.id, z.name, z.city].filter(Boolean).join(', ') + (z.id || z.name || z.city ? ', Nederland' : '');
            const displayAddr = regex ? addr.replace(regex, '<strong class="search-highlight">$1</strong>') : addr;
            return `
            <div class="search-result-item" data-action="open-overlay" data-target="sheet-zone"
                 data-zone-uid="${z.uid}"
                 data-zone="${z.id || ''}"
                 data-price="${z.price}"
                 data-rates='${JSON.stringify(z.rates || [])}'>
                <span class="search-result-text">${displayAddr}</span>
                <span class="search-result-price">€ ${(z.price || 0).toFixed(2).replace('.', ',')}</span>
            </div>
        `;
        }).join('');
    }

    function renderInfoBanner() {
        const state = S.get;
        const container = document.getElementById('ui-info-banner');
        if (!container) return;
        if (!state.infoBanner) {
            container.classList.add('hidden');
            return;
        }
        container.classList.remove('hidden');
        container.innerHTML = `
            <div class="info-banner-content">
                <span class="info-text">${state.infoBanner.text}</span>
                ${state.infoBanner.dismissible ? `<button class="info-close" data-action="close-info-banner">&times;</button>` : ''}
            </div>
        `;
    }

    function showToast(msg) {
        const t = document.getElementById('toast');
        if (!t) return;
        t.innerText = msg;
        t.classList.add('show');
        setTimeout(() => t.classList.remove('show'), 3000);
    }

    function renderInstallGate() {
        const state = S.get;
        if (!state.installMode.active) {
            const existing = document.getElementById('install-gate');
            if (existing) existing.remove();
            return;
        }
        let gate = document.getElementById('install-gate');
        if (!gate) {
            gate = document.createElement('div');
            gate.id = 'install-gate';
            gate.className = 'install-gate-overlay';
            document.body.appendChild(gate);
        }
        const isEn = state.installMode.language === 'en';
        gate.innerHTML = `
            <div class="install-container">
                <div class="install-lang-toggle">
                    <button class="toggle-btn ${isEn ? 'active' : ''}" data-action="set-gate-lang" data-lang="en">EN</button>
                    <button class="toggle-btn ${!isEn ? 'active' : ''}" data-action="set-gate-lang" data-lang="nl">NL</button>
                </div>
                <div class="install-content">
                    <h1>Install App</h1>
                    <p>Please add to home screen</p>
                </div>
            </div>
        `;
    }

    // --- TIMERS ---

    let timerInterval = null;

    function startTimerTicker() {
        if (timerInterval) return;
        timerInterval = setInterval(() => {
            const state = S.get;
            if (state.session) {
                updateActiveTimerDisplay();
            } else {
                clearInterval(timerInterval);
                timerInterval = null;
            }
        }, 1000);
    }

    function updateActiveTimerDisplay() {
        const state = S.get;
        const elTimer = document.getElementById('active-timer');
        if (!elTimer || !state.session) return;

        const now = new Date();

        // 1. Open-Ended Session (Count UP)
        if (!state.session.end) {
            const diff = now - state.session.start;
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);

            elTimer.style.color = "#059669"; // Success green

            if (h > 0) {
                elTimer.innerText = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
            } else {
                elTimer.innerText = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
            }
            return;
        }

        // 2. Fixed Duration Session (Count DOWN)
        const diff = state.session.end - now;

        if (diff <= 0) {
            elTimer.innerText = "00:00";
            elTimer.style.color = "#ce1818";
            return;
        }

        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);

        elTimer.style.color = "#ce1818";
        if (h > 0) {
            elTimer.innerText = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        } else {
            elTimer.innerText = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        }
    }


    // --- GOOGLE MAPS ---

    let map;
    let gMarkers = [];
    const UTRECHT_CENTER = { lat: 52.0907, lng: 5.1214 };

    // DIAG: Set window.Q8_DIAG = true to log Maps loading steps
    function diagMaps(tag, msg, data) {
        if (window.Q8_DIAG) console.log('[DIAG_MAPS]', tag, msg, data || '');
    }

    function initGoogleMap() {
        const container = document.getElementById('map-container');
        diagMaps('initGoogleMap', 'entry', { hasContainer: !!container, hasMap: !!map });
        if (!container || map) return;

        if (typeof google === 'undefined' || !google.maps) {
            diagMaps('initGoogleMap', 'loading-script');
            const apiKey = (typeof firebaseConfig !== 'undefined') ? firebaseConfig.googleMapsApiKey : '';
            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initMapCallback`;
            script.async = true;
            script.onerror = function() { diagMaps('initGoogleMap', 'script-load-error'); };
            window.initMapCallback = function() {
                 diagMaps('initGoogleMap', 'callback-fired');
                 if(Q8.UI && Q8.UI.initGoogleMap) Q8.UI.initGoogleMap();
                 else initGoogleMap();
            };
            document.head.appendChild(script);
            return;
        }

        diagMaps('initGoogleMap', 'creating-map');
        map = new google.maps.Map(container, {
            center: UTRECHT_CENTER,
            zoom: 16,
            disableDefaultUI: true,
            zoomControl: true,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true,
            clickableIcons: false,
            gestureHandling: 'greedy'
        });

        renderMapMarkers();
        google.maps.event.addListenerOnce(map, 'idle', function() {
            google.maps.event.trigger(map, 'resize');
        });
        diagMaps('initGoogleMap', 'done');
    }

    function makeCircleIcon(isSelected) {
        const fill = isSelected ? '#ce1818' : '#1e5f8a';
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
          <circle cx="20" cy="20" r="18" fill="${fill}" stroke="white" stroke-width="2"/>
          <text x="20" y="26" text-anchor="middle" fill="white" font-size="18" font-weight="bold" font-family="sans-serif">P</text>
        </svg>`;
        return {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
            scaledSize: new google.maps.Size(40, 40),
            anchor: new google.maps.Point(20, 20)
        };
    }

    function renderMapMarkers() {
        const state = S.get;
        if (!map) return;

        gMarkers.forEach(m => m.setMap(null));
        gMarkers = [];

        state.zones.forEach(z => {
            if (!z.lat || !z.lng) return;

            const priceLabel = z.display_label || (typeof z.price === 'number'
                ? z.price.toFixed(2).replace('.', ',')
                : String(z.price));
            const labelText = z.price === 0 ? 'Free' : '€' + priceLabel.substring(0, 6);
            const isSelected = (z.uid && z.uid === state.selectedZone) || (z.id && String(z.id) === String(state.selectedZone));

            const marker = new google.maps.Marker({
                map: map,
                position: { lat: z.lat, lng: z.lng },
                title: 'Zone ' + (z.id || z.uid) + ' - € ' + priceLabel,
                icon: makeCircleIcon(isSelected),
                label: {
                    text: labelText,
                    color: isSelected ? '#ce1818' : '#1e5f8a',
                    fontWeight: 'bold',
                    fontSize: '11px'
                }
            });
            marker.addListener('click', function() {
                if (Q8.Services && Q8.Services.tryOpenOverlay) {
                    Q8.Services.tryOpenOverlay('sheet-zone', {
                        uid: z.uid,
                        zone: z.id,
                        price: z.price,
                        rates: z.rates
                    });
                }
            });
            gMarkers.push(marker);
        });
    }

    function ensureMapResized() {
        if (map && typeof google !== 'undefined' && google.maps) {
            google.maps.event.trigger(map, 'resize');
            centerMapOnZones();
        }
    }

    function centerMapOnZones() {
        const state = S.get;
        if (!map) return;

        const sel = state.zones.find(z => (z.uid && z.uid === state.selectedZone) || (z.id && String(z.id) === String(state.selectedZone)));
        if (sel && sel.lat && sel.lng) {
            map.setCenter({ lat: sel.lat, lng: sel.lng });
            map.setZoom(16);
            return;
        }

        map.setCenter(UTRECHT_CENTER);
        map.setZoom(16);
    }

    return {
        update: update,
        renderParkingView,
        renderRatesList,
        renderPlates,
        renderQuickPlateSelector,
        renderHistory,
        renderSearchResults,
        renderLoginUI,
        renderInfoBanner,
        showToast,
        renderInstallGate,
        startTimerTicker,
        updateActiveTimerDisplay,
        initGoogleMap,
        renderMapMarkers,
        centerMapOnZones,
        ensureMapResized
    };
})();

// Legacy compatibility mapping
window.updateUI = Q8.UI.update;
window.initGoogleMap = Q8.UI.initGoogleMap;
window.showToast = Q8.UI.showToast;
window.renderMapMarkers = Q8.UI.renderMapMarkers;
window.centerMapOnZones = Q8.UI.centerMapOnZones;
