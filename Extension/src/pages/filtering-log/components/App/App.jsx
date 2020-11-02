import React from 'react';

import { Actions } from '../Actions';
import { Filters } from '../Filters';
import { Requests } from '../Requests';

const App = () => {
    return (
        <>
            <Actions />
            <Filters />
            <Requests />
        </>
    );
};

export { App };
