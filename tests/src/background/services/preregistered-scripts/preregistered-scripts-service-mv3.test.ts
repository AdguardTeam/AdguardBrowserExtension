/**
 * Copyright (c) 2015-2026 Adguard Software Ltd.
 *
 * @file
 * This file is part of AdGuard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * AdGuard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * AdGuard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with AdGuard Browser Extension. If not, see <http://www.gnu.org/licenses/>.
 */

import {
    describe,
    it,
    expect,
    vi,
    beforeEach,
} from 'vitest';

const {
    mockSyncContentScripts,
    mockSetPreregisteredScriptDomains,
    mockGetCosmeticResult,
    mockLoggerError,
    mockLoggerWarn,
} = vi.hoisted(() => ({
    mockSyncContentScripts: vi.fn(),
    mockSetPreregisteredScriptDomains: vi.fn(),
    mockGetCosmeticResult: vi.fn(),
    mockLoggerError: vi.fn(),
    mockLoggerWarn: vi.fn(),
}));

// Mock tswebextension
vi.mock(
    'tswebextension',
    () => ({
        TsWebExtension: {
            syncContentScripts: mockSyncContentScripts,
            setPreregisteredScriptDomains: mockSetPreregisteredScriptDomains,
        },
    }),
);

// Mock @adguard/tsurlfilter
vi.mock(
    '@adguard/tsurlfilter',
    () => ({
        CosmeticOption: {
            CosmeticOptionJS: 8,
        },
    }),
);

// Mock preregistered-scripts-registry (now exports domains string[])
vi.mock(
    'preregistered-scripts-registry',
    () => ({
        preregisteredDomains: [
            'youtube.com',
            'example.com',
        ],
    }),
);

// Mock logger
vi.mock(
    '../../../../../Extension/src/common/logger',
    () => ({
        logger: {
            error: (...args: unknown[]) => mockLoggerError(...args),
            warn: (...args: unknown[]) => mockLoggerWarn(...args),
        },
    }),
);

// Mock engine
vi.mock(
    '../../../../../Extension/src/background/engine',
    () => ({
        engine: {
            api: {
                getCosmeticResult: (...args: unknown[]) => mockGetCosmeticResult(...args),
            },
        },
    }),
);

const { PreregisteredScriptsService } = await import(
    '../../../../../Extension/src/background/services/preregistered-scripts/preregistered-scripts-service-mv3'
);

/**
 * Creates a mock CosmeticResult with the given rules.
 *
 * @param rules Array of mock rule objects.
 *
 * @returns Mock CosmeticResult.
 */
const createMockCosmeticResult = (rules: any[]): any => ({
    JS: {
        getRules: () => rules,
    },
});

/**
 * Creates a mock scriptlet rule.
 *
 * @param name Scriptlet name.
 * @param args Scriptlet args.
 *
 * @returns Mock scriptlet rule.
 */
const createScriptletRule = (name: string, args: string[]): any => ({
    isScriptlet: true,
    getScriptletData: () => ({
        params: { name, args },
        func: () => {},
    }),
});

/**
 * Creates a mock JS injection rule.
 *
 * @param content JS rule body.
 *
 * @returns Mock JS injection rule.
 */
const createJsRule = (content: string): any => ({
    isScriptlet: false,
    getContent: () => content,
});

describe.skipIf(!__IS_MV3__)('PreregisteredScriptsService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockSyncContentScripts.mockResolvedValue(undefined);

        // Default: no rules for any domain
        mockGetCosmeticResult.mockReturnValue(createMockCosmeticResult([]));
    });

    describe('registerDomains', () => {
        it('should register preregistered domains via TsWebExtension', () => {
            PreregisteredScriptsService.registerDomains();

            expect(mockSetPreregisteredScriptDomains).toHaveBeenCalledWith(
                ['youtube.com', 'example.com'],
            );
        });
    });

    describe('sync', () => {
        it('should call syncContentScripts with the correct namespace', async () => {
            await PreregisteredScriptsService.sync(true);

            expect(mockSyncContentScripts).toHaveBeenCalledWith(
                'preregistered',
                expect.any(Array),
            );
        });

        it('should pass empty scripts array when filtering is paused', async () => {
            await PreregisteredScriptsService.sync(false);

            expect(mockSyncContentScripts).toHaveBeenCalledTimes(1);

            const [, scriptsArg] = mockSyncContentScripts.mock.calls[0]!;
            expect(scriptsArg).toEqual([]);
        });

        it('should not query engine when filtering is paused', async () => {
            await PreregisteredScriptsService.sync(false);

            expect(mockGetCosmeticResult).not.toHaveBeenCalled();
        });

        it('should pass empty scripts array when no rules apply to any domain', async () => {
            mockGetCosmeticResult.mockReturnValue(createMockCosmeticResult([]));

            await PreregisteredScriptsService.sync(true);

            const [, scriptsArg] = mockSyncContentScripts.mock.calls[0]!;
            expect(scriptsArg).toEqual([]);
        });

        it('should create one registration per domain with rules', async () => {
            // youtube.com has 2 scriptlets, example.com has 0
            mockGetCosmeticResult.mockImplementation((url: string) => {
                if (url.includes('youtube.com')) {
                    return createMockCosmeticResult([
                        createScriptletRule('remove-attr', ['target', '_blank']),
                        createScriptletRule('set-constant', ['config', 'true']),
                    ]);
                }
                return createMockCosmeticResult([]);
            });

            await PreregisteredScriptsService.sync(true);

            const [, scriptsArg] = mockSyncContentScripts.mock.calls[0]!;
            const scripts = scriptsArg as Array<{ id: string }>;
            expect(scripts).toHaveLength(1);
            expect(scripts[0]!.id).toBe('youtube.com');
        });

        it('should include shared bundle as first js file', async () => {
            mockGetCosmeticResult.mockImplementation((url: string) => {
                if (url.includes('youtube.com')) {
                    return createMockCosmeticResult([
                        createScriptletRule('remove-attr', ['target']),
                    ]);
                }
                return createMockCosmeticResult([]);
            });

            await PreregisteredScriptsService.sync(true);

            const [, scriptsArg] = mockSyncContentScripts.mock.calls[0]!;
            const scripts = scriptsArg as Array<{ id: string; js: string[] }>;
            const script = scripts.find((s) => s.id === 'youtube.com');
            expect(script).toBeDefined();
            expect(script!.js[0]).toBe('filters/preregistered-scripts/scriptlets-bundle.js');
        });

        it('should construct correct match patterns', async () => {
            mockGetCosmeticResult.mockImplementation((url: string) => {
                if (url.includes('youtube.com')) {
                    return createMockCosmeticResult([
                        createScriptletRule('noop', []),
                    ]);
                }
                return createMockCosmeticResult([]);
            });

            await PreregisteredScriptsService.sync(true);

            const [, scriptsArg] = mockSyncContentScripts.mock.calls[0]!;
            const scripts = scriptsArg as Array<{ id: string; matches: string[] }>;
            const script = scripts.find((s) => s.id === 'youtube.com');
            expect(script).toBeDefined();
            expect(script!.matches).toEqual([
                '*://youtube.com/*',
                '*://*.youtube.com/*',
            ]);
        });

        it('should set MAIN world and document_start', async () => {
            mockGetCosmeticResult.mockImplementation((url: string) => {
                if (url.includes('youtube.com')) {
                    return createMockCosmeticResult([
                        createScriptletRule('noop', []),
                    ]);
                }
                return createMockCosmeticResult([]);
            });

            await PreregisteredScriptsService.sync(true);

            const [, scriptsArg] = mockSyncContentScripts.mock.calls[0]!;
            const scripts = scriptsArg as Array<Record<string, unknown>>;
            for (const script of scripts) {
                expect(script.world).toBe('MAIN');
                expect(script.runAt).toBe('document_start');
                expect(script.persistAcrossSessions).toBe(true);
                expect(script.allFrames).toBe(true);
            }
        });

        it('should query the engine with the correct URL and CosmeticOption', async () => {
            await PreregisteredScriptsService.sync(true);

            // Should query for each preregistered domain
            expect(mockGetCosmeticResult).toHaveBeenCalledTimes(2);
            expect(mockGetCosmeticResult).toHaveBeenCalledWith(
                'https://youtube.com/',
                8, // CosmeticOption.CosmeticOptionJS
            );
            expect(mockGetCosmeticResult).toHaveBeenCalledWith(
                'https://example.com/',
                8,
            );
        });

        it('should deduplicate scriptlets with same name and args', async () => {
            mockGetCosmeticResult.mockImplementation((url: string) => {
                if (url.includes('youtube.com')) {
                    return createMockCosmeticResult([
                        createScriptletRule('remove-attr', ['target']),
                        createScriptletRule('remove-attr', ['target']), // duplicate
                        createScriptletRule('set-constant', ['config', 'true']),
                    ]);
                }
                return createMockCosmeticResult([]);
            });

            await PreregisteredScriptsService.sync(true);

            const [, scriptsArg] = mockSyncContentScripts.mock.calls[0]!;
            const scripts = scriptsArg as Array<{ id: string; js: string[] }>;
            const script = scripts.find((s) => s.id === 'youtube.com');
            expect(script).toBeDefined();
            // shared-bundle + hash1 + hash2 (deduped from 3 rules to 2 unique)
            expect(script!.js).toHaveLength(3);
        });

        it('should handle both scriptlet and JS injection rules', async () => {
            mockGetCosmeticResult.mockImplementation((url: string) => {
                if (url.includes('youtube.com')) {
                    return createMockCosmeticResult([
                        createScriptletRule('remove-attr', ['target']),
                        createJsRule('document.title = "blocked";'),
                    ]);
                }
                return createMockCosmeticResult([]);
            });

            await PreregisteredScriptsService.sync(true);

            const [, scriptsArg] = mockSyncContentScripts.mock.calls[0]!;
            const scripts = scriptsArg as Array<{ id: string; js: string[] }>;
            const script = scripts.find((s) => s.id === 'youtube.com');
            expect(script).toBeDefined();
            // shared-bundle + scriptlet-hash + js-hash
            expect(script!.js).toHaveLength(3);
        });

        it('should log error when syncContentScripts throws', async () => {
            mockSyncContentScripts.mockRejectedValue(new Error('API failure'));

            await PreregisteredScriptsService.sync(true);

            expect(mockLoggerError).toHaveBeenCalledWith(
                expect.stringContaining('Failed to sync preregistered scripts'),
                expect.any(Error),
            );
        });

        it('should log warning when rule hashing fails', async () => {
            mockGetCosmeticResult.mockImplementation((url: string) => {
                if (url.includes('youtube.com')) {
                    return createMockCosmeticResult([
                        {
                            isScriptlet: true,
                            getScriptletData: () => null, // triggers error path
                        },
                    ]);
                }
                return createMockCosmeticResult([]);
            });

            await PreregisteredScriptsService.sync(true);

            expect(mockLoggerWarn).toHaveBeenCalledWith(
                expect.stringContaining('Failed to hash rule for domain youtube.com'),
                expect.anything(),
            );
        });
    });
});
