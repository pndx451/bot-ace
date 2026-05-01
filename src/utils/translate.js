let translate;
try { translate = require('google-translate-api-x'); } catch { translate = null; }

async function safeTranslate(text, to) {
  if (!text || !text.trim()) return '';
  if (!translate) return text;
  try {
    const res = await translate(text, { to });
    return res.text || text;
  } catch {
    return text;
  }
}
async function translateToThree(text) {
  return {
    en: await safeTranslate(text, 'en'),
    pt: await safeTranslate(text, 'pt'),
    es: await safeTranslate(text, 'es')
  };
}
module.exports = { translateToThree };
