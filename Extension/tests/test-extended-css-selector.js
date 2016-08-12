/* global addTestCase */
/* global assertFalse */
/* global CssFilter */
/* global CssFilterRule */
/* global assertEquals */
/* global assertTrue */
/* global ExtendedSelector */

function testExtendedSelector() {
    var elements = ExtendedSelector('div a[-ext-contains="test"]');
    console.warn(elements);

    //elements = ExtendedSelector('div.test[-ext-has="test"]');
    //console.warn(elements);

    //elements = ExtendedSelector('div#test-div[-ext-has="test"]');
    //console.warn(elements);

    //div[-adg-contains="advert"][-ext-has="h1.title"][attr="value"]
    //[-ext-has="div.advert"]
    //#banner [-ext-has=".advert"] > span[-ext-contains="test"]
}

addTestCase(testExtendedSelector);