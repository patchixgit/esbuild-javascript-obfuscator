import JsObf from 'javascript-obfuscator';

export interface JSObfuscatorOptions {
	/**
	 * The options for VM protection. If Enabled is true, ApiKey must be provided.
	 */
	VMProtection: {
		/**
		 * Whether you would like to enable VM protection or not. (requires subscription)
		 */
		Enabled: boolean;

		/**
		 * The API key from your obfuscator.io dashboard. Visit API Keys link to get your API key.
		 *
		 * This must be provided if VMProtection.Enabled is true.
		 *
		 * Links:
		 * - [API Keys](https://obfuscator.io/dashboard/settings/api-keys)
		 */
		ApiKey?: string;

		/**
		 * The version of the VM protection to use. If not provided, the latest version will be used.
		 */
		Version?: string;
	};

	/**
	 * The options for the JavaScript obfuscator.
	 *
	 * You can go to the dashboard, press the braces button (to the left of the preset option) and export the options as JSON and paste it here (requires subscription).
	 *
	 * Links:
	 * - [Dashboard](https://obfuscator.io/dashboard)
	 */
	ObfuscatorOptions: JsObf.ObfuscatorOptions;

	/**
	 * Whether you would like to enable verbose logging or not.
	 */
	VerboseLogging: boolean;

	/**
	 * Whether you would like to obfuscate every single output file (provided it is .js).
	 * 
	 * If this is not explicitly provided and there are multiple output files, the plugin will error.
	 */
	ObfuscateAllFiles?: boolean;

	/**
	 * An optional whitelist of files to obfuscate.
	 * 
	 * This must be provided if `ObfuscateAllFiles` is truthy and must be an array of filenames.
	 */
	ObfuscateFilesWhitelist?: string[];
}
