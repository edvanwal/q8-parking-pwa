# Blockers

Concrete blockers met repro en waar onderzocht. Bij oplossing: verplaatsen naar docs/ops/observability.md of kort notitie + status hier aanpassen.

---

## B1. GH_TOKEN niet gezet in agent-shell

- **Repro:** In de shell waar de agent draait: `if ($env:GH_TOKEN) { "SET" } else { "MISSING" }` → MISSING.
- **Waar onderzocht:** Preflight-check (eerder verzoek); package.json heeft geen GH_TOKEN-afhankelijkheid voor lokale gates.
- **Impact:** Geen GitHub API-calls (geen PR, geen merge). Nachtrun is expliciet in "GH_TOKEN MISSING MODE" — alle verificatie lokaal met gates.
- **Actie:** Optioneel: GH_TOKEN in Cursor/CI-omgeving zetten voor PR-workflow.

---

## B2. Preflight / format:check scripts ontbraken in package.json — OPGELOST

- **Repro:** `npm run preflight` en `npm run format:check` bestonden niet in package.json.
- **Waar onderzocht:** package.json scripts-sectie.
- **Actie:** Scripts toegevoegd (scripts/preflight.mjs, scripts/format-check.mjs). Gates draaien nu.

---

## B3. (Reserved)

- Blocker alleen invullen bij concrete, reproduceerbare blokkade met repro en onderzochte locatie.

---

*Gebruik: bij nieuwe blocker toevoegen met id B<n>, korte repro, waar onderzocht, impact, actie.*
