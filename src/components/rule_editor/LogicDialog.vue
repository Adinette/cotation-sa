<script lang="ts" setup>

const props = defineProps<{
    title: string
    modelValue: boolean
    index?: number
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
    (e: 'close', index?: number): void
}>()

function closeDialog() {
    emit('update:modelValue', false)
    emit('close', props.index)
}

</script>

<template>
    <v-dialog v-model="props.modelValue" location="right" transition="slide-x-reverse-transition" max-width="450"
        class="right-panel-dialog" :scrim="false" persistent>
        <v-card :title="props.title" class="dialog-card h-100">
            <DialogCloseBtn variant="text" size="default" @click="closeDialog" />
            <v-card-text>
                <slot />
            </v-card-text>

            <v-card-actions>
                <v-spacer />
                <v-btn text="Fermer" @click="closeDialog" />
            </v-card-actions>
        </v-card>
    </v-dialog>
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
