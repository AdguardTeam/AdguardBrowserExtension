import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import classNames from 'classnames';

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

    const thirdPartyClassName = classNames({
        'custom-checkbox': true,
        active: searchThirdParty,
    });

    const blockedClassName = classNames({
        'custom-checkbox': true,
        active: searchBlocked,
    });

    const whitelistedClassName = classNames({
        'custom-checkbox': true,
        active: searchWhitelisted,
    });

    return (
        <div className="miscellaneous-filters">
            <label className="checkbox-label" htmlFor="third-party">
                <input
                    type="checkbox"
                    id="third-party"
                    name="third-party"
                    onClick={thirdPartyCheckboxHandler}
                    value={searchThirdParty}
                />
                <div className={thirdPartyClassName} />
                Third party
            </label>

            <label className="checkbox-label" htmlFor="blocked">
                <input
                    type="checkbox"
                    id="blocked"
                    name="blocked"
                    onClick={blockedCheckboxHandler}
                    value={searchBlocked}
                />
                <div className={blockedClassName} />
                Blocked
            </label>

            <label className="checkbox-label" htmlFor="whitelisted">
                <input
                    type="checkbox"
                    id="whitelisted"
                    name="whitelisted"
                    onClick={whitelistedCheckboxHandler}
                    value={searchWhitelisted}
                />
                <div className={whitelistedClassName} />
                Whitelisted
            </label>
        </div>
    );
});

export { MiscellaneousFilters };
