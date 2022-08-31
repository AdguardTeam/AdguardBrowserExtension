import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import cn from 'classnames';

import { rootStore } from '../../stores/RootStore';
import { reactTranslator } from '../../../../common/translators/reactTranslator';
import { Icon } from '../../../common/components/ui/Icon';
import { Popover } from '../../../common/components/ui/Popover';

import './actions.pcss';
import { EventsSearch } from '../Filters/EventsSearch';
import { TabSelector } from '../Filters/TabSelector';

const Actions = observer(() => {
    const { logStore, wizardStore } = useContext(rootStore);

    const { preserveLogEnabled } = logStore;

    const clearLogHandler = async (e) => {
        e.preventDefault();
        await logStore.clearFilteringEvents();
    };

    const refreshPage = async (e) => {
        e.preventDefault();
        await logStore.refreshPage();
        if (!preserveLogEnabled) {
            await wizardStore.closeModal();
        }
    };

    const preserveLogHandler = (e) => {
        logStore.setPreserveLog(e.target.checked);
    };

    const preserveLogClassName = cn(
        'record',
        { active: preserveLogEnabled },
    );

    const preserveLogTooltipText = preserveLogEnabled
        ? reactTranslator.getMessage('filtering_log_preserve_log_on')
        : reactTranslator.getMessage('filtering_log_preserve_log_off');

    const preserveLogInputId = 'preserveLog';

    return (
        <div className="actions">
            <div className="actions__col">
                <TabSelector />
            </div>
            <div className="actions__col actions__buttons">
                <div className="actions__action">
                    <Popover text={reactTranslator.getMessage('filtering_clear_log_events')}>
                        <button
                            type="button"
                            className="actions__clear"
                            aria-label={reactTranslator.getMessage('filtering_clear_log_events')}
                            onClick={clearLogHandler}
                        >
                            <Icon id="#trash" classname="icon--trash actions__del" />
                        </button>
                    </Popover>
                </div>
                <div className="actions__action actions__preserve">
                    <input
                        className="checkbox-input"
                        type="checkbox"
                        name="preserveLog"
                        id={preserveLogInputId}
                        onChange={preserveLogHandler}
                        checked={preserveLogEnabled}
                        aria-label={preserveLogTooltipText}
                    />
                    {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
                    <label
                        htmlFor={preserveLogInputId}
                        className="checkbox-label"
                    >
                        <Popover text={preserveLogTooltipText}>
                            <div className={preserveLogClassName}>
                                <Icon id="#radio" classname="icon--24" />
                            </div>
                        </Popover>
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
            <div className="actions__col actions__search">
                <EventsSearch />
            </div>
        </div>
    );
});

export { Actions };
