import assert from 'node:assert/strict';
import test from 'node:test';

import { makeSocketUrl } from './socketUrl.js';

test('uses the Frappe Socket.IO port for local development', () => {
	assert.equal(
		makeSocketUrl({
			hostname: 'wiki.localhost',
			locationPort: '8080',
			siteName: 'wiki.localhost',
			socketIoPort: 9001,
		}),
		'http://wiki.localhost:9001/wiki.localhost',
	);
});

test('uses the standard secure origin when the page has no explicit port', () => {
	assert.equal(
		makeSocketUrl({
			hostname: 'wiki.example.com',
			locationPort: '',
			siteName: 'wiki.example.com',
			socketIoPort: 9001,
		}),
		'https://wiki.example.com/wiki.example.com',
	);
});
