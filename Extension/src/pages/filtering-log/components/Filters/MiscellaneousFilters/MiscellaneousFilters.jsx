import React, { useContext, useState } from 'react';
import { observer } from 'mobx-react';
import classNames from 'classnames';

import { rootStore } from '../../../stores/RootStore';

import './miscellaneous-filters.pcss';

const MiscellaneousFilters = observer(() => {
    const [showPopup, setShowPopup] = useState(false);

    const { logStore } = useContext(rootStore);
    const {
        searchRegular,
        searchWhitelisted,
        searchBlocked,
        searchModified,
        searchUserFilter,
        searchThirdParty,
        searchFirstParty,
        searchFirstThirdParty,
    } = logStore;

    const filtersCheckboxHandler = (setValue) => (e) => {
        setValue(e.target.checked);
    };

    const filtersRadioButtonHandler = (setValue) => () => {
        logStore.setSearchFirstThirdParty(setValue === logStore.setSearchFirstThirdParty);
        logStore.setSearchFirstParty(setValue === logStore.setSearchFirstParty);
        logStore.setSearchThirdParty(setValue === logStore.setSearchThirdParty);
    };

    const hidePopup = (event) => {
        if (!document.querySelector('.miscellaneous-filters__filters').contains(event.target)) {
            setShowPopup(false);
            document.removeEventListener('click', hidePopup);
        }
    };

    const miscellaneousFiltersButtonHandler = () => {
        if (!showPopup) {
            setShowPopup(true);
            document.addEventListener('click', hidePopup);
        }
    };

    const filtersClassNames = (name, vale) => classNames(
        name,
        { active: vale },
    );

    return (
        <div className="miscellaneous-filters">
            <button
                className="miscellaneous-filters__button"
                type="button"
                onClick={miscellaneousFiltersButtonHandler}
            >
                Filters
            </button>
            <div className={filtersClassNames('miscellaneous-filters__filters', showPopup)}>
                <div className="miscellaneous-filters__section">
                    <label className="checkbox-label" htmlFor="regular">
                        <input
                            type="checkbox"
                            id="regular"
                            name="regular"
                            onClick={filtersCheckboxHandler(logStore.setSearchRegular)}
                            value={searchRegular}
                        />
                        <div className={filtersClassNames('custom-checkbox', searchRegular)} />
                        Regular
                    </label>

                    <label className="checkbox-label" htmlFor="whitelisted">
                        <input
                            type="checkbox"
                            id="whitelisted"
                            name="whitelisted"
                            onClick={filtersCheckboxHandler(logStore.setSearchWhitelisted)}
                            value={searchWhitelisted}
                        />
                        <div className={filtersClassNames('custom-checkbox', searchWhitelisted)} />
                        Whitelisted
                    </label>

                    <label className="checkbox-label" htmlFor="blocked">
                        <input
                            type="checkbox"
                            id="blocked"
                            name="blocked"
                            onClick={filtersCheckboxHandler(logStore.setSearchBlocked)}
                            value={searchBlocked}
                        />
                        <div className={filtersClassNames('custom-checkbox', searchBlocked)} />
                        Blocked
                    </label>

                    <label className="checkbox-label" htmlFor="modified">
                        <input
                            type="checkbox"
                            id="modified"
                            name="modified"
                            onClick={filtersCheckboxHandler(logStore.setSearchModified)}
                            value={searchModified}
                        />
                        <div className={filtersClassNames('custom-checkbox', searchModified)} />
                        Modified
                    </label>

                    <label className="checkbox-label" htmlFor="user-filter">
                        <input
                            type="checkbox"
                            id="user-filter"
                            name="user-filter"
                            onClick={filtersCheckboxHandler(logStore.setSearchUserFilter)}
                            value={searchUserFilter}
                        />
                        <div className={filtersClassNames('custom-checkbox', searchUserFilter)} />
                        User filter
                    </label>
                </div>

                <div className="hr" />

                <div className="miscellaneous-filters__section">
                    <label className="radio-button-label" htmlFor="first-third-party">
                        <input
                            type="radio"
                            id="first-third-party"
                            name="first-third-party"
                            onClick={filtersRadioButtonHandler(logStore.setSearchFirstThirdParty)}
                            value={searchFirstThirdParty}
                        />
                        <div className={filtersClassNames('radio-button', searchFirstThirdParty)} />
                        All
                    </label>

                    <label className="radio-button-label" htmlFor="third-party">
                        <input
                            type="radio"
                            id="third-party"
                            name="first-third-party"
                            onClick={filtersRadioButtonHandler(logStore.setSearchThirdParty)}
                            value={searchThirdParty}
                        />
                        <div className={filtersClassNames('radio-button', searchThirdParty)} />
                        Third party
                    </label>

                    <label className="radio-button-label" htmlFor="first-party">
                        <input
                            type="radio"
                            id="first-party"
                            name="first-third-party"
                            onClick={filtersRadioButtonHandler(logStore.setSearchFirstParty)}
                            value={searchFirstParty}
                        />
                        <div className={filtersClassNames('radio-button', searchFirstParty)} />
                        First party
                    </label>
                </div>
            </div>
        </div>
    );
});

export { MiscellaneousFilters };