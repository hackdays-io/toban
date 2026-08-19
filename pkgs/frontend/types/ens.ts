/**
 * Shapes for `*.toban.eth` subname records, shared between the server-side
 * name provider and every client consumer.
 *
 * These used to come from `namestone-sdk`. NameStone ceased operations on
 * 2026-08-03 (#555) and the records now live in Namespace, but the shape is
 * deliberately unchanged — keeping `{ name, address, domain, text_records }`
 * is what let the provider swap leave ~30 consumer components untouched.
 *
 * `name` is the label only (`alice`), `domain` is the parent (`toban.eth`).
 */
export type TextRecords = {
  [key: string]: string;
};

export type NameData = {
  name: string;
  address: string;
  domain: string;
  text_records?: TextRecords;
};
