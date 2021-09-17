import React from 'react';
import classNames from 'classnames';

import { reactTranslator } from '../../../../../common/translators/reactTranslator';
import { Popover } from '../../../../common/components/ui/Popover';
import { isMacOs } from '../../../../helpers';

export const Tags = ({
    tags,
    setTags,
    type,
}) => {
    const { allButtonEnabled, filters } = tags;

    const enableOne = (tagId) => {
        const updatedTags = filters.map((tag) => {
            return {
                ...tag,
                enabled: tag.id === tagId,
            };
        });

        setTags({ filters: updatedTags, allButtonEnabled: false });
    };

    const enableAll = () => {
        const updatedTags = filters.map((tag) => {
            return { ...tag, enabled: true };
        });

        setTags({ filters: updatedTags, allButtonEnabled: true });
    };

    const toggleMultiple = (tagId) => {
        let updatedTags;
        const everyEnabled = filters.every((tag) => tag.enabled);
        if (everyEnabled) {
            if (allButtonEnabled) {
                // disable all, except selected
                updatedTags = filters.map((tag) => {
                    if (tag.id !== tagId) {
                        return {
                            ...tag,
                            enabled: false,
                        };
                    }
                    return { ...tag };
                });
                setTags({ filters: updatedTags, allButtonEnabled: false });
            } else {
                // disable only selected
                updatedTags = filters.map((tag) => {
                    if (tag.id === tagId) {
                        return {
                            ...tag,
                            enabled: false,
                        };
                    }
                    return tag;
                });
                setTags({ filters: updatedTags, allButtonEnabled });
            }
        } else {
            updatedTags = filters.map((tag) => {
                return {
                    ...tag,
                    enabled: tag.id === tagId ? !tag.enabled : tag.enabled,
                };
            });

            const allDisabled = updatedTags.every((tag) => !tag.enabled);
            if (allDisabled) {
                // set all enabled
                updatedTags = filters.map((tag) => {
                    return {
                        ...tag,
                        enabled: true,
                    };
                });
                setTags({ filters: updatedTags, allButtonEnabled: true });
            } else {
                setTags({ filters: updatedTags, allButtonEnabled });
            }
        }
    };

    const handleTagClick = (e) => {
        if (isMacOs ? e.metaKey : e.ctrlKey) {
            toggleMultiple(e.target.value);
        } else {
            enableOne(e.target.value);
        }
    };

    const handleAllClick = () => {
        enableAll();
    };

    const renderTypes = () => {
        return filters.map((tag) => {
            const {
                id,
                title,
                enabled,
                tooltip,
            } = tag;
            const button = (
                <button
                    className={classNames(`tag tag--${id}`, type && `tag--${type}`, { active: !allButtonEnabled && enabled })}
                    type="button"
                    onClick={handleTagClick}
                    value={id}
                    key={id}
                >
                    {title}
                </button>
            );
            return tooltip
                ? (
                    <Popover text={tooltip} key={id}>
                        {button}
                    </Popover>
                )
                : button;
        });
    };

    return (
        <>
            <button
                className={classNames('tag', type && `tag--${type}`, { active: allButtonEnabled })}
                type="button"
                onClick={handleAllClick}
            >
                {reactTranslator.getMessage('filtering_type_all')}
            </button>
            {renderTypes()}
        </>
    );
};
