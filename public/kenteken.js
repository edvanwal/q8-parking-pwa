/**
 * Q8 Parking - Kentekenvalidatie (gratis)
 * - Formaatvalidatie Nederlands kenteken (sidecodes 1–11)
 * - Optionele lookup via RDW Open Data (geen API-key)
 * Namespace: Q8.Kenteken
 */

window.Q8 = window.Q8 || {};

Q8.Kenteken = (function() {
    'use strict';

    // RDW Open Data: Gekentekende voertuigen (Socrata)
    const RDW_VOERTUIGEN_URL = 'https://opendata.rdw.nl/resource/m9d7-ebf2.json';
    const RDW_BRANDSTOF_URL = 'https://opendata.rdw.nl/resource/8ys7-d773.json';

    /**
     * Normaliseer invoer: hoofdletters, alleen letters/cijfers (geen streepjes/spaties).
     * @param {string} input
     * @returns {string} Bijv. "AB123C"
     */
    function normalize(input) {
        if (typeof input !== 'string') return '';
        return input.replace(/[\s\-]/g, '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    }

    /**
     * Formatteer genormaliseerd kenteken met streepjes (voor weergave).
     * @param {string} normalized Bijv. "AB123C"
     * @returns {string} Bijv. "AB-123-C" (indien sidecode past)
     */
    function formatDisplay(normalized) {
        if (!normalized || normalized.length < 6) return normalized;
        const n = normalized;
        // Sidecode 1: XX-99-99 | 2: 99-XX-99 | 3: 99-99-XX | 4: X-99-XXX | 5: XXX-99-X
        // 6: X-XXX-99 | 7: XX-999-X | 8: X-999-XX | 9: 999-X-XX | 10: XX-X-999 | 11: 999-XX-X
        if (n.length === 6) {
            if (/^[A-Z]{2}\d{2}\d{2}$/.test(n)) return n.slice(0,2) + '-' + n.slice(2,4) + '-' + n.slice(4,6);
            if (/^\d{2}[A-Z]{2}\d{2}$/.test(n)) return n.slice(0,2) + '-' + n.slice(2,4) + '-' + n.slice(4,6);
            if (/^\d{2}\d{2}[A-Z]{2}$/.test(n)) return n.slice(0,2) + '-' + n.slice(2,4) + '-' + n.slice(4,6);
            if (/^[A-Z]\d{2}[A-Z]{3}$/.test(n)) return n[0] + '-' + n.slice(1,3) + '-' + n.slice(3,6);
            if (/^[A-Z]{3}\d{2}[A-Z]$/.test(n)) return n.slice(0,3) + '-' + n.slice(3,5) + '-' + n.slice(5,6);
            if (/^[A-Z]\d{3}\d{2}$/.test(n)) return n[0] + '-' + n.slice(1,4) + '-' + n.slice(4,6);
            if (/^[A-Z]{2}\d{3}[A-Z]$/.test(n)) return n.slice(0,2) + '-' + n.slice(2,5) + '-' + n.slice(5,6);
            if (/^[A-Z]\d{3}[A-Z]{2}$/.test(n)) return n[0] + '-' + n.slice(1,4) + '-' + n.slice(4,6);
            if (/^\d{3}[A-Z][A-Z]{2}$/.test(n)) return n.slice(0,3) + '-' + n[3] + '-' + n.slice(4,6);
        }
        if (n.length === 7) {
            if (/^\d{2}[A-Z]{2}\d{3}$/.test(n)) return n.slice(0,2) + '-' + n.slice(2,4) + '-' + n.slice(4,7);
            if (/^[A-Z]{2}[A-Z]\d{3}$/.test(n)) return n.slice(0,2) + '-' + n[2] + '-' + n.slice(3,7);
            if (/^\d{3}[A-Z]{2}[A-Z]$/.test(n)) return n.slice(0,3) + '-' + n.slice(3,5) + '-' + n.slice(5,7);
        }
        return normalized;
    }

    /**
     * Nederlands kenteken: toegestane letters (geen klinkers, geen C/Q).
     */
    const DUTCH_LETTERS = 'BDFGHJKLMNPRSTXZ';

    /** Sidecode-patterns (zonder streepjes): 6–8 tekens. */
    const SIDECODE_PATTERNS = [
        /^[BDFGHJKLMNPRSTXZ]{2}\d{2}\d{2}$/,           // 1: XX-99-99
        /^\d{2}[BDFGHJKLMNPRSTXZ]{2}\d{2}$/,           // 2: 99-XX-99
        /^\d{2}\d{2}[BDFGHJKLMNPRSTXZ]{2}$/,           // 3: 99-99-XX
        /^[BDFGHJKLMNPRSTXZ]\d{2}[BDFGHJKLMNPRSTXZ]{3}$/, // 4: X-99-XXX
        /^[BDFGHJKLMNPRSTXZ]{3}\d{2}[BDFGHJKLMNPRSTXZ]$/, // 5: XXX-99-X
        /^[BDFGHJKLMNPRSTXZ]\d{3}\d{2}$/,              // 6: X-XXX-99
        /^[BDFGHJKLMNPRSTXZ]{2}\d{3}[BDFGHJKLMNPRSTXZ]$/, // 7: XX-999-X
        /^[BDFGHJKLMNPRSTXZ]\d{3}[BDFGHJKLMNPRSTXZ]{2}$/, // 8: X-999-XX
        /^\d{3}[BDFGHJKLMNPRSTXZ][BDFGHJKLMNPRSTXZ]{2}$/, // 9: 999-X-XX
        /^[BDFGHJKLMNPRSTXZ]{2}[BDFGHJKLMNPRSTXZ]\d{3}$/, // 10: XX-X-999
        /^\d{3}[BDFGHJKLMNPRSTXZ]{2}[BDFGHJKLMNPRSTXZ]$/, // 11: 999-XX-X
        /^\d{2}[BDFGHJKLMNPRSTXZ]{2}\d{3}$/,           // 2 (7): 99-XX-999
        /^[BDFGHJKLMNPRSTXZ]{2}\d{3}\d{2}$/,           // 7 (7): XX-999-99
        /^\d{3}[BDFGHJKLMNPRSTXZ]{2}\d{2}$/,           // 11 (7): 999-XX-99
        /^\d{2}\d{3}[BDFGHJKLMNPRSTXZ]{2}$/,           // 3 (7): 99-999-XX
        /^[BDFGHJKLMNPRSTXZ]\d{2}[BDFGHJKLMNPRSTXZ]{2}\d{2}$/ // 4 (7): X-99-XX-99 (lenient 7)
    ];

    /**
     * Valideer formaat Nederlands kenteken (na normalisatie).
     * @param {string} normalized Genormaliseerd kenteken (alleen A-Z0-9, 6–8 tekens)
     * @returns {{ valid: boolean, errorKey?: string, errorMessage?: string }}
     */
    function validateFormat(normalized) {
        if (!normalized || normalized.length < 6) {
            return { valid: false, errorKey: 'too_short', errorMessage: 'Kenteken heeft minimaal 6 tekens (bijv. AB-123-C)' };
        }
        if (normalized.length > 8) {
            return { valid: false, errorKey: 'too_long', errorMessage: 'Kenteken heeft maximaal 8 tekens' };
        }
        const letters = (normalized.match(/[A-Z]/g) || []).length;
        const digits = (normalized.match(/\d/g) || []).length;
        if (letters < 2 || digits < 2) {
            return { valid: false, errorKey: 'invalid_mix', errorMessage: 'Nederlands kenteken heeft minimaal 2 letters en 2 cijfers' };
        }
        for (let i = 0; i < SIDECODE_PATTERNS.length; i++) {
            if (SIDECODE_PATTERNS[i].test(normalized)) {
                return { valid: true };
            }
        }
        return { valid: false, errorKey: 'invalid_format', errorMessage: 'Geen geldig Nederlands kentekenformaat (bijv. AB-123-CD)' };
    }

    /**
     * Volledige validatie: normaliseren + formaat.
     * @param {string} input
     * @returns {{ valid: boolean, normalized: string, display: string, errorKey?: string, errorMessage?: string }}
     */
    function validate(input) {
        const n = normalize(input);
        const fmt = validateFormat(n);
        const display = formatDisplay(n);
        return {
            valid: fmt.valid,
            normalized: n,
            display: display || n,
            errorKey: fmt.errorKey,
            errorMessage: fmt.errorMessage
        };
    }

    /**
     * Lookup kenteken bij RDW Open Data (gratis, geen API-key).
     * @param {string} normalized Genormaliseerd kenteken (zonder streepjes)
     * @returns {Promise<{ found: boolean, data?: { merk?: string, handelsbenaming?: string, voertuigsoort?: string } }>}
     */
    function lookupRDW(normalized) {
        if (!normalized || normalized.length < 6) {
            return Promise.resolve({ found: false });
        }
        const kentekenParam = encodeURIComponent(normalized);
        const url = RDW_VOERTUIGEN_URL + '?kenteken=' + kentekenParam + '&$limit=1';
        return fetch(url, { method: 'GET' })
            .then(function(res) {
                if (!res.ok) throw new Error('RDW request failed: ' + res.status);
                return res.json();
            })
            .then(function(arr) {
                if (!Array.isArray(arr) || arr.length === 0) {
                    return { found: false };
                }
                const row = arr[0];
                return {
                    found: true,
                    data: {
                        merk: row.merk || '',
                        handelsbenaming: row.handelsbenaming || '',
                        voertuigsoort: row.voertuigsoort || ''
                    }
                };
            })
            .catch(function(err) {
                if (typeof Q8 !== 'undefined' && Q8.Utils && Q8.Utils.logger && Q8.Utils.logger.warn) {
                    Q8.Utils.logger.warn('Kenteken RDW lookup failed', err);
                } else {
                    console.warn('[Kenteken] RDW lookup failed', err);
                }
                return { found: false, error: true };
            });
    }

    /**
     * Haal volledige voertuig-specs op (main + brandstof) voor Cars specs-pagina.
     * @param {string} normalized Genormaliseerd kenteken
     * @returns {Promise<{ found: boolean, specs?: object, error?: boolean }>}
     */
    function getVehicleSpecs(normalized) {
        if (!normalized || normalized.length < 6) {
            return Promise.resolve({ found: false });
        }
        const k = encodeURIComponent(normalized);
        const mainUrl = RDW_VOERTUIGEN_URL + '?kenteken=' + k + '&$limit=1';
        const brandstofUrl = RDW_BRANDSTOF_URL + '?kenteken=' + k + '&$limit=1';

        return fetch(mainUrl, { method: 'GET' })
            .then(function(res) { return res.ok ? res.json() : []; })
            .then(function(mainArr) {
                if (!Array.isArray(mainArr) || mainArr.length === 0) {
                    return { found: false, main: null, brandstof: null };
                }
                return fetch(brandstofUrl, { method: 'GET' })
                    .then(function(res) { return res.ok ? res.json() : []; })
                    .then(function(brandstofArr) {
                        const brandstofRow = (Array.isArray(brandstofArr) && brandstofArr.length > 0) ? brandstofArr[0] : null;
                        const main = mainArr[0];
                        const brandstofOmschrijving = brandstofRow ? (brandstofRow.brandstof_omschrijving || '') : '';
                        const isElektrisch = /elektriciteit|elektrisch|plugin|plug-in|phev|bev|ev/i.test(brandstofOmschrijving);
                        return {
                            found: true,
                            specs: {
                                kenteken: main.kenteken || normalized,
                                merk: main.merk || '',
                                handelsbenaming: main.handelsbenaming || '',
                                voertuigsoort: main.voertuigsoort || '',
                                eerste_kleur: main.eerste_kleur || '',
                                tweede_kleur: main.tweede_kleur || '',
                                vervaldatum_apk: main.vervaldatum_apk || '',
                                brandstof: brandstofOmschrijving || '—',
                                elektrisch: isElektrisch,
                                massa_ledig_voertuig: main.massa_ledig_voertuig != null ? String(main.massa_ledig_voertuig) : '',
                                toegestane_maximum_massa_voertuig: main.toegestane_maximum_massa_voertuig != null ? String(main.toegestane_maximum_massa_voertuig) : '',
                                laad_aansluiting: '—',
                                laad_snelheid: '—'
                            }
                        };
                    });
            })
            .catch(function(err) {
                if (typeof Q8 !== 'undefined' && Q8.Utils && Q8.Utils.logger && Q8.Utils.logger.warn) {
                    Q8.Utils.logger.warn('Kenteken getVehicleSpecs failed', err);
                }
                return { found: false, error: true };
            });
    }

    return {
        normalize: normalize,
        formatDisplay: formatDisplay,
        validateFormat: validateFormat,
        validate: validate,
        lookupRDW: lookupRDW,
        getVehicleSpecs: getVehicleSpecs
    };
})();
