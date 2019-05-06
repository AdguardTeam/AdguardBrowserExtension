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

/**
 * Sync settings provider
 */
(function (api, adguard) {
    const requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;

    const readFile = function (path, callback) {
        const errorHandler = function (e) {
            adguard.console.error(e);

            callback(false);
        };

        const onInitFs = function (fs) {
            fs.root.getFile(path, {}, (fileEntry) => {
                fileEntry.file((file) => {
                    const reader = new FileReader();

                    reader.onloadend = function () {
                        callback(JSON.parse(this.result));
                    };

                    reader.readAsText(file);
                }, errorHandler);
            }, errorHandler);
        };

        requestFileSystem(window.TEMPORARY, 1024 * 1024, onInitFs, errorHandler);
    };

    /**
     * TODO: This way we can only work on browser sandbox file system
     *
     * @param path
     * @param data
     * @param callback
     */
    const saveFile = function (path, data, callback) {
        const errorHandler = function (e) {
            adguard.console.error(e);

            callback(false);
        };

        const onInitFs = function (fs) {
            fs.root.getFile(path, { create: true }, (fileEntry) => {
                // Create a FileWriter object for our FileEntry (log.txt).
                fileEntry.createWriter((fileWriter) => {
                    let truncated = false;
                    fileWriter.onwriteend = function () {
                        if (!truncated) {
                            truncated = true;
                            this.truncate(this.position);
                            return;
                        }

                        callback(true);
                    };

                    fileWriter.onerror = function (e) {
                        adguard.console.error(e);
                        callback(false);
                    };

                    const blob = new Blob([JSON.stringify(data)], { type: 'text/plain' });
                    fileWriter.write(blob);
                }, errorHandler);
            }, errorHandler);
        };

        requestFileSystem(window.TEMPORARY, 1024 * 1024, onInitFs, errorHandler);
    };


    // API
    const load = function (filePath, callback) {
        readFile(filePath, callback);
    };

    const save = function (filePath, data, callback) {
        saveFile(filePath, data, callback);
    };

    // EXPOSE
    api.syncProviders.register('FILE', {
        load,
        save,
    });
})(adguard.sync, adguard);
