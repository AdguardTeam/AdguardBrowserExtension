/*
eslint-disable jsx-a11y/click-events-have-key-events,
jsx-a11y/no-noninteractive-element-interactions
*/
import React, { useContext, useEffect } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../../stores/RootStore';
import { Icon } from '../../../../common/components/ui/Icon';

import './tab-selector.pcss';

const TabSelector = observer(() => {
    const { logStore } = useContext(rootStore);

    useEffect(() => {
        logStore.setSelectIsOpenState(false);
    });

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

    const onFocus = () => {
        logStore.setSelectIsOpenState(true);
    };

    const onClick = () => {
        logStore.setSelectIsOpenState(true);
    };

    const onBlur = () => {
        logStore.setSelectIsOpenState(false);
    };

    return (
        <div className="tab-selector">
            <div className="tab-selector__select">
                <Icon id="#arrow-bottom" classname="tab-selector__select-ico" />
                <label
                    htmlFor="tab-selector"
                    onFocus={onFocus}
                    onBlur={onBlur}
                    onClick={onClick}
                >
                    <select
                        className="tab-selector__select-in"
                        name="tab-selector"
                        id="tab-selector"
                        onChange={selectionHandler}
                        value={selectedTabId || ''}
                    >
                        {renderOptions()}
                    </select>
                </label>
            </div>
        </div>
    );
});

export { TabSelector };
