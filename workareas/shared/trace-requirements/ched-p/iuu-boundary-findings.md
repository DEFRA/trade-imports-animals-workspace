# CHED-P → IUU boundary findings (fish exclusion)

**Context.** IPAFFS files fish under CHED-P (fishery products are POAO), but the new
trade-imports-animals service splits fish out to a separate **IUU** journey. So fish is
**OUT of scope** for CHED-P requirements. This file records the fish/IUU surface found in the
CHED-P trace corpus so it can be excluded from the CHED-P spec/model and handed to IUU instead.

Fish is nearly invisible in the corpus: exactly **one** title-marked fish trace.

## 1. Trace to DROP from the CHED-P journey set

- Hash `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`
- Title: `notification/ched-p/ched-p-notification.spec.ts:206 › CHED-P notification › B2C Importer (Not Agent): Submits Valid CHEDP Fish Notification`
- Verified (over all landed journeys): this is the **only** trace that visits the
  catch-certificate sub-flow. Re-confirm across all 96 journeys before finalising.

## 2. Fish commodity surface → exclude from CHED-P commodity list (move to IUU)

- Commodity **code `03019230`** entered on the commodity-search page — **HS chapter 03**
  (live fish; `0301…` = live fish → live eels *Anguilla*). All HS ch.03 codes
  (fish / crustaceans / molluscs) are the IUU commodity surface.
- Fish **species selector value `Anguilla spp.`** — `getByRole('checkbox', { name: 'Anguilla spp.' })`
  on the commodity-species page.
- **Boundary nuance:** the commodity-search page and the commodity-species page are *shared*
  CHED-P pages (non-fish CHED-P also picks a species — e.g. Bison spp., code `020130`, HS ch.02).
  Keep the pages; exclude the **fish species values + HS ch.03 CN codes** from the CHED-P
  commodity/species reference list, flagged "moved to IUU".
- **HS chapter list evidence** (`pages/search-commodity.json`, `commodity-tree` autocomplete):
  the commodity picker offers HS chapters as selectable options, including
  `03 FISH AND CRUSTACEANS, MOLLUSCS AND OTHER AQUATIC INVERTEBRATES` and
  `16 PREPARATIONS OF MEAT, OF FISH OR OF CRUSTACEANS...`. **Chapter 03 (whole) → IUU.**
  Chapter 16 is *mixed* (meat OR fish preparations) — only its fish sub-codes move to IUU;
  meat preparations stay CHED-P. Flag ch.03 out; treat ch.16 as a per-code split at model time.

## 3. Catch-certificate sub-flow → IUU pages, NOT CHED-P pages

Fish-only pages (sourced solely from `db2d277c`), with real field IDs from the trace:

| Page (pageGuess) | Real controls (from trace) |
|---|---|
| Catch certificate needed | checkbox `#catch-certificate-needed` |
| Catch certificate upload (×1, ×2) | file input `#fileUpload`, `Continue` button |
| Catch certificate details (×1, ×2) | `#catch-certificate-reference-1`; date `#date-of-issue-{day,month,year}-1`; combobox `Flag state of catching vessel(s)` (value: France); `#select-all-checkbox-1` |
| Do you need to upload more catch certificates? | radio group `Do you need to upload more catch certificates?` (Yes / No) |

**Action:** record these as IUU boundary findings. They must NOT appear as CHED-P pages in
`page-inventory.json` / `journey-spec.json`. If the Inventory/Comb/Reconcile waves ingest them
as CHED-P pages (they will, since the fish trace is in the corpus), strip them at the
SPEC-GATE curation step and cross-reference to IUU.

**Decisive verbatim evidence** (`pages/catch-certificate-needed.json`, Comb-tagged `(IUU)`,
confidence=confirmed): the page heading is "Catch certificates" and its body copy reads —
> "You must add catch certificates for all fish species unless they are exempt from illegal,
> unreported and unregulated (IUU) fishing controls."
> "For help with catch certificates, check the guidance on importing or moving fish into the UK."
This is unambiguously the IUU fishery-controls surface; the Inventory + Comb waves both already
tagged it IUU. The page surfaces only for wild-caught fishery products (e.g. Anguilla).

## 4. Shared CHED-P pages the fish trace also exercised (KEEP — not fish-specific)

Dashboard, notification type (POAO), country of origin, consignment conformity, commodity
search/species (pages only), purpose, risk, task list, commodity details (weight/packages),
storage temperature (Ambient), accompanying documents/attachments, approved establishment,
consignor, consignee, importer, port of entry, means of transport ×2, common-transit/CVED
questions, transporter, branch address, review, submit/declaration, confirmation.

## Status
- Recorded during Extract wave (fish journey landed). Provisional.
- TODO at SPEC-GATE: (a) re-confirm catch-cert is fish-only across all 96 journeys;
  (b) ensure catch-cert pages + HS ch.03 codes are excluded/flagged in the final spec/model.
- RESOLVED (c): the `accompanying-documents` document-type list (14 options, not truncated —
  Veterinary health certificate, Air waybill, Bill of lading, Commercial invoice, Customs
  declaration, Import permit, Aflatoxin lab results, Letter of authority, Processing statement,
  Proof of storage, Rail/Sea waybill, Other) carries **no** catch-certificate / IUU-declaration
  entry. The catch certificate is a **dedicated sub-flow** (§3 pages), not a document-type option,
  so the document-level fish exclusion is entirely the catch-cert sub-flow — nothing to strip from
  the generic document-type list.
