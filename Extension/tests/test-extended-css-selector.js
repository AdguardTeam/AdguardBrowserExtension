/* global addTestCase */
/* global assertFalse */
/* global CssFilter */
/* global CssFilterRule */
/* global assertEquals */
/* global assertTrue */
/* global ExtendedSelector */

function testExtendedSelector() {
    var elements;

    elements = ExtendedSelector('div a[-ext-contains="test"]');
    console.warn(elements);

    elements = ExtendedSelector('div.test[-ext-has="test"]');
    console.warn(elements);

    elements = ExtendedSelector('div#test-div[-ext-has="test"]');
    console.warn(elements);

    elements = ExtendedSelector('div[-adg-contains="advert"][-ext-has="h1.title"][attr="value"]');
    console.warn(elements);

    elements = ExtendedSelector('[-ext-has="div.advert"]');
    console.warn(elements);

    elements = ExtendedSelector('[-ext-has="div.test-class-two"]');
    console.warn(elements);

    elements = ExtendedSelector('#banner [-ext-has=".advert"] > span[-ext-contains="test"]');
    console.warn(elements);
}

addTestCase(testExtendedSelector);