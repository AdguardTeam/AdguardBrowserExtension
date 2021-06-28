import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import classnames from 'classnames';

import { userRulesEditorStore } from './UserRulesEditorStore';
import { Popover } from '../ui/Popover';
import { Icon } from '../ui/Icon';
import { reactTranslator } from '../../../../common/translators/reactTranslator';

/**
 * This button is extracted in the separate file
 * to stop editor re-renderings on wrap mode changes
 */
export const ToggleWrapButton = observer(({ onClick }) => {
    const store = useContext(userRulesEditorStore);

    const lineBreakClassNames = classnames('actions__btn actions__btn--icon', {
        'actions__btn--active': store.userRulesEditorWrapState,
    });

    const tooltipText = store.userRulesEditorWrapState
        ? reactTranslator.getMessage('options_userfilter_line_break_on')
        : reactTranslator.getMessage('options_userfilter_line_break_off');

    return (
        <Popover text={tooltipText}>
            <button
                type="button"
                className={lineBreakClassNames}
                onClick={onClick}
            >
                <Icon classname="icon--extend" id="#line-break" />
            </button>
        </Popover>
    );
});
