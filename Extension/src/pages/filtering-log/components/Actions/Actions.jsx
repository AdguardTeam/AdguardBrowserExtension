import React, { useContext } from 'react';
import { rootStore } from '../../stores/RootStore';

import './actions.pcss';

const Actions = () => {
    const { logStore } = useContext(rootStore);

    const clearLogHandler = async (e) => {
        e.preventDefault();
        await logStore.clearFilteringEvents();
    };

    // TODO check accessibility
    return (
        <div className="actions">
            <div className="action">Refresh page</div>
            <div className="action action--clear" onClick={clearLogHandler}>Clear log</div>
            <div className="action">Save logs after refreshing</div>
        </div>
    );
};

export { Actions };
