const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = function (env, argv) {
  const DEV_MODE = argv.mode !== 'production';
  const DIST_DIR = path.resolve(__dirname, 'dist');
  if (fs.existsSync(DIST_DIR)) {
    fs.rmdirSync(DIST_DIR, { recursive: true });
  }
  return [{
    name: 'lib',
    mode: DEV_MODE ? 'development' : 'production',
    devtool: DEV_MODE ? 'source-map' : false,
    watchOptions: {
      ignored: /node_modules/
    },
    context: path.resolve(__dirname, 'src'),
    entry: {
      libux: 'index.js'
    },
    output: {
      filename: '[name].js',
      chunkFilename: '[name].js',
      path: DIST_DIR,
      library: 'libux',
      libraryTarget: 'umd',
      globalObject: 'typeof self !== "undefined" ? self : this'
    },
    module: {
      rules: [{
        test: /\.js(\?|$)/,
        exclude: [/node_modules/],
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }]
    },
    resolve: {
      extensions: ['.js'],
      modules: [path.resolve(__dirname, 'src'), 'node_modules']
    },
    optimization: {
      minimize: !DEV_MODE,
      minimizer: [new TerserPlugin({})],
      splitChunks: {
        cacheGroups: {
          chunks: 'all'
        }
      }
    }
  }, {
    name: 'doc',
    mode: DEV_MODE ? 'development' : 'production',
    devtool: DEV_MODE ? 'source-map' : false,
    watchOptions: {
      ignored: /node_modules/
    },
    context: path.resolve(__dirname, 'src/example'),
    entry: {
      app: 'app.js'
    },
    output: {
      filename: '[name].js',
      chunkFilename: '[name].js',
      path: DIST_DIR
    },
    module: {
      rules: [{
        test: /\.js($|\?)/,
        exclude: [/node_modules/],
        use: [{
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }]
      }, {
        test: /\.css(\?|$)/,
        use: [{
          loader: 'style-loader'
        }, {
          loader: 'css-loader',
          options: {
            import: true,
            modules: true
          }
        }]
      }, {
        test: /\.(png|jpe?g|gif|svg)(\?|$)/,
        type: 'asset/inline'
      }]
    },
    resolve: {
      extensions: ['.js'],
      modules: [path.resolve(__dirname, 'src/example'), 'node_modules'],
      alias: {
        libux: path.resolve(__dirname, 'src/index')
      }
    },
    optimization: {
      minimize: !DEV_MODE,
      minimizer: [
        new CssMinimizerPlugin(),
        new TerserPlugin()
      ],
      splitChunks: {
        cacheGroups: {
          chunks: 'all'
        }
      }
    },
    plugins: [
      new HtmlWebpackPlugin({
        filename: 'todo-app.html',
        title: 'TodoMVC',
        inject: 'head'
      }),
      new (class JSDocPlugin {
        apply (compiler) {
          compiler.hooks.afterEmit.tapAsync(
            'JSDocPlugin',
            (compilation, callback) => {
              exec(
                `jsdoc -d ${DIST_DIR} -u src/tutorials -R README.md -r src`,
                callback
              );
            }
          );
        }
      })()
    ],
    devServer: {
      port: process.env.PORT || 8080,
      static: {
        directory: DIST_DIR,
        publicPath: '/'
      }
    }
  }];
};
