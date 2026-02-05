# Acceptatie Checklists

Dit document bevat checklists per categorie die Edwin kan afvinken. Per categorie toont de agent een lijst met checklistpunten. Edwin hoeft alleen te reageren op uitzonderingen.

**Getest op beeldnummer:** 20260205170644-86cc1 | **Korte code:** 20260205170644-86cc1

---

## Hoe geef je feedback

1. De agent toont een checklist met genummerde IDs (bijv. C3-01, C3-02).
2. Bekijk de checklist en test de app.
3. Reageer met:
   - **"Oké, ga door"** — alles is goed behalve wat je eventueel daarna noemt.
   - **"Dit klopt niet: C3-05, C3-12"** — dan repareert de agent die punten eerst.
4. Feedback die niet direct wordt opgepakt (bijvoorbeeld "mooier" of "scope") gaat naar [FEEDBACK_BACKLOG.md](FEEDBACK_BACKLOG.md).
5. Edge case patronen staan in [EDGE_CASES_LIBRARY.md](EDGE_CASES_LIBRARY.md).

---

## Legenda labels

- **[Normaal]** - Standaard happy-flow punt
- **[Stop/Sluit]** - Annuleren, sluiten, terug-navigatie
- **[Fout]** - Foutafhandeling, validatie
- **[Leeg/Geen]** - Lege invoer, geen resultaten
- **[Edge]** - Randgeval (zie EDGE_CASES_LIBRARY.md)

---

## Categorie 1: Authenticatie

### Scherm: Login (view-login)

| ID | Wat je ziet of doet | Label | Oké? |
|----|---------------------|-------|------|
| C1-01 | Het loginscherm toont het Q8 logo en "Drivers-app" met versie-badge | [Normaal] | |
| C1-02 | Er zijn twee taalknoppen zichtbaar: ENGLISH en NEDERLANDS | [Normaal] | |
| C1-03 | Klikken op ENGLISH zet de taal op Engels | [Normaal] | |
| C1-04 | Klikken op NEDERLANDS zet de taal op Nederlands | [Normaal] | |
| C1-05 | Het e-mailveld is vooringevuld met testwaarde of leeg | [Normaal] | |
| C1-06 | Het wachtwoordveld is vooringevuld of leeg | [Normaal] | |
| C1-07 | Er is een oog-icoon om wachtwoord te tonen/verbergen | [Normaal] | |
| C1-08 | Klikken op het oog-icoon toont het wachtwoord als tekst | [Normaal] | |
| C1-09 | Nogmaals klikken verbergt het wachtwoord weer | [Normaal] | |
| C1-10 | "Forgot password?" link is zichtbaar en klikbaar | [Normaal] | |
| C1-11 | "Remember me for 30 days" checkbox is zichtbaar | [Normaal] | |
| C1-12 | Klikken op de checkbox verandert de visuele staat | [Normaal] | |
| C1-13 | SIGN IN knop is zichtbaar en klikbaar | [Normaal] | |
| C1-14 | Inloggen met correcte gegevens navigeert naar kaartscherm | [Normaal] | |
| C1-15 | Inloggen met verkeerde gegevens toont foutmelding | [Fout] | |
| C1-16 | Inloggen met leeg e-mailveld toont validatiefout | [Leeg/Geen] | |
| C1-17 | Inloggen met leeg wachtwoordveld toont validatiefout | [Leeg/Geen] | |
| C1-18 | "Don't have an account? Create account." link navigeert naar registratie | [Normaal] | |
| C1-19 | Privacy Statement link is zichtbaar | [Normaal] | |
| C1-20 | Dubbel klikken op SIGN IN voert actie maar één keer uit | [Edge] EC-DOUBLE-01 | |

### Scherm: Wachtwoord vergeten (modal-forgot-password)

| ID | Wat je ziet of doet | Label | Oké? |
|----|---------------------|-------|------|
| C1-21 | Klikken op "Forgot password?" opent modal | [Normaal] | |
| C1-22 | Modal toont "Reset password" titel | [Normaal] | |
| C1-23 | Er is een e-mail invoerveld | [Normaal] | |
| C1-24 | CANCEL knop sluit de modal | [Stop/Sluit] | |
| C1-25 | SEND RESET LINK knop verstuurt reset e-mail | [Normaal] | |
| C1-26 | Na verzenden toont feedback (succes of fout) | [Normaal] | |
| C1-27 | Leeg e-mailveld toont validatiefout | [Leeg/Geen] | |
| C1-28 | Ongeldig e-mailformaat toont foutmelding | [Fout] | |
| C1-29 | Klikken buiten modal sluit deze | [Stop/Sluit] EC-CLOSE-02 | |

### Scherm: Registreren (view-register)

| ID | Wat je ziet of doet | Label | Oké? |
|----|---------------------|-------|------|
| C1-30 | Registratiescherm toont Q8 logo | [Normaal] | |
| C1-31 | Terug-knop linksboven navigeert naar login | [Stop/Sluit] | |
| C1-32 | "Create account" titel is zichtbaar | [Normaal] | |
| C1-33 | Velden: First name, Last name zijn zichtbaar | [Normaal] | |
| C1-34 | Veld: Email address is zichtbaar | [Normaal] | |
| C1-35 | Veld: Mobile number met +31 prefix is zichtbaar | [Normaal] | |
| C1-36 | Veld: Number of Liberty card is zichtbaar | [Normaal] | |
| C1-37 | Veld: Password met oog-icoon is zichtbaar | [Normaal] | |
| C1-38 | Veld: Confirm password met oog-icoon is zichtbaar | [Normaal] | |
| C1-39 | REGISTER knop is zichtbaar | [Normaal] | |
| C1-40 | Registreren met geldige gegevens maakt account aan | [Normaal] | |
| C1-41 | Registreren met niet-matchende wachtwoorden toont fout | [Fout] | |
| C1-42 | Registreren met leeg e-mailveld toont fout | [Leeg/Geen] | |
| C1-43 | Registreren met ongeldig e-mailformaat toont fout | [Fout] | |
| C1-44 | Registreren met te kort wachtwoord toont fout | [Fout] | |
| C1-45 | Oog-icoon bij Password toont/verbergt wachtwoord | [Normaal] | |
| C1-46 | Oog-icoon bij Confirm password toont/verbergt wachtwoord | [Normaal] | |

### Scherm: Uitloggen (side-menu)

| ID | Wat je ziet of doet | Label | Oké? |
|----|---------------------|-------|------|
| C1-47 | SIGN OUT knop is zichtbaar in side-menu onderaan | [Normaal] | |
| C1-48 | Klikken op SIGN OUT logt uit en toont loginscherm | [Normaal] | |
| C1-49 | Na uitloggen zijn sessiegegevens gewist | [Normaal] | |
| C1-50 | Na uitloggen en refresh blijf je op loginscherm | [Edge] EC-PERSIST-01 | |

---

## Categorie 2: Kaart en parkeerzones

### Scherm: Kaart (view-map)

| ID | Wat je ziet of doet | Label | Oké? |
|----|---------------------|-------|------|
| C2-01 | Na inloggen is het kaartscherm zichtbaar | [Normaal] | |
| C2-02 | De header toont Q8 logo, "Parking" titel en hamburger-menu | [Normaal] | |
| C2-03 | De Google Maps kaart laadt en is zichtbaar | [Normaal] | |
| C2-04 | Er zijn zone-markers zichtbaar op de kaart | [Normaal] | |
| C2-05 | Zone-markers tonen prijsinformatie | [Normaal] | |
| C2-06 | Klikken op een marker opent de zone-sheet | [Normaal] | |
| C2-07 | Zoekbalk is zichtbaar bovenop de kaart | [Normaal] | |
| C2-08 | Placeholder tekst in zoekbalk is "Zone or street name" | [Normaal] | |
| C2-09 | Typen in zoekbalk filtert resultaten | [Normaal] | |
| C2-10 | Zoeken op zone-ID toont matching zones | [Normaal] | |
| C2-11 | Zoeken op zone-naam toont matching zones | [Normaal] | |
| C2-12 | Zoeken op adres triggert geocoding | [Normaal] | |
| C2-13 | Klikken op zoekresultaat opent zone-sheet | [Normaal] | |
| C2-14 | Zoeken zonder resultaten toont "Geen resultaten" | [Leeg/Geen] | |
| C2-15 | "Mijn locatie" knop (FAB) is zichtbaar rechtsonder | [Normaal] | |
| C2-16 | Klikken op "Mijn locatie" vraagt om locatie-permissie | [Normaal] | |
| C2-17 | Na permissie centreert kaart op gebruikerslocatie | [Normaal] | |
| C2-18 | Als er een zone binnen 100m is, wordt deze voorgeselecteerd | [Normaal] | |
| C2-19 | Bij weigeren permissie: geen crash, normale werking | [Fout] | |
| C2-20 | Favorieten-strip is zichtbaar als er favorieten zijn | [Normaal] | |
| C2-21 | Hamburger-menu knop opent het side-menu | [Normaal] | |

### Scherm: Zones laden

| ID | Wat je ziet of doet | Label | Oké? |
|----|---------------------|-------|------|
| C2-22 | Tijdens laden van zones is een spinner zichtbaar | [Normaal] | |
| C2-23 | Na succesvol laden verdwijnt de spinner | [Normaal] | |
| C2-24 | Bij fout laden toont foutmelding met "Retry" knop | [Fout] | |
| C2-25 | Klikken op Retry probeert zones opnieuw te laden | [Normaal] | |
| C2-26 | Bij timeout (15s) toont foutmelding | [Fout] EC-NETWORK-02 | |
| C2-27 | Als zones leeg zijn, is dit zichtbaar (geen markers) | [Leeg/Geen] | |

### Scherm: No plates hint

| ID | Wat je ziet of doet | Label | Oké? |
|----|---------------------|-------|------|
| C2-28 | Als gebruiker geen kentekens heeft, is hint zichtbaar | [Normaal] | |
| C2-29 | Hint tekst is "Voeg een kenteken toe om te kunnen parkeren" | [Normaal] | |
| C2-30 | "Kenteken toevoegen" knop opent modal-add-plate | [Normaal] | |
| C2-31 | Na toevoegen kenteken verdwijnt de hint | [Normaal] | |

### Scherm: Zone-sheet (sheet-zone)

| ID | Wat je ziet of doet | Label | Oké? |
|----|---------------------|-------|------|
| C2-32 | Zone-sheet schuift omhoog vanaf onderkant | [Normaal] | |
| C2-33 | Zone-ID is zichtbaar (bijv. "321") | [Normaal] | |
| C2-34 | Kentekenbadge toont huidig geselecteerd kenteken | [Normaal] | |
| C2-35 | Klikken op kentekenbadge opent kentekenselector | [Normaal] | |
| C2-36 | Favoriet hart-icoon is zichtbaar | [Normaal] | |
| C2-37 | Klikken op hart-icoon voegt zone toe aan favorieten | [Normaal] | |
| C2-38 | Nogmaals klikken verwijdert uit favorieten | [Normaal] | |
| C2-39 | X-knop rechtsboven sluit de sheet | [Stop/Sluit] | |
| C2-40 | Klikken op backdrop sluit de sheet | [Stop/Sluit] EC-CLOSE-02 | |
| C2-41 | Tarieven sectie toont "Rates" label | [Normaal] | |
| C2-42 | Tarieven worden dynamisch geladen en getoond | [Normaal] | |
| C2-43 | "Parking duration" sectie is zichtbaar | [Normaal] | |
| C2-44 | Duur toont huidige waarde (bijv. "2h 00m") | [Normaal] | |
| C2-45 | Min (-) knop verlaagt duur met 15 minuten | [Normaal] | |
| C2-46 | Plus (+) knop verhoogt duur met 15 minuten | [Normaal] | |
| C2-47 | Duur kan niet onder 0 of minimum komen | [Fout] | |
| C2-48 | Duur respecteert maximum duur van zone | [Fout] | |
| C2-49 | Standaard duur pills zijn zichtbaar (Until stopped, 1u, 2u, 3u) | [Normaal] | |
| C2-50 | Klikken op "Until stopped" zet duur op onbepaald | [Normaal] | |
| C2-51 | Klikken op "1u" zet duur op 1 uur | [Normaal] | |
| C2-52 | START PARKING knop is zichtbaar onderaan | [Normaal] | |
| C2-53 | Klikken op START PARKING opent bevestigingsmodal | [Normaal] | |

---

## Categorie 3: Parkeersessies

### Scherm: Bevestiging start (modal-confirm-start)

| ID | Wat je ziet of doet | Label | Oké? |
|----|---------------------|-------|------|
| C3-01 | Modal toont "Confirm parking session" titel | [Normaal] | |
| C3-02 | Zone wordt getoond (bijv. "268_CANISI") | [Normaal] | |
| C3-03 | Kenteken wordt getoond (bijv. "1-ABC-123") | [Normaal] | |
| C3-04 | Klikken op kenteken-rij opent kentekenselector | [Normaal] | |
| C3-05 | Na selectie nieuw kenteken wordt dit getoond | [Normaal] | |
| C3-06 | CANCEL knop sluit modal | [Stop/Sluit] | |
| C3-07 | YES, START knop start de parkeersessie | [Normaal] | |
| C3-08 | Na start is actieve parkeerkaart zichtbaar | [Normaal] | |
| C3-09 | Klikken buiten modal sluit deze | [Stop/Sluit] EC-CLOSE-02 | |
| C3-10 | Dubbel klikken op YES, START start maar één sessie | [Edge] EC-DOUBLE-01 | |

### Scherm: Daypass bevestiging (modal-confirm-daypass)

| ID | Wat je ziet of doet | Label | Oké? |
|----|---------------------|-------|------|
| C3-11 | Bij daypass-zone verschijnt eerst deze modal | [Normaal] | |
| C3-12 | Modal toont "Zone with day pass" titel | [Normaal] | |
| C3-13 | Uitleg over dagkaart is zichtbaar | [Normaal] | |
| C3-14 | CANCEL sluit modal | [Stop/Sluit] | |
| C3-15 | YES, START gaat door naar confirm-start modal | [Normaal] | |

### Scherm: Actieve parkeerkaart (ui-active-parking)

| ID | Wat je ziet of doet | Label | Oké? |
|----|---------------------|-------|------|
| C3-16 | "Active parking" kaart is zichtbaar op kaartscherm | [Normaal] | |
| C3-17 | Zone-ID wordt getoond | [Normaal] | |
| C3-18 | Kenteken wordt getoond | [Normaal] | |
| C3-19 | Timer toont resterende of verstreken tijd | [Normaal] | |
| C3-20 | Timer label toont "Time left" of "Elapsed" | [Normaal] | |
| C3-21 | Start-tijd wordt getoond | [Normaal] | |
| C3-22 | Eind-tijd wordt getoond (of "Until stopped") | [Normaal] | |
| C3-23 | Min (-30) knop verlaagt eindtijd met 30 min | [Normaal] | |
| C3-24 | Plus (+30) knop verhoogt eindtijd met 30 min | [Normaal] | |
| C3-25 | Eindtijd respecteert max duur van zone | [Fout] | |
| C3-26 | END PARKING knop is zichtbaar (rood) | [Normaal] | |
| C3-27 | Klikken op END PARKING opent bevestigingsmodal | [Normaal] | |
| C3-28 | Timer telt correct af of op | [Normaal] | |
| C3-29 | Na page refresh is actieve sessie nog zichtbaar | [Edge] EC-PERSIST-01 | |

### Scherm: Bevestiging einde (modal-confirm)

| ID | Wat je ziet of doet | Label | Oké? |
|----|---------------------|-------|------|
| C3-30 | Modal toont "End Parking?" titel | [Normaal] | |
| C3-31 | Uitleg vraagt bevestiging om te stoppen | [Normaal] | |
| C3-32 | CANCEL knop sluit modal | [Stop/Sluit] | |
| C3-33 | END PARKING knop beëindigt de sessie | [Normaal] | |
| C3-34 | Na beëindigen verdwijnt actieve parkeerkaart | [Normaal] | |
| C3-35 | Toast melding bevestigt einde sessie | [Normaal] | |
| C3-36 | Sessie wordt naar Firestore geschreven | [Normaal] | |
| C3-37 | Klikken buiten modal sluit deze | [Stop/Sluit] EC-CLOSE-02 | |

### Edge cases parkeersessies

| ID | Wat je ziet of doet | Label | Oké? |
|----|---------------------|-------|------|
| C3-38 | Starten zonder kenteken toont foutmelding | [Fout] EC-SESSION-01 | |
| C3-39 | Starten zonder zone geselecteerd toont fout | [Fout] EC-SESSION-02 | |
| C3-40 | Starten met actieve sessie toont waarschuwing | [Fout] EC-SESSION-03 | |
| C3-41 | Timer op 0 beëindigt sessie automatisch | [Edge] EC-SESSION-04 | |
| C3-42 | Netwerkfout bij starten toont foutmelding | [Fout] EC-NETWORK-01 | |

---

## Categorie 4: Kentekens

### Scherm: Kentekens lijst (view-plates)

| ID | Wat je ziet of doet | Label | Oké? |
|----|---------------------|-------|------|
| C4-01 | "License plates" scherm is bereikbaar via menu | [Normaal] | |
| C4-02 | Header toont Q8 logo, "License plates" titel en menu | [Normaal] | |
| C4-03 | Lijst van kentekens wordt getoond | [Normaal] | |
| C4-04 | Elk kenteken toont de kentekenplaat | [Normaal] | |
| C4-05 | Beschrijving wordt getoond indien aanwezig | [Normaal] | |
| C4-06 | Standaard kenteken is gemarkeerd | [Normaal] | |
| C4-07 | Selecteren van kenteken activeert selectie | [Normaal] | |
| C4-08 | "Add new license plate" knop is zichtbaar | [Normaal] | |
| C4-09 | Klikken op "Add new..." opent modal-add-plate | [Normaal] | |
| C4-10 | Bewerken-knop bij kenteken opent modal-edit-plate | [Normaal] | |
| C4-11 | Verwijderen-knop bij kenteken opent bevestiging | [Normaal] | |
| C4-12 | "MAKE SELECTED PLATE DEFAULT" knop is zichtbaar | [Normaal] | |
| C4-13 | Knop is disabled als geen selectie of al default | [Normaal] | |
| C4-14 | Na klik wordt geselecteerd kenteken standaard | [Normaal] | |
| C4-15 | Lege lijst toont uitleg om kenteken toe te voegen | [Leeg/Geen] | |

### Scherm: Kenteken toevoegen (modal-add-plate)

| ID | Wat je ziet of doet | Label | Oké? |
|----|---------------------|-------|------|
| C4-16 | Modal toont "Add license plate" titel | [Normaal] | |
| C4-17 | "License plate" invoerveld is zichtbaar | [Normaal] | |
| C4-18 | Format hint toont "E.g. AB-123-C (Dutch format)" | [Normaal] | |
| C4-19 | "Description" invoerveld is zichtbaar | [Normaal] | |
| C4-20 | CANCEL knop sluit modal | [Stop/Sluit] | |
| C4-21 | ADD knop voegt kenteken toe | [Normaal] | |
| C4-22 | Na toevoegen sluit modal en kenteken in lijst | [Normaal] | |
| C4-23 | Eerste kenteken wordt automatisch standaard | [Normaal] | |
| C4-24 | Leeg kentekenveld toont validatiefout | [Leeg/Geen] | |
| C4-25 | Ongeldig kentekenformaat toont foutmelding | [Fout] EC-PLATE-01 | |
| C4-26 | RDW-lookup toont voertuiginfo indien gevonden | [Normaal] | |
| C4-27 | Duplicate kenteken toevoegen toont fout | [Fout] EC-PLATE-02 | |
| C4-28 | Klikken buiten modal sluit deze | [Stop/Sluit] EC-CLOSE-02 | |

### Scherm: Kenteken bewerken (modal-edit-plate)

| ID | Wat je ziet of doet | Label | Oké? |
|----|---------------------|-------|------|
| C4-29 | Modal toont "Edit license plate" titel | [Normaal] | |
| C4-30 | Huidige kenteken is vooringevuld | [Normaal] | |
| C4-31 | Huidige beschrijving is vooringevuld | [Normaal] | |
| C4-32 | CANCEL sluit modal zonder opslaan | [Stop/Sluit] | |
| C4-33 | SAVE slaat wijzigingen op | [Normaal] | |
| C4-34 | Na opslaan is kenteken bijgewerkt in lijst | [Normaal] | |
| C4-35 | Klikken buiten modal sluit deze | [Stop/Sluit] EC-CLOSE-02 | |

### Scherm: Kenteken verwijderen (modal-confirm-delete-plate)

| ID | Wat je ziet of doet | Label | Oké? |
|----|---------------------|-------|------|
| C4-36 | Modal toont "Delete license plate?" titel | [Normaal] | |
| C4-37 | Waarschuwingstekst is zichtbaar | [Normaal] | |
| C4-38 | CANCEL sluit modal | [Stop/Sluit] | |
| C4-39 | DELETE verwijdert kenteken | [Normaal] | |
| C4-40 | Na verwijderen is kenteken weg uit lijst | [Normaal] | |
| C4-41 | Als default verwijderd, wordt volgende default | [Edge] EC-PLATE-04 | |
| C4-42 | Klikken buiten modal sluit deze | [Stop/Sluit] EC-CLOSE-02 | |

### Scherm: Quick plate selector (sheet-plate-selector)

| ID | Wat je ziet of doet | Label | Oké? |
|----|---------------------|-------|------|
| C4-43 | Sheet toont "Select vehicle" titel | [Normaal] | |
| C4-44 | Alle kentekens worden getoond | [Normaal] | |
| C4-45 | Klikken op kenteken selecteert dit | [Normaal] | |
| C4-46 | Sheet sluit na selectie | [Normaal] | |
| C4-47 | Geselecteerd kenteken is bijgewerkt in context | [Normaal] | |
| C4-48 | Klikken buiten sheet sluit deze | [Stop/Sluit] EC-CLOSE-02 | |

---

## Categorie 5: Parkeerhistorie

### Scherm: Historie lijst (view-history)

| ID | Wat je ziet of doet | Label | Oké? |
|----|---------------------|-------|------|
| C5-01 | "Parking history" scherm is bereikbaar via menu | [Normaal] | |
| C5-02 | Header toont Q8 logo, "Parking history" en menu | [Normaal] | |
| C5-03 | Quick filters zijn zichtbaar (All, Last 7 days, etc.) | [Normaal] | |
| C5-04 | Klikken op "All" toont alle historie | [Normaal] | |
| C5-05 | Klikken op "Last 7 days" filtert op 7 dagen | [Normaal] | |
| C5-06 | Klikken op "Last 30 days" filtert op 30 dagen | [Normaal] | |
| C5-07 | Klikken op "This month" filtert op huidige maand | [Normaal] | |
| C5-08 | Historierijsen tonen datum, tijd, zone, kenteken | [Normaal] | |
| C5-09 | Kosten worden getoond per item | [Normaal] | |
| C5-10 | Lege historie toont "Geen parkeerhistorie" | [Leeg/Geen] | |
| C5-11 | Filters knop opent sheet-filter | [Normaal] | |
| C5-12 | Export CSV knop is zichtbaar | [Normaal] | |
| C5-13 | Print / PDF knop is zichtbaar | [Normaal] | |
| C5-14 | Klikken op Export CSV download CSV-bestand | [Normaal] | |
| C5-15 | Klikken op Print opent print dialog | [Normaal] | |
| C5-16 | Historie scrollt als er veel items zijn | [Normaal] | |

### Scherm: Filters sheet (sheet-filter)

| ID | Wat je ziet of doet | Label | Oké? |
|----|---------------------|-------|------|
| C5-17 | Sheet toont "Filters" titel | [Normaal] | |
| C5-18 | "Clear all" link is zichtbaar | [Normaal] | |
| C5-19 | Vehicle filter toont kenteken-badges | [Normaal] | |
| C5-20 | Klikken op kenteken-badge selecteert/deselecteert | [Normaal] | |
| C5-21 | Date Range sectie met Start/End Date knoppen | [Normaal] | |
| C5-22 | APPLY knop past filters toe en sluit sheet | [Normaal] | |
| C5-23 | Na apply is gefilterde lijst zichtbaar | [Normaal] | |
| C5-24 | Klikken buiten sheet sluit deze | [Stop/Sluit] EC-CLOSE-02 | |

---

## Categorie 6: Favorieten

### Scherm: Favorieten lijst (view-favorites)

| ID | Wat je ziet of doet | Label | Oké? |
|----|---------------------|-------|------|
| C6-01 | "Favorites" scherm is bereikbaar via menu | [Normaal] | |
| C6-02 | Header toont Q8 logo, "Favorites" en menu | [Normaal] | |
| C6-03 | Intro tekst "Your favorite parking zones..." | [Normaal] | |
| C6-04 | Lijst van favoriete zones wordt getoond | [Normaal] | |
| C6-05 | Klikken op favoriet opent zone-sheet | [Normaal] | |
| C6-06 | Verwijder-actie verwijdert favoriet | [Normaal] | |
| C6-07 | Custom naam kan worden bewerkt | [Normaal] | |
| C6-08 | Lege favorieten toont uitleg | [Leeg/Geen] | |

### Favoriet toevoegen/verwijderen (zone-sheet)

| ID | Wat je ziet of doet | Label | Oké? |
|----|---------------------|-------|------|
| C6-09 | Hart-icoon in zone-sheet is leeg als niet favoriet | [Normaal] | |
| C6-10 | Klikken op hart voegt toe en maakt hart vol | [Normaal] | |
| C6-11 | Klikken op vol hart verwijdert uit favorieten | [Normaal] | |
| C6-12 | Favoriet blijft behouden na page refresh | [Edge] EC-PERSIST-01 | |

### Favorieten strip (map)

| ID | Wat je ziet of doet | Label | Oké? |
|----|---------------------|-------|------|
| C6-13 | Strip is zichtbaar als er favorieten zijn | [Normaal] | |
| C6-14 | Strip is verborgen als er geen favorieten zijn | [Leeg/Geen] | |
| C6-15 | Klikken op favoriet in strip opent zone-sheet | [Normaal] | |
| C6-16 | "Laatst" badge toont laatst gebruikte zone | [Normaal] | |

---

## Categorie 7: Notificaties

### Scherm: Notificatie-instellingen (view-notifications)

| ID | Wat je ziet of doet | Label | Oké? |
|----|---------------------|-------|------|
| C7-01 | "Notifications" scherm is bereikbaar via menu | [Normaal] | |
| C7-02 | Header toont Q8 logo, "Notifications" en menu | [Normaal] | |
| C7-03 | Settings sectie is zichtbaar | [Normaal] | |
| C7-04 | Toggle voor "Session started" notificatie | [Normaal] | |
| C7-05 | Toggle voor "Session expiring" notificatie | [Normaal] | |
| C7-06 | Toggle voor "Session ended" notificatie | [Normaal] | |
| C7-07 | Interval dropdown voor expiring notificatie | [Normaal] | |
| C7-08 | Wijzigingen worden opgeslagen naar Firestore | [Normaal] | |

### Scherm: Notificatiehistorie (view-notifications)

| ID | Wat je ziet of doet | Label | Oké? |
|----|---------------------|-------|------|
| C7-09 | History sectie is zichtbaar | [Normaal] | |
| C7-10 | Recente notificaties worden getoond | [Normaal] | |
| C7-11 | Elke notificatie toont type, message, detail, tijd | [Normaal] | |
| C7-12 | Lege historie toont "Geen notificaties" | [Leeg/Geen] | |

### Push notificaties

| ID | Wat je ziet of doet | Label | Oké? |
|----|---------------------|-------|------|
| C7-13 | Push permissie wordt gevraagd (optioneel) | [Normaal] | |
| C7-14 | Bij toestemming wordt FCM token opgeslagen | [Normaal] | |
| C7-15 | Bij weigering blijft app functioneren | [Fout] | |

---

## Categorie 8: UI en navigatie

### Side-menu (side-menu)

| ID | Wat je ziet of doet | Label | Oké? |
|----|---------------------|-------|------|
| C8-01 | Hamburger-menu opent side-menu van rechts | [Normaal] | |
| C8-02 | Menu items: Parking, Parking history, License plates | [Normaal] | |
| C8-03 | Menu items: Notifications, Favorites, Car specs | [Normaal] | |
| C8-04 | Klikken op menu-item navigeert naar dat scherm | [Normaal] | |
| C8-05 | Menu sluit na navigatie | [Normaal] | |
| C8-06 | Appearance switcher (Light/System/Dark) is zichtbaar | [Normaal] | |
| C8-07 | Klikken op Light zet thema op licht | [Normaal] | |
| C8-08 | Klikken op System volgt systeeminstelling | [Normaal] | |
| C8-09 | Klikken op Dark zet thema op donker | [Normaal] | |
| C8-10 | Taal-knoppen (ENGLISH, NEDERLANDS) zijn zichtbaar | [Normaal] | |
| C8-11 | Klikken op taal-knop wisselt interface-taal | [Normaal] | |
| C8-12 | SIGN OUT knop onderaan is zichtbaar | [Normaal] | |
| C8-13 | Klikken op backdrop sluit menu | [Stop/Sluit] EC-CLOSE-02 | |

### Toast meldingen

| ID | Wat je ziet of doet | Label | Oké? |
|----|---------------------|-------|------|
| C8-14 | Toast verschijnt bij succes-acties | [Normaal] | |
| C8-15 | Toast verschijnt bij fout-acties | [Fout] | |
| C8-16 | Toast heeft sluit-knop (×) | [Normaal] | |
| C8-17 | Toast verdwijnt na timeout | [Normaal] | |
| C8-18 | Toast toont progress bar | [Normaal] | |

### Onboarding

| ID | Wat je ziet of doet | Label | Oké? |
|----|---------------------|-------|------|
| C8-19 | Onboarding overlay verschijnt bij eerste bezoek | [Normaal] | |
| C8-20 | Onboarding toont "Welkom" en uitleg | [Normaal] | |
| C8-21 | "Begrepen" knop sluit onboarding | [Stop/Sluit] | |
| C8-22 | Na dismiss verschijnt onboarding niet meer | [Normaal] | |

### Locatie-uitleg modal

| ID | Wat je ziet of doet | Label | Oké? |
|----|---------------------|-------|------|
| C8-23 | Modal verschijnt vóór eerste locatie-vraag | [Normaal] | |
| C8-24 | Uitleg over locatiegebruik is zichtbaar | [Normaal] | |
| C8-25 | "Toestaan" knop triggert browser permissie | [Normaal] | |

---

## Categorie 9: Data en persistentie

| ID | Wat je ziet of doet | Label | Oké? |
|----|---------------------|-------|------|
| C9-01 | State wijzigingen via State.update | [Normaal] | |
| C9-02 | Sessie wordt opgeslagen in localStorage | [Normaal] | |
| C9-03 | Sessie wordt gesynchroniseerd naar Firestore | [Normaal] | |
| C9-04 | Na refresh wordt sessie hersteld | [Edge] EC-PERSIST-01 | |
| C9-05 | Kentekens worden gesync naar Firestore userPlates | [Normaal] | |
| C9-06 | Transacties worden geschreven bij sessie-einde | [Normaal] | |

---

## Categorie 10: PWA

| ID | Wat je ziet of doet | Label | Oké? |
|----|---------------------|-------|------|
| C10-01 | Service Worker wordt geregistreerd | [Normaal] | |
| C10-02 | Manifest wordt correct geladen | [Normaal] | |
| C10-03 | App kan worden geïnstalleerd (Add to Home Screen) | [Normaal] | |
| C10-04 | Geïnstalleerde app opent standalone | [Normaal] | |
| C10-05 | Basisweergave werkt offline | [Edge] EC-OFFLINE-01 | |
| C10-06 | offline.html wordt getoond bij volledige offline | [Normaal] | |
| C10-07 | Icons worden correct weergegeven | [Normaal] | |
| C10-08 | Theme color is Q8 blauw (#003D6B) | [Normaal] | |

---

## Categorie 11: E2E-bewezen flows

| ID | Wat je ziet of doet | Label | Oké? |
|----|---------------------|-------|------|
| C11-01 | e2e-proof.mjs: login → map → zone → sheet → close | [Normaal] | |
| C11-02 | e2e-proof.mjs: duration plus wijzigt waarde | [Normaal] | |
| C11-03 | e2e-proof.mjs: menu open → logout → login screen | [Normaal] | |
| C11-04 | e2e-session.mjs: complete parking session flow | [Normaal] | |
| C11-05 | e2e-session.mjs: confirm modal toont zone en plate | [Normaal] | |
| C11-06 | e2e-session.mjs: +30 wijzigt eindtijd | [Normaal] | |
| C11-07 | e2e-session.mjs: end session werkt correct | [Normaal] | |

---

## Categorie 12: Rollen

| ID | Wat je ziet of doet | Label | Oké? |
|----|---------------------|-------|------|
| C12-01 | Chauffeur kan inloggen | [Normaal] | |
| C12-02 | Chauffeur heeft toegang tot alle PWA functies | [Normaal] | |
| C12-03 | DriverSettings (allowedDays, times) worden gerespecteerd | [Normaal] | |

---

## Categorie 13: Overige / randgevallen

### Car specs (view-car-specs)

| ID | Wat je ziet of doet | Label | Oké? |
|----|---------------------|-------|------|
| C13-01 | "Car specs" scherm is bereikbaar via menu | [Normaal] | |
| C13-02 | Header toont Q8 logo, "Car specs" en menu | [Normaal] | |
| C13-03 | Intro tekst over RDW specs is zichtbaar | [Normaal] | |
| C13-04 | Specs per kenteken worden getoond | [Normaal] | |
| C13-05 | Als geen kentekens: uitleg om toe te voegen | [Leeg/Geen] | |

### Automatisch einde sessie

| ID | Wat je ziet of doet | Label | Oké? |
|----|---------------------|-------|------|
| C13-06 | Sessie met vaste eindtijd eindigt automatisch | [Edge] EC-SESSION-04 | |
| C13-07 | Notificatie wordt verstuurd bij automatisch einde | [Normaal] | |

### Faciliteiten (P+R/garages)

| ID | Wat je ziet of doet | Label | Oké? |
|----|---------------------|-------|------|
| C13-08 | Faciliteiten laden is beschikbaar (deels) | [Normaal] | |
| C13-09 | Nabije faciliteiten kunnen worden getoond | [Normaal] | |

---

## Samenvatting

| Categorie | Aantal punten |
|-----------|---------------|
| C1: Authenticatie | 50 |
| C2: Kaart en parkeerzones | 53 |
| C3: Parkeersessies | 42 |
| C4: Kentekens | 48 |
| C5: Parkeerhistorie | 24 |
| C6: Favorieten | 16 |
| C7: Notificaties | 15 |
| C8: UI en navigatie | 25 |
| C9: Data en persistentie | 6 |
| C10: PWA | 8 |
| C11: E2E-bewezen flows | 7 |
| C12: Rollen | 3 |
| C13: Overige | 9 |
| **Totaal** | **306** |

---

*Laatste update: 2026-02-05*
*Getest op beeldnummer: 20260205170644-86cc1*
