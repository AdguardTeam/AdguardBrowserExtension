import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import { rootStore } from '../../../stores/RootStore';

const TabSelector = observer(() => {
    const { logStore } = useContext(rootStore);

    const { tabs, selectedTabId } = logStore;

    const renderOptions = () => {
        return tabs.map((tab) => {
            const { title, tabId } = tab;
            return (
                <option
                    key={tabId}
                    value={tabId}
                >
                    {title}
                </option>
            );
        });
    };

    const selectionHandler = (e) => {
        e.preventDefault();
        logStore.setSelectedTabId(e.target.value);
    };

    return (
        <>
            {/* TODO check accessibility */}
            {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
            <label
                htmlFor="tab-selector"
            >
                Selected tab:
            </label>

            <select
                name="tab-selector"
                id="tab-selector"
                onChange={selectionHandler}
                value={selectedTabId}
            >
                {renderOptions(tabs)}
            </select>
        </>
    );
});

export { TabSelector };
