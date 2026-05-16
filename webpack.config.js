const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = (env, argv) => {
  const isProd = argv && argv.mode === 'production';

  return {
    entry: './src/index.js',

    output: {
      path: path.resolve(__dirname, 'dist'),
      // Use content-hashed filenames in production so the browser/Electron
      // cache busts correctly when the bundle changes.
      filename: isProd ? '[name].[contenthash:8].js' : '[name].bundle.js',
      chunkFilename: isProd ? '[name].[contenthash:8].chunk.js' : '[name].chunk.js',
      clean: isProd, // wipe /dist before each prod build
    },

    // Electron loads from disk — the 244 KB web performance budget is irrelevant.
    // Set generous limits so webpack stops emitting meaningless warnings.
    performance: {
      maxAssetSize: 5 * 1024 * 1024,      // 5 MB
      maxEntrypointSize: 5 * 1024 * 1024, // 5 MB
      hints: isProd ? 'warning' : false,
    },

    optimization: {
      minimize: isProd,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            compress: {
              drop_console: false, // keep console.log for Electron debugging
              passes: 2,           // two compression passes for smaller output
            },
            output: {
              comments: false,
            },
          },
          extractComments: false,
        }),
      ],

      // Split vendor deps out of the main chunk so changes to app code don't
      // invalidate the (larger, slower-to-parse) vendor cache entry.
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          // react + react-dom + react-native-web in one vendors chunk
          vendors: {
            test: /[\\/]node_modules[\\/](react|react-dom|react-native-web|scheduler)[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 20,
          },
          // Everything else from node_modules in a separate common chunk
          common: {
            test: /[\\/]node_modules[\\/]/,
            name: 'common',
            chunks: 'all',
            priority: 10,
            minChunks: 1,
          },
        },
      },

      // Keep the webpack runtime in its own tiny chunk
      runtimeChunk: 'single',
    },

    module: {
      rules: [
        {
          test: /\.(js|jsx)$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              cacheDirectory: true, // speeds up rebuilds significantly
            },
          },
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader'],
        },
      ],
    },

    resolve: {
      alias: {
        'react-native$': 'react-native-web',
      },
      extensions: ['.web.js', '.js', '.jsx', '.json'],
    },

    plugins: [
      new HtmlWebpackPlugin({
        template: './public/index.html',
        // Inject all script tags in the right order
        inject: 'body',
        scriptLoading: 'defer',
      }),
    ],

    devServer: {
      port: 8081,
      hot: true,
      // Silence the noisy "webpack compiled" lines; only show errors
      client: {
        overlay: { errors: true, warnings: false },
      },
    },
  };
};
