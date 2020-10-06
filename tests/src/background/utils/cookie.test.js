/* eslint-disable max-len */
import { cookie } from '../../../../Extension/src/background/utils/cookie';

describe('cookie', () => {
    it('parses invalid Set-Cookie', () => {
        let cookieParseResult = cookie.parseSetCookie(null);
        expect(cookieParseResult).toBeFalsy();

        cookieParseResult = cookie.parseSetCookie('empty');
        expect(cookieParseResult).toBeTruthy();
        expect(cookieParseResult.name).toBe('empty');
        expect(cookieParseResult.value).toBeFalsy();
    });

    it('parses complicated Set-Cookie', () => {
        const setCookieValue = 'user_session=wBDJ5-apskjfjkas124192--e5; path=/; expires=Tue, 06 Nov 2018 12:57:11 -0000; secure; HttpOnly';
        const parsedCookie = cookie.parseSetCookie(setCookieValue);

        expect(parsedCookie).toBeTruthy();
        expect(parsedCookie.name).toBe('user_session');
        expect(parsedCookie.value).toBe('wBDJ5-apskjfjkas124192--e5');
        expect(parsedCookie.path).toBe('/');
        expect(parsedCookie.expires).toBeTruthy();
        expect(parsedCookie.expires.getTime()).toBe(1541509031000);
        expect(parsedCookie.secure).toBeTruthy();
        expect(parsedCookie.httpOnly).toBeTruthy();
    });

    it('parses simple Set-Cookie', () => {
        const setCookieValue = 'value=123';
        const parsedCookie = cookie.parseSetCookie(setCookieValue);

        expect(parsedCookie).toBeTruthy();
        expect(parsedCookie.name).toBe('value');
        expect(parsedCookie.value).toBe('123');
        expect(parsedCookie.path).toBeFalsy();
        expect(parsedCookie.expires).toBeFalsy();
        expect(parsedCookie.secure).toBeFalsy();
        expect(parsedCookie.httpOnly).toBeFalsy();
    });


    it('parses invalid cookie header', () => {
        const cookieValue = 'value';
        const cookies = cookie.parseCookie(cookieValue);

        expect(Array.isArray(cookies)).toBeTruthy();
        expect(cookies.length).toBe(0);
    });

    it('parses empty cookie header', () => {
        const cookieValue = 'value=';
        const cookies = cookie.parseCookie(cookieValue);

        expect(Array.isArray(cookies)).toBeTruthy();
        expect(cookies.length).toBe(1);
        expect(cookies[0].name).toBe('value');
        expect(cookies[0].value).toBe('');
    });

    it('parses simple cookie header', () => {
        const cookieValue = 'value=123';
        const cookies = cookie.parseCookie(cookieValue);

        expect(Array.isArray(cookies)).toBeTruthy();
        expect(cookies.length).toBe(1);
        expect(cookies[0].name).toBe('value');
        expect(cookies[0].value).toBe('123');
    });

    it('parses complicated cookie header', () => {
        const cookieValue = '_octo=GH1.1.635223982.1507661197; logged_in=yes; dotcom_user=ameshkov; user_session=wBDJ5-apskjfjkas124192-e5; __Host-user_session_same_site=wBDJ5-apskjfjkas124192-e5; _ga=GA1.2.1719384528.1507661197; tz=Europe%2FMoscow; has_recent_activity=1; _gh_sess=VWo3R1VsRWxp';
        const cookies = cookie.parseCookie(cookieValue);

        expect(Array.isArray(cookies)).toBeTruthy();
        expect(cookies.length).toBe(9);
        expect(cookies[0].name).toBe('_octo');
        expect(cookies[0].value).toBe('GH1.1.635223982.1507661197');
        expect(cookies[1].name).toBe('logged_in');
        expect(cookies[1].value).toBe('yes');
    });

    it('throws error on serialize of invalid cookie', () => {
        const cookieObj = {
            name: 'привет',
            value: 'я_кука',
        };

        expect(() => {
            cookie.serialize(cookieObj);
        }).toThrow();
    });

    it('serializes simple cookie', () => {
        const cookieObj = {
            name: '_octo',
            value: 'GH1.1.635223982.1507661197',
        };

        const setCookieValue = cookie.serialize(cookieObj);
        expect(setCookieValue).toBe('_octo=GH1.1.635223982.1507661197');
    });

    it('serializes complicated cookie', () => {
        const cookieObj = {
            name: '_octo',
            value: 'GH1.1.635223982.1507661197',
            path: '/',
            expires: new Date('Tue, 23 Oct 2018 13:40:11 -0000'),
            secure: true,
            httpOnly: true,
        };

        const setCookieValue = cookie.serialize(cookieObj);
        expect(setCookieValue).toBe('_octo=GH1.1.635223982.1507661197; Path=/; Expires=Tue, 23 Oct 2018 13:40:11 GMT; HttpOnly; Secure');
    });
});
