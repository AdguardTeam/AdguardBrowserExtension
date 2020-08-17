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

    adguard.redirectFilterService.init(rawYaml);

    assert.ok(adguard.redirectFilterService.hasRedirect(gifRedirectTitle));
    assert.ok(adguard.redirectFilterService.hasRedirect(noopjsTitle));
    assert.ok(adguard.redirectFilterService.hasRedirect(blankJsAlias));
    assert.notOk(adguard.redirectFilterService.hasRedirect('invalid'));
});
