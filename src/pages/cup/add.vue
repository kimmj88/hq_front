<template>
  <v-container>
    <h1>Add Cup</h1>

    <v-form ref="form" v-model="valid">
      <v-text-field v-model="cup_name" label="Cup Name" required></v-text-field>

      <v-select
        v-model="project_type"
        :items="projectTypeOptions"
        item-title="label"
        item-value="value"
        label="Project Type"
        required
        :rules="[rules.required]"
      ></v-select>

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
          {{ user.nickname }}
        </v-chip>
      </div>

      <!-- 버튼 영역 -->
      <div class="mt-6 text-right">
        <v-btn color="secondary" class="mr-2" @click="createMatch">Add</v-btn>
        <v-btn color="secondary" @click="$router.push(CUP_PATH.BASE)">CANCEL</v-btn>
        <h1>{{ selectedUsers.length }}</h1>
      </div>
    </v-form>

    <v-snackbar v-model="errorSnackbar" color="error" timeout="3000">
      {{ errorMessage }}
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { can } from '@/stores/usePermissionStore';
import { onMounted, ref } from 'vue';
import ProjectMemberDialog from '@/components/dialogs/ProjectMemberDialog.vue';
import api from '@/@core/composable/useAxios';
import { useRouter } from 'vue-router';
import { CUP_PATH } from '@/router/cup/type';
import { rules } from '@/@core/validation/rules';
import { getBaseUrl } from '@/@core/composable/createUrl';

const router = useRouter();
const cup_name = ref('');
const valid = ref(false);

const errorSnackbar = ref(false);
const errorMessage = ref('');

type CupType = 'TOURNAMENT' | 'LEAGUE';

interface ProjectTypeOption {
  label: string;
  value: CupType;
}

const projectTypeOptions: ProjectTypeOption[] = [
  { label: '토너먼트', value: 'TOURNAMENT' },
  { label: '리그', value: 'LEAGUE' },
  // { label: '솔랭듀오', value: 'DUORANK' },
  // { label: '자유랭크', value: 'FREERANK' },
  // { label: '칼바람', value: 'SPEEDWIND' },
];

const project_type = ref<CupType | ''>('');

// 유저 선택 관련 상태
interface UserOption {
  id: number;
  nickname: string;
  tagname: string;
  point: number;
}

const selectedUsers = ref<UserOption[]>([]);

function handleAdd(users: UserOption[]) {
  // 중복 제거 후 추가

  const newIds = new Set(selectedUsers.value.map((u) => u.id));
  const filtered = users.filter((u) => !newIds.has(u.id));
  selectedUsers.value.push(...filtered);
}

function removeUser(user: UserOption) {
  selectedUsers.value = selectedUsers.value.filter((u) => u.id !== user.id);
}

async function createMatch() {
  if (!cup_name.value.trim()) {
    alert('Match 이름을 입력해주세요!');
    return;
  }

  if (selectedUsers.value.length < 5 || selectedUsers.value.length % 5 != 0) {
    alert('Plyaer를 5명 이상 및 5의 배수로 추가하세요');
    return;
  }

  try {
    const response = await api.post(`${getBaseUrl('DATA')}/cup/create`, {
      name: cup_name.value,
      type: project_type.value,
      cup_members: selectedUsers.value.map((u) => u.id),
    });
    router.push(CUP_PATH.BASE);
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.message ?? '알 수 없는 오류 발생';
    errorSnackbar.value = true;
    console.error('Match 생성 실패:', error);
  }
}
</script>
