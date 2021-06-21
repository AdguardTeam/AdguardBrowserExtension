import React, { useEffect } from 'react';

import '../RequestInfo/request-image.pcss';

export const ImageRequest = ({ src }) => {
    useEffect(() => {
        // clean up blob src on component destroying for preventing memory leak
        return () => {
            URL.revokeObjectURL(src);
        };
    });
    return <img src={src} className="request-image" alt="request" />;
};
