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
        <button
            className="setting-checkbox setting-checkbox--button"
            onClick={handleSettingClick}
            type="button"
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
        </button>
    );
};
