import { useEffect } from 'react';
import { createPortal } from 'react-dom';

export const Portal = ({ id, children }) => {
    const mount = document.getElementById(id);
    const el = document.createElement('div');

    useEffect(() => {
        mount.appendChild(el);
        return () => mount.removeChild(el);
    }, [el, mount]);

    return createPortal(children, el);
};
