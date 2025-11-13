<template>
  <v-card class="pa-6" elevation="2" rounded="lg">
    <v-row justify="center">
      <!-- <v-avatar size="100">
        <v-img :src="account.avatar" v-if="account.avatar" />
        <span v-else class="text-h5 font-weight-bold">{{ getInitials(account.name) }}</span>
      </v-avatar> -->
      <v-avatar size="100" color="blue">
        <span class="text-h5 font-weight-bold white--text">
          {{ getInitials(account.datas.name) }}
        </span>
      </v-avatar>
    </v-row>

    <v-row justify="center" class="mt-3">
      <div class="text-h6 font-weight-medium">{{ account.datas.name }}</div>
    </v-row>

    <v-row justify="center">
      <v-chip color="cyan-darken-2" text-color="white" size="large" class="mt-1">
        {{ selectedSystemRole?.name }}
      </v-chip>
    </v-row>

    <v-divider class="my-4" />

    <v-row justify="space-around" class="mb-4 text-center">
      <div>
        <v-icon class="mb-1" color="primary">mdi-check-circle</v-icon>
        <div class="text-h6">1.23k</div>
        <div class="text-caption text-grey">Task Done</div>
      </div>
      <div>
        <v-icon class="mb-1" color="deep-purple-accent-4">mdi-apps</v-icon>
        <div class="text-h6">568</div>
        <div class="text-caption text-grey">Project Done</div>
      </div>
    </v-row>

    <v-divider class="mb-2" />

    <v-list class="text-body-2">
      <v-list-item>
        <v-list-item-title class="font-weight-medium">Username:</v-list-item-title>
        <v-list-item-subtitle>{{ account.datas.name }}</v-list-item-subtitle>
      </v-list-item>
      <v-list-item>
        <v-list-item-title class="font-weight-medium">Billing Email:</v-list-item-title>
        <v-list-item-subtitle>{{ account.datas.email }}</v-list-item-subtitle>
      </v-list-item>
      <v-list-item>
        <v-list-item-title class="font-weight-medium">Country:</v-list-item-title>
        <v-list-item-subtitle>{{ account.datas.department }}</v-list-item-subtitle>
      </v-list-item>
    </v-list>

    <v-row justify="end" class="mt-4">
      <v-btn
        v-if="can('ACCOUNT', 'SYS-SET-ACC-U')"
        color="primary"
        class="mr-2"
        @click="dialog = true"
        >Edit</v-btn
      >
      <v-btn color="error" variant="tonal" @click="router.push('/config/account')">{{
        $t('form_control.button.cancel')
      }}</v-btn>
    </v-row>
  </v-card>
  <v-dialog v-model="dialog" max-width="500px">
    <v-card>
      <v-card-title class="text-h6">Edit Account</v-card-title>
      <v-card-text>
        <v-text-field v-model="account.datas.name" label="Name" readonly />
        <v-text-field v-model="account.datas.email" label="Email" readonly />
        <v-text-field v-model="account.datas.department" label="Department" readonly />
        <v-autocomplete
          v-model="selectedSystemRole"
          :items="systemRoleList"
          item-title="name"
          item-value="id"
          label="Select Role"
          return-object
        />
        <v-switch
          v-model="accountIsConfirm"
          label="플레이어 승인"
          color="success"
          inset
          hide-details
        />
      </v-card-text>
      <v-card-actions class="justify-end">
        <v-btn text @click="dialog = false">{{ $t('form_control.button.cancel') }}</v-btn>
        <v-btn color="primary" @click="submitEdit">{{ $t('form_control.button.save') }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getBaseUrl } from '@/@core/composable/createUrl';
import api from '@/@core/composable/useAxios';
import { useRouter } from 'vue-router';
import type { SystemRole } from '@/data/types/systemrole';
import { can } from '@/stores/usePermissionStore';

const router = useRouter();
const props = defineProps<{ id: string }>();

const selectedSystemRole = ref<SystemRole | null>(null);
const systemRoleList = ref<SystemRole[]>([]);
const accountIsConfirm = ref<boolean>(false);

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

const dialog = ref(false);

// ✅ 다이얼로그용 form 데이터
const editForm = ref({
  name: '',
  email: '',
  department: '',
});

const account = ref<{
  datas: {
    name: string;
    email: string;
    department: string;
    systemrole: SystemRole;
    is_confirm: boolean;
  };
}>({
  datas: {
    name: '',
    email: '',
    department: '',
    systemrole: {},
    is_confirm: false,
  },
});

async function fetchAccount() {
  try {
    const response = await api.get(`${getBaseUrl('DATA')}/account/find?id=${props.id}`);
    account.value = response.data;
    selectedSystemRole.value = account.value.datas.systemrole;
    accountIsConfirm.value = account.value.datas.is_confirm;

    const res = await api.get(`${getBaseUrl('DATA')}/systemrole/all`);
    systemRoleList.value = res.data.datas;
  } catch (error) {
    console.error('회사 정보 불러오기 실패:', error);
  }
}

onMounted(fetchAccount);

async function submitEdit() {
  try {
    const payload = { id: props.id, systemrole_id: selectedSystemRole.value?.id };
    const res = await api.post(`${getBaseUrl('DATA')}/account/update`, payload);

    selectedSystemRole.value = res.data.rows.systemrole;
    dialog.value = false;
  } catch (err) {
    console.error('수정 실패:', err);
  }
}
</script>
