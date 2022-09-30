// eslint-disable-next-line no-global-assign
require = require('esm')(module);

const PreloadWebpackPlugin = require('@vue/preload-webpack-plugin');

//빌드시 제외할 폴더 목록
const IGNORE_DIRS = ['mock/**'];

/** Vue Build 옵션 */
module.exports = {
  // Bundle 파일 경로 설정
  outputDir: process.env.NODE_ENV === 'production' ? 'dist/prod/contents/' : 'dist/dev/contents/',

  // 파일명 해싱 설정
  filenameHashing:false,

  //   process.env.TARGET === 'web',

  // .map 파일 생성 여부 설정
  // productionSourceMap: process.env.NODE_ENV === 'development',

  // 웹용 배포시 rootPath 설정시 public 경로 지정
  publicPath: process.env.BASE_URL,

  // CSS 관련 옵션 설정
  css: {
    sourceMap: process.env.NODE_ENV === 'development', // 개발모드인 경우 CSS 소스맵 On
    loaderOptions: {
      sass: {
        implementation: require('sass'), // This line must in sass option
      },
    },
  },

  // 개발용 Proxy 서버 설정
  devServer: {
    // 경고 overlay false
    client: {
      overlay: {
        warnings: false,
        errors: true
      },
    },
    // HTTPS 셋팅
    https: false,
    // sock-js 오류로 인한 설정
    host: '0.0.0.0',
    // POST 통신을 위한 프록시 서버 설정
    proxy: (() => {
      return {
        [`${process.env.VUE_APP_CONTEXT || '/'}`]: {
          target: process.env.VUE_APP_SERVER_URL,
          changeOrigin: true,
        }
      }
    })()
  },

  // 웹팩 체이닝 설정
  chainWebpack: (config) => {
    // 웹팩 추가 옵션 설정
    config.plugins.store.delete('prefetch');

    // 빌드시 제외 폴더 설정
    if (process.env.MODE === 'build') {
      config.plugin('copy').tap(([ options ]) => {
        // 빌드시 제외한 public 폴더
        IGNORE_DIRS.forEach( (element) => {
          options[0].ignore.push(element);
        });
        return [ options ];
      });
    }


  },

  // 웹팩 설정
  configureWebpack: {

    // 웹팩 플러그인 설정
    plugins: [
      new PreloadWebpackPlugin(
        {
          rel: 'preload',
          include: 'asyncChunks',
          as(entry) {
            if (/\.css$/.test(entry)) return 'style';
            if (/\.woff$/.test(entry)) return 'font';
            if (/\.png$/.test(entry)) return 'image';
            return 'script';
          },
          fileBlacklist: [/\.map/]
        }
      )
    ]
  },

  pluginOptions: {
    i18n: {
      locale: 'ko',
      fallbackLocale: 'ko',
      localeDir: 'locales',
      enableLegacy: false,
      runtimeOnly: false,
      compositionOnly: false,
      fullInstall: true
    }
  }
}
