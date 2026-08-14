//
// Screen pairing between the real frontend and Design release 2.1.
//
// The pairing is a judgement, not a lookup: the two codebases name and split screens
// differently. Each pair carries the reasoning where it is not obvious, because a
// wrong pairing produces a confident diff of two unrelated pages.
//
// The unpaired lists at the foot are not leftovers — they are findings. A screen one
// side has and the other does not is the largest kind of parity gap there is.
//
module.exports = {
  pairs: [
    { frontend: 'fe-dashboard-empty', prototype: 'dr21-dashboard', note: 'empty state' },
    { frontend: 'fe-dashboard-populated', prototype: 'dr21-dashboard', note: 'populated state against the same prototype screen' },
    { frontend: 'fe-hub', prototype: 'dr21-notification-hub' },
    { frontend: 'fe-origin', prototype: 'dr21-origin-of-the-import' },
    { frontend: 'fe-import-reason', prototype: 'dr21-reason-for-import' },
    {
      frontend: 'fe-import-purpose',
      prototype: 'dr21-reason-for-import-internal-market-revealed',
      note: 'the frontend asks import purpose on its own page; DR2 moved it onto reason-for-import as a conditional reveal, and DR2.1 keeps it there'
    },
    { frontend: 'fe-commodity-search', prototype: 'dr21-what-are-you-importing' },
    { frontend: 'fe-consignment-details', prototype: 'dr21-consignment-details' },
    { frontend: 'fe-animal-identification', prototype: 'dr21-animal-identification-details' },
    { frontend: 'fe-additional-details', prototype: 'dr21-additional-animal-details' },
    { frontend: 'fe-cph-number', prototype: 'dr21-cph-number' },
    { frontend: 'fe-addresses-hub', prototype: 'dr21-roles-and-addresses' },
    { frontend: 'fe-address-picker-place-of-origin', prototype: 'dr21-address-select-place-of-origin' },
    { frontend: 'fe-address-picker-consignor-or-exporter', prototype: 'dr21-address-select-consignor-or-exporter' },
    { frontend: 'fe-address-picker-consignee', prototype: 'dr21-address-select-consignee' },
    { frontend: 'fe-address-picker-importer', prototype: 'dr21-address-select-importer' },
    { frontend: 'fe-address-picker-place-of-destination', prototype: 'dr21-address-select-place-of-destination' },
    { frontend: 'fe-contact', prototype: 'dr21-contact-address-for-consignment' },
    { frontend: 'fe-arrival-details', prototype: 'dr21-arrival-details' },
    { frontend: 'fe-transit-countries', prototype: 'dr21-transit-countries' },
    { frontend: 'fe-transporter-type', prototype: 'dr21-transporter' },
    { frontend: 'fe-transporter-commercial', prototype: 'dr21-transporter-add-commercial' },
    { frontend: 'fe-transporter-private', prototype: 'dr21-transporter-add-private' },
    { frontend: 'fe-documents-empty', prototype: 'dr21-upload-documents' },
    { frontend: 'fe-check-answers', prototype: 'dr21-review-notification' },
    { frontend: 'fe-declaration', prototype: 'dr21-declaration' },
    { frontend: 'fe-confirmation', prototype: 'dr21-notification-submitted' },
    { frontend: 'fe-delete-notification', prototype: 'dr21-delete-notification' },
    { frontend: 'fe-cancel-amend', prototype: 'dr21-notifications-cancel-amend' }
  ],

  // Frontend screens with no DR2.1 counterpart. Each needs a Phase 3 ruling: has the
  // prototype folded this into another page, or dropped the question entirely?
  onlyFrontend: [
    { screen: 'fe-exit-date', question: 'no DR2.1 exit-date view exists — folded into arrival-details, or dropped?' },
    { screen: 'fe-port-of-exit', question: 'no DR2.1 port-of-exit view — is this now part of arrival-details?' },
    { screen: 'fe-destination-country', question: 'no DR2.1 destination-country view — folded into place-of-destination addressing?' },
    { screen: 'fe-create-address', question: 'the prototype adds addresses under /address-book/add, which the mount deliberately leaves unprefixed and shares with DR1' }
  ],

  // DR2.1 screens with no frontend counterpart. These are the candidate new-build bands.
  onlyPrototype: [
    { screen: 'dr21-dashboard-templates', band: 'templates' },
    { screen: 'dr21-create-template', band: 'templates' },
    { screen: 'dr21-view-template', band: 'templates' },
    { screen: 'dr21-use-template-landing', band: 'templates' },
    { screen: 'dr21-dashboard-actions', band: 'dashboard views' },
    { screen: 'dr21-dashboard-changes', band: 'dashboard views' },
    { screen: 'dr21-dashboard-inspection', band: 'dashboard views' },
    { screen: 'dr21-dashboard-filters-open', band: 'dashboard views' },
    { screen: 'dr21-permanent-address', band: 'permanent address' },
    { screen: 'dr21-permanent-address-select', band: 'permanent address' },
    { screen: 'dr21-permanent-address-animals', band: 'permanent address' },
    { screen: 'dr21-transporter-add', band: 'transport' },
    { screen: 'dr21-what-are-you-importing-germinal', band: 'germinal products' },
    { screen: 'dr21-what-are-you-importing-germinal-catalogue', band: 'germinal products' },
    { screen: 'dr21-what-are-you-importing-germinal-mixed', band: 'germinal products' },
    { screen: 'dr21-consignment-details-germinal', band: 'germinal products' },
    { screen: 'dr21-consignment-details-germinal-mixed', band: 'germinal products' },
    { screen: 'dr21-animal-identification-details-germinal', band: 'germinal products' },
    { screen: 'dr21-additional-animal-details-germinal', band: 'germinal products' },
    { screen: 'dr21-notifications-copy-as-new', band: 'notification actions' },
    { screen: 'dr21-notifications-amend', band: 'notification actions' },
    { screen: 'dr21-create-notification', band: 'entry' },
    { screen: 'dr21-index', band: 'entry' }
  ]
}
