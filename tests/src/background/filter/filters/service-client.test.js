import path from 'path';

import { backend } from '../../../../../Extension/src/background/filter/filters/service-client';

describe('service-client', () => {
    it('loads filters considering conditions', async () => {
        const lines = await backend.downloadFilterRulesBySubscriptionUrl(path.resolve(__dirname, 'test-filter.txt'));
        expect(lines).toHaveLength(2);
    });
});
