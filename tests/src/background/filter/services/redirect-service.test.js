import { redirectService } from '../../../../../Extension/src/background/filter/services/redirect-service';

describe('Redirect service', () => {
    it('works', () => {
        const noopJsContent = '(function() {})()';
        const jsContentType = 'application/javascript';
        const gifRedirectTitle = '1x1-transparent.gif';
        const noopjsTitle = 'noopjs';
        const blankJsAlias = 'blank-js';
        const clickToLoadTitle = 'click2load.html';
        const frameContentType = 'text/html';

        const rawYaml = `
        - title: ${gifRedirectTitle}
          description: 'http://probablyprogramming.com/2009/03/15/the-tiniest-gif-ever'
          aliases:
            - 1x1-transparent-gif
          contentType: image/gif;base64
          content: R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==

        - title: ${noopjsTitle}
          aliases:
            - ${blankJsAlias}
          contentType: ${jsContentType}
          content: ${noopJsContent}


        - title: ${clickToLoadTitle}
          description: 'http://probablyprogramming.com/2009/03/15/the-tiniest-gif-ever'
          aliases:
            - ${clickToLoadTitle}
          isBlocking: true
          contentType: ${frameContentType}`;

        redirectService.init(rawYaml);

        expect(redirectService.hasRedirect(gifRedirectTitle)).toBeTruthy();
        expect(redirectService.hasRedirect(noopjsTitle)).toBeTruthy();
        expect(redirectService.hasRedirect(blankJsAlias)).toBeTruthy();
        expect(redirectService.hasRedirect(clickToLoadTitle)).toBeTruthy();
        expect(redirectService.hasRedirect('invalid')).toBeFalsy();

        const blockingRedirects = redirectService.getBlockingRedirects();
        expect(blockingRedirects.length).toBe(1);
        expect(blockingRedirects).toContain(clickToLoadTitle);
    });
});
