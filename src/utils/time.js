function parseDuration(input) {
  const match = String(input || '').trim().toLowerCase().match(/^(\d+)(m|h|d|y)$/);
  if (!match) return null;
  const n = Number(match[1]);
  const unit = match[2];
  const ms = { m: 60000, h: 3600000, d: 86400000, y: 31536000000 }[unit];
  return n * ms;
}

module.exports = { parseDuration };
