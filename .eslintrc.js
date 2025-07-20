module.exports = {
    env: {
        browser: true,
        es6: true,
        webextensions: true, // This allows chrome global
    },
    extends: [
        'react-app',
        'react-app/jest'
    ],
    globals: {
        chrome: 'readonly'
    },
    rules: {
        // Optional: suppress some warnings for development
        'no-console': 'warn'
    }
};
