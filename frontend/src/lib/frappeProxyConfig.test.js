import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
	createFrappeProxy,
	findBenchRoot,
	resolveFrappeWebServerPort,
} from './frappeProxyConfig.js';

test('bench discovery terminates at the platform filesystem root', () => {
	const tempRoot = mkdtempSync(path.join(os.tmpdir(), 'wiki-bench-root-'));
	try {
		assert.equal(findBenchRoot(path.join(tempRoot, 'nested', 'frontend')), null);
	} finally {
		rmSync(tempRoot, { recursive: true, force: true });
	}
});

test('uses a bench-specific web server port and honors the environment override', () => {
	const benchRoot = mkdtempSync(path.join(os.tmpdir(), 'wiki-bench-config-'));
	try {
		mkdirSync(path.join(benchRoot, 'apps'));
		mkdirSync(path.join(benchRoot, 'sites'));
		writeFileSync(
			path.join(benchRoot, 'sites', 'common_site_config.json'),
			JSON.stringify({ webserver_port: 8004 }),
		);
		assert.equal(resolveFrappeWebServerPort({ startDirectory: benchRoot }), 8004);
		assert.equal(
			resolveFrappeWebServerPort({
				startDirectory: benchRoot,
				environment: { FRAPPE_WEB_SERVER_PORT: '8011' },
			}),
			8011,
		);
		const proxy = createFrappeProxy({ webServerPort: 8004 });
		const route = proxy.proxy['^/(app|login|api|assets|files|private|razorpay_checkout)'];
		assert.equal(route.target, 'http://127.0.0.1:8004');
		assert.equal(route.router({ headers: { host: 'wiki.localhost:8080' } }), 'http://wiki.localhost:8004');
	} finally {
		rmSync(benchRoot, { recursive: true, force: true });
	}
});
