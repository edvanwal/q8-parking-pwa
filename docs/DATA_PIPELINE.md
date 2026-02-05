# Data pipeline – parkeerzones en facilities

Korte beschrijving van de data-pipeline: wanneer welke scripts draaien, optionele datum-/versiecontrole en gepland (cron) draaien.

---

## 1. Overzicht

| Script                                    | Doel                                                                                       | Output                           | Aanbevolen frequentie                                        |
| ----------------------------------------- | ------------------------------------------------------------------------------------------ | -------------------------------- | ------------------------------------------------------------ |
| `fetch_rdw_data.py`                       | Straatparkeerzones (gebieden, regelingen, tarieven) uit opendata.rdw.nl                    | Firestore collectie `zones`      | Na wijziging in TARGET_CITIES of periodiek (bijv. wekelijks) |
| `scripts/fetch_npropendata_facilities.py` | Garages en P+R uit npropendata.rdw.nl                                                      | Firestore collectie `facilities` | 1× per week (cron/scheduled task)                            |
| `scripts/check_tarief_integriteit.py`     | D1 – Tariefintegriteit: controle op lege rates bij price > 0 en price vs max(rate_numeric) | Exit 0 = ok, 1 = schendingen     | Periodiek of in CI na zone-upload                            |

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

## 4. D1 – Tariefintegriteit (check)

**Script:** `scripts/check_tarief_integriteit.py`

Controleert alle zones in Firestore:

- Geen lege `rates` wanneer `price > 0`.
- `price` consistent met het maximale uurtarief uit `rates` (veld `rate_numeric`), met een tolerantie van 0,02.

**Uitvoeren (vanuit projectroot, met service-account.json):**

```bash
python scripts/check_tarief_integriteit.py
```

- **Exit 0:** Geen schendingen.
- **Exit 1:** Een of meer schendingen (geschikt voor CI: faal de build bij exit 1).

**Integratie in de pipeline:** `fetch_rdw_data.py` voert dezelfde controles uit **vóór** de upload. Bij schendingen wordt er niet geüpload en eindigt het script met exit 1.

**CI:** Voer het script periodiek uit (bijv. na een zone-update of wekelijks), of na elke run van `fetch_rdw_data.py` als extra verificatie op de live database.

---

## 5. Referenties

- `docs/RDW_DATASETS_VARIABELEN_EN_KOPPELVELDEN.md` – Alle RDW-resources en variabelen
- `docs/RAPPORT_DATABRONNEN_VARIABELEN_PLAN.md` – Bronnen, variabelen, aanbevelingen
- `docs/PLAN_GARAGES_P_R_NPROPENDATA.md` – Garages/P+R plan en cron
- `docs/RAPPORT_DATABRONNEN_VARIABELEN_PLAN.md` – Aanbeveling D1 (tariefintegriteit)
