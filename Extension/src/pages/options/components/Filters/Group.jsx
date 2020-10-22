import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Checkbox } from '../Settings/Checkbox';
import { reactTranslator } from '../../../reactCommon/reactTranslator';

const renderEnabledFilters = (enabledFilters) => {
    const enabledFiltersNames = enabledFilters.map((filter) => filter.name);
    const SLICE_POINT = 3;
    const displayable = enabledFiltersNames.slice(0, SLICE_POINT);
    const countable = enabledFiltersNames.slice(SLICE_POINT);

    if (countable.length > 0) {
        // TODO: add localization
        return `Enabled: ${displayable.join(', ')} and ${countable.length} more`;
    }

    if (displayable.length > 1) {
        const [last, ...rest] = displayable.reverse();
        // TODO: add localization
        return `Enabled: ${rest.join(', ')} and ${last}`;
    }

    if (displayable.length === 1) {
        return `Enabled: ${displayable[0]}`;
    }

    return 'No filters enabled';
};

const Group = ({
    groupName,
    groupId,
    enabledFilters,
    groupClickHandler,
    checkboxHandler,
    checkboxValue,
}) => (
    <div className="setting">
        <div className="setting__area" role="presentation" onClick={groupClickHandler}>
            <div className={
                classNames(
                    'setting__icon',
                    `setting__icon--${groupName.toLowerCase().split(' ')[0]}`,
                )
            }
            />
            <div className="setting__info">
                <div className="setting__title">
                    {groupName}
                </div>
                <div className="setting__desc">
                    {renderEnabledFilters(enabledFilters)}
                </div>
            </div>
        </div>
        <Checkbox
            id={groupId}
            handler={checkboxHandler}
            value={checkboxValue}
        />
    </div>
);

Group.defaultProps = {
    enabledFilters: [],
};

Group.propTypes = {
    groupName: PropTypes.string.isRequired,
    groupId: PropTypes.number.isRequired,
    checkboxHandler: PropTypes.func.isRequired,
    checkboxValue: PropTypes.bool.isRequired,
    enabledFilters: PropTypes.arrayOf(PropTypes.object),
    groupClickHandler: PropTypes.func.isRequired,
};

export { Group };
