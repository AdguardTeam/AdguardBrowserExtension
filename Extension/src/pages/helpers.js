import { translator } from '../common/translators/translator';

export const getFilenameExtension = (filename) => {
    if (!filename) {
        return undefined;
    }
    const parts = filename.split('.');
    if (parts.length < 2) {
        return undefined;
    }
    return parts[parts.length - 1];
};

export const uploadFile = (file, requiredExtension) => new Promise((resolve, reject) => {
    if (getFilenameExtension(file.name) !== requiredExtension) {
        reject(new Error(translator.getMessage(
            'options_popup_import_settings_wrong_file_ext',
            { extension: requiredExtension },
        )));
    }
    const reader = new FileReader();
    reader.readAsText(file, 'UTF-8');
    reader.onload = (evt) => {
        resolve(evt.target.result);
    };
    reader.onerror = () => {
        reject(new Error(translator.getMessage('options_popup_import_error_file_description')));
    };
});

export const hoursToMs = (hours) => {
    const MS_IN_HOUR = 1000 * 60 * 60;
    return hours * MS_IN_HOUR;
};

/**
 * Awaits required period of time
 * @param timeoutMs
 * @returns {Promise<unknown>}
 */
export const sleep = (timeoutMs) => {
    return new Promise((resolve) => {
        setTimeout(resolve, timeoutMs);
    });
};

export const indexOfIgnoreCase = (str, searchString) => {
    return str.toLowerCase().indexOf(searchString.toLowerCase());
};

export const containsIgnoreCase = (str, searchString) => {
    return !!(str && searchString && indexOfIgnoreCase(str, searchString) >= 0);
};

export const findChunks = (str, searchString, chunks = []) => {
    const ind = indexOfIgnoreCase(str, searchString);
    if (ind > -1) {
        chunks.push(str.slice(0, ind));
        chunks.push(str.slice(ind, ind + searchString.length));
        const restStr = str.slice(ind + searchString.length);
        if (containsIgnoreCase(restStr, searchString)) {
            findChunks(restStr, searchString, chunks);
        } else {
            chunks.push(restStr);
        }
    }
    return chunks.filter((i) => !!i);
};

export const passiveEventSupported = (() => {
    let passiveSupported = null;

    return () => {
        // memoize support to avoid adding multiple test events
        if (typeof passiveSupported === 'boolean') {
            return passiveSupported;
        }

        let supported = false;
        try {
            const options = {
                get passive() {
                    supported = true;
                    return false;
                },
            };

            window.addEventListener('test', null, options);
            window.removeEventListener('test', null, options);
        } catch (err) {
            supported = false;
        }
        passiveSupported = supported;
        return passiveSupported;
    };
})();
