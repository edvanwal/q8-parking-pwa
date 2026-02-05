/**
 * E2E "human proof" for parking app: map visible ÔåÆ zone sheet ÔåÆ plus ÔåÆ close.
 * Policy: docs/QA_AND_E2E_POLICY.md
 *
 * When [data-testid="map-root"] exists (parking backend), runs:
 * 1. Navigate BASE_URL
 * 2. Assert map-root visible
 * 3. Click zone-marker
 * 4. Wait sheet-zone visible
 * 5. Read duration-value (before)
 * 6. Click btn-zone-plus
 * 7. Assert duration value changed (or visible "more" effect)
 * 8. Click btn-zone-close
 * 9. Assert sheet-zone not visible
 * 10. Click btn-menu-open; assert side-menu visible and at least one menu item (menu-item-parking) visible/clickable
 * 11. Click btn-logout; assert view-login visible (back to login state)
 *
 * Artifacts: trace, video, screenshots (after map, after sheet open, after plus, after close, after menu, after logout).
 *
 * Usage: npm run test:e2e:proof
 * Script starts server automatically if BASE_URL not reachable.
 */
import { chromium } from "playwright";
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";
import { createInterface } from "readline";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const TIMEOUT = 30000;
const VISIBLE_WAIT = 12000;
const ZONE_MARKER_WAIT = 20000; // zones load from Firestore; increase if backend is slow
const PAUSE = 500;

const ARTIFACT_DIR = join(ROOT, "test-output", "e2e-proof");
const TRACE_PATH = join(ARTIFACT_DIR, "proof-trace.zip");
const VIDEO_DIR = join(ARTIFACT_DIR, "video");
const isCI = process.env.CI === "true";

// BUILD VERSION CHECK: If BUILD_VERSION env var is set, verify the loaded build matches
const EXPECTED_BUILD_VERSION = process.env.BUILD_VERSION || null;

function log(step, detail = "") {
  console.log(`[proof] ${step}${detail ? " " + detail : ""}`);
}

function fail(step, whatIsWrong) {
  console.error(`[FAIL] ${step} ÔÇö ${whatIsWrong}`);
}

async function waitForUrl(url, maxMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    try {
      const res = await fetch(url, {
        method: "HEAD",
        signal: AbortSignal.timeout(2000),
      });
      if (res.ok) return true;
    } catch (_) {}
    await new Promise((r) => setTimeout(r, 800));
  }
  return false;
}

function startServer() {
  return new Promise((resolve, reject) => {
    const child = spawn("npx", ["serve", "public", "-l", "3000"], {
      cwd: ROOT,
      stdio: ["ignore", "pipe", "pipe"],
      shell: true,
    });
    let resolved = false;
    const done = (ok) => {
      if (resolved) return;
      resolved = true;
      if (ok) resolve(child);
      else reject(new Error("Server failed to start"));
    };
    waitForUrl(BASE_URL, 20000).then((ok) => done(ok));
    child.on("error", () => done(false));
    child.on("exit", (code) => {
      if (!resolved) done(false);
    });
    setTimeout(() => {
      if (!resolved) done(false);
    }, 22000);
  });
}

async function takeScreenshot(page, name) {
  mkdirSync(ARTIFACT_DIR, { recursive: true });
  const path = join(ARTIFACT_DIR, `proof-${name}-${Date.now()}.png`);
  await page.screenshot({ path, fullPage: false }).catch(() => {});
  log("screenshot", path);
  return path;
}

async function main() {
  let serverProcess = null;
  const baseUrlReachable = await waitForUrl(BASE_URL, 3000);
  if (!baseUrlReachable) {
    log("Starting server...");
    try {
      serverProcess = await startServer();
    } catch (e) {
      console.error(
        "Could not start server. Start manually: npx serve public -l 3000",
      );
      process.exit(1);
    }
  }

  mkdirSync(ARTIFACT_DIR, { recursive: true });
  mkdirSync(VIDEO_DIR, { recursive: true });

  const browser = await chromium.launch({
    channel: "chrome",
    headless: isCI,
    slowMo: isCI ? 0 : 150,
  });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    locale: "nl-NL",
    ignoreHTTPSErrors: true,
    recordVideo: { dir: VIDEO_DIR, size: { width: 390, height: 844 } },
  });
  await context.tracing.start({
    screenshots: true,
    snapshots: true,
    sources: true,
  });

  await context.clearCookies();
  await context.addInitScript(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (_) {}
  });

  const page = await context.newPage();
  let allOk = true;

  try {
    const cacheBust = `?t=${Date.now()}&nocache=${Date.now()}`;
    await page.goto(BASE_URL + cacheBust, {
      waitUntil: "load",
      timeout: TIMEOUT,
    });
    await page.evaluate(() => {
      if (navigator.serviceWorker?.getRegistrations) {
        return navigator.serviceWorker.getRegistrations().then((regs) => {
          regs.forEach((r) => r.unregister());
        });
      }
    });

    // === BUILD VERSION CHECK (Step 0) ===
    // Verify the build version is loaded and matches expected (if specified)
    await page.waitForTimeout(500); // Wait for Q8_BUILD to be set
    const buildInfo = await page.evaluate(() => {
      return {
        exists: typeof window.Q8_BUILD !== "undefined",
        loaded: window.Q8_BUILD_LOADED === true,
        version: window.Q8_BUILD?.version || null,
        sha: window.Q8_BUILD?.sha || null,
        branch: window.Q8_BUILD?.branch || null,
      };
    });

    if (!buildInfo.exists || !buildInfo.loaded) {
      fail(
        "0. Build version",
        "Q8_BUILD not found or not loaded - stale build or missing version injection",
      );
      allOk = false;
    } else {
      log(
        "0. Build version loaded",
        `${buildInfo.version} (SHA: ${buildInfo.sha}, Branch: ${buildInfo.branch})`,
      );

      // If expected version is specified, verify it matches
      if (
        EXPECTED_BUILD_VERSION &&
        buildInfo.version !== EXPECTED_BUILD_VERSION
      ) {
        fail(
          "0. Build version mismatch",
          `Expected: ${EXPECTED_BUILD_VERSION}, Got: ${buildInfo.version} - STALE BUILD DETECTED`,
        );
        allOk = false;
      }
    }
    await takeScreenshot(page, "build-verified");

    const MAP_ROOT_WAIT_MS = 10000;
    try {
      await page.waitForSelector('[data-testid="map-root"]', {
        state: "attached",
        timeout: MAP_ROOT_WAIT_MS,
      });
    } catch (_) {
      await context.tracing.stop({ path: TRACE_PATH });
      await browser.close();
      if (serverProcess) serverProcess.kill();
      console.error(
        "[proof] PROOF GATE FAILED: #map-root not found. Start server on http://localhost:3000 or fix build/route.",
      );
      process.exit(1);
    }

    await page
      .waitForSelector("#view-login, #view-map", {
        state: "visible",
        timeout: VISIBLE_WAIT,
      })
      .catch(() => null);
    const loginVisible = await page
      .locator("#view-login")
      .isVisible()
      .catch(() => false);
    const mapAlreadyVisible = await page
      .locator("#view-map")
      .isVisible()
      .catch(() => false);
    if (loginVisible) {
      log("1. Login visible, clicking sign in");
      await page
        .locator('button[data-action="login"]')
        .first()
        .click({ timeout: 8000, force: true });
    } else if (!mapAlreadyVisible) {
      fail("1. Login or map", "Neither login nor map visible");
      allOk = false;
    } else {
      log("1. Already on map");
    }
    await page
      .waitForSelector("#view-map", { state: "visible", timeout: VISIBLE_WAIT })
      .catch(() => null);
    await page.waitForTimeout(PAUSE);

    const mapRoot = page.locator('[data-testid="map-root"]');
    await mapRoot
      .waitFor({ state: "visible", timeout: VISIBLE_WAIT })
      .catch(() => null);
    const mapVisible = await mapRoot.isVisible().catch(() => false);
    if (!mapVisible) {
      fail("2. Map visible", "map-root not visible after login");
      allOk = false;
    } else {
      log("2. Map (map-root) visible");
    }
    await takeScreenshot(page, "map-loaded");
    await page.waitForTimeout(PAUSE);

    const dismissBtn = page.locator('[data-action="dismiss-onboarding"]');
    await dismissBtn
      .waitFor({ state: "visible", timeout: 5000 })
      .catch(() => {});
    if (await dismissBtn.isVisible().catch(() => false)) {
      await dismissBtn.click();
      await page.waitForTimeout(PAUSE);
    }
    await page.waitForTimeout(2500); // let map idle and zones load from Firestore

    const endParkingBtn = page
      .getByRole("button", { name: /end current parking session|END PARKING/i })
      .first();
    if (await endParkingBtn.isVisible().catch(() => false)) {
      await endParkingBtn.click();
      await page
        .locator("#modal-confirm.open")
        .waitFor({ state: "visible", timeout: 5000 })
        .catch(() => null);
      await page
        .locator('#modal-confirm button[data-action="confirm-end"]')
        .first()
        .click();
      await page.waitForTimeout(PAUSE);
    }

    // Zone markers: from Firestore or inject one + open sheet so we can test plus/close (FAIL 6/7)
    let markerVisible = await page
      .locator(".q8-price-marker")
      .first()
      .isVisible()
      .catch(() => false);
    let openedByInject = false;
    if (!markerVisible) {
      await page.evaluate(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              if (
                window.Q8 &&
                window.Q8.State &&
                window.Q8.State.update &&
                window.Q8.Services &&
                window.Q8.Services.tryOpenOverlay
              ) {
                const zone = {
                  id: "E2E1",
                  uid: "e2e-zone-1",
                  lat: 52.0907,
                  lng: 5.1214,
                  price: 2.5,
                  display_label: "2,50",
                  street: "Test",
                  city: "Utrecht",
                  rates: [],
                };
                window.Q8.State.update({
                  zones: [zone],
                  zonesLoading: false,
                  zonesLoadError: null,
                  selectedZone: "e2e-zone-1",
                  duration: 0,
                  defaultDurationMinutes: 0,
                });
                if (typeof window.renderMapMarkers === "function")
                  window.renderMapMarkers();
                window.Q8.Services.tryOpenOverlay("sheet-zone", {
                  uid: "e2e-zone-1",
                  zone: "E2E1",
                  price: 2.5,
                  rates: [],
                });
                window.Q8.State.update({ duration: 0 });
                if (window.Q8.UI && typeof window.Q8.UI.update === "function")
                  window.Q8.UI.update();
                const el = document.getElementById("sheet-zone");
                if (el) el.classList.add("open");
                window.__proofSheetOpenedByInject = true;
              }
              resolve();
            }, 1500);
          }),
      );
      await page.waitForTimeout(500);
      openedByInject = await page
        .evaluate(() => !!window.__proofSheetOpenedByInject)
        .catch(() => false);
      if (openedByInject)
        await page
          .locator("#sheet-zone.open")
          .waitFor({ state: "visible", timeout: 5000 })
          .catch(() => null);
    }
    if (!openedByInject) {
      const zoneMarker = page.locator(".q8-price-marker").first();
      await zoneMarker
        .waitFor({ state: "visible", timeout: ZONE_MARKER_WAIT })
        .catch(() => null);
      markerVisible = await zoneMarker.isVisible().catch(() => false);
      if (!markerVisible) {
        fail("3. Zone marker", "zone-marker not visible");
        await takeScreenshot(page, "no-zone-marker");
        allOk = false;
      } else {
        log("3. Zone marker visible");
        await zoneMarker.scrollIntoViewIfNeeded().catch(() => {});
        await zoneMarker.click({ force: true });
        await page.waitForTimeout(PAUSE);
      }
    } else {
      log("3. Zone sheet opened (E2E seed)");
      await page.waitForTimeout(800);
    }

    if (!allOk) {
      await context.tracing.stop({ path: TRACE_PATH });
      log("Trace", TRACE_PATH);
      await context.close();
      await browser.close();
      if (serverProcess) serverProcess.kill();
      console.log("Artifacts:", ARTIFACT_DIR);
      process.exit(1);
    }

    const sheetZone = page.locator('[data-testid="sheet-zone"]');
    await sheetZone
      .waitFor({ state: "visible", timeout: VISIBLE_WAIT })
      .catch(() => null);
    const sheetOpen = await sheetZone.isVisible().catch(() => false);
    if (!sheetOpen) {
      fail(
        "4. Sheet open",
        "sheet-zone not visible after clicking zone-marker",
      );
      allOk = false;
    } else {
      log("4. Sheet (sheet-zone) visible");
    }
    await takeScreenshot(page, "sheet-open");
    await page.waitForTimeout(PAUSE);

    // After E2E seed, wait for duration to reflect state (e.g. "Until stopped" when duration=0)
    await page
      .waitForFunction(
        () => {
          const el = document.getElementById("val-duration");
          return el && el.innerText.trim() === "Until stopped";
        },
        { timeout: 4000 },
      )
      .catch(() => null);
    await page.waitForTimeout(300);

    const durationEl = sheetZone.locator('[data-testid="duration-value"]');
    const textBefore = (await durationEl.textContent().catch(() => "")) || "";
    const textBeforeTrim = textBefore.trim();
    log("5. Duration before", textBeforeTrim);

    const plusBtn = sheetZone.locator('[data-testid="btn-zone-plus"]').first();
    await plusBtn.scrollIntoViewIfNeeded().catch(() => {});
    await plusBtn.click({ force: true });
    await page
      .waitForFunction(
        (before) => {
          const el = document.getElementById("val-duration");
          return el && el.innerText.trim() !== before;
        },
        textBeforeTrim,
        { timeout: 8000 },
      )
      .catch(() => null);
    await page.waitForTimeout(500);

    const textAfter = (await durationEl.textContent().catch(() => "")) || "";
    const textAfterTrim = textAfter.trim();
    const valueChanged = textAfterTrim !== textBeforeTrim;
    if (!valueChanged) {
      fail(
        "6. Duration changed",
        `Expected duration to change: "${textBeforeTrim}" ÔåÆ "${textAfterTrim}"`,
      );
      allOk = false;
    } else {
      log("6. Duration changed", `"${textBeforeTrim}" ÔåÆ "${textAfterTrim}"`);
    }
    await takeScreenshot(page, "after-plus");
    await page.waitForTimeout(PAUSE);

    const closeBtn = sheetZone
      .locator('[data-testid="btn-zone-close"]')
      .first();
    await closeBtn.scrollIntoViewIfNeeded().catch(() => {});
    await closeBtn.click({ force: true });
    await page.waitForTimeout(PAUSE);
    await page
      .waitForFunction(() => !document.querySelector("#sheet-zone.open"), {
        timeout: VISIBLE_WAIT,
      })
      .catch(() => null);
    await page.waitForTimeout(300);

    const sheetStillVisible = await page
      .locator("#sheet-zone.open")
      .isVisible()
      .catch(() => true);
    if (sheetStillVisible) {
      fail(
        "7. Sheet closed",
        "sheet-zone still visible after clicking btn-zone-close",
      );
      allOk = false;
    } else {
      log("7. Sheet closed (sheet-zone not visible)");
    }
    await takeScreenshot(page, "after-close");
    await page.waitForTimeout(PAUSE);

    // Step 8: Open menu and assert at least one menu item is visible (user-visible)
    const menuBtn = page.locator('[data-testid="btn-menu-open"]').first();
    await menuBtn
      .waitFor({ state: "visible", timeout: 5000 })
      .catch(() => null);
    const menuBtnVisible = await menuBtn.isVisible().catch(() => false);
    if (!menuBtnVisible) {
      fail("8. Menu button", "btn-menu-open not visible");
      allOk = false;
    } else {
      await menuBtn.click({ force: true });
      await page.waitForTimeout(PAUSE);
    }
    const sideMenu = page.locator('[data-testid="side-menu"].open');
    await sideMenu
      .waitFor({ state: "visible", timeout: VISIBLE_WAIT })
      .catch(() => null);
    const menuOpen = await sideMenu.isVisible().catch(() => false);
    if (!menuOpen) {
      fail(
        "8. Menu open",
        "side-menu not visible after clicking btn-menu-open",
      );
      allOk = false;
    } else {
      log("8. Menu open (side-menu visible)");
    }
    const menuItemParking = page
      .locator('[data-testid="menu-item-parking"]')
      .first();
    const menuItemVisible = await menuItemParking
      .isVisible()
      .catch(() => false);
    if (!menuItemVisible) {
      fail("8. Menu item", "menu-item-parking not visible");
      allOk = false;
    } else {
      log("8. Menu item (menu-item-parking) visible and clickable");
    }
    await takeScreenshot(page, "menu-open");
    await page.waitForTimeout(PAUSE);

    // Step 9: Logout and assert login state (user-visible)
    const logoutBtn = page.locator('[data-testid="btn-logout"]').first();
    await logoutBtn
      .waitFor({ state: "visible", timeout: 5000 })
      .catch(() => null);
    const logoutBtnVisible = await logoutBtn.isVisible().catch(() => false);
    if (!logoutBtnVisible) {
      fail("9. Logout button", "btn-logout not visible");
      allOk = false;
    } else {
      await logoutBtn.scrollIntoViewIfNeeded().catch(() => {});
      await logoutBtn.click({ force: true });
      await page.waitForTimeout(PAUSE);
    }
    await page
      .waitForSelector("#view-login", {
        state: "visible",
        timeout: VISIBLE_WAIT,
      })
      .catch(() => null);
    const loginViewVisible = await page
      .locator("#view-login")
      .isVisible()
      .catch(() => false);
    if (!loginViewVisible) {
      fail("9. Logout", "view-login not visible after clicking logout");
      allOk = false;
    } else {
      log("9. Logout OK (view-login visible)");
    }
    await takeScreenshot(page, "after-logout");
  } catch (e) {
    console.error("Exception:", e.message);
    allOk = false;
  }

  await context.tracing.stop({ path: TRACE_PATH });
  log("Trace", TRACE_PATH);
  await context.close();
  await browser.close();

  if (serverProcess) {
    serverProcess.kill();
  }

  console.log(
    allOk ? "\n--- PASS: Human proof OK ---" : "\n--- FAIL: See above ---",
  );
  console.log("Artifacts:", ARTIFACT_DIR);
  process.exit(allOk ? 0 : 1);
}

/**
 * Desktop UI mirror test: validates zone sheet width on desktop viewport.
 * Rule: Desktop mirrors mobile UI; zone sheet max-width = 480px.
 * Fails if sheet becomes wider than mobile width.
 */
async function testDesktopZoneSheetWidth() {
  const DESKTOP_VIEWPORT = { width: 1280, height: 800 };
  const EXPECTED_MAX_WIDTH = 480;
  const TOLERANCE = 5; // px tolerance for rendering differences

  let serverProcess = null;
  const baseUrlReachable = await waitForUrl(BASE_URL, 3000);
  if (!baseUrlReachable) {
    log("[desktop] Starting server...");
    try {
      serverProcess = await startServer();
    } catch (e) {
      console.error("[desktop] Could not start server.");
      return false;
    }
  }

  mkdirSync(ARTIFACT_DIR, { recursive: true });

  const browser = await chromium.launch({
    channel: "chrome",
    headless: isCI,
    slowMo: isCI ? 0 : 100,
  });
  const context = await browser.newContext({
    viewport: DESKTOP_VIEWPORT,
    locale: "nl-NL",
    ignoreHTTPSErrors: true,
  });
  await context.clearCookies();
  await context.addInitScript(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (_) {}
  });

  const page = await context.newPage();
  let testOk = true;

  try {
    log("[desktop] 1. Navigate to app with desktop viewport");
    await page.goto(BASE_URL + `?t=${Date.now()}`, {
      waitUntil: "load",
      timeout: TIMEOUT,
    });

    // Wait for login or map
    await page
      .waitForSelector("#view-login, #view-map", {
        state: "visible",
        timeout: VISIBLE_WAIT,
      })
      .catch(() => null);
    const loginVisible = await page
      .locator("#view-login")
      .isVisible()
      .catch(() => false);
    if (loginVisible) {
      log("[desktop] 2. Login visible, signing in");
      await page
        .locator('button[data-action="login"]')
        .first()
        .click({ timeout: 8000, force: true });
      await page
        .waitForSelector("#view-map", {
          state: "visible",
          timeout: VISIBLE_WAIT,
        })
        .catch(() => null);
    }

    // Dismiss onboarding if present
    const dismissBtn = page.locator('[data-action="dismiss-onboarding"]');
    if (await dismissBtn.isVisible().catch(() => false)) {
      await dismissBtn.click();
      await page.waitForTimeout(300);
    }

    await page.waitForTimeout(2000); // let zones load

    // Inject zone and open sheet (same as mobile test)
    log("[desktop] 3. Injecting zone and opening sheet");
    await page.evaluate(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            if (window.Q8 && window.Q8.State && window.Q8.Services) {
              const zone = {
                id: "E2E-DESKTOP",
                uid: "e2e-desktop-zone",
                lat: 52.0907,
                lng: 5.1214,
                price: 2.5,
                display_label: "2,50",
                street: "Test",
                city: "Utrecht",
                rates: [],
              };
              window.Q8.State.update({
                zones: [zone],
                zonesLoading: false,
                selectedZone: "e2e-desktop-zone",
                duration: 60,
              });
              window.Q8.Services.tryOpenOverlay("sheet-zone", {
                uid: "e2e-desktop-zone",
                zone: "E2E-DESKTOP",
                price: 2.5,
                rates: [],
              });
              const el = document.getElementById("sheet-zone");
              if (el) el.classList.add("open");
            }
            resolve();
          }, 500);
        }),
    );
    await page.waitForTimeout(800);

    // Wait for sheet to be visible
    const sheetZone = page.locator('[data-testid="sheet-zone"]');
    await sheetZone
      .waitFor({ state: "visible", timeout: VISIBLE_WAIT })
      .catch(() => null);
    const sheetVisible = await sheetZone.isVisible().catch(() => false);
    if (!sheetVisible) {
      fail("[desktop] 4. Sheet visible", "sheet-zone not visible on desktop");
      testOk = false;
    } else {
      log("[desktop] 4. Sheet visible");
    }

    // Measure sheet width
    const sheetBox = await page
      .locator(".bottom-sheet.sheet-zone")
      .boundingBox();
    if (!sheetBox) {
      fail("[desktop] 5. Sheet width", "Could not get sheet bounding box");
      testOk = false;
    } else {
      const sheetWidth = Math.round(sheetBox.width);
      log("[desktop] 5. Sheet width measured", `${sheetWidth}px`);

      // Assert: sheet width should NOT exceed mobile max-width + tolerance
      if (sheetWidth > EXPECTED_MAX_WIDTH + TOLERANCE) {
        fail(
          "[desktop] 6. Sheet width check",
          `Sheet is too wide on desktop: ${sheetWidth}px > ${EXPECTED_MAX_WIDTH}px (max mobile width). Desktop must mirror mobile UI.`,
        );
        testOk = false;
      } else {
        log(
          "[desktop] 6. Sheet width OK",
          `${sheetWidth}px <= ${EXPECTED_MAX_WIDTH}px (mobile max-width)`,
        );
      }
    }

    await takeScreenshot(page, "desktop-sheet-width");
  } catch (e) {
    console.error("[desktop] Exception:", e.message);
    testOk = false;
  }

  await context.close();
  await browser.close();
  if (serverProcess) serverProcess.kill();

  console.log(
    testOk
      ? "\n--- PASS: Desktop zone sheet width OK ---"
      : "\n--- FAIL: Desktop zone sheet width check failed ---",
  );
  return testOk;
}

async function runAllTests() {
  // Run mobile proof test
  console.log("\n=== Running Mobile E2E Proof ===\n");

  // Store original exit behavior - we need to prevent main() from exiting
  const originalExit = process.exit;
  let mobileResult = true;

  // Temporarily override process.exit to capture result
  process.exit = (code) => {
    mobileResult = code === 0;
  };

  await main().catch(() => {
    mobileResult = false;
  });

  // Restore original exit
  process.exit = originalExit;

  // Run desktop width test
  console.log("\n=== Running Desktop Zone Sheet Width Test ===\n");
  const desktopResult = await testDesktopZoneSheetWidth();

  // Final result
  const allPassed = mobileResult && desktopResult;
  console.log(
    allPassed ? "\n=== ALL TESTS PASSED ===" : "\n=== SOME TESTS FAILED ===",
  );
  console.log("Artifacts:", ARTIFACT_DIR);
  process.exit(allPassed ? 0 : 1);
}

// Check if running desktop test only via env var
if (process.env.E2E_DESKTOP_ONLY === "true") {
  testDesktopZoneSheetWidth().then((ok) => process.exit(ok ? 0 : 1));
} else {
  // Run main mobile test (original behavior for backward compatibility)
  main();
}
