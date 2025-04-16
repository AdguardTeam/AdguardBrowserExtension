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

// Constants

/**
 * 10% threshold for bundle size changes and each entry point size.
 * Used as the default allowed percentage increase.
 */
export const DEFAULT_SIZE_THRESHOLD = 10;

/**
 * Special value to skip size checks.
 */
export const SKIP_SIZE_CHECK_VALUE = '-1';

/**
 * 30MB limit for MV3, selected heuristically (by CTO).
 * Enforced for Chrome MV3 builds.
 */
export const MAX_MV3_SIZE_BYTES = 30 * 1024 * 1024;

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
 * File extension for zip archives.
 */
export const ZIP_EXTENSION = '.zip';

// Types

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
