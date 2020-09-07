const error = (text) => {
    if (text) {
        throw new Error(text);
    } else {
        throw new Error('Unknown error');
    }
};

const info = (text) => {
    if (text) {
        // eslint-disable-next-line no-console
        console.info(text);
    } else {
        // eslint-disable-next-line no-console
        console.info('Unknown info');
    }
};

export const cliLog = {
    error,
    info,
};
