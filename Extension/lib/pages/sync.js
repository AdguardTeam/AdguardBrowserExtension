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

/* global contentPage, $, i18n */

var PageController = function () {
};

PageController.prototype = {

    providersLocales: {
        'ADGUARD_SYNC': i18n.getMessage("sync_provider_adguard"),
        'DROPBOX': i18n.getMessage("sync_provider_dropbox"),
        'BROWSER_SYNC': i18n.getMessage("sync_provider_browser_storage")
    },

    init: function (status) {
        this._render(status);
        this._initializeProvidersModal(status);
        this._bindControls(status);
    },

    _render: function (options) {
        var unauthorizedBlock = $('#loginBlock');
        var authorizedBlock = $('#authorizedBlock');

        if (!options.isAuthorized || !options.enabled) {
            unauthorizedBlock.show();
            authorizedBlock.hide();

            this._renderUnauthorizedBlock(options);

        } else {
            unauthorizedBlock.hide();
            authorizedBlock.show();

            this._renderAuthorizedBlock(options);
        }
    },

    _renderUnauthorizedBlock: function (options) {
        var signInButton = $('#signInButton');
        var startSyncButton = $('#startSyncButton');

        if (options.isOAuthSupported && !options.isAuthorized) {
            signInButton.show();
        } else {
            signInButton.hide();
        }

        if (!options.enabled && options.isAuthorized) {
            startSyncButton.show();
        } else {
            startSyncButton.hide();
        }

        $('#selectProviderButton').text(this.providersLocales[options.providerName]);
    },

    _renderAuthorizedBlock: function (options) {
        $('#providerNameInfo').text(this.providersLocales[options.providerName]);

        var lastSyncTimeInfo = $('#lastSyncTimeInfo');
        var manageAccountButton = $('#manageAccountButton');
        var deviceNameBlock = $('#deviceNameBlock');

        if (options.lastSyncTime) {
            lastSyncTimeInfo.text(new Date(parseInt(options.lastSyncTime)).toLocaleString());
        } else {
            lastSyncTimeInfo.text('Never synced');
        }

        if (options.isOAuthSupported && options.providerName === 'ADGUARD_SYNC') {
            manageAccountButton.show();
            deviceNameBlock.show();

            $('#deviceNameInput').val(options.deviceName);
        } else {
            manageAccountButton.hide();
            deviceNameBlock.hide();
        }
    },

    _bindControls: function (options) {
        $('#selectProviderButton').click(function () {
            this.providersModal.modal('show');
        }.bind(this));

        $('#signInButton').click(function (e) {
            e.preventDefault();

            contentPage.sendMessage({
                type: 'authSync',
                provider: options.providerName
            }, function () {
                document.location.reload();
            });
        });

        $('#startSyncButton').click(function (e) {
            e.preventDefault();

            contentPage.sendMessage({type: 'toggleSync'}, function () {
                document.location.reload();
            });
        });

        $('#syncNowButton').click(function (e) {
            e.preventDefault();

            contentPage.sendMessage({type: 'syncNow'}, function () {
                document.location.reload();
            });
        });

        $('#changeDeviceNameButton').click(function (e) {
            e.preventDefault();

            var deviceName = $('#deviceNameInput').val();
            contentPage.sendMessage({
                type: 'syncChangeDeviceName',
                deviceName: deviceName
            }, function () {
                document.location.reload();
            });
        });

        $('#signOutButton').click(function (e) {
            e.preventDefault();

            if (options.isOAuthSupported) {
                contentPage.sendMessage({
                    type: 'dropAuthSync',
                    provider: options.providerName
                }, function () {
                    document.location.reload();
                });
            } else {
                contentPage.sendMessage({type: 'toggleSync'}, function () {
                    document.location.reload();
                });
            }
        });
    },

    _initializeProvidersModal: function (options) {
        this.providersModalEl = $('#providersModal');
        this.providersModal = this.providersModalEl.modal({
            backdrop: 'static',
            show: false
        });

        if (!options.browserStorageSupported) {
            this.providersModal.find('.browser-storage-provider-select').hide();
        }

        switch (options.providerName) {
            case 'ADGUARD_SYNC':
                this.providersModal.find('.adguard-provider-select').addClass('active');
                break;
            case 'DROPBOX':
                this.providersModal.find('.dropbox-provider-select').addClass('active');
                break;
            case 'BROWSER_SYNC':
                this.providersModal.find('.browser-storage-provider-select').addClass('active');
                break;
        }

        this.providersModal.find('#adguardSelectProvider').on('click', this._onProviderSelected('ADGUARD_SYNC'));
        this.providersModal.find('#dropboxSelectProvider').on('click', this._onProviderSelected('DROPBOX'));
        this.providersModal.find('#browserStorageSelectProvider').on('click', this._onProviderSelected('BROWSER_SYNC'));
    },

    _onProviderSelected: function (providerName) {
        return function (e) {
            e.preventDefault();

            this.providersModalEl.modal('hide');

            contentPage.sendMessage({type: 'setSyncProvider', provider: providerName}, function () {
                document.location.reload();
            });
        }.bind(this);
    }
};

contentPage.sendMessage({type: 'getSyncStatus'}, function (response) {

    $(document).ready(function () {
        var controller = new PageController();
        controller.init(response);
    });
});