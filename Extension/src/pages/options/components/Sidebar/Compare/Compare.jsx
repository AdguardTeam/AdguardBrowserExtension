import React from 'react';
import { reactTranslator } from '../../../../../common/translators/reactTranslator';
import { Icon } from '../../../../common/components/ui/Icon';
import './compare.pcss';

export const Compare = ({ click, hide }) => {
    return (
        <div className="compare">
            <div className="compare__message">
                {reactTranslator.getMessage('options_nav_better_than_extension')}
            </div>
            <button
                type="button"
                className="button button--green button--m button--compare"
                onClick={click}
            >
                {reactTranslator.getMessage('options_nav_compare')}
            </button>
            <button
                type="button"
                className="compare__close"
                aria-label={reactTranslator.getMessage('close_button_title')}
                onClick={hide}
            >
                <Icon id="#cross" />
            </button>
        </div>
    );
};
