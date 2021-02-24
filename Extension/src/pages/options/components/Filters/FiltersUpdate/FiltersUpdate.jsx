import React from 'react';
import PropTypes from 'prop-types';

import { reactTranslator } from '../../../../../common/translators/reactTranslator';
import { Icon } from '../../../../common/components/ui/Icon';

import './filters-update.pcss';

const FiltersUpdate = (props) => {
    const {
        handler,
        rulesCount,
        buttonClass,
        lastUpdateDate,
    } = props;

    const formatOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    };

    const dateObj = new Date(lastUpdateDate);

    return (
        <div className="filters-update">
            <div className="filters-update__info">
                <div className="filters-update__title">
                    {reactTranslator.getMessage('options_antibanner_rules_count', { rules_count: rulesCount })}
                </div>
                <div className="filters-update__desc">
                    {dateObj.toLocaleDateString('default', formatOptions)}
                </div>
            </div>
            <button
                type="button"
                onClick={handler}
                className={`button filters-update__btn filters-update__btn--${buttonClass}`}
            >
                <Icon id="#reload" classname="icon--reload" />
            </button>
        </div>
    );
};

FiltersUpdate.defaultProps = {
    rulesCount: null,
    lastUpdateDate: '',
};

FiltersUpdate.propTypes = {
    handler: PropTypes.func.isRequired,
    rulesCount: PropTypes.number,
    buttonClass: PropTypes.string.isRequired,
    lastUpdateDate: PropTypes.number,
};

export { FiltersUpdate };
