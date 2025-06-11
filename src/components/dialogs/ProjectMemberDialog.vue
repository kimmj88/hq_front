<template>
  <v-dialog v-model="dialog" max-width="600">
    <template #activator="{ props }">
      <v-btn color="secondary" v-bind="props">Add Player</v-btn>
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
import { ref, onMounted, watch, computed } from "vue";
import axios from "axios";
import { getBaseUrl } from "@/@core/composable/createUrl";
import { useRoute } from "vue-router";
//import api from '@/@core/composable/useAxios';
const route = useRoute();

const emit = defineEmits<{
  (e: "added"): void;
}>();

interface UserOption {
  id: number;
  name: string;
  email: string;
  display: string;
}

const dialog = ref(false);
//const allUsers = ref<UserOption[]>([]);
const allUsers = ref<UserOption[]>([
  {
    id: 1,
    name: "김민재",
    email: "kimminjae91@example.com",
    display: "김민재 (kimminjae91@example.com)",
  },
  {
    id: 2,
    name: "차라",
    email: "chara77@example.com",
    display: "차라 (chara77@example.com)",
  },
  {
    id: 3,
    name: "아쿠아",
    email: "aqua42@example.com",
    display: "아쿠아 (aqua42@example.com)",
  },
  {
    id: 4,
    name: "ADC",
    email: "adchero10@example.com",
    display: "ADC (adchero10@example.com)",
  },
  {
    id: 5,
    name: "StarBoy",
    email: "starboy99@example.com",
    display: "StarBoy (starboy99@example.com)",
  },
  {
    id: 6,
    name: "이효리",
    email: "leehyori88@example.com",
    display: "이효리 (leehyori88@example.com)",
  },
  {
    id: 7,
    name: "요시공룡단",
    email: "yoshi_dino@example.com",
    display: "요시공룡단 (yoshi_dino@example.com)",
  },
  {
    id: 8,
    name: "쌤질문있어요",
    email: "teacherask3@example.com",
    display: "쌤질문있어요 (teacherask3@example.com)",
  },
  {
    id: 9,
    name: "codename gas",
    email: "gascode007@example.com",
    display: "codename gas (gascode007@example.com)",
  },
  {
    id: 10,
    name: "해따라지는꽃",
    email: "sunflower99@example.com",
    display: "해따라지는꽃 (sunflower99@example.com)",
  },
  {
    id: 11,
    name: "벨치스",
    email: "belchess55@example.com",
    display: "벨치스 (belchess55@example.com)",
  },
  {
    id: 12,
    name: "소라",
    email: "sora23@example.com",
    display: "소라 (sora23@example.com)",
  },
  {
    id: 13,
    name: "으라",
    email: "eura2025@example.com",
    display: "으라 (eura2025@example.com)",
  },
  {
    id: 14,
    name: "꺼벙",
    email: "kkeobeong84@example.com",
    display: "꺼벙 (kkeobeong84@example.com)",
  },
  {
    id: 15,
    name: "Fku1",
    email: "fku1game@example.com",
    display: "Fku1 (fku1game@example.com)",
  },
  {
    id: 16,
    name: "몽실몽실계란찜",
    email: "eggpuff77@example.com",
    display: "몽실몽실계란찜 (eggpuff77@example.com)",
  },
]);
const selectedUsers = ref<number[]>([]);

const searchText = ref("");
const autocompleteRef = ref<any>(null);
let prevLength = ref(0);
const currentProjectId = computed(() => route.params.id);

watch(selectedUsers, () => {
  if (selectedUsers.value.length > prevLength.value) {
    // 칩 추가된 경우만
    const inputEl = autocompleteRef.value?.$el.querySelector(
      "input"
    ) as HTMLInputElement;
    if (inputEl) {
      inputEl.value = "";
      inputEl.dispatchEvent(new Event("input"));
    }
  }
  prevLength.value = selectedUsers.value.length;
});

onMounted(async () => {
  try {
    // const res = await api.get(`${getBaseUrl('DATA')}/account/all`); // 예: 전체 사용자 리스트
    // allUsers.value = res.data.datas.map((user: any) => ({
    //   ...user,
    //   display: `${user.name} (${user.email})`,
    // }));
  } catch (e) {
    console.error("사용자 목록 로드 실패", e);
  }
});

async function handleAdd() {
  const selected = allUsers.value.filter((u) =>
    selectedUsers.value.includes(u.id)
  );

  // for (const user of selected) {
  //   await api.post(`${getBaseUrl('DATA')}/projectmember/create`, {
  //     project_id: currentProjectId.value,
  //     account_id: user.id,
  //   });
  // }

  emit("added");

  dialog.value = false;
  selectedUsers.value = [];
}
</script>
