import React from 'react';

import './actions.pcss';

const Actions = () => {
    return (
        <div className="actions">
            <div className="action">Refresh page</div>
            <div className="action">Clear log</div>
            <div className="action">Save logs after refreshing</div>
        </div>
    );
};

export { Actions };
