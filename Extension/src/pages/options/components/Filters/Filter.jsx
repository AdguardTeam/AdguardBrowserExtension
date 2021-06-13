import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import cn from 'classnames';

import { Setting, SETTINGS_TYPES } from '../Settings/Setting';
import { rootStore } from '../../stores/RootStore';
import { reactTranslator } from '../../../../common/translators/reactTranslator';
import { Icon } from '../../../common/components/ui/Icon';
import { HighlightSearch } from './Search/HighlightSearch';

import './filter.pcss';

const formatDate = (date) => {
    const dateObj = new Date(date);
    const formatOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    };
    return dateObj.toLocaleDateString('default', formatOptions);
};

const renderTags = (tags, trusted) => {
    if (trusted) {
        const tagString = `#${reactTranslator.getMessage('options_filters_filter_trusted_tag')}`;
        return (
            <div className="filter__tags">
                <div
                    data-tooltip={reactTranslator.getMessage('options_filters_filter_trusted_tag_desc')}
                    className="filter__tag"
                >
                    {tagString}
                </div>
            </div>
        );
    }
    if (!tags || tags?.length <= 0) {
        return '';
    }
    const tagsNodes = tags.map((tag) => {
        const tagString = `#${tag.keyword}`;
        return (
            <div
                key={tag.tagId}
                data-tooltip={tag.description}
                className="filter__tag"
            >
                {tagString}
            </div>
        );
    });
    return (
        <div className="filter__tags">
            {tagsNodes}
        </div>
    );
};

const FILTER_PREFIX = 'filter-';
/**
 * Appends prefix to filter id
 * @param filterId
 * @return {string}
 */
const addPrefix = (filterId) => {
    return `${FILTER_PREFIX}${filterId}`;
};

/**
 * Removes prefix from filter id
 * @param {string} extendedFilterId
 * @return {string}
 */
const removePrefix = (extendedFilterId) => {
    return extendedFilterId.replace(FILTER_PREFIX, '');
};

const Filter = observer(({ filter }) => {
    const { settingsStore } = useContext(rootStore);

    const {
        name,
        filterId,
        description,
        version,
        lastCheckTime,
        timeUpdated,
        homepage,
        trusted,
        customUrl,
        enabled,
        tagsDetails,
    } = filter;

    const handleFilterSwitch = async ({ id, data }) => {
        // remove prefix from filter id
        const filterIdWithoutPrefix = removePrefix(id);
        await settingsStore.updateFilterSetting(filterIdWithoutPrefix, data);
    };

    const removeCustomFilter = async () => {
        const result = window.confirm(reactTranslator.getMessage('options_delete_filter_confirm'));
        if (result) {
            await settingsStore.removeCustomFilter(filterId);
        }
    };

    const renderRemoveButton = () => {
        if (customUrl) {
            return (
                <a
                    className="filter__remove"
                    onClick={removeCustomFilter}
                >
                    <Icon id="#trash" classname="icon--trash" />
                </a>
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
                                <span className="filter__title-in">
                                    <HighlightSearch name={name} />
                                </span>
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
                                            ? `${reactTranslator.getMessage('options_filters_filter_version')} ${version} `
                                            : ''
                                    }
                                    {reactTranslator.getMessage('options_filters_filter_updated')}
                                    {' '}
                                    {lastCheckTime
                                        ? formatDate(lastCheckTime)
                                        : formatDate(timeUpdated)}
                                </div>
                            </div>
                            <div>
                                <a
                                    className="filter__link"
                                    href={homepage || customUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    {reactTranslator.getMessage('options_filters_filter_link')}
                                </a>
                            </div>
                            {renderTags(tagsDetails, trusted)}
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
    );
});

export { Filter };
