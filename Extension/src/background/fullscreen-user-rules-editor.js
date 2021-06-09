import { listeners } from './notifier';
import { NOTIFIER_TYPES } from '../common/constants';

/**
 * Module used to keep track of userrules editor opened in the fullscreen mode
 */
class FullscreenUserRulesEditor {
    openPagesCount = 0;

    onOpenPage() {
        this.openPagesCount += 1;
        this.onPagesCountChanged();
    }

    onClosePage() {
        if (this.openPagesCount <= 0) {
            return;
        }
        this.openPagesCount -= 1;
        this.onPagesCountChanged();
    }

    onPagesCountChanged() {
        listeners.notifyListeners(NOTIFIER_TYPES.FULLSCREEN_USER_RULES_EDITOR_UPDATED, this.isOpen());
    }

    isOpen() {
        return this.openPagesCount > 0;
    }
}

export const fullscreenUserRulesEditor = new FullscreenUserRulesEditor();
