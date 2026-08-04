# pp-095 — fix pass. The structural pin has a one-line bypass.

**FRONTEND repo.** **Your three staged files are correct — `git status` first and preserve them.** The
production fix is confirmed sound: rendering consumes `ADDRESS_COUNTRY_OPTIONS` and validation derives
its codes from that same value, so it is genuinely **one expression**, which was the acceptance
criterion that mattered. Extending to the **packer** selector was right — same defect, same page — and
you were right to find it when my brief named only delivery.

## The finding

`countries.test.js:108-133` discovers consumers with `/\bcountryOptions\s*\(/u` and then requires
`/\bukSubdivisionOptions\s*\(/u` — **both matched against raw source text**.

**The bypass is one line:** `import { countryOptions as ukSubdivisionOptions } from '…/countries.js'`
makes a controller call `countryOptions()` twice while both regexes still pass. A comment or a string
containing `ukSubdivisionOptions(` satisfies it too.

**This is the pp-088 shape.** That increment's operation-set pin had a bare `'clear'` literal as its
escape hatch, and adding a name beside it went green. The lesson recorded then was that **a pin's
exemption must carry its own obligation** — the invitation to take the escape is the defect, not the
person who takes it.

## The change, and I am scoping it

The review proposes parsing controller syntax and resolving imports properly. **That is heavier than
this needs.** Do the cheap thing that actually closes the named bypass:

**Match the import specifier, not just the call token.** For each discovered consumer, assert that it
imports `ukSubdivisionOptions` **from the countries module under that name** and calls it — so an alias
that renames `countryOptions` cannot satisfy the requirement, and a mention inside a comment or string
cannot either. Do the same for how consumers are discovered, so a sixth controller that imports
`countryOptions` under an alias is still found.

**If you conclude a regex cannot do this honestly and an AST parse is genuinely required, say so and do
that instead** — I would rather have the heavier test than a lighter one that reads stronger than it is.
Your call, with reasons.

## Then make the exemption accurate

The current comment claims the pin cannot discover selectors that avoid `countryOptions()` or prove the
calls feed rendered markup. **Both true, but incomplete** — it does not say the check is textual. After
your fix, state precisely what remains uncovered. **An exemption that overstates its own coverage is
worse than none, because a future reader trusts it.**

## Constraints

- **Do not touch the production fix, the controller test, or the four sibling pages.**
- Plant unit count is **731** — no test added, deleted or renamed by this change unless you take the AST
  route and split the pin; explain any movement.
- `npm run test:plant-products`, `npm test`, `npm run lint`, `npm run lint:arch`,
  `npm run test:live-animals` (**559**, necessary but NOT sufficient — say so), `npm run format`.
- **Stage, do not commit.** Never run `sonar`.

## Prove it

**Apply the bypass yourself** — alias `countryOptions as ukSubdivisionOptions` in one controller — and
show the pin now **fails**, then revert and show green. Report the failing test name. **Mutation
evidence must survive the fix, not merely precede it**: run the bypass against the FIXED pin, not the
old one.
