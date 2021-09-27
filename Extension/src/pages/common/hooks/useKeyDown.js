import { useEffect, useCallback } from 'react';

export const useKeyDown = (ref, key, callback) => {
    const handleKeyDown = useCallback((e) => {
        if (ref.current && e.key === key) {
            callback();
        }
    }, [ref, key, callback]);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleKeyDown]);
};
