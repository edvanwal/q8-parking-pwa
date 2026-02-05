/**
 * Q8 Parking PWA - Hardened State Machine (Fase 4: Default Workflow)
 *
 * AUTHORITATIVE STATEModel:
 * - screen: 'parking' | 'history' | 'plates'
 * - activeOverlay: null | overlayId
 * - session: null | { zone, start, end }
 * - selectedZone: null | zoneId
 * - plates: [] | Array of { id, text, description, default }
 * - selectedPlateId: null | string (id of selected plate in plates view)
 */

// DEBUG: On-Screen Console & Global Error Handler
// This allows the user to see logs and errors directly on the screen.
(function initDebugUI() {
  // 1. Create Overlay
  const debugEl = document.createElement('div');
  debugEl.id = 'debug-console';
  debugEl.style.cssText = `
        position: fixed; bottom: 0; left: 0; right: 0; height: 150px;
        background: rgba(0,0,0,0.85); color: #0f0; font-family: monospace;
        font-size: 10px; padding: 8px; z-index: 99999; overflow-y: auto;
        pointer-events: none; /* Let clicks pass through initially */
        display: block; // Always visible for now
    `;

  // 2. Control Bar (Reset Button)
  const controls = document.createElement('div');
  controls.style.cssText = `
        position: fixed; bottom: 155px; left: 10px; z-index: 99999;
        display: flex; gap: 10px; pointer-events: auto;
    `;
  const btnReset = document.createElement('button');
  btnReset.innerText = '🛑 FORCE RESET APP';
  btnReset.style.cssText =
    'background: red; color: white; padding: 8px 12px; border: none; font-weight: bold; border-radius: 4px; box-shadow: 0 2px 10px rgba(0,0,0,0.5);';
  btnReset.onclick = () => {
    if (confirm('Confirm Hard Reset? This clears all local data.')) {
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload();
    }
  };

  // Toggle Log Visibility
  const btnToggle = document.createElement('button');
  btnToggle.innerText = '👁️ LOGS';
  btnToggle.style.cssText =
    'background: #333; color: white; padding: 8px 12px; border: none; font-weight: bold; border-radius: 4px; box-shadow: 0 2px 10px rgba(0,0,0,0.5);';
  btnToggle.onclick = () => {
    debugEl.style.display = debugEl.style.display === 'none' ? 'block' : 'none';
  };

  controls.appendChild(btnReset);
  controls.appendChild(btnToggle);
  document.body
    ? document.body.appendChild(controls)
    : document.addEventListener('DOMContentLoaded', () => document.body.appendChild(controls));
  document.body
    ? document.body.appendChild(debugEl)
    : document.addEventListener('DOMContentLoaded', () => document.body.appendChild(debugEl));

  // 3. Logger Function
  const logToUI = (type, args) => {
    const line = document.createElement('div');
    line.style.borderBottom = '1px solid #333';
    line.style.padding = '2px 0';
    if (type === 'error') line.style.color = '#ff5555';
    if (type === 'warn') line.style.color = '#ffaa00';

    const msg = args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
    line.textContent = `[${new Date().toLocaleTimeString()}] ${type.toUpperCase()}: ${msg}`;
    debugEl.prepend(line); // Newest top
  };

  // 4. Override Console
  const origLog = console.log;
  const origErr = console.error;
  const origWarn = console.warn;

  console.log = (...args) => {
    origLog.apply(console, args);
    logToUI('info', args);
  };
  console.error = (...args) => {
    origErr.apply(console, args);
    logToUI('error', args);
  };
  console.warn = (...args) => {
    origWarn.apply(console, args);
    logToUI('warn', args);
  };

  // 5. Global Error
  window.onerror = function (msg, url, line, col, error) {
    logToUI('error', [`UNCATCHABLE: ${msg} @ ${line}:${col}`]);
    return false;
  };

  console.log('Debug System Initialized v2.4');
})();

const state = {
  screen: 'login', // 'login' | 'register' | 'parking' | 'history' | 'plates'
  language: 'en', // 'nl' | 'en'
  rememberMe: false,
  passwordVisible: false,
  infoBanner: null, // { type: 'info', text: string, dismissible: boolean }
  activeOverlay: null,
  session: null, // Start on fresh load with null
  selectedZone: null, // De momenteel geselecteerde zone (door klik op marker)
  selectedZoneRate: 2.0, // Default uurtarief
  searchMode: 'zone', // 'zone' | 'address'
  searchQuery: '', // Current input in search bar
  duration: 120, // Selectie-duur in minuten
  zones: [
    // Dummy data for search results
    { id: '1000', name: 'Amsterdam City Center' },
    { id: '1001', name: 'Old West' },
    { id: '1002', name: 'Jordan' },
    { id: '1100', name: 'Center (Current)' },
    { id: '2000', name: 'Schiphol Airport' },
    { id: '3000', name: 'Rotterdam' },
  ],
  // State "live" in localStorage, fallback naar 1 default
  plates: [],
  selectedPlateId: null, // Track currently selected plate in list
  history: [
    {
      zone: '1100',
      plate: '1-ABC-123',
      start: '10:00',
      end: '12:00',
      date: 'Today',
      price: '4.00',
      street: 'Kerkstraat',
    },
    {
      zone: '2200',
      plate: '2-XYZ-999',
      start: '09:00',
      end: '10:00',
      date: 'Yesterday',
      price: '2.00',
      street: 'Stationsplein',
    },
  ],
  installMode: {
    active: false,
    platform: 'ios',
    language: 'en',
  },
};

// --- FIREBASE INITIALIZATION ---
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Global variables
let map;
let gMarkers = [];
let google; // Defined when maps loads

// Sync Auth State
auth.onAuthStateChanged((user) => {
  if (user) {
    console.log('Firebase User Logged In:', user.email);
    // If logged in, ensure we are not on login/register screens
    if (state.screen === 'login' || state.screen === 'register') {
      setScreen('parking');
    }
  } else {
    console.log('No Firebase User');
    // Always return to login if not authenticated
    if (state.screen !== 'register') {
      setScreen('login');
    }
  }
});

// --- PERSISTENCE ---

// --- PERSISTENCE ---

function loadState() {
  // 1. Session
  const savedSession = localStorage.getItem('q8_parking_session');
  if (savedSession) {
    try {
      const parsed = JSON.parse(savedSession);
      if (parsed) {
        parsed.start = new Date(parsed.start);
        parsed.end = new Date(parsed.end);
      }
      state.session = parsed;
    } catch (e) {
      state.session = null;
    }
  }

  // 2. Plates
  const savedPlates = localStorage.getItem('q8_plates_v1');
  if (savedPlates) {
    try {
      state.plates = JSON.parse(savedPlates);
    } catch (e) {
      state.plates = [];
    }
  }

  // Seed default if empty
  if (state.plates.length === 0) {
    state.plates = [{ id: '1-ABC-123', text: '1-ABC-123', description: 'Lease', default: true }];
    savePlates(); // Persist initial seed
  }
}

function loadZones() {
  return new Promise((resolve, reject) => {
    console.log('Setting up Firestore zones listener...');
    // Use a real-time listener for "zones"
    db.collection('zones')
      .limit(2000)
      .onSnapshot(
        (snapshot) => {
          const zones = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            // Firestore might return lat/lng as strings if pushed via certain tools,
            // but we expect numbers.
            zones.push({
              ...data,
              uid: doc.id, // Capture unique Firestore ID
              lat: parseFloat(data.lat),
              lng: parseFloat(data.lng),
              price: parseFloat(data.price),
            });
          });

          if (zones.length > 0) {
            state.zones = zones;
            console.log(`Live sync: ${zones.length} zones loaded from Firestore.`);

            // Trigger UI refreshes that depend on zones
            renderMapMarkers();
            centerMapOnZones();
            renderSearchResults();
          }
          resolve(zones);
        },
        (error) => {
          console.error('Firestore zones sync error:', error);
          reject(error);
        }
      );
  });
}

function saveState() {
  localStorage.setItem('q8_parking_session', JSON.stringify(state.session));
}

function savePlates() {
  localStorage.setItem('q8_plates_v1', JSON.stringify(state.plates));
}

// --- CORE RENDERER ---

function updateUI() {
  // 1. Screens
  const activeViewId = `view-${state.screen === 'parking' ? 'map' : state.screen}`;
  document.querySelectorAll('.screen').forEach((el) => {
    el.style.display = el.id === activeViewId ? 'flex' : 'none';
    el.classList.toggle('hidden', el.id !== activeViewId);
  });

  // 2. Overlays
  document.querySelectorAll('.overlay-backdrop').forEach((el) => {
    const isOpen = el.id === state.activeOverlay;
    el.classList.toggle('open', isOpen);
  });

  // 3. Parking View (Map Interaction & UI Overlays)
  if (state.screen === 'parking') {
    const isActive = state.session !== null;
    const idleSearch = document.getElementById('ui-idle-search');
    const activeParking = document.getElementById('ui-active-parking');

    // --- PERSONALIZATION: Greeting ---
    const greetingEl = document.getElementById('personal-greeting');
    console.log('Rendering Greeting? Active:', isActive, 'Element:', greetingEl);

    if (greetingEl && !isActive) {
      const h = new Date().getHours();
      let greet = 'Hello';
      let sub = 'Ready to park?';
      const name = 'Edwin'; // Hardcoded personalization for demo

      if (h < 12) {
        greet = 'Good morning';
        sub = 'Have a productive day!';
      } else if (h < 18) {
        greet = 'Good afternoon';
        sub = 'Hope your day is going well.';
      } else {
        greet = 'Good evening';
        sub = 'Enjoy your evening.';
      }

      // Random variation
      const randoms = ['Time to park easier.', 'Smooth parking ahead.', 'Find your spot.'];
      if (Math.random() > 0.7) sub = randoms[Math.floor(Math.random() * randoms.length)];

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

    // Explicitly handle Active Parking and Idle Search visibility
    if (idleSearch) idleSearch.style.display = isActive ? 'none' : 'block';
    if (activeParking) activeParking.style.display = isActive ? 'block' : 'none';

    // Marker interactie status (gebaseerd op session)
    document.querySelectorAll('.marker').forEach((m) => {
      // Markers zijn altijd zichtbaar op parking screen,
      // maar alleen klikbaar als er GEEN sessie loopt.
      m.style.cursor = isActive ? 'default' : 'pointer';
      m.style.opacity = isActive ? '0.6' : '1';
    });

    if (isActive && state.session) {
      const fmt = (d) =>
        `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
      const elZoneLabel = document.getElementById('active-zone-label');
      if (elZoneLabel) {
        // Lookup display ID from UID if possible, otherwise rely on stored session data
        const z = state.zones.find((z) => z.uid === state.session.zoneUid);
        elZoneLabel.innerText = z ? z.id : state.session.zone;
      }

      // Gebruik het geselecteerde kenteken, anders de default, anders de eerste
      const selPlate =
        state.plates.find((p) => p.id === state.selectedPlateId) ||
        state.plates.find((p) => p.default) ||
        state.plates[0];
      const elLabel = document.getElementById('active-plate-label');
      if (elLabel && selPlate) elLabel.innerText = selPlate.text;

      const elStart = document.getElementById('lbl-start');
      const elEnd = document.getElementById('lbl-end');
      if (elStart) elStart.innerText = fmt(state.session.start);
      if (elEnd) elEnd.innerText = fmt(state.session.end);
    }

    // Zone sheet data synchroniseren als geselecteerd
    if (state.selectedZone) {
      // selectedZone is now a UID
      const zone = state.zones.find((z) => z.uid === state.selectedZone);

      if (zone) {
        const elZoneId = document.getElementById('details-zone-id');
        // Display Logical ID + City + Metadata
        if (elZoneId) {
          const maxDurLabel =
            zone.max_duration_mins && zone.max_duration_mins < 1440
              ? `${Math.floor(zone.max_duration_mins / 60)}h ${zone.max_duration_mins % 60}m limit`
              : 'Max 24h';

          const holidayWarning = zone.has_special_rules
            ? `<div style="color: #f59e0b; font-size: 0.8em; margin-top: 4px; display: flex; align-items: center; gap: 4px;">
                             <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                             <span>Holiday rules apply</span>
                           </div>`
            : '';

          elZoneId.innerHTML = `
                        <div class="flex flex-col">
                            <div class="flex items-center gap-2">
                                <span>ZONE ${zone.id}</span>
                                <span style="font-size: 0.7em; background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px;">${maxDurLabel}</span>
                            </div>
                            <span style="font-size: 0.7em; font-weight: 500; opacity: 0.8; margin-top: -2px;">${zone.city || ''}</span>
                            ${holidayWarning}
                        </div>
                    `;
        }

        // Gebruik het geselecteerde kenteken, anders de default, anders de eerste
        const selPlate =
          state.plates.find((p) => p.id === state.selectedPlateId) ||
          state.plates.find((p) => p.default) ||
          state.plates[0];
        const elPlate = document.getElementById('details-plate');
        if (elPlate && selPlate) {
          // Preserve the icon, only update the text
          elPlate.innerHTML = `
                        <span class="no-pointer">${selPlate.text}</span>
                        <svg class="no-pointer" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>
                    `;
        }

        // Render detailed rates
        const list = document.getElementById('details-rates-list');
        if (list) {
          // Filter rates to show only today's rates or 'Dagelijks'
          const daysNL = [
            'Zondag',
            'Maandag',
            'Dinsdag',
            'Woensdag',
            'Donderdag',
            'Vrijdag',
            'Zaterdag',
          ];
          const todayNL = daysNL[new Date().getDay()];

          let filteredRates = (state.selectedZoneRates || []).filter((r) => {
            const timeStr = (r.time || '').toLowerCase();
            const todayLower = todayNL.toLowerCase();
            return (
              timeStr.includes(todayLower) ||
              timeStr.includes('dagelijks') ||
              timeStr.includes('daily') ||
              timeStr === '24/7' ||
              timeStr.includes('check zone')
            );
          });

          // Sort by start time
          filteredRates.sort((a, b) => {
            const getStart = (str) => {
              const match = str.match(/(\d{1,2}):(\d{2})/);
              return match ? parseInt(match[1]) * 100 + parseInt(match[2]) : 0;
            };
            return getStart(a.time) - getStart(b.time);
          });

          // De-duplicate by time and price to prevent clutter
          const uniqueRates = [];
          const seenKeys = new Set();
          filteredRates.forEach((r) => {
            const key = `${r.time}|${r.price}`;
            if (!seenKeys.has(key)) {
              seenKeys.add(key);
              uniqueRates.push(r);
            }
          });

          // If no rates found for today, show a message instead of the full list
          let ratesToRender = uniqueRates;
          if (ratesToRender.length === 0) {
            ratesToRender = [{ time: `Geen tarieven voor ${todayNL}`, price: '', detail: '' }];
          }

          list.innerHTML = '';
          ratesToRender.forEach((r) => {
            const item = document.createElement('div');
            item.className = 'rate-item';

            // Clean up time string (Remove Day Name)
            const todayRegex = new RegExp(todayNL, 'gi');
            let displayTime = r.time
              .replace(todayRegex, '')
              .replace(/Dagelijks/gi, '')
              .replace(/Daily/gi, '')
              .trim();

            const displayPrice = typeof r.price === 'string' ? r.price.replace('.', ',') : r.price;

            // Logic for Free Parking text
            const isFree =
              displayPrice.toLowerCase().includes('gratis') ||
              displayPrice.toLowerCase().includes('free');
            const priceColor = isFree ? '#10b981' : 'var(--q8-blue)';
            const finalPriceLabel = isFree ? 'Free parking' : displayPrice;

            item.innerHTML = `
                            <div class="rate-dot"></div>
                            <div class="rate-info">
                                <span class="rate-time" style="font-weight: 700; color: var(--text-primary); font-size: 1rem;">${displayTime}</span>
                            </div>
                            <span class="rate-price" style="font-weight: 700; color: ${priceColor}; font-size: 1rem;">${finalPriceLabel}</span>
                        `;
            list.appendChild(item);
          });
        }
      }
    }

    // Search Mode UI
    const inpSearch = document.getElementById('inp-search');
    const btnToggle = document.getElementById('btn-search-toggle');
    if (inpSearch && btnToggle) {
      const isZone = state.searchMode === 'zone';
      inpSearch.placeholder = isZone ? 'Search by parking zone ...' : 'Search by address ...';
      btnToggle.innerText = isZone ? 'Zone' : 'Address';

      // Sync input value with state ONLY if focused (to avoid jumping cursor)
      if (document.activeElement !== inpSearch) {
        inpSearch.value = state.searchQuery;
      }
    }

    // Render Search Results Panel
    renderSearchResults();
  }

  // 4. Content Lists
  if (state.screen === 'plates') {
    renderPlates();
    // Update Add Plate Button Text
    const btnAdd = document.querySelector('[data-target="modal-add-plate"] span');
    if (btnAdd) {
      btnAdd.innerText =
        state.language === 'nl' ? 'Nieuw kenteken toevoegen' : 'Add new license plate';
    }
  }
  if (state.screen === 'history') renderHistory();
  if (state.screen === 'login') renderLoginUI();
  if (state.screen === 'register') renderRegisterUI();
}

function renderRegisterUI() {
  // Placeholder for future logic
}

function renderLoginUI() {
  // Language buttons
  document.querySelectorAll('.lang-btn').forEach((btn) => {
    const lang = btn.getAttribute('data-lang');
    const isActive = state.language === lang;
    btn.className = isActive ? 'btn btn-primary lang-btn' : 'btn btn-outline lang-btn';
  });

  // Checkbox
  const cb = document.querySelector('.custom-checkbox');
  if (cb) cb.classList.toggle('checked', state.rememberMe);

  // Password Eye
  const inpPass = document.getElementById('inp-password');
  if (inpPass) {
    inpPass.type = state.passwordVisible ? 'text' : 'password';
  }
}

// --- DEFENSIVE HANDLERS ---

function setScreen(name) {
  state.screen = name;
  state.activeOverlay = null;
  state.selectedZone = null;
  if (name === 'plates') state.selectedPlateId = null; // Reset selection on entry
  updateUI();

  // Leaflet/Google Map Fix: Refresh map when switching to parking view
  if (name === 'parking') {
    if (typeof map !== 'undefined' && map) {
      // Use requestAnimationFrame to ensure DOM is painted
      requestAnimationFrame(() => {
        google.maps.event.trigger(map, 'resize');
        centerMapOnZones();
      });
    } else if (!state.installMode.active) {
      // Ensure map is initialized if it's not yet
      initGoogleMap();
    }
  }
}

function tryOpenOverlay(id, contextData = null) {
  // State Guard: Blokkeer overlap, behalve voor toegestane transities (Menu, Plate Selector, Zone Sheet)
  const allowedSwitches = ['menu-overlay', 'sheet-plate-selector', 'sheet-zone'];
  if (state.activeOverlay && state.activeOverlay !== id && !allowedSwitches.includes(id)) {
    return;
  }

  if (id === 'sheet-zone') {
    if (state.session !== null) return; // Geen actie als sessie loopt
    if (contextData && contextData.uid) {
      // Expect UID here
      state.selectedZone = contextData.uid;
      state.selectedZoneRate = contextData.price || 2.0;

      // Ensure rates are passed or nulled out to force default re-render if missing
      state.selectedZoneRates =
        contextData.rates && contextData.rates.length > 0 ? contextData.rates : null;

      state.duration = 120;
      updateDurationUI();
    }
  }

  // Context guards
  if (id === 'modal-confirm' && state.session === null) return;
  if (id === 'modal-add-plate' && state.screen !== 'plates') return;
  if (id === 'sheet-filter' && state.screen !== 'history') return;

  state.activeOverlay = id;
  updateUI();

  // Auto-focus logic for modals
  if (id === 'modal-add-plate') {
    setTimeout(() => {
      const inp = document.getElementById('inp-plate');
      if (inp) {
        inp.value = '';
        inp.focus();
      } // Clear & Focus
      const modal = document.getElementById('modal-add-plate');
      const inpDesc = modal ? modal.querySelectorAll('input')[1] : null;
      if (inpDesc) inpDesc.value = '';
    }, 100);
  }
}

function handleStartParking() {
  if (state.session || !state.selectedZone || state.activeOverlay !== 'sheet-zone') return;

  const zone = state.zones.find((z) => z.uid === state.selectedZone);
  const now = new Date();
  state.session = {
    zone: zone ? zone.id : 'Unknown', // Store display ID
    zoneUid: state.selectedZone, // Store unique ID for re-linking
    start: now,
    end: new Date(now.getTime() + state.duration * 60000),
  };

  state.activeOverlay = null;
  state.selectedZone = null;
  saveState();
  updateUI();
  showToast('Parking session started');
}

function handleEndParking() {
  if (!state.session) return;
  state.session = null;
  state.activeOverlay = null;
  saveState();
  updateUI();
  showToast('Parking session ended');
}

/**
 * Robust Plate Adding Implementation
 * Checks: Not empty, Max Length, Regex (A-Z0-9-), Duplicates
 */
function saveNewPlate() {
  const inp = document.getElementById('inp-plate');
  const rawVal = inp.value.trim().toUpperCase();

  // Find description input (it has no ID, so we find it within the modal)
  // It's the second input in the modal-add-plate container
  const modal = document.getElementById('modal-add-plate');
  const inpDesc = modal ? modal.querySelectorAll('input')[1] : null;
  const description = inpDesc ? inpDesc.value.trim() : '';

  // 1. Basic Validation
  if (!rawVal) {
    showToast('Please enter a license plate');
    return;
  }
  if (rawVal.length > 12) {
    showToast('License plate too long (max 12)');
    return;
  }

  // 2. Regex Validation (Alphanumeric + dash)
  const validRegex = /^[A-Z0-9-]+$/;
  if (!validRegex.test(rawVal)) {
    showToast('Invalid characters. Use A-Z, 0-9 and -');
    return;
  }

  // 3. Duplicate Check
  const exists = state.plates.some((p) => p.text === rawVal);
  if (exists) {
    showToast('License plate already exists');
    return;
  }

  // 4. Default Logic (First one is default)
  const isFirst = state.plates.length === 0;

  // 5. Add & Save
  state.plates.push({
    id: rawVal,
    text: rawVal,
    description: description, // Explicitly save description
    default: isFirst,
  });

  savePlates(); // Persist

  // 6. Cleanup & UI
  inp.value = '';
  if (inpDesc) inpDesc.value = ''; // Clear description too
  state.activeOverlay = null;
  updateUI();
  showToast('License plate added');
}

function deletePlate(id) {
  // Find plate to delete
  const plateIdx = state.plates.findIndex((p) => p.id == id || p.text == id); // Loose equality for ID types
  if (plateIdx === -1) return;

  const wasDefault = state.plates[plateIdx].default;

  // Remove
  state.plates.splice(plateIdx, 1);

  // Handle Default fallback
  if (wasDefault && state.plates.length > 0) {
    state.plates[0].default = true;
  }

  // If selected plate was deleted, clear selection
  if (state.selectedPlateId === id) {
    state.selectedPlateId = null;
  }

  savePlates(); // Persist
  renderPlates(); // Re-render list
  updateUI(); // Propagate label changes
  showToast('License plate deleted');
}

/**
 * Validates and sets default plate
 * User explicitly clicks "MAKE SELECTED PLATE DEFAULT"
 */
function setDefaultPlate() {
  if (!state.selectedPlateId) return;

  // Reset all
  state.plates.forEach((p) => (p.default = false));

  // Set new default
  const target = state.plates.find((p) => p.id === state.selectedPlateId);
  if (target) {
    target.default = true;
    savePlates();
    state.selectedPlateId = null; // Clear selection after action? Or keep it? Requirement: "clear selectie"
    renderPlates();
    updateUI(); // Propagate label changes
    showToast('Default plate updated');
  }
}

// --- EVENT DELEGATION (FIXED) ---

document.body.addEventListener('click', (e) => {
  // 1. Try to find a data-action element
  const target = e.target.closest('[data-action]');

  // 2. Handle Backdrop Clicks (Close Overlay) safely
  if (e.target.classList.contains('overlay-backdrop')) {
    state.activeOverlay = null;
    updateUI();
    return;
  }

  if (!target) return;

  // 3. BUBBLING GUARD
  if (target.classList.contains('overlay-backdrop') && e.target !== target) {
    return;
  }

  const action = target.getAttribute('data-action');
  const targetId = target.getAttribute('data-target');

  switch (action) {
    case 'nav-to':
      setScreen(targetId);
      break;
    case 'toggle-search-mode':
      const newMode = state.searchMode === 'zone' ? 'address' : 'zone';
      state.searchMode = newMode;
      state.searchQuery = '';
      updateUI();
      const inp = document.getElementById('inp-search');
      if (inp) {
        inp.value = '';
        inp.focus();
      }
      break;

    case 'open-plate-selector':
      renderQuickPlateSelector();
      tryOpenOverlay('sheet-plate-selector');
      break;

    case 'select-quick-plate':
      state.selectedPlateId = target.getAttribute('data-id');
      updateUI(); // Updates global state
      tryOpenOverlay('sheet-zone', {
        uid: state.selectedZone, // Preserve logic
      });
      break;

    case 'open-overlay':
      const context = {
        uid: target.getAttribute('data-zone-uid'),
        price: parseFloat(target.getAttribute('data-price')),
        rates: JSON.parse(target.getAttribute('data-rates') || 'null'),
      };
      tryOpenOverlay(targetId, context);
      break;

    case 'close-overlay':
      // Explicit close button click
      state.activeOverlay = null;
      updateUI();
      break;

    case 'mod-duration':
      if (state.activeOverlay === 'sheet-zone') {
        const delta = parseInt(target.getAttribute('data-delta'));
        state.duration = Math.max(15, state.duration + delta);
        updateDurationUI();
      }
      break;

    case 'start-session':
      handleStartParking();
      break;
    case 'confirm-end':
      handleEndParking();
      break;
    case 'save-plate':
      saveNewPlate();
      break;

    case 'delete-plate':
      const id = target.getAttribute('data-id');
      deletePlate(id);
      break;

    case 'select-plate':
      // New selection logic
      const selId = target.getAttribute('data-id');
      // Toggle off if already selected? Or just set? Requirement: "Selectie..."
      // Usually selection is just set.
      if (state.selectedPlateId === selId)
        state.selectedPlateId = null; // Toggle
      else state.selectedPlateId = selId;
      renderPlates();
      updateUI(); // Propagate label changes
      break;

    case 'set-default-plate':
      setDefaultPlate();
      break;

    case 'select-zone':
      // This is triggered from Search Results
      state.selectedZone = target.getAttribute('data-zone-uid');
      state.searchQuery = '';
      state.activeOverlay = 'sheet-zone';
      clearInfo();
      const sInp = document.getElementById('inp-search');
      if (sInp) sInp.value = '';

      // Pan Map to selected zone
      const zone = state.zones.find((z) => z.uid === state.selectedZone);
      if (zone && map) {
        map.panTo({ lat: zone.lat, lng: zone.lng });
        map.setZoom(16);
      }

      updateUI();
      updateDurationUI();
      break;

    case 'close-info-banner':
      clearInfo();
      updateUI();
      break;

    case 'set-lang':
      state.language = target.getAttribute('data-lang');
      updateUI();
      break;
    case 'set-gate-lang':
      state.installMode.language = target.getAttribute('data-lang');
      renderInstallGate();
      break;
    case 'toggle-password':
      state.passwordVisible = !state.passwordVisible;
      updateUI();
      break;
    case 'toggle-remember':
      state.rememberMe = !state.rememberMe;
      updateUI();
      break;
    case 'login':
      const email = document.getElementById('inp-email')?.value;
      const password = document.getElementById('inp-password')?.value;

      if (!email || !password) {
        showToast('Please enter email and password', 'error');
        return;
      }

      // UI Feedback
      const loginBtn = target;
      const originalText = loginBtn.innerText;
      loginBtn.innerText = 'SIGNING IN...';
      loginBtn.disabled = true;

      auth
        .signInWithEmailAndPassword(email, password)
        .then(() => {
          saveState(); // UpdateUI is handled by onAuthStateChanged
        })
        .catch((err) => {
          console.error('Login Error:', err);
          showToast(err.message, 'error');
        })
        .finally(() => {
          loginBtn.innerText = originalText;
          loginBtn.disabled = false;
        });
      break;

    case 'logout':
      auth.signOut().then(() => {
        state.activeOverlay = null;
        state.session = null;
        localStorage.removeItem('q8_parking_session');
        updateUI();
      });
      break;

    case 'register':
      const regEmail = document.getElementById('reg-email')?.value;
      const regPass = document.getElementById('reg-password')?.value;
      const regPassConfirm = document.getElementById('reg-password-confirm')?.value;

      if (!regEmail || !regPass) {
        showToast('Please fill in all fields', 'error');
        return;
      }

      if (regPass !== regPassConfirm) {
        showToast('Passwords do not match', 'error');
        return;
      }

      const regBtn = target;
      regBtn.innerText = 'CREATING ACCOUNT...';
      regBtn.disabled = true;

      auth
        .createUserWithEmailAndPassword(regEmail, regPass)
        .then(() => {
          saveState();
        })
        .catch((err) => {
          console.error('Registration Error:', err);
          showToast(err.message, 'error');
        })
        .finally(() => {
          regBtn.innerText = 'REGISTER';
          regBtn.disabled = false;
        });
      break;
  }
});

// Event Listener voor Search Input
document.getElementById('inp-search')?.addEventListener('input', (e) => {
  state.searchQuery = e.target.value;
  clearInfo();
  renderSearchResults();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    state.activeOverlay = null;
    updateUI();
  }
});

function updateDurationUI() {
  const h = Math.floor(state.duration / 60);
  const m = state.duration % 60;
  const elDur = document.getElementById('val-duration');
  if (elDur) elDur.innerText = `${h}h ${m.toString().padStart(2, '0')}m`;
}

function renderPlates() {
  // ... [No changes needed in renderPlates itself, just the load logic changed data]
  const list = document.getElementById('list-plates');
  const btnSetDefault = document.getElementById('btn-set-default');

  if (!list) return;
  list.innerHTML = '';

  const sorted = [...state.plates].sort((a, b) => a.text.localeCompare(b.text));
  let selectionValid = false;

  sorted.forEach((p) => {
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
                     <svg class="no-pointer" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                </button>
            </div>
        `;
    div.querySelector('.ptr-enabled').style.pointerEvents = 'auto';
    list.appendChild(div);

    if (isSelected && !p.default) {
      selectionValid = true;
    }
  });

  if (btnSetDefault) {
    btnSetDefault.disabled = !selectionValid;
  }
}

function renderQuickPlateSelector() {
  const list = document.getElementById('quick-plate-list');
  if (!list) return;
  list.innerHTML = '';

  const activePlateId =
    state.selectedPlateId || (state.plates.find((p) => p.default) || state.plates[0])?.id;

  state.plates.forEach((p) => {
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
  const list = document.getElementById('list-history');
  if (!list) return;
  list.innerHTML = '';
  state.history.forEach((h) => {
    const div = document.createElement('div');
    div.className = 'card mb-md';
    div.innerHTML = `
            <div class="flex justify-between items-center mb-sm">
               <span class="font-bold text-lg">${h.plate}</span>
               <div class="zone-badge-box">
                  <span class="icon-p" style="width: 28px; height: 28px; font-size: 0.8rem;">P</span>
                  <span style="padding: 0 8px; font-size: 0.85rem; font-weight: 700;">${h.zone}</span>
               </div>
            </div>
            <div class="text-secondary text-sm mb-md">${h.street}</div>
            <div class="flex justify-between items-end" style="border-top:1px solid var(--border); padding-top:16px;">
               <div>
                  <div class="text-secondary text-xs uppercase font-bold">${h.date}</div>
                  <div class="font-bold">${h.start} - ${h.end}</div>
               </div>
               <div class="font-bold text-lg">€ ${h.price.replace('.', ',')}</div>
            </div>
        `;
    list.appendChild(div);
  });
}

function renderSearchResults() {
  const container = document.getElementById('ui-search-results');
  if (!container) return;

  const shouldShow =
    state.screen === 'parking' &&
    state.searchMode === 'zone' &&
    state.searchQuery.length >= 2 &&
    state.activeOverlay === null;

  if (!shouldShow) {
    container.innerHTML = '';
    container.className = 'hidden';
    container.style.display = 'none';
    return;
  }

  const query = state.searchQuery.toLowerCase();

  // Sort logic: exact matches first, then partials
  const matches = state.zones
    .filter((z) => z.id.includes(query) || z.name.toLowerCase().includes(query))
    .sort((a, b) => {
      const aExact = a.id === query;
      const bExact = b.id === query;
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;

      // Secondary sort: city
      if (a.city && b.city) return a.city.localeCompare(b.city);
      return 0;
    });

  if (matches.length === 0) {
    container.innerHTML = '';
    container.className = 'hidden';
    container.style.display = 'none';
    return;
  }

  container.className = 'search-results-panel';
  container.style.display = 'block';

  // Use UID for data-Action
  container.innerHTML = matches
    .map(
      (z) => `
        <div class="search-result-item" data-action="open-overlay" data-target="sheet-zone"
             data-zone-uid="${z.uid}"
             data-price="${z.price}"
             data-rates='${JSON.stringify(z.rates || [])}'>
            <div class="flex items-center" style="gap: 12px; width: 100%;">
                <div class="zone-badge-box no-pointer" style="height: 28px; min-width: 60px;">
                    <span class="icon-p no-pointer" style="width: 28px; height: 28px; font-size: 0.8rem;">P</span>
                    <span class="no-pointer" style="padding: 0 8px; font-size: 0.85rem; font-weight: 700;">${z.id}</span>
                </div>
                <div class="flex flex-col no-pointer" style="overflow: hidden;">
                     <span class="zone-name no-pointer text-truncate" style="font-weight: 600;">${z.city || ''}</span>
                     <span class="zone-name no-pointer text-truncate" style="font-size: 0.8rem; color: var(--text-secondary);">${z.name}</span>
                </div>
                <div class="no-pointer" style="margin-left: auto; font-weight: 700; font-size: 0.9rem; color: var(--q8-blue);">€ ${z.price.toFixed(2).replace('.', ',')}</div>
            </div>
        </div>
    `
    )
    .join('');
}

function renderMapMarkers() {
  if (!map) return;

  // Clear existing google markers
  gMarkers.forEach((m) => m.setMap(null));
  gMarkers = [];

  state.zones.forEach((z) => {
    const priceLabel =
      typeof z.price === 'number' ? `€ ${z.price.toFixed(2).replace('.', ',')}` : z.price;

    // Create custom marker element
    const markerEl = document.createElement('div');
    markerEl.className = 'custom-map-marker';
    markerEl.innerHTML = `
            <div class="marker" style="position:relative; transform:none; top:0; left:0;">
                 <div class="marker-content"><span class="marker-label">${priceLabel}</span></div>
                 <div class="marker-pin"></div>
            </div>
        `;

    let marker;
    if (google.maps.marker && google.maps.marker.AdvancedMarkerElement) {
      marker = new google.maps.marker.AdvancedMarkerElement({
        map: map,
        position: { lat: z.lat, lng: z.lng },
        content: markerEl,
        title: `Zone ${z.id} (${z.city || ''})`,
      });
    } else {
      marker = new google.maps.Marker({
        position: { lat: z.lat, lng: z.lng },
        map: map,
        title: `Zone ${z.id} (${z.city || ''})`,
      });
    }

    marker.addListener('click', () => {
      tryOpenOverlay('sheet-zone', {
        uid: z.uid,
        price: z.price,
        rates: z.rates,
      });
    });

    gMarkers.push(marker);
  });
}

function saveState() {
  localStorage.setItem('q8_parking_session', JSON.stringify(state.session));
}

function savePlates() {
  localStorage.setItem('q8_plates_v1', JSON.stringify(state.plates));
}

// --- CORE RENDERER ---

function updateUI() {
  // 1. Screens
  const activeViewId = `view-${state.screen === 'parking' ? 'map' : state.screen}`;
  document.querySelectorAll('.screen').forEach((el) => {
    el.style.display = el.id === activeViewId ? 'flex' : 'none';
    el.classList.toggle('hidden', el.id !== activeViewId);
  });

  // 2. Overlays
  document.querySelectorAll('.overlay-backdrop').forEach((el) => {
    const isOpen = el.id === state.activeOverlay;
    el.classList.toggle('open', isOpen);
  });

  // 3. Parking View (Map Interaction & UI Overlays)
  if (state.screen === 'parking') {
    const isActive = state.session !== null;
    const idleSearch = document.getElementById('ui-idle-search');
    const activeParking = document.getElementById('ui-active-parking');

    // Explicitly handle Active Parking and Idle Search visibility
    if (idleSearch) idleSearch.style.display = isActive ? 'none' : 'block';
    if (activeParking) activeParking.style.display = isActive ? 'block' : 'none';

    // Marker interactie status (gebaseerd op session)
    document.querySelectorAll('.marker').forEach((m) => {
      // Markers zijn altijd zichtbaar op parking screen,
      // maar alleen klikbaar als er GEEN sessie loopt.
      m.style.cursor = isActive ? 'default' : 'pointer';
      m.style.opacity = isActive ? '0.6' : '1';
    });

    if (isActive && state.session) {
      const fmt = (d) =>
        `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
      const elZoneLabel = document.getElementById('active-zone-label');
      if (elZoneLabel) elZoneLabel.innerText = state.session.zone;

      // Gebruik het geselecteerde kenteken, anders de default, anders de eerste
      const selPlate =
        state.plates.find((p) => p.id === state.selectedPlateId) ||
        state.plates.find((p) => p.default) ||
        state.plates[0];
      const elLabel = document.getElementById('active-plate-label');
      if (elLabel && selPlate) elLabel.innerText = selPlate.text;

      const elStart = document.getElementById('lbl-start');
      const elEnd = document.getElementById('lbl-end');
      if (elStart) elStart.innerText = fmt(state.session.start);
      if (elEnd) elEnd.innerText = fmt(state.session.end);
    }

    // Zone sheet data synchroniseren als geselecteerd
    if (state.selectedZone) {
      const elZoneId = document.getElementById('details-zone-id');
      if (elZoneId) elZoneId.innerText = state.selectedZone;

      // Gebruik het geselecteerde kenteken, anders de default, anders de eerste
      const selPlate =
        state.plates.find((p) => p.id === state.selectedPlateId) ||
        state.plates.find((p) => p.default) ||
        state.plates[0];
      const elPlate = document.getElementById('details-plate');
      if (elPlate && selPlate) {
        // Preserve the icon, only update the text
        elPlate.innerHTML = `
                   <span class="no-pointer">${selPlate.text}</span>
                   <svg class="no-pointer" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>
                `;
      }

      // Render detailed rates
      const list = document.getElementById('details-rates-list');
      if (list) {
        // Filter rates to show only today's rates or 'Dagelijks'
        const daysNL = [
          'Zondag',
          'Maandag',
          'Dinsdag',
          'Woensdag',
          'Donderdag',
          'Vrijdag',
          'Zaterdag',
        ];
        const todayNL = daysNL[new Date().getDay()];

        let filteredRates = (state.selectedZoneRates || []).filter((r) => {
          const timeStr = (r.time || '').toLowerCase();
          const todayLower = todayNL.toLowerCase();
          return (
            timeStr.includes(todayLower) ||
            timeStr.includes('dagelijks') ||
            timeStr.includes('daily') ||
            timeStr === '24/7' ||
            timeStr.includes('check zone')
          );
        });

        // Sort by start time
        filteredRates.sort((a, b) => {
          const getStart = (str) => {
            const match = str.match(/(\d{1,2}):(\d{2})/);
            return match ? parseInt(match[1]) * 100 + parseInt(match[2]) : 0;
          };
          return getStart(a.time) - getStart(b.time);
        });

        // De-duplicate by time and price to prevent clutter
        const uniqueRates = [];
        const seenKeys = new Set();
        filteredRates.forEach((r) => {
          const key = `${r.time}|${r.price}`;
          if (!seenKeys.has(key)) {
            seenKeys.add(key);
            uniqueRates.push(r);
          }
        });

        // If no rates found for today, show a message instead of the full list
        let ratesToRender = uniqueRates;
        if (ratesToRender.length === 0) {
          ratesToRender = [{ time: `Geen tarieven voor ${todayNL}`, price: '', detail: '' }];
        }

        list.innerHTML = '';
        ratesToRender.forEach((r) => {
          const item = document.createElement('div');
          item.className = 'rate-item';

          // Clean up time string (Remove Day Name)
          const todayRegex = new RegExp(todayNL, 'gi');
          let displayTime = r.time
            .replace(todayRegex, '')
            .replace(/Dagelijks/gi, '')
            .replace(/Daily/gi, '')
            .trim();

          const displayPrice = typeof r.price === 'string' ? r.price.replace('.', ',') : r.price;

          // Logic for Free Parking text
          const isFree =
            displayPrice.toLowerCase().includes('gratis') ||
            displayPrice.toLowerCase().includes('free');
          const priceColor = isFree ? '#10b981' : 'var(--q8-blue)';
          const finalPriceLabel = isFree ? 'Free parking' : displayPrice;

          // Logic for formatted details (bullet points)
          let detailHtml = '';
          if (r.detail) {
            const detailLines = r.detail.split('|');
            if (detailLines.length > 0) {
              detailHtml =
                '<ul style="margin: 4px 0 0 16px; padding: 0; list-style-type: disc; color: var(--q8-blue); font-weight: 600; font-size: 0.9rem;">';
              detailLines.forEach((line) => {
                if (line && line.trim() !== '' && line !== 'Vrij parkeren') {
                  detailHtml += `<li style="margin-bottom: 2px;">${line}</li>`;
                }
              });
              detailHtml += '</ul>';
            }
          }

          item.innerHTML = `
                        <div class="rate-dot"></div>
                        <div class="rate-info">
                            <span class="rate-time" style="font-weight: 700; color: var(--q8-blue); font-size: 1.1rem;">${displayTime}</span>
                            ${detailHtml}
                        </div>
                    `;
          // Only show price on the right if it's NOT in the bullet points (e.g. Free parking main label)
          if (finalPriceLabel === 'Free parking') {
            item.innerHTML += `<span class="rate-price" style="font-weight: 700; color: ${priceColor}; font-size: 1rem;">${finalPriceLabel}</span>`;
          }

          list.appendChild(item);
        });
      }
    }

    // Search Mode UI
    const inpSearch = document.getElementById('inp-search');
    const btnToggle = document.getElementById('btn-search-toggle');
    if (inpSearch && btnToggle) {
      const isZone = state.searchMode === 'zone';
      inpSearch.placeholder = isZone ? 'Search by parking zone ...' : 'Search by address ...';
      btnToggle.innerText = isZone ? 'Zone' : 'Address';

      // Sync input value with state ONLY if focused (to avoid jumping cursor)
      if (document.activeElement !== inpSearch) {
        inpSearch.value = state.searchQuery;
      }
    }

    // Render Search Results Panel
    renderSearchResults();
  }

  // 4. Content Lists
  if (state.screen === 'plates') {
    renderPlates();
    // Update Add Plate Button Text
    const btnAdd = document.querySelector('[data-target="modal-add-plate"] span');
    if (btnAdd) {
      btnAdd.innerText =
        state.language === 'nl' ? 'Nieuw kenteken toevoegen' : 'Add new license plate';
    }
  }
  if (state.screen === 'history') renderHistory();
  if (state.screen === 'login') renderLoginUI();
  if (state.screen === 'register') renderRegisterUI();
}

function renderRegisterUI() {
  // Placeholder for future logic
}

function renderLoginUI() {
  // Language buttons
  document.querySelectorAll('.lang-btn').forEach((btn) => {
    const lang = btn.getAttribute('data-lang');
    const isActive = state.language === lang;
    btn.className = isActive ? 'btn btn-primary lang-btn' : 'btn btn-outline lang-btn';
  });

  // Checkbox
  const cb = document.querySelector('.custom-checkbox');
  if (cb) cb.classList.toggle('checked', state.rememberMe);

  // Password Eye
  const inpPass = document.getElementById('inp-password');
  if (inpPass) {
    inpPass.type = state.passwordVisible ? 'text' : 'password';
  }
}

// --- DEFENSIVE HANDLERS ---

function setScreen(name) {
  state.screen = name;
  state.activeOverlay = null;
  state.selectedZone = null;
  if (name === 'plates') state.selectedPlateId = null; // Reset selection on entry
  updateUI();

  // Leaflet/Google Map Fix: Refresh map when switching to parking view
  if (name === 'parking') {
    if (typeof map !== 'undefined' && map) {
      // Use requestAnimationFrame to ensure DOM is painted
      requestAnimationFrame(() => {
        google.maps.event.trigger(map, 'resize');
        centerMapOnZones();
      });
    } else if (!state.installMode.active) {
      // Ensure map is initialized if it's not yet
      initGoogleMap();
    }
  }
}

function tryOpenOverlay(id, contextData = null) {
  // State Guard: Blokkeer overlap, behalve voor toegestane transities (Menu, Plate Selector, Zone Sheet)
  const allowedSwitches = ['menu-overlay', 'sheet-plate-selector', 'sheet-zone'];
  if (state.activeOverlay && state.activeOverlay !== id && !allowedSwitches.includes(id)) {
    return;
  }

  if (id === 'sheet-zone') {
    if (state.session !== null) return; // Geen actie als sessie loopt
    if (contextData && contextData.zone) {
      state.selectedZone = contextData.zone;
      state.selectedZoneRate = contextData.price || 2.0;

      // Ensure rates are passed or nulled out to force default re-render if missing
      state.selectedZoneRates =
        contextData.rates && contextData.rates.length > 0 ? contextData.rates : null;

      state.duration = 120;
      updateDurationUI();
    }
  }

  // Context guards
  if (id === 'modal-confirm' && state.session === null) return;
  if (id === 'modal-add-plate' && state.screen !== 'plates') return;
  if (id === 'sheet-filter' && state.screen !== 'history') return;

  state.activeOverlay = id;
  updateUI();

  // Auto-focus logic for modals
  if (id === 'modal-add-plate') {
    setTimeout(() => {
      const inp = document.getElementById('inp-plate');
      if (inp) {
        inp.value = '';
        inp.focus();
      } // Clear & Focus
      const modal = document.getElementById('modal-add-plate');
      const inpDesc = modal ? modal.querySelectorAll('input')[1] : null;
      if (inpDesc) inpDesc.value = '';
    }, 100);
  }
}

function handleStartParking() {
  if (state.session || !state.selectedZone || state.activeOverlay !== 'sheet-zone') return;

  const now = new Date();
  state.session = {
    zone: state.selectedZone,
    start: now,
    end: new Date(now.getTime() + state.duration * 60000),
  };

  state.activeOverlay = null;
  state.selectedZone = null;
  saveState();
  updateUI();
  showToast('Parking session started');
}

function handleEndParking() {
  if (!state.session) return;
  state.session = null;
  state.activeOverlay = null;
  saveState();
  updateUI();
  showToast('Parking session ended');
}

/**
 * Robust Plate Adding Implementation
 * Checks: Not empty, Max Length, Regex (A-Z0-9-), Duplicates
 */
function saveNewPlate() {
  const inp = document.getElementById('inp-plate');
  const rawVal = inp.value.trim().toUpperCase();

  // Find description input (it has no ID, so we find it within the modal)
  // It's the second input in the modal-add-plate container
  const modal = document.getElementById('modal-add-plate');
  const inpDesc = modal ? modal.querySelectorAll('input')[1] : null;
  const description = inpDesc ? inpDesc.value.trim() : '';

  // 1. Basic Validation
  if (!rawVal) {
    showToast('Please enter a license plate');
    return;
  }
  if (rawVal.length > 12) {
    showToast('License plate too long (max 12)');
    return;
  }

  // 2. Regex Validation (Alphanumeric + dash)
  const validRegex = /^[A-Z0-9-]+$/;
  if (!validRegex.test(rawVal)) {
    showToast('Invalid characters. Use A-Z, 0-9 and -');
    return;
  }

  // 3. Duplicate Check
  const exists = state.plates.some((p) => p.text === rawVal);
  if (exists) {
    showToast('License plate already exists');
    return;
  }

  // 4. Default Logic (First one is default)
  const isFirst = state.plates.length === 0;

  // 5. Add & Save
  state.plates.push({
    id: rawVal,
    text: rawVal,
    description: description, // Explicitly save description
    default: isFirst,
  });

  savePlates(); // Persist

  // 6. Cleanup & UI
  inp.value = '';
  if (inpDesc) inpDesc.value = ''; // Clear description too
  state.activeOverlay = null;
  updateUI();
  showToast('License plate added');
}

function deletePlate(id) {
  // Find plate to delete
  const plateIdx = state.plates.findIndex((p) => p.id == id || p.text == id); // Loose equality for ID types
  if (plateIdx === -1) return;

  const wasDefault = state.plates[plateIdx].default;

  // Remove
  state.plates.splice(plateIdx, 1);

  // Handle Default fallback
  if (wasDefault && state.plates.length > 0) {
    state.plates[0].default = true;
  }

  // If selected plate was deleted, clear selection
  if (state.selectedPlateId === id) {
    state.selectedPlateId = null;
  }

  savePlates(); // Persist
  renderPlates(); // Re-render list
  updateUI(); // Propagate label changes
  showToast('License plate deleted');
}

/**
 * Validates and sets default plate
 * User explicitly clicks "MAKE SELECTED PLATE DEFAULT"
 */
function setDefaultPlate() {
  if (!state.selectedPlateId) return;

  // Reset all
  state.plates.forEach((p) => (p.default = false));

  // Set new default
  const target = state.plates.find((p) => p.id === state.selectedPlateId);
  if (target) {
    target.default = true;
    savePlates();
    state.selectedPlateId = null; // Clear selection after action? Or keep it? Requirement: "clear selectie"
    renderPlates();
    updateUI(); // Propagate label changes
    showToast('Default plate updated');
  }
}

// --- EVENT DELEGATION (FIXED) ---

document.body.addEventListener('click', (e) => {
  // 1. Try to find a data-action element
  const target = e.target.closest('[data-action]');

  // 2. Handle Backdrop Clicks (Close Overlay) safely
  if (e.target.classList.contains('overlay-backdrop')) {
    state.activeOverlay = null;
    updateUI();
    return;
  }

  if (!target) return;

  // 3. BUBBLING GUARD
  if (target.classList.contains('overlay-backdrop') && e.target !== target) {
    return;
  }

  const action = target.getAttribute('data-action');
  const targetId = target.getAttribute('data-target');

  switch (action) {
    case 'nav-to':
      setScreen(targetId);
      break;
    case 'toggle-search-mode':
      const newMode = state.searchMode === 'zone' ? 'address' : 'zone';
      state.searchMode = newMode;
      state.searchQuery = '';
      updateUI();
      const inp = document.getElementById('inp-search');
      if (inp) {
        inp.value = '';
        inp.focus();
      }
      break;

    case 'open-plate-selector':
      renderQuickPlateSelector();
      tryOpenOverlay('sheet-plate-selector');
      break;

    case 'select-quick-plate':
      state.selectedPlateId = target.getAttribute('data-id');
      updateUI(); // Updates global state
      tryOpenOverlay('sheet-zone', {
        // Restore context - tough because we might lose the 'data-context' of the original marker click.
        // However, state.selectedZone is preserved!
        // And tryOpenOverlay uses state.selectedZone logic inside updateUI implicitly via 'details-zone-id' update.
        // We just need to switch overlay back.
      });
      break;

    case 'open-overlay':
      const context = {
        zone: target.getAttribute('data-zone'),
        price: parseFloat(target.getAttribute('data-price')),
        rates: JSON.parse(target.getAttribute('data-rates') || 'null'),
      };
      tryOpenOverlay(targetId, context);
      break;

    case 'close-overlay':
      // Explicit close button click
      state.activeOverlay = null;
      updateUI();
      break;

    case 'mod-duration':
      if (state.activeOverlay === 'sheet-zone') {
        const delta = parseInt(target.getAttribute('data-delta'));
        state.duration = Math.max(15, state.duration + delta);
        updateDurationUI();
      }
      break;

    case 'start-session':
      handleStartParking();
      break;
    case 'confirm-end':
      handleEndParking();
      break;
    case 'save-plate':
      saveNewPlate();
      break;

    case 'delete-plate':
      const id = target.getAttribute('data-id');
      deletePlate(id);
      break;

    case 'select-plate':
      // New selection logic
      const selId = target.getAttribute('data-id');
      // Toggle off if already selected? Or just set? Requirement: "Selectie..."
      // Usually selection is just set.
      if (state.selectedPlateId === selId)
        state.selectedPlateId = null; // Toggle
      else state.selectedPlateId = selId;
      renderPlates();
      updateUI(); // Propagate label changes
      break;

    case 'set-default-plate':
      setDefaultPlate();
      break;

    case 'select-zone':
      state.selectedZone = target.getAttribute('data-zone-id');
      state.searchQuery = '';
      state.activeOverlay = 'sheet-zone';
      clearInfo();
      const sInp = document.getElementById('inp-search');
      if (sInp) sInp.value = '';

      // Pan Map to selected zone
      const zone = state.zones.find((z) => z.id === state.selectedZone);
      if (zone && map) {
        map.panTo({ lat: zone.lat, lng: zone.lng });
        map.setZoom(16);
      }

      updateUI();
      updateDurationUI();
      break;

    case 'close-info-banner':
      clearInfo();
      updateUI();
      break;

    case 'set-lang':
      state.language = target.getAttribute('data-lang');
      updateUI();
      break;
    case 'set-gate-lang':
      state.installMode.language = target.getAttribute('data-lang');
      renderInstallGate();
      break;
    case 'toggle-password':
      state.passwordVisible = !state.passwordVisible;
      updateUI();
      break;
    case 'toggle-remember':
      state.rememberMe = !state.rememberMe;
      updateUI();
      break;
    case 'login':
      const email = document.getElementById('inp-email')?.value;
      const password = document.getElementById('inp-password')?.value;

      if (!email || !password) {
        showToast('Please enter email and password', 'error');
        return;
      }

      // UI Feedback
      const loginBtn = target;
      const originalText = loginBtn.innerText;
      loginBtn.innerText = 'SIGNING IN...';
      loginBtn.disabled = true;

      auth
        .signInWithEmailAndPassword(email, password)
        .then(() => {
          saveState(); // UpdateUI is handled by onAuthStateChanged
        })
        .catch((err) => {
          console.error('Login Error:', err);
          showToast(err.message, 'error');
        })
        .finally(() => {
          loginBtn.innerText = originalText;
          loginBtn.disabled = false;
        });
      break;

    case 'logout':
      auth.signOut().then(() => {
        state.activeOverlay = null;
        state.session = null;
        localStorage.removeItem('q8_parking_session');
        updateUI();
      });
      break;

    case 'register':
      const regEmail = document.getElementById('reg-email')?.value;
      const regPass = document.getElementById('reg-password')?.value;
      const regPassConfirm = document.getElementById('reg-password-confirm')?.value;

      if (!regEmail || !regPass) {
        showToast('Please fill in all fields', 'error');
        return;
      }

      if (regPass !== regPassConfirm) {
        showToast('Passwords do not match', 'error');
        return;
      }

      const regBtn = target;
      regBtn.innerText = 'CREATING ACCOUNT...';
      regBtn.disabled = true;

      auth
        .createUserWithEmailAndPassword(regEmail, regPass)
        .then(() => {
          saveState();
        })
        .catch((err) => {
          console.error('Registration Error:', err);
          showToast(err.message, 'error');
        })
        .finally(() => {
          regBtn.innerText = 'REGISTER';
          regBtn.disabled = false;
        });
      break;
  }
});

// Event Listener voor Search Input
document.getElementById('inp-search')?.addEventListener('input', (e) => {
  state.searchQuery = e.target.value;
  clearInfo();
  renderSearchResults();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    state.activeOverlay = null;
    updateUI();
  }
});

function updateDurationUI() {
  const h = Math.floor(state.duration / 60);
  const m = state.duration % 60;
  const elDur = document.getElementById('val-duration');
  if (elDur) elDur.innerText = `${h}h ${m.toString().padStart(2, '0')}m`;
}

function renderPlates() {
  const list = document.getElementById('list-plates');
  const btnSetDefault = document.getElementById('btn-set-default'); // Fixed footer button

  if (!list) return;
  list.innerHTML = '';

  // Sort: Alphabetical by text (Stable order, so badge moves visually)
  const sorted = [...state.plates].sort((a, b) => a.text.localeCompare(b.text));

  // Determine validity of selection for CTA
  let selectionValid = false;

  sorted.forEach((p) => {
    const isSelected = state.selectedPlateId === p.id;
    const div = document.createElement('div');

    // Card refinement: padding and layout
    div.className = `card flex justify-between items-center mb-md ${isSelected ? 'selected' : ''}`;
    div.style.padding = '16px 20px';

    // Add data-action for selecting
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
                     <svg class="no-pointer" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                </button>
            </div>
        `;
    // Important: Re-enable pointer events for the delete button explicitly
    div.querySelector('.ptr-enabled').style.pointerEvents = 'auto';

    list.appendChild(div);

    // Update selection validity: Selected AND NOT DEFAULT already
    if (isSelected && !p.default) {
      selectionValid = true;
    }
  });

  // Update CTA Button
  if (btnSetDefault) {
    btnSetDefault.disabled = !selectionValid;
  }
}

function renderQuickPlateSelector() {
  const list = document.getElementById('quick-plate-list');
  if (!list) return;
  list.innerHTML = '';

  // Determine active plate for highlighting
  const activePlateId =
    state.selectedPlateId || (state.plates.find((p) => p.default) || state.plates[0])?.id;

  state.plates.forEach((p) => {
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
  const list = document.getElementById('list-history');
  if (!list) return;
  list.innerHTML = '';
  state.history.forEach((h) => {
    const div = document.createElement('div');
    div.className = 'card mb-md';
    div.innerHTML = `
            <div class="flex justify-between items-center mb-sm">
               <span class="font-bold text-lg">${h.plate}</span>
               <div class="zone-badge-box">
                  <span class="icon-p" style="width: 28px; height: 28px; font-size: 0.8rem;">P</span>
                  <span style="padding: 0 8px; font-size: 0.85rem; font-weight: 700;">${h.zone}</span>
               </div>
            </div>
            <div class="text-secondary text-sm mb-md">${h.street}</div>
            <div class="flex justify-between items-end" style="border-top:1px solid var(--border); padding-top:16px;">
               <div>
                  <div class="text-secondary text-xs uppercase font-bold">${h.date}</div>
                  <div class="font-bold">${h.start} - ${h.end}</div>
               </div>
               <div class="font-bold text-lg">€ ${h.price.replace('.', ',')}</div>
            </div>
        `;
    list.appendChild(div);
  });
}

function renderSearchResults() {
  const container = document.getElementById('ui-search-results');
  if (!container) return;

  const shouldShow =
    state.screen === 'parking' &&
    state.searchMode === 'zone' &&
    state.searchQuery.length >= 2 &&
    state.activeOverlay === null;

  if (!shouldShow) {
    container.innerHTML = '';
    container.className = 'hidden';
    container.style.display = 'none';
    return;
  }

  const query = state.searchQuery.toLowerCase();
  const matches = state.zones.filter(
    (z) => z.id.includes(query) || z.name.toLowerCase().includes(query)
  );

  if (matches.length === 0) {
    container.innerHTML = '';
    container.className = 'hidden';
    container.style.display = 'none';
    return;
  }

  container.className = 'search-results-panel';
  container.style.display = 'block';
  container.innerHTML = matches
    .map(
      (z) => `
        <div class="search-result-item" data-action="open-overlay" data-target="sheet-zone"
             data-zone="${z.id}"
             data-price="${z.price}"
             data-rates='${JSON.stringify(z.rates || [])}'>
            <div class="zone-badge-box no-pointer" style="height: 28px;">
               <span class="icon-p no-pointer" style="width: 28px; height: 28px; font-size: 0.8rem;">P</span>
               <span class="no-pointer" style="padding: 0 8px; font-size: 0.85rem; font-weight: 700;">${z.id}</span>
            </div>
            <span class="zone-name no-pointer">${z.name}</span>
        </div>
    `
    )
    .join('');
}

function renderInfoBanner() {
  const container = document.getElementById('ui-info-banner');
  if (!container) return;

  if (!state.infoBanner) {
    container.classList.add('hidden');
    return;
  }

  container.classList.remove('hidden');
  container.innerHTML = `
        <div class="info-banner-content">
            <div class="info-icon">
               <svg width="20" height="20" viewBox="0 0 24 24" fill="#0099ff"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" fill="white"></path><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" fill="#3b82f6"></path></svg>
            </div>
            <span class="info-text">${state.infoBanner.text}</span>
            ${
              state.infoBanner.dismissible
                ? `
                <button class="info-close" data-action="close-info-banner">&times;</button>
            `
                : ''
            }
        </div>
    `;
}

function showInfo(text, dismissible = true) {
  state.infoBanner = { type: 'info', text, dismissible };
}

function clearInfo() {
  state.infoBanner = null;
}

function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.innerText = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

// --- GOOGLE MAPS LOGIC ---
let map = null;
let googleMapsPromise = null;
let isInitializingMap = false;

function loadGoogleMaps() {
  if (googleMapsPromise) return googleMapsPromise;

  googleMapsPromise = new Promise((resolve, reject) => {
    if (typeof google !== 'undefined' && google.maps) {
      resolve();
      return;
    }
    console.log('Loading Google Maps JS API...');
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${firebaseConfig.googleMapsApiKey}&libraries=marker&v=beta&callback=initMapCallback`;
    script.async = true;
    script.defer = true;
    window.initMapCallback = () => {
      console.log('Google Maps JS API loaded.');
      resolve();
    };
    script.onerror = () => {
      console.error('Failed to load Google Maps script.');
      googleMapsPromise = null; // Allow retry
      reject(new Error('Google Maps load failed'));
    };
    document.head.appendChild(script);
  });
  return googleMapsPromise;
}

function initGoogleMap() {
  const container = document.getElementById('map-container');
  if (!container || map || isInitializingMap) return;

  isInitializingMap = true;
  loadGoogleMaps()
    .then(() => {
      container.style.backgroundImage = 'none';

      if (!map) {
        console.log('Initializing Google Map instance...');
        map = new google.maps.Map(container, {
          center: { lat: 52.0907, lng: 5.1214 },
          zoom: 14,
          disableDefaultUI: true,
          mapTypeControl: false,
          zoomControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          clickableIcons: false,
          mapId: '4b360773d325776d',
          gestureHandling: 'greedy',
        });
      }

      renderMapMarkers();
      centerMapOnZones();
      isInitializingMap = false;
    })
    .catch((err) => {
      console.error('Map initialization error:', err);
      isInitializingMap = false;
      // Only show toast if map is still null (avoiding noise if one of many calls failed)
      if (!map) {
        showToast('Kaart kon niet laden. Controleer verbinding.');
      }
    });
}

function centerMapOnZones() {
  if (!map || state.zones.length === 0) return;

  const bounds = new google.maps.LatLngBounds();
  let hasValidPoints = false;

  state.zones.forEach((z) => {
    if (z.lat && z.lng) {
      bounds.extend({ lat: z.lat, lng: z.lng });
      hasValidPoints = true;
    }
  });

  if (hasValidPoints) {
    map.fitBounds(bounds, { top: 50, bottom: 50, left: 50, right: 50 });
  }
}

function renderMapMarkers() {
  if (!map) return;

  // Clear existing google markers
  gMarkers.forEach((m) => m.setMap(null));
  gMarkers = [];

  state.zones.forEach((z) => {
    // Use backend-calculated display label if available, otherwise fallback to standard formatting
    const priceLabel =
      z.display_label ||
      (typeof z.price === 'number' ? `€ ${z.price.toFixed(2).replace('.', ',')}` : z.price);

    // Create custom marker element (compatible with Leaflet styles)
    const markerEl = document.createElement('div');
    markerEl.className = 'custom-map-marker';
    markerEl.innerHTML = `
            <div class="marker" style="position:relative; transform:none; top:0; left:0;">
                 <div class="marker-content"><span class="marker-label">${priceLabel}</span></div>
                 <div class="marker-pin"></div>
            </div>
        `;

    // Use AdvancedMarkerElement if available, else fallback
    let marker;
    if (google.maps.marker && google.maps.marker.AdvancedMarkerElement) {
      marker = new google.maps.marker.AdvancedMarkerElement({
        map: map,
        position: { lat: z.lat, lng: z.lng },
        content: markerEl,
        title: `Zone ${z.id}`,
      });
    } else {
      // Fallback for older API versions
      marker = new google.maps.Marker({
        position: { lat: z.lat, lng: z.lng },
        map: map,
        title: `Zone ${z.id}`,
      });
    }

    marker.addListener('click', () => {
      tryOpenOverlay('sheet-zone', {
        uid: z.uid, // CRITICAL: Pass UID so sheet can lookup full metadata
        zone: z.id,
        price: z.price,
        rates: z.rates,
      });
    });

    gMarkers.push(marker);
  });
}

/* DEPRECATED: Old Marker Logic (Removed) */
function old_initMapMarkers_REMOVED() {
  return;
  // ... old code below ...

  // Check if we have lat/lng data
  const hasGeo = state.zones.some((z) => z.lat && z.lng);

  if (hasGeo && state.zones.length > 0) {
    // Calculate Bounds
    const lats = state.zones.map((z) => z.lat);
    const lngs = state.zones.map((z) => z.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    // Avoid division by zero
    const latRange = maxLat - minLat || 0.001;
    const lngRange = maxLng - minLng || 0.001;

    markers = state.zones.map((z) => {
      // Simple Linear Projection to 10% - 90% of container
      // LATITUDE: Higher lat is LOWER Top % (North is Up/0%) -> Invert logic?
      // Map: Top=0% (North), Bottom=100% (South). MaxLat should be near 0%.
      const relLat = (z.lat - minLat) / latRange; // 0..1 (min..max)
      const topPct = 90 - relLat * 80; // 1.0 -> 10%, 0.0 -> 90%

      const relLng = (z.lng - minLng) / lngRange;
      const leftPct = 10 + relLng * 80; // 0.0 -> 10%, 1.0 -> 90%

      return {
        ...z,
        top: `${topPct.toFixed(1)}%`,
        left: `${leftPct.toFixed(1)}%`,
      };
    });
  } else {
    // Fallback to hardcoded mock markers if no real data
    markers = [
      {
        top: '15%',
        left: '42%',
        zone: '1100',
        price: 4.5,
        rates: [
          { time: '0:00 - 6:00', price: '€ 4,50 / h', detail: 'You pay per minute.' },
          { time: '6:00 - 19:00', price: 'Free', detail: 'Free parking.' },
          { time: '19:00 - 24:00', price: '€ 4,50 / h', detail: 'You pay per minute.' },
        ],
      },
      // ... (rest of mock data omitted for brevity, logic handles fallback)
    ];
  }

  markers.forEach((m) => {
    const el = document.createElement('div');
    el.className = 'marker';
    el.style.top = m.top;
    el.style.left = m.left;
    el.setAttribute('data-action', 'open-overlay');
    el.setAttribute('data-target', 'sheet-zone');
    el.setAttribute('data-zone', m.zone);
    el.setAttribute('data-price', m.price);
    el.setAttribute('data-rates', JSON.stringify(m.rates));

    el.innerHTML = `
            <div class="marker-content">
                <span class="marker-label">€ ${m.price.toFixed(2).replace('.', ',')}</span>
            </div>
            <div class="marker-pin"></div>
        `;
    container.appendChild(el);
  });
}

// --- PWA INSTALL GATE LOGIC ---

function checkInstallMode() {
  // 1. Force Flag (Debug)
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('forceInstall')) {
    state.installMode.active = true;
    return;
  }

  // 2. Platform Detection
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

  // Is Touch Device? (Coarse check for mobile/tablet)
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  // Is iOS? (Simple check, can be refined)
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  // Logic: Only show if Mobile + iOS + NOT Standalone
  if (isTouch && isIOS && !isStandalone) {
    state.installMode.active = true;
    state.installMode.platform = 'ios';
  } else {
    state.installMode.active = false;
  }
}

function renderInstallGate() {
  if (!state.installMode.active) {
    const existing = document.getElementById('install-gate');
    if (existing) existing.remove();
    return;
  }

  // Check if already rendered
  let gate = document.getElementById('install-gate');
  if (!gate) {
    gate = document.createElement('div');
    gate.id = 'install-gate';
    gate.className = 'install-gate-overlay';
    document.body.appendChild(gate);
  }

  // Dynamic Content based on Language
  const isEn = state.installMode.language === 'en';
  const t = {
    title: isEn ? 'Install the Q8 Drivers app' : 'Installeer de Q8 Drivers app',
    subtitle: 'Version 2.0',
    alertTitle: isEn ? 'App-installation required' : 'App-installatie vereist',
    alertDesc: isEn
      ? 'The Q8 Drivers app includes a new functionality: business parking. Install this new version on your phone for the best user experience.'
      : 'De Q8 Drivers app bevat nieuwe functionaliteit: zakelijk parkeren. Installeer deze nieuwe versie op je telefoon voor de beste gebruikservaring.',
    sectA: isEn ? 'A. INSTALLATION INSTRUCTIONS' : 'A. INSTALLATIE INSTRUCTIES',
    sectB: isEn ? 'B. USER INSTRUCTIONS' : 'B. GEBRUIKERS INSTRUCTIES',
    step1: isEn
      ? 'Make sure you have opened this page in <b>Safari*</b> and press the share button below **'
      : 'Zorg dat je deze pagina geopend hebt in <b>Safari*</b> en druk op de deelknop hieronder **',
    step1sub: isEn
      ? '* Other browsers are not supported'
      : '* Andere browsers worden niet ondersteund',
    step2: isEn
      ? 'Tap "<b>Share button</b>" at the bottom of the screen'
      : 'Tik op "<b>Deelknop</b>" onderaan het scherm',
    step3: isEn
      ? 'Tap "<b>Add to Home Screen</b>" and tap "<b>Add</b>" to confirm'
      : 'Tik op "<b>Zet op beginscherm</b>" en tik op "<b>Voeg toe</b>" om te bevestigen',
    userInstr1: isEn ? 'Find the app and open it' : 'Zoek de app en open deze',
    userInstr2: isEn
      ? 'Tap "<b>Create a new account</b>" or sign in with an existing account'
      : 'Tik op "<b>Nieuw account aanmaken</b>" of log in met een bestaand account',
    userInstr3: isEn
      ? 'Allow the app to "<b>send notifications</b>" and "<b>access your location</b>"'
      : 'Sta de app toe om "<b>meldingen te sturen</b>" en "<b>toegang tot uw locatie</b>" te krijgen',
    conditions: isEn
      ? "Please note that without your employer's permission, some functionalities do not work and costs may be at your own expense."
      : 'Let op: zonder toestemming van uw werkgever werken sommige functies niet en zijn kosten mogelijk voor eigen rekening.',
  };

  gate.innerHTML = `
        <div class="install-container">
            <!-- Language Toggle -->
            <div class="install-lang-toggle">
                <button class="toggle-btn ${isEn ? 'active' : ''}" data-action="set-gate-lang" data-lang="en">
                   <span class="flag">🇺🇸</span> ENGLISH
                </button>
                <button class="toggle-btn ${!isEn ? 'active' : ''}" data-action="set-gate-lang" data-lang="nl">
                   <span class="flag">🇳🇱</span> NEDERLANDS
                </button>
            </div>

            <div class="install-content">
                <!-- Branding -->
                <div class="install-brand">
                    <img src="q8-logo.png" class="install-logo" alt="Q8 Liberty">
                    <h1 class="install-title">${t.title}</h1>
                    <div class="install-subtitle">${t.subtitle}</div>
                </div>

                <!-- Alert -->
                <div class="install-alert">
                    <div class="alert-title">${t.alertTitle}</div>
                    <div class="alert-desc">${t.alertDesc}</div>
                </div>

                <!-- Instructions Card -->
                <div class="install-card">
                    <div class="card-section-title">${t.sectA}</div>

                    <div class="timeline-steps">
                        <!-- Step 1 -->
                        <div class="step-item">
                            <div class="step-badge">1</div>
                            <div class="step-content">
                                <div>${t.step1} <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg></div>
                                <div class="step-sub">${t.step1sub}</div>
                            </div>
                        </div>

                        <!-- Step 2 -->
                        <div class="step-item">
                            <div class="step-badge">2</div>
                            <div class="step-content">
                                <div>${t.step2} <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg></div>
                            </div>
                        </div>

                         <!-- Step 3 -->
                        <div class="step-item">
                            <div class="step-badge">3</div>
                            <div class="step-content">
                                <div>${t.step3}</div>
                            </div>
                        </div>
                    </div>

                    <div class="card-section-title" style="margin-top: 32px;">${t.sectB}</div>
                    <ul class="user-instructions">
                        <li>${t.userInstr1}</li>
                        <li>${t.userInstr2}</li>
                        <li>${t.userInstr3}</li>
                    </ul>

                    <div class="install-conditions">
                        ${t.conditions}
                    </div>
                </div>
            </div>
        </div>
    `;
}

// --- OVERLAY LOGIC ---
function tryOpenOverlay(overlayId, context = {}) {
  if (!overlayId) return;

  // Safety check for active session interaction
  if (state.session && overlayId === 'sheet-zone') {
    showToast('You have an active session.');
    return;
  }

  state.activeOverlay = overlayId;
  if (context.uid) state.selectedZone = context.uid; // Sync selection

  // Inject Context Data for Zone Sheet specifically
  if (overlayId === 'sheet-zone' && context.uid) {
    const zone = state.zones.find((z) => z.uid === context.uid) || context;

    // 1. Zone ID & City
    const elZone = document.getElementById('sheet-zone-id');
    if (elZone) {
      elZone.innerHTML = `
                <div class="flex items-center gap-2">
                    <span class="font-bold text-xl">${zone.id}</span>
                    ${zone.city ? `<span class="badge" style="background:#eee; color:#666; font-weight:600; font-size:0.75rem;">${zone.city.toUpperCase()}</span>` : ''}
                </div>
            `;
    }

    // 2. Max Duration & Holiday Warning
    const elMeta = document.getElementById('sheet-zone-meta'); // Ensure this ID exists in HTML or create logic
    // If element doesn't exist, we might need to inject it into a known container?
    // Let's assume we use 'sheet-zone-rates' container prepended or similar.
    // Actually, let's target the existing structure or fallback.

    // 3. Rates
    const elRates = document.getElementById('sheet-zone-rates');
    if (elRates && zone.rates) {
      const ratesHtml = zone.rates
        .map(
          (r) => `
                <div class="rate-item mb-md">
                    <div class="flex justify-between font-bold mb-xs">
                        <span>${r.time}</span>
                        ${
                          r.price.toLowerCase().includes('free')
                            ? '<span class="text-success">Free parking</span>'
                            : `<span>${r.price}</span>`
                        }
                    </div>
                    ${r.detail ? `<div class="text-secondary text-sm" style="line-height:1.4;">${r.detail}</div>` : ''}
                </div>
             `
        )
        .join('');

      // Prepend Max Duration / Warning to rates section if no dedicated slot
      const maxDur =
        zone.max_duration_mins && zone.max_duration_mins < 1440
          ? `<div class="alert alert-warning mb-md" style="font-size:0.85rem;">⚠️ Max duration: ${Math.floor(zone.max_duration_mins / 60)}h ${zone.max_duration_mins % 60}m</div>`
          : '';

      const holiday = zone.has_special_rules
        ? `<div class="alert alert-warning mb-md" style="font-size:0.85rem;">📅 Holiday rules may apply</div>`
        : '';

      elRates.innerHTML = maxDur + holiday + ratesHtml;
    }
  }

  updateUI();
}

document.addEventListener('DOMContentLoaded', () => {
  loadState();
  checkInstallMode(); // Check PWA status first
  if (state.installMode.active) {
    renderInstallGate();
  } else {
    loadZones()
      .then(() => {
        console.log('Zones loaded.');
        initGoogleMap();
        updateUI();
      })
      .catch((err) => {
        console.error('Zones critical fail:', err);
        alert('Data load error: ' + err.message);
        // Fallback: Init map anyway so user isn't stuck on white screen
        initGoogleMap();
        updateUI();
      });
  }
});
