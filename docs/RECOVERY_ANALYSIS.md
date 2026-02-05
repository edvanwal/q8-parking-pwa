# Recovery Analysis & Architecture

**See also**: [ARCHITECTURE.md](./ARCHITECTURE.md) for full app structure, subsystems, and where zone selection, parking actions, license plates, history, and pricing logic live. Maps/preview are treated as infrastructure there.

---

## Original vs Current Architecture

### Original (app_recovery.js)

- **Structure**: Single monolithic file (~2430 lines)
- **State**: Plain object `state`, updated in place
- **Firebase**: Initialized at top level, `db.collection('zones').onSnapshot()`
- **Maps**: `v=beta`, `libraries=marker`, `mapId: '4b360773d325776d'`, AdvancedMarkerElement
- **Debug**: On-screen console, overrides console.log/error/warn, FORCE RESET button
- **Element IDs**: `ui-idle-search`, `details-zone-id`, etc.
- **Flow**: loadZones → initGoogleMap → renderMapMarkers → centerMapOnZones

### Current (Modular)

- **Structure**: app.js, services.js, state.js, ui.js, utils.js
- **State**: Q8.State (get, update, load, save)
- **Firebase**: services.js initializes, loadZones uses same Firestore listener
- **Maps**: ui.js, `v=weekly`, `libraries=marker`, PriceOverlay (custom OverlayView), no mapId
- **Debug**: Utils.debug (localhost only), no on-screen console
- **Element IDs**: ui.js uses `ui-search-bar` but index.html has `ui-idle-search` (mismatch)
- **Flow**: Same – loadZones → initGoogleMap → renderMapMarkers

### Key Differences

| Aspect        | Original                             | Current                              |
| ------------- | ------------------------------------ | ------------------------------------ |
| Maps API      | v=beta, AdvancedMarkerElement        | v=weekly, PriceOverlay (OverlayView) |
| mapId         | Required ('4b360773d325776d')        | None                                 |
| Debug         | Always-on screen console             | Console only on localhost            |
| Search bar ID | ui-idle-search                       | ui-search-bar (wrong in ui.js)       |
| Marker style  | Custom HTML in AdvancedMarkerElement | PriceOverlay div                     |

### Known Issues

1. **ui-search-bar vs ui-idle-search**: ui.js line 60 uses `ui-search-bar`, HTML uses `ui-idle-search`. Search bar visibility toggle may not work.
2. **Utils.debug missing**: Code calls `U.debug` but Utils only exports `logger.info/error/warn`. Debug logs never fire.
3. **Maps loading**: Sensitive to API key restrictions, mapId, and API version.

---

## Recovery Options

### Option A: Use app_recovery.js via recovery-preview.html

- Loads full monolithic version
- Has debug console, FORCE RESET
- Requires Firebase + Maps key working
- URL: open `recovery-preview.html` locally or deploy it

### Option B: Use /preview/map (minimal map-only)

- No login, no parking
- Firestore zones + Google Maps only
- Uses classic Marker (no mapId)
- URL: https://q8-parking-pwa.web.app/preview/map

### Option C: Fix current modular app

1. Add `debug` to Utils export
2. Fix ui-search-bar → ui-idle-search in ui.js (if intended)
3. Add diagnostics (see below)
4. Test Maps + Firestore on live domain

### Option D: Minimal rebuild in /rebuild

- Clean reference implementation
- Isolated, no impact on main app (not in public/, not deployed)
- Same behavior: Firestore zones + Google Maps markers
- Run: `npx serve .` then open `/rebuild/`
- Uses `../firebase-config.js` and `../design-system.css`

---

## Diagnostics Added

- **DIAG_FIREBASE** (services.js): Logs loadZones start, onSnapshot received, zones count, errors
- **DIAG_MAPS** (ui.js): Logs initGoogleMap entry, script load, callback, map creation, done
- **Feature flag**: `window.Q8_DIAG = true` to enable (default OFF)
- **Usage**: In browser console before page load or in index.html: `<script>window.Q8_DIAG=true;</script>`

---

## Next Steps

1. Test `/rebuild/` locally to verify Firestore + Maps work
2. If main app fails, enable `Q8_DIAG` and check console for DIAG\_\* logs
3. Ensure Google Maps API key allows `*.web.app` and `localhost`
4. Consider fixing `ui-search-bar` → `ui-idle-search` in ui.js if search bar visibility is broken
