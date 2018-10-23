QUnit.test('Test Set-Cookie Parser', function (assert) {

    const setCookieValue = 'user_session=wBDJ5-0Yz9G_qyo7SbbGZ_Mppt3ysirgJtIyn2pkGpfFa-e5; path=/; expires=Tue, 06 Nov 2018 12:57:11 -0000; secure; HttpOnly';
    const cookie = adguard.utils.cookie.parseSetCookie(setCookieValue);

    assert.ok(cookie);
    assert.equal(cookie.name, 'user_session');
    assert.equal(cookie.value, 'wBDJ5-0Yz9G_qyo7SbbGZ_Mppt3ysirgJtIyn2pkGpfFa-e5');
    assert.equal(cookie.path, '/');
    assert.ok(cookie.expires)
    assert.equal(cookie.expires.getTime(), 1541509031000);
    assert.ok(cookie.secure);
    assert.ok(cookie.httpOnly);
});