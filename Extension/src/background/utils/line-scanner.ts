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
import { findNextLineBreakIndex } from '@adguard/tsurlfilter';

/**
 * Line scanner for iterating through lines in a string without creating an array.
 * Uses findNextLineBreakIndex from tsurlfilter for efficient line-by-line processing.
 */
export class LineScanner {
    private content: string;

    private currentIndex: number = 0;

    /**
     * Creates a new LineScanner instance.
     *
     * @param content The string content to scan.
     */
    constructor(content: string) {
        this.content = content;
    }

    /**
     * Returns the next line in the content, or null if no more lines are available.
     *
     * @returns The next line as a string, or null if at the end.
     */
    public nextLine(): string | null {
        // Empty content has no lines
        if (this.content.length === 0) {
            return null;
        }

        // Already processed all content
        if (this.currentIndex > this.content.length) {
            return null;
        }

        const [lbIndex, lbLength] = findNextLineBreakIndex(this.content, this.currentIndex);

        const line = this.content.slice(this.currentIndex, lbIndex);

        // If a line break was found, move past it
        // Otherwise, we're at the end
        if (lbIndex < this.content.length) {
            this.currentIndex = lbIndex + lbLength;
        } else {
            // No line break found, set to beyond content length to signal we're done
            this.currentIndex = this.content.length + 1;
        }

        return line;
    }

    /**
     * Checks if there are more lines to read.
     *
     * @returns True if there are more lines, false otherwise.
     */
    public hasNext(): boolean {
        if (this.content.length === 0) {
            return false;
        }
        return this.currentIndex <= this.content.length;
    }

    /**
     * Resets the scanner to the beginning of the content.
     */
    public reset(): void {
        this.currentIndex = 0;
    }

    /**
     * Returns an iterator for the scanner, allowing use in for...of loops.
     *
     * @yields Each line in the content.
     */
    public* [Symbol.iterator](): Iterator<string> {
        this.reset();
        let line = this.nextLine();
        while (line !== null) {
            yield line;
            line = this.nextLine();
        }
    }
}
