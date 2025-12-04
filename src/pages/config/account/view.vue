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

        <div class="mt-3 text-h6 font-weight-medium">
          {{ account.datas.nickname || '-' }}
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
        <v-switch
          v-model="accountIsConfirm"
          color="success"
          inset
          hide-details
          :label="accountIsConfirm ? '플레이어 승인됨' : '플레이어 승인대기'"
        />
        <span class="text-caption text-medium-emphasis">
          승인 시 해당 계정으로 로그인할 수 있습니다.
        </span>
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
        <v-btn color="primary" variant="tonal" @click="submitEdit"> 저장 </v-btn>
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
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/@core/composable/useAxios';
import { getBaseUrl } from '@/@core/composable/createUrl';
import { can } from '@/stores/usePermissionStore';
import type { SystemRole } from '@/data/types/systemrole';
import type { Player } from '@/data/types/player';

const props = defineProps<{ id: string }>();

const router = useRouter();

const dialog = ref(false);
const selectedSystemRole = ref<SystemRole | null>(null);
const systemRoleList = ref<SystemRole[]>([]);
const accountIsConfirm = ref<boolean>(false);

const account = ref<{
  datas: {
    name: string;
    email: string;
    department: string;
    systemrole: SystemRole | null;
    is_confirm: boolean;
    player?: Player | null;
  };
}>({
  datas: {
    name: '',
    email: '',
    department: '',
    systemrole: null,
    is_confirm: false,
    player: null,
  },
});

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

onMounted(fetchAccount);
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
