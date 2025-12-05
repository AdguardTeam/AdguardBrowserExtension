/**
 * Copyright (c) 2015-2025 Adguard Software Ltd.
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

import { type AriaAttributes, type DOMAttributes } from 'react';

declare module 'react' {
    interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
        /**
         * Indicates that the browser will ignore this element and its descendants,
         * preventing some interactions and hiding it from assistive technology.
         *
         * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/inert
         * @see https://github.com/facebook/react/pull/24730
         *
         * TODO: Remove this stub declaration after updating react to newer version.
         */
        inert?: '';
    }
}
