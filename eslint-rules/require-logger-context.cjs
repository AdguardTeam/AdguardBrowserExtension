const path = require('path');

module.exports = {
    meta: {
        type: 'suggestion',
        docs: {
            description: 'Require logger calls to include a context tag',
        },
        fixable: 'code',
        schema: [],
    },
    create(context) {
        return {
            CallExpression(node) {
                if (node.callee.type !== 'MemberExpression' || node.callee.object.name !== 'logger') {
                    return;
                }

                const firstArg = node.arguments[0];

                if (
                    firstArg
                    && firstArg.type === 'Literal'
                    && typeof firstArg.value === 'string'
                    && !/^\[.*\]:/.test(firstArg.value)
                ) {
                    return;
                }

                const fix = (fixer) => {
                    const filename = path.basename(context.getFilename(), '.ts');
                    const tag = `[${filename}]: `;
                    if (firstArg && firstArg.type === 'Literal') {
                        return fixer.replaceText(
                            firstArg,
                            `'${tag}${firstArg.value}'`,
                        );
                    }
                    return fixer.insertTextAfter(
                        node.callee,
                        `('${tag}')`,
                    );
                };

                context.report({
                    node,
                    message: 'Logger calls must start with a context tag, e.g. [Engine.start]: ...',
                    fix,
                });
            },
        };
    },
};
