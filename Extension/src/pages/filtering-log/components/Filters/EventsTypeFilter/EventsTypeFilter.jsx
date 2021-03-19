import React, { useState, useContext } from 'react';
import { observer } from 'mobx-react';
import classNames from 'classnames';
import Modal from 'react-modal';

import { rootStore } from '../../../stores/RootStore';
import { reactTranslator } from '../../../../../common/translators/reactTranslator';
import { Icon } from '../../../../common/components/ui/Icon';
import { browserUtils } from '../../../../../background/utils/browser-utils';

import './events-type-filter.pcss';

const EventsTypeFilter = observer(() => {
    const [isOpened, setModalOpened] = useState(false);
    const openModal = () => setModalOpened(true);
    const closeModal = () => setModalOpened(false);

    const { logStore } = useContext(rootStore);
    const { eventTypesFilters } = logStore;
    const everyFilterTypeEnabled = eventTypesFilters.every((filter) => filter.enabled);

    const handleTypeClick = (e) => {
        if (browserUtils.isMacOs() ? e.metaKey : e.ctrlKey) {
            logStore.toggleEventTypesFilter(e.target.value);
        } else {
            logStore.selectOneEventTypesFilter(e.target.value);
        }
    };

    const handleAllClick = () => {
        logStore.toggleAllEventTypesFilters();
    };

    const renderTypes = () => {
        return eventTypesFilters.map((eventTypeFilter) => {
            const { name, title, enabled } = eventTypeFilter;
            return (
                <button
                    className={classNames('events-types__type', { active: !everyFilterTypeEnabled && enabled })}
                    type="button"
                    onClick={handleTypeClick}
                    value={name}
                    key={name}
                >
                    {title}
                </button>
            );
        });
    };

    const renderContent = () => (
        <>
            <button
                className={classNames('events-types__type', { active: everyFilterTypeEnabled })}
                type="button"
                onClick={handleAllClick}
            >
                {reactTranslator.getMessage('filtering_type_all')}
            </button>
            {renderTypes()}
        </>
    );

    return (
        <>
            <div className="events-types">
                <div className="events-types__content--desktop">
                    {renderContent()}
                </div>
                <div className="events-types__content--mobile">
                    <button
                        className="events-types__icon"
                        type="button"
                        onClick={openModal}
                    >
                        <Icon id="#code" classname="icon--24 events-types__code" />
                        {reactTranslator.getMessage('filtering_type_content_type')}
                        <Icon id="#select" classname="icon--select events-types__select" />
                    </button>
                    <Modal
                        isOpen={isOpened}
                        onRequestClose={closeModal}
                        className="content-type__modal"
                        style={
                            { overlay: { background: 'transparent' } }
                        }
                    >
                        {renderContent()}
                    </Modal>
                </div>
            </div>
        </>
    );
});

export { EventsTypeFilter };
