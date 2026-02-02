# Push-notificaties setup

De app stuurt echte push-notificaties via Firebase Cloud Messaging (FCM). Deze werken ook als de app gesloten is.

## Benodigde stappen

### 1. VAPID-sleutel genereren

1. Ga naar [Firebase Console](https://console.firebase.google.com)
2. Selecteer project **q8-parking-pwa**
3. Ga naar **Project Settings** (⚙️) → **Cloud Messaging**
4. Scroll naar **Web configuration** → **Web Push certificates**
5. Klik op **Generate key pair** als er nog geen sleutel is
6. Kopieer de **Key pair** (de lange string)

### 2. VAPID-sleutel in configuratie zetten

In `firebase-config.js` (en `public/firebase-config.js`) staat:

```javascript
messagingVapidKey: ""
```

Vervang de lege string door je VAPID-sleutel:

```javascript
messagingVapidKey: "Bxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

### 3. Cloud Functions deployen

```bash
cd functions
npm install
firebase deploy --only functions
```

Of vanuit de root:

```bash
npm run functions:install
npm run deploy:functions
```

## Welke meldingen worden verstuurd?

| Gebeurtenis | Wanneer | Tekst (voorbeeld) |
|-------------|---------|-------------------|
| **Parkeersessie gestart** | Bij aanmaken sessie in Firestore | Parkeersessie gestart · Zone 123 · AB-123-CD |
| **X minuten voor eindtijd** | 1× per sessie, X min voor einde | Parkeersessie verloopt over 10 minuten · Zone 123 · AB-123-CD |
| **Parkeersessie gestopt** | Gebruiker klikt op Stop | Parkeersessie gestopt · Zone 123 · AB-123-CD |

## Instellingen per gebruiker

Gebruikers kunnen in de app (Meldingen-scherm) aan/uit zetten voor elk type. De waarde "X minuten" voor "verloopt binnenkort" wordt naar Firestore gesynchroniseerd en gebruikt door de Cloud Function.

## Technische details

- **FCM-token**: Opgeslagen in `users/{uid}.fcmToken` na login
- **notificationSettings**: In `users/{uid}.notificationSettings` (sessionStarted, sessionExpiringSoon, sessionEndedByUser, expiringSoonMinutes)
- **Cloud Functions**: `onSessionCreated`, `onSessionUpdated`, en in `autoStopExpiredSessions` de expiring-soon push
