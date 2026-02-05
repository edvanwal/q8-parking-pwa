# API-keys en beveiliging (firebase-config.js)

## Feit

- `firebase-config.js` bevat de **Firebase client config** (apiKey, authDomain, projectId, …) en optioneel **Google Maps API key** en **VAPID** voor push.
- Voor client-apps is het normaal dat deze keys in de repo staan. Beveiliging zit in **Firestore Rules** en in **API-key-restricties** in Google Cloud Console.

## Aanbevelingen (uit te voeren in Google Cloud Console)

1. **Firebase API-key**
   - Google Cloud Console → APIs & Services → Credentials → de API-key die in `firebaseConfig.apiKey` staat.
   - Stel **Application restrictions** in (bijv. "HTTP referrers") en voeg alleen je hosting-domeinen toe, bijv.:
     - `https://q8-parking-pwa.web.app/*`
     - `https://q8-parking-pwa.firebaseapp.com/*`
     - `http://localhost:*` (voor lokaal testen)

2. **Google Maps API-key** (als gebruikt)
   - Zelfde principe: restricties op de Maps JavaScript API-key, met dezelfde HTTP referrers.
   - Zie ook: [ROOT_CAUSE_KAART_NIET_ZICHTBAAR.md](./ROOT_CAUSE_KAART_NIET_ZICHTBAAR.md).

3. **Geen server-secrets in firebase-config.js**
   - Geen wachtwoorden, geen private keys, geen Firebase Admin SDK keys in dit bestand.
   - **VAPID:** Als je later een VAPID-key invult voor push, overweeg deze via build/env te injecteren in productie; anders blijft deze in de repo (client-side push is gebruikelijk).

## Samenvatting

- Deploy vanuit `public/`; de config daar is gelijk aan root (sync).
- Beveiliging: Firestore Rules + API-key-restricties in GCP; geen gevoelige server-secrets in de client-config.
