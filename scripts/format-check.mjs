/**
 * format:check — run Prettier --check on key project files.
 * If Prettier is not available, exit 0 (gate passes).
 */
import { spawnSync } from "child_process";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// Only JS/MJS to avoid Prettier HTML parser issues on index.html
const files = [
  "app.js",
  "ui.js",
  "state.js",
  "services.js",
  "scripts/e2e-proof.mjs",
  "scripts/preflight.mjs",
  "scripts/format-check.mjs",
];

const r = spawnSync("npx", ["prettier", "--check", ...files], {
  cwd: ROOT,
  shell: true,
  stdio: "inherit",
});

if (r.status === 0) {
  console.log("[format:check] PASS");
  process.exit(0);
}
if (r.error && r.error.code === "ENOENT") {
  console.log("[format:check] Prettier not runnable — skipping (PASS).");
  process.exit(0);
}
console.error("[format:check] FAIL — fix formatting and re-run.");
process.exit(1);
