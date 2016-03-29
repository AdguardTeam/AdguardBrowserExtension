/* global require, exports */
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
var {components, Cu, Ci, Cc} = require('chrome');
var sdkPathFor = require('sdk/system').pathFor;
var sdkFile = require('sdk/io/file');

var {NetUtil} = Cu.import("resource://gre/modules/NetUtil.jsm", null);
var {FileUtils} = Cu.import("resource://gre/modules/FileUtils.jsm", null);

var converter = Cc["@mozilla.org/intl/scriptableunicodeconverter"].createInstance(Ci.nsIScriptableUnicodeConverter);
converter.charset = "UTF-8";

var ioService = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);

var Log = require('../../lib/utils/log').Log;

/**
 * File storage adapter
 */
var FS = exports.FS = {

    PROFILE_DIR: 'ProfD',
    ADGUARD_DIR: 'Adguard',
    LINE_BREAK: '\n',

    readFromFile: function (filename, callback) {

        try {
            var filePath = FileUtils.getFile(this.PROFILE_DIR, [this.ADGUARD_DIR, filename]);
            if (!filePath.exists() || filePath.fileSize === 0) {
                callback(null, []);
                return;
            }
            var fetchCallback = function (inputStream, status) {
                if (components.isSuccessCode(status)) {
                    try {
                        var data = NetUtil.readInputStreamToString(inputStream, inputStream.available());
                        data = converter.ConvertToUnicode(data);
                        var lines = data.split(/[\r\n]+/);
                        if (!data) {
                            callback(null, []);
                            return;
                        }
                        callback(null, lines);
                    } catch (ex) {
                        callback(ex);
                    }
                } else {
                    callback(status);
                }
            };
            
            try {
                NetUtil.asyncFetch(filePath, fetchCallback);
            } catch (ex) {
                // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/199                
                var aSource = {
                    uri: filePath,
                    loadUsingSystemPrincipal: true
                };
                
                NetUtil.asyncFetch(aSource, fetchCallback);                
            }
        } catch (ex) {
            callback(ex);
        }
    },

    writeToFile: function (filename, data, callback) {
        try {
            this._createDir();
            var filePath = sdkFile.join(sdkPathFor(this.PROFILE_DIR), this.ADGUARD_DIR, filename);
            var content = data.join(FS.LINE_BREAK);

            var textWriter = sdkFile.open(filePath, 'w');//utf-8 charset by default
            textWriter.writeAsync(content, function (error) {
                if (error) {
                    Log.error("Error read file {0}, cause: {1}", filename, error);
                    callback(error);
                } else {
                    callback(null);
                }
            });

        } catch (ex) {
            Log.error("Error writing to file {0}, cause: {1}", filename, ex);
            callback(ex);
        }
    },

    /**
     * Remove adguard directory on extension uninstall
     * https://bugzilla.mozilla.org/show_bug.cgi?id=627432
     */
    removeAdguardDir: function () {
        try {
            var adguardDir = sdkFile.join(sdkPathFor(this.PROFILE_DIR), this.ADGUARD_DIR);
            if (sdkFile.exists(adguardDir)) {
                Log.info('Removing profile directory {0}', adguardDir);
                var files = sdkFile.list(adguardDir);
                for (var i = 0; i < files.length; i++) {
                    var filePath = sdkFile.join(sdkPathFor(this.PROFILE_DIR), this.ADGUARD_DIR, files[i]);
                    sdkFile.remove(filePath);
                }
                sdkFile.rmdir(adguardDir);
            }
        } catch (ex) {
            //ignore
            Log.error('Error remove profile directory, cause {0}', ex);
        }
    },

    /* Create dir in profile folder */
    _createDir: function () {
        var adguardDir = sdkFile.join(sdkPathFor(this.PROFILE_DIR), this.ADGUARD_DIR);
        if (sdkFile.exists(adguardDir)) {
            return;
        }
        sdkFile.mkpath(adguardDir);
    },

    translateError: function (e) {
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
    },

    getFileInAdguardDirUri: function (filename) {
        var styleFile = FileUtils.getFile(this.PROFILE_DIR, [this.ADGUARD_DIR, filename]);
        return ioService.newFileURI(styleFile).QueryInterface(Ci.nsIFileURL);
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
    }
};
