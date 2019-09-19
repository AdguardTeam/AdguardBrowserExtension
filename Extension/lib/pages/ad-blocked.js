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

/* global chrome */

let adguard;

const getAdguard = () => new Promise((resolve) => {
    const api = window.browser || chrome;
    api.runtime.getBackgroundPage((bgPage) => {
        resolve(bgPage.adguard);
    });
});

const fillBlockRule = (blockRule) => {
    const blockRuleNode = document.querySelector('#blockRule');
    blockRuleNode.textContent = blockRule;
};

const handleProceedAnyway = (url, rule) => {
    adguard.rules.documentFilterService.addToTrusted(url, rule);
};

document.addEventListener('DOMContentLoaded', async () => {
    adguard = await getAdguard();

    const urlParams = new URLSearchParams(document.location.search);
    const blockRule = urlParams.get('rule');
    const url = urlParams.get('url');

    fillBlockRule(blockRule);

    const proceedBtn = document.querySelector('#btnProceed');
    proceedBtn.addEventListener('click', (e) => {
        e.preventDefault();
        handleProceedAnyway(url, blockRule);
    });
});
