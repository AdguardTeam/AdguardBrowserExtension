import React from 'react';
import { SettingsSet } from './SettingsSet';
import { Setting, SETTINGS_TYPES } from './Setting';
import { useSelect } from '../../../common/components/ui/Select/SelectProvider';

export const SettingSetSelect = ({
    title,
    description,
    ...props
}) => {
    const [hidden, setHidden] = useSelect(props.id);

    const handleSettingClick = (e) => {
        e.stopPropagation();
        setHidden(!hidden);
    };

    return (
        // Interaction with the keyboard creates problems,
        // leaving the possibility of interaction through
        // the keyboard only with the internal selector
        // eslint-disable-next-line max-len
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
        <div
            className="setting-checkbox setting-checkbox--button"
            onClick={handleSettingClick}
        >
            <SettingsSet
                title={title}
                description={description}
                inlineControl={(
                    <Setting
                        type={SETTINGS_TYPES.SELECT}
                        {...props}
                    />
                )}
            />
        </div>
    );
};
