/* global addTestCase */
/* global assertFalse */
/* global CssFilter */
/* global CssFilterRule */
/* global assertEquals */
/* global assertTrue */
/* global ExtendedSelector */
//
//function testExtendedPseudoClasses() {
//
//    var extendedPseudoClasses = ExtendedSelector('div').extendedPseudoClasses;
//    assertNotNull(extendedPseudoClasses);
//    assertEquals(0, extendedPseudoClasses.length);
//
//    extendedPseudoClasses = ExtendedSelector('div[-ext-wrong-class]').extendedPseudoClasses;
//    assertNotNull(extendedPseudoClasses);
//    assertEquals(0, extendedPseudoClasses.length);
//
//    extendedPseudoClasses = ExtendedSelector('div[-ext-has="> div"]').extendedPseudoClasses;
//    assertNotNull(extendedPseudoClasses);
//    assertEquals(1, extendedPseudoClasses.length);
//    assertEquals('-ext-has', extendedPseudoClasses[0].extClass);
//    assertEquals('> div', extendedPseudoClasses[0].value);
//
//    extendedPseudoClasses = ExtendedSelector('[-ext-has="> div"]').extendedPseudoClasses;
//    assertNotNull(extendedPseudoClasses);
//    assertEquals(1, extendedPseudoClasses.length);
//
//    extendedPseudoClasses = ExtendedSelector('div[-ext-has="> div"][-ext-contains="advert"]').extendedPseudoClasses;
//    assertNotNull(extendedPseudoClasses);
//    assertEquals(2, extendedPseudoClasses.length);
//}
//
//addTestCase(testExtendedPseudoClasses);

function testExtendedSelector() {
    var extendedSelector = ExtendedSelector('div[-ext-has="div"][-ext-contains=\'test\']');
    assertEquals('div', extendedSelector.commonSelector);

    var elements = extendedSelector.queryAll();
    //console.warn(elements);
}

addTestCase(testExtendedSelector);