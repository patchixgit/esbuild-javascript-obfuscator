import assert from 'node:assert';
import type { JSObfuscatorOptions } from '../types/JSObfuscatorOptions';

/**
 * Checks if a value is an object.
 * @param value The value to check
 * @returns True if the value is an object, false otherwise
 */
function IsObject(value: unknown): boolean {
	return typeof value === 'object' && value !== null;
}

/**
 * Validates a given JSObfuscatorOptions object.
 * @param options The options to validate
 * @returns Array where first element is if it's OK or not, and the second being an optional message
 */
export function ValidateOptions(options: JSObfuscatorOptions): [boolean, string?] {
	try {
		/* Simple Type Checks */

		assert(IsObject(options), 'Options must be an object');

		// - VMProtection

		assert(IsObject(options.VMProtection), 'VMProtection must be an object');
		assert(typeof options.VMProtection.Enabled === 'boolean', 'VMProtection.Enabled must be a boolean');

		if (options.VMProtection.Enabled) {
			assert(
				typeof options.VMProtection.ApiKey === 'string',
				'VMProtection.ApiKey must be a string when VMProtection.Enabled is true',
			);
		}

		// - ObfuscatorOptions

		assert(IsObject(options.ObfuscatorOptions), 'ObfuscatorOptions must be an object');

		// - VerboseLogging

		assert(typeof options.VerboseLogging === 'boolean', 'VerboseLogging must be a boolean');

		// - ObfuscateAllFiles

		if (options.ObfuscateAllFiles !== undefined) {
			assert(typeof options.ObfuscateAllFiles === 'boolean', 'ObfuscateAllFiles must be a boolean if provided');
		}

		// - ObfuscateFilesWhitelist

		if (options.ObfuscateFilesWhitelist !== undefined) {
			assert(Array.isArray(options.ObfuscateFilesWhitelist), 'ObfuscateFilesWhitelist must be an array if provided');

			assert(
				options.ObfuscateFilesWhitelist.every((file) => typeof file === 'string'),
				'ObfuscateFilesWhitelist must be an array of strings if provided',
			);
		}
	} catch (err) {
		return [false, `Assertion error: ${(err as Error).message}`];
	}

	return [true];
}
