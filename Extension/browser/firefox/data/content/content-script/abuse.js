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
 * Complaint dialog.
 *
 * We show this dialog in the page content.
 *
 * Doing it this way because of FF bug:
 * https://bugzilla.mozilla.org/show_bug.cgi?id=526603
 * https://bugzilla.mozilla.org/show_bug.cgi?id=385609
 */

$(document).ready(function () {

    var selectorText = $(".m-feedback-inner-text");
    var selectorDropdown = $(".modal-feedback-dropdown");
    var selectorComment = $(".modal-feedback-message textarea");
    $(".modal-feedback-inner").on('click', function (e) {
        e.preventDefault();
        selectorDropdown.toggleClass("hidden");
        e.stopPropagation();
    });

    var feedbackErrorMessage = $('#feedbackErrorMessage');

    // clickoff
    $(document).click(function () {
        selectorDropdown.addClass("hidden");
    });

    selectorDropdown.find(".m-feedback-dropdown-item").click(function (e) {
        e.preventDefault();
        var text = $(this).text();
        selectorText.text(text);
        selectorText.data("abuseOption", $(this).attr('item-data'));
        selectorDropdown.addClass("hidden");
        feedbackErrorMessage.removeClass('show');
    });

    function sendFeedback() {
        var topic = selectorText.data("abuseOption");
        if (!topic) {
            feedbackErrorMessage.addClass('show');
            return;
        }
        var comment = selectorComment.val();
        contentPage.sendMessage({type: 'sendFeedback', topic: topic, comment: comment});
        closeFeedback();
        selectorComment.val("");
    }

    function closeFeedback() {
        selectorText.data("abuseOption", "");
        selectorText.text(i18n.getMessage("popup_feedback_empty_option"));
        feedbackErrorMessage.removeClass('show');
        contentPage.sendMessage({type: 'closeAbusePanel'});
    }

    $("#cancelFeedback").on('click', function (e) {
        e.preventDefault();
        closeFeedback();
    });
    $("#sendFeedback").on('click', function (e) {
        e.preventDefault();
        sendFeedback();
    });
});

contentPage.onMessage.addListener(function (message) {
    if (message.type == 'initAbusePanel') {
        i18n.localizeDocument();
    }
});

