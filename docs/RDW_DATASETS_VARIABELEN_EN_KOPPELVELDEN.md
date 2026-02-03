# RDW parkeerdata: variabelen per dataset en koppelvelden

Overzicht van de **zes gekoppelde RDW-datasets** die de app gebruikt: alle variabelen (velden) met een uitleg “voor dummies” en de velden waarmee je de datasets aan elkaar koppelt.

**Bronnen:** opendata.rdw.nl (Socrata), npropendata.rdw.nl (SPDP).  
**Gebruik in app:** `fetch_rdw_data.py` → Firestore `zones`; `scripts/fetch_npropendata_facilities.py` → Firestore `facilities`; `kenteken.js` → RDW lookup (client-side). Zie ook secties 7 (npropendata), 8 (kenteken) en 9 (uitbreiding gemeenten).

---

## Quick reference – alle RDW-resources in dit project

| Bron | Resource ID / endpoint | URL / opmerking | Gebruik |
|------|------------------------|------------------|---------|
| **Parkeer – Gebied** | b3us-f26s | `https://opendata.rdw.nl/resource/b3us-f26s.json` | fetch_rdw_data.py → zones |
| **Parkeer – Regeling-mapping** | qtex-qwd8 | `https://opendata.rdw.nl/resource/qtex-qwd8.json` | fetch_rdw_data.py → zones |
| **Parkeer – Tijdvak** | ixf8-gtwq | `https://opendata.rdw.nl/resource/ixf8-gtwq.json` | fetch_rdw_data.py → zones |
| **Parkeer – Tariefdeel** | 534e-5vdg | `https://opendata.rdw.nl/resource/534e-5vdg.json` | fetch_rdw_data.py → zones |
| **Parkeer – Tariefberekening** | nfzq-8g7y | `https://opendata.rdw.nl/resource/nfzq-8g7y.json` | fetch_rdw_data.py → zones |
| **Parkeer – Regeling-beschrijving** | yefi-qfiq | `https://opendata.rdw.nl/resource/yefi-qfiq.json` | fetch_rdw_data.py → zones |
| **Garages/P+R – facility-lijst** | (SPDP v2) | `https://npropendata.rdw.nl/parkingdata/v2/` | fetch_npropendata_facilities.py → facilities |
| **Garages/P+R – static per facility** | (per UUID) | GET `staticDataUrl` uit lijst | fetch_npropendata_facilities.py → facilities |
| **Kenteken – Voertuigen** | m9d7-ebf2 | `https://opendata.rdw.nl/resource/m9d7-ebf2.json` | kenteken.js (validatie, merk/type) |
| **Kenteken – Brandstof/emissie** | 8ys7-d773 | `https://opendata.rdw.nl/resource/8ys7-d773.json` | kenteken.js (Car specs, EV) |
| **Optioneel – Gebruiksdoel** | hz3g-w2u9 | `https://opendata.rdw.nl/resource/hz3g-w2u9.json` | Gebruiksdoel omschrijving (niet in pipeline) |
| **Optioneel – Verkooppunten** | 5754-u6df | `https://opendata.rdw.nl/resource/5754-u6df.json` | Lijst areamanagerid's (uitbreiding gemeenten) |

---

## Overzicht van de zes datasets (voor dummies)

Stel je voor: zes “boeken” over parkeren. Elk boek heeft zijn eigen onderwerp en is via **koppelvelden** verbonden met andere boeken, zodat je het complete plaatje krijgt.

| # | Dataset | In één zin |
|---|---------|------------|
| 1 | **Gebied** | *Waar* je kunt parkeren (zone, coördinaten, beheerder). |
| 2 | **Regeling-mapping** | *Welke regels* in *welk gebied* gelden en *wanneer* (datumreeks). |
| 3 | **Tijdvak** | *Op welke dagen en tijden* binnen een regeling welk tarief geldt en *hoe lang* je max mag parkeren. |
| 4 | **Tariefdeel** | *Hoeveel* elk stukje parkeertijd kost (bedrag per stap, stapgrootte). |
| 5 | **Tariefberekening** | *Omschrijving* van de tariefmethode (bijv. “Standaard uurtarief”, “Per 20 min”). |
| 6 | **Regeling-beschrijving** | *Details* over de parkeerregel (type, omschrijving). |

---

## 1. Dataset: Gebied

- **Resource ID:** `b3us-f26s`
- **URL-voorbeeld:** `https://opendata.rdw.nl/resource/b3us-f26s.json?areamanagerid=363&$limit=5000`
- **Voor dummies:** Basisinformatie over parkeer**zones**: welk gebied, welke beheerder, naam en kaart (geometrie).

### Variabelen (velden)

| Veld | Type / voorbeeld | Uitleg |
|------|-------------------|--------|
| `areaid` | string (bijv. `"12100"`, `"T12B"`) | Unieke code van het parkeergebied (zoals een “postcode” van de zone). |
| `areamanagerid` | string (bijv. `"363"`, `"599"`) | Code van de beheerder (meestal gemeente). 363 = Amsterdam, 599 = Rotterdam, 518 = Den Haag, 344 = Utrecht, etc. |
| `areadesc` | string of null | Leesbare omschrijving van het gebied (bijv. “Parkeerzone Centrum Oost”). |
| `areageometryaswgs84` | object (GeoJSON) of null | Geometrie van het gebied in WGS84: coördinaten of polygon voor op de kaart. |

### Koppelvelden (de “lijm”)

- **`areaid`** → gebruik je om dit gebied te koppelen aan **Regeling-mapping** (welke regelingen in dit gebied gelden).
- **`areamanagerid`** → gebruik je om te filteren op gemeente en om te koppelen aan **Tariefdeel** en **Tariefberekening** (die ook per beheerder zijn).

---

## 2. Dataset: Regeling-mapping

- **Resource ID:** `qtex-qwd8`
- **URL-voorbeeld:** `https://opendata.rdw.nl/resource/qtex-qwd8.json?areamanagerid=363&$limit=5000`
- **Voor dummies:** De “brug” tussen **gebied** en **regels**: in welk gebied geldt welke regeling, en in welke periode.

### Variabelen (velden)

| Veld | Type / voorbeeld | Uitleg |
|------|-------------------|--------|
| `areaid` | string | Zelfde als in Gebied: welk parkeergebied. |
| `areamanagerid` | string | Beheerder van het gebied. |
| `regulationid` | string | Unieke code van een **parkeerregeling** (bijv. betaald parkeren, vergunning). |
| `startdatearearegulation` | string (YYYYMMDD) | Datum **vanaf** wanneer deze regeling in dit gebied geldt. |
| `enddatearearegulation` | string (YYYYMMDD) of null | Datum **tot** wanneer deze regeling geldt (leeg = nog geldig). |

### Koppelvelden

- **`areaid`** → koppelt aan **Gebied** (welk gebied).
- **`regulationid`** → koppelt aan **Tijdvak** (welke tijden/tarieven) en aan **Regeling-beschrijving** (wat voor regeling).

---

## 3. Dataset: Tijdvak

- **Resource ID:** `ixf8-gtwq`
- **URL-voorbeeld:** `https://opendata.rdw.nl/resource/ixf8-gtwq.json?areamanagerid=363&$limit=10000`
- **Voor dummies:** Binnen één regeling: *op welke dag*, *van–tot welke tijd* welk tarief geldt en *hoe lang* je er maximaal mag staan.

### Variabelen (velden)

| Veld | Type / voorbeeld | Uitleg |
|------|-------------------|--------|
| `areamanagerid` | string | Beheerder. |
| `regulationid` | string | Welke regeling (koppeling met Regeling-mapping). |
| `daytimeframe` | string | Dag: `MAANDAG`, `DINSDAG`, `WOENSDAG`, `DONDERDAG`, `VRIJDAG`, `ZATERDAG`, `ZONDAG`, of `DAGELIJKS` (alle dagen). |
| `starttimetimeframe` | string (bijv. `"900"`, `"0"`) | Starttijd in 24-uursnotatie zonder dubbele punt (900 = 09:00, 0 = middernacht). |
| `endtimetimeframe` | string (bijv. `"1800"`, `"2400"`) | Eindtijd (1800 = 18:00, 2400 = einde dag). |
| `farecalculationcode` | string | Code die zegt **welke tariefberekening** voor dit tijdvak geldt → koppeling naar Tariefdeel en Tariefberekening. |
| `maxdurationright` | number (minuten) of 0 | Maximale parkeerduur in dit tijdvak (bijv. 120 = max 2 uur). 0 = geen max in dit veld. |
| `startdatetimeframe` | string (YYYYMMDD) | Vanaf wanneer dit tijdvak geldig is (voor datumfiltering). |

### Koppelvelden

- **`regulationid`** → koppelt aan **Regeling-mapping** en **Regeling-beschrijving**.
- **`farecalculationcode`** → koppelt aan **Tariefdeel** en **Tariefberekening** (welk bedrag, welke omschrijving).

---

## 4. Dataset: Tariefdeel

- **Resource ID:** `534e-5vdg`
- **URL-voorbeeld:** `https://opendata.rdw.nl/resource/534e-5vdg.json?areamanagerid=363&$limit=10000`
- **Voor dummies:** De **bedragen**: hoeveel kost één “stap” parkeren (bijv. € 1,00 per 20 min). Uurtarief in de app = `(amountfarepart / stepsizefarepart) * 60`.

### Variabelen (velden)

| Veld | Type / voorbeeld | Uitleg |
|------|-------------------|--------|
| `areamanagerid` | string | Beheerder. |
| `farecalculationcode` | string | Zelfde code als in Tijdvak: welke tariefmethode. |
| `amountfarepart` | number (bijv. 1.0) | **Bedrag** per stap (bijv. € 1,00). |
| `stepsizefarepart` | number (bijv. 20, 60) | **Stapgrootte in minuten**: voor hoeveel minuten geldt `amountfarepart` (20 = per 20 min, 60 = per uur). |
| `startdatefarepart` | string (YYYYMMDD) | Vanaf wanneer dit tariefdeel geldt. |
| `enddatefarepart` | string (YYYYMMDD) of null | Tot wanneer dit tariefdeel geldt. |
| `startdurationfarepart` | number (optioneel) | Soms: vanaf welke parkeerduur dit deel geldt (bijv. eerste 30 min ander tarief). |

### Koppelvelden

- **`farecalculationcode`** (+ areamanagerid) → koppelt aan **Tijdvak** en **Tariefberekening**.

### Berekening in de app

- **Uurtarief** = `(amountfarepart / stepsizefarepart) * 60`  
  Voorbeeld: € 1,00 per 20 min → (1 / 20) * 60 = € 3,00 per uur.

---

## 5. Dataset: Tariefberekening

- **Resource ID:** `nfzq-8g7y`
- **URL-voorbeeld:** `https://opendata.rdw.nl/resource/nfzq-8g7y.json?areamanagerid=363&$limit=5000`
- **Voor dummies:** Korte **omschrijving** van de tariefmethode bij een `farecalculationcode` (bijv. “Standaard uurtarief”, “Per 20 minuten”).

### Variabelen (velden)

| Veld | Type / voorbeeld | Uitleg |
|------|-------------------|--------|
| `areamanagerid` | string | Beheerder. |
| `farecalculationcode` | string | Code van de tariefmethode (zelfde als in Tijdvak en Tariefdeel). |
| `farecalculationdesc` | string | Beschrijving van de berekening (Nederlands), bijv. “1,00 per 20 min”, “Stop en Shop eerste 15 min”. |
| `startdatefare` | string (YYYYMMDD) (optioneel) | Geldig vanaf. |
| `enddatefare` | string (optioneel) | Geldig tot. |
| `vatpercentage` | number (optioneel) | BTW-percentage. |

### Koppelvelden

- **`farecalculationcode`** (+ areamanagerid) → koppelt aan **Tijdvak** en **Tariefdeel**.

---

## 6. Dataset: Regeling-beschrijving

- **Resource ID:** `yefi-qfiq`
- **URL-voorbeeld:** `https://opendata.rdw.nl/resource/yefi-qfiq.json?areamanagerid=363&$limit=5000`
- **Voor dummies:** Algemene **informatie over een regeling**: type (betaald, vergunning, etc.) en omschrijving. Niet gekoppeld aan één gebied; hetzelfde regulationid kan in meerdere gebieden gelden.

### Variabelen (velden)

| Veld | Type / voorbeeld | Uitleg |
|------|-------------------|--------|
| `areamanagerid` | string | Beheerder. |
| `regulationid` | string | Unieke code van de regeling (zelfde als in Regeling-mapping en Tijdvak). |
| `regulationdesc` | string | Omschrijving van de regeling (bijv. “Betaald parkeren”, “Vergunninghouders”). |
| `regulationtype` | string (bijv. `B`, `VERGUNP`, `BEWONERP`, `GARAGEP`) | Type: B = regulier betaald, VERGUNP = vergunning, etc. De app filtert op straatparkeren (geen vergunning/garage). |

### Koppelvelden

- **`regulationid`** (+ areamanagerid) → koppelt aan **Regeling-mapping** en **Tijdvak**.

---

## Samenvatting koppelvelden (hoe de “boeken” aan elkaar hangen)

| Koppelveld | Gebruik |
|------------|--------|
| **`areaid`** | Van **Gebied** naar **Regeling-mapping**: “In dit gebied gelden welke regelingen?” |
| **`areamanagerid`** | In bijna alle datasets: filter op gemeente en unieke combinatie (mgr + areaid, mgr + regulationid, mgr + farecalculationcode). |
| **`regulationid`** | Van **Regeling-mapping** naar **Tijdvak** en **Regeling-beschrijving**: “Welke tijden en welk type regeling?” |
| **`farecalculationcode`** | Van **Tijdvak** naar **Tariefdeel** en **Tariefberekening**: “Welk bedrag en welke omschrijving voor dit tijdvak?” |

### Stappen in woorden

1. Kies een **gebied** (`areaid` + `areamanagerid`) uit **Gebied**.
2. Zoek in **Regeling-mapping** alle regelingen voor dat gebied (`areaid`) die nu geldig zijn (datum).
3. Per **regulationid** haal je uit **Tijdvak** de dagen, tijden, `farecalculationcode` en `maxdurationright`.
4. Per **farecalculationcode** haal je uit **Tariefdeel** het bedrag en de stapgrootte, en uit **Tariefberekening** de omschrijving.
5. Uit **Regeling-beschrijving** haal je bij **regulationid** het type en de omschrijving van de regeling (om o.a. vergunningzones te filteren).

Zo krijg je per zone: *waar*, *welke regels*, *wanneer* (dagen/tijden), *hoeveel* (tarief) en *max duur*.

---

## 7. npropendata.rdw.nl (SPDP) – garages en P+R

**Bron:** [npropendata.rdw.nl](https://npropendata.rdw.nl/) – NPR OpenData Web API (SPDP).  
**Script:** `scripts/fetch_npropendata_facilities.py` → Firestore collectie `facilities`.

### 7.1 Facility-lijst (GET /parkingdata/v2/)

| Veld | Type | Uitleg |
|------|------|--------|
| `name` | string | Naam van de facility. |
| `identifier` | string | UUID van de facility (document-ID in Firestore). |
| `staticDataUrl` | string | URL om statische data per facility op te halen. |
| `dynamicDataUrl` | string (optioneel) | URL voor dynamische bezetting (SPDP). |
| `limitedAccess` | boolean (optioneel) | Beperkte toegang (bijv. vergunninghouders). |
| `staticDataLastUpdated` | number (optioneel) | Unix-timestamp laatste wijziging static data (voor incrementeel verversen). |

### 7.2 Static data per facility (GET staticDataUrl)

Onder `parkingFacilityInformation` (en elders in de JSON):

| Bron / veld | Uitleg |
|-------------|--------|
| `name`, `description` | Naam en omschrijving. |
| `accessPoints[0].accessPointLocation[0]` | `latitude`, `longitude` (WGS84). |
| `accessPoints[0].accessPointAddress` | `streetName`, `houseNumber`, `city`, `zipcode`. |
| `specifications[]` | `capacity`, `chargingPointCapacity`, `disabledAccess`, `minimumHeightInMeters`, `usage` (bijv. "Garage parkeren"). |
| `operator` | `name`, `url` (website). |
| `openingTimes[]` | `openAllYear`, `entryTimes[]` (enterFrom/enterUntil, dayNames). |
| `tariffs[]` | `tariffDescription`, `intervalRates[]` (charge, chargePeriod, durationType). |
| `paymentMethods[]` | `method` (Banknotes, Maestro, Visa, etc.). |

**Output in Firestore (per facility):** `id`, `name`, `description`, `lat`, `lng`, `type` (garage|p_r), `city`, `street`, `tariffSummary`, `dynamicDataUrl`, `capacity`, `chargingPointCapacity`, `disabledAccess`, `minimumHeightInMeters`, `operatorUrl`, `openingTimesSummary`, `paymentMethods`, `updated_at`. Optioneel: `staticDataLastUpdated` (bij gebruik van `--incremental`).

---

## 8. RDW Kenteken / voertuig (opendata.rdw.nl)

**Gebruik in app:** `kenteken.js` – validatie, lookup merk/type, Car specs (inclusief brandstof/EV). Geen API-key; cache TTL 5 min.

### 8.1 Gekentekende voertuigen (m9d7-ebf2)

- **URL:** `https://opendata.rdw.nl/resource/m9d7-ebf2.json?kenteken=XXX&$limit=1`
- **Variabelen (selectie; dataset heeft ~98 kolommen):**

| Veld | Type | Gebruik in app |
|------|------|-----------------|
| `kenteken` | string | Lookup-key. |
| `merk` | string | Weergave (bijv. "Volkswagen"). |
| `handelsbenaming` | string | Type/model. |
| `voertuigsoort` | string | Personenoauto, vrachtwagen, etc. |
| `eerste_kleur`, `tweede_kleur` | string | Optioneel. |
| `vervaldatum_apk` | number | APK-vervaldatum. |
| `datum_tenaamstelling` | number | Eerste tenaamstelling NL. |

### 8.2 Gekentekende voertuigen brandstof (8ys7-d773)

- **URL:** `https://opendata.rdw.nl/resource/8ys7-d773.json?kenteken=XXX&$limit=1`
- **Variabelen (selectie):**

| Veld | Type | Gebruik in app |
|------|------|-----------------|
| `kenteken` | string | Koppeling met voertuigen-dataset. |
| `brandstof_omschrijving` | string | Gebruikt voor "is elektrisch?" (regex op elektriciteit|elektrisch|plugin|bev|ev). |
| `emissiecode_omschrijving` | string | Voor milieuzones (zie docs/MILIEUZONE_KENTEKEN_PLAN.md). |

---

## 9. Uitbreiding gemeenten (areamanagerid)

De pipeline voor straatparkeren filtert op **areamanagerid** (beheerder/gemeente). De set staat in `fetch_rdw_data.py` als **TARGET_CITIES**.

### 9.1 Huidige gemeenten (TARGET_CITIES)

| areamanagerid | Gemeente |
|---------------|----------|
| 363 | Amsterdam |
| 599 | Rotterdam |
| 518 | Den Haag |
| 344 | Utrecht |
| 268 | Nijmegen |
| 307 | Amersfoort |

### 9.2 Meer gemeenten toevoegen

1. **Optioneel – lijst beheerders ophalen:**  
   `https://opendata.rdw.nl/resource/5754-u6df.json?$limit=1000` levert o.a. `areamanagerid`; of gebruik dataset **b3us-f26s** met `$select=areamanagerid` en groepeer om unieke beheerders te zien.
2. **In `fetch_rdw_data.py`:** Voeg een regel toe aan het dictionary `TARGET_CITIES`, bijv. `"XXX": "Gemeentenaam"`. Dezelfde set wordt gebruikt voor alle zes Socrata-datasets (AREAS, MAPPING, TIJDVAK, TARIEFDEEL, DESC, CALC).
3. **Filter in de app:** `services.js` filtert zones op straatparkeren (`isStreetParkingZone`); uitgesloten usage-types (o.a. VERGUNP, BEWONERP, GARAGEP) staan in `EXCLUDED_USAGE`.

Voor een **tweede bron** (bijv. npropendata voor zones in meer gemeenten) zie `docs/RAPPORT_NPR_RDW_SHPV_PARKERDATA_ANALYSE.md` (AANBEVELING E1).

---

*Zie ook: `docs/RAPPORT_NPR_RDW_SHPV_PARKERDATA_ANALYSE.md`, `docs/ONDERZOEKSPRAPPORT_TARIEVEN_PARKEREN.md`, `docs/PLAN_GARAGES_P_R_NPROPENDATA.md`, `docs/RAPPORT_DATABRONNEN_VARIABELEN_PLAN.md`, en `fetch_rdw_data.py`.*
