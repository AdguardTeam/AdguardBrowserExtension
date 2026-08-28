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
    afterEach,
    beforeEach,
    describe,
    expect,
    test,
    vi,
} from 'vitest';

import { SafetyChecker } from '../../../../tools/resources/dangerous-rules/safety-checker';

const { openAIConstructorMock, createCompletionMock } = vi.hoisted(() => ({
    openAIConstructorMock: vi.fn(),
    createCompletionMock: vi.fn(),
}));

vi.mock('openai', () => ({
    default: class MockOpenAI {
        chat = { completions: { create: createCompletionMock } };

        constructor(...args: unknown[]) {
            openAIConstructorMock(...args);
        }
    },
}));

describe('SafetyChecker TokenGuard configuration', () => {
    beforeEach(() => {
        createCompletionMock.mockResolvedValue({
            choices: [{ message: { content: 'Type: not dangerous\nReason: ok' } }],
        });
    });

    afterEach(() => {
        vi.clearAllMocks();
        vi.unstubAllEnvs();
    });

    test('uses TokenGuard default baseURL and model when env vars are not set', async () => {
        vi.stubEnv('TOKENGUARD_BASE_URL', '');
        vi.stubEnv('TOKENGUARD_MODEL', '');
        const checker = new SafetyChecker('test-key');

        expect(openAIConstructorMock).toHaveBeenCalledWith({
            apiKey: 'test-key',
            baseURL: 'https://tokenguard.int.agrd.dev/api/v1/',
        });

        await checker.checkScriptText('test rule');

        expect(createCompletionMock).toHaveBeenCalledWith(expect.objectContaining({
            model: 'deepseek-v4-flash',
        }));
    });

    test('respects TOKENGUARD_BASE_URL and TOKENGUARD_MODEL overrides', async () => {
        vi.stubEnv('TOKENGUARD_BASE_URL', 'https://example.com/api/v1/');
        vi.stubEnv('TOKENGUARD_MODEL', 'custom-model');

        const checker = new SafetyChecker('test-key');

        expect(openAIConstructorMock).toHaveBeenCalledWith({
            apiKey: 'test-key',
            baseURL: 'https://example.com/api/v1/',
        });

        await checker.checkScriptText('test rule');

        expect(createCompletionMock).toHaveBeenCalledWith(expect.objectContaining({
            model: 'custom-model',
        }));
    });

    test('throws when the model response does not contain a type', async () => {
        vi.stubEnv('TOKENGUARD_BASE_URL', '');
        vi.stubEnv('TOKENGUARD_MODEL', '');
        createCompletionMock.mockResolvedValue({
            choices: [{ message: { content: 'unexpected response without a type' } }],
        });

        const checker = new SafetyChecker('test-key');

        await expect(checker.checkScriptText('test rule')).rejects.toThrow('Type not found in response');
    });
});
