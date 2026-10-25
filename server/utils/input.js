// Request values that go into database lookups must be plain text. An object like
// { "$ne": null } would otherwise be read by MongoDB as a query operator.
const asText = (value) => (typeof value === 'string' ? value.trim() : '');

module.exports = { asText };
