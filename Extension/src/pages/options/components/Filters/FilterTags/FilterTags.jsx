import React from 'react';

import { FilterTag } from './FilterTag';

export const FilterTags = ({ tags }) => {
    if (tags.length === 0) {
        return null;
    }

    return (
        <div className="filter__tags">
            {tags.map((tag) => <FilterTag key={tag.tagId} tag={tag} />)}
        </div>
    );
};
