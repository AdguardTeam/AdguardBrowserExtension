import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../../stores/RootStore';
import { reactTranslator } from '../../../../../common/translators/reactTranslator';
import { Search } from '../../Search';

const EventsSearch = observer(() => {
    const { logStore } = useContext(rootStore);

    const changeHandler = (e) => {
        logStore.setEventsSearchValue(e.currentTarget.value);
    };

    const handleClear = () => {
        logStore.setEventsSearchValue('');
    };

    return (
        <Search
            changeHandler={changeHandler}
            handleClear={handleClear}
            value={logStore.eventsSearchValue}
            placeholder={reactTranslator.getMessage('filtering_log_search_string')}
        />
    );
});

export { EventsSearch };
