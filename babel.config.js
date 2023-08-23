module.exports = {
    presets: ['@babel/env', '@babel/typescript', 'mobx'],
    plugins: [
        ['@babel/plugin-proposal-decorators', { legacy: true }],
        '@babel/proposal-class-properties',
        'transform-object-rest-spread',
    ],
};
