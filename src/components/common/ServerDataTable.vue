<template>
  <v-data-table-server
    :items-per-page-options="[5, 10, 25, 50]"
    :headers="headers"
    :items="items"
    :items-length="itemsLength"
    :loading="loading"
    :search="search"
    @update:items-per-page="
      (newItemsPerPage) => emits('update:itemsPerPage', newItemsPerPage)
    "
    @update:options="(newOptions) => emits('update:options', newOptions)"
  >
    <template v-for="(_, name) in slots" #[name]="slotData" :key="name">
      <slot :name="name" v-bind="slotData" />
    </template>
  </v-data-table-server>
</template>

<script lang="ts" setup>
import { useSlots } from "vue";
import type { VDataTableServer } from "vuetify/components";

defineProps<{
  headers: VDataTableServer["headers"];
  items: any[];
  itemsLength: VDataTableServer["itemsLength"];
  itemsPerPage: VDataTableServer["itemsPerPage"];
  loading: VDataTableServer["loading"];
  search: VDataTableServer["search"];
}>();

const emits = defineEmits(["update:options", "update:itemsPerPage"]);

const slots = useSlots();
</script>

<style scoped>
::v-deep(.v-data-table__th.v-data-table-column--align-end) {
  text-align: left !important;
}
::v-deep(.v-data-table-header__content) {
  flex-direction: row !important;
}

::v-deep(.v-data-table__th) {
  background: rgba(var(--v-border-color), var(--v-border-opacity));
}
::v-deep(.v-data-table__td),
::v-deep(.v-data-table__th) {
  padding-top: 4px;
  padding-bottom: 4px;
  height: 32px !important;
  font-size: 13px;
  white-space: nowrap;

  border-right: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
}
::v-deep(.v-data-table__td:last-child),
::v-deep(.v-data-table__th:last-child) {
  border-right: none;
}
::v-deep(.v-data-table__td:has(> .v-data-table)) {
  padding: 0;
}

::v-deep(.v-list) {
  padding: 0;
}
::v-deep(.v-list-item--one-line) {
  padding-inline: initial !important;
}
::v-deep(.v-list-item__content) {
  overflow: visible;
}
::v-deep(.v-list-item-title, v-list-item-subtitle) {
  font-size: 13px;
}
</style>
