import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import classNames from 'classnames';

import { rootStore } from '../../stores/RootStore';
import { reactTranslator } from '../../../reactCommon/reactTranslator';

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

    const preserveLogClassName = classNames(
        'custom-checkbox',
        { active: preserveLogEnabled },
    );

    // TODO check accessibility
    return (
        <div className="actions">
            <div className="actions__action">
                <button
                    className="actions__refresh"
                    type="button"
                    onClick={refreshPage}
                >
                    {reactTranslator.translate('filtering_refresh_tab')}
                </button>
            </div>
            <div className="actions__action">
                <button
                    className="actions__clear"
                    type="button"
                    onClick={clearLogHandler}
                >
                    {reactTranslator.translate('filtering_clear_tab_events')}
                </button>
            </div>
            <div className="actions__action actions__preserve">
                <label className="checkbox-label" htmlFor="preserveLog">
                    <input
                        type="checkbox"
                        name="preserveLog"
                        id="preserveLog"
                        onChange={preserveLogHandler}
                    />
                    <div className={preserveLogClassName} />
                    {reactTranslator.translate('filtering_log_preserve_log')}
                </label>
            </div>
        </div>
    );
});

export { Actions };
