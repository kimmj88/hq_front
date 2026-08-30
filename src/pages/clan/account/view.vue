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
          <!-- <v-chip
            :color="account.datas.is_confirm ? 'green' : 'orange'"
            text-color="white"
            size="small"
            variant="flat"
          >
            {{ account.datas.is_confirm ? '승인됨' : '승인대기' }}
          </v-chip> -->
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
        <v-btn
          v-if="player"
          color="primary"
          variant="tonal"
          prepend-icon="mdi-chart-timeline-variant"
          @click="openActivityDialog"
        >
          활동 기록
        </v-btn>
      </v-col>

      <v-col cols="12" md="6" class="d-flex justify-end" style="gap: 8px">
        <v-btn
          v-if="isClanMaster"
          color="warning"
          variant="outlined"
          prepend-icon="mdi-crown-outline"
          @click="openTransferMasterDialog"
        >
          마스터 변경
        </v-btn>
        <!-- <v-btn color="primary" variant="tonal" @click="submitEdit"> 저장 </v-btn> -->
        <!-- <v-btn color="secondary" variant="text" @click="router.push('/config/account')">
          뒤로
        </v-btn> -->
      </v-col>
    </v-row>
  </v-card>

  <v-dialog v-model="activityDialog" max-width="820" scrollable>
    <v-card class="activity-dialog" rounded="xl">
      <v-card-title class="activity-dialog-head">
        <div>
          <span class="activity-kicker">PLAYER ACTIVITY</span>
          <h2>
            {{ activityData?.player.nickname || player?.nickname || account.datas.nickname }}
            <small v-if="activityData?.player.tagname || player?.tagname">
              #{{ activityData?.player.tagname || player?.tagname }}
            </small>
          </h2>
        </div>
        <v-btn icon="mdi-close" variant="text" @click="activityDialog = false" />
      </v-card-title>

      <v-card-text>
        <div class="activity-category-grid">
          <button
            v-for="category in activityCategories"
            :key="category.key"
            type="button"
            class="activity-category"
            :class="{ active: selectedActivityCategory === category.key }"
            @click="selectedActivityCategory = category.key"
          >
            <v-icon :color="category.color">{{ category.icon }}</v-icon>
            <span>{{ category.label }}</span>
            <strong>{{ activityData?.counts[category.key] ?? 0 }}회</strong>
          </button>
        </div>

        <div class="activity-history-head">
          <strong>{{ selectedActivityLabel }} 기록</strong>
          <span>최신순</span>
        </div>

        <v-list v-if="filteredActivityEvents.length" class="activity-history-list" lines="two">
          <v-list-item v-for="event in filteredActivityEvents" :key="`${event.category}-${event.id}`">
            <template #prepend>
              <v-avatar size="40" :color="activityCategoryColor(event.category)" variant="tonal">
                <v-icon size="20">{{ activityCategoryIcon(event.category) }}</v-icon>
              </v-avatar>
            </template>
            <v-list-item-title class="font-weight-medium">{{ event.title }}</v-list-item-title>
            <v-list-item-subtitle>
              {{ activityCategoryLabel(event.category) }} · {{ formatActivityDate(event.occurredAt) }}
            </v-list-item-subtitle>
          </v-list-item>
        </v-list>

        <div v-else-if="activityLoading" class="activity-empty">
          <v-progress-circular indeterminate color="primary" />
          <span>활동 기록을 불러오고 있습니다.</span>
        </div>
        <div v-else class="activity-empty">
          <v-icon size="44" color="grey">mdi-history</v-icon>
          <strong>해당 활동 기록이 없습니다.</strong>
        </div>
      </v-card-text>

      <v-card-actions class="px-6 pb-5 justify-end">
        <v-btn variant="tonal" prepend-icon="mdi-open-in-new" :disabled="!activityData" @click="openFow">
          FOW.LOL
        </v-btn>
        <v-btn color="primary" @click="activityDialog = false">확인</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- 닉네임 변경 다이얼로그 -->
  <v-dialog v-model="nicknameDialog" max-width="400">
    <v-card>
      <v-card-title class="text-h6">닉네임 수정</v-card-title>
      <v-card-text>
        <v-text-field
          v-model="editNickname"
          label="새 닉네임"
          maxlength="20"
          counter="20"
          autocomplete="off"
        />
      </v-card-text>
      <v-card-actions class="justify-end">
        <v-btn variant="text" @click="nicknameDialog = false">취소</v-btn>
        <v-btn color="primary" :disabled="!editNickname.trim()" @click="submitNickname">
          저장
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="transferMasterDialog" max-width="420">
    <v-card>
      <v-card-title class="text-h6"> 마스터 변경 </v-card-title>

      <v-card-text class="text-body-2 text-medium-emphasis">
        정말로 이 계정을 <b>클랜 마스터</b>로 변경하시겠습니까?<br />
        기존 마스터는 일반 멤버로 변경됩니다.
      </v-card-text>

      <v-card-actions class="justify-end">
        <v-btn variant="text" @click="transferMasterDialog = false"> 취소 </v-btn>
        <v-btn color="warning" @click="confirmTransferMaster"> 확인 </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-snackbar v-model="snack.show" :timeout="2200">{{ snack.msg }}</v-snackbar>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '@/@core/composable/useAxios';
import { getBaseUrl } from '@/@core/composable/createUrl';
import { can } from '@/stores/useClanPermissionStore';
import type { Player } from '@/data/types/player';
import type { ClanRole } from '@/data/types/clanrole';
import { useAccountStore } from '@/stores/useAccountStore';
import { CLAN_PATH } from '@/router/clan/type';

const route = useRoute();
const router = useRouter();

const accountStore = useAccountStore();

type ActivityCategory = 'DUO_RANK' | 'FLEX_RANK' | 'NORMAL' | 'MATCH' | 'CUP' | 'AUCTION';
type PlayerActivity = {
  player: { id: number; nickname: string; tagname: string; accountId: number };
  counts: Record<ActivityCategory, number>;
  events: Array<{ category: ActivityCategory; id: number; title: string; occurredAt: string }>;
};

const isClanMaster = computed(() => accountStore.isClanMaster);

const snack = ref({ show: false, msg: '' });
function toast(msg: string) {
  snack.value.msg = msg;
  snack.value.show = true;
}

const props = defineProps<{ id: string }>();

const activityDialog = ref(false);
const activityLoading = ref(false);
const activityData = ref<PlayerActivity | null>(null);
const selectedActivityCategory = ref<'ALL' | ActivityCategory>('ALL');
const activityCategories = [
  { key: 'DUO_RANK' as const, label: '듀오랭크', icon: 'mdi-account-multiple', color: 'indigo-lighten-1' },
  { key: 'FLEX_RANK' as const, label: '자유랭크', icon: 'mdi-account-group', color: 'blue-lighten-1' },
  { key: 'NORMAL' as const, label: '일반게임', icon: 'mdi-gamepad-variant-outline', color: 'teal-lighten-1' },
  { key: 'MATCH' as const, label: '내전 매치', icon: 'mdi-sword-cross', color: 'red-lighten-1' },
  { key: 'CUP' as const, label: '내전 컵', icon: 'mdi-trophy-outline', color: 'amber' },
  { key: 'AUCTION' as const, label: '경매내전', icon: 'mdi-gavel', color: 'deep-purple-lighten-2' },
];
const filteredActivityEvents = computed(() => {
  const events = activityData.value?.events ?? [];
  return selectedActivityCategory.value === 'ALL'
    ? events
    : events.filter((event) => event.category === selectedActivityCategory.value);
});
const selectedActivityLabel = computed(() =>
  selectedActivityCategory.value === 'ALL'
    ? '전체 활동'
    : activityCategoryLabel(selectedActivityCategory.value),
);

const selectedSystemRole = ref<ClanRole | null>(null);

const account = ref<{
  datas: {
    name: string;
    nickname: string; // 🔹 추가
    email: string;
    department: string;
    clanrole: ClanRole | null;
    is_confirm: boolean;
    player?: Player | null;
  };
}>({
  datas: {
    name: '',
    nickname: '', // 🔹 추가
    email: '',
    department: '',
    clanrole: null,
    is_confirm: false,
    player: null,
  },
});

const transferMasterDialog = ref(false);

function openTransferMasterDialog() {
  transferMasterDialog.value = true;
}

async function confirmTransferMaster() {
  try {
    await api.post(`${getBaseUrl('DATA')}/clan/change_master`, {
      before_master: accountStore.id,
      after_master: props.id,
    });

    toast('마스터가 변경되었습니다.');
    transferMasterDialog.value = false;
    router.push(CLAN_PATH.NOTICE(accountStore.clan.name));
  } catch (e) {
    console.error(e);
    toast('마스터 변경 중 오류가 발생했습니다.');
  }
}

const nicknameDialog = ref(false);
const editNickname = ref('');

function openNicknameDialog() {
  editNickname.value = account.value.datas.nickname || '';
  nicknameDialog.value = true;
}

async function submitNickname() {
  if (!editNickname.value.trim()) return;

  try {
    await api.post(`${getBaseUrl('DATA')}/account/update`, {
      id: props.id,
      nickname: editNickname.value.trim(),
    });

    // 로컬 상태 반영
    account.value.datas.nickname = editNickname.value.trim();
    nicknameDialog.value = false;
  } catch (error) {
    console.error('닉네임 수정 실패:', error);
  }
}

const player = computed<Player | null>(() => account.value.datas.player ?? null);

async function openActivityDialog() {
  if (!player.value?.id || !accountStore.clan?.id) return;
  activityDialog.value = true;
  activityLoading.value = true;
  activityData.value = null;
  selectedActivityCategory.value = 'ALL';
  try {
    const response = await api.get(`${getBaseUrl('DATA')}/Clan/dashboard_player_activity`, {
      params: { clan_id: accountStore.clan.id, player_id: player.value.id },
    });
    activityData.value = response.data?.datas ?? null;
  } catch (error) {
    console.error('플레이어 활동 기록을 불러오지 못했습니다.', error);
    toast('활동 기록을 불러오지 못했습니다.');
  } finally {
    activityLoading.value = false;
  }
}

function activityCategoryLabel(category: ActivityCategory) {
  return activityCategories.find((item) => item.key === category)?.label ?? category;
}
function activityCategoryIcon(category: ActivityCategory) {
  return activityCategories.find((item) => item.key === category)?.icon ?? 'mdi-history';
}
function activityCategoryColor(category: ActivityCategory) {
  return activityCategories.find((item) => item.key === category)?.color ?? 'primary';
}
function formatActivityDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}
function openFow() {
  const target = activityData.value?.player;
  if (!target?.nickname || !target.tagname) return;
  const nickname = target.nickname.replace(/#.*/, '');
  window.open(
    `https://www.fow.lol/find/kr/${encodeURIComponent(`${nickname}-${target.tagname}`)}?hl=ko_KR`,
    '_blank',
    'noopener,noreferrer',
  );
}

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

    selectedSystemRole.value = account.value.datas.clanrole || null;
  } catch (error) {
    console.error('계정 정보 불러오기 실패:', error);
  }
}

onMounted(async () => {
  if (can('ACCOUNT', 'CLAN-SET-ACC-R') == true) {
    await fetchAccount();
  } else {
    router.push('/forbidden');
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

.activity-dialog { border: 1px solid rgba(139, 92, 246, .24); background: #151922; }
.activity-dialog-head { display: flex; align-items: center; justify-content: space-between; padding: 22px 24px 12px; }
.activity-kicker { color: #a78bfa; font-size: .68rem; font-weight: 900; letter-spacing: .12em; }
.activity-dialog-head h2 { margin: 3px 0 0; font-size: 1.35rem; }
.activity-dialog-head h2 small { color: rgba(226, 232, 240, .48); font-size: .82rem; }
.activity-category-grid { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 9px; margin-bottom: 24px; }
.activity-category { display: flex; min-width: 0; min-height: 104px; align-items: center; justify-content: center; gap: 4px; border: 1px solid rgba(148, 163, 184, .13); border-radius: 15px; color: rgba(248, 250, 252, .84); background: rgba(255, 255, 255, .025); cursor: pointer; flex-direction: column; transition: border-color .18s ease, background .18s ease, transform .18s ease; }
.activity-category:hover { transform: translateY(-2px); }
.activity-category:hover, .activity-category.active { border-color: rgba(139, 92, 246, .6); background: rgba(139, 92, 246, .12); }
.activity-category span { overflow: hidden; max-width: 100%; color: rgba(226, 232, 240, .58); font-size: .7rem; text-overflow: ellipsis; white-space: nowrap; }
.activity-category strong { font-size: 1.05rem; }
.activity-history-head { display: flex; align-items: center; justify-content: space-between; padding: 0 4px 10px; }
.activity-history-head strong { font-size: .86rem; }
.activity-history-head span { color: rgba(226, 232, 240, .42); font-size: .7rem; }
.activity-history-list { max-height: 350px; overflow-y: auto; border-top: 1px solid rgba(148, 163, 184, .1); background: transparent; }
.activity-history-list :deep(.v-list-item) { border-bottom: 1px solid rgba(148, 163, 184, .08); }
.activity-empty { display: flex; min-height: 190px; align-items: center; justify-content: center; gap: 10px; color: rgba(226, 232, 240, .55); flex-direction: column; }
@media (max-width: 700px) {
  .activity-category-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .activity-category { min-height: 84px; }
}
</style>
