# Codebase Quality Report 2026-02-06

**Datum:** 2026-02-06  
**Type:** Nacht-run audit  
**Branch:** chore/night-run-2026-02-06

---

## 1. Samenvatting

| Categorie | Status | Opmerkingen |
|-----------|--------|-------------|
| Formatting (Prettier) | ✅ PASS | 4 bestanden gefixd |
| No debugger statements | ✅ PASS | Geen gevonden |
| TODO/FIXME markers | ✅ PASS | Alleen legitieme comments (license plate formats) |
| Console.log gebruik | ⚠️ INFO | ~138 console.log statements verspreid over codebase |
| Console.error gebruik | ✅ PASS | ~57 statements, correct gebruikt voor error handling |
| quick:check | ✅ PASS | Beeldnummer zichtbaar |

---

## 2. Micro-fixes uitgevoerd

### 2.1 Formatting gefixd (veilige micro-fix)
De volgende 4 bestanden hadden Prettier-inconsistenties en zijn gefixd:

| Bestand | Actie |
|---------|-------|
| `app.js` | Prettier formatting |
| `scripts/e2e-proof.mjs` | Prettier formatting |
| `scripts/preflight.mjs` | Prettier formatting |
| `scripts/format-check.mjs` | Prettier formatting |

**Gedrag veranderd:** Nee, alleen whitespace/formatting.

---

## 3. Code metrics

### 3.1 Bestandsaantallen
- **JavaScript bestanden:** 30 (.js)
- **ESM modules:** 12 (.mjs)
- **Python scripts:** ~30 (utility/analyse scripts)

### 3.2 Console.log verdeeld per bestand (top 10)
| Bestand | Aantal |
|---------|--------|
| `app.js` | 13 |
| `public/app.js` | 13 |
| `scripts/sync-to-public.js` | 11 |
| `public/platform-detection.js` | 10 |
| `app_recovery.js` | 10 |
| `public/sw.js` | 8 |
| `sw.js` | 8 |
| `functions/index.js` | 7 |
| `scripts/build-version.js` | 6 |

**Aanbeveling:** Console.logs zijn functioneel voor debugging en PWA diagnostics. Geen actie nodig.

---

## 4. Duplicatie root ↔ public

Het project gebruikt een sync-architectuur (`npm run sync` / `scripts/sync-to-public.js`) waarbij:
- Source files staan in root
- Deployed files worden naar `public/` gesynchroniseerd met build-versioning

Dit is by design en werkt correct.

---

## 5. Inline styles analyse

**Bevinding:** 67 inline `style=` attributen in `public/index.html`

**Status:** Later (geen UX wijziging, zou CSS refactor vereisen)

**Rationale:** Dit is geen bug, maar een code-kwaliteitsverbetering die UI zou kunnen breken als niet zorgvuldig gedaan.

---

## 6. Keuze nodig items

Geen.

---

## 7. Later items

| ID | Item | Rationale |
|----|------|-----------|
| CQ-L1 | Inline styles migreren naar CSS | Zou 67+ locaties raken, risico op UI-regressie |
| CQ-L2 | Console.log cleanup | Functioneel voor debugging, geen prioriteit |

---

## 8. Gate-resultaten

```
quick:check: ✅ PASS
format:check: ✅ PASS (na fix)
```

---

*Gegenereerd door nacht-run audit 2026-02-06*
