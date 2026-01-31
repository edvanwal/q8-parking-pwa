/**
 * Q8 Parking - Pricing Logic Tests
 * This script simulates parking scenarios and verifies cost calculations.
 */

const { calculateParkingCost } = require('../services_mock.js');

const testCases = [
    {
        name: "Flat Rate - 1 hour at 2.00/h",
        duration: 60,
        rate: 2.0,
        expected: 2.0
    },
    {
        name: "Flat Rate - 30 minutes at 2.00/h",
        duration: 30,
        rate: 2.0,
        expected: 1.0
    },
    {
        name: "Flat Rate - 2 hours at 3.50/h",
        duration: 120,
        rate: 3.5,
        expected: 7.0
    },
    {
        name: "Free Parking - 1 hour at 0.00/h",
        duration: 60,
        rate: 0.0,
        expected: 0.0
    },
    {
        name: "Until Stopped - Initial cost (0 mins)",
        duration: 0,
        rate: 2.0,
        expected: 0.0
    }
];

function runTests() {
    console.log("🚀 Starting Pricing Logic Tests...\n");
    let passed = 0;

    testCases.forEach(tc => {
        const result = calculateParkingCost(tc.duration, tc.rate);
        const success = Math.abs(result - tc.expected) < 0.01;

        if (success) {
            console.log(`✅ PASS: ${tc.name}`);
            passed++;
        } else {
            console.log(`❌ FAIL: ${tc.name} | Expected: ${tc.expected}, Got: ${result}`);
        }
    });

    console.log(`\n📊 Summary: ${passed}/${testCases.length} tests passed.`);
    process.exit(passed === testCases.length ? 0 : 1);
}

// Minimal mock of the calculation function for testing
// This will eventually be moved to services.js
if (require.main === module) {
    runTests();
}
