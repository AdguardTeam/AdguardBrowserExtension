/* eslint-disable jsx-a11y/click-events-have-key-events,jsx-a11y/no-static-element-interactions */
import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../../stores/RootStore';
import { HighlightSearch } from '../Search/HighlightSearch';

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
            className="filter__tag"
            onClick={handleClick}
        >
            <HighlightSearch string={tagString} />
        </div>
    );
});
