import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import classNames from 'classnames';
import { rootStore } from '../../../stores/RootStore';

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
            <div className="action">
                <button
                    className="green-button"
                    type="button"
                    onClick={refreshPage}
                >
                    Refresh page
                </button>
            </div>
            <div className="action">
                <a className="action__clear" href="#" onClick={clearLogHandler}>Clear</a>
            </div>
            <div className="action">
                <label className="checkbox-label" htmlFor="preserveLog">
                    <input
                        type="checkbox"
                        name="preserveLog"
                        id="preserveLog"
                        onChange={preserveLogHandler}
                    />
                    <div className={preserveLogClassName} />
                    Preserve log
                </label>
            </div>
        </div>
    );
});

export { Actions };
