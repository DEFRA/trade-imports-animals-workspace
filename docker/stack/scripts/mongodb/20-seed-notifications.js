/**
 * Mongo init script for seeding notification records into the local compose database.
 */

db = db.getSiblingDB('trade-imports-animals-backend');

db.notification.insertMany([
  {
    _id: ObjectId('69c12f11cafe202600000001'),
    referenceNumber: 'GBN-AG-26-000001',
    origin: {
      countryCode: 'IE',
      requiresRegionCode: 'no',
    },
    commodity: {
      name: 'Dog',
      commodityComplement: [
        {
          typeOfCommodity: 'Domestic',
          totalNoOfAnimals: 19,
          totalNoOfPackages: 21,
          species: [
            {
              value: '1388624',
              text: 'Bos spp.',
              noOfAnimals: 19,
              noOfPackages: 21,
              earTag: 'IE000000000002',
              passport: 'IE-BOV-2024-000002',
            },
          ],
        },
      ],
    },
    reasonForImport: 'internalMarket',
    additionalDetails: {
      certifiedFor: 'approvedBodies',
      unweanedAnimals: 'no',
    },
    consignor: {
      name: 'Astra Rosales',
      address: {
        addressLine1: '43 East Hague Extension',
        addressLine2: 'Delectus sitodio p. Laborum Odio tempor',
        addressLine3: 'Quasoccaecat ut ear, 30055',
        country: 'Switzerland',
      },
    },
    destination: {
      name: 'Tech Imports Ltd',
      address: {
        addressLine1: '643 Main Street',
        addressLine2: 'Birmingham G1 3AZ',
        country: 'United Kingdom',
      },
    },
    cphNumber: '123456789',
    transport: {
      portOfEntry: 'ABERDEEN',
      arrivalDate: ISODate('2026-05-28T00:00:00.000Z'),
      transporter: {
        name: 'García Livestock Transport SL',
        address: {
          addressLine1: '43 East Hague Extension',
          addressLine2: 'Delectus sitodio p. Laborum Odio tempor',
          addressLine3: 'Quasoccaecat ut ear, 30055',
          country: 'Switzerland',
        },
        approvalNumber: 'ES-T2-45001294',
        type: 'Commercial',
      },
    },
    status: 'SUBMITTED',
    created: ISODate('2026-03-23T09:14:52.118Z'),
    updated: ISODate('2026-03-23T11:58:31.402Z'),
    _class: 'uk.gov.defra.trade.imports.animals.notification.Notification',
  },
  {
    _id: ObjectId('69c12f11cafe202600000002'),
    referenceNumber: 'GBN-AG-26-000002',
    origin: {
      countryCode: 'FR',
      requiresRegionCode: 'yes',
    },
    commodity: {
      name: 'Cow',
      commodityComplement: [
        {
          typeOfCommodity: 'Domestic',
          totalNoOfAnimals: 18,
          totalNoOfPackages: 25,
          species: [
            {
              value: '1388624',
              text: 'Bos spp.',
              noOfAnimals: 18,
              noOfPackages: 25,
              earTag: 'FR000000000004',
              passport: 'FR-BOV-2024-000004',
            },
          ],
        },
      ],
    },
    reasonForImport: 'reEntry',
    additionalDetails: {
      certifiedFor: 'breedingAndOrProduction',
      unweanedAnimals: 'yes',
    },
    consignor: {
      name: 'Laiterie du Nord SARL',
      address: {
        addressLine1: '12 Rue de la Gare',
        addressLine2: '59000 Lille',
        country: 'France',
      },
    },
    destination: {
      name: 'Global Trading Co',
      address: {
        addressLine1: '945 Main Street',
        addressLine2: 'London LS1 5AB',
        country: 'United Kingdom',
      },
    },
    cphNumber: '234567890',
    transport: {
      portOfEntry: 'EAST MIDLANDS AIRPORT',
      arrivalDate: ISODate('2026-06-02T00:00:00.000Z'),
      transporter: {
        name: 'J & G Campbell LTD',
        address: {
          addressLine1: 'Rue de la Loi 200',
          addressLine2: '1040 Brussels',
          country: 'Belgium',
        },
        approvalNumber: 'UK/BURY/T2/00104115',
        type: 'Private',
      },
    },
    status: 'SUBMITTED',
    created: ISODate('2026-03-23T08:37:09.556Z'),
    updated: ISODate('2026-03-23T10:49:44.220Z'),
    _class: 'uk.gov.defra.trade.imports.animals.notification.Notification',
  },
  {
    _id: ObjectId('69c12f11cafe202600000003'),
    referenceNumber: 'GBN-AG-26-000003',
    origin: {
      countryCode: 'NL',
      requiresRegionCode: 'no',
    },
    commodity: {
      name: 'Cat',
      commodityComplement: [
        {
          typeOfCommodity: 'Domestic',
          totalNoOfAnimals: 8,
          totalNoOfPackages: 10,
          species: [
            {
              value: '1388624',
              text: 'Bos spp.',
              noOfAnimals: 8,
              noOfPackages: 10,
              earTag: 'NL000000000006',
              passport: 'NL-BOV-2024-000006',
            },
          ],
        },
      ],
    },
    reasonForImport: 'internalMarket',
    additionalDetails: {
      certifiedFor: 'slaughter',
      unweanedAnimals: 'no',
    },
    consignor: {
      name: 'Astra Rosales',
      address: {
        addressLine1: '43 East Hague Extension',
        addressLine2: 'Delectus sitodio p. Laborum Odio tempor',
        addressLine3: 'Quasoccaecat ut ear, 30055',
        country: 'Switzerland',
      },
    },
    destination: {
      name: 'Global Trading Co',
      address: {
        addressLine1: '945 Main Street',
        addressLine2: 'London LS1 5AB',
        country: 'United Kingdom',
      },
    },
    cphNumber: '345678901',
    transport: {
      portOfEntry: 'EDINBURGH',
      arrivalDate: ISODate('2026-06-09T00:00:00.000Z'),
      transporter: {
        name: 'García Livestock Transport SL',
        address: {
          addressLine1: '43 East Hague Extension',
          addressLine2: 'Delectus sitodio p. Laborum Odio tempor',
          addressLine3: 'Quasoccaecat ut ear, 30055',
          country: 'Switzerland',
        },
        approvalNumber: 'ES-T2-45001294',
        type: 'Commercial',
      },
    },
    status: 'SUBMITTED',
    created: ISODate('2026-03-23T07:22:41.901Z'),
    updated: ISODate('2026-03-23T12:03:17.089Z'),
    _class: 'uk.gov.defra.trade.imports.animals.notification.Notification',
  },
  {
    _id: ObjectId('69c12f11cafe202600000004'),
    referenceNumber: 'GBN-AG-26-000004',
    origin: {
      countryCode: 'DE',
      requiresRegionCode: 'yes',
    },
    commodity: {
      name: 'Fish',
      commodityComplement: [
        {
          typeOfCommodity: 'Domestic',
          totalNoOfAnimals: 40,
          totalNoOfPackages: 52,
          species: [
            {
              value: '716661',
              text: 'Bison bison',
              noOfAnimals: 15,
              noOfPackages: 22,
              earTag: 'DE000000000007',
              passport: 'DE-BOV-2024-000007',
            },
            {
              value: '1388624',
              text: 'Bos spp.',
              noOfAnimals: 25,
              noOfPackages: 30,
              earTag: 'DE000000000008',
              passport: 'DE-BOV-2024-000008',
            },
          ],
        },
      ],
    },
    reasonForImport: 'reEntry',
    additionalDetails: {
      certifiedFor: 'approvedBodies',
      unweanedAnimals: 'yes',
    },
    consignor: {
      name: 'Laiterie du Nord SARL',
      address: {
        addressLine1: '12 Rue de la Gare',
        addressLine2: '59000 Lille',
        country: 'France',
      },
    },
    destination: {
      name: 'Tech Imports Ltd',
      address: {
        addressLine1: '643 Main Street',
        addressLine2: 'Birmingham G1 3AZ',
        country: 'United Kingdom',
      },
    },
    cphNumber: '456789012',
    transport: {
      portOfEntry: 'ABERDEEN',
      arrivalDate: ISODate('2026-06-16T00:00:00.000Z'),
      transporter: {
        name: 'J & G Campbell LTD',
        address: {
          addressLine1: 'Rue de la Loi 200',
          addressLine2: '1040 Brussels',
          country: 'Belgium',
        },
        approvalNumber: 'UK/BURY/T2/00104115',
        type: 'Private',
      },
    },
    status: 'SUBMITTED',
    created: ISODate('2026-03-23T10:05:33.774Z'),
    updated: ISODate('2026-03-23T12:19:48.315Z'),
    _class: 'uk.gov.defra.trade.imports.animals.notification.Notification',
  },
]);
