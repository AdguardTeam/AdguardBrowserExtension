import * as TSUrlFilter from '@adguard/tsurlfilter';
import { webRequestService } from '../../../../Extension/src/background/filter/request-blocking';
import { RequestTypes } from '../../../../Extension/src/background/utils/request-types';

describe('webRequestService', () => {
    it('displays blocking page', () => {
        const requestRule = new TSUrlFilter.NetworkRule('||example.org^$document', 0);
        const requestUrl = 'https://example.org';
        const requestType = RequestTypes.DOCUMENT;
        const rule = webRequestService.postProcessRequest(
            { },
            requestUrl,
            '',
            requestType,
            requestRule,
        );

        expect(rule).toBe(requestRule);

        const response = webRequestService.getBlockedResponseByRule(
            rule,
            requestType,
            requestUrl,
        );

        expect(response.documentBlockedPage)
            .toContain(`url=${encodeURIComponent(requestUrl)}&rule=${encodeURIComponent(requestRule.ruleText)}`);
    });
});
