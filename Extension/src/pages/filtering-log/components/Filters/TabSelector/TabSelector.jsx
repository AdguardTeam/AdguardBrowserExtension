import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../../stores/RootStore';
import { Icon } from '../../../../common/components/ui/Icon';

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
            <div className="tab-selector__select">
                <Icon id="#select" classname="icon--select tab-selector__select-ico" />
                <select
                    className="tab-selector__select-in"
                    name="tab-selector"
                    id="tab-selector"
                    onChange={selectionHandler}
                    value={selectedTabId || ''}
                >
                    {renderOptions(tabs)}
                </select>
            </div>
        </div>
    );
});

export { TabSelector };
