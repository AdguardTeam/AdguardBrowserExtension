import { redirectService } from '../../../../Extension/src/background/filter/services/redirect-service';

describe('Redirect service', () => {
    it('works', () => {
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

        redirectService.init(rawYaml);

        expect(redirectService.hasRedirect(gifRedirectTitle)).toBeTruthy();
        expect(redirectService.hasRedirect(noopjsTitle)).toBeTruthy();
        expect(redirectService.hasRedirect(blankJsAlias)).toBeTruthy();
        expect(redirectService.hasRedirect('invalid')).toBeFalsy();
    });
});

