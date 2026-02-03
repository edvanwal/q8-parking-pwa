# Code-analyse en opschoning – Q8 Parking PWA

Grondige analyse van de codebase: mogelijke problemen, conflicten, opschoning en best practices.

---

## 1. Samenvatting

| Categorie | Aantal | Ernst |
|-----------|--------|--------|
| Mogelijke bugs / ontbrekende functionaliteit | 3 | Medium |
| Inconsistenties (i18n, exports) | 4 | Laag |
| Dubbele / dode code | 4 | Laag |
| Best-practice verbeteringen | 6 | Info |
| Opschoning (DRY, legacy) | 5 | Laag |

---

## 2. Mogelijke problemen en conflicten

### 2.1 Root vs. public – services.js niet gesynchroniseerd

- **Feit:** `scripts/sync-to-public.js` kopieert **niet** `services.js` ("public has portal/fleet integration").
- **Gevolg:** Twee varianten: root (eenvoudiger) en public (portal, fleet, extra integraties).
- **Status – opgelost:** In root is `syncNotificationSettingsToFirestore` toegevoegd en geëxporteerd. Notificatie-instellingen worden daarmee ook lokaal (root) naar Firestore weggeschreven (`users/{uid}.notificationSettings`). Het gedrag is gelijk aan de public-build voor deze functionaliteit.
- **Aanbeveling (blijft):** Bij wijzigingen aan services bewust zijn dat root en public kunnen divergeren; voor notificatie-sync is parity bereikt.

### 2.2 Muteerbare state-referentie

- **Feit:** `Q8.State` geeft `get: _state` terug – dezelfde objectreferentie.
- **Risico:** Iets als `S.get.plates.push(...)` of `S.get.zones = []` zou state buiten `S.update()` om wijzigen en de UI niet updaten; ook lastiger te debuggen.
- **Huidige situatie:** Er is nergens directe mutatie van `S.get.zones`/`plates`/`session` gevonden; overal wordt `S.update()` gebruikt.
- **Status – opgelost:** De regel is vastgelegd in **WORKING_RULES.md** (sectie State Management) en in **ARCHITECTURE.md** (state.js): state mag alleen via `State.update()` gewijzigd worden; directe mutatie van `State.get` is verboden.

### 2.3 Firestore-rules – dubbele aanroep `userDoc()`

- **Feit:** In `firestore.rules` roepen `userRole()` en `userTenantId()` elk `userDoc()` aan; bij gebruik van beide (bijv. in één rule) levert dat meerdere reads op.
- **Impact:** Kleine performance-kosten; geen security-issue.
- **Status – opgelost:** De rules zijn herschreven: per rule-evaluatie wordt `userDoc()` nog maar één keer aangeroepen via `let doc = userDoc();`. Helpers `roleFromDoc(doc)`, `tenantIdFromDoc(doc)` en `isFleetManagerFromDoc(doc)` gebruiken die ene `doc`; er zijn geen aparte `userRole()`/`userTenantId()` meer die elk opnieuw `userDoc()` aanroepen.

### 2.4 Notificatie-sync en Firestore-rules

- **Feit:** `public/services.js` schrijft `notificationSettings` naar `users/{uid}` met `.update()`. Firestore-rules staan `write` toe als `request.auth.uid == userId`.
- **Conclusie:** Dit is correct; geen wijziging nodig.

---

## 3. Inconsistenties

### 3.1 Toasts in het Engels in services.js

Veel gebruikerszichtbare strings in `services.js` zijn alleen in het Engels, terwijl elders wel NL/EN wordt gebruikt:

- "You already have an active parking session."
- "Select a parking zone first."
- "Open a zone to start parking."
- "Parking session started"
- "Parking session ended"
- "Default plate updated"
- "Please enter a license plate", "License plate already exists", etc.

**Aanbeveling:** Overal waar de taal van de gebruiker relevant is, het patroon `S.get.language === 'nl' ? '...' : '...'` gebruiken (zoals al bij o.a. `addNotification`).

### 3.2 Dubbele toast-helper in services.js

Op veel plekken wordt lokaal een `toast`-functie gedefinieerd:

```js
const toast = (msg) => {
  if (Q8.UI && Q8.UI.showToast) Q8.UI.showToast(msg);
  else if (typeof window.showToast === 'function') window.showToast(msg);
};
```

**Aanbeveling:** Eén keer bovenaan de module een `toast(msg, type)` helper definiëren en overal hergebruiken. Eventueel daar ook i18n voor standaardberichten centraal afhandelen.

### 3.3 Legacy fallbacks (window.updateUI, window.showToast, etc.)

- **Feit:** `state.js` roept na `Q8.UI.update()` nog `window.updateUI()` aan als fallback. In `services.js` en elders wordt vaak `Q8.UI.showToast(...) || window.showToast(...)` gebruikt.
- **Conclusie:** De app draait op `Q8.UI`; de window-fallbacks zijn legacy.
- **Aanbeveling:** Stapsgewijs alle aanroepen naar `Q8.UI.update` en `Q8.UI.showToast` laten wijzen, daarna de toewijzingen in `ui.js` (`window.updateUI = ...`, etc.) en de fallbacks in `state.js`/`services.js` verwijderen. Eerst controleren dat nergens nog rechtstreeks `window.showToast` wordt gebruikt (bijv. vanuit HTML of andere scripts).

### 3.4 state.js – comment typo

- **Regel 12:** `// 'login' | 'register' | 'parking' | 'history' | 'plates' | 'notifications' | 'car-specs' | 'car-specs'`
- **Fix:** Tweede `'car-specs'` verwijderen of vervangen door het ontbrekende scherm (bijv. `'favorites'` als dat de bedoeling is).

---

## 4. Dubbele en dode code

### 4.1 Twee service worker-bestanden

- **service-worker.js** (root): Oude variant (cache voor o.a. `style.css`, `mock_parking.json`).
- **sw.js** (root + public): Actieve variant (geregistreerd in `index.html`: `/sw.js`), met o.a. push-notifications.
- **Conclusie:** Alleen `sw.js` wordt gebruikt; `service-worker.js` is dode code.
- **Aanbeveling:** `service-worker.js` verwijderen of hernoemen naar bijv. `service-worker.js.legacy` en in README of docs vermelden dat alleen `sw.js` de actieve PWA-SW is.

### 4.2 app_recovery.js

- Groot bestand (~2400 regels), eigen state/logica, Firebase en Maps init.
- Doel lijkt recovery/debug (o.a. "Hard Reset", debug console).
- **Aanbeveling:** Duidelijk maken of dit nog in gebruik is. Zo niet: verplaatsen naar een `legacy/` of `dev-tools/` map of uit de hoofdflow halen. Zo wel: kort in `docs/` documenteren wanneer en hoe het wordt gebruikt.

### 4.3 services_mock.js

- Bevat o.a. `calculateParkingCost` en gebruikt `module.exports` (Node-stijl).
- Geschikt voor Node-tests; niet voor de browser-bundle.
- **Aanbeveling:** Behouden voor tests; in README of test-docs vermelden dat dit voor Node (bijv. `tests/`) is. Eventueel dezelfde berekening als in `utils.js` (Q8.Utils.calculateCost) gebruiken om dubbele logica te vermijden.

### 4.4 Duplicatie root ↔ public

- Veel bestanden bestaan zowel in root als in `public/` (app, state, ui, utils, design-system, index.html, …).
- `sync-to-public.js` houdt een subset daarvan in sync; `services.js` bewust niet.
- **Aanbeveling:** Voor deploy altijd `sync-to-public.js` (of equivalent) vóór deploy draaien. In CI/CD vastleggen: "Deploy vanuit `public/`; build/sync-stap gebruikt deze script."

---

## 5. Best practices

### 5.1 Foutafhandeling

- **app.js:** `handleClick` heeft een try/catch; fouten worden gelogd.
- **services.js:** Veel `catch`-blokken loggen alleen of doen niets; geen centrale error-reporting of gebruikersfeedback.
- **Aanbeveling:** Voor kritieke paden (auth, start/stop parkeren, Firestore-writes) bij fout een duidelijke toast of melding tonen. Optioneel een centrale `reportError(err, context)` die logt en (in productie) naar een logging-service kan sturen.

### 5.2 API-keys (firebase-config.js)

- **Feit:** `firebaseConfig` (inclusief `apiKey`) staat in de repo. Voor Firebase-client-apps is dat gebruikelijk; beveiliging zit in Firestore-rules en API-key-restricties in Google Cloud.
- **Aanbeveling:** In Google Cloud Console voor deze API-key restricties instellen (HTTP referrers voor hosting-domeinen). Geen secrets in dezelfde config; eventueel VAPID/gevoelige keys via environment/build injecteren waar mogelijk.

### 5.3 Q8.Utils.calculateCost vs. services

- **Feit:** In `services.js` wordt `U.calculateCost` gebruikt (met fallback `(durationMins/60)*hourlyRate`). In docs wordt `Q8.Utils.calculateCost` genoemd.
- **Conclusie:** Consistente gebruik van `U.calculateCost` (U = Q8.Utils) is correct; geen wijziging nodig, behalve documentatie consistent houden.

### 5.4 Timer en handleAutoEndSession

- **ui.js:** `updateActiveTimerDisplay` roept bij max duration `handleAutoEndSession('sessionEndedByMaxTime')` aan en bij countdown 0 `handleAutoEndSession('sessionEndedByUser')`.
- De parameter `'sessionEndedByUser'` betekent hier "eindtijd bereikt" (automatisch), niet "gebruiker heeft op beëindigen geklikt". In `handleAutoEndSession` wordt het wel correct gebruikt voor de notificatietekst ("automatically ended (end time reached)").
- **Aanbeveling:** Optioneel de parameter hernoemen naar iets als `'sessionEndedByEndTime'` om verwarring te voorkomen; of in een comment in ui.js uitleggen dat "User" hier "eindtijd-flow" betekent.

### 5.5 Zones limit 2000

- **services.js:** `db.collection('zones').limit(2000).onSnapshot(...)`
- Bij meer dan 2000 zones worden niet alle zones geladen. Firestore-kosten en performance zijn wel begrensd.
- **Aanbeveling:** Limit en eventueel paginatie of filter (bijv. regio) documenteren; bij groei van het aantal zones beleid bepalen (verhogen, filteren, of backend-aggregatie).

### 5.6 Toegankelijkheid en ARIA

- **Feit:** Er is een skip link, role="application", en enkele ARIA-attributen. Formulieren en overlays kunnen verder versterkt worden (labels, focus trap, aria-live voor toasts).
- **Aanbeveling:** Stapsgewijs verbeteren volgens `directives/ui-parking-pwa.md` en standaard accessibility-checklist (focus, labels, contrast).

---

## 6. Opschoning – actiepunten

| Prioriteit | Actie |
|------------|--------|
| Hoog | **state.js:** Comment bij `screen` corrigeren (dubbele 'car-specs' / ontbrekende waarde). |
| — | ~~**Root services.js:** `syncNotificationSettingsToFirestore` implementeren + exporteren~~ → **Opgelost.** |
| Medium | **services.js:** Eén centrale `toast(msg, type)` helper; alle lokale `toast`-definities vervangen. |
| Medium | **services.js:** Alle gebruikerszichtbare toasts i18n geven (NL/EN op basis van `S.get.language`). |
| Laag | **service-worker.js:** Verwijderen of hernoemen naar `.legacy` en in docs vermelden. |
| Laag | **Legacy:** Na controle alle `window.updateUI` / `window.showToast` fallbacks verwijderen en alleen Q8.UI gebruiken. |
| Laag | **app_recovery.js:** Doel en gebruik documenteren of verplaatsen naar legacy/dev-tools. |

---

## 7. Architectuur – nog steeds geldig

De verdeling uit `ARCHITECTURE.md` klopt nog steeds:

- **app.js:** Entry, event routing, click handling.
- **services.js:** Business logic, Firebase, auth, parking, plates, overlays.
- **state.js:** Centrale state, persistence (localStorage), theme.
- **ui.js:** Renderen, map, timers, toasts.
- **utils.js:** calculateCost, getFilteredHistory, export CSV/print.

Geen grote refactor nodig; de genoemde punten zijn vooral verbeteringen en consistentie.

---

## 8. Volgende stappen (aanbevolen volgorde)

1. Comment in `state.js` corrigeren (eenmalige wijziging).
2. ~~Notificatie-sync in root~~ – gedaan: functie toegevoegd en geëxporteerd.
3. Centrale toast-helper in services en i18n voor toasts (in kleine stappen).
4. Service worker opruimen (oude bestand) en legacy window-fallbacks na controle verwijderen.
5. Optioneel: error handling en accessibility verder uitwerken in aparte taken.

Als je wilt, kan ik de concrete code-aanpassingen voor punt 1 en 2 (state.js + services.js) voor je uitschrijven.
