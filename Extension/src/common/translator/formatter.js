import { parser } from './parser';
import {
    isTextNode,
    isTagNode,
    isPlaceholderNode,
    isVoidTagNode,
} from './nodes';

/**
 * Checks if target is function
 * @param target
 * @returns {boolean}
 */
const isFunction = (target) => {
    return typeof target === 'function';
};

/**
 * Helper functions used by default to assemble strings from tag nodes
 * @param tagName
 * @param children
 * @returns {string}
 */
const createStringElement = (tagName, children) => {
    if (children) {
        return `<${tagName}>${children}</${tagName}>`;
    }
    return `<${tagName}/>`;
};

/**
 * Creates map with default values for tag converters
 */
const createDefaultValues = () => ({
    p: (children) => createStringElement('p', children),
    b: (children) => createStringElement('b', children),
    strong: (children) => createStringElement('strong', children),
    tt: (children) => createStringElement('tt', children),
    s: (children) => createStringElement('s', children),
    i: (children) => createStringElement('i', children),
});

/**
 * This function accepts an AST (abstract syntax tree) which is a result
 * of the parser function call, and converts tree nodes into array of strings replacing node
 * values with provided values.
 * Values is a map with functions or strings, where each key is related to placeholder value
 * or tag value
 * e.g.
 * string "text <tag>tag text</tag> %placeholder%" is parsed into next AST
 *
 *      [
 *          { type: 'text', value: 'text ' },
 *          {
 *              type: 'tag',
 *              value: 'tag',
 *              children: [{ type: 'text', value: 'tag text' }],
 *          },
 *          { type: 'text', value: ' ' },
 *          { type: 'placeholder', value: 'placeholder' }
 *      ];
 *
 * this AST after format and next values
 *
 *      {
 *          // here used template strings, but it can be react components as well
 *          tag: (chunks) => `<b>${chunks}</b>`,
 *          placeholder: 'placeholder text'
 *      }
 *
 * will return next array
 *
 * [ 'text ', '<b>tag text</b>', ' ', 'placeholder text' ]
 *
 * as you can see, <tag> was replaced by <b>, and placeholder was replaced by placeholder text
 *
 * @param ast - AST (abstract syntax tree)
 * @param values
 * @returns {[]}
 */
const format = (ast = [], values = {}) => {
    const result = [];

    const tmplValues = { ...createDefaultValues(), ...values };

    let i = 0;
    while (i < ast.length) {
        const currentNode = ast[i];
        // if current node is text node, there is nothing to change, append value to the result
        if (isTextNode(currentNode)) {
            result.push(currentNode.value);
        } else if (isTagNode(currentNode)) {
            const children = [...format(currentNode.children, tmplValues)];
            const value = tmplValues[currentNode.value];
            if (value) {
                if (isFunction(value)) {
                    // For react translator we shouldn't join, react handles children itself
                    if (children.every((child) => typeof child !== 'object')) {
                        result.push(value(children.join('')));
                    } else {
                        result.push(value(children));
                    }
                } else {
                    result.push(value);
                }
            } else {
                throw new Error(`Value ${currentNode.value} wasn't provided`);
            }
        } else if (isVoidTagNode(currentNode)) {
            const value = tmplValues[currentNode.value];
            if (value) {
                result.push(value);
            } else {
                throw new Error(`Value ${currentNode.value} wasn't provided`);
            }
        } else if (isPlaceholderNode(currentNode)) {
            const value = tmplValues[currentNode.value];
            if (value) {
                result.push(value);
            } else {
                throw new Error(`Value ${currentNode.value} wasn't provided`);
            }
        }
        i += 1;
    }

    return result;
};

/**
 * Function gets AST (abstract syntax tree) or string and formats messages,
 * replacing values accordingly
 * e.g.
 *      const message = formatter('<a>some text</a>', {
 *          a: (chunks) => `<a href="#">${chunks}</a>`,
 *      });
 *      console.log(message); // ['<a href="#">some text</a>']
 * @param message
 * @param values
 * @returns {*[]}
 */
export const formatter = (message, values) => {
    let ast = message;

    if (typeof ast === 'string') {
        ast = parser(ast);
    }

    return format(ast, values);
};
