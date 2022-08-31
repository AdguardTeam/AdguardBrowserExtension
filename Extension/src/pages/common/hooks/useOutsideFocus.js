import { useEffect, useCallback } from 'react';

export const useOutsideFocus = (ref, callback) => {
    const handleFocus = useCallback((e) => {
        if (ref.current && !ref.current.contains(e.target)) {
            callback();
        }
    }, [ref, callback]);

    useEffect(() => {
        document.addEventListener('focusin', handleFocus);

        return () => {
            document.removeEventListener('focusin', handleFocus);
        };
    }, [handleFocus]);
};
