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

import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import cn from 'classnames';

import { translator } from '../../../../common/translators/translator';
import { rootStore } from '../../stores/RootStore';
import { Icon } from '../../../common/components/ui/Icon';
import { Popover } from '../../../common/components/ui/Popover';
import { EventsSearch } from '../Filters/EventsSearch';
import { TabSelector } from '../Filters/TabSelector';
import { optionsStorage } from '../../../options/options-storage';

import './actions.pcss';

const Actions = observer(() => {
    const { logStore, wizardStore } = useContext(rootStore);

    const { preserveLogEnabled } = logStore;

    const shouldShowPreserveLogModal = optionsStorage.getItem(optionsStorage.KEYS.SHOW_PRESERVE_LOG_MODAL);

    const clearLogHandler = async (e) => {
        e.preventDefault();
        await logStore.clearFilteringEvents();
    };

    const refreshPage = async (e) => {
        e.preventDefault();
        await logStore.refreshPage();
        if (!preserveLogEnabled) {
            await wizardStore.closeModal();
        }
    };

    const preserveLogHandler = (e) => {
        if (shouldShowPreserveLogModal && e.target.checked) {
            logStore.setIsPreserveLogModalOpen(true);
        } else {
            logStore.setPreserveLog(e.target.checked);
        }
    };

    const preserveLogClassName = cn(
        'record',
        { active: preserveLogEnabled },
    );

    const preserveLogTooltipText = preserveLogEnabled
        ? translator.getMessage('filtering_log_preserve_log_on')
        : translator.getMessage('filtering_log_preserve_log_off');

    const preserveLogInputId = 'preserveLog';

    return (
        <div className="actions">
            <div className="actions__col actions__tab-selector">
                <TabSelector />
            </div>
            <div className="actions__col actions__buttons">
                <div className="actions__action actions__preserve">
                    <input
                        className="checkbox-input"
                        type="checkbox"
                        name="preserveLog"
                        id={preserveLogInputId}
                        onChange={preserveLogHandler}
                        checked={preserveLogEnabled}
                        aria-label={translator.getMessage('filtering_log_preserve_log_on')}
                    />
                    {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
                    <label
                        htmlFor={preserveLogInputId}
                        className="checkbox-label"
                    >
                        <Popover text={preserveLogTooltipText}>
                            <div className={preserveLogClassName}>
                                <Icon
                                    id="#record"
                                    className="icon--24"
                                    aria-hidden="true"
                                />
                            </div>
                        </Popover>
                    </label>
                </div>
                <div className="actions__action">
                    <Popover text={translator.getMessage('filtering_clear_log_events')}>
                        <button
                            type="button"
                            className="actions__clear"
                            aria-label={translator.getMessage('filtering_clear_log_events')}
                            onClick={clearLogHandler}
                        >
                            <Icon
                                id="#trash"
                                className="icon--24 icon--red-default"
                                aria-hidden="true"
                            />
                        </button>
                    </Popover>
                </div>
                <div className="actions__action">
                    <button
                        className="actions__refresh"
                        type="button"
                        onClick={refreshPage}
                    >
                        <Icon
                            id="#reload"
                            className="icon--24 actions__refresh--icon"
                            aria-hidden="true"
                        />
                        <span className="actions__refresh--text">
                            {translator.getMessage('filtering_refresh_tab_short')}
                        </span>
                    </button>
                </div>
            </div>
            <div className="actions__col actions__search">
                <EventsSearch />
            </div>
        </div>
    );
});

export { Actions };
