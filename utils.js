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
        debug: debug,
        logger: {
            info: (msg, data) => debug('INFO', msg, data),
            error: (msg, data) => debug('ERROR', msg, data),
            warn: (msg, data) => debug('WARN', msg, data)
        },
        /**
         * Detect search type from input: zone number vs address.
         * Zone: 321, 1100, 363_AREN, GRV0140DE (digits or alphanumeric code, no spaces)
         * Address: "Amsterdam", "Bakemakade Rotterdam" (letters, spaces, city/street names)
         * @param {string} query - User input
         * @returns {'zone'|'address'}
         */
        detectSearchType: function(query) {
            const q = (query || '').trim();
            if (q.length < 2) return 'zone';
            if (/\s/.test(q)) return 'address';           // contains space
            if (/^[A-Za-z\u00C0-\u024F\-']+$/.test(q)) return 'address';  // only letters (city/street)
            if (/^\d{2,6}$/.test(q)) return 'zone';       // 321, 1100
            if (/^[A-Za-z0-9_]{2,20}$/.test(q)) return 'zone';  // 363_AREN, GRV0140DE
            return 'address';
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
