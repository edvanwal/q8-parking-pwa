# Documentatie-inventaris

> **Laatst geverifieerd:** 2026-02-06 (nacht-run audit)  
> **Totaal aantal documentatiebestanden:** 94

Dit is de **complete lijst** van alle documentatie en regels in de q8-parking-pwa repository. Audit-prompts en agents gebruiken dit om niets over het hoofd te zien.

---

## Snelle index (leidende documenten)

Deze documenten zijn de bron van waarheid voor hun domein. Bij twijfel: deze docs winnen.

| Domein | Leidend document | Pad |
|--------|------------------|-----|
| **Startpunt alles** | MASTER.md | `docs/MASTER.md` |
| **Procedure orkestratie** | PROCEDURE_DOCSET.md | `docs/PROCEDURE_DOCSET.md` |
| **Audit prompt** | AUDIT_PROMPT_MASTER.md | `docs/audit/AUDIT_PROMPT_MASTER.md` |
| **Agent-instructies** | AGENTS.md | `AGENTS.md` |
| **Bekende valkuilen** | PROJECT_MEMORY.md | `docs/PROJECT_MEMORY.md` |
| **Huidige status** | SYSTEM_STATUS.md | `SYSTEM_STATUS.md` |
| **Functionele canon** | FUNCTIONALITIES_CANON.md | `docs/product/FUNCTIONALITIES_CANON.md` |
| **Acceptatiecriteria** | ACCEPTANCE_CHECKLISTS.md | `docs/product/ACCEPTANCE_CHECKLISTS.md` |
| **UX-copy & validatie** | UX_COPY_AND_VALIDATION.md | `docs/product/UX_COPY_AND_VALIDATION.md` |
| **Huisstijl** | UI_STYLE_GUIDE.md | `docs/product/UI_STYLE_GUIDE.md` |
| **Security** | SECURITY_BASELINE.md | `docs/product/SECURITY_BASELINE.md` |
| **PWA caching/updates** | PWA_UPDATE_AND_CACHE.md | `docs/product/PWA_UPDATE_AND_CACHE.md` |
| **Datamodel & tarieven** | DATA_MODEL_AND_TARIFFS.md | `docs/product/DATA_MODEL_AND_TARIFFS.md` |
| **Cursor-werkwijze** | CURSOR_TOOLKIT.md | `docs/product/CURSOR_TOOLKIT.md` |
| **User flows** | USER_FLOWS_AND_DATAFLOWS.md | `docs/USER_FLOWS_AND_DATAFLOWS.md` |
| **Canonical rules** | .cursor/rules/ | `.cursor/rules/*.mdc` |

---

## Volledige inventaris

### Root (8 bestanden)

| Bestand | Waarvoor |
|---------|----------|
| `AGENTS.md` | **[LEIDEND]** Instructies voor AI-agents: werkwijze, regels, checklist-flow |
| `SYSTEM_STATUS.md` | **[LEIDEND]** Huidige werkende features, known issues, recente fixes |
| `.cursorrules` | Verwijzing naar werkregels voor Cursor/AI |
| `task.md` | Takenlijst voor Firebase-migratie en validatie |
| `implementation_plan.md` | Implementatieplan history filters (state, UI, logica) |
| `screens_overview.md` | Overzicht van alle schermen en navigatie |
| `test_zones.md` | Testzones en verwachte resultaten |

### docs/audit/ (5 bestanden)

| Bestand | Waarvoor |
|---------|----------|
| `AUDIT_PROMPT_MASTER.md` | **[LEIDEND]** Standaard audit prompt met PROMPT_QA, bewijs-formaat, modes, en stopconditie |
| `CODEBASE_QUALITY_REPORT_2026-02-06.md` | Nacht-run: codebase kwaliteitsscan, formatting fixes |
| `DEPENDENCY_SECURITY_REPORT_2026-02-06.md` | Nacht-run: npm audit, outdated packages, vulnerabilities |
| `PWA_PERFORMANCE_REPORT_2026-02-06.md` | Nacht-run: manifest, service worker, icons analyse |
| `NIGHT_RUN_SUMMARY_2026-02-06.md` | Nacht-run: samenvatting alle audits 2026-02-06 |

### docs/ (43 bestanden)

| Bestand | Waarvoor |
|---------|----------|
| `DOCS_INVENTORY.md` | **[DIT DOCUMENT]** Complete inventaris van alle documentatie |
| `MASTER.md` | **[LEIDEND]** Centrale index naar alle documentatie |
| `PROCEDURE_DOCSET.md` | **[LEIDEND]** Orkestratie van alle docs, feedback loops, bron-van-waarheid regels |
| `PROJECT_MEMORY.md` | **[LEIDEND]** Projectgeheugen: bekende valkuilen, learnings |
| `AGENT_HANDOVER.md` | Handover-informatie tussen agents |
| `AGENT_CONTEXT.md` | Technisch overzicht, tech stack, data, deployment |
| `BLOCKERS.md` | Lijst van blokkerende issues |
| `FUNCTIONAL_CANON.md` | Functionele canon (NIET LEIDEND — zie product/FUNCTIONALITIES_CANON.md) |
| `AUTOPILOT_RUNBOOK.md` | Runbook voor autopilot-modus agents |
| `ARCHITECTURE.md` | Subsystemen, dataflow, rollen (app/state/services/ui) |
| `DATA_PIPELINE.md` | Scripts voor zones/facilities, frequentie, opties |
| `SYNC_ARCHITECTUUR.md` | Hoe data wordt gesynchroniseerd |
| `USER_FLOWS_AND_DATAFLOWS.md` | **[LEIDEND]** User flows en dataflows (bron van waarheid) |
| `WORKING_RULES.md` | Werkregels, productowner, hard stops |
| `API_KEYS_AND_SECURITY.md` | API keys en security-overwegingen |
| `KENTEKEN_VALIDATIE_README.md` | Kentekenvalidatie en RDW-lookup |
| `PUSH_NOTIFICATIES_SETUP.md` | Setup en configuratie pushnotificaties |
| `TOAST_EVENTS_OVERZICHT.md` | Overzicht van toast-meldingen in de app |
| `BILLING_DATABASE_SCHEMA.md` | Schema voor facturatie |
| `BILLING_EXPORT_EXAMPLE.md` | Voorbeeld van billing-export |
| `RECOVERY_ANALYSIS.md` | Analyse van recovery na problemen |
| `CODE_ANALYSE_OPSCHONING.md` | Code-analyse en opschoning |
| `ROOT_CAUSE_ACTIVE_PARKING_WIDTH.md` | Root cause: active parking width |
| `ROOT_CAUSE_KAART_NIET_ZICHTBAAR.md` | Root cause: kaart niet zichtbaar |
| `PRODUCT_ANALYSIS.md` | Analyse huidige staat, wat werkt/niet |
| `IMPLEMENTATION_SUMMARY.md` | PWA-implementatie (manifest, HTML, CSS) |
| `PWA_INSTALL_INSTRUCTIES.md` | Installatie-instructies PWA |
| `PWA_CROSS_PLATFORM_GUIDE.md` | Cross-platform PWA-guide |
| `QUICK_CHECKLIST.md` | Checklist icons, manifest, testen |
| `ICON_CREATION_GUIDE.md` | Handleiding voor iconen aanmaken |
| `UX_UI_AANBEVELINGEN_PWA_MOBIEL.md` | UX/UI aanbevelingen mobiel |
| `UI_REDESIGN_PLAN.md` | Plan voor UI-redesign |
| `UI_VERFIJNINGSPLAN.md` | Plan voor UI-verfijning |
| `PLAN_MASTER_DOCUMENTATIE.md` | Plan voor masterdocumentatie |
| `FLEET_MANAGER_ADMIN_PORTAL_PLAN.md` | Plan voor fleet manager en admin portaal |
| `PLAN_GARAGES_P_R_NPROPENDATA.md` | Plan voor garages en P+R via npropendata |
| `MILIEUZONE_KENTEKEN_PLAN.md` | Plan voor milieuzones en kenteken |
| `RDW_DATASETS_VARIABELEN_EN_KOPPELVELDEN.md` | RDW-datasets en koppelvelden |
| `RAPPORT_NPR_RDW_SHPV_PARKERDATA_ANALYSE.md` | Rapport NPR, RDW, SHPV parkerdata |
| `RAPPORT_DATABRONNEN_VARIABELEN_PLAN.md` | Rapport databronnen en variabelen |
| `RAPPORT_KENTEKEN_LAADPAAL_DATA_NL.md` | Rapport kenteken- en laadpaaldata NL |
| `RAPPORT_PARKERAPPS_GRONDSCHALIG_ONDERZOEK.md` | Onderzoek naar parkerapps |
| `RAPPORT_USER_STORIES_EN_FUNCTIONALITEITEN_ANALYSE.md` | User stories en functionaliteiten |
| `ONDERZOEKSPRAPPORT_TARIEVEN_PARKEREN.md` | Onderzoek tarieven parkeren |

### docs/product/ (13 bestanden)

| Bestand | Waarvoor |
|---------|----------|
| `PRD.md` | Product Requirements Document |
| `BACKLOG.md` | Productbacklog |
| `ACCEPTANCE_CHECKLISTS.md` | **[LEIDEND]** Acceptatie-checklists per categorie (496 punten) |
| `FUNCTIONALITIES_CANON.md` | **[LEIDEND]** Canon van functionaliteiten |
| `FEEDBACK_BACKLOG.md` | Backlog voor feedback en productkeuzes |
| `EDGE_CASES_LIBRARY.md` | Bibliotheek van edge cases |
| `UX_COPY_AND_VALIDATION.md` | **[LEIDEND]** UX-copy, labels, foutmeldingen per scherm |
| `UI_STYLE_GUIDE.md` | **[LEIDEND]** Huisstijl: kleuren, typografie, componenten |
| `SECURITY_BASELINE.md` | **[LEIDEND]** Security-baseline voor webapp en PWA |
| `CURSOR_TOOLKIT.md` | **[LEIDEND]** Cursor-functies, multi-agent, integraties |
| `DATA_MODEL_AND_TARIFFS.md` | **[LEIDEND]** Datamodel, tarieflogica, bewijsbaarheid |
| `PWA_UPDATE_AND_CACHE.md` | **[LEIDEND]** PWA updates, caching, versiegedrag |
| `DEELS_DECISIONS.md` | Deelbeslissingen |

### docs/product/stories/ (1 bestand)

| Bestand | Waarvoor |
|---------|----------|
| `STORY_TEMPLATE.md` | Template voor user stories |

### docs/architecture/ (1 bestand)

| Bestand | Waarvoor |
|---------|----------|
| `c4.md` | C4-architectuurdiagram (Mermaid placeholders) |

### docs/decisions/ (1 bestand)

| Bestand | Waarvoor |
|---------|----------|
| `ADR_TEMPLATE.md` | Template voor Architecture Decision Records |

### docs/flows/ (1 bestand)

| Bestand | Waarvoor |
|---------|----------|
| `FLOW_TEMPLATE.md` | Template voor flow-beschrijvingen |

### docs/ops/ (1 bestand)

| Bestand | Waarvoor |
|---------|----------|
| `observability.md` | Observability, logging, root cause notities |

### docs/api/ (1 bestand)

| Bestand | Waarvoor |
|---------|----------|
| `openapi.yaml` | OpenAPI-specificatie (API contract) |

### .cursor/rules/ (14 bestanden)

Canonical rules voor agents. Alle `.mdc` bestanden met `alwaysApply: true` zijn verplicht.

| Bestand | Waarvoor |
|---------|----------|
| `00_GLOBAL_WORKING_RULES.mdc` | **[LEIDEND]** Globale werkregels, rollen, output discipline |
| `10_E2E_TESTING.mdc` | E2E testing: headed, clean state, failure handling |
| `12_CANON_GATING.mdc` | Canon gating: groen voor human review |
| `13_AGENT_HANDOVER_DISCIPLINE.mdc` | Handover tussen agents |
| `14_AUTOPILOT_WORKFLOW.mdc` | Autopilot loop: canon, gates, fix, docs, commit |
| `15_LOGGING_AND_DIAGNOSTICS.mdc` | Logging voor root cause analyse |
| `20_BROWSER_VERIFICATION.mdc` | Browser-verificatie na UI-wijziging |
| `20_GIT_AND_COMMIT_DISCIPLINE.mdc` | Git en commit discipline |
| `22_STYLING_AND_UI.mdc` | Styling: design-system tokens, E2E targets |
| `25_DOCS_AND_TRACEABILITY.mdc` | Docs-as-code: story, SYSTEM_STATUS, openapi, ADR |
| `30_CLICK_HANDLERS.mdc` | Capture-phase click handlers, data-*, pointer-events |
| `40_ROOT_CAUSE_LOOP.mdc` | Root cause loop bij "werkt nog steeds niet" |
| `docs-and-traceability.mdc` | *(deprecated, verwijst naar 25_DOCS_AND_TRACEABILITY)* |
| `verify-in-browser.mdc` | *(deprecated, verwijst naar 20_BROWSER_VERIFICATION)* |

### directives/ (1 bestand)

| Bestand | Waarvoor |
|---------|----------|
| `ui-parking-pwa.md` | UI-specificatie voor de Parking PWA |

### functions/ (1 bestand)

| Bestand | Waarvoor |
|---------|----------|
| `README.md` | Documentatie voor Firebase Functions |

### public/icons/ (1 bestand)

| Bestand | Waarvoor |
|---------|----------|
| `README.md` | Documentatie voor PWA-iconen |

### rebuild/ (1 bestand)

| Bestand | Waarvoor |
|---------|----------|
| `README.md` | Documentatie voor rebuild-scripts |

---

## Regels en processen

### Scheiding van regels en documentatie
- **`.cursor/rules/`** bevat alleen canonical rules (`.mdc` bestanden). Dit zijn de verplichte regels voor agents.
- **Documentatie** staat in `docs/` en submappen. Dit is referentiemateriaal, plannen, rapporten.
- **AGENTS.md** (root) is het startpunt voor agents en verwijst naar beide.

### Onderhoud van deze inventaris
**Harde regel:** Als er een nieuw `.md` of `.mdc` document bijkomt, moet `docs/DOCS_INVENTORY.md` direct worden bijgewerkt.

### Verificatie
Om deze inventaris te verifiëren, scan alle `.md`, `.mdc` en `.cursorrules` bestanden in de repo en vergelijk met deze lijst.

---

## Top 10 belangrijkste documenten

1. `docs/MASTER.md` — Centrale index (startpunt voor alles)
2. `AGENTS.md` — Instructies voor AI-agents
3. `docs/PROJECT_MEMORY.md` — Bekende valkuilen en learnings
4. `SYSTEM_STATUS.md` — Wat werkt nu, known issues
5. `docs/product/FUNCTIONALITIES_CANON.md` — Functionele canon
6. `docs/product/ACCEPTANCE_CHECKLISTS.md` — Acceptatiecriteria (496 punten)
7. `docs/product/UX_COPY_AND_VALIDATION.md` — Labels, foutmeldingen per scherm
8. `docs/product/UI_STYLE_GUIDE.md` — Huisstijl
9. `docs/USER_FLOWS_AND_DATAFLOWS.md` — User flows en dataflows
10. `.cursor/rules/00_GLOBAL_WORKING_RULES.mdc` — Globale werkregels

---

*Laatst geverifieerd: 2026-02-05*
