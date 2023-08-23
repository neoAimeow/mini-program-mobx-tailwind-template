const { resolve } = require('path');
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const MinaWebpackPlugin = require('./plugin/MinaWebpackPlugin');
const MinaRuntimePlugin = require('./plugin/MinaRuntimePlugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin'); // 抽离css文件, 这个插件将CSS取到单独的文件中。它为每个包含CSS的JS文件创建一个CSS文件。它支持按需加载 CSS 和 SourceMaps。
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin'); // 启动本地服务/打包错误提示
// const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const fs = require('fs');

const { UnifiedWebpackPluginV5 } = require('weapp-tailwindcss-webpack-plugin/webpack');

const debuggable = process.env.BUILD_TYPE !== 'release';

module.exports = {
    context: resolve('src'),
    entry: { main: './app.ts' },
    output: {
        path: resolve('dist'),
        filename: '[name].js',
        publicPath: resolve('dist'),
        globalObject: 'wx',
    },
    resolve: {
        extensions: ['.ts', '.js'],
        alias: {
            '@': resolve(__dirname, './src/*'),
        },
    },
    module: {
        rules: [
            {
                test: /\.(ts|js)x?$/,
                exclude: /node_modules/,
                use: 'babel-loader',
            },
            {
                test: /\.(scss)$/,
                include: /src/,
                use: [
                    {
                        loader: 'file-loader',
                        options: {
                            useRelativePath: true,
                            name: '[path][name].wxss',
                            context: resolve('src'),
                        },
                    },
                    {
                        loader: 'postcss-loader',
                    },
                    {
                        loader: 'sass-loader',
                        options: {
                            sassOptions: { includePaths: [resolve('src', 'styles'), resolve('src')] },
                        },
                    },
                ],
            },
        ],
    },
    plugins: [
        new CleanWebpackPlugin({
            cleanStaleWebpackAssets: false,
        }),
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: '**/*',
                    to: './',
                    filter: resourcePath => !['.ts', '.js', '.scss'].some(item => resourcePath.endsWith(item)),
                },
            ],
        }),
        new MinaWebpackPlugin({
            scriptExtensions: ['.ts', '.js'],
            assetExtensions: ['.scss'],
        }),
        new MinaRuntimePlugin(),
        new webpack.EnvironmentPlugin({
            NODE_ENV: 'development',
            BUILD_TYPE: 'debug',
        }),
        new UnifiedWebpackPluginV5({
            appType: 'native',
        }),
        new ForkTsCheckerWebpackPlugin({
            typescript: {
                configFile: resolve('tsconfig.json'),
            },
        }),
        new MiniCssExtractPlugin(),
        // new BundleAnalyzerPlugin(),
    ],
    optimization: {
        splitChunks: {
            chunks: 'all',
            name: 'common',
            minChunks: 2,
            minSize: 0,
        },
        runtimeChunk: {
            name: 'runtime',
        },
    },
    mode: debuggable ? 'none' : 'production',
    // devtool: debuggable ? 'inline-source-map' : 'source-map',
    devtool: false,
};
