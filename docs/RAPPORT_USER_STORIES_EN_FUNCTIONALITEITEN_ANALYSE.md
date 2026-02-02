# Uitgebreid Rapport: User Stories, Functionaliteiten & Code-analyse
## Q8 Parking B2B PWA

**Versie:** 1.1  
**Datum:** 2 februari 2026  
**Doel:** Complete overzicht voor programmeurs die nog niet aan deze website hebben gewerkt

---

## 1. Management Samenvatting

Dit rapport geeft een gedetailleerde analyse van de Q8 Parking B2B webapplicatie. De app is een **Progressive Web App (PWA)** voor zakelijke chauffeurs met een Q8 Liberty-kaart. Kernfunctionaliteit: parkeerzones vinden, parkeersessies starten en stoppen, kentekens beheren en parkeerhistorie bekijken. Er is ook een **Fleet Manager Portal** voor beheerders.

Het rapport volgt de **INVEST-principes** en het standaard User Story-formaat: *"As a [user type], I want [action], so that [benefit]."* Daarnaast zijn **Given-When-Then** acceptatiecriteria toegevoegd waar relevant.

---

## 2. Technische Architectuur – Overzicht voor Nieuwe Ontwikkelaars

### 2.1 Tech Stack

| Component | Technologie |
|-----------|-------------|
| **Frontend** | Vanilla JavaScript (ES6+), HTML5, CSS3 |
| **Hosting** | Firebase Hosting |
| **Backend Services** | Firebase Auth, Firestore |
| **Kaarten** | Google Maps JavaScript API |
| **Data Pipeline** | Python-scripts (RDW Open Data, AI-enrichment) |

### 2.2 Bestandsstructuur – Waar wat zit

```
/public                    → Gebouwde/bronbestanden voor productie
  index.html               → Hoofd-SPA, alle views
  app.js                   → Entry point, event routing
  services.js              → Business logic (Auth, Parking, Plates, Zones)
  state.js                 → Global state management
  ui.js                    → DOM-rendering (kaart, overlays, lijsten)
  utils.js                 → Hulpfunties (calculateCost, debug)
  kenteken.js              → Kentekenvalidatie + RDW lookup
  design-system.css        → Styling
  portal/                  → Fleet Manager Admin Portal
    index.html, portal.js, portal.css

/scripts                    → Python data-pipeline (RDW fetch, Firestore upload)
/docs                       → Documentatie
/data                       → Zone-data (JSON)
```

### 2.3 Dataflow (Vereenvoudigd)

```
Firestore (zones)  →  loadZones()  →  state.zones  →  UI (kaart, zoeken)
                                                            ↓
User klikt zone  →  tryOpenOverlay('sheet-zone')  →  state.selectedZone
                                                            ↓
User START PARKING  →  handleStartParking()  →  state.session  →  localStorage
                                                            ↓
User END PARKING  →  handleEndParking()  →  session = null
```

### 2.4 Namespace-structuur

Alle client-side logica zit onder `Q8`:

- `Q8.App` – init, event listeners
- `Q8.Services` – Firebase, auth, parking, plates
- `Q8.State` – shared state, persistence
- `Q8.UI` – rendering
- `Q8.Utils` – helpers
- `Q8.Kenteken` – kentekenvalidatie & RDW

---

## 3. Basisfunctionaliteiten – Uitgebreid Overzicht

### 3.1 Authenticatie

| Functie | Status | Implementatie |
|---------|--------|---------------|
| Inloggen (e-mail/wachtwoord) | ✅ | `services.js` → `loginUser()` |
| Registreren | ✅ | `services.js` → `registerUser()` |
| Uitloggen | ✅ | `services.js` → `logoutUser()` |
| Wachtwoord verbergen/tonen | ✅ | `data-action="toggle-password"` |
| Remember me (30 dagen) | UI aanwezig | Niet geïmplementeerd in backend |
| Wachtwoord vergeten | Link aanwezig | Niet geïmplementeerd |

### 3.2 Parkeerzones & Kaart

| Functie | Status | Implementatie |
|---------|--------|---------------|
| Zones laden van Firestore | ✅ | `services.js` → `loadZones()` |
| Kaart met markers | ✅ | `ui.js` → `initGoogleMap()`, `renderMapMarkers()` |
| Zone-filter (alleen straatparkeren) | ✅ | `isStreetParkingZone()` – garage/P+R uitgesloten |
| Tarief-disclaimer (RDW indicatief) | ✅ | Zoekresultaten, favorieten |
| Zone-lijst verbergen bij selectie/sessie | ✅ | `zoneSelectedOrActive` – zoek/fav-list hidden |
| Zoeken op zone-ID of naam | ✅ | `inp-search` → `renderSearchResults()` |
| Zoeken op adres (geocoding) | ✅ | `geocodeAndSearch()`, Google Geocoding API |
| Intelligente zoekmodus | ✅ | `detectSearchMode()` – zone vs. adres automatisch |
| Zone-sheet (tarieven, duur, kenteken) | ✅ | `renderZoneSheet()` |
| Favoriete zones | ✅ | `state.favorites`, `saveFavorites`/`loadFavorites` |
| Favorieten: custom naam geven | ✅ | `edit-favorite-name`, `f.name` in state |
| Favorieten: volgorde wijzigen (slepen) | ✅ | HTML5 drag-and-drop in `renderFavorites()` |
| Favorieten: verwijderen | ✅ | `remove-favorite` via hart-icoon |
| Locatie: kaart centreren + zone voorselectie | ✅ | Geolocation API, Haversine-afstand |

### 3.3 Parkeersessies

| Functie | Status | Implementatie |
|---------|--------|---------------|
| Sessie starten | ✅ | `handleStartParking()` |
| Bevestigingsmodal voor start | ✅ | `modal-confirm-start`, zone + kenteken verifiëren (bewerkbaar) |
| Sessie beëindigen | ✅ | `handleEndParking()` |
| Sessie naar Firestore | ✅ | `sessions` + `transactions` collecties |
| Duur instellen (tot stoppen / vaste tijd) | ✅ | `modifyDuration()`, `modifyActiveSessionEnd()` |
| Actieve sessie-kaart met timer | ✅ | `renderParkingView()` |
| Timer count-down / count-up | ✅ | `startTimerTicker()`, `updateActiveTimerDisplay()` |
| Sessie persistent na refresh | ✅ | `localStorage` `q8_parking_session` |
| Kenteken vastleggen in sessie | ✅ | `session.plate` wordt opgeslagen |

### 3.4 Kentekens

| Functie | Status | Implementatie |
|---------|--------|---------------|
| Kenteken toevoegen | ✅ | `saveNewPlate()` |
| Kenteken verwijderen | ✅ | `deletePlate()` |
| Kenteken bewerken | ✅ | `updatePlate()` |
| Default kenteken instellen | ✅ | `setDefaultPlate()` |
| Kenteken kiezen voor sessie | ✅ | `sheet-plate-selector` |
| Nederlands kentekenformaat | ✅ | `kenteken.js` sidecodes 1–11 (incl. V, W) |
| RDW-controle (gratis Open Data) | ✅ | `checkPlateRDW()`, `Kenteken.lookupRDW()` |
| RDW automatisch + normalisatie | ✅ | Auto-trigger bij invoer, format voor RDW |
| RDW resultaat in Description | ✅ | Merk/type vult Description-veld |
| Auto-specs (RDW) tonen | ✅ | View "Car specs" |

### 3.5 Parkeerhistorie

| Functie | Status | Implementatie |
|---------|--------|---------------|
| Historie-scherm | ✅ | View `history` |
| Filter op voertuig | ✅ | Filter werkt op `state.history` |
| Filter op datum | ✅ | Filter werkt met date range |
| Historie data | ✅ | `loadHistory()` uit Firestore `transactions` |

### 3.6 Notificaties

| Functie | Status | Implementatie |
|---------|--------|---------------|
| Notificatie-instellingen | ✅ | `notificationSettings` in state |
| Notificatiehistorie | ✅ | `state.notifications` |
| Sessie gestart/gestopt melding | ✅ | `addNotification()` |
| Toast in header (3 sec, dismiss) | ✅ | `showToast()`, `dismissToast()` |
| Max parkeerduur meldingen | ✅ | 24u-globaal en zone-specifiek (toast) |
| Waarschuwing bij bijna verlopen | ✅ | `expiringSoonMinutes` – instelbaar |

### 3.7 Taal & PWA

| Functie | Status | Implementatie |
|---------|--------|---------------|
| Nederlands / Engels | ✅ | `state.language` |
| Dark mode (Light / System / Dark) | ✅ | `state.darkMode`, `applyThemeFromPref()` |
| Install Gate (iOS + Android) | ✅ | `installMode`, `renderInstallGate()`, platform-specifieke instructies |
| PWA manifest, icons | ✅ | `manifest.webmanifest` |
| Offline-detectie | ✅ | `online`/`offline` events |
| Service Worker | ✅ | `sw.js` geregistreerd voor offline + FCM |

### 3.8 Fleet Manager Portal

| Functie | Status | Implementatie |
|---------|--------|---------------|
| Inloggen als fleetmanager | ✅ | `portal.js` |
| Dashboard (stats) | ✅ | `section-dashboard` |
| Bestuurders beheren | ✅ | `section-users`, `inviteUser()` |
| Actieve sessies stoppen | ✅ | `stopSession()` |
| Tenant-instellingen (auto-stop) | ✅ | `tenants` collectie |
| Kentekenbeheer per bestuurder | ✅ | `adminPlates`, `driverSettings` |

---

## 4. User Stories – Compleet Overzicht

Formaat: **As a [user type], I want [action], so that [benefit].**

### 4.1 Chauffeur / Bestuurder

#### US-D01 – Zone zoeken
**As a** chauffeur  
**I want** te zoeken op zone-ID of straatnaam  
**So that** ik snel de juiste parkeerzone vind.

**Acceptatiecriteria:**
- *Given* ik ben op het parkeerscherm  
- *When* ik typ in de zoekbalk  
- *Then* zie ik zoekresultaten die matchen op zone-ID en zone-naam  
- *And* ik kan op een resultaat klikken om de zone-sheet te openen

---

#### US-D02 – Zone selecteren en sessie starten
**As a** chauffeur  
**I want** een zone te kiezen, duur in te stellen en parkeren te starten  
**So that** ik legaal kan parkeren.

**Acceptatiecriteria:**
- *Given* ik heb een zone geselecteerd (via kaart of zoeken)  
- *When* ik duur instel (tot stoppen of vaste tijd) en een kenteken kies  
- *And* ik druk op "START PARKING"  
- *Then* verschijnt een bevestigingsmodal met zone en kenteken (bewerkbaar)  
- *And* na bevestiging start mijn parkeersessie  
- *And* ik zie de actieve sessie-kaart

---

#### US-D03 – Parkeersessie beëindigen
**As a** chauffeur  
**I want** mijn parkeersessie te stoppen  
**So that** ik niet onnodig betaal.

**Acceptatiecriteria:**
- *Given* ik heb een actieve parkeersessie  
- *When* ik op "END PARKING" druk en bevestig  
- *Then* wordt de sessie beëindigd  
- *And* de actieve sessie-kaart verdwijnt

---

#### US-D04 – Kentekens beheren
**As a** chauffeur  
**I want** meerdere kentekens toe te voegen en een standaard in te stellen  
**So that** ik snel kan wisselen tussen auto’s.

**Acceptatiecriteria:**
- *Given* ik ben op het kentekenscherm  
- *When* ik een geldig Nederlands kenteken invoer en toevoeg  
- *Then* wordt het kenteken opgeslagen  
- *And* ik kan een kenteken als standaard instellen  
- *And* ik kan kentekens bewerken en verwijderen

---

#### US-D05 – RDW-controle kenteken
**As a** chauffeur  
**I want** mijn kenteken te controleren bij het RDW  
**So that** ik zeker weet dat het klopt.

**Acceptatiecriteria:**
- *Given* ik voer een kenteken in bij het toevoegen  
- *When* het kenteken wordt ingevuld (of ik op "Check at RDW" klik)  
- *Then* wordt automatisch gecontroleerd of het in het RDW-register staat  
- *And* merk/type vult het Description-veld

---

#### US-D06 – Favoriete zones
**As a** chauffeur  
**I want** veelgebruikte zones als favoriet op te slaan  
**So that** ik ze snel kan starten.

**Acceptatiecriteria:**
- *Given* ik heb een zone-sheet open  
- *When* ik op het favoriet-icoon klik  
- *Then* wordt de zone toegevoegd aan of verwijderd van favorieten  
- *And* ik kan favorieten direct starten vanaf het Favorieten-scherm  
- *And* ik kan favorieten een custom naam geven (bijv. Werk, Thuis, Supermarkt)  
- *And* ik kan de volgorde wijzigen via slepen

---

#### US-D07 – Parkeerhistorie bekijken
**As a** chauffeur  
**I want** mijn parkeerhistorie te zien  
**So that** ik kosten kan controleren en declareren.

**Acceptatiecriteria:**
- *Given* ik ben op het geschiedenis-scherm  
- *When* er parkeersessies zijn afgerond  
- *Then* zie ik een lijst met datum, zone, kenteken en kosten (uit Firestore `transactions`)  
- *And* ik kan filteren op voertuig en datum

---

#### US-D08 – Notificaties instellen
**As a** chauffeur  
**I want** notificaties in of uit te zetten  
**So that** ik meldingen krijg wanneer ik dat wil.

**Acceptatiecriteria:**
- *Given* ik ben op het notificaties-scherm  
- *When* ik een instelling aanpas  
- *Then* worden de wijzigingen opgeslagen  
- *And* notificaties komen aan volgens de instellingen

---

#### US-D09 – Taal wijzigen
**As a** chauffeur  
**I want** de app in het Nederlands of Engels te gebruiken  
**So that** ik de interface begrijp.

**Acceptatiecriteria:**
- *Given* ik ben ingelogd  
- *When* ik op EN of NL klik  
- *Then* verandert de taal van de UI

---

#### US-D10 – Sessie verlengen tijdens parkeren
**As a** chauffeur  
**I want** de eindtijd van mijn actieve sessie aan te passen  
**So that** ik langer kan parkeren zonder opnieuw te starten.

**Acceptatiecriteria:**
- *Given* ik heb een sessie met vaste eindtijd  
- *When* ik op + of − klik bij de eindtijd  
- *Then* wordt de eindtijd met 30 minuten aangepast  
- *And* de maximale duur van de zone wordt niet overschreden

---

### 4.2 Fleet Manager

#### US-F01 – Bestuurders uitnodigen
**As a** fleetmanager  
**I want** bestuurders uit te nodigen via e-mail  
**So that** ze toegang krijgen tot de parkeerapp.

**Acceptatiecriteria:**
- *Given* ik ben ingelogd in het Fleet Portal  
- *When* ik een e-mailadres invul en de uitnodiging opsla  
- *Then* kan de bestuurder zich registreren  
- *And* verschijnt hij daarna in de gebruikerslijst

---

#### US-F02 – Actieve sessies stoppen
**As a** fleetmanager  
**I want** actieve parkeersessies handmatig te stoppen  
**So that** ik controle heb bij vergeten sessies.

**Acceptatiecriteria:**
- *Given* er zijn actieve sessies  
- *When* ik op "Stoppen" klik bij een sessie  
- *Then* wordt de sessie beëindigd  
- *And* de bestuurder ziet de wijziging (real-time sync)

---

#### US-F03 – Kentekenbeheer per bestuurder
**As a** fleetmanager  
**I want** kentekens toe te voegen en restricties in te stellen  
**So that** bestuurders alleen toegestane kentekens gebruiken.

**Acceptatiecriteria:**
- *Given* ik selecteer een bestuurder  
- *When* ik kentekens toevoeg of restricties instel (canAddPlates, platesLocked, maxPlates)  
- *Then* worden deze in Firestore opgeslagen  
- *And* de bestuurder ziet de beperkingen in de app

---

#### US-F04 – Auto-stop tijd instellen
**As a** fleetmanager  
**I want** een tijd in te stellen waarop alle sessies automatisch stoppen  
**So that** er geen nachtelijke sessies blijven lopen.

**Acceptatiecriteria:**
- *Given* ik ben op de instellingen-pagina  
- *When* ik auto-stop aanzet en een tijd instel  
- *Then* worden alle actieve sessies op dat moment gestopt  
- **Huidige status:** Cloud Function / cron nog niet geïmplementeerd

---

### 4.3 Systeem / Backend

#### US-S01 – Zones real-time synchroniseren
**As a** systeem  
**I want** zones uit Firestore te synchroniseren  
**So that** de kaart altijd actuele data toont.

**Acceptatiecriteria:**
- *Given* Firestore heeft een `zones`-collectie  
- *When* de app laadt of data wijzigt  
- *Then* worden zones geladen en op de kaart getoond  
- *And* wijzigingen worden real-time doorgevoerd

---

#### US-S02 – Sessie persistent maken
**As a** systeem  
**I want** de actieve sessie in localStorage op te slaan  
**So that** de sessie behouden blijft bij refresh.

**Acceptatiecriteria:**
- *Given* een actieve parkeersessie  
- *When* de pagina wordt ververst  
- *Then* wordt de sessie hersteld  
- *And* timer en zone blijven correct

---

## 5. Ontbrekende / Incomplete User Stories

### 5.1 Niet geïmplementeerd

| User Story | Beschrijving | Impact |
|------------|--------------|--------|
| **Wachtwoord vergeten** | Link aanwezig, flow niet geïmplementeerd | Gebruikers kunnen account niet herstellen |
| **Remember me** | Checkbox aanwezig, geen echte 30-dagen-sessie | Weinig impact |
| **Auto-stop Cloud Function** | Auto-stop tijd opgeslagen, geen cron/function | Sessies stoppen niet automatisch |

### 5.2 Gebruikersfeedback ontbreekt

| Scenario | Huidig gedrag | Gewenst |
|----------|---------------|---------|
| Geen zones geladen | Timeout 15 sec, loading overlay | Duidelijke foutmelding + retry (timeout aanwezig) |
| Zoeken zonder resultaat | Lege lijst, geen bericht | "Geen zones gevonden" |
| Kenteken verwijderen | Geen bevestiging | "Weet u het zeker?"-dialoog |

---

## 6. Suggesties voor Nieuwe Functionaliteiten (op basis van User Stories)

### 6.1 Prioriteit Hoog

| # | Nieuwe User Story | Rationale |
|---|-------------------|-----------|
| 1 | **Wachtwoord vergeten** | Standaard verwachting bij login |
| 2 | **Bevestiging bij kenteken verwijderen** | Voorkomt per ongeluk verwijderen |
| 3 | **Global active parking indicator** | Lopende sessie zichtbaar door hele app + badge op PWA-icoon |

### 6.2 Prioriteit Middel

| # | Nieuwe User Story | Rationale |
|---|-------------------|-----------|
| 4 | **Export parkeerhistorie (CSV/PDF)** | Declaratie en boekhouding (billing export in `functions/billing.js`) |
| 5 | **Push-notificatie bij bijna verlopen** | Voorkomt vergeten sessies (FCM + permissie flow aanwezig) |
| 6 | **Gebruiksdagen beperken** | Fleet Manager Plan – allowedDays |
| 7 | **Bulk kentekens voor poolauto's** | Fleet Manager Plan |
| 9 | **Gebruiksdagen beperken** | Fleet Manager Plan – allowedDays |
| 10 | **Bulk kentekens voor poolauto’s** | Fleet Manager Plan |

### 6.3 Prioriteit Laag

| # | Nieuwe User Story | Rationale |
|---|-------------------|-----------|
| 8 | **Auditlog voor fleetmanagers** | Compliance en traceerbaarheid |

---

## 7. Potentiële Problemen & Open Einden

### 7.1 Technische risico’s

| Risico | Locatie | Omschrijving |
|--------|---------|--------------|
| **localStorage-quota / privémodus** | `state.js`, `services.js` | `localStorage.setItem` kan falen; try-catch aanwezig in saveFavorites, savePlates etc. |
| **JSON.parse op data-rates** | `app.js` regel ~91 | `JSON.parse(data-rates \|\| 'null')` kan falen bij malformed data. |
| **Zone niet in zones-array** | `services.js` handleStartParking | Als `selectedZone` niet in `zones` voorkomt, toast; maar edge case bij race conditions. |
| **Timer na 00:00** | `ui.js` | Geen automatische `handleAutoEndSession` wanneer count-down 0 bereikt. |

### 7.2 UX / gebruikersrisico’s

| Risico | Scenario | Gevolg |
|--------|----------|--------|
| **localStorage gewist** | Privémodus, opschonen browser | Sessie en kentekens verdwenen (historie blijft in Firestore) |
| **Netwerk uit tijdens laden** | Slechte verbinding | Kaart timeout 15 sec, loading overlay |
| **Sessie langer dan zone-max** | Toast bij bereiken limiet | Chauffeur wordt gewaarschuwd |
| **Geen bevestiging bij verwijderen** | Kenteken per ongeluk verwijderd | Direct weg |

### 7.3 Architectuur / onderhoud

| Punt | Omschrijving |
|------|--------------|
| **Geen package manager** | Dependencies via CDN; geen npm/yarn voor versiebeheer |
| **Dubbele bestanden** | Root en `public/` hebben vergelijkbare bestanden; mogelijk sync-problemen |
| **Firestore Security Rules** | Moeten multi-tenant en rol-gebaseerde toegang afdwingen |
| **Portal ↔ App sync** | Sessies en kentekens: Firestore vs localStorage; verdere integratie nodig |

---

## 8. Conclusies

### 8.1 Sterke punten

1. **Duidelijke scheiding**: app.js (events), services.js (logica), state.js (state), ui.js (render) – goed te volgen.
2. **Documentatie**: ARCHITECTURE.md, PRODUCT_ANALYSIS.md, FLEET_MANAGER_ADMIN_PORTAL_PLAN.md, PWA_INSTALL_INSTRUCTIES.md geven goed inzicht.
3. **Kernflow werkt**: zoeken (incl. geocoding), zone kiezen, bevestigingsmodal, starten, stoppen, kentekens – de basis is solide.
4. **RDW-integratie**: Kentekenvalidatie, automatische lookup en Description-vulling zonder API-key.
5. **Fleet Portal**: Gebruikersbeheer, sessies stoppen en kentekenbeheer is functioneel.
6. **Historie & Firestore**: Sessies naar `sessions` + `transactions`, historie geladen uit Firestore.
7. **Favorieten uitgebreid**: Custom namen, volgorde wijzigen (slepen), verwijderen.
8. **Dark mode**: Light / System / Dark, volgt telefooninstellingen.
9. **PWA**: Service Worker actief, install gate met platform-specifieke instructies.
10. **Billing export**: Cloud Functions voor `parking_sessions` en `monthly_subscriptions` (CSV/JSON).

### 8.2 Verbeterpunten

1. **Wachtwoord vergeten**: Nog niet geïmplementeerd.
2. **Bevestiging kenteken verwijderen**: Voorkomt per ongeluk verwijderen.
3. **Global active parking indicator**: Lopende sessie door hele app + PWA-badge.
4. **Auto-stop Cloud Function**: Cron/Function voor automatisch stoppen op ingestelde tijd.
5. **Testen**: Uitbreiden van tests voor kritieke flows.

---

## 9. Aanbevelingen

### 9.1 Korte termijn (1–2 sprints)

1. **Bevestiging bij verwijderen**: Confirm-dialoog voor kenteken verwijderen.
2. **Global active parking indicator**: Compacte balk onder header op andere schermen, PWA Badging API.
3. **Wachtwoord vergeten**: Implementeer flow via Firebase Auth.

### 9.2 Middellange termijn (3–6 maanden)

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

- [INVEST Principle – User Stories](https://blog.logrocket.com/product-management/writing-meaningful-user-stories-invest-principle/)
- [User Story Format – Scrum.org](https://scrum.org/resources/blog/user-story-format)
- [Given-When-Then – Acceptance Criteria](https://asana.com/resources/user-stories)
- [Documentation Best Practices – Atlassian](https://www.atlassian.com/blog/it-teams/software-documentation-best-practices)

### 10.2 Interne documentatie

- `ARCHITECTURE.md` – Technische architectuur
- `PRODUCT_ANALYSIS.md` – Productanalyse en flow
- `FLEET_MANAGER_ADMIN_PORTAL_PLAN.md` – Fleet-portal plan
- `AGENT_CONTEXT.md` – Technisch overzicht
- `screens_overview.md` – Schermoverzicht

---

*Dit rapport is gebaseerd op code-analyse van de Q8 Parking B2B PWA (februari 2025) en best practices voor user stories en documentatie.*
