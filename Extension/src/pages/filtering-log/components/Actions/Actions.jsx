import React, { useContext } from 'react';
import { rootStore } from '../../stores/RootStore';

import './actions.pcss';

const Actions = () => {
    const { logStore } = useContext(rootStore);

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

    // TODO check accessibility
    return (
        <div className="actions">
            <button
                className="action"
                type="button"
                onClick={refreshPage}
            >
                Refresh page
            </button>

            <div className="action action--clear" onClick={clearLogHandler}>Clear log</div>

            <label htmlFor="preserveLog">
                <input
                    type="checkbox"
                    className="action"
                    name="preserveLog"
                    id="preserveLog"
                    onChange={preserveLogHandler}
                />
                Preserve log
            </label>
        </div>
    );
};

export { Actions };
