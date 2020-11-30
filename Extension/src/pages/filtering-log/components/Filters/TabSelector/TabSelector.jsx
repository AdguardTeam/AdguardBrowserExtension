import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../../stores/RootStore';
import { reactTranslator } from '../../../../reactCommon/reactTranslator';

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
            <label
                htmlFor="tab-selector"
            >
                {reactTranslator.translate('filtering_log_tab')}
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
