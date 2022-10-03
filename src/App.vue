<template>
  <ion-app>
    <ion-router-outlet />
  </ion-app>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { LOCAL_STORAGE } from './shared/constants/localstorage-key.const';
import { EncryptionService } from './shared/services/encryption.service';
import { useStore } from './shared/store';
import { UserStorage } from './shared/utils/localstorage.util';
export default defineComponent({
  name: 'App',
  data() {
    return {
      encryptionService: new EncryptionService(),
      userstorage: new UserStorage()
    }
  },
  setup(){
    const usestore = useStore();
    return {
      usestore
    }
  },
  beforeMount() {
    this.$logger.info('beforeMount App Vue');
    this.$store.setUseStore(this.usestore);
    this.$i18n.locale = this.userstorage.getUserStorage(LOCAL_STORAGE.I18N);
    this.encryptionService.registerRSA().then( (publicKey: any) => {
      this.encryptionService.registerAES(publicKey).then((privateKey: any) => {
        this.$store.set('aesEncryptKey', privateKey);
      });
    });
  }
});
</script>