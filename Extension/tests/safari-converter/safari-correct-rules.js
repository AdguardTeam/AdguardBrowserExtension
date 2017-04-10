var safariCorrectRules = [
    {
        "trigger": {
            "url-filter": ".*"
        },
        "action": {
            "type": "css-display-none",
            "selector": ".banner"
        }
    },
    {
        "trigger": {
            "url-filter": ".*",
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
            "url-filter": ".*",
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
            "url-filter": ".*",
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
            "url-filter": "^[htpsw]+://([^/]*\\.)?pics\\.rbc\\.ru\\/js\\/swf"
        },
        "action": {
            "type": "block"
        }
    },
    {
        "trigger": {
            "url-filter": "^[htpsw]+://([^/]*\\.)?tardangro\\.com[/:&?]?",
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
            "url-filter": "^[htpsw]+://([^/]*\\.)?videoplaza\\.com[/:&?]?",
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
            "url-filter": "^[htpsw]+://([^/]*\\.)?b\\.babylon\\.com[/:&?]?"
        },
        "action": {
            "type": "block"
        }
    },
    {
        "trigger": {
            "url-filter": "^[htpsw]+://([^/]*\\.)?getsecuredfiles\\.com[/:&?]?",
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
            "url-filter": "^[htpsw]+://([^/]*\\.)?emjcd\\.com[/:&?]?",
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
            "url-filter": "^[htpsw]+://([^/]*\\.)?intellitxt\\.com\\/ast\\/js\\/nbcuni\\/",
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
            "url-filter": "^[htpsw]+://([^/]*\\.)?hulu\\.com\\/embed"
        },
        "action": {
            "type": "ignore-previous-rules"
        }
    },
    {
        "trigger": {
            "url-filter": ".*",
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
            "url-filter": ".*",
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
            "url-filter": ".*",
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
            "url-filter": ".*",
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
            "url-filter": ".*",
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
            "url-filter": "^[htpsw]+://([^/]*\\.)?hulu-jsinject-image\\.com",
            "resource-type": [
                "image"
            ]
        },
        "action": {
            "type": "ignore-previous-rules"
        }
    },
    {
        "trigger": {
            "url-filter": ".*",
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
            "url-filter": ".*",
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