/**
 * @file
 * This file is part of AdGuard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * AdGuard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * AdGuard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with AdGuard Browser Extension. If not, see <http://www.gnu.org/licenses/>.
 */

/*
eslint-disable jsx-a11y/anchor-is-valid,
jsx-a11y/click-events-have-key-events,
jsx-a11y/no-static-element-interactions
*/

import React, { useContext, useState } from 'react';
import { observer } from 'mobx-react';

import cn from 'classnames';

import {
    CustomFilterMetadata,
    FilterVersionData,
    RegularFilterMetadata,
    TagMetadata,
} from '../../../../background/schema';
import { Setting, SETTINGS_TYPES } from '../Settings/Setting';
import { rootStore } from '../../stores/RootStore';
import { translator } from '../../../../common/translators/translator';
import { messenger } from '../../../services/messenger';
import { Icon } from '../../../common/components/ui/Icon';
import { ConfirmModal } from '../../../common/components/ConfirmModal';
import { TRUSTED_TAG_ID, TRUSTED_TAG_KEYWORD } from '../../../../common/constants';
import { Popover } from '../../../common/components/ui/Popover';
import { Loader } from '../../../common/components/Loader';

import { formatDate } from './helpers';
import { HighlightSearch } from './Search/HighlightSearch';
import { FilterTags } from './FilterTags';

import './filter.pcss';

const FILTER_PREFIX = 'filter-';

/**
 * Appends prefix to filter id
 *
 * @param filterId Filter id.
 *
 * @returns Filter if with prefix.
 */
const addPrefix = (filterId: number): string => {
    return `${FILTER_PREFIX}${filterId}`;
};

/**
 * Removes prefix from filter id.
 *
 * @param extendedFilterId Filter id with prefix.
 * @returns Filter id without prefix.
 */
const removePrefix = (extendedFilterId: string): string => {
    return extendedFilterId.replace(FILTER_PREFIX, '');
};

type FilterParams = {
    filter: RegularFilterMetadata
        & FilterVersionData
        & CustomFilterMetadata
        & {
            enabled: boolean,
            tagsDetails: TagMetadata[],
        }
};

const Filter = observer(({ filter }: FilterParams) => {
    const { settingsStore } = useContext(rootStore);

    const [isOpenRemoveFilterModal, setIsOpenRemoveFilterModal] = useState(false);

    const [showLoader, setShowLoader] = useState(false);

    const {
        name,
        filterId,
        description,
        version,
        lastCheckTime,
        lastUpdateTime,
        homepage,
        trusted,
        customUrl,
        enabled,
        tagsDetails = [],
    } = filter;

    // Trusted tag can be only on custom filters,
    const tags = trusted
        ? [...tagsDetails, {
            tagId: TRUSTED_TAG_ID,
            keyword: TRUSTED_TAG_KEYWORD,
            description: translator.getMessage('options_filters_filter_trusted_tag_desc'),
        }]
        : [...tagsDetails];

    const handleFilterSwitch = async ({ id, data }: { id: string, data: boolean }) => {
        // remove prefix from filter id and parse it to number
        const filterId = Number.parseInt(removePrefix(id), 10);
        const annoyancesFilter = settingsStore.annoyancesFilters
            .find((f: RegularFilterMetadata) => f.filterId === filterId);

        if (annoyancesFilter && data) {
            const isConsentedFilter = await messenger.getIsConsentedFilter(filterId);
            if (!isConsentedFilter) {
                // ask user to consent for annoyances filter on enabling
                // if user has not consented for this filter yet
                settingsStore.setFiltersToGetConsentFor([annoyancesFilter]);
                settingsStore.setFilterIdSelectedForConsent(filterId);
                settingsStore.setIsAnnoyancesConsentModalOpen(true);
            } else if (__IS_MV3__) {
                // show loader for mv3
                setShowLoader(true);
                await settingsStore.updateFilterSetting(filterId, data);
                setShowLoader(false);
            } else {
                // just update filter setting
                await settingsStore.updateFilterSetting(filterId, data);
            }
            return;
        }

        if (__IS_MV3__) {
            setShowLoader(true);
            await settingsStore.updateFilterSetting(filterId, data);
            setShowLoader(false);
        } else {
            await settingsStore.updateFilterSetting(filterId, data);
        }
    };

    const handleRemoveFilterClick = async (e: React.MouseEvent) => {
        e.preventDefault();
        setIsOpenRemoveFilterModal(true);
    };

    const handleRemoveFilterConfirm = async () => {
        await settingsStore.removeCustomFilter(filterId);
    };

    const renderRemoveButton = () => {
        if (customUrl) {
            return (
                <>
                    {isOpenRemoveFilterModal && (
                        <ConfirmModal
                            title={translator.getMessage('options_remove_filter_confirm_modal_title')}
                            subtitle={name}
                            isOpen={isOpenRemoveFilterModal}
                            setIsOpen={setIsOpenRemoveFilterModal}
                            onConfirm={handleRemoveFilterConfirm}
                            customConfirmTitle={translator.getMessage('options_remove_filter_confirm_modal_ok_button')}
                        />
                    )}
                    <a
                        className="filter__remove"
                        onClick={handleRemoveFilterClick}
                    >
                        <Icon id="#trash" classname="icon--trash" />
                    </a>
                </>
            );
        }
        return null;
    };

    const filterClassName = cn('filter', {
        'filter--disabled': !enabled,
    });

    // We add prefix to avoid id collisions with group ids
    const prefixedFilterId = addPrefix(filterId);

    return (
        <>
            <Loader condition={showLoader} />
            <label htmlFor={prefixedFilterId} className="setting-checkbox">
                <div className={filterClassName} role="presentation">
                    <div className="filter__info">
                        <div className="setting__container setting__container--horizontal">
                            <div className="setting__inner">
                                <div className="filter__title">
                                    <Popover text={name}>
                                        <div className="filter__title-constraint">
                                            <span className="filter__title-in">
                                                <HighlightSearch string={name} />
                                            </span>
                                        </div>
                                    </Popover>
                                    <span className="filter__controls">
                                        {renderRemoveButton()}
                                    </span>
                                </div>

                                <div className="filter__desc">
                                    <div className="filter__desc-item">
                                        {description}
                                    </div>
                                    <div className="filter__desc-item">
                                        {
                                            version
                                                ? `${translator.getMessage('options_filters_filter_version')} ${version} `
                                                : ''
                                        }
                                        {translator.getMessage('options_filters_filter_updated')}
                                        {' '}
                                        {lastUpdateTime
                                            ? formatDate(lastUpdateTime)
                                            : formatDate(lastCheckTime)}
                                    </div>
                                </div>
                                <div>
                                    <a
                                        className="filter__link"
                                        href={homepage || customUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        {translator.getMessage('options_filters_filter_link')}
                                    </a>
                                </div>
                                <FilterTags tags={tags} />
                            </div>
                            <div className="setting__inline-control">
                                <Setting
                                    id={prefixedFilterId}
                                    type={SETTINGS_TYPES.CHECKBOX}
                                    label={name}
                                    value={!!enabled}
                                    handler={handleFilterSwitch}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </label>
        </>
    );
});

export { Filter };
