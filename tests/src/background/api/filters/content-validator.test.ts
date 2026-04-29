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
    describe,
    expect,
    it,
} from 'vitest';

import { isHtmlContent } from '../../../../../Extension/src/background/api/filters/content-validator';

describe('isHtmlContent', () => {
    describe('rejects HTML documents', () => {
        it('standard HTML with DOCTYPE', () => {
            const lines = [
                '<!DOCTYPE html>',
                '<html lang="en">',
                '<head>',
                '<meta charset="utf-8">',
                '<title>Example</title>',
                '</head>',
                '<body>',
                '<h1>Hello</h1>',
                '</body>',
                '</html>',
            ];
            expect(isHtmlContent(lines)).toBe(true);
        });

        it('minified HTML', () => {
            const lines = [
                '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Test</title></head><body></body></html>',
            ];
            expect(isHtmlContent(lines)).toBe(true);
        });

        it('HTML with leading blank lines', () => {
            const lines = [
                '',
                '  ',
                '',
                '<!DOCTYPE html>',
                '<html>',
                '<head></head>',
                '<body></body>',
                '</html>',
            ];
            expect(isHtmlContent(lines)).toBe(true);
        });

        it('HTML with leading whitespace on DOCTYPE line', () => {
            const lines = [
                '   <!DOCTYPE html>',
                '<html>',
                '</html>',
            ];
            expect(isHtmlContent(lines)).toBe(true);
        });

        it('HTML without DOCTYPE (starts with <html>)', () => {
            const lines = [
                '<html>',
                '<head></head>',
                '<body></body>',
                '</html>',
            ];
            expect(isHtmlContent(lines)).toBe(true);
        });

        it('HTML starting with <head>', () => {
            const lines = [
                '<head>',
                '<meta charset="utf-8">',
                '</head>',
            ];
            expect(isHtmlContent(lines)).toBe(true);
        });

        it('HTML starting with <meta>', () => {
            const lines = [
                '<meta http-equiv="Content-Type" content="text/html; charset=utf-8">',
                '<html>',
                '</html>',
            ];
            expect(isHtmlContent(lines)).toBe(true);
        });

        it('case-insensitive DOCTYPE', () => {
            const lines = [
                '<!doctype HTML>',
                '<HTML>',
                '</HTML>',
            ];
            expect(isHtmlContent(lines)).toBe(true);
        });

        it('HTML with BOM character in first line', () => {
            // BOM is a zero-width character, but after trim the line starts
            // with the BOM then <!DOCTYPE. We check that BOM + DOCTYPE is
            // handled. In practice, filters-downloader may strip BOM, but
            // in case it doesn't, we still detect the <html> on the next line.
            const lines = [
                '\uFEFF<!DOCTYPE html>',
                '<html>',
                '</html>',
            ];
            // BOM + <!DOCTYPE should still match since trim doesn't strip BOM,
            // but <html> on the next line will match.
            // Actually \uFEFF + <!doctype won't start with <!doctype, but
            // <html on line 2 will match.
            expect(isHtmlContent(lines)).toBe(true);
        });

        it('GitHub repository page', () => {
            const lines = [
                '',
                '',
                '<!DOCTYPE html>',
                '<html',
                '  lang="en"',
                '  data-color-mode="auto"',
                '>',
                '<head>',
                '  <meta charset="utf-8">',
                '  <link rel="dns-prefetch" href="https://github.githubassets.com">',
            ];
            expect(isHtmlContent(lines)).toBe(true);
        });
    });

    describe('accepts valid filter lists', () => {
        it('filter list with standard header', () => {
            const lines = [
                '! Title: My Filter List',
                '! Description: A custom filter list',
                '! Homepage: https://example.com',
                '! Version: 1.0.0',
                '||ads.example.com^',
                '||tracking.example.com^',
            ];
            expect(isHtmlContent(lines)).toBe(false);
        });

        it('filter list with Adblock Plus header', () => {
            const lines = [
                '[Adblock Plus 2.0]',
                '! Title: EasyList',
                '||ads.example.com^',
            ];
            expect(isHtmlContent(lines)).toBe(false);
        });

        it('filter list without any header (just rules)', () => {
            const lines = [
                '||ads.example.com^',
                '||tracking.example.com^',
                '@@||allowed.example.com^',
                'example.com##.ad-banner',
            ];
            expect(isHtmlContent(lines)).toBe(false);
        });

        it('filter with $replace rules containing HTML tokens', () => {
            const lines = [
                '! Title: Replace Rules Filter',
                '||example.com^$replace=/<!DOCTYPE html>/<!DOCTYPE html><script>window.ag=1</script>/i',
                '||example.com^$replace=/<html>/<html data-injected>/i',
                '||example.com^$replace=/<head>/<head><style>.ad{display:none}</style>/i',
            ];
            expect(isHtmlContent(lines)).toBe(false);
        });

        it('filter with #%# scriptlets containing HTML tokens', () => {
            const lines = [
                '! Title: Scriptlet Filter',
                'example.com#%#//scriptlet("set-constant", "document.body.innerHTML", "<html><body></body></html>")',
                'example.com#%#//scriptlet("abort-on-property-read", "document.head")',
            ];
            expect(isHtmlContent(lines)).toBe(false);
        });

        it('filter with $$ HTML filtering rules', () => {
            const lines = [
                '! Title: HTML Filter',
                'example.com$$script[tag-content="adblock"]',
                'example.com$$div[id="ad-container"]',
            ];
            expect(isHtmlContent(lines)).toBe(false);
        });

        it('comment-only filter', () => {
            const lines = [
                '! This is a comment-only filter list',
                '! Version: 1.0',
                '! Last modified: 2026-01-01',
            ];
            expect(isHtmlContent(lines)).toBe(false);
        });

        it('empty content', () => {
            expect(isHtmlContent([])).toBe(false);
        });

        it('single-rule filter', () => {
            const lines = ['||ads.example.com^'];
            expect(isHtmlContent(lines)).toBe(false);
        });

        it('filter list with CSS selectors containing HTML tags', () => {
            const lines = [
                '! Title: CSS Selector Filter',
                'example.com##div[srcdoc^="<html>"]',
                'example.com##iframe[src*="<head>"]',
            ];
            expect(isHtmlContent(lines)).toBe(false);
        });

        it('only whitespace lines', () => {
            const lines = ['', '  ', '\t', '   '];
            expect(isHtmlContent(lines)).toBe(false);
        });
    });
});
