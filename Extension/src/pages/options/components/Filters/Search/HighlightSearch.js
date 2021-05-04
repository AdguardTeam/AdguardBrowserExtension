import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import cn from 'classnames';

import { rootStore } from '../../../stores/RootStore';
import { containsIgnoreCase, findChunks } from '../../../../helpers';

const HighlightSearch = observer(({ name }) => {
    const { settingsStore: { searchInput } } = useContext(rootStore);

    const renderName = () => {
        const nameChunks = findChunks(name, searchInput);

        const displayName = nameChunks.map((chunk, i) => {
            const isSearchMatch = chunk.toLowerCase() === searchInput.toLowerCase();
            const chunkClassName = cn({
                filter__search: isSearchMatch,
            });
            return (
                <span
                    key={i} // eslint-disable-line react/no-array-index-key
                    className={chunkClassName}
                >
                    {chunk}
                </span>
            );
        });

        return displayName;
    };

    return searchInput.length > 0 && containsIgnoreCase(name, searchInput)
        ? renderName()
        : name;
});

export { HighlightSearch };
