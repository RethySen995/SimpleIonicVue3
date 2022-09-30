<template src="./HOM10000.html">
</template>
<script lang="ts">
import { BUTTON_ROLE } from '@/shared/constants/common.const';
import { ModalService } from '@/shared/services/modal.service';
import { defineComponent } from 'vue';

export default defineComponent({
    name: 'HOM10000',
    props: {
		propsData: {}
    },
    data: () => {
        return {
            modalService: new ModalService()
        }
    },
    methods: {
        onDismiss() {
            const data = this.propsData;
            this.modalService.dismissComponent({role: BUTTON_ROLE.CLOSE, data});
        }
    },
    created: function() {
        console.log("Created", this.propsData);
    }
});
</script>