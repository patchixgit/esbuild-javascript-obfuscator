import { test, expect } from 'bun:test';
import { ValidateOptions } from '../plugin/optionValidator';

const fakeObject = null as any;

test('return false if not an object', () => {
	const [isValid, errorMsg] = ValidateOptions(fakeObject);
	expect(isValid).toBe(false);
	expect(errorMsg).toContain('must be an object');
});

test('return false if VMProtection is not an object', () => {
	const [isValid, errorMsg] = ValidateOptions({
		VMProtection: null,
		ObfuscatorOptions: {},
		VerboseLogging: true,
	} as any);
	expect(isValid).toBe(false);
	expect(errorMsg).toContain('VMProtection must be an object');
});

test('return false if VMProtection.Enabled is not a boolean', () => {
	const [isValid, errorMsg] = ValidateOptions({
		VMProtection: { Enabled: {} },
		ObfuscatorOptions: {},
		VerboseLogging: true,
	} as any);
	expect(isValid).toBe(false);
	expect(errorMsg).toContain('VMProtection.Enabled must be a boolean');
});

test('return false if VMProtection.Enabled is true but ApiKey is not a string', () => {
	const [isValid, errorMsg] = ValidateOptions({
		VMProtection: { Enabled: true, ApiKey: 123 },
		ObfuscatorOptions: {},
		VerboseLogging: true,
	} as any);
	expect(isValid).toBe(false);
	expect(errorMsg).toContain('VMProtection.ApiKey must be a string when VMProtection.Enabled is true');
});

test('return false if ObfuscatorOptions is not an object', () => {
	const [isValid, errorMsg] = ValidateOptions({
		VMProtection: { Enabled: false },
		ObfuscatorOptions: null,
		VerboseLogging: true,
	} as any);
	expect(isValid).toBe(false);
	expect(errorMsg).toContain('ObfuscatorOptions must be an object');
});

test('return false if VerboseLogging is not a boolean', () => {
	const [isValid, errorMsg] = ValidateOptions({
		VMProtection: { Enabled: false },
		ObfuscatorOptions: {},
		VerboseLogging: 'true',
	} as any);
	expect(isValid).toBe(false);
	expect(errorMsg).toContain('VerboseLogging must be a boolean');
});

test('return false if ObfuscateAllFiles is provided but not a boolean', () => {
	const [isValid, errorMsg] = ValidateOptions({
		VMProtection: { Enabled: false },
		ObfuscatorOptions: {},
		VerboseLogging: true,
		ObfuscateAllFiles: 'true',
	} as any);
	expect(isValid).toBe(false);
	expect(errorMsg).toContain('ObfuscateAllFiles must be a boolean if provided');
});

test('return false if ObfuscateFilesWhitelist is provided but not an array', () => {
	const [isValid, errorMsg] = ValidateOptions({
		VMProtection: { Enabled: false },
		ObfuscatorOptions: {},
		VerboseLogging: true,
		ObfuscateFilesWhitelist: 'file.js',
	} as any);
	expect(isValid).toBe(false);
	expect(errorMsg).toContain('ObfuscateFilesWhitelist must be an array if provided');
});

test('return false if ObfuscateFilesWhitelist is provided but not an array of strings', () => {
	const [isValid, errorMsg] = ValidateOptions({
		VMProtection: { Enabled: false },
		ObfuscatorOptions: {},
		VerboseLogging: true,
		ObfuscateFilesWhitelist: ['file.js', 123],
	} as any);
	expect(isValid).toBe(false);
	expect(errorMsg).toContain('ObfuscateFilesWhitelist must be an array of strings');
});

test('return true if all options are valid', () => {
	const [isValid, errorMsg] = ValidateOptions({
		VMProtection: { Enabled: false },
		ObfuscatorOptions: {},
		VerboseLogging: true,
		ObfuscateAllFiles: true,
	});
	expect(isValid).toBe(true);
	expect(errorMsg).toBeUndefined();
});
