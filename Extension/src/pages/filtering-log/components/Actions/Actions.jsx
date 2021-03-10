import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import cn from 'classnames';

import { rootStore } from '../../stores/RootStore';
import { reactTranslator } from '../../../../common/translators/reactTranslator';
import { Icon } from '../../../common/components/ui/Icon';

import './actions.pcss';

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
        'custom-checkbox',
        { active: preserveLogEnabled },
    );

    return (
        <div className="actions">
            <div className="actions__action">
                <button
                    className="actions__refresh"
                    type="button"
                    onClick={refreshPage}
                >
                    <Icon id="#reload" classname="icon--reload actions__refresh-ico" />
                    {reactTranslator.getMessage('filtering_refresh_tab')}
                </button>
            </div>
            <div className="actions__action">
                <button
                    className="actions__clear"
                    type="button"
                    onClick={clearLogHandler}
                >
                    <Icon id="#cross" classname="actions__cross" />
                    {reactTranslator.getMessage('filtering_clear_log_events')}
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
                        <Icon id="#checked" classname="icon--checked" />
                    </div>
                    {reactTranslator.getMessage('filtering_log_preserve_log')}
                </label>
            </div>
        </div>
    );
});

export { Actions };
