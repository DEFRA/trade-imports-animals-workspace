# STYLE_FILE_REVIEWER cheat-sheet

Reference catalogue for the STYLE_FILE_REVIEWER worker
(`.claude/skills/code-style/references/STYLE_FILE_REVIEWER.md`). The
persona owns the goal, success criteria and workflow; this file holds
the 17-rule table and severity definitions it reviews against.

The same 17 rules (plus the doc-comment rules) are concatenated into the
pre-baked per-repo bundle `style-rules.{repo}.md` the persona reads in
full — this table is the quick-reference view.

## The 17 Rules

| # | Rule | What to look for |
|---|------|-----------------|
| 1 | **Do one thing** | Functions doing multiple unrelated things |
| 2 | **Fat-arrow functions** | `function foo()` declarations where `const foo = () =>` is appropriate |
| 3 | **Drop unnecessary braces/returns** | `=> { return x }` where `=> x` would do |
| 4 | **Functional style** | `for` loops with `.push()` where `.map()`/`.filter()` fits; direct mutation |
| 5 | **Small composed functions** | Large inline functions; missing helper extractions |
| 6 | **Naming** | Single-char vars; generic names (`data`, `info`, `obj`, `temp`, `res`); non-predicate booleans |
| 7 | **Destructuring and defaults** | Repeated `obj.prop.sub` access; null guards that should be default params |
| 8 | **Early returns** | Nested `if` pyramids; happy path buried in else branches |
| 9 | **No clever one-liners** | Pipelines that require a second reading to parse |
| 10 | **Named exports** | `export default` where `export const` is possible |
| 11 | **const > let, never var** | `var` anywhere; `let` for values that are never reassigned |
| 12 | **Optional chaining / nullish** | `&&`-chain null guards where `?.` fits; `\|\|` for defaults that should use `??` |
| 13 | **No magic numbers/strings** | Bare numeric/string literals with domain meaning |
| 14 | **async/await preferred** | `.then()` chains with more than one step |
| 15 | **Self-documenting code** | "What" comments; comments compensating for poor names |
| 16 | **Modern array/object methods** | Manual lookups where `.at(-1)`/`.findLast()` fits |
| 17 | **Doc comment accuracy** | `/** */` blocks where `@param`/`@returns` don't match the signature |

## Severity

| Severity | Definition |
|----------|-----------|
| **FAIL** | Clear, unambiguous violation of a stated rule (`var`, mutation in a hot path, `.then()` chain where `async/await` is the rule) |
| **WARN** | Violation exists but with a plausible contextual reason; or a borderline case |

If a finding is `PASS` or `N/A` — do nothing. Don't add a todo.
