module.exports = {
    verbose: true,
    setupFiles: ['./tests/__setups__/chrome.js'],
    'transformIgnorePatterns': [
        '<rootDir>/node_modules/(?!@adguard/tsurlfilter/dist/es)',
    ],
};
