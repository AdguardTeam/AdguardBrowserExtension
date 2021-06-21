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
    return dataUrl;
};
