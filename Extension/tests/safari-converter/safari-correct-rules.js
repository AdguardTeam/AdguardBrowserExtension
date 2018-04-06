var URL_FILTER_ANY_URL = "^[htpsw]+:\\/\\/";
var URL_FILTER_WS_ANY_URL = "^wss?:\\/\\/";
var URL_FILTER_CSS_RULES = ".*";
// Improved regular expression instead of UrlFilterRule.REGEXP_START_URL (||)
var URL_FILTER_REGEXP_START_URL = URL_FILTER_ANY_URL + "([a-z0-9-]+\\.)?";
// Simplified separator (to fix an issue with $ restriction - it can be only in the end of regexp)
var URL_FILTER_REGEXP_SEPARATOR = "[/:&?]?";

// Rules to test
var rules = [
    '||pics.rbc.ru/js/swf',
    '||tardangro.com^$third-party',
    '||videoplaza.com^$~object-subrequest,third-party',
    '||videoplaza.tv^$object-subrequest,third-party,domain=tv4play.se',
    '||b.babylon.com^',
    '||getsecuredfiles.com^$popup,third-party',
    'popsugar.com###calendar_widget',
    '@@||emjcd.com^$image,domain=catalogfavoritesvip.com|freeshipping.com',
    '@@||intellitxt.com/ast/js/nbcuni/$script',
    '@@||hulu.com/embed$document',
    '@@||hulu.com/$document',
    '@@http://hulu.com^$document',
    '@@https://hulu.com$document',
    '@@www.any.gs$urlblock',
    '@@wfarm.yandex.net/$document',
    '@@.instantservice.com$document',
    '/addyn|*|adtech;',
    '@@||hulu-jsinject.com$jsinject',
    '@@||test-document.com$document',
    '@@||test-urlblock.com$urlblock',
    '@@||test-elemhide.com$elemhide',
    '@@/testelemhidenodomain$document',
    'lenta1.ru#@##social',
    'lenta2.ru#@##social',
    '###social',
    'yandex.ru###pub',
    'yandex.ru#@##pub',
    '@@/^https?\:\/\/(?!(qs\.ivwbox\.de|qs\.ioam.de|platform\.twitter\.com|connect\.facebook\.net|de\.ioam\.de|pubads\.g\.doubleclick\.net|stats\.wordpress\.com|www\.google-analytics\.com|www\.googletagservices\.com|apis\.google\.com|script\.ioam\.de)\/)/$script,third-party,domain=gamona.de',
    '/\.filenuke\.com/.*[a-zA-Z0-9]{4}/$script',
    '##.banner'
];

// Conversion result
var safariCorrectRules = [
    {
        "trigger": {
            "url-filter": URL_FILTER_CSS_RULES
        },
        "action": {
            "type": "css-display-none",
            "selector": ".banner"
        }
    },
    {
        "trigger": {
            "url-filter": URL_FILTER_CSS_RULES,
            "unless-domain": [
                "*lenta1.ru",
                "*lenta2.ru"
            ]
        },
        "action": {
            "type": "css-display-none",
            "selector": "#social"
        }
    },
    {
        "trigger": {
            "url-filter": URL_FILTER_CSS_RULES,
            "if-domain": [
                "*popsugar.com"
            ]
        },
        "action": {
            "type": "css-display-none",
            "selector": "#calendar_widget"
        }
    },
    {
        "trigger": {
            "url-filter": URL_FILTER_ANY_URL,
            "if-domain": [
                "*test-elemhide.com"
            ]
        },
        "action": {
            "type": "ignore-previous-rules"
        }
    },
    {
        "trigger": {
            "url-filter": URL_FILTER_REGEXP_START_URL + "pics\\.rbc\\.ru\\/js\\/swf"
        },
        "action": {
            "type": "block"
        }
    },
    {
        "trigger": {
            "url-filter": URL_FILTER_REGEXP_START_URL + "tardangro\\.com" + URL_FILTER_REGEXP_SEPARATOR,
            "load-type": [
                "third-party"
            ]
        },
        "action": {
            "type": "block"
        }
    },
    {
        "trigger": {
            "url-filter": URL_FILTER_REGEXP_START_URL + "videoplaza\\.com" + URL_FILTER_REGEXP_SEPARATOR,
            "resource-type": [
                "image",
                "style-sheet",
                "script",
                "media",
                "raw",
                "font",
                "document"
            ],
            "load-type": [
                "third-party"
            ]
        },
        "action": {
            "type": "block"
        }
    },
    {
        "trigger": {
            "url-filter": URL_FILTER_REGEXP_START_URL + "b\\.babylon\\.com" + URL_FILTER_REGEXP_SEPARATOR
        },
        "action": {
            "type": "block"
        }
    },
    {
        "trigger": {
            "url-filter": URL_FILTER_REGEXP_START_URL + "getsecuredfiles\\.com" + URL_FILTER_REGEXP_SEPARATOR,
            "resource-type": [
                "popup"
            ],
            "load-type": [
                "third-party"
            ]
        },
        "action": {
            "type": "block"
        }
    },
    {
        "trigger": {
            "url-filter": "\\/addyn\\|.*\\|adtech;"
        },
        "action": {
            "type": "block"
        }
    },
    {
        "trigger": {
            "url-filter": URL_FILTER_REGEXP_START_URL + "emjcd\\.com" + URL_FILTER_REGEXP_SEPARATOR,
            "resource-type": [
                "image"
            ],
            "if-domain": [
                "*freeshipping.com",
                "*catalogfavoritesvip.com"
            ]
        },
        "action": {
            "type": "ignore-previous-rules"
        }
    },
    {
        "trigger": {
            "url-filter": URL_FILTER_REGEXP_START_URL + "intellitxt\\.com\\/ast\\/js\\/nbcuni\\/",
            "resource-type": [
                "script"
            ]
        },
        "action": {
            "type": "ignore-previous-rules"
        }
    },
    {
        "trigger": {
            "url-filter": URL_FILTER_ANY_URL,
            "if-domain": [
                "*www.any.gs"
            ]
        },
        "action": {
            "type": "ignore-previous-rules"
        }
    },
    {
        "trigger": {
            "url-filter": URL_FILTER_ANY_URL,
            "if-domain": [
                "*test-urlblock.com"
            ]
        },
        "action": {
            "type": "ignore-previous-rules"
        }
    },
    {
        "trigger": {
            "url-filter": URL_FILTER_REGEXP_START_URL + "hulu\\.com\\/embed"
        },
        "action": {
            "type": "ignore-previous-rules"
        }
    },
    {
        "trigger": {
            "url-filter": URL_FILTER_ANY_URL,
            "if-domain": [
                "*hulu.com"
            ]
        },
        "action": {
            "type": "ignore-previous-rules"
        }
    },
    {
        "trigger": {
            "url-filter": URL_FILTER_ANY_URL,
            "if-domain": [
                "*hulu.com"
            ]
        },
        "action": {
            "type": "ignore-previous-rules"
        }
    },
    {
        "trigger": {
            "url-filter": URL_FILTER_ANY_URL,
            "if-domain": [
                "*hulu.com"
            ]
        },
        "action": {
            "type": "ignore-previous-rules"
        }
    },
    {
        "trigger": {
            "url-filter": URL_FILTER_ANY_URL,
            "if-domain": [
                "*wfarm.yandex.net"
            ]
        },
        "action": {
            "type": "ignore-previous-rules"
        }
    },
    {
        "trigger": {
            "url-filter": "\\.instantservice\\.com"
        },
        "action": {
            "type": "ignore-previous-rules"
        }
    },
    {
        "trigger": {
            "url-filter": URL_FILTER_ANY_URL,
            "if-domain": [
                "*test-document.com"
            ]
        },
        "action": {
            "type": "ignore-previous-rules"
        }
    },
    {
        "trigger": {
            "url-filter": "\\/testelemhidenodomain"
        },
        "action": {
            "type": "ignore-previous-rules"
        }
    }
];

function _checkResult(json, errors) {
    var expectedErrorsCount = 4;
    var expectedCssTrunkatedCount = 4;

    if (json === null) {
        errors.push('Convertation failed!');
        return;
    }

    var expectedLength = (rules.length - expectedErrorsCount - expectedCssTrunkatedCount);
    if (json.convertedCount != expectedLength) {
        var message = 'Not all the rules converted \n';
        message += 'result:' + json.length;
        message += ' expected:' + expectedLength;
        errors.push(message);
    }

    if (json.errorsCount != expectedErrorsCount) {
        errors.push('Errors count is wrong');
    }

    if (json.overLimit !== false) {
        errors.push('Overlimit flag is wrong');
    }

    var convertedString = json.converted;
    if (convertedString === null || convertedString == '') {
        errors.push('Converted block is wrong');
    }

    var converted = JSON.parse(convertedString);
    adguard.console.debug(converted);
    if (converted.length != rules.length - expectedErrorsCount - expectedCssTrunkatedCount) {
        errors.push('Not all the rules presented in json');
    }

    function createErrorMessage(expected, current, valueName) {
        return 'Wrong ' + valueName + ' value for expected: ' + JSON.stringify(expected, null, '\t') + '\n'
            + 'actual:' + JSON.stringify(current, null, '\t') + '\n';
    }

    function checkRule(current, expected) {
        if (current.trigger['url-filter'] != expected.trigger['url-filter']) {
            errors.push(createErrorMessage(expected, current, 'trigger url-filter'));
        }

        if (expected.trigger['load-type']) {
            if (!current.trigger['load-type']
                || current.trigger['load-type'].toString() != expected.trigger['load-type'].toString()) {
                errors.push(createErrorMessage(expected, current, 'trigger load-type'));
            }
        }

        if (expected.trigger['if-domain']) {
            if (!current.trigger['if-domain']
                || current.trigger['if-domain'].toString() != expected.trigger['if-domain'].toString()) {
                errors.push(createErrorMessage(expected, current, 'trigger if-domain'));
            }
        }

        if (expected.trigger['unless-domain']) {
            if (!current.trigger['unless-domain']
                || current.trigger['unless-domain'].toString() != expected.trigger['unless-domain'].toString()) {
                errors.push(createErrorMessage(expected, current, 'trigger unless-domain'));
            }
        }

        if (expected.trigger['resource-type']) {
            if (!current.trigger['resource-type']
                || current.trigger['resource-type'].toString() != expected.trigger['resource-type'].toString()) {
                errors.push(createErrorMessage(expected, current, 'trigger resource-type'));
            }
        } else {
            if (current.trigger['resource-type']) {
                errors.push(createErrorMessage(expected, current, 'trigger resource-type'));
            }
        }

        if (expected.action['type']) {
            if (!current.action['type']
                || current.action['type'].toString() != expected.action['type'].toString()) {
                errors.push(createErrorMessage(expected, current, 'action type'));
            }
        }

        if (expected.action['selector']) {
            if (!current.action['selector']
                || current.action['selector'].toString() != expected.action['selector'].toString()) {
                errors.push(createErrorMessage(expected, current, 'action selector'));
            }
        }
    }

    // From test_safari_correct.js
    var correct = safariCorrectRules;

    converted.forEach(function (current, i) {
        var expected = correct[i];

        //adguard.console.debug(current);
        //adguard.console.debug(expected);

        checkRule(current, expected);
    });
}