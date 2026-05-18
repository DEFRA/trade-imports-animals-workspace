/**
 * Mongo init script for seeding notification records into the local compose database.
 */

db = db.getSiblingDB('trade-imports-animals-backend');

db.notification.insertMany([
  {
    _id: ObjectId('69c12f11cafe202600000001'),
    referenceNumber: 'DRAFT.IMP.2026.69c12f11cafe202600000001',
    origin: {
      countryCode: 'IE',
    },
    created: ISODate('2026-03-23T09:14:52.118Z'),
    updated: ISODate('2026-03-23T11:58:31.402Z'),
    _class: 'uk.gov.defra.trade.imports.animals.notification.Notification',
  },
  {
    _id: ObjectId('69c12f11cafe202600000002'),
    referenceNumber: 'DRAFT.IMP.2026.69c12f11cafe202600000002',
    origin: {
      countryCode: 'FR',
    },
    created: ISODate('2026-03-23T08:37:09.556Z'),
    updated: ISODate('2026-03-23T10:49:44.220Z'),
    _class: 'uk.gov.defra.trade.imports.animals.notification.Notification',
  },
  {
    _id: ObjectId('69c12f11cafe202600000003'),
    referenceNumber: 'DRAFT.IMP.2026.69c12f11cafe202600000003',
    origin: {
      countryCode: 'NL',
    },
    created: ISODate('2026-03-23T07:22:41.901Z'),
    updated: ISODate('2026-03-23T12:03:17.089Z'),
    _class: 'uk.gov.defra.trade.imports.animals.notification.Notification',
  },
  {
    _id: ObjectId('69c12f11cafe202600000004'),
    referenceNumber: 'DRAFT.IMP.2026.69c12f11cafe202600000004',
    origin: {
      countryCode: 'DE',
    },
    created: ISODate('2026-03-23T10:05:33.774Z'),
    updated: ISODate('2026-03-23T12:19:48.315Z'),
    _class: 'uk.gov.defra.trade.imports.animals.notification.Notification',
  },
]);
