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

window.balalaika = window.$;

/**
 * Adding new functions to balalaika
 */
balalaika.fn.hasClass = function (className) {
    return !!this[0] && (this[0].classList != undefined) && this[0].classList.contains(className);
};

balalaika.fn.addClass = function (className) {
    this.forEach(function (item) {
        var classList = item.classList;
        classList.add.apply(classList, className.split(/\s/));
    });
    return this;
};

balalaika.fn.removeClass = function (className) {
    this.forEach(function (item) {
        var classList = item.classList;
        classList.remove.apply(classList, className.split(/\s/));
    });
    return this;
};

balalaika.fn.get = function (index) {
    return this.length > index ? this[index] : null;
};

balalaika.fn.css = function (attr, value) {
    this.forEach(function (item) {
        item.style[attr] = value;
    });
    return this;
};

balalaika.fn.hide = function () {
    this.forEach(function (item) {
        item.style['display'] = 'none';
    });
    return this;
};

balalaika.fn.show = function () {
    this.forEach(function (item) {
        item.style['display'] = 'block';
    });
    return this;
};

balalaika.fn.remove = function () {
    this.forEach(function (item) {
        item.parentNode.removeChild(item);
    });
    return this;
};

balalaika.fn.text = function (v) {
    this.forEach(function (item) {
        item.textContent = v;
    });
    return this;
};

balalaika.fn.attr = function (k, v) {
    this.forEach(function (item) {
        item.setAttribute(k, v);
    });
    return this;
};

balalaika.fn.removeAttr = function (k) {
    this.forEach(function (item) {
        item.removeAttribute(k);
    });
    return this;
};

balalaika.fn.trigger = function (eventName, options) {
    this.forEach(function (item) {
        if (window.CustomEvent) {
            var event = new CustomEvent(eventName, {detail: options});
        } else {
            var event = document.createEvent('CustomEvent');
            event.initCustomEvent(eventName, true, true, options);
        }

        item.dispatchEvent(event);
    });
    return this;
};