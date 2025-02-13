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

import React, {
    useContext,
    useEffect,
    useRef,
} from 'react';
import { observer } from 'mobx-react';

import { translator } from '../../../../../common/translators/translator';
import { UserAgent } from '../../../../../common/user-agent';
import { Icon } from '../../../../common/components/ui/Icon';
import { rootStore } from '../../../stores/RootStore';

export const EventsSearch = observer(() => {
    const { logStore } = useContext(rootStore);

    const ref = useRef<HTMLInputElement>(null);
    const value = logStore.eventsSearchValue;

    useEffect(() => {
        const element = ref.current;
        if (!element) {
            return;
        }

        const handleKeyDown = (e: KeyboardEvent) => {
            const modifierKeyProperty = UserAgent.isMacOs ? 'metaKey' : 'ctrlKey';

            if (e[modifierKeyProperty] && e.code === 'KeyF') {
                e.preventDefault();
                element.focus();
                element.select();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    const changeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
        logStore.setEventsSearchValue(e.target.value);
    };

    const handleClear = () => {
        ref.current?.focus();
        logStore.setEventsSearchValue('');
    };

    return (
        <div className="search">
            <input
                ref={ref}
                type="text"
                className="search__input"
                placeholder={translator.getMessage('filtering_log_search_string')}
                onChange={changeHandler}
                value={value}
                autoComplete="off"
                aria-keyshortcuts={UserAgent.isMacOs ? 'Meta+K' : 'Ctrl+K'}
            />
            {value ? (
                <button
                    type="button"
                    className="button search__clear"
                    title={translator.getMessage('clear_button_title')}
                    onClick={handleClear}
                >
                    <Icon
                        id="#cross"
                        classname="icon--24 icon--gray-default"
                        aria-hidden="true"
                    />
                </button>
            ) : (
                <Icon
                    id="#magnifying"
                    classname="icon--24 icon--gray-default search__ico"
                    aria-hidden="true"
                />
            )}
        </div>
    );
});
