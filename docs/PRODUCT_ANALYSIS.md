# Productanalyse – Q8 Parking PWA

**Datum:** 31 januari 2025  
**Status:** Read-only analyse, geen code-aanpassingen  
**Leidend:** WORKING_RULES.md

---

## 1. Samenvatting huidige staat

De app ondersteunt de kernflow van een chauffeur: zoeken naar een parkeerzone, zone kiezen, kenteken selecteren, parkeren starten en stoppen. Daarnaast zijn kentekens en parkeerhistorie aanwezig, maar niet volledig functioneel.

**Wat werkt:**

- Inloggen en navigatie tussen schermen
- Kaart met parkeerzones en prijzen
- Zoeken op zone (zone-ID of naam)
- Zone selecteren via kaart of zoekresultaten
- Zone-sheet met tarieven, duur en kentekenkeuze
- Parkeersessie starten en stoppen (opslag in localStorage)
- Kentekens toevoegen, verwijderen en als standaard instellen
- Timer tijdens actieve sessie (count-up of count-down)

**Wat ontbreekt of incompleet is:**

- Parkeerhistorie wordt nergens gevuld; het scherm toont altijd “No parking history found”
- Sessies worden niet opgeslagen naar Firestore; bij einde sessie gaat de data verloren
- Het gekozen kenteken wordt niet opgeslagen in de sessie
- Geen feedback naar de chauffeur als een actie niet lukt (bijv. geen zone geselecteerd)

---

## 2. Flow-analyse

### 2.1 Zone selectie

| Aspect                                | Status                          |
| ------------------------------------- | ------------------------------- |
| Kaartmarkers tonen zones              | Werkt                           |
| Klik op marker opent zone-sheet       | Werkt                           |
| Zoekresultaten tonen matches          | Werkt (alleen zone-ID en -naam) |
| Zone-sheet toont zone, tarieven, duur | Werkt                           |
| Kenteken kiezen vóór start            | Werkt                           |

**Kwetsbaar:**

- Als de kaart nog laadt of zones ontbreken, kan een klik geen zone openen; de chauffeur krijgt geen melding
- Zoeken op adres (straat/plaats) is beperkt; resultaten filteren hoofdzakelijk op zone-ID en zone-naam

**Ontbrekende feedback:**

- Geen melding als er geen zones worden gevonden
- Geen laadindicator terwijl zones van Firestore komen

---

### 2.2 Start parkeeractie

| Aspect                                       | Status                                      |
| -------------------------------------------- | ------------------------------------------- |
| Zone kiezen → duur instellen → START PARKING | Werkt                                       |
| Kenteken selecteren in zone-sheet            | Werkt                                       |
| Blokkade bij actieve sessie                  | Werkt (toast: “You have an active session”) |
| Sessieopslag in localStorage                 | Werkt                                       |

**Kwetsbaar:**

- Start wordt stil geblokkeerd als geen zone geselecteerd is of het zone-sheet gesloten is; de chauffeur ziet geen foutmelding
- Het gekozen kenteken wordt niet vastgelegd in de sessie; de actieve kaart gebruikt standaard het eerste/default kenteken
- Als de zone niet meer in de geladen zones voorkomt, wordt er niet expliciet gewaarschuwd

**Ontbrekende feedback:**

- Geen expliciete bevestiging dat parkeren is gestart (alleen een toast)

---

### 2.3 Actieve parkeersessie

| Aspect                                         | Status |
| ---------------------------------------------- | ------ |
| Actieve kaart met zone, kenteken, timer        | Werkt  |
| Count-up (open-end) en count-down (vaste duur) | Werkt  |
| Timer loopt na refresh (via localStorage)      | Werkt  |
| Eind parkeren via END PARKING → bevestiging    | Werkt  |

**Kwetsbaar:**

- Bij verlopen sessie (count-down 00:00) stopt alleen de weergave; er is geen automatische afhandeling of herinnering
- Bij herladen wordt het kenteken niet uit de sessie gehaald; er wordt altijd het default kenteken getoond

**Ontbrekende feedback:**

- Geen waarschuwing vlak voor einde van de vaste parkeertijd
- Geen optie om sessie te verlengen

---

### 2.4 Kentekens beheren

| Aspect                     | Status |
| -------------------------- | ------ |
| Kentekens toevoegen        | Werkt  |
| Kentekens verwijderen      | Werkt  |
| Default kenteken instellen | Werkt  |
| Opslag in localStorage     | Werkt  |

**Kwetsbaar:**

- Validatie alleen client-side; format “1-ABC-123” wordt gecontroleerd, maar niet tegen een externe bron
- Geen controle of een kenteken al in een actieve sessie zit voordat het wordt verwijderd

**Ontbrekende feedback:**

- Geen bevestiging bij verwijderen (“Weet u het zeker?”)

---

### 2.5 Parkeerhistorie & kosten

| Aspect                      | Status                                |
| --------------------------- | ------------------------------------- |
| Scherm Parkeerhistorie      | Bestaat                               |
| Filter op voertuig en datum | UI aanwezig                           |
| Geschiedenis tonen          | Werkt niet: data wordt niet opgebouwd |

**Probleem:**

- `state.history` blijft leeg; er is geen Firestore-listener of andere bron die oude sessies ophaalt
- Bij einde parkeren wordt de sessie niet aan de historie toegevoegd
- De filters hebben daardoor in de praktijk geen effect

**Aanname:** Er is een Firestore-collectie voor sessies/historie voorzien, maar de frontend sluit daar nog niet op aan.

---

## 3. Edge cases

| Edge case                                   | Huidig gedrag                                         | Risico voor chauffeur                   |
| ------------------------------------------- | ----------------------------------------------------- | --------------------------------------- |
| Geen zone geselecteerd, toch START PARKING  | Actie wordt geblokkeerd, geen melding                 | Chauffeur denkt dat parkeren gestart is |
| Refresh tijdens actieve sessie              | Sessie wordt uit localStorage hersteld                | Werkt; timer en zone blijven zichtbaar  |
| localStorage gewist (privémodus, opschonen) | Sessie en kentekens verdwijnen                        | Sessie en kentekens zijn kwijt          |
| Netwerk uit tijdens laden                   | Zones laaden niet; kaart blijft leeg of met oude data | Geen duidelijke foutmelding             |
| Zone niet meer in Firestore                 | Zone kan nog in state zitten; sessie start mogelijk   | Mogelijke inconsistentie                |
| Sessie duurt langer dan max. duur zone      | Geen automatische afhandeling                         | Chauffeur moet zelf stoppen             |

---

## 4. Prioriteitenlijst herstel

| Prioriteit | Flow                                        | Motivatie                                                                                                                                                            |
| ---------- | ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1**      | **Start parkeeractie – gebruikersfeedback** | Chauffeur moet direct zien wanneer start mislukt (geen zone, verkeerd scherm). Klein aanpassingsbereik, groot effect op vertrouwen.                                  |
| **2**      | **Parkeerhistorie – data opbouwen**         | Chauffeurs willen hun parkeerhistorie zien. Historie is cruciaal voor administratie en kosten. Vereist een duidelijke keuze: lokaal (localStorage) of via Firestore. |
| **3**      | **Kenteken vastleggen in sessie**           | Zonder vastgelegd kenteken is het onduidelijk met welk voertuig geparkeerd werd; lastig bij meerdere auto’s.                                                         |
| **4**      | **Zone selectie – foutmeldingen**           | Geen zones gevonden of kaart niet geladen: duidelijke meldingen voorkomen verwarring.                                                                                |
| **5**      | **Netwerk- en laadstatus**                  | Minder urgent bij stabiel netwerk, maar belangrijk voor gebruik onderweg (buiten de stad, slechte verbinding).                                                       |

---

## 5. Aanbevolen volgende flow om te herstellen

**Start parkeeractie – gebruikersfeedback (Prioriteit 1)**

- **Probleem:** Stille blokkade als de chauffeur START PARKING drukt zonder zone of buiten het zone-sheet.
- **Oplossing:** Toon een toast of korte melding zodra start geblokkeerd wordt, bijv.: “Selecteer eerst een parkeerzone” of “Open een zone om te starten”.
- **Impact:** Chauffeur begrijpt waarom er niets gebeurt.
- **Omvang:** Beperkt tot foutafhandeling in de startlogica.

---

## 6. Vragen voor de Product Owner (max. 3)

1. **Parkeerhistorie:** Moet de historie alleen lokaal (op dit apparaat) bijgehouden worden, of moeten sessies naar Firestore worden weggeschreven zodat ze op alle apparaten en voor rapportage beschikbaar zijn?

2. **Kenteken in sessie:** Moet het gekozen kenteken verplicht worden vastgelegd bij het starten van een parkeersessie, zodat de actieve sessie en de historie altijd het juiste voertuig tonen?

3. **Netwerk offline:** Is het een vereiste dat de app (buiten login) ook offline werkt (bijv. actieve sessie en kentekens blijven bruikbaar), of is een online-only scenario voldoende voor nu?
