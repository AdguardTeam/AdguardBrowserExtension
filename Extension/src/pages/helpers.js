import { i18n } from './services';

export const getExtension = (filename) => {
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
    if (getExtension(file.name) !== requiredExtension) {
        // FIXME translation with extension
        reject(new Error(i18n.translate(
            'options_popup_import_settings_wrong_file_extension',
            { extension: requiredExtension },
        )));
    }
    const reader = new FileReader();
    reader.readAsText(file, 'UTF-8');
    reader.onload = (evt) => {
        resolve(evt.target.result);
    };
    reader.onerror = () => {
        reject(new Error(i18n.translate('options_popup_import_error_file_description')));
    };
});


export const hoursToMs = (hours) => {
    const MS_IN_HOUR = 1000 * 60 * 60;
    return hours * MS_IN_HOUR;
};
