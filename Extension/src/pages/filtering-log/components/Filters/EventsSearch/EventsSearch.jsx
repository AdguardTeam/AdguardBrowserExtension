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

import React, {
    useContext,
    useEffect,
    useRef,
} from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../../stores/RootStore';
import { translator } from '../../../../../common/translators/translator';
import { Search } from '../../Search';
import { UserAgent } from '../../../../../common/user-agent';

const EventsSearch = observer(() => {
    const { logStore } = useContext(rootStore);

    const changeHandler = (value) => {
        logStore.setEventsSearchValue(value);
    };

    const inputRef = useRef(null);

    useEffect(() => {
        const input = inputRef.current;
        if (!input) {
            return;
        }

        const handleKeyDown = (e) => {
            const modifierKeyProperty = UserAgent.isMacOs ? 'metaKey' : 'ctrlKey';

            if (e[modifierKeyProperty] && e.code === 'KeyF') {
                e.preventDefault();
                input.focus();
                input.select();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    return (
        <Search
            onChange={changeHandler}
            value={logStore.eventsSearchValue}
            placeholder={translator.getMessage('filtering_log_search_string')}
            aria-keyshortcuts={UserAgent.isMacOs ? 'Meta+F' : 'Ctrl+F'}
            ref={inputRef}
        />
    );
});

export { EventsSearch };
