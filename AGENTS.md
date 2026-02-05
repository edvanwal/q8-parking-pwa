# For AI agents working on this project

**Start here.** The enforced source of truth is **.cursor/rules/** — use only the canonical rules below. Deprecated files in the same directory point to these; do not follow deprecated rules.

1. **Read [.cursor/rules/00_GLOBAL_WORKING_RULES.mdc](.cursor/rules/00_GLOBAL_WORKING_RULES.mdc).** Mandatory: roles, definition of "broken," working mode, overriding rule.

2. **Canonical set (all alwaysApply: true; follow these):**  
   alwaysApply: true means the rule always applies. enforced: true marks it as non-negotiable for fast scanning; all alwaysApply rules are mandatory.
   - [10_E2E_TESTING.mdc](.cursor/rules/10_E2E_TESTING.mdc) — headed E2E, clean state, failure handling
   - [12_CANON_GATING.mdc](.cursor/rules/12_CANON_GATING.mdc) — canon groen voor human review; gates + bewijs-pad
   - [13_AGENT_HANDOVER_DISCIPLINE.mdc](.cursor/rules/13_AGENT_HANDOVER_DISCIPLINE.mdc) — AGENT_HANDOVER + BLOCKERS na elke iteratie
   - [14_AUTOPILOT_WORKFLOW.mdc](.cursor/rules/14_AUTOPILOT_WORKFLOW.mdc) — loop: canon, gates, fix, docs, commit
   - [15_LOGGING_AND_DIAGNOSTICS.mdc](.cursor/rules/15_LOGGING_AND_DIAGNOSTICS.mdc) — logging for root cause, click/state/negative paths
   - [20_BROWSER_VERIFICATION.mdc](.cursor/rules/20_BROWSER_VERIFICATION.mdc) — verify your own UI work in the browser
   - [20_GIT_AND_COMMIT_DISCIPLINE.mdc](.cursor/rules/20_GIT_AND_COMMIT_DISCIPLINE.mdc) — commit only after verification; no broken/WIP commits
   - [22_STYLING_AND_UI.mdc](.cursor/rules/22_STYLING_AND_UI.mdc) — design-system tokens; geen inline theme/layout; E2E targets
   - [25_DOCS_AND_TRACEABILITY.mdc](.cursor/rules/25_DOCS_AND_TRACEABILITY.mdc) — docs-as-code: story + SYSTEM_STATUS bij user-facing wijziging; openapi bij API; ADR bij architectuur; user-flow referentie
   - [30_CLICK_HANDLERS.mdc](.cursor/rules/30_CLICK_HANDLERS.mdc) — capture-phase rules, data-*, pointer-events
   - [40_ROOT_CAUSE_LOOP.mdc](.cursor/rules/40_ROOT_CAUSE_LOOP.mdc) — when user says "werkt nog steeds niet"

Rules override docs if there is conflict.

---

## Documentatie & traceability
- **User story + acceptatie:** [docs/product/stories/STORY_TEMPLATE.md](docs/product/stories/STORY_TEMPLATE.md)
- **Product:** [docs/product/PRD.md](docs/product/PRD.md), [docs/product/BACKLOG.md](docs/product/BACKLOG.md)
- **Architectuur:** [docs/architecture/c4.md](docs/architecture/c4.md); beslissingen: [docs/decisions/ADR_TEMPLATE.md](docs/decisions/ADR_TEMPLATE.md)
- **API contract:** [docs/api/openapi.yaml](docs/api/openapi.yaml)
- **Flows:** [docs/flows/FLOW_TEMPLATE.md](docs/flows/FLOW_TEMPLATE.md)
- **Ops / observability:** [docs/ops/observability.md](docs/ops/observability.md)
- **Huidige status:** [SYSTEM_STATUS.md](SYSTEM_STATUS.md) (root)

Bij user-facing wijziging: story aanmaken/bijwerken + SYSTEM_STATUS bijwerken. Bij API-wijziging: openapi.yaml. Bij architectuurkeuze: ADR. Zie .cursor/rules/25_DOCS_AND_TRACEABILITY.mdc. Docs (e.g. docs/WORKING_RULES.md, docs/CLICK_HANDLER_RULES.md) remain as reference only.
