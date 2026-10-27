export function makeSocketUrl({ hostname, locationPort, siteName, socketIoPort }) {
	const port = locationPort ? `:${socketIoPort || '9000'}` : '';
	const protocol = port ? 'http' : 'https';
	return `${protocol}://${hostname}${port}/${siteName}`;
}
