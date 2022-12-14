/* eslint-disable vue/multi-word-component-names */
import { createApp } from 'vue';
import App from './App.vue';
import router from './router';

import i18n from '@/i18n';
import { IonicVue } from '@ionic/vue';

/* Core CSS required for Ionic components to work properly */
import '@ionic/vue/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/vue/css/normalize.css';
import '@ionic/vue/css/structure.css';
import '@ionic/vue/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/vue/css/display.css';
import '@ionic/vue/css/flex-utils.css';
import '@ionic/vue/css/float-elements.css';
import '@ionic/vue/css/padding.css';
import '@ionic/vue/css/text-alignment.css';
import '@ionic/vue/css/text-transformation.css';
import '@ionic/vue/css/ionic-swiper.css';

/* Theme variables */
import './theme/variables.scss';
import './theme/global.scss';

import 'swiper/css';
import 'swiper/css/autoplay';
import 'swiper/css/effect-cards';
import 'swiper/css/effect-coverflow';
import 'swiper/css/effect-creative';
import 'swiper/css/effect-cube';
import 'swiper/css/effect-fade';
import 'swiper/css/effect-flip';
import 'swiper/css/keyboard';
import 'swiper/css/pagination';
import 'swiper/css/scrollbar';
import 'swiper/css/zoom';

import * as IonComponents from '@ionic/vue';
import store, { key } from '@/shared/store';
import LoggerService from './shared/services/logger.service';
import DataStoreSharing from './shared/services/data-sharing.service';
import MapComponent from '@/shared/components/mapcomponent/map.component.vue';
import FilterService from './shared/services/filter.service';

const app = createApp(App)
.use(i18n)
.use(IonicVue)
.use(router)
.use(store,key);

(window as any).bizMOB.initConfig({
  App: {
      _sAppKey: process.env.VUE_APP_KEY, // App Key
      _bIsRelease: process.env.NODE_ENV === 'production', // Is Build Release
  },
  PushManager: {
      _sPushUrl: process.env.VUE_APP_PUSH_URL, // Push Server Url
  },
  Network: {
      _sBaseUrl: process.env.BASE_URL, // Local Base Url
      _sContext: process.env.VUE_APP_CONTEXT, // Local Context
  }
});

app.config.globalProperties.$bizMOB = (window as any).bizMOB; // this.$bizMOB
app.config.globalProperties.$logger = new LoggerService(); // this.@logger
app.config.globalProperties.$store  = new DataStoreSharing(); // this.$store
app.config.globalProperties.$filter = new FilterService(); // this.$filter

app.config.unwrapInjectedRef = true;
Object.keys(IonComponents).forEach((key: string) => {
  if (/^Ion[A-Z]\w+$/.test(key)) {
      app.component(key, (IonComponents as any)[key]);
  }
});
// Register Custom Component Service
app.component("MapComponent", MapComponent);
router.isReady().then(() => {
  app.mount('#app');
});
