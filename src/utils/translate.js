let translate;
try { translate = require('google-translate-api-x'); } catch { translate = null; }

async function safeTranslate(text, to) {
  if (!text) return '';
  if (!translate) return text;
  try {
    const result = await translate(text, { to });
    return result?.text || text;
  } catch {
    return text;
  }
}

async function translateThree(title, description) {
  const [titleEn, titlePt, titleEs, descEn, descPt, descEs] = await Promise.all([
    safeTranslate(title, 'en'), safeTranslate(title, 'pt'), safeTranslate(title, 'es'),
    safeTranslate(description, 'en'), safeTranslate(description, 'pt'), safeTranslate(description, 'es')
  ]);
  return {
    en: { title: titleEn, description: descEn },
    pt: { title: titlePt, description: descPt },
    es: { title: titleEs, description: descEs }
  };
}

module.exports = { translateThree };
