import assert from 'node:assert/strict';
import test from 'node:test';

import { lazyLucideIconPlugin, parseLucideIconExports } from './lucideIconPlugin.js';

test('maps Lucide names and aliases to their canonical SVG module', () => {
	const icons = parseLucideIconExports(`
export { default as ArrowUpRight } from './icons/arrow-up-right.mjs';
export { default as AlarmClockCheck, default as AlarmCheck } from './icons/alarm-clock-check.mjs';
export { default as BarChart2 } from './icons/bar-chart-2.mjs';
`);

	assert.equal(icons.get('arrow-up-right'), 'arrow-up-right');
	assert.equal(icons.get('alarm-check'), 'alarm-clock-check');
	assert.equal(icons.get('bar-chart-2'), 'bar-chart-2');
	assert.equal(icons.get('bar-chart2'), 'bar-chart-2');
});

test('resolves only requested icon modules and returns the Frappe-compatible Vue component', async () => {
	const plugin = lazyLucideIconPlugin({
		iconsDirectory: 'icons',
		iconFiles: new Map([['check', 'check']]),
	});

	assert.equal(plugin.resolveId('~icons/lucide/check'), 'virtual:wiki-lucide/check');
	const missing = await plugin.load.call(
		{ warn() {} },
		'virtual:wiki-lucide/unknown',
	);
	assert.match(missing, /data-lucide-missing/);
});
