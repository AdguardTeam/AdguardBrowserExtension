import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { Setting, SETTINGS_TYPES } from '../Settings/Setting';
import { rootStore } from '../../stores/RootStore';
import { reactTranslator } from '../../../reactCommon/reactTranslator';

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
        const tagString = `#${reactTranslator.translate('options_filters_filter_trusted_tag')}`;
        return (
            <div className="filter__tags">
                <div className="filter__tag">
                    {tagString}
                </div>
            </div>
        );
    }
    if (tags.length <= 0) {
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

const Filter = ({
    filter, tags, checkboxHandler, checkboxValue,
}) => {
    const { settingsStore } = useContext(rootStore);
    const {
        name,
        filterId,
        description,
        version,
        lastUpdateTime,
        timeUpdated,
        homepage,
        trusted,
        customUrl,
    } = filter;

    const removeCustomFilter = async () => {
        const result = window.confirm(reactTranslator.translate('options_delete_filter_confirm'));
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
                />
            );
        }
        return null;
    };

    const filterClassName = classNames('filter', {
        'filter--disabled': !checkboxValue,
    });

    return (
        <div className={filterClassName} role="presentation">
            <div className="filter__info">
                <div className="setting__container setting__container--horizontal">
                    <div className="filter__title">
                        {name}
                        <a
                            className="filter__link"
                            href={homepage || customUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                        />
                        {renderRemoveButton()}
                    </div>
                    <div className="setting__inline-control">
                        <Setting
                            id={filterId}
                            type={SETTINGS_TYPES.CHECKBOX}
                            value={checkboxValue}
                            handler={checkboxHandler}
                        />
                    </div>
                </div>
                <div className="filter__desc">
                    <div className="filter__desc-item">
                        {description}
                    </div>
                    <div className="filter__desc-item">
                        {
                            version
                                ? `${reactTranslator.translate('options_filters_filter_version')} ${version} `
                                : ''
                        }
                        {reactTranslator.translate('options_filters_filter_updated')}
                        {' '}
                        {lastUpdateTime
                            ? formatDate(lastUpdateTime)
                            : formatDate(timeUpdated)}
                    </div>
                </div>
                {renderTags(tags, trusted)}
            </div>
        </div>
    );
};

Filter.defaultProps = {
    tags: [],
};

Filter.propTypes = {
    // eslint-disable-next-line react/forbid-prop-types
    filter: PropTypes.object.isRequired,
    checkboxValue: PropTypes.bool.isRequired,
    checkboxHandler: PropTypes.func.isRequired,
    tags: PropTypes.arrayOf(PropTypes.object),
};

export { Filter };
