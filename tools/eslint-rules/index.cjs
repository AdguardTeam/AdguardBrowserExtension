/**
 * @file
 * Plugin for eslint that requires logger calls to start with a context tag,
 * e.g. "[ext.page-handler]:" or "[ext.EngineApi.someMethod]:"
 */
const requireLoggerContext = require('./require-logger-context.cjs');

module.exports = {
    meta: {
        name: 'eslint-plugin-require-logger-context',
        version: '1.0.0',
    },
    rules: { 'require-logger-context': requireLoggerContext },
};
