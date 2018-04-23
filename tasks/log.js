export default class Logs {
    error(text, data) {
        if (text) {
            throw new Error(text, data);
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
