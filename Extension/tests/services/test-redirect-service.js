/* global QUnit */

QUnit.test('Redirect service', (assert) => {
    const noopJsContent = '(function() {})()';
    const jsContentType = 'application/javascript';
    const gifRedirectTitle = '1x1-transparent.gif';
    const noopjsTitle = 'noopjs';
    const blankJsAlias = 'blank-js';

    const rawYaml = `
        - title: ${gifRedirectTitle}
          aliases:
            - 1x1-transparent-gif
          comment: 'http://probablyprogramming.com/2009/03/15/the-tiniest-gif-ever'
          contentType: image/gif;base64
          content: R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==

        - title: ${noopjsTitle}
          aliases:
            - ${blankJsAlias}
          contentType: ${jsContentType}
          content: ${noopJsContent}`;

    adguard.redirectFilterService.setRedirectSources(rawYaml);

    assert.ok(adguard.redirectFilterService.hasRedirect(gifRedirectTitle));
    assert.ok(adguard.redirectFilterService.hasRedirect(noopjsTitle));
    assert.ok(adguard.redirectFilterService.hasRedirect(blankJsAlias));
    assert.notOk(adguard.redirectFilterService.hasRedirect('invalid'));

    assert.equal(adguard.redirectFilterService.buildRedirectUrl(gifRedirectTitle),
        'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==');

    function checkUrl(title, expectedContent, expectedContentType = jsContentType) {
        const redirectUrl = adguard.redirectFilterService.buildRedirectUrl(title);
        const [rawContentType, base64str] = redirectUrl.split(',');
        assert.equal(atob(base64str), expectedContent, 'decoded string should be equal with source');
        const [contentType] = rawContentType.split(';');
        assert.equal(contentType, `data:${expectedContentType}`);
    }

    checkUrl(noopjsTitle, noopJsContent, jsContentType);
    checkUrl(blankJsAlias, noopJsContent, jsContentType);
});
