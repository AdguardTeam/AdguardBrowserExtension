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
        <div
            className="setting-checkbox"
            onClick={handleSettingClick}
            onKeyUp={handleSettingClick}
            role="button"
            tabIndex="0"
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
