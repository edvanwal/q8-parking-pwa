# Agent handover — status & volgende acties

Korte status (10 regels) + volgende 3 acties voor de volgende agent of Edwin.

---

## Status (10 regels)

1. **Branch:** fix/e2e-menu-logout-clean. **Repo:** edvanwal/q8-parking-pwa.
2. **Functional canon:** docs/FUNCTIONAL_CANON.md bijgewerkt met alle user-visible features (F01–F80).
3. **E2E proof:** scripts/e2e-proof.mjs dekt: login → map → zone sheet → duration + → close → menu → logout.
4. **Gates:** preflight, format:check, test:e2e:proof — scripts toegevoegd in package.json waar ontbrekend.
5. **GH_TOKEN:** niet gezet in agent-shell; nachtrun in "GH_TOKEN MISSING MODE" (geen PR/merge/API).
6. **Documentatie:** AGENT_HANDOVER.md, BLOCKERS.md, FUNCTIONAL_CANON.md aangemaakt/bijgewerkt.
7. **Public vs root:** App wordt geserveerd uit public/ (npx serve public -l 3000); index.html in root is bron, sync naar public via scripts/sync-to-public.js.
8. **Blocker-documentatie:** Zie docs/BLOCKERS.md voor concrete blockers (repro + waar onderzocht).
9. **Stoppen wanneer:** preflight PASS, test:e2e:proof PASS, format:check PASS, canon dekt alle features (✅ of manual-only).
10. **Bewijs-pad:** test-output/e2e-proof/ (trace, video, screenshots).

---

## Volgende 3 acties

1. **Gates lokaal draaien:** `npm run preflight`, `npm run format:check`, `npm run test:e2e:proof` — bij falen root-cause loop, kleine fix, herhalen.
2. **Canon groen houden:** Nieuwe user-visible feature → regel in FUNCTIONAL_CANON.md + indien stabiele selector, extra stap in e2e-proof.mjs.
3. **GH_TOKEN (optioneel):** Voor PR/merge: GH_TOKEN in omgeving zetten; preflight doet dan API-check; anders blijft nachtrun lokaal verifieerbaar.

---

*Laatste update: nachtrun (GH_TOKEN MISSING MODE).*
