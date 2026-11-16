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

import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { promises as fsPromises } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';

import { cliLog } from '../../../tools/cli-log';
import {
    BLOCKING_PAGES_EXTENSION_DIR,
    copyBlockingPages,
    extractBlockingPagesArchive,
    getBlockingPagesFiles,
    readBlockingPagesVersionFromArchive,
    verifyBlockingPagesRelease,
    withTempDir,
} from '../../../tools/resources/blocking-pages-archive';

const execFileAsync = promisify(execFile);

const FILES = [
    'adblocker_blocked.html',
    'adblocker_blocked.js',
    'adblocker_safebrowsing.html',
    'adblocker_safebrowsing.js',
];

describe('blocking pages archive', () => {
    let fixtureDir: string;
    let archivePath: string;

    beforeEach(async () => {
        fixtureDir = await fsPromises.mkdtemp(path.join(os.tmpdir(), 'blocking-pages-fixture-'));
        const extensionDir = path.join(fixtureDir, BLOCKING_PAGES_EXTENSION_DIR);
        await fsPromises.mkdir(extensionDir, { recursive: true });

        for (const file of FILES) {
            await fsPromises.writeFile(path.join(extensionDir, file), `content of ${file}`);
        }

        await fsPromises.writeFile(
            path.join(fixtureDir, 'dist', 'version.txt'),
            '2.1.0.184557088\n',
        );

        archivePath = path.join(fixtureDir, 'fixture.tar.gz');
        await execFileAsync('tar', [
            '-czf',
            archivePath,
            '-C',
            fixtureDir,
            BLOCKING_PAGES_EXTENSION_DIR,
            'dist/version.txt',
        ]);
    });

    afterEach(async () => {
        await fsPromises.rm(fixtureDir, { recursive: true, force: true });
    });

    it('verifies the release version and archive checksum', () => {
        const archive = Buffer.from('blocking pages archive');
        const checksum = createHash('sha256').update(archive).digest('hex');
        const version = '2.1.0.184557088';

        expect(() => verifyBlockingPagesRelease(archive, version, version, checksum)).not.toThrow();

        const verifyMismatch = (actualVersion: string, expectedSha256: string) => () => {
            verifyBlockingPagesRelease(archive, actualVersion, version, expectedSha256);
        };

        expect(verifyMismatch('2.2.0', checksum)).toThrow('Blocking pages release mismatch');
        expect(verifyMismatch('2.2.0', checksum)).toThrow('got 2.2.0');
        expect(verifyMismatch('2.2.0', checksum)).toThrow(
            'Update BLOCKING_PAGES_VERSION and BLOCKING_PAGES_ARCHIVE_SHA256',
        );
        expect(verifyMismatch(version, '0'.repeat(64))).toThrow('Blocking pages release mismatch');
    });

    it('reads the blocking pages version from the archive', async () => {
        await expect(readBlockingPagesVersionFromArchive(archivePath)).resolves.toBe('2.1.0.184557088');
    });

    it('reports a missing blocking pages version', async () => {
        const archiveWithoutVersion = path.join(fixtureDir, 'without-version.tar.gz');
        await execFileAsync('tar', [
            '-czf',
            archiveWithoutVersion,
            '-C',
            fixtureDir,
            BLOCKING_PAGES_EXTENSION_DIR,
        ]);

        await expect(readBlockingPagesVersionFromArchive(archiveWithoutVersion)).rejects.toThrow(
            'Cannot read the blocking pages version from dist/version.txt',
        );
    });

    it('extracts the extension pages from the archive', async () => {
        await withTempDir(async (tempDir) => {
            const extractDir = path.join(tempDir, 'extracted');
            await extractBlockingPagesArchive(archivePath, extractDir);

            for (const file of FILES) {
                const content = await fsPromises.readFile(
                    path.join(extractDir, BLOCKING_PAGES_EXTENSION_DIR, file),
                    'utf8',
                );

                expect(content).toBe(`content of ${file}`);
            }
        });
    });

    it('copies all files to the real extension destinations', async () => {
        await withTempDir(async (tempDir) => {
            const extractDir = path.join(tempDir, 'extracted');
            const outputDir = path.join(tempDir, 'Extension');
            await extractBlockingPagesArchive(archivePath, extractDir);

            const files = getBlockingPagesFiles(outputDir);

            expect(files.map(({ source }) => source)).toEqual(FILES);
            expect(files.map(({ destination }) => path.relative(outputDir, destination))).toEqual([
                path.join('pages', 'blocking', 'blocked', 'index.html'),
                path.join('pages', 'blocking', 'blocked', 'imported-script.js'),
                path.join('pages', 'blocking', 'safebrowsing', 'index.html'),
                path.join('pages', 'blocking', 'safebrowsing', 'imported-script.js'),
            ]);

            await copyBlockingPages(extractDir, files);

            for (const { source, destination } of files) {
                const content = await fsPromises.readFile(destination, 'utf8');

                expect(content).toBe(`content of ${source}`);
            }
        });
    });

    it('throws when a file is absent in the archive', async () => {
        await withTempDir(async (tempDir) => {
            const extractDir = path.join(tempDir, 'extracted');
            const missingFile = FILES[0] as string;
            await extractBlockingPagesArchive(archivePath, extractDir);
            await fsPromises.rm(path.join(extractDir, BLOCKING_PAGES_EXTENSION_DIR, missingFile));

            const files = getBlockingPagesFiles(path.join(tempDir, 'Extension'));

            await expect(copyBlockingPages(extractDir, files)).rejects.toThrow(
                `Cannot find ${missingFile} in the blocking pages archive`,
            );
        });
    });

    it('preserves the cause when a file is absent in the archive', async () => {
        await withTempDir(async (tempDir) => {
            const extractDir = path.join(tempDir, 'extracted');
            const missingFile = FILES[0] as string;
            await extractBlockingPagesArchive(archivePath, extractDir);
            await fsPromises.rm(path.join(extractDir, BLOCKING_PAGES_EXTENSION_DIR, missingFile));

            const files = getBlockingPagesFiles(path.join(tempDir, 'Extension'));

            try {
                await copyBlockingPages(extractDir, files);
                throw new Error('Expected copyBlockingPages to throw');
            } catch (error) {
                expect(error).toBeInstanceOf(Error);
                expect((error as Error).message).toBe(
                    `Cannot find ${missingFile} in the blocking pages archive`,
                );
                expect(((error as Error).cause as NodeJS.ErrnoException).code).toBe('ENOENT');
            }
        });
    });

    it('does not modify destinations when a file is absent in the archive', async () => {
        await withTempDir(async (tempDir) => {
            const extractDir = path.join(tempDir, 'extracted');
            const outputDir = path.join(tempDir, 'Extension');
            await extractBlockingPagesArchive(archivePath, extractDir);

            const files = getBlockingPagesFiles(outputDir);

            for (const { destination } of files) {
                await fsPromises.mkdir(path.dirname(destination), { recursive: true });
                await fsPromises.writeFile(destination, 'original content');
            }

            const missingFile = FILES[3] as string;
            await fsPromises.rm(path.join(extractDir, BLOCKING_PAGES_EXTENSION_DIR, missingFile));

            await expect(copyBlockingPages(extractDir, files)).rejects.toThrow(
                `Cannot find ${missingFile} in the blocking pages archive`,
            );

            for (const { destination } of files) {
                await expect(fsPromises.readFile(destination, 'utf8')).resolves.toBe('original content');
            }
        });
    });

    it('refuses a source outside the extension directory', async () => {
        await withTempDir(async (tempDir) => {
            const extractDir = path.join(tempDir, 'extracted');
            const outputDir = path.join(tempDir, 'Extension');
            await extractBlockingPagesArchive(archivePath, extractDir);

            await fsPromises.writeFile(
                path.join(extractDir, 'dist', 'outside.txt'),
                'outside content',
            );

            const destination = path.join(outputDir, 'outside.txt');

            await expect(copyBlockingPages(extractDir, [{
                source: '../outside.txt',
                destination,
            }])).rejects.toThrow('outside the blocking pages extension directory');

            await expect(fsPromises.access(destination)).rejects.toThrow();
        });
    });

    it('refuses a symlink source', async () => {
        await withTempDir(async (tempDir) => {
            const extractDir = path.join(tempDir, 'extracted');
            const outputDir = path.join(tempDir, 'Extension');
            await extractBlockingPagesArchive(archivePath, extractDir);

            const outsidePath = path.join(tempDir, 'outside.txt');
            await fsPromises.writeFile(outsidePath, 'outside content');

            const symlinkSource = path.join(
                extractDir,
                BLOCKING_PAGES_EXTENSION_DIR,
                'adblocker_blocked.html',
            );
            await fsPromises.rm(symlinkSource);
            await fsPromises.symlink(outsidePath, symlinkSource);

            const files = getBlockingPagesFiles(outputDir);

            await expect(copyBlockingPages(extractDir, files)).rejects.toThrow(
                'not a regular file in the blocking pages archive',
            );

            for (const { destination } of files) {
                await expect(fsPromises.access(destination)).rejects.toThrow();
            }
        });
    });

    it('reports an archive without the extension directory', async () => {
        const sourceDir = path.join(fixtureDir, 'other-archive');
        const archiveWithoutExtension = path.join(fixtureDir, 'without-extension.tar.gz');
        await fsPromises.mkdir(path.join(sourceDir, 'dist', 'corelibs'), { recursive: true });
        await fsPromises.writeFile(path.join(sourceDir, 'dist', 'corelibs', 'page.html'), 'content');
        await execFileAsync('tar', ['-czf', archiveWithoutExtension, '-C', sourceDir, 'dist/corelibs']);

        await withTempDir(async (tempDir) => {
            await expect(
                extractBlockingPagesArchive(
                    archiveWithoutExtension,
                    path.join(tempDir, 'extracted'),
                ),
            ).rejects.toThrow('Cannot extract the blocking pages archive');
        });
    });

    it('reports the tar error for a corrupt archive', async () => {
        await withTempDir(async (tempDir) => {
            const corruptArchivePath = path.join(tempDir, 'corrupt.tar.gz');
            await fsPromises.writeFile(corruptArchivePath, 'not an archive');

            await expect(
                extractBlockingPagesArchive(corruptArchivePath, path.join(tempDir, 'extracted')),
            ).rejects.toThrow('Cannot extract the blocking pages archive');
        });
    });

    it('removes the temporary directory after the callback', async () => {
        let tempDir = '';

        await withTempDir(async (dir) => {
            tempDir = dir;
            await fsPromises.writeFile(path.join(dir, 'file.txt'), 'content');
        });

        await expect(fsPromises.access(tempDir)).rejects.toThrow();
    });

    it('removes the temporary directory when the callback throws', async () => {
        let tempDir = '';

        await expect(withTempDir(async (dir) => {
            tempDir = dir;
            throw new Error('test error');
        })).rejects.toThrow('test error');

        await expect(fsPromises.access(tempDir)).rejects.toThrow();
    });

    it('does not mask the callback error when cleanup fails', async () => {
        const warningSpy = vi.spyOn(cliLog, 'warning').mockImplementation(() => {});
        const rmSpy = vi.spyOn(fsPromises, 'rm').mockRejectedValueOnce(new Error('cleanup failed'));
        let tempDir = '';

        try {
            await expect(withTempDir(async (dir) => {
                tempDir = dir;
                throw new Error('test error');
            })).rejects.toThrow('test error');

            expect(warningSpy).toHaveBeenCalledWith(
                expect.stringContaining(`Cannot remove temporary directory ${tempDir}`),
            );
        } finally {
            rmSpy.mockRestore();
            warningSpy.mockRestore();

            if (tempDir) {
                await fsPromises.rm(tempDir, { recursive: true, force: true });
            }
        }
    });
});
