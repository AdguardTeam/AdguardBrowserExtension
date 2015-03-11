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

/**
 * By the rules of AMO and addons.opera.com we cannot use remote scripts
 * (and our JS injection rules could be counted as remote scripts).
 *
 * So what we do:
 * 1. We gather all current JS rules in the DEFAULT_SCRIPT_RULES object
 * 2. We disable JS rules got from remote server
 * 3. We allow only custom rules got from the User filter (which user creates manually)
 *    or from this DEFAULT_SCRIPT_RULES object
 */
var DEFAULT_SCRIPT_RULES = exports.DEFAULT_SCRIPT_RULES = Object.create(null);
DEFAULT_SCRIPT_RULES[1] = [];
DEFAULT_SCRIPT_RULES[1].push("~rg.ru#%#var AdFox_getCodeScript = function() {};");
DEFAULT_SCRIPT_RULES[1].push("moonwalk.cc#%#setTimeout(200, function() { window.isgid = true; });");
DEFAULT_SCRIPT_RULES[1].push("thepiratebay.se,thepiratebay.pe,thepiratebay.ac,thepiratebay.se#%#window.onload=function(){window._wm={}}");
DEFAULT_SCRIPT_RULES[1].push("yandex.ru,yandex.com,yandex.ua,yandex.kz,yandex.by,beta.yandex.ru,beta.yandex.ua,beta.yandex.by#%#var __adgRemoveDirectColor = function() { $(\'.b-serp-item\').each(function() { var bgColor = $(this).css(\'background-color\'); if (bgColor == \'rgb(255, 252, 234)\' || bgColor == \'rgb(254, 249, 245)\') { $(this).css(\'display\', \'none\'); } }); };");
DEFAULT_SCRIPT_RULES[1].push("yandex.ru,yandex.com,yandex.ua,yandex.kz,yandex.by,beta.yandex.ru,beta.yandex.ua,beta.yandex.by#%#var __adgRemoveDirectTitle = function() { $(\'.serp-block .serp-adv__title-text\').each(function() { $(this).closest(\'.serp-block\').remove(); }); };");
DEFAULT_SCRIPT_RULES[1].push("yandex.ru,yandex.com,yandex.ua,yandex.kz,yandex.by,beta.yandex.ru,beta.yandex.ua,beta.yandex.by#%#var __adgRemoveDirectLabel = function() { $(\'.serp-block .serp-item__label\').each(function() { $(this).closest(\'.serp-item\').remove(); }); };");
DEFAULT_SCRIPT_RULES[1].push("yandex.ru,yandex.com,yandex.ua,yandex.kz,yandex.by,beta.yandex.ru,beta.yandex.ua,beta.yandex.by#%#var __adgRemoveDirect = function() { if (typeof __adgEnabled != \'undefined\' &&  !__adgEnabled) return; __adgRemoveDirectColor(); __adgRemoveDirectTitle(); __adgRemoveDirectLabel(); };");
DEFAULT_SCRIPT_RULES[1].push("yandex.ru,yandex.com,yandex.ua,yandex.kz,yandex.by,beta.yandex.ru,beta.yandex.ua,beta.yandex.by#%#window.addEventListener(\'DOMContentLoaded\', function() { try {$(document).ajaxComplete(__adgRemoveDirect); $(document).ready(__adgRemoveDirect);}catch(ex){} });");
DEFAULT_SCRIPT_RULES[1].push("yandex.ru,yandex.com,yandex.ua,yandex.kz,yandex.by,beta.yandex.ru,beta.yandex.ua,beta.yandex.by#%#try {__adgRemoveDirect();} catch(ex) {}");
DEFAULT_SCRIPT_RULES[1].push("megashara.com#%#window.addEventListener(\'DOMContentLoaded\', function() { $(\'body\').removeClass(\'branding\'); });");
DEFAULT_SCRIPT_RULES[1].push("softodrom.ru,soft.softodrom.ru#%#window.addEventListener(\'DOMContentLoaded\', function() { $(\".header:contains(\u0420\u0435\u043A\u043E\u043C\u0435\u043D\u0434\u0443\u0435\u043C)\").closest(\'table\').remove(); });");
DEFAULT_SCRIPT_RULES[1].push("chatovod.ru,spiritix.eu,chat.muz-tv.ru,\u0447\u0430\u0442\u0432\u043E\u043B\u0447\u0430\u0442.\u0440\u0444,\u043F\u043E\u0434\u0440\u043E\u0441\u0442\u043A\u043E\u0432\u044B\u0439\u0447\u0430\u0442.\u0440\u0444,\u0434\u0435\u0442\u0441\u043A\u0438\u0439\u0447\u0430\u0442.\u0440\u0444,\u0447\u0430\u0442\u0432\u043E\u043B\u0447\u0430\u0442.\u0440\u0444,\u0447\u0430\u0442\u043A\u0440\u043E\u0432\u0430\u0442\u043A\u0430.\u0440\u0444,\u0447\u0430\u0442\u043E\u0431\u0449\u0435\u043D\u0438\u044F.\u0440\u0444#%#window.addEventListener(\'DOMContentLoaded\', function() { $(\'.chatAds\').remove(); });");
DEFAULT_SCRIPT_RULES[1].push("chatovod.ru,spiritix.eu,chat.muz-tv.ru,\u0447\u0430\u0442\u0432\u043E\u043B\u0447\u0430\u0442.\u0440\u0444,\u043F\u043E\u0434\u0440\u043E\u0441\u0442\u043A\u043E\u0432\u044B\u0439\u0447\u0430\u0442.\u0440\u0444,\u0434\u0435\u0442\u0441\u043A\u0438\u0439\u0447\u0430\u0442.\u0440\u0444,\u0447\u0430\u0442\u0432\u043E\u043B\u0447\u0430\u0442.\u0440\u0444,\u0447\u0430\u0442\u043A\u0440\u043E\u0432\u0430\u0442\u043A\u0430.\u0440\u0444,\u0447\u0430\u0442\u043E\u0431\u0449\u0435\u043D\u0438\u044F.\u0440\u0444#%#window.addEventListener(\'DOMContentLoaded\', function() { var original = $.fn.html; $.fn.html = function(html) { if (this.is && this.is(\'body\')) return; return original.apply(this, arguments); }; });");
DEFAULT_SCRIPT_RULES[2] = [];
DEFAULT_SCRIPT_RULES[2].push("#%#window.AG_onLoad = function(func) { window.addEventListener(\'DOMContentLoaded\', func); };");
DEFAULT_SCRIPT_RULES[2].push("#%#window.AG_removeElementById = function(id) { var element = document.getElementById(id); if (element && element.parentNode) { element.parentNode.removeChild(element); }};");
DEFAULT_SCRIPT_RULES[2].push("#%#window.AG_each = function(selector, fn) { if (!document.querySelectorAll) return; var elements = document.querySelectorAll(selector); for (var i = 0; i < elements.length; i++) { fn(elements[i]); }; };");
DEFAULT_SCRIPT_RULES[2].push("better-explorer.com#%#AG_onLoad(function() { AG_removeElementById(\'y34e\') });");
DEFAULT_SCRIPT_RULES[2].push("yourhowto.net#%#AG_onLoad(function() { try { jQuery(\'.topnote\').next().remove(); jQuery(\'.topnote\').remove(); } catch (ex) {} });");
DEFAULT_SCRIPT_RULES[2].push("sendspace.com#%#window.runad = function() {};");
DEFAULT_SCRIPT_RULES[2].push("bitcoinzebra.com#%#window.addEventListener(\'DOMContentLoaded\', function() { var prevShowCaptcha = window.showCaptcha; window.showCaptcha = function() { prevShowCaptcha(); $(\'#AdBlocked\').val(\'false\'); }; });");
DEFAULT_SCRIPT_RULES[2].push("filepost.com#%#setTimeout(function() { window.show_popup=false; window.download_inited = true; }, 300);");
DEFAULT_SCRIPT_RULES[2].push("ilive.to#%#function setOverlayHTML() {};");
DEFAULT_SCRIPT_RULES[2].push("ilive.to#%#function setOverlayHTML_new() {};");
DEFAULT_SCRIPT_RULES[2].push("ilive.to#%#setTimeout(removeOverlayHTML, 2000);");
DEFAULT_SCRIPT_RULES[2].push("thepiratebay.se,thepiratebay.pe,thepiratebay.ac,thepiratebay.se#%#window.onload=function(){window._wm={}}");
DEFAULT_SCRIPT_RULES[2].push("karnaval.com#%#var atrk=function() {}");
DEFAULT_SCRIPT_RULES[2].push("torrentz.eu#%#document.addEventListener=function() {}");
DEFAULT_SCRIPT_RULES[3] = [];
DEFAULT_SCRIPT_RULES[3].push("~google.cn,~google.by,~google.be,~google.at,~google.ae,~google.ca,~google.ch,~google.cl,~google.cn,~google.co.id,~google.co.in,~google.co.jp,~google.co.th,~google.co.uk,~google.co.ve,~google.co.za,~google.com,~google.com.ar,~google.com.au,~google.com.bd,~google.com.br,~google.com.co,~google.com.eg,~google.com.hk,~google.com.mx,~google.com.my,~google.com.ng,~google.com.pe,~google.com.pe,~google.com.ph,~google.com.pk,~google.com.sa,~google.com.sg,~google.com.tr,~google.com.tw,~google.com.ua,~google.com.vn,~google.de,~google.dk,~google.es,~google.fr,~google.gr,~google.hu,~google.ie,~google.it,~google.nl,~google.no,~google.pl,~google.ru,~google.pt,~google.ro,~google.rs,~google.se,~google.sk,~google.tn,~google.ee#%#var _gaq = []; var _gat = { _getTracker: function() { return { _initData: function(){}, _trackPageview: function(){}, _trackEvent: function(){}, _setAllowLinker: function() {}, _setCustomVar: function() {} } }, _createTracker: function() { return this._getTracker(); }, _anonymizeIp: function() {} };");
DEFAULT_SCRIPT_RULES[3].push("~google.cn,~google.by,~google.be,~google.at,~google.ae,~google.ca,~google.ch,~google.cl,~google.cn,~google.co.id,~google.co.in,~google.co.jp,~google.co.th,~google.co.uk,~google.co.ve,~google.co.za,~google.com,~google.com.ar,~google.com.au,~google.com.bd,~google.com.br,~google.com.co,~google.com.eg,~google.com.hk,~google.com.mx,~google.com.my,~google.com.ng,~google.com.pe,~google.com.pe,~google.com.ph,~google.com.pk,~google.com.sa,~google.com.sg,~google.com.tr,~google.com.tw,~google.com.ua,~google.com.vn,~google.de,~google.dk,~google.es,~google.fr,~google.gr,~google.hu,~google.ie,~google.it,~google.nl,~google.no,~google.pl,~google.ru,~google.pt,~google.ro,~google.rs,~google.se,~google.sk,~google.tn,~google.ee#%#function urchinTracker() {};");
DEFAULT_SCRIPT_RULES[3].push("juisy.in#%#var yaCounter24662438 = { reachGoal: function() {} };");
DEFAULT_SCRIPT_RULES[3].push("citypizza.ru#%#var yaCounter9890803 = { reachGoal: function() {} };");
DEFAULT_SCRIPT_RULES[3].push("webfile.ru#%#var yaCounter20889169 = { reachGoal: function() {} };");
DEFAULT_SCRIPT_RULES[3].push("aukro.ua#%#window.cm = { event: function() {}, call: function() {} };");
DEFAULT_SCRIPT_RULES[4] = [];
DEFAULT_SCRIPT_RULES[4].push("~google.cn,~google.by,~google.be,~google.at,~google.ae,~google.ca,~google.ch,~google.cl,~google.cn,~google.co.id,~google.co.in,~google.co.jp,~google.co.th,~google.co.uk,~google.co.ve,~google.co.za,~google.com,~google.com.ar,~google.com.au,~google.com.bd,~google.com.br,~google.com.co,~google.com.eg,~google.com.hk,~google.com.mx,~google.com.my,~google.com.ng,~google.com.pe,~google.com.pe,~google.com.ph,~google.com.pk,~google.com.sa,~google.com.sg,~google.com.tr,~google.com.tw,~google.com.ua,~google.com.vn,~google.de,~google.dk,~google.es,~google.fr,~google.gr,~google.hu,~google.ie,~google.it,~google.nl,~google.no,~google.pl,~google.ru,~google.pt,~google.ro,~google.rs,~google.se,~google.sk,~google.tn,~google.ee,~youtube.com,~9gag.com,~xda-developers.com#%#window.gapi={ plusone: { go: function(){}, render: function(){} }};");
DEFAULT_SCRIPT_RULES[4].push("~samsung.com#%#var addthis = { init: function() {}, addEventListener: function() {}, button: function() {}, counter: function() {} }");
DEFAULT_SCRIPT_RULES[4].push("hopesandfears.com#%#twttr={events: { bind: function() {} }}");
DEFAULT_SCRIPT_RULES[4].push("apteka.ru#%#window.yaCounter14913877={ reachGoal: function() {} };");
DEFAULT_SCRIPT_RULES[4].push("#%#var stLight = { options: function() {} }");
DEFAULT_SCRIPT_RULES[4].push("#%#var ads_register = [];");
DEFAULT_SCRIPT_RULES[5] = [];
DEFAULT_SCRIPT_RULES[5].push("cfos.de#%#window.addEventListener(\'load\', function(){ $(\'h2[style=\"clear: none; margin: 30px 0px 20px 360px\"]\').css({clear: \"both\", margin: \"30px 0px 20px 0px\"}); });");
DEFAULT_SCRIPT_RULES[10] = [];
DEFAULT_SCRIPT_RULES[10].push("yandex.ru,yandex.com,yandex.ua,yandex.kz,yandex.by,beta.yandex.ru,beta.yandex.ua,beta.yandex.by#%#window.__adgEnabled=false;");
