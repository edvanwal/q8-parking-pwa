/**
 * Q8 Parking - Utilities
 * Namespace: Q8.Utils
 */

window.Q8 = window.Q8 || {};

Q8.Utils = (function() {
    'use strict';

    const DEBUG_MODE = (location.hostname === 'localhost' || location.hostname === '127.0.0.1');

    /**
     * Structured Logger
     * @param {string} scope - Functional area (e.g. 'AUTH', 'STATE', 'MAP')
     * @param {string} message - Human readable string
     * @param {any} data - Optional object to log
     */
    function debug(scope, message, data = null) {
        if (!DEBUG_MODE) return;

        // Simple verification that scope is uppercase
        const cleanScope = scope.toUpperCase();
        const timestamp = new Date().toLocaleTimeString();

        if (data) {
            console.groupCollapsed(`%c[${cleanScope}] %c${message} %c@ ${timestamp}`, 'color: #007bff; font-weight: bold', 'color: inherit', 'color: #999');
            console.log(data);
            console.groupEnd();
        } else {
            console.log(`%c[${cleanScope}] %c${message} %c@ ${timestamp}`, 'color: #007bff; font-weight: bold', 'color: inherit', 'color: #999');
        }
    }

    return {
        logger: {
            info: (msg, data) => debug('INFO', msg, data),
            error: (msg, data) => debug('ERROR', msg, data),
            warn: (msg, data) => debug('WARN', msg, data)
        },
        /**
         * Calculate Parking Cost
         * @param {number} durationMins
         * @param {number} hourlyRate
         * @returns {number}
         */
        calculateCost: function(durationMins, hourlyRate) {
            if (!durationMins || durationMins <= 0) return 0.00;
            return (durationMins / 60) * hourlyRate;
        }
    };
})();
