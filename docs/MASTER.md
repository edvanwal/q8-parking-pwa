# Q8 Parking B2B PWA – Masterdocumentatie

**Startpunt voor alle informatie over deze app.** Vanuit hier vind je wat de app is, wat er werkt, welke plannen en ideeën er zijn, en waar elk document staat.

---

## 1. Wat is deze app

De **Q8 Parking B2B PWA** is een Progressive Web App voor zakelijke chauffeurs (o.a. met Q8 Liberty-kaart). Kernfunctionaliteit: parkeerzones vinden op de kaart of via zoeken, tarieven bekijken, parkeersessies starten en stoppen, kentekens beheren en parkeerhistorie inzien. De app gebruikt RDW-parkeerdata, Firebase (Firestore + Auth), Google Maps en optioneel AI (Gemini) voor tariefvertaling.

- **Technisch overzicht:** [AGENT_CONTEXT.md](AGENT_CONTEXT.md)
- **Architectuur (subsystemen, dataflow, bestandsrollen):** [ARCHITECTURE.md](ARCHITECTURE.md)

---

## 2. Huidige functionaliteiten

| Onderdeel                                   | Status                                 | Waar gedocumenteerd            |
| ------------------------------------------- | -------------------------------------- | ------------------------------ |
| Inloggen / registreren / uitloggen          | Werkt                                  | User stories rapport           |
| Kaart met parkeerzones en prijzen           | Werkt                                  | PRODUCT_ANALYSIS, ARCHITECTURE |
| Zoeken op zone-ID of naam                   | Werkt                                  | idem                           |
| Zoeken op adres (geocoding)                 | Werkt                                  | idem                           |
| Zone-sheet (tarieven, duur, kenteken)       | Werkt                                  | idem                           |
| Parkeersessie starten / stoppen             | Werkt (localStorage)                   | idem                           |
| Kentekens toevoegen, verwijderen, standaard | Werkt                                  | idem                           |
| Parkeerhistorie (scherm + filters)          | UI klaar; data nog niet naar Firestore | PRODUCT_ANALYSIS, task.md      |
| Sessies naar Firestore / backend            | Gepland, niet af                       | task.md                        |

**Uitgebreid overzicht (user stories, schermen, implementatie):**

- [RAPPORT_USER_STORIES_EN_FUNCTIONALITEITEN_ANALYSE.md](RAPPORT_USER_STORIES_EN_FUNCTIONALITEITEN_ANALYSE.md)
- Schermen en navigatie: [screens_overview.md](../screens_overview.md) (projectroot)

---

## 3. Productstatus

**Wat werkt nu:** Inloggen, kaart, zoeken (zone + adres), zone kiezen, zone-sheet met tarieven/duur/kenteken, parkeren starten/stoppen (lokaal), kentekens beheren, timer (count-up/count-down).

**Wat ontbreekt of incompleet:** Parkeerhistorie wordt niet gevuld; sessies gaan niet naar Firestore; gekozen kenteken wordt niet in de sessie opgeslagen; beperkte foutmeldingen bij mislukte acties.

- **Analyse huidige staat:** [PRODUCT_ANALYSIS.md](PRODUCT_ANALYSIS.md)
- **Taken (o.a. Firebase-migratie, validatie):** [task.md](../task.md)

---

## 4. Plannen en ideeën

| Plan                             | Korte omschrijving                                                                                     | Document                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| **Fleet Manager & Admin Portal** | Multitennend portaal: Q8-superadmin en fleetmanagers; beheer van tenants, rijders, sessies, rapporten. | [FLEET_MANAGER_ADMIN_PORTAL_PLAN.md](FLEET_MANAGER_ADMIN_PORTAL_PLAN.md) |
| **Garages & P+R (NPROPENDATA)**  | Integratie van garages en P+R uit RDW npropendata; “in de buurt”-weergave, dynamische bezetting.       | [PLAN_GARAGES_P_R_NPROPENDATA.md](PLAN_GARAGES_P_R_NPROPENDATA.md)       |
| **Milieuzone & kenteken**        | Toegang tot milieuzones op basis van kenteken/emissie; waarschuwingen in de app.                       | [MILIEUZONE_KENTEKEN_PLAN.md](MILIEUZONE_KENTEKEN_PLAN.md)               |
| **UI Redesign**                  | Visuele en UX-verbeteringen van de PWA.                                                                | [UI_REDESIGN_PLAN.md](UI_REDESIGN_PLAN.md)                               |
| **UI Verfijning**                | Verfijningen van layout en componenten.                                                                | [UI_VERFIJNINGSPLAN.md](UI_VERFIJNINGSPLAN.md)                           |
| **Masterdocumentatie**           | Eén plek voor alle docs, plannen en ideeën (dit plan).                                                 | [PLAN_MASTER_DOCUMENTATIE.md](PLAN_MASTER_DOCUMENTATIE.md)               |

---

## 5. Onderzoeken en rapporten

| Rapport                                    | Onderwerp                                                                                | Document                                                                                     |
| ------------------------------------------ | ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| **NPR, RDW, SHPV, parkerdata**             | RDW-datasets, open data vs. NPR, SPDP/NEN-EN 12414; aanbevelingen voor data en frontend. | [RAPPORT_NPR_RDW_SHPV_PARKERDATA_ANALYSE.md](RAPPORT_NPR_RDW_SHPV_PARKERDATA_ANALYSE.md)     |
| **Databronnen & variabelen**               | Inventarisatie databronnen, variabelen, markt/EV, plan met aanbevelingen voor de PWA.    | [RAPPORT_DATABRONNEN_VARIABELEN_PLAN.md](RAPPORT_DATABRONNEN_VARIABELEN_PLAN.md)             |
| **Kenteken & laadpaaldata NL**             | Overzicht kenteken- en laadpaaldata in Nederland.                                        | [RAPPORT_KENTEKEN_LAADPAAL_DATA_NL.md](RAPPORT_KENTEKEN_LAADPAAL_DATA_NL.md)                 |
| **Parkerapps grondschalig**                | Onderzoek naar parkeerapps en vergelijkbare oplossingen.                                 | [RAPPORT_PARKERAPPS_GRONDSCHALIG_ONDERZOEK.md](RAPPORT_PARKERAPPS_GRONDSCHALIG_ONDERZOEK.md) |
| **Tarieven parkeren**                      | Onderzoek naar tarieven en tariefberekening.                                             | [ONDERZOEKSPRAPPORT_TARIEVEN_PARKEREN.md](ONDERZOEKSPRAPPORT_TARIEVEN_PARKEREN.md)           |
| **RDW-datasets, variabelen, koppelvelden** | Technische referentie RDW-resources.                                                     | [RDW_DATASETS_VARIABELEN_EN_KOPPELVELDEN.md](RDW_DATASETS_VARIABELEN_EN_KOPPELVELDEN.md)     |

---

## 6. Technische referentie

| Onderwerp             | Beschrijving                                                | Document                                                                                                         |
| --------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **Data pipeline**     | Scripts (zones, facilities), frequentie, optionele filters. | [DATA_PIPELINE.md](DATA_PIPELINE.md)                                                                             |
| **Billing-database**  | Schema voor facturatie/export.                              | [BILLING_DATABASE_SCHEMA.md](BILLING_DATABASE_SCHEMA.md), [BILLING_EXPORT_EXAMPLE.md](BILLING_EXPORT_EXAMPLE.md) |
| **Sync-architectuur** | Hoe data wordt gesynchroniseerd.                            | [SYNC_ARCHITECTUUR.md](SYNC_ARCHITECTUUR.md)                                                                     |
| **Toast-events**      | Overzicht van toast-meldingen in de app.                    | [TOAST_EVENTS_OVERZICHT.md](TOAST_EVENTS_OVERZICHT.md)                                                           |
| **Kentekenvalidatie** | Validatie en RDW-lookup.                                    | [KENTEKEN_VALIDATIE_README.md](KENTEKEN_VALIDATIE_README.md)                                                     |
| **Pushnotificaties**  | Setup en configuratie.                                      | [PUSH_NOTIFICATIES_SETUP.md](PUSH_NOTIFICATIES_SETUP.md)                                                         |

---

## 7. Root cause en fixes

| Onderwerp                       | Document                                                                 |
| ------------------------------- | ------------------------------------------------------------------------ |
| Recovery (herstel na problemen) | [RECOVERY_ANALYSIS.md](RECOVERY_ANALYSIS.md)                             |
| Active parking – breedte/layout | [ROOT_CAUSE_ACTIVE_PARKING_WIDTH.md](ROOT_CAUSE_ACTIVE_PARKING_WIDTH.md) |
| Kaart niet zichtbaar            | [ROOT_CAUSE_KAART_NIET_ZICHTBAAR.md](ROOT_CAUSE_KAART_NIET_ZICHTBAAR.md) |
| Code-analyse en opschoning      | [CODE_ANALYSE_OPSCHONING.md](CODE_ANALYSE_OPSCHONING.md)                 |

---

## 8. PWA, UX en installatie

| Onderwerp                                 | Document                                                               |
| ----------------------------------------- | ---------------------------------------------------------------------- |
| PWA installatie-instructies               | [PWA_INSTALL_INSTRUCTIES.md](PWA_INSTALL_INSTRUCTIES.md)               |
| PWA cross-platform                        | [PWA_CROSS_PLATFORM_GUIDE.md](PWA_CROSS_PLATFORM_GUIDE.md)             |
| Quick checklist (icons, manifest, testen) | [QUICK_CHECKLIST.md](QUICK_CHECKLIST.md)                               |
| UX/UI aanbevelingen mobiel                | [UX_UI_AANBEVELINGEN_PWA_MOBIEL.md](UX_UI_AANBEVELINGEN_PWA_MOBIEL.md) |
| Iconen aanmaken                           | [ICON_CREATION_GUIDE.md](ICON_CREATION_GUIDE.md)                       |
| Implementatie PWA (manifest, HTML, CSS)   | [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)                 |

---

## 9. Hoe we werken

- **Verplichte werkregels (productowner, agents, hard stops):** [WORKING_RULES.md](WORKING_RULES.md)
- **Cursor/AI-regels:** [.cursorrules](../.cursorrules) (projectroot) – verwijst naar WORKING_RULES.
- **UI-specificatie (design, componenten, schermen):** [directives/ui-parking-pwa.md](../directives/ui-parking-pwa.md) (projectroot).

**Afspraak:** Bij wijzigingen altijd [WORKING_RULES.md](WORKING_RULES.md) nalezen en volgen.

---

## 10. Volledige documentlijst

Alle documenten in `docs/` en relevante bestanden in de projectroot, met categorie en korte omschrijving.

### docs/

| Bestand                                                                                                      | Categorie           | Korte omschrijving                                    |
| ------------------------------------------------------------------------------------------------------------ | ------------------- | ----------------------------------------------------- |
| [AGENT_CONTEXT.md](AGENT_CONTEXT.md)                                                                         | Context             | Technisch overzicht, tech stack, data, deployment     |
| [ARCHITECTURE.md](ARCHITECTURE.md)                                                                           | Context             | Subsystemen, dataflow, rollen app/state/services/ui   |
| [DATA_PIPELINE.md](DATA_PIPELINE.md)                                                                         | Technisch           | Scripts zones/facilities, frequentie, opties          |
| [WORKING_RULES.md](WORKING_RULES.md)                                                                         | Regels              | Verplichte werkregels, productowner, hard stops       |
| [PRODUCT_ANALYSIS.md](PRODUCT_ANALYSIS.md)                                                                   | Product             | Huidige staat, wat werkt/niet, flow-analyse           |
| [RAPPORT_USER_STORIES_EN_FUNCTIONALITEITEN_ANALYSE.md](RAPPORT_USER_STORIES_EN_FUNCTIONALITEITEN_ANALYSE.md) | Product             | User stories, functionaliteiten, technische inbedding |
| [FLEET_MANAGER_ADMIN_PORTAL_PLAN.md](FLEET_MANAGER_ADMIN_PORTAL_PLAN.md)                                     | Plan                | Fleet manager- en adminportaal, rollen, rechten       |
| [PLAN_GARAGES_P_R_NPROPENDATA.md](PLAN_GARAGES_P_R_NPROPENDATA.md)                                           | Plan                | Garages en P+R via npropendata                        |
| [PLAN_MASTER_DOCUMENTATIE.md](PLAN_MASTER_DOCUMENTATIE.md)                                                   | Plan                | Plan voor één masterdocumentatie                      |
| [MILIEUZONE_KENTEKEN_PLAN.md](MILIEUZONE_KENTEKEN_PLAN.md)                                                   | Plan                | Milieuzones en kenteken                               |
| [UI_REDESIGN_PLAN.md](UI_REDESIGN_PLAN.md)                                                                   | Plan                | UI-redesign                                           |
| [UI_VERFIJNINGSPLAN.md](UI_VERFIJNINGSPLAN.md)                                                               | Plan                | UI-verfijning                                         |
| [RAPPORT_NPR_RDW_SHPV_PARKERDATA_ANALYSE.md](RAPPORT_NPR_RDW_SHPV_PARKERDATA_ANALYSE.md)                     | Onderzoek           | NPR, RDW, SHPV, parkerdata, aanbevelingen             |
| [RAPPORT_DATABRONNEN_VARIABELEN_PLAN.md](RAPPORT_DATABRONNEN_VARIABELEN_PLAN.md)                             | Onderzoek           | Databronnen, variabelen, markt, plan                  |
| [RAPPORT_KENTEKEN_LAADPAAL_DATA_NL.md](RAPPORT_KENTEKEN_LAADPAAL_DATA_NL.md)                                 | Onderzoek           | Kenteken- en laadpaaldata NL                          |
| [RAPPORT_PARKERAPPS_GRONDSCHALIG_ONDERZOEK.md](RAPPORT_PARKERAPPS_GRONDSCHALIG_ONDERZOEK.md)                 | Onderzoek           | Parkerapps-onderzoek                                  |
| [ONDERZOEKSPRAPPORT_TARIEVEN_PARKEREN.md](ONDERZOEKSPRAPPORT_TARIEVEN_PARKEREN.md)                           | Onderzoek           | Tarieven parkeren                                     |
| [RDW_DATASETS_VARIABELEN_EN_KOPPELVELDEN.md](RDW_DATASETS_VARIABELEN_EN_KOPPELVELDEN.md)                     | Onderzoek/Technisch | RDW-datasets en koppelvelden                          |
| [BILLING_DATABASE_SCHEMA.md](BILLING_DATABASE_SCHEMA.md)                                                     | Technisch           | Schema facturatie                                     |
| [BILLING_EXPORT_EXAMPLE.md](BILLING_EXPORT_EXAMPLE.md)                                                       | Technisch           | Voorbeeld billing-export                              |
| [SYNC_ARCHITECTUUR.md](SYNC_ARCHITECTUUR.md)                                                                 | Technisch           | Sync-architectuur                                     |
| [TOAST_EVENTS_OVERZICHT.md](TOAST_EVENTS_OVERZICHT.md)                                                       | Technisch           | Toast-events in de app                                |
| [KENTEKEN_VALIDATIE_README.md](KENTEKEN_VALIDATIE_README.md)                                                 | Technisch           | Kentekenvalidatie en RDW                              |
| [PUSH_NOTIFICATIES_SETUP.md](PUSH_NOTIFICATIES_SETUP.md)                                                     | Technisch           | Pushnotificaties                                      |
| [RECOVERY_ANALYSIS.md](RECOVERY_ANALYSIS.md)                                                                 | Fixes               | Recovery-analyse                                      |
| [ROOT_CAUSE_ACTIVE_PARKING_WIDTH.md](ROOT_CAUSE_ACTIVE_PARKING_WIDTH.md)                                     | Fixes               | Root cause active parking width                       |
| [ROOT_CAUSE_KAART_NIET_ZICHTBAAR.md](ROOT_CAUSE_KAART_NIET_ZICHTBAAR.md)                                     | Fixes               | Root cause kaart niet zichtbaar                       |
| [CODE_ANALYSE_OPSCHONING.md](CODE_ANALYSE_OPSCHONING.md)                                                     | Fixes               | Code-analyse en opschoning                            |
| [PWA_INSTALL_INSTRUCTIES.md](PWA_INSTALL_INSTRUCTIES.md)                                                     | PWA/UX              | Installatie-instructies                               |
| [PWA_CROSS_PLATFORM_GUIDE.md](PWA_CROSS_PLATFORM_GUIDE.md)                                                   | PWA/UX              | Cross-platform PWA                                    |
| [QUICK_CHECKLIST.md](QUICK_CHECKLIST.md)                                                                     | PWA/UX              | Checklist icons, manifest, testen                     |
| [UX_UI_AANBEVELINGEN_PWA_MOBIEL.md](UX_UI_AANBEVELINGEN_PWA_MOBIEL.md)                                       | PWA/UX              | UX/UI mobiel                                          |
| [ICON_CREATION_GUIDE.md](ICON_CREATION_GUIDE.md)                                                             | PWA/UX              | Iconen aanmaken                                       |
| [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)                                                       | Implementatie       | PWA-implementatie (manifest, HTML, CSS)               |
| [HTML_HEAD_TEMPLATE.html](HTML_HEAD_TEMPLATE.html)                                                           | Technisch           | Template head voor HTML                               |

### Projectroot

| Bestand                                                         | Categorie     | Korte omschrijving                             |
| --------------------------------------------------------------- | ------------- | ---------------------------------------------- |
| [task.md](../task.md)                                           | Implementatie | Takenlijst Firebase-migratie en validatie      |
| [implementation_plan.md](../implementation_plan.md)             | Implementatie | History filters – state, UI, logica            |
| [screens_overview.md](../screens_overview.md)                   | Product       | Overzicht schermen en navigatie                |
| [.cursorrules](../.cursorrules)                                 | Regels        | Cursor/AI-regels (verwijst naar WORKING_RULES) |
| [directives/ui-parking-pwa.md](../directives/ui-parking-pwa.md) | Regels/UI     | UI-specificatie Parking PWA                    |

---

_Laatste update van deze master: februari 2026. Bij nieuw document of groot plan: sectie 4, 5 of 10 bijwerken._
