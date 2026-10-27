import assert from 'node:assert/strict';
import test from 'node:test';

import { applyDocumentLanguage, normalizeLanguageTag } from './documentLanguage.js';

test('normalizes Frappe locale tags to HTML language tags', () => {
	assert.equal(normalizeLanguageTag('fa_IR'), 'fa-ir');
	assert.equal(normalizeLanguageTag('en'), 'en');
	assert.equal(normalizeLanguageTag(''), 'en');
	assert.equal(normalizeLanguageTag('invalid_locale'), 'en');
});

test('sets Persian document language and RTL direction', () => {
	const element = {};
	assert.deepEqual(applyDocumentLanguage('fa_IR', element), {
		lang: 'fa-ir',
		direction: 'rtl',
	});
	assert.equal(element.lang, 'fa-ir');
	assert.equal(element.dir, 'rtl');
});

test('keeps English pages left-to-right', () => {
	assert.deepEqual(applyDocumentLanguage('en', {}), {
		lang: 'en',
		direction: 'ltr',
	});
});
