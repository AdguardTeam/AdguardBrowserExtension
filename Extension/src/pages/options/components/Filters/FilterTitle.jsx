import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import cn from 'classnames';

import { rootStore } from '../../stores/RootStore';
import { reactTranslator } from '../../../../common/translators/reactTranslator';
import { Icon } from '../../../common/components/ui/Icon';

import './filter.pcss';

const FilterTitle = observer(({ filter, search }) => {
    const { settingsStore } = useContext(rootStore);

    const {
        name,
        filterId,
        homepage,
        customUrl,
    } = filter;

    const removeCustomFilter = async () => {
        const result = window.confirm(reactTranslator.getMessage('options_delete_filter_confirm'));
        if (result) {
            await settingsStore.removeCustomFilter(filterId);
        }
    };

    const renderRemoveButton = () => {
        if (customUrl) {
            return (
                <a
                    className="filter__remove"
                    onClick={removeCustomFilter}
                >
                    <Icon id="#trash" classname="icon--trash" />
                </a>
            );
        }
        return null;
    };

    const renderName = () => {
        const findChunks = (str, chunks = []) => {
            const ind = str.toLowerCase().indexOf(search.toLowerCase());
            if (ind > -1) {
                chunks.push(str.slice(0, ind));
                chunks.push(str.slice(ind, ind + search.length));
                const restStr = str.slice(ind + search.length);
                if (restStr.indexOf(search.toLowerCase()) > -1) {
                    findChunks(restStr, chunks);
                } else {
                    chunks.push(restStr);
                }
            }
            return chunks;
        };

        const nameChunks = findChunks(name);

        const filterName = [];

        for (let i = 0; i < nameChunks.length; i += 1) {
            const chunk = nameChunks[i];
            const isSearchMatch = chunk.toLowerCase() === search.toLowerCase();
            const chunkClassName = cn({
                filter__search: isSearchMatch,
            });
            filterName.push(<span key={`${chunk}${i}`} className={chunkClassName}>{chunk}</span>);
        }

        return filterName;
    };

    return (
        <div className="filter__title">
            <span className="filter__title-in">
                {
                    search.length > 0 && name.toLowerCase().indexOf(search.toLowerCase()) > -1
                        ? renderName()
                        : name
                }
            </span>
            <span className="filter__controls">
                <a
                    className="filter__link"
                    href={homepage || customUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <Icon id="#link" classname="icon--link" />
                </a>
                {renderRemoveButton()}
            </span>
        </div>
    );
});

export { FilterTitle };
