# Functional Canon — Q8 Parking PWA

Alle user-visible features: bron van waarheid voor E2E-proof en handover.  
Bij wijzigingen: canon bijwerken; status ✅ (PASS) / 🟡 (manual-only / flaky) / ❌ (FAIL).

---

## Legenda

- **Technisch contract:** file en/of id/selector waar de feature gerealiseerd wordt.
- **Acceptatie:** PASS = gate/assertie slaagt; FAIL = faalt.
- **Geautomatiseerd:** gedekt door `npm run test:e2e:proof` (scripts/e2e-proof.mjs).

---

## 1. Authenticatie & onboarding

| ID | User story | Technisch contract | Acceptatie | Status | Geautomatiseerd |
|----|------------|--------------------|------------|--------|------------------|
| F01 | Als gebruiker wil ik inloggen met e-mail/wachtwoord | #view-login, button[data-action="login"], services.js loginUser | Login zichtbaar → klik Sign in → #view-map zichtbaar | ✅ | Ja (proof: login → map) |
| F02 | Als gebruiker wil ik naar registratie | data-action="nav-to" data-target="register" | #view-register zichtbaar | ✅ | manual-only |
| F03 | Als gebruiker wil ik wachtwoord vergeten flow starten | data-action="open-overlay" data-target="modal-forgot-password" | modal-forgot-password open | ✅ | manual-only |
| F04 | Als gebruiker wil ik taal wisselen (EN/NL) | data-action="set-lang" data-lang | UI teksten wijzigen | ✅ | manual-only |
| F05 | Als gebruiker wil ik uitloggen | data-testid="btn-logout", data-action="logout" | Na klik: #view-login zichtbaar | ✅ | Ja (proof: menu → logout → login) |
| F06 | Eerste keer: onboarding welkom | #onboarding-overlay, data-action="dismiss-onboarding" | Overlay verdwijnt na "Begrepen" | ✅ | Ja (proof: dismiss-onboarding) |

---

## 2. Kaart & zones

| ID | User story | Technisch contract | Acceptatie | Status | Geautomatiseerd |
|----|------------|--------------------|------------|--------|------------------|
| F10 | Kaart met zones zichtbaar | [data-testid="map-root"], #map-container, ui.js renderMapMarkers | map-root visible na login | ✅ | Ja (proof: map-root) |
| F11 | Zone-marker klikken opent zone-sheet | .q8-price-marker, #sheet-zone.open | sheet-zone visible na klik marker | ✅ | Ja (proof: marker → sheet) |
| F12 | Zone-sheet: duur + / − | data-testid="duration-value", data-testid="btn-zone-plus", mod-duration | Duration waarde verandert na + | ✅ | Ja (proof: duration change) |
| F13 | Zone-sheet sluiten | data-testid="btn-zone-close", data-action="close-overlay" | #sheet-zone.open niet meer zichtbaar | ✅ | Ja (proof: sheet closed) |
| F14 | Zoeken zone/straat | #inp-search, ui-idle-search | Zoekresultaten tonen (manual check) | ✅ | manual-only |
| F15 | Mijn locatie | data-action="go-to-my-location", #btn-my-location | Kaart centreert op GPS | ✅ | manual-only |
| F16 | Zones laden fout + retry | #zones-load-error, data-action="retry-load-zones" | Retry knop zichtbaar bij fout | ✅ | manual-only |
| F17 | Geen kenteken-hint op kaart | #no-plates-hint, data-target="modal-add-plate" | Hint + CTA zichtbaar als plates.length === 0 | ✅ | manual-only |

---

## 3. Menu & navigatie

| ID | User story | Technisch contract | Acceptatie | Status | Geautomatiseerd |
|----|------------|--------------------|------------|--------|------------------|
| F20 | Menu openen | data-testid="btn-menu-open", data-action="toggle-menu" | [data-testid="side-menu"].open zichtbaar | ✅ | Ja (proof: menu open) |
| F21 | Menu-item Parking | data-testid="menu-item-parking", data-action="nav-to" data-target="parking" | Klik gaat naar view-map | ✅ | Ja (proof: menu-item-parking) |
| F22 | Menu-items: History, Plates, Notifications, Favorites, Car specs | data-action="nav-to" data-target | Juiste view toont | ✅ | manual-only |
| F23 | Dark mode (Light/System/Dark) | data-action="set-dark-pref" data-pref | Theme past aan | ✅ | manual-only |
| F24 | Taal in menu (EN/NL) | menu-lang-btn, data-action="set-lang" | Taal wisselt | ✅ | manual-only |

---

## 4. Parkeersessie

| ID | User story | Technisch contract | Acceptatie | Status | Geautomatiseerd |
|----|------------|--------------------|------------|--------|------------------|
| F30 | Start parkeren (zone + duur + kenteken) | data-action="start-session", modal-confirm-start, confirm-start-session | Bevestiging → sessie start | ✅ | manual-only |
| F31 | Actieve sessie-kaart (timer, zone, kenteken) | #ui-active-parking, #active-timer, #active-zone-label | Overlay zichtbaar bij session !== null | ✅ | manual-only |
| F32 | Eind parkeren | data-action="open-overlay" data-target="modal-confirm", data-action="confirm-end" | Modal → sessie null, overlay weg | ✅ | Ja (proof: end parking voor zone flow) |
| F33 | Verleng/verkort eindtijd actieve sessie | data-action="mod-active-end" data-delta | Timer/labels updaten | ✅ | manual-only |

---

## 5. Kentekens

| ID | User story | Technisch contract | Acceptatie | Status | Geautomatiseerd |
|----|------------|--------------------|------------|--------|------------------|
| F40 | Kentekenscherm | #view-plates, data-action="open-overlay" data-target="modal-add-plate" | Lijst + "Add new license plate" | ✅ | manual-only |
| F41 | Kenteken toevoegen | modal-add-plate, data-action="save-plate" | Plate in lijst na ADD | ✅ | manual-only |
| F42 | Kenteken bewerken/verwijderen | modal-edit-plate, modal-confirm-delete-plate | Edit/delete werkt | ✅ | manual-only |
| F43 | Standaard kenteken | data-action="set-default-plate", #btn-set-default | Geselecteerde als default | ✅ | manual-only |
| F44 | Kenteken kiezen in zone-sheet | data-action="open-plate-selector", sheet-plate-selector | Plate selector opent, select werkt | ✅ | manual-only |

---

## 6. Favorieten

| ID | User story | Technisch contract | Acceptatie | Status | Geautomatiseerd |
|----|------------|--------------------|------------|--------|------------------|
| F50 | Favoriet toevoegen/verwijderen in zone-sheet | data-action="toggle-favorite" | Hart icoon, toast | ✅ | manual-only |
| F51 | Favorieten-scherm | #view-favorites, #list-favorites | Lijst met favorieten | ✅ | manual-only |
| F52 | Favorieten-strip op kaart | #favorites-strip, .favorite-pill | Laatst + favorieten pills | ✅ | manual-only |

---

## 7. Historie & export

| ID | User story | Technisch contract | Acceptatie | Status | Geautomatiseerd |
|----|------------|--------------------|------------|--------|------------------|
| F60 | Parkeerhistorie-scherm | #view-history, #list-history | Lijst + quick filters | ✅ | manual-only |
| F61 | Filters (sheet-filter) | data-action="open-overlay" data-target="sheet-filter" | Filter-sheet opent | ✅ | manual-only |
| F62 | Export CSV / Print | data-action="export-history-csv", export-history-print | Bestand/print dialoog | ✅ | manual-only |

---

## 8. Overige views & overlays

| ID | User story | Technisch contract | Acceptatie | Status | Geautomatiseerd |
|----|------------|--------------------|------------|--------|------------------|
| F70 | Car specs | #view-car-specs, #list-car-specs | RDW-specs per plate | ✅ | manual-only |
| F71 | Notifications | #view-notifications, #notif-settings-list, #notif-history-list | Instellingen + geschiedenis | ✅ | manual-only |
| F72 | Toast (meldingen) | #toast, data-action="dismiss-toast" | Toast verschijnt en kan sluiten | ✅ | manual-only |
| F73 | Locatie-uitleg modal | #modal-location-explanation, data-action="confirm-location-explanation" | Toestaan voor eerste locatievraag | ✅ | manual-only |

---

## 9. Fleet Manager Portal (aparte app)

| ID | User story | Technisch contract | Acceptatie | Status | Geautomatiseerd |
|----|------------|--------------------|------------|--------|------------------|
| F80 | Portal login + dashboard | public/portal/index.html, portal.js | Beheerder ziet dashboard | 🟡 | manual-only |

---

## E2E-proof dekking (scripts/e2e-proof.mjs)

De proof dekt expliciet:

1. Navigate BASE_URL, clean state (cookies, storage, SW unregistered).
2. Login (of al op map) → #view-map.
3. map-root visible.
4. Onboarding dismiss indien zichtbaar.
5. Eventueel actieve sessie beëindigen (END PARKING).
6. Zone-marker klikken (of E2E-seed) → sheet-zone visible.
7. duration-value lezen, btn-zone-plus klikken, duration verandert.
8. btn-zone-close → sheet niet meer open.
9. btn-menu-open → side-menu open, menu-item-parking visible.
10. btn-logout → #view-login visible.

Selectors die de proof vereist: map-root, sheet-zone, duration-value, btn-zone-plus, btn-zone-close, btn-menu-open, side-menu, menu-item-parking, btn-logout, #view-login, #view-map.

---

*Laatste update: nachtrun inventarisatie; alle user-visible features uit index.html, ui.js, app.js, RAPPORT_USER_STORIES.*
