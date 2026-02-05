# Autopilot Runbook

## A) Doel

- **docs/FUNCTIONAL_CANON.md** is de bron van waarheid voor wat moet werken.
- Status **✅** betekent: er is een geautomatiseerde check (proof, smoke of test) die PASS is, en het bewijs-pad is vastgelegd.
- Zolang niet alles groen is: de agent vraagt Edwin **nooit** om browser review.

---

## B) Input die de agent altijd leest (in volgorde)

1. docs/AGENT_HANDOVER.md
2. docs/BLOCKERS.md
3. docs/FUNCTIONAL_CANON.md
4. SYSTEM_STATUS.md (als aanwezig)
5. docs/MASTER.md en docs/USER_FLOWS_AND_DATAFLOWS.md (als aanwezig)
6. Belangrijke code: index.html, public/index.html, app.js, public/app.js, public/services.js, public/ui.js

---

## C) De Autopilot Loop (herhaalbaar)

Per iteratie:

1. **Kies het volgende feature** uit de canon dat nog 🟡 of ❌ is (user-visible eerst).
2. **Maak het feature-contract compleet:** UI-contract, technisch contract, acceptatiecriteria met PASS/FAIL, selectors.
3. **Bepaal of er al een geautomatiseerde check bestaat:**
   - Als er een proof-stap bestaat: run `npm run test:e2e:proof`.
   - Als er alleen handmatige checks zijn: maak minimaal een smoke-checkplan in de canon, en markeer het feature **niet** als ✅.
4. **Los precies één root cause per iteratie op** (40_ROOT_CAUSE_LOOP discipline).
5. **Draai de gates in vaste volgorde en noteer het resultaat:**
   - `npm run preflight`
   - `npm run format:check`
   - `npm run test:e2e:proof` (als relevant voor het feature)
6. **Werk docs/AGENT_HANDOVER.md en docs/BLOCKERS.md bij.**
7. **Commit** met een duidelijke boodschap (en push).

---

## D) Stopcriteria (anti-vastlopen)

- **Stop als:**
  - preflight PASS is, alle user-visible features ✅ of expliciet manual-only zijn, en bewijs aanwezig is, **of**
  - er drie opeenvolgende iteraties geen vooruitgang mogelijk is door blockers, en die blockers zijn volledig vastgelegd in docs/BLOCKERS.md.
- In de stop-output altijd: laatste preflight-resultaat, top blockers, bewijs-pad.

---

## E) “Ready for Human Review” (koppelen aan 12_CANON_GATING)

- Alleen als **preflight PASS** en de gevraagde checks (bijv. test:e2e:proof) **PASS**.
- Anders: **nooit** vragen om browser review.
