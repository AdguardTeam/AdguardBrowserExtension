/* global addTestCase */
/* global assertFalse */
/* global assertEquals */
/* global assertTrue */
/* global ExtendedSelector */

function testExtendedSelector() {
    var elements;

    var selector = new ExtendedSelector('div a[-ext-contains="test"]');
    elements = selector.querySelectorAll();
    assertEquals(1, elements.length);
    assertTrue(selector.matches(elements[0]));

    selector = new ExtendedSelector('div.test-class[-ext-has="time.g-time"]');
    elements = selector.querySelectorAll();
    assertEquals(1, elements.length);
    assertTrue(selector.matches(elements[0]));

    selector = new ExtendedSelector('div#test-div[-ext-has="test"]');
    elements = selector.querySelectorAll();
    assertEquals(0, elements.length);

    elements = new ExtendedSelector('[-ext-has="div.advert"]').querySelectorAll();
    assertEquals(0, elements.length);

    selector = new ExtendedSelector('[-ext-has="div.test-class-two"]');
    elements = selector.querySelectorAll();
    assertEquals(5, elements.length);
    for (var i = 0; i < elements.length; i++) {
        assertTrue(selector.matches(elements[i]));
    }

    selector = new ExtendedSelector('div[-ext-contains="test"][-ext-has="div.test-class-two"]');
    elements = selector.querySelectorAll();
    assertEquals(3, elements.length);
    for (var i = 0; i < elements.length; i++) {
        assertTrue(selector.matches(elements[i]));
    }

    selector = new ExtendedSelector('div[-ext-contains="test"][-ext-has="div.test-class-two"][i18n]');
    elements = selector.querySelectorAll();
    assertEquals(1, elements.length);
    for (var i = 0; i < elements.length; i++) {
        assertTrue(selector.matches(elements[i]));
    }

    selector = new ExtendedSelector('div[-ext-has="div.test-class-two"]');
    elements = selector.querySelectorAll();
    assertEquals(3, elements.length);
    for (var i = 0; i < elements.length; i++) {
        assertTrue(selector.matches(elements[i]));
    }

    selector = new ExtendedSelector('div[-ext-has="div.test-class-two"] > .test-class[-ext-contains="test"]');
    elements = selector.querySelectorAll();
    assertEquals(1, elements.length);
    for (var i = 0; i < elements.length; i++) {
        assertTrue(selector.matches(elements[i]));
    }
}

addTestCase(testExtendedSelector);