<template>
  <v-container fluid class="pa-6 dashboard">
    <!-- 헤더 -->
    <div class="d-flex align-center justify-space-between mb-4">
      <div>
        <div class="text-h5 font-weight-bold">Clan Dashboard</div>
        <div class="text-body-2 text-medium-emphasis">
          이번 시즌 기준, 매치 참여 TOP 플레이어 + 우승 기록
        </div>
      </div>

      <v-btn variant="tonal" prepend-icon="mdi-refresh" @click="fetchTopPlayers" :loading="loading">
        새로고침
      </v-btn>
    </div>

    <!-- TOP 3 -->
    <v-row>
      <v-col v-for="(p, idx) in top3" :key="p.id" cols="12" md="4">
        <v-card class="top-card" rounded="xl" elevation="0">
          <div class="top-card__bg" />

          <v-card-text class="pa-5">
            <div class="d-flex align-center justify-space-between">
              <div class="d-flex align-center" style="gap: 12px">
                <v-avatar size="44" :color="avatarColor(p.nickname)">
                  <span class="text-subtitle-1 font-weight-bold text-white">
                    {{ initials(p.nickname) }}
                  </span>
                </v-avatar>

                <div>
                  <div class="text-subtitle-1 font-weight-bold">
                    {{ p.nickname }}
                    <span class="text-medium-emphasis" v-if="p.tagname">#{{ p.tagname }}</span>
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    {{ p.tierName ?? 'Unranked' }}
                  </div>
                </div>
              </div>

              <v-chip :color="rankColor(idx)" variant="flat" size="small" class="font-weight-bold">
                {{ rankLabel(idx) }}
              </v-chip>
            </div>

            <v-divider class="my-4" />

            <!-- 핵심 지표 3개 -->
            <div class="d-flex align-center justify-space-between">
              <div class="text-body-2 text-medium-emphasis">매치 참여</div>
              <div class="text-h6 font-weight-bold">{{ p.matchCount }}</div>
            </div>

            <div class="mt-2 d-flex align-center justify-space-between">
              <div class="text-body-2 text-medium-emphasis">멸망전 우승</div>
              <div class="text-subtitle-1 font-weight-bold">{{ p.cupWins }}</div>
            </div>

            <div class="mt-2 d-flex align-center justify-space-between">
              <div class="text-body-2 text-medium-emphasis">컵 우승</div>
              <div class="text-subtitle-1 font-weight-bold">{{ p.subCupWins }}</div>
            </div>

            <!-- 포지션 -->
            <div class="mt-3 d-flex flex-wrap" style="gap: 6px">
              <v-chip v-for="pos in p.positions" :key="pos" size="x-small" variant="tonal">
                {{ pos }}
              </v-chip>
              <v-chip v-if="!p.positions?.length" size="x-small" variant="tonal">
                No positions
              </v-chip>
            </div>

            <div class="mt-4 d-flex justify-end">
              <v-btn variant="text" prepend-icon="mdi-account" @click="openPlayer(p)"> 상세 </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- 아래 섹션 -->
    <v-row class="mt-2">
      <v-col cols="12" md="7">
        <v-card rounded="xl" class="panel" elevation="0">
          <v-card-title class="d-flex align-center justify-space-between">
            <div class="text-subtitle-1 font-weight-bold">Top 참여 랭킹</div>
            <v-chip size="small" variant="tonal">클랜 기준</v-chip>
          </v-card-title>

          <v-divider />

          <v-card-text class="pa-0">
            <v-list lines="two" density="comfortable">
              <v-list-item v-for="(p, i) in topRankList" :key="p.id" @click="openPlayer(p)">
                <template #prepend>
                  <v-avatar size="34" :color="avatarColor(p.nickname)">
                    <span class="text-caption font-weight-bold text-white">
                      {{ initials(p.nickname) }}
                    </span>
                  </v-avatar>
                </template>

                <v-list-item-title class="font-weight-medium">
                  {{ i + 1 }}. {{ p.nickname }}
                  <span class="text-medium-emphasis" v-if="p.tagname">#{{ p.tagname }}</span>
                </v-list-item-title>

                <v-list-item-subtitle class="text-medium-emphasis">
                  참여 {{ p.matchCount }}회 · Point {{ p.point }}
                  <span class="mx-1">·</span>
                  {{ p.tierName ?? 'Unranked' }}
                </v-list-item-subtitle>

                <template #append>
                  <v-chip size="small" variant="tonal">P {{ p.point }}</v-chip>
                  <v-icon class="ml-2" icon="mdi-chevron-right" />
                </template>
              </v-list-item>

              <v-list-item v-if="!topList.length && !loading">
                <v-list-item-title class="text-medium-emphasis">데이터가 없어.</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- <v-col cols="12" md="5">
        <v-card rounded="xl" class="panel" elevation="0">
          <v-card-title class="text-subtitle-1 font-weight-bold">요약</v-card-title>
          <v-divider />
          <v-card-text>
            <div class="d-flex align-center justify-space-between mb-2">
              <div class="text-body-2 text-medium-emphasis">활성 플레이어</div>
              <div class="text-subtitle-1 font-weight-bold">{{ summary.activePlayers }}</div>
            </div>

            <div class="d-flex align-center justify-space-between mb-2">
              <div class="text-body-2 text-medium-emphasis">총 매치 참여(합)</div>
              <div class="text-subtitle-1 font-weight-bold">{{ summary.totalMatches }}</div>
            </div>

            <div class="d-flex align-center justify-space-between mb-2">
              <div class="text-body-2 text-medium-emphasis">총 멸망전 우승(합)</div>
              <div class="text-subtitle-1 font-weight-bold">{{ summary.totalCupWins }}</div>
            </div>

            <div class="d-flex align-center justify-space-between">
              <div class="text-body-2 text-medium-emphasis">총 컵 우승(합)</div>
              <div class="text-subtitle-1 font-weight-bold">{{ summary.totalSubCupWins }}</div>
            </div>

            <v-alert class="mt-4" type="info" variant="tonal" density="compact">
              “매치 참여”는 match_member 기준 집계로 가정했고, 우승은 player.cup_count /
              player.sub_cup_count 기준으로 표시했어.
            </v-alert>
          </v-card-text>
        </v-card>
      </v-col> -->
    </v-row>

    <!-- 확인용 다이얼로그(샘플) -->
    <v-dialog v-model="playerDialog" max-width="420">
      <v-card rounded="xl">
        <v-card-title class="text-h6 font-weight-bold">플레이어</v-card-title>
        <v-card-text class="text-body-2 text-medium-emphasis">
          {{ selectedPlayer?.nickname }}#{{ selectedPlayer?.tagname }} 상세로 이동(또는 다이얼로그
          내용 구성)
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn variant="text" @click="playerDialog = false">닫기</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import api from '@/@core/composable/useAxios';
import { getBaseUrl } from '@/@core/composable/createUrl';
import { useAccountStore } from '@/stores/useAccountStore';

type TopPlayer = {
  id: number;
  nickname: string;
  tagname?: string;

  matchCount: number; // match_enter_count
  cupWins: number; // cup_count (멸망전 우승)
  subCupWins: number; // sub_cup_count (컵 우승)

  point: number; // ✅ 추가
  tierName?: string; // tier or tier_name
  positions: string[]; // 없으면 []
};

const account = useAccountStore();
const loading = ref(false);

// ✅ TOP3 카드/요약용 (dashboard_1 결과)
const topList = ref<TopPlayer[]>([]);

// ✅ Top 참여 랭킹 리스트용 (dashboard_2 결과)
const topRankList = ref<TopPlayer[]>([]);

const top3 = computed(() => topList.value.slice(0, 3));

const summary = computed(() => {
  const activePlayers = topList.value.length;
  const totalMatches = topList.value.reduce((acc, p) => acc + (p.matchCount ?? 0), 0);
  const totalCupWins = topList.value.reduce((acc, p) => acc + (p.cupWins ?? 0), 0);
  const totalSubCupWins = topList.value.reduce((acc, p) => acc + (p.subCupWins ?? 0), 0);
  return { activePlayers, totalMatches, totalCupWins, totalSubCupWins };
});

const playerDialog = ref(false);
const selectedPlayer = ref<TopPlayer | null>(null);

function openPlayer(p: TopPlayer) {
  if (!p.nickname || !p.tagname) {
    console.warn('닉네임 또는 태그가 없습니다.');
    return;
  }

  const region = 'kr'; // 고정이면 OK, 나중에 확장 가능
  const riotId = `${p.nickname}-${p.tagname}`;
  const encoded = encodeURIComponent(riotId);

  const url = `https://www.op.gg/summoners/${region}/${encoded}`;

  window.open(url, '_blank', 'noopener,noreferrer');
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

function rankLabel(idx: number) {
  return idx === 0 ? '1st' : idx === 1 ? '2nd' : '3rd';
}
function rankColor(idx: number) {
  return idx === 0 ? 'amber' : idx === 1 ? 'blue-grey' : 'deep-orange';
}

/**
 * 서버 row -> TopPlayer 매핑
 * - dashboard_1: 대체로 cup_count/sub_cup_count까지 내려옴
 * - dashboard_2: nickname이 "닉#태그"로 내려오니 분해해줌
 */
function splitNickTag(n: string): { nick: string; tag?: string } {
  const s = (n ?? '').toString();
  const idx = s.lastIndexOf('#');
  if (idx > 0) return { nick: s.slice(0, idx), tag: s.slice(idx + 1) };
  return { nick: s, tag: undefined };
}

function mapRow(row: any): TopPlayer {
  let nickname = row.nickname ?? '';
  let tagname = row.tagname ?? '';

  if (nickname && !tagname && nickname.includes('#')) {
    const sp = splitNickTag(nickname);
    nickname = sp.nick;
    tagname = sp.tag;
  }

  return {
    id: Number(row.id),
    nickname,
    tagname,

    matchCount: Number(row.match_enter_count ?? row.matchCount ?? 0),
    cupWins: Number(row.cup_count ?? row.cupWins ?? 0),
    subCupWins: Number(row.sub_cup_count ?? row.subCupWins ?? 0),

    point: Number(row.point ?? 0), // ✅ 추가

    tierName: row.tier_name ?? row.tierName ?? row.tier ?? undefined,
    positions: row.positions ?? [],
  };
}

/** ✅ dashboard_1: TOP3 (우승 기록 포함) */
async function fetchDashboard1() {
  const clanId = account.clan?.id;
  if (!clanId) return;

  const res = await api.get(`${getBaseUrl('DATA')}/Clan/dashboard_1`, {
    params: { clan_id: clanId },
  });

  const rows = res.data?.datas ?? [];
  topList.value = rows.map(mapRow);
}

/** ✅ dashboard_2: Top 참여 랭킹(전체) */
async function fetchDashboard2() {
  const clanId = account.clan?.id;
  if (!clanId) return;

  const res = await api.get(`${getBaseUrl('DATA')}/Clan/dashboard_2`, {
    params: { clan_id: clanId },
  });

  const rows = res.data?.datas ?? [];
  topRankList.value = rows.map(mapRow);
}

/** 새로고침 버튼에서 둘 다 호출 */
async function fetchTopPlayers() {
  loading.value = true;
  try {
    await Promise.all([fetchDashboard1(), fetchDashboard2()]);
  } catch (e) {
    console.error('대시보드 로딩 실패', e);
    topList.value = [];
    topRankList.value = [];
  } finally {
    loading.value = false;
  }
}

onMounted(fetchTopPlayers);
</script>

<style scoped>
.dashboard {
  background: #0f1115;
  min-height: calc(100vh - 64px);
}

.top-card {
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(255, 255, 255, 0.04);
}

.top-card__bg {
  position: absolute;
  inset: 0;
  background: radial-gradient(800px 240px at 20% 0%, rgba(124, 77, 255, 0.18), transparent 60%),
    radial-gradient(800px 240px at 80% 0%, rgba(0, 191, 165, 0.14), transparent 60%);
  pointer-events: none;
}

.panel {
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(255, 255, 255, 0.03);
}
</style>
