#!/usr/bin/env node
// Redact a diff in place: read INPUT, write redacted body to OUTPUT,
// print match count to stdout. Patterns drawn from the prompt brief:
//   - KEY=VALUE-style assignments where KEY ~ token|secret|password|api_key|bearer|authorization
//   - sk-..., ghp_..., AKIA..., JWT-shaped tokens, PEM private-key blocks
// We log only counts; never the matched substring.

'use strict'

const fs = require('node:fs')

const [, , inPath, outPath] = process.argv
if (!inPath || !outPath) {
  console.error('Usage: redact-diff.js <in> <out>')
  process.exit(1)
}

const src = fs.readFileSync(inPath, 'utf8')

const PATTERNS = [
  // KEY=VALUE / KEY: VALUE for sensitive keys
  /(?<prefix>(?:^|\s|["'`])(?:[A-Z_]*(?:TOKEN|SECRET|PASSWORD|API[_-]?KEY|BEARER|AUTHORIZATION)[A-Z_]*)\s*[:=]\s*)["']?(?<value>[^\s"'`,;}]+)["']?/gi,
  // AWS access key IDs
  /AKIA[0-9A-Z]{16}/g,
  // GitHub PATs
  /ghp_[A-Za-z0-9]{30,}/g,
  // Anthropic / OpenAI-style secret keys
  /sk-[A-Za-z0-9_-]{20,}/g,
  // JWT-shaped (three dot-separated base64url segments)
  /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g
]

let count = 0
let out = src

for (const re of PATTERNS) {
  out = out.replace(re, (m, ...rest) => {
    count++
    // KEY=VALUE pattern preserves the prefix, redacts the value.
    if (rest.length >= 2 && typeof rest[rest.length - 1] === 'object') {
      const groups = rest[rest.length - 1]
      if (groups && groups.prefix !== undefined) {
        return `${groups.prefix}***REDACTED***`
      }
    }
    return '***REDACTED***'
  })
}

// Multi-line PEM private-key blocks (BEGIN...END). Handled separately
// because regex needs s-flag and we count the block as one redaction.
out = out.replace(
  /-----BEGIN (?:RSA |EC |DSA |OPENSSH |ENCRYPTED )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |DSA |OPENSSH |ENCRYPTED )?PRIVATE KEY-----/g,
  () => {
    count++
    return '***REDACTED PRIVATE KEY BLOCK***'
  }
)

fs.writeFileSync(outPath, out)
process.stdout.write(String(count))
