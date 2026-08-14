export const meta = {
  name: 'dr21-parity-findings',
  description: 'Turn mechanical deltas into an adversarially verified parity backlog',
  phases: [
    { title: 'Review', detail: 'one reviewer per band, deltas to findings with two-sided evidence' },
    { title: 'Refute', detail: 'independent verifier tries to kill every finding against artefacts' }
  ]
}

const ROOT = '/Users/samfarrington/git/defra/trade-imports-animals/workareas/shared/dr21-parity'
const BRIEF = `${ROOT}/compare/BAND-BRIEF.md`

const FINDINGS = {
  type: 'object',
  required: ['band', 'findings'],
  properties: {
    band: { type: 'string' },
    findings: {
      type: 'array',
      items: {
        type: 'object',
        required: ['title', 'screens', 'frontendEvidence', 'prototypeEvidence', 'incrementType', 'band', 'confidence'],
        properties: {
          title: { type: 'string', description: 'one sentence, states the gap not the fix' },
          screens: { type: 'array', items: { type: 'string' } },
          detail: { type: 'string' },
          frontendEvidence: { type: 'string', description: 'file:line in the frontend repo' },
          prototypeEvidence: { type: 'string', description: 'file:line in the prototype repo' },
          incrementType: {
            type: 'string',
            enum: ['add-field', 'add-page', 'add-section', 'add-collection', 'obligation-change', 'flow-change', 'copy-change']
          },
          band: { type: 'string', enum: ['frontend-only', 'needs-backend', 'needs-design-decision'] },
          confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
          falsifiedBy: { type: 'string', description: 'what observation would prove this finding wrong' }
        }
      }
    },
    discarded: {
      type: 'array',
      description: 'deltas deliberately not raised as findings, and why',
      items: { type: 'string' }
    },
    notes: { type: 'string' }
  }
}

const VERDICTS = {
  type: 'object',
  required: ['band', 'verdicts'],
  properties: {
    band: { type: 'string' },
    verdicts: {
      type: 'array',
      items: {
        type: 'object',
        required: ['title', 'survives', 'reasoning'],
        properties: {
          title: { type: 'string' },
          survives: { type: 'boolean' },
          reasoning: { type: 'string', description: 'what you checked and what you found' },
          correction: { type: 'string', description: 'if it survives but was overstated, the corrected claim' }
        }
      }
    }
  }
}

const BANDS = [
  {
    slug: 'dashboard-and-entry',
    pairs: ['fe-dashboard-empty__dr21-dashboard', 'fe-dashboard-populated__dr21-dashboard'],
    extra: 'Also rule on the prototype-only screens in the "dashboard views" and "entry" bands of pairs.js (dr21-dashboard-actions, -changes, -inspection, -filters-open, dr21-index, dr21-create-notification). Note a known extractor caveat: the templates list sort control sits outside a <form>, so older captures missed it - the current models use allFields and should now show it.'
  },
  {
    slug: 'templates',
    pairs: [],
    extra: 'This band has NO frontend counterpart at all. Review the prototype-only templates screens (dr21-dashboard-templates, dr21-create-template, dr21-view-template, dr21-use-template-landing) and establish what building templates in the frontend would mean. The Phase 1 walker reported three things worth checking: /templates/:templateId/use renders no page (it seeds the session and redirects), using a template pre-completes several hub tasks, and all four seeded templates are Live animals with no germinal-products template. Verify each against the source before relying on it.'
  },
  {
    slug: 'notification-spine',
    pairs: ['fe-hub__dr21-notification-hub', 'fe-check-answers__dr21-review-notification', 'fe-declaration__dr21-declaration', 'fe-confirmation__dr21-notification-submitted', 'fe-delete-notification__dr21-delete-notification', 'fe-cancel-amend__dr21-notifications-cancel-amend'],
    extra: 'The Phase 1 walker reported that the prototype hub and review screens use bespoke app-* markup rather than govuk-task-list / govuk-summary-list. The extractor now captures both under taskItems and summaryRows, so compare those keys and NOT taskLists/summaryLists. It also reported that renderDeleteNotificationPage hardcodes a design-release-2/ view path, so the DR2.1 delete-notification.html is never rendered - verify that claim in app/routes.js yourself, and if it holds it is a prototype defect to report, not frontend work.'
  },
  {
    slug: 'origin-and-reason',
    pairs: ['fe-origin__dr21-origin-of-the-import', 'fe-import-reason__dr21-reason-for-import', 'fe-import-purpose__dr21-reason-for-import-internal-market-revealed', 'fe-cph-number__dr21-cph-number'],
    extra: 'The frontend asks import purpose on its own page; the prototype folds it into reason-for-import as a conditional reveal. Decide whether that is a flow-change finding. The prototype also captured four reveal variants (internal-market, transhipment, transit, temporary-admission-horses) - check whether the frontend offers the same set.'
  },
  {
    slug: 'commodities-live',
    pairs: ['fe-commodity-search__dr21-what-are-you-importing', 'fe-consignment-details__dr21-consignment-details', 'fe-animal-identification__dr21-animal-identification-details', 'fe-additional-details__dr21-additional-animal-details'],
    extra: 'The single largest interaction difference found so far is here: the frontend renders a static 8-checkbox species list, the prototype renders a commodity search with a Trade Tariff link. Also compare dr21-what-are-you-importing-results (the post-search state) against the frontend list. The Phase 1 walker reported DR2.1 consignment-details now validates netWeight, packageType and numberOfPackages alongside numberOfAnimals - verify and rule on whether the frontend has those fields.'
  },
  {
    slug: 'germinal-products',
    pairs: [],
    extra: [
      'The largest expected band, and it has NO frontend counterpart - germinal products are unmodelled across the whole frontend src/.',
      'Review all germinal captures (dr21-what-are-you-importing-germinal, -germinal-catalogue, -germinal-mixed, dr21-consignment-details-germinal, -germinal-errors, -germinal-mixed, dr21-animal-identification-details-germinal, dr21-additional-animal-details-germinal) against their live-animal equivalents AND against the frontend.',
      'Read app/data/commodities-germinal-products.js and app/data/package-types.js.',
      '',
      'The Phase 1 capture workers reported these specifics. They are UNVERIFIED leads - confirm each in the source, and say so if one is wrong:',
      '1. A germinal commodity asks Net weight (kg), Type of package (a 27-option select) and Number of packages PER DONOR SPECIES, where a live animal asks only Number of animals.',
      '2. numberOfPackages[...] is the same field name for both, with two different contracts: validateNumberOfPackages returns early for anything that is not a germinal commodity, so the live-animal packages field is never validated while the germinal one is mandatory. If true this matters a lot for how the frontend models the field.',
      '3. The Selected commodities summary aggregates packages ACROSS species into one row per commodity, while the question blocks stay per-species - so two species produce one summary row but two question blocks, and Remove removes the whole commodity rather than the species.',
      '4. On a germinal-only consignment the grid header correctly switches to "Number of packages", but the per-panel change link still reads "Change number of animals" (changeCountLabel hardcoded in getSpeciesIdentificationState). Likely a prototype defect - rule on whether it is one.',
      '5. Germinal package fields are a hardcoded if-branch in the DR2.1 consignment-details.html template rather than the packagingFields data mechanism, so two unrelated mechanisms produce packaging fields depending on commodity type.',
      '6. Mixed consignments render BOTH question sets on one page. That is an obligation and cardinality question for the frontend model, not just a copy change.'
    ].join('\n')
  },
  {
    slug: 'addresses',
    pairs: ['fe-addresses-hub__dr21-roles-and-addresses', 'fe-address-picker-place-of-origin__dr21-address-select-place-of-origin', 'fe-address-picker-consignor-or-exporter__dr21-address-select-consignor-or-exporter', 'fe-address-picker-consignee__dr21-address-select-consignee', 'fe-address-picker-importer__dr21-address-select-importer', 'fe-address-picker-place-of-destination__dr21-address-select-place-of-destination', 'fe-contact__dr21-contact-address-for-consignment'],
    extra: 'Also rule on the prototype-only permanent-address screens (dr21-permanent-address, -select, -animals) and on dr21-roles-and-addresses-same-as-consignee, which suggests a copy-from-another-role mechanism. fe-create-address is unpaired because the prototype adds addresses under the unprefixed /address-book/add shared with DR1 - decide whether that is comparable.'
  },
  {
    slug: 'transport-and-documents',
    pairs: ['fe-arrival-details__dr21-arrival-details', 'fe-transit-countries__dr21-transit-countries', 'fe-transporter-type__dr21-transporter', 'fe-transporter-commercial__dr21-transporter-add-commercial', 'fe-transporter-private__dr21-transporter-add-private', 'fe-documents-empty__dr21-upload-documents'],
    extra: 'The two transporter pairs carry the highest mechanical delta counts of any pair (29 and 27) and both have differing h1s - check the pairing itself is right before treating the deltas as findings. Also rule on the prototype-only dr21-transporter-add, and on the frontend-only screens fe-exit-date, fe-port-of-exit and fe-destination-country: does DR2.1 fold those questions into arrival-details, or drop them?'
  }
]

phase('Review')

const results = await pipeline(
  BANDS,
  (band) =>
    agent(
      [
        `You are the "${band.slug}" band reviewer for EUDPA-328 parity.`,
        ``,
        `Read the brief in full first and follow it exactly: ${BRIEF}`,
        ``,
        `YOUR BAND: ${band.slug}`,
        band.pairs.length
          ? `YOUR PAIRS (delta files in ${ROOT}/compare/deltas/):\n${band.pairs.map((p) => `  ${p}.json`).join('\n')}`
          : `This band has no paired screens - see below.`,
        ``,
        `ADDITIONAL SCOPE AND KNOWN LEADS:`,
        band.extra,
        ``,
        `Models: ${ROOT}/fe-miner/capture/model/ and ${ROOT}/harness/capture/model/`,
        `Raw DOM: ${ROOT}/fe-miner/capture/html/ and ${ROOT}/harness/capture/html/`,
        `Pairing and unpaired screens: ${ROOT}/compare/pairs.js`,
        ``,
        `Produce findings, not a delta restatement. Every finding needs file:line evidence`,
        `on BOTH sides - open the files and read them. Report what you deliberately did`,
        `NOT raise, and why, in "discarded".`,
        ``,
        `The leads above came from the capture workers and are UNVERIFIED. Check each`,
        `against the source yourself. If a lead turns out to be wrong, say so - that is a`,
        `useful result, not a failure.`
      ].join('\n'),
      { label: `review:${band.slug}`, phase: 'Review', schema: FINDINGS }
    ),
  (review, band) => {
    if (!review || !review.findings || review.findings.length === 0) return { band: band.slug, verdicts: [] }
    return agent(
      [
        `You are an adversarial verifier for the "${band.slug}" band of EUDPA-328 parity.`,
        ``,
        `Read ${BRIEF} for context on how the corpus was built.`,
        ``,
        `Your job is to KILL these findings. Assume each is wrong until the artefacts force`,
        `you to accept it. Default to survives=false when you cannot confirm it yourself.`,
        ``,
        `For each finding: open the cited frontend file:line and the cited prototype`,
        `file:line and check they say what the finding claims. Check the captured models in`,
        `${ROOT}/fe-miner/capture/model/ and ${ROOT}/harness/capture/model/ agree. A finding`,
        `whose evidence does not check out is refuted, however plausible it sounds.`,
        ``,
        `Watch specifically for: citations that do not exist or point at the wrong line;`,
        `claims about the frontend that were true months ago but not on main at 32f6106c;`,
        `differences that are an artefact of how the two sides build the same UI (the`,
        `prototype uses bespoke app-* markup where the frontend uses govuk-frontend`,
        `components - that is not automatically a gap); and findings that overstate scope.`,
        ``,
        `If a finding is real but overstated, set survives=true and give the corrected claim.`,
        ``,
        `FINDINGS TO REFUTE:`,
        JSON.stringify(review.findings, null, 2)
      ].join('\n'),
      { label: `refute:${band.slug}`, phase: 'Refute', schema: VERDICTS }
    ).then((verdict) => ({ review, verdict }))
  }
)

const ok = results.filter(Boolean)

const survived = []
const refuted = []

for (const entry of ok) {
  const review = entry.review || entry
  const verdicts = (entry.verdict && entry.verdict.verdicts) || []
  for (const finding of review.findings || []) {
    const v = verdicts.find((x) => x.title === finding.title)
    if (!v || v.survives) {
      survived.push({ ...finding, verification: v ? v.reasoning : 'not verified', correction: v && v.correction })
    } else {
      refuted.push({ title: finding.title, band: review.band, reason: v.reasoning })
    }
  }
}

log(`${survived.length} findings survived, ${refuted.length} refuted`)

return {
  survivedCount: survived.length,
  refutedCount: refuted.length,
  survived,
  refuted,
  discarded: ok.flatMap((e) => ((e.review || e).discarded || []))
}
