# UI-specificatie Parking PWA (Q8 Liberty stijl)

Doel

- Bouw een PWA-frontend die de UI/UX van de aangeleverde screenshots volgt.
- Eerst: statische UI met dummy data. Daarna: koppelen aan mock_parking.json en acties.

Bronmateriaal

- Screenshots aangeleverd in chat (Parking, Active parking, End parking modal, Menu overlay, Parking history + Filters, License plates + Add modal).

Niet-doelen (voor nu)

- Geen echte payment, geen echte parkeerprovider integratie.
- Geen perfecte kaart/zone-detectie; eerst UI en flows.

Visuele stijl (tokens)

- Primary (blauw): buttons, header-tekst
- Danger (rood): End parking knop + sign out
- Success (groen): DEFAULT pill + zone badge
- Achtergrond: lichtgrijs, cards wit
- Cards: afgeronde hoeken (circa 14–18px), zachte schaduw, ruime padding
- Typografie: simpel, goed leesbaar, duidelijke hiërarchie (titel, label, waarde)

Globale layout regels

- Topbar:
  - Links: logo (of placeholder)
  - Midden: paginatitel (Parking, Parking history, License plates)
  - Rechts: hamburger menu
- Pagina’s gebruiken consistent:
  - Ruimte bovenin voor statusbar
  - Grote CTA-knoppen onderaan (full-width)

Componenten (herbruikbaar)

1. TopBar(title, showBack, showMenu)
2. PrimaryButton(label)
3. DangerButton(label)
4. Card(container)
5. Pill(label, variant=success|neutral)
6. BottomSheet(title?, content, actions[])
7. Modal(title, body, buttons[2])
8. SearchBar(placeholder, rightToggleLabel="Address", toggleState)
9. MapCanvas (placeholder toegestaan)
10. ListRow(title, subtitle?, rightIcon?=trash, rightPill?=DEFAULT)

Schermen

A. Parking (map)

- TopBar: title "Parking"
- SearchBar boven de kaart: "Search by parking zone ..." + toggle "Address"
- Kaart met P-markers (mag placeholder)
- State:
  - No parking points found: toon tekstblok zoals screenshot

B. Zone details (bottom sheet)

- Open bij selectie van zone:
  - Zone header + kenteken
  - Tarieven lijst (tijdvak + bedrag)
  - Duration selector
  - Blauwe CTA: "START PARKING"

C. Active parking

- Kaart zichtbaar
- Onderin card:
  - Active parking
  - License plate
  - Zone badge
  - Start time, End time, Time left
  - Rode CTA: "END PARKING"
- Confirm modal bij stoppen

D. Menu overlay

- Parking history
- License plates
- Language: ENGLISH / DUTCH
- Sign out (rood, onderaan)

E. License plates

- Lijst met kentekens
- DEFAULT pill op default
- Trash icoon
- Add new license plate
- Add modal:
  - License plate
  - Description (max 20)
  - CANCEL / ADD

F. Parking history

- Cards met:
  - Plate + zone badge
  - Start, End, Duration, Street, Price
- Filters bottom sheet:
  - VEHICLE chips
  - DATE RANGE
  - CLEAR ALL / APPLY

Datamodel (indicatief)

- zones
- licensePlates
- sessions/history

Acceptatie

- Alle schermen bereikbaar
- Bottom sheets en modals werken visueel
- Data later te koppelen
