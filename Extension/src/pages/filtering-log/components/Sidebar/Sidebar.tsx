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

import React, { useContext, type MouseEvent } from 'react';
import { observer } from 'mobx-react';

import cn from 'classnames';

import { MenuDropDown } from '../../../common/components/ui/MenuDropDown';
import { Icon } from '../../../common/components/ui/Icon';
import { rootStore } from '../../stores/RootStore';
import { translator } from '../../../../common/translators/translator';
import { optionsStorage } from '../../../options/options-storage';

import styles from './Sidebar.module.pcss';

const MenuButton = ({
    children,
    iconId,
    handler,
    colorClass,
}: {
    children: string;
    iconId: string;
    handler: (e: React.MouseEvent) => void;
    colorClass?: string;
}) => {
    return (
        <button
            type="button"
            className={styles.pageActionItem}
            onClick={handler}
        >
            <Icon
                id={iconId}
                aria-hidden="true"
                className={cn('icon--24', colorClass)}
            />
            {children}
        </button>
    );
};

export const Sidebar = observer(() => {
    const { logStore, wizardStore } = useContext(rootStore);
    const { preserveLogEnabled } = logStore;
    const shouldShowPreserveLogModal = optionsStorage.getItem(optionsStorage.KEYS.SHOW_PRESERVE_LOG_MODAL);

    const clearLogHandler = async (e: MouseEvent) => {
        e.preventDefault();
        await logStore.clearFilteringEvents();
    };

    const refreshPage = async (e: MouseEvent) => {
        e.preventDefault();
        await logStore.refreshPage();
        if (!preserveLogEnabled) {
            await wizardStore.closeModal();
        }
    };

    const preserveLogHandler = (e: MouseEvent) => {
        if (shouldShowPreserveLogModal && !preserveLogEnabled) {
            logStore.setIsPreserveLogModalOpen(true);
        } else {
            logStore.setPreserveLog(!preserveLogEnabled);
        }
    };

    return (
        <div className={styles.sidebar}>
            <MenuDropDown className={styles.menuDropDown}>
                <MenuButton
                    handler={refreshPage}
                    iconId="#reload"
                    colorClass="icon--green-default"
                >
                    {translator.getMessage('filtering_refresh_tab_short_mobile')}
                </MenuButton>
                <MenuButton
                    handler={() => logStore.setIsCustomizeModalOpen(true)}
                    iconId="#customize"
                >
                    {translator.getMessage('filtering_menu_open_filters')}
                </MenuButton>
                <MenuButton
                    handler={preserveLogHandler}
                    iconId="#record"
                    colorClass={preserveLogEnabled ? 'icon--red-default' : 'icon--gray-default'}
                >
                    {preserveLogEnabled
                        ? translator.getMessage('filtering_log_preserve_log_on')
                        : translator.getMessage('filtering_log_preserve_log_off')}
                </MenuButton>
                <MenuButton
                    handler={clearLogHandler}
                    iconId="#trash"
                    colorClass="icon--red-default"
                >
                    {translator.getMessage('filtering_clear_log_events')}
                </MenuButton>
            </MenuDropDown>
        </div>
    );
});
