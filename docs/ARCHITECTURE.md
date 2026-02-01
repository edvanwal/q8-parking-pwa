# Q8 Parking PWA – Architecture Overview

Maps and zone visualization are **infrastructure**. The core product is the parking flow: zone selection, sessions, plates, history, and pricing.

---

## Subsystems Overview

| Subsystem | Purpose | Where it lives |
|-----------|---------|----------------|
| **Zone selection** | User picks a zone to start parking | app.js (events) → Services.tryOpenOverlay → state.selectedZone |
| **Parking actions** | Start session, end session | Services.handleStartParking, handleEndParking |
| **License plates** | Add, delete, set default, select for session | Services.saveNewPlate, deletePlate, setDefaultPlate; app.js select-plate |
| **Parking history** | List past sessions, filter by vehicle/date | ui.js renderHistory, renderHistoryFilters; state.historyFilters |
| **End time / duration** | Set fixed end time for parking | Services.modifyDuration; state.duration |
| **Session state** | Active parking session (zone, start, end, plate) | state.session; persisted in localStorage |
| **Pricing logic** | Cost calculation | utils.js calculateCost |
| **Maps (infra)** | Show zones on map | ui.js initGoogleMap, renderMapMarkers |
| **Zone data (infra)** | Load zones from Firestore | Services.loadZones |

---

## Data Flow

```
Firestore zones  →  loadZones()  →  state.zones  →  UI (map markers, search results)
                                           ↓
User clicks marker/search  →  tryOpenOverlay('sheet-zone', context)  →  state.selectedZone
                                           ↓
User sets duration, plate  →  handleStartParking()  →  state.session  →  localStorage
                                           ↓
User ends parking  →  handleEndParking()  →  state.session = null
```

---

## File Roles

### app.js – Entry & Event Routing

- **init()**: Load state, check install mode, init auth, load zones, init map
- **initListeners()**: Delegates clicks to Services
- **Routes**:
  - `open-overlay` → Services.tryOpenOverlay (zone sheet, filters, etc.)
  - `start-session` → Services.handleStartParking
  - `confirm-end` → Services.handleEndParking
  - `save-plate` → Services.saveNewPlate
  - `delete-plate` → Services.deletePlate
  - `set-default-plate` → Services.setDefaultPlate
  - `mod-duration` → Services.modifyDuration
  - `toggle-filter-vehicle`, `clear-filters`, `apply-filters` → state.historyFilters
  - `filter-date-start`, `filter-date-end` → state.historyFilters

### services.js – Business Logic

- **Zone selection**: `tryOpenOverlay('sheet-zone', context)` → sets `selectedZone`, `selectedZoneRate`, `selectedZoneRates`, `duration`
- **Parking start**: `handleStartParking()` – reads `selectedZone`, `duration`, plate; creates `session`; saves to localStorage
- **Parking end**: `handleEndParking()` – clears `session`
- **Plates**: `saveNewPlate`, `deletePlate`, `setDefaultPlate` – update `state.plates`, persist via `savePlates`
- **Duration**: `modifyDuration(delta)` – adjusts `state.duration` with zone max limit

### state.js – Shared State

- **session**: `{ zone, zoneUid, start, end }` – active parking
- **selectedZone**: uid or id of chosen zone
- **duration**: minutes (0 = until stopped)
- **plates**: `[{ id, text, description, default }]`
- **selectedPlateId**: plate chosen for zone sheet
- **historyFilters**: `{ vehicles, customStart, customEnd }`

### ui.js – Rendering

- **renderParkingView**: Active session card, zone sheet, search, marker visibility
- **renderZoneSheet**: Zone details, rates, duration control, plate selector
- **renderPlates**: Plate list, add/delete/default
- **renderHistory**: History list, applies `historyFilters`
- **renderHistoryFilters**: Filter UI (vehicles, date range)
- **initGoogleMap, renderMapMarkers**: Map (infra)

### utils.js – Helpers

- **calculateCost(durationMins, hourlyRate)**: Used for pricing display

---

## Zone Selection Flow

1. User clicks marker (PriceOverlay) or search result
2. Both call `Services.tryOpenOverlay('sheet-zone', { uid, zone, price, rates })`
3. Services sets `selectedZone`, `selectedZoneRate`, `selectedZoneRates`, optionally resets `duration`
4. UI.update() runs → renderZoneSheet() shows zone details, duration control, plate
5. User taps "START PARKING" → handleStartParking()

---

## Parking Session Flow

1. **Start**: handleStartParking checks `selectedZone`, builds `session` from `start`, `end` (from `duration`), plate
2. **Persist**: localStorage `q8_parking_session`
3. **Display**: renderParkingView shows active card, timer, "END PARKING"
4. **End**: User confirms → handleEndParking clears `session`

---

## License Plate Flow

- **Storage**: state.plates, localStorage `q8_plates_v1`
- **Add**: modal → saveNewPlate validates, adds to plates, first one = default
- **Delete**: deletePlate, if default removed then next becomes default
- **Set default**: setDefaultPlate from plates screen
- **Choose for session**: sheet-plate-selector → select-quick-plate → selectedPlateId

---

## History & Filtering Flow

- **Data**: state.history (in current app, may come from Firestore or mock)
- **Filters**: state.historyFilters.vehicles, customStart, customEnd
- **UI**: renderHistory filters list; renderHistoryFilters builds filter sheet
- **Events**: toggle-filter-vehicle, filter-date-start/end, clear-filters, apply-filters

---

## Relationship Diagram

```
                    ┌─────────────┐
                    │   app.js    │  Entry, click routing
                    └──────┬──────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
         ▼                 ▼                 ▼
   ┌──────────┐     ┌───────────┐     ┌──────────┐
   │ Services │────▶│   State   │◀────│   UI     │
   │ (logic)  │     │ (session, │     │ (render) │
   └────┬─────┘     │  zones,   │     └────┬─────┘
        │           │  plates,  │          │
        │           │  filters) │          │
        │           └───────────┘          │
        │                                  │
        ▼                                  ▼
   Firestore                          DOM + Maps
   (zones)                            (infra)
```

---

## Infrastructure vs Core

**Infrastructure** (can be swapped or fixed without touching business logic):

- Firebase init, Firestore listener
- Google Maps load, markers, PriceOverlay
- preview/map, rebuild – map-only test pages

**Core** (product behavior):

- Zone selection and sheet
- Start/end parking
- Plates CRUD and default
- Session state and persistence
- Duration and end time
- History and filters
- Pricing (calculateCost)
