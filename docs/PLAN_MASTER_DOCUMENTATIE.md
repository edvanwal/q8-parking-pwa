# Plan: Masterdocumentatie – één plek voor alle informatie

**Versie:** 1.0  
**Datum:** 2 februari 2026  
**Doel:** Alle informatie, plannen, ideeën en functionaliteiten van de Q8 Parking B2B PWA op één plek samenbrengen in een logische, onderhoudbare structuur.

---

## 1. Huidige situatie

### 1.1 Waar staat de informatie nu?

| Locatie | Soort | Voorbeelden |
|--------|--------|-------------|
| **`docs/`** | Rapporten, plannen, technische docs, root-cause analyses | AGENT_CONTEXT, ARCHITECTURE, FLEET_MANAGER_ADMIN_PORTAL_PLAN, RAPPORT_*, UI_REDESIGN_PLAN |
| **Projectroot** | Taken, implementatieplannen, schermen | `task.md`, `implementation_plan.md`, `screens_overview.md` |
| **`.cursorrules`** | AI/agent regels | Verwijzing naar WORKING_RULES |
| **`docs/WORKING_RULES.md`** | Verplichte werkregels | Product-owner context, hard stops |
| **`directives/`** | UI/design specificaties | `ui-parking-pwa.md` |

### 1.2 Soorten documenten (inventaris)

| Categorie | Documenten | Doel |
|-----------|------------|------|
| **Context & architectuur** | AGENT_CONTEXT.md, ARCHITECTURE.md | Technisch overzicht, dataflow, bestandsrollen |
| **Product & functionaliteit** | PRODUCT_ANALYSIS.md, RAPPORT_USER_STORIES_EN_FUNCTIONALITEITEN_ANALYSE.md, screens_overview.md | Wat de app doet, user stories, schermen |
| **Plannen (ideeën / roadmap)** | FLEET_MANAGER_ADMIN_PORTAL_PLAN.md, PLAN_GARAGES_P_R_NPROPENDATA.md, MILIEUZONE_KENTEKEN_PLAN.md, UI_REDESIGN_PLAN.md, UI_VERFIJNINGSPLAN.md | Toekomstige features, uitbreidingen |
| **Implementatie & taken** | implementation_plan.md (history filters), task.md (Firebase migratie), IMPLEMENTATION_SUMMARY.md (PWA) | Concrete stappen, checklists |
| **Onderzoeken & rapporten** | RAPPORT_NPR_RDW_SHPV_PARKERDATA_ANALYSE.md, RAPPORT_KENTEKEN_LAADPAAL_DATA_NL.md, RAPPORT_PARKERAPPS_GRONDSCHALIG_ONDERZOEK.md, ONDERZOEKSPRAPPORT_TARIEVEN_PARKEREN.md, RDW_DATASETS_* | Data, standaarden, externe bronnen |
| **Technische referentie** | BILLING_DATABASE_SCHEMA.md, BILLING_EXPORT_EXAMPLE.md, SYNC_ARCHITECTUUR.md, TOAST_EVENTS_OVERZICHT.md, KENTEKEN_VALIDATIE_README.md | Schema’s, events, APIs |
| **Root cause / fixes** | RECOVERY_ANALYSIS.md, ROOT_CAUSE_ACTIVE_PARKING_WIDTH.md, ROOT_CAUSE_KAART_NIET_ZICHTBAAR.md, CODE_ANALYSE_OPSCHONING.md | Waarom iets kapot was, oplossing |
| **PWA / UX / UI** | PWA_INSTALL_INSTRUCTIES.md, PWA_CROSS_PLATFORM_GUIDE.md, QUICK_CHECKLIST.md, UX_UI_AANBEVELINGEN_PWA_MOBIEL.md, ICON_CREATION_GUIDE.md | Installatie, cross-platform, iconen |
| **Regels & richtlijnen** | WORKING_RULES.md, .cursorrules, directives/ui-parking-pwa.md | Hoe te werken, UI-specificatie |

---

## 2. Gewenste eindbeeld: één master

**Principe:** Eén **masterdocument** (of master-index) dat als startpunt dient. Vanuit daar vind je alles: wat de app is, wat er is gepland, wat er al kan, en waar de details staan.

### 2.1 Opties

| Optie | Beschrijving | Voordeel | Nadeel |
|-------|--------------|----------|--------|
| **A. Eén groot bestand** | Alles in één MASTER.md (of meerdere grote delen) | Alles letterlijk op één plek | Zeer lang bestand, lastig onderhoud, merge-conflicten |
| **B. Master-index + ongewijzigde docs** | Eén INDEX/MASTER die alle bestaande docs beschrijft en linkt | Geen herschrijven, snelle invoering | Info blijft verspreid; je moet nog steeds meerdere bestanden openen |
| **C. Master-index + herstructurering** | Eén MASTER.md als inhoudsopgave en samenvatting; docs hernoemen/herschikken in vaste mappen; duplicaten verwijderen | Eén startpunt, duidelijke mappen, minder overlap | Vereist eenmalige migratie en afspraken |
| **D. Master + “levend document”** | Eén MASTER.md met korte samenvattingen en links; gedetailleerde plannen/rapporten in `docs/` in vaste categorieën; MASTER wordt bij elke grote wijziging bijgewerkt | Eén plek om te beginnen, details blijven in aparte bestanden, MASTER blijft beheersbaar | Discipline nodig om MASTER up-to-date te houden |

**Aanbeveling:** **Optie D** – Master als startpunt en inhoudsopgave, bestaande docs behouden maar in een vaste mapstructuur plaatsen en vanuit de master linken.

---

## 3. Voorgestelde structuur

### 3.1 Eén masterbestand: `docs/MASTER.md`

**Doel:** Eerste en enige “startpagina” voor iedereen (product, development, AI-agent). Bevat:

1. **Wat is deze app** (2–3 zinnen) + link naar AGENT_CONTEXT / ARCHITECTURE.
2. **Huidige functionaliteiten** – compact overzicht (lijst of tabel) + link naar RAPPORT_USER_STORIES_EN_FUNCTIONALITEITEN_ANALYSE en screens_overview.
3. **Status product** – wat werkt, wat ontbreekt/gepland (uit PRODUCT_ANALYSIS + task.md).
4. **Alle plannen en ideeën** – korte titel + één zin + link naar het betreffende doc (Fleet Manager, Garages/P+R, Milieuzone, UI Redesign, enz.).
5. **Alle rapporten en onderzoeken** – titel + link (NPR/RDW, parkerapps, tarieven, RDW-datasets, enz.).
6. **Technische referentie** – waar staat wat (schema’s, sync, events, kentekenvalidatie) + links.
7. **Hoe we werken** – verwijzing naar WORKING_RULES, .cursorrules, directives.
8. **Snelle navigatie** – tabel met alle docs in `docs/` (en eventueel root) met categorie en korte omschrijving.

Alles wat “alle informatie op één plek” moet voelen, staat dus **samengevat** in MASTER.md; de **volledige tekst** blijft in de bestaande bestanden.

### 3.2 Mapstructuur onder `docs/` (optioneel maar wenselijk)

Om “één plek” ook in de mapstructuur terug te laten komen, kun je binnen `docs/` mappen gebruiken zonder bestaande bestanden te hernoemen (alleen te verplaatsen):

```
docs/
  MASTER.md                    ← Startpunt (nieuw)
  WORKING_RULES.md             ← Blijft in root docs (veel gelinkt)

  context/                     ← Context & architectuur
    AGENT_CONTEXT.md
    ARCHITECTURE.md

  product/                     ← Product, functionaliteit, schermen
    PRODUCT_ANALYSIS.md
    RAPPORT_USER_STORIES_EN_FUNCTIONALITEITEN_ANALYSE.md
    (screens_overview.md kan hierheen of in root blijven)

  plans/                       ← Plannen en ideeën
    FLEET_MANAGER_ADMIN_PORTAL_PLAN.md
    PLAN_GARAGES_P_R_NPROPENDATA.md
    MILIEUZONE_KENTEKEN_PLAN.md
    UI_REDESIGN_PLAN.md
    UI_VERFIJNINGSPLAN.md

  implementation/              ← Implementatieplannen & taken
    implementation_plan.md     (of symlink/copy van root)
    task.md                    (idem)
    IMPLEMENTATION_SUMMARY.md
    QUICK_CHECKLIST.md

  research/                    ← Onderzoeken & rapporten
    RAPPORT_NPR_RDW_SHPV_PARKERDATA_ANALYSE.md
    RAPPORT_KENTEKEN_LAADPAAL_DATA_NL.md
    RAPPORT_PARKERAPPS_GRONDSCHALIG_ONDERZOEK.md
    ONDERZOEKSPRAPPORT_TARIEVEN_PARKEREN.md
    RDW_DATASETS_VARIABELEN_EN_KOPPELVELDEN.md

  technical/                   ← Technische referentie
    BILLING_DATABASE_SCHEMA.md
    BILLING_EXPORT_EXAMPLE.md
    SYNC_ARCHITECTUUR.md
    TOAST_EVENTS_OVERZICHT.md
    KENTEKEN_VALIDATIE_README.md

  fixes/                       ← Root cause & recovery
    RECOVERY_ANALYSIS.md
    ROOT_CAUSE_ACTIVE_PARKING_WIDTH.md
    ROOT_CAUSE_KAART_NIET_ZICHTBAAR.md
    CODE_ANALYSE_OPSCHONING.md

  pwa-ux/                      ← PWA, UX, UI-instructies
    PWA_INSTALL_INSTRUCTIES.md
    PWA_CROSS_PLATFORM_GUIDE.md
    UX_UI_AANBEVELINGEN_PWA_MOBIEL.md
    ICON_CREATION_GUIDE.md
```

**Let op:** Als je mappen introduceert, moeten alle verwijzingen in MASTER.md en in andere docs (bijv. AGENT_CONTEXT die naar RAPPORT_NPR_… linkt) worden bijgewerkt naar het nieuwe pad. Je kunt ook **zonder mappen** werken: dan blijft alles in `docs/` en doet alleen MASTER.md dienst als centrale index.

---

## 4. Inhoud van MASTER.md (concreet)

Het masterbestand kan de volgende secties hebben (met korte inhoud en links):

```markdown
# Q8 Parking B2B PWA – Masterdocumentatie

## 1. Wat is deze app
[2–3 zinnen + link naar docs/AGENT_CONTEXT.md en ARCHITECTURE.md]

## 2. Huidige functionaliteiten
[Compacte tabel: onderdeel | status | waar gedocumenteerd]
[Link: RAPPORT_USER_STORIES_EN_FUNCTIONALITEITEN_ANALYSE, screens_overview]

## 3. Productstatus
- Wat werkt nu
- Wat ontbreekt / gepland
[Link: PRODUCT_ANALYSIS, task.md]

## 4. Plannen en ideeën
| Plan | Korte omschrijving | Document |
|------|--------------------|----------|
| Fleet Manager Portal | … | FLEET_MANAGER_ADMIN_PORTAL_PLAN.md |
| Garages & P+R (NPROPENDATA) | … | PLAN_GARAGES_P_R_NPROPENDATA.md |
| Milieuzone & kenteken | … | MILIEUZONE_KENTEKEN_PLAN.md |
| UI Redesign | … | UI_REDESIGN_PLAN.md |
| UI Verfijning | … | UI_VERFIJNINGSPLAN.md |

## 5. Onderzoeken en rapporten
[Lijst met titel + link: NPR/RDW, parkerapps, tarieven, RDW-datasets, kenteken/laadpaal]

## 6. Technische referentie
[Schema’s, sync, events, kenteken – titel + link]

## 7. Root cause / fixes
[RECOVERY_ANALYSIS, ROOT_CAUSE_*, CODE_ANALYSE_OPSCHONING – kort + link]

## 8. PWA, UX, installatie
[PWA guides, QUICK_CHECKLIST, UX_UI, ICON_CREATION – kort + link]

## 9. Hoe we werken
[Verwijzing WORKING_RULES, .cursorrules, directives/ui-parking-pwa.md]

## 10. Volledige documentlijst
[Tabel: Bestand | Categorie | Korte omschrijving]
```

Zo heb je **één bestand** dat alle informatie “bij elkaar brengt” in de vorm van overzicht + links; de details blijven in de bestaande documenten.

---

## 5. Stappenplan (uitvoering)

| Stap | Actie | Prioriteit |
|------|--------|------------|
| 1 | **MASTER.md aanmaken** in `docs/` met secties 1–10 en links naar bestaande docs (zonder mappen eerst). | Hoog |
| 2 | In MASTER.md alle bestaande documenten opnemen in sectie 10 (volledige documentlijst) met categorie en korte omschrijving. | Hoog |
| 3 | **WORKING_RULES** en **.cursorrules** laten verwijzen naar “Start in docs/MASTER.md voor overzicht”. | Optioneel |
| 4 | **AGENT_CONTEXT.md** aanpassen: aan het begin één zin: “Voor volledig overzicht van documentatie: docs/MASTER.md”. | Optioneel |
| 5 | (Optioneel) **Mappen** onder `docs/` aanmaken en bestanden verplaatsen; daarna alle links in MASTER en andere docs updaten. | Laag |
| 6 | Afspraak vastleggen: bij elk nieuw plan/rapport/doc ook een regel in MASTER.md toevoegen. | Onderhoud |

---

## 6. Afspraken om de master actueel te houden

- **Nieuw document:** Altijd toevoegen aan de juiste sectie in MASTER.md (en aan de documentlijst in sectie 10).
- **Nieuw plan of idee:** Kort in sectie 4 (Plannen en ideeën) + link naar het nieuwe doc.
- **Grote wijziging in product/functionaliteit:** Secties 2 en 3 van MASTER.md bijwerken (of de link naar PRODUCT_ANALYSIS / User Stories laten wijzen op het bijgewerkte doc).
- **WORKING_RULES / .cursorrules wijzigen:** Geen aparte afspraak; die bestanden blijven de bron; MASTER verwijst alleen naar ze.

---

## 7. Samenvatting

| Vraag | Antwoord |
|-------|----------|
| **Waar is “alles op één plek”?** | In **`docs/MASTER.md`**: overzicht, status, alle plannen, ideeën, functionaliteiten en links naar elk document. |
| **Blijven bestaande docs bestaan?** | Ja. Ze worden niet samengevoegd tot één reuzenbestand; ze worden geïndexeerd en gelinkt vanuit MASTER. |
| **Moeten we mappen aanmaken?** | Optioneel. Kan later; eerst MASTER.md vullen en linken zonder mappen. |
| **Hoe blijft de master up-to-date?** | Afspraak: bij elk nieuw doc/plan een regel in MASTER toevoegen; bij grote productwijzigingen secties 2 en 3 updaten. |

Als je wilt, kan de volgende stap zijn: een concrete eerste versie van **`docs/MASTER.md`** schrijven met de huidige documenten en links (zonder mappen), zodat je direct één startpunt hebt.
