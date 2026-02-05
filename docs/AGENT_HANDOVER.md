# Agent handover — status & volgende acties

Korte status (10 regels) + volgende 3 acties voor de volgende agent of Edwin.

---

## Status (10 regels)

1. **Branch:** fix/e2e-menu-logout-clean. **Repo:** edvanwal/q8-parking-pwa.
2. **Functional canon:** docs/FUNCTIONAL_CANON.md compleet — alle user-visible features F01–F80 (✅ of manual-only).
3. **E2E proof:** scripts/e2e-proof.mjs dekt: login → map → zone sheet → duration + → close → menu → logout.
4. **Gates:** preflight, format:check, test:e2e:proof — alle drie PASS (laatste run: format:check PASS, preflight PASS, test:e2e:proof PASS).
5. **GH_TOKEN:** niet gezet in agent-shell; nachtrun in "GH_TOKEN MISSING MODE" (geen PR/merge/API).
6. **Documentatie:** AGENT_HANDOVER.md, BLOCKERS.md, FUNCTIONAL_CANON.md bijgewerkt.
7. **Public vs root:** App wordt geserveerd uit public/ (npx serve public -l 3000); sync via npm run sync.
8. **Blocker-documentatie:** docs/BLOCKERS.md — B1 (GH_TOKEN) open; B2 opgelost.
9. **Stopcriteria bereikt:** preflight PASS, test:e2e:proof PASS, format:check PASS, canon compleet.
10. **Bewijs-pad:** test-output/e2e-proof/ (trace, video, screenshots).

---

## Volgende 3 acties

1. **Gates lokaal draaien:** `npm run preflight`, `npm run format:check`, `npm run test:e2e:proof` — bij falen root-cause loop, kleine fix, herhalen.
2. **Canon groen houden:** Nieuwe user-visible feature → regel in FUNCTIONAL_CANON.md + indien stabiele selector, extra stap in e2e-proof.mjs.
3. **GH_TOKEN (optioneel):** Voor PR/merge: GH_TOKEN in omgeving zetten; preflight doet dan API-check; anders blijft nachtrun lokaal verifieerbaar.

---

*Laatste update: stopcriteria bereikt — alle 3 gates PASS, canon compleet.*
