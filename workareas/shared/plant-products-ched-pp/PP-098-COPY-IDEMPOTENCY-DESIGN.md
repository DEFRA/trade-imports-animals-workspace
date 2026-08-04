# pp-098 copy idempotency semantics

## Decision

Choose **(c): fingerprint the copy request by its source reference and reject an idempotency key reused
for a different source with HTTP 422**. The fingerprint will be persisted on every new copy in both the
live-animals fulfilment and plant-products notification models. A replay with the same key and the same
source returns the original copy. A replay with the same key and another source returns an
Unprocessable Entity response and does not create or return a copy.

This keeps the key globally unique while making the idempotency result conditional on the request being
the same operation. It follows the fail-loudly practice cited by the original investigation and avoids
turning a client key-reuse defect into a successful response containing the wrong notification. The
frontend already mints a fresh UUID for each rendered copy action and reuses it only when retrying that
action, so the 422 path is a guard against a broken or non-conforming client rather than a normal
frontend flow.

Copies written before this change have no persisted source fingerprint. Their source cannot be recovered
reliably from the mutable copied content, so a replay of such a key will also return 422 rather than risk
claiming that an unverifiable request matches. This is a deliberate compatibility cost of eliminating
the silent wrong-resource response.

## Rejected options

- **(a) Leave the global lookup unchanged.** This does satisfy the narrow rule “same key, same result”,
  and it is the cheapest option. It was rejected because the result can belong to a different source
  URI: the API reports success while returning a resource the client did not request. That silent data
  mix-up is a worse failure mode than rejecting an invalid replay.
- **(b) Scope the lookup to source reference.** This is simpler at service level and would treat the same
  key on another source as an independent operation. It was rejected because the frontend's per-action
  key generation means cross-source reuse indicates a client bug. Creating a second copy would hide that
  bug, while 422 makes it observable. It would also require replacing the existing global unique index;
  option (c) can retain that concurrency guard.

## Compatibility and shared-package ruling

A client relying on today's cross-source behaviour will no longer receive the first source's copy with
201. It will receive 422 and must retry the second source with a new idempotency key. A same-source replay
of a copy created after this change remains unchanged: it returns the same copy and Location with 201.

Sam's explicit “seems worth a design and fix” ruling authorises the matching live-animals change. Both
packages implement the same global-key fingerprint comparison, legacy-null rejection, same-source
replay, and cross-source 422 response, so pp-098 achieves **idempotency parity specifically**.

This is not a claim of blanket copy parity. A pre-existing package-specific difference remains:
live-animals permits a DRAFT source to be copied, while plant-products accepts only SUBMITTED or AMEND
and returns 400 for DRAFT. That difference is intentional for this increment and is not changed because
it does not diverge the new fingerprint behaviour. The eventual commit body must state plainly that
pp-098 deliberately changes behaviour on the shipped live-animals API surface.
