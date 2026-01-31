# 🧪 Uitgebreide Test Data: Parkeerzones NL

Dit bestand geeft een overzicht van de verbeterde, uitgebreide dataset die nu actief is in de applicatie. We hebben zones toegevoegd voor **Amsterdam**, **Rotterdam**, **Den Haag** en **Utrecht** om een realistischer landelijk beeld te testen.

Elke zone bevat nu:

- **Unieke ID** (bv. `363_MARK`)
- **Stad Specifieke Locatie** (Geen stapeling meer op één punt)
- **Gevarieerde Tarieven** (Geschaald op basis van RDW data)

## 📍 Amsterdam (363)

| Zone ID         | Naam           | Tarief (Est.) | Locatie (Lat/Lng)   |
| :-------------- | :------------- | :------------ | :------------------ |
| **`363_MARK`**  | Zone 363_MARK  | € 4,50 / h    | `52.3676`, `4.9041` |
| **`363_AREN`**  | Zone 363_AREN  | € 4,50 / h    | `52.3656`, `4.8831` |
| **`363_ARTIS`** | Zone 363_ARTIS | € 4,50 / h    | `52.3628`, `4.9137` |
| **`363_PRAR`**  | Zone 363_PRAR  | € 4,50 / h    | `52.3716`, `4.8861` |

## 📍 Rotterdam (599)

| Zone ID         | Naam           | Tarief (Est.) | Locatie (Lat/Lng)   |
| :-------------- | :------------- | :------------ | :------------------ |
| **`599_BEVER`** | Zone 599_BEVER | € 4,50 / h    | `51.9161`, `4.4720` |
| **`599_HOOG`**  | Zone 599_HOOG  | € 4,50 / h    | `51.9277`, `4.4738` |
| **`599_KOP`**   | Zone 599_KOP   | € 4,50 / h    | `51.9085`, `4.4942` |

## 📍 Den Haag (518)

| Zone ID         | Naam           | Tarief (Est.) | Locatie (Lat/Lng)   |
| :-------------- | :------------- | :------------ | :------------------ |
| **`518_PLEI`**  | Zone 518_PLEI  | € 4,50 / h    | `52.0709`, `4.3049` |
| **`518_MARK`**  | Zone 518_MARK  | € 4,50 / h    | `52.0713`, `4.3091` |
| **`518_SCHEV`** | Zone 518_SCHEV | € 4,50 / h    | `52.1045`, `4.2755` |

## 📍 Utrecht (344)

| Zone ID         | Naam           | Tarief (Est.) | Locatie (Lat/Lng)   |
| :-------------- | :------------- | :------------ | :------------------ |
| **`18100`**     | Zone 18100     | € 4,50 / h    | `52.0907`, `5.1214` |
| **`344_HVEEM`** | Zone 344_HVEEM | € 4,50 / h    | `52.0799`, `5.1280` |

---

## 🛠 Technische Verificatie

Gebruik de volgende JSON structuur om te verifiëren of de app correcte data binnenkrijgt via de console of network tab (`data/parking_zones.json`).

**Voorbeeld Amsterdam:**

```json
{
  "id": "363_MARK",
  "name": "Zone 363_MARK",
  "lat": 52.3676,
  "lng": 4.9041,
  "price": 4.5,
  "rates": [...]
}
```

**Voorbeeld Rotterdam (Scatter Check):**
Als de RDW geen geometrie levert voor een zone, moet de zone 'gescatterd' zijn rondom het stadscentrum (`51.9225`, `4.47917`) en niet rondom Utrecht!
