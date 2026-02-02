# PWA-installatie-instructies
## Q8 Parking – Android & iOS

---

## 1. Technisch overzicht

### Wat is een PWA?
Een Progressive Web App (PWA) is een website die als app geïnstalleerd kan worden. Na installatie:
- Opent de app in fullscreen (zonder browser-UI)
- Verschijnt als icoon op het startscherm
- Werkt offline (via Service Worker)
- Kan push-notificaties tonen

### Technische vereisten (al geïmplementeerd)
- **Manifest** (`manifest.webmanifest`): naam, iconen, kleuren
- **Service Worker** (`sw.js`): offline cache, push
- **HTTPS**: vereist voor PWA (Firebase Hosting biedt dit)
- **iOS meta tags**: `apple-mobile-web-app-capable`, `apple-touch-icon`, etc.
- **Android**: manifest wordt automatisch gelezen door Chrome

### Detectie in de app
- **`checkInstallMode()`** bepaalt of de install-gate getoond wordt
- **iOS**: touch + iOS + niet standalone → gate actief
- **Android**: momenteel geen gate (Chrome toont eigen install-banner)
- **`?forceInstall`** in de URL toont altijd de install-instructies

---

## 2. Wat moet de gebruiker doen? (volgorde)

### Algemeen
1. Open de website in de **juiste browser** (Safari op iOS, Chrome op Android)
2. Volg de platform-specifieke stappen om toe te voegen aan startscherm
3. Open de app via het nieuwe icoon
4. Log in en gebruik de app

---

## 3. iOS (iPhone / iPad) – stappen

**Browser:** Safari (Chrome op iOS kan niet installeren)

| Stap | Actie |
|------|-------|
| 1 | Open **https://q8-parking-pwa.web.app** in **Safari** |
| 2 | Tik op het **Deel-icoon** (vierkant met pijl omhoog) onderaan |
| 3 | Scroll naar beneden en tik op **"Zet op beginscherm"** (of "Add to Home Screen") |
| 4 | Eventueel de naam aanpassen (standaard: "Q8 Parking") |
| 5 | Tik op **"Voeg toe"** (rechtsboven) |
| 6 | Het icoon verschijnt op het beginscherm – tik erop om de app te openen |

**Let op:** Gebruik Safari, niet Chrome of andere browsers.

---

## 4. Android – stappen

**Browser:** Chrome (aanbevolen)

### Optie A: Installatiebanner (automatisch)
Chrome toont soms een banner: *"Q8 Parking toevoegen aan startscherm"*. Tik op **"Installeren"** of **"Toevoegen"**.

### Optie B: Via het menu (handmatig)
| Stap | Actie |
|------|-------|
| 1 | Open **https://q8-parking-pwa.web.app** in **Chrome** |
| 2 | Tik op het **⋮** menu (rechtsboven) |
| 3 | Tik op **"App installeren"** of **"Toevoegen aan startscherm"** |
| 4 | Bevestig met **"Installeren"** of **"Toevoegen"** |
| 5 | Het icoon verschijnt op het startscherm – tik erop om de app te openen |

**Let op:** De optie "App installeren" is alleen zichtbaar als aan de PWA-criteria is voldaan (HTTPS, manifest, service worker, etc.).

---

## 5. Hoe geven we deze instructies in de app?

### Huidige situatie
- **iOS**: Install-gate overlay bij eerste bezoek (als niet geïnstalleerd)
- **Android**: Geen gate; vertrouwt op de native Chrome install-banner
- **Gate-inhoud**: Momenteel minimaal ("Install App" / "Please add to home screen")

### Aanbevolen verbetering
De install-gate kan uitgebreid worden met:
1. **Platform-detectie**: iOS vs Android
2. **Stap-voor-stap instructies** in de juiste taal (EN/NL)
3. **Visuele uitleg** (tekst per stap, eventueel met iconen)

### URL voor directe instructies
- `https://q8-parking-pwa.web.app/?forceInstall=1` – toont altijd de install-gate met instructies

---

## 6. Samenvatting volgorde voor de gebruiker

```
1. Open de site in Safari (iOS) of Chrome (Android)
2. Volg de installatie-instructies op het scherm
3. Voeg toe aan startscherm / installeer
4. Open de app via het nieuwe icoon
5. Log in met Q8-account
6. Start met parkeren
```

---

**Laatst bijgewerkt:** Februari 2025
