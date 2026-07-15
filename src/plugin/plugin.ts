import * as esbuild from 'esbuild';
import * as JsObf from 'javascript-obfuscator';

import fs from 'fs';
import path from 'path';

import type { JSObfuscatorOptions } from '../types/JSObfuscatorOptions';
import { ValidateOptions } from './optionValidator';
import { CreateLogger } from '../logging';

type FinalizedFiles = { fileName: string; outputCode: string }[];

async function ObfuscateFile(
    pluginOptions: JSObfuscatorOptions,
    file: esbuild.OutputFile,
): Promise<string> {
    const logger = CreateLogger(pluginOptions);
    const originalCode = new TextDecoder().decode(file.contents);

    if (!file.path.endsWith('.js')) {
        logger('file does not end with .js, skipping obfuscation: ', file.path);
        return originalCode;
    }

    if (pluginOptions.VMProtection?.Enabled) {
        const { ApiKey, Version } = pluginOptions.VMProtection;

        logger('obfuscating with VM Protection ... ');

        const proApiOptions: JsObf.IProApiConfig = {
            apiToken: ApiKey! /* must exist because of optionValidator */,
        };

        if (Version) {
            Reflect.set(proApiOptions, 'version', Version);
        }

        const obfuscateResult = await JsObf.obfuscatePro(
            originalCode,
            pluginOptions.ObfuscatorOptions,
            proApiOptions,
            logger,
        );

        logger('obfuscation with VM Protection completed for file: ', file.path);
        return obfuscateResult.getObfuscatedCode().toString();
    }

    logger('obfuscating with no VM protection...');

    const obfuscateResult = JsObf.obfuscate(originalCode, pluginOptions.ObfuscatorOptions);

    logger('obfuscation completed for file: ', file.path);
    return obfuscateResult.getObfuscatedCode().toString();
}

export function JSObfuscatorPlugin(options: JSObfuscatorOptions) {
    const log = CreateLogger(options);

    log('JSObfuscatorPlugin initialized with options:', options);

    const [isValid, errorMsg] = ValidateOptions(options);
    log('isValid: ', isValid, ' errorMsg: ', errorMsg);

    if (!isValid) {
        throw new Error(`Invalid JSObfuscatorPlugin options: ${errorMsg || 'no error message provided'}`);
    }

    log('creating plugin');

    return {
        name: 'esbuild-javascript-obfuscator',

        setup(build) {
            if (build.initialOptions.write || build.initialOptions.write === undefined) {
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

				/* keep this here: on `watch` modes, this can cause a memory leak if not placed in this certain way.*/
                const finalized: FinalizedFiles = [];

                for (const file of outputFiles) {
                    const fileName = path.basename(file.path);

                    const shouldObfuscate =
                        options.ObfuscateAllFiles || (options.ObfuscateFilesWhitelist?.includes(fileName) ?? false);

                    if (shouldObfuscate && file.path.endsWith('.js')) {
                        try {
                            const outputCode = await ObfuscateFile(options, file);
							/* write obfuscated output */
                            finalized.push({ fileName: file.path, outputCode });
                        } catch (err) {
                            log('failed to obfuscate file: ', file.path, err);

							/* it failed, so just write the original file to the output */
							finalized.push({
                                fileName: file.path,
                                outputCode: new TextDecoder().decode(file.contents),
                            });
                        }
                    } else {
						/* should not obfuscate, write orig file. */
                        finalized.push({
                            fileName: file.path,
                            outputCode: new TextDecoder().decode(file.contents),
                        });
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