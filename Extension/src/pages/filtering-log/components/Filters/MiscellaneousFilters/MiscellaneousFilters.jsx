import React, {
    useContext,
    useRef,
} from 'react';
import { observer } from 'mobx-react';

import { NAVIGATION_TAGS } from '../../../../../common/constants';
import { rootStore } from '../../../stores/RootStore';
import { Tags } from '../Tags';

import './miscellaneous-filters.pcss';

const MiscellaneousFilters = observer(() => {
    const ref = useRef(null);

    const { logStore } = useContext(rootStore);

    const {
        requestSourceFilters,
        setRequestSourceFilters,
        miscellaneousFilters,
        setMiscellaneousFilters,
    } = logStore;

    return (
        <div className="miscellaneous-filters">
            <div
                className="miscellaneous-filters__filters"
                ref={ref}
            >
                <div className="miscellaneous-filters__section">
                    <Tags
                        type={NAVIGATION_TAGS.PARTY}
                        tags={requestSourceFilters}
                        setTags={setRequestSourceFilters}
                    />
                </div>
                <div className="miscellaneous-filters__section">
                    <Tags
                        type={NAVIGATION_TAGS.REGULAR}
                        tags={miscellaneousFilters}
                        setTags={setMiscellaneousFilters}
                    />
                </div>
            </div>
        </div>
    );
});

export { MiscellaneousFilters };
