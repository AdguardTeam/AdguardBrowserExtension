// async functions invoking by state machine on fetch event.
// https://xstate.js.org/docs/guides/communication.html#invoking-promises

/**
 * @param {Object} ctx - state machine context
 * @param {*} payload - state machine event payload
 */
export const fetchText = async (ctx, { url }) => {
    const res = await fetch(url);
    return res.text();
};

/**
 * @param {Object} ctx - state machine context
 * @param {*} payload - state machine event payload
 */
export const fetchImage = async (ctx, { url }) => {
    const res = await fetch(url);
    const blob = await res.blob();
    const dataUrl = URL.createObjectURL(blob);

    // check image size
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.src = url;

        function loadHandler(event) {
            const { width, height } = event.target;

            if (width > 1 && height > 1) {
                resolve(dataUrl);
            } else {
                reject(new Error('Image is too small'));
            }
        }

        image.addEventListener('load', loadHandler);
        image.addEventListener('error', reject);
    });
};
