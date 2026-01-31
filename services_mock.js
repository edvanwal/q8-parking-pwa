/**
 * Mock services for testing
 */
function calculateParkingCost(durationMins, hourlyRate) {
    if (!durationMins || durationMins <= 0) return 0;
    return (durationMins / 60) * hourlyRate;
}

module.exports = { calculateParkingCost };
