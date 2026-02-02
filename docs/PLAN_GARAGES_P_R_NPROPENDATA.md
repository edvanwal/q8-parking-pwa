# Plan: Garages en P+R toevoegen via npropendata.rdw.nl

**Doel:** Naast straatparkeren garages en P+R “in de buurt” tonen (kaart + lijst). Data uit **npropendata.rdw.nl** (SPDP); integratie in de bestaande app zonder de huidige straatparkeer-pipeline te breken.

**Status:** Fase 2a en 2b geïmplementeerd (script + app).

---

## 1. Wat heb je nodig?

### 1.1 Van jou (product/keuzes)

| Vraag | Opties | Aanbeveling |
|-------|--------|-------------|
| **“In de buurt” van wat?** | (A) Huidige locatie gebruiker, (B) Gekozen straatparkeerzone, (C) Beide | Start met (A): straal rond gebruiker. Later (B) toevoegen. |
| **Straal “in de buurt”?** | Bijv. 1 km, 2 km, 5 km | 2 km als default; evt. instelbaar. |
| **Waar tonen?** | Alleen kaart, alleen lijst, of beide | Kaart: aparte markertype (icoon garage/P+R). Lijst: sectie “Garages & P+R in de buurt” (bijv. in zone-sheet of apart paneel). |
| **Welke types?** | Alleen garages, alleen P+R, of beide | Beide; filter op naam/usage (zie hieronder). |
| **Dynamische bezetting?** | “X plekken vrij” tonen waar beschikbaar | Fase 2b: optioneel; alleen als facility een `dynamicDataUrl` heeft. |

### 1.2 Technisch

- **Python 3** (zoals nu) voor het script dat npropendata ophaalt en naar Firestore schrijft.
- **Firebase/Firestore** – extra collectie voor faciliteiten (zie hieronder).
- **Geen API-key** – npropendata.rdw.nl is open data.
- **Netwerk** – facility-lijst + per facility 1 request static data; eerste keer ~honderden requests. Daarna periodiek (bijv. wekelijks) verversen.

---

## 2. Kosten

| Onderdeel | Kosten |
|-----------|--------|
| **npropendata.rdw.nl** | € 0 – open data, geen registratie. |
| **Ontwikkeling** | Alleen tijd: script + app-aanpassingen. |
| **Firebase Firestore** | Extra collectie `facilities`: schrijf bij refresh (bijv. 1× per week); lees bij openen kaart/zone. Bij beperkt aantal faciliteiten (bijv. &lt; 2000) en 2 km-straal: beperkte extra reads. |
| **Firebase Hosting** | Geen wijziging. |

**Conclusie:** Geen externe kosten; alleen Firestore-usage (naar verwachting beperkt).

---

## 3. Data: npropendata.rdw.nl

### 3.1 Stappen

1. **Facility-lijst**  
   `GET https://npropendata.rdw.nl/parkingdata/v2/`  
   → JSON met o.a. per item: `name`, `identifier` (UUID), `staticDataUrl`, optioneel `dynamicDataUrl`, `limitedAccess`.

2. **Filter op type (garage / P+R)**  
   - Op **naam**: bevat “garage”, “parkeergarage”, “P+R”, “Carpool” (Carpool evt. uitsluiten als je alleen garage + P+R wilt).  
   - Of na ophalen static data: in `specifications[].usage` staat o.a. “Garage parkeren”; naam bevat vaak “P+R” of “Carpool”.

3. **Static data per facility**  
   `GET staticDataUrl` (bijv. `https://npropendata.rdw.nl/parkingdata/v2/static/{uuid}`)  
   → JSON met o.a.:
   - `parkingFacilityInformation.name`, `.description`
   - **Locatie:** `accessPoints[0].accessPointLocation[0].latitude`, `.longitude` (WGS84)
   - **Adres:** `accessPoints[0].accessPointAddress.streetName`, `houseNumber`, `city`, `zipcode`
   - **Operator:** `operator.name` (vaak gemeente)
   - **Tarieven:** `tariffs[]` met o.a. `tariffDescription`, `intervalRates[]` (charge, chargePeriod, durationType Minutes)
   - **Openingstijden:** `openingTimes[]` (optioneel voor weergave)

4. **Dynamische data (optioneel, later)**  
   Als `dynamicDataUrl` aanwezig: `GET dynamicDataUrl` voor bezetting/vrije plekken (SPDP-formaat).

### 3.2 Wat we in Firestore bewaren (per facility)

Voorgestelde velden (minimaal voor “in de buurt” + kaart):

| Veld | Type | Bron |
|------|------|------|
| `id` | string | `identifier` (UUID) |
| `name` | string | `parkingFacilityInformation.name` |
| `description` | string | optioneel |
| `lat` | number | `accessPoints[0].accessPointLocation[0].latitude` |
| `lng` | number | `accessPoints[0].accessPointLocation[0].longitude` |
| `type` | string | `"garage"` \| `"p_r"` (afgeleid uit naam/usage) |
| `city` | string | uit accessPointAddress of operator |
| `street` | string | optioneel (adres) |
| `tariffSummary` | string | optioneel; bijv. eerste `tariffDescription` of “€ X / Y min” |
| `dynamicDataUrl` | string | optioneel; voor later “X plekken vrij” |
| `updated_at` | string | timestamp laatste refresh |

Geen volledige static JSON in Firestore bewaren (te groot); alleen wat de app nodig heeft.

### 3.3 Wat zit er nog meer in de dataset? (van waarde)

De **static data** per facility bevat meer dan we nu in Firestore zetten. Overzicht:

| Bron (onder `parkingFacilityInformation`) | Wat het is | Waarde voor de app |
|-------------------------------------------|------------|--------------------|
| **specifications[]** | Specificaties per periode | **capacity** = totaal aantal plekken; **chargingPointCapacity** = laadplekken; **disabledAccess** = rolstoeltoegankelijk; **minimumHeightInMeters** = max hoogte; **usage** = "Garage parkeren" e.d. |
| **operator** | Beheerder (vaak gemeente) | **name**, **url** (website), **administrativeAddresses** (email, telefoon) – nuttig voor “Meer info” / contact. |
| **openingTimes[]** | Openingstijden | **openAllYear**, **entryTimes** (enterFrom/enterUntil, dayNames) – “Open 24/7” vs “Ma–Vr 07:00–23:00” in de lijst of detail. |
| **tariffs[]** (volledig) | Alle tariefregels | Nu gebruiken we alleen eerste intervalRate voor `tariffSummary`. Volledige **tariffDescription** + **intervalRates** per dag/tijd voor gedetailleerde tarieven in een facility-detailscherm. |
| **paymentMethods[]** | Betaalmethoden | **method** (Banknotes, Coins, Maestro, MasterCard, Visa, VPay), **atPaystation**, **atExit** – “Pinnen bij uitrit” / “Contant bij automaat” in de UI. |
| **accessPoints[]** (meerdere) | Meerdere ingangen/locaties | Nu alleen eerste punt; sommige garages hebben **meerdere** accessPoints met elk eigen lat/lng en adres – bv. “Ingang A” / “Ingang B” of aparte coördinaten. |
| **contactPersons[]** | Contactpersonen | Naam, email, telefoon – voor zakelijk/beheer. |
| **specialDays[]** | Uitzonderingen | Feestdagen / bijzondere dagen met andere regels. |
| **parkingRestrictions[]** | Beperkingen | Bv. voertuigtype, max verblijf – voor toegankelijkheid / filters. |

**Facility-lijst (v2/):**

| Veld | Waarde |
|------|--------|
| **dynamicDataUrl** | Al opgeslagen; gebruikt voor **dynamische bezetting** (“ca. X plekken vrij”) – Fase 2d. |
| **limitedAccess** | Of de facility beperkt toegankelijk is (bv. vergunninghouders). |
| **staticDataLastUpdated** | Unix timestamp – handig voor cache/refresh. |

**Dynamische data (dynamicDataUrl):**  
SPDP-formaat met o.a. **beschikbare capaciteit** (vrije plekken), soms per laag/sectie. Alleen beschikbaar bij facilities met `dynamicDataUrl`; nuttig voor “X plekken vrij” in de lijst of op de kaart.

**Aanbeveling:** Voor een volgende iteratie kun je in het script (en evt. Firestore) o.a. toevoegen: **capacity**, **chargingPointCapacity**, **disabledAccess**, **openingTimes** (samenvatting string), **operator.url**, en **paymentMethods** (array of samenvatting). Dynamische bezetting via **dynamicDataUrl** in Fase 2d.

---

## 4. Integratie: hoe bouwen we het in?

### 4.1 Overzicht

- **Bestaande flow** blijft: straatparkeren uit opendata.rdw.nl → `fetch_rdw_data.py` → Firestore `zones`.
- **Nieuwe flow:** npropendata facility-lijst + static data → **nieuw script** → Firestore collectie `facilities`.
- **App:** leest `facilities` (eenmalig of bij laden kaart); filtert op afstand tot gebruiker (of tot gekozen zone); toont garages en P+R op kaart + in een lijst “in de buurt”.

### 4.2 Stap 1: Script (backend)

**Nieuw bestand:** bijv. `scripts/fetch_npropendata_facilities.py`

1. GET `https://npropendata.rdw.nl/parkingdata/v2/` → lijst facilities.
2. Filter op naam (of na static fetch op usage): alleen “garage” en “P+R” (evt. Carpool uitsluiten).
3. Voor elke gefilterde facility: GET `staticDataUrl`; haal daaruit `name`, `lat`/`lng` (uit eerste accessPointLocation), `city`, `type`, evt. eerste tariefregel.
4. Schrijf naar Firestore collectie `facilities`, document-ID = `identifier` (UUID). Velden zoals in tabel hierboven.
5. Bijwerken `updated_at`.
6. **Caching/rate limiting:** niet te veel parallelle requests (bijv. 5–10 tegelijk); evt. 1× per week draaien (cron) i.p.v. realtime.

**Afhankelijkheden:** `requests` (of `urllib`), `firebase-admin`. Geen nieuwe API-keys.

### 4.3 Stap 2: Firestore

- **Collectie:** `facilities` (aparte collectie naast `zones`).
- **Index (voor “in de buurt”):**  
  Voor afstandsfilter heb je ofwel:
  - **Optie A:** Alle facilities ophalen en in de app filteren op afstand (lat/lng) – eenvoudig als aantal beperkt is (&lt; 2000).
  - **Optie B:** Firestore geohash/geopoint query (vereist veld met `GeoPoint` + composite index).  
  Start met **Optie A**; bij groei kan Optie B later.

### 4.4 Stap 3: App (frontend)

1. **Data ophalen**  
   Bij laden kaart (of bij eerste openen “Garages & P+R”):  
   - Firestore `facilities` ophalen (eenmalig of bij focus op kaart).  
   - In state bijv. `state.facilities` (array).

2. **Filter “in de buurt”**  
   - **Referentiepunt:** huidige locatie gebruiker (`state.userLocation`) of centrum van gekozen zone.  
   - **Straal:** bijv. 2 km.  
   - Afstand berekenen (Haversine of eenvoudige benadering) en filteren: `facilities.filter(f => distance(f, ref) <= 2000)`.

3. **Kaart**  
   - Andere icoon of kleur voor garage/P+R dan voor straatparkeerzones (bijv. icoon “parking” of “garage”).  
   - Markers voor `state.nearbyFacilities` (of vergelijkbare variabele).

4. **Lijst “Garages & P+R in de buurt”**  
   - Nieuwe sectie in het zone-sheet, of apart paneel/knop “Garages & P+R”.  
   - Toon naam, adres/plaats, evt. tariefsamenvatting, afstand.  
   - Klik opent evt. detail of navigatie.

5. **Geen straatparkeer-flow breken**  
   - Bestaande `zones`, `loadZones`, zoeken, start parkeren blijven ongewijzigd.  
   - Facilities zijn alleen informatief (tonen, navigatie); geen “start parkeersessie” voor garage in deze fase.

### 4.5 Stap 4 (optioneel): Dynamische bezetting

- Alleen voor facilities met `dynamicDataUrl`.
- GET dynamic URL → SPDP-formaat met o.a. beschikbare capaciteit.
- In UI: “ca. X plekken vrij” bij de facility.  
Dit kan in een latere iteratie.

---

## 5. Fasering

| Fase | Inhoud | Geschat |
|------|--------|---------|
| **2a** | Script `fetch_npropendata_facilities.py`: facility-lijst ophalen, filteren op garage + P+R, static data parsen, Firestore `facilities` vullen. | 1–2 dag |
| **2b** | App: facilities ophalen, filter “in de buurt” (2 km rond gebruiker), markers op kaart + sectie “Garages & P+R in de buurt”. | ✓ Gedaan |
| **2c** | (Optioneel) “In de buurt” ook t.o.v. gekozen zone; straal instelbaar. | 0,5 dag |
| **2d** | (Optioneel) Dynamische bezetting waar `dynamicDataUrl` beschikbaar is. | 1 dag |

---

## 6. Vastgelegde keuzes (voor Fase 2b)

- **“In de buurt”:** Start met (A) straal rond huidige locatie; standaardstraal 2 km. Later optioneel: ook rond gekozen zone.
- **Waar tonen:** Kaart (aparte markertype garage/P+R) + lijst “Garages & P+R in de buurt” (sectie in zone-sheet of op kaartscherm).
- **Types:** Alleen garage + P+R; Carpool uitsluiten.

## 7. Fase 2a – Script uitvoeren

**Script:** `scripts/fetch_npropendata_facilities.py`

- **Dry-run (geen Firestore):**  
  `python scripts/fetch_npropendata_facilities.py --dry-run`  
  Optioneel: `--limit 50` om het aantal requests te beperken.
- **Live (naar Firestore):**  
  Vanuit projectroot, met `service-account.json` (of `q8-parking-pwa-firebase-adminsdk-*.json`) in de root:  
  `python scripts/fetch_npropendata_facilities.py`
- **API:** Static data van npropendata staat onder `parkingFacilityInformation` (o.a. `accessPoints`, `tariffs`); het script leest daaruit.

Aanbevolen: 1× per week draaien (cron/scheduled task) om `facilities` te verversen.

## 8. Wat nog nodig is voor Fase 2b (app)

1. **Bevestiging UI-plaatsing**  
   Sectie “Garages & P+R in de buurt” in zone-sheet, of apart paneel/knop op kaartscherm?
2. **Straal instelbaar**  
   Optioneel: gebruikersinstelling voor straal (1 / 2 / 5 km).

---

*Zie ook: `docs/RAPPORT_NPR_RDW_SHPV_PARKERDATA_ANALYSE.md` (E1, E2).*
