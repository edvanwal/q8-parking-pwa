# Project Geheugenboek

Dit document is het "geheugen" van dit project. Elke agent leest dit eerst en voegt nieuwe ontdekkingen toe, zodat dezelfde problemen niet steeds opnieuw onderzocht hoeven te worden.

---

## Afspraken voor agents

### Wie is Edwin
- **Edwin** is de productmanager en de gebruiker van Cursor in dit project.
- Edwin gebruikt geen terminal; de agent voert terminalstappen uit en rapporteert alleen het resultaat + link.
- Edwin geeft feedback met: "Oké, ga door" of "Dit klopt niet: …"
- Gebruik altijd gewone mensentaal in instructies aan Edwin.

### Werkwijze
- **Edwin gebruikt geen terminal.** Alle terminal-commando's worden door de agent uitgevoerd.
- **Agent plakt de output van quick:check in de rapportage** (samengevat in mensentaal).
- **Lees dit document altijd eerst** voordat je begint met werken.
- **Draai altijd de snelle check** (`npm run quick:check`) voordat je gaat debuggen of diep onderzoek doet.
- **Voeg nieuwe learnings toe** zodra je iets belangrijks ontdekt (in de tabel hieronder).
- **Vermeld in elke rapportage:** "Getest op beeldnummer: …" zodat Edwin weet welke versie je hebt gezien.

### Checklist- en feedbackwerkwijze

- **Toon na elke categorie een checklist** met alle punten (met IDs zoals C3-01). Zie [docs/product/ACCEPTANCE_CHECKLISTS.md](product/ACCEPTANCE_CHECKLISTS.md).
- **Edwin reageert alleen op uitzonderingen** (met IDs). Als hij niets noemt, is alles oké.
- **Grote productkeuzes** gaan naar [docs/product/FEEDBACK_BACKLOG.md](product/FEEDBACK_BACKLOG.md) als "Keuze nodig", tenzij Edwin expliciet zegt "pak nu op".

### Fix-while-focused (harde regel)

Tijdens een categorie-run worden **micro-aanpassingen direct uitgevoerd en opnieuw gecontroleerd**:

| Type | Voorbeelden | Actie |
|------|-------------|-------|
| **Foutmeldingen/validatie** | E-mail zonder @, te kort wachtwoord, ongeldig telefoonnummer | Direct fixen |
| **Labels en tekst** | "Email address" vs "Email", "Remember me" tekst, hint-teksten | Direct fixen |
| **Layout die in de weg zit** | Knop buiten beeld, titel niet uitgelijnd, overlappende elementen | Direct fixen |
| **Knoppen die niet werken** | Oogjes bij wachtwoord, X-knop sluit niet | Direct fixen |
| **Sluiten/annuleren/terug** | Buiten klikken werkt niet, terug-knop mist | Direct fixen |

**Alleen parkeren als:**
- Edwin expliciet "later" zegt, of
- Het een grote productkeuze is (dan als "Keuze nodig" vastleggen in FEEDBACK_BACKLOG.md)

**Tijdens testen:** Als je iets ziet dat niet op de checklist staat, voeg je het direct toe als nieuw checklistpunt met nieuw ID.

---

## Snelle check

De snelle check is een klein scriptje dat waarschuwt voor bekende valkuilen (verkeerde poort, ontbrekend beeldnummer, etc.).

**De agent draait dit zelf** en rapporteert de uitkomst aan Edwin. Edwin hoeft niets in de terminal te doen.

---

## Harde regels

| Regel | Waar gedocumenteerd |
|-------|---------------------|
| Audit-run gebruikt altijd **AUDIT_PROMPT_MASTER.md** en **PROCEDURE_DOCSET.md** | [docs/audit/AUDIT_PROMPT_MASTER.md](audit/AUDIT_PROMPT_MASTER.md), [docs/PROCEDURE_DOCSET.md](PROCEDURE_DOCSET.md) |
| Bij audits en wijzigingen: volg **PROCEDURE_DOCSET.md** als orkestratie van alle docs | [docs/PROCEDURE_DOCSET.md](PROCEDURE_DOCSET.md) |
| Bij layout/kleuren/knoppen/typografie is **UI_STYLE_GUIDE.md** leidend | [docs/product/UI_STYLE_GUIDE.md](product/UI_STYLE_GUIDE.md) |
| Bij security-vragen of technische keuzes: volg **SECURITY_BASELINE.md** | [docs/product/SECURITY_BASELINE.md](product/SECURITY_BASELINE.md) |
| Bij update/caching problemen: volg **PWA_UPDATE_AND_CACHE.md** en testplan | [docs/product/PWA_UPDATE_AND_CACHE.md](product/PWA_UPDATE_AND_CACHE.md) |
| Vragen over velden, exports of tarieven: volg **DATA_MODEL_AND_TARIFFS.md** | [docs/product/DATA_MODEL_AND_TARIFFS.md](product/DATA_MODEL_AND_TARIFFS.md) |
| Bij vragen over Cursor-werkwijze, integraties of multi-agent: volg **CURSOR_TOOLKIT.md** | [docs/product/CURSOR_TOOLKIT.md](product/CURSOR_TOOLKIT.md) |
| **Als er een nieuw .md of .mdc document bijkomt:** update **DOCS_INVENTORY.md** direct | [docs/DOCS_INVENTORY.md](DOCS_INVENTORY.md) |

---

## Terugkerende problemen

| Signaal | Waarschijnlijke oorzaak | Snelle check | Oplossing | Laatst gezien |
|---------|------------------------|--------------|-----------|---------------|
| Kaart of markers ontbreken | App geopend op een andere poort dan afgesproken, of de kaart-toegang staat alleen open voor een vaste poort | Controleer of de link begint met http://localhost:3000 en of het beeldnummer zichtbaar is | Gebruik altijd de vaste lokale link/poort of voeg de gebruikte poort toe aan de toegestane adressen van de kaart | 2026-02-05 |
| Serve gebruikt verkeerde poort | npx serve negeert soms -l/-p flag als poort bezet is | `netstat -ano \| findstr :3000` om te checken of 3000 al bezet is | Gebruik `npm run serve:3000` of kill bestaand proces op 3000 | 2026-02-05 |
| UI elementen (zoekbalk, FAB) komen niet terug na sheet sluiten | selectedZone wordt niet gereset bij close-overlay of Escape, waardoor hideSearchUI true blijft | Open een zone-sheet, sluit hem, controleer of zoekbalk zichtbaar is | In app.js: bij close-overlay en Escape, check of activeOverlay === "sheet-zone" en reset dan ook selectedZone: null | 2026-02-05 |
| PWA icons ontbreken | manifest.webmanifest verwijst naar icons die niet in public/icons/ staan | Check of public/icons/ meer bevat dan README.md | Draai node scripts/generate-icons.js of lever icons handmatig aan | 2026-02-06 |
| Security vulnerabilities in firebase packages | npm audit toont CRITICAL/HIGH in firebase-admin en firebase-tools | npm audit --json in root en functions/ | MAJOR version updates nodig; plan met test-coverage | 2026-02-06 |

---

*Laatste update: 2026-02-06*
