# Uitgebreid Rapport: User Stories, Functionaliteiten & Code-analyse

## Q8 Parking B2B PWA

**Versie:** 1.1  
**Datum:** 2 februari 2026  
**Doel:** Complete overzicht voor programmeurs die nog niet aan deze website hebben gewerkt

---

## 1. Management Samenvatting

Dit rapport geeft een gedetailleerde analyse van de Q8 Parking B2B webapplicatie. De app is een **Progressive Web App (PWA)** voor zakelijke chauffeurs met een Q8 Liberty-kaart. Kernfunctionaliteit: parkeerzones vinden, parkeersessies starten en stoppen, kentekens beheren en parkeerhistorie bekijken. Er is ook een **Fleet Manager Portal** voor beheerders.

Het rapport volgt de **INVEST-principes** en het standaard User Story-formaat: _"As a [user type], I want [action], so that [benefit]."_ Daarnaast zijn **Given-When-Then** acceptatiecriteria toegevoegd waar relevant.

---

## 2. Technische Architectuur â€“ Overzicht voor Nieuwe Ontwikkelaars

### 2.1 Tech Stack

| Component            | Technologie                                   |
| -------------------- | --------------------------------------------- |
| **Frontend**         | Vanilla JavaScript (ES6+), HTML5, CSS3        |
| **Hosting**          | Firebase Hosting                              |
| **Backend Services** | Firebase Auth, Firestore                      |
| **Kaarten**          | Google Maps JavaScript API                    |
| **Data Pipeline**    | Python-scripts (RDW Open Data, AI-enrichment) |

### 2.2 Bestandsstructuur â€“ Waar wat zit

```
/public                    â†’ Gebouwde/bronbestanden voor productie
  index.html               â†’ Hoofd-SPA, alle views
  app.js                   â†’ Entry point, event routing
  services.js              â†’ Business logic (Auth, Parking, Plates, Zones)
  state.js                 â†’ Global state management
  ui.js                    â†’ DOM-rendering (kaart, overlays, lijsten)
  utils.js                 â†’ Hulpfunties (calculateCost, debug)
  kenteken.js              â†’ Kentekenvalidatie + RDW lookup
  design-system.css        â†’ Styling
  portal/                  â†’ Fleet Manager Admin Portal
    index.html, portal.js, portal.css

/scripts                    â†’ Python data-pipeline (RDW fetch, Firestore upload)
/docs                       â†’ Documentatie
/data                       â†’ Zone-data (JSON)
```

### 2.3 Dataflow (Vereenvoudigd)

```
Firestore (zones)  â†’  loadZones()  â†’  state.zones  â†’  UI (kaart, zoeken)
                                                            â†“
User klikt zone  â†’  tryOpenOverlay('sheet-zone')  â†’  state.selectedZone
                                                            â†“
User START PARKING  â†’  handleStartParking()  â†’  state.session  â†’  localStorage
                                                            â†“
User END PARKING  â†’  handleEndParking()  â†’  session = null
```

### 2.4 Namespace-structuur

Alle client-side logica zit onder `Q8`:

- `Q8.App` â€“ init, event listeners
- `Q8.Services` â€“ Firebase, auth, parking, plates
- `Q8.State` â€“ shared state, persistence
- `Q8.UI` â€“ rendering
- `Q8.Utils` â€“ helpers
- `Q8.Kenteken` â€“ kentekenvalidatie & RDW

---

## 3. Basisfunctionaliteiten â€“ Uitgebreid Overzicht

### 3.1 Authenticatie

| Functie                      | Status        | Implementatie                      |
| ---------------------------- | ------------- | ---------------------------------- |
| Inloggen (e-mail/wachtwoord) | âœ…           | `services.js` â†’ `loginUser()`    |
| Registreren                  | âœ…           | `services.js` â†’ `registerUser()` |
| Uitloggen                    | âœ…           | `services.js` â†’ `logoutUser()`   |
| Wachtwoord verbergen/tonen   | âœ…           | `data-action="toggle-password"`    |
| Remember me (30 dagen)       | UI aanwezig   | Niet geÃ¯mplementeerd in backend   |
| Wachtwoord vergeten          | Link aanwezig | Niet geÃ¯mplementeerd              |

### 3.2 Parkeerzones & Kaart

| Functie                                      | Status | Implementatie                                       |
| -------------------------------------------- | ------ | --------------------------------------------------- |
| Zones laden van Firestore                    | âœ…    | `services.js` â†’ `loadZones()`                     |
| Kaart met markers                            | âœ…    | `ui.js` â†’ `initGoogleMap()`, `renderMapMarkers()` |
| Zone-filter (alleen straatparkeren)          | âœ…    | `isStreetParkingZone()` â€“ garage/P+R uitgesloten  |
| Tarief-disclaimer (RDW indicatief)           | âœ…    | Zoekresultaten, favorieten                          |
| Zone-lijst verbergen bij selectie/sessie     | âœ…    | `zoneSelectedOrActive` â€“ zoek/fav-list hidden     |
| Zoeken op zone-ID of naam                    | âœ…    | `inp-search` â†’ `renderSearchResults()`            |
| Zoeken op adres (geocoding)                  | âœ…    | `geocodeAndSearch()`, Google Geocoding API          |
| Intelligente zoekmodus                       | âœ…    | `detectSearchMode()` â€“ zone vs. adres automatisch |
| Zone-sheet (tarieven, duur, kenteken)        | âœ…    | `renderZoneSheet()`                                 |
| Favoriete zones                              | âœ…    | `state.favorites`, `saveFavorites`/`loadFavorites`  |
| Favorieten: custom naam geven                | âœ…    | `edit-favorite-name`, `f.name` in state             |
| Favorieten: volgorde wijzigen (slepen)       | âœ…    | HTML5 drag-and-drop in `renderFavorites()`          |
| Favorieten: verwijderen                      | âœ…    | `remove-favorite` via hart-icoon                    |
| Locatie: kaart centreren + zone voorselectie | âœ…    | Geolocation API, Haversine-afstand                  |

### 3.3 Parkeersessies

| Functie                                   | Status | Implementatie                                                   |
| ----------------------------------------- | ------ | --------------------------------------------------------------- |
| Sessie starten                            | âœ…    | `handleStartParking()`                                          |
| Bevestigingsmodal voor start              | âœ…    | `modal-confirm-start`, zone + kenteken verifiÃ«ren (bewerkbaar) |
| Sessie beÃ«indigen                        | âœ…    | `handleEndParking()`                                            |
| Sessie naar Firestore                     | âœ…    | `sessions` + `transactions` collecties                          |
| Duur instellen (tot stoppen / vaste tijd) | âœ…    | `modifyDuration()`, `modifyActiveSessionEnd()`                  |
| Actieve sessie-kaart met timer            | âœ…    | `renderParkingView()`                                           |
| Timer count-down / count-up               | âœ…    | `startTimerTicker()`, `updateActiveTimerDisplay()`              |
| Sessie persistent na refresh              | âœ…    | `localStorage` `q8_parking_session`                             |
| Kenteken vastleggen in sessie             | âœ…    | `session.plate` wordt opgeslagen                                |

### 3.4 Kentekens

| Functie                         | Status | Implementatie                               |
| ------------------------------- | ------ | ------------------------------------------- |
| Kenteken toevoegen              | âœ…    | `saveNewPlate()`                            |
| Kenteken verwijderen            | âœ…    | `deletePlate()`                             |
| Kenteken bewerken               | âœ…    | `updatePlate()`                             |
| Default kenteken instellen      | âœ…    | `setDefaultPlate()`                         |
| Kenteken kiezen voor sessie     | âœ…    | `sheet-plate-selector`                      |
| Nederlands kentekenformaat      | âœ…    | `kenteken.js` sidecodes 1â€“11 (incl. V, W) |
| RDW-controle (gratis Open Data) | âœ…    | `checkPlateRDW()`, `Kenteken.lookupRDW()`   |
| RDW automatisch + normalisatie  | âœ…    | Auto-trigger bij invoer, format voor RDW    |
| RDW resultaat in Description    | âœ…    | Merk/type vult Description-veld             |
| Auto-specs (RDW) tonen          | âœ…    | View "Car specs"                            |

### 3.5 Parkeerhistorie

| Functie            | Status | Implementatie                                |
| ------------------ | ------ | -------------------------------------------- |
| Historie-scherm    | âœ…    | View `history`                               |
| Filter op voertuig | âœ…    | Filter werkt op `state.history`              |
| Filter op datum    | âœ…    | Filter werkt met date range                  |
| Historie data      | âœ…    | `loadHistory()` uit Firestore `transactions` |

### 3.6 Notificaties

| Functie                          | Status | Implementatie                         |
| -------------------------------- | ------ | ------------------------------------- |
| Notificatie-instellingen         | âœ…    | `notificationSettings` in state       |
| Notificatiehistorie              | âœ…    | `state.notifications`                 |
| Sessie gestart/gestopt melding   | âœ…    | `addNotification()`                   |
| Toast in header (3 sec, dismiss) | âœ…    | `showToast()`, `dismissToast()`       |
| Max parkeerduur meldingen        | âœ…    | 24u-globaal en zone-specifiek (toast) |
| Waarschuwing bij bijna verlopen  | âœ…    | `expiringSoonMinutes` â€“ instelbaar  |

### 3.7 Taal & PWA

| Functie                           | Status | Implementatie                                                         |
| --------------------------------- | ------ | --------------------------------------------------------------------- |
| Nederlands / Engels               | âœ…    | `state.language`                                                      |
| Dark mode (Light / System / Dark) | âœ…    | `state.darkMode`, `applyThemeFromPref()`                              |
| Install Gate (iOS + Android)      | âœ…    | `installMode`, `renderInstallGate()`, platform-specifieke instructies |
| PWA manifest, icons               | âœ…    | `manifest.webmanifest`                                                |
| Offline-detectie                  | âœ…    | `online`/`offline` events                                             |
| Service Worker                    | âœ…    | `sw.js` geregistreerd voor offline + FCM                              |

### 3.8 Fleet Manager Portal

| Functie                         | Status | Implementatie                   |
| ------------------------------- | ------ | ------------------------------- |
| Inloggen als fleetmanager       | âœ…    | `portal.js`                     |
| Dashboard (stats)               | âœ…    | `section-dashboard`             |
| Bestuurders beheren             | âœ…    | `section-users`, `inviteUser()` |
| Actieve sessies stoppen         | âœ…    | `stopSession()`                 |
| Tenant-instellingen (auto-stop) | âœ…    | `tenants` collectie             |
| Kentekenbeheer per bestuurder   | âœ…    | `adminPlates`, `driverSettings` |

---

## 4. User Stories â€“ Compleet Overzicht

Formaat: **As a [user type], I want [action], so that [benefit].**

### 4.1 Chauffeur / Bestuurder

#### US-D01 â€“ Zone zoeken

**As a** chauffeur  
**I want** te zoeken op zone-ID of straatnaam  
**So that** ik snel de juiste parkeerzone vind.

**Acceptatiecriteria:**

- _Given_ ik ben op het parkeerscherm
- _When_ ik typ in de zoekbalk
- _Then_ zie ik zoekresultaten die matchen op zone-ID en zone-naam
- _And_ ik kan op een resultaat klikken om de zone-sheet te openen

---

#### US-D02 â€“ Zone selecteren en sessie starten

**As a** chauffeur  
**I want** een zone te kiezen, duur in te stellen en parkeren te starten  
**So that** ik legaal kan parkeren.

**Acceptatiecriteria:**

- _Given_ ik heb een zone geselecteerd (via kaart of zoeken)
- _When_ ik duur instel (tot stoppen of vaste tijd) en een kenteken kies
- _And_ ik druk op "START PARKING"
- _Then_ verschijnt een bevestigingsmodal met zone en kenteken (bewerkbaar)
- _And_ na bevestiging start mijn parkeersessie
- _And_ ik zie de actieve sessie-kaart

---

#### US-D03 â€“ Parkeersessie beÃ«indigen

**As a** chauffeur  
**I want** mijn parkeersessie te stoppen  
**So that** ik niet onnodig betaal.

**Acceptatiecriteria:**

- _Given_ ik heb een actieve parkeersessie
- _When_ ik op "END PARKING" druk en bevestig
- _Then_ wordt de sessie beÃ«indigd
- _And_ de actieve sessie-kaart verdwijnt

---

#### US-D04 â€“ Kentekens beheren

**As a** chauffeur  
**I want** meerdere kentekens toe te voegen en een standaard in te stellen  
**So that** ik snel kan wisselen tussen autoâ€™s.

**Acceptatiecriteria:**

- _Given_ ik ben op het kentekenscherm
- _When_ ik een geldig Nederlands kenteken invoer en toevoeg
- _Then_ wordt het kenteken opgeslagen
- _And_ ik kan een kenteken als standaard instellen
- _And_ ik kan kentekens bewerken en verwijderen

---

#### US-D05 â€“ RDW-controle kenteken

**As a** chauffeur  
**I want** mijn kenteken te controleren bij het RDW  
**So that** ik zeker weet dat het klopt.

**Acceptatiecriteria:**

- _Given_ ik voer een kenteken in bij het toevoegen
- _When_ het kenteken wordt ingevuld (of ik op "Check at RDW" klik)
- _Then_ wordt automatisch gecontroleerd of het in het RDW-register staat
- _And_ merk/type vult het Description-veld

---

#### US-D06 â€“ Favoriete zones

**As a** chauffeur  
**I want** veelgebruikte zones als favoriet op te slaan  
**So that** ik ze snel kan starten.

**Acceptatiecriteria:**

- _Given_ ik heb een zone-sheet open
- _When_ ik op het favoriet-icoon klik
- _Then_ wordt de zone toegevoegd aan of verwijderd van favorieten
- _And_ ik kan favorieten direct starten vanaf het Favorieten-scherm
- _And_ ik kan favorieten een custom naam geven (bijv. Werk, Thuis, Supermarkt)
- _And_ ik kan de volgorde wijzigen via slepen

---

#### US-D07 â€“ Parkeerhistorie bekijken

**As a** chauffeur  
**I want** mijn parkeerhistorie te zien  
**So that** ik kosten kan controleren en declareren.

**Acceptatiecriteria:**

- _Given_ ik ben op het geschiedenis-scherm
- _When_ er parkeersessies zijn afgerond
- _Then_ zie ik een lijst met datum, zone, kenteken en kosten (uit Firestore `transactions`)
- _And_ ik kan filteren op voertuig en datum

---

#### US-D08 â€“ Notificaties instellen

**As a** chauffeur  
**I want** notificaties in of uit te zetten  
**So that** ik meldingen krijg wanneer ik dat wil.

**Acceptatiecriteria:**

- _Given_ ik ben op het notificaties-scherm
- _When_ ik een instelling aanpas
- _Then_ worden de wijzigingen opgeslagen
- _And_ notificaties komen aan volgens de instellingen

---

#### US-D09 â€“ Taal wijzigen

**As a** chauffeur  
**I want** de app in het Nederlands of Engels te gebruiken  
**So that** ik de interface begrijp.

**Acceptatiecriteria:**

- _Given_ ik ben ingelogd
- _When_ ik op EN of NL klik
- _Then_ verandert de taal van de UI

---

#### US-D10 â€“ Sessie verlengen tijdens parkeren

**As a** chauffeur  
**I want** de eindtijd van mijn actieve sessie aan te passen  
**So that** ik langer kan parkeren zonder opnieuw te starten.

**Acceptatiecriteria:**

- _Given_ ik heb een sessie met vaste eindtijd
- _When_ ik op + of âˆ’ klik bij de eindtijd
- _Then_ wordt de eindtijd met 30 minuten aangepast
- _And_ de maximale duur van de zone wordt niet overschreden

---

### 4.2 Fleet Manager

#### US-F01 â€“ Bestuurders uitnodigen

**As a** fleetmanager  
**I want** bestuurders uit te nodigen via e-mail  
**So that** ze toegang krijgen tot de parkeerapp.

**Acceptatiecriteria:**

- _Given_ ik ben ingelogd in het Fleet Portal
- _When_ ik een e-mailadres invul en de uitnodiging opsla
- _Then_ kan de bestuurder zich registreren
- _And_ verschijnt hij daarna in de gebruikerslijst

---

#### US-F02 â€“ Actieve sessies stoppen

**As a** fleetmanager  
**I want** actieve parkeersessies handmatig te stoppen  
**So that** ik controle heb bij vergeten sessies.

**Acceptatiecriteria:**

- _Given_ er zijn actieve sessies
- _When_ ik op "Stoppen" klik bij een sessie
- _Then_ wordt de sessie beÃ«indigd
- _And_ de bestuurder ziet de wijziging (real-time sync)

---

#### US-F03 â€“ Kentekenbeheer per bestuurder

**As a** fleetmanager  
**I want** kentekens toe te voegen en restricties in te stellen  
**So that** bestuurders alleen toegestane kentekens gebruiken.

**Acceptatiecriteria:**

- _Given_ ik selecteer een bestuurder
- _When_ ik kentekens toevoeg of restricties instel (canAddPlates, platesLocked, maxPlates)
- _Then_ worden deze in Firestore opgeslagen
- _And_ de bestuurder ziet de beperkingen in de app

---

#### US-F04 â€“ Auto-stop tijd instellen

**As a** fleetmanager  
**I want** een tijd in te stellen waarop alle sessies automatisch stoppen  
**So that** er geen nachtelijke sessies blijven lopen.

**Acceptatiecriteria:**

- _Given_ ik ben op de instellingen-pagina
- _When_ ik auto-stop aanzet en een tijd instel
- _Then_ worden alle actieve sessies op dat moment gestopt
- **Huidige status:** Cloud Function / cron nog niet geÃ¯mplementeerd

---

### 4.3 Systeem / Backend

#### US-S01 â€“ Zones real-time synchroniseren

**As a** systeem  
**I want** zones uit Firestore te synchroniseren  
**So that** de kaart altijd actuele data toont.

**Acceptatiecriteria:**

- _Given_ Firestore heeft een `zones`-collectie
- _When_ de app laadt of data wijzigt
- _Then_ worden zones geladen en op de kaart getoond
- _And_ wijzigingen worden real-time doorgevoerd

---

#### US-S02 â€“ Sessie persistent maken

**As a** systeem  
**I want** de actieve sessie in localStorage op te slaan  
**So that** de sessie behouden blijft bij refresh.

**Acceptatiecriteria:**

- _Given_ een actieve parkeersessie
- _When_ de pagina wordt ververst
- _Then_ wordt de sessie hersteld
- _And_ timer en zone blijven correct

---

## 5. Ontbrekende / Incomplete User Stories

### 5.1 Niet geÃ¯mplementeerd

| User Story                   | Beschrijving                                  | Impact                                    |
| ---------------------------- | --------------------------------------------- | ----------------------------------------- |
| **Wachtwoord vergeten**      | Link aanwezig, flow niet geÃ¯mplementeerd     | Gebruikers kunnen account niet herstellen |
| **Remember me**              | Checkbox aanwezig, geen echte 30-dagen-sessie | Weinig impact                             |
| **Auto-stop Cloud Function** | Auto-stop tijd opgeslagen, geen cron/function | Sessies stoppen niet automatisch          |

### 5.2 Gebruikersfeedback ontbreekt

| Scenario                | Huidig gedrag                   | Gewenst                                           |
| ----------------------- | ------------------------------- | ------------------------------------------------- |
| Geen zones geladen      | Timeout 15 sec, loading overlay | Duidelijke foutmelding + retry (timeout aanwezig) |
| Zoeken zonder resultaat | Lege lijst, geen bericht        | "Geen zones gevonden"                             |
| Kenteken verwijderen    | Geen bevestiging                | "Weet u het zeker?"-dialoog                       |

---

## 6. Suggesties voor Nieuwe Functionaliteiten (op basis van User Stories)

### 6.1 Prioriteit Hoog

| #   | Nieuwe User Story                        | Rationale                                                   |
| --- | ---------------------------------------- | ----------------------------------------------------------- |
| 1   | **Wachtwoord vergeten**                  | Standaard verwachting bij login                             |
| 2   | **Bevestiging bij kenteken verwijderen** | Voorkomt per ongeluk verwijderen                            |
| 3   | **Global active parking indicator**      | Lopende sessie zichtbaar door hele app + badge op PWA-icoon |

### 6.2 Prioriteit Middel

| #   | Nieuwe User Story                       | Rationale                                                            |
| --- | --------------------------------------- | -------------------------------------------------------------------- |
| 4   | **Export parkeerhistorie (CSV/PDF)**    | Declaratie en boekhouding (billing export in `functions/billing.js`) |
| 5   | **Push-notificatie bij bijna verlopen** | Voorkomt vergeten sessies (FCM + permissie flow aanwezig)            |
| 6   | **Gebruiksdagen beperken**              | Fleet Manager Plan â€“ allowedDays                                   |
| 7   | **Bulk kentekens voor poolauto's**      | Fleet Manager Plan                                                   |
| 10  | **Bulk kentekens voor poolautoâ€™s**    | Fleet Manager Plan                                                   |

### 6.3 Prioriteit Laag

| #   | Nieuwe User Story               | Rationale                     |
| --- | ------------------------------- | ----------------------------- |
| 8   | **Auditlog voor fleetmanagers** | Compliance en traceerbaarheid |

---

## 7. PotentiÃ«le Problemen & Open Einden

### 7.1 Technische risicoâ€™s

| Risico                               | Locatie                          | Omschrijving                                                                            |
| ------------------------------------ | -------------------------------- | --------------------------------------------------------------------------------------- |
| **localStorage-quota / privÃ©modus** | `state.js`, `services.js`        | `localStorage.setItem` kan falen; try-catch aanwezig in saveFavorites, savePlates etc.  |
| **JSON.parse op data-rates**         | `app.js` regel ~91               | `JSON.parse(data-rates \|\| 'null')` kan falen bij malformed data.                      |
| **Zone niet in zones-array**         | `services.js` handleStartParking | Als `selectedZone` niet in `zones` voorkomt, toast; maar edge case bij race conditions. |
| **Timer na 00:00**                   | `ui.js`                          | Geen automatische `handleAutoEndSession` wanneer count-down 0 bereikt.                  |

### 7.2 UX / gebruikersrisicoâ€™s

| Risico                               | Scenario                        | Gevolg                                                       |
| ------------------------------------ | ------------------------------- | ------------------------------------------------------------ |
| **localStorage gewist**              | PrivÃ©modus, opschonen browser  | Sessie en kentekens verdwenen (historie blijft in Firestore) |
| **Netwerk uit tijdens laden**        | Slechte verbinding              | Kaart timeout 15 sec, loading overlay                        |
| **Sessie langer dan zone-max**       | Toast bij bereiken limiet       | Chauffeur wordt gewaarschuwd                                 |
| **Geen bevestiging bij verwijderen** | Kenteken per ongeluk verwijderd | Direct weg                                                   |

### 7.3 Architectuur / onderhoud

| Punt                         | Omschrijving                                                              |
| ---------------------------- | ------------------------------------------------------------------------- |
| **Geen package manager**     | Dependencies via CDN; geen npm/yarn voor versiebeheer                     |
| **Dubbele bestanden**        | Root en `public/` hebben vergelijkbare bestanden; mogelijk sync-problemen |
| **Firestore Security Rules** | Moeten multi-tenant en rol-gebaseerde toegang afdwingen                   |
| **Portal â†” App sync**      | Sessies en kentekens: Firestore vs localStorage; verdere integratie nodig |

---

## 8. Conclusies

### 8.1 Sterke punten

1. **Duidelijke scheiding**: app.js (events), services.js (logica), state.js (state), ui.js (render) â€“ goed te volgen.
2. **Documentatie**: ARCHITECTURE.md, PRODUCT_ANALYSIS.md, FLEET_MANAGER_ADMIN_PORTAL_PLAN.md, PWA_INSTALL_INSTRUCTIES.md geven goed inzicht.
3. **Kernflow werkt**: zoeken (incl. geocoding), zone kiezen, bevestigingsmodal, starten, stoppen, kentekens â€“ de basis is solide.
4. **RDW-integratie**: Kentekenvalidatie, automatische lookup en Description-vulling zonder API-key.
5. **Fleet Portal**: Gebruikersbeheer, sessies stoppen en kentekenbeheer is functioneel.
6. **Historie & Firestore**: Sessies naar `sessions` + `transactions`, historie geladen uit Firestore.
7. **Favorieten uitgebreid**: Custom namen, volgorde wijzigen (slepen), verwijderen.
8. **Dark mode**: Light / System / Dark, volgt telefooninstellingen.
9. **PWA**: Service Worker actief, install gate met platform-specifieke instructies.
10. **Billing export**: Cloud Functions voor `parking_sessions` en `monthly_subscriptions` (CSV/JSON).

### 8.2 Verbeterpunten

1. **Wachtwoord vergeten**: Nog niet geÃ¯mplementeerd.
2. **Bevestiging kenteken verwijderen**: Voorkomt per ongeluk verwijderen.
3. **Global active parking indicator**: Lopende sessie door hele app + PWA-badge.
4. **Auto-stop Cloud Function**: Cron/Function voor automatisch stoppen op ingestelde tijd.
5. **Testen**: Uitbreiden van tests voor kritieke flows.

---

## 9. Aanbevelingen

### 9.1 Korte termijn (1â€“2 sprints)

1. **Bevestiging bij verwijderen**: Confirm-dialoog voor kenteken verwijderen.
2. **Global active parking indicator**: Compacte balk onder header op andere schermen, PWA Badging API.
3. **Wachtwoord vergeten**: Implementeer flow via Firebase Auth.

### 9.2 Middellange termijn (3â€“6 maanden)

4. **Auto-stop Cloud Function**: Cron/Function die sessies stopt op ingestelde tijd.
5. **Rapportage-export**: PDF/CSV-export van parkeerhistorie (billing export bestaat).
6. **Push-notificaties**: Waarschuwing bij bijna verlopen sessie (FCM aanwezig).

### 9.3 Lange termijn

7. **Multi-tenancy verfijnen**: Security Rules, tenant-isolatie en rollen uitbreiden.
8. **Offline-first**: Cache-strategie voor kritieke data (Service Worker actief).
9. **Auditlog**: Voor fleetmanagers en compliance.

---

## 10. Bijlagen

### 10.1 Referenties

- [INVEST Principle â€“ User Stories](https://blog.logrocket.com/product-management/writing-meaningful-user-stories-invest-principle/)
- [User Story Format â€“ Scrum.org](https://scrum.org/resources/blog/user-story-format)
- [Given-When-Then â€“ Acceptance Criteria](https://asana.com/resources/user-stories)
- [Documentation Best Practices â€“ Atlassian](https://www.atlassian.com/blog/it-teams/software-documentation-best-practices)

### 10.2 Interne documentatie

- `ARCHITECTURE.md` â€“ Technische architectuur
- `PRODUCT_ANALYSIS.md` â€“ Productanalyse en flow
- `FLEET_MANAGER_ADMIN_PORTAL_PLAN.md` â€“ Fleet-portal plan
- `PWA_INSTALL_INSTRUCTIES.md` – PWA-installatie (iOS/Android)
- `AGENT_CONTEXT.md` â€“ Technisch overzicht
- `screens_overview.md` â€“ Schermoverzicht

---

_Dit rapport is gebaseerd op code-analyse van de Q8 Parking B2B PWA (februari 2026) en best practices voor user stories en documentatie._
