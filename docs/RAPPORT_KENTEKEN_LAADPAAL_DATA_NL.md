# Rapport: Kenteken-, voertuig- en laadpaaldata in Nederland

**Doel:** Breed onderzoek naar Nederlandse databronnen rond kentekens, voertuiginformatie, API’s, kosten en laadpaal-/laadinformatie, met het oog op integratie in een parkeer-PWA (o.a. kaart met laadpunten en laadinfo per auto).

**Datum:** februari 2026

---

## 1. Samenvatting

In Nederland zijn kentekens de centrale identificatie van voertuigen. Er bestaan meerdere officiële en commerciële bronnen met voertuig- en laadpaaldata:

- **Kenteken/voertuig:** RDW (open data + betaalde API), overheid.io, Amsterdam Datapunt.
- **Laadpalen:** DOT-NL/LINDA (NDW), data.overheid.nl (o.a. gemeenten), OpenStreetMap, Open Charge Map, ElaadNL (statistieken/analyses).
- **Laadinfo per auto:** RDW open data (brandstof/elektrisch) levert o.a. brandstofsoort; connector-type en laadsnelheid zitten in laadpaal-datasets, niet per kenteken in RDW.

Voor een parkeerapp zijn de meest relevante vervolgstappen: **RDW open data** blijven gebruiken voor parkeerzones; **laadpaaldata** toevoegen via OSM/Open Charge Map of (na afspraak) DOT-NL; **kentekenvalidatie** eventueel via RDW open data (bulk) of overheid.io/kleinschalig; **EV-voertuigkenmerken** uit RDW brandstof/elektrisch gebruiken om te tonen welk type lader bij de auto past.

---

## 2. Kenteken- en voertuigdatabronnen in Nederland

### 2.1 RDW (Rijksdienst voor het Wegverkeer)

**Rol:** Officiële beheerder van de Basisregistratie Voertuigen; alle gekentekende voertuigen in Nederland.

| Aspect | Beschrijving |
|--------|--------------|
| **Open data** | [opendata.rdw.nl](https://opendata.rdw.nl/) – gratis, geen registratie verplicht voor download/API. |
| **Catalogus** | [opendata.rdw.nl/browse](https://opendata.rdw.nl/browse) – alle datasets per thema. |
| **Licentie** | Creative Commons 0 (CC0) / Public Domain. |

**Belangrijke datasets (voertuigen):**

- **Open Data RDW: Gekentekende_voertuigen** (dataset-id o.a. m9d7-ebf2)  
  - ~16,7 miljoen rijen, 98 kolommen.  
  - Bevat o.a.: kenteken, voertuigsoort, merk, handelsbenaming, vervaldatum_apk, datum_tenaamstelling, bruto_bpm, inrichting, aantal_zitplaatsen, eerste_kleur, tweede_kleur, aantal_cilinders, cilinderinhoud, massa_ledig_voertuig, toegestane_maximum_massa_voertuig.  
  - Toegang: OData V2/V4, Socrata REST (JSON), export.

- **Open Data RDW: Gekentekende_voertuigen_brandstof** (o.a. 8ys7-d773)  
  - Koppeling brandstof/energie per voertuig (o.a. elektrisch, hybride).  
  - Relevant voor: “is dit een EV?”, “welk type brandstof?”.

- **Elektrische voertuigen** (o.a. w4rt-e856)  
  - Subset/weergave voor elektrische voertuigen.

- **Parkeergebieden Nederland** (gebruikt in dit project)  
  - o.a. b3us-f26s (gebied/specs), qtex-qwd8 (regeling/mapping), ixf8-gtwq (tijdvak), 534e-5vdg (tariefdeel), nfzq-8g7y (tariefberekening), yefi-qfiq (beschrijving).  
  - Geen kenteken; wel gebied, regels, tarieven.

**API/toegang open data:**

- REST: `https://opendata.rdw.nl/resource/<dataset_id>.json` (Socrata), met `$limit`, `$offset`, `$where`, etc.
- OData V2/V4 voor Excel/Tableau.
- Geen API-key voor standaard gebruik.

**Betaalde RDW-diensten (ongevoelige kentekengegevens):**

- **Web-interface:** €0,18 per opvraging (tarief 2025), geen aansluitkosten.
- **XML API:** eenmalig €580 aansluitkosten, daarna €0,07 per kenteken.
- Alleen voor bedrijven met KvK-inschrijving; geen gevoelige data (geen km-stand, geen persoonsgegevens).
- Bron: [rdw.nl – Betaald toegang tot ongevoelige kentekengegevens](https://www.rdw.nl/over-rdw/dienstverlening/betaald-toegang-tot-ongevoelige-kentekengegevens).

**Conclusie RDW:**  
Voor een parkeerapp: open data volstaat voor parkeerzones (zoals nu) en voor bulk/statische voertuigkenmerken (merk, type, brandstof). Per-kenteken realtime opvragen kan alleen via betaalde API of via een tussenlaag (overheid.io, zie hierna).

---

### 2.2 Overheid.io (Kenteken API)

| Aspect | Beschrijving |
|--------|--------------|
| **Doel** | Consumptie van Nederlandse open data; voertuiggegevens op kenteken. |
| **API** | [overheid.io/documentatie/voertuiggegevens](https://overheid.io/documentatie/voertuiggegevens). |
| **Endpoints** | `GET https://api.overheid.io/voertuiggegevens` (overzicht), `GET https://api.overheid.io/voertuiggegevens/{kenteken}` (per kenteken). |
| **Update** | Wekelijkse volledige update, dagelijkse aanvulling nieuwe kentekens. |

**Parameters (o.a.):**

- `size`, `page`, `sort`, `order`
- `fields[]` – te retourneren velden
- `filters[]` – filter op vaste waarden
- `query`, `queryfields` – zoeken (standaard in kenteken)

**Kosten:**  
Gratis testdataset (o.a. 10.000 documenten, maandelijks ververst). Voor productie: abonnementen; zie [overheid.io/abonnementen](https://overheid.io/abonnementen).

**Gebruik in parkeerapp:**  
Handig voor “kenteken invullen → voertuiggegevens tonen” (merk, type, brandstof) zonder zelf de volledige RDW-bulk te hoeven beheren. Kleinschalig/test: gratis tier; groter volume: kosten afwegen tegen RDW XML API.

---

### 2.3 Amsterdam Datapunt (RDW via API)

- RDW-datasets ontsloten via [api.data.amsterdam.nl](https://api.data.amsterdam.nl/); documentatie o.a. [api.data.amsterdam.nl/v1/docs/datasets/rdw.html](https://api.data.amsterdam.nl/v1/docs/datasets/rdw.html).
- Extra velden mogelijk (lengte, massaRijklaar, maximumMassaSamenstelling, carrosserietype, assen, brandstof).
- Relevant als de app Amsterdam-specifiek wordt of als je één REST-API voor meerdere bronnen wilt.

---

### 2.4 Overige bronnen (kort)

- **RDWdata.nl / kenteken-info.nl:** Consumentensites; geen officiële API voor integratie; soms gratis basisinfo, uitgebreide rapporten betaald.
- **CarsXE e.d.:** Commerciële kenteken-API’s; prijzen en voorwaarden per aanbieder.

---

## 3. Variabelen per bron (overzicht)

### 3.1 RDW Gekentekende_voertuigen (98 kolommen – selectie)

| Variabele (API-naam) | Type | Beschrijving |
|----------------------|------|--------------|
| kenteken | tekst | Kenteken |
| voertuigsoort | tekst | Personenoauto, vrachtwagen, etc. |
| merk | tekst | Merk |
| handelsbenaming | tekst | Type/model |
| vervaldatum_apk | nummer | Vervaldatum APK |
| datum_tenaamstelling | nummer | Datum eerste tenaamstelling NL |
| bruto_bpm | nummer | Bruto BPM |
| inrichting | tekst | Inrichting |
| aantal_zitplaatsen | nummer | Aantal zitplaatsen |
| eerste_kleur, tweede_kleur | tekst | Kleur |
| aantal_cilinders, cilinderinhoud | nummer | Motor |
| massa_ledig_voertuig | nummer | Massa ledig (kg) |
| toegestane_maximum_massa_voertuig | nummer | Max. massa (kg) |

De overige kolommen zijn o.a. varianten van datums, catalogusnummers, Europese typegoedkeuring, etc. Voor brandstof/elektrisch: aparte dataset **Gekentekende_voertuigen_brandstof** gebruiken.

### 3.2 RDW Parkeergebieden (in dit project)

Uit o.a. `analyze_rdw_schema.py` en `fetch_rdw_data.py`:

- **b3us-f26s (AREAS):** areamanagerid, areaid, plus gebiedsspecs.
- **qtex-qwd8 (REGULATION/mapping):** areamanagerid, regulationid, areaid, …
- **ixf8-gtwq (TIME):** areamanagerid, regulationid, daytimeframe, starttimetimeframe, endtimetimeframe, farecalculationcode, maxdurationright, …
- **534e-5vdg (TARIFF):** amountfarepart, stepsizefarepart, startdurationfarepart, farecalculationcode, …
- **nfzq-8g7y (CALC):** farecalculationdesc, startdatefare, enddatefare, vatpercentage, …
- **yefi-qfiq (DESC):** regulationdesc, …

Geen kenteken in deze datasets; wel alles wat nodig is voor zone, regels en tarieven.

### 3.3 Overheid.io voertuiggegevens

- Standaardvelden o.a.: datumeersteafgiftenederland, kenteken, handelsbenaming, merk, voertuigsoort.
- Uitbreidbaar met `fields[]`; exacte velden in API-documentatie.

---

## 4. API-verbindingen en kosten (samenvatting)

| Bron | Type | Kosten | Opmerking |
|-----|------|--------|-----------|
| **RDW Open Data** | REST (Socrata), OData | Gratis | Geen key; rate limits mogelijk. |
| **RDW Web (per kenteken)** | Web | €0,18/opvraging | Voor bedrijven. |
| **RDW XML API** | API | €580 eenmalig + €0,07/opvraging | KvK vereist. |
| **Overheid.io** | REST API | Gratis tier (beperkt), daarna abonnement | Eenvoudige integratie per kenteken. |
| **Amsterdam Datapunt** | REST API | Gratis (gebruiksvoorwaarden) | RDW + andere Amsterdam-data. |

Aanbeveling: voor alleen parkeerzones en bulk-voertuigstatistieken: RDW open data. Voor “live” kentekencheck in de app: overheid.io (test) of RDW betaald afwegen tegen volume en budget.

---

## 5. Laadpaaldata – wat bestaat er en wat kun je tonen op de kaart?

### 5.1 DOT-NL / LINDA (NDW)

- **DOT-NL (Dataplatform Openbare Toegankelijke laadpunten Nederland):** centraal platform voor openbare laadpunten; OCPI-2.2.1; realtime (wijzigingen binnen 1 minuut).
- **LINDA (Laadpaal Infrastructuur Data):** NDW-project; integrale laadinfrastructuur, o.a. via Dexter-dataportaal; KPI’s en CDR’s.
- **Toegang:** Contact NDW Servicedesk (mail@servicedeskndw.nu); vermelden: aansluiting DOT-NL of NAP-EV. Afspraken over setup en verbindingstesten.
- **API:** Pull (o.a. dagelijkse dump locaties/EVSE/tarieven) en Push (real-time). Authenticatie: Token/API-key of OAuth2.  
  Documentatie: [docs.ndw.nu](https://docs.ndw.nu/) → Charging Points API (DOT-NL).

**Gebruik in app:** Geschikt voor officiële, actuele laadpaaldata op de kaart zodra je een overeenkomst met NDW hebt.

---

### 5.2 Data.overheid.nl / gemeenten

- **data.overheid.nl** – thema “Oplaadpunten elektrische voertuigen”: meerdere datasets.
- Voorbeeld: **Eindhoven – Oplaadpunten** (dataset 22449).  
  - Velden: o.a. locatie, status (gepland / in ontwikkeling / bestaand).  
  - Export: JSON, CSV, GeoJSON, SHP.  
  - Licentie: Publiek domein.  
  - URL: [data.eindhoven.nl – oplaadpalen](https://data.eindhoven.nl/explore/dataset/oplaadpalen/).
- Vergelijkbaar: o.a. Breda, Heemstede (op data.overheid.nl te vinden).

**Gebruik in app:** Goed voor per-gemeente kaartlagen of voor specifieke steden; landelijk beeld vereist combineren van meerdere gemeenten of een landelijke bron.

---

### 5.3 OpenStreetMap (OSM) / Overpass API

- Laadpunten in OSM: tag `amenity=charging_station` of `man_made=charge_point`; vaak ook vermogen, connector, operator.
- **Overpass API** (bijv. [overpass-api.de](https://overpass-api.de/), [overpass-turbo.eu](https://overpass-turbo.eu/)): query op bbox of regio; resultaat GeoJSON/JSON.
- Geen aparte registratie; wel netjes gebruik maken (usage policy), bijv. caching en beperkte requestfrequentie.

**Gebruik in app:** Zeer geschikt om **gratis** laadpunten op de kaart te tonen (Nederland + Europa). Kwaliteit verschilt per regio; goed te combineren met één andere bron (bijv. Open Charge Map of later DOT-NL).

---

### 5.4 Open Charge Map (OCM)

- [openchargemap.org](https://openchargemap.org/) – wereldwijd; Nederland goed gedekt.
- **API:** [openchargemap.org/develop/api](https://www.openchargemap.org/develop/api).  
  API-key is **verplicht** voor normaal gebruik; gratis aan te vragen via account → “My Apps”.
- Velden: locatie, connector types, vermogen, operator, beschikbaarheid (indien aangeleverd), etc.

**Gebruik in app:** Sterke kandidaat voor “laadpalen op de kaart” + filter op connector/vermogen; gratis met key; eenvoudig te combineren met bestaande kaart (bijv. Google Maps).

---

### 5.5 ElaadNL (platform.elaad.io)

- **ElaadNL** biedt vooral **analyses en statistieken** (laadgedrag, sessiedata, verbruiksprofielen), geen primaire “lijst van alle laadpunten” als API voor kaartweergave.
- Wel: open data-datasets bij rapporten/grafieken (o.a. charging profiles, sessiedata).  
  Zie [platform.elaad.io](https://platform.elaad.io/), [elaad.nl](https://elaad.nl/).

**Gebruik in app:** Meer voor achtergrondinformatie of UX-tekst (“gemiddeld laadgedrag”) dan voor de kaartlaag laadpunten.

---

### 5.6 Oplaadpalen.nl (website)

- Consumentensite met kaart en beschikbaarheid (vrij/bezet).  
  In data.overheid.nl (Eindhoven) wordt verwezen naar [oplaadpalen.nl](https://oplaadpalen.nl/) voor landelijk overzicht en realtime status; er is geen open API vermeld voor ontwikkelaars.

**Gebruik in app:** Geen directe API; wel referentie voor gebruikers (“meer info op oplaadpalen.nl”).

---

## 6. Laadinformatie die “bij de auto” hoort (type lader, snelheid)

- **RDW** levert **per voertuig** (kenteken):  
  - Brandstofsoort / type aandrijving (benzine, diesel, elektrisch, hybride, etc.) via **Gekentekende_voertuigen_brandstof** en **Elektrische voertuigen**.  
  - Geen technische laad-specificaties zoals “CCS”, “Type 2”, “max. 11 kW” in de standaard open data; dat zit in typegoedkeuringen/constructie, niet in de kenteken-registratie.
- **Connector-type en laadsnelheid** zitten dus vooral bij **laadpunten** (DOT-NL, OCM, OSM), niet bij het kenteken in RDW.

**Praktisch voor de app:**

1. **Kenteken → voertuigtype:** RDW (open data of overheid.io): “elektrisch / hybride / niet-elektrisch”.
2. **Suggestie laadpunten:** Op basis van locatie + filters (connector, vermogen) uit laadpaal-API (OCM, OSM of DOT-NL).
3. **“Past bij mijn auto”:** Optioneel: gebruiker kiest zelf connector/vermogen (Type 2, CCS, etc.) of we tonen alle laadpunten en laten filteren op connector/vermogen; RDW levert dan alleen “is EV ja/nee”.

---

## 7. Suggesties voor uitbreiding van de parkeerapp

### 7.1 Direct toepasbaar

1. **Laadpunten op de kaart**  
   - Integreer een laadpaallaag via **Open Charge Map** (gratis API-key) of **Overpass API** (OSM).  
   - Toon naast parkeerzones ook laadpunten; filter op connector (Type 2, CCS, CHAdeMO) en vermogen (AC 11/22 kW, DC snelladen).

2. **EV-filter / “Ik rijd elektrisch”**  
   - Optionele toggle “Toon laadpunten” of “Alleen zones met laadpunten in de buurt”.  
   - Gebruik RDW brandstof/elektrisch alleen als je kenteken koppelt (dan “deze auto is elektrisch”); anders: gebruikersvoorkeur.

3. **Kenteken → voertuiginfo**  
   - Bij “kenteken toevoegen”: optionele check via **overheid.io** (of RDW betaald) om merk/type/brandstof te tonen en invoer te valideren.  
   - Verkleint typefouten en versterkt vertrouwen.

4. **Zone + laadpaal in één kaart**  
   - Eén kaart: parkeerzones (huidige RDW-laag) + laadpunten (OCM/OSM).  
   - Handig voor: “parkeren én laden in de buurt”.

### 7.2 Middellange termijn

5. **DOT-NL aansluiting**  
   - Voor meest actuele en officiële laadpaaldata: aanvragen bij NDW.  
   - Geschikt als je professionele B2B-dienst wilt met realtime beschikbaarheid.

6. **Snelheid/connector per laadpunt**  
   - OCM en OSM hebben connector/vermogen; toon in popup of lijst: “Type 2, 22 kW”, “CCS, 50 kW”, etc.  
   - Optioneel: “Alleen snelladers” filter.

7. **Geschatte laadtijd (indicatief)**  
   - Op basis van vermogen laadpunt en een aanname (bijv. 50 kWh batterij, gemiddeld vermogen): “ca. 30 min snelladen”.  
   - Geen kenteken nodig; wel duidelijke disclaimer dat het een indicatie is.

8. **Parkeerduur + laadduur**  
   - Bij een zone met laadpunten: “Parkeerduur X min, geschatte laadduur Y min” als UX-tekst, zodat chauffeurs tijd kunnen inschatten.

### 7.3 Brede ideeën (niet beperkt tot laden)

9. **Favoriete zones / recente zones**  
   - Opgeslagen zones en laatst gebruikte zones voor snelle keuze.

10. **Meldingen**  
    - Herinnering “parkeersessie nog X min” of “sessie verlopen” (indien toegestaan door parkeerregels).

11. **Offline-first**  
    - Cache van zonegegevens en (optioneel) laadpunten voor gebruik bij slecht bereik (nu al deels via PWA).

12. **Toegankelijkheid**  
    - Filter “laadpunten met brede parkeerplaats” of “toegankelijke parkeerplaatsen” als data beschikbaar is (OCM/OSM soms).

13. **Tariefindicatie parkeren**  
    - Jullie hebben al RDW-tarieven; uitbreiden met “geschatte kosten voor 2 uur” in zone-sheet.

14. **Meerdere voertuigen**  
    - Per kenteken evt. “is elektrisch” onthouden, zodat laadpaallaag automatisch relevant is voor het gekozen voertuig.

---

## 8. Aanbevolen volgorde van implementatie

| Prioriteit | Actie | Bron | Opmerking |
|------------|--------|------|-----------|
| 1 | Laadpuntenlaag op kaart | Open Charge Map of OSM Overpass | Gratis; snel zichtbaar resultaat. |
| 2 | Filter connector/vermogen | Zelfde API | Betere UX voor EV-rijders. |
| 3 | Optionele kentekenvalidatie + voertuiginfo | Overheid.io (of RDW) | Minder fouten, meer vertrouwen. |
| 4 | “Elektrisch”-voorkeur / EV-toggle | App state + evt. RDW brandstof | Zonder kenteken: voorkeur; met kenteken: uit data. |
| 5 | DOT-NL verkennen | NDW | Voor officiële, realtime laadpaaldata op langere termijn. |

---

## 9. Bronnen en links

- RDW Open Data: [opendata.rdw.nl](https://opendata.rdw.nl/), [opendata.rdw.nl/browse](https://opendata.rdw.nl/browse)
- RDW Betaald: [rdw.nl – Betaald toegang](https://www.rdw.nl/over-rdw/dienstverlening/betaald-toegang-tot-ongevoelige-kentekengegevens)
- Overheid.io: [overheid.io](https://overheid.io/), [documentatie voertuiggegevens](https://overheid.io/documentatie/voertuiggegevens)
- NDW DOT-NL / DAFNE: [docs.ndw.nu – Charging Points API](https://docs.ndw.nu/data-uitwisseling/interface-beschrijvingen/dafne-api/)
- LINDA: [docs.ndw.nu – LINDA](https://docs.ndw.nu/handleidingen/projecten/linda/)
- Data.overheid.nl – Oplaadpunten: [data.overheid.nl – 22449-oplaadpalen](https://data.overheid.nl/dataset/22449-oplaadpalen)
- Open Charge Map: [openchargemap.org](https://openchargemap.org/), [API](https://www.openchargemap.org/develop/api)
- Overpass API: [overpass-api.de](https://overpass-api.de/), [Overpass Turbo](https://overpass-turbo.eu/)
- ElaadNL: [platform.elaad.io](https://platform.elaad.io/), [elaad.nl](https://elaad.nl/)
- Amsterdam Datapunt RDW: [api.data.amsterdam.nl – RDW](https://api.data.amsterdam.nl/v1/docs/datasets/rdw.html)

---

*Dit rapport is opgesteld voor het B2B Parkeren PWA-project en kan worden uitgebreid met nieuwe bronnen of API-details na behoefte.*
