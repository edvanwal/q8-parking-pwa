# AUTOPILOT RUNBOOK

Voor een nieuwe agent zonder chatgeschiedenis. Bron: .cursor/rules/14_AUTOPILOT_WORKFLOW.mdc, 12_CANON_GATING.mdc, 13_AGENT_HANDOVER_DISCIPLINE.mdc en nachtrun-praktijk.

---

## 1. Faseschema

| Fase | Doel | Volgende |
|------|------|----------|
| **1. Inventarisatie** | Alle user-visible functionaliteiten in kaart (UI, app.js, ui.js, services, overlays, menu’s, flows). Ook half-af of verborgen. | → Canon |
| **2. Canon** | docs/FUNCTIONAL_CANON.md bijwerken: elk feature ID, naam, user-visible ja/nee, backend ja/nee. Status ✅ alleen bij geautomatiseerde dekking; rest manual-only of 🟡. | → Fix/Test |
| **3. Fix/Test loop** | Per feature: repareer kapot, voeg E2E/selectors toe, of markeer manual-only met motivatie. | → Gates |
| **4. Gates** | format:check → preflight → test:e2e:proof (exacte volgorde, zie hieronder). | → Rapport of terug Fix |
| **5. Rapport** | docs/AGENT_HANDOVER.md en docs/BLOCKERS.md bijwerken; NACHTRUN EINDRAPPORT in AGENT_HANDOVER. | → Stop |
| **6. Stop** | Alleen als stopcondities zijn bereikt (zie sectie 2). | — |

---

## 2. Stopcondities

### Wél stoppen (succes)

- Alle gates PASS (format:check, preflight, test:e2e:proof).
- Canon groen: alle user-visible features in docs/FUNCTIONAL_CANON.md hebben status ✅ of expliciet **manual-only** (geen 🟡 of ❌ voor features die human review vereisen).
- Laatste iteratie gedocumenteerd in AGENT_HANDOVER.md; blockers in BLOCKERS.md.
- NACHTRUN EINDRAPPORT in AGENT_HANDOVER.md (canon-status, gate-resultaten, bewijs-pad).

### Wél stoppen (blocker)

- Er is een blocker die **niet** zonder productbeslissing kan (bijv. ontbrekende API, designkeuze). Dan: blocker vastleggen in BLOCKERS.md met repro, impact, waar onderzocht; handover bijwerken; stoppen.

### Niet stoppen

- Omdat iets onduidelijk is → log als blocker, ga door met volgende feature.
- Omdat een gate faalt → root-cause, één gerichte fix, gates opnieuw; herhaal.
- Zonder AGENT_HANDOVER en BLOCKERS bijgewerkt → eerst docs updaten, dan pas stoppen.

---

## 3. Verplichte gates (exacte commando’s)

Draai in deze volgorde, vanuit repo-root:

```bash
npm run format:check
npm run preflight
npm run test:e2e:proof
```

- **format:check:** Prettier-check op JS/MJS; bij falen: `npx prettier --write <files>` of fix syntax, daarna opnieuw.
- **preflight:** Branch, remote, optioneel GH_TOKEN-check; bij missing token: PASS in “missing mode”.
- **test:e2e:proof:** Headed E2E (Chrome); schone context; server op BASE_URL (bijv. `npx serve public -l 3000`). Bewijs in test-output/e2e-proof/.

Na elke gate-fout: één root-cause, één fix, dan gates opnieuw. Geen stapel fixes.

---

## 4. Blockers (nooit stilvallen)

- **Documenteer altijd** in docs/BLOCKERS.md:
  - Titel (bijv. B<n>. Korte omschrijving)
  - Impact
  - Repro (stappen)
  - Waar onderzocht (filepad + functie/sectie)
  - Wat nog nodig is
- **Stop niet** vanwege een blocker; log en ga door met andere features of volgende iteratie.
- Bij 2 iteraties zonder vooruitgang op hetzelfde punt: blocker met concrete repro en onderzoekspaden; daarna andere feature of stop als productbeslissing nodig is.

---

## 5. Wat de agent NOOIT mag doen

- **Geen human review vragen** zolang de canon niet groen is (12_CANON_GATING: “READY FOR HUMAN REVIEW”).
- **Niet vragen** “kijk even in de browser” of “controleer het in de app”.
- **Niet zeggen** “het is klaar” zonder: canon-status, gate-resultaten, bewijs-pad (trace/screenshots).
- **Geen grote refactors of styling rework** zonder expliciete opdracht.
- **Geen context vragen** aan Edwin als het antwoord in AGENT_HANDOVER.md, FUNCTIONAL_CANON.md of SYSTEM_STATUS.md staat.

---

## 6. Bronnen voor een nieuwe agent

- **Start:** AGENTS.md en .cursor/rules/ (canonical set).
- **Status:** docs/AGENT_HANDOVER.md (max 10 regels status + volgende 3 acties).
- **Blokkers:** docs/BLOCKERS.md.
- **Feature-bron:** docs/FUNCTIONAL_CANON.md.
- **E2E:** scripts/e2e-proof.mjs; bewijs in test-output/e2e-proof/.

---

*Laatste update: op basis van 14_AUTOPILOT_WORKFLOW, 12_CANON_GATING, 13_AGENT_HANDOVER_DISCIPLINE.*
