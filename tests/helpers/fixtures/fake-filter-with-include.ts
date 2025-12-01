import { calculateChecksum } from '../../../tools/utils/checksum';

const includedFakeFilterName = 'included-fake-filter.txt';

const fakeFilterWithIncludeWithoutChecksum = `! Title: Fake filter
! Description: Fake filter
! Version: 2.0.0.0
! TimeUpdated: 2023-02-01T00:00:00+00:00
! Expires: 4 days (update frequency)
!
/rule-from-fake-filter.txt
!#include ./${includedFakeFilterName}
/another-rule-from-fake-filter.txt`;

const fakeFilterWithInclude = `! Checksum: ${calculateChecksum(fakeFilterWithIncludeWithoutChecksum)}
${fakeFilterWithIncludeWithoutChecksum}`;

const includedFakeFilter = `/rule-from-included-fake-filter.txt
/another-rule-from-included-fake-filter.txt`;

export { fakeFilterWithInclude, includedFakeFilter, includedFakeFilterName };
