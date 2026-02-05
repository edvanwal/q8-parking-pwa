# Grondige analyse: Databronnen, variabelen, markt en aanbevelingen

**Rol:** Dataspecialist  
**Doel:** Inventarisatie van alle huidige databronnen en variabelen, analyse van aanvullende bronnen, markt- en mobiliteitsontwikkelingen (o.a. EV), en een concreet plan met aanbevelingen voor de B2B parkeer-PWA.  
**Datum:** 2 februari 2026

---

## 1. Samenvatting

De B2B parkeer-PWA gebruikt momenteel **vier externe databronnen** (RDW parkeerdata Socrata, RDW npropendata SPDP, RDW kenteken/brandstof, Google Maps/Geocoding) en **Firebase** (Firestore + Auth). Er is **geen** gebruik van laadpaaldata, dynamische bezetting op straatniveau, milieuzones per kenteken, of NPR voor mobiel parkeren. De markt ontwikkelt zich richting **meer EV, slim laden en prijstransparantie**; laadpunten bij parkeren en “parkeren + laden in één” worden steeds relevanter. Dit rapport geeft een **volledige inventarisatie**, **variabelenoverzicht**, **markt- en mobiliteitsanalyse** en een **gefaseerd plan met aanbevelingen**.

---

## 2. Huidige databronnen – overzicht

| #   | Bron                                    | Type                                                                                           | Gebruik in app                                                                                                                        | Toegang | API-key                     |
| --- | --------------------------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ------- | --------------------------- |
| 1   | **opendata.rdw.nl** (Socrata)           | Statische parkeerdata (gebieden, regelingen, tijdvakken, tarieven)                             | Ja – `fetch_rdw_data.py` → Firestore `zones`                                                                                          | Open    | Nee                         |
| 2   | **npropendata.rdw.nl** (SPDP)           | Garages en P+R (statisch + optioneel dynamisch)                                                | Ja – `fetch_npropendata_facilities.py` → Firestore `facilities`; app toont “in de buurt” + dynamische bezetting waar `dynamicDataUrl` | Open    | Nee                         |
| 3   | **opendata.rdw.nl** (kenteken/voertuig) | Gekentekende voertuigen + brandstof/emissie                                                    | Ja – `kenteken.js`: validatie, RDW lookup (merk/type), Car specs                                                                      | Open    | Nee                         |
| 4   | **Google Maps / Geocoding**             | Kaart en adres → coördinaten                                                                   | Ja – `services.js`: geocodeAndSearch (zoeken op adres)                                                                                | API     | Ja (Firebase config)        |
| 5   | **Firebase**                            | Firestore (zones, facilities, users, sessions, transactions, tenants, invites, auditLog), Auth | Ja – alle app-data en sessies                                                                                                         | Cloud   | Ja                          |
| 6   | **Gemini (Google)**                     | Vertaling tariefomschrijvingen (NL→EN)                                                         | Ja – `fetch_rdw_data.py`: translate_desc_llm                                                                                          | API     | Ja (GEMINI_API_KEY in .env) |

---

## 3. Variabelen per bron (gedetailleerd)

### 3.1 RDW Parkeerdata (opendata.rdw.nl – Socrata)

**Pipeline:** `fetch_rdw_data.py` haalt zes gekoppelde datasets op, verwerkt ze en schrijft naar Firestore collectie `zones`.

| Dataset               | Resource ID | Belangrijkste variabelen (input)                                                                                                          | Gebruik in pipeline                                           |
| --------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Gebied                | b3us-f26s   | `areaid`, `areamanagerid`, `areadesc`, `areageometryaswgs84`                                                                              | Zone-ID, naam, stad, geometrie → lat/lng                      |
| Regeling-mapping      | qtex-qwd8   | `areaid`, `areamanagerid`, `regulationid`, `startdatearearegulation`, `enddatearearegulation`, `usageid`                                  | Koppeling gebied ↔ regeling; filter op usage (straatparkeren) |
| Tijdvak               | ixf8-gtwq   | `regulationid`, `daytimeframe`, `starttimetimeframe`, `endtimetimeframe`, `farecalculationcode`, `maxdurationright`, `startdatetimeframe` | Dagen/tijden, tariefcode, max parkeerduur                     |
| Tariefdeel            | 534e-5vdg   | `farecalculationcode`, `amountfarepart`, `stepsizefarepart`, `startdatefarepart`, `enddatefarepart`, `startdurationfarepart`              | Bedrag per stap, stapgrootte (min) → uurtarief                |
| Tariefberekening      | nfzq-8g7y   | `farecalculationcode`, `farecalculationdesc`, `startdatefare`, `enddatefare`, `vatpercentage`                                             | Omschrijving tarief (incl. LLM-vertaling)                     |
| Regeling-beschrijving | yefi-qfiq   | `regulationid`, `regulationdesc`, `regulationtype`                                                                                        | Filter op type (B = betaald; vergunning e.d. uitgesloten)     |

**Filter in pipeline:**

- **Gemeenten:** alleen `TARGET_CITIES`: Amsterdam (363), Rotterdam (599), Den Haag (518), Utrecht (344), Nijmegen (268), Amersfoort (307).
- **Regelingtypes:** o.a. VERGUNP, BEWONERP, GARAGEP uitgesloten (alleen straatparkeren).
- **Usageid:** via mapping; EXCLUDED_USAGE in services.js sluit o.a. VERGUNP, BEWONERP, GARAGEP, CARPOOL uit.

**Output per zone (Firestore `zones`):**

| Veld              | Type    | Bron                                                   |
| ----------------- | ------- | ------------------------------------------------------ |
| id                | string  | display_id (areaid of alias, bijv. 12100)              |
| name              | string  | areadesc of "Stad Zone id"                             |
| city              | string  | TARGET_CITIES[areamanagerid]                           |
| mgr_id            | string  | areamanagerid                                          |
| lat, lng          | number  | uit areageometryaswgs84 (of city center + offset)      |
| price             | number  | max uurtarief uit tariefdelen                          |
| rates             | array   | { time, price, detail, rate_numeric } per tijdslot/dag |
| max_duration_mins | number  | maxdurationright (minuten)                             |
| has_special_rules | boolean | o.a. niet-standaard dagtypen                           |
| updated_at        | string  | ISO-timestamp run                                      |

**Niet gebruikt uit RDW parkeerdata (maar beschikbaar):**

- Datumgrenzen per regeling/tarief (startdate/enddate) voor “geldig op datum X”.
- `usageid` in Firestore wordt niet opgeslagen per zone (alleen voor filter in pipeline).
- Tariefdelen met step > 60 worden wel meegenomen (o.a. dagkaarten); weergave “alle dagen” is optioneel in UI.

---

### 3.2 npropendata.rdw.nl (SPDP – garages en P+R)

**Pipeline:** `scripts/fetch_npropendata_facilities.py` – GET facility-lijst, filter op garage/P+R, GET static data per facility, schrijf naar Firestore `facilities`.

**Input (facility-lijst v2):**

- `name`, `identifier` (UUID), `staticDataUrl`, `dynamicDataUrl` (optioneel), `limitedAccess`, `staticDataLastUpdated`.

**Input (static data per facility):**

- `parkingFacilityInformation`: name, description, specifications (capacity, chargingPointCapacity, disabledAccess, minimumHeightInMeters, usage), operator (name, url), openingTimes, tariffs, paymentMethods, accessPoints (locatie, adres), contactPersons, specialDays, parkingRestrictions.

**Output per facility (Firestore `facilities`):**

| Veld                  | Type    | Bron                                   |
| --------------------- | ------- | -------------------------------------- |
| id                    | string  | identifier (UUID)                      |
| name                  | string  | parkingFacilityInformation.name        |
| description           | string  | optioneel                              |
| lat, lng              | number  | accessPoints[0].accessPointLocation[0] |
| type                  | string  | "garage" \| "p_r" (uit naam/usage)     |
| city, street          | string  | accessPointAddress                     |
| tariffSummary         | string  | eerste tariefregel / "€ X / Y min"     |
| dynamicDataUrl        | string  | voor dynamische bezetting              |
| capacity              | number  | specifications                         |
| chargingPointCapacity | number  | laadplekken                            |
| disabledAccess        | boolean | rolstoeltoegankelijk                   |
| minimumHeightInMeters | number  | max hoogte                             |
| operatorUrl           | string  | website beheerder                      |
| openingTimesSummary   | string  | "24/7" of "Ma-Vr 07:00-23:00"          |
| paymentMethods        | array   | betaalmethoden                         |
| updated_at            | string  | timestamp                              |

**App:** Leest `facilities`, filtert op afstand (2 km standaard, instelbaar 1/2/5 km) t.o.v. gebruikerslocatie of gekozen zone. Dynamische bezetting: `fetchFacilityOccupancies()` haalt voor facilities met `dynamicDataUrl` SPDP-data op en parst beschikbare capaciteit → `state.facilityOccupancy`.

---

### 3.3 RDW Kenteken / voertuig (opendata.rdw.nl)

**Bronnen in app:** `kenteken.js` – RDW_VOERTUIGEN_URL (m9d7-ebf2), RDW_BRANDSTOF_URL (8ys7-d773).

**Gekentekende voertuigen (m9d7-ebf2):**

- Gebruikt: `kenteken`, `merk`, `handelsbenaming`, `voertuigsoort`, (evt. `eerste_kleur`, `vervaldatum_apk`, etc.).
- Variabelen: 98 kolommen in dataset; app gebruikt vooral merk/type voor weergave en validatie.

**Gekentekende voertuigen brandstof (8ys7-d773):**

- Gebruikt: koppeling brandstof/elektrisch (o.a. voor “is EV?”).
- Relevant voor toekomstige features: emissie (milieuzones), brandstofsoort.

**Toegang:** GET met `?kenteken=XXX` (normalised). Cache TTL 5 min (rate limits). Geen API-key.

---

### 3.4 Google Maps / Geocoding

**Gebruik:** `services.js` – `geocodeAndSearch(query)`: adres + " Netherlands" → GET Geocoding API → lat/lng → filter zones op afstand (Haversine &lt; 2 km), sorteer op afstand.

**Variabelen:** request: `address`, `key`; response: `results[0].geometry.location` (lat, lng). Geen andere Maps-API (Directions, Places) in huidige codebase.

---

### 3.5 Firestore – collecties en hoofdvariabelen

| Collectie    | Doel                          | Belangrijkste velden (voorbeeld)                                                                                                |
| ------------ | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| zones        | Parkeerzones (straatparkeren) | id, name, city, lat, lng, price, rates, max_duration_mins, has_special_rules, updated_at                                        |
| facilities   | Garages en P+R                | id, name, lat, lng, type, city, tariffSummary, dynamicDataUrl, capacity, chargingPointCapacity, openingTimesSummary, updated_at |
| users        | Gebruikersprofiel             | email, role, displayName, notificationSettings, favorites, adminPlates, driverSettings, fcmToken, updatedAt                     |
| sessions     | Actieve parkeersessies        | userId, zoneUid, zone, plate, start, end, createdAt, endedAt                                                                    |
| transactions | Afgeronde sessies (historie)  | userId, zone, zoneUid, plate, start, end, cost, endedAt                                                                         |
| tenants      | Fleet-manager instellingen    | o.a. autoStopEnabled, updatedAt                                                                                                 |
| invites      | Uitnodigingen                 | email, role, createdAt                                                                                                          |
| auditLog     | Audit (portal)                | actor, action, target, createdAt                                                                                                |

---

### 3.6 Gemini (vertaling)

**Gebruik:** `fetch_rdw_data.py` – `translate_desc_llm(text, current_rate)`: vertaalt Nederlandse tariefomschrijvingen (bijv. “stappen van 20 min”, “Stop en Shop”) naar Engels. Cache in `translation_cache.json`. Variabelen: input tekst + huidig uurtarief; output: enkele string.

---

## 4. Bronnen die we (nog) niet gebruiken

| Bron                                            | Wat het levert                                                             | Toegang                                             | Relevantie                                                          |
| ----------------------------------------------- | -------------------------------------------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------- |
| **NPR (parkeerrechten)**                        | Realtime parkeerrechten op kenteken (mobiel parkeren, handhaving)          | Beveiligd (certificaat); gemeenten/providers        | Alleen als je daadwerkelijk parkeersessies bij NPR wilt registreren |
| **RDW npropendata – straatparkeren**            | Statische/dynamische data per gemeente/facility buiten huidige Socrata-set | Open                                                | Uitbreiding meer gemeenten of fallback                              |
| **Dynamische straatparkeerdata**                | Real-time bezetting straatparkeerzones                                     | Afhankelijk van gemeente/SPDP                       | Niet algemeen beschikbaar; waar wel: SPDP                           |
| **Laadpaaldata (DOT-NL/LINDA)**                 | Officiële openbare laadpunten, realtime                                    | NDW – na afspraak (mail@servicedeskndw.nu)          | Zeer relevant voor EV + parkeren                                    |
| **Laadpaaldata (Open Charge Map)**              | Wereldwijd laadpunten, connector, vermogen                                 | API met gratis key                                  | Zeer relevant; eenvoudig te integreren                              |
| **Laadpaaldata (OSM/Overpass)**                 | Laadpunten uit OpenStreetMap                                               | Overpass API, geen key                              | Relevant; gratis                                                    |
| **Laadpaaldata (data.overheid.nl / gemeenten)** | Per gemeente (Eindhoven, Breda, etc.)                                      | Open data                                           | Per stad; landelijk = meerdere bronnen                              |
| **Overheid.io (kenteken)**                      | Voertuiggegevens per kenteken (eenvoudige API)                             | Gratis tier, daarna abonnement                      | Alternatief voor RDW bulk/lookup                                    |
| **RDW betaald (kenteken)**                      | Per-opvraging of XML API                                                   | €0,18/opvraging of €580 + €0,07/opvraging           | Bij hoge volume kentekenchecks                                      |
| **Milieuzones + emissie**                       | Toegang tot milieuzones op basis van emissieklasse                         | RDW 8ys7-d773 (emissie) + statische zone-informatie | Relevant voor vracht/bestel; zie MILIEUZONE_KENTEKEN_PLAN.md        |
| **Amsterdam Datapunt (RDW)**                    | RDW-datasets via één API, extra velden                                     | api.data.amsterdam.nl                               | Relevant als Amsterdam-specifiek of unified API gewenst             |

---

## 5. Markt en ontwikkelingen (mobiliteit, EV, parkeren)

### 5.1 Elektrische mobiliteit en laadbehoefte

- **Nationaal Laadonderzoek 2025:** EV-rijders laden steeds vaker slim (dynamische tarieven, moment van laden). Thuisladen domineert (61% elektrische km); een derde zonder oprit gebruikt lange kabel of openbare laadpaal.
- **Openbare laadpalen:** Behoefte aan prijstransparantie (vooraf inzicht in laadtarieven); smart tarieven (dal/piek) worden belangrijker.
- **Kans voor app:** Parkeerzones combineren met “laadpunten in de buurt” en (waar beschikbaar) laadtarieven – sluit aan bij “parkeren + laden” in één rit.

### 5.2 Parkeerdata en open data

- **RDW/NPR:** Statische parkeerdata (gebieden, tarieven) blijft open; dynamische data (npropendata) voor faciliteiten wordt breder gebruikt. Blauwe zones kunnen in de toekomst in NPR komen.
- **Transparantie:** Indicatieve tarieven en duidelijke bron (RDW Open Data) zijn belangrijk voor vertrouwen; geschatte kosten in de app sluiten daarop aan.

### 5.3 Mobiliteitstrends (kort)

- **Deelauto / Carpool:** Huidige app sluit CARPOOL/DEELAUTOP bewust uit voor straatparkeren; P+R en garages wel in beeld.
- **Fleet/B2B:** Portal voor fleetmanagers (sessies, kentekens, tenants) is aanwezig; uitbreiding met laadinfo en EV-voertuigen versterkt B2B-waarde.
- **Handhaving/NPR:** Alleen relevant als je als parkeerprovider wilt aansluiten; geen vereiste voor een informatie-app.

---

## 6. Plan en aanbevelingen

### 6.1 Doelstellingen (geprioriteerd)

1. **Betrouwbaarheid en transparantie:** Huidige bronnen correct documenteren; disclaimer en bronvermelding; data-actualiteit (refresh, eventueel datumcontrole).
2. **Uitbreiding waarde voor gebruikers:** Laadpunten bij parkeren (EV); optioneel milieuzones; betere tariefweergave (alle dagen, rate_numeric).
3. **Schaal en bronnen:** Meer gemeenten of fallback (npropendata voor zones); dynamische bezetting garages/P+R waar al `dynamicDataUrl` is (reeds deels aanwezig).
4. **B2B/Fleet:** EV-voertuigen en laadinfo in portal; rapportage op basis van bestaande transactions.

### 6.2 Aanbevelingen per thema

#### A. Data en pipeline (bronnen & variabelen)

| Nr  | Aanbeveling                                                                                                                                                                                                                    | Prioriteit | Inspiratie      |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- | --------------- |
| A1  | **Documenteer alle RDW resource-IDs en variabelen** in één bestand (bijv. uitbreiding van `docs/RDW_DATASETS_VARIABELEN_EN_KOPPELVELDEN.md`) inclusief npropendata-facilityvelden en kenteken-datasets (m9d7-ebf2, 8ys7-d773). | Hoog       | RAPPORT_NPR_RDW |
| A2  | **Datum- en versiecontrole:** In `fetch_rdw_data.py` optioneel alleen gewijzigde records verwerken (bijv. `$where` op datum of ETag) en `updated_at` per zone bijhouden.                                                       | Medium     | D2              |
| A3  | **Uitbreiding gemeenten:** Overweeg extra `areamanagerid` in TARGET_CITIES of een tweede bron (npropendata voor zones) als meer steden gewenst zijn.                                                                           | Medium     | E1              |
| A4  | **Facilities:** Cron/scheduled job voor wekelijkse run van `fetch_npropendata_facilities.py`; optioneel incrementeel verversen op `staticDataLastUpdated`.                                                                     | Medium     | PLAN_GARAGES    |

#### B. Laadpunten en EV

| Nr  | Aanbeveling                                                                                                                                                                                                       | Prioriteit | Inspiratie                |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ------------------------- | ---------------------------------------------------------- |
| B1  | **Laadpuntenlaag op de kaart:** Integreer Open Charge Map (gratis API-key) of OSM Overpass als eerste stap; toon laadpunten naast zones en facilities.                                                            | Hoog       | RAPPORT_KENTEKEN_LAADPAAL | ✓ Overpass API geïntegreerd; toggle “Laadpunten” op kaart. |
| B2  | **Filter connector/vermogen:** In laag: filter op Type 2, CCS, CHAdeMO en vermogen (AC 11/22 kW, DC snelladen).                                                                                                   | Medium     | Zelfde rapport            |
| B3  | **“Laadpunten in de buurt” / EV-toggle:** Optionele voorkeur “Toon laadpunten” of “Alleen zones/facilities met laadplekken” (gebruik `chargingPointCapacity` van facilities; laadpaal-API voor losse laadpunten). | Medium     | Zelfde rapport            |
| B4  | **Kenteken → EV:** RDW brandstof (8ys7-d773) al in gebruik; optioneel in UI: “Deze auto is elektrisch” (uit kenteken) en laadpaallaag standaard tonen voor EV.                                                    | Laag       | Zelfde rapport            |
| B5  | **DOT-NL verkennen:** Voor officiële, realtime laadpaaldata op langere termijn – contact NDW Servicedesk.                                                                                                         | Laag       | Zelfde rapport            |

#### C. Frontend en UX (variabelen in de app)

| Nr  | Aanbeveling                                                                                                                             | Prioriteit | Inspiratie             |
| --- | --------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ---------------------- |
| C1  | **Disclaimer en bron:** Vaste, zichtbare disclaimer in zone-sheet (“Tarieven indicatief; bron: RDW Open Data”) en bij geschatte kosten. | Hoog       | F1                     |
| C2  | **Geschatte kosten:** Blijft tonen; bij `rate_numeric` per tijdslot optioneel tarief voor huidig moment gebruiken.                      | Hoog       | F2                     |
| C3  | **Weergave alle dagen:** Uitklapbare “Bekijk alle dagen” voor tarieven (niet alleen vandaag).                                           | Medium     | E3, ONDERZOEKSPRAPPORT |
| C4  | **Foutmeldingen:** Duidelijke melding bij falen laden zones/facilities (“Tarieven tijdelijk niet beschikbaar”, retry).                  | Hoog       | F3                     |
| C5  | **Facilities:** Sectie “Garages & P+R” ook bereikbaar zonder zone te selecteren; link operatorUrl (“Meer info”) per facility.           | Laag       | PLAN_GARAGES           |

#### D. Integriteit en tests

| Nr  | Aanbeveling                                                                                                                              | Prioriteit | Inspiratie |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ---------- |
| D1  | **Tariefintegriteit:** Periodieke check (script/CI): zones mogen geen lege `rates` hebben bij price > 0; `price` consistent met `rates`. | Hoog       | T1         |
| D2  | **Unit tests:** Uitbreiden met geschatte kosten, ontbrekende rates/price, en (bij rate_numeric) berekening per tijdslot.                 | Medium     | T2         |
| D3  | **Kenteken-RDW:** Houd bestaande cache (5 min TTL); bij groei overweeg client-side throttling.                                           | Laag       | T3         |

#### E. Documentatie en prioritering

| Nr  | Aanbeveling                                                                                                                                                               | Prioriteit |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| E1  | **Dit rapport** opnemen in `docs/` en in `docs/AGENT_CONTEXT.md` onder “Databronnen en variabelen” verwijzen.                                                             | Hoog       |
| E2  | **Prioriteit voor live:** C4 (foutmeldingen), C1 (disclaimer), D1 (tariefintegriteit), A2 (data-actualiteit). Daarna B1 (laadpunten), A1 (documentatie), C3 (alle dagen). | -          |

---

## 7. Overzicht variabelen (quick reference)

### 7.1 Inkomend (externe bronnen → pipeline)

- **RDW Socrata:** areaid, areamanagerid, areadesc, areageometryaswgs84, regulationid, startdatearearegulation, enddatearearegulation, usageid, daytimeframe, starttimetimeframe, endtimetimeframe, farecalculationcode, maxdurationright, amountfarepart, stepsizefarepart, farecalculationdesc, regulationdesc, regulationtype.
- **RDW npropendata:** identifier, name, staticDataUrl, dynamicDataUrl, parkingFacilityInformation.\*, accessPoints[].accessPointLocation[], accessPointAddress, specifications (capacity, chargingPointCapacity, disabledAccess, minimumHeightInMeters, usage), operator.name/url, openingTimes, tariffs, paymentMethods.
- **RDW kenteken:** kenteken, merk, handelsbenaming, voertuigsoort; (brandstof) brandstofsoort, emissie.
- **Google Geocoding:** address → results[0].geometry.location (lat, lng).

### 7.2 Opgeslagen (Firestore / state)

- **zones:** id, name, city, mgr_id, lat, lng, price, rates (time, price, detail, rate_numeric), max_duration_mins, has_special_rules, updated_at.
- **facilities:** id, name, lat, lng, type, city, street, tariffSummary, dynamicDataUrl, capacity, chargingPointCapacity, disabledAccess, minimumHeightInMeters, operatorUrl, openingTimesSummary, paymentMethods, updated_at.
- **users:** email, role, displayName, notificationSettings, favorites, adminPlates, driverSettings, fcmToken, updatedAt.
- **sessions / transactions:** userId, zoneUid, zone, plate, start, end, cost, endedAt, etc.

---

## 8. Referenties

- `docs/RAPPORT_NPR_RDW_SHPV_PARKERDATA_ANALYSE.md`
- `docs/PLAN_GARAGES_P_R_NPROPENDATA.md`
- `docs/RDW_DATASETS_VARIABELEN_EN_KOPPELVELDEN.md`
- `docs/RAPPORT_KENTEKEN_LAADPAAL_DATA_NL.md`
- `docs/ONDERZOEKSPRAPPORT_TARIEVEN_PARKEREN.md`
- `docs/MILIEUZONE_KENTEKEN_PLAN.md`
- Nationaal Laadonderzoek 2025 (ElaadNL / RVO)
- opendata.rdw.nl, npropendata.rdw.nl, nationaalparkeerregister.nl

---

_Einde rapport – opgesteld voor het B2B Parkeren PWA-project._
