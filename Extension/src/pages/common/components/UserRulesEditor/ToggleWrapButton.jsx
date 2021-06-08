import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import classnames from 'classnames';

import { userRulesEditorStore } from './UserRulesEditorStore';
import { Icon } from '../ui/Icon';
import { translator } from '../../../../common/translators/translator';

/**
 * This button is extracted in the separate file
 * to stop editor re-renderings on wrap mode changes
 */
export const ToggleWrapButton = observer(({ onClick }) => {
    const store = useContext(userRulesEditorStore);

    const lineBreakClassNames = classnames('actions__btn actions__btn--icon', {
        'actions__btn--active': store.userRulesEditorWrapState,
    });

    return (
        <button
            type="button"
            title={translator.getMessage('options_editor_toggle_wrap_button_tooltip')}
            className={lineBreakClassNames}
            onClick={onClick}
        >
            <Icon classname="icon--extend" id="#line-break" />
        </button>
    );
});
