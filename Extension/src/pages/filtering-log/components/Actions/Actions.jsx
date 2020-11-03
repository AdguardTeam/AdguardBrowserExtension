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
            <div className="action">Save logs after refreshing</div>
        </div>
    );
};

export { Actions };
