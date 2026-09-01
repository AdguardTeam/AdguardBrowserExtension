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

import { parse } from 'semver';

import { getVersion } from '@adguard/dnr-rulesets/utils';

/**
 * Release channel derived from the version tag.
 */
export type ReleaseChannel = 'beta' | 'release';

/**
 * Parsed 4-component extension version.
 */
export type ExtensionVersion = {
    major: number;
    minor: number;
    patch: number;
    increment: number;
    channel: ReleaseChannel;
};

/**
 * Matches the extension release tag format: `v<major>.<minor>.<patch>.<increment>`
 * with an optional `-beta` suffix. The `v` prefix is optional.
 */
const VERSION_RE = /^v?(\d+)\.(\d+)\.(\d+)\.(\d+)(-beta)?$/;

/**
 * Parses an extension version tag into its components.
 *
 * @param input Version tag, e.g. `v5.6.0.1` or `v5.6.0.1-beta`.
 *
 * @returns Parsed version.
 *
 * @throws Error when the input does not match the expected format.
 */
export const parseExtensionVersion = (input: string): ExtensionVersion => {
    const match = input.match(VERSION_RE);
    if (!match) {
        throw new Error(
            `Invalid extension version: "${input}". Expected format: v<major>.<minor>.<patch>.<increment>[-beta] (e.g. v5.6.0.1 or v5.6.0.1-beta)`,
        );
    }
    const [, major, minor, patch, increment, beta] = match;
    return {
        major: Number(major),
        minor: Number(minor),
        patch: Number(patch),
        increment: Number(increment),
        channel: beta ? 'beta' : 'release',
    };
};

/**
 * Formats the version as it appears in the extension manifest and build.txt:
 * major.minor.patch.increment (e.g. `5.6.0.1`).
 *
 * @param version Parsed version.
 *
 * @returns Manifest-formatted version string.
 */
export const formatManifestVersion = (version: ExtensionVersion): string => {
    return `${version.major}.${version.minor}.${version.patch}.${version.increment}`;
};

/**
 * Formats the git tag for the version (e.g. `v5.6.0.1` or `v5.6.0.1-beta`).
 *
 * @param version Parsed version.
 *
 * @returns Git tag string.
 */
export const formatTag = (version: ExtensionVersion): string => {
    const base = `v${formatManifestVersion(version)}`;
    return version.channel === 'beta' ? `${base}-beta` : base;
};

/**
 * Returns the patch component of the @adguard/dnr-rulesets version, which is
 * stored as the last build-metadata component of the package.json version
 * (same logic as tools/increment.ts).
 *
 * @returns dnr-rulesets patch version.
 *
 * @throws Error when the dnr version cannot be parsed.
 */
export const getDnrPatchVersion = (): string => {
    const dnrVersion = getVersion();
    const parsedDnrVersion = parse(dnrVersion);
    if (!parsedDnrVersion) {
        throw new Error(`Cannot parse dnr version: ${dnrVersion}`);
    }
    return String(parsedDnrVersion.patch);
};

/**
 * Composes the package.json version string from the parsed version and the
 * dnr-rulesets patch: major.minor.patch+increment.build.<dnrPatchVersion>.
 *
 * @param version Parsed version.
 * @param dnrPatchVersion Patch component of the dnr-rulesets version.
 *
 * @returns package.json version string.
 */
export const composePackageVersion = (version: ExtensionVersion, dnrPatchVersion: string): string => {
    return `${version.major}.${version.minor}.${version.patch}+${version.increment}.build.${dnrPatchVersion}`;
};

/**
 * Compares two 4-component versions component by component. When the four
 * components are equal the channels are compared, so that a `beta` is strictly
 * older than the `release` with the same 4-component version. This allows the
 * documented beta -> release promotion flow (both channels ship on the same
 * 4-component version, e.g. `v5.5.0.5` and `v5.5.0.5-beta`).
 *
 * @param a First version.
 * @param b Second version.
 *
 * @returns Negative when a < b, zero when equal, positive when a > b.
 */
export const compareExtensionVersions = (a: ExtensionVersion, b: ExtensionVersion): number => {
    if (a.major !== b.major) {
        return a.major - b.major;
    }
    if (a.minor !== b.minor) {
        return a.minor - b.minor;
    }
    if (a.patch !== b.patch) {
        return a.patch - b.patch;
    }
    if (a.increment !== b.increment) {
        return a.increment - b.increment;
    }
    if (a.channel !== b.channel) {
        return a.channel === 'release' ? 1 : -1;
    }
    return 0;
};

/**
 * Checks that a candidate version is newer than the version stored in the
 * current package.json (compared via the 4-component form, i.e. the increment
 * is taken from the first build-metadata component).
 *
 * Because `beta` is treated as strictly older than `release` for equal
 * 4-component versions, a `release` candidate with the same components as a
 * previously published `beta` (e.g. preparing `v5.6.0.1` after `v5.6.0.1-beta`)
 * is considered newer and passes the check.
 *
 * @param candidate Candidate release version.
 * @param currentPackageVersion Current package.json version string.
 * @param currentChannel Channel of the last published version for the current
 * 4-component components, used to break ties. Defaults to `release`.
 *
 * @returns True when the candidate is newer.
 *
 * @throws Error when the package version cannot be parsed.
 */
export const isNewerVersion = (
    candidate: ExtensionVersion,
    currentPackageVersion: string,
    currentChannel: ReleaseChannel = 'release',
): boolean => {
    const parsed = parse(currentPackageVersion);
    if (!parsed) {
        throw new Error(`Cannot parse package version: ${currentPackageVersion}`);
    }
    // Enforce the same major.minor.patch+increment.build.<dnrPatch> contract as
    // tools/increment.ts, so a malformed version is rejected instead of being
    // silently read as a valid increment.
    const { build } = parsed;
    if (!build || build.length !== 3) {
        throw new Error(`Invalid build format in package version: ${currentPackageVersion}. Expected format: major.minor.patch+increment.build.dnrVersion`);
    }
    const [incrementStr, buildMetatag, dnrVersionStr] = build;
    if (!incrementStr || buildMetatag !== 'build' || !dnrVersionStr) {
        throw new Error(`Invalid build format in package version: ${currentPackageVersion}. Expected format: major.minor.patch+increment.build.dnrVersion`);
    }
    const increment = Number(incrementStr);
    if (Number.isNaN(increment)) {
        throw new Error(`Invalid increment version in package version: ${currentPackageVersion}`);
    }
    const current: ExtensionVersion = {
        major: parsed.major,
        minor: parsed.minor,
        patch: parsed.patch,
        increment,
        channel: currentChannel,
    };
    return compareExtensionVersions(candidate, current) > 0;
};
