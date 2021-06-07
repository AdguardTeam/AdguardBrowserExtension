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

    return (
        <div className="miscellaneous-filters">
            <div
                className="miscellaneous-filters__filters"
                ref={ref}
            >
                <div className="miscellaneous-filters__section">
                    <Tags
                        type={NAVIGATION_TAGS.PARTY}
                        tags={logStore.requestSourceFilters}
                        setTags={logStore.setRequestSourceFilters}
                    />
                </div>
                <div className="miscellaneous-filters__section">
                    <Tags
                        type={NAVIGATION_TAGS.REGULAR}
                        tags={logStore.miscellaneousFilters}
                        setTags={logStore.setMiscellaneousFilters}
                    />
                </div>
            </div>
        </div>
    );
});

export { MiscellaneousFilters };
