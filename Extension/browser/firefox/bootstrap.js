/* global Components, ADDON_INSTALL, APP_SHUTDOWN, ADDON_UNINSTALL, ADDON_DOWNGRADE */
/* exported startup, install, uninstall, shutdown */

var {classes: Cc, interfaces: Ci, utils: Cu} = Components;

var console = null;
// PaleMoon doesn't support new devtools path
try {
    console = Cu.import('resource://gre/modules/Console.jsm', {}).console;
} catch (ex) {
    console = Cu.import('resource://gre/modules/devtools/Console.jsm', {}).console;
}

var bgProcess = null;

// https://developer.mozilla.org/en-US/Add-ons/Bootstrapped_extensions#startup
function startup(data, reason) {

    console.log('Adguard addon: startup is fired with reason ' + reason);

    if (!data) {
        console.error('Adguard addon: Could not retrieve startup data');
        return;
    }

    var id = data.id;
    var version = data.version;

    // Already started?
    if (bgProcess !== null) {
        return;
    }

    var appShell = Cc['@mozilla.org/appshell/appShellService;1'].getService(Ci.nsIAppShellService);

    var checkDocumentReady = function () {

        var hiddenDoc;
        try {
            hiddenDoc = appShell.hiddenDOMWindow && appShell.hiddenDOMWindow.document;
        } catch (ex) {
        }

        if (!hiddenDoc || hiddenDoc.readyState !== 'complete') {
            return false;
        }

        bgProcess = hiddenDoc.documentElement.appendChild(hiddenDoc.createElementNS('http://www.w3.org/1999/xhtml', 'iframe'));
        bgProcess.setAttribute(
            'src',
            'chrome://adguard/content/background.html?id=' + encodeURIComponent(id) + '&version=' + encodeURIComponent(version)
        );

        return true;
    };

    if (checkDocumentReady()) {
        return;
    }

    var timer = Cc['@mozilla.org/timer;1'].createInstance(Ci.nsITimer);
    var observer = {
        observe: function () {
            timer.cancel();
            if (checkDocumentReady()) {
                timer = null;
            } else {
                setTimeoutCheckDocumentReady();
            }
        }
    };

    var timeout = 5;
    var triesCount = 0;
    var triesMax = 100000;

    var setTimeoutCheckDocumentReady = function () {
        triesCount++;
        if (triesCount >= triesMax) {
            timer = null;
            console.error('Adguard addon: Could not initialize document');
            return;
        }
        timer.init(observer, timeout, timer.TYPE_ONE_SHOT);
        timeout *= 2;
        if (timeout > 503) {
            timeout = 503;
        }
    };

    setTimeoutCheckDocumentReady();
}

// https://developer.mozilla.org/en-US/Add-ons/Bootstrapped_extensions#shutdown
function shutdown(data, reason) {

    console.log('Adguard addon: shutdown is fired with reason ' + reason);

    if (reason === APP_SHUTDOWN) {
        return;
    }

    if (bgProcess !== null) {
        bgProcess.parentNode.removeChild(bgProcess);
        bgProcess = null;
    }
}

// https://developer.mozilla.org/en-US/Add-ons/Bootstrapped_extensions#install
function install(data, reason) {

    console.log('Adguard addon: install is fired with reason ' + reason);

    // https://bugzil.la/719376
    var stringBundleService = Cc['@mozilla.org/intl/stringbundle;1'].getService(Ci.nsIStringBundleService);
    stringBundleService.flushBundles();

    if (reason === ADDON_INSTALL || reason === ADDON_DOWNGRADE) {
        cleanPrefs(data.id);
        cleanAdguardDir();
    }
}

// https://developer.mozilla.org/en-US/Add-ons/Bootstrapped_extensions#uninstall
/* Note: Simply having function install() {} IS NOT ENOUGH because if you have code in uninstall it will not run.
 * You MUST run some code in the install function; at the least you must set parameters for
 * the install function, such as: function install(aData, aReason) {}; then uninstall WILL WORK.
 */
function uninstall(data, reason) {

    console.log('Adguard addon: uninstall is fired with reason ' + reason);

    if (reason !== ADDON_UNINSTALL) {
        return;
    }

    cleanPrefs(data.id);
    cleanAdguardDir();
}

/**
 * Remove adguard preferences on extension uninstall
 */
function cleanPrefs(id) {
    var branch = 'extensions.' + id + '.';
    var Services = Components.utils.import('resource://gre/modules/Services.jsm', null).Services;
    Services.prefs.getBranch(branch).deleteBranch('');
    console.log('Adguard addon preferences in branch ' + branch + ' were removed.');
}

/**
 * Remove adguard directory on extension uninstall
 */
function cleanAdguardDir() {
    var FileUtils = Cu.import("resource://gre/modules/FileUtils.jsm").FileUtils;
    var adguardDir = FileUtils.getDir('ProfD', ['Adguard']);
    if (adguardDir.exists()) {
        adguardDir.remove(true);
        console.log('Adguard addon directory was removed.');
    }
}
