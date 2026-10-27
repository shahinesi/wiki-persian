import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const VIRTUAL_PREFIX = 'virtual:wiki-lucide/';
const IMPORT_PREFIX = '~icons/lucide/';

/** Map Lucide export names and aliases to their single underlying SVG module. */
export function parseLucideIconExports(source) {
	const iconFiles = new Map();
	const exportPattern = /export\s*\{([^}]+)\}\s*from\s*['"]\.\/icons\/([^'"]+)\.mjs['"]/g;

	for (const match of source.matchAll(exportPattern)) {
		const canonical = match[2];
		iconFiles.set(canonical, canonical);
		for (const specifier of match[1].split(',')) {
			const exportedName = specifier.match(/default\s+as\s+([A-Za-z0-9_]+)/)?.[1];
			if (!exportedName) continue;
			for (const alias of camelToDash(exportedName)) iconFiles.set(alias, canonical);
		}
	}

	return iconFiles;
}

function camelToDash(name) {
	const withNumber = name.replace(/[A-Z0-9]/g, (match) => `-${match.toLowerCase()}`);
	const withoutNumber = name.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
	const variants = [withNumber, withoutNumber].map((value) =>
		value.startsWith('-') ? value.slice(1) : value,
	);
	return [...new Set(variants)];
}

function iconModule(svg) {
	const inner = svg.match(/<svg[^>]*>([\s\S]*)<\/svg>/)?.[1].replace(/>\s+</g, '><').trim() ?? '';
	return `
import { h } from 'vue'
export default {
  inheritAttrs: false,
  render() {
    return h('svg', {
      xmlns: 'http://www.w3.org/2000/svg',
      width: '24',
      height: '24',
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': '1.5',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      ...this.$attrs,
      innerHTML: ${JSON.stringify(inner)},
    })
  }
}
`;
}

function missingIconModule(name) {
	const inner = '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>';
	return `
import { h } from 'vue'
export default {
  name: 'LucideMissing_${name.replace(/[^a-zA-Z0-9_]/g, '_')}',
  inheritAttrs: false,
  render() {
    return h('svg', {
      xmlns: 'http://www.w3.org/2000/svg',
      width: '24',
      height: '24',
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': '1.5',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'data-lucide-missing': ${JSON.stringify(name)},
      ...this.$attrs,
      innerHTML: ${JSON.stringify(inner)},
    })
  }
}
`;
}

export function lazyLucideIconPlugin({ iconsDirectory, iconFiles }) {
	const warned = new Set();
	return {
		name: 'wiki-lazy-lucide-icons',
		resolveId(id) {
			if (id.startsWith(IMPORT_PREFIX)) return VIRTUAL_PREFIX + id.slice(IMPORT_PREFIX.length);
		},
		async load(id) {
			if (!id.startsWith(VIRTUAL_PREFIX)) return;
			const iconName = id.slice(VIRTUAL_PREFIX.length).split('?', 1)[0];
			const filename = iconFiles.get(iconName);
			if (!filename) {
				if (!warned.has(iconName)) {
					warned.add(iconName);
					this.warn(`[wiki-lazy-lucide-icons] icon "${iconName}" was not found; using a placeholder.`);
				}
				return missingIconModule(iconName);
			}
			const svgModule = await import(pathToFileURL(path.join(iconsDirectory, `${filename}.mjs`)).href);
			return iconModule(svgModule.default.replace(/stroke-width="2"/g, 'stroke-width="1.5"'));
		},
	};
}

/** Install the same Vue auto-import resolvers as frappe-ui's icon plugin. */
export async function createLucideIconPlugins(frappeUiViteEntry) {
	const frappeRequire = createRequire(frappeUiViteEntry);
	const importFromFrappeUi = async (specifier) =>
		import(pathToFileURL(frappeRequire.resolve(specifier)).href);
	const [autoImportModule, componentsModule, resolverModule] = await Promise.all([
		importFromFrappeUi('unplugin-auto-import/vite'),
		importFromFrappeUi('unplugin-vue-components/vite'),
		importFromFrappeUi('unplugin-icons/resolver'),
	]);
	const AutoImport = autoImportModule.default;
	const Components = componentsModule.default;
	const IconsResolver = resolverModule.default?.default ?? resolverModule.default;
	const resolver = { resolvers: [IconsResolver({ prefix: false, enabledCollections: ['lucide'] })] };

	const lucidePackage = frappeRequire.resolve('lucide-static/package.json');
	const lucideRoot = path.dirname(lucidePackage);
	const lucideEntry = path.join(lucideRoot, 'dist/esm/lucide-static.mjs');
	const iconFiles = parseLucideIconExports(await readFile(lucideEntry, 'utf8'));

	return [
		AutoImport(resolver),
		Components(resolver),
		lazyLucideIconPlugin({
			iconsDirectory: path.join(lucideRoot, 'dist/esm/icons'),
			iconFiles,
		}),
	];
}
