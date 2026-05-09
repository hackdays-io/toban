const LEGACY_ROLE_IMAGE_CIDS = [
  "bafybeignhscpeh55e7y2iva3eliuqugmgve2hfkxb43yg72brdnlexutti",
  "bafybeibfdgmu525swbw644j5i4cnqkf5lxql24qwjc47ilctdvhkmue7ne",
  "bafybeigudaq4m4xpoocgisen6adfynuhcei2piuw3bs4zahvit7zcv3nuy",
  "bafybeicyvdsgjh4gxlzfqyrf47viq2cyr4dwswfjwcgcxipvalz2xqarni",
];

export const isLegacyRoleImageUri = (uri?: string): boolean => {
  if (!uri) return false;
  return LEGACY_ROLE_IMAGE_CIDS.some((cid) => uri.includes(cid));
};
