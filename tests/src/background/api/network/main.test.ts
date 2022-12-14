import { network } from '../../../../../Extension/src/background/api/network';
import { mockFilterPath } from '../../../../helpers';

describe('network', () => {
    it('loads filters considering conditions', async () => {
        // This mock needs to simulate external request in the filters downloader
        const mockNetworkRequestPrefix = 'mock:/';
        const filePath = `${mockNetworkRequestPrefix}${mockFilterPath}`;
        const lines = await network.downloadFilterRulesBySubscriptionUrl(filePath);
        expect(lines).toHaveLength(2);
    });
});
