# CHED-P delegated-authority trace discovery

The whole `trace-index.raw.txt` corpus was searched for `DoA`, delegation, on-behalf-of, agent, trade-partner, organisation, permission, user-permission, and `auth/` terms. Ambiguous candidates were inspected with the Playwright 1.61.1 trace CLI.

## Conclusion

There are **zero genuine CHED-P/CVEDP delegated notification journeys** in this trace corpus.

All ten tests under `auth/DoA/` create CHED-PP notifications, not CHED-P notifications. Their actions explicitly select “Plants, plant products and…”, enter commodity code `06011010` (HS chapter 06), and describe or produce a `CHEDPP` notification reference.

Three type-agnostic traces are selected because they exercise reusable delegated-agent infrastructure that plausibly applies to a CHED-P journey. None supplies evidence of a POAO commodity or a `CVEDP` notification; they are included only as type-agnostic supporting traces.

## Selected traces

| Hash | Title | Why it is DoA | Why it is CHED-P/POAO or type-agnostic |
|---|---|---|---|
| `65343fb21a64286537e39551a3306b99058ec6e4` | `address-book/address-book-b2c.spec.ts:58 › Address Book — B2C user › a B2C agent cannot see another organisation address` | Exercises an agent-versus-organisation boundary: a B2C agent signs in and is prevented from finding another organisation’s branch address. This is relevant to delegated agents acting across organisation boundaries. | Type-agnostic. It does not create a notification or select a commodity/CHED type, so the same organisation-isolation rule plausibly applies while creating a CHED-P. |
| `c90c9d4c32cdc6a7919ccadf9c0f039d3167fb25` | `auth/login.spec.ts:15 › Login › should login successfully as b2cLvu (org selection)` | Exercises the shared B2C organisation-selection surface: after sign-in, the user selects an `Organisation` and continues to the notification dashboard. The actor is an LVU user rather than an agent, so this is supporting organisation-selection evidence only. | Type-agnostic. No notification is created and no CHED type or commodity is selected; the organisation chooser plausibly applies to CHED-P-capable users with multiple organisations. |
| `cc6cea8221f684d1090a9a3f0f15cf782b46de84` | `tradePartner/manage-trade-partner.spec.ts:4 › Manager trade partner › Correct permissions page is shown when navigating to manage trade partners` | Uses the same user ID as the `b2cDoaAgent` setup trace, opens `Manage trade partners`, answers the authorisation question, and verifies the `Manage your authorisations` page. This directly exercises trade-partner/delegated-authority management. | Type-agnostic. It manages authorisations without creating a notification or choosing a CHED type, so the resulting delegation can plausibly be used for a CHED-P journey. |

## Excluded candidates

### Direct `auth/DoA/` candidates: all CHED-PP

Every direct DoA journey was excluded from the CHED-P selection after trace inspection.

| Hash | Title | Exclusion evidence |
|---|---|---|
| `065de8c56896cc607da83498efba9c11575a7438` | `auth/DoA/doa-importer-access.spec.ts:60 › Delegated Organisation - Notification Visibility › Franklyn D (Plant Org Test member) submits → David D (Plant Org Test member) can see it` | Creates a CHED-PP, selects plants, uses `06011010`, and searches for `CHEDPP.GB.2026.1525737`. |
| `253df9dcdf570dfa90715630fcd0b175ae37c695` | `auth/DoA/doa-notification-creation.spec.ts:33 › Delegated Organisation - Notification Creation › Carol Clark (agent) creates for Plant Org 1 → notification assigned to Plant Org 1 with Trade Partner badge` | Creates a CHED-PP for the plant organisation, selects plants, uses `06011010`, and searches for `CHEDPP.GB.2026.1525741`. |
| `2c16ad659671044cd9b138be5a71b21c658af3b8` | `auth/DoA/doa-importer-access.spec.ts:7 › Delegated Organisation - Notification Visibility › Carol Clark (agent for Plant Org 1) submits → Isabel Irwin (Plant Org 1 member) can see it` | Creates a CHED-PP, selects plants, uses `06011010`, and searches for `CHEDPP.GB.2026.1525738`. |
| `545412266caaec96b0aae12262fecfee3e099888` | `auth/DoA/doa-notification-creation.spec.ts:113 › Delegated Organisation - Notification Creation › Carol Clark (agent) creates for Plant Org 1 → contact and importer auto-populated from Plant Org 1` | Creates a CHED-PP, selects plants, uses `06011010`, and searches for `CHEDPP.GB.2026.1525742`. |
| `5dd87b7fee11881f5706c26e17617e68b19247d1` | `auth/DoA/doa-agent-access.spec.ts:60 › Delegated Organisation - Agent Visibility › Carol Clark (agent) submits for own org (Plant Agency C) → Isabel Irwin (Plant Org 1 member) cannot see it` | Creates a CHED-PP for the plant agency, selects plants, uses `06011010`, and searches for `CHEDPP.GB.2026.1525736`. |
| `6e71cf94f89d27e643a2c97d05b67b153700b499` | `auth/DoA/doa-notification-creation.spec.ts:8 › Delegated Organisation - Notification Creation › Isabel Irwin (Plant Org 1 member) creates → notification assigned to Plant Org 1` | Creates a CHED-PP, selects plants, uses `06011010`, and searches for `CHEDPP.GB.2026.1525740`. It is also an importer/member baseline rather than an agent-on-behalf journey. |
| `851759a01b1ff318ca2a82fb278f9c41b05e9616` | `auth/DoA/doa-notification-creation.spec.ts:65 › Delegated Organisation - Notification Creation › Carol Clark (agent) creates for Plant Org 1 → changes organisation to Plant Agency C before submitting` | Creates a draft CHED-PP, selects plants, uses `06011010`, and searches for `CHEDPP.GB.2026.1525743`. |
| `b1f31ed70fbdb2f92f66488da5bda6f3e510a0c9` | `auth/DoA/doa-agent-access.spec.ts:34 › Delegated Organisation - Agent Visibility › Carol Clark (agent) submits for Plant Org 1 → Carol Clark (agent) can see it on her dashboard` | Creates a CHED-PP, selects plants, uses `06011010`, and searches for `CHEDPP.GB.2026.1525735`. |
| `b701cc405623fb2d2e2b2dedcf2bec3d10dfb954` | `auth/DoA/doa-importer-access.spec.ts:34 › Delegated Organisation - Notification Visibility › Carol Clark (agent for Plant Org 1) drafts → Isabel Irwin (Plant Org 1 member) cannot see it` | Creates a draft CHED-PP, selects plants, and uses `06011010`. |
| `e9b5e36b926ee3b7ac855c45cf8169dd38321ad4` | `auth/DoA/doa-agent-access.spec.ts:7 › Delegated Organisation - Agent Visibility › Carol Clark (agent) submits for Plant Org 1 → Isabel Irwin (Plant Org 1 member) can see it` | Creates a CHED-PP, selects plants, uses `06011010`, and searches for `CHEDPP.GB.2026.1525734`. |

### Other journey candidates

- `9a918b862ad1b3599fc13659f757c25aaec78ada` is an actual importer-agent journey, but its title explicitly says CHED-PP and it submits via CSV.
- `219b882ee3b4fbe040b824d146d38991d6b70149`, `60687c60b95ddc993966606d163a2b1628d236da`, and `70e2a0562bd3205b736d5ad3a1ad17221d7da438` are CHED-PP negative “Not Agent” cases.
- `544d5359f8a83180001b3d1465461b7ecbdc736c`, `b3742f19b6eea5d9285f5c8739571523a0a13ec1`, and `cfdd89a6aa50bc50731a1661e55d7b084ac5ef8f` are CHED-D “Not Agent” journeys.
- `5a4e54f5febb7df252a73f63ef875b68b22192c6` is a CHED-A “Not Agent” journey.
- `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d` is explicitly a CHED-P fish journey and is also a “B2C Importer (Not Agent)” case, so it is excluded both as fish/IUU-adjacent evidence and as a negative non-agent case.
- The remaining CHED-P title matches (`0a6f82fcd63c4cd83fcab91687b522f3f865a74e`, `21ac0b8fda9ebd6ad45053634ce6e524c9b0fbe4`, `26153fb3e2abd20e0bde40d9c311ebb672ebebea`, `8a5d8bcb2f7304893999286e6148332e03b6552a`, `94d29a163f6ab37556cd585b4eabeec9b9c27d84`, `ba5323fd63dcda25ee5e37c013c511d2949410bc`, `dabe917a8d774a00bcc3c9b8aad7e712b6651df3`, `eb1715f8b4b2baa042c2e2c619ab893b62dcac83`, and `fcc30b8d4ec79bdb61c2af3732c13f296ba15f50`) all explicitly say `B2C Importer (Not Agent)` and therefore do not exercise DoA.

### Generic auth, permission, and organisation candidates

- `46a155dae4b16273cd8a7f318128b84779be2802` authenticates `b2cDoaAgent`, but it is setup-only and stops after login; it does not exercise delegation, organisation selection, trade-partner management, or notification access.
- The six `auth/user-permissions.spec.ts` traces (`03bcfdad57a49f6c22cb6ead164e319bd57e9692`, `264cea65ad1d01d2e6dc86afcd5e6fb33a22fc02`, `44bbb6797617dbf47833fe1c240b360866f57e0b`, `ac636f6aa8bdb7b4a814773fa218e78414faa84a`, `f0a0c1227b1a517a128df949607f6d2ada26dbbf`, and `fbb5948140ef4c2b1a494757fd848dae30696cc3`) verify broad role access. Even the B2C notifier case only verifies create-notification access and denial of B2B areas; none tests an agent, a delegated organisation, or on-behalf-of access.
- The ordinary login and authentication-setup traces other than the selected organisation-selection case only establish sessions for named roles and do not exercise DoA.
- `68ff7188299c488e1fb93d25447e93bc27e75190`, `a08cf21dfeac38ac047a170486362cd077686588`, and `a1e165ee092fa77451378f1ba423336a9d25b6b8` test generic creating-organisation isolation without an agent or delegated relationship; all three index entries also report one error.
- `bf0aac014e43f3b4d69f82edacc5482efb364070` is a generic B2B organisation-branch address-book test, not an agent/delegation test.

## SELECTED HASHES

65343fb21a64286537e39551a3306b99058ec6e4
c90c9d4c32cdc6a7919ccadf9c0f039d3167fb25
cc6cea8221f684d1090a9a3f0f15cf782b46de84
