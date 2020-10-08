import React from 'react';
import PropTypes from 'prop-types';
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

const renderTags = (tags) => {
    if (tags.length <= 0) {
        return '';
    }
    const tagsNodes = tags.map((tag) => {
        const tagString = `#${tag.keyword}`;
        return (
            <div
                key={tag.id}
                data-tooltip={tag.description}
                className="setting__tag"
            >
                {tagString}
            </div>
        );
    });
    return (
        <div className="setting__tags">
            {tagsNodes}
        </div>
    );
};

function Filter(props) {
    const {
        filter, children, tags,
    } = props;
    const {
        name, description, version, timeUpdated,
    } = filter;
    return (
        <div className="setting" role="presentation">
            <div className="setting__info">
                <div className="setting__title">
                    {name}
                </div>
                <div className="setting__desc">
                    <div className="setting__desc-item">
                        {description}
                    </div>
                    <div className="setting__desc-item">
                        {`version: ${version} updated: ${formatDate(timeUpdated)}`}
                    </div>
                </div>
                {renderTags(tags)}
                {children}
            </div>
        </div>
    );
}

Filter.defaultProps = {
    tags: [],
};

Filter.propTypes = {
    // eslint-disable-next-line react/forbid-prop-types
    filter: PropTypes.object.isRequired,
    children: PropTypes.node.isRequired,
    tags: PropTypes.arrayOf(PropTypes.object),
};

export default Filter;
