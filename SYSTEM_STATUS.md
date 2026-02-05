# System status

<!-- Bij elke user-facing wijziging bijwerken. Zie .cursor/rules/25_DOCS_AND_TRACEABILITY.mdc. -->

## Wat werkt nu

### Core Features
- [x] Login/logout flow
- [x] Map with parking zones
- [x] Zone sheet with parking duration controls
- [x] License plate management
- [x] Parking history
- [x] Favorites
- [x] Dark mode toggle
- [x] Language switching (EN/NL)

### Build Versioning & Cache-Busting
- [x] **Automatic build version generation** - timestamp + git SHA on every build
- [x] **Version injection into HTML** - all JS/CSS references get cache-busting query params
- [x] **Service worker versioning** - SW cache name includes version, old caches auto-deleted
- [x] **Runtime verification** - `window.Q8_BUILD` available for debugging/testing
- [x] **Build indicator** - visible on localhost or with `?showbuild` param
- [x] **E2E verification** - tests verify correct build is loaded

## Wat is experimenteel / in ontwikkeling
- [ ] Push notifications (FCM integration present but not fully tested)
- [ ] Install gate for PWA promotion

## Known issues
- [ ] None currently blocking

## Recent fixes
- **Zone markers na login (feb 2026):** `loadZones()` wordt nu opnieuw aangeroepen na login als zones leeg zijn of een error hadden. Dit lost het probleem op waarbij markers niet verschenen na inloggen.

## Build Version System

### How it works
1. `npm run build:version` generates `build-version.json` with:
   - `version`: YYYYMMDDHHMMSS-SHA (e.g., `20260205-143022-abc1234`)
   - `sha`: Git commit short SHA
   - `branch`: Current git branch
   - `dirty`: Whether working tree has uncommitted changes

2. `npm run sync` injects this version into:
   - `public/index.html`: All JS/CSS references get `?v=VERSION`
   - `public/sw.js`: `CACHE_VERSION` and `CACHE_NAME` constants
   - HTML: `window.Q8_BUILD` global for runtime access

3. Service worker behavior:
   - On install: `skipWaiting()` for immediate activation
   - On activate: **Deletes ALL old caches** (key to cache-busting)
   - On fetch: Network-first for HTML/JS/CSS, cache-fallback for offline
   - URLs with `?nocache` bypass SW entirely (desktop testing)

### Verifying the build
- **Console**: Look for `[Q8 PARKING] Build: VERSION` log on page load
- **Visual indicator**: Small badge in bottom-right on localhost or with `?showbuild`
- **DevTools**: `window.Q8_BUILD` contains full version info
- **E2E test**: Automatically verifies build is loaded (step 0)

### Desktop Testing
Desktop/test environments always get fresh assets because:
1. URLs include cache-busting query params (`?v=VERSION`)
2. Service worker uses network-first for all app assets
3. Old caches are deleted on SW activate
4. `?nocache` param bypasses SW entirely if needed

**No manual Ctrl-Shift-R or DevTools cache clearing needed.**

## Hoe test je dit

### Lokaal ontwikkelen
```bash
# Generate build version + sync to public
npm run build

# Start local server
npx serve public -l 3000

# Open http://localhost:3000
# Check console for build version log
```

### E2E Tests
```bash
# Run mobile E2E proof (includes build version check)
npm run test:e2e:proof

# Run desktop width check
npm run test:e2e:desktop
```

### CI Pipeline
- PR CI: format check → build → E2E proof → E2E desktop
- Merge to main: build → deploy to Firebase Hosting

### Verificatie checklist
- [ ] Console shows `[Q8 PARKING] Build: VERSION` on load
- [ ] Build indicator visible on localhost (bottom-right)
- [ ] After code change + `npm run build`, browser shows new version
- [ ] E2E test passes step 0 (build version check)
- [ ] Service worker logs `[SW] Activating q8-parking-VERSION`
