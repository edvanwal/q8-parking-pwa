# Rapport: NPR, RDW, SHPV en parkeergerelateerde data – analyse voor live-omgeving

**Doel:** Uitgebreide analyse van het Nederlands Parkeerregister (NPR), RDW open parkeerdata, SHPV (Servicehuis Parkeer- en Verblijfsrechten), SPDP en aanverwante standaarden, met conclusies en aanbevelingen zodat de B2B parkeer-PWA geschikt wordt voor een live-omgeving. De aanbevelingen zijn geformuleerd voor gebruik door een agent in Cursor AI.

**Datum:** 2 februari 2026

---

## 1. Samenvatting

Het **Nationaal Parkeer Register (NPR)** is een landelijke database met parkeerrechten op kenteken, beheerd door de **RDW** in opdracht van de coöperatie **SHPV**. Parkeer**informatie** (gebieden, tarieven) wordt als **open data** gepubliceerd via **opendata.rdw.nl** (Socrata) en via **npropendata.rdw.nl** (SPDP). De **B2B parkeer-PWA** gebruikt momenteel alleen de statische RDW Socrata-datasets (opendata.rdw.nl); er is geen koppeling met het NPR voor mobiel parkeren of handhaving, en geen gebruik van dynamische data of SPDP. Dit rapport beschrijft de opbouw van de data, het gebruik, relevante standaarden (inclusief NEN-EN 12414 en SPDP), en doet **conclusies** en **aanbevelingen** – waarvan de laatste expliciet bruikbaar zijn voor een Cursor AI-agent.

---

## 2. Overzicht NPR, RDW en SHPV

### 2.1 Nationaal Parkeer Register (NPR)

| Aspect | Beschrijving |
|--------|--------------|
| **Definitie** | Landelijke database waarin alle actuele parkeerrechten **op kenteken** geregistreerd staan. |
| **Beheer** | RDW ontwikkelt en beheert het systeem; SHPV heeft een contract met de RDW voor deze taken. |
| **Doel** | Basisinfrastructuur voor gemeenten om parkeerdiensten te digitaliseren: mobiel parkeren, handhaving, vergunningen, parkeerautomaten, garageparkeren. |
| **Bron** | [nationaalparkeerregister.nl](https://www.nationaalparkeerregister.nl/over-npr) |

**Diensten die het NPR mogelijk maakt:**

- Mobiel parkeren via alle parkeerproviders
- Registratie van vergunningen en parkeerrechten via de parkeerautomaat
- Registratie van informatie over parkeergebieden en tarieven
- Registratie van gehandicaptenparkeerkaarten
- Digitale parkeerhandhaving
- Pilot Flexibele Parkeermachtiging; garageparkeren

### 2.2 Rol RDW

- **Open data:** Verzamelt en publiceert openbare, niet-gevoelige informatie over parkeergebieden en tarieven van alle openbare parkeervoorzieningen van Nederlandse gemeenten (vanaf 27 november 2014).
- **Publicatie:** Via (1) **SPDP** (technische documenten op nationaalparkeerregister.nl) en (2) **Socrata** (conform richtlijnen Ministerie BZK) op [opendata.rdw.nl](https://opendata.rdw.nl/).
- **Beheerapplicatie:** Gemeenten leveren gebieds- en tariefinformatie aan via een webapplicatie bij de RDW; daarvoor is een **beveiligde verbinding met certificaat** nodig.

### 2.3 Rol SHPV (Servicehuis Parkeer- en Verblijfsrechten)

- **Organisatie:** Coöperatieve vereniging van gemeenten; beheert het digitale platform voor parkeer- en verblijfsrechten en heffingen.
- **Diensten:** Straatparkeren (afhandeling betaald parkeergeld), garageparkeren, parkeerdata, verblijfsrechten, toegang voor app-providers, en de NPR-infrastructuur.
- **Aansluiten mobiel parkeren:** Gemeenten doorlopen o.a.: parkeerverordening aanpassen → contract SHPV → parkeergebieden/tarieven aanleveren bij NPR → handhaving aansluiten op NPR (beveiligde verbinding) → aanduiding in openbare ruimte en communicatie.

Belangrijk: **Handhaving** vraagt parkeerrechten op via een **beveiligde verbinding** met het NPR; dat is geen open-data-interface.

---

## 3. Opbouw van de data

### 3.1 Statische open parkeerdata (opendata.rdw.nl – Socrata)

De app gebruikt momenteel uitsluitend deze bron. De data zijn opgebouwd uit **meerdere gekoppelde datasets**:

| Dataset | Resource ID | Rol |
|--------|-------------|-----|
| **Gebied** | b3us-f26s | Gebiedsspecificaties (areaid, areamanagerid, areadesc, areageometryaswgs84) |
| **Regeling-mapping** | qtex-qwd8 | Koppelt gebied → regeling (regulationid), met startdatearearegulation / enddatearearegulation |
| **Tijdvak** | ixf8-gtwq | Per regeling: dag (MAANDAG e.d.), start-/eindtijd (0–2400), farecalculationcode, **maxdurationright** |
| **Tariefdeel** | 534e-5vdg | Per farecalculationcode: amountfarepart, stepsizefarepart, startdatefarepart, enddatefarepart |
| **Tariefberekening** | nfzq-8g7y | Omschrijving per farecalculationcode (farecalculationdesc) |
| **Regeling-beschrijving** | yefi-qfiq | regulationdesc, regulationtype |

**Berekening uurtarief (in de pipeline):**

- `amountfarepart` = bedrag per stap (bijv. € 1,00)
- `stepsizefarepart` = stapgrootte in **minuten** (bijv. 20)
- Uurtarief = `(amountfarepart / stepsizefarepart) * 60`

**Beperkingen in de huidige pipeline (fetch_rdw_data.py):**

- Slots met **step > 60** minuten worden overgeslagen; dagkaarten of blokken > 1 uur komen niet als aparte tariefregel in `rates`.
- Filter op **TARGET_CITIES** (areamanagerid): Amsterdam, Rotterdam, Den Haag, Utrecht, Nijmegen, Amersfoort.
- Regelingtypes zoals VERGUNP, BEWONERP, GARAGEP worden in de app uitgefilterd (alleen straatparkeren).

### 3.2 Dynamische data en SPDP (npropendata.rdw.nl)

- **NPR OpenData Web API:** [npropendata.rdw.nl](https://npropendata.rdw.nl/) implementeert de **Standaard voor Publicatie Dynamische Parkeerdata (SPDP)** (Werkgroep SPDP).
- **Parking facilities V2:** [npropendata.rdw.nl/parkingdata/v2/](https://npropendata.rdw.nl/parkingdata/v2/) levert een lijst van parkeerfacilities met o.a.:
  - `name`, `identifier` (UUID), `staticDataUrl`, optioneel `dynamicDataUrl`, `limitedAccess`, `staticDataLastUpdated`
- **Statische data per facility:** via `staticDataUrl` (per UUID).
- **Dynamische data:** waar beschikbaar via `dynamicDataUrl` (o.a. parkeergarages met bezetting/beschikbaarheid).
- **SPDP:** Sinds december 2021 beheerd door **CROW**; standaard voor het publiceren van dynamische parkeerdata (gesloten locaties en straatparkeren); toegang o.a. via kennisbank.crow.nl (gratis account).

De huidige app gebruikt **geen** npropendata.rdw.nl en geen dynamische data.

### 3.3 Technische documenten NPR

Op [nationaalparkeerregister.nl/downloads/technische-documenten](https://www.nationaalparkeerregister.nl/downloads/technische-documenten):

- Known issues (PDF)
- Bijsluiter gebruik open data via RDW (PDF)
- Aansluiting SPDP v2.0 (DOCX)
- Beschrijving Datasets Open Parkeerdata (PDF) – beschrijving statische parkeergegevens
- Interface Description (versies 7.13 en 2.4) + revisietoelichtingen

Voor dynamische data: CROW – Standard for the Publication of Dynamic Parking Data (gratis abonnement).

### 3.4 Overzicht databronnen

| Bron | Type | Gebruik in app | Toegang |
|------|------|-----------------|---------|
| opendata.rdw.nl (Socrata) | Statisch: gebieden, regelingen, tijdvakken, tarieven | Ja (fetch_rdw_data.py → Firestore) | Open, geen API-key |
| npropendata.rdw.nl (SPDP) | Statisch + dynamisch per facility | Nee | Open |
| NPR (kenteken/parkeerrechten) | Realtime parkeerrechten voor handhaving/mobiel parkeren | Nee | Beveiligd (certificaat); alleen voor gemeenten/providers |

---

## 4. Gebruik van de data

### 4.1 Open data (informatie)

- **Consumenten/apps:** Tarieven en gebieden tonen, zoeken op zone/adres, geschatte kosten – allemaal mogelijk met **alleen** open data (opendata.rdw.nl of npropendata.rdw.nl).
- **Geen kenteken nodig** voor het tonen van zones en tarieven.
- **Licentie:** Creative Commons 0 (CC0) / Public Domain; gratis en zonder voorbehoud.

### 4.2 Mobiel parkeren en handhaving (NPR)

- **Mobiel parkeren:** Gebruiker start een parkeersessie (kenteken + zone); een **parkeerprovider** meldt dit aan het NPR. Handhaving controleert via het NPR of het kenteken geldig geparkeerd staat.
- **Handhaving:** Via (1) handhavingsapparatuur met NPK-bevraging, (2) gratis RDW smartphone-app voor kaartnummers, of (3) meldkamer. Allemaal via **beveiligde verbinding** met het NPR.
- **Conclusie voor de app:** De PWA kan **informatie** geven (zones, tarieven, geschatte kosten) op basis van open data. **Daadwerkelijk** parkeren registreren in het NPR vereist aansluiting als parkeerprovider en/of integratie met een bestaande provider; dat valt buiten alleen “open data”.

### 4.3 Kenteken en voertuig

- **RDW open data (kenteken):** o.a. m9d7-ebf2 (voertuig), 8ys7-d773 (brandstof/emissie). De app gebruikt kentekenvalidatie en RDW-lookup (zie KENTEKEN_VALIDATIE_README.md).
- **NPR:** Kenteken wordt in het NPR gekoppeld aan **parkeerrechten** (betaalde sessie, vergunning, etc.); die gegevens zijn **niet** open.

---

## 5. Standaarden en “test cases”: SPDP, NEN-EN 12414, Interface Description

### 5.1 SPDP (Standaard Publicatie Dynamische Parkeerdata)

- **Doel:** Eenduidige publicatie van dynamische parkeerdata (beschikbaarheid, bezetting) voor ketenpartners en navigatie.
- **Beheer:** CROW (sinds dec 2021); Strategic Committee en Change Advisory Board.
- **Relatie tot de app:** NPR OpenData API (npropendata.rdw.nl) volgt SPDP. Voor een **live-omgeving** is het raadzaam te bepalen of dynamische data (garages, P+R) moeten worden getoond; zo ja, dan SPDP-documentatie en CROW-standaard raadplegen.

### 5.2 NEN-EN 12414:2020 (parkeerautomaten)

- **Scope:** Technische en functionele eisen + **testmethoden** voor parkeerautomaten (onbewaakt, meerdere voertuigen, betaalmogelijkheden).
- **Niet in scope:** Gecentraliseerde systemen (alleen minimale informatie-uitwisseling), pay-on-foot terminals.
- **Relevantie voor de app:** Indirect: parkeerautomaten die aan deze norm voldoen, sluiten aan op dezelfde parkeerregels en tarieven die ook in de open data zitten. Geen directe “test cases” voor de PWA zelf; wel referentie voor correcte tariefweergave en -berekening (stappen, eerste minuten, max duur).

### 5.3 Interface Description (NPR)

- **Versies:** o.a. 7.13 en 2.4 met revisietoelichtingen (PDF op NPR-downloads).
- **Gebruik:** Voor partijen die **aansluiten** op het NPR (aanlevering of uitwisseling). Voor een app die alleen **open data** consumeert, zijn de Socrata- en SPDP-bronnen voldoende; Interface Description is vooral relevant bij integratie met NPR-beheer of -handhaving.

### 5.4 “SAPV” – verduidelijking

- In openbare bronnen komt **SAPV** niet voor als aparte parkeer-API of -standaard. Waarschijnlijk wordt gedoeld op:
  - **SPDP** (dynamische parkeerdata), of
  - **Parkeeradministratie** in brede zin (waar SHPV en NPR onder vallen).
- **Test cases** voor een **informatie-app** die open data gebruikt: zie sectie 7 (aanbevelingen); voor parkeer**automaten** verwijst NEN-EN 12414 naar testmethoden in de norm zelf.

---

## 6. Huidige app vs. live-omgeving – gap-analyse

| Aspect | Huidige situatie | Vereiste voor live |
|--------|-------------------|--------------------|
| **Bron zones/tarieven** | Alleen opendata.rdw.nl (Socrata), vaste set gemeenten | Keuze: zelfde bron uitbreiden of aanvullen met npropendata.rdw.nl |
| **Dynamische data** | Niet gebruikt | Optioneel: bezetting garages/P+R (SPDP) |
| **Actualiteit data** | Firestore wordt gevuld door pipeline (fetch_rdw_data.py); geen gegarandeerde refresh-frequentie | Duidelijke refresh-strategie en eventueel caching/ETag |
| **Tariefweergave** | rates als string; step > 60 weggelaten; alleen “vandaag” | Zie ONDERZOEKSPRAPPORT_TARIEVEN: o.a. rate_numeric, dagkaarten, disclaimer |
| **Geschatte kosten** | Geïmplementeerd (ONDERZOEKSPRAPPORT); calculateCost + disclaimer | Behouden en monitoren |
| **Kenteken** | Validatie + RDW lookup (open data) | Geen NPR-koppeling nodig voor alleen informatie |
| **Foutafhandeling** | Beperkt (RDW timeouts, lege zones) | Duidelijke foutmeldingen, retry, fallback |
| **Rate limiting** | Geen client-side throttling (RDW) | Overwegen bij veel verkeer (zie KENTEKEN_VALIDATIE_README) |
| **Documentatie** | AGENT_CONTEXT, WORKING_RULES, rapporten | Dit rapport + aanbevelingen voor agent |

---

## 7. Conclusies

1. **NPR/RDW/SHPV:** De app gebruikt alleen **open statische parkeerdata** (RDW Socrata). Voor het **tonen** van zones en tarieven is dat voldoende. Voor **mobiel parkeren** of **handhaving** is aansluiting op het NPR nodig (beveiligd, geen open API).
2. **Opbouw data:** De zes gekoppelde RDW-datasets (gebied, mapping, tijdvak, tariefdeel, tariefberekening, regeling-beschrijving) zijn correct in de pipeline verwerkt; beperkingen zitten in step > 60, datumfiltering en keuze gemeenten.
3. **SPDP / npropendata.rdw.nl:** Nuttig voor uitbreiding naar meer gemeenten en dynamische data (garages, P+R); niet vereist voor minimale live-informatie.
4. **NEN-EN 12414:** Relevant voor consistentie van tarieflogica (stappen, max duur); geen directe testcases voor de PWA.
5. **Live-geschiktheid:** De app is in principe geschikt voor **live** als **informatie-app** (zones, tarieven, geschatte kosten, kentekenweergave) mits: robuuste foutafhandeling, duidelijke disclaimer, en optioneel verbeteringen aan tariefweergave en data-actualiteit.

---

## 8. Aanbevelingen (bruikbaar voor Cursor AI-agent)

De volgende aanbevelingen zijn zo geformuleerd dat een agent ze direct kan toepassen of als taak kan opnemen.

### 8.1 Data en pipeline

- **AANBEVELING D1 – Documenteer RDW-resources:** In `docs/AGENT_CONTEXT.md` of een apart bestand: lijst van gebruikte RDW resource-IDs (b3us-f26s, qtex-qwd8, ixf8-gtwq, 534e-5vdg, nfzq-8g7y, yefi-qfiq) met korte rol en URL-voorbeeld. Dit voorkomt verkeerde wijzigingen bij refactors.
- **AANBEVELING D2 – Datum- en versiecontrole:** In `fetch_rdw_data.py`: waar mogelijk `$where` of response-headers gebruiken om alleen gewijzigde records te verwerken, of een “laatst bijgewerkt”-timestamp per zone in Firestore bijhouden voor debugging.
- **AANBEVELING D3 – Step > 60 en dagkaarten:** Evalueer of tariefdelen met `stepsizefarepart > 60` als aparte regel in `rates` moeten worden opgenomen (bijv. “Dagkaart € X”) in plaats van ze te negeren, conform ONDERZOEKSPRAPPORT_TARIEVEN_PARKEREN aanbeveling 7.
- **AANBEVELING D4 – rate_numeric:** Voeg per `rates`-item een numeriek veld `rate_numeric` (uurtarief) toe in de pipeline zodat de frontend geschatte kosten per tijdslot kan berekenen zonder string-parsing (ONDERZOEKSPRAPPORT aanbeveling 5).

### 8.2 Frontend en UX

- **AANBEVELING F1 – Disclaimer en bron:** Zorg dat in de zone-sheet een korte disclaimer zichtbaar is (“Tarieven zijn indicatief; definitief bedrag kan afwijken”) en een vermelding van de bron (RDW Open Data / NPR open parkeerdata), conform bestaande implementatie en ONDERZOEKSPRAPPORT.
- **AANBEVELING F2 – Geschatte kosten:** Behoud de weergave van geschatte kosten op basis van `calculateCost(duration, zone.price)` en `selectedZoneRate`; bij invoering van `rate_numeric` kan optioneel het tarief voor het **huidige** tijdslot worden gebruikt.
- **AANBEVELING F3 – Foutmeldingen:** Bij falen van zone-load (Firestore of bij directe RDW-calls): duidelijke gebruikersmelding (“Tarieven tijdelijk niet beschikbaar” / “Zone-informatie kon niet worden geladen”) in plaats van stille fout of lege lijst.

### 8.3 Integriteit en tests

- **AANBEVELING T1 – Tariefintegriteit:** Voeg een periodieke check toe (script of CI): zones mogen geen lege `rates` hebben terwijl `price > 0`; `price` moet overeenkomen met de inhoud van `rates` (max uurtarief), conform ONDERZOEKSPRAPPORT aanbeveling 8.
- **AANBEVELING T2 – Unit tests:** Breid `tests/test_core.js` uit met: (1) weergave geschatte kosten in het zone-sheet, (2) gedrag bij ontbrekende `rates` of `price`, (3) indien `rate_numeric` wordt toegevoegd: berekening op basis van actueel tijdslot.
- **AANBEVELING T3 – Kenteken-RDW:** Bij herhaalde RDW-lookup (kenteken): overweeg eenvoudige client-side throttling of caching om rate limits te vermijden (zie KENTEKEN_VALIDATIE_README).

### 8.4 Uitbreiding (optioneel)

- **AANBEVELING E1 – npropendata.rdw.nl:** Als meer gemeenten of faciliteiten nodig zijn: documenteer het verschil tussen opendata.rdw.nl (per areamanagerid) en npropendata.rdw.nl (per facility UUID); overweeg een tweede bron of fallback voor statische gegevens.
- **AANBEVELING E2 – Dynamische data:** Als bezetting van parkeergarages/P+R gewenst is: CROW SPDP-documentatie en npropendata.rdw.nl `dynamicDataUrl` gebruiken; aparte module voor dynamische data om bestaande flow niet te breken.
- **AANBEVELING E3 – Weergave alle dagen:** Optioneel een uitklapbare “Bekijk alle dagen” voor tarieven (niet alleen vandaag), conform ONDERZOEKSPRAPPORT aanbeveling 6.

### 8.5 Documentatie voor agent

- **AANBEVELING A1 – Dit rapport:** Bewaar dit rapport in `docs/` en verwijs ernaar in `docs/AGENT_CONTEXT.md` onder “Parkeerdata & standaarden”.
- **AANBEVELING A2 – WORKING_RULES:** Wijzig `docs/WORKING_RULES.md` niet voor deze aanbevelingen; volg de bestaande beperkingen (geen wijziging deployment/Firebase/index.html zonder goedkeuring).
- **AANBEVELING A3 – Prioriteit:** Voor live: prioriteer AANBEVELING F3 (foutmeldingen), F1 (disclaimer), T1 (tariefintegriteit) en D2 (data-actualiteit). Daarna D3/D4 en T2.

---

## 9. Referenties

- [Nationaal Parkeerregister – Over NPR](https://www.nationaalparkeerregister.nl/over-npr)
- [Nationaal Parkeerregister – Open parkeerdata / Aansluiten](https://www.nationaalparkeerregister.nl/open-parkeerdata/aansluiten-open-parkeerdata)
- [Nationaal Parkeerregister – Technische documenten](https://www.nationaalparkeerregister.nl/downloads/technische-documenten)
- [Nationaal Parkeerregister – Aansluiten mobiel parkeren](https://www.nationaalparkeerregister.nl/parkeer-en-verblijfsrechten/mobiel-parkeren/aansluiten-mobiel-parkeren)
- [RDW Open data](https://www.rdw.nl/over-rdw/dienstverlening/open-data)
- [opendata.rdw.nl](https://opendata.rdw.nl/)
- [NPR OpenData Web API (SPDP)](https://npropendata.rdw.nl/)
- [NPR Parking facilities V2](https://npropendata.rdw.nl/parkingdata/v2/)
- NEN-EN 12414:2020 – Parkeerautomaten (NEN.nl)
- CROW – Standard for the Publication of Dynamic Parking Data (SPDP)
- Projectdocumenten: `docs/AGENT_CONTEXT.md`, `docs/ONDERZOEKSPRAPPORT_TARIEVEN_PARKEREN.md`, `docs/KENTEKEN_VALIDATIE_README.md`, `docs/RAPPORT_KENTEKEN_LAADPAAL_DATA_NL.md`, `docs/WORKING_RULES.md`

---

*Einde rapport*
