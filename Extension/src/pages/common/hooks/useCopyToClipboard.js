import {
    useEffect,
    useCallback,
    useState,
} from 'react';

import { copyToClipboard } from '../../helpers';

export const useCopyToClipboard = (duration) => {
    // store object in state for force rerender
    const [state, setState] = useState({ isCopied: false });

    useEffect(() => {
        let timeout;
        if (state.isCopied && duration) {
            timeout = setTimeout(() => {
                setState({ isCopied: false });
            }, duration);
        }
        return () => {
            clearTimeout(timeout);
        };
    }, [state, duration]);

    const handleCopy = useCallback((text) => {
        copyToClipboard(text);
        setState({ isCopied: true });
    }, []);

    return [state.isCopied, handleCopy];
};
