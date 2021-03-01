import * as webpack from 'webpack'

export default [
  {
    mode: process.env.NODE_ENV,
    entry: {
      index: './index'
    },
    output: {
      path: __dirname,
      filename: '[name].bundle.js'
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js']
    },
    module: {
      rules: [
        { test: /\.tsx?$/, loader: 'ts-loader' }
      ]
    },
    optimization: {
      splitChunks: {
        cacheGroups: {
          commons: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendor',
            chunks: 'all'
          }
        }
      }
    },
    plugins: [
      new webpack.DefinePlugin({
        __VUE_PROD_DEVTOOLS__: false,
      }),
    ],
    externals: {
      'monaco-editor': 'monaco'
    }
  },
  {
    entry: {
      worker: './worker'
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js']
    },
    module: {
      rules: [
        { test: /\.tsx?$/, loader: 'ts-loader' }
      ]
    },
    output: {
      path: __dirname,
      filename: '[name].bundle.js'
    }
  }
] as webpack.Configuration
