# Project Geheugenboek

Dit document is het "geheugen" van dit project. Elke agent leest dit eerst en voegt nieuwe ontdekkingen toe, zodat dezelfde problemen niet steeds opnieuw onderzocht hoeven te worden.

---

## Afspraken voor agents

- **Edwin gebruikt geen terminal.** Alle terminal-commando's worden door de agent uitgevoerd.
- **Agent plakt de output van quick:check in de rapportage** (samengevat in mensentaal).
- **Lees dit document altijd eerst** voordat je begint met werken.
- **Draai altijd de snelle check** (`npm run quick:check`) voordat je gaat debuggen of diep onderzoek doet.
- **Voeg nieuwe learnings toe** zodra je iets belangrijks ontdekt (in de tabel hieronder).
- **Vermeld in elke rapportage:** "Getest op beeldnummer: …" zodat Edwin weet welke versie je hebt gezien.

### Checklist- en feedbackwerkwijze

- **Toon na elke categorie een checklist** met 30-40 punten (met IDs zoals C3-01). Zie [docs/product/ACCEPTANCE_CHECKLISTS.md](product/ACCEPTANCE_CHECKLISTS.md).
- **Edwin reageert alleen op uitzonderingen** (met IDs). Als hij niets noemt, is alles oké.
- **Alles wat "mooier" of "scope" is** gaat naar [docs/product/FEEDBACK_BACKLOG.md](product/FEEDBACK_BACKLOG.md), tenzij Edwin expliciet zegt "pak nu op".

---

## Snelle check

De snelle check is een klein scriptje dat waarschuwt voor bekende valkuilen (verkeerde poort, ontbrekend beeldnummer, etc.).

**De agent draait dit zelf** en rapporteert de uitkomst aan Edwin. Edwin hoeft niets in de terminal te doen.

---

## Terugkerende problemen

| Signaal | Waarschijnlijke oorzaak | Snelle check | Oplossing | Laatst gezien |
|---------|------------------------|--------------|-----------|---------------|
| Kaart of markers ontbreken | App geopend op een andere poort dan afgesproken, of de kaart-toegang staat alleen open voor een vaste poort | Controleer of de link begint met http://localhost:3000 en of het beeldnummer zichtbaar is | Gebruik altijd de vaste lokale link/poort of voeg de gebruikte poort toe aan de toegestane adressen van de kaart | 2026-02-05 |
| Serve gebruikt verkeerde poort | npx serve negeert soms -l/-p flag als poort bezet is | `netstat -ano \| findstr :3000` om te checken of 3000 al bezet is | Gebruik `npm run serve:3000` of kill bestaand proces op 3000 | 2026-02-05 |

---

*Laatste update: 2026-02-05*
