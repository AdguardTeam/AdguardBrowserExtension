/**
 * This function allows cache property in object. Use with javascript getter.
 *
 * var Object = {
 *
 *      get someProperty(){
 *          return lazyGet(Object, 'someProperty', function() {
 *              return calculateSomeProperty();
 *          });
 *      }
 * }
 *
 * @param object Object
 * @param prop Original property name
 * @param calculateFunc Calculation function
 * @returns {*}
 */
export const lazyGet = function (object, prop, calculateFunc) {
    const cachedProp = `_${prop}`;
    if (cachedProp in object) {
        return object[cachedProp];
    }
    const value = calculateFunc.apply(object);
    object[cachedProp] = value;
    return value;
};

/**
 * Clear cached property
 * @param object Object
 * @param prop Original property name
 */
export const lazyGetClear = function (object, prop) {
    delete object[`_${prop}`];
};
