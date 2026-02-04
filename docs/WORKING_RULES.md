# WORKING RULES – Q8 Parking PWA (MANDATORY)

## Role of the User
- The user is NOT a developer.
- The user acts as Product Manager / Product Owner.
- The user cannot read or review code.
- The user must NEVER be asked to review code, diffs, files, or technical decisions.
- The user approves changes only on product behavior and outcomes, not implementation.

## Authority Model
- Agents are autonomous within defined safety boundaries.
- Agents are responsible for correct technical decisions.
- The user is NOT responsible for technical correctness.

## Responsibility of Agents
- Agents must make SAFE, incremental changes.
- Agents must preserve existing behavior unless explicitly instructed otherwise.
- Agents must restore previous functionality before adding improvements.
- Agents must prefer the smallest possible change.

## How to Work
- Work on ONE functional flow at a time.
- Always explain changes in product terms:
  - What worked before
  - What was broken
  - What works now
- Never explain changes in code terms unless explicitly asked.

## State Management
- Application state lives in `Q8.State` (state.js). State may **only** be changed via `State.update(changes)`. Mutating `State.get` directly (e.g. `State.get.plates.push(...)` or `State.get.zones = []`) is **forbidden**; it would bypass UI updates and cause hard-to-debug bugs.

## Absolute Restrictions (Hard Stop Rules)
Agents may NOT modify the following without explicit approval:
- Deployment
- Firebase configuration
- API keys
- Billing
- Hosting
- index.html

### Approval Protocol
If an agent believes a change in a restricted area is required:
1. STOP immediately.
2. Explain in plain product language:
   - Why the change might be needed
   - What breaks without it
   - What the user would notice
3. Explicitly ask for approval.
4. Wait for approval before doing anything.

Without explicit approval: NO ACTION.

## UI & UX
- Do NOT redesign UI unless explicitly requested.
- Follow `directives/ui-parking-pwa.md` when touching UI behavior.
- Visual changes are forbidden unless requested.

## Verificatie in de browser
- Na wijzigingen aan de frontend/UI moet de agent **eigen werk in de browser controleren** met de browser-MCP (navigeer naar de app op http://localhost:3000, maak een snapshot, test de gewijzigde flow).
- Zie `.cursor/rules/verify-in-browser.mdc` voor de concrete stappen.

## Conflict Handling (Multiple Agents)
- Only ONE agent may modify code at any given time.
- Other agents must operate in READ-ONLY mode:
  - analysis
  - instructions
  - documentation
- If conflict is detected: STOP and report.

## Version Control & Safety
- Agents must commit logical, isolated changes.
- Agents must not squash or rewrite history.
- Rollback must always be possible.

## Probleem oplossen en uit de loop blijven
- Bij bugs die na meerdere pogingen nog steeds door de gebruiker als "werkt niet" worden gemeld: **niet blijven proberen** met weer een vergelijkbare fix.
- Volg het stappenplan in **docs/PROBLEM_SOLVING_AND_LEARNING.md** (root cause, documentatie, dan gerichte fix).
- Zie dat document ook voor wanneer een post-mortem te schrijven.

## Docs-as-code verplicht
- Documentatie en traceability zijn onderdeel van de werkwijze. Zie **.cursor/rules/25_DOCS_AND_TRACEABILITY.mdc**.
- Bij elke **user-facing wijziging:** een story in docs/product/stories/ (aanmaken of bijwerken) en **SYSTEM_STATUS.md** (root) bijwerken.
- Bij **API-wijziging:** docs/api/openapi.yaml aanpassen.
- Bij **architectuurkeuze:** ADR toevoegen in docs/decisions/ (template: ADR_TEMPLATE.md).
- Bij **debugging/root cause:** korte notitie (oorzaak + fix + preventie) in docs/ops/observability.md of docs/PROBLEM_SOLVING_AND_LEARNING.md.

Templates: docs/product/ (PRD, BACKLOG, stories), docs/architecture/c4.md, docs/flows/FLOW_TEMPLATE.md, docs/ops/observability.md.

## Mandatory Rule
Before making ANY changes:
- Read this file.
- Follow it.
- If anything is unclear or conflicting: STOP and ask.

Failure to follow these rules invalidates the change.
