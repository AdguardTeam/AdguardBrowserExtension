import React, { useContext, useState, useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { observer } from 'mobx-react';
import sortBy from 'lodash/sortBy';
import classNames from 'classnames';

import { Group } from './Group';
import { Filter } from './Filter';
import { EmptyCustom } from './EmptyCustom';
import { Search } from './Search';
import { FiltersUpdate } from './FiltersUpdate';
import { rootStore } from '../../stores/RootStore';
import { reactTranslator } from '../../../../common/translators/reactTranslator';
import { AddCustomModal } from './AddCustomModal';
import { CUSTOM_FILTERS_GROUP_ID } from '../../../../../../tools/constants';
import { SettingsSection } from '../Settings/SettingsSection';
import { Icon } from '../../../common/components/ui/Icon';
import { SEARCH_FILTERS } from './Search/constants';

const QUERY_PARAM_NAMES = {
    GROUP: 'group',
    TITLE: 'title',
    SUBSCRIBE: 'subscribe',
};

const Filters = observer(() => {
    const { settingsStore } = useContext(rootStore);

    const history = useHistory();

    const location = useLocation();
    const query = new URLSearchParams(location.search);

    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [urlToSubscribe, setUrlToSubscribe] = useState(decodeURIComponent(query.get(QUERY_PARAM_NAMES.SUBSCRIBE) || ''));
    const [customFilterTitle, setCustomFilterTitle] = useState(query.get(QUERY_PARAM_NAMES.TITLE));

    // This state used to remove blinking while filters to render were not selected
    const [groupDetermined, setGroupDetermined] = useState(false);

    const {
        categories,
        filters,
        filtersToRender,
    } = settingsStore;

    useEffect(() => {
        settingsStore.setSelectedGroupId(query.get(QUERY_PARAM_NAMES.GROUP));
        setGroupDetermined(true);
        settingsStore.setSearchInput('');
        settingsStore.setSearchSelect(SEARCH_FILTERS.ALL);
    }, [location.search]);

    const handleGroupSwitch = async ({ id, data }) => {
        await settingsStore.updateGroupSetting(id, data);
    };

    const groupClickHandler = (groupId) => () => {
        settingsStore.setSelectedGroupId(groupId);
        history.push(`/filters?group=${groupId}`);
    };

    const getEnabledFiltersByGroup = (group) => (
        filters.filter((filter) => filter.groupId === group.groupId && filter.enabled)
    );

    const renderGroups = (groups) => {
        const sortedGroups = sortBy(groups, 'displayNumber');
        return sortedGroups.map((group) => {
            const enabledFilters = getEnabledFiltersByGroup(group);
            return (
                <Group
                    key={group.groupId}
                    groupName={group.groupName}
                    groupId={group.groupId}
                    enabledFilters={enabledFilters}
                    groupClickHandler={groupClickHandler(group.groupId)}
                    checkboxHandler={handleGroupSwitch}
                    checkboxValue={!!group.enabled}
                />
            );
        });
    };

    const handleReturnToGroups = () => {
        history.push('/filters');
        settingsStore.setSelectedGroupId(null);
        settingsStore.setSearchInput('');
        settingsStore.setSearchSelect(SEARCH_FILTERS.ALL);
        settingsStore.sortFilters();
    };

    const renderFilters = (filtersList) => {
        return filtersList
            .map((filter) => <Filter key={filter.filterId} filter={filter} />);
    };

    const openModalHandler = () => {
        setModalIsOpen(true);
        if (query.has(QUERY_PARAM_NAMES.TITLE) || query.has(QUERY_PARAM_NAMES.SUBSCRIBE)) {
            query.delete(QUERY_PARAM_NAMES.TITLE);
            query.delete(QUERY_PARAM_NAMES.SUBSCRIBE);
            history.push(`${history.location.pathname}?${decodeURIComponent(query.toString())}`);
        }
    };

    const closeModalHandler = () => {
        setModalIsOpen(false);
        setUrlToSubscribe('');
        setCustomFilterTitle('');
    };

    useEffect(() => {
        if (urlToSubscribe) {
            openModalHandler();
        }
    }, [urlToSubscribe]);

    const renderAddFilterBtn = (isEmpty) => {
        const buttonClass = classNames('button button--m button--green', {
            'button--empty-custom-filter': isEmpty,
            'button--add-custom-filter': !isEmpty,
        });

        return (
            <button
                type="button"
                onClick={openModalHandler}
                className={buttonClass}
            >
                {reactTranslator.getMessage('options_add_custom_filter')}
            </button>
        );
    };

    const renderBackButton = () => (
        <button
            type="button"
            className="button"
            onClick={handleReturnToGroups}
        >
            <Icon id="#arrow-back" classname="icon--back" />
        </button>
    );

    if (!groupDetermined) {
        return null;
    }

    if (Number.isInteger(settingsStore.selectedGroupId)) {
        const selectedGroup = categories.find((group) => {
            return group.groupId === settingsStore.selectedGroupId;
        });

        const isCustom = settingsStore.selectedGroupId === CUSTOM_FILTERS_GROUP_ID;
        const isEmpty = filtersToRender.length === 0;

        return (
            <SettingsSection
                title={selectedGroup.groupName}
                renderBackButton={renderBackButton}
            >
                {isEmpty && isCustom
                    ? <EmptyCustom />
                    : (
                        <>
                            <Search />
                            {renderFilters(filtersToRender)}
                        </>
                    )}
                {isCustom && (
                    <>
                        {renderAddFilterBtn(isEmpty)}
                        <AddCustomModal
                            closeModalHandler={closeModalHandler}
                            modalIsOpen={modalIsOpen}
                            initialUrl={urlToSubscribe}
                            initialTitle={customFilterTitle}
                        />
                    </>
                )}
            </SettingsSection>
        );
    }

    return (
        <SettingsSection
            title={reactTranslator.getMessage('options_filters')}
            renderInlineControl={() => <FiltersUpdate />}
        >
            <Search />
            {settingsStore.isSearching
                ? renderFilters(filtersToRender)
                : renderGroups(categories)}
        </SettingsSection>
    );
});

export { Filters };
