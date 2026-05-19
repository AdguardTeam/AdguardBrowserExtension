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

import { spawn } from 'node:child_process';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import {
    Argument,
    Command,
    Option,
} from 'commander';

import { BuildTargetEnv } from '../../../constants';
import { logError } from '../logger';

import { E2E_MATRIX } from './matrix';
import { E2EMatrixId } from './types';

/**
 * Returns E2E JUnit report path for an environment.
 *
 * @param env Build target environment.
 *
 * @returns E2E JUnit report path.
 */
const getE2EReportPath = (env: BuildTargetEnv): string => {
    return path.join('tests-reports', `e2e-tests-${env}.xml`);
};

/**
 * Environment variable key used to pass selected build env to the Vitest child process.
 */
export const E2E_VITEST_ENV_KEY = 'E2E_ENV';

/**
 * Environment variable key used to pass selected matrix ids to the Vitest child process.
 */
export const E2E_VITEST_MATRIX_IDS_KEY = 'E2E_MATRIX_IDS';

const MATRIX_OPTION = '--matrix';

const TEST_NAME_OPTION = '--test-name';

const VITEST_TEST_NAME_OPTION = '--testNamePattern';

type E2EVitestOptions = {
    matrix?: string[];
    testName?: string;
};

/**
 * Parsed E2E Vitest wrapper arguments.
 */
type E2EVitestArgs = {
    /**
     * Build target environment used for running E2E tests.
     */
    env: BuildTargetEnv;

    /**
     * Matrix IDs selected for the E2E test run.
     */
    matrixIds: E2EMatrixId[];

    /**
     * Arguments forwarded to Vitest unchanged.
     */
    vitestArgs: string[];
};

/**
 * Parses E2E wrapper arguments and leaves Vitest arguments untouched.
 *
 * @param args Raw command arguments without node executable and script path.
 *
 * @returns Parsed E2E wrapper arguments.
 *
 * @throws Error if wrapper arguments are invalid.
 */
export const parseE2EVitestArgs = (args: string[]): E2EVitestArgs => {
    const program = createE2EVitestCommand();

    program.parse(args, { from: 'user' });

    const [envArg, ...restArgs] = program.args;
    const options = program.opts<E2EVitestOptions>();

    const matrixIds: E2EMatrixId[] = [];
    const vitestArgs: string[] = [];

    options.matrix?.forEach((matrixId) => addMatrixIds(matrixId, matrixIds));

    if (options.testName) {
        vitestArgs.push(VITEST_TEST_NAME_OPTION, options.testName);
    }

    restArgs.forEach((arg) => {
        vitestArgs.push(arg);
    });

    return {
        env: envArg as BuildTargetEnv,
        matrixIds,
        vitestArgs,
    };
};

/**
 * Runs Vitest E2E tests.
 *
 * This wrapper keeps the public command short while preserving native Vitest filtering.
 * It validates project-specific options, configures reporters, and passes the selected
 * build env and matrix to the spawned Vitest process through environment variables.
 *
 * @param rawArgs Raw command arguments without node executable and script path.
 *
 * @returns Vitest process exit code.
 */
export const runE2EVitest = async (rawArgs: string[]): Promise<number> => {
    let args: E2EVitestArgs;

    try {
        args = parseE2EVitestArgs(rawArgs);
    } catch (error: unknown) {
        if (error instanceof Error && 'exitCode' in error) {
            return (error as { exitCode: number }).exitCode;
        }

        throw error;
    }

    const command = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
    const vitestArgs = [
        'exec',
        'vitest',
        'run',
        '--config',
        'tools/browser-test/e2e/vitest.config.ts',
        '--reporter',
        'default',
        '--reporter',
        'junit',
        `--outputFile=${getE2EReportPath(args.env)}`,
        ...args.vitestArgs,
    ];

    return spawnVitest(command, vitestArgs, {
        ...process.env,
        [E2E_VITEST_ENV_KEY]: args.env,
        [E2E_VITEST_MATRIX_IDS_KEY]: args.matrixIds.join(','),
    });
};

/**
 * Creates Commander parser for E2E Vitest wrapper arguments.
 *
 * @returns Configured command parser.
 */
const createE2EVitestCommand = (): Command => {
    return new Command('pnpm test:e2e')
        .exitOverride()
        .configureOutput({
            // eslint-disable-next-line jsdoc/require-jsdoc
            writeOut: (str) => process.stdout.write(str),
            // eslint-disable-next-line jsdoc/require-jsdoc
            writeErr: (str) => process.stderr.write(str),
        })
        .showHelpAfterError(`Available envs: ${Object.values(BuildTargetEnv).map((e) => `"${e}"`).join(', ')}. Run with --help for full usage.`)
        .allowUnknownOption()
        .addArgument(
            new Argument('<env>', 'Build target environment used for running E2E tests.')
                .choices(Object.values(BuildTargetEnv)),
        )
        .addOption(
            new Option(`${MATRIX_OPTION} <ids...>`, 'Matrix IDs selected for the E2E test run.')
                .choices(Object.values(E2EMatrixId)),
        )
        .addOption(
            new Option(`${TEST_NAME_OPTION} <pattern>`, 'E2E test name pattern.')
                .argParser((value: string) => value),
        )
        .addHelpText('after', () => [
            '',
            'Examples:',
            '  pnpm test:e2e dev --matrix chrome-mv2 --test-name "filtering-log"',
            '  pnpm test:e2e dev --test-name "chrome-mv2"',
        ].join('\n'));
};

/**
 * Adds comma-separated matrix ids to an accumulator.
 *
 * @param value Matrix id value.
 * @param matrixIds Matrix id accumulator.
 *
 * @throws Error if value contains unknown matrix id.
 */
const addMatrixIds = (value: string, matrixIds: E2EMatrixId[]): void => {
    value.split(',')
        .filter(Boolean)
        .forEach((matrixId) => {
            if (!isE2EMatrixId(matrixId)) {
                throw new Error(
                    `Unknown E2E matrix id: ${matrixId}. Available matrix ids: ${E2E_MATRIX.map((entry) => entry.id).join(', ')}`,
                );
            }

            matrixIds.push(matrixId);
        });
};

/**
 * Checks whether a value is an E2E matrix id.
 *
 * @param value Value to check.
 *
 * @returns True if value is an E2E matrix id.
 */
const isE2EMatrixId = (value: string): value is E2EMatrixId => {
    return Object.values(E2EMatrixId).includes(value as E2EMatrixId);
};

/**
 * Spawns Vitest with inherited stdio.
 *
 * @param command Command to run.
 * @param args Command arguments.
 * @param env Environment variables.
 *
 * @returns Process exit code.
 */
const spawnVitest = (command: string, args: string[], env: NodeJS.ProcessEnv): Promise<number> => {
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, {
            env,
            stdio: 'inherit',
        });

        child.on('error', reject);
        child.on('exit', (code) => {
            resolve(code ?? 1);
        });
    });
};

/**
 * Checks whether this module is executed directly.
 *
 * @returns True for direct CLI execution.
 */
const isDirectRun = (): boolean => {
    if (!process.argv[1]) {
        return false;
    }

    return import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
};

if (isDirectRun()) {
    try {
        process.exitCode = await runE2EVitest(process.argv.slice(2));
    } catch (error: unknown) {
        logError(error instanceof Error ? error.message : String(error));
        process.exitCode = 1;
    }
}
