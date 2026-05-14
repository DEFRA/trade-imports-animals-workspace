// Alpha-sort every YAML map key at every depth in a compose file.
// Lists (env arrays, ports, command, healthcheck.test, etc.) are NEVER
// reordered — their position is semantic. Map-form environment blocks
// (e.g. cdp-uploader) do get their keys sorted, same as every other map.
//
// All comments are stripped on write — this tool uses js-yaml's load/dump.
//
// Invocation:
//   node scripts/stack/sort-compose-keys.mjs <path>            # dry run, prints to stdout
//   node scripts/stack/sort-compose-keys.mjs <path> --check    # exit 1 if unsorted
//   node scripts/stack/sort-compose-keys.mjs <path> --write    # rewrite in place
//
// js-yaml is bootstrap-installed into ~/.cache/sort-compose-keys on first run
// — no workspace-level package.json, no global install needed.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { homedir } from 'node:os';
import { join } from 'node:path';

const CACHE_DIR = join(homedir(), '.cache', 'sort-compose-keys');
const MODULES_DIR = join(CACHE_DIR, 'node_modules');

if (!existsSync(join(MODULES_DIR, 'js-yaml'))) {
  mkdirSync(CACHE_DIR, { recursive: true });
  console.error('bootstrap: installing js-yaml to ~/.cache/sort-compose-keys (one-time)');
  execSync('npm install --silent --no-save --no-audit --no-fund --no-package-lock js-yaml', {
    cwd: CACHE_DIR,
    stdio: ['ignore', 'ignore', 'inherit'],
  });
}

const require = createRequire(join(MODULES_DIR, '_'));
const yaml = require('js-yaml');

const args = process.argv.slice(2);
const filePath = args.find((a) => !a.startsWith('--'));
const mode = args.includes('--write')
  ? 'write'
  : args.includes('--check')
    ? 'check'
    : 'dry';

if (!filePath) {
  console.error('usage: node sort-compose-keys.mjs <path> [--check|--write]');
  process.exit(2);
}

const sortMapKeys = (node) => {
  if (Array.isArray(node)) {
    return node.map(sortMapKeys);
  }
  if (node && typeof node === 'object' && node.constructor === Object) {
    const sorted = {};
    for (const key of Object.keys(node).sort((a, b) => a.localeCompare(b))) {
      sorted[key] = sortMapKeys(node[key]);
    }
    return sorted;
  }
  return node;
};

const original = readFileSync(filePath, 'utf8');
const parsed = yaml.load(original);
const sorted = sortMapKeys(parsed);
const dumped = yaml.dump(sorted, {
  lineWidth: -1,
  noRefs: true,
  quotingType: "'",
  forceQuotes: false,
  sortKeys: false,
});

if (mode === 'write') {
  writeFileSync(filePath, dumped);
  console.log(`wrote: ${filePath}`);
} else if (mode === 'check') {
  if (dumped === original) {
    process.exit(0);
  }
  console.error(`${filePath} is not sorted (run with --write)`);
  process.exit(1);
} else {
  process.stdout.write(dumped);
}
