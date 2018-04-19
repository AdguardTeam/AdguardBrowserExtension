export default class Logs {
    error(text) {
        if (text) {
            throw new Error(text);
        } else {
            throw new Error('Unknown error');
        }
    }

    info(text) {
        if (text) {
            console.info(text);
        } else {
            console.info('unknown info');
        }
    }
}
