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

/* global Cc, Ci, components, FileUtils, NetUtil */

/**
 * File storage implementation for firefox
 * @type {{readAsync, writeAsync}}
 */
adguard.fileStorageImpl = (function () {

    'use strict';

    var converter = Cc["@mozilla.org/intl/scriptableunicodeconverter"].createInstance(Ci.nsIScriptableUnicodeConverter);
    converter.charset = "UTF-8";

    var OPEN_FLAGS = {
        RDONLY: parseInt("0x01"),
        WRONLY: parseInt("0x02"),
        CREATE_FILE: parseInt("0x08"),
        APPEND: parseInt("0x10"),
        TRUNCATE: parseInt("0x20"),
        EXCL: parseInt("0x80")
    };

    /**
     * Async read file.
     * https://developer.mozilla.org/en-US/Add-ons/Code_snippets/File_I_O#Reading_from_a_file
     * @param file
     * @param callback
     */
    var readAsync = function (file, callback) {

        var fetchCallback = function (inputStream, status) {
            if (components.isSuccessCode(status)) {
                try {
                    var data = NetUtil.readInputStreamToString(inputStream, inputStream.available());
                    data = converter.ConvertToUnicode(data);
                    callback(null, data);
                } catch (ex) {
                    callback(ex);
                }
            } else {
                callback(status);
            }
        };

        try {
            NetUtil.asyncFetch(file, fetchCallback);
        } catch (ex) {
            // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/199
            var aSource = {
                uri: file,
                loadUsingSystemPrincipal: true
            };

            NetUtil.asyncFetch(aSource, fetchCallback);
        }
    };

    /**
     * Async write file
     * https://developer.mozilla.org/en-US/Add-ons/Code_snippets/File_I_O#Writing_to_a_file
     * @param file
     * @param content
     * @param callback
     */
    var writeAsync = function (file, content, callback) {

        var stream = Cc['@mozilla.org/network/file-output-stream;1'].createInstance(Ci.nsIFileOutputStream);
        var openFlags = OPEN_FLAGS.WRONLY | OPEN_FLAGS.CREATE_FILE | OPEN_FLAGS.TRUNCATE; // jshint ignore:line
        var permFlags = parseInt("0644", 8); // u+rw go+r
        stream.init(file, openFlags, permFlags, 0);

        var istream = converter.convertToInputStream(content);

        NetUtil.asyncCopy(istream, stream, function (status) {
            if (components.isSuccessCode(status)) {
                callback(null);
            } else {
                callback(status);
            }
        });
    };

    return {
        readAsync: readAsync,
        writeAsync: writeAsync
    };

})();

/**
 * File storage adapter.
 * For FF we store rules in files
 */
adguard.fileStorage = (function (adguard) {

    'use strict';

    var PROFILE_DIR = 'ProfD';
    var ADGUARD_DIR = 'Adguard';
    var LINE_BREAK = '\n';

    /* Create dir in profile folder */
    function createAdguardDir() {
        var adguardDir = FileUtils.getDir(PROFILE_DIR, [ADGUARD_DIR]);
        if (!adguardDir.exists()) {
            adguardDir.create(Ci.nsIFile.DIRECTORY_TYPE, parseInt("0755", 8)); // u+rwx go+rx
        }
    }

    function translateError(e) {
        var msg = e.message || e.name;
        if (msg) {
            return msg;
        }
        switch (e.code) {
            case 0x80520001:
                msg = 'NS_ERROR_FILE_UNRECOGNIZED_PATH';
                break;
            case 0x80520002:
                msg = 'NS_ERROR_FILE_UNRESOLVABLE_SYMLINK ';
                break;
            case 0x80520003:
                msg = 'NS_ERROR_FILE_EXECUTION_FAILED ';
                break;
            case 0x80520006:
                msg = 'NS_ERROR_FILE_TARGET_DOES_NOT_EXIST ';
                break;
            case 0x80520007:
                msg = 'NS_ERROR_FILE_COPY_OR_MOVE_FAILED ';
                break;
            case 0x80520008:
                msg = 'NS_ERROR_FILE_ALREADY_EXISTS ';
                break;
            case 0x80520009:
                msg = 'NS_ERROR_FILE_INVALID_PATH';
                break;
            case 0x8052000A:
                msg = 'NS_ERROR_FILE_DISK_FULL';
                break;
            case 0x8052000E:
                msg = 'NS_ERROR_FILE_IS_LOCKED';
                break;
            default:
                msg = 'Unknown Error';
                break;
        }
        return msg;
    }

    var readFromFile = function (filename, callback) {

        try {
            var file = FileUtils.getFile(PROFILE_DIR, [ADGUARD_DIR, filename]);
            if (!file.exists() || file.fileSize === 0) {
                callback(null, []);
                return;
            }

            adguard.fileStorageImpl.readAsync(file, function (error, data) {
                if (error) {
                    adguard.console.error("Adguard addon: Error read file {0}, cause: {1}", filename, error);
                    callback(error);
                } else {
                    if (!data) {
                        callback(null, []);
                    } else {
                        var lines = data.split(/[\r\n]+/);
                        callback(null, lines);
                    }
                }
            });

        } catch (ex) {
            adguard.console.error("Adguard addon: Error read file {0}, cause: {1}", filename, ex);
            callback(translateError(ex));
        }
    };

    var writeToFile = function (filename, data, callback) {

        try {

            var content = data.join(LINE_BREAK);

            createAdguardDir();
            var file = FileUtils.getFile(PROFILE_DIR, [ADGUARD_DIR, filename]);

            adguard.fileStorageImpl.writeAsync(file, content, function (error) {
                if (error) {
                    adguard.console.error("Adguard addon: Error write to file {0}, cause: {1}", filename, error);
                }
                callback(error);
            });

        } catch (ex) {
            adguard.console.error("Adguard addon: Error write to file {0}, cause: {1}", filename, ex);
            callback(translateError(ex));
        }
    };

    var removeFile = function (path, successCallback) {
        var file = FileUtils.getFile(PROFILE_DIR, [ADGUARD_DIR, path]);
        if (!file.exists() || file.fileSize === 0) {
            successCallback();
            return;
        }
        try {
            // Weird bug. See for details: http://forums.mozillazine.org/viewtopic.php?f=19&t=1783085
            file.remove(0);
            successCallback();
        } catch (ex) {
            //ignore
            adguard.console.error('Adguard addon: Cannot remove file {0}: {1}', path, ex);
        }
    };

    return {
        readFromFile: readFromFile,
        writeToFile: writeToFile,
        removeFile: removeFile
    };

})(adguard);


