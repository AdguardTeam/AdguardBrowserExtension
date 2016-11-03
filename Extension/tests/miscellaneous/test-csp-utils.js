var checkHeaders = function (assert, originalCsp, blockWebSocketCspAdd, blockWebSocketsCsp) {
    var connectionHeader = 'Connection';
    var cspHeader = 'Content-Security-Policy';
    var xFrameOptionsHeader = 'X-Frame-Options';

    var originalConnection = 'keep-alive';
    var originalXFrameOptions = 'SAMEORIGIN';

    var headers = [
        {name: connectionHeader, value: originalConnection},
        {name: xFrameOptionsHeader, value: originalXFrameOptions}
    ];

    var changed = CspUtils.blockWebSockets(headers);
    assert.ok(changed);
    assert.equal(headers.length, 3);
    assert.equal(headers[0].name, connectionHeader);
    assert.equal(headers[0].value, originalConnection);
    assert.equal(headers[1].name, xFrameOptionsHeader);
    assert.equal(headers[1].value, originalXFrameOptions);
    assert.equal(headers[2].name, cspHeader);
    assert.equal(headers[2].value, blockWebSocketCspAdd);

    headers = [
        {name: connectionHeader, value: originalConnection},
        {name: cspHeader, value: originalCsp},
        {name: xFrameOptionsHeader, value: originalXFrameOptions}
    ];

    changed = CspUtils.blockWebSockets(headers);
    assert.ok(changed);
    assert.equal(headers.length, 3);
    assert.equal(headers[0].name, connectionHeader);
    assert.equal(headers[0].value, originalConnection);
    assert.equal(headers[1].name, xFrameOptionsHeader);
    assert.equal(headers[1].value, originalXFrameOptions);
    assert.equal(headers[2].name, cspHeader);
    assert.equal(headers[2].value, blockWebSocketsCsp);

    changed = CspUtils.blockWebSockets(headers);
    assert.notOk(changed);
};

QUnit.test("CSP Utils Test", function(assert) {
    var originalCsp = "default-src 'none'; script-src 'self'; connect-src 'self'; img-src 'self'; style-src 'self';";

    var blockWebSocketsCsp = "default-src 'none'; script-src 'self'; connect-src 'self'; img-src 'self'; style-src 'self'; frame-src http:";
    var blockWebSocketCspAdd = 'frame-src http:';

    //This csp header should not be changed
    checkHeaders(assert, originalCsp, blockWebSocketCspAdd, blockWebSocketsCsp);

    //This csp header should be foiled with block websockets directives
    originalCsp = "default-src 'none'; script-src 'self' wss:; connect-src 'self' ws:; img-src 'self'; style-src 'self';";
    blockWebSocketsCsp = "default-src 'none'; script-src 'self' wss:; connect-src 'self' ws:; img-src 'self'; style-src 'self'; frame-src http:";
    checkHeaders(assert, originalCsp, blockWebSocketCspAdd, blockWebSocketsCsp);

    originalCsp = "default-src 'self' * 'unsafe-inline' 'unsafe-eval' data: blob: chromenull: chromeinvoke: chromeinvokeimmediate: ybnotification:; script-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: chromenull: chromeinvoke: chromeinvokeimmediate: ybnotification: hdrezka.tv hdrezka.me hdrezka.co *.hdrezka.tv *.hdrezka.me *.hdrezka.co cdn7.rocks hgbn.rocks hghit.com psma01.com psma02.com psma03.com adservone-globotech1.netdna-ssl.com adservone.com onedmp.com skycdnhost.com recreativ.ru etarg.ru juppser.ru et-code.ru trafmag.com tch10.com alipromo.com 1plus1.ua videomore.ru megogo.net ovva.tv ren.tv rutube.ru ok.ru vk.com mail.ru facebook.net facebook.com fb.com twitter.com youtu.be youtube.com googlevideo.com googleapis.com gstatic.com googleusercontent.com google-analytics.com google.com yandex.st yandex.ru yandex.kz yandex.ua yandex.net yastatic.net *.cdn7.rocks *.hgbn.rocks *.hghit.com *.psma01.com *.psma02.com *.psma03.com *.adservone-globotech1.netdna-ssl.com *.adservone.com *.onedmp.com *.skycdnhost.com *.recreativ.ru *.etarg.ru *.juppser.ru *.et-code.ru *.trafmag.com *.tch10.com *.alipromo.com *.1plus1.ua *.videomore.ru *.megogo.net *.ovva.tv *.ren.tv *.rutube.ru *.ok.ru *.vk.com *.mail.ru *.facebook.net *.facebook.com *.fb.com *.twitter.com *.youtu.be *.youtube.com *.googlevideo.com *.googleapis.com *.gstatic.com *.googleusercontent.com *.google-analytics.com *.google.com *.yandex.st *.yandex.ru *.yandex.kz *.yandex.ua *.yandex.net *.yastatic.net; connect-src http:; frame-src 'self' data: blob: chromenull: chromeinvoke: chromeinvokeimmediate: ybnotification: hdrezka.tv hdrezka.me 37.220.36.15 cdnapponline.com hdcdn.nl cdnhd.nl *.cdnapponline.com *.hdcdn.nl *.cdnhd.nl cdn7.rocks hgbn.rocks hghit.com psma01.com psma02.com psma03.com adservone-globotech1.netdna-ssl.com adservone.com onedmp.com skycdnhost.com recreativ.ru etarg.ru juppser.ru et-code.ru trafmag.com tch10.com alipromo.com 1plus1.ua videomore.ru megogo.net ovva.tv ren.tv rutube.ru ok.ru vk.com mail.ru facebook.net facebook.com fb.com twitter.com youtu.be youtube.com googlevideo.com googleapis.com gstatic.com googleusercontent.com google-analytics.com google.com yandex.st yandex.ru yandex.kz yandex.ua yandex.net yastatic.net *.cdn7.rocks *.hgbn.rocks *.hghit.com *.psma01.com *.psma02.com *.psma03.com *.adservone-globotech1.netdna-ssl.com *.adservone.com *.onedmp.com *.skycdnhost.com *.recreativ.ru *.etarg.ru *.juppser.ru *.et-code.ru *.trafmag.com *.tch10.com *.alipromo.com *.1plus1.ua *.videomore.ru *.megogo.net *.ovva.tv *.ren.tv *.rutube.ru *.ok.ru *.vk.com *.mail.ru *.facebook.net *.facebook.com *.fb.com *.twitter.com *.youtu.be *.youtube.com *.googlevideo.com *.googleapis.com *.gstatic.com *.googleusercontent.com *.google-analytics.com *.google.com *.yandex.st *.yandex.ru *.yandex.kz *.yandex.ua *.yandex.net *.yastatic.net;";
    blockWebSocketsCsp = "default-src 'self' * 'unsafe-inline' 'unsafe-eval' data: blob: chromenull: chromeinvoke: chromeinvokeimmediate: ybnotification:; script-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: chromenull: chromeinvoke: chromeinvokeimmediate: ybnotification: hdrezka.tv hdrezka.me hdrezka.co *.hdrezka.tv *.hdrezka.me *.hdrezka.co cdn7.rocks hgbn.rocks hghit.com psma01.com psma02.com psma03.com adservone-globotech1.netdna-ssl.com adservone.com onedmp.com skycdnhost.com recreativ.ru etarg.ru juppser.ru et-code.ru trafmag.com tch10.com alipromo.com 1plus1.ua videomore.ru megogo.net ovva.tv ren.tv rutube.ru ok.ru vk.com mail.ru facebook.net facebook.com fb.com twitter.com youtu.be youtube.com googlevideo.com googleapis.com gstatic.com googleusercontent.com google-analytics.com google.com yandex.st yandex.ru yandex.kz yandex.ua yandex.net yastatic.net *.cdn7.rocks *.hgbn.rocks *.hghit.com *.psma01.com *.psma02.com *.psma03.com *.adservone-globotech1.netdna-ssl.com *.adservone.com *.onedmp.com *.skycdnhost.com *.recreativ.ru *.etarg.ru *.juppser.ru *.et-code.ru *.trafmag.com *.tch10.com *.alipromo.com *.1plus1.ua *.videomore.ru *.megogo.net *.ovva.tv *.ren.tv *.rutube.ru *.ok.ru *.vk.com *.mail.ru *.facebook.net *.facebook.com *.fb.com *.twitter.com *.youtu.be *.youtube.com *.googlevideo.com *.googleapis.com *.gstatic.com *.googleusercontent.com *.google-analytics.com *.google.com *.yandex.st *.yandex.ru *.yandex.kz *.yandex.ua *.yandex.net *.yastatic.net; connect-src http:; frame-src 'self' chromenull: chromeinvoke: chromeinvokeimmediate: ybnotification: hdrezka.tv hdrezka.me 37.220.36.15 cdnapponline.com hdcdn.nl cdnhd.nl *.cdnapponline.com *.hdcdn.nl *.cdnhd.nl cdn7.rocks hgbn.rocks hghit.com psma01.com psma02.com psma03.com adservone-globotech1.netdna-ssl.com adservone.com onedmp.com skycdnhost.com recreativ.ru etarg.ru juppser.ru et-code.ru trafmag.com tch10.com alipromo.com 1plus1.ua videomore.ru megogo.net ovva.tv ren.tv rutube.ru ok.ru vk.com mail.ru facebook.net facebook.com fb.com twitter.com youtu.be youtube.com googlevideo.com googleapis.com gstatic.com googleusercontent.com google-analytics.com google.com yandex.st yandex.ru yandex.kz yandex.ua yandex.net yastatic.net *.cdn7.rocks *.hgbn.rocks *.hghit.com *.psma01.com *.psma02.com *.psma03.com *.adservone-globotech1.netdna-ssl.com *.adservone.com *.onedmp.com *.skycdnhost.com *.recreativ.ru *.etarg.ru *.juppser.ru *.et-code.ru *.trafmag.com *.tch10.com *.alipromo.com *.1plus1.ua *.videomore.ru *.megogo.net *.ovva.tv *.ren.tv *.rutube.ru *.ok.ru *.vk.com *.mail.ru *.facebook.net *.facebook.com *.fb.com *.twitter.com *.youtu.be *.youtube.com *.googlevideo.com *.googleapis.com *.gstatic.com *.googleusercontent.com *.google-analytics.com *.google.com *.yandex.st *.yandex.ru *.yandex.kz *.yandex.ua *.yandex.net *.yastatic.net;";
    checkHeaders(assert, originalCsp, blockWebSocketCspAdd, blockWebSocketsCsp);
});