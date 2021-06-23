import React, { useContext, useState } from 'react';
import { observer } from 'mobx-react';
import cn from 'classnames';

import { rootStore } from '../../stores/RootStore';
import { reactTranslator } from '../../../../common/translators/reactTranslator';
import { Icon } from '../../../common/components/ui/Icon';

import './actions.pcss';
import { EventsSearch } from '../Filters/EventsSearch';
import { TabSelector } from '../Filters/TabSelector';
import { Tooltip } from '../../../common/components/ui/Tooltip';

const Actions = observer(() => {
    const { logStore } = useContext(rootStore);

    const { preserveLogEnabled } = logStore;

    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

    const clearLogHandler = async (e) => {
        e.preventDefault();
        await logStore.clearFilteringEvents();
    };

    const refreshPage = async (e) => {
        e.preventDefault();
        await logStore.refreshPage();
    };

    const handleMouseClear = (e) => {
        const { clientX, clientY } = e;
        setTooltipPosition({
            x: clientX - 30,
            y: clientY + 20,
        });
    };

    const handleMousePreserve = (e) => {
        const { clientX, clientY } = e;
        setTooltipPosition({
            x: clientX - 920,
            y: clientY,
        });
    };

    const preserveLogHandler = (e) => {
        logStore.setPreserveLog(e.target.checked);
    };

    const preserveLogClassName = cn(
        'record',
        { active: preserveLogEnabled },
    );

    const clearLogToolpitText = reactTranslator.getMessage('filtering_clear_log_events');

    const preserveLogToolpitText = preserveLogEnabled
        ? reactTranslator.getMessage('filtering_log_preserve_log_on')
        : reactTranslator.getMessage('filtering_log_preserve_log_off');

    return (
        <div className="actions">
            <div className="actions__col">
                <TabSelector />
                <EventsSearch />
            </div>
            <div className="actions__col">
                <div className="actions__action actions__clear">
                    <button
                        className="actions__clear"
                        type="button"
                        onClick={clearLogHandler}
                        onMouseMove={handleMouseClear}
                    >
                        <Icon id="#trash" classname="icon--trash actions__del" />
                        <Tooltip
                            text={clearLogToolpitText}
                            position={tooltipPosition}
                        />
                    </button>
                </div>
                <div className="actions__action actions__preserve">
                    <label className="checkbox-label" htmlFor="preserveLog">
                        <input
                            type="checkbox"
                            name="preserveLog"
                            id="preserveLog"
                            onChange={preserveLogHandler}
                            defaultChecked={false}
                        />
                        <div
                            className={preserveLogClassName}
                            onMouseMove={handleMousePreserve}
                        >
                            <Tooltip
                                text={preserveLogToolpitText}
                                position={tooltipPosition}
                            />
                        </div>
                    </label>
                </div>
                <div className="actions__action">
                    <button
                        className="actions__refresh"
                        type="button"
                        onClick={refreshPage}
                    >
                        <Icon id="#reload" classname="icon--reload actions__refresh-ico" />
                        {reactTranslator.getMessage('filtering_refresh_tab_short')}
                    </button>
                </div>
            </div>
        </div>
    );
});

export { Actions };
