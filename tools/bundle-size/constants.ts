/**
 * @file Bundle size constants and types
 * Shared constants and type definitions for the bundle size monitoring system.
 *
 * Exports:
 * - Size thresholds and limits
 * - Directory and file naming conventions
 * - Type definitions for bundle size data structures
 */
import type { Browser, BuildTargetEnv } from '../constants';

/**
 * 10% threshold for bundle size changes and each entry point size.
 * Used as the default allowed percentage increase.
 */
export const DEFAULT_SIZE_THRESHOLD_PERCENTAGE = 10;

/**
 * 1 MB in bytes.
 */
const ONE_MB_IN_BYTES = 1024 * 1024;

/**
 * 30MB limit for MV3, selected heuristically (by CTO).
 * Enforced for Chrome MV3 builds.
 */
export const MAX_MV3_SIZE_BYTES = 30 * ONE_MB_IN_BYTES;

/**
 * 200 MB limit for Firefox Add-ons Store.
 *
 * Potentially even bigger number is allowed
 * since max uncompressed size was increased
 * https://github.com/mozilla/addons-server/pull/22773
 * but 200 MB should be more than enough.
 */
export const MAX_FIREFOX_AMO_SIZE_BYTES = 200 * ONE_MB_IN_BYTES;

/**
 * Firefox Add-ons Store limit for any file inside the zip.
 *
 * Note: This limit is not enforced by the Firefox browser itself.
 *
 * @see https://github.com/mozilla/addons-linter/blob/3bd6c3874185263ad025485e230dcbdb83517d7d/src/const.js#L103-L111
 */
export const MAX_FIREFOX_SIZE_BYTES = 4 * ONE_MB_IN_BYTES;

/**
 * Directory name for build output.
 */
export const BUILD_DIRNAME = 'build';

/**
 * Directory name for pages.
 */
export const PAGES_DIRNAME = 'pages';

/**
 * Directory name for vendors.
 */
export const VENDORS_DIRNAME = 'vendors';

/**
 * Directory name for shared output files.
 */
export const SHARED_DIRNAME = 'shared';

/**
 * File extension for zip archives.
 */
export const ZIP_EXTENSION = '.zip';

/**
 * Interface for bundle statistics.
 * Used to compare zipped and unzipped bundle sizes for each build target.
 */
export type BundleSizes = {
    /**
     * For comparing bundled zips (bytes)
     */
    zip: number;

    /**
     * For comparing unzipped files in pages/ folder (bytes)
     */
    pages: Record<string, number>;

    /**
     * For comparing unzipped files in vendors/ folder (bytes)
     */
    vendors: Record<string, number>;

    /**
     * For comparing unzipped files in shared/ folder (bytes)
     */
    shared: Record<string, number>;

    /**
     * For comparing unzipped (raw) files in folder (bytes).
     */
    raw?: number;
};

/**
 * Contains the bundle size for a specific target.
 * Includes stats, version, and last update timestamp.
 */
export type TargetInfo = {
    /**
     * Contains info about each entry point and zip.
     */
    stats: BundleSizes;

    /**
     * Contains package.json version of the last check.
     */
    version: string;

    /**
     * Contains the date of the last check (ISO string).
     */
    updatedAt: string;
};

/**
 * Describes sizes for all builds and targets.
 * Top-level mapping for .bundle-sizes.json.
 */
export type SizesFile = {
    [buildType in BuildTargetEnv]: {
        [target in Browser]: TargetInfo;
    };
};

/**
 * Type for dependencies from pnpm why --json
 */
export type Dependency = {
    [packageName: string]: unknown;
};

/**
 * Parameters for the checkBundleSizes function.
 */
export type CheckBundleSizesParams = {
    buildEnv: BuildTargetEnv;
    targetBrowser?: Browser;
    threshold: number;
};
