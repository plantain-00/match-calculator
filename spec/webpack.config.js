const webpack = require('webpack')

const plugins = [
  new webpack.DefinePlugin({
    'process.env': {
      'NODE_ENV': JSON.stringify('production')
    }
  }),
  new webpack.NoEmitOnErrorsPlugin()
]

const resolve = {
  alias: {
    'vue$': 'vue/dist/vue.js'
  }
}

module.exports = {
  plugins,
  resolve
}
