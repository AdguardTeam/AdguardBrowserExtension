/**
 * Copyright (c) 2015-2025 Adguard Software Ltd.
 *
 * @file
 * This file is part of AdGuard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * AdGuard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * AdGuard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with AdGuard Browser Extension. If not, see <http://www.gnu.org/licenses/>.
 */

/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/quotes */

/**
 * NOTE: This array is automatically updated via `update-local-test-script-rules.ts` script.
 * Do not edit it manually, your changes will be lost.
 *
 * This array contains a set of script rules from testcases
 * that are used for integration testing.
 * It should be added explicitly to the list of local rules to allow inject them
 * via Scripting API when User Script permission is not granted.
 */
export const TESTCASES_RULES = [
    // Source: https://testcases.agrd.dev/Filters/generichide-rules/generichide-rules.txt
    `testcases.agrd.dev,pages.dev#%#!function(){let e=()=>{document.querySelector("#case-1-generichide > .test-banner1").style.width="200px"};"complete"===document.readyState?e():window.document.addEventListener("readystatechange",e)}();`,
    // Source: https://testcases.agrd.dev/Filters/script-rules/test-script-rules.txt
    `testcases.agrd.dev,pages.dev#%#window.__testCase1 = true;`,
    `testcases.agrd.dev,pages.dev#%#window.adg_test=true;`,
    `testcases.agrd.dev,pages.dev#%#window.adg_test=false;`,
    `testcases.agrd.dev,pages.dev#@%#window.adg_test=false;`,
    `testcases.agrd.dev,pages.dev#%#window.orderTest = ""`,
    `testcases.agrd.dev,pages.dev#%#window.orderTest += "1"`,
    `testcases.agrd.dev,pages.dev#%#window.orderTest += "2"`,
    `testcases.agrd.dev,pages.dev#%#window.orderTest += "3"`,
    `testcases.agrd.dev,pages.dev#%#window.orderTest += "4"`,
    // Source: https://testcases.agrd.dev/Filters/script-rules/test-script-firefox/test-script-firefox.txt
    `testcases.agrd.dev#%#window.__firefoxTest1 = true;`,
    `testcases.agrd.dev#%#document.cookie = "adg_test";`,
    // Source: https://testcases.agrd.dev/Filters/script-rules/jsinject-rules/test-jsinject-rules.txt
    `testcases.agrd.dev,pages.dev#%#document.__jsinjectTest = true;`,
    // Source: https://testcases.agrd.dev/Filters/nonbasic-path-modifier/test-nonbasic-path-modifier.txt
    `[$path=/subpage1]testcases.agrd.dev,pages.dev#%#window.__case13=true;`,
    `[$path=/subpage2]testcases.agrd.dev,pages.dev#%#window.__case14=true;`,
    `[$path=/sub.*/]testcases.agrd.dev,pages.dev#%#window.__case15=true;`,
    `[$path=/subpage(?!1)/]testcases.agrd.dev,pages.dev#%#window.__case16=true;`,
    // Source: https://testcases.agrd.dev/Filters/advanced-domain-modifier/test-advanced-domain-modifier.txt
    `testcases.agrd.*,pages.*#%#window.__case5=true;`,
    // Source: https://testcases.agrd.dev/Filters/content-security-policy/test-content-security-policy.txt
    `testcases.agrd.dev,pages.dev#%#console.log('script rule')`,
    `testcases.agrd.dev,pages.dev#%#console.log(Date.now(), "default registered script")`,
    // Source: https://testcases.agrd.dev/Filters/injection-speed/test-injection-speed.txt
    `testcases.agrd.dev,pages.dev#%#console.log('script rule')`,
    `testcases.agrd.dev,pages.dev#%#console.log(Date.now(), "default registered script")`,
];
