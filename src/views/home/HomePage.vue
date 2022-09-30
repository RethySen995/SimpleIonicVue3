<template src="./HomePage.html">
</template>
<script lang="ts">
import { LOCAL_STORAGE } from '@/shared/constants/localstorage-key.const';
import { DateTimeFormatService } from '@/shared/services/datetime-format.service';
import { EncryptionService } from '@/shared/services/encryption.service';
import { ModalService } from '@/shared/services/modal.service';
import { UserStorage } from '@/shared/utils/localstorage.util';
import { defineComponent } from 'vue';
import HOM10000Vue from './HOM10000.vue';

export default defineComponent({
  name: 'HomePage',
  data: () => {
    return {
      modalService: new ModalService(),
      dateTimeService: new DateTimeFormatService(),
      httpApiclient: new EncryptionService(),
      aesEncryptedKey: '',
      date: '20220922'
    }
  },
  // setup() {
  //   const datasharing = useStore();
  //   return { datasharing }
  // },
  methods: {
    alert() {
      this.modalService.modalAlert({
        header: 'Alert',
        message: 'Modal Alert !!'
      });
    },
    toast: function() {
        this.modalService.toastPresent({
          message:'Toast Showing in Duration 3000',
          duration: 3000
        });

        // this.$logger.info(this.datasharing);
        this.$store.set('DD', {name:'ddd'});
        const items = this.$store.get('DD');
        this.$logger.info(items);
    },
    confirm() {
       this.modalService.modalConfirm({
        title: 'Conform',
        content: 'Modal Confirm'
       });
    },
    openModal() {
      const obj = {text:"DDDDDD"};
      this.modalService.modalOpenComponent({
        component: HOM10000Vue,
        componentProps: {propsData: obj}
      }).then( (result) => {
        console.log(result);
      });
    },
    doLogin() {
      this.$backrouter.subscribe('/login');
    },
    gotoMap() {
      this.$router.push('/mappage').then( ()=> {
        // this.$router.go(0);
      });
    },
    doEncryptAndDecrypt() {
      const encryption = this.httpApiclient.encrypt('Hello',this.aesEncryptedKey);
      this.$logger.info('decrypt '+ JSON.parse(this.httpApiclient.decrypt(encryption, this.aesEncryptedKey)));
    },
    changeLangauge(lng: any) {
      UserStorage.setUserStorage(LOCAL_STORAGE.I18N, lng);
      this.$i18n.locale = lng;
    }
  },
  beforeCreate() {
    this.$logger.info('Home Page beforeCreate');
    this.aesEncryptedKey = this.$store.get('aesEncryptKey');
  }
});
</script>
<style scoped>
</style>
