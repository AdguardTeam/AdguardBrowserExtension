/**
 * @file
 * Links an ESLint plugin to a local file.
 * This is a workaround for the fact that ESLint doesn't support local plugins.
 */
import fs from 'fs';
import path from 'path';

// Usage: tsx tools/link-eslint-plugin.ts <source-file> <plugin-dir>
// eslint-disable-next-line max-len
// Example: tsx tools/link-eslint-plugin.ts eslint-rules/require-logger-context.cjs node_modules/eslint-plugin-require-logger-context

const [,, srcArg, destDirArg] = process.argv;
if (!srcArg || !destDirArg) {
    // eslint-disable-next-line no-console
    console.error('Usage: tsx tools/link-eslint-plugin.ts <source-file> <plugin-dir>');
    process.exit(1);
}

const src = path.resolve(process.cwd(), srcArg);
const destDir = path.resolve(process.cwd(), destDirArg);
const dest = path.join(destDir, 'index.js');

try {
    // Remove old plugin dir/symlink if exists
    if (fs.existsSync(destDir)) {
        fs.rmSync(destDir, { recursive: true, force: true });
    }
    fs.mkdirSync(destDir, { recursive: true });
    fs.symlinkSync(src, dest, 'file');
    // eslint-disable-next-line no-console
    console.log('%cSymlink created:', 'color: green; font-weight: bold;', dest, '->', src);
} catch (e) {
    // eslint-disable-next-line no-console
    console.error('%cFailed to create symlink:', 'color: red; font-weight: bold;', e);
    process.exit(1);
}
