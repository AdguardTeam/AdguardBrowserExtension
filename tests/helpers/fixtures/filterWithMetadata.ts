const currentDateWithoutMS = new Date().toISOString().slice(0, -5);
export const filterNameFixture = 'AdGuard Fixture Filter';
export const filterTextWithMetadataFixture = `
! Title: ${filterNameFixture}
! Description: Mock filter
! Version: 1.0.0.0
! TimeUpdated: ${currentDateWithoutMS}+00:00
! Expires: 7 days (update frequency)
||example.org^$document`;
