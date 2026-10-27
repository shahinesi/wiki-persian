import { copyFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const frontendDir = path.dirname(fileURLToPath(import.meta.url));
await copyFile(
	path.resolve(frontendDir, '../../wiki/public/frontend/index.html'),
	path.resolve(frontendDir, '../../wiki/www/wiki-app.html'),
);
