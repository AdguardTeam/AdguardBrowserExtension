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

import React, { useContext, forwardRef } from 'react';
import { observer } from 'mobx-react';

import { type SavingFSMStateType } from '../Editor/savingFSM';
import { SavingButton } from '../SavingButton';

import { userRulesEditorStore } from './UserRulesEditorStore';

type UserRulesSavingButtonParams = {
    /**
     * Click handler.
     */
    onClick: () => Promise<void>;
};

// Combine forwardRef with observer
const UserRulesSavingButtonImpl = forwardRef<HTMLButtonElement, UserRulesSavingButtonParams>(({ onClick }, ref) => {
    const store = useContext(userRulesEditorStore);

    return (
        <SavingButton
            ref={ref}
            onClick={onClick}
            contentChanged={store.userRulesEditorContentChanged}
            savingState={store.savingUserRulesState as SavingFSMStateType}
        />
    );
});

export const UserRulesSavingButton = observer(UserRulesSavingButtonImpl);
