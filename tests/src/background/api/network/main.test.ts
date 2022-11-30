import path from 'path';

import { network } from '../../../../../Extension/src/background/api/network';

describe('network', () => {
    it('loads filters considering conditions', async () => {
        const lines = await network.downloadFilterRulesBySubscriptionUrl(path.resolve(__dirname, 'test-filter.txt'));
        expect(lines).toHaveLength(2);
    });
});
