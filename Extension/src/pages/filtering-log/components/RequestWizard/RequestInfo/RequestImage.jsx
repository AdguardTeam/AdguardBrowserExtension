import React, { useEffect, useState } from 'react';

const RequestImage = (props) => {
    const { url } = props;
    const [shouldRenderImage, setShouldRenderImage] = useState(false);

    useEffect(() => {
        const image = new Image();
        image.src = url;
        image.onload = (event) => {
            const { width, height } = event.target;
            if (width > 1 && height > 1) {
                setShouldRenderImage(true);
            }
        };
    });

    return (shouldRenderImage && <img src={url} alt="request" />);
};

export { RequestImage };
