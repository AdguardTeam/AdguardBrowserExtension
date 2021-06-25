import { useEffect } from 'react';
import { createPortal } from 'react-dom';

export const Portal = ({ id, children }) => {
    const parent = document.getElementById(id);
    const el = document.createElement('div');

    useEffect(() => {
        parent.appendChild(el);
        return () => parent.removeChild(el);
    }, [el, parent]);

    return createPortal(children, el);
};
