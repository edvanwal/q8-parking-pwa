# Firebase Upgrade Report 2026-02

**Datum:** 2026-02-06  
**Branch:** chore/firebase-upgrade-2026-02  
**Status:** ❌ GESTOPT - Breaking change gedetecteerd

---

## Samenvatting

De upgrade naar firebase-functions v7 vereist **code-aanpassingen** die buiten scope vallen.  
Deploy is **niet uitgevoerd**. Geen wijzigingen in productie.

---

## Geüpdatete packages

| Package | Van | Naar | Locatie |
|---------|-----|------|---------|
| firebase-tools | ^13.0.0 | ^15.0.0 | root package.json |
| firebase-admin | ^11.11.0 | ^13.0.0 | functions/package.json |
| firebase-functions | ^4.5.0 | ^7.0.0 | functions/package.json |

---

## Build-status

| Check | Status | Details |
|-------|--------|---------|
| npm install (root) | ✅ PASS | 0 vulnerabilities |
| npm install (functions) | ✅ PASS | 0 vulnerabilities, warning EBADENGINE (lokaal node v24, deployed node v20) |
| npm audit (root) | ✅ PASS | 0 vulnerabilities |
| npm audit (functions) | ✅ PASS | 0 vulnerabilities |
| format:check | ⚠️ FAIL | Pre-bestaand in main, niet gerelateerd aan upgrade |

---

## Deploy-status

| Actie | Status | Details |
|-------|--------|---------|
| firebase deploy --only functions | ❌ FAIL | Breaking change in firebase-functions v7 |

### Foutmelding (letterlijk):

```
TypeError: functions.region is not a function
    at Object.<anonymous> (functions/index.js:201:6)

Error: Functions codebase could not be analyzed successfully. It may have a syntax or runtime error
```

### Root cause:

firebase-functions v7 heeft de v1 API syntax **verwijderd** uit de default export.

**Huidige code:**
```javascript
const functions = require('firebase-functions');
// ...
exports.onSessionCreated = functions.region('europe-west1')...
```

**Vereiste wijziging voor v7:**
```javascript
const functions = require('firebase-functions/v1');
// rest van code blijft ongewijzigd
```

---

## Gedrag veranderd?

**NEE** - Upgrade is niet doorgezet naar productie.

---

## Kosten-impact

**Geen extra kosten** - Deploy is niet uitgevoerd, geen resources gewijzigd.

---

## Keuze nodig

### FIRE-K1: firebase-functions v7 migratie

**Probleem:** firebase-functions v7 vereist wijziging van import statement.

**Opties:**

| Optie | Beschrijving | Risico |
|-------|--------------|--------|
| A | Wijzig import naar `require('firebase-functions/v1')` | Laag - syntactisch identiek, alleen import pad verandert |
| B | Blijf op firebase-functions v4.x | 1 HIGH vulnerability (fast-xml-parser) blijft bestaan |
| C | Migreer naar v2 Cloud Functions syntax | Hoog - grote refactor, nieuwe API |

**Aanbeveling:** Optie A - minimale wijziging, behoudt v1 syntax volledig.

**Benodigde code-wijziging (1 regel):**
```javascript
// In functions/index.js, regel 8:
// VAN:
const functions = require('firebase-functions');
// NAAR:
const functions = require('firebase-functions/v1');
```

---

### FIRE-K2: firebase-admin v13 compatibility

**Status:** Onbekend - deploy niet bereikt.

firebase-admin v13 kan ook breaking changes bevatten. Na optie A van FIRE-K1 moet dit opnieuw getest worden.

---

## Rollback-instructie

```
git checkout main && git branch -D chore/firebase-upgrade-2026-02
```

---

## Wat wel is bereikt

1. ✅ Security vulnerabilities in root (firebase-tools) zijn opgelost (0 vulns na upgrade)
2. ✅ Security vulnerabilities in functions zijn opgelost (0 vulns na upgrade)
3. ❌ Deploy niet mogelijk zonder code-aanpassing

---

## Bijlagen

### npm audit resultaat na upgrade (root)
```json
{
  "vulnerabilities": {},
  "metadata": { "vulnerabilities": { "total": 0 } }
}
```

### npm audit resultaat na upgrade (functions)
```json
{
  "vulnerabilities": {},
  "metadata": { "vulnerabilities": { "total": 0 } }
}
```

---

*Gegenereerd door Firebase upgrade audit 2026-02-06*
