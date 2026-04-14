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
import { createContext } from 'react';

import { makeObservable, override } from 'mobx';

import { messenger } from '../../services/messenger';
import { getDynamicWarningMessage } from '../../common/utils/rules-limits-messages';

import { FullscreenUserRulesStore } from './FullscreenUserRulesStore';
/**
 * MV3-specific fullscreen user rules store.
 * Overrides checkLimitations with the real MV3 implementation.
 */
class FullscreenUserRulesStoreMv3 extends FullscreenUserRulesStore {
    constructor() {
        super();
        makeObservable(this);
    }

    /**
     * Checks MV3 rule limitations and shows a notification if dynamic rules
     * are over the limit.
     */
    @override
    override async checkLimitations(): Promise<void> {
        const currentLimitsMv3 = await messenger.getCurrentLimits();
        const dynamicWarning = currentLimitsMv3.dynamicRulesData
            ? getDynamicWarningMessage(currentLimitsMv3.dynamicRulesData)
            : null;
        if (dynamicWarning) {
            this.addRuleLimitsNotification(dynamicWarning);
        }
    }
}

export { FullscreenUserRulesStoreMv3 as FullscreenUserRulesStore };
/**
 * MV3 fullscreen user rules store context.
 * Uses the MV3 subclass with real checkLimitations.
 */
export const fullscreenUserRulesStore = createContext(new FullscreenUserRulesStoreMv3());
