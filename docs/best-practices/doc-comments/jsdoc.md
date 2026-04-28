# JSDoc / TSDoc Format

Covers `.js` and `.ts` files. Read [`BEST_PRACTICES.md`](BEST_PRACTICES.md) first for the universal accuracy rules — this addendum covers format and tag conventions.

---

## When to write a doc comment

Default to **no comment**. Write JSDoc/TSDoc only when:

- The function is exported and its parameter constraints or return shape are non-obvious from the signature alone
- There is a genuine "why" that naming cannot express

Do not write doc comments for:
- Internal helpers whose signature is self-explanatory
- Simple arrow functions
- Anything that would just restate the function name

---

## Block format

Use `/** ... */`. Do not use `//` line comments for doc blocks.

```js
/**
 * Calculates the total cost including VAT.
 *
 * @param {number} subtotal - Pre-tax amount in pence
 * @param {number} vatRate - VAT rate as a decimal (e.g. 0.2 for 20%)
 * @returns {number} Total amount in pence including VAT
 * @throws {RangeError} If subtotal is negative
 */
const totalWithVat = (subtotal, vatRate) => { ... }
```

---

## Tags

### `@param`

```
@param {type} name - description
```

- **Name must exactly match** the actual parameter name. If the parameter is renamed, update the tag.
- Include `{type}` in `.js` files. In `.ts` files, the type lives in the signature — omit it from the tag (or omit the tag entirely if the description adds nothing).
- Use `[name]` for optional parameters: `@param {string} [locale]`
- Use `[name=default]` when documenting a default: `@param {number} [page=1]`

### `@returns` / `@return`

```
@returns {type} description
```

- Omit entirely for functions that return `undefined` or exist only for side effects.
- `{type}` must match what the function actually returns. Check the return statements.
- If the function can return `null` or `undefined`, reflect that: `{User | null}`.

### `@throws` / `@exception`

```
@throws {ErrorType} condition under which this is thrown
```

- Only include if the function **explicitly throws** (not if a callee might throw).
- If the throw was removed, remove the tag.
- `{ErrorType}` must match the actual error constructor used.

### `@async`

Optional. Usually clear from the `async` keyword in the signature. Only add if the function returns a Promise but is not declared `async`.

---

## TypeScript specifics

In `.ts` files, type information is already in the signature. Do not duplicate types in `@param {type}` tags.

```ts
// bad in TS — type duplicated from signature
/**
 * @param {string} name - The user's name
 * @returns {Promise<User>} The created user
 */
const createUser = async (name: string): Promise<User> => ...

// good in TS — description only, no redundant type
/**
 * @param name - Display name; trimmed before persistence
 */
const createUser = async (name: string): Promise<User> => ...
```

If the description adds nothing beyond what the name already says, omit the `@param` tag entirely.

---

## Accuracy checklist

When reviewing a `/** */` block, verify each claim against the current code:

| Check | What to look for |
|-------|-----------------|
| Param names | Every `@param name` matches an actual parameter in the signature |
| No phantom params | No `@param` for parameters that no longer exist |
| No missing params | No parameter exists without a `@param` (for exported functions with non-obvious params) |
| Return type | `@returns {type}` matches what `return` statements actually produce |
| Void check | No `@returns` on functions that return nothing |
| Throws type | `@throws {ErrorType}` matches the constructor in `throw new ErrorType(...)` |
| Throws presence | No `@throws` for errors the function no longer throws |
| Summary | First sentence describes current behaviour, not a previous version |