/* eslint-disable @typescript-eslint/explicit-function-return-type */
/**
 * @file
 * ESLint rule for requiring logger calls to include a context tag
 * e.g. "[ext.page-handler]:" or "[ext.EngineApi.someMethod]:".
 */

const { LogLevel } = require('@adguard/logger');

const LOG_LEVEL_METHODS = Object.values(LogLevel);

const MODULE_NAME = 'ext';

/**
 * Helper to extract the file name from the context.
 *
 * @param context The ESLint context.
 *
 * @returns The file name.
 */
function getFileName(context) {
    return (context.getFilename().match(/([^/\\]+)\.(ts|js|tsx|jsx)$/) || [])[1] || 'unknown';
}

/**
 * Rule definition for require-logger-context.
 */
const rule = {
    meta: {
        type: 'suggestion',
        docs: {
            description: 'Require logger calls to include a context tag',
        },
        fixable: 'code',
        schema: [],
    },
    create(context) {
        const logLevelMethods = LOG_LEVEL_METHODS;

        /**
         * Traverses up the AST to find enclosing class, method, and function names.
         * Used to generate the context tag.
         *
         * @param node The AST node.
         *
         * @returns An object containing the class name, method name, and function name.
         */
        function getEnclosingNames(node) {
            let className = null;
            let methodName = null;
            let functionName = null;

            let { parent } = node;
            // Traverse up the AST to find enclosing class, method, and function names
            while (parent) {
                // Find enclosing class name, if any
                if (!className && parent.type === 'ClassDeclaration' && parent.id) {
                    className = parent.id.name;
                }
                // Find enclosing method name, if any
                if (!methodName && parent.type === 'MethodDefinition' && parent.key) {
                    methodName = parent.key.name;
                }
                // Find enclosing function name, if any
                if (
                    !functionName
                    && (parent.type === 'FunctionDeclaration' || parent.type === 'FunctionExpression')
                    && parent.id
                ) {
                    functionName = parent.id.name;
                }
                parent = parent.parent;
            }

            return { className, methodName, functionName };
        }

        return {
            /**
             * Checks logger calls for the required context tag and reports/fixes violations.
             *
             * @param node The AST node.
             */
            CallExpression(node) {
                // Only match logger.<level>() calls
                if (node.callee.type !== 'MemberExpression' || node.callee.object.name !== 'logger') {
                    return;
                }
                const calledMethodName = node.callee.property.name;
                if (!logLevelMethods.includes(calledMethodName)) {
                    return;
                }

                // Use class and method name if available, otherwise fallback to file name
                const {
                    className,
                    methodName,
                } = getEnclosingNames(node);
                let tag = '';
                // If no class, always use the file name (not function/component)
                if (!className) {
                    const filename = getFileName(context);
                    if (methodName) {
                        tag = `[${MODULE_NAME}.${filename}.${methodName}]:`;
                    } else {
                        tag = `[${MODULE_NAME}.${filename}]:`;
                    }
                } else if (className && methodName) {
                    tag = `[${MODULE_NAME}.${className}.${methodName}]:`;
                } else if (className) {
                    tag = `[${MODULE_NAME}.${className}]:`;
                }
                let isValid = false;

                // Check if the first argument already starts with the correct tag
                const firstArg = node.arguments[0];
                if (firstArg) {
                    if (firstArg.type === 'Literal' && typeof firstArg.value === 'string') {
                        isValid = firstArg.value.startsWith(tag);
                    } else if (firstArg.type === 'TemplateLiteral' && firstArg.quasis.length > 0) {
                        isValid = firstArg.quasis[0].value.raw.startsWith(tag);
                    } else if (firstArg.type === 'BinaryExpression' && firstArg.operator === '+') {
                        if (firstArg.left.type === 'Literal' && typeof firstArg.left.value === 'string') {
                            isValid = firstArg.left.value.startsWith(tag);
                        } else if (firstArg.left.type === 'TemplateLiteral' && firstArg.left.quasis.length > 0) {
                            isValid = firstArg.left.quasis[0].value.raw.startsWith(tag);
                        }
                    }
                }

                // If the first argument already starts with the correct tag, do nothing
                if (isValid) {
                    return;
                }

                /**
                 * Auto-fixer for logger context tag violations.
                 * Updates the first argument to start with the correct tag.
                 *
                 * @param fixer The ESLint fixer.
                 *
                 * @returns The fix.
                 */
                const fix = (fixer) => {
                    const sourceCode = context.getSourceCode();

                    // String literal: always normalize to [tag]:
                    if (firstArg && firstArg.type === 'Literal' && typeof firstArg.value === 'string') {
                        // Remove any existing [tag] or [tag]:
                        const cleaned = firstArg.value.replace(/^\[[^\]]+\](?::)?\s*/, '');
                        return fixer.replaceText(
                            firstArg,
                            `'${tag} ${cleaned}'`,
                        );
                    }

                    // Template literal: always normalize to [tag]:
                    if (firstArg && firstArg.type === 'TemplateLiteral' && firstArg.quasis.length > 0) {
                        const quasiRaw = firstArg.quasis[0].value.raw;
                        const rest = quasiRaw.replace(/^\[[^\]]+\](?::)?\s*/, '');
                        const newQuasi = `${tag} ${rest}`;
                        let rebuilt = `\`${newQuasi}`;
                        for (let i = 0; i < firstArg.expressions.length; i += 1) {
                            const expr = firstArg.expressions[i];
                            const exprSource = sourceCode.getText(expr);
                            const quasi = firstArg.quasis[i + 1] ? firstArg.quasis[i + 1].value.raw : '';
                            rebuilt += `\${${exprSource}}${quasi}`;
                        }
                        rebuilt += '`';
                        return fixer.replaceText(firstArg, rebuilt);
                    }

                    // No argument: insert a new string literal with the tag
                    if (!firstArg) {
                        return fixer.insertTextAfter(
                            node.callee,
                            `('${tag} ')`,
                        );
                    }
                    return null;
                };

                // Report the violation
                context.report({
                    node,
                    message: `Logger calls must start with a context tag, e.g. ${tag} ...`,
                    fix,
                });
            },
        };
    },
};

module.exports = rule;
