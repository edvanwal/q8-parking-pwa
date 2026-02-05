# Milieuzones in Nederland – Onderzoek en plan koppeling kenteken

**Doel:** Gebruikers op basis van hun kenteken informeren over toegang tot milieuzones in Nederlandse steden: of ze ergens **nu** niet in mogen of **vanaf een bepaalde datum** niet meer in mogen, en dit koppelen aan de bestaande parkeer-PWA.

---

## 1. Onderzoeksresultaten: hoe werken milieuzones?

### 1.1 Overzicht milieuzones (personen- en bestelauto’s)

Er zijn **vier steden** met een milieuzone voor **personenauto’s en/of bestelauto’s op diesel**:

| Stad          | Type zone | Minimale emissieklasse diesel | Opmerking                                                                    |
| ------------- | --------- | ----------------------------- | ---------------------------------------------------------------------------- |
| **Amsterdam** | Blauw     | 5 of hoger                    | Personenauto’s: blauwe zone. Bestelauto’s: zero-emissiezone (aparte regels). |
| **Utrecht**   | Blauw     | 5 of hoger                    | Zelfde als Amsterdam; bestelauto’s vallen onder zero-emissiezone.            |
| **Arnhem**    | Groen     | 4 of hoger                    | Groene milieuzone voor diesel.                                               |
| **Den Haag**  | Groen     | 4 of hoger                    | Alleen personenauto’s; bestelauto’s onder zero-emissiezone.                  |

- **Benzine, LPG, elektrisch:** altijd toegang tot alle milieuzones (geen restrictie voor personen-/bestelauto’s).
- **Diesel:** toegang hangt af van **emissieklasse** (0–6 of Z).
  - **Groen:** emissieklasse **4, 5 of 6** mag. 0, 1, 2, 3 niet.
  - **Blauw:** alleen **5 of 6** mag. 0–4 niet.

Bronnen: [milieuzones.nl – personen- en bestelauto’s](https://www.milieuzones.nl/personen-en-bestelautos), [locaties milieuzones](https://www.milieuzones.nl/locaties-milieuzones).

### 1.2 Emissieklasse

- **0–6:** hoe hoger, hoe schoner (Euro-norm: bijv. Euro 4 → 4, Euro 6 → 6).
- **Z:** zero-emissie (elektrisch e.d.); altijd toegestaan.
- RDW bepaalt emissieklasse o.a. uit typegoedkeuring (V.9) of datum eerste toelating.

### 1.3 Zero-emissiezones (bestel- en vrachtauto’s)

- Vanaf **1 januari 2025** (en later in 2025 in meer gemeenten) zijn er **zero-emissiezones** voor **vracht- en bestelauto’s**.
- **Personenauto’s** vallen **niet** onder zero-emissiezones.
- Voor **bestelauto’s** geldt o.a. overgangsregeling tot 2030; toegang hangt o.a. af van emissieklasse 5/6 en zero-emissie.
- Check: [OpwegnaarZes.nl](https://www.opwegnaarzes.nl/) / Zero-emissie Kentekencheck.

**Conclusie voor deze PWA:**

- **Personenauto’s:** alleen de **vier steden + groen/blauw + diesel emissieklasse** zijn relevant.
- **Bestelauto’s:** naast milieuzone (groen/blauw) later eventueel zero-emissie-info toevoegen (aparte bron/check).

### 1.4 “Vanaf periode X niet meer toegestaan”

- Milieuzoneregels kunnen **aanscherpen** (bijv. groen → blauw, of hogere minimale emissieklasse).
- Op milieuzones.nl en gemeentesites staan geen vaste “ingangsdata” voor toekomstige aanscherpingen; die worden per gemeente bekendgemaakt.
- **Implementatie:** we kunnen nu **huidige regels** koppelen aan kenteken. Voor “vanaf datum X niet meer toegestaan” kunnen we:
  - een **veld “regel geldig vanaf”** in onze eigen zone-metadata bijhouden, en
  - bij bekende toekomstige aanscherpingen (bijv. “per 2026 alleen emissieklasse 6”) een **tweede regel** met ingangsdatum tonen, zodat de app kan zeggen: “Nu wel toegestaan, maar vanaf [datum] niet meer.”

---

## 2. Koppeling aan kenteken

### 2.1 Benodigde voertuiggegevens

| Gegeven           | Gebruik bij milieuzone                                          | Bron RDW Open Data                                                                          |
| ----------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **Brandstof**     | Benzine/LPG/elektrisch → altijd toegang; diesel → emissie check | Dataset **8ys7-d773** (Gekentekende_voertuigen_brandstof): `brandstof_omschrijving`         |
| **Emissieklasse** | Diesel: vergelijken met minimale klasse groen (4) / blauw (5)   | Zelfde dataset **8ys7-d773**: `emissiecode_omschrijving` (waarden o.a. "0","4","5","6","Z") |
| **Voertuigsoort** | Personenauto vs. bestelauto (later voor zero-emissie)           | Dataset **m9d7-ebf2** (Gekentekende_voertuigen): `voertuigsoort`                            |

- **m9d7-ebf2** wordt in de PWA al gebruikt voor kentekenlookup (o.a. merk, handelsbenaming, voertuigsoort).
- **8ys7-d773** moet **per kenteken** worden opgehaald om brandstof + emissiecode te krijgen.

### 2.2 RDW-datasets (gratis, geen API-key)

- **Gekentekende voertuigen:**  
  `https://opendata.rdw.nl/resource/m9d7-ebf2.json?kenteken={kenteken}&$limit=1`  
  Velden: o.a. `kenteken`, `voertuigsoort`, `merk`, `handelsbenaming`.
- **Gekentekende voertuigen brandstof:**  
  `https://opendata.rdw.nl/resource/8ys7-d773.json?kenteken={kenteken}&$limit=1`  
  Velden: o.a. `brandstof_omschrijving`, `emissiecode_omschrijving` (emissieklasse 0–6 of Z).

Getest: bij diesel komt `emissiecode_omschrijving` voor als "0", "4", "5", "6" etc.; bij elektrisch o.a. "Z".

### 2.3 Logica: toegang per stad

```
Als brandstof ≠ Diesel → toegang alle 4 steden.
Als brandstof = Diesel:
  emissieklasse = parse(emissiecode_omschrijving)  // 0-6 of Z
  Als emissieklasse = Z → toegang (niet van toepassing bij diesel, maar veilig)
  Groene zone (Arnhem, Den Haag): toegang als emissieklasse >= 4
  Blauwe zone (Amsterdam, Utrecht): toegang als emissieklasse >= 5
```

- Ontbrekende of onbekende emissiecode bij diesel: **geen toegang** tot groen/blauw (veilige aanname), of tonen “onbekend – check milieuzones.nl”.

### 2.4 Beperkingen

- **Alleen Nederlandse kentekens:** RDW Open Data is op NL-kenteken. Buitenlandse kentekens: geen automatische check (eventueel later: handmatige invoer datum eerste toelating + tabel).
- **Vrijstellingen/ontheffingen** worden niet meegenomen; gebruiker moet bij gemeente informeren.
- **Zero-emissiezones** voor bestelauto’s: andere regels en andere check (OpwegnaarZes); nu buiten scope, later uitbreidbaar.

---

## 3. Gebruikerservaring (wat kan de app zeggen?)

### 3.1 Per geselecteerd kenteken

- **Algemeen:**
  - “Uw voertuig [merk/type] (brandstof, emissieklasse X) heeft toegang tot alle milieuzones voor personenauto’s”  
    of
  - “Uw voertuig mag **niet** in de milieuzone in [stad]. [Reden: diesel, emissieklasse X; vereist groen 4+ / blauw 5+].”

- **Per stad (Amsterdam, Utrecht, Arnhem, Den Haag):**
  - Toegang **ja** / **nee**
  - Korte reden: “Diesel, emissieklasse 4 – toegestaan in groene zones (Arnhem, Den Haag), niet in blauwe (Amsterdam, Utrecht).”

### 3.2 “Vanaf periode X niet meer toegestaan”

- Als we **toekomstige regels** (met ingangsdatum) in onze data hebben:
  - “Uw voertuig mag nu nog in [stad], maar **vanaf [datum]** niet meer wegens aanscherping milieuzone.”
- Zonder toekomstige data: alleen **huidige** status tonen en eventueel link naar milieuzones.nl / gemeente voor wijzigingen.

### 3.3 Waar tonen in de PWA?

- **Bij kentekenkeuze / -controle:** na RDW-lookup: korte samenvatting “Toegang milieuzones: …” + link “Details per stad”.
- **Op kaart / zoekresultaat:** bij zones in Amsterdam, Utrecht, Arnhem, Den Haag: icoon of badge “Milieuzone” + voor geselecteerd kenteken “Toegestaan” / “Niet toegestaan”.
- **In zone-detail (parkeerzone in zo’n stad):** expliciet: “Deze zone ligt in de [groene/blauwe] milieuzone van [stad]. Uw voertuig: [toegestaan/niet toegestaan].”

---

## 4. Implementatieplan

### Fase 1 – Data en logica (backend/frontend-agnostisch)

1. **Statische dataset milieuzones (personenauto’s)**
   - Lijst van de 4 steden met: stad, zone-type (groen/blauw), minimale emissieklasse (4 resp. 5).
   - Optioneel: koppeling naar RDW-gebied/area (parkeerzones) als we area-id’s per stad hebben, zodat we per zone kunnen zeggen “ligt in milieuzone Amsterdam”.

2. **Kenteken → brandstof + emissieklasse**
   - Bij bestaande RDW-lookup (m9d7-ebf2) een tweede call naar 8ys7-d773 (brandstof) toevoegen.
   - Response uitbreiden met: `brandstof_omschrijving`, `emissiecode_omschrijving`.
   - In `kenteken.js` (of gedeelde service): na lookup beide datasets combineren en één object “voertuig + brandstof + emissie” opleveren.

3. **Regelmodule milieuzone**
   - Functie: `getMilieuzoneAccess(voertuig, stad)` of `getMilieuzoneStatusPerCity(voertuig)`.
   - Input: brandstof, emissiecode_omschrijving (en optioneel voertuigsoort).
   - Output: per stad `{ city, allowed, reason, minRequired }`.
   - Afhandeling ontbrekende/onbekende emissie bij diesel: “onbekend” of “geen toegang” + advies om milieuzones.nl te raadplegen.

### Fase 2 – Integratie in PWA

4. **Bij toevoegen/controleren kenteken**
   - Na succesvolle RDW + brandstof-lookup: milieuzone-status berekenen en tonen (bijv. onder “RDW-gevonden: …”):
     - “Milieuzones: toegang in alle vier steden” of “Geen toegang in Amsterdam en Utrecht (diesel, emissieklasse 4).”

5. **In zoekresultaat / kaart**
   - Als een parkeerzone in Amsterdam, Utrecht, Arnhem of Den Haag zit:
     - Zone voorzien van metadata “milieuzone: { city, type }”.
   - Bij geselecteerd kenteken: in tooltip of detail: “Milieuzone [stad]: [toegestaan/niet toegestaan].”

6. **Zone-detail / parkeerinfo**
   - In het scherm waar één zone wordt getoond: als die in een milieuzone ligt, een regel:
     - “Deze zone ligt in de [groene/blauwe] milieuzone. Uw voertuig: [toegestaan/niet toegestaan].”
   - Eventueel link: “Meer over milieuzones: milieuzones.nl”.

### Fase 3 – “Vanaf periode X” (optioneel)

7. **Metadata toekomstige regels**
   - In statische data per stad optioneel: `geldigVanaf`, `minEmissieklasseVanaf` (bij bekende aanscherping).
   - In regelmodule: als voertuig nu wél toegang heeft maar toekomstige regel strenger is: status “toegestaan nu, maar niet meer vanaf [datum]”.

8. **Copy en disclaimer**
   - Altijd vermelden: “Geen rekening gehouden met ontheffingen. Bij twijfel: milieuzones.nl of de gemeente.”

---

## 5. Samenvatting

| Vraag                                                                   | Antwoord                                                                                                                                    |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Welke steden hebben milieuzones voor personenauto’s?                    | Amsterdam, Utrecht (blauw), Arnhem, Den Haag (groen).                                                                                       |
| Welk type auto’s wanneer niet/beperkt toegelaten?                       | Alleen **diesel**; groen: emissieklasse &lt; 4 niet; blauw: emissieklasse &lt; 5 niet. Benzine/LPG/elektrisch altijd toegang.               |
| Kunnen we dit koppelen aan kenteken?                                    | **Ja:** RDW Open Data 8ys7-d773 levert brandstof + emissiecode (emissieklasse); m9d7-ebf2 levert voertuigsoort. Geen API-key nodig.         |
| Kan de gebruiker zien “niet toegestaan” of “vanaf periode X niet meer”? | **Nu:** ja, voor huidige regels. **“Vanaf periode X”:** ja, als we ingangsdata van (toekomstige) aanscherpingen in onze metadata bijhouden. |

**Implementatie (uitgevoerd):**

- Fase 1: Statische data 4 steden in `kenteken.js` (MILIEUZONE_CITIES), lookup uitgebreid met 8ys7-d773 (brandstof + emissiecode), regelmodule `getMilieuzoneStatus` / `getMilieuzoneStatusForCity` / `getMilieuzoneCityInfo`.
- Fase 2: Bij toevoegen kenteken en bij "Check at RDW" wordt `vehicleDataByPlate` bijgewerkt en milieuzone-samenvatting getoond (toast + #plate-rdw-result). In zone-sheet: bij zones in Amsterdam, Utrecht, Arnhem, Den Haag wordt milieuzone-blok getoond met toegang ja/nee voor geselecteerd kenteken (als RDW-data beschikbaar).

---

## 6. Bronnen

- [Milieuzones in Nederland – personen- en bestelauto’s](https://www.milieuzones.nl/personen-en-bestelautos)
- [Locaties milieuzones](https://www.milieuzones.nl/locaties-milieuzones)
- [Milieuzonecheck (kenteken)](https://www.milieuzones.nl/check)
- [Zero-emissiezones / OpwegnaarZes](https://www.opwegnaarzes.nl/)
- RDW Open Data: [Gekentekende voertuigen (m9d7-ebf2)](https://opendata.rdw.nl/resource/m9d7-ebf2.json), [Gekentekende voertuigen brandstof (8ys7-d773)](https://opendata.rdw.nl/resource/8ys7-d773.json)
- [RDW – Emissieklasse van uw voertuig](https://www.rdw.nl/uw-voertuig-en-uw-gegevens/iets-veranderen-aan-uw-voertuig/emissieklasse-van-uw-voertuig)
