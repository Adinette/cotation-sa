<script lang="ts" setup>
import { ref } from 'vue';

const isDialogTwoShow = ref(false)

const props = defineProps<{
    title: string
    modelValue: boolean
    index?: number
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
    (e: 'close', index?: number): void
}>()

function closeMainDialog() {
    emit('update:modelValue', false)
    emit('close', props.index)
}

function openNestedDialog() {
    isDialogTwoShow.value = true
    closeMainDialog()
}

</script>

<template>
    <VDialog v-model="props.modelValue" location="right" transition="slide-x-reverse-transition" max-width="450"
        class="right-panel-dialog" :scrim="false" persistent>
        <VCard :title="props.title" class="dialog-card h-100">
            <DialogCloseBtn variant="text" size="default" @click="closeMainDialog" />

            <VCardText>
                <slot :openNestedDialog="openNestedDialog" />
            </VCardText>

            <VCardText class="d-flex justify-end flex-wrap gap-4">
                <VBtn color="error" @click="closeMainDialog">Fermer</VBtn>
            </VCardText>
        </VCard>
    </VDialog>
</template>


<style scoped>
.v-dialog {
    justify-content: end;
}

.v-dialog.right-panel-dialog {
    align-items: stretch !important;
    top: 5rem !important;
}

.dialog-card {
    height: 100vh;
    display: flex;
    flex-direction: column;
}

.v-card-text {
    flex: 1;
    overflow-y: auto;
}
</style>
