# Functioneel contract (canon)

**Doel:** Eén bron van waarheid voor "wat moet werken" en "hoe we het verifiëren". Alle user-facing gedrag en acceptatiecriteria staan hier; code en tests moeten hiermee in lijn zijn.

**Gebruik:**
- Bij wijzigingen aan gedrag: canon eerst raadplegen, daarna aanpassen in dezelfde change.
- Bij bugs: canon gebruiken om te bepalen wat de verwachting is.
- Bij E2E/proof: canon bepaalt welke stappen en checks vereist zijn.

**Statuslegende:**
- ✅ Feature gedefinieerd, geïmplementeerd, en geautomatiseerd gecontroleerd (proof/unit/E2E).
- 🟡 Feature gedefinieerd en geïmplementeerd; geautomatiseerde check ontbreekt of dekt niet alle criteria.
- ❌ Niet geïmplementeerd of bewust uit scope.

**Principe:** Je ziet de app alleen als "klaar" nadat de bijbehorende geautomatiseerde check **PASS** is. Geen groen = geen release van dat gedrag.

---

## Preflight

`npm run preflight` moet slagen vóór human review. Het script controleert de feature-index: als er user-visible features op 🟡 of ❌ staan (en niet expliciet manual-only), faalt de preflight. Als dit faalt, vraagt de agent Edwin **NIET** om browser review.

---

## Feature-index

| Feature-ID    | Naam                   | User-visible? | Backend? | Geautomatiseerde check | Owner   | Status | Waarom nog niet ✅ |
|---------------|------------------------|---------------|----------|-------------------------|---------|--------|---------------------|
| PARK-TIME-001 | Parkeertijd aanpassen  | Ja            | Nee      | E2E proof stap 4–7 (plus + close); min handmatig | Product | ✅     | — |
| MAP-001       | Kaart + zones + marker | Ja            | Ja       | E2E proof (map-root, zone click) | Product | manual-only | Geen aparte E2E gate; onderdeel van proof-flow. |
| AUTH-001      | Login / logout / register / forgot password | Ja | Ja      | — | Product | manual-only | Auth door Firebase; geen E2E. |
| NAV-001       | Navigatie (menu, nav-to, screens) | Ja | Nee | — | Product | manual-only | Handmatig getest. |
| ZONE-SHEET-002| Zone-sheet openen/sluiten | Ja | Nee | E2E proof stap 4, 7 | Product | manual-only | Dekking in proof; geen aparte feature-row nodig. |
| PLATES-001    | Kentekens beheren (add/edit/delete/default) | Ja | Ja | — | Product | manual-only | Geen E2E. |
| HISTORY-001   | Historie + filters + export CSV/print | Ja | Nee | — | Product | manual-only | Geen E2E. |
| ACTIVE-001    | Actieve sessie (verleng/verkort eindtijd, END PARKING) | Ja | Nee | — | Product | manual-only | Geen E2E. |
| FAVORITES-001 | Favorieten (toggle, remove, edit name) | Ja | Nee | — | Product | manual-only | Geen E2E. |
| SETTINGS-001  | Taal, dark mode, onboarding dismiss | Ja | Nee | — | Product | manual-only | Geen E2E. |
| TOAST-001     | Toast tonen/dismiss | Ja | Nee | — | Product | manual-only | Geen E2E. |

---

## Feature PARK-TIME-001: Parkeertijd aanpassen

### Niveau 0: Doel

De gebruiker kan in het zone-detailscherm (bottom sheet) de gewenste parkeertijd verhogen of verlagen met plus- en minknoppen. De weergegeven duur moet direct en consistent bijwerken; bij de zone-maximum moet duidelijke feedback gegeven worden. Er is geen vrije invoer van minuten—alleen stappen (30/60 min) en de optie "Tot stoppen" (0 min).

### Niveau 1: Scope en scherm(en)

- **Waar:** Zone-detail sheet (`#sheet-zone`, `[data-testid="sheet-zone"]`), sectie "Parking duration" / "Duur".
- **Preconditions:**
  - Sheet is open (`activeOverlay === 'sheet-zone'`).
  - Er is een geselecteerde zone (`selectedZone` gezet, zone in `state.zones`).
  - Geen actieve parkeersessie (anders mag sheet-zone niet voor start gebruikt worden—zie `tryOpenOverlay` in `public/services.js`).

### Niveau 2: User stories

- **US1:** Als gebruiker wil ik de parkeertijd verhogen met de plus-knop zodat ik een langere duur kan kiezen (stappen 30 of 60 min, afhankelijk van huidige waarde).
- **US2:** Als gebruiker wil ik de parkeertijd verlagen met de min-knop zodat ik een kortere duur of "Tot stoppen" kan kiezen.
- **US3:** Als gebruiker wil ik een duidelijke melding zien wanneer ik de maximale duur van de zone bereik (toast + optioneel max-bericht onder de duur).
- **TBD:** Of "Standaard duur"-pills (Until stopped, 1u, 2u, 3u) de *huidige* sheet-duur direct zetten of alleen de default voor volgende keer: in code zetten de pills alleen `defaultDurationMinutes`; de huidige `duration` in de sheet wordt alleen bij openen van de sheet uit default gehaald. Zie `public/app.js` (set-default-duration) en `public/services.js` (tryOpenOverlay, duration uit defaultDur).

### Niveau 3: UI-contract (wat moet ik zien gebeuren)

- **Klik op plus (+):**
  - De waarde in het duration-veld moet binnen korte tijd veranderen.
  - Stappen: van 0 → 30 min; van 1–119 min → +30; van 120+ min → +60. Waarde wordt gecapped op zone-max (of 1440 min als zone geen max heeft).
  - Format: "Until stopped" bij 0; anders "Xh YYm" (bijv. "0h 30m", "2h 00m"). Geen decimale minuten.
- **Klik op min (−):**
  - Duur daalt: ≤30 → 0 ("Until stopped"); 31–120 → −30; >120 → −60.
  - Bij 0 mag de min-knop visueel gedimd zijn (opacity 0.3); plus mag bij max gedimd zijn.
- **Grenzen:**
  - Min: 0 ("Until stopped").
  - Max: `zone.max_duration_mins` indien aanwezig en > 0; anders 1440 min.
  - Geen vrije tekstinvoer; alleen +/− en (elders) standaard-duur-pills.
- **States:**
  - Normaal: plus en min zichtbaar, duration-tekst leesbaar.
  - Bij max: toast "Max parking duration reached" (of zone-specifieke uren-tekst); optioneel `#duration-max-msg` onder de control; plus-knop opacity 0.3.
  - Bij 0: min-knop opacity 0.3; tekst "Until stopped".
  - Geen loading-state voor alleen duration-aanpassing (geen API-call).
- **Wat mag nooit:**
  - Plus/min reageert niet (bij open sheet).
  - Tekst van `#val-duration` verandert niet na klik.
  - Sheet sluit onverwacht door een duration-klik.
  - Display en interne `state.duration` lopen uiteen (zelfde waarde direct na klik).

**Pills: default vs huidige sessie**

Op basis van de huidige code:

- De pills ("Until stopped", "1u", "2u", "3u") zetten **alleen** `defaultDurationMinutes` in state (en persistentie). Zie `public/app.js` case `set-default-duration`: alleen `S.update({ defaultDurationMinutes: capped })` en `S.saveDefaultDuration()`.
- De sheet haalt de **huidige** duur alleen bij **openen** van de sheet uit die default: `public/services.js` in `tryOpenOverlay('sheet-zone', contextData)` wordt `duration` uit `defaultDur` berekend en meegegeven in `S.update({ …, duration })`.
- **Gevolg:** Klikken op een pill **terwijl de sheet open is** verandert **niet** de getoonde duur in `#val-duration`. Alleen de default voor de *volgende* keer dat je een zone opent wordt aangepast. De getoonde duur verandert pas als je de sheet sluit en opnieuw opent (of een andere zone opent).

**User-visible expectation:** Een gebruiker die op "2u" klikt terwijl de sheet open staat, kan verwachten dat de duur direct naar 2u gaat; in de huidige implementatie gebeurt dat niet.

**Risk/confusion:** Gebruikers kunnen denken dat de pill de *huidige* keuze zet; dat leidt tot verwarring als ze na het klikken op "2u" nog "0h 30m" zien tot ze de sheet sluiten en weer openen.

**Acceptatiecriterium (contract vastleggen):**  
- **PILL-1:** Terwijl de zone-sheet open is: na klik op een pill (bijv. "2u") verandert de tekst van `#val-duration` **niet**. PASS: tekst ongewijzigd. FAIL: tekst verandert direct. (Als product later kiest om pills wél de huidige duur te zetten, moet dit criterium en de UX-tekst hierboven worden aangepast.)

### Niveau 4: Technisch contract

**1) Dummy uitleg**

- Klik op + of − wordt opgevangen door één centrale click-handler op document.
- Handler leest `data-action="mod-duration"` en `data-delta` (richting); de echte stapgrootte (30/60) zit in de service.
- Service haalt huidige `duration` en zone-max, berekent nieuwe waarde, kapt af op max, schrijft naar state.
- State-update triggert geen aparte API-call; duration wordt pas bij "START PARKING" meegestuurd.
- Het DOM-element voor de duur (`#val-duration`) wordt direct in de service bijgewerkt (en ook door UI bij hertekenen).

**2) Technisch exact**

- **Event handler:** `public/app.js`, in `handleClick`, `case 'mod-duration'`: leest `data-delta` van het geklikte element, roept `Services.modifyDuration(delta)` aan.
- **State/data:** `Q8.State.duration` (minuten, number). 0 = "Until stopped". Wordt gezet in `public/services.js` in `modifyDuration`: `S.update({ duration: capped })`.
- **DOM-update:** In `modifyDuration` wordt `document.getElementById('val-duration')` gezet: bij 0 → `innerText = 'Until stopped'`; anders `Xh YYm` met `h = floor(capped/60)`, `m = capped % 60`, minuten met leading zero als m < 10. Daarnaast kan `public/ui.js` (zone-sheet render) `#val-duration` en `#duration-max-msg` en plus/min opacity bijwerken bij state-update.
- **Backend/API:** Geen. Duration-aanpassing is puur lokaal; bij start parkeren wordt duration gebruikt in `handleStartParking` (eindtijd berekening).
- **Edge cases:** Bij `delta > 0` en `newDur > maxDur`: waarde wordt gecapped op max, toast getoond; plus-knop wordt in UI gedimd. Bij `duration === 0` en min: blijft 0; min-knop gedimd. `modifyDuration` doet niets als `activeOverlay !== 'sheet-zone'` of delta NaN (zie `public/services.js` regels 1411–1418).

### Acceptatiecriteria (micro-detail)

**Gate voor ✅:** Dit feature mag niet als ✅ worden gemarkeerd tot: (1) de min-control stabiel adresseerbaar is (bijv. data-testid) óf expliciet out-of-scope is vastgelegd, en (2) de proof zowel plus als min dekt óf min expliciet als alleen handmatig getest is gedocumenteerd.

**A) Menselijk zichtbaar (browser)**

| # | Criterium | Element (selector) | Verwachting | PASS/FAIL |
|---|-----------|--------------------|-------------|-----------|
| A1 | Plus verhoogt duur | `[data-testid="btn-zone-plus"]`, `#val-duration` | Na klik plus: tekst van `#val-duration` wijzigt (bijv. "2h 00m" → "2h 30m" of "0h 30m"). | PASS: tekst veranderd. FAIL: ongewijzigd. |
| A2 | Min verlaagt duur | `.sheet-duration-control [data-delta="-15"]`, `#val-duration` | Na klik min: duur daalt of wordt 0 ("Until stopped"). | PASS: tekst daalt of "Until stopped". FAIL: stijgt of blijft gelijk waar dalen verwacht. |
| A3 | Format 0 | `#val-duration` | Bij duration 0: exact "Until stopped". | PASS: tekst is "Until stopped". FAIL: anders. |
| A4 | Format Xh YYm | `#val-duration` | Bij duration > 0: vorm "Xh YYm" of "X" (gehele uren), minuten met leading zero (bijv. "0h 30m"). | PASS: herkenbaar formaat. FAIL: decimaal of ander formaat. |
| A5 | Max-toast | (toast) | Bij verhogen tot zone-max: toast met "Max parking duration reached" of zone-max uren. | PASS: toast zichtbaar. FAIL: geen toast bij max. |
| A6 | Plus gedimd bij max | `[data-testid="btn-zone-plus"]` of `.sheet-duration-control [data-delta="15"]` | Bij duration === zone-max: plus-knop opacity 0.3 (of gelijkwaardig visueel gedimd). | PASS: gedimd. FAIL: vol opacity. |

**B) Technisch (console, network, state)**

| # | Criterium | Check | PASS/FAIL |
|---|-----------|--------|-----------|
| B1 | Geen backend-call bij +/− | Network tab: geen request bij klik plus/min. | PASS: geen. FAIL: wel request. |
| B2 | State consistent | Na klik: `Q8.State.duration` === waarde die in `#val-duration` getoond wordt (in minuten). | PASS: gelijk. FAIL: verschil. |
| B3 | Geen errors | Console: geen uncaught errors bij klik plus/min. | PASS: geen. FAIL: error. |

**C) Automatisch testbaar (E2E/proof)**

| # | Criterium | Proof-stap | PASS/FAIL |
|---|-----------|------------|-----------|
| C1 | Duration verandert na plus | Proof stap 5–6: lees `[data-testid="duration-value"]`, klik `[data-testid="btn-zone-plus"]`, wacht tot `#val-duration` tekst != oude waarde. | PASS: stap 6 groen. FAIL: "Duration changed" faalt. |
| C2 | Selectors stabiel | Proof gebruikt `#val-duration`, `[data-testid="duration-value"]`, `[data-testid="btn-zone-plus"]`. | PASS: geen selector-wijziging zonder proof-update. FAIL: proof breekt door selector. |

**D) Negatieve checks**

| # | Criterium | Verwachting | PASS/FAIL |
|---|-----------|-------------|-----------|
| D1 | Plus bij gesloten sheet | `modifyDuration` wordt niet uitgevoerd of heeft geen effect als sheet niet open is. | PASS: geen wijziging. FAIL: duration verandert. |
| D2 | Geen onverwacht sluiten | Na klik plus/min: sheet blijft open. | PASS: sheet open. FAIL: sheet sluit. |
| D3 | Min bij 0 | Bij duration 0: klik min verandert niets; min visueel gedimd. | PASS: 0 blijft 0, knop gedimd. FAIL: negatieve waarde of niet gedimd. |
| D4 | Pills veranderen niet de getoonde duur (sheet open) | `.duration-default-pill`, `#val-duration` | Terwijl sheet open is: klik op een pill (bijv. "2u"). De tekst van `#val-duration` verandert niet. | PASS: tekst ongewijzigd. FAIL: tekst verandert direct. Zie ook subsectie "Pills: default vs huidige sessie". |

### Known deviations vs rules

- **Geen:** `#duration-max-msg` gebruikt nu de class `duration-max-msg` uit design-system.css (tokens: `--danger`, `--space-05`). Min-knop heeft `data-testid="btn-zone-minus"`.

### Testplan

**Smoke (ca. 30 s):**

1. Open app → map.
2. Open zone-sheet (klik zone/marker of E2E-seed).
3. Lees `#val-duration` (bijv. "2h 00m").
4. Klik plus: controleer dat `#val-duration` veranderd is.
5. Klik min (indien > 0): controleer dat duur daalt of "Until stopped" wordt.
6. Controleer dat sheet open blijft.

**Functioneel (2–5 min):**

1. Open sheet; noteer startduur.
2. Meerdere plus-klikken tot max; controleer toast en gedimde plus.
3. Meerdere min-klikken tot 0; controleer "Until stopped" en gedimde min.
4. Van 0 één keer plus: moet 30 min tonen.
5. Format check: 30 min = "0h 30m", 60 min = "1" of "1h 00m", 90 min = "1h 30m".
6. Zone met lage max_duration_mins (indien beschikbaar): controleer cap en toast.
7. Sluit sheet, open andere zone: duur volgens default of 0.
8. Geen netwerkverzoek bij alleen +/− (network tab).
9. Console vrij van errors bij alle stappen.

**Proof/E2E:**

- **Stap 5:** Lees duration voor (tekst van `[data-testid="duration-value"]`).
- **Stap 6:** Klik `[data-testid="btn-zone-plus"]`; assert dat `#val-duration` innerText veranderd is. Screenshot na plus.
- Min-knop en "Until stopped" worden in de huidige proof niet geassert; uitbreiding mogelijk (zie TBD).

### Observability

- **Logging:** Bij negeren van `modifyDuration` (sheet niet open of delta NaN): `console.warn('[DURATION] modifyDuration ignored: ...')` in `public/services.js` (ca. regels 1413, 1417). Geen extra log bij succesvolle wijziging; optioneel: één regel "duration set to X" voor debugging.
- **Screenshots:** Proof schrijft o.a. `proof-after-plus-*.png` in `test-output/e2e-proof/`; dat is het visuele bewijs voor "duration na plus".

---

## Canon-updateprotocol (voor agents)

- Bij elke codewijziging die user-visible gedrag raakt, moet de canon in dezelfde change worden bijgewerkt.
- Als een feature wordt verwijderd of verborgen: markeer als Deprecated in de feature-index en pas de betreffende sectie aan.
- Een feature mag alleen als ✅ worden gemarkeerd als er een geautomatiseerde check bestaat én die check groen is.
- Onbekende of nog niet in code gevonden details: markeer als TBD en verwijs naar bestand/functie (bijv. bestandsnaam + regel of functienaam) waar het waarschijnlijk zit.
