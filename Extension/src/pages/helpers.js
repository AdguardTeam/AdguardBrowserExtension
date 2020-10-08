import i18n from './services/i18n';

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

export const uploadFile = (file) => new Promise((resolve, reject) => {
    if (getExtension(file.name) !== 'json') {
        reject(new Error(i18n.translate('options_popup_import_settings_wrong_file_extension')));
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
