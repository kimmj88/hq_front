<template>
  <v-container>
    <h1>Add Match</h1>

    <v-form ref="form" v-model="valid">
      <v-text-field v-model="match_name" label="Match Name" required></v-text-field>

      <v-select
        v-model="project_type"
        :items="projectTypeOptions"
        item-title="label"
        item-value="value"
        label="Project Type"
        required
        :rules="[rules.required]"
      ></v-select>

      <v-alert type="info" variant="tonal" class="mt-2">
        매치를 만든 뒤 상세 화면에서 양 팀의 플레이어를 선택할 수 있습니다.
      </v-alert>

      <!-- 버튼 영역 -->
      <div class="mt-6 text-right">
        <v-btn color="secondary" class="mr-2" @click="createMatch">Add</v-btn>
        <v-btn color="secondary" @click="$router.push(CLAN_PATH.MATCH(account.clan.name))"
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
import { ref } from 'vue';
import api from '@/@core/composable/useAxios';
import { useRouter } from 'vue-router';
import { CLAN_PATH } from '@/router/clan/type';
import { rules } from '@/@core/validation/rules';
import { getBaseUrl } from '@/@core/composable/createUrl';
import { useAccountStore } from '@/stores/useAccountStore';

const account = useAccountStore();

const router = useRouter();
const match_name = ref('');
const valid = ref(false);

const errorSnackbar = ref(false);
const errorMessage = ref('');

type ProjectType = 'RANDOM' | 'POSITION' | 'DUORANK' | 'FREERANK' | 'SPEEDWIND';

interface ProjectTypeOption {
  label: string;
  value: ProjectType;
}

const projectTypeOptions: ProjectTypeOption[] = [
  { label: '무작위내전', value: 'RANDOM' },
  { label: '포지션내전', value: 'POSITION' },
  // { label: '솔랭듀오', value: 'DUORANK' },
  // { label: '자유랭크', value: 'FREERANK' },
  // { label: '칼바람', value: 'SPEEDWIND' },
];

const project_type = ref<ProjectType | ''>('');

async function createMatch() {
  if (!match_name.value.trim()) {
    alert('Match 이름을 입력해주세요!');
    return;
  }

  if (!project_type.value.trim()) {
    alert('Type을 선택해주세요');
    return;
  }

  try {
    const response = await api.post(`${getBaseUrl('DATA')}/match/create`, {
      name: match_name.value,
      type: project_type.value,
      match_members: [],
      clan: account.clan,
    });
    router.push(CLAN_PATH.MATCH_VIEW(account.clan.name, response.data.datas.id));
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.message ?? '알 수 없는 오류 발생';
    errorSnackbar.value = true;
    console.error('Match 생성 실패:', error);
  }
}
</script>
