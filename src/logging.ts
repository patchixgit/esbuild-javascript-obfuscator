import type { JSObfuscatorOptions } from './types/JSObfuscatorOptions';

export function CreateLogger(pluginOptions: JSObfuscatorOptions) {
	if (!pluginOptions.VerboseLogging) {
		return function log(...data: any[]) {};
	}

	return console.log.bind(null, '[esbuild-javascript-obfuscator]');
}
