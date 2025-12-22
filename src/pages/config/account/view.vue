<template>
  <v-card class="pa-6 account-detail-card" elevation="2" rounded="lg">
    <!-- 상단 프로필 영역 -->
    <v-row class="mb-6" align="center" justify="center">
      <v-col cols="12" class="text-center">
        <v-avatar size="96" color="blue-darken-2">
          <span class="text-h5 font-weight-bold text-white">
            {{ getInitials(account.datas.nickname) }}
          </span>
        </v-avatar>

        <!-- 닉네임 + 수정 버튼 -->
        <div class="mt-3 d-flex justify-center align-center" style="gap: 8px">
          <div class="text-h6 font-weight-medium">
            {{ account.datas.nickname || '-' }}
          </div>

          <!-- 닉네임 수정 버튼 -->
          <v-btn
            icon
            size="small"
            variant="text"
            density="comfortable"
            color="white"
            @click="openNicknameDialog"
          >
            <v-icon>mdi-pencil</v-icon>
          </v-btn>
        </div>

        <div class="mt-1 d-flex justify-center align-center" style="gap: 8px">
          <!-- 시스템 롤 -->
          <v-chip
            v-if="selectedSystemRole"
            color="cyan-darken-2"
            text-color="white"
            size="small"
            variant="flat"
          >
            {{ selectedSystemRole.name }}
          </v-chip>

          <!-- 승인 상태 -->
          <v-chip
            :color="account.datas.is_confirm ? 'green' : 'orange'"
            text-color="white"
            size="small"
            variant="flat"
          >
            {{ account.datas.is_confirm ? '승인됨' : '승인대기' }}
          </v-chip>
        </div>
      </v-col>
    </v-row>

    <v-divider class="mb-4" />

    <!-- 계정 + 플레이어 정보 영역 -->
    <v-row dense>
      <!-- 계정 정보 -->
      <v-col cols="12" md="6">
        <div class="section-title mb-2">계정 정보</div>
        <v-list density="compact" class="text-body-2">
          <v-list-item>
            <v-list-item-title class="font-weight-medium">Username</v-list-item-title>
            <v-list-item-subtitle>{{ account.datas.nickname || '-' }}</v-list-item-subtitle>
          </v-list-item>
          <v-list-item>
            <v-list-item-title class="font-weight-medium">Email</v-list-item-title>
            <v-list-item-subtitle>{{ account.datas.email || '-' }}</v-list-item-subtitle>
          </v-list-item>
          <v-list-item>
            <v-list-item-title class="font-weight-medium">Department</v-list-item-title>
            <v-list-item-subtitle>{{ account.datas.department || '-' }}</v-list-item-subtitle>
          </v-list-item>
          <v-list-item>
            <v-list-item-title class="font-weight-medium">Role</v-list-item-title>
            <v-list-item-subtitle>{{ selectedSystemRole?.name || '-' }}</v-list-item-subtitle>
          </v-list-item>
        </v-list>
      </v-col>

      <!-- 플레이어 정보 -->
      <v-col cols="12" md="6">
        <div class="section-title mb-2">플레이어 정보</div>

        <v-alert v-if="!player" type="info" variant="tonal" density="compact" class="mb-2">
          아직 등록된 플레이어 정보가 없습니다.
        </v-alert>

        <template v-else>
          <div class="d-flex align-center mb-3" style="gap: 12px">
            <v-avatar size="40" color="deep-purple-darken-2">
              <span class="text-subtitle-2 text-white">
                {{ getInitials(player.nickname || account.datas.name) }}
              </span>
            </v-avatar>
            <div>
              <div class="text-subtitle-2 font-weight-medium">
                {{ player.nickname }}<span v-if="player.tagname">#{{ player.tagname }}</span>
              </div>
              <div class="text-caption text-medium-emphasis">
                {{ player_comment }}
              </div>
            </div>
          </div>

          <v-row dense>
            <v-col cols="12" sm="6">
              <v-card variant="tonal" color="indigo" class="pa-3">
                <div class="text-caption text-medium-emphasis">티어</div>
                <div class="text-body-1 font-weight-medium">
                  {{ player.tier?.name || '-' }}
                </div>
                <div class="text-caption">Point: {{ player.tier?.point ?? '-' }}</div>
              </v-card>
            </v-col>

            <v-col cols="12" sm="6">
              <v-card variant="tonal" color="purple" class="pa-3">
                <div class="text-caption text-medium-emphasis">내부 점수</div>
                <div class="text-body-1 font-weight-medium">
                  {{ player.point ?? '-' }}
                </div>
                <div class="text-caption">최근 평가 기준</div>
              </v-card>
            </v-col>

            <v-col cols="12" sm="6">
              <v-list density="compact" class="text-body-2">
                <v-list-item>
                  <v-list-item-title class="font-weight-medium">주 포지션</v-list-item-title>
                  <v-list-item-subtitle>{{ player.main_position || '-' }}</v-list-item-subtitle>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title class="font-weight-medium">부 포지션</v-list-item-title>
                  <v-list-item-subtitle>{{ player.sub_position || '-' }}</v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </v-col>

            <v-col cols="12" sm="6">
              <v-list density="compact" class="text-body-2">
                <v-list-item>
                  <v-list-item-title class="font-weight-medium">선호 챔피언</v-list-item-title>
                  <v-list-item-subtitle>{{ player.favorite_champs || '-' }}</v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </v-col>
          </v-row>
        </template>
      </v-col>
    </v-row>

    <v-divider class="mt-4 mb-3" />

    <!-- 하단 컨트롤 -->
    <v-row align="center" justify="space-between">
      <v-col cols="12" md="6" class="d-flex align-center" style="gap: 12px">
        <!-- <v-switch
          v-model="accountIsConfirm"
          color="success"
          inset
          hide-details
          :label="accountIsConfirm ? '플레이어 승인됨' : '플레이어 승인대기'"
        />
        <span class="text-caption text-medium-emphasis">
          승인 시 해당 계정으로 로그인할 수 있습니다.
        </span> -->
      </v-col>

      <v-col cols="12" md="6" class="d-flex justify-end" style="gap: 8px">
        <v-btn
          v-if="can('ACCOUNT', 'SYS-SET-ACC-U')"
          color="primary"
          variant="flat"
          @click="dialog = true"
        >
          Edit Role
        </v-btn>
        <!-- <v-btn color="primary" variant="tonal" @click="submitEdit"> 저장 </v-btn> -->
        <v-btn color="secondary" variant="text" @click="router.push('/config/account')">
          뒤로
        </v-btn>
      </v-col>
    </v-row>
  </v-card>

  <!-- 역할 변경 다이얼로그 -->
  <v-dialog v-model="dialog" max-width="480">
    <v-card>
      <v-card-title class="text-h6">계정 설정</v-card-title>
      <v-card-text>
        <v-text-field v-model="account.datas.name" label="Name" readonly />
        <v-text-field v-model="account.datas.email" label="Email" readonly />
        <v-text-field v-model="account.datas.department" label="Department" readonly />

        <v-autocomplete
          v-model="selectedSystemRole"
          :items="systemRoleList"
          item-title="name"
          item-value="id"
          label="System Role"
          return-object
          class="mt-2"
        />

        <v-switch
          v-model="accountIsConfirm"
          label="플레이어 로그인 승인"
          color="success"
          inset
          hide-details
          class="mt-4"
        />
      </v-card-text>
      <v-card-actions class="justify-end">
        <v-btn variant="text" @click="dialog = false">취소</v-btn>
        <v-btn color="primary" @click="submitEdit">저장</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- 닉네임 변경 다이얼로그 -->
  <v-dialog v-model="nicknameDialog" max-width="400">
    <v-card>
      <v-card-title class="text-h6">닉네임 수정</v-card-title>

      <v-card-text>
        <!-- ✅ 변경 가능/불가 안내 -->
        <v-alert
          v-if="nicknameGate.checked"
          :type="nicknameGate.allowed ? 'info' : 'warning'"
          variant="tonal"
          density="compact"
          class="mb-3"
        >
          {{ nicknameGate.message }}
        </v-alert>

        <v-text-field
          v-model="editNickname"
          label="새 닉네임"
          maxlength="20"
          counter="20"
          autocomplete="off"
          :disabled="nicknameGate.checked && !nicknameGate.allowed"
        />
      </v-card-text>

      <v-card-actions class="justify-end">
        <v-btn variant="text" @click="nicknameDialog = false">취소</v-btn>
        <v-btn
          color="primary"
          :disabled="!canSubmitNickname"
          :loading="nicknameGate.loading"
          @click="submitNickname"
        >
          저장
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import api from '@/@core/composable/useAxios';
import { getBaseUrl } from '@/@core/composable/createUrl';
import { can } from '@/stores/usePermissionStore';
import type { SystemRole } from '@/data/types/systemrole';
import type { Player } from '@/data/types/player';
import { useAccountStore } from '@/stores/useAccountStore';

const props = defineProps<{ id: string }>();

const router = useRouter();
const route = useRoute();
const accountStore = useAccountStore();

const dialog = ref(false);
const selectedSystemRole = ref<SystemRole | null>(null);
const systemRoleList = ref<SystemRole[]>([]);
const accountIsConfirm = ref<boolean>(false);

const account = ref<{
  datas: {
    name: string;
    nickname: string; // 🔹 추가
    email: string;
    department: string;
    systemrole: SystemRole | null;
    is_confirm: boolean;
    player?: Player | null;
  };
}>({
  datas: {
    name: '',
    nickname: '', // 🔹 추가
    email: '',
    department: '',
    systemrole: null,
    is_confirm: false,
    player: null,
  },
});

const nicknameDialog = ref(false);
const editNickname = ref('');

const nicknameGate = ref({
  loading: false,
  checked: false,
  allowed: true,
  message: '',
});

const canSubmitNickname = computed(() => {
  if (!editNickname.value.trim()) return false;
  if (nicknameGate.value.loading) return false;
  if (nicknameGate.value.checked && !nicknameGate.value.allowed) return false;
  return true;
});

async function openNicknameDialog() {
  editNickname.value = account.value.datas.nickname || '';
  nicknameDialog.value = true;

  // ✅ 다이얼로그 열릴 때마다 갱신
  nicknameGate.value.loading = true;
  nicknameGate.value.checked = false;
  nicknameGate.value.allowed = true;
  nicknameGate.value.message = '';

  try {
    const res = await api.get(`${getBaseUrl('DATA')}/account/can_nickname`, {
      params: { id: props.id },
    });

    const allowed = !!res.data?.datas; // 서버가 true/false로 준다고 가정
    nicknameGate.value.allowed = allowed;
    nicknameGate.value.checked = true;

    nicknameGate.value.message = allowed
      ? '닉네임을 변경할 수 있어요.'
      : '닉네임은 30일에 한 번만 변경할 수 있어요. 다음 변경 가능 날짜를 기다려주세요.';
  } catch (e) {
    // 체크 실패면 안전하게 막거나(보수적) 일단 허용(낙관적) 중 택1
    nicknameGate.value.allowed = false;
    nicknameGate.value.checked = true;
    nicknameGate.value.message =
      '닉네임 변경 가능 여부를 확인하지 못했어요. 잠시 후 다시 시도해줘.';
  } finally {
    nicknameGate.value.loading = false;
  }
}

async function submitNickname() {
  if (!canSubmitNickname.value) return;

  try {
    await api.post(`${getBaseUrl('DATA')}/account/update`, {
      id: props.id,
      nickname: editNickname.value.trim(),
    });

    account.value.datas.nickname = editNickname.value.trim();
    nicknameDialog.value = false;
  } catch (error) {
    console.error('닉네임 수정 실패:', error);
  }
}

const player = computed<Player | null>(() => account.value.datas.player ?? null);

// 예시: 플레이어 한줄 설명
const player_comment = computed(() => {
  if (!player.value) return '';
  const tier = player.value.tier?.name;
  const pos = player.value;
  if (tier && pos) return `${tier} ${pos} 플레이어`;
  if (tier) return `${tier} 플레이어`;
  if (pos) return `${pos} 포지션`;
  return '';
});

function getInitials(name?: string) {
  if (!name) return '?';
  return name
    .trim()
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

async function fetchAccount() {
  try {
    const res = await api.get(`${getBaseUrl('DATA')}/account/find?id=${props.id}`);
    account.value = res.data;
    selectedSystemRole.value = account.value.datas.systemrole || null;
    accountIsConfirm.value = account.value.datas.is_confirm;

    const roleRes = await api.get(`${getBaseUrl('DATA')}/systemrole/all`);
    systemRoleList.value = roleRes.data.datas;
  } catch (error) {
    console.error('계정 정보 불러오기 실패:', error);
  }
}

async function submitEdit() {
  try {
    const payload = {
      id: props.id,
      systemrole_id: selectedSystemRole.value?.id,
      is_confirm: accountIsConfirm.value,
    };

    await api.post(`${getBaseUrl('DATA')}/account/update`, payload);

    // 로컬 상태 반영
    account.value.datas.systemrole = selectedSystemRole.value || null;
    account.value.datas.is_confirm = accountIsConfirm.value;

    dialog.value = false;
  } catch (err) {
    console.error('계정 업데이트 실패:', err);
  }
}

onMounted(async () => {
  if (can('ACCOUNT', 'SYS-SET-ACC-R') == true) {
    await fetchAccount();
  } else if (accountStore.id != +route.params.id) {
    router.push('/forbidden');
  } else {
    await fetchAccount();
  }
});
</script>

<style scoped>
.account-detail-card {
  min-height: 420px;
}

.section-title {
  font-size: 0.9rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: rgba(255, 255, 255, 0.7);
}
</style>
