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

import { useEffect } from 'react';

/**
 * The main use case for this hook is to trigger a browser-generated confirmation
 * dialog depending on `blockCondition` flag that asks users to confirm if they really
 * want to leave the page when they try to close or reload it,
 * or navigate somewhere else (by manually typing url in search bar).
 * This is intended to help prevent loss of unsaved data.
 *
 * @param shouldPreventUnload If true, blocks unload of page and show browser-generated dialog.
 * @param browserDialogMessage Custom message for browser-generated dialog (Browser support list: https://caniuse.com/mdn-api_beforeunloadevent_returnvalue). Keep in mind that some browsers can support custom messages, but in fact can ignore that value.
 */
export const usePreventUnload = (shouldPreventUnload: boolean, browserDialogMessage: string) => {
    useEffect(() => {
        const onBeforeUnload = (e: BeforeUnloadEvent) => {
            if (!shouldPreventUnload) {
                return;
            }

            e.preventDefault();
            e.returnValue = browserDialogMessage;
            return browserDialogMessage;
        };

        window.addEventListener('beforeunload', onBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', onBeforeUnload);
        };
    }, [shouldPreventUnload, browserDialogMessage]);
};
