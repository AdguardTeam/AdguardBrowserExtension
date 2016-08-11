/* global addTestCase */
/* global assertFalse */
/* global CssFilter */
/* global CssFilterRule */
/* global assertEquals */
/* global assertTrue */
/* global ExtendedSelector */

function testExtendedSelector() {

    var extendedPseudoClasses = ExtendedSelector.extractExtendedPseudoClasses('div');
    assertNotNull(extendedPseudoClasses);
    assertEquals(0, extendedPseudoClasses.length);

    extendedPseudoClasses = ExtendedSelector.extractExtendedPseudoClasses('div[-ext-wrong-class]');
    assertNotNull(extendedPseudoClasses);
    assertEquals(0, extendedPseudoClasses.length);

    extendedPseudoClasses = ExtendedSelector.extractExtendedPseudoClasses('div[-ext-has="> div"]');
    assertNotNull(extendedPseudoClasses);
    assertEquals(1, extendedPseudoClasses.length);
    assertEquals('-ext-has', extendedPseudoClasses[0].extClass);
    assertEquals('> div', extendedPseudoClasses[0].value);

    extendedPseudoClasses = ExtendedSelector.extractExtendedPseudoClasses('[-ext-has="> div"]');
    assertNotNull(extendedPseudoClasses);
    assertEquals(1, extendedPseudoClasses.length);

    extendedPseudoClasses = ExtendedSelector.extractExtendedPseudoClasses('div[-ext-has="> div"][-ext-contains="advert"]');
    assertNotNull(extendedPseudoClasses);
    assertEquals(2, extendedPseudoClasses.length);
}

addTestCase(testExtendedSelector);