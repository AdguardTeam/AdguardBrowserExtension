/**
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

import React from 'react';

import classNames from 'classnames';

import { translator } from '../../../../../common/translators/translator';
import { Popover } from '../../../../common/components/ui/Popover';
import { UserAgent } from '../../../../../common/user-agent';

function getTagClassName({ id, type, active }) {
    return classNames(
        'tag',
        id && `tag--${id}`,
        type && `tag--${type}`,
        active && 'active',
    );
}

export const Tags = ({
    tags,
    setTags,
    type,
    label,
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
        if (UserAgent.isMacOs ? e.metaKey : e.ctrlKey) {
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

            const active = !allButtonEnabled && enabled;
            const descriptionId = `tag-description-${id}`;

            const button = (
                <button
                    key={id}
                    role="radio"
                    type="button"
                    value={id}
                    className={getTagClassName({ id, type, active })}
                    aria-checked={active}
                    onClick={handleTagClick}
                    aria-label={title}
                    aria-describedby={descriptionId}
                >
                    {title}
                    {tooltip && (
                        <span id={descriptionId} className="sr-only">
                            {tooltip}
                        </span>
                    )}
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
        <div role="radiogroup" aria-label={label}>
            <div className="tag-wrapper">
                <button
                    role="radio"
                    type="button"
                    className={getTagClassName({ type, active: allButtonEnabled })}
                    aria-checked={allButtonEnabled}
                    onClick={handleAllClick}
                >
                    {translator.getMessage('filtering_type_all')}
                </button>
            </div>
            {renderTypes()}
        </div>
    );
};
