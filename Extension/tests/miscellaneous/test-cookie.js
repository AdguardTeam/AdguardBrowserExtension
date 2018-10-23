QUnit.test('Test parse Set-Cookie invalid', function (assert) {

    let cookie = adguard.utils.cookie.parseSetCookie(null);
    assert.notOk(cookie);

    cookie = adguard.utils.cookie.parseSetCookie('empty');
    assert.ok(cookie);
    assert.equal(cookie.name, 'empty');
    assert.notOk(cookie.value);
});

QUnit.test('Test parse Set-Cookie complicated', function (assert) {

    const setCookieValue = 'user_session=wBDJ5-apskjfjkas124192--e5; path=/; expires=Tue, 06 Nov 2018 12:57:11 -0000; secure; HttpOnly';
    const cookie = adguard.utils.cookie.parseSetCookie(setCookieValue);

    assert.ok(cookie);
    assert.equal(cookie.name, 'user_session');
    assert.equal(cookie.value, 'wBDJ5-apskjfjkas124192--e5');
    assert.equal(cookie.path, '/');
    assert.ok(cookie.expires);
    assert.equal(cookie.expires.getTime(), 1541509031000);
    assert.ok(cookie.secure);
    assert.ok(cookie.httpOnly);
});

QUnit.test('Test parse Set-Cookie Parser simple', function (assert) {

    const setCookieValue = 'value=123';
    const cookie = adguard.utils.cookie.parseSetCookie(setCookieValue);

    assert.ok(cookie);
    assert.equal(cookie.name, 'value');
    assert.equal(cookie.value, '123');
    assert.notOk(cookie.path)
    assert.notOk(cookie.expires)
    assert.notOk(cookie.secure);
    assert.notOk(cookie.httpOnly);
});

QUnit.test('Test Cookie header invalid', function (assert) {

    const cookieValue = 'value';
    const cookies = adguard.utils.cookie.parseCookie(cookieValue);

    assert.ok(Array.isArray(cookies));
    assert.equal(cookies.length, 0);
});

QUnit.test('Test Cookie header empty', function (assert) {

    const cookieValue = 'value=';
    const cookies = adguard.utils.cookie.parseCookie(cookieValue);

    assert.ok(Array.isArray(cookies));
    assert.equal(cookies.length, 1);
    assert.equal(cookies[0].name, "value");
    assert.equal(cookies[0].value, "");
});

QUnit.test('Test Cookie header simple', function (assert) {

    const cookieValue = 'value=123';
    const cookies = adguard.utils.cookie.parseCookie(cookieValue);

    assert.ok(Array.isArray(cookies));
    assert.equal(cookies.length, 1);
    assert.equal(cookies[0].name, "value");
    assert.equal(cookies[0].value, "123");
});

QUnit.test('Test Cookie header complicated', function (assert) {

    const cookieValue = '_octo=GH1.1.635223982.1507661197; logged_in=yes; dotcom_user=ameshkov; user_session=wBDJ5-apskjfjkas124192-e5; __Host-user_session_same_site=wBDJ5-apskjfjkas124192-e5; _ga=GA1.2.1719384528.1507661197; tz=Europe%2FMoscow; has_recent_activity=1; _gh_sess=VWo3R1VsRWxp';
    const cookies = adguard.utils.cookie.parseCookie(cookieValue);

    assert.ok(Array.isArray(cookies));
    assert.equal(cookies.length, 9);
    assert.equal(cookies[0].name, "_octo");
    assert.equal(cookies[0].value, "GH1.1.635223982.1507661197");
    assert.equal(cookies[1].name, "logged_in");
    assert.equal(cookies[1].value, "yes");
});

QUnit.test('Test serialize invalid cookie', function (assert) {

    const cookie = {
        name: 'привет',
        value: 'я_кука',
    };

    try {
        let setCookieValue = adguard.utils.cookie.serialize(cookie);
        assert.ok(false, 'Error is not thrown');
    } catch (ex) {
        assert.ok(ex instanceof TypeError);
    }
});

QUnit.test('Test serialize simple cookie', function (assert) {

    const cookie = {
        name: '_octo',
        value: 'GH1.1.635223982.1507661197'
    };

    let setCookieValue = adguard.utils.cookie.serialize(cookie);
    assert.equal(setCookieValue, '_octo=GH1.1.635223982.1507661197');
});

QUnit.test('Test serialize complicated cookie', function (assert) {

    const cookie = {
        name: '_octo',
        value: 'GH1.1.635223982.1507661197',
        path: '/',
        expires: new Date('Tue, 23 Oct 2018 13:40:11 -0000'),
        secure: true,
        httpOnly: true,
    };

    let setCookieValue = adguard.utils.cookie.serialize(cookie);
    assert.equal(setCookieValue, '_octo=GH1.1.635223982.1507661197; Path=/; Expires=Tue, 23 Oct 2018 13:40:11 GMT; HttpOnly; Secure');
});