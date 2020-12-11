import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { Setting, SETTINGS_TYPES } from '../Settings/Setting';
import { reactTranslator } from '../../../reactCommon/reactTranslator';
import { Icon } from '../../../common/components/ui/Icon';

import './group.pcss';

const renderEnabledFilters = (enabledFilters) => {
    const enabledFiltersNames = enabledFilters.map((filter) => filter.name);
    const SLICE_POINT = 3;
    const displayable = enabledFiltersNames.slice(0, SLICE_POINT);
    const countable = enabledFiltersNames.slice(SLICE_POINT);

    if (countable.length > 0) {
        return (
            <>
                {reactTranslator.translate('options_filters_enabled')}
                {' '}
                {reactTranslator.translate(
                    'options_filters_enabled_and_more_divider',
                    { enabled: displayable.join(', '), more: countable.length },
                )}
            </>
        );
    }

    if (displayable.length > 1) {
        const [last, ...rest] = displayable.reverse();
        return (
            <>
                {reactTranslator.translate('options_filters_enabled')}
                {' '}
                {reactTranslator.translate(
                    'options_filters_enabled_and_divider',
                    { enabled: rest.join(', '), last },
                )}
            </>
        );
    }

    if (displayable.length === 1) {
        return (
            <>
                {reactTranslator.translate('options_filters_enabled')}
                {' '}
                {displayable[0]}
            </>
        );
    }

    return reactTranslator.translate('options_filters_no_enabled');
};

const Group = ({
    groupName,
    groupId,
    enabledFilters,
    groupClickHandler,
    checkboxHandler,
    checkboxValue,
}) => {
    const groupClassName = classNames({
        setting: true,
        group: true,
        'group--disabled': !checkboxValue,
    });
    return (
        <div className={groupClassName}>
            <div className="setting__area" role="presentation" onClick={groupClickHandler}>
                <Icon
                    id={`#setting-${groupId}`}
                    classname="icon--setting setting__icon"
                />
                <div className="setting__info">
                    <div className="setting__title group__title">
                        {groupName}
                    </div>
                    <div className="setting__desc">
                        {renderEnabledFilters(enabledFilters)}
                    </div>
                </div>
            </div>
            <div className="setting__inline-control">
                <Setting
                    id={groupId}
                    type={SETTINGS_TYPES.CHECKBOX}
                    value={checkboxValue}
                    handler={checkboxHandler}
                />
            </div>
        </div>
    );
};

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
