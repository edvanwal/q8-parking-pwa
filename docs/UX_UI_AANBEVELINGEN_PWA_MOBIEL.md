# UX & UI Aanbevelingen – Q8 Parking B2B PWA

**Doel:** Verbeteringen voor gebruikerservaring en interface, gericht op **mobiel gebruik** en **installatie op telefoon** (PWA). Gebaseerd op customer journeys, bestaande documentatie en huidige implementatie.

---

## 1. Customer journeys – overzicht

### 1.1 Primaire journey: “Ik wil nu parkeren”

| Stap | Huidige flow | UX-observatie |
|------|--------------|---------------|
| 1 | Open de app → Login (of al ingelogd) | Login kan frustrerend zijn als “Remember me” niet werkt. |
| 2 | Kaart + zoekbalk (Zone / Adres) | Zoekbalk zweeft; op kleine schermen kan die de kaart bedekken. Zone vs. Adres is duidelijk. |
| 3 | Zoek zone of adres → Klik resultaat/marker | Zoekresultaten en markers zijn logisch. |
| 4 | Zone-sheet opent (tarieven, duur, kenteken) | Veel info; “START PARKING” staat onderaan – moet scrollen op kleine schermen. |
| 5 | Bevestigingsmodal (zone + kenteken) | Extra stap; nuttig voor zekerheid, maar vertraagt “snel parkeren”. |
| 6 | Sessie gestart → Actieve parkeerkaart + timer | Duidelijk. “END PARKING” prominent. |

**Knelpunten:**  
- Geen “snel parkeren”-pad voor gebruikers die altijd dezelfde zone/kenteken gebruiken (bijv. favoriet → één tap naar start).  
- Zone-sheet kan op telefoon hoog zijn; CTA “START PARKING” niet altijd direct zichtbaar.  
- Geen duidelijke “Mijn locatie”-knop in de kaart-UI voor “waar ben ik?”.

---

### 1.2 Journey: “Eerste keer / app installeren”

| Stap | Huidige flow | UX-observatie |
|------|--------------|---------------|
| 1 | Bezoek in Safari (iOS) of Chrome (Android) | — |
| 2 | iOS: install-gate overlay; Android: browser-banner | Gate is functioneel maar kan als blokkade voelen. |
| 3 | Gebruiker moet zelf “Deel” → “Zet op beginscherm” (iOS) weten | Veel gebruikers weten niet hoe PWA installeren. |
| 4 | Na install: open via icoon → fullscreen | Goed; geen browser-chrome. |

**Knelpunten:**  
- Install-instructies zijn platform-specifiek maar niet overal even zichtbaar/visueel (geen illustraties/stappen).  
- Geen “waarom installeren?” (sneller, meldingen, offline).  
- Geen korte onboarding na eerste open (“Dit is de kaart”, “Hier start je parkeren”).

---

### 1.3 Journey: “Kenteken wisselen / beheren”

| Stap | Huidige flow | UX-observatie |
|------|--------------|---------------|
| 1 | Menu → License plates | Menu zit achter hamburger; niet direct zichtbaar. |
| 2 | Lijst kentekens, “Add new license plate” | Duidelijk. |
| 3 | In zone-sheet: klik op kentekenbadge → plate selector sheet | Goed; snel wisselen zonder naar Plates te gaan. |

**Knelpunten:**  
- Wie nog geen kenteken heeft, komt daar pas in zone-sheet achter (na zoeken/klik). Beter: na login of op kaart een duidelijke hint “Voeg een kenteken toe” als `plates.length === 0`.  
- Menu-item “Car specs” is voor veel gebruikers minder belangrijk; kan secundair.

---

### 1.4 Journey: “Historie / declareren”

| Stap | Huidige flow | UX-observatie |
|------|--------------|---------------|
| 1 | Menu → Parking history | Logisch. |
| 2 | Lijst + Filters, Export CSV, Print | Functioneel compleet. |

**Knelpunten:**  
- Filters zitten in een sheet; op mobiel is “filter op datum/voertuig” niet in één oogopslag zichtbaar.  
- Geen duidelijke “laatste 7 dagen” of “deze maand” quick filters.

---

## 2. UX-aanbevelingen (prioriteit)

### 2.1 PWA-installatie (hoog)

- **Install-gate verbeteren**  
  - **Platform detectie:** Toon specifieke stappen voor iOS (Safari, Deel → Zet op beginscherm) en Android (Chrome, menu → Installeren).  
  - **Waarom installeren:** Korte regels: “Sneller openen”, “Meldingen bij aflopen parkeren”, “Werkt beter offline”.  
  - **Visuele stappen:** Genummerde stappen met iconen (Deel-icoon, beginscherm) in de taal van de app (NL/EN).  
  - **Niet blokkerend:** Optie “Later” of “Doorgaan in browser” zodat gebruikers eerst kunnen proberen; gate opnieuw tonen na 2e of 3e bezoek (niet elke keer).

- **Post-install:** Bij eerste open na installatie een korte tooltip of één scherm: “Swipe of tik op een zone om te starten” of “Zoek op zone of adres” – alleen als `localStorage` flag “onboarding_done” nog niet gezet is.

### 2.2 “Snel parkeren” (hoog)

- **Favorieten voorop:** Op het kaartscherm, als er favorieten zijn: een compacte horizontale strip “Favorieten” (of iconen) direct onder de zoekbalk of in een uitklapbare balk. Eén tap op een favoriet → zone-sheet openen (eventueel met standaard-kenteken en duur al ingevuld).  
- **Standaard duur:** Gebruiker kan in instellingen of in de zone-sheet een “standaard duur” (bijv. 2 uur) kiezen; dan hoeft hij alleen nog op “START PARKING” te tikken.  
- **Herinnering vorige zone:** Bij terugkomen op de kaart (zonder actieve sessie) de laatst gebruikte zone kort highlighten of in zoekbalk voorstellen (optioneel, privacy-vriendelijk).

### 2.3 Eerste keer / geen kenteken (medium)

- **Empty state kentekens:** Als `plates.length === 0`:  
  - Op het parkeer-scherm een duidelijke banner of kaart: “Voeg een kenteken toe om te kunnen parkeren” met CTA naar “Kenteken toevoegen” (opent modal of navigeert naar Plates).  
  - Niet pas bij het openen van een zone-sheet pas laten merken dat er geen kenteken is.

### 2.4 Zone-sheet & CTA (medium)

- **START PARKING altijd bereikbaar:**  
  - Zone-sheet: “Sticky” footer met alleen de knop “START PARKING” (blijft onderaan zichtbaar bij scroll), of de sheet zo ontwerpen dat de knop zonder scroll zichtbaar is op standaard telefoonhoogtes.  
- **Duur:** Huidige “2h 00m” met −/+ is duidelijk; optie “Alleen starten, later stoppen” (geen vaste eindtijd) kan power users helpen – alleen als dit in de business logic past.

### 2.5 Kaart (medium)

- **“Mijn locatie”-knop:** Vaste FAB of icoon op de kaart (rechtsonder of bij de zoekbalk) om de kaart te centreren op de GPS-locatie en eventueel dichtstbijzijnde zone voor te selecteren.  
- **Locatie-permissie:** Eén duidelijke uitleg bij eerste vraag: “We gebruiken je locatie om nabije parkeerzones te tonen.”

### 2.6 Navigatie & menu (medium)

- **Bottom navigation (optie):** Overweeg een vaste bottom bar met 3 items: **Parkeren** (kaart), **Historie**, **Meer** (menu met Plates, Car specs, Notifications, Favorites, Sign out). Dit vermindert afhankelijkheid van de hamburger en maakt de twee belangrijkste schermen één tap bereikbaar (thumb-zone).  
- **Huidige hamburger behouden:** Als alternatief: hamburger houden maar in het drawer de meest gebruikte acties bovenaan (Parking, History, License plates) en duidelijke visuele scheiding voor “Meer” / “Uitloggen”.

### 2.7 Feedback & fouten (laag)

- **Toasts:** Blijven onderaan, boven safe area; NL/EN consistent.  
- **Offline:** Duidelijke banner of toast: “Geen verbinding. Je kunt nog wel je actieve parkeren zien.” + retry bij zone-laden.  
- **Validatie:** Kenteken-/zonefouten in de zone-sheet kort en actiegericht onder het desbetreffende veld tonen.

---

## 3. UI-aanbevelingen (prioriteit)

### 3.1 Mobile-first & thumb-zone

- **Belangrijkste acties in onderste helft:** “START PARKING”, “END PARKING”, primaire knoppen in de onderste 50% van het scherm of in een vaste footer (makkelijk met duim bereikbaar).  
- **Tap targets:** Minimaal 44×44 px voor alle knoppen en klikbare items (hamburger, zone-badges, favoriet-icoon, −/+ duur).  
- **Safe area:** Blijft respecteren `env(safe-area-inset-top/bottom)` voor notches en home-indicator.

### 3.2 Visuele hiërarchie

- **Eén primaire CTA per scherm:** Op zone-sheet alleen “START PARKING” als primaire knop; secundaire acties (favoriet, sluiten, kenteken wisselen) visueel ondergeschikt.  
- **Actieve parkeerkaart:** “END PARKING” mag de sterkste kleur/contrast hebben (rood of donker); timer en zone-info duidelijk leesbaar (groot genoeg voor onderweg).

### 3.3 Consistente headers

- **Top bar:** Overal hetzelfde patroon: logo (of terug) | titel | icoon (menu/sluiten). Zoekbalk daaronder op het kaartscherm. Dit sluit aan bij het bestaande UI_REDESIGN_PLAN.  
- **Bottom sheets:** Handlebalk bovenaan sheet behouden; titel (bijv. “ZONE 321”) en sluitknop duidelijk.

### 3.4 Kleur & contrast

- **Q8-blauw (#003D6B, #1E4A99):** Geschikt voor knoppen en focus; voldoende contrast op wit.  
- **Gevaar (END PARKING):** Rood blijft; zorg dat tekst op rood voldoende contrast heeft (WCAG AA).  
- **Disabled states:** Duidelijk visueel onderscheid (grijs, lagere opacity) voor “MAKE SELECTED PLATE DEFAULT” wanneer niets geselecteerd.

### 3.5 Typografie & leesbaarheid

- **Mulish:** Geschikt voor UI; zorg dat body-tekst op mobiel minimaal 16px is (voorkom zoom op iOS).  
- **Labels:** Input-labels en sectiekoppen (Rates, Parking duration) duidelijk van body-tekst onderscheiden (gewicht/kleur).

### 3.6 Loading & empty states

- **Zones laden:** Huidige spinner + “Loading parking zones…” is goed; eventueel korte uitleg “Zones worden geladen…” voor eerste keer.  
- **Geen zoekresultaten:** Duidelijke boodschap: “Geen zones gevonden voor [query]. Probeer een ander zone-nummer of adres.”  
- **Geen historie:** “Nog geen parkeersessies” met korte uitleg dat hier sessies verschijnen na het beëindigen.

---

## 4. Korte prioriteitenmatrix

| Prioriteit | Onderwerp | Impact | Inspanning |
|------------|-----------|--------|------------|
| Hoog | Install-gate: platformstappen + “waarom” + “Later” | Hoog | Medium |
| Hoog | Favorieten snel toegankelijk op kaart (strip of iconen) | Hoog | Medium |
| Hoog | Sticky “START PARKING” of CTA altijd zichtbaar in zone-sheet | Hoog | Laag |
| Medium | “Mijn locatie”-knop op kaart | Medium | Laag |
| Medium | Empty state: “Voeg kenteken toe” als geen kentekens | Medium | Laag |
| Medium | Bottom navigation (Parkeren | Historie | Meer) | Medium | Hoog |
| Medium | Eerste-keer tooltip na install (“Zoek zone of adres”) | Medium | Laag |
| Laag | Quick filters historie (7 dagen, deze maand) | Laag | Medium |
| Laag | WCAG-check knoppen/tekst (contrast) | Medium | Laag |

---

## 5. Samenvatting

- **Customer journey “parkeren”** verbeteren door: favorieten direct op de kaart, duidelijke CTA “START PARKING” zonder scroll, optioneel “mijn locatie”.  
- **Install-journey** verbeteren door: platform-specifieke stappen, korte uitleg waarom installeren, en “Later” zodat de gate niet blokkeert.  
- **Eerste keer / kentekens:** Duidelijke empty state en CTA als er nog geen kenteken is.  
- **UI:** Mobile-first (thumb-zone, 44px targets), één duidelijke primaire CTA per scherm, consistente top bar en safe areas. Overweeg bottom navigation voor Parkeren en Historie.

Deze aanbevelingen sluiten aan bij de bestaande documentatie (UI_REDESIGN_PLAN, UI_VERFIJNINGSPLAN, PWA_INSTALL_INSTRUCTIES, RAPPORT_USER_STORIES) en kunnen stapsgewijs worden ingevoerd.
