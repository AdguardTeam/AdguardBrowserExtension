import { calculateChecksum } from '../../../tools/resources/download-filters';

const currentDateWithoutMS = new Date().toISOString().slice(0, -5);
const fakeFilterWithoutChecksum = `! Title: Fake filter
! Description: Fake filter
! Version: 2.0.0.0
! TimeUpdated: ${currentDateWithoutMS}+00:00
! Expires: 4 days (update frequency)
!
||example.com^$document
||example.org^##h1`;

const checksum = calculateChecksum(fakeFilterWithoutChecksum);
export const fakeFilterV2 = `! Checksum: ${checksum}
${fakeFilterWithoutChecksum}`;
