#!/usr/bin/env node
/**
 * Canon preflight: fail if any user-visible feature in docs/FUNCTIONAL_CANON.md
 * is not ✅ or explicit manual-only. Prevents human review before canon is green.
 */
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DOCS = join(ROOT, 'docs');
const CANON_PATH = join(DOCS, 'FUNCTIONAL_CANON.md');
const REQUIRED_DOCS = ['AGENT_HANDOVER.md', 'BLOCKERS.md'];

function log(msg) {
  console.log(msg);
}

function err(msg) {
  console.error(msg);
}

function parseFeatureIndex(content) {
  const lines = content.split(/\r?\n/);
  const featureIndexStart = lines.findIndex((l) => /^##\s+Feature-index\s*$/i.test(l.trim()));
  if (featureIndexStart === -1) {
    return { ok: false, error: 'Feature-index section not found in canon' };
  }

  const tableLines = [];
  for (let i = featureIndexStart + 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('|') && line.trim().length > 1) {
      tableLines.push(line);
    } else if (line.trim().startsWith('##') || (line.trim() && !line.startsWith('|'))) {
      break;
    }
  }

  if (tableLines.length < 2) {
    return {
      ok: false,
      error: 'Feature-index table has no data rows (need header + separator + at least one row)',
    };
  }

  const header = tableLines[0];
  const separator = tableLines[1];
  const dataRows = tableLines
    .slice(2)
    .filter((r) => /^\|[\s\S]+\|$/.test(r) && !/^[\s|-]+$/.test(r));

  const parseRow = (row) => {
    const cells = row
      .split('|')
      .map((c) => c.trim())
      .filter((_, i) => i > 0);
    return cells;
  };

  const cols = parseRow(header);
  const statusIdx = cols.findIndex((c) => /^Status\s*$/i.test(c));
  const userVisibleIdx = cols.findIndex((c) => /^User-visible\?\s*$/i.test(c));
  const idIdx = cols.findIndex((c) => /^Feature-ID\s*$/i.test(c));
  const nameIdx = cols.findIndex((c) => /^Naam\s*$/i.test(c));
  const reasonIdx = cols.findIndex((c) => /Waarom nog niet|reason|reden/i.test(c));

  if (statusIdx === -1 || userVisibleIdx === -1 || idIdx === -1 || nameIdx === -1) {
    return {
      ok: false,
      error:
        'Feature-index table missing required columns (Feature-ID, Naam, User-visible?, Status)',
    };
  }

  const blockers = [];
  for (const row of dataRows) {
    const cells = parseRow(row);
    if (cells.length <= Math.max(statusIdx, userVisibleIdx, idIdx, nameIdx)) continue;

    const userVisible = (cells[userVisibleIdx] || '').trim();
    const isUserVisible = /^ja\s*$/i.test(userVisible) || /^yes\s*$/i.test(userVisible);
    if (!isUserVisible) continue;

    const status = (cells[statusIdx] || '').trim();
    const rowText = row.toLowerCase();
    const isManualOnly = rowText.includes('manual-only');
    if (status === '✅' || isManualOnly) continue;

    const id = (cells[idIdx] || '').trim() || '(unknown id)';
    const name = (cells[nameIdx] || '').trim() || '(unknown name)';
    const reason = reasonIdx >= 0 && cells[reasonIdx] ? cells[reasonIdx].trim() : status;
    blockers.push({ id, name, reason });
  }

  return { ok: true, blockers };
}

function checkRequiredDocs() {
  const missing = [];
  for (const name of REQUIRED_DOCS) {
    if (!existsSync(join(DOCS, name))) {
      missing.push(name);
    }
  }
  return missing;
}

function main() {
  const missingDocs = checkRequiredDocs();
  if (missingDocs.length > 0) {
    for (const name of missingDocs) {
      err('[preflight] MISSING REQUIRED DOC: docs/' + name);
    }
    process.exit(1);
  }

  let content;
  try {
    content = readFileSync(CANON_PATH, 'utf8');
  } catch (e) {
    if (e.code === 'ENOENT') {
      err('[preflight] CANON BLOCKED: docs/FUNCTIONAL_CANON.md not found.');
      process.exit(1);
    }
    err('[preflight] CANON BLOCKED: failed to read docs/FUNCTIONAL_CANON.md: ' + e.message);
    process.exit(1);
  }

  const result = parseFeatureIndex(content);
  if (!result.ok) {
    err('[preflight] CANON BLOCKED: ' + result.error);
    process.exit(1);
  }

  if (result.blockers.length > 0) {
    err('[preflight] CANON BLOCKED');
    result.blockers.forEach(({ id, name, reason }) => {
      err(`  - ${id} | ${name} | ${reason}`);
    });
    process.exit(1);
  }

  log('[preflight] CANON OK');
  process.exit(0);
}

main();
