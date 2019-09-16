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

const api = window.browser || chrome;

let adguard;

const getAdguard = () => new Promise((resolve) => {
    api.runtime.getBackgroundPage((bgPage) => {
        resolve(bgPage.adguard);
    });
});

function hideNodes(nodes) {
    nodes.forEach((node) => {
        node.style.display = 'none';
    });
}

function onAdvancedClicked(advancedButton, moreInfoBtn, goButton) {
    moreInfoBtn.style.display = 'block';
    goButton.style.display = 'block';
    advancedButton.style.display = 'none';
}

function isValid(param) {
    return param && param.indexOf('<') < 0;
}

const replaceHostTemplates = (nodes, host) => {
    nodes.forEach((node) => {
        const nodeContent = node.textContent || node.innerText;
        node.innerHTML = nodeContent.replace('(var.Host)', host);
    });
};

document.addEventListener('DOMContentLoaded', async () => {
    adguard = await getAdguard();

    const advancedBtn = document.getElementById('advancedButton');
    const moreInfoBtn = document.getElementById('moreInfoButton');
    const btnProceed = document.getElementById('btnProceed');

    const urlParams = new URLSearchParams(document.location.search);
    const host = urlParams.get('host');
    const url = urlParams.get('url');
    const malware = urlParams.get('malware');
    const isMalware = (malware && malware === 'true') || true;

    const malwareNodes = [].slice.call(document.querySelectorAll('.malware'));
    const phishingNodes = [].slice.call(document.querySelectorAll('.phishing'));

    if (isMalware) {
        hideNodes(phishingNodes);
    } else {
        hideNodes(malwareNodes);
    }

    replaceHostTemplates(phishingNodes.concat(malwareNodes), host);

    if (host && isValid(host)) {
        const moreInfoUrl = `https://adguard.com/site.html?domain=${host}&utm_source=extension&aid=16593`;
        moreInfoBtn.setAttribute('href', moreInfoUrl);
    }

    if (url && isValid(url)) {
        btnProceed.addEventListener('click', (e) => {
            e.preventDefault();
            adguard.safebrowsing.addToSafebrowsingTrusted(url);
            adguard.tabs.getActive((tab) => {
                adguard.tabs.reload(tab.tabId, url);
            });
        });
    }

    advancedBtn.addEventListener('click', (e) => {
        e.preventDefault();
        onAdvancedClicked(advancedBtn, moreInfoBtn, btnProceed);
    });
});
