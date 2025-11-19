<template>
  <v-dialog v-model="dialog" max-width="600">
    <!-- 🔹 activator: 기본 버튼 + 커스터마이즈 가능 slot -->
    <template #activator="{ props: activatorProps }">
      <slot name="activator" :activator-props="activatorProps">
        <v-btn :color="props.activatorColor" v-bind="activatorProps" size="small">
          {{ props.activatorLabel }}
        </v-btn>
      </slot>
    </template>

    <v-card>
      <v-card-title class="text-h6">
        {{ isEditMode ? '플레이어 수정' : '플레이어 추가' }}
      </v-card-title>

      <v-card-text>
        <!-- 🔹 ADD 모드: 여러 명 선택 -->
        <v-autocomplete
          v-if="!isEditMode"
          ref="autocompleteRef"
          v-model="selectedUsers"
          :items="filteredUsers"
          item-title="display"
          item-value="id"
          multiple
          chips
          closable-chips
          clearable
          solo
          label="이름 또는 태그"
          placeholder="이름 또는 태그 입력"
          :search-input="searchText"
        />

        <!-- 🔹 EDIT 모드: 1명만 선택 -->
        <v-autocomplete
          v-else
          ref="autocompleteRef"
          v-model="selectedSingle"
          :items="filteredUsers"
          item-title="display"
          item-value="id"
          clearable
          solo
          label="변경할 플레이어 선택"
          placeholder="이름 또는 태그 입력"
          :search-input="searchText"
        />

        <div class="text-caption mt-2">
          <template v-if="!isEditMode">
            선택된 사용자: <strong>{{ selectedUsers.length }}</strong
            >명
          </template>
          <template v-else>
            선택된 사용자:
            <strong>{{ selectedSingle ? 1 : 0 }}</strong
            >명
          </template>
        </div>
      </v-card-text>

      <v-card-actions class="justify-end">
        <v-btn variant="text" @click="onCancel">취소</v-btn>
        <v-btn color="primary" @click="handleAdd">
          {{ isEditMode ? '저장' : '추가' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { getBaseUrl } from '@/@core/composable/createUrl';
import { useRoute } from 'vue-router';
import api from '@/@core/composable/useAxios';
import type { Player } from '@/data/types/player';

const route = useRoute();

const props = withDefaults(
  defineProps<{
    activatorLabel?: string;
    activatorColor?: string;

    // 🔹 add | edit 모드
    mode?: 'add' | 'edit';

    // 🔹 다이얼로그 열릴 때 기본 선택해 둘 유저 id들 (add 모드, or fallback)
    initialUserIds?: number[] | null;

    // 🔹 수정 모드에서 넘겨줄 기존 Player 객체
    initialUser?: Player | null; // 🔥 추가

    // 🔹 목록에서 제외하고 싶은 유저 id들(다른 포지션에 이미 배정된 경우 등)
    excludeIds?: number[] | null;
  }>(),
  {
    activatorLabel: 'Add Player',
    activatorColor: 'secondary',
    mode: 'add',
    initialUserIds: null,
    initialUser: null, // 🔥 기본값
    excludeIds: null,
  }
);

const emit = defineEmits<{
  (e: 'added', payload: { users: Player[]; label: string }): void;
}>();

const dialog = ref(false);
const allUsers = ref<Player[]>([]);

// add 모드: 여러 명, edit 모드: 한 명
const selectedUsers = ref<number[]>([]);
const selectedSingle = ref<number | null>(null);

const searchText = ref('');
const autocompleteRef = ref<any>(null);
const prevLength = ref(0);
const currentProjectId = computed(() => route.params.id);
const isEditMode = computed(() => props.mode === 'edit');

// 제외 대상 반영한 items
const filteredUsers = computed(() => {
  if (!props.excludeIds || props.excludeIds.length === 0) return allUsers.value;
  const excludeSet = new Set(props.excludeIds);
  return allUsers.value.filter((u) => !excludeSet.has(u.id));
});

// 🔹 다중 선택일 때만 칩 입력 초기화
watch(selectedUsers, () => {
  if (!dialog.value || isEditMode.value) return;

  if (selectedUsers.value.length > prevLength.value) {
    const inputEl = autocompleteRef.value?.$el.querySelector('input') as HTMLInputElement;
    if (inputEl) {
      inputEl.value = '';
      inputEl.dispatchEvent(new Event('input'));
    }
  }
  prevLength.value = selectedUsers.value.length;
});

// 🔹 다이얼로그 열릴 때 initialUser / initialUserIds 반영
watch(
  () => dialog.value,
  (opened) => {
    if (!opened) return;

    if (isEditMode.value) {
      // ✅ edit 모드는 Player 객체 우선 사용
      if (props.initialUser) {
        selectedSingle.value = props.initialUser.id;
      } else {
        const first = props.initialUserIds?.[0] ?? null;
        selectedSingle.value = first;
      }
    } else {
      selectedUsers.value = props.initialUserIds ?? [];
    }
  }
);

onMounted(async () => {
  try {
    const res = await api.get(`${getBaseUrl('DATA')}/player/all`);
    allUsers.value = res.data.datas.map((user: any) => ({
      ...user,
      display: `${user.nickname}#${user.tagname}`,
    }));
  } catch (e) {
    console.error('사용자 목록 로드 실패', e);
  }
});

function onCancel() {
  dialog.value = false;
  selectedUsers.value = [];
  selectedSingle.value = null;
}

function handleAdd() {
  let picked: Player[] = [];

  if (isEditMode.value) {
    if (!selectedSingle.value) {
      dialog.value = false;
      return;
    }
    picked = filteredUsers.value.filter((u) => u.id === selectedSingle.value);
  } else {
    picked = filteredUsers.value.filter((u) => selectedUsers.value.includes(u.id));
  }

  emit('added', { users: picked, label: props.activatorLabel });

  dialog.value = false;
  selectedUsers.value = [];
  selectedSingle.value = null;
}
</script>
