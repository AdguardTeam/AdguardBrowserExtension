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

    init: function (status) {

        this.unauthorizedBlock = $('#loginBlock');
        this.authorizedBlock = $('#authorizedBlock');
        this.signInButton = $('#signInButton');
        this.signOutButton = $('#signOutButton');
        this.startSyncButton = $('#startSyncButton');
        this.syncNowButton = $('#syncNowButton');
        this.selectProviderButton = $('#selectProviderButton');
        this.providersModalEl = $('#providersModal');

        this._render(status);
        this._initializeProvidersModal(status);
        this._bindControls(status);
    },

    _render: function (options) {

        var provider = options.currentProvider;
        if (!provider) {
            this._renderSelectProviderBlock();
            return;
        }

        if (!provider.isAuthorized || !options.enabled) {
            this._renderUnauthorizedBlock(provider, options);
        } else {

            this._renderAuthorizedBlock(provider);
        }
    },

    _renderSelectProviderBlock: function () {
        this.unauthorizedBlock.show();
        this.authorizedBlock.hide();
        this.signInButton.hide();
        this.startSyncButton.hide();
    },

    _renderUnauthorizedBlock: function (provider, options) {

        this.unauthorizedBlock.show();
        this.authorizedBlock.hide();

        if (provider.isOAuthSupported && !provider.isAuthorized) {
            this.signInButton.show();
        } else {
            this.signInButton.hide();
        }

        if (!options.enabled && provider.isAuthorized) {
            this.startSyncButton.show();
        } else {
            this.startSyncButton.hide();
        }

        this.selectProviderButton.text(provider.title);
    },

    _renderAuthorizedBlock: function (provider) {

        this.unauthorizedBlock.hide();
        this.authorizedBlock.show();

        $('#providerNameInfo').text(provider.title);

        var lastSyncTimeInfo = $('#lastSyncTimeInfo');
        var manageAccountButton = $('#manageAccountButton');
        var deviceNameBlock = $('#deviceNameBlock');

        if (provider.lastSyncTime) {
            lastSyncTimeInfo.text(new Date(parseInt(provider.lastSyncTime)).toLocaleString());
        } else {
            lastSyncTimeInfo.text(i18n.getMessage('sync_last_sync_time_never_sync_text'));
        }

        if (provider.isOAuthSupported && provider.name === 'ADGUARD_SYNC') {
            manageAccountButton.show();
            deviceNameBlock.show();
            $('#deviceNameInput').val(provider.deviceName);
        } else {
            manageAccountButton.hide();
            deviceNameBlock.hide();
        }
    },

    _bindControls: function (options) {

        function reload() {
            document.location.reload();
        }

        this.selectProviderButton.on('click', function () {
            this.providersModal.modal('show');
        }.bind(this));

        var provider = options.currentProvider;

        if (provider) {
            this.signInButton.on('click', function (e) {
                e.preventDefault();
                contentPage.sendMessage({
                    type: 'authSync',
                    provider: provider.name
                }, reload);
            });
            this.signOutButton.on('click', function (e) {
                e.preventDefault();
                if (provider.isOAuthSupported) {
                    contentPage.sendMessage({
                        type: 'dropAuthSync',
                        provider: provider.name
                    }, reload);
                } else {
                    contentPage.sendMessage({type: 'toggleSync'}, reload);
                }
            });
        }

        this.startSyncButton.on('click', function (e) {
            e.preventDefault();
            contentPage.sendMessage({type: 'toggleSync'}, reload);
        });

        this.syncNowButton.on('click', function (e) {
            e.preventDefault();
            contentPage.sendMessage({type: 'syncNow'}, reload);
        });

        $('#changeDeviceNameButton').on('click', function (e) {
            e.preventDefault();
            var deviceName = $('#deviceNameInput').val();
            contentPage.sendMessage({
                type: 'syncChangeDeviceName',
                deviceName: deviceName
            }, reload);
        });
    },

    _initializeProvidersModal: function (options) {

        this.providersModal = this.providersModalEl.modal({
            backdrop: 'static',
            show: false
        });

        var browserStorageSupported = options.providers.filter(function (p) {
                return p.name === 'BROWSER_SYNC';
            }).length > 0;
        if (!browserStorageSupported) {
            this.providersModal.find('.browser-storage-provider-select').hide();
        }

        var provider = options.currentProvider;
        if (provider) {
            switch (provider.name) {
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