<template src="./map-page.html"></template>
<script lang="ts">
    import { defineComponent } from "vue";
    export default defineComponent({
        name: "map-page",
        methods: {
            onDismiss() {
                this.$router.back();
            }
        }
    });
</script>