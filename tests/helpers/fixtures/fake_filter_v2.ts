const currentDateWithoutMS = new Date().toISOString().slice(0, -5);
const fakeFilterV2 = `! Title: Fake filter
! Description: Fake filter
! Version: 2.0.0.0
! TimeUpdated: ${currentDateWithoutMS}+00:00
! Expires: 4 days (update frequency)
!
||example.com^$document
||example.org^##h1`;

export { fakeFilterV2 };
