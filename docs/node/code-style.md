# JavaScript / TypeScript — Code Style

Project baseline: Node >= 24, ESM modules throughout. These conventions apply across all Node.js repos in this workspace.

---

## 1. Do one thing

Every function should have a single, clear responsibility. If you find yourself writing "and" when describing what a function does, split it.

```js
// bad — fetches AND transforms AND validates
const processUserData = async (id) => {
  const response = await fetch(`/users/${id}`)
  const data = await response.json()
  if (!data.name) throw new Error('missing name')
  return { ...data, name: data.name.trim().toLowerCase() }
}

// good — each step is its own concern
const fetchUser = (id) => fetch(`/users/${id}`).then((res) => res.json())
const normaliseUser = (user) => ({ ...user, name: user.name.trim().toLowerCase() })
const validateUser = (user) => {
  if (!user.name) throw new Error('missing name')
  return user
}

const processUser = async (id) => fetchUser(id).then(validateUser).then(normaliseUser)
```

---

## 2. Prefer fat-arrow functions

Use fat arrows for all functions that are not class methods or top-level named exports requiring hoisting.

```js
// bad
function double(value) {
  return value * 2
}

// good
const double = (value) => value * 2
```

Single-expression bodies should drop the braces and `return`:

```js
// bad
const isActive = (user) => {
  return user.status === 'active'
}

// good
const isActive = (user) => user.status === 'active'
```

---

## 3. Drop unnecessary braces and returns

Braces and explicit `return` add noise. Remove them when the body is a single expression.

```js
// array methods — no braces needed
const names = users.map((user) => user.name)
const admins = users.filter((user) => user.role === 'admin')
const total = orders.reduce((sum, order) => sum + order.amount, 0)

// chained pipelines read left-to-right without clutter
const adminNames = users
  .filter((user) => user.role === 'admin')
  .map((user) => user.name)
  .sort()
```

Exception: multi-step logic that would be unreadable on one line should stay in a block — clarity beats brevity.

---

## 4. Prefer functional style

Reach for `map`, `filter`, `reduce`, `find`, and `flatMap` over imperative loops. Avoid mutating arrays or objects in place.

```js
// bad — mutation, imperative loop
const result = []
for (const item of items) {
  if (item.active) {
    result.push(item.id)
  }
}

// good
const result = items.filter((item) => item.active).map((item) => item.id)
```

Use spread and object rest to produce new values rather than mutating:

```js
// bad
user.name = 'Alice'

// good
const updatedUser = { ...user, name: 'Alice' }
```

---

## 5. Small, composed functions over large blocks

Break logic into small named functions and compose them. Named functions act as inline documentation — a well-named helper removes the need for a comment.

```js
// bad — one large function doing everything
const buildEmailPayload = (order) => {
  const items = order.lines
    .filter((line) => line.quantity > 0)
    .map((line) => `${line.name} x${line.quantity}`)
  const total = order.lines.reduce((sum, line) => sum + line.price * line.quantity, 0)
  const greeting = order.customer.preferredName ?? order.customer.firstName
  return {
    to: order.customer.email,
    subject: `Order ${order.ref} confirmed`,
    body: `Hi ${greeting},\n\n${items.join('\n')}\n\nTotal: £${total.toFixed(2)}`
  }
}

// good — each helper tells a story
const activeLines = (lines) => lines.filter((line) => line.quantity > 0)
const formatLine = (line) => `${line.name} x${line.quantity}`
const orderTotal = (lines) => lines.reduce((sum, line) => sum + line.price * line.quantity, 0)
const displayName = (customer) => customer.preferredName ?? customer.firstName

const buildEmailPayload = (order) => ({
  to: order.customer.email,
  subject: `Order ${order.ref} confirmed`,
  body: [
    `Hi ${displayName(order.customer)},`,
    '',
    ...activeLines(order.lines).map(formatLine),
    '',
    `Total: £${orderTotal(order.lines).toFixed(2)}`
  ].join('\n')
})
```

---

## 6. Naming

Names should reveal intent. Never use single-character variable names. Avoid abbreviations and generic names like `data`, `info`, `obj`, `temp`.

```js
// bad
const d = await getData(id)
const fn = (user) => user.active
const users = items.filter((u) => u.active)

// good
const user = await fetchUser(id)
const isActive = (user) => user.active
const activeUsers = users.filter((user) => user.active)
```

This applies everywhere — including inline callbacks and destructured parameters:

```js
// bad
orders.reduce((a, b) => a + b.total, 0)
items.map(({ n, v }) => `${n}: ${v}`)

// good
orders.reduce((total, order) => total + order.total, 0)
items.map(({ name, value }) => `${name}: ${value}`)
```

Boolean variables and functions should read as predicates:

```js
const isValid = (value) => value !== null && value !== undefined
const hasPermission = (user, action) => user.roles.includes(action)
```

---

## 7. Destructuring and defaults

Destructure early to reduce repeated property access:

```js
// bad
const greet = (user) => `Hello ${user.profile.firstName} ${user.profile.lastName}`

// good
const greet = ({ profile: { firstName, lastName } }) => `Hello ${firstName} ${lastName}`
```

Use default parameter values rather than guard clauses where possible:

```js
// bad
const paginate = (items, page, size) => {
  const currentPage = page ?? 1
  const pageSize = size ?? 20
  return items.slice((currentPage - 1) * pageSize, currentPage * pageSize)
}

// good
const paginate = (items, page = 1, size = 20) => items.slice((page - 1) * size, page * size)
```

---

## 8. Early returns over nested conditionals

Return early to eliminate nesting. The happy path should be the last thing in the function.

```js
// bad
const processPayment = (payment) => {
  if (payment) {
    if (payment.amount > 0) {
      if (payment.currency === 'GBP') {
        return charge(payment)
      }
    }
  }
}

// good
const processPayment = (payment) => {
  if (!payment) return null
  if (payment.amount <= 0) return null
  if (payment.currency !== 'GBP') return null
  return charge(payment)
}
```

---

## 9. Avoid clever one-liners at the expense of clarity

Functional and terse is good. Clever and unreadable is not. When a pipeline becomes hard to follow, name the intermediate steps.

```js
// too clever
const result = data.reduce((acc, { key, val }) => ({ ...acc, [key]: (acc[key] ?? []).concat(val) }), {})

// better — name what you're building
const groupByKey = (items) =>
  items.reduce((groups, { key, value }) => {
    const existing = groups[key] ?? []
    return { ...groups, [key]: [...existing, value] }
  }, {})

const result = groupByKey(data)
```

---

## 10. Module exports

Prefer named exports. Default exports make refactoring harder and IDE support weaker.

```js
// bad
export default function formatDate(date) { ... }

// good
export const formatDate = (date) => ...
```

Group related utilities in a single module rather than scattering single-function files:

```js
// src/utils/date.js
export const formatDate = (date) => ...
export const parseDate = (str) => ...
export const isExpired = (date) => ...
```

---

## 11. `const` over `let`, never `var`

Default to `const`. Only reach for `let` when you genuinely need to reassign. Never use `var`.

```js
// bad
var count = 0
let name = 'Alice'  // never reassigned

// good
const name = 'Alice'

// let is justified here
let retries = 0
while (retries < 3) {
  retries++
}
```

If you find yourself needing `let` for a value built up over time, that is usually a sign to use `map`, `filter`, or `reduce` instead.

---

## 12. Optional chaining and nullish coalescing

Use `?.` and `??` to handle absent values without verbose null checks.

```js
// bad
const city = user && user.address && user.address.city
const label = value !== null && value !== undefined ? value : 'unknown'

// good
const city = user?.address?.city
const label = value ?? 'unknown'
```

Prefer `??` over `||` for defaults — `||` triggers on any falsy value (`0`, `''`, `false`), which is rarely what you want:

```js
// bad — treats 0 and '' as missing
const count = total || 0
const title = input || 'Untitled'

// good — only falls back when null or undefined
const count = total ?? 0
const title = input ?? 'Untitled'
```

---

## 13. No magic numbers or strings

Extract bare literals that carry meaning into named constants. The name documents the intent; the constant makes it easy to change.

```js
// bad
if (user.role === 3) { ... }
setTimeout(sync, 86400000)
if (password.length < 8) { ... }

// good
const ROLE_ADMIN = 3
const ONE_DAY_MS = 24 * 60 * 60 * 1000
const MIN_PASSWORD_LENGTH = 8

if (user.role === ROLE_ADMIN) { ... }
setTimeout(sync, ONE_DAY_MS)
if (password.length < MIN_PASSWORD_LENGTH) { ... }
```

---

## 14. Prefer `async`/`await`

Use `async`/`await` over `.then()` chains. It reads sequentially, handles errors uniformly with `try`/`catch`, and is easier to debug.

```js
// bad
const loadDashboard = (userId) =>
  fetchUser(userId)
    .then((user) => fetchPermissions(user.role))
    .then((permissions) => fetchWidgets(permissions))
    .catch((err) => logger.error(err))

// good
const loadDashboard = async (userId) => {
  const user = await fetchUser(userId)
  const permissions = await fetchPermissions(user.role)
  return fetchWidgets(permissions)
}
```

Exception: short single-expression pipelines where `.then()` reads cleanly as a transformation are fine:

```js
const fetchUser = (id) => fetch(`/users/${id}`).then((res) => res.json())
```

---

## 15. Self-documenting code — prefer no comments

Write code that explains itself through naming and structure. Comments drift out of sync with code; names do not.

When you feel the urge to write a comment, try renaming or extracting a function first:

```js
// bad — comment compensating for a poor name
// multiply by 1.2 to add VAT
const total = subtotal * 1.2

// bad — comment describing what the code does
// filter out inactive users and get their IDs
const result = users.filter((user) => user.active).map((user) => user.id)

// good — the code reads as its own explanation
const VAT_MULTIPLIER = 1.2
const totalWithVat = subtotal * VAT_MULTIPLIER

const activeUserIds = users.filter((user) => user.active).map((user) => user.id)
```

Comments are appropriate for **why**, not **what** — when there is a non-obvious constraint, a known gotcha, or a deliberate workaround:

```js
// Hapi validates the full payload before route handlers run,
// so by the time we reach here the token is guaranteed present.
const { token } = request.payload
```

---

## 16. Modern array and object methods

Prefer built-in methods over manual implementations. They are more readable and signal intent clearly.

```js
// last element — no need to compute length
const last = items.at(-1)

// searching from the end
const lastError = events.findLast((event) => event.type === 'error')

// check a condition holds for every item
const allApproved = items.every((item) => item.approved)

// check at least one item matches
const hasErrors = items.some((item) => item.type === 'error')

// flatten one level and map in one pass
const tags = posts.flatMap((post) => post.tags)

// group into an object by a key (Node 22+)
const byStatus = Object.groupBy(orders, (order) => order.status)

// build an object from entries
const index = Object.fromEntries(users.map((user) => [user.id, user]))
```