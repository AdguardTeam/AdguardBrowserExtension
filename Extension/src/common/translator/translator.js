import browser from 'webextension-polyfill';
import { formatter } from './formatter';

/**
 * Retrieves message from locales by key, using browser.i18n API
 * https://developer.chrome.com/extensions/i18n
 * and formats it
 * @param {string} key - message key
 * @param {Object} values - values for tag nodes and placeholders
 * @returns {string}
 */
const translate = (key, values) => {
    const message = browser.i18n.getMessage(key);
    const formatted = formatter(message, values);
    return formatted.join('');
};

/**
 * Creates translation function for strings used in the React components
 * We do not import React directly, because translator module can be used
 * in the modules without React too
 *
 * e.g.
 * const translateReact = createReactTranslator(React);
 * in locales folder you should have messages.json file
 * ```
 * message:
 *     "popup_auth_agreement_consent": {
 *          "message": "You agree to our <eula>EULA</eula> and <privacy>Privacy Policy</privacy>",
 *          "description": "NOTICE! respect spaces between tags"
 *      },
 * ```
 *
 * this message can be retrieved and translated into react components next way:
 *
 * const component = translateReact('popup_auth_agreement_consent', {
 *          eula: (chunks) => (
 *              <button
 *                  className="auth__privacy-link"
 *                  onClick={handleEulaClick}
 *              >
 *                  {chunks}
 *              </button>
 *          ),
 *          privacy: (chunks) => (
 *              <button
 *                  className="auth__privacy-link"
 *                  onClick={handlePrivacyClick}
 *              >
 *                  {chunks}
 *              </button>
 *          ),
 *
 * Note how functions in the values argument can be used with handlers
 *
 * @param React
 * @returns {function} translateReact with bound React
 */
const createReactTranslator = (React) => {
    /**
     * Helps to build nodes without values
     *
     * @param tagName
     * @param children
     * @returns {*}
     */
    const createReactElement = (tagName, children) => {
        if (children) {
            return React.createElement(tagName, null, React.Children.toArray(children));
        }
        return React.createElement(tagName, null);
    };

    /**
     * Function creates default values to be used if user didn't provide function values for tags
     */
    const createDefaultValues = () => ({
        p: (children) => createReactElement('p', children),
        b: (children) => createReactElement('b', children),
        strong: (children) => createReactElement('strong', children),
        tt: (children) => createReactElement('tt', children),
        s: (children) => createReactElement('s', children),
        i: (children) => createReactElement('i', children),
    });

    /**
     * Searches for locale message by key, formats it
     * and returns array of react components or string
     *
     * @param {string} key - message key
     * @param {*} [values] - object of values used to replace defined nodes in parsed message
     * @returns {ReactNode[]|string}
     */
    const translateReact = (key, values) => {
        const message = browser.i18n.getMessage(key);
        if (!message) {
            return key;
        }
        const tmplValues = { ...createDefaultValues(), ...values };
        const formatted = formatter(message, tmplValues);
        const reactChildren = React.Children.toArray(formatted);
        // if there is only strings in the array we join them
        if (reactChildren.every((child) => typeof child === 'string')) {
            return reactChildren.join('');
        }
        return reactChildren;
    };

    return translateReact;
};

const translator = {
    translate,
    createReactTranslator,
};

export default translator;
