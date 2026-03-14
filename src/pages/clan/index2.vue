<template>
  <v-container fluid class="pa-6 dashboard">
    <!-- 헤더 -->
    <div class="d-flex align-center justify-space-between mb-4">
      <div>
        <div class="text-h5 font-weight-bold">Clan Record Dashboard</div>
        <div class="text-body-2 text-medium-emphasis">
          클랜원 전적과 승률을 한눈에 확인할 수 있는 대시보드
        </div>
      </div>
    </div>

    <!-- 요약 카드 -->
    <!-- <v-row class="mb-4">
      <v-col cols="12" sm="6" md="3">
        <v-card class="summary-card" rounded="xl" elevation="0">
          <v-card-text>
            <div class="text-caption text-medium-emphasis">클랜원 수</div>
            <div class="text-h5 font-weight-bold mt-2">{{ recordSummary.playerCount }}</div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="summary-card" rounded="xl" elevation="0">
          <v-card-text>
            <div class="text-caption text-medium-emphasis">총 경기 수</div>
            <div class="text-h5 font-weight-bold mt-2">{{ recordSummary.totalMatch }}</div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="summary-card" rounded="xl" elevation="0">
          <v-card-text>
            <div class="text-caption text-medium-emphasis">총 승</div>
            <div class="text-h5 font-weight-bold mt-2">{{ recordSummary.totalWin }}</div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="summary-card" rounded="xl" elevation="0">
          <v-card-text>
            <div class="text-caption text-medium-emphasis">총 패</div>
            <div class="text-h5 font-weight-bold mt-2">{{ recordSummary.totalLose }}</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row> -->

    <!-- 필터 바 -->
    <v-card rounded="xl" class="panel mb-4" elevation="0">
      <v-card-text>
        <div class="d-flex flex-wrap align-center" style="gap: 12px">
          <v-text-field
            v-model="search"
            label="닉네임 검색"
            density="compact"
            variant="outlined"
            hide-details
            clearable
            prepend-inner-icon="mdi-magnify"
            style="max-width: 280px"
          />

          <v-spacer />

          <v-chip variant="tonal" size="small"> 총 {{ filteredRecords.length }}명 </v-chip>
        </div>
      </v-card-text>
    </v-card>

    <!-- 전적 테이블 -->
    <v-card rounded="xl" class="panel" elevation="0">
      <v-card-title class="d-flex align-center justify-space-between">
        <div class="text-subtitle-1 font-weight-bold">클랜원 전적</div>
      </v-card-title>

      <v-divider />

      <v-data-table
        :headers="headers"
        :items="filteredRecords"
        item-value="id"
        density="comfortable"
        class="record-table"
      >
        <template #item.player="{ item }">
          <div
            class="d-flex align-center"
            style="gap: 10px; cursor: pointer"
            @click="openPlayer(item)"
          >
            <v-avatar size="32" :color="avatarColor(item.nickname)">
              <span class="text-caption font-weight-bold text-white">
                {{ initials(item.nickname) }}
              </span>
            </v-avatar>

            <div>
              <div class="font-weight-medium">
                {{ item.nickname }}
                <span class="text-medium-emphasis" v-if="item.tagname">#{{ item.tagname }}</span>
              </div>
              <div class="text-caption text-medium-emphasis">
                {{ item.tierName ?? 'Unranked' }}
              </div>
            </div>
          </div>
        </template>

        <template #item.point="{ item }">
          <v-chip size="small" variant="tonal">P {{ item.point }}</v-chip>
        </template>

        <template #item.winRate="{ item }">
          <v-chip
            size="small"
            variant="tonal"
            :color="item.winRate >= 60 ? 'success' : item.winRate >= 50 ? 'warning' : 'error'"
          >
            {{ item.winRate }}%
          </v-chip>
        </template>

        <template #no-data>
          <div class="pa-6 text-center text-medium-emphasis">표시할 전적 데이터가 없습니다.</div>
        </template>

        <template #item.cup_count="{ item }">
          <div class="award-stat">
            <v-icon
              size="40"
              class="award-icon"
              :class="item.cup_count > 0 ? 'trophy-float trophy-on' : 'award-off'"
            >
              mdi-trophy
            </v-icon>
            <span>{{ item.cup_count }}</span>
          </div>
        </template>

        <template #item.sub_cup_count="{ item }">
          <div class="award-stat award-stat--minor">
            <v-icon
              size="25"
              class="award-icon"
              :class="item.sub_cup_count > 0 ? 'medal-pulse medal-on' : 'award-off'"
            >
              mdi-medal
            </v-icon>
            <span>{{ item.sub_cup_count }}</span>
          </div>
        </template>
      </v-data-table>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useAccountStore } from '@/stores/useAccountStore';
import api from '@/@core/composable/useAxios';
import { getBaseUrl } from '@/@core/composable/createUrl';

type PlayerRecord = {
  id: number;
  nickname: string;
  tagname?: string;
  totalMatchCount: number;
  winCount: number;
  loseCount: number;
  winRate: number;
  point: number;
  tierName?: string;
  cup_count: number;
  sub_cup_count: number;
};

const account = useAccountStore();
const loading = ref(false);

const search = ref('');
const sortKey = ref('totalMatchCount');

const sortOptions = [
  { label: '승률순', value: 'winRate' },
  { label: '총전순', value: 'totalMatchCount' },
  { label: '승리순', value: 'winCount' },
  { label: '포인트순', value: 'point' },
  { label: '닉네임순', value: 'nickname' },
];

const headers = [
  { title: '플레이어', key: 'player', sortable: false },
  { title: 'Point', key: 'point', align: 'center' as const },
  { title: '총전', key: 'totalMatchCount', align: 'center' as const },
  { title: '승', key: 'winCount', align: 'center' as const },
  { title: '패', key: 'loseCount', align: 'center' as const },
  { title: '승률', key: 'winRate', align: 'center' as const },
  { title: '난전 우승', key: 'cup_count', align: 'center' as const },
  { title: '경매내전 우승', key: 'sub_cup_count', align: 'center' as const },
];

const recordList = ref<PlayerRecord[]>([]);

debugger;
const recordSummary = computed(() => ({
  playerCount: recordList.value.length,
  totalMatch: recordList.value.reduce((acc, p) => acc + p.totalMatchCount, 0),
  totalWin: recordList.value.reduce((acc, p) => acc + p.winCount, 0),
  totalLose: recordList.value.reduce((acc, p) => acc + p.loseCount, 0),
}));

const filteredRecords = computed(() => {
  const keyword = search.value.trim().toLowerCase();

  let rows = recordList.value.filter((p) => {
    if (!keyword) return true;
    return (
      p.nickname.toLowerCase().includes(keyword) ||
      (p.tagname ?? '').toLowerCase().includes(keyword)
    );
  });

  rows = [...rows].sort((a, b) => {
    switch (sortKey.value) {
      case 'nickname':
        return a.nickname.localeCompare(b.nickname);
      case 'point':
        return b.point - a.point;
      case 'totalMatchCount':
        return b.totalMatchCount - a.totalMatchCount;
      case 'winCount':
        return b.winCount - a.winCount;
      case 'winRate':
      default:
        return b.winRate - a.winRate;
    }
  });

  return rows;
});

function openPlayer(p: { nickname: string; tagname?: string }) {
  if (!p.nickname || !p.tagname) return;
  const encoded = encodeURIComponent(`${p.nickname}-${p.tagname}`);
  window.open(`https://www.op.gg/summoners/kr/${encoded}`, '_blank', 'noopener,noreferrer');
}

function initials(name?: string) {
  if (!name) return '?';
  return name.trim().slice(0, 2).toUpperCase();
}

const avatarPalette = ['#7C4DFF', '#00BFA5', '#FF5252', '#40C4FF', '#FFAB40', '#69F0AE'];
function avatarColor(name: string) {
  const code = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return avatarPalette[code % avatarPalette.length];
}

async function fetchPlayerRecords() {
  loading.value = true;
  try {
    // 나중에 실제 API 붙일 때
    const clanId = account.clan?.id;
    if (!clanId) return;
    const res = await api.get(`${getBaseUrl('DATA')}/Clan/dashboard_3`, {
      params: { clan_id: clanId },
    });
    debugger;
    recordList.value = res.data?.datas ?? [];
  } finally {
    loading.value = false;
  }
}

onMounted(fetchPlayerRecords);
</script>

<style scoped>
.dashboard {
  background: #0f1115;
  min-height: calc(100vh - 64px);
}

.panel,
.summary-card {
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(255, 255, 255, 0.03);
}

.award-stat {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-weight: 700;
}

.award-stat--major .award-icon {
  color: #ffca28;
  filter: drop-shadow(0 0 6px rgba(255, 202, 40, 0.35));
}

.award-stat--minor .award-icon {
  color: #90caf9;
  filter: drop-shadow(0 0 6px rgba(144, 202, 249, 0.25));
}

.trophy-float {
  animation: trophyFloat 1.8s ease-in-out infinite;
}

.medal-pulse {
  animation: medalPulse 1.8s ease-in-out infinite;
}

.trophy-on {
  color: #ffca28;
  filter: drop-shadow(0 0 6px rgba(255, 202, 40, 0.35));
}
.award-off {
  color: #666;
  opacity: 0.5;
}

.medal-on {
  color: #90caf9;
  filter: drop-shadow(0 0 6px rgba(144, 202, 249, 0.25));
}

.award-off {
  color: #666;
  opacity: 0.4;
}

@keyframes trophyFloat {
  0% {
    transform: translateY(0);
    opacity: 0.9;
  }
  50% {
    transform: translateY(-3px);
    opacity: 1;
  }
  100% {
    transform: translateY(0);
    opacity: 0.9;
  }
}

@keyframes medalPulse {
  0% {
    transform: scale(1);
    opacity: 0.8;
  }
  50% {
    transform: scale(1.12);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 0.8;
  }
}
</style>
