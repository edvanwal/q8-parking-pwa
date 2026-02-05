# Productbeslissingen – DEELS-functionaliteiten

**Doel:** Expliciete productbeslissing per functionaliteit met status DEELS uit [FUNCTIONALITIES_CANON.md](FUNCTIONALITIES_CANON.md).  
**Rol:** Productmanager / kwaliteitsverantwoordelijke.  
**Datum:** februari 2026.

---

## Registreren (nieuw account)

**Huidige status:** DEELS

- **Wat werkt:** Account aanmaken in Firebase Auth met e-mail en wachtwoord (createUserWithEmailAndPassword). Na registratie wordt gebruiker ingelogd en naar parkeerkaart gestuurd. Scherm view-register met link vanaf login en knop REGISTER is aanwezig en functioneel voor de Auth-flow.
- **Wat niet / onzeker is:** Velden "First name", "Last name", "Mobile number", "Number of Liberty card" en "Confirm password" staan in de UI maar worden niet naar Firebase of Firestore gestuurd. Geen validatie van confirm password; geen opslag van profielgegevens in users-document.

**Productbeslissing:**

- **KEUZE:** AFRONDEREN

**Motivatie:** Registratie is de eerste indruk en basis voor fleet/tenant-beheer. Onvolledige velden wekken de indruk dat gegevens worden opgeslagen terwijl dat niet zo is (vertrouwen, AVG). Liberty-kaart en telefoon zijn relevant voor B2B-parkeren. Afronden beperkt risico op verkeerde verwachtingen en maakt toekomstige integratie (Fleet Manager, facturatie) eenvoudiger.

**Actie (alleen als AFRONDEREN):**

- **Wat moet gebeuren:** Bij REGISTER: (1) e-mail en wachtwoord blijven naar Firebase Auth; (2) confirm password client-side valideren (gelijk aan password); (3) na succesvolle Auth-aanmaak profielgegevens (displayName uit first+last, optioneel telefoon, Liberty-kaartnummer) in Firestore users-doc opslaan indien beschikbaar; (4) ofwel de overige velden uitlezen en meesturen, ofwel de UI terugbrengen tot alleen e-mail/wachtwoord/confirm en in documentatie vastleggen dat uitgebreide registratie later komt.
- **Acceptatiecriteria:**
  - Gebruiker kan account aanmaken met e-mail + wachtwoord; bij ongelijk confirm password duidelijke foutmelding.
  - Na registratie bestaat Firestore users-doc met minimaal email (en door Auth gegenereerde uid); indien gekozen voor uitgebreide flow: displayName, en optioneel phone/Liberty-card indien ingevuld, opgeslagen.
  - Geen console-errors bij registratie; na registratie is gebruiker op view-map.
- **Bewijs:** Handmatig (registratie-flow doorlopen, Firestore users-doc controleren). Optioneel later: E2E voor "register → map" als registratie in scope blijft.

---

## Remember me (30 dagen)

**Huidige status:** DEELS

- **Wat werkt:** Checkbox "Remember me for 30 days" op het inlogscherm (data-action="toggle-remember"); state.rememberMe en state.rememberMeUntil bestaan in state.js; UI reageert op toggle.
- **Wat niet / onzeker is:** Auth-sessie wordt niet daadwerkelijk 30 dagen verlengd of lokaal bewaard. Firebase Auth persistence (local/session) is standaard; er is geen expliciete koppeling tussen de checkbox en persistent session / custom expiry. Gebruiker ziet de optie maar merkt geen verschil in gedrag.

**Productbeslissing:**

- **KEUZE:** ACCEPTEREN

**Motivatie:** Kernflow is inloggen en parkeren; "remember me" is comfort, geen blokker. Implementatie van echte 30-dagen-persistentie vergt keuzes (Firebase persistent session vs. custom token/refresh) en security-review. Risico is laag: alleen verwarring waarom de checkbox geen effect heeft. Waarde van afronden weegt niet op tegen prioriteit voor parkeerflow en historie. Bewust zo laten tot er expliciete vraag naar "ingelogd blijven" is.

---

## Push / FCM-token

**Huidige status:** DEELS

- **Wat werkt:** Bij notification permission granted wordt FCM-token opgehaald en in Firestore users-doc opgeslagen (fcmToken, fcmTokenUpdatedAt). requestPushNotificationPermission en initFCMAndSaveToken zijn geïmplementeerd; token is beschikbaar voor backend/Cloud Functions.
- **Wat niet / onzeker is:** Daadwerkelijke push-afhandeling (berichten tonen bij sessie-einde, bijna verlopen, etc.) en het triggeren van push vanaf backend vallen buiten de PWA-frontend. Gebruiker kan toestemming geven en token wordt opgeslagen, maar of er ooit pushberichten worden verstuurd hangt af van (niet in canon geauditeerde) backend/Cloud Messaging.

**Productbeslissing:**

- **KEUZE:** ACCEPTEREN

**Motivatie:** PWA-leverantie is "token klaarzetten voor push"; afleveren van echte push is een aparte backend/ops-feature. Waarde zit in voorbereiding; risico is beperkt (geen misleiding: notificatie-instellingen bestaan, gebruiker kan aan/uit zetten). Volledig afronden (versturen + tonen) valt buiten huidige productscope; expliciet accepteren dat "FCM-token opslaan" voldoende is voor nu.

---

## Automatisch einde sessie (eindtijd bereikt)

**Huidige status:** DEELS

- **Wat werkt:** handleAutoEndSession(reason) in services.js bestaat: zet session op null, roept S.save() aan, toont notificatie (sessionEndedByUser of sessionEndedByMaxTime). Timer in de UI toont count-down tot 0:00.
- **Wat niet / onzeker is:** De aanroep van handleAutoEndSession vanuit de timer-logica (wanneer end <= now) is in de canon niet gecontroleerd. PRODUCT_ANALYSIS meldde: "Bij verlopen sessie stopt alleen de weergave; er is geen automatische afhandeling." Onduidelijk of bij 0:00 de sessie daadwerkelijk wordt beëindigd (state + localStorage + eventueel Firestore) en de actieve kaart verdwijnt.

**Productbeslissing:**

- **KEUZE:** AFRONDEREN

**Motivatie:** Bij vaste parkeertijd verwacht de chauffeur dat de sessie automatisch stopt; anders blijft "actieve parkeerkaart" zichtbaar terwijl de sessie feitelijk is afgelopen (verwarring, mogelijke aansprakelijkheid). Lage implementatie-inspanning (één aanroep vanuit timer-ticker), hoge gebruikersimpact en risicoreductie.

**Actie (alleen als AFRONDEREN):**

- **Wat moet gebeuren:** In de timer-ticker (ui.js of plek waar updateActiveTimerDisplay / startTimerTicker draait): zodra session.end bestaat en end <= now, handleAutoEndSession aanroepen met passende reason (sessionEndedByMaxTime of sessionEndedByUser). Firestore-sessie op "ended" zetten en transaction aanmaken (zoals bij handmatig END PARKING), zodat historie en facturatie kloppen.
- **Acceptatiecriteria:**
  - Bij een sessie met vaste eindtijd: wanneer de count-down 0:00 bereikt, wordt binnen enkele seconden de actieve parkeerkaart verwijderd, session is null, en in-app notificatie (en indien ingesteld push) meldt dat de sessie is beëindigd.
  - In parkeerhistorie verschijnt de sessie met correcte eindtijd en kosten; Firestore transactions bevat een document voor deze sessie.
  - Geen oneindige timer of dubbele "end"-actie.
- **Bewijs:** Handmatig (sessie starten met korte vaste duur, wachten tot 0:00, controleren op verdwijnen kaart + notificatie + historie). Optioneel: E2E met mock time om 0:00 te bereiken.

---

## Faciliteiten (P+R/garages) in buurt

**Huidige status:** DEELS

- **Wat werkt:** loadFacilities, updateNearbyFacilities, getNearbyFacilities, fetchFacilityOccupancies en state (nearbyFacilities, facilities, facilityOccupancy) bestaan in services.js. Infrastructuur om faciliteiten te laden en op afstand te filteren is aanwezig; SPDP/bezetting kan worden geparsed.
- **Wat niet / onzeker is:** Volledige UI-flow (sheet-facilities, markers op kaart, duidelijke "in de buurt"-weergave voor chauffeur) is in de canon niet gevalideerd. Onduidelijk of de chauffeur P+R/garages daadwerkelijk ziet en kan gebruiken in de huidige release.

**Productbeslissing:**

- **KEUZE:** UIT SCOPE

**Motivatie:** Kernproduct is straatparkeren (zones, sessies, kentekens, historie). Garages en P+R zijn een uitbreiding (zie o.a. PLAN_GARAGES_P_R_NPROPENDATA). Waarde is "nice to have"; risico van half-afgeleverde UI (data wel, flow niet duidelijk) is verwarring. Bewust niet nu leveren: infrastructuur blijft staan voor later; geen verplichting om de volledige faciliteiten-flow in deze release af te ronden. Documenteer in BACKLOG of plan-doc dat "Faciliteiten in buurt (UI + flow)" expliciet later wordt opgepakt.

---

## Overzicht beslissingen

| Functionaliteit                         | KEUZE     | Actie |
|----------------------------------------|-----------|--------|
| Registreren (nieuw account)            | AFRONDEREN| Profiel/confirm afronden; acceptatiecriteria + handmatig bewijs. |
| Remember me (30 dagen)                  | ACCEPTEREN| Bewust zo laten. |
| Push / FCM-token                       | ACCEPTEREN| Token opslaan is voldoende; push-versturen later. |
| Automatisch einde sessie (eindtijd)    | AFRONDEREN| Timer → handleAutoEndSession + Firestore; acceptatiecriteria + handmatig bewijs. |
| Faciliteiten (P+R/garages) in buurt    | UIT SCOPE | Bewust niet leveren; infrastructuur blijft; plan in BACKLOG. |
| Onboarding: kenteken na eerste login   | TE BEPALEN| Wacht op productkeuze (verplicht vs. hint). |

*Na AFRONDEREN: FUNCTIONALITIES_CANON.md bijwerken (status DEELS → OK voor die items) en eventueel SYSTEM_STATUS.md.*

---

## Onboarding: na eerste login kenteken toevoegen

**Huidige status:** PRODUCTWENS (nieuw)

- **Wat Edwin ziet:** Nieuwe gebruiker logt in en komt op de kaart, maar kan niet parkeren omdat er nog geen kenteken is toegevoegd.
- **Wat gewenst is:** Na eerste login (wanneer plates leeg is) de gebruiker direct aansporen om een kenteken toe te voegen, zodat de parkeerflow meteen werkt.
- **Hoe te testen:** Login met nieuw account (geen kentekens), controleer of er een prompt/modal/stap verschijnt die vraagt om kenteken toe te voegen voordat de kaart wordt getoond of als eerste actie op de kaart.

**Productbeslissing:**

- **KEUZE:** TE BEPALEN

**Motivatie:** Nog geen besluit genomen. Optie 1: verplichte kenteken-stap na eerste login (modal/onboarding-stap). Optie 2: duidelijke hint op kaart (bestaat al: no-plates-hint) maar geen blokkering. Afweging: UX-frictie vs. voorkomen dat gebruiker vastloopt bij eerste parkeeractie.

**Actie:** Wacht op expliciete keuze van productverantwoordelijke.
