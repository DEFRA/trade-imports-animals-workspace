# Sonar way — common rules to write clean first time

The CI SonarCloud scan and the IntelliJ SonarQube plugin both run the
default **Sonar way** profile. These are the rules most often tripped —
write code that passes them up front instead of fixing findings later.

## Both languages

| Rule | Write it this way |
|---|---|
| S3776 | Keep cognitive complexity ≤ 15 per function — extract helpers instead of nesting if/else/loops |
| S1192 | A string literal used 3+ times → named constant |
| S107 | ≤ 7 parameters — introduce a parameter object/record |
| S1172 | No unused function parameters |
| S1854 | No dead stores — don't assign values never read |
| S125 | No commented-out code — delete it, git remembers |
| S1135 | `TODO` must reference a ticket (`// TODO EUDPA-XXX: ...`) |
| S1126 | Return boolean expressions directly, not `if (x) return true; else return false` |
| S2589 | No conditions that are always true/false |
| S4144 | No two methods/functions with identical bodies — extract and share |

## Java

| Rule | Write it this way |
|---|---|
| S3655 | Never `Optional.get()` without `isPresent()` — prefer `map`/`orElse`/`orElseThrow` |
| S2095 | Resources (`InputStream`, clients, etc.) in try-with-resources |
| S106 | No `System.out`/`System.err` — use the logger |
| S1118 | Utility classes get a private constructor |
| S2259 | Guard possible nulls before dereference — `Objects.requireNonNull` at boundaries |
| S1452 | No wildcard generic return types (`List<?>`) |
| S112 | Throw specific exceptions, never bare `RuntimeException`/`Exception` |
| S1948 | Fields of `Serializable` classes must be serializable |
| S5786 | JUnit 5 test classes/methods package-private, no `public` |
| S2699 | Every test has at least one assertion |

## JavaScript

| Rule | Write it this way |
|---|---|
| S6582 | Prefer optional chaining `a?.b` over `a && a.b` |
| S3504 | `const`/`let`, never `var` |
| S1481 | No unused local variables |
| S6571 | No redundant type/truthiness checks the runtime guarantees |
| S2486 | Never swallow exceptions — handle or rethrow with context |
| S4138 | Prefer `for...of` over index loops where index isn't needed |
| S6606 | Prefer `??` over `\|\|` for defaulting (avoids falsy-zero bugs) |
| S3358 | No nested ternaries — extract a function or if/else |
| S1186 | No empty functions without an explaining comment |
| S6079 | Tests: no assertions after the test's done/return path |

## Coverage gate

SonarCloud's quality gate also requires **coverage on new code** —
every new branch/function needs a test exercising it, or the PR fails
the gate even with zero rule findings.
