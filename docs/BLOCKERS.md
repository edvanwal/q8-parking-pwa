# Blockers

Concrete blockers met repro en waar onderzocht. Bij oplossing: verplaatsen naar docs/ops/observability.md of kort notitie + status hier aanpassen.

---

## B1. GH_TOKEN niet gezet in agent-shell

- **Repro:** In de shell waar de agent draait: `if ($env:GH_TOKEN) { "SET" } else { "MISSING" }` → MISSING.
- **Waar onderzocht:** Preflight-check (eerder verzoek); package.json heeft geen GH_TOKEN-afhankelijkheid voor lokale gates.
- **Impact:** Geen GitHub API-calls (geen PR, geen merge). Nachtrun is expliciet in "GH_TOKEN MISSING MODE" — alle verificatie lokaal met gates.
- **Actie:** Optioneel: GH_TOKEN in Cursor/CI-omgeving zetten voor PR-workflow.

---

## B4. GitHub CLI (gh) ontbreekt in agent-shell

- **Repro:** `gh pr create ...` → "gh is not recognized as the name of a cmdlet".
- **Waar onderzocht:** PowerShell command in repo-root tijdens PR-actie.
- **Impact:** PR kan niet worden aangemaakt of beheerd via CLI.
- **Actie:** Installeer GitHub CLI (gh) of voeg toe aan PATH; daarna PR opnieuw aanmaken.

---

## B2. Preflight / format:check scripts ontbraken in package.json — OPGELOST

- **Repro:** `npm run preflight` en `npm run format:check` bestonden niet in package.json.
- **Waar onderzocht:** package.json scripts-sectie.
- **Actie:** Scripts toegevoegd (scripts/preflight.mjs, scripts/format-check.mjs). Gates draaien nu.

---

## B3. (Reserved)

- Blocker alleen invullen bij concrete, reproduceerbare blokkade met repro en onderzochte locatie.

---

## B5. Docs/rules consistency (placeholder-paden ontbraken) — OPGELOST

- **Repro:** Rules (25_DOCS_AND_TRACEABILITY) verwijzen naar docs/product/, docs/architecture/, docs/api/, docs/USER_FLOWS_AND_DATAFLOWS.md etc.; die bestonden niet.
- **Waar onderzocht:** .cursor/rules/25_DOCS_AND_TRACEABILITY.mdc; docs/ directory.
- **Actie:** PR2 (docs/rules-consistency): placeholder-bestanden en -mappen aangemaakt. Geen inhoud toegevoegd.

---

---

## Laatste gate-run

- format:check: PASS
- preflight: PASS (GH_TOKEN missing mode)
- test:e2e:proof: PASS
- workflow yaml: PASS (npx --yes js-yaml .github/workflows/firebase-hosting-merge.yml)

*Gebruik: bij nieuwe blocker toevoegen met id B<n>, korte repro, waar onderzocht, impact, actie.*
