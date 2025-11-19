/* eslint-disable max-len */
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

import { type RuleSample } from './samples-types';

/**
 * This is the list of dangerous rules used for creating prompt to open ai api.
 * Not all rules might be used there.
 */
export const dangerousRules: RuleSample[] = [
    {
        rule: '(function(){location.pathname.startsWith("/napisy-")&&AG_onLoad(function(){setTimeout(function(){var a=document.createElement("iframe");document.body.appendChild(a);a.src="https://www.napiprojekt.pl/napisy-4684-Shrek-(2001)";a.sandbox="";a.style.cssText="position: absolute; left: -3000px;";setTimeout(function(){a&&a.remove()},5E3)},500)})})();',
        reason: 'uses absolute urls, which might be dangerous',
    },
    {
        rule: 'AG_onLoad(function(){var a=new MutationObserver(function(){document.querySelector(".adsbygoogle iframe")&&(a.disconnect(),document.querySelectorAll(".adsbygoogle iframe[id^=\'aswift_\']").forEach(function(b){b.setAttribute("src","https://googleads.g.doubleclick.net/")}))});a.observe(document,{childList:!0,subtree:!0});setTimeout(function(){a.disconnect()},1E4)});',
        reason: 'downloads code from remote resources',
    },
    {
        rule: 'AG_onLoad((function(){if("string"==typeof cookie_pub_id&&"string"==typeof cookie_visitor_id&&"number"==typeof iframe_offer_id&&"number"==typeof iframe_offer_type){(new Image).src="https://gplinks.in/track/data.php?request=addConversion&pid="+cookie_pub_id+"&vid="+cookie_visitor_id+"&o_id="+iframe_offer_id+"&o_type="+iframe_offer_type}}));',
        reason: 'sets source to absolute url, which might be considered as dangerous',
    },
    {
        rule: 'AG_onLoad(function(){var e=function(a){for(var d="",g=0;g<a;g++)d+="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789".charAt(Math.floor(62*Math.random()));return d};var f=function(a,d){a=Math.ceil(a);d=Math.floor(d);return Math.floor(Math.random()*(d-a+1))+a};var h=new MutationObserver(function(){var a=document.querySelector("ins.adsbygoogle[data-ad-client]");if(a)var d=a.getAttribute("data-ad-client");if(a=document.querySelector("ins.adsbygoogle[data-ad-slot]"))var g=a.getAttribute("data-ad-slot");if(d&&g){a=document.querySelectorAll(".adsbygoogle:not([data-ad-format=\'auto\']");var c=document.createElement("iframe");c.style="left:0;position:absolute;top:0;border:0;width:468px;height:15px;";c.setAttribute("frameborder","0");c.setAttribute("marginwidth","0");c.setAttribute("marginheight","0");c.setAttribute("vspace","0");c.setAttribute("hspace","0");c.setAttribute("allowtransparency","true");c.setAttribute("scrolling","no");c.setAttribute("allowfullscreen","true");c.setAttribute("id","aswift_2");c.setAttribute("data-load-complete","true");c.setAttribute("src","https://googleads.g.doubleclick.net/pagead/ads?client="+d+"&output=html&h=90&slotname="+g+"&adk="+e(f(9,10))+"&adf="+e(f(10,11))+"&w="+e(f(10,11))+" &lmt="+e(f(10,11))+"&format="+e(f(1E3,1500)));a.forEach(function(b){b.hasChildNodes()||b.appendChild(c)});a=document.querySelectorAll(".adsbygoogle iframe:not([src])");0<a.length&&a.forEach(function(b){b.style="left:0;position:absolute;top:0;border:0;width:468px;height:15px;";b.setAttribute("frameborder","0");b.setAttribute("marginwidth","0");b.setAttribute("marginheight","0");b.setAttribute("vspace","0");b.setAttribute("hspace","0");b.setAttribute("allowtransparency","true");b.setAttribute("scrolling","no");b.setAttribute("allowfullscreen","true");b.setAttribute("data-load-complete","true");b.setAttribute("src","https://googleads.g.doubleclick.net/pagead/ads?client="+d+"&output=html&h=90&slotname="+g+"&adk="+e(f(9,10))+"&adf="+e(f(10,11))+"&w="+e(f(10,11))+" &lmt="+e(f(10,11))+"&format="+e(f(1E3,1500)))})}});h.observe(document,{childList:!0,subtree:!0});setTimeout(function(){h.disconnect()},1E4)});',
        reason: 'creates iframes with some other sources',
    },
];
