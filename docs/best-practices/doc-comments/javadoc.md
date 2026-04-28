# Javadoc Format

Covers `.java` files. Read [`BEST_PRACTICES.md`](BEST_PRACTICES.md) first for the universal accuracy rules — this addendum covers format and tag conventions.

---

## When to write a Javadoc comment

Write Javadoc for:
- Public methods on service classes, controllers, and repository interfaces
- Public constructors with non-obvious parameters
- Classes where the responsibility isn't obvious from the name

Do not write Javadoc for:
- `private` and package-private methods unless the logic is genuinely surprising
- Simple getters and setters
- Override methods where the parent Javadoc is inherited and still accurate (use `{@inheritDoc}` instead)

---

## Block format

```java
/**
 * One-sentence summary ending with a full stop.
 *
 * Optional longer description if the summary is insufficient.
 *
 * @param paramName description of the parameter
 * @return description of the return value
 * @throws ExceptionType condition under which this is thrown
 */
public ReturnType methodName(ParamType paramName) { ... }
```

Place the comment immediately before the declaration with no blank line between them.

---

## Tags

### `@param`

```
@param name description
```

- Name must match the actual parameter name exactly.
- If a parameter is renamed, reordered, added, or removed, update all `@param` tags.
- Do not include the type — it is in the signature.

### `@return`

```
@return description of what is returned
```

- Omit for `void` methods.
- Description must match what the method actually returns — check `return` statements.
- If the return type changed (e.g. now returns `Optional<T>` instead of `T`), update the description.

### `@throws`

```
@throws ExceptionType condition
```

- Only include for **checked exceptions** (required by the compiler) and **unchecked exceptions that are part of the method's documented contract**.
- Remove tags for exceptions that are no longer thrown.
- `ExceptionType` must be the simple class name of the actual exception thrown.

### `{@inheritDoc}`

Use on `@Override` methods to inherit the parent's Javadoc rather than duplicating or drifting from it.

```java
/**
 * {@inheritDoc}
 */
@Override
public User findById(String id) { ... }
```

---

## Accuracy checklist

When reviewing a `/** */` block on a Java method, verify each claim against the current code:

| Check | What to look for |
|-------|-----------------|
| Param names | Every `@param name` matches a parameter in the method signature |
| No phantom params | No `@param` for parameters that no longer exist |
| Param count | Count of `@param` tags matches number of parameters |
| Return description | `@return` accurately describes what return statements produce |
| Void check | No `@return` on `void` methods |
| Throws types | `@throws ExceptionType` matches the exception actually thrown |
| Throws presence | No `@throws` for exceptions the method no longer throws |
| Summary | First sentence describes current responsibility, not a previous version |
| Inherited methods | `@Override` methods use `{@inheritDoc}` rather than a potentially-stale copy |