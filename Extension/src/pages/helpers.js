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

export const containsIgnoreCase = (str, searchString) => {
    return !!(str && searchString && str.toLowerCase().indexOf(searchString.toLowerCase()) >= 0);
};
