import { test, expect } from 'bun:test';

import esbuild from 'esbuild';

import fs from 'fs';
import path from 'path';
import { JSObfuscatorPlugin } from '../plugin/plugin';

const ObfuscationOptions = {
	VMProtection: {
		Enabled: false,
	},
	ObfuscatorOptions: {
		compact: true,
		stringArray: true,
	},
	VerboseLogging: false,
	ObfuscateAllFiles: false,
};

function CreateDummyFiles() {
	function cleanup() {
		fs.rmSync(path.join(__dirname, 'temp'), { recursive: true, force: true });
	}

	cleanup(); /* needs to be called incase other tests failed and left the temp folder behind */

	fs.mkdirSync(path.join(__dirname, 'temp'));

	fs.writeFileSync(
		path.join(__dirname, 'temp', 'index.ts'),
		`
        console.log("Hello World")
        `,
	);

	return cleanup;
}

test('plugin should throw error when write: true', async () => {
	const cleanup = CreateDummyFiles();

	expect(
		esbuild.build({
			entryPoints: [path.join(__dirname, 'temp', 'index.ts')],
			bundle: true,
			write: true,
			minify: true,
			plugins: [JSObfuscatorPlugin(ObfuscationOptions)],
		}),
	).rejects.toThrow(`esbuild-javascript-obfuscator plugin requires write: false in build options`);

	cleanup();
});

test('plugin should throw error when write option is not provided', async () => {
	const cleanup = CreateDummyFiles();

	expect(
		esbuild.build({
			entryPoints: [path.join(__dirname, 'temp', 'index.ts')],
			bundle: true,
			minify: true,
			plugins: [JSObfuscatorPlugin(ObfuscationOptions)],
		}),
	).rejects.toThrow(`esbuild-javascript-obfuscator plugin requires write: false in build options`);

	cleanup();
});

test('plugin should successfully obfuscate a single file', async () => {
	const cleanup = CreateDummyFiles();

	await esbuild.build({
		entryPoints: [path.join(__dirname, 'temp', 'index.ts')],
		bundle: true,
		outfile: path.join(__dirname, 'temp', 'out.js'),
		write: false,
		minify: true,
		plugins: [JSObfuscatorPlugin(ObfuscationOptions)],
	});

	const obfuscatedCode = fs.readFileSync(path.join(__dirname, 'temp', 'out.js'), 'utf-8');

	cleanup();

	expect(obfuscatedCode).toContain('parseInt');
});
