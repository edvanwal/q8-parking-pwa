# Root-cause analyse: kaart niet zichtbaar

## Symptoom
Op zowel localhost als de publieke URL (q8-parking-pwa.web.app) blijft het parkeerscherm leeg: header + zoekbalk zichtbaar, maar geen kaart en geen foutmelding.

## Geanalyseerde oorzaken

### 1. Kaart alleen geïnitialiseerd bij `setScreen('parking')`
- **Probleem:** De kaart werd alleen aangemaakt wanneer `setScreen('parking')` werd aangeroepen (na inloggen). Als de parking-view op een andere manier zichtbaar werd (bijv. state-update, race), werd `initGoogleMap()` nooit aangeroepen.
- **Oplossing:** In `renderParkingView()` wordt nu ook `initGoogleMap()` aangeroepen wanneer de kaart nog niet bestaat (`!map`), zodat de kaart altijd wordt geïnitialiseerd zodra het parkeerscherm wordt getoond.

### 2. Fallback-melding pas in `renderParkingView()`
- **Probleem:** De 2,5s-timeout voor "Kaart laadt niet" stond in `renderParkingView()`. Als ergens in die functie een fout optrad (bijv. `firebase.auth()` nog niet beschikbaar), werd de timeout nooit gezet en zag de gebruiker geen melding.
- **Oplossing:** De timeout wordt nu in `update()` gezet, direct wanneer `state.screen === 'parking'`, vóór de aanroep van `renderParkingView()`. Zo krijgt de gebruiker altijd na 2,5s een melding als de kaart niet is geladen.

### 3. Kaart eerder aangemaakt met 0×0 container
- **Eerder opgelost:** De kaart werd in `app.js` init aangemaakt terwijl het loginscherm nog actief was; de map-container had dan 0×0 px. De init-aanroep is uit `app.js` init gehaald; de kaart wordt alleen nog aangemaakt wanneer het parkeerscherm zichtbaar is (via `setScreen('parking')` en/of `renderParkingView()`).

## Huidige flow
1. Gebruiker opent app → loginscherm.
2. Gebruiker klikt SIGN IN → Firebase auth → `onAuthStateChanged` → `setScreen('parking')`.
3. `S.update({ screen: 'parking' })` → `UI.update()` → view-map zichtbaar, timeout 2,5s gezet, `renderParkingView()` → `initGoogleMap()` (als `!map`).
4. Maps-script laadt (async) → callback → `initGoogleMap()` opnieuw → `new google.maps.Map(container, …)` → kaart zichtbaar; timeout wordt geannuleerd.
5. Als de kaart na 2,5s nog niet bestaat → melding "De kaart laadt niet..." met link naar publieke website.

## Als de kaart nog steeds niet verschijnt
- Controleer in de browserconsole (F12) op fouten (netwerk, API-sleutel, CORS).
- Zorg dat in Google Cloud Console bij de Maps JavaScript API-sleutel de juiste HTTP-referrers staan (o.a. `https://q8-parking-pwa.web.app/*`, `http://localhost:*`).
- Controleer of "Maps JavaScript API" voor het project is ingeschakeld en of er een geldig facturatieaccount is.
