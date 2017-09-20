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

/* global $, i18n, contentPage */

$(function () {

    $.fn.toggleCheckbox = function () {

        return this.each(function () {

            var checkbox = this;
            var $checkbox = $(this);

            if ($checkbox.data("toggleCheckbox")) {
                //already applied
                return;
            }

            var el = $('<div>', {class: 'toggler'});
            el.insertAfter(checkbox);

            el.on('click', function () {
                checkbox.checked = !checkbox.checked;
                $checkbox.change();
            });

            $checkbox.bind('change', function () {
                onClicked(checkbox.checked);
            });

            function onClicked(checked) {
                if (checked) {
                    el.addClass("active");
                    el.closest("li").addClass("active");
                } else {
                    el.removeClass("active");
                    el.closest("li").removeClass("active");
                }
            }

            $checkbox.hide();
            onClicked(checkbox.checked);

            $checkbox.data("toggleCheckbox", true);
        });
    };

    $.fn.updateCheckbox = function (checked) {

        return this.each(function () {
            var $this = $(this);
            if (checked) {
                $this.attr('checked', 'checked');
                $this.next('.toggler').addClass('active');
                $this.closest('li').addClass('active');
            } else {
                $this.removeAttr('checked');
                $this.next('.toggler').removeClass('active');
                $this.closest('li').removeClass('active');
            }
        });
    };

    $.fn.popupHelp = function () {

        return this.each(function () {

            var el = $(this);
            var popup = $("#" + el.attr("data-popup"));
            if (!popup || popup.length == 0) {
                return;
            }

            var w = $(window);

            function positionPopup() {

                var viewport = {
                    right: w.scrollLeft() + w.width(),
                    bottom: w.scrollTop() + w.height()
                };

                var elBounds = el.offset();

                var popupHeight = popup.outerHeight();
                var popupWidth = popup.outerWidth();

                var offsetTop = elBounds.top + 15;
                if (viewport.bottom < offsetTop + popupHeight) {
                    offsetTop = elBounds.top - popupHeight - 15;
                }

                var offsetLeft = elBounds.left + 15;
                if (viewport.right < offsetLeft + popupWidth) {
                    offsetLeft = elBounds.left - popupWidth - 15;
                }

                popup.css({
                    top: offsetTop,
                    left: offsetLeft
                });
            }

            el.on({
                mouseenter: function () {
                    positionPopup();
                    popup.removeClass("hidden");
                },
                mouseleave: function () {
                    popup.addClass("hidden");
                }
            });
        });
    };
});

function updateDisplayAdguardPromo(showPromo) {

    // Sometimes in FF promo block isn't rendered properly
    setTimeout(function () {
        if (showPromo) {
            $('.download-adguard-block').show();
            $('.non-download-adguard-block').hide();
        } else {
            $('.download-adguard-block').hide();
            $('.non-download-adguard-block').show();
        }
    }, 100);
}

function customizePopupFooter(isMacOs) {

    //fix title
    var messageId = isMacOs ? 'thankyou_want_full_protection_mac' : 'thankyou_want_full_protection';
    var title = $('.thanks-prefooter .thanks-prefooter-title');
    i18n.translateElement(title[0], messageId);

    //fix title in table
    messageId = isMacOs ? 'thankyou_compare_full_title_mac' : 'thankyou_compare_full_title';
    title = $('.thanks-prefooter .thanks-prefooter-table .tpt-head-full');
    i18n.translateElement(title[0], messageId);

    //hide parental control feature for mac os
    if (isMacOs) {
        $('.parental-control-feature').hide();
    } else {
        $('.parental-control-feature').show();
    }
}

/**
 * Used to receive notifications from background page
 * @param events Events for listening
 * @param callback Event listener callback
 * @param onUnloadCallback Window unload callback
 */
function createEventListener(events, callback, onUnloadCallback) { // jshint ignore:line

    function eventListener() {
        callback.apply(null, arguments);
    }

    var listenerId;
    contentPage.sendMessage({type: 'addEventListener', events: events}, function (response) {
        listenerId = response.listenerId;
    });

    contentPage.onMessage.addListener(function (message) {
        if (message.type === 'notifyListeners') {
            eventListener.apply(this, message.args);
        }
    });

    var onUnload = function () {
        if (listenerId) {
            contentPage.sendMessage({type: 'removeListener', listenerId: listenerId});
            listenerId = null;
            if (typeof onUnloadCallback === 'function') {
                onUnloadCallback();
            }
        }
    };
    $(window).on('beforeunload', onUnload);
    $(window).on('unload', onUnload);
}
