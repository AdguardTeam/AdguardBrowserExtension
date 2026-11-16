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
 * Release channel derived from the release tag.
 */
export enum ReleaseChannel {
    Release = 'release',
    Beta = 'beta',
}

/**
 * Parsed 4-component extension version: the store-facing manifest/build version.
 *
 * The fourth component is the monotonic build number allocated by the release
 * process. It is not part of the git tag, which is semver.
 */
export type ExtensionVersion = {
    major: number;
    minor: number;
    patch: number;
    /**
     * Monotonic build number, the fourth component of the manifest version.
     */
    build: number;
    channel: ReleaseChannel;
};

/**
 * Parsed package.json version. The package version has no release channel.
 */
export type PackageVersion = Omit<ExtensionVersion, 'channel'>;

/**
 * Parsed semver release tag: `v<major>.<minor>.<patch>` for a release or
 * `v<major>.<minor>.<patch>-beta.<n>` for a beta.
 */
export type ReleaseTag = {
    major: number;
    minor: number;
    patch: number;
    channel: ReleaseChannel;
    /**
     * Pre-release number of the `-beta.<n>` suffix; undefined for release tags.
     */
    betaNumber?: number;
};

/**
 * Human-readable description of the accepted semver tag format.
 */
const TAG_FORMAT_HINT = 'v<major>.<minor>.<patch>[-beta.<n>] (e.g. v5.6.0 or v5.6.0-beta.7)';

/**
 * Human-readable description of the accepted 4-component manifest format.
 */
const MANIFEST_FORMAT_HINT = 'v<major>.<minor>.<patch>.<build>[-beta] (e.g. v5.6.0.7 or v5.6.0.7-beta)';

/**
 * Matches the 4-component extension version used in the manifest, in
 * build.txt, and in the CHANGELOG heading:
 * `v<major>.<minor>.<patch>.<build>` with an optional `-beta` suffix. The `v`
 * prefix is optional.
 */
const VERSION_RE = /^v?(\d+)\.(\d+)\.(\d+)\.(\d+)(-beta)?$/;

/**
 * Parses a semver release tag into its components.
 *
 * @param input Release tag, e.g. `v5.6.0` or `v5.6.0-beta.7`.
 *
 * @returns Parsed release tag.
 *
 * @throws Error when the input is not a release tag in the expected format.
 */
export const parseReleaseTag = (input: string): ReleaseTag => {
    // semver's strict parser rejects leading zeros but accepts build metadata.
    // Reject build metadata explicitly because release tags do not allow it.
    const parsed = parse(input);
    if (!parsed || parsed.build.length > 0) {
        throw new Error(`Invalid release tag: "${input}". Expected format: ${TAG_FORMAT_HINT}`);
    }

    const [prereleaseType, prereleaseNumber, ...extraPrereleaseIdentifiers] = parsed.prerelease;
    if (parsed.prerelease.length === 0) {
        return {
            major: parsed.major,
            minor: parsed.minor,
            patch: parsed.patch,
            channel: ReleaseChannel.Release,
        };
    }

    if (
        prereleaseType !== 'beta'
        || typeof prereleaseNumber !== 'number'
        || extraPrereleaseIdentifiers.length > 0
    ) {
        throw new Error(`Invalid release tag: "${input}". Expected format: ${TAG_FORMAT_HINT}`);
    }

    return {
        major: parsed.major,
        minor: parsed.minor,
        patch: parsed.patch,
        channel: ReleaseChannel.Beta,
        betaNumber: prereleaseNumber,
    };
};

/**
 * Parses a 4-component extension version into its components.
 *
 * @param input Version string, e.g. `5.6.0.7` or `5.6.0.7-beta`.
 *
 * @returns Parsed version.
 *
 * @throws Error when the input does not match the expected format.
 */
export const parseExtensionVersion = (input: string): ExtensionVersion => {
    const match = input.match(VERSION_RE);
    if (!match) {
        throw new Error(`Invalid extension version: "${input}". Expected format: ${MANIFEST_FORMAT_HINT}`);
    }
    const [, major, minor, patch, build, beta] = match;
    return {
        major: Number(major),
        minor: Number(minor),
        patch: Number(patch),
        build: Number(build),
        channel: beta ? ReleaseChannel.Beta : ReleaseChannel.Release,
    };
};

/**
 * Parses the package.json version into the current extension version. The
 * package.json version carries the monotonic build counter in its build
 * metadata (`major.minor.patch+<build>.build.<dnrPatch>`), so it is the
 * default source of truth for the next build number.
 *
 * @param packageVersion package.json version string.
 *
 * @returns Parsed package version without a release channel.
 *
 * @throws Error when the package version cannot be parsed or its build
 * metadata does not follow the expected format.
 */
export const parsePackageVersion = (packageVersion: string): PackageVersion => {
    const parsed = parse(packageVersion);
    if (!parsed) {
        throw new Error(`Cannot parse package version: ${packageVersion}`);
    }
    // Enforce the same major.minor.patch+build.build.<dnrPatch> contract as
    // tools/increment.ts, so a malformed version is rejected instead of being
    // silently read as a valid build number.
    const { build } = parsed;
    if (!build || build.length !== 3) {
        throw new Error(`Invalid build format in package version: ${packageVersion}. Expected format: major.minor.patch+build.build.dnrVersion`);
    }
    const [buildNumberStr, buildMetatag, dnrVersionStr] = build;
    if (!buildNumberStr || !/^\d+$/.test(buildNumberStr) || buildMetatag !== 'build' || !dnrVersionStr) {
        throw new Error(`Invalid build format in package version: ${packageVersion}. Expected format: major.minor.patch+build.build.dnrVersion`);
    }
    return {
        major: parsed.major,
        minor: parsed.minor,
        patch: parsed.patch,
        build: Number(buildNumberStr),
    };
};

/**
 * Formats the version as it appears in the extension manifest and build.txt:
 * major.minor.patch.build (e.g. `5.6.0.7`).
 *
 * @param version Parsed version.
 *
 * @returns Manifest-formatted version string.
 */
export const formatManifestVersion = (version: ExtensionVersion): string => {
    return `${version.major}.${version.minor}.${version.patch}.${version.build}`;
};

/**
 * Formats the version as it appears in the CHANGELOG heading: the 4-component
 * version with the `-beta` suffix for the beta channel (e.g. `5.6.0.1-beta`).
 *
 * @param version Parsed version.
 *
 * @returns Heading-formatted version string.
 */
export const formatHeadingVersion = (version: ExtensionVersion): string => {
    const manifestVersion = formatManifestVersion(version);
    return version.channel === ReleaseChannel.Beta ? `${manifestVersion}-beta` : manifestVersion;
};

/**
 * Formats the semver git tag for the version: `v5.6.0` for a release or
 * `v5.6.0-beta.7` for a beta. The build number is part of the manifest only
 * and is not included in the tag, except as the beta pre-release number.
 *
 * @param version Parsed version.
 *
 * @returns Semver git tag string.
 */
export const formatTag = (version: ExtensionVersion): string => {
    const base = `v${version.major}.${version.minor}.${version.patch}`;
    return version.channel === ReleaseChannel.Beta ? `${base}-beta.${version.build}` : base;
};

/**
 * Allocates a version for the requested release tag.
 *
 * The allocated build defaults to the next package.json counter. An explicit
 * override can allocate a higher build when another release branch has a
 * higher counter. Beta tags must contain the allocated build number.
 *
 * @param tag Parsed release tag.
 * @param currentPackageVersion Current package.json version string.
 * @param buildOverride Optional explicit build number.
 *
 * @returns Allocated extension version.
 *
 * @throws Error when the override is not greater than the current build or the
 * beta number differs from the allocated build.
 */
export const allocateVersion = (
    tag: ReleaseTag,
    currentPackageVersion: string,
    buildOverride?: number,
): ExtensionVersion => {
    const current = parsePackageVersion(currentPackageVersion);
    if (
        buildOverride !== undefined
        && (!Number.isInteger(buildOverride) || buildOverride <= current.build)
    ) {
        throw new Error(
            `Build override must be an integer greater than the current package build ${current.build}, got ${buildOverride}`,
        );
    }

    const version: ExtensionVersion = {
        major: tag.major,
        minor: tag.minor,
        patch: tag.patch,
        build: buildOverride ?? current.build + 1,
        channel: tag.channel,
    };

    if (tag.channel === ReleaseChannel.Beta && tag.betaNumber !== version.build) {
        const buildSource = buildOverride === undefined
            ? `package.json build ${current.build} + 1`
            : `explicit build override ${buildOverride}`;
        throw new Error(
            `The beta tag must use the allocated build number: expected ${formatTag(version)} `
            + `(${buildSource}), got beta number ${tag.betaNumber}`,
        );
    }

    return version;
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
 * dnr-rulesets patch: major.minor.patch+<build>.build.<dnrPatchVersion>.
 *
 * @param version Parsed version.
 * @param dnrPatchVersion Patch component of the dnr-rulesets version.
 *
 * @returns package.json version string.
 */
export const composePackageVersion = (version: ExtensionVersion, dnrPatchVersion: string): string => {
    return `${version.major}.${version.minor}.${version.patch}+${version.build}.build.${dnrPatchVersion}`;
};

/**
 * Compares two versions component by component. For equal
 * major.minor.patch the channels are compared first, so a `beta` is strictly
 * older than a `release` of the same major.minor.patch (e.g.
 * `v5.6.0-beta.7` < `v5.6.0`), and only versions of the same channel are
 * compared by build number.
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
    if (a.channel !== b.channel) {
        return a.channel === ReleaseChannel.Release ? 1 : -1;
    }
    return a.build - b.build;
};

/**
 * Parsed tag used for ordering: the original tag name and a 4-component
 * version shape. Semver tags are marked so their channel ordering (release
 * after beta of the same version) is preserved, while legacy 4-component tags
 * keep the pre-migration ordering by build number.
 */
type ComparableTag = {
    tag: string;
    major: number;
    minor: number;
    patch: number;
    build: number;
    channel: ReleaseChannel;
    semver: boolean;
};

/**
 * Parses a tag as a semver release tag or, when it is a legacy 4-component
 * tag, into the 4-component shape.
 *
 * @param tag Tag name.
 *
 * @returns Comparable tag, or `undefined` when the tag is not a release tag.
 */
const parseComparableTag = (tag: string): ComparableTag | undefined => {
    try {
        const release = parseReleaseTag(tag);
        return {
            tag,
            major: release.major,
            minor: release.minor,
            patch: release.patch,
            build: release.betaNumber ?? 0,
            channel: release.channel,
            semver: true,
        };
    } catch {
        try {
            const legacy = parseExtensionVersion(tag);
            return {
                tag,
                major: legacy.major,
                minor: legacy.minor,
                patch: legacy.patch,
                build: legacy.build,
                channel: legacy.channel,
                semver: false,
            };
        } catch {
            return undefined;
        }
    }
};

/**
 * Compares two comparable tags.
 *
 * Semver tags use the same channel-first order as `compareExtensionVersions`.
 * Legacy 4-component tags keep their pre-migration order, where the build
 * number decides before the channel. For the same major.minor.patch a semver
 * tag is newer than a legacy tag, so the migration order is total and
 * transitive.
 *
 * @param a First tag.
 * @param b Second tag.
 *
 * @returns Negative when a < b, zero when equal, positive when a > b.
 */
const compareComparableTags = (a: ComparableTag, b: ComparableTag): number => {
    if (a.major !== b.major) {
        return a.major - b.major;
    }
    if (a.minor !== b.minor) {
        return a.minor - b.minor;
    }
    if (a.patch !== b.patch) {
        return a.patch - b.patch;
    }
    if (a.semver !== b.semver) {
        return a.semver ? 1 : -1;
    }
    if (a.semver) {
        return compareExtensionVersions(a, b);
    }
    if (a.build !== b.build) {
        return a.build - b.build;
    }
    if (a.channel !== b.channel) {
        return a.channel === ReleaseChannel.Release ? 1 : -1;
    }
    return 0;
};

/**
 * Selects the tag to compare the given release with in the CHANGELOG link.
 *
 * The tag must be older than the target. A release compares with the highest
 * older release tag; a beta compares with the highest older beta on the same
 * major.minor.patch line. When no such tag exists, the highest older tag of
 * any channel is used. Legacy 4-component tags participate in the ordering and
 * are returned unchanged.
 *
 * @param tags Tag names to search, e.g. the output of `git ls-remote`.
 * @param target Release tag that is being prepared.
 *
 * @returns Tag name to use as the compare base, or `undefined` when no tag is
 * older than the target.
 */
export const selectPreviousTag = (tags: string[], target: ReleaseTag): string | undefined => {
    const targetComparable: ComparableTag = {
        tag: '',
        major: target.major,
        minor: target.minor,
        patch: target.patch,
        build: target.betaNumber ?? 0,
        channel: target.channel,
        semver: true,
    };

    const candidates = tags
        .map(parseComparableTag)
        .filter((candidate): candidate is ComparableTag => candidate !== undefined)
        .filter((candidate) => compareComparableTags(candidate, targetComparable) < 0);

    if (candidates.length === 0) {
        return undefined;
    }

    const previousBeta = candidates.filter((candidate) => (
        candidate.channel === ReleaseChannel.Beta
        && candidate.major === target.major
        && candidate.minor === target.minor
        && candidate.patch === target.patch
    ));

    const previousRelease = candidates.filter((candidate) => candidate.channel === ReleaseChannel.Release);

    let pool = candidates;
    if (target.channel === ReleaseChannel.Beta && previousBeta.length > 0) {
        pool = previousBeta;
    } else if (target.channel === ReleaseChannel.Release && previousRelease.length > 0) {
        pool = previousRelease;
    }

    return pool.reduce((latest, candidate) => (
        compareComparableTags(candidate, latest) > 0 ? candidate : latest
    )).tag;
};

/**
 * Checks that a candidate version is newer than the version stored in the
 * current package.json.
 *
 * The package version carries the monotonic build counter (`build[0]`) but no
 * channel, so the candidate channel is used for both sides of the comparison:
 * the counter only grows, and a beta must not be prepared for a
 * major.minor.patch that is already below the current one.
 *
 * @param candidate Candidate release version.
 * @param currentPackageVersion Current package.json version string.
 *
 * @returns True when the candidate is newer.
 *
 * @throws Error when the package version cannot be parsed.
 */
export const isNewerVersion = (
    candidate: ExtensionVersion,
    currentPackageVersion: string,
): boolean => {
    const current: ExtensionVersion = {
        ...parsePackageVersion(currentPackageVersion),
        channel: candidate.channel,
    };
    return compareExtensionVersions(candidate, current) > 0;
};
