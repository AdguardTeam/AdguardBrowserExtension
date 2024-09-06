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

import type {
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
import { addMinDelayLoader } from '../../../common/components/helpers';
import { Popover } from '../../../common/components/ui/Popover';
import { CustomFilterHelper } from '../../../../common/custom-filter-helper';
import { getStaticWarningMessage } from '../Warnings/messages';

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
        },
    groupEnabled: boolean,
};

const Filter = observer(({ filter, groupEnabled }: FilterParams) => {
    const { settingsStore, uiStore } = useContext(rootStore);

    const [isOpenRemoveFilterModal, setIsOpenRemoveFilterModal] = useState(false);

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

    const updateFilterSettingMV3 = async (filterId: number, enabled: boolean) => {
        if (CustomFilterHelper.isCustomFilter(filterId)) {
            // for custom filters, we can't check limits before applying,
            // so we need to check the after applying
            await settingsStore.updateFilterSetting(filterId, enabled);
            await settingsStore.checkLimitations();
            return;
        }

        // check limits only if filter is enabled
        if (enabled && groupEnabled) {
            // for static rules, we can check limits before enabling
            const result = await messenger.canEnableStaticFilter(filterId);
            if (!result.ok && result.data) {
                settingsStore.setFilterEnabledState(filterId, !enabled);

                const staticFiltersLimitsWarning = getStaticWarningMessage(result.data);
                if (staticFiltersLimitsWarning) {
                    uiStore.addMv3Notification({
                        description: staticFiltersLimitsWarning,
                        extra: {
                            link: translator.getMessage('options_rule_limits'),
                        },
                    });
                }

                // We don't enable the filter if it exceeds the limit.
                // [revert-checkbox] is used to revert the checkbox state.
                throw new Error('Filter will exceed the limit. [revert-checkbox]');
            }
        }

        await settingsStore.updateFilterSetting(filterId, enabled);
    };

    const updateFilterSettingMV2 = settingsStore.updateFilterSetting;

    const updateFilterSetting = __IS_MV3__ ? updateFilterSettingMV3 : updateFilterSettingMV2;

    const handleFilterSwitch = async ({ id, data }: { id: string, data: boolean }) => {
        // remove prefix from filter id and parse it to number
        const filterId = Number.parseInt(removePrefix(id), 10);
        const annoyancesFilter = settingsStore.annoyancesFilters
            .find((f: RegularFilterMetadata) => f.filterId === filterId);

        const updateFilterSettingWrapper = addMinDelayLoader(
            uiStore.setShowLoader,
            updateFilterSetting,
        );

        if (annoyancesFilter && data) {
            const isConsentedFilter = await messenger.getIsConsentedFilter(filterId);
            if (!isConsentedFilter) {
                // ask user to consent for annoyances filter on enabling
                // if user has not consented for this filter yet
                settingsStore.setFiltersToGetConsentFor([annoyancesFilter]);
                settingsStore.setFilterIdSelectedForConsent(filterId);
                settingsStore.setIsAnnoyancesConsentModalOpen(true);
            } else {
                await updateFilterSettingWrapper(filterId, data);
            }
            return;
        }

        await updateFilterSettingWrapper(filterId, data);

        if (__IS_MV3__) {
            await settingsStore.checkLimitations();
        }
    };

    const handleRemoveFilterClick = async (e: React.MouseEvent) => {
        e.preventDefault();
        setIsOpenRemoveFilterModal(true);
    };

    const handleRemoveFilterConfirm = async () => {
        await settingsStore.removeCustomFilter(filterId);

        if (__IS_MV3__) {
            await settingsStore.checkLimitations();
        }
    };

    const handleRemoveFilterConfirmWrapper = addMinDelayLoader(
        uiStore.setShowLoader,
        handleRemoveFilterConfirm,
    );

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
                            onConfirm={handleRemoveFilterConfirmWrapper}
                            customConfirmTitle={translator.getMessage('options_remove_filter_confirm_modal_ok_button')}
                        />
                    )}
                    <button
                        type="button"
                        className="button filter__remove"
                        onClick={handleRemoveFilterClick}
                    >
                        <Icon
                            id="#trash"
                            classname="icon icon--24 icon--red-default"
                        />
                    </button>
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
                            </div>

                            <div className="filter__desc">
                                <div>
                                    {description}
                                </div>
                                <div>
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
                        <div className="filter__controls">
                            {renderRemoveButton()}
                            <div className="setting__inline-control">
                                <Setting
                                    id={prefixedFilterId}
                                    type={SETTINGS_TYPES.CHECKBOX}
                                    label={name}
                                    value={!!enabled}
                                    optimistic={!__IS_MV3__}
                                    handler={handleFilterSwitch}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </label>
    );
});

export { Filter };
