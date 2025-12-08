/**
 * Copyright (c) 2015-2025 Adguard Software Ltd.
 *
 * @file
 * This file is part of AdGuard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * AdGuard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * AdGuard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with AdGuard Browser Extension. If not, see <http://www.gnu.org/licenses/>.
 */

import React, { useRef } from 'react';

import { translator } from '../../../../../common/translators/translator';

import { Tag, TagKeyAction } from './Tag';

const ALL_TAG_ID = 'all';

export const Tags = ({
    tags,
    setTags,
    type,
    label,
}) => {
    const { allButtonEnabled, filters } = tags;

    // Store references to tag elements (key is tagId, value is tagRef)
    const tagsRefs = useRef({});

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

    const enableAndFocus = (tagId) => {
        const element = tagsRefs.current[tagId];
        if (!element) {
            return;
        }

        if (tagId === ALL_TAG_ID) {
            enableAll();
        } else {
            enableOne(tagId);
        }

        element.focus();
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

    const handleTagClick = (tagId, isMetaPressed) => {
        if (isMetaPressed) {
            toggleMultiple(tagId);
        } else {
            enableOne(tagId);
        }
    };

    const handleAllClick = () => {
        enableAll();
    };

    const moveSelection = (tagId, isPrev) => {
        if (tagId === ALL_TAG_ID) {
            const targetIndex = isPrev ? filters.length - 1 : 0;
            enableAndFocus(filters[targetIndex].id);
            return;
        }

        const currentIndex = filters.findIndex((tag) => tag.id === tagId);
        const edgeIndex = isPrev ? 0 : filters.length - 1;

        if (currentIndex === edgeIndex) {
            enableAndFocus(ALL_TAG_ID);
        } else if (currentIndex !== -1) {
            const targetIndex = isPrev ? currentIndex - 1 : currentIndex + 1;
            enableAndFocus(filters[targetIndex].id);
        }
    };

    const onKeyDown = (tagId, action) => {
        switch (action) {
            case TagKeyAction.Prev:
                moveSelection(tagId, true);
                break;
            case TagKeyAction.Next:
                moveSelection(tagId, false);
                break;
            default:
                break;
        }
    };

    return (
        <div role="radiogroup" aria-label={label}>
            <Tag
                ref={(ref) => {
                    tagsRefs.current[ALL_TAG_ID] = ref;
                }}
                type={type}
                id={ALL_TAG_ID}
                title={translator.getMessage('filtering_type_all')}
                checked={allButtonEnabled}
                onClick={handleAllClick}
                onKeyDown={onKeyDown}
            />
            {filters.map((tag) => (
                <Tag
                    ref={(ref) => {
                        tagsRefs.current[tag.id] = ref;
                    }}
                    key={tag.id}
                    type={type}
                    id={tag.id}
                    title={tag.title}
                    tooltip={tag.tooltip}
                    checked={!allButtonEnabled && tag.enabled}
                    onClick={handleTagClick}
                    onKeyDown={onKeyDown}
                />
            ))}
        </div>
    );
};
