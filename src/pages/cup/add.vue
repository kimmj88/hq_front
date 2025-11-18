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

      <v-select
        v-model="team_count"
        :items="teamCountOptions"
        label="Team Count"
        required
        :rules="[rules.required]"
      ></v-select>

      <!-- 버튼 영역 -->
      <div class="mt-6 text-right">
        <v-btn color="secondary" class="mr-2" @click="createMatch">Add</v-btn>
        <v-btn color="secondary" @click="$router.push(CUP_PATH.BASE)">CANCEL</v-btn>
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

const team_count = ref<number | null>(null);

const teamCountOptions = [2, 3, 4, 5, 6, 7, 8];

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
  //{ label: '리그', value: 'LEAGUE' },
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

async function createMatch() {
  if (!cup_name.value.trim()) {
    alert('Match 이름을 입력해주세요!');
    return;
  }

  try {
    const response = await api.post(`${getBaseUrl('DATA')}/cup/create`, {
      name: cup_name.value,
      type: project_type.value,
      team_count: team_count.value,
    });
    router.push(CUP_PATH.BASE);
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.message ?? '알 수 없는 오류 발생';
    errorSnackbar.value = true;
    console.error('Match 생성 실패:', error);
  }
}
</script>
