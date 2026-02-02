# Sync-architectuur en dubbele bestanden

## Overzicht

- **Root** = development source (waar je ontwikkelt)
- **public/** = deploy target (Firebase Hosting)

## Syncing

Voer vóór deploy uit:

```bash
npm run sync
```

Of in één keer:

```bash
npm run deploy
```

Het script `scripts/sync-to-public.js` kopieert deze bestanden van root naar public:

- app.js, state.js, ui.js, utils.js
- design-system.css
- index.html
- firebase-config.js, kenteken.js, manifest.webmanifest, sw.js

## Aanbevolen workflow

1. Bewerk bestanden in de **root**
2. Test lokaal (root of public)
3. `npm run sync` voordat je deployt
4. `firebase deploy` of `npm run deploy`

**Let op:** `services.js` wordt niet gesynchroniseerd; de public-versie bevat portal/fleet-integratie (ensureAppUser, adminPlates, userPlates).
