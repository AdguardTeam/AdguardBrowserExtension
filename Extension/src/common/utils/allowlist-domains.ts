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
import { parse } from 'tldts';

import { WILDCARD_SUBDOMAIN_PREFIX, WILDCARD_TLD_SUFFIX } from '../constants';

/**
 * Result of normalizing allowlist domains from user input.
 */
export type NormalizeAllowlistDomainsResult = {
    /**
     * Normalized domain strings ready for storage.
     */
    domains: string[];

    /**
     * Raw entries that could not be resolved to a valid domain.
     */
    invalidEntries: string[];
};

/**
 * Normalizes a single allowlist entry by extracting the hostname from URL-like
 * strings, preserving wildcard patterns, and stripping `www.` prefixes.
 *
 * @param entry Raw user input line.
 *
 * @returns Normalized domain string, empty string for blank lines,
 * or `null` if the entry is invalid.
 */
export const normalizeAllowlistEntry = (entry: string): string | null => {
    const trimmed = entry.trim();

    if (trimmed.length === 0) {
        return '';
    }

    // Detect wildcard prefix/suffix on the original entry.
    const isWildcardSubdomain = trimmed.startsWith(WILDCARD_SUBDOMAIN_PREFIX);
    const isWildcardTld = trimmed.endsWith(WILDCARD_TLD_SUFFIX);

    // Strip wildcard markers to isolate the domain part for validation.
    let domainPart = trimmed;
    if (isWildcardSubdomain) {
        domainPart = domainPart.substring(WILDCARD_SUBDOMAIN_PREFIX.length);
    }
    if (isWildcardTld) {
        domainPart = domainPart.substring(0, domainPart.length - WILDCARD_TLD_SUFFIX.length);
    }

    // `*.*` — both flags true, domain part is empty → valid full wildcard.
    if (isWildcardSubdomain && isWildcardTld && domainPart.length === 0) {
        return trimmed;
    }

    // Bare `*` — no flags set, but entire input is `*` → invalid no-op.
    if (trimmed === '*') {
        return null;
    }

    // Validate the domain part with tldts.
    const { hostname, domain, isIp } = parse(domainPart);

    if (!hostname) {
        return null;
    }

    // Reconstruct wildcard entry with validated domain (no www stripping).
    if (isWildcardSubdomain || isWildcardTld) {
        const prefix = isWildcardSubdomain ? WILDCARD_SUBDOMAIN_PREFIX : '';
        const suffix = isWildcardTld ? WILDCARD_TLD_SUFFIX : '';
        return `${prefix}${hostname}${suffix}`;
    }

    // Reject bare TLDs (e.g., "com", ".com") and single-label hostnames.
    // tldts returns domain=null for bare TLDs and invalid single-label hostnames.
    // Allow: localhost, IP addresses, and entries with a valid domain.
    if (hostname !== 'localhost' && !isIp && !domain) {
        return null;
    }

    // Strip `www.` prefix only for non-wildcard entries,
    // consistent with tswebextension's Allowlist.configure().
    if (hostname.startsWith('www.')) {
        return hostname.substring(4);
    }

    return hostname;
};

/**
 * Normalizes allowlist editor content by splitting into lines, extracting
 * domains from URL-like entries, preserving wildcards, and collecting invalid
 * entries.
 *
 * @param value Raw editor content (newline-separated).
 *
 * @returns Object with `domains` (valid, normalized) and `invalidEntries` (raw invalid lines).
 */
export const normalizeAllowlistDomains = (value: string): NormalizeAllowlistDomainsResult => {
    const lines = value.split(/[\r\n]+/);
    const domains: string[] = [];
    const invalidEntries: string[] = [];

    for (const line of lines) {
        const result = normalizeAllowlistEntry(line);

        if (result === null) {
            invalidEntries.push(line.trim());
        } else if (result.length > 0) {
            domains.push(result);
        }
        // Empty strings (blank lines) are silently dropped.
    }

    return { domains, invalidEntries };
};

/**
 * Validates allowlist editor content and returns whether all entries are valid.
 *
 * @param value Raw editor content (newline-separated).
 *
 * @returns Object with `valid` boolean and `invalidEntries` array.
 */
export const validateAllowlistEntries = (value: string): {
    valid: boolean;
    invalidEntries: string[];
} => {
    const { invalidEntries } = normalizeAllowlistDomains(value);

    return {
        valid: invalidEntries.length === 0,
        invalidEntries,
    };
};
