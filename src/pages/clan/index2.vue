<template>
  <v-container fluid class="clan-dashboard pa-4 pa-md-7">
    <section class="dashboard-hero mb-5">
      <div>
        <div class="hero-eyebrow">CLAN DASHBOARD</div>
        <h1>{{ account.clan.name }}</h1>
        <p>클랜의 내전 기록과 멤버 활동을 한눈에 확인하세요.</p>
      </div>
      <div class="hero-actions">
        <v-chip color="primary" variant="tonal" prepend-icon="mdi-shield-account-outline">
          {{ account.clanrole.name }}
        </v-chip>
        <v-btn
          icon="mdi-refresh"
          variant="tonal"
          color="primary"
          :loading="loading"
          aria-label="대시보드 새로고침"
          @click="fetchDashboard"
        />
      </div>
    </section>

    <v-row class="mb-2" dense>
      <v-col v-for="card in summaryCards" :key="card.label" cols="12" sm="6" xl="3">
        <v-card class="summary-card" rounded="xl" elevation="0">
          <div class="summary-icon" :style="{ '--card-rgb': card.rgb }">
            <v-icon size="25">{{ card.icon }}</v-icon>
          </div>
          <div class="summary-copy">
            <span>{{ card.label }}</span>
            <strong>{{ card.value }}</strong>
            <small>{{ card.caption }}</small>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mb-2" dense>
      <v-col cols="12" lg="7">
        <v-card class="dashboard-panel h-100" rounded="xl" elevation="0">
          <div class="panel-head">
            <div>
              <span class="panel-kicker">HALL OF FAME</span>
              <h2>우승 리더</h2>
            </div>
            <v-icon color="amber" size="28">mdi-trophy-variant-outline</v-icon>
          </div>

          <div v-if="winnerLeaders.length" class="winner-grid">
            <button
              v-for="(player, index) in winnerLeaders"
              :key="player.id"
              class="winner-card"
              type="button"
              @click="openPlayer(player)"
            >
              <span class="winner-rank">{{ index + 1 }}</span>
              <v-avatar size="52" :color="avatarColor(player.nickname)">
                <span class="font-weight-black text-white">{{ initials(player.nickname) }}</span>
              </v-avatar>
              <div class="winner-info">
                <strong>{{ player.nickname }}</strong>
                <span>{{ player.tier || '클랜 티어 미지정' }}</span>
              </div>
              <div class="winner-awards">
                <span><v-icon size="17" color="amber">mdi-trophy</v-icon>{{ player.cup_count }}</span>
                <span><v-icon size="17" color="deep-purple-lighten-2">mdi-gavel</v-icon>{{ player.sub_cup_count }}</span>
              </div>
            </button>
          </div>
          <div v-else class="empty-state">아직 우승 기록이 없습니다.</div>
        </v-card>
      </v-col>

      <v-col cols="12" lg="5">
        <v-card class="dashboard-panel h-100" rounded="xl" elevation="0">
          <div class="panel-head">
            <div>
              <span class="panel-kicker">WIN RANKING</span>
              <h2>우승 순위</h2>
            </div>
            <v-icon color="cyan-lighten-2" size="28">mdi-lightning-bolt-outline</v-icon>
          </div>
          <div class="activity-list">
            <div v-for="(player, index) in winRanking" :key="player.id" class="activity-row">
              <span class="activity-rank">{{ index + 4 }}</span>
              <div class="activity-name"><strong>{{ player.nickname }}</strong><small>{{ player.tierName || '-' }}</small></div>
              <div class="ranking-awards">
                <span><v-icon size="15" color="amber">mdi-trophy</v-icon>{{ player.cup_count }}</span>
                <span><v-icon size="15" color="deep-purple-lighten-2">mdi-gavel</v-icon>{{ player.sub_cup_count }}</span>
              </div>
            </div>
          </div>
          <div v-if="!winRanking.length" class="empty-state">우승 기록이 없습니다.</div>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mb-2" dense>
      <v-col cols="12" lg="8">
        <v-card class="dashboard-panel" rounded="xl" elevation="0">
          <div class="panel-head panel-head--responsive">
            <div>
              <span class="panel-kicker">MEMBER RECORDS</span>
              <h2>클랜원 내전 전적</h2>
            </div>
            <v-text-field
              v-model="search"
              label="플레이어 검색"
              density="compact"
              variant="outlined"
              hide-details
              clearable
              prepend-inner-icon="mdi-magnify"
              class="member-search"
              @keyup.enter="openFirstSearchResult"
            />
          </div>

          <v-data-table
            :headers="headers"
            :items="filteredRecords"
            :loading="loading"
            :items-per-page="8"
            item-value="id"
            density="comfortable"
            class="record-table"
          >
            <template #item.player="{ item }">
              <button class="player-link" type="button" @click="openActivity(item)">
                <v-avatar size="34" :color="avatarColor(item.nickname)">
                  <span class="text-caption font-weight-black text-white">{{ initials(item.nickname) }}</span>
                </v-avatar>
                <span><strong>{{ item.nickname }}</strong><small>{{ item.tierName || 'UNRANK' }}</small></span>
              </button>
            </template>
            <template #item.winRate="{ item }">
              <v-chip size="small" :color="winRateColor(item.winRate)" variant="tonal">{{ item.winRate || 0 }}%</v-chip>
            </template>
            <template #item.awards="{ item }">
              <div class="table-awards">
                <span><v-icon size="15" color="amber">mdi-trophy</v-icon>{{ item.cup_count }}</span>
                <span><v-icon size="15" color="deep-purple-lighten-2">mdi-gavel</v-icon>{{ item.sub_cup_count }}</span>
              </div>
            </template>
            <template #no-data><div class="empty-state">표시할 내전 기록이 없습니다.</div></template>
          </v-data-table>
        </v-card>
      </v-col>

      <v-col cols="12" lg="4">
        <v-card class="dashboard-panel mb-3" rounded="xl" elevation="0">
          <div class="panel-head">
            <div><span class="panel-kicker">TIER BALANCE</span><h2>클랜 티어 분포</h2></div>
          </div>
          <div class="tier-list">
            <div v-for="tier in tierDistribution" :key="tier.name" class="tier-row">
              <div><strong>{{ tier.name }}</strong><span>{{ tier.count }}명</span></div>
              <v-progress-linear :model-value="tier.percent" :color="tier.color" height="7" rounded />
            </div>
          </div>
          <div v-if="!tierDistribution.length" class="empty-state">티어 데이터가 없습니다.</div>
        </v-card>

        <v-card class="dashboard-panel" rounded="xl" elevation="0">
          <div class="panel-head"><div><span class="panel-kicker">QUICK MENU</span><h2>빠른 메뉴</h2></div></div>
          <div class="quick-grid">
            <router-link v-for="menu in quickMenus" :key="menu.label" :to="menu.to" class="quick-link">
              <v-icon :color="menu.color">{{ menu.icon }}</v-icon><span>{{ menu.label }}</span>
            </router-link>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <v-dialog v-model="activityDialog" max-width="820" scrollable>
      <v-card class="activity-dialog" rounded="xl">
        <v-card-title class="activity-dialog-head">
          <div>
            <span class="panel-kicker">PLAYER ACTIVITY</span>
            <h2>{{ activityData?.player.nickname }}<small v-if="activityData?.player.tagname">#{{ activityData.player.tagname }}</small></h2>
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
                <v-avatar size="36" :color="activityCategoryColor(event.category)" variant="tonal">
                  <v-icon size="19">{{ activityCategoryIcon(event.category) }}</v-icon>
                </v-avatar>
              </template>
              <v-list-item-title>{{ event.title }}</v-list-item-title>
              <v-list-item-subtitle>{{ activityCategoryLabel(event.category) }} · {{ formatActivityDate(event.occurredAt) }}</v-list-item-subtitle>
            </v-list-item>
          </v-list>
          <div v-else-if="!activityLoading" class="empty-state">해당 활동 기록이 없습니다.</div>
          <div v-if="activityLoading" class="empty-state"><v-progress-circular indeterminate color="primary" /></div>
        </v-card-text>
        <v-card-actions class="px-6 pb-5 justify-end">
          <v-btn variant="tonal" prepend-icon="mdi-open-in-new" @click="activityData && openPlayer(activityData.player)">OP.GG</v-btn>
          <v-btn color="primary" @click="activityDialog = false">확인</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useAccountStore } from '@/stores/useAccountStore';
import api from '@/@core/composable/useAxios';
import { getBaseUrl } from '@/@core/composable/createUrl';
import { CLAN_PATH } from '@/router/clan/type';

type PlayerRecord = {
  id: number; nickname: string; tagname?: string; totalMatchCount: number; winCount: number;
  loseCount: number; winRate: number; point: number; tierName?: string; cup_count: number; sub_cup_count: number;
};
type WinnerLeader = { id: number; nickname: string; tier?: string; cup_count: number; sub_cup_count: number };
type DashboardSummary = {
  memberCount: number; activePlayerCount: number; matchCount: number; completedMatchCount: number;
  openPartyCount: number; activeAuctionCount: number; auctionCount: number; completedAuctionCount: number;
  cupWinCount: number; auctionWinCount: number;
};
type ActivityCategory = 'DUO_RANK' | 'FLEX_RANK' | 'NORMAL' | 'MATCH' | 'CUP' | 'AUCTION';
type PlayerActivity = {
  player: { id: number; nickname: string; tagname: string; accountId: number };
  counts: Record<ActivityCategory, number>;
  events: Array<{ category: ActivityCategory; id: number; title: string; occurredAt: string }>;
};

const account = useAccountStore();
const loading = ref(false);
const search = ref('');
const activityDialog = ref(false);
const activityLoading = ref(false);
const activityData = ref<PlayerActivity | null>(null);
const selectedActivityCategory = ref<'ALL' | ActivityCategory>('ALL');
const recordList = ref<PlayerRecord[]>([]);
const winnerLeaders = ref<WinnerLeader[]>([]);
const summary = ref<DashboardSummary>({
  memberCount: 0, activePlayerCount: 0, matchCount: 0, completedMatchCount: 0,
  openPartyCount: 0, activeAuctionCount: 0, auctionCount: 0, completedAuctionCount: 0,
  cupWinCount: 0, auctionWinCount: 0,
});

const summaryCards = computed(() => [
  { label: '클랜 멤버', value: `${summary.value.memberCount}명`, caption: `활성 플레이어 ${summary.value.activePlayerCount}명`, icon: 'mdi-account-group', rgb: '59, 130, 246' },
  { label: '완료된 내전', value: `${summary.value.completedMatchCount}경기`, caption: `전체 생성 ${summary.value.matchCount}경기`, icon: 'mdi-sword-cross', rgb: '34, 197, 94' },
  { label: '진행 중인 활동', value: `${summary.value.openPartyCount + summary.value.activeAuctionCount}개`, caption: `파티 ${summary.value.openPartyCount} · 경매 ${summary.value.activeAuctionCount}`, icon: 'mdi-lightning-bolt', rgb: '249, 115, 22' },
  { label: '완료된 경매내전', value: `${summary.value.completedAuctionCount}경기`, caption: `전체 생성 ${summary.value.auctionCount}경기`, icon: 'mdi-gavel', rgb: '168, 85, 247' },
]);

const winRanking = computed(() =>
  [...recordList.value]
    .sort((a, b) => b.cup_count - a.cup_count || b.sub_cup_count - a.sub_cup_count)
    .slice(3, 8),
);

const headers = [
  { title: '플레이어', key: 'player', sortable: false },
  { title: '경기', key: 'totalMatchCount', align: 'center' as const },
  { title: '승', key: 'winCount', align: 'center' as const },
  { title: '패', key: 'loseCount', align: 'center' as const },
  { title: '승률', key: 'winRate', align: 'center' as const },
  { title: '우승', key: 'awards', align: 'center' as const, sortable: false },
];

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

const filteredRecords = computed(() => {
  const keyword = search.value.trim().toLowerCase();
  if (!keyword) return recordList.value;
  return recordList.value.filter((player) => player.nickname.toLowerCase().includes(keyword));
});

const tierColors: Record<string, string> = {
  CHALLENGER: '#38bdf8', GRANDMASTER: '#f43f5e', MASTER: '#c084fc', DIAMOND: '#60a5fa',
  EMERALD: '#34d399', PLATINUM: '#2dd4bf', GOLD: '#fbbf24', SILVER: '#94a3b8', BRONZE: '#b45309', IRON: '#78716c', UNRANK: '#64748b',
};
const tierDistribution = computed(() => {
  const counts = new Map<string, number>();
  recordList.value.forEach((player) => {
    const name = (player.tierName || 'UNRANK').split(' ')[0].toUpperCase();
    counts.set(name, (counts.get(name) || 0) + 1);
  });
  const total = recordList.value.length || 1;
  return [...counts.entries()].map(([name, count]) => ({ name, count, percent: (count / total) * 100, color: tierColors[name] || '#64748b' })).sort((a, b) => b.count - a.count);
});

const quickMenus = computed(() => [
  { label: '파티 구하기', icon: 'mdi-account-multiple-plus-outline', color: 'teal-lighten-1', to: CLAN_PATH.PARTY(account.clan.name) },
  { label: '내전 매치', icon: 'mdi-sword-cross', color: 'blue-lighten-1', to: CLAN_PATH.MATCH(account.clan.name) },
  { label: '내전 컵', icon: 'mdi-trophy-outline', color: 'amber', to: CLAN_PATH.CUP(account.clan.name) },
  { label: '경매 내전', icon: 'mdi-gavel', color: 'deep-purple-lighten-2', to: CLAN_PATH.AUCTION(account.clan.name) },
]);

async function fetchDashboard() {
  const clanId = account.clan?.id;
  if (!clanId) return;
  loading.value = true;
  try {
    const [summaryRes, winnerRes, recordRes] = await Promise.all([
      api.get(`${getBaseUrl('DATA')}/Clan/dashboard_summary`, { params: { clan_id: clanId } }),
      api.get(`${getBaseUrl('DATA')}/Clan/dashboard_1`, { params: { clan_id: clanId } }),
      api.get(`${getBaseUrl('DATA')}/Clan/dashboard_3`, { params: { clan_id: clanId } }),
    ]);
    summary.value = summaryRes.data?.datas ?? summary.value;
    winnerLeaders.value = winnerRes.data?.datas ?? [];
    recordList.value = recordRes.data?.datas ?? [];
  } catch (error) {
    console.error('클랜 대시보드를 불러오지 못했습니다.', error);
  } finally {
    loading.value = false;
  }
}

async function openActivity(player: PlayerRecord) {
  const clanId = account.clan?.id;
  if (!clanId) return;
  activityDialog.value = true;
  activityLoading.value = true;
  activityData.value = null;
  selectedActivityCategory.value = 'ALL';
  try {
    const response = await api.get(`${getBaseUrl('DATA')}/Clan/dashboard_player_activity`, {
      params: { clan_id: clanId, player_id: player.id },
    });
    activityData.value = response.data?.datas ?? null;
  } catch (error) {
    console.error('플레이어 활동 기록을 불러오지 못했습니다.', error);
  } finally {
    activityLoading.value = false;
  }
}

function openFirstSearchResult() {
  if (!search.value.trim() || !filteredRecords.value.length) return;
  void openActivity(filteredRecords.value[0]);
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

function openPlayer(player: { nickname: string; tagname?: string }) {
  const [nickname, embeddedTag] = player.nickname.split('#');
  const tag = player.tagname || embeddedTag;
  if (!nickname || !tag) return;
  window.open(`https://www.op.gg/summoners/kr/${encodeURIComponent(`${nickname}-${tag}`)}`, '_blank', 'noopener,noreferrer');
}
function initials(name = '') { return name.replace(/#.*/, '').trim().slice(0, 2).toUpperCase() || '?'; }
const avatarPalette = ['#7c3aed', '#0891b2', '#059669', '#dc2626', '#d97706', '#4f46e5'];
function avatarColor(name: string) { return avatarPalette[[...name].reduce((sum, char) => sum + char.charCodeAt(0), 0) % avatarPalette.length]; }
function winRateColor(rate: number) { return rate >= 60 ? 'success' : rate >= 50 ? 'warning' : 'error'; }

onMounted(fetchDashboard);
</script>

<style scoped>
.clan-dashboard { min-height: calc(100vh - 64px); background: radial-gradient(circle at 85% 0, rgba(124, 58, 237, .12), transparent 30%), #0c0f14; color: #f8fafc; }
.dashboard-hero { display: flex; align-items: flex-end; justify-content: space-between; gap: 18px; padding: 26px 28px; border: 1px solid rgba(139, 92, 246, .25); border-radius: 24px; background: linear-gradient(125deg, rgba(30, 41, 59, .94), rgba(46, 16, 101, .7)); box-shadow: 0 18px 45px rgba(0, 0, 0, .22); }
.hero-eyebrow,.panel-kicker { color: #a78bfa; font-size: 10px; font-weight: 900; letter-spacing: .18em; }
.dashboard-hero h1 { margin: 5px 0 2px; font-size: clamp(26px, 4vw, 40px); line-height: 1; }
.dashboard-hero p { margin: 9px 0 0; color: rgba(226, 232, 240, .65); }
.hero-actions { display: flex; align-items: center; gap: 9px; }
.summary-card,.dashboard-panel { border: 1px solid rgba(148, 163, 184, .12); background: rgba(22, 27, 36, .92); }
.summary-card { display: flex; min-height: 126px; align-items: center; gap: 15px; padding: 20px; }
.summary-icon { display: grid; width: 50px; height: 50px; flex: 0 0 auto; place-items: center; border-radius: 16px; color: rgb(var(--card-rgb)); background: rgba(var(--card-rgb), .14); box-shadow: inset 0 0 0 1px rgba(var(--card-rgb), .2); }
.summary-copy { display: flex; min-width: 0; flex-direction: column; }
.summary-copy span,.summary-copy small { color: rgba(226, 232, 240, .55); }
.summary-copy strong { margin: 2px 0; font-size: 25px; }
.summary-copy small { overflow: hidden; font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }
.panel-head { display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 21px 22px 16px; }
.panel-head h2 { margin: 2px 0 0; font-size: 17px; }
.winner-grid { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 10px; padding: 0 18px 20px; }
.winner-card { position: relative; display: flex; min-width: 0; padding: 18px 12px 14px; border: 1px solid rgba(251,191,36,.13); border-radius: 17px; color: inherit; background: linear-gradient(145deg, rgba(251,191,36,.09), rgba(255,255,255,.025)); cursor: pointer; align-items: center; flex-direction: column; }
.winner-card:hover { border-color: rgba(251,191,36,.4); transform: translateY(-2px); }
.winner-rank { position: absolute; top: 9px; left: 11px; color: #fbbf24; font-size: 12px; font-weight: 900; }
.winner-info { min-width: 0; margin-top: 9px; text-align: center; }
.winner-info strong,.winner-info span { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.winner-info strong { font-size: 13px; }.winner-info span { color: rgba(226,232,240,.48); font-size: 10px; }
.winner-awards,.table-awards { display: flex; align-items: center; justify-content: center; gap: 10px; }
.winner-awards { margin-top: 10px; }.winner-awards span,.table-awards span { display: inline-flex; align-items: center; gap: 3px; font-size: 12px; font-weight: 800; }
.activity-list { padding: 0 20px 20px; }.activity-row { display: flex; min-height: 58px; align-items: center; gap: 12px; border-bottom: 1px solid rgba(148,163,184,.09); }
.activity-rank { display: grid; width: 25px; height: 25px; place-items: center; border-radius: 8px; color: #67e8f9; background: rgba(6,182,212,.12); font-size: 11px; font-weight: 900; }
.activity-name { display: flex; min-width: 0; flex: 1; flex-direction: column; }.activity-name strong { overflow: hidden; font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }.activity-name small { color: rgba(226,232,240,.45); }
.activity-count { display: flex; align-items: baseline; gap: 4px; }.activity-count strong { font-size: 17px; }.activity-count span { color: rgba(226,232,240,.45); font-size: 10px; }
.ranking-awards { display: flex; align-items: center; gap: 9px; }.ranking-awards span { display: inline-flex; align-items: center; gap: 3px; font-size: 12px; font-weight: 900; }
.member-search { max-width: 250px; }.record-table { background: transparent; }.record-table :deep(th) { color: rgba(226,232,240,.5)!important; font-size: 11px; }.record-table :deep(td) { border-color: rgba(148,163,184,.08)!important; }
.player-link { display: flex; min-width: 0; align-items: center; gap: 9px; border: 0; color: inherit; background: transparent; cursor: pointer; text-align: left; }.player-link > span { display: flex; min-width: 0; flex-direction: column; }.player-link strong { overflow: hidden; max-width: 170px; font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }.player-link small { color: rgba(226,232,240,.45); font-size: 9px; }
.tier-list { display: grid; gap: 15px; padding: 0 22px 22px; }.tier-row > div { display: flex; justify-content: space-between; margin-bottom: 6px; }.tier-row strong { font-size: 11px; }.tier-row span { color: rgba(226,232,240,.5); font-size: 10px; }
.quick-grid { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 8px; padding: 0 18px 20px; }.quick-link { display: flex; min-height: 70px; align-items: center; justify-content: center; gap: 8px; border: 1px solid rgba(148,163,184,.11); border-radius: 14px; color: rgba(248,250,252,.82); background: rgba(255,255,255,.025); font-size: 11px; font-weight: 800; text-decoration: none; flex-direction: column; }.quick-link:hover { border-color: rgba(139,92,246,.42); background: rgba(139,92,246,.08); }
.empty-state { padding: 28px; color: rgba(226,232,240,.45); font-size: 12px; text-align: center; }
.activity-dialog { border: 1px solid rgba(139,92,246,.22); background: #151922; }
.activity-dialog-head { display: flex; align-items: center; justify-content: space-between; padding: 22px 24px 12px; }
.activity-dialog-head h2 { margin: 3px 0 0; font-size: 21px; }.activity-dialog-head h2 small { color: rgba(226,232,240,.48); font-size: 13px; }
.activity-category-grid { display: grid; grid-template-columns: repeat(6,minmax(0,1fr)); gap: 8px; margin-bottom: 22px; }
.activity-category { display: flex; min-width: 0; min-height: 100px; align-items: center; justify-content: center; gap: 3px; border: 1px solid rgba(148,163,184,.12); border-radius: 14px; color: rgba(248,250,252,.82); background: rgba(255,255,255,.025); cursor: pointer; flex-direction: column; }
.activity-category:hover,.activity-category.active { border-color: rgba(139,92,246,.55); background: rgba(139,92,246,.11); }
.activity-category span { overflow: hidden; max-width: 100%; color: rgba(226,232,240,.55); font-size: 10px; text-overflow: ellipsis; white-space: nowrap; }.activity-category strong { font-size: 16px; }
.activity-history-head { display: flex; align-items: center; justify-content: space-between; padding: 0 4px 9px; }.activity-history-head strong { font-size: 13px; }.activity-history-head span { color: rgba(226,232,240,.4); font-size: 10px; }
.activity-history-list { max-height: 350px; overflow-y: auto; border-top: 1px solid rgba(148,163,184,.1); background: transparent; }.activity-history-list :deep(.v-list-item) { border-bottom: 1px solid rgba(148,163,184,.08); }
@media (max-width: 700px) { .dashboard-hero { align-items: flex-start; padding: 22px; flex-direction: column; }.winner-grid { grid-template-columns: 1fr; }.winner-card { flex-direction: row; gap: 12px; }.winner-info { margin: 0; text-align: left; flex: 1; }.winner-awards { margin: 0; }.panel-head--responsive { align-items: stretch; flex-direction: column; }.member-search { max-width: none; } }
@media (max-width: 700px) { .activity-category-grid { grid-template-columns: repeat(3,minmax(0,1fr)); }.activity-category { min-height: 82px; } }
</style>
