import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import './filter.pcss';
import { Checkbox } from '../Settings/Checkbox';
import { rootStore } from '../../stores/RootStore';
import { i18n } from '../../../services';

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
        const tagString = `#${i18n.translate('options_filters_filter_trusted_tag')}`;
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
        name, filterId, description, version, timeUpdated, homepage, trusted,
    } = filter;

    const removeCustomFilter = async () => {
        const result = confirm(i18n.translate('options_delete_filter_confirm'));
        if (result) {
            await settingsStore.removeCustomFilter(filterId);
        }
    };

    return (
        <div className="filter" role="presentation">
            <div className="filter__info">
                <div className="filter__title">
                    {name}
                </div>
                <a
                    className="filter__link"
                    href={homepage}
                    target="_blank"
                    rel="noopener noreferrer"
                />
                <a
                    className="filter__remove"
                    onClick={removeCustomFilter}
                />
                <div className="filter__desc">
                    <div className="filter__desc-item">
                        {description}
                    </div>
                    <div className="filter__desc-item">
                        {version ? `version: ${version} ` : ''}
                        {`updated: ${formatDate(timeUpdated)}`}
                    </div>
                </div>
                {renderTags(tags, trusted)}
                <Checkbox
                    id={filterId}
                    value={checkboxValue}
                    handler={checkboxHandler}
                />
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
