<template>
  <v-container>
    <h1>Add Match</h1>

    <v-form ref="form" v-model="valid">
      <v-text-field
        v-model="merchandise_name"
        label="Match Name"
        required
      ></v-text-field>

      <!-- 유저 추가 다이얼로그 -->
      <ProjectMemberDialog @added="handleAdd" />

      <!-- 선택된 유저 표시 -->
      <div class="mt-4 d-flex flex-wrap gap-2">
        <v-chip
          v-for="user in selectedUsers"
          :key="user.id"
          color="primary"
          variant="elevated"
          closable
          class="ma-1"
          @click:close="removeUser(user)"
        >
          <v-avatar left>
            <v-icon>mdi-account</v-icon>
          </v-avatar>
          {{ user.name }}
        </v-chip>
      </div>

      <!-- 버튼 영역 -->
      <div class="mt-6 text-right">
        <v-btn color="secondary" class="mr-2" @click="createCompany">Add</v-btn>
        <v-btn color="secondary" @click="$router.push(MATCH_PATH.BASE)"
          >CANCEL</v-btn
        >
      </div>
    </v-form>

    <v-snackbar v-model="errorSnackbar" color="error" timeout="3000">
      {{ errorMessage }}
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from "vue";
import ProjectMemberDialog from "@/components/dialogs/ProjectMemberDialog.vue";
import { useRouter } from "vue-router";
import { MATCH_PATH } from "@/router/match/type";

const router = useRouter();
const merchandise_name = ref("");
const valid = ref(false);

const errorSnackbar = ref(false);
const errorMessage = ref("");

// 유저 선택 관련 상태
interface UserOption {
  id: number;
  name: string;
  email: string;
  display: string;
}

const selectedUsers = ref<UserOption[]>([
  {
    id: 1,
    name: "김민재",
    email: "minjae.kim@example.com",
    display: "김민재 (minjae.kim@example.com)",
  },
  {
    id: 2,
    name: "소라",
    email: "sora@example.com",
    display: "소라 (sora@example.com)",
  },
  {
    id: 1,
    name: "김차라",
    email: "minjae.kim@example.com",
    display: "김민재 (minjae.kim@example.com)",
  },
  {
    id: 2,
    name: "이대얼짱효리미",
    email: "sora@example.com",
    display: "소라 (sora@example.com)",
  },
  {
    id: 1,
    name: "으라",
    email: "minjae.kim@example.com",
    display: "김민재 (minjae.kim@example.com)",
  },
  {
    id: 2,
    name: "아쿠아",
    email: "sora@example.com",
    display: "소라 (sora@example.com)",
  },
  {
    id: 1,
    name: "THE ZD",
    email: "minjae.kim@example.com",
    display: "김민재 (minjae.kim@example.com)",
  },
  {
    id: 2,
    name: "썜질문있어요",
    email: "sora@example.com",
    display: "소라 (sora@example.com)",
  },
  {
    id: 1,
    name: "몽실몽실",
    email: "minjae.kim@example.com",
    display: "김민재 (minjae.kim@example.com)",
  },
  {
    id: 2,
    name: "Crazy the top",
    email: "sora@example.com",
    display: "소라 (sora@example.com)",
  },
]);

// function handleAdd(users: UserOption[]) {
//   // 중복 제거 후 추가
//   const newIds = new Set(selectedUsers.value.map((u) => u.id));
//   const filtered = users.filter((u) => !newIds.has(u.id));
//   selectedUsers.value.push(...filtered);
// }

function handleAdd() {}

function removeUser(user: UserOption) {
  selectedUsers.value = selectedUsers.value.filter((u) => u.id !== user.id);
}

async function createCompany() {
  if (!merchandise_name.value.trim()) {
    alert("Match 이름을 입력해주세요!");
    return;
  }

  try {
    // const response = await api.post(`${getBaseUrl('DATA')}/match/create`, {
    //   name: merchandise_name.value,
    //   members: selectedUsers.value.map(u => u.id),
    // });
    // router.push(MATCH_PATH.BASE);
  } catch (error: any) {
    errorMessage.value =
      error?.response?.data?.message ?? "알 수 없는 오류 발생";
    errorSnackbar.value = true;
    console.error("Match 생성 실패:", error);
  }
}
</script>
