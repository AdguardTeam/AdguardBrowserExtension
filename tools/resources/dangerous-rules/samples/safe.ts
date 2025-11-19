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
 * List of the rules, which are considered to be safe. It used to prepare prompt to open ai api.
 * Not all rules might be used. Check variable usage.
 */
export const safeRules: RuleSample[] = [
    {
        rule: 'AG_onLoad(function(){var a=document.body,b=document.createElement("div");a&&(a.appendChild(b),b.setAttribute("id","aswift_1"))});',
        reason: 'just modifies attributes, and does not downloads remote resources',
    },
    {
        rule: "(function() { var _eval = window.eval; window.eval = function(a) { if ( a.toString().indexOf('charCodeAt') === -1 ) { _eval(a); return; } }; })();",
        reason: 'is patching eval, and does not downloads remote resources',
    },
    {
        rule: 'window.eval = function() {};',
        reason: 'is just patching eval and does not downloads remote resources',
    },
    {
        rule: 'AG_onLoad(function(){if("function"===typeof decode_link&&"string"===typeof link_out)try{var c=RegExp("^https?"),d=RegExp("^magnet:"),b=decode_link(atob(link_out));c.test(b)&&location.assign(decode_link(atob(link_out)));if(d.test(b)){var a=document.querySelector("input#contador");a?(a.setAttribute("id","download"),a.removeAttribute("disabled"),a.addEventListener("click",function(){location.assign(decode_link(atob(link_out)))},!1)):location.assign(decode_link(atob(link_out)))}}catch(e){console.log("Failed to decode link")}});',
        reason: 'uses the url taken from the page, just modifies it slightly',
    },
    {
        rule: 'AG_onLoad(function(){var a=document.querySelector("script[src^=\'//creamssicsite.com/\']");if(a)try{var b=a.src.split("/")[4];b&&(window["G_"+b+"_API"]={show:function(){},remove:function(){}})}catch(c){}});',
        reason: 'modifies url that is already on the page, we see it only in querySelector',
    },
    {
        rule: 'AG_onLoad(function(){document.querySelectorAll(\'iframe[src^="https://hdfilmesonlinegratis.com/"][src*="php?url=http"]\').forEach(function(a){var b=a.getAttribute("src").split("?url=");b[1]&&a.setAttribute("src",b[1])})});',
        reason: 'it modifies the same url, which was take from page',
    },
    {
        rule: 'AG_onLoad((function(){if(location.href.includes("googleads"))return;const e=document.createDocumentFragment(),t=document.createElement("iframe");t.src="googleads",e.appendChild(t);const n=document.createElement("ins");n.classList.add("adsbygoogle"),e.appendChild(n);const d=document.createElement("div");d.setAttribute("title","Advertisement"),e.appendChild(d),document.body.appendChild(e)}));',
        reason: 'it uses relative url, so it is not dangerous',
    },
    {
        rule: 'AG_onLoad(function() {\n'
            + '    var e = document.querySelectorAll(".panel-footer > form[action] > button[link]"),\n'
            + '        b = document.querySelectorAll(".panel-footer > form[action]"),\n'
            + '        c = new RegExp(/mega\\./);\n'
            + '    if (e.length === b.length)\n'
            + '        for (var f, g = 0; g < b.length; g++) {\n'
            + '            f = e[g].getAttribute("link"),\n'
            + '            b[g].setAttribute("action", f),\n'
            + '            b[g].setAttribute("target", "_blank"),\n'
            + '            b[g].querySelector("input[name=\\"link\\"]").remove(),\n'
            + '            c.test(f) || b[g].setAttribute("method", "GET");\n'
            + '        }\n'
            + '    const h = a => {\n'
            + '        a.preventDefault();\n'
            + '        var b = a?.currentTarget?.getAttribute("link");\n'
            + '        b ? window.open(b) : a.currentTarget.removeEventListener("click", h)\n'
            + '    };\n'
            + '    var i = document.querySelectorAll("button[link^=\\"https://drive.google.com/\\"]");\n'
            + '    i.forEach(a => {\n'
            + '        a.addEventListener("click", h)\n'
            + '    });\n'
            + '});',
        reason: 'does not uses links outside of the document, just modifies the existing',
    },
    {
        rule: 'AG_onLoad((function() {\n'
            + '    const e = t => {\n'
            + '        t.preventDefault();\n'
            + '        var n = t?.currentTarget?.getAttribute("link");\n'
            + '        n ? window.open(n) : t.currentTarget.removeEventListener("click", e)\n'
            + '    };\n'
            + '    var t = document.querySelectorAll(".panel-footer > form[action] > button[link]"),\n'
            + '        n = document.querySelectorAll(".panel-footer > form[action]"),\n'
            + '        r = new RegExp(/mega\\./);\n'
            + '    if (t.length === n.length)\n'
            + '        for (var o = 0; o < n.length; o++) {\n'
            + '            var i = t[o],\n'
            + '                l = i.getAttribute("link");\n'
            + '            n[o].setAttribute("action", l),\n'
            + '            n[o].setAttribute("target", "_blank"),\n'
            + '            n[o].querySelector(\'input[name="link"]\').remove(),\n'
            + '            i.addEventListener("click", e),\n'
            + '            r.test(l) || n[o].setAttribute("method", "GET")\n'
            + '        }\n'
            + '}));',
        reason: 'does not downloads anything from using outer links',
    },
    {
        rule: '(function() { var _eval = window.eval; window.eval = function(a) { if ( a.toString().indexOf(\'__PPU_CHECK\') === -1 ) { _eval(a); return; } }; })();',
        reason: 'only patches eval in non dangerous way',
    },
    {
        rule: 'AG_onLoad(function(){var b=document.querySelector("#main-player-wrapper"),a=document.querySelector("#main-player-wrapper iframe[custom-src^=\'aHR0c\']"),c=document.querySelector("#fake-player-wrapper");c&&(c.style.display="none");if(b&&a)try{b.style.display="block";var d=a.getAttribute("custom-src");a.setAttribute("src",atob(d))}catch(e){}});',
        reason: 'sets source to the url taken from the page, so it does not downloads any remote sources to the page',
    },
    {
        rule: '(function(){if(location.href.includes("embed_id")){const a=new MutationObserver(function(){const b=document.querySelector("video[data-ads-link][src]"),c=document.querySelector("#skipAds"),d=document.querySelector(".vjs-control-bar.vjs-hidden");if(b&&!isNaN(b.duration)&&c&&d){a.disconnect();const c=b.getAttribute("src"),d=JSON.parse(b.getAttribute("data-ads-link")),e=d[0]?.src;if(c&&e&&c===e){b.currentTime=b.duration,setTimeout(function(){b.pause()},1E3)}}});a.observe(document,{childList:!0,subtree:!0,attributes:!0})}})();',
        reason: 'does not downloads something from the remote source',
    },
    {
        rule: 'AG_onLoad(function() { setTimeout(function() { var el = document.querySelectorAll("iframe.embed-responsive-item"); if(el) { var source = el[0].src.replace("/vod/","/p2p/"); el[0].setAttribute("src",source); }; }, 1000); });',
        reason: 'just modifies the link and this link is relative',
    },
    {
        rule: "AG_onLoad(function() { var el=document.body; var ce=document.createElement('div'); ce.style = 'width: 1px !important; display: block !important;'; if(el) { el.appendChild(ce); ce.setAttribute(\"id\", \"doublebillboard-1\"); } });",
        reason: 'only hiding elements and is not dangerous',
    },
    {
        rule: 'AG_onLoad(function() { var el=document.body; var ce=document.createElement(\'iframe\'); ce.style = \'display: none!important;\'; if(el) { el.appendChild(ce); } });',
        reason: 'is creating iframe which does not uses src anywhere',
    },
    {
        rule: '(function() {\n'
            + '    if ("function" == typeof Proxy) {\n'
            + '        var c = /^\\/(?!api\\?call=)/;\n'
            + '        window.open = new Proxy(window.open, {\n'
            + '            apply: function(e, k, g) {\n'
            + '                var f = g[0];\n'
            + '                if (!0 !== c.test(f)) return e.apply(k, g);\n'
            + '                e = location.origin;\n'
            + '                var a = document.createElement("object");\n'
            + '                location.href.includes("/watch/") || location.href.includes("/vs-mirror/") ? a.data = f : a.data = e + "/" + f;\n'
            + '                a.style.setProperty("height", "1px", "important");\n'
            + '                a.style.setProperty("width", "1px", "important");\n'
            + '                a.style.setProperty("position", "absolute", "important");\n'
            + '                a.style.setProperty("top", "-99999px", "important");\n'
            + '                document.body.appendChild(a);\n'
            + '                setTimeout(function() { return a.remove() }, 1E4);\n'
            + '                return a.contentWindow ? new Proxy(a.contentWindow, {\n'
            + '                    get: function(d, b) {\n'
            + '                        return "opener" === b ? window : "frameElement" === b ? null : d[b]\n'
            + '                    },\n'
            + '                    set: function(d, b, h) {\n'
            + '                        d[b] = h\n'
            + '                    }\n'
            + '                }) : new Proxy(a, {\n'
            + '                    get: function(d, b) {\n'
            + '                        return "opener" === b ? window : "frameElement" === b ? null : !1\n'
            + '                    },\n'
            + '                    set: function(d, b, h) {\n'
            + '                        d[b] = !1\n'
            + '                    }\n'
            + '                })\n'
            + '            }\n'
            + '        })\n'
            + '    }\n'
            + '})();',
        reason: 'uses same urls used to be called inside of it',
    },
    {
        rule: 'AG_onLoad(function() { var el=document.body; var ce=document.createElement(\'div\'); if(el) { el.appendChild(ce); ce.setAttribute("id", "AdskeeperComposite"); } });',
        reason: 'just appends element, does not downloads anything',
    },
    {
        rule: 'AG_onLoad(function(){var a=document.body,c=document.createElement("div"),b=document.createElement("div"),d=document.createElement("a");a&&(a.appendChild(c),c.setAttribute("class","mgbox"),c.appendChild(b),b.setAttribute("class","mg_addad"),b.appendChild(d));for(a=0;4>a;a++)b.appendChild(d.cloneNode())});',
        reason: 'just appends element, does not downloads anything',
    },
    {
        rule: '(function(){document.location.hostname.includes("exey.io")&&AG_onLoad(function(){document.querySelector("html").setAttribute("data-fp","");var a=document.createElement("ins");a.setAttribute("class","adsbygoogle");a.setAttribute("data-adsbygoogle-status","done");document.body.appendChild(a);var b=document.createElement("iframe");a.appendChild(b)})})()',
        reason: 'only modifies attributes, and creates elements, iframe elements is created without source',
    },

    {
        rule: 'AG_onLoad(function(){\n'
            + '    document.querySelectorAll(\'a[href^="https://shorttey.com/full/?api="][href*="&url=aHR0c"]\').forEach(function(b){\n'
            + '        var a = (new URL(b.getAttribute("href"))).searchParams.get("url");\n'
            + '        a = atob(a);\n'
            + '        b.setAttribute("href", a);\n'
            + '    });\n'
            + '});',
        reason: 'manipulates the href, but the source remains the same.',
    },
    {
        rule: '(()=>{const a=(a,b,c)=>{const d=Reflect.apply(a,b,c),e="div[id^=\'atf\']:empty { display: none !important; }";if("adoptedStyleSheets"in document){const a=new CSSStyleSheet;a.replaceSync(e),d.adoptedStyleSheets=[a]}else{const a=document.createElement("style");a.innerText=e,d.appendChild(a)}return d};window.Element.prototype.attachShadow=new Proxy(window.Element.prototype.attachShadow,{apply:a})})();',
        reason: 'doesn\'t downloads any of remote resources and it is clear that it doesn\'t allow to attach shadow dom',
    },
    {
        rule: 'AG_onLoad(\n'
            + '    }function() {\n'
            + '    document.querySelectorAll("a[data-slide-index][href*=\'http\']:not([href*=\'www.aksam.com.tr\'])")[0].closest(\'li\').remove();\n'
            + '    document.querySelectorAll("ul.bxslider > li > a[target=\'_blank\'][href*=\'http\']:not([href*=\'www.aksam.com.tr\'])")[0].closest(\'li\').remove();\n'
            + '    var elements = document.querySelectorAll("#slider4-pager a[data-slide-index]");\n'
            + '    for(var i =0 ; i < elements.length; i++){\n'
            + '        elements[i].setAttribute("data-slide-index",[i]);\n'
            + '        elements[i].innerHTML = elements[i].innerHTML = i+1;\n'
            + '    };\n'
            + '});',
        reason: 'only removes elements from the page, or changes their attributes, but doesn\'t load any remote resources.',
    },
    {
        rule: 'AG_onLoad(function(){\n'
            + '    if(0 == location.pathname.indexOf("/foto-galeri/")){\n'
            + '        var a;\n'
            + '        (a=document.getElementById("pagination-link-next")) && a.setAttribute("href",\n'
            + '            a.getAttribute("href").replace(/\\?page=0/,function(){\n'
            + '                var a="?page=";\n'
            + '                location.search.split(/(?:\\?|&)/).forEach(function(b){\n'
            + '                    "page"==b.slice(0,b.indexOf("=")) && (a+=Number(b.slice(b.indexOf("=")+1))+1);\n'
            + '                });\n'
            + '                return a\n'
            + '            }))\n'
            + '    }\n'
            + '});',
        reason: 'only changes the href attribute of an element, but doesn\'t load any remote resources.',
    },
    {
        rule: 'AG_onLoad(function(){\n'
            + '    setTimeout(function(){\n'
            + '        if(typeof acceptSystemCookies == \'function\'){\n'
            + '            acceptSystemCookies();\n'
            + '        }\n'
            + '        var el = document.querySelector("#consent");\n'
            + '        el && el.setAttribute("style", "display: none !important;");\n'
            + '    }, 1000)\n'
            + '});',
        reason: 'only changes the style attribute of an element, and calls function, but doesn\'t load any remote resources. Users want to add such rules to their adblockers to remove cookie banners.',
    },
    {
        rule: 'AG_onLoad(function() {\n'
            + '    var c = document.querySelector("#ac1"),\n'
            + '        a = document.createElement("div"),\n'
            + '        b = document.createElement("iframe");\n'
            + '    b.style = "width: 0px !important; border: none !important;";\n'
            + '    b.setAttribute("id", "google_ads_iframe_");\n'
            + '    c && c.appendChild(a);\n'
            + '    a && a.appendChild(b);\n'
            + '});',
        reason: 'doesn\'t loads any remote resources. It is used to remove empty ad containers.',
    },
    {
        rule: 'AG_onLoad(function() {\n'
            + '    if (-1 == document.cookie.indexOf("OAX")) {\n'
            + '        var a = new MutationObserver(function() {\n'
            + '            var b = document.evaluate("//button[contains(text(), \'PRZECHODZ\')]", document, null, XPathResult.ANY_TYPE, null).iterateNext();\n'
            + '            b && (a.disconnect(), setTimeout(function() {\n'
            + '                b.click()\n'
            + '            }, 1E3));\n'
            + '        });\n'
            + '        a.observe(document, {\n'
            + '            childList: !0,\n'
            + '            subtree: !0\n'
            + '        });\n'
            + '        setTimeout(function() {\n'
            + '            a.disconnect()\n'
            + '        }, 1E4);\n'
            + '    }\n'
            + '});',
        reason: 'manipulates user interaction within the site context according to predefined conditions, which is not inherently dangerous from a security standpoint.',
    },
    {
        rule: 'AG_onLoad(function() {\n'
            + '    window.OnetrustActiveGroups = ",C0002,C0004,";\n'
            + '    const a = function(a) {\n'
            + '            var b = a.parentNode,\n'
            + '                c = document.createElement(a.tagName);\n'
            + '            c.textContent = a.textContent;\n'
            + '            var d = a.attributes;\n'
            + '            if (0 < d.length)\n'
            + '                for (var e = 0; e < d.length; e++) "type" === d[e].name ? c.setAttribute("type", "text/javascript", !0) : c.setAttribute(d[e].name, d[e].value, !0);\n'
            + '            b.appendChild(c), b.removeChild(a)\n'
            + '        },\n'
            + '        b = document.head,\n'
            + '        c = new MutationObserver(function() {\n'
            + '            var b = document.querySelectorAll("head > script[class^=\\"optanon-category-\\"][type=\\"text/plain\\"]");\n'
            + '            b.forEach(b => a(b))\n'
            + '        });\n'
            + '    c.observe(b, {\n'
            + '        attributes: !0,\n'
            + '        childList: !0,\n'
            + '        subtree: !0\n'
            + '    })\n'
            + '});',
        reason: 'manipulations doesn\'t introduce direct vulnerabilities or dangerous behavior as it doesn\'t fetch or execute new or unknown scripts.',
    },
    {
        rule: 'AG_onLoad(function() {\n'
            + '    document.querySelectorAll("a[data-slide-index][href*=\'http\']:not([href*=\'www.aksam.com.tr\'])")[0].closest(\'li\').remove();\n'
            + '    document.querySelectorAll("ul.bxslider > li > a[target=\'_blank\'][href*=\'http\']:not([href*=\'www.aksam.com.tr\'])")[0].closest(\'li\').remove();\n'
            + '    document.querySelectorAll("a[data-slide-index][href*=\'http\']:not([href*=\'www.aksam.com.tr\'])")[0].closest(\'li\').remove();\n'
            + '    document.querySelectorAll("ul.bxslider > li > a[target=\'_blank\'][href*=\'http\']:not([href*=\'www.aksam.com.tr\'])")[0].closest(\'li\').remove();\n'
            + '    document.querySelectorAll("a[data-slide-index][href*=\'http\']:not([href*=\'www.aksam.com.tr\'])")[0].closest(\'li\').remove();\n'
            + '    document.querySelectorAll("ul.bxslider > li > a[target=\'_blank\'][href*=\'http\']:not([href*=\'www.aksam.com.tr\'])")[0].closest(\'li\').remove();\n'
            + '    var elements = document.querySelectorAll("#slider4-pager a[data-slide-index]");\n'
            + '    for(var i = 0; i < elements.length; i++){\n'
            + '        elements[i].setAttribute("data-slide-index", [i]);\n'
            + '        elements[i].innerHTML = i + 1;\n'
            + '    };\n'
            + '});',
        reason: 'makes operations only purely client-side, which involve no network requests or data processing that could compromise user data or page security, and thus are not considered dangerous from a technical security perspective.',
    },
    {
        rule: 'AG_onLoad(function() {\n'
            + '    if ("function" === typeof decode_link && "string" === typeof link_out)\n'
            + '        try {\n'
            + '            var c = RegExp("^https?"),\n'
            + '                d = RegExp("^magnet:"),\n'
            + '                b = decode_link(atob(link_out));\n'
            + '            c.test(b) && location.assign(decode_link(atob(link_out)));\n'
            + '            if (d.test(b)) {\n'
            + '                var a = document.querySelector("input#contador");\n'
            + '                a ? (a.setAttribute("id", "download"), a.removeAttribute("disabled"), a.addEventListener("click", function() {\n'
            + '                    location.assign(decode_link(atob(link_out)))\n'
            + '                }, !1)) : location.assign(decode_link(atob(link_out)))\n'
            + '            }\n'
            + '        } catch (e) {\n'
            + '            console.log("Failed to decode link")\n'
            + '        }\n'
            + '});',
        reason: 'uses a function to decode a link and then assign it to the location. It doesn\'t load any remote resources.',
    },
    {
        rule: 'AG_onLoad(function() {\n'
            + '    setTimeout(function() {\n'
            + '        if ("string" === typeof code) {\n'
            + '            var a = document.createElement("form");\n'
            + '            a.setAttribute("method", "post");\n'
            + '            a.setAttribute("id", "hash");\n'
            + '            a.setAttribute("action", "/?download=" + code);\n'
            + '            var b = document.createElement("input");\n'
            + '            b.setAttribute("type", "hidden");\n'
            + '            b.setAttribute("name", "hash");\n'
            + '            b.setAttribute("value", code);\n'
            + '            a.appendChild(b);\n'
            + '            document.querySelector("body").appendChild(a);\n'
            + '            (a = document.querySelector("form#hash")) && a.submit();\n'
            + '        }\n'
            + '    }, 300)\n'
            + '});',
        reason: 'creates a form and submits it. It doesn\'t load any remote resources.',
    },
    {
        rule: 'setInterval(function() { var el = document.querySelector(\'.howto-video video\'); if (el) { el.pause(); el.src = \'\'; }}, 100);',
        reason: 'only changes the src attribute of an element, but doesn\'t load any remote resources',
    },
    {
        rule: 'AG_onLoad(function() {\n'
            + '    document.querySelectorAll(\'.entry-content a[href^="https://ouo.press/"][href*="%2Fhttp"]\').forEach(function(a) {\n'
            + '        var b = "http" + decodeURIComponent(a.getAttribute("href")).split("/http")[1];\n'
            + '        a.setAttribute("href", b);\n'
            + '    });\n'
            + '    document.querySelectorAll(\'.entry-content a[href^="https://ouo.press/"]:not([href*="%2Fhttp"])\').forEach(function(a) {\n'
            + '        var b = decodeURIComponent(a.getAttribute("href")).split("?s=");\n'
            + '        a.setAttribute("href", b[1]);\n'
            + '    });\n'
            + '});',
        reason: 'modifies already existing href attribute of an element, but doesn\'t load any remote resources',
    },
    {
        rule: '(()=>{const a=(a,b,c)=>{const d=Reflect.apply(a,b,c),e="div[id^=\'atf\']:empty { display: none !important; }";if("adoptedStyleSheets"in document){const a=new CSSStyleSheet;a.replaceSync(e),d.adoptedStyleSheets=[a]}else{const a=document.createElement("style");a.innerText=e,d.appendChild(a)}return d};window.Element.prototype.attachShadow=new Proxy(window.Element.prototype.attachShadow,{apply:a})})();',
        reason: 'doesn\'t load any remote resources',
    },
    {
        rule: 'AG_onLoad(function() { setTimeout(function() {var cookieBlock = document.querySelector(".modal-body__content-block--cookie"); var ageBlock = document.querySelector(".modal-body__content-block--agegate"); if(cookieBlock) { Cookies.set(\'gdpr_preface\',\'1\',{ expires:Infinity } ); cookieBlock.setAttribute("style","display: none;"); ageBlock.setAttribute("style","display: list-item;");}} ,300)});',
        reason: 'doesn\'t load any remote resources',
    },
    {
        rule: 'AG_onLoad(function() { setTimeout(function() {var cookieBlock = document.querySelector(".modal-body__content-block--cookie"); var ageBlock = document.querySelector(".modal-body__content-block--agegate"); if(cookieBlock) { Cookies.set(\'gdpr_preface\',\'1\',{ expires:Infinity } ); cookieBlock.setAttribute("style","display: none;"); ageBlock.setAttribute("style","display: list-item;");}} ,300)});',
        reason: 'doesn\'t load any remote resources',
    },
    {
        rule: 'AG_onLoad(function(){setTimeout(()=>{document.querySelectorAll("ins.adsbygoogle").forEach(a=>{a.appendChild(document.createElement("div"))})},1e3)});',
        reason: 'modifies the DOM, but is not loading any remote resources',
    },
    {
        rule: 'function preventError(d){window.addEventListener("error",function(a){if(a.srcElement&&a.srcElement.src){const b=new RegExp(d);b.test(a.srcElement.src)&&(a.srcElement.onerror=function(){})}},!0)}preventError("^.");',
        reason: 'prevents error, but not loading any remote resources',
    },
    {
        rule: '(()=>{const a=(a,b,c)=>{const d=Reflect.apply(a,b,c),e="div[id^=\'atf\']:empty { display: none !important; }";if("adoptedStyleSheets"in document){const a=new CSSStyleSheet;a.replaceSync(e),d.adoptedStyleSheets=[a]}else{const a=document.createElement("style");a.innerText=e,d.appendChild(a)}return d};window.Element.prototype.attachShadow=new Proxy(window.Element.prototype.attachShadow,{apply:a})})();',
        reason: 'modifies the appearance of certain elements on a webpage, which is a common practice in web development',
    },
    {
        rule: 'AG_onLoad(function() {\n'
            + '    // Remove the first \'li\' element that matches each query\n'
            + '    document.querySelectorAll("a[data-slide-index][href*=\'http\']:not([href*=\'www.aksam.com.tr\'])")[0].closest(\'li\').remove();\n'
            + '    document.querySelectorAll("ul.bxslider > li > a[target=\'_blank\'][href*=\'http\']:not([href*=\'www.aksam.com.tr\'])")[0].closest(\'li\').remove();\n'
            + '    document.querySelectorAll("a[data-slide-index][href*=\'http\']:not([href*=\'www.aksam.com.tr\'])")[0].closest(\'li\').remove();\n'
            + '    document.querySelectorAll("ul.bxslider > li > a[target=\'_blank\'][href*=\'http\']:not([href*=\'www.aksam.com.tr\'])")[0].closest(\'li\').remove();\n'
            + '    document.querySelectorAll("a[data-slide-index][href*=\'http\']:not([href*=\'www.aksam.com.tr\'])")[0].closest(\'li\').remove();\n'
            + '    document.querySelectorAll("ul.bxslider > li > a[target=\'_blank\'][href*=\'http\']:not([href*=\'www.aksam.com.tr\'])")[0].closest(\'li\').remove();\n'
            + '\n'
            + '    // Update the \'data-slide-index\' attribute and innerHTML of elements\n'
            + '    var elements = document.querySelectorAll("#slider4-pager a[data-slide-index]");\n'
            + '    for (var i = 0; i < elements.length; i++) {\n'
            + '        elements[i].setAttribute("data-slide-index", [i]);\n'
            + '        elements[i].innerHTML = i + 1;\n'
            + '    }\n'
            + '});\n',
        reason: 'manipulates the DOM to removes certain list items (li elements) and updates attributes and content of other elements. Specifically, it targets elements with certain data attributes and href values, excluding those containing a specific URL. Then, it updates the data-slide-index and inner HTML of elements within a slider pager. There are no actions related to loading external resources or performing potentially harmful operations. The script\'s primary function is to modify the webpage\'s content and appearance based on specific criteria, which is a standard practice in web development and does not pose a security risk.',
    },
    {
        rule: 'shop.warsteiner.de#%#AG_onLoad(function() {\n'
            + '    setTimeout(function() {\n'
            + '        var cookieBlock = document.querySelector(".modal-body__content-block--cookie");\n'
            + '        var ageBlock = document.querySelector(".modal-body__content-block--agegate");\n'
            + '        if (cookieBlock) {\n'
            + '            Cookies.set(\'gdpr_preface\', \'1\', { expires: Infinity });\n'
            + '            cookieBlock.setAttribute("style", "display: none;");\n'
            + '            ageBlock.setAttribute("style", "display: list-item;");\n'
            + '        }\n'
            + '    }, 300);\n'
            + '});',
        reason: 'sets a cookie (gdpr_preface) and modifies the display styles of certain elements (cookieBlock and ageBlock) on the webpage. The setting of a cookie here appears to be for compliance with GDPR (General Data Protection Regulation) requirements, indicating a user\'s consent preference. The script does not involve loading external resources, manipulating sensitive data, or performing any network requests that could be considered harmful. Its function is limited to managing user interface elements and cookie settings, which is a common and legitimate practice in web development.',
    },
    {
        rule: 'AG_onLoad(function() {\n'
            + '    if (!(-1 < document.cookie.indexOf("OAX") || \n'
            + '          ("undefined" != typeof localStorage && \n'
            + '           null !== localStorage.getItem("crdab")))) {\n'
            + '        var observer = new MutationObserver(function() {\n'
            + '            var button = document.evaluate("//button[contains(text(), \'PRZECHODZ\')]", \n'
            + '                                           document, null, XPathResult.ANY_TYPE, null).iterateNext();\n'
            + '            if (button) {\n'
            + '                observer.disconnect();\n'
            + '                setTimeout(function() {\n'
            + '                    button.click();\n'
            + '                }, 1000);\n'
            + '            }\n'
            + '        });\n'
            + '        observer.observe(document, { childList: true, subtree: true });\n'
            + '        setTimeout(function() {\n'
            + '            observer.disconnect();\n'
            + '        }, 10000);\n'
            + '    }\n'
            + '});',
        reason: 'finds and click a button with specific text (\'PRZECHODZ\') under certain conditions (absence of a specific cookie and local storage item). It employs a MutationObserver to watch for changes in the DOM and an XPath query to locate the button. Clicking buttons programmatically is a common practice in web automation and isn\'t inherently dangerous. The script does not load external resources, manipulate sensitive data, or execute network requests. The conditional check for a cookie or local storage item indicates that the script is intended to execute based on certain user state criteria, which is typical in web development for managing user experiences. Despite automating a click event, the script does not exhibit behavior that would classify it as a security risk.',
    },
    {
        rule: 'AG_onLoad(function() {\n'
            + '    if (!(-1 < document.cookie.indexOf("OAX") || \n'
            + '          ("undefined" != typeof localStorage && \n'
            + '           null !== localStorage.getItem("crdab")))) {\n'
            + '        var observer = new MutationObserver(function() {\n'
            + '            var button = document.evaluate("//button[contains(text(), \'PRZECHODZ\')]", \n'
            + '                                           document, null, XPathResult.ANY_TYPE, null).iterateNext();\n'
            + '            if (button) {\n'
            + '                observer.disconnect();\n'
            + '                setTimeout(function() {\n'
            + '                    button.click();\n'
            + '                }, 1000);\n'
            + '            }\n'
            + '        });\n'
            + '        observer.observe(document, { childList: true, subtree: true });\n'
            + '        setTimeout(function() {\n'
            + '            observer.disconnect();\n'
            + '        }, 10000);\n'
            + '    }\n'
            + '});\n',
        reason: 'is designed to automatically click a button with the text \'PRZECHODZ\' if certain conditions are not met, namely the absence of a specific cookie ("OAX") and a particular local storage item ("crdab"). It uses a MutationObserver to monitor the DOM for changes and an XPath expression to locate the button. The action of programmatically clicking a button is a standard practice in web development, particularly for automating interactions or enhancing user experience. The script does not engage in any activities typically considered harmful, such as loading external resources, making unauthorized network requests, or manipulating sensitive data. Its operation is confined to user interface interaction based on the user\'s browser state, which does not pose a security risk.',
    },
    {
        rule: 'AG_onLoad(function() {\n'
            + '    var container = document.querySelector("#ac1");\n'
            + '    var div = document.createElement("div");\n'
            + '    var iframe = document.createElement("iframe");\n'
            + '    iframe.style = "width: 0px !important; border: none !important;";\n'
            + '    iframe.setAttribute("id", "google_ads_iframe_");\n'
            + '\n'
            + '    if (container) {\n'
            + '        container.appendChild(div);\n'
            + '        if (div) {\n'
            + '            div.appendChild(iframe);\n'
            + '        }\n'
            + '    }\n'
            + '});\n',
        reason: 'creates and styles a div and an iframe within a specific container on the webpage, but it doesn\'t load any external resources or perform network requests. The primary action is DOM manipulation, a common practice in web development. Without any additional context suggesting malicious intent or behavior, this script is not considered dangerous.',
    },
];
