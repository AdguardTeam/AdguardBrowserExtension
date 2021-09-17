import React, { useContext, useRef } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../../stores/RootStore';
import { Icon } from '../../../../common/components/ui/Icon';
import { reactTranslator } from '../../../../../common/translators/reactTranslator';

import './events-search.pcss';

const EventsSearch = observer(() => {
    const { logStore } = useContext(rootStore);

    const searchInputRef = useRef();

    const onSubmit = (e) => {
        e.preventDefault();
    };

    const changeHandler = (e) => {
        logStore.setEventsSearchValue(e.currentTarget.value);
    };

    const handleClear = () => {
        logStore.setEventsSearchValue('');
        searchInputRef.current.focus();
    };

    return (
        <form
            className="events-search"
            onSubmit={onSubmit}
        >
            {logStore.eventsSearchValue
                ? (
                    <button
                        type="button"
                        className="events-search__clear"
                        onClick={handleClear}
                    >
                        <Icon id="#cross" classname="events-search__cross" />
                    </button>
                )
                : <Icon id="#magnifying" classname="events-search__ico" />}
            <input
                type="text"
                id="events-search"
                name="events-search"
                placeholder={reactTranslator.getMessage('filtering_log_search_string')}
                ref={searchInputRef}
                onChange={changeHandler}
                value={logStore.eventsSearchValue}
            />
        </form>
    );
});

export { EventsSearch };
