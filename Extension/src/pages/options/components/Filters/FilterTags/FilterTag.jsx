/* eslint-disable jsx-a11y/click-events-have-key-events,jsx-a11y/no-static-element-interactions */
import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../../stores/RootStore';

export const FilterTag = observer(({ tag }) => {
    const { settingsStore } = useContext(rootStore);

    const tagString = `#${tag.keyword}`;

    const handleClick = (e) => {
        e.preventDefault();
        // we remove other content of search input when user clicks to tag
        settingsStore.setSearchInput(tagString);
    };

    return (
        <div
            data-tooltip={tag.description}
            className="filter__tag"
            onClick={handleClick}
        >
            {tagString}
        </div>
    );
});
