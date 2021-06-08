import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import cn from 'classnames';

import { rootStore } from '../../stores/RootStore';
import { reactTranslator } from '../../../../common/translators/reactTranslator';
import { Icon } from '../../../common/components/ui/Icon';

import './actions.pcss';
import { EventsSearch } from '../Filters/EventsSearch';
import { TabSelector } from '../Filters/TabSelector';

const Actions = observer(() => {
    const { logStore } = useContext(rootStore);

    const { preserveLogEnabled } = logStore;

    const clearLogHandler = async (e) => {
        e.preventDefault();
        await logStore.clearFilteringEvents();
    };

    const refreshPage = async (e) => {
        e.preventDefault();
        await logStore.refreshPage();
    };

    const preserveLogHandler = (e) => {
        logStore.setPreserveLog(e.target.checked);
    };

    const preserveLogClassName = cn(
        'record',
        { active: preserveLogEnabled },
    );

    return (
        <div className="actions">
            <div className="actions__col">
                <TabSelector />
                <EventsSearch />
            </div>
            <div className="actions__col">
                <div className="actions__action">
                    <button
                        className="actions__clear"
                        type="button"
                        onClick={clearLogHandler}
                    >
                        <Icon id="#trash" classname="icon--trash actions__del" />
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
                        <div className={preserveLogClassName}>
                            <div className="record__tooltip record__tooltip--off">
                                {reactTranslator.getMessage('filtering_log_preserve_log_off')}
                            </div>
                            <div className="record__tooltip record__tooltip--on">
                                {reactTranslator.getMessage('filtering_log_preserve_log_on')}
                            </div>
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
