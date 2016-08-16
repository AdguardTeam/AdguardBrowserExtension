/* global addTestCase */
/* global assertFalse */
/* global CssFilter */
/* global CssFilterRule */
/* global assertEquals */
/* global assertTrue */
/* global ExtendedSelector */

function testExtendedSelector() {
    var elements;

    var selector = new ExtendedSelector('div a[-ext-contains="test"]');
    elements = selector.querySelectorAll();
    assertEquals(1, elements.length);
    assertTrue(selector.matches(elements[0]));

    elements = new ExtendedSelector('div.test[-ext-has="test"]').querySelectorAll();
    console.warn(elements);

    elements = new ExtendedSelector('div#test-div[-ext-has="test"]').querySelectorAll();
    console.warn(elements);

    elements = new ExtendedSelector('div[-ext-contains="advert"][-ext-has="h1.title"][attr="value"]').querySelectorAll();
    console.warn(elements);

    elements = new ExtendedSelector('[-ext-has="div.advert"]').querySelectorAll();
    console.warn(elements);

    elements = new ExtendedSelector('[-ext-has="div.test-class-two"]').querySelectorAll();
    console.warn(elements);

    elements = new ExtendedSelector('#banner [-ext-has=".advert"] > span[-ext-contains="test"]').querySelectorAll();
    console.warn(elements);
}

addTestCase(testExtendedSelector);