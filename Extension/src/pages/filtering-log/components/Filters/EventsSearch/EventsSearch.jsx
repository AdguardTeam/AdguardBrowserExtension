import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import './events-search.pcss';

import { rootStore } from '../../../stores/RootStore';

const EventsSearch = observer(() => {
    const { logStore } = useContext(rootStore);

    const changeHandler = (e) => {
        e.preventDefault();

        const trimmed = e.currentTarget.value.trim();
        logStore.setEventsSearchValue(trimmed);
    };

    const handleClear = () => {
        logStore.setEventsSearchValue('');
    };

    return (
        <form className="events-search">
            <input
                type="text"
                id="events-search"
                name="events-search"
                placeholder="Search"
                onChange={changeHandler}
                value={logStore.eventsSearchValue}
            />
            <button
                type="button"
                className="events-search__clear"
                onClick={handleClear}
            />
        </form>
    );
});

export { EventsSearch };
