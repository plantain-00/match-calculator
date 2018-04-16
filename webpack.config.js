module.exports = [
  {
    mode: process.env.NODE_ENV,
    entry: {
      index: './index'
    },
    output: {
      path: __dirname,
      filename: '[name].bundle.js'
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
    externals: {
      'monaco-editor': 'monaco'
    }
  },
  {
    entry: {
      worker: './worker'
    },
    output: {
      path: __dirname,
      filename: '[name].bundle.js'
    }
  }
]
