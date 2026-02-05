# Functionalities Canon – Q8 Parking B2B PWA

**Doel:** Volledige, feitelijke lijst van alle functionaliteiten die het systeem hoort te hebben, afgeleid uit documentatie en code.  
**Scope (read-only):** docs/MASTER.md, docs/PRODUCT_ANALYSIS.md, docs/ARCHITECTURE.md, docs/WORKING_RULES.md, public/ (UI), scripts/e2e-proof.mjs.  
**Laatste audit:** februari 2026.

---

## Global UI Rules

### Desktop mirrors mobile (AUTHORITATIVE)
- **Rule:** On desktop, the app MUST render exactly like mobile. Desktop is treated as a "large phone".
- **Rationale:** For the current development phase, desktop usage is ONLY a test environment. Desktop must behave as a mirror of mobile UI, not as a separate UX.
- **Implementation:**
  - App container (`#app`): fixed `max-width: 480px` on all screen sizes.
  - Zone sheet (`.bottom-sheet`): fills the full width of `#app`, not viewport-centered.
  - No desktop-specific layout optimizations are allowed.
  - This rule overrides any responsive desktop optimizations.
- **Enforcement:** E2E test (`scripts/e2e-desktop.mjs`) validates zone sheet width matches app width on desktop viewport.
- **Fix (feb 2026):** Sheet was viewport-centered with separate max-width. Fixed to use `left: 0; right: 0` within `#app` container.

---

## 1. Authenticatie

### Inloggen (e-mail/wachtwoord)
- **Doel:** Chauffeur toegang geven tot de app.
- **Voor wie (rol):** Chauffeur (driver).
- **Trigger / entry point:** view-login, knop SIGN IN (data-action="login"), invoer inp-email, inp-password.
- **Verwacht gedrag:** Firebase Auth signInWithEmailAndPassword; bij succes navigatie naar parkeerkaart (view-map).
- **Huidige implementatie:**
  - Bestaat: ja
  - Locatie (bestand(en)): public/services.js (loginUser), public/app.js (case "login"), public/index.html (view-login, form).
- **Bewijs:** E2E (scripts/e2e-proof.mjs) klikt op sign in als #view-login zichtbaar is; daarna #view-map zichtbaar.
- **Status:** OK
- **Opmerkingen:** —

### Registreren (nieuw account)
- **Doel:** Nieuwe chauffeur kan een account aanmaken.
- **Voor wie (rol):** (Nieuwe) chauffeur.
- **Trigger / entry point:** view-register, link "Create account" op login, knop REGISTER (data-action="register").
- **Verwacht gedrag:** Account aanmaken in Firebase Auth; daarna inloggen en naar parkeerkaart.
- **Huidige implementatie:**
  - Bestaat: deels
  - Locatie (bestand(en)): public/services.js (registerUser met createUserWithEmailAndPassword), public/app.js (case "register"), public/index.html (view-register met velden first name, last name, email, phone, Liberty card, password, confirm password).
- **Bewijs:** handmatig
- **Status:** DEELS
- **Opmerkingen:** Alleen e-mail en wachtwoord worden naar Firebase gestuurd. Overige velden (naam, telefoon, Liberty-kaart) zijn in de UI aanwezig maar niet in registerUser verwerkt.

### Uitloggen
- **Doel:** Sessie beëindigen en terug naar inlogscherm.
- **Voor wie (rol):** Chauffeur.
- **Trigger / entry point:** Menu "Sign out" / "SIGN OUT" (data-action="logout", data-testid="btn-logout").
- **Verwacht gedrag:** Firebase signOut; session en overlay gereset; localStorage q8_parking_session verwijderd; view-login getoond.
- **Huidige implementatie:**
  - Bestaat: ja
  - Locatie (bestand(en)): public/services.js (logoutUser), public/app.js (case "logout"), public/index.html (menu, btn-logout).
- **Bewijs:** E2E (e2e-proof.mjs): klik btn-logout, daarna #view-login visible.
- **Status:** OK
- **Opmerkingen:** —

### Wachtwoord vergeten
- **Doel:** Resetlink per e-mail zodat gebruiker wachtwoord kan resetten.
- **Voor wie (rol):** Chauffeur.
- **Trigger / entry point:** Link "Forgot password?" op login (data-action="open-overlay" data-target="modal-forgot-password"), daarna modal, knop SEND RESET LINK (data-action="submit-forgot-password").
- **Verwacht gedrag:** Firebase sendPasswordResetEmail; feedback in modal.
- **Huidige implementatie:**
  - Bestaat: ja
  - Locatie (bestand(en)): public/services.js (sendPasswordResetEmail), public/app.js (case "submit-forgot-password"), public/index.html (modal-forgot-password).
- **Bewijs:** handmatig
- **Status:** OK
- **Opmerkingen:** RAPPORT_USER_STORIES vermeldde "Niet geïmplementeerd"; in code is sendPasswordResetEmail wel aanwezig en gekoppeld.

### Remember me (30 dagen)
- **Doel:** Inlogstatus langer bewaren (30 dagen).
- **Voor wie (rol):** Chauffeur.
- **Trigger / entry point:** Checkbox "Remember me for 30 days" op login (data-action="toggle-remember").
- **Verwacht gedrag:** Voorkeur opslaan en auth-sessie verlengen/onthouden.
- **Huidige implementatie:**
  - Bestaat: deels
  - Locatie (bestand(en)): public/index.html (toggle-remember), public/state.js (rememberMe, rememberMeUntil); backend-logica voor 30 dagen niet gevolgd in auth flow.
- **Bewijs:** handmatig
- **Status:** DEELS
- **Opmerkingen:** UI en state bestaan; documentatie (RAPPORT_USER_STORIES) stelt "Niet geïmplementeerd in backend".

### Wachtwoord tonen/verbergen (login)
- **Doel:** Wachtwoordveld als tekst of verborgen tonen.
- **Voor wie (rol):** Chauffeur.
- **Trigger / entry point:** Oog-icoon naast wachtwoordveld (data-action="toggle-password").
- **Verwacht gedrag:** Toggle type password/text.
- **Huidige implementatie:**
  - Bestaat: ja
  - Locatie (bestand(en)): public/index.html (eye-toggle), public/app.js (case "toggle-password").
- **Bewijs:** handmatig
- **Status:** OK
- **Opmerkingen:** —

---

## 2. Kaart en parkeerzones

### Zones laden van Firestore
- **Doel:** Actuele parkeerzones (straatparkeren) ophalen en in state houden.
- **Voor wie (rol):** Chauffeur.
- **Trigger / entry point:** Na inloggen bij setScreen('parking'); init in app.js roept loadZones aan.
- **Verwacht gedrag:** Firestore-collectie 'zones' luisteren (onSnapshot), filter isStreetParkingZone (o.a. garage/P+R uitgesloten), state.zones vullen, zonesLoading/zonesLoadError bij timeout/fout.
- **Huidige implementatie:**
  - Bestaat: ja
  - Locatie (bestand(en)): public/services.js (loadZones, isStreetParkingZone), public/state.js (zones, zonesLoading, zonesLoadError).
- **Bewijs:** E2E wacht op zone markers of seed-inject; handmatig.
- **Status:** OK
- **Opmerkingen:** Timeout 15s; bij fout wordt retry-knop getoond (data-action="retry-load-zones").

### Kaart met markers (parkeerzones)
- **Doel:** Kaart tonen met prijsmarkers per zone.
- **Voor wie (rol):** Chauffeur.
- **Trigger / entry point:** view-map, map-container (data-testid="map-root"); initGoogleMap / renderMapMarkers bij parking-screen.
- **Verwacht gedrag:** Google Maps laden, markers voor state.zones met prijs/label, klik op marker opent zone-sheet.
- **Huidige implementatie:**
  - Bestaat: ja
  - Locatie (bestand(en)): public/ui.js (initGoogleMap, renderMapMarkers), public/app.js (setScreen parking), public/index.html (map-container).
- **Bewijs:** E2E: map-root visible, zone marker click → sheet-zone visible.
- **Status:** OK
- **Opmerkingen:**
  - **Fix (feb 2026):** Root cause was dat `loadZones()` niet opnieuw werd aangeroepen na login. Fix: in `initAuthListener()` wordt nu `loadZones()` aangeroepen als zones leeg zijn of een error hadden. Getest via E2E: echte Firestore zones laden nu correct (bijv. Zone 268_CANISI, Domplein 21, Nijmegen).

### Zoeken op zone-ID of naam
- **Doel:** Zones vinden op invoer in zoekbalk (zone-ID of zone-naam).
- **Voor wie (rol):** Chauffeur.
- **Trigger / entry point:** inp-search op kaart; searchMode 'zone'; renderSearchResults filtert op zone/id/naam.
- **Verwacht gedrag:** Tijdens typen resultaten tonen; klik op resultaat opent zone-sheet.
- **Huidige implementatie:**
  - Bestaat: ja
  - Locatie (bestand(en)): public/ui.js (search, renderSearchResults), public/state.js (searchMode, searchQuery), public/index.html (inp-search).
- **Bewijs:** handmatig
- **Status:** OK
- **Opmerkingen:** PRODUCT_ANALYSIS: "Zoeken op adres beperkt; resultaten filteren hoofdzakelijk op zone-ID en zone-naam."

### Zoeken op adres (geocoding)
- **Doel:** Op straat/plaats zoeken en nabijgelegen zones tonen.
- **Voor wie (rol):** Chauffeur.
- **Trigger / entry point:** inp-search wanneer searchMode 'address'; geocodeAndSearch (Google Geocoding) + afstand tot zones.
- **Verwacht gedrag:** Geocode adres, zones binnen straal sorteren op afstand, resultaten tonen.
- **Huidige implementatie:**
  - Bestaat: ja
  - Locatie (bestand(en)): public/services.js (geocodeAndSearch), public/ui.js (address search flow), public/state.js (geocodeMatches, geocodeLoading).
- **Bewijs:** handmatig
- **Status:** OK
- **Opmerkingen:** PRODUCT_ANALYSIS: "beperkt; resultaten filteren hoofdzakelijk op zone-ID en zone-naam" — adreszoeken zelf is wel geïmplementeerd.

### Zone-sheet (tarieven, duur, kenteken, start)
- **Doel:** Gekozen zone tonen met tarieven, duurinstelling, kentekenkeuze en START PARKING.
- **Voor wie (rol):** Chauffeur.
- **Trigger / entry point:** Klik op kaartmarker of zoekresultaat → tryOpenOverlay('sheet-zone', context); sheet-zone met data-testid="sheet-zone", btn-zone-close, duration-value, btn-zone-plus, start-session.
- **Verwacht gedrag:** Tarieven, duur +/- en pills (Until stopped, 1u, 2u, 3u), kentekenkiezer, sluiten; START PARKING opent bevestigingsmodal of start direct (daypass-flow).
- **Huidige implementatie:**
  - Bestaat: ja
  - Locatie (bestand(en)): public/ui.js (renderZoneSheet), public/services.js (tryOpenOverlay), public/index.html (sheet-zone).
- **Bewijs:** E2E: sheet-zone visible, duration plus, sheet close.
- **Status:** OK
- **Opmerkingen:** —

### Zones laadindicator en fout + retry
- **Doel:** Tijdens laden van zones een spinner tonen; bij fout/timeout een melding en retry-knop.
- **Voor wie (rol):** Chauffeur.
- **Trigger / entry point:** state.zonesLoading / state.zonesLoadError; zones-loading-overlay, zones-load-error met data-action="retry-load-zones".
- **Verwacht gedrag:** Loading overlay zichtbaar tijdens laden; bij fout fouttekst en "Retry" klikbaar.
- **Huidige implementatie:**
  - Bestaat: ja
  - Locatie (bestand(en)): public/index.html (zones-loading-overlay, zones-load-error), public/ui.js (renderParkingView / zones state), public/app.js (retry-load-zones).
- **Bewijs:** handmatig
- **Status:** OK
- **Opmerkingen:** —

### Mijn locatie (GPS + zone voorselectie)
- **Doel:** Kaart centreren op gebruiker en dichtstbijzijnde zone binnen straal voorselecteren.
- **Voor wie (rol):** Chauffeur.
- **Trigger / entry point:** Knop "Mijn locatie" (data-action="go-to-my-location", btn-my-location); requestUserLocation, findAndSelectZoneAtLocation.
- **Verwacht gedrag:** Geolocation.getCurrentPosition; state.userLocation; kaart centreren; binnen 100 m zone voorselecteren.
- **Huidige implementatie:**
  - Bestaat: ja
  - Locatie (bestand(en)): public/services.js (requestUserLocation, findAndSelectZoneAtLocation, ZONE_PRESELECT_RADIUS_KM), public/index.html (btn-my-location).
- **Bewijs:** handmatig
- **Opmerkingen:** Locatie-uitleg modal (modal-location-explanation) en confirm-location-explanation bestaan voor eerste permissievraag.

---

## 3. Parkeersessies

### Parkeersessie starten
- **Doel:** Actieve sessie starten voor gekozen zone, kenteken en duur.
- **Voor wie (rol):** Chauffeur.
- **Trigger / entry point:** Zone-sheet "START PARKING" (data-action="start-session") → modal-confirm-start; "YES, START" (data-action="confirm-start-session") → handleStartParking({ fromConfirmStart: true }).
- **Verwacht gedrag:** Validatie (geen dubbele sessie, selectedZone, overlay, zone in lijst, kenteken, eventueel driverSettings); session in state + localStorage; optioneel schrijven naar Firestore sessions; toast; actieve kaart zichtbaar.
- **Huidige implementatie:**
  - Bestaat: ja
  - Locatie (bestand(en)): public/services.js (handleStartParking), public/app.js (start-session, confirm-start-session, confirm-start-daypass), public/ui.js (populateConfirmStartModal).
- **Bewijs:** handmatig (E2E start geen sessie; wel zone sheet + duration).
- **Status:** OK
- **Opmerkingen:** Bij geen zone/geen kenteken/geen sheet: toast-foutmelding (PRODUCT_ANALYSIS prioriteit 1 was "gebruikersfeedback" — in code aanwezig).

### Bevestigingsmodal vóór start (zone + kenteken)
- **Doel:** Chauffeur zone en kenteken laten controleren voor definitieve start.
- **Voor wie (rol):** Chauffeur.
- **Trigger / entry point:** Na START PARKING in zone-sheet → modal-confirm-start; kenteken wijzigen via open-plate-selector-from-confirm.
- **Verwacht gedrag:** Zone en kenteken tonen; bewerkbaar kenteken; YES, START start sessie.
- **Huidige implementatie:**
  - Bestaat: ja
  - Locatie (bestand(en)): public/index.html (modal-confirm-start), public/ui.js (populateConfirmStartModal), public/app.js (confirm-start-session, open-plate-selector-from-confirm).
- **Bewijs:** handmatig
- **Status:** OK
- **Opmerkingen:** —

### Parkeersessie beëindigen
- **Doel:** Actieve sessie stoppen en kosten vastleggen.
- **Voor wie (rol):** Chauffeur.
- **Trigger / entry point:** Actieve-kaart "END PARKING" → modal-confirm; "END PARKING" in modal (data-action="confirm-end") → handleEndParking.
- **Verwacht gedrag:** session op null; localStorage opruimen; sessie in Firestore op 'ended'; transactie (transactions) aanmaken met cost; toast en notificatie.
- **Huidige implementatie:**
  - Bestaat: ja
  - Locatie (bestand(en)): public/services.js (handleEndParking, transactionData, sessions.doc.update, transactions.add), public/app.js (confirm-end), public/index.html (modal-confirm, active-parking END PARKING).
- **Bewijs:** handmatig
- **Status:** OK
- **Opmerkingen:** —

### Actieve sessie-kaart (timer, zone, kenteken)
- **Doel:** Tijdens actieve sessie kaart tonen met zone, kenteken, resterende tijd of verstreken tijd.
- **Voor wie (rol):** Chauffeur.
- **Trigger / entry point:** state.session niet null → ui-active-parking zichtbaar; startTimerTicker / updateActiveTimerDisplay.
- **Verwacht gedrag:** Count-down bij vaste eindtijd, count-up bij "until stopped"; zone en kenteken uit session; na refresh hersteld uit localStorage (of Firestore restoreSessionFromFirestore).
- **Huidige implementatie:**
  - Bestaat: ja
  - Locatie (bestand(en)): public/ui.js (renderParkingView, active card, timer), public/index.html (ui-active-parking), public/state.js (session).
- **Bewijs:** handmatig
- **Status:** OK
- **Opmerkingen:** PRODUCT_ANALYSIS: bij herladen wordt kenteken uit sessie getoond (session.plate); "default kenteken" betrof mogelijk oud gedrag.

### Eindtijd actieve sessie aanpassen (+30 / -30 min)
- **Doel:** Tijdens actieve sessie eindtijd verlengen of verkorten.
- **Voor wie (rol):** Chauffeur.
- **Trigger / entry point:** Actieve kaart knoppen mod-active-end data-delta="30" / "-30".
- **Verwacht gedrag:** modifyActiveSessionEnd(delta); respect voor max_duration_mins van zone; sessie in state + localStorage bijgewerkt.
- **Huidige implementatie:**
  - Bestaat: ja
  - Locatie (bestand(en)): public/services.js (modifyActiveSessionEnd), public/app.js (mod-active-end), public/index.html (active-end-btn).
- **Bewijs:** handmatig
- **Status:** OK
- **Opmerkingen:** —

### Duur instellen in zone-sheet (tot stoppen / vaste tijd)
- **Doel:** Voor start duur kiezen: "Until stopped" of vaste minuten (15-min stappen, pills).
- **Voor wie (rol):** Chauffeur.
- **Trigger / entry point:** mod-duration (delta -15/+15), set-default-duration (data-minutes 0/60/120/180); state.duration, state.defaultDurationMinutes.
- **Verwacht gedrag:** Duur binnen zone-max; weergave "Until stopped" of "Xh Ym".
- **Huidige implementatie:**
  - Bestaat: ja
  - Locatie (bestand(en)): public/services.js (modifyDuration), public/app.js (mod-duration, set-default-duration), public/index.html (sheet-section-duration, duration-default-pill).
- **Bewijs:** E2E: duration-value verandert na klik btn-zone-plus.
- **Status:** OK
- **Opmerkingen:** —

### Sessie persistent (localStorage + Firestore restore)
- **Doel:** Sessie overleeft refresh; bij geen localStorage sessie uit Firestore herstellen indien actieve sessie voor user.
- **Voor wie (rol):** Chauffeur.
- **Trigger / entry point:** state.js load() leest q8_parking_session; bij auth restoreSessionFromFirestore(uid) leest sessions waar status === 'active'.
- **Verwacht gedrag:** Na refresh actieve sessie en timer weer zichtbaar; Firestore als backup wanneer lokaal gewist.
- **Huidige implementatie:**
  - Bestaat: ja
  - Locatie (bestand(en)): public/state.js (load, save, q8_parking_session), public/services.js (restoreSessionFromFirestore).
- **Bewijs:** handmatig
- **Status:** OK
- **Opmerkingen:** —

### Kenteken vastleggen in sessie
- **Doel:** Gekozen kenteken in sessie opslaan (zone + kenteken in actieve kaart en historie).
- **Voor wie (rol):** Chauffeur.
- **Trigger / entry point:** handleStartParking leest selectedPlateId / default / first plate; session.plate = plateText; wordt weggeschreven naar Firestore (sessions, transactions).
- **Verwacht gedrag:** Actieve kaart en historie tonen het juiste kenteken.
- **Huidige implementatie:**
  - Bestaat: ja
  - Locatie (bestand(en)): public/services.js (handleStartParking session.plate, sessionData.plate; handleEndParking transactionData.plate).
- **Bewijs:** handmatig
- **Status:** OK
- **Opmerkingen:** PRODUCT_ANALYSIS noemde "gekozen kenteken wordt niet opgeslagen"; in huidige code wordt plate wel in session en transactions opgenomen.

---

## 4. Kentekens

### Kenteken toevoegen
- **Doel:** Nieuw kenteken toevoegen (formatvalidatie, optioneel RDW).
- **Voor wie (rol):** Chauffeur.
- **Trigger / entry point:** modal-add-plate (data-action="open-overlay" data-target="modal-add-plate"); ADD (data-action="save-plate"); saveNewPlate.
- **Verwacht gedrag:** Validatie Nederlands format; optioneel RDW-lookup; toevoegen aan state.plates en sync naar Firestore userPlates; eerste kenteken = default.
- **Huidige implementatie:**
  - Bestaat: ja
  - Locatie (bestand(en)): public/services.js (saveNewPlate, syncUserPlatesToFirestore), public/app.js (save-plate), public/index.html (modal-add-plate), public/kenteken.js.
- **Bewijs:** handmatig
- **Status:** OK
- **Opmerkingen:** —

### Kenteken verwijderen
- **Doel:** Kenteken uit lijst verwijderen (met bevestiging).
- **Voor wie (rol):** Chauffeur.
- **Trigger / entry point:** Verwijder-knop bij kenteken → modal-confirm-delete-plate; DELETE (data-action="confirm-delete-plate"); deletePlate.
- **Verwacht gedrag:** Plate uit state en Firestore; als default verwijderd, volgende wordt default.
- **Huidige implementatie:**
  - Bestaat: ja
  - Locatie (bestand(en)): public/services.js (deletePlate, removeUserPlateFromFirestore), public/app.js (delete-plate, confirm-delete-plate).
- **Bewijs:** handmatig
- **Status:** OK
- **Opmerkingen:** —

### Kenteken bewerken
- **Doel:** Bestaand kenteken tekst/beschrijving wijzigen.
- **Voor wie (rol):** Chauffeur.
- **Trigger / entry point:** Bewerken-knop bij kenteken (data-action="edit-plate") → modal-edit-plate; SAVE (data-action="save-edit-plate"); updatePlate.
- **Verwacht gedrag:** Plate text/description bijwerken in state en Firestore.
- **Huidige implementatie:**
  - Bestaat: ja
  - Locatie (bestand(en)): public/services.js (updatePlate), public/app.js (edit-plate, save-edit-plate), public/index.html (modal-edit-plate).
- **Bewijs:** handmatig
- **Status:** OK
- **Opmerkingen:** —

### Standaard kenteken instellen
- **Doel:** Eén kenteken als default markeren (voor zone-sheet en sessie).
- **Voor wie (rol):** Chauffeur.
- **Trigger / entry point:** view-plates: kenteken selecteren, knop "MAKE SELECTED PLATE DEFAULT" (data-action="set-default-plate"); setDefaultPlate.
- **Verwacht gedrag:** state.plates default-flag bijwerken; persistent.
- **Huidige implementatie:**
  - Bestaat: ja
  - Locatie (bestand(en)): public/services.js (setDefaultPlate), public/app.js (set-default-plate), public/state.js (plates), public/index.html (btn-set-default).
- **Bewijs:** handmatig
- **Status:** OK
- **Opmerkingen:** —

### Kenteken kiezen voor sessie (zone-sheet)
- **Doel:** In zone-sheet snel ander kenteken kiezen zonder naar Plates te gaan.
- **Voor wie (rol):** Chauffeur.
- **Trigger / entry point:** Klik op kentekenbadge in sheet of "Select vehicle" → sheet-plate-selector; select-quick-plate (data-id) → selectedPlateId; terug naar sheet of modal-confirm-start.
- **Verwacht gedrag:** Lijst van plates; selectie bewaard voor komende start.
- **Huidige implementatie:**
  - Bestaat: ja
  - Locatie (bestand(en)): public/app.js (open-plate-selector, select-quick-plate, open-plate-selector-from-confirm), public/ui.js (renderQuickPlateSelector), public/index.html (sheet-plate-selector, details-plate).
- **Bewijs:** handmatig
- **Status:** OK
- **Opmerkingen:** —

### Kentekenvalidatie en RDW-lookup
- **Doel:** Nederlands kentekenformaat valideren en optioneel RDW Open Data raadplegen (merk/type).
- **Voor wie (rol):** Chauffeur.
- **Trigger / entry point:** Invoer in modal-add-plate; kenteken.js / checkPlateRDW; RDW-resultaat in description of aparte feedback.
- **Verwacht gedrag:** Format 1-ABC-123 (sidecodes); RDW-resultaat tonen.
- **Huidige implementatie:**
  - Bestaat: ja
  - Locatie (bestand(en)): public/kenteken.js, public/services.js (checkPlateRDW), public/ui.js (plate-rdw-result).
- **Bewijs:** handmatig
- **Status:** OK
- **Opmerkingen:** —

### Car specs (RDW-specs per kenteken)
- **Doel:** Per geregistreerd kenteken voertuiggegevens uit RDW tonen.
- **Voor wie (rol):** Chauffeur.
- **Trigger / entry point:** Menu "Car specs" → view-car-specs; list-car-specs door ui.js ingevuld.
- **Verwacht gedrag:** Lijst met specs per plate (bijv. merk, type).
- **Huidige implementatie:**
  - Bestaat: ja
  - Locatie (bestand(en)): public/ui.js (renderCarSpecs / list-car-specs), public/index.html (view-car-specs).
- **Bewijs:** handmatig
- **Status:** OK
- **Opmerkingen:** —

---

## 5. Parkeerhistorie

### Parkeerhistorie-scherm
- **Doel:** Lijst van afgeronde parkeersessies met datum, tijd, zone, kenteken, kosten.
- **Voor wie (rol):** Chauffeur.
- **Trigger / entry point:** Menu "Parking history" → view-history; list-history; state.history.
- **Verwacht gedrag:** Items uit state.history tonen (van Firestore transactions); lege staat als geen data.
- **Huidige implementatie:**
  - Bestaat: ja
  - Locatie (bestand(en)): public/ui.js (renderHistory), public/index.html (view-history, list-history), public/state.js (history).
- **Bewijs:** handmatig
- **Status:** OK
- **Opmerkingen:** Data komt van loadHistory(userId) → Firestore collectie 'transactions'. Als daar geen documenten zijn, blijft lijst leeg (geen "ontbreekt" in code).

### Historie filter op voertuig en datum
- **Doel:** Historie filteren op kenteken en datumreeks.
- **Voor wie (rol):** Chauffeur.
- **Trigger / entry point:** Quick filters (All, Last 7 days, Last 30 days, This month); "Filters" → sheet-filter; toggle-filter-vehicle, toggle-filter-daterange, customStart/customEnd, apply-filters, clear-filters.
- **Verwacht gedrag:** state.historyFilters; gefilterde lijst in renderHistory.
- **Huidige implementatie:**
  - Bestaat: ja
  - Locatie (bestand(en)): public/state.js (historyFilters), public/ui.js (renderHistory, renderHistoryFilters), public/app.js (toggle-filter-vehicle, toggle-filter-daterange, apply-filters, clear-filters), public/index.html (sheet-filter).
- **Bewijs:** handmatig
- **Status:** OK
- **Opmerkingen:** —

### Historie data uit Firestore (transactions)
- **Doel:** Afgeronde sessies als transacties ophalen en in state.history zetten.
- **Voor wie (rol):** Chauffeur.
- **Trigger / entry point:** Na inloggen loadHistory(user.uid); onSnapshot op transactions waar userId == uid, orderBy endedAt desc, limit 200.
- **Verwacht gedrag:** state.history gevuld met { id, zone, zoneUid, plate, date, start, end, price }; bij uitloggen history geleegd.
- **Huidige implementatie:**
  - Bestaat: ja
  - Locatie (bestand(en)): public/services.js (loadHistory, _historyUnsub), auth listener roept loadHistory(user.uid).
- **Bewijs:** handmatig
- **Status:** OK
- **Opmerkingen:** PRODUCT_ANALYSIS meldde "data wordt niet opgebouwd"; technisch is de koppeling er wel. Lege historie kan komen doordat transactions alleen gevuld wordt bij handleEndParking (na eerste gebruik na deploy).

### Export historie (CSV / Print)
- **Doel:** Gefilterde historie exporteren als CSV-download of print/PDF.
- **Voor wie (rol):** Chauffeur.
- **Trigger / entry point:** view-history footer: "Export CSV" (data-action="export-history-csv"), "Print / PDF" (data-action="export-history-print"); utils.js exportLogica.
- **Verwacht gedrag:** CSV-download van gefilterde history; print-dialog voor huidige lijst.
- **Huidige implementatie:**
  - Bestaat: ja
  - Locatie (bestand(en)): public/utils.js (export-gerelateerde functies), public/app.js (export-history-csv, export-history-print).
- **Bewijs:** handmatig
- **Status:** OK
- **Opmerkingen:** —

---

## 6. Favorieten

### Favoriete zones beheren (toevoegen/verwijderen)
- **Doel:** Zones als favoriet opslaan en verwijderen.
- **Voor wie (rol):** Chauffeur.
- **Trigger / entry point:** In zone-sheet hart-icoon (data-action="toggle-favorite"); in zoekresultaten/historie remove-favorite / add-favorite-from-history; state.favorites, saveFavorites/loadFavorites.
- **Verwacht gedrag:** Favorieten lijst in menu en op kaart (favorites-strip, view-favorites); persistent (localStorage).
- **Huidige implementatie:**
  - Bestaat: ja
  - Locatie (bestand(en)): public/app.js (toggle-favorite, remove-favorite, add-favorite-from-history), public/ui.js (renderFavorites, favorites-strip), public/state.js (favorites).
- **Bewijs:** handmatig
- **Status:** OK
- **Opmerkingen:** —

### Favoriet custom naam en volgorde
- **Doel:** Favoriet een eigen naam geven en volgorde wijzigen (slepen).
- **Voor wie (rol):** Chauffeur.
- **Trigger / entry point:** edit-favorite-name; drag-and-drop in renderFavorites (RAPPORT_USER_STORIES).
- **Verwacht gedrag:** state.favorites met name/order; opslaan.
- **Huidige implementatie:**
  - Bestaat: ja
  - Locatie (bestand(en)): public/ui.js (edit-favorite-name, favorieten-lijst), public/app.js (edit-favorite-name).
- **Bewijs:** handmatig
- **Status:** OK
- **Opmerkingen:** —

---

## 7. Notificaties

### Notificatie-instellingen (sessie start/expiring/end)
- **Doel:** Instellingen voor welke events een in-app/push-notificatie geven (sessie gestart, bijna verlopen, beëindigd).
- **Voor wie (rol):** Chauffeur.
- **Trigger / entry point:** view-notifications; notif-settings-list; toggle-notif-setting, change-expiring-interval; syncNotificationSettingsToFirestore.
- **Verwacht gedrag:** state.notificationSettings; sync naar Firestore users-doc.
- **Huidige implementatie:**
  - Bestaat: ja
  - Locatie (bestand(en)): public/state.js (notificationSettings), public/services.js (syncNotificationSettingsToFirestore), public/ui.js (renderNotifications).
- **Bewijs:** handmatig
- **Status:** OK
- **Opmerkingen:** —

### Notificatiehistorie (in-app)
- **Doel:** Lijst van recente in-app notificaties (session started, ended, etc.).
- **Voor wie (rol):** Chauffeur.
- **Trigger / entry point:** view-notifications; notif-history-list; state.notifications.
- **Verwacht gedrag:** Lijst met type, message, detail, at.
- **Huidige implementatie:**
  - Bestaat: ja
  - Locatie (bestand(en)): public/ui.js (notif-history-list), public/state.js (notifications), public/services.js (addNotification).
- **Bewijs:** handmatig
- **Status:** OK
- **Opmerkingen:** —

### Push / FCM-token
- **Doel:** FCM-token opslaan voor push (optioneel).
- **Voor wie (rol):** Chauffeur.
- **Trigger / entry point:** requestPushNotificationPermission / requestNotificationPermission; initFCMAndSaveToken(uid); messaging.getToken; users-doc fcmToken.
- **Verwacht gedrag:** Bij permission granted token in Firestore; gebruikt voor server-side push (niet in PWA-code verder geïmplementeerd).
- **Huidige implementatie:**
  - Bestaat: deels
  - Locatie (bestand(en)): public/services.js (initFCMAndSaveToken, requestPushNotificationPermission), public/firebase-config.js (messagingVapidKey).
- **Bewijs:** handmatig
- **Status:** DEELS
- **Opmerkingen:** Token wordt opgeslagen; daadwerkelijke push-afhandeling en backend-triggers vallen buiten scope van deze canon.

---

## 8. UI en navigatie

### Hoofdviews (login, register, map, plates, history, favorites, notifications, car-specs)
- **Doel:** Schermen voor alle hoofdflows.
- **Voor wie (rol):** Chauffeur.
- **Trigger / entry point:** setScreen(name); nav-to data-target; state.screen.
- **Verwacht gedrag:** Alleen actieve view zichtbaar; menu opent side-menu.
- **Huidige implementatie:**
  - Bestaat: ja
  - Locatie (bestand(en)): public/index.html (view-login, view-register, view-map, view-plates, view-history, view-favorites, view-notifications, view-car-specs), public/services.js (setScreen), public/app.js (nav-to).
- **Bewijs:** E2E: view-map, view-login; handmatig overige.
- **Status:** OK
- **Opmerkingen:** —

### Side-menu (navigatie + uitloggen)
- **Doel:** Navigatie tussen schermen en uitloggen.
- **Voor wie (rol):** Chauffeur.
- **Trigger / entry point:** Hamburger (data-testid="btn-menu-open", data-action="toggle-menu"); side-menu (data-testid="side-menu"); menu-item-parking etc.; btn-logout.
- **Verwacht gedrag:** Menu opent/sluit; nav-to wisselt scherm en sluit menu; Sign out logt uit.
- **Huidige implementatie:**
  - Bestaat: ja
  - Locatie (bestand(en)): public/index.html (side-menu, menu-overlay-backdrop), public/app.js (toggle-menu, closeSideMenu).
- **Bewijs:** E2E: menu open, menu-item-parking visible, logout → view-login.
- **Status:** OK
- **Opmerkingen:** —

### Taal (EN/NL)
- **Doel:** Interface in Engels of Nederlands.
- **Voor wie (rol):** Chauffeur.
- **Trigger / entry point:** set-lang data-lang="en"|"nl"; state.language; teksten in ui/services via language.
- **Verwacht gedrag:** state.language; teksten en placeholders wisselen.
- **Huidige implementatie:**
  - Bestaat: ja
  - Locatie (bestand(en)): public/state.js (language), public/app.js (set-lang), public/index.html (lang-btn, menu-lang-row).
- **Bewijs:** handmatig
- **Status:** OK
- **Opmerkingen:** —

### Donkere modus (light/system/dark)
- **Doel:** Thema light, system of dark.
- **Voor wie (rol):** Chauffeur.
- **Trigger / entry point:** set-dark-pref data-pref; state.darkMode; toegepast op document/root.
- **Verwacht gedrag:** state.darkMode; CSS/theme volgt voorkeur.
- **Huidige implementatie:**
  - Bestaat: ja
  - Locatie (bestand(en)): public/state.js (darkMode), public/app.js (set-dark-pref), public/index.html (dark-mode-options).
- **Bewijs:** handmatig
- **Status:** OK
- **Opmerkingen:** —

### Toast-meldingen
- **Doel:** Korte feedback (succes/fout) na acties.
- **Voor wie (rol):** Chauffeur.
- **Trigger / entry point:** showToast(message, type); toast-container, dismiss-toast.
- **Verwacht gedrag:** Toast zichtbaar; verdwijnt of sluit via close.
- **Huidige implementatie:**
  - Bestaat: ja
  - Locatie (bestand(en)): public/index.html (toast-container), public/ui.js (showToast, dismissToast), public/services.js (toast()).
- **Bewijs:** handmatig
- **Status:** OK
- **Opmerkingen:** —

### Onboarding (eerste keer)
- **Doel:** Eénmalige korte uitleg op parkeerkaart.
- **Voor wie (rol):** Chauffeur.
- **Trigger / entry point:** onboarding-overlay; data-action="dismiss-onboarding".
- **Verwacht gedrag:** Na eerste keer tonen; na "Begrepen" niet meer (persistentie afhankelijk van implementatie).
- **Huidige implementatie:**
  - Bestaat: ja
  - Locatie (bestand(en)): public/index.html (onboarding-overlay), public/app.js (dismiss-onboarding), E2E dismiss-onboarding.
- **Bewijs:** E2E klikt dismiss indien zichtbaar.
- **Status:** OK
- **Opmerkingen:** —

### Geen kentekens-hint (kaart)
- **Doel:** Als gebruiker geen kentekens heeft, hint tonen met optie om kenteken toe te voegen.
- **Voor wie (rol):** Chauffeur.
- **Trigger / entry point:** state.plates.length === 0 → no-plates-hint zichtbaar; data-action="open-overlay" data-target="modal-add-plate".
- **Verwacht gedrag:** Tekst + knop "Kenteken toevoegen".
- **Huidige implementatie:**
  - Bestaat: ja
  - Locatie (bestand(en)): public/index.html (no-plates-hint), public/ui.js (renderParkingView).
- **Bewijs:** handmatig
- **Status:** OK
- **Opmerkingen:** —

### Sluiten overlays (backdrop / close)
- **Doel:** Overlays/sheets sluiten bij klik op backdrop of sluit-knop.
- **Voor wie (rol):** Chauffeur.
- **Trigger / entry point:** data-action="close-overlay"; overlay-backdrop; btn-zone-close (sheet-zone).
- **Verwacht gedrag:** activeOverlay null; overlay verborgen.
- **Huidige implementatie:**
  - Bestaat: ja
  - Locatie (bestand(en)): public/app.js (close-overlay, backdrop click), public/index.html (data-action="close-overlay", data-testid="btn-zone-close").
- **Bewijs:** E2E: sheet sluit na btn-zone-close.
- **Status:** OK
- **Opmerkingen:** Capture-phase en data-close/close-overlay volgens 30_CLICK_HANDLERS.

---

## 9. Data en persistentie

### State alleen via State.update
- **Doel:** Geen directe mutatie van state; alle wijzigingen via State.update(changes) voor voorspelbare UI-updates.
- **Voor wie (rol):** Ontwikkelaar / systeem.
- **Trigger / entry point:** WORKING_RULES.md en ARCHITECTURE.md; state.js update().
- **Verwacht gedrag:** Geen State.get.x = ...; wijzigingen via update().
- **Huidige implementatie:**
  - Bestaat: ja
  - Locatie (bestand(en)): public/state.js (update, Object.assign), docs/WORKING_RULES.md.
- **Bewijs:** geen (conventie).
- **Status:** OK
- **Opmerkingen:** —

### Sessie naar Firestore (sessions + transactions)
- **Doel:** Start: actieve sessie in Firestore 'sessions'; einde: sessie op 'ended', afgeronde sessie in 'transactions' voor historie en facturatie.
- **Voor wie (rol):** Chauffeur (en backend/rapportage).
- **Trigger / entry point:** handleStartParking schrijft naar sessions; handleEndParking update sessions.doc + transactions.add.
- **Verwacht gedrag:** sessions met status active/ended; transactions met userId, zone, plate, start, end, cost, endedAt.
- **Huidige implementatie:**
  - Bestaat: ja
  - Locatie (bestand(en)): public/services.js (handleStartParking db.collection('sessions').add; handleEndParking sessions.doc.update, transactions.add).
- **Bewijs:** handmatig / Firestore inspectie
- **Status:** OK
- **Opmerkingen:** —

### Kentekens sync (userPlates in Firestore)
- **Doel:** Kentekens van gebruiker in Firestore users-doc (userPlates) voor meerdere apparaten.
- **Voor wie (rol):** Chauffeur.
- **Trigger / entry point:** saveNewPlate, deletePlate, updatePlate, setDefaultPlate → syncUserPlatesToFirestore; fetchDriverSettings/onSnapshot vult state.plates.
- **Verwacht gedrag:** Plates lokaal en in Firestore in sync; adminPlates apart (fleet).
- **Huidige implementatie:**
  - Bestaat: ja
  - Locatie (bestand(en)): public/services.js (syncUserPlatesToFirestore, removeUserPlateFromFirestore, fetchDriverSettings).
- **Bewijs:** handmatig
- **Status:** OK
- **Opmerkingen:** —

---

## 10. PWA

### Service Worker en offline
- **Doel:** PWA installeren en basis offline-ondersteuning.
- **Voor wie (rol):** Chauffeur.
- **Trigger / entry point:** index.html registreert /sw.js; offline.html bij offline.
- **Verwacht gedrag:** SW geregistreerd; caching volgens sw.js.
- **Huidige implementatie:**
  - Bestaat: ja
  - Locatie (bestand(en)): public/index.html (serviceWorker.register), public/sw.js, public/offline.html.
- **Bewijs:** handmatig
- **Status:** OK
- **Opmerkingen:** —

### Manifest en installatie
- **Doel:** App installeren als PWA (homescreen, standalone).
- **Voor wie (rol):** Chauffeur.
- **Trigger / entry point:** manifest.webmanifest; theme-color, icons; optioneel install-gate (iOS).
- **Verwacht gedrag:** Install prompt / Add to Home Screen; app werkt standalone.
- **Huidige implementatie:**
  - Bestaat: ja
  - Locatie (bestand(en)): public/manifest.webmanifest, public/index.html (meta, icons), public/ui.js (install-gate voor iOS).
- **Bewijs:** handmatig
- **Status:** OK
- **Opmerkingen:** screens_overview noemt "Install Gate" voor iOS.

---

## 11. E2E-bewezen flows

### Proof: map → zone sheet → duration plus → close → menu → logout
- **Doel:** Bewijs dat kernflow zichtbaar en bedienbaar is (map, zone, sheet, duration, sluiten, menu, uitloggen).
- **Voor wie (rol):** QA / gate voor human review.
- **Trigger / entry point:** npm run test:e2e:proof; scripts/e2e-proof.mjs.
- **Verwacht gedrag:** 1) Navigate BASE_URL. 2) Login indien view-login. 3) #view-map en map-root visible. 4) Zone marker klik of E2E-seed; sheet-zone visible. 5) duration-value voor/na. 6) Klik btn-zone-plus; duration verandert. 7) Klik btn-zone-close; sheet niet meer open. 8) Menu open; side-menu en menu-item-parking visible. 9) Logout; #view-login visible. Artifacts: trace, video, screenshots.
- **Huidige implementatie:**
  - Bestaat: ja
  - Locatie (bestand(en)): scripts/e2e-proof.mjs, public/index.html (data-testid map-root, sheet-zone, duration-value, btn-zone-plus, btn-zone-close, btn-menu-open, side-menu, menu-item-parking, btn-logout).
- **Bewijs:** E2E (headed in niet-CI).
- **Status:** OK
- **Opmerkingen:** Start/stop parkeersessie wordt niet in E2E gedaan; wel zone-sheet en duration-wijziging.

---

## 12. Rollen (PWA)

### Rol: Chauffeur (driver)
- **Doel:** Enige gebruikersrol in de PWA; alle hierboven beschreven functionaliteiten zijn voor de chauffeur.
- **Voor wie (rol):** Chauffeur.
- **Trigger / entry point:** Inloggen met e-mail/wachtwoord; ensureAppUser schrijft role (invite of default 'driver').
- **Verwacht gedrag:** Toegang tot kaart, sessies, kentekens, historie, favorieten, notificaties; driverSettings (allowedDays, allowedTimeStart/End) kunnen parkeren beperken.
- **Huidige implementatie:**
  - Bestaat: ja
  - Locatie (bestand(en)): public/services.js (ensureAppUser, driverSettings in handleStartParking), docs/MASTER.md (chauffeurs).
- **Bewijs:** handmatig
- **Status:** OK
- **Opmerkingen:** Fleet Manager / Admin zijn in portal/ (separate app); vallen buiten deze PWA-functionalities canon.

---

## 13. Overige / randgevallen

### Daypass-zone bevestiging
- **Doel:** Bij zone met dagkaart extra bevestiging voordat sessie start.
- **Voor wie (rol):** Chauffeur.
- **Trigger / entry point:** start-session detecteert daypass → modal-confirm-daypass; daarna modal-confirm-start met daypass-noot; confirm-start-daypass / confirm-start-session.
- **Verwacht gedrag:** Twee stappen: daypass-modal → confirm-start met notitie.
- **Huidige implementatie:**
  - Bestaat: ja
  - Locatie (bestand(en)): public/app.js (start-session daypass-branch, confirm-start-daypass), public/index.html (modal-confirm-daypass).
- **Bewijs:** handmatig
- **Status:** OK
- **Opmerkingen:** —

### Automatisch einde sessie (eindtijd bereikt)
- **Doel:** Bij count-down 0:00 sessie automatisch beëindigen en notificatie.
- **Voor wie (rol):** Chauffeur.
- **Trigger / entry point:** Timer-ticker in ui.js; bij end <= now handleAutoEndSession aanroepen (indien geïmplementeerd).
- **Verwacht gedrag:** session op null; notificatie sessionEndedByUser of sessionEndedByMaxTime.
- **Huidige implementatie:**
  - Bestaat: deels
  - Locatie (bestand(en)): public/services.js (handleAutoEndSession); aanroep vanuit timer-logica moet in ui.js/app gecontroleerd worden.
- **Bewijs:** handmatig
- **Status:** DEELS
- **Opmerkingen:** PRODUCT_ANALYSIS: "Bij verlopen sessie (count-down 00:00) stopt alleen de weergave; er is geen automatische afhandeling". handleAutoEndSession bestaat; koppeling aan timer-einde niet in scope gecontroleerd.

### Faciliteiten (P+R/garages) in buurt
- **Doel:** Nabijgelegen faciliteiten (niet straatparkeren) tonen; optioneel bezetting.
- **Voor wie (rol):** Chauffeur.
- **Trigger / entry point:** loadFacilities, updateNearbyFacilities, nearbyFacilitiesRadiusKm, sheet-facilities; fetchFacilityOccupancies.
- **Verwacht gedrag:** state.facilities, state.nearbyFacilities; UI afhankelijk van features.
- **Huidige implementatie:**
  - Bestaat: deels
  - Locatie (bestand(en)): public/services.js (loadFacilities, updateNearbyFacilities, getNearbyFacilities, fetchFacilityOccupancies).
- **Bewijs:** handmatig
- **Status:** DEELS
- **Opmerkingen:** Infrastructuur in services aanwezig; volledige UI-flow (sheet-facilities, markers) niet in deze audit gevalideerd.

---

## Samenvatting status

| Categorie           | OK | DEELS | ONTBREEKT |
|---------------------|----|-------|-----------|
| Authenticatie       |  4 |     2 |         0 |
| Kaart en zones      |  7 |     0 |         0 |
| Parkeersessies      |  8 |     0 |         0 |
| Kentekens           |  7 |     0 |         0 |
| Parkeerhistorie     |  4 |     0 |         0 |
| Favorieten          |  2 |     0 |         0 |
| Notificaties        |  2 |     1 |         0 |
| UI en navigatie     |  9 |     0 |         0 |
| Data en persistentie|  3 |     0 |         0 |
| PWA                 |  2 |     0 |         0 |
| E2E                 |  1 |     0 |         0 |
| Rollen              |  1 |     0 |         0 |
| Overige             |  1 |     2 |         0 |

**Totaal:** OK 51, DEELS 5, ONTBREEKT 0.

*Dit document wijzigt geen bestaande code. Bij onduidelijkheid is gekozen voor DEELS of feitelijke beschrijving.*
