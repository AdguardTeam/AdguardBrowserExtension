import React, { useContext } from 'react';
import { rootStore } from '../../stores/RootStore';

// FIXME add back button
const RequestBlock = () => {
    const { logStore } = useContext(rootStore);

    const { selectedEvent } = logStore;

    return <>Request block</>;
};

export { RequestBlock };
