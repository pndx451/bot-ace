const fs = require('fs');
const config = require('../config');

function ensureFiles() {
  if (!fs.existsSync(config.paths.data)) fs.mkdirSync(config.paths.data, { recursive: true });
  const defaults = [
    [config.paths.giveaways, []],
    [config.paths.lista, []],
    [config.paths.blacklist, []],
    [config.paths.stock, { Basic: 0, Advanced: 0, Private: 0, 'Control Phone': 0 }]
  ];
  for (const [file, value] of defaults) {
    if (!fs.existsSync(file)) fs.writeFileSync(file, JSON.stringify(value, null, 2));
  }
}

function readJson(file, fallback = []) {
  ensureFiles();
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; }
}

function writeJson(file, data) {
  ensureFiles();
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

module.exports = { ensureFiles, readJson, writeJson };
