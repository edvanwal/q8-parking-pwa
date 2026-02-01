# Plan: UI-transformatie naar bijlage 2

Van de huidige parkeer-view (bijlage 1) naar de gewenste opmaak (bijlage 2).

---

## 1. Header (boven)

**Huidig**
- Zwevende witte pil met: hamburger | zoekbalk | "Address"
- Geen logo, geen "Parking"-titel

**Doel (bijlage 2)**
- Vaste witte balk bovenaan
- Links: Q8 liberty logo
- Midden: "Parking" als titel
- Rechts: hamburger

**Aanpassingen**
- `map-floating-header` vervangen door `top-bar` (zoals History/Plates)
- Logo + titel + hamburger toevoegen
- Zoekbalk verplaatsen naar de rij eronder

---

## 2. Zoekbalk (onder header)

**Huidig**
- In dezelfde pil als hamburger
- Placeholder "Search zone or address..."
- Toggle "Address"

**Doel (bijlage 2)**
- Aparte witte balk onder de header
- Input met zone-nummer (bv. "321"), zoekicoon rechts
- Toggle rechts: Zone / Address (Zone actief = blauw)

**Aanpassingen**
- Zoekbalk los van header, direct onder `top-bar`
- Input breed, zoekicoon in het veld
- Toggle-styling aanpassen (zoals bijlage 2)

---

## 3. Greeting-overlay

**Huidig**
- "Zone" / "Good afternoon, Driver" / "Ready to park?" over de kaart

**Doel (bijlage 2)**
- Niet zichtbaar op de kaart (of helemaal weg)

**Aanpassingen**
- Greeting verbergen of verwijderen op de kaartview

---

## 4. Markers op de kaart

**Huidig**
- Rode pins met €-prijs als label (bv. €4,50)

**Doel (bijlage 2)**
- Blauwe cirkels met wit "P"-icoon (parkeerlocaties)
- Eén rode cirkel met wit "P" voor geselecteerde zone
- Prijzen in de markers (blijft gewenst)

**Aanpassingen**
- Marker-styling: blauwe cirkel + P, rode cirkel voor geselecteerd
- Prijs tonen: behouden (bv. in/onder de cirkel of als label)

---

## 5. Zone-informatiepaneel (bodem)

**Huidig**
- Sheet met zone-ID, kenteken, rates, duration, START PARKING
- Andere layout en visuele hiërarchie

**Doel (bijlage 2)**
- Wit paneel vanaf onder
- Header: P-icoon + "ZONE 321" + badge "G-346-VN" + X
- Waarschuwing: rood icoon + "Please check your parking zone number"
- Sectie "Rates" met tijdsloten en prijzen
- Sectie "Parking duration (h):" met - / 1 / +
- Onderkant: blauwe knop "START PARKING"

**Aanpassingen**
- Zone-sheet HTML/CSS aanpassen naar bijlage 2
- Header: P + ZONE [id] + kentekenbadge + sluitknop
- Waarschuwing prominent
- Rates-lijst: tijdsloten + bullets
- Duration: label + invoer + +/- knoppen

---

## 6. Filters-knop

**Huidig**
- Grote blauwe "Filters"-knop rechtsonder over de kaart

**Doel (bijlage 2)**
- Niet zichtbaar in de beschrijving (of anders gepositioneerd)

**Aanpassingen**
- Filters-knop verbergen of verplaatsen (bv. in menu of header)

---

## 7. Zijmenu (drawer)

**Huidig**
- Witte drawer van rechts met Q8, X, Parking, History, License Plates, Sign Out, Logged in as

**Doel (bijlage 2)**
- Overeenkomstig (hamburger opent menu)

**Aanpassingen**
- Geen grote wijzigingen; eventueel styling verfijnen

---

## 8. Volgorde van uitvoering

| Stap | Onderdeel | Bestanden |
|------|-----------|-----------|
| 1 | Header: top-bar met logo + Parking + hamburger | index.html, design-system.css |
| 2 | Zoekbalk: aparte balk onder header | index.html, design-system.css, ui.js |
| 3 | Greeting verwijderen/verbergen | ui.js |
| 4 | Markers: blauwe/rode P-cirkels | ui.js, design-system.css |
| 5 | Zone-sheet: layout + content | index.html, design-system.css, ui.js |
| 6 | Filters-knop verbergen/verplaatsen | index.html, design-system.css |
| 7 | Afstemming en detailstyling | design-system.css |

---

## 9. Te raadplegen bestanden

- **HTML**: `public/index.html` (view-map, sheet-zone)
- **CSS**: `public/design-system.css` (map-floating-header, top-bar, markers, bottom-sheet)
- **JS**: `public/ui.js` (renderParkingView, renderZoneSheet, renderMapMarkers)
