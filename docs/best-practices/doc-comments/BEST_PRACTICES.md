# Doc Comment Accuracy

Doc comments are a contract between the author and the next reader. When they exist, they must accurately describe what the code currently does. A comment that no longer matches its function is actively misleading — worse than no comment at all.

This guide covers the universal accuracy rules. For format and tag syntax, see the language-specific addenda:

- JavaScript / TypeScript → [`jsdoc.md`](jsdoc.md)
- Java → [`javadoc.md`](javadoc.md)

---

## The rule

**Absence is not a violation. Present-but-wrong is.**

If a function has no doc comment, that is fine. If it has a doc comment, every claim that comment makes must be true of the current code.

---

## What makes a comment inaccurate

### Parameter drift

The comment documents a parameter that was renamed, removed, or added without updating the doc.

```
// bad — param renamed from userId to id, @param not updated
// bad — new `role` parameter added, @param not added
// bad — `options` parameter removed, @param still present
```

### Return type or shape mismatch

The `@returns` / `@return` describes a type or shape that differs from what the function actually returns.

```
// bad — says returns {string}, function actually returns {User}
// bad — @returns present but function is void (returns undefined)
// bad — says nullable but function always returns a value
```

### Stale `@throws` / `@exception`

The comment documents an exception that is no longer thrown, or documents the wrong exception type.

```
// bad — documents @throws Error("not found") but the throw was removed
// bad — says @throws TypeError but actually throws RangeError
```

### Description mismatch

The summary sentence describes behaviour that has changed — a different responsibility, a renamed concern, or a completely repurposed function.

```
// bad — "Validates and saves the form" but validation was extracted elsewhere
// bad — "Sends a welcome email" but now sends any notification type
```

---

## Severity

| Severity | When |
|----------|------|
| **FAIL** | Wrong param name; `@returns` type is flatly wrong; documented `@throws` for an exception that was removed |
| **WARN** | Description is vague or partially outdated but not actively wrong; `@returns` present on a void function; `@throws` for the wrong exception subtype |
| **PASS** | Doc comment is accurate, or no doc comment exists |

---

## When to fix vs delete

**Fix** the comment if it documents a genuine contract consumers need — parameter constraints, return shape, thrown exceptions.

**Delete** the comment if fixing it would produce nothing beyond what the function signature already says. A comment that just restates the name adds no value.

```
// delete this — it says nothing the signature doesn't already say
/**
 * Gets the user by ID.
 * @param id The user ID
 * @returns The user
 */
const getUser = (id) => ...
```

---

## Proposed fix format

When flagging a doc comment violation in a todo list, always include a proposed corrected block (or `[delete comment]`) in the **Proposed Fix** column. The fixer should not have to re-derive the correct comment from scratch.