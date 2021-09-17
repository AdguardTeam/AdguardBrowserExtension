import React from 'react';
import { Popover } from '../../../../common/components/ui/Popover';

import { FilterTag } from './FilterTag';

export const FilterTags = ({ tags }) => {
    if (tags.length === 0) {
        return null;
    }

    return (
        <div className="filter__tags">
            {tags.map((tag) => (
                <Popover text={tag.description} key={tag.tagId}>
                    <FilterTag tag={tag} />
                </Popover>
            ))}
        </div>
    );
};
