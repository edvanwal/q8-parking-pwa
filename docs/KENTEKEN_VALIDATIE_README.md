# Gratis kentekenvalidatie – wat is gedaan

## Overzicht

Er is **gratis kentekenvalidatie** toegevoegd: formaatcontrole volgens Nederlandse sidecodes en optionele controle bij **RDW Open Data** (geen API-key nodig).

## Wat is geïmplementeerd

### 1. Kentekenmodule (`public/kenteken.js` en root `kenteken.js`)

- **Normalisatie:** invoer zonder spaties/streepjes, hoofdletters (bijv. `AB-123-C` → `AB123C`).
- **Formaatvalidatie:** Nederlands kenteken volgens sidecodes 1–11 (o.a. XX-99-99, 99-XX-99, XX-999-X, …). Alleen toegestane letters (geen klinkers, geen C/Q).
- **Weergave:** `formatDisplay()` zet genormaliseerd kenteken om naar weergave met streepjes.
- **RDW-lookup:** `lookupRDW(normalized)` haalt via RDW Open Data (Socrata) voertuiggegevens op: merk, handelsbenaming, voertuigsoort. Geen API-key, geen kosten.

### 2. Add/Edit kenteken (services)

- **Toevoegen:** Bij “ADD” wordt eerst het formaat gevalideerd. Alleen geldige Nederlandse formaten worden geaccepteerd. Daarna wordt (asynchroon) RDW geraadpleegd; de toast toont “gecontroleerd: [merk model]”, “niet in RDW gevonden” of “RDW tijdelijk niet beschikbaar”. Het kenteken wordt opgeslagen met genormaliseerde id en weergave met streepjes.
- **Bewerken:** Zelfde validatie en normalisatie bij “SAVE”.
- **Controleren-knop:** “Check at RDW” in het add-plate modal voert alleen een RDW-lookup uit en toont het resultaat in het modal (geen opslaan).

### 3. UI

- **Add-plate modal:** Hint “E.g. AB-123-C (Dutch format)”, foutregel onder het kentekenveld, knop “Check at RDW”, en een regel voor het RDW-resultaat (Gevonden: … / Niet gevonden / Fout).
- **Live format-feedback:** Bij typen of blur op het kentekenveld wordt direct een foutmelding getoond als het formaat ongeldig is.
- **Taal:** Berichten volgen `state.language` (nl/en) waar van toepassing.

### 4. Bestanden

- **Nieuw:** `public/kenteken.js`, root `kenteken.js`.
- **Aangepast:**
  - `public/index.html` en root `index.html` (script-tag kenteken.js, modal add-plate uitgebreid),
  - `public/services.js` en root `services.js` (saveNewPlate, updatePlate, checkPlateRDW, modal-reset),
  - `public/app.js` en root `app.js` (action `check-plate`, live format-feedback),
  - `public/design-system.css` en root `design-system.css` (classes voor plate-rdw-result en plate-format-error).

## Waar je niets voor hoeft te doen

- **RDW Open Data:** Geen registratie of API-key; de app roept `https://opendata.rdw.nl/resource/m9d7-ebf2.json?kenteken=...` aan.
- **CORS:** RDW Socrata staat browser-requests toe; geen backend-proxy nodig voor deze lookup.

## Waar jouw hulp (optioneel) nog kan

1. **Nederlandse teksten in de modal:** De modal-titels en knoplabels staan nog in het Engels (“Add license plate”, “Check at RDW”, “CANCEL”, “ADD”). Als de app standaard NL is, kun je die in de HTML of via een vertaallaag naar NL zetten (bijv. “Kenteken toevoegen”, “Controleren bij RDW”, “ANNULEREN”, “TOEVOEGEN”).
2. **Toegankelijkheid:** In `public/index.html` heeft het add-plate modal al `role="dialog"` en `aria-labelledby`; het edit-plate modal in de root `index.html` niet. Voor consistentie kun je die daar ook toevoegen.
3. **Rate limiting RDW:** Bij heel veel gebruik kan RDW rate limits hebben. Er is geen client-side throttling; alleen bij problemen zou je bv. een korte cooldown na “Check at RDW” kunnen overwegen.

## Testen

1. Open de app (bijv. `public/index.html` of via Firebase Hosting).
2. Ga naar Kenteken/Plates en klik “Nieuw kenteken toevoegen”.
3. Voer een ongeldig formaat in (bijv. `ABC`) → er verschijnt een foutmelding onder het veld.
4. Voer een geldig kenteken in (bijv. `XB670R` of `AB-123-C`) → foutmelding verdwijnt.
5. Klik “Check at RDW” → er verschijnt “Gevonden: PEUGEOT 108” (of vergelijkbaar) of “Niet gevonden in RDW-register.”.
6. Klik ADD → kenteken wordt toegevoegd; toast toont het RDW-resultaat indien beschikbaar.

Als je later iets wilt wijzigen (bijv. alleen formatvalidatie zonder RDW, of andere sidecodes), kan dat in `kenteken.js` en in de service-aanroepen in `services.js`.
