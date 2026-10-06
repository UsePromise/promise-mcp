import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const base = process.env.GITHUB_BASE_REF;
if (!base) {
  console.log('governance-check: no pull-request base ref; skipping.');
  process.exit(0);
}
const run = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
const baseRef = `origin/${base}`;
const rows = run('diff', '--name-status', `${baseRef}...HEAD`).split('\n').filter(Boolean).map((line) => {
  const [status, ...rest] = line.split('\t');
  return { status, path: rest.at(-1) };
});
const files = rows.map((x) => x.path);
let body = '';
try { body = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8')).pull_request?.body ?? ''; } catch {}
const failures = [];
const notes = [];
const templatePlaceholders = new Set([
  'n/a - no dependency additions or upgrades.',
  'n/a - no dependency additions or upgrades',
  'n/a - mcp tool catalog unchanged.',
  'n/a - mcp tool catalog unchanged',
  'n/a - platform/auth/tool-handler boundary unchanged.',
  'n/a - platform/auth/tool-handler boundary unchanged',
  'n/a - public mcp server metadata unchanged.',
  'n/a - public mcp server metadata unchanged',
  'n/a - deployment/ci/docker behavior unchanged.',
  'n/a - deployment/ci/docker behavior unchanged',
]);
const normalizeField = (value) => value.toLowerCase().replace(/[—–]/g, '-').replace(/\s+/g, ' ').trim();
const fieldValue = (label) => {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = body.match(new RegExp(`(?:^|\\n)\\s*(?:[-*]\\s*)?${escaped}\\s*:\\s*(.*)$`, 'im'));
  return match?.[1]?.trim() ?? '';
};
const hasSubstantiveField = (label) => {
  const value = fieldValue(label);
  if (!value) return false;
  const normalized = normalizeField(value);
  if (templatePlaceholders.has(normalized)) return false;
  if (/^n\/a(?:\s*-\s*)?[.!]?$/.test(normalized)) return false;
  return true;
};
const requireField = (label, why) => { if (!hasSubstantiveField(label)) failures.push(`${label}: required — ${why}`); };

function jsonAt(ref, file) { try { return JSON.parse(run('show', `${ref}:${file}`)); } catch { return null; } }
function currentJson(file) { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; } }
function deps(pkg) { return Object.assign({}, pkg?.dependencies, pkg?.devDependencies, pkg?.peerDependencies, pkg?.optionalDependencies); }

if (files.includes('package.json')) {
  const before = deps(jsonAt(baseRef, 'package.json'));
  const after = deps(currentJson('package.json'));
  const changes = Object.entries(after).filter(([name, version]) => !(name in before) || before[name] !== version);
  if (changes.length) {
    requireField('Dependency rationale', `MCP dependency additions/updates detected (${changes.map(([n,v]) => `${n}@${v}`).join(', ')})`);
    notes.push(`dependency changes: ${changes.map(([n,v]) => `${n}@${v}`).join(', ')}`);
  }
}

if (files.includes('src/toolCatalog.ts')) {
  requireField('Tool-surface rationale', 'MCP tool catalog changed; explain why existing tools cannot express the job');
  notes.push('tool catalog changed');
}

const boundaryFiles = files.filter((f) => ['src/platformClient.ts', 'src/toolHandlers.ts', 'src/server.ts', 'src/mcpProtocol.ts'].includes(f));
if (boundaryFiles.length) {
  requireField('Authorization/boundary impact', `MCP authorization/platform boundary changed (${boundaryFiles.join(', ')})`);
  notes.push(`boundary files: ${boundaryFiles.join(', ')}`);
}

const discoveryFiles = files.filter((f) => /^server(?:\.draft)?\.json$/.test(f));
if (discoveryFiles.length) {
  requireField('Client discovery impact', `public MCP server metadata changed (${discoveryFiles.join(', ')})`);
  notes.push(`server metadata: ${discoveryFiles.join(', ')}`);
}

const opsFiles = files.filter((f) => f === 'Dockerfile' || f.startsWith('.github/workflows/'));
if (opsFiles.length) {
  requireField('Operational impact', `MCP deployment/CI surface changed (${opsFiles.join(', ')})`);
  notes.push(`operational files: ${opsFiles.join(', ')}`);
}

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (/\.(ts|tsx|js|mjs)$/.test(entry.name)) out.push(full);
  }
  return out;
}
const forbiddenImport = /(?:from\s+|require\()\s*['"](?:pg|postgres|redis|ioredis)['"]/;
const forbiddenProvider = /gmail\.googleapis\.com|graph\.microsoft\.com/i;
for (const file of walk('src')) {
  const text = fs.readFileSync(file, 'utf8');
  if (forbiddenImport.test(text)) failures.push(`Direct datastore dependency is forbidden in MCP: ${file}`);
  if (forbiddenProvider.test(text)) failures.push(`Direct Gmail/Outlook provider access is forbidden in MCP: ${file}`);
}

if (notes.length) console.log(`governance-check detected:\n- ${notes.join('\n- ')}`);
if (failures.length) {
  console.error('\nGovernance check failed. Add the required PR-body field(s) with concrete explanation/evidence:\n');
  for (const failure of failures) console.error(`- ${failure}`);
  console.error('\nMCP remains a thin client over the Promise platform API. Untouched template N/A placeholders do not count; replace them with a concrete explanation.');
  process.exit(1);
}
console.log('governance-check: passed.');
