/**
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
import { listeners } from '../notifier';
import { NotifierType } from '../../common/constants';

/**
 * Module used to keep track of userrules editor opened in the fullscreen mode
 */
class FullscreenUserRulesEditor {
    openPagesCount = 0;

    onOpenPage(): void {
        this.openPagesCount += 1;
        this.onPagesCountChanged();
    }

    onClosePage(): void {
        if (this.openPagesCount <= 0) {
            return;
        }
        this.openPagesCount -= 1;
        this.onPagesCountChanged();
    }

    onPagesCountChanged(): void {
        listeners.notifyListeners(NotifierType.FullscreenUserRulesEditorUpdated, this.isOpen());
    }

    isOpen(): boolean {
        return this.openPagesCount > 0;
    }
}

export const fullscreenUserRulesEditor = new FullscreenUserRulesEditor();
