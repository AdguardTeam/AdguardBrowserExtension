/* global QUnit */

// TODO implement getReplace function, es5 -> es6
QUnit.test('testReplaceCyrillicText', function (assert) {
    adguard.prefs.features.responseContentFilteringSupported = true;

    const input = '<title>Старый текст</title>';
    const expected = '<title>Новый текст</title>';

    const ruleText = '||example.com^$replace=/старый ТЕКСТ/Новый текст/i';
    const rule = new adguard.rules.UrlFilterRule(ruleText);

    assert.ok(rule.getReplace());

    const actual = rule.getReplace().apply(input);
    assert.equal(actual, expected);
});

QUnit.test('testReplaceModifierJson', function (assert) {
    adguard.prefs.features.responseContentFilteringSupported = true;

    var input = '{\n' +
        '    "enabled": true, \n' +
        '    "force_disabled": false\n' +
        '}';

    var expected = '{\n' +
        '    "enabled": false, \n' +
        '    "force_disabled": false\n' +
        '}';

    var ruleText = '||example.com^$replace=/"enabled": true\\,/"enabled": false\\,/i,~third-party,xmlhttprequest';
    var rule = new adguard.rules.UrlFilterRule(ruleText);

    assert.ok(rule.getReplace());

    var output = rule.replace.apply(input);
    assert.equal(output, expected);
});

QUnit.test('testReplaceModifierVast', function (assert) {
    adguard.prefs.features.responseContentFilteringSupported = true;

    var input = '<?xml version="1.0" encoding="utf-8"?>\n' +
        '<VAST version="2.0">\n' +
        '    <Ad id="VPAID">\n' +
        '        <InLine>\n' +
        '            <AdSystem version="3.1">LiveRail</AdSystem>\n' +
        '            <AdTitle>VPAID Ad Manager</AdTitle>\n' +
        '            <Impression></Impression>\n' +
        '            <Creatives>\n' +
        '                <Creative sequence="1">\n' +
        '                    <Linear>\n' +
        '                        <Duration>00:00:15</Duration>\n' +
        '                        <MediaFiles>\n' +
        '                            <MediaFile delivery="progressive" width="640" height="480" scalable="1" type="application/javascript" apiFramework="VPAID"><![CDATA[http://cdn-static.liverail.com/js/LiveRail.AdManager-1.0.js?LR_PUBLISHER_ID=1331&LR_AUTOPLAY=0&LR_CONTENT=1&LR_TITLE=Foo&LR_VIDEO_ID=1234&LR_VERTICALS=international_news&LR_FORMAT=application/javascript]]></MediaFile>\n' +
        '                        </MediaFiles>\n' +
        '                    </Linear>\n' +
        '                </Creative>\n' +
        '\n' +
        '                <Creative sequence="1">\n' +
        '                    <CompanionAds>\n' +
        '                        <Companion width="300" height="250">\n' +
        '                            <HTMLResource><![CDATA[<div id="lr_comp_300x250" style=" width: 300px; height: 250px; display: none;"></div>]]></HTMLResource>\n' +
        '                        </Companion>\n' +
        '                        <Companion width="300" height="60">\n' +
        '                            <HTMLResource><![CDATA[<div id="lr_comp_300x60" style=" width: 300px; height: 60px; display: none;"></div>]]></HTMLResource>\n' +
        '                        </Companion>\n' +
        '                        <Companion width="728" height="90">\n' +
        '                            <HTMLResource><![CDATA[<div id="lr_comp_728x90" style=" width: 728px; height: 90px; display: none;"></div>]]></HTMLResource>\n' +
        '                        </Companion>\n' +
        '                    </CompanionAds>\n' +
        '                </Creative>\n' +
        '            </Creatives>\n' +
        '        </InLine>\n' +
        '    </Ad>\n' +
        '</VAST>';

    var expected = '<?xml version="1.0" encoding="utf-8"?>\n' +
        '<VAST version="2.0"></VAST>';

    var ruleText = '||example.com^$third-party,replace=/(<VAST[\\s\\S]*?>)[\\s\\S]*<\\/VAST>/\\$1<\\/VAST>/,object-subrequest';
    var rule = new adguard.rules.UrlFilterRule(ruleText);

    assert.ok(rule.getReplace());

    var output = rule.getReplace().apply(input);
    assert.equal(output, expected);
});

QUnit.test('testReplaceRegexpRule', function (assert) {
    adguard.prefs.features.responseContentFilteringSupported = true;

    // https://github.com/AdguardTeam/AdguardForAndroid/issues/1027
    var input = 'http://test.ru/hello/bug/test';
    var expected = 'http://test.ru/bug/bug/test';
    var ruleText = '/.*/$replace=/hello/bug/';

    var rule = new adguard.rules.UrlFilterRule(ruleText);

    assert.ok(rule.getReplace());

    assert.equal(rule.getReplace().apply(input), expected);
});

QUnit.test('testReplaceToEmptyString', function (assert) {
    adguard.prefs.features.responseContentFilteringSupported = true;

    var input = 'Hello I am the banner image for tests';
    var expected = 'Hello I am the image for tests';

    var ruleText = '||example.com^$replace=/banner //i,~third-party,xmlhttprequest';
    var rule = new adguard.rules.UrlFilterRule(ruleText);

    assert.ok(rule.getReplace());

    var output = rule.getReplace().apply(input);
    assert.equal(output, expected);
});

QUnit.test('testReplaceWithMoreThanOneReplaceGroups', function (assert) {
    adguard.prefs.features.responseContentFilteringSupported = true;

    var input = 'remove "BIG" from string';
    var expected = 'remove "" from string';

    var ruleText = '||example.com^$replace=/(remove ")[\\s\\S]*(" from string)/\\$1\\$2/';
    var rule = new adguard.rules.UrlFilterRule(ruleText);

    assert.ok(rule.getReplace());

    var actual = rule.getReplace().apply(input);
    assert.equal(actual, expected);
});
