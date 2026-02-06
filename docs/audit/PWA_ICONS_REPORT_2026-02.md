# PWA Icons Report 2026-02

## Samenvatting

Alle ontbrekende PWA icon-bestanden zijn gegenereerd en toegevoegd aan `public/icons/`. Het manifest (`public/manifest.webmanifest`) is ongewijzigd. Alle 13 icon-referenties in het manifest hebben nu corresponderende bestanden.

## Gegenereerde icon-bestanden

| Bestand | Formaat | Doel |
|---------|---------|------|
| icon-48x48.png | 48×48 | Standaard icon |
| icon-72x72.png | 72×72 | Standaard icon |
| icon-96x96.png | 96×96 | Standaard icon |
| icon-144x144.png | 144×144 | Standaard icon |
| icon-168x168.png | 168×168 | Standaard icon |
| icon-192x192.png | 192×192 | Standaard icon |
| icon-256x256.png | 256×256 | Standaard icon |
| icon-384x384.png | 384×384 | Standaard icon |
| icon-512x512.png | 512×512 | Standaard icon |
| maskable-192x192.png | 192×192 | Maskable icon (10% safe zone) |
| maskable-512x512.png | 512×512 | Maskable icon (10% safe zone) |
| shortcut-parking.png | 96×96 | Shortcut icon |
| shortcut-history.png | 96×96 | Shortcut icon |

## Bron van het logo

- **Bestand:** `public/q8-logo.png`
- **Afmetingen:** 500×500 pixels
- **Generatiescript:** `scripts/generate-icons.js` (bestaand script, gebruikt `sharp`)

## Gedrag / UX veranderd?

**NEE**

- Geen wijzigingen aan manifest-structuur, namen of paden
- Geen wijzigingen aan teksten, kleuren, layout of flows
- Alleen ontbrekende assets toegevoegd die het manifest al verwachtte

## Kosten-impact

**Geen extra kosten**

- Geen nieuwe services of APIs
- Geen wijzigingen aan Firebase of hosting-configuratie
- Alleen statische bestanden toegevoegd

## Rollback-instructie

Verwijder de 13 icon-bestanden uit `public/icons/` en reset naar vorige commit.
