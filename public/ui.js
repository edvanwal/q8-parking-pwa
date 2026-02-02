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
    let _lastZoneKey = '';
    let _lastSelectedZone = null;
    const U = Q8.Utils;
    // Services might be circular, so access via Q8.Services literal if needed

    // --- CORE RENDERER ---

    function update() {
        try {
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
            // Set fallback message timeout first (so it runs even if renderParkingView throws)
            var isFile = typeof window !== 'undefined' && window.location && window.location.protocol === 'file:';
            if (!isFile) {
                if (_mapLoadCheckTimeout) clearTimeout(_mapLoadCheckTimeout);
                _mapLoadCheckTimeout = setTimeout(function() {
                    _mapLoadCheckTimeout = null;
                    if (map) return;
                    showMapLoadError('De kaart laadt niet. Op de publieke website werkt de kaart vaak wel.', true);
                }, 2500);
            }
            renderParkingView();
        }

        // 4. Content Lists
        if (state.screen === 'notifications') {
            renderNotifications();
        }
        if (state.screen === 'favorites') {
            renderFavorites();
        }
        if (state.screen === 'plates') {
            renderPlates();
            const btnAdd = document.querySelector('[data-target="modal-add-plate"] span');
            if (btnAdd) {
                btnAdd.innerText = state.language === 'nl' ? 'Nieuw kenteken toevoegen' : 'Add new license plate';
            }
        }
        if (state.screen === 'car-specs') renderCarSpecs();
        if (state.screen === 'history') renderHistory();
        if (state.screen === 'login') renderLoginUI();

        renderInfoBanner();

        // PWA Gate
        if (state.installMode.active) {
            renderInstallGate();
        }
    } catch (err) {
        throw err;
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

        // Zones loading indicator
        const zonesLoadingEl = document.getElementById('zones-loading-overlay');
        if (zonesLoadingEl) {
            const loading = state.zonesLoading === true;
            zonesLoadingEl.classList.toggle('hidden', !loading);
            const textEl = zonesLoadingEl.querySelector('.zones-loading-text');
            if (textEl) textEl.textContent = state.language === 'nl' ? 'Parkeerzones laden...' : 'Loading parking zones...';
        }

        // Show message when opened as file (map does not work from file://)
        var mapFileWarning = document.getElementById('map-file-warning');
        var mapContainerEl = document.getElementById('map-container');
        var isFileProtocol = typeof window !== 'undefined' && window.location && window.location.protocol === 'file:';
        if (mapFileWarning) {
            if (isFileProtocol) {
                mapFileWarning.classList.remove('hidden');
                mapFileWarning.style.display = 'block';
                if (mapContainerEl) mapContainerEl.style.display = 'none';
            } else {
                mapFileWarning.classList.add('hidden');
                mapFileWarning.style.display = 'none';
                if (mapContainerEl) mapContainerEl.style.display = '';
            }
        }

        // Init map when on parking view and map not yet created (e.g. after refresh or race)
        if (!isFileProtocol && !map) initGoogleMap();

        // Markers: full render when zones/session change; only update icons when selection changes (avoids shrink bug)
        const zoneKey = `${state.zones.length}|${state.session ? '1' : '0'}`;
        const selKey = state.selectedZone || '';
        if (zoneKey !== _lastZoneKey) {
            _lastZoneKey = zoneKey;
            _lastSelectedZone = selKey;
            renderMapMarkers();
        } else if (selKey !== _lastSelectedZone) {
            _lastSelectedZone = selKey;
            updateMarkerSelection();
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
            const displayPlates = getDisplayPlates();
            const fallbackPlate = displayPlates.find(p => p.id === state.selectedPlateId) || displayPlates.find(p => p.default) || displayPlates[0];
            const elLabel = document.getElementById('active-plate-label');
            if (elLabel) elLabel.innerText = plateDisplay || (fallbackPlate ? fallbackPlate.text : '');

            const elStart = document.getElementById('lbl-start');
            const elEnd = document.getElementById('lbl-end');
            if (elStart) elStart.innerText = fmt(state.session.start);
            if (elEnd) {
                elEnd.innerText = state.session.end ? fmt(state.session.end) : "Until stopped";
            }
            const btnMinus = document.querySelector('.active-end-btn[data-delta="-30"]');
            const btnPlus = document.querySelector('.active-end-btn[data-delta="30"]');
            if (btnMinus) btnMinus.style.opacity = state.session.end ? '1' : '0.3';
            if (btnMinus) btnMinus.disabled = !state.session.end;
            if (btnPlus) btnPlus.style.opacity = '1';

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

        // Side menu: sync language button active state (EN = blue, white text)
        document.querySelectorAll('.side-menu .menu-lang-btn').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-lang') === state.language);
        });
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
                const addrParts = [];
                if (zone.street) addrParts.push(zone.street);
                if (zone.houseNumber) addrParts.push(zone.houseNumber);
                const addrLine = addrParts.length ? addrParts.join(' ') : '';
                const cityLine = zone.city || '';
                const Kenteken = (typeof Q8 !== 'undefined' && Q8.Kenteken) ? Q8.Kenteken : null;
                const cityInfo = Kenteken && Kenteken.getMilieuzoneCityInfo ? Kenteken.getMilieuzoneCityInfo(zone.city) : null;
                const vehicleData = state.vehicleDataByPlate && state.selectedPlateId ? state.vehicleDataByPlate[state.selectedPlateId] : null;
                const mzStatus = (cityInfo && vehicleData && Kenteken.getMilieuzoneStatusForCity) ? Kenteken.getMilieuzoneStatusForCity(vehicleData, zone.city) : null;
                let milieuzoneBlock = '';
                if (cityInfo) {
                    if (mzStatus) {
                        const allowedTxt = state.language === 'nl'
                            ? (mzStatus.allowed ? 'Uw voertuig is toegestaan in deze milieuzone.' : 'Uw voertuig mag niet in deze milieuzone.')
                            : (mzStatus.allowed ? 'Your vehicle is allowed in this environmental zone.' : 'Your vehicle is not allowed in this environmental zone.');
                        const color = mzStatus.allowed ? 'var(--success)' : 'var(--danger)';
                        milieuzoneBlock = `<div class="zone-milieuzone" style="margin-top: 8px; padding: 8px 10px; background: var(--bg-secondary); border-radius: 8px; font-size: 0.85rem;">
                            <span style="font-weight: 600;">${state.language === 'nl' ? 'Milieuzone ' : 'Environmental zone '}${cityInfo.city}</span>
                            <span style="display:block; margin-top: 4px; color: ${color}; font-weight: 500;">${allowedTxt}</span>
                            <a href="https://www.milieuzones.nl" target="_blank" rel="noopener" style="font-size: 0.8rem; color: var(--primary); margin-top: 4px; display: inline-block;">milieuzones.nl</a>
                        </div>`;
                    } else {
                        const hintTxt = state.language === 'nl'
                            ? 'Deze zone ligt in een milieuzone. Controleer uw kenteken op milieuzones.nl.'
                            : 'This zone is in an environmental zone. Check your license plate at milieuzones.nl.';
                        milieuzoneBlock = `<div class="zone-milieuzone" style="margin-top: 8px; padding: 8px 10px; background: var(--bg-secondary); border-radius: 8px; font-size: 0.85rem;">
                            <span style="font-weight: 600;">${state.language === 'nl' ? 'Milieuzone ' : 'Environmental zone '}${cityInfo.city}</span>
                            <span style="display:block; margin-top: 4px; color: var(--text-secondary);">${hintTxt}</span>
                            <a href="https://www.milieuzones.nl" target="_blank" rel="noopener" style="font-size: 0.8rem; color: var(--primary); margin-top: 4px; display: inline-block;">milieuzones.nl</a>
                        </div>`;
                    }
                }
                const detailsHTML = `
                    <div id="zone-extra-details" class="flex-col gap-xs" style="width:100%; margin-top: 8px;">
                        <div class="flex items-center justify-between flex-wrap gap-y-1">
                            <span style="font-size: 1.1rem; font-weight: 700; color: var(--text-primary);">${addrLine ? addrLine + (cityLine ? ', ' : '') + cityLine : cityLine || zone.id || ''}</span>
                            ${limitBadge}
                        </div>
                        ${holidayWarning}
                        ${milieuzoneBlock}
                    </div>
                `;
                const sheetZoneHeader = document.querySelector('#sheet-zone .sheet-zone-header');
                if (sheetZoneHeader) {
                    const firstChild = sheetZoneHeader.querySelector('.sheet-zone-title-row') || sheetZoneHeader.children[0];
                    if (firstChild) firstChild.insertAdjacentHTML('afterend', detailsHTML);
                }
            }
        }

        const displayPlates = getDisplayPlates();
        const selPlate = displayPlates.find(p => p.id === state.selectedPlateId) ||
                         displayPlates.find(p => p.default) ||
                         displayPlates[0];
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

        // Rates section label (i18n) and tooltip
        const ratesLabelEl = document.getElementById('details-rates-label');
        if (ratesLabelEl) {
            ratesLabelEl.textContent = state.language === 'nl' ? 'Tarieven' : 'Rates';
            ratesLabelEl.title = state.language === 'nl'
                ? 'Tariefgegevens zijn gebaseerd op RDW Open Data en zijn indicatief.'
                : 'Rates are based on RDW Open Data and are indicative.';
        }

        // Rates
        const list = document.getElementById('details-rates-list');
        if (list) {
            const rates = state.selectedZoneRates || [];
            if (rates.length === 0 && zone && zone.rates) rates.push(...zone.rates);
            renderRatesList(list, rates);
        }

        // Rates disclaimer (indicative)
        const disclaimerEl = document.getElementById('details-rates-disclaimer');
        if (disclaimerEl) {
            disclaimerEl.textContent = state.language === 'nl'
                ? 'Tarieven zijn indicatief. Het definitieve bedrag kan afwijken.'
                : 'Rates are indicative. The final amount may vary.';
        }

        // Duration label (consistent with 15-min steps)
        const durationLabelEl = document.getElementById('details-duration-label');
        if (durationLabelEl) {
            durationLabelEl.textContent = state.language === 'nl' ? 'Duur' : 'Parking duration';
        }

        // Estimated cost (calculateCost + zone price)
        const estimatedCostEl = document.getElementById('details-estimated-cost');
        if (estimatedCostEl && typeof Q8 !== 'undefined' && Q8.Utils && typeof Q8.Utils.calculateCost === 'function') {
            const hourlyRate = (zone && typeof zone.price === 'number') ? zone.price : state.selectedZoneRate;
            if (state.duration > 0 && hourlyRate >= 0) {
                const cost = Q8.Utils.calculateCost(state.duration, hourlyRate);
                const formatted = cost.toFixed(2).replace('.', ',');
                estimatedCostEl.textContent = state.language === 'nl'
                    ? `Geschatte kosten: ca. € ${formatted}`
                    : `Estimated cost: ca. € ${formatted}`;
                estimatedCostEl.classList.remove('sheet-estimated-cost--muted');
            } else {
                estimatedCostEl.textContent = state.language === 'nl'
                    ? 'Duur onbekend – geen indicatie'
                    : 'Duration unknown – no estimate';
                estimatedCostEl.classList.add('sheet-estimated-cost--muted');
            }
        }

        // Favorite button state
        const favOutline = document.getElementById('fav-icon-outline');
        const favFilled = document.getElementById('fav-icon-filled');
        const zoneUid = state.selectedZone;
        const zoneId = zone ? zone.id : state.selectedZone;
        const isFav = zoneUid && (state.favorites || []).some(f => f.zoneUid === zoneUid || (f.zoneId === zoneId && !f.zoneUid));
        if (favOutline) favOutline.style.display = isFav ? 'none' : 'block';
        if (favFilled) favFilled.style.display = isFav ? 'block' : 'none';
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
             const priceStr = (r.price != null && r.price !== '') ? String(r.price) : '';
             const isFree = !priceStr ||
                 priceStr.toLowerCase().includes('free') ||
                 priceStr.toLowerCase().includes('gratis') ||
                 priceStr.replace(/[^\d,.]/g, '').replace(',', '.') === '0' ||
                 parseFloat(priceStr.replace(/[^\d,.]/g, '').replace(',', '.')) === 0;
             const color = isFree ? '#10b981' : 'var(--primary)';
             const label = isFree ? 'Free' : (priceStr || r.price);

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
                    <span class="rate-price" style="color: ${color};">${label}</span>
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

    function getDisplayPlates() {
        const state = S.get;
        const admin = (state.adminPlates || []).map(p => ({ ...p, source: 'admin', locked: true }));
        const user = (state.plates || []).map(p => ({ ...p, source: p.source || 'user' }));
        return [...admin, ...user];
    }

    function renderPlates() {
        const state = S.get;
        const list = document.getElementById('list-plates');
        const btnSetDefault = document.getElementById('btn-set-default');
        const btnAdd = document.querySelector('[data-target="modal-add-plate"]');
        if (!list) return;
        list.innerHTML = '';

        const ds = state.driverSettings || {};
        const canAdd = ds.canAddPlates !== false && !ds.platesLocked;
        const canEdit = !ds.platesLocked;

        if (btnAdd) btnAdd.style.display = canAdd ? '' : 'none';

        const displayPlates = getDisplayPlates();
        const sorted = [...displayPlates].sort((a,b) => (a.text || a.id || '').localeCompare(b.text || b.id || ''));
        let selectionValid = false;

        sorted.forEach(p => {
            const isSelected = state.selectedPlateId === p.id;
            const isAdminPlate = p.source === 'admin' || p.locked;
            const showEditDelete = canEdit && !isAdminPlate;

            const div = document.createElement('div');
            div.className = `card flex justify-between items-center mb-md ${isSelected ? 'selected' : ''}`;
            div.style.padding = '16px 20px';
            div.setAttribute('data-action', 'select-plate');
            div.setAttribute('data-id', p.id);
            div.style.cursor = 'pointer';

            const badgeLabel = state.language === 'nl' ? 'STANDAARD' : 'DEFAULT';

            div.innerHTML = `
                <div class="flex flex-col pointer-events-none" style="flex:1; gap: 2px;">
                   <div class="font-bold text-lg" style="line-height: 1.2;">${p.text || p.id}</div>
                   ${p.description ? `<div class="text-secondary text-sm" style="font-weight: 400;">${p.description}</div>` : ''}
                   ${isAdminPlate ? `<div class="text-secondary text-xs" style="margin-top:2px;">${state.language === 'nl' ? 'Toegevoegd door fleetmanager' : 'Added by fleet manager'}</div>` : ''}
                </div>
                <div class="flex items-center gap-md pointer-events-none" style="margin-left: 16px;">
                    ${p.default ? `<div class="badge badge-success">${badgeLabel}</div>` : ''}
                    ${showEditDelete ? `<button class="icon-btn ptr-enabled" style="color:var(--text-secondary); padding: 4px;" data-action="edit-plate" data-id="${p.id}" title="${state.language === 'nl' ? 'Bewerken' : 'Edit'}">
                         <svg class="no-pointer" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M21.1213 2.70705C19.9497 1.53548 18.0503 1.53547 16.8787 2.70705L15.1989 4.38685L7.29289 12.2928C7.16473 12.421 7.07382 12.5816 7.02986 12.7574L6.02986 16.7574C5.94466 17.0982 6.04451 17.4587 6.29289 17.707C6.54127 17.9554 6.90176 18.0553 7.24254 17.9701L11.2425 16.9701C11.4184 16.9261 11.5789 16.8352 11.7071 16.707L19.5556 8.85857L21.2929 7.12126C22.4645 5.94969 22.4645 4.05019 21.2929 2.87862L21.1213 2.70705ZM18.2929 4.12126C18.6834 3.73074 19.3166 3.73074 19.7071 4.12126L19.8787 4.29283C20.2692 4.68336 20.2692 5.31653 19.8787 5.70705L18.8622 6.72357L17.3068 5.10738L18.2929 4.12126ZM15.8923 6.52185L17.4477 8.13804L10.4888 15.097L8.37437 15.6256L8.90296 13.5112L15.8923 6.52185ZM4 7.99994C4 7.44766 4.44772 6.99994 5 6.99994H10C10.5523 6.99994 11 6.55223 11 5.99994C11 5.44766 10.5523 4.99994 10 4.99994H5C3.34315 4.99994 2 6.34309 2 7.99994V18.9999C2 20.6568 3.34315 21.9999 5 21.9999H16C17.6569 21.9999 19 20.6568 19 18.9999V13.9999C19 13.4477 18.5523 12.9999 18 12.9999C17.4477 12.9999 17 13.4477 17 13.9999V18.9999C17 19.5522 16.5523 19.9999 16 19.9999H5C4.44772 19.9999 4 19.5522 4 18.9999V7.99994Z" fill="currentColor"/></svg>
                    </button>
                    <button class="icon-btn ptr-enabled" style="color:var(--text-secondary); padding: 4px;" data-action="delete-plate" data-id="${p.id}">
                         <svg class="no-pointer" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5V6H17H19C19.5523 6 20 6.44772 20 7C20 7.55228 19.5523 8 19 8H18V18C18 19.6569 16.6569 21 15 21H9C7.34315 21 6 19.6569 6 18V8H5C4.44772 8 4 7.55228 4 7C4 6.44772 4.44772 6 5 6H7H9V5ZM10 8H8V18C8 18.5523 8.44772 19 9 19H15C15.5523 19 16 18.5523 16 18V8H14H10ZM13 6H11V5H13V6ZM10 9C10.5523 9 11 9.44772 11 10V17C11 17.5523 10.5523 18 10 18C9.44772 18 9 17.5523 9 17V10C9 9.44772 9.44772 9 10 9ZM14 9C14.5523 9 15 9.44772 15 10V17C15 17.5523 14.5523 18 14 18C13.4477 18 13 17.5523 13 17V10C13 9.44772 13.4477 9 14 9Z" fill="currentColor"/></svg>
                    </button>` : ''}
                </div>
            `;
            div.querySelectorAll('.ptr-enabled').forEach(el => { el.style.pointerEvents = 'auto'; });
            list.appendChild(div);

            if (isSelected && !p.default) selectionValid = true;
        });

        if (btnSetDefault) btnSetDefault.disabled = !selectionValid;
    }

    function formatAPKDate(vervaldatum_apk) {
        if (!vervaldatum_apk || String(vervaldatum_apk).length < 8) return '—';
        const s = String(vervaldatum_apk);
        const y = s.slice(0, 4), m = s.slice(4, 6), d = s.slice(6, 8);
        return d + '-' + m + '-' + y;
    }

    function renderCarSpecs() {
        const state = S.get;
        const list = document.getElementById('list-car-specs');
        const intro = document.getElementById('car-specs-intro');
        const Kenteken = (typeof Q8 !== 'undefined' && Q8.Kenteken) ? Q8.Kenteken : null;
        const nl = state.language === 'nl';
        if (!list) return;
        if (intro) intro.innerText = nl ? 'Specs van je ingevulde kentekens (RDW).' : 'Specs for your registered license plates (RDW).';

        list.innerHTML = '';
        const plates = getDisplayPlates();
        if (plates.length === 0) {
            list.innerHTML = '<p class="text-secondary">' + (nl ? 'Voeg eerst kentekens toe onder License plates.' : 'Add license plates first under License plates.') + '</p>';
            return;
        }

        const labels = {
            merk: nl ? 'Merk' : 'Brand',
            handelsbenaming: nl ? 'Type' : 'Type',
            kleur: nl ? 'Kleur' : 'Colour',
            apk: nl ? 'APK datum' : 'APK date',
            brandstof: nl ? 'Brandstof' : 'Fuel',
            elektrisch: nl ? 'Elektrisch' : 'Electric',
            gewicht: nl ? 'Gewicht (kg)' : 'Weight (kg)',
            laad_aansluiting: nl ? 'Laad aansluiting' : 'Charging connector',
            laad_snelheid: nl ? 'Laad snelheid' : 'Charging speed'
        };

        plates.forEach(function(plate) {
            const normalized = (Kenteken && Kenteken.normalize) ? Kenteken.normalize(plate.text || plate.id) : (plate.id || (plate.text || '').replace(/[\s\-]/g, '').toUpperCase());
            const card = document.createElement('div');
            card.className = 'card mb-lg car-specs-card';
            card.style.padding = '16px 20px';
            card.innerHTML = '<div class="font-bold text-lg mb-md" style="display:flex;align-items:center;gap:8px;">' +
                (plate.text || plate.id) +
                '<span class="car-specs-loading text-secondary text-sm" style="font-weight:400;">' + (nl ? 'Laden...' : 'Loading...') + '</span></div>' +
                '<div class="car-specs-fields flex-col gap-sm" style="display:none;"></div>';
            list.appendChild(card);

            const loadingEl = card.querySelector('.car-specs-loading');
            const fieldsEl = card.querySelector('.car-specs-fields');

            if (!Kenteken || !Kenteken.getVehicleSpecs) {
                if (loadingEl) loadingEl.textContent = nl ? 'Specs niet beschikbaar.' : 'Specs not available.';
                return;
            }

            Kenteken.getVehicleSpecs(normalized).then(function(result) {
                if (loadingEl) loadingEl.style.display = 'none';
                if (!result.found || result.error) {
                    fieldsEl.style.display = 'flex';
                    fieldsEl.innerHTML = '<p class="text-secondary">' + (result.error ? (nl ? 'RDW tijdelijk niet bereikbaar.' : 'RDW temporarily unavailable.') : (nl ? 'Niet gevonden in RDW.' : 'Not found in RDW.')) + '</p>';
                    return;
                }
                const s = result.specs;
                const kleur = [s.eerste_kleur, s.tweede_kleur].filter(Boolean).join(', ').replace(/Niet geregistreerd/gi, '') || '—';
                const gewicht = s.massa_ledig_voertuig || s.toegestane_maximum_massa_voertuig || '—';
                const rows = [
                    [labels.merk, s.merk || '—'],
                    [labels.handelsbenaming, (s.handelsbenaming || '').trim() || '—'],
                    [labels.kleur, kleur],
                    [labels.apk, formatAPKDate(s.vervaldatum_apk)],
                    [labels.brandstof, s.brandstof || '—'],
                    [labels.elektrisch, s.elektrisch ? (nl ? 'Ja' : 'Yes') : (nl ? 'Nee' : 'No')],
                    [labels.gewicht, gewicht],
                    [labels.laad_aansluiting, s.laad_aansluiting || '—'],
                    [labels.laad_snelheid, s.laad_snelheid || '—']
                ];
                fieldsEl.style.display = 'flex';
                fieldsEl.innerHTML = rows.map(function(r) {
                    return '<div class="flex justify-between gap-md" style="align-items:baseline;"><span class="text-secondary text-sm">' + r[0] + '</span><span class="text-main font-medium">' + (r[1] || '—') + '</span></div>';
                }).join('');
            });
        });
    }

    function renderFavorites() {
        const state = S.get;
        const list = document.getElementById('list-favorites');
        const intro = document.getElementById('fav-intro-text');
        if (!list) return;
        if (intro) intro.innerText = state.language === 'nl' ? 'Je favoriete parkeerzones. Tik om te starten.' : 'Your favorite parking zones. Tap to start.';

        const favorites = state.favorites || [];
        if (favorites.length === 0) {
            list.innerHTML = `<div class="text-secondary" style="padding:24px; text-align:center; font-size:0.9rem;">${state.language === 'nl' ? 'Nog geen favorieten. Markeer zones als favoriet in de zone-details.' : 'No favorites yet. Mark zones as favorite from the zone details.'}</div>`;
            return;
        }

        list.innerHTML = favorites.map(f => {
            const zone = state.zones.find(z => z.uid === f.zoneUid || z.id === f.zoneUid || z.id === f.zoneId);
            const uid = zone ? (zone.uid || zone.id) : f.zoneUid || f.zoneId;
            const zoneId = zone ? zone.id : f.zoneId || f.zoneUid || '?';
            const street = zone && zone.street ? zone.street : '';
            const houseNumber = zone && zone.houseNumber ? zone.houseNumber : '';
            const city = zone && zone.city ? zone.city : '';
            const addr = street ? `${street}${houseNumber ? ' ' + houseNumber : ''}${city ? ', ' + city : ''}` : (city ? `${zoneId}, ${city}` : zoneId);
            const price = zone && zone.price != null ? zone.price : null;
            const rates = zone && zone.rates ? zone.rates : [];
            return `
            <div class="card flex justify-between items-center" style="padding:16px 20px; cursor:pointer;" data-action="open-overlay" data-target="sheet-zone" data-zone-uid="${uid}" data-zone="${zoneId}" data-price="${price || ''}" data-rates='${JSON.stringify(rates)}'>
               <div class="flex-col no-pointer" style="flex:1;">
                  <div class="font-bold text-lg no-pointer" style="line-height:1.2;">Zone ${zoneId}</div>
                  <div class="text-secondary text-sm no-pointer" style="margin-top:2px;">${addr}</div>
               </div>
               <div class="flex items-center gap-sm no-pointer">
                  ${price != null ? `<span class="font-bold text-primary no-pointer">€ ${Number(price).toFixed(2).replace('.', ',')}</span>` : ''}
                  <button class="icon-btn ptr-enabled" data-action="remove-favorite" data-zone-uid="${uid}" data-zone-id="${zoneId}" title="${state.language === 'nl' ? 'Verwijderen' : 'Remove'}" style="padding:6px; color:#ce1818;" onclick="event.stopPropagation();">
                     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                  </button>
               </div>
            </div>`;
        }).join('');
        list.querySelectorAll('.ptr-enabled').forEach(el => { el.style.pointerEvents = 'auto'; });
    }

    function renderNotifications() {
        const state = S.get;
        const settingsList = document.getElementById('notif-settings-list');
        const historyList = document.getElementById('notif-history-list');
        if (!settingsList || !historyList) return;

        const s = state.notificationSettings || {};
        const nl = state.language === 'nl';

        const settings = [
            { key: 'sessionStarted', label: nl ? 'Parkeersessie gestart' : 'Parking session started' },
            { key: 'sessionExpiringSoon', label: nl ? 'Parkeersessie verloopt binnenkort' : 'Parking session expiring soon', hasInterval: true },
            { key: 'sessionEndedByUser', label: nl ? 'Sessie beëindigd (eindtijd)' : 'Session ended (end time reached)' },
            { key: 'sessionEndedByMaxTime', label: nl ? 'Sessie beëindigd (max parkeertijd)' : 'Session ended (max parking time)' }
        ];

        settingsList.innerHTML = settings.map(setting => {
            const checked = s[setting.key] !== false;
            let html = `
            <div class="notif-setting-row flex items-center justify-between" style="padding:12px 16px; background:var(--surface); border-radius:12px; border:1px solid var(--border); cursor:pointer;" data-action="toggle-notif-setting" data-key="${setting.key}">
                <span class="text-main font-medium" style="font-size:0.9375rem;">${setting.label}</span>
                <div class="notif-toggle" style="display:flex; align-items:center;">
                    <input type="checkbox" data-key="${setting.key}" ${checked ? 'checked' : ''} style="width:20px; height:20px; pointer-events:none;">
                </div>
            </div>`;
            if (setting.hasInterval) {
                const mins = (s.expiringSoonMinutes || 10);
                html += `
            <div class="notif-interval-row flex items-center justify-between" style="padding:12px 16px; background:var(--bg-secondary); border-radius:12px; margin-top:8px; margin-left:16px;">
                <span class="text-secondary" style="font-size:0.875rem;">${nl ? 'Waarschuw minuten van tevoren:' : 'Warn minutes before:'}</span>
                <select data-action="change-expiring-interval" style="padding:6px 12px; border-radius:8px; font-size:0.9rem;">
                    ${[5,10,15,20,30].map(m => `<option value="${m}" ${mins === m ? 'selected' : ''}>${m} min</option>`).join('')}
                </select>
            </div>`;
            }
            return html;
        }).join('');

        const notifs = (state.notifications || []).slice().reverse().slice(0, 50);
        const typeLabel = (t) => {
            if (t === 'sessionStarted') return nl ? 'Gestart' : 'Started';
            if (t === 'sessionExpiringSoon') return nl ? 'Verloopt' : 'Expiring';
            if (t === 'sessionEndedByUser') return nl ? 'Beëindigd (tijd)' : 'Ended (time)';
            if (t === 'sessionEndedByMaxTime') return nl ? 'Beëindigd (max)' : 'Ended (max)';
            return t;
        };
        const fmtDate = (iso) => {
            const d = new Date(iso);
            const now = new Date();
            const sameDay = d.toDateString() === now.toDateString();
            return sameDay ? d.toLocaleTimeString(nl ? 'nl-NL' : 'en-GB', { hour: '2-digit', minute: '2-digit' }) : d.toLocaleDateString(nl ? 'nl-NL' : 'en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
        };
        historyList.innerHTML = notifs.length === 0
            ? `<div class="text-secondary" style="padding:24px; text-align:center; font-size:0.9rem;">${nl ? 'Geen notificaties' : 'No notifications'}</div>`
            : notifs.map(n => `
            <div class="notif-history-item card" style="padding:12px 16px;">
                <div class="flex justify-between items-start gap-sm">
                    <div>
                        <div class="font-bold text-main" style="font-size:0.9375rem;">${n.message}</div>
                        ${n.detail ? `<div class="text-secondary text-sm" style="margin-top:2px;">${n.detail}</div>` : ''}
                    </div>
                    <span class="badge badge-neutral text-xs" style="flex-shrink:0;">${typeLabel(n.type)}</span>
                </div>
                <div class="text-secondary text-xs" style="margin-top:8px;">${fmtDate(n.at)}</div>
            </div>`).join('');
    }

    function renderQuickPlateSelector() {
        const state = S.get;
        const list = document.getElementById('quick-plate-list');
        if (!list) return;
        list.innerHTML = '';
        const displayPlates = getDisplayPlates();
        const activePlateId = state.selectedPlateId || (displayPlates.find(p => p.default) || displayPlates[0])?.id;

        displayPlates.forEach(p => {
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
        let dateStart = filters.customStart;
        let dateEnd = filters.customEnd;
        if (filters.dateRange === 'week' || filters.dateRange === '30days') {
            const now = new Date();
            dateEnd = now.toISOString().slice(0, 10);
            const d = new Date(now);
            d.setDate(d.getDate() - (filters.dateRange === 'week' ? 7 : 30));
            dateStart = d.toISOString().slice(0, 10);
        }
        if (dateStart || dateEnd) {
            filteredHistory = filteredHistory.filter(h => {
                if (!h.date) return true;

                // Parse "DD-MM-YYYY" from h.date
                const parts = h.date.split('-');
                if (parts.length !== 3) return true;

                // Construct Date object at 00:00:00 for comparison
                const itemDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
                itemDate.setHours(0,0,0,0);

                let validStart = true;
                if (dateStart) {
                    const startRaw = new Date(dateStart);
                    startRaw.setHours(0,0,0,0);
                    if (itemDate < startRaw) validStart = false;
                }

                let validEnd = true;
                if (dateEnd) {
                    const endRaw = new Date(dateEnd);
                    endRaw.setHours(0,0,0,0);
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
                const zone = state.zones.find(z => z.id === h.zone || z.uid === h.zoneUid || z.uid === h.zone);
                const zoneUid = zone ? (zone.uid || zone.id) : h.zoneUid || h.zone;
                const zoneId = zone ? zone.id : h.zone;
                const isFav = (state.favorites || []).some(f => f.zoneUid === zoneUid || f.zoneId === zoneId);
                const div = document.createElement('div');
                div.className = 'card mb-md history-card-clickable';
                div.style.cursor = 'pointer';
                div.setAttribute('data-action', 'open-overlay');
                div.setAttribute('data-target', 'sheet-zone');
                div.setAttribute('data-zone-uid', zoneUid);
                div.setAttribute('data-zone', zoneId);
                div.setAttribute('data-price', zone && zone.price != null ? zone.price : '');
                div.setAttribute('data-rates', JSON.stringify(zone && zone.rates ? zone.rates : []));
                div.innerHTML = `
                    <div class="history-card-header">
                       <span class="font-bold text-lg">${h.plate}</span>
                       <div class="flex items-center gap-sm">
                          <div class="zone-badge-box">
                             <span class="icon-p" style="font-size:0.8rem;">P</span>
                             <span style="font-weight:700;">${h.zone}</span>
                          </div>
                          <button class="icon-btn history-fav-btn" data-action="${isFav ? 'remove-favorite' : 'add-favorite-from-history'}" data-zone-uid="${zoneUid}" data-zone-id="${zoneId}" title="${isFav ? (state.language === 'nl' ? 'Verwijder uit favorieten' : 'Remove from favorites') : (state.language === 'nl' ? 'Voeg toe aan favorieten' : 'Add to favorites')}" style="padding:4px;" onclick="event.stopPropagation();">
                             <svg width="18" height="18" viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                          </button>
                       </div>
                    </div>
                    <div class="text-secondary text-sm mb-md">${h.street || ''}</div>
                    <div class="history-card-details">
                       <div>
                          <div class="history-date-label">${h.date}</div>
                          <div class="history-time-range">${h.start} - ${h.end}</div>
                       </div>
                       <div class="history-price-tag">€ ${(h.price || '').toString().replace('.', ',')}</div>
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
            const activeCount = filters.vehicles.length + (filters.dateRange !== 'all' ? 1 : 0) + (filters.customStart ? 1 : 0) + (filters.customEnd ? 1 : 0);
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

        const dateRange = state.historyFilters.dateRange || 'all';
        const dateRangePills = `
            <button class="filter-pill ${dateRange === 'week' ? 'selected' : ''}" data-action="toggle-filter-daterange" data-range="week">LAST WEEK</button>
            <button class="filter-pill ${dateRange === '30days' ? 'selected' : ''}" data-action="toggle-filter-daterange" data-range="30days">LAST 30 DAYS</button>
            <button class="filter-pill ${dateRange === 'custom' ? 'selected' : ''}" data-action="toggle-filter-daterange" data-range="custom">CUSTOM RANGE</button>
        `;

        bottomSheet.innerHTML = `
             <div class="sheet-handle"></div>

             <div class="sheet-header sheet-filter-header">
                <h3 class="sheet-filter-title">Filters</h3>
             </div>

             <div class="sheet-scroll-content sheet-filter-content">

                <div class="sheet-filter-section">
                    <div class="sheet-filter-label">VEHICLE</div>
                    <div class="flex flex-wrap gap-sm">
                        ${vehiclesHTML.length > 0 ? vehiclesHTML : '<span class="sheet-filter-empty">' + (state.language === 'nl' ? 'Geen voertuigen in geschiedenis' : 'No vehicles in history') + '</span>'}
                    </div>
                </div>

                <div class="sheet-filter-section">
                    <div class="sheet-filter-label">DATE RANGE</div>
                    <div class="flex flex-wrap gap-sm" style="margin-bottom: 12px;">
                        ${dateRangePills}
                    </div>
                    ${dateRange === 'custom' ? `
                    <div class="flex gap-md" style="margin-top: 12px;">
                        <div class="flex-col" style="flex: 1;">
                            <label class="sheet-filter-date-label">Start date</label>
                            <input type="${startType}" id="filter-date-start" value="${startDateVal}" placeholder="dd-mm-jjjj"
                                   onfocus="(this.type='date')"
                                   onblur="(this.value ? this.type='date' : this.type='text')"
                                   class="filter-date-input">
                        </div>
                        <div class="flex-col" style="flex: 1;">
                            <label class="sheet-filter-date-label">End date</label>
                            <input type="${endType}" id="filter-date-end" value="${endDateVal}" placeholder="dd-mm-jjjj"
                                   onfocus="(this.type='date')"
                                   onblur="(this.value ? this.type='date' : this.type='text')"
                                   class="filter-date-input">
                        </div>
                    </div>
                    ` : ''}
                </div>

             </div>

             <div class="sheet-filter-footer">
                 <button class="btn btn-secondary sheet-filter-clear" data-action="clear-filters">CLEAR ALL</button>
                 <button class="btn btn-primary sheet-filter-apply" data-action="apply-filters">APPLY</button>
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

        const isAddressMode = state.searchMode === 'address';
        const minLen = isAddressMode ? 3 : 2;
        const shouldShow = state.screen === 'parking' && state.searchQuery.length >= minLen && state.activeOverlay === null;
        const favQuick = document.getElementById('ui-favorites-quick');
        const favs = state.favorites || [];
        const showFavQuick = state.screen === 'parking' && !state.session && state.activeOverlay === null && favs.length > 0 && state.searchQuery.length < 2;
        if (favQuick) {
            favQuick.style.display = showFavQuick ? 'block' : 'none';
            favQuick.className = showFavQuick ? 'search-results-panel search-results-panel--pill' : 'hidden';
            if (showFavQuick) {
                const favUids = new Set(favs.map(f => f.zoneUid || f.zoneId));
                const favZones = favs.map(f => {
                    const zone = state.zones.find(z => z.uid === f.zoneUid || z.id === f.zoneUid || z.id === f.zoneId);
                    return zone ? { ...zone, zoneUid: zone.uid || zone.id } : null;
                }).filter(Boolean);
                favQuick.innerHTML = `
                  <div class="text-secondary text-xs font-bold mb-sm" style="padding:12px 16px 0; letter-spacing:0.05em;">${state.language === 'nl' ? 'JE FAVORIETEN' : 'YOUR FAVORITES'}</div>
                  ${favZones.length === 0 ? '<div class="text-secondary text-sm" style="padding:12px 16px;">' + (state.language === 'nl' ? 'Geen favorieten in deze sessie' : 'No favorites loaded') + '</div>' : favZones.map(z => {
                    const street = z.street || '';
                    const houseNumber = z.houseNumber || '';
                    const city = z.city || '';
                    const zoneId = z.id || '';
                    const addr = street ? `${street}${houseNumber ? ' ' + houseNumber : ''}${city ? ', ' + city : ''}` : (city ? `${zoneId}, ${city}` : zoneId);
                    return `<div class="search-result-item" data-action="open-overlay" data-target="sheet-zone" data-zone-uid="${z.uid}" data-zone="${zoneId}" data-price="${z.price}" data-rates='${JSON.stringify(z.rates || [])}'>
                      <span class="search-result-text">♥ ${addr}</span>
                      <span class="search-result-price">€ ${(z.price || 0).toFixed(2).replace('.', ',')}</span>
                    </div>`;
                  }).join('')}
                `;
            }
        }
        if (!shouldShow) {
            container.style.display = 'none';
            return;
        }

        const query = state.searchQuery.toLowerCase();
        const favorites = state.favorites || [];
        const favUids = new Set(favorites.map(f => f.zoneUid || f.zoneId));
        const matches = state.zones.filter(z => {
            const id = (z.id || '').toLowerCase();
            const name = (z.name || '').toLowerCase();
            const street = (z.street || '').toLowerCase();
            const city = (z.city || '').toLowerCase();
            return id.includes(query) || name.includes(query) || street.includes(query) || city.includes(query);
        })
            .sort((a,b) => {
                const aFav = favUids.has(a.uid) || favUids.has(a.id);
                const bFav = favUids.has(b.uid) || favUids.has(b.id);
                if (aFav && !bFav) return -1;
                if (!aFav && bFav) return 1;
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
            // Format: "straatnaam + huisnummer + plaats" of fallback "zoneId, stad"
            const street = z.street || '';
            const houseNumber = z.houseNumber || '';
            const city = z.city || '';
            const zoneId = z.id || '';
            const addr = street
                ? `${street}${houseNumber ? ' ' + houseNumber : ''}${city ? ', ' + city : ''}`
                : (city ? `${zoneId}, ${city}` : zoneId);
            const displayAddr = regex ? addr.replace(regex, '<strong class="search-highlight">$1</strong>') : addr;
            const isFav = favUids.has(z.uid) || favUids.has(z.id);
            return `
            <div class="search-result-item" data-action="open-overlay" data-target="sheet-zone"
                 data-zone-uid="${z.uid}"
                 data-zone="${z.id || ''}"
                 data-price="${z.price}"
                 data-rates='${JSON.stringify(z.rates || [])}'>
                <span class="search-result-text">${displayAddr}</span>
                <div class="flex items-center gap-sm" style="flex-shrink:0;">
                  ${isFav ? '<span class="fav-star" title="' + (state.language === 'nl' ? 'Favoriet' : 'Favorite') + '">♥</span>' : ''}
                  <span class="search-result-price">€ ${(z.price || 0).toFixed(2).replace('.', ',')}</span>
                </div>
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
    let _expiringSoonNotified = null;

    function startTimerTicker() {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        timerInterval = setInterval(() => {
            const state = S.get;
            if (state.session) {
                updateActiveTimerDisplay();
            } else {
                if (timerInterval) clearInterval(timerInterval);
                timerInterval = null;
            }
        }, 1000);
    }

    function toDate(v) {
        if (!v) return null;
        if (v instanceof Date && !isNaN(v.getTime())) return v;
        const d = new Date(v);
        return isNaN(d.getTime()) ? null : d;
    }

    function updateActiveTimerDisplay() {
        const state = S.get;
        const elTimer = document.getElementById('active-timer');
        const elLabel = document.getElementById('active-timer-label');
        if (!elTimer || !state.session) return;

        const now = new Date();
        const startDate = toDate(state.session.start);
        const endDate = toDate(state.session.end);
        if (!startDate) return;

        const zone = state.zones.find(z => z.uid === state.session.zoneUid || z.id === state.session.zoneUid) || state.zones.find(z => z.id === state.session.zone);
        const maxDurMins = (zone && zone.max_duration_mins && zone.max_duration_mins > 0) ? zone.max_duration_mins : 1440;

        // 1. Until stopped (duration=0): Count UP, check max duration
        if (!endDate) {
            if (elLabel) elLabel.innerText = state.language === 'nl' ? 'Tijd geparkeerd' : 'Time';
            const elapsed = now - startDate;
            if (elapsed >= maxDurMins * 60000) {
                if (Q8.Services && Q8.Services.handleAutoEndSession) Q8.Services.handleAutoEndSession('sessionEndedByMaxTime');
                return;
            }
            const h = Math.floor(elapsed / 3600000);
            const m = Math.floor((elapsed % 3600000) / 60000);
            const s = Math.floor((elapsed % 60000) / 1000);
            elTimer.style.color = "#059669";
            if (h > 0) elTimer.innerText = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
            else elTimer.innerText = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
            return;
        }

        // 2. Fixed duration: Count DOWN, auto-end when 0, expiring-soon notification
        if (elLabel) elLabel.innerText = state.language === 'nl' ? 'Resterende tijd' : 'Time left';
        const diff = endDate.getTime() - now.getTime();

        if (diff <= 0) {
            if (Q8.Services && Q8.Services.handleAutoEndSession) Q8.Services.handleAutoEndSession('sessionEndedByUser');
            return;
        }

        const sessionKey = `${state.session.zone || ''}-${state.session.plate || ''}-${startDate.getTime()}`;
        const expiringMins = (state.notificationSettings && state.notificationSettings.expiringSoonMinutes) || 10;
        if (diff <= expiringMins * 60 * 1000 && _expiringSoonNotified !== sessionKey) {
            _expiringSoonNotified = sessionKey;
            if (Q8.Services && Q8.Services.addNotification) {
                const msg = state.language === 'nl' ? `Parkeersessie verloopt over ${expiringMins} minuten` : `Parking session expires in ${expiringMins} minutes`;
                Q8.Services.addNotification('sessionExpiringSoon', msg, `${state.session.zone || '?'} · ${state.session.plate || '?'}`);
            }
        }

        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        elTimer.style.color = "#ce1818";
        if (h > 0) elTimer.innerText = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        else elTimer.innerText = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }


    // --- GOOGLE MAPS ---

    let map;
    var _mapLoadCheckTimeout = null;
    var _mapScriptLoading = false;
    const UTRECHT_CENTER = { lat: 52.0907, lng: 5.1214 };

    // DIAG: Set window.Q8_DIAG = true to log Maps loading steps
    function diagMaps(tag, msg, data) {
        if (window.Q8_DIAG) console.log('[DIAG_MAPS]', tag, msg, data || '');
    }

    function showMapLoadError(message, showPublicLink) {
        var el = document.getElementById('map-load-error');
        var textEl = document.getElementById('map-load-error-text');
        var linkEl = document.getElementById('map-load-error-link');
        var container = document.getElementById('map-container');
        var fileWarning = document.getElementById('map-file-warning');
        if (fileWarning) { fileWarning.classList.add('hidden'); fileWarning.style.display = 'none'; }
        if (container) container.style.display = 'none';
        if (el) {
            if (textEl && message) textEl.textContent = message;
            if (linkEl) linkEl.innerHTML = showPublicLink ? 'Probeer de app op de publieke website: <a href="https://q8-parking-pwa.web.app" target="_blank" rel="noopener" class="font-bold" style="color:var(--primary);">q8-parking-pwa.web.app</a>' : '';
            el.classList.remove('hidden');
            el.style.display = 'block';
        }
    }

    function hideMapLoadError() {
        var el = document.getElementById('map-load-error');
        if (el) { el.classList.add('hidden'); el.style.display = 'none'; }
    }

    function initGoogleMap() {
        const container = document.getElementById('map-container');
        diagMaps('initGoogleMap', 'entry', { hasContainer: !!container, hasMap: !!map });
        if (!container || map) return;

        if (typeof google === 'undefined' || !google.maps) {
            if (_mapScriptLoading) return;
            _mapScriptLoading = true;
            diagMaps('initGoogleMap', 'loading-script');
            const apiKey = (typeof firebaseConfig !== 'undefined') ? firebaseConfig.googleMapsApiKey : '';
            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&loading=async&callback=initMapCallback`;
            script.async = true;
            script.onerror = function() {
                _mapScriptLoading = false;
                diagMaps('initGoogleMap', 'script-load-error');
                showMapLoadError('Het laden van de Google Maps-script is mislukt. Controleer uw internetverbinding of of de API-sleutel localhost toestaat.');
            };
            window.initMapCallback = function() {
                 _mapScriptLoading = false;
                 diagMaps('initGoogleMap', 'callback-fired');
                 if(Q8.UI && Q8.UI.initGoogleMap) Q8.UI.initGoogleMap();
                 else initGoogleMap();
            };
            document.head.appendChild(script);
            return;
        }

        diagMaps('initGoogleMap', 'creating-map');
        hideMapLoadError();
        try {
            map = new google.maps.Map(container, {
                center: UTRECHT_CENTER,
                zoom: 16,
                disableDefaultUI: true,
                zoomControl: false,
                mapTypeControl: false,
                streetViewControl: false,
                fullscreenControl: false,
                clickableIcons: false,
                gestureHandling: 'greedy'
            });
        } catch (err) {
            showMapLoadError('De kaart kon niet worden aangemaakt. Bij localhost: voeg in Google Cloud Console bij de Maps API-sleutel http://localhost:* toe als referrer.');
            if (window.Q8_DIAG) console.error('[DIAG_MAPS] Map create error', err);
            return;
        }

        if (_mapLoadCheckTimeout) { clearTimeout(_mapLoadCheckTimeout); _mapLoadCheckTimeout = null; }
        renderMapMarkers();
        google.maps.event.addListenerOnce(map, 'idle', function() {
            google.maps.event.trigger(map, 'resize');
        });
        // Delayed resize so container has final size after layout
        setTimeout(function() {
            if (map && typeof google !== 'undefined' && google.maps) {
                google.maps.event.trigger(map, 'resize');
            }
        }, 400);
        diagMaps('initGoogleMap', 'done');
    }

    /* OverlayView-based markers: defined only when google.maps exists */
    let priceMarkersOverlay = null;

    function createPriceMarkersOverlay() {
        function PriceMarkersOverlay() {}
        PriceMarkersOverlay.prototype = new google.maps.OverlayView();
        PriceMarkersOverlay.prototype.onAdd = function() {
            this.container = document.createElement('div');
            this.container.style.cssText = 'position:absolute;left:0;top:0;pointer-events:none;';
            const panes = this.getPanes();
            if (panes && panes.overlayMouseTarget) panes.overlayMouseTarget.appendChild(this.container);
        };
        PriceMarkersOverlay.prototype.draw = function() {
            if (!this.getMap() || !this.container || !this.getProjection()) return;
            const proj = this.getProjection();
            const state = S.get;
            this.container.innerHTML = '';
            const seenCoords = new Set();
            (state.zones || []).forEach(z => {
                if (!z.lat || !z.lng) return;
                // Dedupe: skip if we already rendered a marker at this exact position
                const coordKey = z.lat.toFixed(6) + ',' + z.lng.toFixed(6);
                if (seenCoords.has(coordKey)) return;
                seenCoords.add(coordKey);
                const priceLabel = z.display_label || (typeof z.price === 'number'
                    ? z.price.toFixed(2).replace('.', ',')
                    : String(z.price));
                const priceText = z.price === 0 ? 'Free' : '€ ' + priceLabel.substring(0, 6);
                const isSelected = (z.uid && z.uid === state.selectedZone) || (z.id && String(z.id) === String(state.selectedZone));
                const pt = proj.fromLatLngToDivPixel(new google.maps.LatLng(z.lat, z.lng));
                if (!pt) return;
                const el = document.createElement('div');
                el.className = 'q8-price-marker' + (isSelected ? ' q8-price-marker--selected' : '');
                el.textContent = priceText;
                const addr = (z.street ? z.street + (z.houseNumber ? ' ' + z.houseNumber : '') + (z.city ? ', ' + z.city : '') : null) || 'Zone ' + (z.id || z.uid);
                el.title = addr + ' - € ' + priceLabel;
                el.style.left = pt.x + 'px';
                el.style.top = pt.y + 'px';
                const zoneData = { uid: z.uid, zone: z.id, price: z.price, rates: z.rates };
                el.addEventListener('click', function(e) {
                    e.stopPropagation();
                    if (Q8.Services && Q8.Services.tryOpenOverlay) {
                        Q8.Services.tryOpenOverlay('sheet-zone', zoneData);
                    }
                });
                this.container.appendChild(el);
            });
        };
        PriceMarkersOverlay.prototype.onRemove = function() {
            if (this.container && this.container.parentNode) {
                this.container.parentNode.removeChild(this.container);
            }
        };
        return new PriceMarkersOverlay();
    }

    function renderMapMarkers() {
        if (!map || typeof google === 'undefined' || !google.maps) return;
        if (!priceMarkersOverlay) {
            priceMarkersOverlay = createPriceMarkersOverlay();
            priceMarkersOverlay.setMap(map);
            google.maps.event.addListener(map, 'idle', function() { if (priceMarkersOverlay) priceMarkersOverlay.draw(); });
            google.maps.event.addListener(map, 'bounds_changed', function() { if (priceMarkersOverlay) priceMarkersOverlay.draw(); });
        }
        priceMarkersOverlay.draw();
    }

    function updateMarkerSelection() {
        if (priceMarkersOverlay) priceMarkersOverlay.draw();
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
        renderCarSpecs,
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
