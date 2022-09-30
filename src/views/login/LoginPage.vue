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
            this.$router.back();
        }
    },
    created: function() {
        
        // console.log("Created", this.propsData);
    }
});
</script>