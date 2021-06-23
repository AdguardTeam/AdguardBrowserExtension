import React, { useContext, useState } from 'react';
import { observer } from 'mobx-react';
import classnames from 'classnames';

import { userRulesEditorStore } from './UserRulesEditorStore';
import { Icon } from '../ui/Icon';
import { reactTranslator } from '../../../../common/translators/reactTranslator';
import { Tooltip } from '../ui/Tooltip';

/**
 * This button is extracted in the separate file
 * to stop editor re-renderings on wrap mode changes
 */
export const ToggleWrapButton = observer(({ onClick }) => {
    const store = useContext(userRulesEditorStore);

    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

    const lineBreakClassNames = classnames('actions__btn actions__btn--icon', {
        'actions__btn--active': store.userRulesEditorWrapState,
    });

    const tooltipText = store.userRulesEditorWrapState
        ? reactTranslator.getMessage('options_userfilter_line_break_on')
        : reactTranslator.getMessage('options_userfilter_line_break_off');

    const handleMouseMove = () => {
        setTooltipPosition({ x: -40, y: 30 });
    };

    return (
        <button
            type="button"
            className={lineBreakClassNames}
            onClick={onClick}
            onMouseMove={handleMouseMove}
        >
            <Icon classname="icon--extend" id="#line-break" />
            <Tooltip
                text={tooltipText}
                position={tooltipPosition}
            />
        </button>
    );
});
