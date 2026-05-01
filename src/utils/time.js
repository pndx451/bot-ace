function parseDuration(input) {
  const match = String(input).toLowerCase().match(/^(\d+)(m|h|d|y)$/);
  if (!match) return null;
  const n = Number(match[1]);
  return n * { m: 60000, h: 3600000, d: 86400000, y: 31536000000 }[match[2]];
}
module.exports = { parseDuration };
