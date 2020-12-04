import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../../stores/RootStore';

import './events-search.pcss';

const EventsSearch = observer(() => {
    const { logStore } = useContext(rootStore);

    const onSubmit = (e) => {
        e.preventDefault();
    };

    const changeHandler = (e) => {
        const trimmed = e.currentTarget.value.trim();
        logStore.setEventsSearchValue(trimmed);
    };

    const handleClear = () => {
        logStore.setEventsSearchValue('');
    };

    return (
        <form
            className="events-search"
            onSubmit={onSubmit}
        >
            <input
                type="text"
                id="events-search"
                name="events-search"
                placeholder="Search"
                onChange={changeHandler}
                value={logStore.eventsSearchValue}
            />
            {logStore.eventsSearchValue
            && (
                <button
                    type="button"
                    className="events-search__clear"
                    onClick={handleClear}
                />
            )}
        </form>
    );
});

export { EventsSearch };
