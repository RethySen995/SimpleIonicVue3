<template src="./LoginPage.html">
</template>
<script lang="ts">
import { defineComponent } from 'vue';
export default defineComponent({
    name: 'LoginPage',
    props: {
		propsData: {}
    },
    data: () => {
        return {
            // modalService: new ModalService()
        }
    },
    methods: {
        onDismiss() {
            this.$router.push('/').then( () => {
                this.$router.go(0);
            });
        }
    },
    created: function() {
        
        // console.log("Created", this.propsData);
    }
});
</script>