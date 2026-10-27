import fs from 'node:fs';
import path from 'node:path';

export function findBenchRoot(startDirectory = process.cwd()) {
	let current = path.resolve(startDirectory);
	while (true) {
		if (
			fs.existsSync(path.join(current, 'sites')) &&
			fs.existsSync(path.join(current, 'apps'))
		) {
			return current;
		}

		const parent = path.dirname(current);
		if (parent === current) return null;
		current = parent;
	}
}

export function resolveFrappeWebServerPort({
	startDirectory = process.cwd(),
	environment = process.env,
} = {}) {
	const envPort = Number(environment.FRAPPE_WEB_SERVER_PORT);
	if (Number.isInteger(envPort) && envPort > 0) return envPort;

	const benchRoot = findBenchRoot(startDirectory);
	if (!benchRoot) return 8000;

	const configPath = path.join(benchRoot, 'sites', 'common_site_config.json');
	if (!fs.existsSync(configPath)) return 8000;

	const configuredPort = Number(JSON.parse(fs.readFileSync(configPath, 'utf8')).webserver_port);
	return Number.isInteger(configuredPort) && configuredPort > 0 ? configuredPort : 8000;
}

export function createFrappeProxy({
	port = 8080,
	source = '^/(app|login|api|assets|files|private|razorpay_checkout)',
	webServerPort = resolveFrappeWebServerPort(),
} = {}) {
	const proxy = {};
	proxy[source] = {
		target: `http://127.0.0.1:${webServerPort}`,
		ws: true,
		router(request) {
			const host = request.headers.host?.split(':')[0] || '127.0.0.1';
			return `http://${host}:${webServerPort}`;
		},
	};
	return { port, proxy };
}
