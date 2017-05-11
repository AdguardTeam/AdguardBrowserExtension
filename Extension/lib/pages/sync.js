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

/* global contentPage, $, i18n, createEventListener */

var PageController = function () {
    this.unauthorizedBlock = $('#loginBlock');
    this.authorizedBlock = $('#authorizedBlock');
    this.signInButton = $('#signInButton');
    this.signOutButton = $('#signOutButton');
    this.startSyncButton = $('#startSyncButton');
    this.syncNowButton = $('#syncNowButton');
    this.lastSyncTimeInfo = $('#lastSyncTimeInfo');
    this.selectProviderButton = $('#selectProviderButton');
    this.providersModalEl = $('#providersModal');
    this.providersModal = this.providersModalEl.modal({
        backdrop: 'static',
        show: false
    });
};

PageController.prototype = {

    init: function (status) {
        this.syncStatus = status;
        this.currentProvider = status.currentProvider;
        this._render();
        this._bindControls();
    },

    update: function (status) {
        this.syncStatus = status;
        this.currentProvider = status.currentProvider;
        this._render(status);
    },

    _render: function () {

        var provider = this.currentProvider;
        if (!provider) {
            this._renderSelectProviderBlock();
            return;
        }

        if (!provider.isAuthorized || !this.syncStatus.enabled) {
            this._renderUnauthorizedBlock();
        } else {

            this._renderAuthorizedBlock();
        }

        var browserStorageSupported = this.syncStatus.providers.filter(function (p) {
                return p.name === 'BROWSER_SYNC';
            }).length > 0;
        if (!browserStorageSupported) {
            this.providersModal.find('.browser-storage-provider-select').hide();
        }

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

    },

    _renderSelectProviderBlock: function () {
        this.unauthorizedBlock.show();
        this.authorizedBlock.hide();
        this.signInButton.hide();
        this.startSyncButton.hide();
    },

    _renderUnauthorizedBlock: function () {

        this.unauthorizedBlock.show();
        this.authorizedBlock.hide();

        var provider = this.currentProvider;

        if (provider.isOAuthSupported && !provider.isAuthorized) {
            this.signInButton.show();
        } else {
            this.signInButton.hide();
        }

        if (!this.syncStatus.enabled && provider.isAuthorized) {
            this.startSyncButton.show();
        } else {
            this.startSyncButton.hide();
        }

        this.selectProviderButton.text(provider.title);
    },

    _renderAuthorizedBlock: function () {

        this.unauthorizedBlock.hide();
        this.authorizedBlock.show();

        var provider = this.currentProvider;

        $('#providerNameInfo').text(provider.title);

        var manageAccountButton = $('#manageAccountButton');
        var deviceNameBlock = $('#deviceNameBlock');

        this.updateSyncState();

        if (provider.isOAuthSupported && provider.name === 'ADGUARD_SYNC') {
            manageAccountButton.show();
            deviceNameBlock.show();
            $('#deviceNameInput').val(provider.deviceName);
        } else {
            manageAccountButton.hide();
            deviceNameBlock.hide();
        }
    },

    _bindControls: function () {

        this.selectProviderButton.on('click', function () {
            this.providersModal.modal('show');
        }.bind(this));

        this.signInButton.on('click', function (e) {
            e.preventDefault();
            var provider = this.currentProvider;
            if (provider) {
                contentPage.sendMessage({
                    type: 'authSync',
                    provider: provider.name
                });
            }
        }.bind(this));

        this.signOutButton.on('click', function (e) {
            e.preventDefault();
            var provider = this.currentProvider;
            if (provider && provider.isOAuthSupported) {
                contentPage.sendMessage({
                    type: 'dropAuthSync',
                    provider: provider.name
                });
            } else {
                contentPage.sendMessage({type: 'toggleSync'});
            }
        }.bind(this));

        this.startSyncButton.on('click', function (e) {
            e.preventDefault();
            contentPage.sendMessage({type: 'toggleSync'});
        });

        this.syncNowButton.on('click', function (e) {
            e.preventDefault();
            this.updateSyncState();
            contentPage.sendMessage({type: 'syncNow'});
        }.bind(this));

        $('#changeDeviceNameButton').on('click', function (e) {
            e.preventDefault();
            var deviceName = $('#deviceNameInput').val();
            contentPage.sendMessage({
                type: 'syncChangeDeviceName',
                deviceName: deviceName
            });
        });

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
    },

    updateSyncState: function () {

        if (this.syncStatus.syncInProgress) {
            this.syncNowButton.attr('disabled', 'disabled');
            this.syncNowButton.text(i18n.getMessage('sync_in_progress_button_text'));
        } else {
            this.syncNowButton.removeAttr('disabled');
            this.syncNowButton.text(i18n.getMessage('sync_now_button_text'));
        }

        var provider = this.currentProvider;
        if (provider) {
            var lastSyncTime = provider.lastSyncTime;
            if (lastSyncTime) {
                this.lastSyncTimeInfo.text(new Date(parseInt(lastSyncTime)).toLocaleString());
            } else {
                this.lastSyncTimeInfo.text(i18n.getMessage('sync_last_sync_time_never_sync_text'));
            }
        }
    }
};

contentPage.sendMessage({type: 'initializeFrameScript'}, function (response) {

    var syncStatusInfo = response.syncStatusInfo;
    var EventNotifierTypes = response.constants.EventNotifierTypes;

    $(document).ready(function () {

        var controller = new PageController();
        controller.init(syncStatusInfo);

        createEventListener([EventNotifierTypes.SYNC_STATUS_UPDATED], function (event, options) {
            switch (event) {
                case EventNotifierTypes.SYNC_STATUS_UPDATED:
                    controller.update(options.status);
                    break;
            }
        });
    });
});