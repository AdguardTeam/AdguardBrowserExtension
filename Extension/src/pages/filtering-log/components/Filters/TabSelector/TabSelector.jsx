import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import { rootStore } from '../../../stores/RootStore';

import './tab-selector.pcss';

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

    const selectionHandler = async (e) => {
        e.preventDefault();
        await logStore.setSelectedTabId(e.target.value);
    };

    return (
        <div className="tab-selector">
            {/* TODO check accessibility */}
            {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
            <label
                htmlFor="tab-selector"
            >
                Tab:
            </label>

            <select
                name="tab-selector"
                id="tab-selector"
                onChange={selectionHandler}
                value={selectedTabId || ''}
            >
                {renderOptions(tabs)}
            </select>
        </div>
    );
});

export { TabSelector };
