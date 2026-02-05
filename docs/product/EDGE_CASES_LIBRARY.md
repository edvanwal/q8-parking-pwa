# Edge Cases Library

Dit document bevat standaard edge case patronen die herbruikbaar zijn in acceptatiechecklists. Verwijs naar deze patronen met hun ID in de checklists.

---

## Algemene patronen

### EC-CLOSE: Sluiten van overlays/sheets/modals
| ID | Scenario | Verwacht gedrag |
|----|----------|-----------------|
| EC-CLOSE-01 | Klik op X/sluitknop | Overlay sluit, focus terug naar onderliggende pagina |
| EC-CLOSE-02 | Klik op backdrop (buiten overlay) | Overlay sluit |
| EC-CLOSE-03 | Druk op Escape-toets | Overlay sluit (indien geïmplementeerd) |
| EC-CLOSE-04 | Swipe down op sheet (mobiel) | Sheet sluit (indien geïmplementeerd) |

### EC-BACK: Terug-navigatie
| ID | Scenario | Verwacht gedrag |
|----|----------|-----------------|
| EC-BACK-01 | Klik op terug-knop | Navigatie naar vorige scherm |
| EC-BACK-02 | Browser back-button | App navigeert correct terug zonder kapot te gaan |
| EC-BACK-03 | Terug tijdens actie (bijv. laden) | Actie wordt geannuleerd, geen hang |

### EC-EMPTY: Lege invoer
| ID | Scenario | Verwacht gedrag |
|----|----------|-----------------|
| EC-EMPTY-01 | Leeg verplicht veld verzenden | Validatiefout zichtbaar bij veld |
| EC-EMPTY-02 | Alleen spaties invoeren | Behandelen als leeg |
| EC-EMPTY-03 | Lege lijst (geen items) | "Geen resultaten" of lege staat tekst |

### EC-INVALID: Ongeldige invoer
| ID | Scenario | Verwacht gedrag |
|----|----------|-----------------|
| EC-INVALID-01 | Verkeerd formaat (bijv. e-mail) | Foutmelding met uitleg |
| EC-INVALID-02 | Te lange invoer (max overschreden) | Invoer geblokkeerd of foutmelding |
| EC-INVALID-03 | Speciale tekens waar niet toegestaan | Foutmelding of invoer gefilterd |

### EC-NETWORK: Netwerkfouten
| ID | Scenario | Verwacht gedrag |
|----|----------|-----------------|
| EC-NETWORK-01 | Geen internetverbinding | Foutmelding + retry optie |
| EC-NETWORK-02 | Timeout bij laden | Foutmelding + retry optie |
| EC-NETWORK-03 | Server error (5xx) | Foutmelding "Er ging iets mis, probeer opnieuw" |

### EC-DOUBLE: Dubbele acties
| ID | Scenario | Verwacht gedrag |
|----|----------|-----------------|
| EC-DOUBLE-01 | Dubbel klikken op submit | Actie wordt maar één keer uitgevoerd |
| EC-DOUBLE-02 | Snel achter elkaar items toevoegen | Geen duplicaten, geen hang |
| EC-DOUBLE-03 | Dubbel klikken op navigatie | Eén navigatie, geen dubbele views |

### EC-OFFLINE: Offline scenario's
| ID | Scenario | Verwacht gedrag |
|----|----------|-----------------|
| EC-OFFLINE-01 | App openen zonder internet | Basale UI zichtbaar, foutmelding voor data |
| EC-OFFLINE-02 | Verbinding verliezen tijdens actie | Actie faalt graceful, data niet verloren |
| EC-OFFLINE-03 | Verbinding hersteld | App herstelt automatisch of na retry |

### EC-LOADING: Laadstaten
| ID | Scenario | Verwacht gedrag |
|----|----------|-----------------|
| EC-LOADING-01 | Tijdens laden content | Spinner of skeleton zichtbaar |
| EC-LOADING-02 | Lange laadtijd (>5s) | Subtekst of annuleeroptie |
| EC-LOADING-03 | Laden klaar | Spinner verdwijnt, content zichtbaar |

### EC-AUTH: Authenticatie edge cases
| ID | Scenario | Verwacht gedrag |
|----|----------|-----------------|
| EC-AUTH-01 | Sessie verlopen | Automatisch uitgelogd, terug naar login |
| EC-AUTH-02 | Inloggen op ander apparaat | Originele sessie blijft of wordt uitgelogd (afhankelijk van beleid) |
| EC-AUTH-03 | Account verwijderd/geblokkeerd | Foutmelding bij volgende actie |

### EC-PERSIST: Persistentie
| ID | Scenario | Verwacht gedrag |
|----|----------|-----------------|
| EC-PERSIST-01 | Pagina refresh | Gegevens behouden (localStorage/session) |
| EC-PERSIST-02 | Browser sluiten en heropenen | Gegevens behouden indien ingelogd |
| EC-PERSIST-03 | Cache legen | Graceful afhandeling, opnieuw laden |

---

## Specifieke patronen Q8 Parking

### EC-SESSION: Parkeersessie edge cases
| ID | Scenario | Verwacht gedrag |
|----|----------|-----------------|
| EC-SESSION-01 | Sessie starten zonder kenteken | Blokkeren met foutmelding "Voeg eerst een kenteken toe" |
| EC-SESSION-02 | Sessie starten zonder zone geselecteerd | Blokkeren met foutmelding |
| EC-SESSION-03 | Tweede sessie starten terwijl al actief | Blokkeren of waarschuwing |
| EC-SESSION-04 | Sessie loopt af (timer op 0) | Automatisch beëindigen + notificatie |
| EC-SESSION-05 | Eindtijd verlengen voorbij max duur | Blokkeren op max duur van zone |

### EC-PLATE: Kenteken edge cases
| ID | Scenario | Verwacht gedrag |
|----|----------|-----------------|
| EC-PLATE-01 | Ongeldig kentekenformaat | Foutmelding met uitleg Nederlands formaat |
| EC-PLATE-02 | Kenteken al toegevoegd | Foutmelding "Kenteken bestaat al" |
| EC-PLATE-03 | Laatste kenteken verwijderen | Toegestaan, maar waarschuwing of hint |
| EC-PLATE-04 | Standaard kenteken verwijderen | Volgende wordt standaard |

### EC-ZONE: Zone edge cases
| ID | Scenario | Verwacht gedrag |
|----|----------|-----------------|
| EC-ZONE-01 | Zone niet gevonden in zoekresultaten | "Geen zones gevonden" melding |
| EC-ZONE-02 | Zones laden mislukt | Foutmelding + retry knop |
| EC-ZONE-03 | Zone heeft geen tarieven | Tonen met "Tarieven onbekend" of vergelijkbaar |

---

*Laatste update: 2026-02-05*
