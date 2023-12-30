const fakeFilterV4WithDiffPath = `! Diff-Path: /some.patch
! Title: Fake filter
! Description: Fake filter
! Version: 1.0.0.0
! TimeUpdated: 2023-02-01T00:00:00+00:00
! Expires: 4 days (update frequency)
!
||example.com^$document
||example.org^##h1`;

export { fakeFilterV4WithDiffPath };
