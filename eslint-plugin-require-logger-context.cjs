const requireLoggerContext = require('./eslint-rules/require-logger-context.cjs');

module.exports = {
    meta: {
        name: 'eslint-plugin-require-logger-context',
        version: '1.2.3',
    },
    rules: { 'require-logger-context': requireLoggerContext },
};
