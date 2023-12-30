const fakeFilterWithVersion = (version: string) => {
    const currentDateWithoutMS = new Date().toISOString()
        .slice(0, -5);

    return `! Title: Fake filter
! Description: Fake filter
! Version: ${version}
! TimeUpdated: ${currentDateWithoutMS}+00:00
! Expires: 4 days (update frequency)
!
||example.com^$document
||example.org^##h1`;
};

export { fakeFilterWithVersion };
