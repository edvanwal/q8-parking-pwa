# Onderzoeksrapport: Parkeertarieven in database en app

**Datum:** 1 februari 2025  
**Doel:** Inzicht in hoe parkeertarieven in de databases zijn opgeslagen, hoe ze in de app worden geïntegreerd, en aanbevelingen voor begrijpelijkheid en nauwkeurigheid voor de klant.

---

## 1. Samenvatting

De parkeertarieven komen uit **RDW Open Data** en worden via een Python-pipeline (o.a. `fetch_rdw_data.py` en `scripts/analyze_full_dataset.py`) verwerkt en naar **Firestore** geüpload. De PWA leest zones en tarieven uit Firestore en toont ze op de kaart en in het zonesheet. Er zijn enkele knelpunten: de **geschatte kosten** worden nergens getoond (hoewel de berekening wel bestaat), tarieven worden alleen als **tekst** opgeslagen (niet als numerieke waarden voor berekening), en de weergave is beperkt tot **vandaag** en kan bij complexe zones onduidelijk of incompleet zijn. Dit rapport beschrijft de datastructuur, de integratie in de app en doet concrete aanbevelingen.

---

## 2. Hoe zitten de tarieven in de databases?

### 2.1 RDW-bronnen (opendata.rdw.nl)

De tarieven worden opgebouwd uit meerdere gekoppelde datasets:

| Dataset | Resource ID | Rol |
|--------|-------------|-----|
| **Gebied** | b3us-f26s | Gebiedsspecificaties (areaid, areamanagerid, geometrie) |
| **Regeling-mapping** | qtex-qwd8 | Koppelt gebied → regeling (regulationid), met start-/einddatum |
| **Tijdvak** | ixf8-gtwq | Per regeling: dag (MAANDAG etc.), start-/eindtijd (0–2400), farecalculationcode, maxdurationright |
| **Tariefdeel** | 534e-5vdg | Per farecalculationcode: amountfarepart, stepsizefarepart, startdatefarepart, enddatefarepart |
| **Tariefberekening** | nfzq-8g7y | Omschrijving per farecalculationcode (farecalculationdesc) |
| **Regeling-beschrijving** | yefi-qfiq | Regulationdesc, regulationtype |

**Berekening uurtarief (in de pipeline):**

- `amountfarepart` = bedrag per stap (bijv. € 1,00)
- `stepsizefarepart` = stapgrootte in **minuten** (bijv. 20)
- **Uurtarief** = `(amountfarepart / stepsizefarepart) * 60`  
  Voorbeeld: (1,00 / 20) * 60 = € 3,00 per uur.

Alleen tariefdelen met **geldige datum** (startdatefarepart ≤ vandaag ≤ enddatefarepart) en de **nieuwste** per (areamanagerid, farecalculationcode) worden gebruikt.

### 2.2 Verwerking in de pipeline (Python)

**Bestanden:** `fetch_rdw_data.py`, `scripts/analyze_full_dataset.py`

**Stappen:**

1. Gebieden en regeling-mappings ophalen per areamanager (Amsterdam, Rotterdam, Den Haag, Utrecht, etc.).
2. Per gebied: actieve regulationids bepalen (op datum).
3. Tijdvakken ophalen per regeling → dag, start-/eindtijd, farecalculationcode; **maxdurationright** wordt gebruikt voor `max_duration_mins`.
4. Tariefdelen ophalen; per (mgr, farecalculationcode) het nieuwste geldige tariefdeel nemen → rate, step, amt.
5. Tijdvakken per dag samenvoegen (sweep line) tot aaneengesloten slots; per slot het hoogste tarief kiezen.
6. **Weergave-labels genereren:**
   - **price** (voor map-pin): numeriek, het maximale uurtarief van de zone.
   - **rates[]**: array van objecten met:
     - `time`: bijv. `"Maandag 00:00 - 24:00"` (Nederlandse dag + tijdrange).
     - `price`: **string** zoals `"€ 3,00 / h"` of `"€ 1,00 / 20 min"` (stapbedrag).
     - `detail`: tekst uit tariefberekening (eventueel via LLM vertaald), bijv. `"1,00 per 20 min"` of `"Standaard tarief"`.

**Belangrijke beperkingen in de pipeline:**

- Slots met **step > 60** minuten worden overgeslagen (`if t_info[1] > 60: continue`). Dagkaarten of blokken van > 1 uur komen daardoor niet als aparte tariefregel in `rates` terecht.
- Alleen straatparkeren: o.a. VERGUNP, BEWONERP, GARAGEP worden uitgefilterd in de app bij `loadZones`.
- `price` in Firestore is een **getal** (uurtarief); `rates[].price` is altijd een **string** (alleen voor weergave).

### 2.3 Firestore / zone-object in de app

**Collectie:** `zones`

**Veld** | **Type** | **Betekenis**
--------|----------|----------------
`id` / `uid` | string | Zone-ID (bijv. 363_AREN, 12100)
`name` | string | Weergavenaam
`lat`, `lng` | number | Coördinaten
`price` | number | Uurtarief (of max tarief) voor o.a. map-pin
`rates` | array | Lijst van `{ time, price, detail }` (price = string)
`max_duration_mins` | number | Max. parkeertijd in minuten (uit tijdvak)
`has_special_rules` | boolean | Waarschuwing feestdagen/speciale regels

Lokaal gebruikt ook `display_label` (indien gezet) voor de map-pin; anders `price`.

---

## 3. Hoe zijn de tarieven geïntegreerd in de app?

### 3.1 Dataflow

1. **Firestore** → `Services.loadZones()` → `state.zones` (met filter op straatparkeren).
2. Zone kiezen (marker of zoekresultaat) → `tryOpenOverlay('sheet-zone', { uid, zone, price, rates })` → state: `selectedZone`, `selectedZoneRate` (= numeriek `price`), `selectedZoneRates` (= `rates`).
3. Zonesheet: `renderZoneSheet()` vult zone-id, adres, kenteken, **duration**, en roept `renderRatesList(list, rates)` aan.
4. Rates: bron = `state.selectedZoneRates`; als die leeg zijn, `zone.rates` van het zone-object.

### 3.2 Weergave van tarieven (renderRatesList – ui.js)

- **Filter:** Alleen regels waar `time` de **huidige weekdag** bevat (Maandag, Dinsdag, …) of "24/7" / "dagelijks" / "daily" / "check zone". Andere dagen worden niet getoond.
- **Deduplicatie:** Op `time|price` om dubbele regels te vermijden.
- **Weergave per regel:**
  - Tijd: `time`-string, waarbij de dagnaam wordt weggelaten en tijd als `uu:mm – uu:mm` wordt geformatteerd.
  - Prijs: `price`-string (bijv. "€ 3,00 / h"); als leeg of "gratis"/"free"/0 → groen "Free".
  - Detail: `detail` als bulletlijst (gesplitst op `|`).
- Als na filter **geen** tarief overblijft: één regel "Geen tarieven voor [dag]".

Er wordt **geen** numerieke berekening op `rates[].price` gedaan; het is puur tekst.

### 3.3 Prijs op de kaart en in zoekresultaten

- **Map-markers:** `z.display_label` of anders `z.price` (number) → tekst zoals "€ 3,00" of "Free".
- **Zoekresultaten:** `z.price` (number) → "€ 3,00" (komma als decimaalteken).

### 3.4 Duration en kosten

- **Duration:** In het sheet kan de gebruiker duur aanpassen (knoppen ±15 min, of ±30/60 in andere varianten). State: `duration` in minuten (0 = "Until stopped").
- **Berekening:** In `utils.js` staat `calculateCost(durationMins, hourlyRate)` → `(durationMins / 60) * hourlyRate`.
- **Gebruik:** `calculateCost` wordt **nergens** in de zone-sheet of elders in de UI aangeroepen. `selectedZoneRate` (numeriek uurtarief) wordt wel gezet maar niet gebruikt voor een geschatte-kostenweergave. De klant ziet dus **geen** indicatie van "ongeveer € X voor Y uur".

### 3.5 Beperkingen en risico’s in de huidige integratie

- **Geen geschatte kosten:** De klant ziet geen bedrag voor de gekozen duur.
- **Alleen vandaag:** Tarieven voor andere dagen zijn niet zichtbaar (bewust voor eenvoud, maar kan verwarring geven bij plannen voor morgen/andere dag).
- **Price alleen als tekst in rates:** Geen numeriek veld per tijdslot; automatische berekening uit `rates` in de frontend is lastig (zou parsing van "€ 3,00 / h" vergen).
- **Eén uurtarief voor hele zone:** `selectedZoneRate` = zone.price. Bij verschillende tarieven per tijdslot wordt niet het tarief voor het **huidige** tijdslot gebruikt voor een eventuele kostenindicatie.
- **Duration-label:** Label zegt "Parking duration (h)" terwijl de stappen 15 min zijn – inconsistent.
- **Geen disclaimer:** Geen tekst dat het getoonde tarief indicatief is of dat de uiteindelijke afrekening kan afwijken.

---

## 4. Conclusies

1. **Database (RDW → Firestore):**  
   Tarieven zijn traceerbaar opgebouwd uit RDW-tijdvakken en tariefdelen. Het uurtarief wordt correct berekend; per zone wordt een duidelijke `rates`-lijst met tijd, prijsstring en detail opgeslagen. Slots met stap > 60 min en dagkaarten komen niet als aparte regels in `rates`; `price` is een enkel getal (max. uurtarief).

2. **App-integratie:**  
   Zones en tarieven worden correct uit Firestore geladen en doorgegeven. De weergave is beperkt tot vandaag en toont tijd, prijs en detail. Er is **geen** koppeling van de gekozen duur naar een geschat bedrag: `calculateCost` en `selectedZoneRate` worden niet gebruikt in de UI.

3. **Begrijpelijkheid:**  
   Tarieven zijn leesbaar (tijd + prijs + detail). Ontbreken van een geschatte kostenindicator en van een duidelijke uitleg/waarschuwing vermindert de voorspelbaarheid voor de klant.

4. **Nauwkeurigheid:**  
   De weergave volgt de pipeline-output. Accuraatheid hangt af van actuele RDW-data en correcte datumfiltering in de pipeline. In de app zelf wordt niet gecorrigeerd voor het actuele tijdslot (bijv. nachttarief vs. dagtarief) bij een eventuele kostenindicatie.

---

## 5. Aanbevelingen

### 5.1 Korte termijn (begrijpelijkheid en nauwkeurigheid in de app)

1. **Geschatte kosten tonen in het zonesheet**  
   - Gebruik `Q8.Utils.calculateCost(state.duration, zone.price)` (of `selectedZoneRate`).  
   - Toon bij duur > 0 een regel zoals: *"Geschatte kosten: ca. € X,XX"* (of NL: *"Indicatie: ca. € X,XX"*).  
   - Bij "Until stopped" (duration 0): geen bedrag of tekst "Duur onbekend – geen indicatie".

2. **Disclaimer bij tarieven**  
   - Korte zin bij de rates-sectie, bijv.: *"Tarieven zijn indicatief. Het definitieve bedrag kan afwijken."*

3. **Label duration**  
   - Wijzig "Parking duration (h)" in bijv. "Parking duration" of "Duur" en behoud de weergave in uren/minuten (bijv. "1h 30m"), zodat het consistent is met de 15-min-stappen.

4. **Optioneel: tarief voor huidig tijdslot**  
   - Als eerste verbetering volstaat het om zone.price (of selectedZoneRate) te gebruiken voor de geschatte kosten.  
   - Later: uit `rates` de regel voor "nu" bepalen (op basis van huidige tijd + vandaag), daar een numeriek uurtarief uit afleiden (bijv. door in de pipeline een extra veld `rate_numeric` per rates-item mee te geven) en dat gebruiken voor een nauwere indicatie.

### 5.2 Medium termijn (data en weergave)

5. **Numeriek tarief in rates (pipeline)**  
   - Voeg per rates-item een veld toe, bijv. `rate_numeric` (uurtarief als number). De app kan dan:  
     - geschatte kosten berekenen op basis van het tijdslot dat "nu" actief is;  
     - eventueel meerdere tijdsloten tonen met bijbehorende indicatie.

6. **Uitbreiding weergave tarieven**  
   - Optie om **alle dagen** of "Maandag–zondag" te tonen (bijv. uitklapbaar "Bekijk alle dagen"), naast de standaardfilter "vandaag", zodat de klant kan plannen.

7. **Dagkaarten en lange stappen (pipeline)**  
   - Beoordeel of slots met step > 60 (bijv. dagkaart) als aparte regel in `rates` moeten, met een duidelijke `detail` (bijv. "Dagkaart € X"). Nu worden ze weggelaten, wat bij zones met alleen zulke tarieven tot lege of onduidelijke weergave kan leiden.

### 5.3 Langer termijn (volledigheid en transparantie)

8. **Validatie en monitoring**  
   - Periodieke checks (bijv. script) of zones geen lege `rates` hebben terwijl er wel betaald parkeren geldt, en of `price` overeenkomt met de inhoud van `rates`.

9. **Toelichting in de app**  
   - Korte uitleg bij "Rates" (bijv. tooltip of link "Hoe worden tarieven bepaald?") die vermeldt dat de tarieven op RDW Open Data zijn gebaseerd en indicatief zijn.

10. **Tests**  
    - Unit tests voor `calculateCost` (bestaan al in `tests/test_core.js`). Uitbreiden met: weergave geschatte kosten in het sheet en (indien geïmplementeerd) gebruik van `rate_numeric` per tijdslot.

---

## 6. Overzicht aanbevelingen

| Nr | Aanbeveling | Impact | Inspanning |
|----|-------------|--------|------------|
| 1 | Geschatte kosten in zonesheet (calculateCost + selectedZoneRate) | Hoog | Laag |
| 2 | Disclaimer bij tarieven | Medium | Laag |
| 3 | Label duration consistent maken | Laag | Laag |
| 4 | Optioneel: tarief voor huidig tijdslot (rate_numeric) | Medium | Medium |
| 5 | rate_numeric in pipeline per rates-item | Medium | Medium |
| 6 | Optie "alle dagen" bij rates | Laag | Medium |
| 7 | Dagkaart / step > 60 in rates opnemen | Medium | Medium |
| 8 | Validatie/monitoring lege/onjuiste tarieven | Medium | Medium |
| 9 | Toelichting "Hoe worden tarieven bepaald?" | Laag | Laag |
| 10 | Tests uitbreiden voor kostenweergave | Laag | Laag |

Prioriteit voor maximale begrijpelijkheid en perceptie van nauwkeurigheid: **1 (geschatte kosten)** en **2 (disclaimer)**.

---

## 7. Implementatie (februari 2025)

De volgende onderdelen uit het plan zijn geïmplementeerd:

| Onderdeel | Status | Bestanden |
|-----------|--------|-----------|
| **Geschatte kosten in zonesheet** | ✅ | `public/ui.js`, `ui.js`, `public/index.html`, `index.html`: blok `#details-estimated-cost`; `calculateCost(duration, zone.price \|\| selectedZoneRate)`; NL/EN teksten. |
| **Disclaimer bij tarieven** | ✅ | Zelfde bestanden: `#details-rates-disclaimer` met "Tarieven zijn indicatief…" / "Rates are indicative…". |
| **Label duration** | ✅ | HTML: label "Parking duration (h)" → "Parking duration" met id `details-duration-label`; in `renderZoneSheet` NL "Duur" / EN "Parking duration". |
| **Toelichting bij Rates** | ✅ | Label "Rates" heeft id `details-rates-label`; in JS wordt tekst (Rates/Tarieven) en tooltip (RDW Open Data) op taal gezet. |
| **CSS** | ✅ | `public/design-system.css`, `design-system.css`: `.sheet-rates-disclaimer`, `.sheet-estimated-cost`, `.sheet-estimated-cost--muted`. |
| **Tests** | ✅ | `tests/test_core.js`: TEST 1b "Pricing: Estimated cost formatting for zone sheet" (calculateCost + formatting); mocks voor Q8, saveFavorites, loadFavorites. |

**Opmerking:** De test "Services: Add/Delete Plate" faalt door plate-normalisatie (1-TEST-999 → 1TEST999); dat is een bestaand gedrag, geen gevolg van deze wijzigingen.

---

*Einde rapport*
