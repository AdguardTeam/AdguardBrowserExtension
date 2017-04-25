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

/* global contentPage, $ */

var PageController = function () {
};

PageController.prototype = {

    init: function (status) {
        this._render(status);
    },

    _render: function (status) {
        var providerName = null;
        var isOAuthSupported = false;
        var isAuthorized = false;
        if (status.currentProvider) {
            providerName = status.currentProvider.name;
            isOAuthSupported = status.currentProvider.isOAuthSupported;
            isAuthorized = status.currentProvider.isAuthorized;
        }

        if (!isAuthorized || !status.enabled) {
            $('#loginBlock').show();
            $('#authorizedBlock').hide();

            if (isOAuthSupported && !isAuthorized) {
                $('#signInButton').show();
            } else {
                $('#signInButton').hide();
            }

            if (!status.enabled && isAuthorized) {
                $('#startSyncButton').show();
            } else {
                $('#startSyncButton').hide();
            }

            $('#selectProviderButton').text(providerName);

        } else {
            $('#loginBlock').hide();
            $('#authorizedBlock').show();

            $('#providerNameInfo').text(providerName);
        }

        this._initializeProvidersModal();

        var self = this;
        $('#selectProviderButton').click(function () {
            self.providersModal.modal('show');
        });

        $('#signInButton').click(function () {
            contentPage.sendMessage({
                type: 'authSync',
                provider: providerName
            }, function () {
                document.location.reload();
            });
        });

        $('#startSyncButton').click(function () {
            contentPage.sendMessage({type: 'toggleSync'}, function () {
                document.location.reload();
            });
        });


        ///

        var statusText =
            'Sync enabled: ' + status.enabled + '<br/>' +
            'Last sync time: ' + (status.lastSyncTime ? new Date(parseInt(status.lastSyncTime)) : '') + '<br/>' +
            'Current provider: ' + providerName + '<br/>' +
            'OAuth supported: ' + isOAuthSupported + '<br/>' +
            'Auth: ' + isAuthorized + '<br/>';

        $("#statusPlaceholder").html(statusText);

        var refreshAuthButton = $('#refreshAuth');
        var logoutAuthButton = $('#logoutAuth');
        if (isOAuthSupported) {
            if (isAuthorized) {
                refreshAuthButton.hide();
                logoutAuthButton.show();
                logoutAuthButton.click(function () {
                    contentPage.sendMessage({
                        type: 'dropAuthSync',
                        provider: providerName
                    }, function () {
                        document.location.reload();
                    });
                });
            } else {
                refreshAuthButton.show();
                refreshAuthButton.click(function () {
                    contentPage.sendMessage({
                        type: 'authSync',
                        provider: providerName
                    }, function () {
                        document.location.reload();
                    });
                });

                logoutAuthButton.hide();
            }
        } else {
            refreshAuthButton.hide();
            logoutAuthButton.hide();
        }

        if (status.enabled) {
            $('#toggleStatus').text('Disable sync');
        } else {
            $('#toggleStatus').text('Enable sync');
        }

        $('#toggleStatus').click(function () {
            contentPage.sendMessage({type: 'toggleSync'}, function () {
                document.location.reload();
            });
        });

        $('#syncNow').click(function () {
            contentPage.sendMessage({type: 'syncNow'}, function () {
                document.location.reload();
            });
        });

        $('#dropboxProvider').click(function () {
            contentPage.sendMessage({type: 'setSyncProvider', provider: 'DROPBOX'}, function () {
                document.location.reload();
            });
        });

        $('#agSyncProvider').click(function () {
            contentPage.sendMessage({type: 'setSyncProvider', provider: 'ADGUARD_SYNC'}, function () {
                document.location.reload();
            });
        });

        $('#browserStorageProvider').click(function () {
            contentPage.sendMessage({type: 'setSyncProvider', provider: 'BROWSER_SYNC'}, function () {
                document.location.reload();
            });
        });
    },

    _initializeProvidersModal: function () {
        this.providersModalEl = $('#providersModal');
        this.providersModal = this.providersModalEl.modal({
            backdrop: 'static',
            show: false
        });

        //TODO: Mark current provider

        this.providersModal.find('#adguardSelectProvider').on('click', function (e) {
            e.preventDefault();

            this.providersModalEl.modal('hide');
            this._onProviderSelected('ADGUARD_SYNC');
        }.bind(this));

        this.providersModal.find('#dropboxSelectProvider').on('click', function (e) {
            e.preventDefault();

            this.providersModalEl.modal('hide');
            this._onProviderSelected('DROPBOX');
        }.bind(this));

        this.providersModal.find('#browserStorageSelectProvider').on('click', function (e) {
            e.preventDefault();

            this.providersModalEl.modal('hide');
            this._onProviderSelected('BROWSER_SYNC');
        }.bind(this));
    },

    _onProviderSelected: function (providerName) {
        contentPage.sendMessage({type: 'setSyncProvider', provider: providerName}, function () {
            document.location.reload();
        });
    }
};

contentPage.sendMessage({type: 'getSyncStatus'}, function (response) {

    $(document).ready(function () {
        var controller = new PageController();
        controller.init(response);
    });
});