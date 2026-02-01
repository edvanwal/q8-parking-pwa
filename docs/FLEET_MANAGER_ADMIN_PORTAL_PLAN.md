# Fleet Manager & Admin Portal – Plan

**Versie:** 1.0  
**Datum:** 1 februari 2025  
**Status:** Plan – ter review

---

## 1. Samenvatting

Dit document beschrijft het plan voor een **multitennend fleet manager- en adminportaal** voor de Q8 Parking PWA. Het portaal richt zich op twee doelgroepen:

1. **Q8-medewerkers (intern)** – Volledige controle over alle tenants, sessies en gebruikers
2. **Fleetmanagers** – Beheer van hun eigen organisatie, medewerkers en rijders

---

## 2. Doelgroepen en rollen

### 2.1 Doelgroep 1: Q8-medewerkers (Super Admin)

| Aspect | Beschrijving |
|--------|--------------|
| **Wie** | Interne medewerkers van Q8 |
| **Scope** | Alle tenants (bedrijven) in het systeem |
| **Rechten** | Volledige toegang: tenants aanmaken, fleetmanagers beheren, sessies overal stoppen, alle variabelen aanpassen |
| **Use case** | Support, configuratie, incidentbeheer |

### 2.2 Doelgroep 2: Fleetmanagers

| Aspect | Beschrijving |
|--------|--------------|
| **Wie** | Medewerkers van klantbedrijven met wagenparkverantwoordelijkheid |
| **Scope** | Alleen hun eigen organisatie (tenant) |
| **Rechten** | Beperkt tot hun medewerkers/rijders (zie onderstaande matrix) |

### 2.3 Gebruikerstypen binnen een tenant

| Type | Beschrijving | Rechten |
|------|--------------|---------|
| **Fleetmanager** | Beheert wagenpark en rijders | Zie sectie 5 |
| **Bestuurder / Rijder** | Gebruikt de parkeerapp dagelijks | Parkeersessies starten/stoppen, eigen kentekens (indien toegestaan) |
| **Collega / Medewerker** | Beperkte rol, bijvoorbeeld alleen kijkrechten | Alleen rapportages bekijken, geen sessies beheren |

### 2.4 Rechtenmatrix (voorbeeld)

| Functie | Super Admin (Q8) | Fleetmanager | Bestuurder | Collega (kijk) |
|---------|------------------|--------------|------------|----------------|
| Tenants beheren | ✓ | – | – | – |
| Fleetmanagers aanmaken | ✓ | – | – | – |
| Bestuurders/collega’s aanmaken | ✓ | ✓ (eigen tenant) | – | – |
| Gebruikers wijzigen | ✓ | ✓ | – | – |
| Parkeersessies handmatig stoppen | ✓ (alle) | ✓ (eigen tenant) | Eigen sessie | – |
| Auto-stop tijd instellen | ✓ | ✓ | – | – |
| Berichten naar rijders sturen | ✓ | ✓ | – | – |
| Kentekenbeheer (toevoegen, beperken) | ✓ | ✓ | Eigen (indien toegestaan) | – |
| Rapporten bekijken | ✓ | ✓ | Eigen | ✓ (indien toegewezen) |
| Rapporten exporteren (PDF/CSV/XLSX) | ✓ | ✓ | – | ✓ (indien toegewezen) |

---

## 3. Overzicht variabelen in de huidige app

De volgende variabelen zijn momenteel in de app aanwezig en kunnen door een fleetmanager of admin beïnvloed worden.

### 3.1 State / localStorage (per gebruiker)

| Variabele | Type | Beschrijving | Nu opgeslagen |
|-----------|------|--------------|---------------|
| `session` | Object | Actieve parkeersessie: zone, zoneUid, plate, start, end | localStorage |
| `plates` | Array | Kentekens: id, text, description, default | localStorage |
| `selectedPlateId` | string | Geselecteerd kenteken voor sessie | In-memory |
| `duration` | number | Duur in minuten (0 = tot stoppen) | In-memory |
| `selectedZone` | string | Geselecteerde zone uid | In-memory |
| `historyFilters` | Object | vehicles, dateRange, customStart, customEnd | In-memory |
| `notifications` | Array | Notificatiehistorie | localStorage |
| `notificationSettings` | Object | sessionStarted, sessionExpiringSoon, expiringSoonMinutes, etc. | localStorage |
| `favorites` | Array | Favoriete zones [{ zoneUid, zoneId }] | localStorage |
| `language` | string | 'nl' \| 'en' | In-memory |
| `history` | Array | Parkeerhistorie (transacties) | Nu leeg / mock |

### 3.2 Gebruiker- en sessie-specifieke data (te migreren naar backend)

De volgende data moet voor het portaal naar Firestore (of vergelijkbaar) worden verplaatst:

| Entiteit | Velden | Doel |
|----------|--------|------|
| **User** | uid, email, tenantId, role, driverSettings | Koppeling aan tenant, rol, instellingen |
| **DriverSettings** | allowedDays, maxPlates, canAddPlates, platesLocked, etc. | Fleet-gerelateerde beperkingen |
| **Session** | zone, zoneUid, plate, start, end, userId, tenantId | Sessies centraal opslaan |
| **Transaction** | zone, plate, start, end, cost, userId, tenantId | Voor rapportages en declaratie |
| **Plates (per user)** | id, text, description, default, source (user/admin) | Kentekens kunnen door admin zijn toegevoegd |

---

## 4. Wat kan de fleetmanager aanpassen?

### 4.1 Gebruikersbeheer (uw idee 1)

- Nieuwe bestuurders aanmaken (e-mail, naam, optioneel wachtwoord of invite-flow)
- Bestuurders wijzigen (naam, e-mail, status actief/inactief)
- Collega’s aanmaken met alleen kijkrechten
- Gebruikers verwijderen of deactiveren

### 4.2 Gebruiksdagen (uw idee 2)

| Instelling | Beschrijving | Mogelijke waarden |
|------------|--------------|-------------------|
| `allowedDays` | Dagen waarop de bestuurder de app mag gebruiken | Ma–Zo, of selectie (bijv. Ma–Vr) |
| `allowedTimeStart` | Start van toegestane tijd | Bijv. 07:00 |
| `allowedTimeEnd` | Einde toegestane tijd | Bijv. 19:00 |

*Als de bestuurder buiten deze periode probeert te parkeren: melding tonen en start blokkeren.*

### 4.3 Handmatig sessies stoppen (uw idee 3)

- Overzicht van alle lopende sessies binnen de tenant
- Per sessie: knop “Sessie stoppen”
- Na stoppen: transactie definitief afsluiten, eventueel notificatie naar bestuurder

### 4.4 Automatisch stoppen op vaste tijd (uw idee 4)

| Instelling | Beschrijving | Voorbeeld |
|------------|--------------|-----------|
| `autoStopEnabled` | Schakelaar aan/uit | Ja |
| `autoStopTime` | Tijd waarop alle sessies gestopt worden | 18:00 |
| `autoStopTimeZone` | Tijdzone | Europe/Amsterdam |

*Een cron/Cloud Function rond het ingestelde tijdstip: alle actieve sessies van de tenant stoppen.*

### 4.5 Berichten naar bestuurders (uw idee 5)

| Functie | Beschrijving |
|---------|--------------|
| **Doelgroep** | Bestuurders met een lopende parkeersessie |
| **Trigger** | Handmatig of op schema (bijv. 19:00) |
| **Kanaal** | Push, in-app, e-mail (naar keuze) |
| **Template** | Vooringesteld bericht, bijv. “Let op: je hebt nog een lopende parkeersessie. Sluit deze af als je klaar bent.” |
| **Custom bericht** | Fleetmanager kan eigen tekst invullen |

### 4.6 Kentekenbeheer (uw idee 6)

| Instelling | Beschrijving | Mogelijke waarden |
|------------|--------------|-------------------|
| `canAddPlates` | Mag de bestuurder zelf kentekens toevoegen? | Ja / Nee |
| `maxPlates` | Maximaal aantal kentekens | 1, 2, 3, …, onbeperkt |
| `platesLocked` | Kentekens door fleetmanager; bestuurder mag niets wijzigen | Ja / Nee |

**Kentekens door fleetmanager toevoegen:**

- Per bestuurder: kentekens toevoegen/verwijderen
- Bulk: een set kentekens (bijv. 30 poolauto’s) aan meerdere bestuurders tegelijk koppelen
- Bij `platesLocked = true`: bestuurder ziet de kentekens maar kan ze niet bewerken of verwijderen, en geen nieuwe toevoegen

### 4.7 Overige variabelen die de fleetmanager kan instellen

| Categorie | Variabele | Beschrijving |
|-----------|-----------|--------------|
| **Sessie** | `maxSessionDuration` | Maximale sessieduur (minuten) per bestuurder |
| **Sessie** | `requireEndTime` | Altijd een vaste eindtijd verplicht (geen “tot stoppen”) |
| **Notificaties** | `expiringSoonMinutes` | Minuten vóór einde waarschuwingsmelding |
| **Notificaties** | `notificationsEnabled` | Globale aan/uit voor notificaties |
| **Zone** | `allowedZones` | Alleen specifieke zones toegestaan (whitelist, optioneel) |
| **Kosten** | `costCenter` | Kostenplaats voor rapportage/export |
| **Taal** | `defaultLanguage` | Standaardtaal voor de tenant |

---

## 5. Benchmark: concurrenten in Nederland

### 5.1 Q-Park

- Fleet Management Portal voor abonnementen en parkeerrechten
- Kentekenherkenning
- Zakelijke abonnementen, declaratie-functie
- Geen transactiekosten

### 5.2 EasyPark Business

- Self-service portal: kostenplaatsen, gebruikers, tijdsrestricties
- Maandelijkse facturering
- Tijd- en voertuigrestricties
- Europese dekking

### 5.3 Parkmobile for Business

- Basic, Standard, Premium
- Meerdere kostenplaatsen
- Centraal financieel overzicht
- BTW-specificaties op facturen

### 5.4 Parkd Fleets Online

- Automatisch aan- en afmelden
- Integratie met track-and-trace
- Verzamel facturatie
- Geen parkeerboetes door geautomatiseerde sessies

### 5.5 ANWB Mobiliteitskaart

- Straatparkeren via Yellowbrick
- Eén factuur voor alle parkeerkosten
- Meerdere kentekens mogelijk

### 5.6 Wat wij extra/uniek kunnen bieden

| Feature | Q8 Parking (dit plan) |
|---------|------------------------|
| Multitennancy | Ja |
| Automatisch stoppen op vaste tijd | Ja |
| Custom berichten naar rijders | Ja |
| Bulk kentekens voor poolauto’s | Ja |
| Gebruiksdagen per bestuurder | Ja |
| Handmatig sessies stoppen | Ja |
| PDF-rapport per maand | Ja |
| CSV/XLSX-export met filters | Ja |
| Rolgebaseerde rechten (fleet/bestuurder/collega) | Ja |

---

## 6. Rapportagemodule

### 6.1 Overzicht

- Gedetailleerde rapporten van alle parkeertransacties
- Per medewerker/bestuurder
- Kosten per sessie en geaggregeerd

### 6.2 Beschikbare gegevens per transactie

| Veld | Beschrijving |
|------|--------------|
| Datum | Startdatum |
| Starttijd | Start parkeersessie |
| Eindtijd | Einde parkeersessie |
| Duur | Parkeerduur (minuten) |
| Zone | Zone-ID / zone-naam |
| Adres | Straat, stad (indien beschikbaar) |
| Kenteken | Gebruikt kenteken |
| Bestuurder | Naam / e-mail |
| Kosten | Berekende parkeerkosten (€) |
| Kostenplaats | Optioneel |
| Sessie-ID | Unieke referentie |

### 6.3 Rapportformaten

| Formaat | Gebruik |
|---------|---------|
| **PDF per maand** | Maandrapport, kant-en-klaar voor declaratie |
| **CSV** | Import in Excel of boekhouding |
| **XLSX** | Excel met kolommen en optionele opmaak |

### 6.4 Filters

| Filter | Mogelijke waarden |
|--------|-------------------|
| Datum | Van–tot, of vooringesteld (deze week, deze maand, kwartaal, jaar) |
| Bestuurder(s) | Een of meer bestuurders |
| Kenteken(s) | Specifieke kentekens |
| Zone(s) | Specifieke zones |
| Kostenplaats | Specifieke kostenplaats |
| Minimum kosten | Alleen transacties boven een bedrag |

---

## 7. Technische architectuur (hoog niveau)

### 7.1 Multi-tenancy

- Elke klant (bedrijf) = 1 tenant
- `tenantId` op alle documenten: users, sessions, transactions, driverSettings
- Firestore Security Rules: alleen documenten lezen/schrijven waar `tenantId` overeenkomt (of gebruiker is super-admin)

### 7.2 Firestore-collecties (conceptueel)

```
tenants          – tenantId, name, settings (autoStopTime, etc.)
users            – uid, tenantId, email, role, driverSettings
driverSettings   – userId, allowedDays, maxPlates, canAddPlates, platesLocked, etc.
sessions         – userId, tenantId, zone, plate, start, end
transactions     – userId, tenantId, zone, plate, start, end, cost
plates           – userId, tenantId, plateData, source (user|admin), locked
messages         – tenantId, recipients, content, sentAt
auditLog         – userId, action, target, timestamp
```

### 7.3 Authenticatie

- Firebase Auth met custom claims voor `tenantId` en `role`
- Super admin: `role = 'superadmin'`, geen tenant-beperking
- Fleetmanager: `role = 'fleetmanager'`, `tenantId` ingesteld
- Bestuurder: `role = 'driver'`, `tenantId` ingesteld

### 7.4 Portal (frontend)

- aparte webapp (bijv. `/portal` of subdomein `portal.q8parking.nl`)
- Responsive, geschikt voor desktop
- Gebruik van bestaande design system (design-system.css) waar mogelijk

---

## 8. Implementatiefasen (voorstel)

| Fase | Inhoud | Geschatte prioriteit |
|------|--------|----------------------|
| **Fase 1** | Multi-tenancy, tenants, basisrollen, inloggen | Hoog |
| **Fase 2** | Gebruikersbeheer (aanmaken/wijzigen bestuurders) | Hoog |
| **Fase 3** | Sessies naar Firestore, handmatig stoppen, auto-stop tijd | Hoog |
| **Fase 4** | Kentekenbeheer (restricties, bulk, locked plates) | Middel |
| **Fase 5** | Gebruiksdagen, berichten naar rijders | Middel |
| **Fase 6** | Rapportagemodule (PDF, CSV, XLSX, filters) | Middel |
| **Fase 7** | Super-admin portaal (Q8-medewerkers) | Middel |
| **Fase 8** | Auditlog, extra restricties (zones, max duration) | Laag |

---

## 9. Vervolgstappen

1. **Bevestiging plan** – Akkoord op scope en prioriteiten
2. **Data-migratie** – Sessies en kentekens naar Firestore
3. **Security Rules** – Regels voor multi-tenancy en rollen
4. **Portal UX** – Wireframes of mock-ups voor fleetmanager-dashboard
5. **Backend** – Cloud Functions voor auto-stop, berichten, rapportage

---

*Dit plan is gebaseerd op de huidige app-architectuur, state-variabelen en een benchmark van parkeerapps in Nederland. Aanvullingen en aanpassingen zijn mogelijk.*
