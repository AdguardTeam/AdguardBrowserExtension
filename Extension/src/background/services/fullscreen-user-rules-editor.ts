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
import { notifier } from '../notifier';
import { NotifierType } from '../../common/constants';

/**
 * Module used to keep track of userrules editor opened in the fullscreen mode.
 */
class FullscreenUserRulesEditor {
    private openPagesCount = 0;

    /**
     * Increases number of opened pages.
     */
    onOpenPage(): void {
        this.openPagesCount += 1;
        this.onPagesCountChanged();
    }

    /**
     * Decreases number of opened pages.
     */
    onClosePage(): void {
        if (this.openPagesCount <= 0) {
            return;
        }
        this.openPagesCount -= 1;
        this.onPagesCountChanged();
    }

    /**
     * Notifies listeners of changes in the open page counter.
     */
    onPagesCountChanged(): void {
        notifier.notifyListeners(NotifierType.FullscreenUserRulesEditorUpdated, this.isOpen());
    }

    /**
     * If there is more than one open page, the editor is open. Otherwise it is closed.
     *
     * @returns Status of editor.
     */
    isOpen(): boolean {
        return this.openPagesCount > 0;
    }
}

export const fullscreenUserRulesEditor = new FullscreenUserRulesEditor();
