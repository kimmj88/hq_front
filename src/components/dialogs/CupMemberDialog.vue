<template>
  <v-dialog v-model="dialog" max-width="600">
    <template #activator="{ props: activatorProps }">
      <v-btn :color="props.activatorColor" v-bind="activatorProps">
        {{ props.activatorLabel }}
      </v-btn>
    </template>

    <v-card>
      <v-card-title class="text-h6">Add Player</v-card-title>

      <v-card-text>
        <v-autocomplete
          v-model="selectedUsers"
          :items="allUsers"
          item-title="display"
          item-value="id"
          multiple
          chips
          closable-chips
          clearable
          solo
          label="이름 또는 이메일"
          placeholder="이름 또는 이메일 입력"
          :search-input="searchText"
        />

        <div class="text-caption mt-2">
          선택된 사용자: <strong>{{ selectedUsers.length }}</strong
          >명
        </div>
      </v-card-text>

      <v-card-actions class="justify-end">
        <v-btn variant="text" @click="dialog = false">취소</v-btn>
        <v-btn color="primary" @click="handleAdd">추가</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import axios from 'axios';
import { getBaseUrl } from '@/@core/composable/createUrl';
import { useRoute } from 'vue-router';
import api from '@/@core/composable/useAxios';
import type { Player } from '@/data/types/player';
const route = useRoute();

const props = withDefaults(
  defineProps<{
    activatorLabel?: string;
    activatorColor?: string;
  }>(),
  {
    activatorLabel: 'Add Player',
    activatorColor: 'secondary',
  }
);

const emit = defineEmits<{
  (e: 'added', payload: { users: Player[]; label: string }): void;
}>();

const dialog = ref(false);
const allUsers = ref<Player[]>([]);
const selectedUsers = ref<number[]>([]);

const searchText = ref('');
const autocompleteRef = ref<any>(null);
let prevLength = ref(0);
const currentProjectId = computed(() => route.params.id);

watch(selectedUsers, () => {
  if (selectedUsers.value.length > prevLength.value) {
    // 칩 추가된 경우만
    const inputEl = autocompleteRef.value?.$el.querySelector('input') as HTMLInputElement;
    if (inputEl) {
      inputEl.value = '';
      inputEl.dispatchEvent(new Event('input'));
    }
  }
  prevLength.value = selectedUsers.value.length;
});

onMounted(async () => {
  try {
    const res = await api.get(`${getBaseUrl('DATA')}/player/all`); // 예: 전체 사용자 리스트
    allUsers.value = res.data.datas.map((user: any) => ({
      ...user,
      display: `${user.nickname}#${user.tagname}`,
    }));
  } catch (e) {
    console.error('사용자 목록 로드 실패', e);
  }
});

async function handleAdd() {
  const selected = allUsers.value.filter((u) => selectedUsers.value.includes(u.id));

  emit('added', { users: selected, label: props.activatorLabel }); // 🔥 선택된 사용자 전달

  dialog.value = false;
  selectedUsers.value = [];
}
</script>
