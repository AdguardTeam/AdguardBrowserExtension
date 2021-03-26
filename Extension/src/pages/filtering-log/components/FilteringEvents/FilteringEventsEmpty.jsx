import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { Icon } from '../../../common/components/ui/Icon';
import { reactTranslator } from '../../../../common/translators/reactTranslator';
import { rootStore } from '../../stores/RootStore';

export const FilteringEventsEmpty = observer(() => {
    const { logStore } = useContext(rootStore);

    if (logStore.events.length > 0) {
        return null;
    }

    return (
        <div className="filtering-log__empty">
            <div className="filtering-log__empty-in">
                <Icon id="#magnifying" classname="filtering-log__empty-img" />
                <div className="filtering-log__desc">
                    {reactTranslator.getMessage('filtering_table_empty_reload_page_desc', {
                        a: (chunks) => (
                            <button
                                className="filtering-log__refresh"
                                type="button"
                                onClick={logStore.refreshPage}
                            >
                                {chunks}
                            </button>
                        ),
                    })}
                </div>
            </div>
        </div>
    );
});
