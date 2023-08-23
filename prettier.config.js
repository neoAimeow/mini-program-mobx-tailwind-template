const tailwind = require('prettier-plugin-tailwindcss')

module.exports = {
    semi: true,
    trailingComma: 'all',
    singleQuote: true,
    printWidth: 120,
    tabWidth: 4,
    arrowParens: 'avoid',
    plugins: [tailwind],
    overrides: [
        {
            files: '*.wxml',
            options: {
                parser: 'html',
            },
        },
    ],
}
