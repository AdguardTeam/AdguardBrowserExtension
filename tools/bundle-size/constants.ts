/**
 * @file Bundle size constants and types
 * Shared constants and types for the bundle size monitoring system
 */
import type { Browser, BuildTargetEnv } from '../constants';

// Constants
export const DEFAULT_SIZE_THRESHOLD = 10; // 10% threshold
export const SKIP_SIZE_CHECK_VALUE = '-1';
export const MAX_MV3_SIZE_BYTES = 30 * 1024 * 1024; // 30MB limit for MV3
export const BUILD_DIRNAME = 'build';
export const PAGES_DIRNAME = 'pages';
export const VENDORS_DIRNAME = 'vendors';
export const ZIP_EXTENSION = '.zip';

// Types

/**
 * Interface for bundle statistics
 */
export type BundleSizes = {
    /**
     * For comparing bundled zips
     */
    zip: number;

    /**
     * For comparing unzipped files in pages/ folder
     */
    pages: Record<string, number>;

    /**
     * For comparing unzipped files in vendors/ folder
     */
    vendors: Record<string, number>;
};

/**
 * Contains the bundle size for a specific target
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
     * Contains the date of the last check.
     */
    updatedAt: string;
};

/**
 * Describes sizes for all builds and targets
 */
export type SizesFile = {
    [buildType in BuildTargetEnv]: {
        [target in Browser]: TargetInfo;
    };
};
