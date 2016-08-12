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
    var elements = ExtendedSelector('div a[-ext-contains="test"]');
    console.warn(elements);

    //div[-adg-contains="advert"][-ext-has="h1.title"][attr="value"]
    //[-ext-has="div.advert"]
    //#banner [-ext-has=".advert"] > span[-ext-contains="test"]
}

addTestCase(testExtendedSelector);