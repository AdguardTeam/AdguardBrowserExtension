import React, { useState } from 'react';
import classNames from 'classnames';

import { reactTranslator } from '../../../../../common/translators/reactTranslator';

const isMacOs = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

export const Tags = ({
    tags,
    setTags,
    type,
}) => {
    const everyTagEnabled = tags.every((tag) => tag.enabled);
    const [allButtonEnabled, setAllEnabled] = useState(everyTagEnabled);

    const enableOne = (tagId) => {
        const updatedTags = tags.map((tag) => {
            return {
                ...tag,
                enabled: tag.id === tagId,
            };
        });

        setAllEnabled(false);
        setTags(updatedTags);
    };

    const enableAll = () => {
        const updatedTags = tags.map((tag) => {
            return { ...tag, enabled: true };
        });

        setTags(updatedTags);
    };

    const toggleMultiple = (tagId) => {
        let updatedTags;
        const everyEnabled = tags.every((tag) => tag.enabled);
        if (everyEnabled) {
            if (allButtonEnabled) {
                // disable all, except selected
                updatedTags = tags.map((tag) => {
                    if (tag.id !== tagId) {
                        return {
                            ...tag,
                            enabled: false,
                        };
                    }
                    return { ...tag };
                });
                setAllEnabled(false);
                setTags(updatedTags);
            } else {
                // disable only selected
                updatedTags = tags.map((tag) => {
                    if (tag.id === tagId) {
                        return {
                            ...tag,
                            enabled: false,
                        };
                    }
                    return tag;
                });
                setTags(updatedTags);
            }
        } else {
            updatedTags = tags.map((tag) => {
                return {
                    ...tag,
                    enabled: tag.id === tagId ? !tag.enabled : tag.enabled,
                };
            });

            const allDisabled = updatedTags.every((tag) => !tag.enabled);
            if (allDisabled) {
                // set all enabled
                updatedTags = tags.map((tag) => {
                    return {
                        ...tag,
                        enabled: true,
                    };
                });
                setAllEnabled(true);
                setTags(updatedTags);
            } else {
                setTags(updatedTags);
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
        setAllEnabled(true);
    };

    const renderTypes = () => {
        return tags.map((tag) => {
            const { id, title, enabled } = tag;
            return (
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
