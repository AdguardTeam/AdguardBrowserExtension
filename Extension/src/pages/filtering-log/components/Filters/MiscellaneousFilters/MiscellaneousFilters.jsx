import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../../stores/RootStore';

import './miscellaneous-filters.pcss';

const MiscellaneousFilters = observer(() => {
    const { logStore } = useContext(rootStore);
    const { searchBlocked, searchThirdParty, searchWhitelisted } = logStore;

    const thirdPartyCheckboxHandler = (e) => {
        logStore.setSearchThirdParty(e.target.checked);
    };

    const blockedCheckboxHandler = (e) => {
        logStore.setSearchBlocked(e.target.checked);
    };

    const whitelistedCheckboxHandler = (e) => {
        logStore.setSearchWhitelisted(e.target.checked);
    };

    return (
        <div className="miscellaneous-filters">
            <label htmlFor="third-party">
                <input
                    type="checkbox"
                    id="third-party"
                    name="third-party"
                    onClick={thirdPartyCheckboxHandler}
                    value={searchThirdParty}
                />
                Third party
            </label>

            <label htmlFor="blocked">
                <input
                    type="checkbox"
                    id="blocked"
                    name="blocked"
                    onClick={blockedCheckboxHandler}
                    value={searchBlocked}
                />
                Blocked
            </label>

            <label htmlFor="whitelisted">
                <input
                    type="checkbox"
                    id="whitelisted"
                    name="whitelisted"
                    onClick={whitelistedCheckboxHandler}
                    value={searchWhitelisted}
                />
                Whitelisted
            </label>
        </div>
    );
});

export { MiscellaneousFilters };
