import * as esbuild from 'esbuild';
import * as JsObf from 'javascript-obfuscator';

import fs from 'fs';
import path from 'path';

import type { JSObfuscatorOptions } from '../types/JSObfuscatorOptions';
import { ValidateOptions } from './optionValidator';
import { CreateLogger } from '../logging';

async function ObfuscateFile(
	pluginOptions: JSObfuscatorOptions,
	finalized: { fileName: string; outputCode: string }[],
	file: esbuild.OutputFile,
): Promise<boolean> {
	const logger = CreateLogger(pluginOptions);

	if (!file.path.endsWith('.js')) {
		logger('file does not end with .js, skipping obfuscation: ', file.path);
		return false;
	}

	if (pluginOptions.VMProtection.Enabled) {
		const { ApiKey, Version } = pluginOptions.VMProtection;

		logger('obfuscating with VM Protection ... ');

		const proApiOptions: JsObf.IProApiConfig = {
			apiToken: ApiKey! /* must exist because of optionValidator */,
		};

		if (Version) {
			Reflect.set(proApiOptions, 'version', Version);
		}

		const obfuscateResult = await JsObf.obfuscatePro(
			new TextDecoder().decode(file.contents),
			pluginOptions.ObfuscatorOptions,
			proApiOptions,
			logger,
		);

		finalized.push({ fileName: file.path, outputCode: obfuscateResult.getObfuscatedCode().toString() });

		logger('obfuscation with VM Protection completed for file: ', file.path);

		return true;
	}

	logger('obfusacting with no VM protection...');

	const obfuscateResult = JsObf.obfuscate(new TextDecoder().decode(file.contents), pluginOptions.ObfuscatorOptions);

	finalized.push({ fileName: file.path, outputCode: obfuscateResult.getObfuscatedCode().toString() });

	console.log(finalized);

	logger('obfuscation completed for file: ', file.path);

	return true;
}

export function JSObfuscatorPlugin(options: JSObfuscatorOptions) {
	const log = CreateLogger(options);
	const finalized: { fileName: string; outputCode: string }[] = [];

	log('JSObfuscatorPlugin initialized with options:', options);

	const [isValid, errorMsg] = ValidateOptions(options);
	log('isValid: ', isValid, ' errorMsg: ', errorMsg);

	if (!isValid) {
		throw new Error(`Invalid JSObfuscatorPlugin options: ${errorMsg || 'no error message provided'}`);
	}

	log('creating plugin');

	const obfuscateFile = ObfuscateFile.bind(null, options, finalized);

	return {
		name: 'esbuild-javascript-obfuscator',

		setup(build) {
			if (build.initialOptions.write) {
				throw new Error('esbuild-javascript-obfuscator plugin requires write: false in build options');
			}

			build.onEnd(async ({ errors, outputFiles }) => {
				if (errors.length) {
					log('build completed with errors, skipping obfuscation (errors: %f)', errors.length);
					return;
				}

				if (!outputFiles) {
					log('No output files found, skipping obfuscation');
					return;
				}

				if (outputFiles.length > 1 && !options.ObfuscateAllFiles) {
					throw new Error('outputFiles.length > 1 but ObfuscateAllFiles not explicitly set');
				}

				if (outputFiles.length > 1 && options.ObfuscateAllFiles) {
					for (const file of outputFiles) {
						const success = await obfuscateFile(file);

						if (!success) {
							log('failed to obfuscate file: ', file.path);
						}
					}
				} else {
					const file = outputFiles[0];
					const success = await obfuscateFile(file!);
					if (!success) {
						log('failed to obfuscate file: ', file!.path);
					}
				}

				/* write pass */
				for (const outputFile of finalized) {
					fs.mkdirSync(path.dirname(outputFile.fileName), { recursive: true });
					fs.writeFileSync(outputFile.fileName, outputFile.outputCode);
				}
			});
		},
	} as esbuild.Plugin;
}
