# Data pipeline – parkeerzones en facilities

Korte beschrijving van de data-pipeline: wanneer welke scripts draaien, optionele datum-/versiecontrole en gepland (cron) draaien.

---

## 1. Overzicht

| Script | Doel | Output | Aanbevolen frequentie |
|--------|------|--------|------------------------|
| `fetch_rdw_data.py` | Straatparkeerzones (gebieden, regelingen, tarieven) uit opendata.rdw.nl | Firestore collectie `zones` | Na wijziging in TARGET_CITIES of periodiek (bijv. wekelijks) |
| `scripts/fetch_npropendata_facilities.py` | Garages en P+R uit npropendata.rdw.nl | Firestore collectie `facilities` | 1× per week (cron/scheduled task) |

Zie `docs/RDW_DATASETS_VARIABELEN_EN_KOPPELVELDEN.md` voor alle RDW-resources en variabelen.

---

## 2. fetch_rdw_data.py (zones)

**Vereisten:** Python 3, `firebase-admin`, `python-dotenv`, `google-generativeai`. Bestand `service-account.json` (of Firebase service-account) in projectroot. Optioneel: `GEMINI_API_KEY` in `.env` voor vertaling tariefomschrijvingen.

**Uitvoeren:**
```bash
python fetch_rdw_data.py
```

**Optionele datumfilter (minder payload):** Alleen nu geldige regelingen ophalen (mapping: `enddatearearegulation` is null of ≥ vandaag). Zet in omgeving:
```bash
set RDW_USE_DATE_FILTER=1
python fetch_rdw_data.py
```
(Linux/macOS: `export RDW_USE_DATE_FILTER=1`.)

**Versie/datum:** Er is geen “alleen gewijzigde records” van de RDW; het script doet een **full fetch** en schrijft alle zones opnieuw. Het veld `updated_at` in elk zone-document is de **run-timestamp** (ISO) van het script. Voor echte incrementele runs zou de bron een `last_modified`-veld moeten aanbieden.

**Uitbreiding gemeenten:** Pas `TARGET_CITIES` in `fetch_rdw_data.py` aan; zie `docs/RDW_DATASETS_VARIABELEN_EN_KOPPELVELDEN.md` sectie 9.

---

## 3. fetch_npropendata_facilities.py (garages en P+R)

**Vereisten:** Python 3, `firebase-admin`. Firebase service-account in projectroot.

**Uitvoeren:**
```bash
python scripts/fetch_npropendata_facilities.py
```

**Opties:**
- `--dry-run` – Geen Firestore-schrijf; alleen tellen en voorbeeld uitprinten.
- `--limit N` – Maximaal N facilities ophalen (0 = alle).
- `--incremental` – Alleen static data ophalen voor facilities waar `staticDataLastUpdated` is gewijzigd; bestaande docs hergebruiken. Minder requests en sneller bij wekelijkse run.

**Cron / gepland draaien (aanbevolen: 1× per week):**

- **Linux/macOS (cron):**
  ```cron
  0 3 * * 0 cd /pad/naar/projectroot && python3 scripts/fetch_npropendata_facilities.py
  ```
  (elke zondag 03:00)

- **Windows (Taakplanner):**  
  Taak wekelijks; actie: `python` met argumenten `scripts\fetch_npropendata_facilities.py`, startmap = projectroot.

- **Incrementeel wekelijks (minder belasting):**
  ```cron
  0 3 * * 0 cd /pad/naar/projectroot && python3 scripts/fetch_npropendata_facilities.py --incremental
  ```

Zie ook `docs/PLAN_GARAGES_P_R_NPROPENDATA.md` sectie 9.

---

## 4. Referenties

- `docs/RDW_DATASETS_VARIABELEN_EN_KOPPELVELDEN.md` – Alle RDW-resources en variabelen
- `docs/RAPPORT_DATABRONNEN_VARIABELEN_PLAN.md` – Bronnen, variabelen, aanbevelingen
- `docs/PLAN_GARAGES_P_R_NPROPENDATA.md` – Garages/P+R plan en cron
