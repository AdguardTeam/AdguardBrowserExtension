import React, { useEffect, useState } from 'react';

import '../RequestInfo/request-image.pcss';

export const ImageRequest = ({ url, onError, onSuccess }) => {
    const [shouldRenderImage, setShouldRenderImage] = useState(false);

    useEffect(() => {
        const image = new Image();
        image.src = url;

        function loadHandler(event) {
            const { width, height } = event.target;

            if (width > 1 && height > 1) {
                setShouldRenderImage(true);
                onSuccess();
            } else {
                onError();
            }
        }

        image.addEventListener('load', loadHandler);
        image.addEventListener('error', onError);

        return () => {
            image.removeEventListener('load', loadHandler);
        };
    }, []);

    if (!shouldRenderImage) {
        return null;
    }

    return <img src={url} className="request-image" alt="request" />;
};
