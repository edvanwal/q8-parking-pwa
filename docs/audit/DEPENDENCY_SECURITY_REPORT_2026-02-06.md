# Dependency & Security Report 2026-02-06

**Datum:** 2026-02-06  
**Type:** Nacht-run audit  
**Branch:** chore/night-run-2026-02-06

---

## 1. Samenvatting

| Package | Locatie | Vulnerabilities | Severity | Update beschikbaar |
|---------|---------|-----------------|----------|-------------------|
| firebase-tools | root | 2 | HIGH | 13.35.1 → 15.5.1 (MAJOR) |
| firebase-admin | functions/ | 4 | CRITICAL | 11.11.1 → 13.6.1 (MAJOR) |
| firebase-functions | functions/ | 0 | - | 4.9.0 → 7.0.5 (MAJOR) |

**Totaal:** 2 HIGH + 4 CRITICAL vulnerabilities

---

## 2. Root package (package.json)

### 2.1 npm audit resultaten

```json
{
  "vulnerabilities": {
    "firebase-tools": "HIGH (via tar)",
    "tar": "HIGH"
  },
  "total": 2
}
```

### 2.2 Vulnerability details

| CVE/Advisory | Package | Severity | Beschrijving |
|--------------|---------|----------|--------------|
| GHSA-8qq5-rm4j-mr97 | tar | HIGH | Arbitrary File Overwrite via Insufficient Path Sanitization |
| GHSA-r6q2-hw4h-h46w | tar | HIGH | Race Condition via Unicode Ligature Collisions on macOS APFS |
| GHSA-34x7-hfp2-rc4v | tar | HIGH | Arbitrary File Creation/Overwrite via Hardlink Path Traversal |

### 2.3 Outdated packages

| Package | Current | Wanted | Latest | Type |
|---------|---------|--------|--------|------|
| firebase-tools | 13.35.1 | 13.35.1 | 15.5.1 | **MAJOR** |

---

## 3. Functions package (functions/package.json)

### 3.1 npm audit resultaten

```json
{
  "vulnerabilities": {
    "firebase-admin": "CRITICAL (via protobufjs)",
    "@google-cloud/firestore": "CRITICAL",
    "google-gax": "CRITICAL",
    "protobufjs": "CRITICAL",
    "fast-xml-parser": "HIGH"
  },
  "total": 5
}
```

### 3.2 Vulnerability details

| CVE/Advisory | Package | Severity | Beschrijving |
|--------------|---------|----------|--------------|
| GHSA-h755-8qp9-cq85 | protobufjs | CRITICAL | Prototype Pollution vulnerability (CVSS 9.8) |
| GHSA-37qj-frw5-hhjh | fast-xml-parser | HIGH | RangeError DoS Numeric Entities Bug |

### 3.3 Outdated packages

| Package | Current | Wanted | Latest | Type |
|---------|---------|--------|--------|------|
| firebase-admin | 11.11.1 | 11.11.1 | 13.6.1 | **MAJOR** |
| firebase-functions | 4.9.0 | 4.9.0 | 7.0.5 | **MAJOR** |

---

## 4. Keuze nodig

### SEC-K1: Firebase-tools update (MAJOR version)

**Huidige versie:** 13.35.1  
**Beschikbare versie:** 15.5.1  
**Impact:** 2 HIGH vulnerabilities opgelost

**Risico van update:**
- MAJOR version bump kan breaking changes bevatten
- Firebase CLI syntax kan veranderd zijn
- Deploy scripts moeten mogelijk aangepast worden

**Aanbeveling:** Update naar 15.x na testen in dev-omgeving.

---

### SEC-K2: Firebase-admin update (MAJOR version)

**Huidige versie:** 11.11.1  
**Beschikbare versie:** 13.6.1  
**Impact:** 4 CRITICAL vulnerabilities opgelost (incl. protobufjs CVSS 9.8)

**Risico van update:**
- MAJOR version bump (11 → 13)
- API changes in firebase-admin
- Cloud Functions compatibility
- Node.js version requirements

**Aanbeveling:** Hoge prioriteit vanwege CRITICAL severity. Plan update met test-coverage.

---

### SEC-K3: Firebase-functions update (MAJOR version)

**Huidige versie:** 4.9.0  
**Beschikbare versie:** 7.0.5  
**Impact:** Indirect (dependency van firebase-admin update)

**Risico van update:**
- MAJOR version bump (4 → 7)
- Cloud Functions v2 vs v1 changes
- Deployment configuratie

**Aanbeveling:** Combineer met SEC-K2.

---

## 5. Veilige updates

**Geen veilige (MINOR/PATCH) updates beschikbaar.**

Alle beschikbare updates zijn MAJOR version bumps die breaking changes kunnen introduceren.

---

## 6. Later items

| ID | Item | Rationale |
|----|------|-----------|
| SEC-L1 | Monitor firebase-tools voor patch release | Als 13.x patch komt, direct updaten |
| SEC-L2 | Dependency lock review | package-lock.json integrity check |

---

## 7. Conclusie

**Actie vereist:**
- Alle security updates vereisen MAJOR version bumps
- Niet automatisch uitgevoerd vanwege risico op breaking changes
- Items SEC-K1, SEC-K2, SEC-K3 toegevoegd als "Keuze nodig"

**Ernst:**
- CRITICAL vulnerabilities in functions/ (protobufjs) hebben hoge prioriteit
- Update planning nodig met test-coverage

---

*Gegenereerd door nacht-run audit 2026-02-06*
