# Plan: UI-verfijning na vergelijking origineel / bijlage 1 / 2 / 3

Vergelijking van het originele ontwerp, bijlage 1 (doel), bijlage 2 (huidige live), en bijlage 3 (idle/start) — met voorstellen voor aanpassingen.

---

## Overzicht verschillen

| Onderdeel   | Origineel / Bijlage 1                                 | Bijlage 2 (live)                 | Bijlage 3                                              | Huidige implementatie                 |
| ----------- | ----------------------------------------------------- | -------------------------------- | ------------------------------------------------------ | ------------------------------------- |
| Zoekbalk    | Input "321", zoekicoon rechts, Zone toggle lichtblauw | —                                | Zoekicoon links, Zone button donkerblauw, onder search | Input + zoekicoon links + Zone rechts |
| Duration    | Cijfer "1" (uren) met − / +                           | "2h 00m"                         | —                                                      | "2h 00m"                              |
| Zone panel  | ZONE 321, badge G-346-VN, rode !                      | ZONE GRV0140DE, pill 1-ABC-123   | —                                                      | ZONE + id, kentekenbadge              |
| Rates       | Tijdslots (0:00–12:00, 12:00–23:00) met bullets       | 24/7, Standaard tarief, € 4,50/h | —                                                      | Dynamisch (data-afhankelijk)          |
| Map         | Straatniveau, blauwe/rode P, POIs                     | Blurred, kleine rode markers     | Nederland overzicht, geen markers                      | Google Maps, blauwe/rode P            |
| Zone toggle | Lichtblauw                                            | —                                | Donkerblauw, prominent                                 | Donkerblauw (#q8-blue-900)            |

---

## Voorstellen voor aanpassingen

### 1. Zoekbalk: icoon-positie en Zone-toggle

**Origineel / Bijlage 1:** Zoekicoon rechts van het inputveld.  
**Bijlage 3:** Zoekicoon links.  
**Huidig:** Zoekicoon links.

**Voorstel:** Zoekicoon rechts plaatsen, zoals in het origineel. Input links, icoon rechts, Zone-toggle rechts ernaast.

---

### 2. Duration: weergave als uren (optioneel)

**Origineel:** Simpele "1" (uren) met − / +.  
**Huidig:** "2h 00m".

**Voorstel:** Optie voor urenweergave (bijv. "1", "2") naast of in plaats van "2h 00m" om het origineel dichter te benaderen. Of houden zoals nu voor duidelijkheid.

---

### 3. Zone toggle: kleur

**Origineel / Bijlage 1:** Zone actief = lichtblauw.  
**Bijlage 3:** Donkerblauw.  
**Huidig:** Donkerblauw (#q8-blue-900).

**Voorstel:** Lichtere blauwtint voor Zone-toggle in actieve staat, bijv. `#1e5f8a` of `#2b7bb8`, zodat het dichter bij bijlage 1 komt.

---

### 4. Zoekbalk: placeholder en schaduw

**Origineel:** Geen placeholder of "321" als voorbeeld.  
**Bijlage 3:** "Search by parking zone ...".  
**Huidig:** Placeholder "321" of dynamisch.

**Voorstel:** Placeholder "Search by parking zone ..." als standaard; bij gevulde zone het zone-nummer tonen. Eventueel subtiele schaduw op de zoekbalk (zoals in bijlage 2) behouden.

---

### 5. Zone panel: schaallijnen op de kaart

**Origineel / Bijlage 1:** Blauwe lijnen langs wegen (parkeerzones).  
**Huidig:** Geen lijnen.

**Voorstel:** Zone-boundaries als lijnen/polygonen op de kaart tonen als de data beschikbaar is. Anders overslaan.

---

### 6. Rates-sectie: tijdsloten en bullets

**Origineel:**

- 0:00 – 12:00: Free parking
- 12:00 – 23:00: € 0,40/h, per 30 min, na 30 min € 3,20/h, per 15 min
- 23:00 – 24:00: (meer details)

**Huidig:** Data-afhankelijke weergave (24/7, Standaard tarief, etc.).

**Voorstel:** Rate-weergave uitbreiden zodat tijdsloten (bijv. 0:00–12:00) duidelijk worden weergegeven, met bullets voor detailregels, zoals in het origineel. `renderRatesList` aanpassen.

---

### 7. Zone panel: waarschuwing en sluitknop

**Origineel:** Rode "!" en "Please check your parking zone number".  
**Huidig:** Zelfde tekst, "!" als alert-icon.

**Voorstel:** Geen wijziging; dit sluit aan bij het origineel.

---

### 8. Map: straatniveau en POIs

**Origineel:** Straatniveau met straatnamen en POIs (Action Rotterdam, Tobacco, Lidl, etc.).  
**Bijlage 3:** Nederland-overzicht.  
**Huidig:** Google Maps, zoom afhankelijk van zones.

**Voorstel:** Bij zone-selectie straatniveau kiezen (zoom 15–17) en POIs inschakelen indien beschikbaar in de map-instellingen.

---

### 9. Search bar: Zone-button positie (bijlage 3)

**Bijlage 3:** Zone-button lijkt onder of naast de zoekbalk te staan, donkerblauw.  
**Huidig:** Zone-toggle rechts naast het inputveld.

**Voorstel:** Layout behouden (één rij: input | icoon | Zone), tenzij er expliciet een andere layout gewenst is.

---

### 10. Header en logo

**Origineel / bijlagen:** Q8 Liberty-logo, "Parking" centraal, hamburger rechts.  
**Huidig:** Gelijk.

**Voorstel:** Geen wijziging.

---

## Volgorde van uitvoering (prioriteit)

| Nr  | Aanpassing                                 | Impact | Moeite |
| --- | ------------------------------------------ | ------ | ------ |
| 1   | Zoekicoon rechts verplaatsen               | Medium | Laag   |
| 2   | Zone toggle: lichtblauw i.p.v. donkerblauw | Laag   | Laag   |
| 3   | Rates: tijdsloten en bullets verbeteren    | Medium | Medium |
| 4   | Duration: optie voor urenweergave ("1")    | Laag   | Medium |
| 5   | Map: straatniveau bij zone-selectie        | Medium | Laag   |
| 6   | Zone-boundaries op kaart (indien data)     | Laag   | Hoog   |
| 7   | Placeholder zoekbalk finetunen             | Laag   | Laag   |

---

## Te raadplegen bestanden

- **HTML:** `public/index.html` (map-search-bar, sheet-zone)
- **CSS:** `public/design-system.css` (.map-search-bar, .map-search-toggle--zone)
- **JS:** `public/ui.js` (renderRatesList, renderZoneSheet, centerMapOnZones, initGoogleMap)
