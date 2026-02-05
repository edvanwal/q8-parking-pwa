# Agent Handover

Doel: nieuwe agents starten zonder chatgeschiedenis en zonder vastlopen.

Laatste update:

- Datum/tijd: 2025-02-05 (autopilot iteratie 1)
- Branch: fix/app-recovery-behavior (ahead 1)
- Laatste commit: (na deze iteratie)

Status in 10 regels (max):

1. Canon bijgewerkt: volledige feature-index (PARK-TIME-001 + MAP/AUTH/NAV/PLATES/HISTORY/ACTIVE/FAVORITES/SETTINGS/TOAST; rest manual-only).
2. PARK-TIME-001 op ✅: min-knop data-testid toegevoegd, #duration-max-msg via design-system, proof plus+close PASS.
3. Preflight PASS; test:e2e:proof PASS.
4. format:check FAIL alleen nog op recovery-preview.html (HTML parse error); index.html, public/index.html, ui.js gefixt — zie BLOCKERS.
5. Bewijs: test-output/e2e-proof (screenshots, trace).
6. Belangrijkste code: public/index.html (sheet-zone, btn-zone-minus), public/ui.js (duration-max-msg class), public/design-system.css (.duration-max-msg), docs/FUNCTIONAL_CANON.md.
7. Geen openstaande user-visible features op 🟡 zonder manual-only.
8. Volgende: format:check repareren (HTML-structuur, ui.js 30days) indien gewenst; anders klaar voor human review.
9.
10.

Gates

- preflight: PASS (2025-02-05)
- test:e2e:proof: PASS (2025-02-05)
- bewijs artifacts pad: test-output/e2e-proof

Waar zit wat (belangrijkste bestanden)

- UI entry: public/index.html
- UI gedrag: public/app.js (handleClick), public/services.js (modifyDuration, tryOpenOverlay)
- Services/API: public/services.js, public/state.js
- Tests/proof: scripts/e2e-proof.mjs, scripts/canon-preflight.mjs

Laatste wijzigingen (kort)

- Canon: feature-index uitgebreid; PARK-TIME-001 → ✅; duration-max-msg deviation opgelost.
- public/index.html: data-testid="btn-zone-minus" op min-knop.
- public/ui.js: #duration-max-msg via class duration-max-msg i.p.v. inline style.
- public/design-system.css: .duration-max-msg toegevoegd (tokens).

Volgende 3 acties (in volgorde)

1. Optioneel: format:check fix (HTML + ui.js 30days) voor groene format-gate.
2. Human review (canon groen, preflight PASS, proof PASS).
3. Geen verdere autopilot-iteraties nodig tenzij format:check verplicht wordt.
