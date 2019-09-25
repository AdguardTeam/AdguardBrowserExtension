/**
 * This file is part of Adguard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * Adguard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Adguard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with Adguard Browser Extension.  If not, see <http://www.gnu.org/licenses/>.
 */

/* global contentPage */

const showSaveFunc = (function () {
    let showSave;
    const DownloadAttributeSupport = 'download' in document.createElement('a');

    const Blob = window.Blob || window.WebKitBlob || window.MozBlob;
    const URL = window.URL || window.webkitURL || window.mozURL;

    navigator.saveBlob = navigator.saveBlob || navigator.mozSaveBlob || navigator.webkitSaveBlob || navigator.msSaveBlob;
    window.saveAs = window.saveAs || window.webkitSaveAs || window.mozSaveAs || window.msSaveAs;

    if (Blob && navigator.saveBlob) {
        showSave = function (data, name, mimetype) {
            const blob = new Blob([data], { type: mimetype });
            if (window.saveAs) {
                window.saveAs(blob, name);
            } else {
                navigator.saveBlob(blob, name);
            }
        };
    } else if (Blob && URL) {
        showSave = function (data, name, mimetype) {
            let url;
            const blob = new Blob([data], { type: mimetype });
            if (DownloadAttributeSupport) {
                url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.setAttribute('href', url);
                link.setAttribute('download', name || 'Download.bin');
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else {
                url = URL.createObjectURL(blob);
                window.open(url, '_blank', '');
            }
            setTimeout(() => {
                URL.revokeObjectURL(url);
            }, 250);
        };
    }
    return showSave;
})();

document.addEventListener('DOMContentLoaded', () => {
    const exportTypeMap = {
        '#uf': {
            title: 'user_filter',
            messageType: 'getUserRules',
            filename: 'rules',
            ext: 'txt',
        },
        '#wl': {
            title: 'whitelist',
            messageType: 'getWhiteListDomains',
            filename: 'whitelist',
            ext: 'txt',
        },
        '#exs': {
            title: 'settings',
            messageType: 'loadSettingsJson',
            filename: 'settings',
            ext: 'json',
        },
    };

    const exportType = exportTypeMap[document.location.hash];

    const formatToTwoDigits = (num) => {
        if (num < 10) {
            return `0${num}`;
        }
        return `${num}`;
    };

    const getCurrentTimeFormatted = () => {
        const date = new Date();
        const year = date.getFullYear();
        const month = formatToTwoDigits(date.getMonth() + 1);
        const day = formatToTwoDigits(date.getDate());
        const hours = formatToTwoDigits(date.getHours());
        const minutes = formatToTwoDigits(date.getMinutes());
        const seconds = formatToTwoDigits(date.getSeconds());
        return `${year}${month}${day}_${hours}${minutes}${seconds}`;
    };

    const addContentToPage = (content) => {
        const el = document.createElement('pre');
        el.textContent = content;
        document.body.appendChild(el);
    };

    const callback = function ({ content, appVersion }) {
        addContentToPage(content);
        const currentTimeStr = getCurrentTimeFormatted();
        const filename = `${currentTimeStr}_adg_ext_${exportType.title}_${appVersion}.${exportType.ext}`;
        if (showSaveFunc) {
            showSaveFunc(content, filename, 'text/plain;charset=utf-8');
        }
    };

    contentPage.sendMessage({ type: exportType.messageType }, callback);
});
