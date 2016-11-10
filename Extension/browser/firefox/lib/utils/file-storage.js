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

/* global Cc, Ci, components */

var FsUtils = (function () {

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
        writeAsync: writeAsync,
        readAsync: readAsync
    };

})();

/**
 * File storage adapter.
 * For FF we store rules in files
 */
var FS = {

    PROFILE_DIR: 'ProfD',
    ADGUARD_DIR: 'Adguard',
    CSS_FILE_PATH: 'elementsHide.css',
    LINE_BREAK: '\n',

    readFromFile: function (filename, callback) {

        try {
            var file = FileUtils.getFile(this.PROFILE_DIR, [this.ADGUARD_DIR, filename]);
            if (!file.exists() || file.fileSize === 0) {
                callback(null, []);
                return;
            }

            FsUtils.readAsync(file, function (error, data) {
                if (error) {
                    Log.error("Error read file {0}, cause: {1}", filename, error);
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
            Log.error("Error read file {0}, cause: {1}", filename, ex);
            callback(this._translateError(ex));
        }
    },

    writeToFile: function (filename, data, callback) {

        try {

            var content = data.join(FS.LINE_BREAK);

            this._createDir();
            var file = FileUtils.getFile(this.PROFILE_DIR, [this.ADGUARD_DIR, filename]);

            FsUtils.writeAsync(file, content, function (error) {
                if (error) {
                    Log.error("Error write to file {0}, cause: {1}", filename, error);
                }
                callback(error);
            });

        } catch (ex) {
            Log.error("Error write to file {0}, cause: {1}", filename, ex);
            callback(this._translateError(ex));
        }
    },

    removeFile: function (path, successCallback) {
        var file = FileUtils.getFile(this.PROFILE_DIR, [this.ADGUARD_DIR, path]);
        if (!file.exists() || file.fileSize === 0) {
            successCallback();
            return;
        }
        try {
            file.remove();
            successCallback();
        } catch (ex) {
            //ignore
        }
    },

    /**
     * Saves CSS stylesheet to file.
     *
     * This method is used in Firefox extension only.
     * If user has enabled "Send statistics for ad filters usage" option we change the way of applying CSS rules.
     * In this case we register browser-wide stylesheet using StyleService.registerSheet.
     * We should save it to file before registering the stylesheet.
     *
     * @param cssRules CSS file content
     * @param callback Called when operation is finished
     */
    saveStyleSheetToDisk: function (cssRules, callback) {
        if (this._cssSaving) {
            return;
        }
        this._cssSaving = true;

        var filePath = this.CSS_FILE_PATH;

        FS.writeToFile(filePath, cssRules, function (e) {
            if (e && e.error) {
                Log.error("Error write css styleSheet to file {0} cause: {1}", filePath, e);
                return;
            } else {
                callback();
            }
            this._cssSaving = false;
        }.bind(this));
    },

    /**
     * Gets CSS file URI
     *
     * This method is used in Firefox extension only.
     * If user has enabled "Send statistics for ad filters usage" option we change the way of applying CSS rules.
     * In this case we register browser-wide stylesheet using StyleService.registerSheet.
     * We should save it to file before registering the stylesheet.
     *
     * @returns CSS file URI
     */
    getInjectCssFileURI: function () {
        if (!this.injectCssUrl) {
            this.injectCssUrl = this._getFileInAdguardDirUri(this.CSS_FILE_PATH);
        }
        return this.injectCssUrl;
    },

    _getFileInAdguardDirUri: function (filename) {
        var styleFile = FileUtils.getFile(this.PROFILE_DIR, [this.ADGUARD_DIR, filename]);
        var ioService = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);
        return ioService.newFileURI(styleFile).QueryInterface(Ci.nsIFileURL);
    },

    /* Create dir in profile folder */
    _createDir: function () {
        var adguardDir = FileUtils.getDir(this.PROFILE_DIR, [this.ADGUARD_DIR]);
        if (!adguardDir.exists()) {
            adguardDir.create(Ci.nsIFile.DIRECTORY_TYPE, parseInt("0755", 8)); // u+rwx go+rx
        }
    },

    _translateError: function (e) {
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
};

