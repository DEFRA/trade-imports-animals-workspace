# Checklist — Designing a Structured-Output Prompt

Run this checklist whenever you are wiring Claude into a pipeline that produces
machine-parseable output — extractors, classifiers, code reviewers, multi-step
flows where one step's payload feeds the next, or anywhere a downstream parser
would otherwise crash on malformed JSON. The aim is to pin down the schema,
the criteria, and the retry behaviour *before* the first call, not to retrofit
them after the first production incident. You should be able to answer YES to
every item below before considering the prompt ready to ship.

## Checklist

1. Is the output produced by having the subagent, MCP tool, or slash
   command call a tool whose input schema is the result shape, rather than
   by asking the model to "respond in JSON" in free text? — see
   [[../domain-4-prompt-engineering/4.3-structured-output]].
2. When structured output is mandatory, is the prompt (SKILL.md, slash
   command body, or subagent instructions) explicit that the named tool
   MUST be called, rather than leaving the model free to reply in prose? — see
   [[../domain-4-prompt-engineering/4.3-structured-output]].
3. Are fields that the source may legitimately omit marked nullable or
   optional rather than `required`, so the model is not pressured to
   fabricate values? — see
   [[../domain-4-prompt-engineering/4.3-structured-output]].
4. Do enum fields include an `unclear` value (and where appropriate an
   `other` value paired with a free-text `detail` sibling) to give the model
   an honest escape hatch? — see
   [[../domain-4-prompt-engineering/4.3-structured-output]].
5. Are format-normalisation rules (ISO 8601 dates, GBP amounts as numbers,
   etc.) stated explicitly in the prompt rather than implied by the schema's
   types? — see [[../domain-4-prompt-engineering/4.3-structured-output]].
6. Does the schema surface its own inconsistencies — for example
   `stated_total` and `calculated_total` as sibling fields plus a
   `conflict_detected` flag — rather than leaving reconciliation to
   downstream code? — see
   [[../domain-4-prompt-engineering/4.4-validation-retry-loops]].
7. For findings or rule-driven outputs, is there a `detected_pattern` (or
   equivalent) field on every item so dismissal rates can be analysed by
   pattern over time? — see
   [[../domain-4-prompt-engineering/4.4-validation-retry-loops]].
8. Do the prompt's report/skip criteria name categorical, observable
   conditions instead of leaning on "be conservative" or "high confidence"
   hedges? — see
   [[../domain-4-prompt-engineering/4.1-explicit-criteria]].
9. Are severity levels (HIGH, MEDIUM, LOW or your equivalents) anchored by
   a concrete code example per level rather than by adjectives? — see
   [[../domain-4-prompt-engineering/4.1-explicit-criteria]].
10. Does the validation layer separate schema syntax errors (which should
    already be impossible under tool use) from semantic errors that justify
    a retry? — see
    [[../domain-4-prompt-engineering/4.4-validation-retry-loops]].
11. When a retry is issued, does it include the original source, the failed
    extraction verbatim, and the specific validation errors that fired —
    not a generic "try again"? — see
    [[../domain-4-prompt-engineering/4.4-validation-retry-loops]].
12. Is each failure classified as *format/structural* (retry) or
    *missing-information* (do not retry, surface or re-source) before the
    retry path is taken? — see
    [[../domain-4-prompt-engineering/4.4-validation-retry-loops]].
13. Is the retry loop bounded to one or two attempts, each carrying strictly
    more information than the previous, with a defined escalation path on
    final failure? — see
    [[../domain-4-prompt-engineering/4.4-validation-retry-loops]].
14. If any reporting category has a known high false-positive rate, has it
    been disabled in the prompt until its criteria are tightened, rather
    than left live and eroding trust in the rest? — see
    [[../domain-4-prompt-engineering/4.1-explicit-criteria]].

## Common failure modes

- **Plain-text JSON parser crashes in production.** The prompt asked for
  JSON but did not use `tool_use`, so a stray comma or a truncated object
  takes the pipeline down — eliminated entirely by the protocol-level
  schema guarantee in
  [[../domain-4-prompt-engineering/4.3-structured-output]].
- **Hallucinated reference numbers and dates.** Every field was marked
  `required`, so when the source genuinely lacks the data the model
  fabricates a value to satisfy the schema — the nullable-field rule in
  [[../domain-4-prompt-engineering/4.3-structured-output]] is what stops
  this.
- **Unbounded retry burn on missing-information failures.** The pipeline
  treats every validation failure as a format error and retries forever,
  producing increasingly creative fabrications and a large model-spend
  line item — see the format-vs-missing classification rule in
  [[../domain-4-prompt-engineering/4.4-validation-retry-loops]].
- **Totals that disagree silently.** The schema exposes a single `total`
  field, so a stated/calculated mismatch is invisible until a customer
  complains — fixed by the self-surfacing schema pattern
  (`stated_total` + `calculated_total` + `conflict_detected`) in
  [[../domain-4-prompt-engineering/4.4-validation-retry-loops]].
- **Reviewer output ignored wholesale.** One noisy category (naming
  conventions, comment accuracy) drags developer trust down across every
  other category in the same prompt — the disable-and-iterate guidance in
  [[../domain-4-prompt-engineering/4.1-explicit-criteria]] is the lever to
  pull.
