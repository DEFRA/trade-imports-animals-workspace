//
// The frontend screen inventory: one entry per page (two where a page has a
// materially different populated state), each naming the test whose trace renders
// that page in a clean default state.
//
// `match` is a distinctive substring of the Playwright test title, which
// `playwright trace open` prints back as `Title:`. That is the join key between a
// hash-named trace directory and the screen it shows.
//
module.exports = [
  { name: 'fe-additional-details', match: 'renders service-backed certification options and conditional copy' },
  { name: 'fe-addresses-hub', match: 'renders all five party rows and feature copy' },
  { name: 'fe-address-picker-place-of-origin', match: 'Place of origin picker renders its role-specific copy and address table' },
  { name: 'fe-address-picker-consignor-or-exporter', match: 'Consignor or exporter picker renders its role-specific copy and address table' },
  { name: 'fe-address-picker-consignee', match: 'Consignee picker renders its role-specific copy and address table' },
  { name: 'fe-address-picker-importer', match: 'Importer picker renders its role-specific copy and address table' },
  { name: 'fe-address-picker-place-of-destination', match: 'Place of destination picker renders its role-specific copy and address table' },
  { name: 'fe-create-address', match: 'renders grounded field copy and an empty country select' },
  { name: 'fe-cancel-amend', match: 'renders confirmation copy, actions and review back link' },
  { name: 'fe-check-answers', match: 'renders entered and missing answers in their summary rows' },
  { name: 'fe-animal-identification', match: 'shows the identifier fields that apply to each commodity' },
  { name: 'fe-consignment-details', match: 'renders grouped species quantities and collection table' },
  { name: 'fe-commodity-search', match: 'renders all eight pairs in commodity groups with grounded copy' },
  { name: 'fe-confirmation', match: 'renders the notification reference, all feature copy and no back link' },
  { name: 'fe-contact', match: 'renders the address-book contacts, feature copy and add link' },
  { name: 'fe-cph-number', match: 'renders the CPH copy' },
  { name: 'fe-dashboard-empty', match: 'renders the empty notification list and default sort' },
  { name: 'fe-dashboard-populated', match: 'submitted notification renders its row data and actions' },
  { name: 'fe-declaration', match: 'renders every declaration statement and the current date' },
  { name: 'fe-delete-notification', match: 'renders confirmation copy, actions and dashboard links' },
  { name: 'fe-destination-country', match: 'renders the captured country options and feature copy' },
  { name: 'fe-documents-empty', match: 'renders feature copy, upload constraints and empty state' },
  { name: 'fe-exit-date', match: 'renders the MoJ date picker and feature copy' },
  { name: 'fe-hub', match: 'renders navigation copy and the task statuses of a newly entered journey' },
  { name: 'fe-import-purpose', match: 'renders the service-backed purposes and feature copy' },
  { name: 'fe-import-reason', match: 'renders the service-backed reasons and feature copy' },
  { name: 'fe-origin', match: 'renders the captured MDM country options and feature copy' },
  { name: 'fe-port-of-exit', match: 'renders the captured port options and feature copy' },
  { name: 'fe-arrival-details', match: 'renders captured port options and all feature copy' },
  { name: 'fe-transit-countries', match: 'transit page renders captured country options and feature copy' },
  { name: 'fe-transporter-type', match: 'renders transporter guidance and branch options' },
  { name: 'fe-transporter-commercial', match: 'commercial transporter page renders address and approval details' },
  { name: 'fe-transporter-private', match: 'private transporter page renders all address fields and explanatory copy' }
]
