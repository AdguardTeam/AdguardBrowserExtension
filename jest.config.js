module.exports = {
    verbose: true,
    testEnvironment: 'jsdom',
    setupFiles: ['./tests/__setups__/chrome.js'],
    'transformIgnorePatterns': [
        '<rootDir>/node_modules/(?!@adguard/tsurlfilter/dist/es)',
    ],
};
