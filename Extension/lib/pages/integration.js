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

/* global $, NProgress, contentPage */

$(document).ready(function () {

    var DISABLE_INTEGRATION_TEXT = 'Отключить режим интеграции';
    var ENABLE_INTEGRATION_TEXT = 'Включить режим интеграции';
    var FIND_INTEGRATION_APP_TEXT = 'Найти приложение для интеграции';

    var INTEGRATION_APP_SEARCH_TEXT = 'Пожалуйста, подождите идет поиск приложения для интеграции.';
    var INTEGRATION_DISABLED_TEXT = 'Режим интеграции выключен';
    var INTEGRATION_APP_FOUND_TEXT = 'Приложения для интеграции найдено. Работает ';
    var INTEGRATION_APP_NOT_FOUND_TEXT = 'Приложение для интеграции не найдено';

    var statusTextEl = $('#statusText');
    var enableButton = $('#enableIntegration');
    var disableButton = $('#disableIntegration');

    function updateStatusText(text) {
        statusTextEl.text(text);
    }

    function updateButtonText(button, text) {
        button.text(text);
    }

    var disableIntegration = function (e) {
        e.preventDefault();
        contentPage.sendMessage({type: 'disableIntegration'}, function () {
            checkIntegrationStatus();
        });
    };
    var enableIntegration = function (e) {
        e.preventDefault();
        NProgress.inc();
        contentPage.sendMessage({type: 'enableIntegration'}, function () {
            checkIntegrationStatus();
        });
    };

    function onIntegrationSuccess(appInfo) {
        NProgress.done();
        updateButtonText(disableButton, DISABLE_INTEGRATION_TEXT);
        updateStatusText(INTEGRATION_APP_FOUND_TEXT + appInfo.name);
        $('.integration-status').addClass('hidden');
        $('.integration-success').removeClass('hidden');
    }

    function onIntegrationRejected(disabledByUser) {
        NProgress.done();
        if (disabledByUser) {
            updateButtonText(enableButton, ENABLE_INTEGRATION_TEXT);
            updateStatusText(INTEGRATION_DISABLED_TEXT);
        } else {
            updateButtonText(enableButton, FIND_INTEGRATION_APP_TEXT);
            updateStatusText(INTEGRATION_APP_NOT_FOUND_TEXT);
        }
        $('.integration-status').addClass('hidden');
        $('.integration-rejected').removeClass('hidden');
    }

    function checkIntegrationStatus() {

        updateStatusText(INTEGRATION_APP_SEARCH_TEXT);
        $('.integration-status').addClass('hidden');

        contentPage.sendMessage({type: 'checkIntegrationStatus'}, function (response) {
            var state = response.state;
            if (state === 'active') {
                onIntegrationSuccess(response.appInfo);
            } else if (state == 'rejected') {
                onIntegrationRejected(response.disabledByUser);
            } else {
                setTimeout(checkIntegrationStatus, 1000);
            }
        });
    }

    disableButton.on('click', disableIntegration);
    enableButton.on('click', enableIntegration);

    NProgress.inc();
    checkIntegrationStatus();
});
