const RTL_LANGUAGES = new Set(['ar', 'fa', 'he', 'ps', 'ur']);

export function normalizeLanguageTag(language) {
	if (typeof language !== 'string' || !language.trim()) return 'en';

	const parts = language.trim().replaceAll('_', '-').split('-').filter(Boolean);
	if (!parts.length || !/^[a-z]{2,3}$/i.test(parts[0])) return 'en';

	return [parts[0].toLowerCase(), ...parts.slice(1).map((part) => part.toLowerCase())].join('-');
}

export function applyDocumentLanguage(language, documentElement = globalThis.document?.documentElement) {
	const lang = normalizeLanguageTag(language);
	const direction = RTL_LANGUAGES.has(lang.split('-')[0]) ? 'rtl' : 'ltr';

	if (documentElement) {
		documentElement.lang = lang;
		documentElement.dir = direction;
	}

	return { lang, direction };
}
