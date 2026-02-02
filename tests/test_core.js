/**
 * Q8 Parking - Automated Core Logic Tests
 * Run with: node tests/test_core.js
 */

// 1. Mock Browser Environment
const localStorageMock = (function() {
    let store = {};
    return {
        getItem: (key) => store[key] || null,
        setItem: (key, value) => { store[key] = value.toString(); },
        removeItem: (key) => { delete store[key]; },
        clear: () => { store = {}; }
    };
})();

global.window = {
    Q8: {},
    location: { search: '' },
    localStorage: localStorageMock,
    matchMedia: () => ({ matches: false }),
    navigator: { userAgent: 'Node' }
};
global.Q8 = global.window.Q8;
global.localStorage = localStorageMock;
global.document = {
    getElementById: () => ({ innerText: '', value: '', style: {} }),
    querySelector: () => ({ style: {} }),
    querySelectorAll: () => [],
    createElement: () => ({ style: {}, classList: { add:()=>{}, remove:()=>{}, toggle:()=>{} } })
};
global.location = window.location;
global.navigator = window.navigator;

// 2. Load Modules (Simulated Order)
const fs = require('fs');
const path = require('path');

function loadModule(filename) {
    const content = fs.readFileSync(path.join(__dirname, '..', filename), 'utf8');
    // Remove "if (typeof module...)" if present to avoid Node conflicts,
    // but here we just eval the file content in global scope.
    // However, the modules assign to window.Q8, so it should work.
    eval(content);
}

global.saveFavorites = function() {};
global.loadFavorites = function() {};

try {
    loadModule('utils.js');
    loadModule('state.js');
    loadModule('services.js');
} catch (e) {
    console.error("❌ Error loading modules:", e);
    process.exit(1);
}

const { Utils, State, Services } = window.Q8;

// 3. Test Runner
function runTest(name, fn) {
    try {
        fn();
        console.log(`✅ PASS: ${name}`);
        return true;
    } catch (e) {
        console.error(`❌ FAIL: ${name}`);
        console.error(`   ${e.message}`);
        return false;
    }
}

function assertEquals(actual, expected) {
    if (actual !== expected) {
        throw new Error(`Expected ${expected}, but got ${actual}`);
    }
}

function assertNear(actual, expected, tolerance = 0.01) {
    if (Math.abs(actual - expected) > tolerance) {
        throw new Error(`Expected ${expected} (+/- ${tolerance}), but got ${actual}`);
    }
}

console.log("🚀 Starting Core Logic Tests...\n");
let passed = 0;
let total = 0;

// TEST 1: Calculate Cost
total++;
if (runTest("Pricing: Flat Rate Calculation", () => {
    assertNear(Utils.calculateCost(60, 2.0), 2.0);
    assertNear(Utils.calculateCost(30, 2.0), 1.0);
    assertNear(Utils.calculateCost(120, 2.5), 5.0);
    assertNear(Utils.calculateCost(0, 5.0), 0.0);
})) passed++;

// TEST 1b: Estimated cost display logic (zone sheet)
total++;
if (runTest("Pricing: Estimated cost formatting for zone sheet", () => {
    const durationMins = 90;
    const hourlyRate = 3.0;
    const cost = Utils.calculateCost(durationMins, hourlyRate);
    assertNear(cost, 4.5);
    const formatted = cost.toFixed(2).replace('.', ',');
    assertEquals(formatted, '4,50');
    // Edge: duration 0 -> no numeric estimate
    assertEquals(Utils.calculateCost(0, 2.0), 0.0);
})) passed++;

// T2: Missing price – fallback hourly rate for cost
total++;
if (runTest("Pricing: missing zone.price uses fallback for cost", () => {
    const durationMins = 60;
    const zone = null;
    const fallbackRate = 2.0;
    const hourlyRate = (zone && zone.price != null) ? parseFloat(zone.price) : fallbackRate;
    assertNear(hourlyRate, 2.0);
    assertNear(Utils.calculateCost(durationMins, hourlyRate), 2.0);
    const zoneNoPrice = { price: null, rates: [] };
    const rate2 = (zoneNoPrice.price != null) ? parseFloat(zoneNoPrice.price) : fallbackRate;
    assertNear(rate2, 2.0);
})) passed++;

// T2: Missing rates – cost from zone.price only
total++;
if (runTest("Pricing: missing rates – cost from zone.price", () => {
    const zone = { price: 2.5, rates: [] };
    const hourlyRate = (zone && zone.price != null) ? parseFloat(zone.price) : 2.0;
    assertNear(hourlyRate, 2.5);
    assertNear(Utils.calculateCost(120, hourlyRate), 5.0);
})) passed++;

// T2: rate_numeric – max consistent with zone.price for current-slot logic
total++;
if (runTest("Pricing: rate_numeric max consistent with zone.price", () => {
    const zone = { price: 3.0, rates: [{ rate_numeric: 2.5 }, { rate_numeric: 3.0 }, { rate_numeric: 1.5 }] };
    const maxRate = Math.max(...zone.rates.map(r => r.rate_numeric != null ? r.rate_numeric : 0));
    assertNear(maxRate, 3.0);
    assertNear(zone.price, maxRate);
    assertNear(Utils.calculateCost(60, zone.price), 3.0);
})) passed++;

// TEST 2: State Initialization
total++;
if (runTest("State: Initialization Defaults", () => {
    State.load();
    const s = State.get;
    assertEquals(s.screen, 'login');
    assertEquals(s.duration, 0);
})) passed++;

// TEST 3: Duration Modification
total++;
if (runTest("Services: Modify Duration", () => {
    // Setup mock zone
    State.update({
        zones: [{ id: '101', uid: '101', max_duration_mins: 120 }],
        selectedZone: '101',
        activeOverlay: 'sheet-zone',
        duration: 0
    });

    // Add 30 mins
    Services.modifyDuration(30);
    assertEquals(State.get.duration, 30);

    // Add another 30 (total 60)
    Services.modifyDuration(30);
    assertEquals(State.get.duration, 60);

    // Cap at max (120)
    State.update({ duration: 100 });
    Services.modifyDuration(30); // Should be 120 (clamped? logic says +60 if >120, but let's see logic)
    // Logic: if duration < 120, newDur += 30. so 100 -> 130 ??
    // Let's check logic: if (S.get.duration < 120) newDur += 30; else newDur += 60;
    // So 100 + 30 = 130.
    // Then Math.min(newDur, maxDur) -> min(130, 120) = 120.
    assertEquals(State.get.duration, 120);
})) passed++;

// TEST 4: Plate Management (Add/Delete)
total++;
if (runTest("Services: Add/Delete Plate", () => {
    State.update({ plates: [] });

    // Mock input
    const inputs = { 'inp-plate': { value: '1-TEST-999' } };
    global.document.getElementById = (id) => inputs[id] || { value: '' }; // Override

    // Add
    Services.saveNewPlate();
    assertEquals(State.get.plates.length, 1);
    assertEquals(State.get.plates[0].id, '1-TEST-999');

    // Delete
    Services.deletePlate('1-TEST-999');
    assertEquals(State.get.plates.length, 0);
})) passed++;

console.log(`\n📊 Summary: ${passed}/${total} tests passed.`);
process.exit(passed === total ? 0 : 1);
