# Minimal Rebuild - Reference Implementation

Isolated clean implementation. No impact on main app.

**Purpose**: Reference for core behavior (Firestore zones + Google Maps).

**Usage**: Open `index.html` via local server (e.g. `npx serve ..` then `/rebuild/`).

**What it does**:

- Loads Firebase + Firestore
- Fetches zones from `zones` collection
- Loads Google Maps
- Renders markers with prices
- No login, no parking, no extra features

**Files**:

- `index.html` - Single file with inline script
- Uses `../firebase-config.js` and `../design-system.css`
