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
         * Calculate Parking Cost
         * @param {number} durationMins
         * @param {number} hourlyRate
         * @returns {number}
         */
        calculateCost: function(durationMins, hourlyRate) {
            if (!durationMins || durationMins <= 0) return 0.00;
            return (durationMins / 60) * hourlyRate;
        },
        /**
         * Apply same filters as renderHistory to get filtered list
         */
        getFilteredHistory: function(state) {
            let list = state.history || [];
            const f = state.historyFilters || {};
            if (f.vehicles && f.vehicles.length > 0) {
                list = list.filter(h => f.vehicles.includes(h.plate));
            }
            let dateStart = f.customStart, dateEnd = f.customEnd;
            if (f.dateRange === 'week' || f.dateRange === '30days' || f.dateRange === 'month') {
                const now = new Date();
                dateEnd = now.toISOString().slice(0, 10);
                const d = new Date(now);
                if (f.dateRange === 'week') d.setDate(d.getDate() - 7);
                else if (f.dateRange === '30days') d.setDate(d.getDate() - 30);
                else if (f.dateRange === 'month') d.setDate(1);
                dateStart = d.toISOString().slice(0, 10);
            }
            if (dateStart || dateEnd) {
                list = list.filter(h => {
                    if (!h.date) return true;
                    const parts = (h.date || '').split('-');
                    if (parts.length !== 3) return true;
                    const itemDate = new Date(parts[2] + '-' + parts[1] + '-' + parts[0]);
                    itemDate.setHours(0, 0, 0, 0);
                    if (dateStart) {
                        const s = new Date(dateStart); s.setHours(0, 0, 0, 0);
                        if (itemDate < s) return false;
                    }
                    if (dateEnd) {
                        const e = new Date(dateEnd); e.setHours(0, 0, 0, 0);
                        if (itemDate > e) return false;
                    }
                    return true;
                });
            }
            return list;
        },
        /**
         * Export filtered history as CSV and trigger download
         */
        exportHistoryToCSV: function(state) {
            const list = this.getFilteredHistory(state);
            const headers = ['Date', 'Start', 'End', 'Zone', 'License Plate', 'Address', 'Cost (€)'];
            const rows = list.map(h => [
                h.date || '',
                h.start || '',
                h.end || '',
                h.zone || '',
                (h.plate || '').replace(/"/g, '""'),
                (h.street || '').replace(/"/g, '""'),
                (h.price || '').toString().replace('.', ',')
            ].map(c => `"${c}"`).join(';'));
            const csv = '\uFEFF' + headers.map(h => `"${h}"`).join(';') + '\n' + rows.join('\n');
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `parking-history-${new Date().toISOString().slice(0, 10)}.csv`;
            a.click();
            URL.revokeObjectURL(a.href);
        },
        /**
         * Open print dialog for history (user can save as PDF)
         */
        exportHistoryToPrint: function(state) {
            const list = this.getFilteredHistory(state);
            const w = window.open('', '_blank');
            const nl = state.language === 'nl';
            w.document.write(`
<!DOCTYPE html><html><head><meta charset="utf-8"><title>${nl ? 'Parkeerhistorie' : 'Parking History'}</title>
<style>body{font-family:sans-serif;padding:20px;}.table{width:100%;border-collapse:collapse;}
th,td{border:1px solid #ddd;padding:8px;text-align:left;}th{background:#1E4A99;color:white;}
.tot{font-weight:bold;margin-top:12px;}</style></head><body>
<h1>${nl ? 'Parkeerhistorie' : 'Parking History'}</h1>
<p>${new Date().toLocaleDateString(nl ? 'nl-NL' : 'en-GB')}</p>
<table class="table"><thead><tr>
<th>${nl ? 'Datum' : 'Date'}</th><th>${nl ? 'Start' : 'Start'}</th><th>${nl ? 'Einde' : 'End'}</th>
<th>${nl ? 'Zone' : 'Zone'}</th><th>${nl ? 'Kenteken' : 'License'}</th><th>${nl ? 'Kosten' : 'Cost'}</th>
</tr></thead><tbody>
${list.map(h => `<tr><td>${h.date || ''}</td><td>${h.start || ''}</td><td>${h.end || ''}</td><td>${h.zone || ''}</td><td>${h.plate || ''}</td><td>€ ${(h.price || '').toString().replace('.', ',')}</td></tr>`).join('')}
</tbody></table>
<div class="tot">${nl ? 'Totaal' : 'Total'}: ${list.length} ${nl ? 'sessies' : 'sessions'}</div>
</body></html>`);
            w.document.close();
            w.print();
            w.close();
        }
    };
})();
