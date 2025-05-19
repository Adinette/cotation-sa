<script setup lang="ts">
import { defineProps } from 'vue';

const props = defineProps({
    label: {
        type: String,
        required: true
    }
})

</script>

<template>
    <v-combobox :label=label multiple clearable chips hide-selected />
</template>
