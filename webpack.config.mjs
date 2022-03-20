import HtmlWebpackPlugin from 'html-webpack-plugin'
import path from 'path'
const __dirname = path.resolve()

const extensionConfig = {
    mode: 'production',
    target: 'node',
    entry: './src/extension/index.js',
    devtool: 'inline-source-map',
    output: {
        filename: 'index.js',
        path: path.join(__dirname, 'extension'),
        libraryTarget: 'commonjs2',
    }
}

const dashboardConfig = {
    mode: 'development',
    entry: {
        livesplit: './src/dashboard/livesplit.js'
    },
    devtool: 'inline-source-map',
    output: {
        filename: '[name].js',
        path: path.join(__dirname, 'dashboard')
    },
    module: {
        rules: [
            {
                test: /\.css$/,
                use: [
                    'style-loader',
                    {
                        loader: 'css-loader',
                        options: {
                            url: false
                        }
                    }
                ]
            }
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            filename: 'livesplit.html',
            template: './src/dashboard/livesplit.html',
            chunks: ['livesplit']
        })
    ]
}

const graphicsConfig = {
    mode: 'development',
    devtool: 'inline-source-map',
    entry: {
        widget: './src/graphics/widget.js'
    },
    devtool: 'inline-source-map',
    output: {
        filename: '[name].js',
        path: path.join(__dirname, 'graphics')
    },
    module: {
        rules: [
            {
                test: /\.css$/,
                use: [
                    'style-loader',
                    {
                        loader: 'css-loader',
                        options: {
                            url: false
                        }
                    }
                ]
            }
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            filename: 'widget.html',
            template: './src/graphics/widget.html',
            chunks: ['widget']
        })
    ]
}


export default [extensionConfig, dashboardConfig, graphicsConfig]