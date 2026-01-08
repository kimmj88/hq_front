<template>
  <v-container class="py-6">
    <!-- ====== HEADER CARD ====== -->
    <v-card class="pa-5" rounded="xl" elevation="2">
      <div class="d-flex flex-wrap align-center justify-space-between" style="gap: 16px">
        <!-- left: avatar + text -->
        <div class="d-flex align-center" style="gap: 16px">
          <v-avatar size="72" color="blue-darken-2">
            <span class="text-h6 font-weight-bold text-white">
              {{ getInitials(account.datas.nickname) }}
            </span>
          </v-avatar>

          <div>
            <div class="d-flex align-center" style="gap: 8px">
              <div class="text-h6 font-weight-medium">
                {{ account.datas.nickname || '-' }}
              </div>

              <v-chip v-if="selectedSystemRole" size="small" color="cyan-darken-2" variant="flat">
                {{ selectedSystemRole.name }}
              </v-chip>
            </div>

            <div class="text-caption text-medium-emphasis">
              {{ account.datas.email || '-' }}
              <span v-if="account.datas.department"> · {{ account.datas.department }}</span>
            </div>
          </div>
        </div>

        <!-- right: actions -->
        <div class="d-flex flex-wrap justify-end" style="gap: 8px">
          <v-btn
            v-if="props.id === String(accountStore.id)"
            variant="tonal"
            prepend-icon="mdi-account-edit"
            @click="openNicknameDialog"
          >
            닉네임 변경
          </v-btn>

          <v-btn
            v-if="can('ACCOUNT', 'SYS-SET-ACC-U')"
            color="primary"
            variant="flat"
            prepend-icon="mdi-shield-account"
            @click="dialog = true"
          >
            권한/승인
          </v-btn>
        </div>
      </div>
    </v-card>

    <!-- ====== BODY GRID ====== -->
    <v-row class="mt-4" dense>
      <!-- ACCOUNT INFO -->
      <v-col cols="12" md="6">
        <v-card class="pa-5" rounded="xl" elevation="2">
          <div class="d-flex align-center justify-space-between mb-3">
            <div class="text-subtitle-1 font-weight-bold">계정 정보</div>
            <v-icon color="grey-lighten-1">mdi-account</v-icon>
          </div>

          <v-divider class="mb-3" />

          <v-list density="compact" class="text-body-2">
            <v-list-item>
              <template #prepend><v-icon>mdi-account-circle</v-icon></template>
              <v-list-item-title class="font-weight-medium">Username</v-list-item-title>
              <v-list-item-subtitle>{{ account.datas.nickname || '-' }}</v-list-item-subtitle>
            </v-list-item>

            <v-list-item>
              <template #prepend><v-icon>mdi-email</v-icon></template>
              <v-list-item-title class="font-weight-medium">Email</v-list-item-title>
              <v-list-item-subtitle>{{ account.datas.email || '-' }}</v-list-item-subtitle>
            </v-list-item>

            <v-list-item>
              <template #prepend><v-icon>mdi-domain</v-icon></template>
              <v-list-item-title class="font-weight-medium">Department</v-list-item-title>
              <v-list-item-subtitle>{{ account.datas.department || '-' }}</v-list-item-subtitle>
            </v-list-item>

            <v-list-item>
              <template #prepend><v-icon>mdi-shield</v-icon></template>
              <v-list-item-title class="font-weight-medium">Role</v-list-item-title>
              <v-list-item-subtitle>{{ selectedSystemRole?.name || '-' }}</v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>

      <!-- PLAYER INFO -->
      <v-col cols="12" md="6">
        <v-card class="pa-5" rounded="xl" elevation="2">
          <div class="d-flex flex-wrap align-center justify-space-between mb-3" style="gap: 8px">
            <div class="d-flex align-center" style="gap: 8px">
              <div class="text-subtitle-1 font-weight-bold">플레이어</div>
              <v-chip v-if="player" size="small" variant="tonal">
                {{ player.nickname }}<span v-if="player.tagname">#{{ player.tagname }}</span>
              </v-chip>
            </div>

            <div class="d-flex flex-wrap justify-end" style="gap: 8px">
              <AccountPlayerMemberDialog
                v-if="props.id === String(accountStore.id)"
                v-model="playerDialog"
                @added="handleAdd"
              />

              <v-btn
                v-if="player && props.id === String(accountStore.id)"
                variant="tonal"
                prepend-icon="mdi-map-marker"
                @click="openPositionDialog"
              >
                포지션 변경
              </v-btn>
            </div>
          </div>

          <v-divider class="mb-3" />

          <div v-if="!player">
            <v-alert type="info" variant="tonal" density="compact">
              아직 등록된 플레이어 정보가 없습니다.
            </v-alert>
          </div>

          <template v-else>
            <div class="d-flex align-center mb-4" style="gap: 12px">
              <v-avatar size="44" color="deep-purple-darken-2">
                <span class="text-subtitle-2 text-white">
                  {{ getInitials(player.nickname || account.datas.name) }}
                </span>
              </v-avatar>

              <div>
                <div class="text-body-1 font-weight-medium">
                  {{ player.nickname }}<span v-if="player.tagname">#{{ player.tagname }}</span>
                </div>
                <div class="text-caption text-medium-emphasis">
                  {{ player_comment }}
                </div>
              </div>
            </div>

            <v-row dense>
              <v-col cols="12" sm="6">
                <v-card variant="tonal" class="pa-4" rounded="lg">
                  <div class="text-caption text-medium-emphasis">티어</div>
                  <div class="text-body-1 font-weight-bold">
                    {{ player.tier?.name || '-' }}
                  </div>
                  <div class="text-caption">Point: {{ player.tier?.point ?? '-' }}</div>
                </v-card>
              </v-col>

              <v-col cols="12" sm="6">
                <v-card variant="tonal" class="pa-4" rounded="lg">
                  <div class="text-caption text-medium-emphasis">내부 점수</div>
                  <div class="text-body-1 font-weight-bold">
                    {{ player.point ?? '-' }}
                  </div>
                  <div class="text-caption">최근 평가 기준</div>
                </v-card>
              </v-col>

              <v-col cols="12">
                <v-card variant="tonal" class="pa-4" rounded="lg">
                  <div class="d-flex flex-wrap" style="gap: 8px">
                    <v-chip size="small" variant="tonal" prepend-icon="mdi-sword-cross">
                      주: {{ player.main_position || '-' }}
                    </v-chip>
                    <v-chip size="small" variant="tonal" prepend-icon="mdi-shield-half-full">
                      부: {{ player.sub_position || '-' }}
                    </v-chip>
                    <v-chip size="small" variant="tonal" prepend-icon="mdi-star">
                      챔피언: {{ player.favorite_champs || '-' }}
                    </v-chip>
                  </div>
                </v-card>
              </v-col>
            </v-row>
          </template>
        </v-card>
      </v-col>
    </v-row>

    <!-- ====== DIALOGS ====== -->

    <!-- 역할 변경 다이얼로그 -->
    <v-dialog v-model="dialog" max-width="480">
      <v-card rounded="xl">
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
    <v-dialog v-model="nicknameDialog" max-width="420">
      <v-card rounded="xl">
        <v-card-title class="text-h6">닉네임 수정</v-card-title>

        <v-card-text>
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

    <!-- 포지션 수정 다이얼로그 -->
    <v-dialog v-model="positionDialog" max-width="520">
      <v-card rounded="xl">
        <v-card-title class="text-h6">포지션 수정</v-card-title>

        <v-card-text>
          <v-autocomplete
            v-model="selectedPositions"
            :items="positions"
            item-title="name"
            item-value="name"
            variant="outlined"
            density="comfortable"
            label="Position"
            clearable
            multiple
            return-object
            :menu-props="{ maxHeight: 320 }"
          >
            <template #selection="{ item, index }">
              <v-chip
                color="primary"
                class="mr-1"
                closable
                @click:close="selectedPositions.splice(index, 1)"
              >
                {{ item.raw.name }}
              </v-chip>
            </template>
          </v-autocomplete>

          <div class="text-caption text-medium-emphasis mt-2">
            여러 개 선택 가능 / 칩에서 X로 제거 가능
          </div>
        </v-card-text>

        <v-card-actions class="justify-end">
          <v-btn variant="text" @click="positionDialog = false">취소</v-btn>
          <v-btn color="primary" :loading="positionLoading" @click="submitPosition"> 저장 </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
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
import AccountPlayerMemberDialog from '@/components/dialogs/AccountPlayerMemberDialog.vue';
import type { Position } from '@/data/types/position';

const props = defineProps<{ id: string }>();

const router = useRouter();
const route = useRoute();
const accountStore = useAccountStore();

const dialog = ref(false);
const nicknameDialog = ref(false);
const positionDialog = ref(false);
const positionLoading = ref(false);

const selectedSystemRole = ref<SystemRole | null>(null);
const systemRoleList = ref<SystemRole[]>([]);
const accountIsConfirm = ref<boolean>(false);

const positions = ref<Position[]>([]);
const selectedPositions = ref<Position[]>([]);

const playerDialog = ref(false); // 기존에 있던 것 그대로 사용한다고 가정

const account = ref<{
  datas: {
    name: string;
    nickname: string;
    email: string;
    department: string;
    systemrole: SystemRole | null;
    is_confirm: boolean;
    player?: Player | null;
  };
}>({
  datas: {
    name: '',
    nickname: '',
    email: '',
    department: '',
    systemrole: null,
    is_confirm: false,
    player: null,
  },
});

const editNickname = ref('');
const nicknameGate = ref({
  loading: false,
  checked: false,
  allowed: true,
  message: '',
});

const clone = (v: any) => JSON.parse(JSON.stringify(v));

const player = computed<Player | null>(() => account.value.datas.player ?? null);

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

async function fetchPositions() {
  try {
    const res = await api.get(`${getBaseUrl('DATA')}/position/all`);
    positions.value = res.data.datas ?? [];
  } catch (e) {
    console.error('포지션 목록 불러오기 실패:', e);
  }
}

async function fetchAccount() {
  try {
    const res = await api.get(`${getBaseUrl('DATA')}/account/find?id=${props.id}`);
    account.value = res.data;

    selectedSystemRole.value = account.value.datas.systemrole || null;
    accountIsConfirm.value = account.value.datas.is_confirm;

    // ✅ 선택된 포지션 미리 세팅
    selectedPositions.value = clone(account.value.datas.player?.positions ?? []);

    const roleRes = await api.get(`${getBaseUrl('DATA')}/systemrole/all`);
    systemRoleList.value = roleRes.data.datas;
  } catch (error) {
    console.error('계정 정보 불러오기 실패:', error);
  }
}

const canSubmitNickname = computed(() => {
  if (!editNickname.value.trim()) return false;
  if (nicknameGate.value.loading) return false;
  if (nicknameGate.value.checked && !nicknameGate.value.allowed) return false;
  return true;
});

async function openNicknameDialog() {
  editNickname.value = account.value.datas.nickname || '';
  nicknameDialog.value = true;

  nicknameGate.value.loading = true;
  nicknameGate.value.checked = false;
  nicknameGate.value.allowed = true;
  nicknameGate.value.message = '';

  try {
    const res = await api.get(`${getBaseUrl('DATA')}/account/can_nickname`, {
      params: { id: props.id },
    });

    const allowed = !!res.data?.datas;
    nicknameGate.value.allowed = allowed;
    nicknameGate.value.checked = true;

    nicknameGate.value.message = allowed
      ? '닉네임을 변경할 수 있어요.'
      : '닉네임은 30일에 한 번만 변경할 수 있어요. 다음 변경 가능 날짜를 기다려주세요.';
  } catch (e) {
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

async function submitEdit() {
  try {
    const payload = {
      id: props.id,
      systemrole_id: selectedSystemRole.value?.id,
      is_confirm: accountIsConfirm.value,
    };

    await api.post(`${getBaseUrl('DATA')}/account/update`, payload);

    account.value.datas.systemrole = selectedSystemRole.value || null;
    account.value.datas.is_confirm = accountIsConfirm.value;

    dialog.value = false;
  } catch (err) {
    console.error('계정 업데이트 실패:', err);
  }
}

function handleAdd(param: any) {
  fetchAccount();
}

function openPositionDialog() {
  selectedPositions.value = clone(account.value.datas.player?.positions ?? []);
  positionDialog.value = true;
}

async function submitPosition() {
  try {
    positionLoading.value = true;

    await api.post(`${getBaseUrl('DATA')}/player/update_position`, {
      id: account.value.datas.player?.id,
      positions: selectedPositions.value,
    });

    if (account.value.datas.player) {
      account.value.datas.player.positions = clone(selectedPositions.value);
    }

    positionDialog.value = false;
  } catch (e) {
    console.error('포지션 수정 실패:', e);
  } finally {
    positionLoading.value = false;
  }
}

onMounted(async () => {
  await fetchPositions();

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
</style>
