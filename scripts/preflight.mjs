/**
 * Preflight: branch, remote, optional GH_TOKEN check.
 * In GH_TOKEN MISSING MODE: PASS when branch + remote ok (no API call).
 * When GH_TOKEN set: GET api.github.com/repos/edvanwal/q8-parking-pwa → require 200.
 */
import { execSync } from "child_process";
import { existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

function run(cmd, opts = {}) {
  try {
    return execSync(cmd, { encoding: "utf8", cwd: ROOT, ...opts }).trim();
  } catch (e) {
    return null;
  }
}

async function main() {
  console.log("[preflight] Branch:", run("git branch --show-current") || "?");
  console.log("[preflight] Remote:");
  (run("git remote -v") || "").split("\n").forEach((l) => console.log("  ", l));

  const token = process.env.GH_TOKEN;
  if (!token || token.length === 0) {
    console.log(
      "[preflight] GH_TOKEN not set — skipping API check (PASS in missing mode).",
    );
    console.log("[preflight] PASS");
    process.exit(0);
  }

  console.log("[preflight] GH_TOKEN set, checking GitHub API...");
  try {
    const res = await fetch(
      "https://api.github.com/repos/edvanwal/q8-parking-pwa",
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    const status = res.status;
    if (status !== 200) {
      console.error("[preflight] FAIL: GitHub API returned", status);
      process.exit(1);
    }
    const json = await res.json();
    console.log(
      "[preflight] HTTP",
      status,
      "— full_name:",
      json.full_name,
      "default_branch:",
      json.default_branch,
    );
    console.log("[preflight] PASS");
    process.exit(0);
  } catch (e) {
    console.error("[preflight] FAIL:", e.message);
    process.exit(1);
  }
}

main();
