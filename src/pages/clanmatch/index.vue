<template>
  <v-container class="py-6" style="max-width: 1100px">
    <div class="d-flex flex-wrap ga-3 align-center justify-space-between mb-4">
      <div>
        <div class="text-h6 font-weight-bold">클랜전 목록</div>
        <div class="text-caption text-medium-emphasis">
          대기중인 매치를 선택하고 우리 클랜 선수를 등록해 매치를 잡아보세요.
        </div>
      </div>

      <div class="d-flex align-center" style="gap: 8px">
        <v-btn
          v-if="canCreateClanMatch()"
          color="primary"
          prepend-icon="mdi-plus"
          @click="openCreate"
        >
          클랜전 생성
        </v-btn>

        <v-btn variant="tonal" prepend-icon="mdi-refresh" @click="handleSearch">새로고침</v-btn>
      </div>
    </div>

    <!-- 공통 필터 -->
    <v-card class="pa-4 mb-4" rounded="xl" elevation="2">
      <v-row dense>
        <v-col cols="12" md="6">
          <v-select
            v-model="filters.tier"
            :items="tierOptions"
            item-title="title"
            item-value="value"
            label="티어"
            variant="outlined"
            density="comfortable"
            clearable
            prepend-inner-icon="mdi-trophy"
          />
        </v-col>

        <v-col cols="12" md="6">
          <v-text-field
            v-model="filters.keyword"
            label="클랜명 검색"
            variant="outlined"
            density="comfortable"
            clearable
            prepend-inner-icon="mdi-magnify"
          />
        </v-col>
      </v-row>
    </v-card>

    <v-progress-linear v-if="loading" indeterminate class="mb-4" />

    <!-- 진행 중인 클랜전 보드 -->
    <v-row class="match-board" align="stretch">
      <v-col v-for="column in matchColumns" :key="column.status" cols="12" md="6">
        <section class="match-column" :class="`match-column--${column.status.toLowerCase()}`">
          <div class="match-column__header">
            <div class="d-flex align-center ga-2">
              <v-avatar :color="column.color" size="34" variant="tonal">
                <v-icon :icon="column.icon" size="19" />
              </v-avatar>
              <div>
                <div class="text-subtitle-1 font-weight-bold">{{ column.title }}</div>
                <div class="text-caption text-medium-emphasis">{{ column.description }}</div>
              </div>
            </div>
            <v-chip :color="column.color" variant="tonal" size="small">
              {{ column.matches.length }}건
            </v-chip>
          </div>

          <v-alert
            v-if="!loading && column.matches.length === 0"
            type="info"
            variant="tonal"
            density="compact"
            class="ma-4"
          >
            {{ column.emptyMessage }}
          </v-alert>

          <div v-else class="match-column__list">
            <v-card
              v-for="m in column.matches"
              :key="m.id"
              rounded="xl"
              elevation="1"
              class="match-card pa-4"
            >
              <div class="d-flex ga-2 align-center justify-space-between">
                <v-chip :color="column.color" variant="flat" size="small">
                  {{ column.title }}
                </v-chip>
                <v-chip v-if="isMyClanMatch(m)" variant="tonal" size="small" color="grey">
                  우리 클랜
                </v-chip>
              </div>

              <div class="match-card__versus mt-3">
                <strong>{{ m.host_clan.name }}</strong>
                <span>VS</span>
                <strong :class="{ 'text-medium-emphasis': !m.guest_clan }">
                  {{ m.guest_clan?.name ?? '상대 클랜 대기' }}
                </strong>
              </div>

              <div class="d-flex flex-wrap ga-2 mt-3">
                <v-chip color="secondary" variant="tonal" size="small">
                  {{ tierTitle(m.tier) }} · {{ tierDesc(m.tier) }}
                </v-chip>
                <v-chip prepend-icon="mdi-calendar-clock" variant="outlined" size="small">
                  {{ formatDateTime(m.match_at) }}
                </v-chip>
              </div>

              <v-divider class="my-3" />
              <div class="text-caption font-weight-bold text-medium-emphasis mb-2">
                HOST 라인업
              </div>
              <div class="lineup-list">
                <div v-for="slot in slots" :key="slot.key" class="lineup-list__item">
                  <div class="pos-icon">
                    <v-img :src="slot.icon" width="18" height="18" contain />
                  </div>
                  <span class="lineup-list__position">{{ slot.short }}</span>
                  <template v-if="m.host_member?.[slot.key]">
                    <span class="lineup-list__player">
                      {{ m.host_member[slot.key]?.nickname }}<template
                        v-if="m.host_member[slot.key]?.tagname"
                        >#{{ m.host_member[slot.key]?.tagname }}</template
                      >
                    </span>
                    <span class="lineup-list__tier">
                      {{ m.host_member[slot.key]?.tier || '-' }}
                    </span>
                  </template>
                  <span v-else class="lineup-list__player text-medium-emphasis">미등록</span>
                </div>
              </div>

              <v-divider class="my-3" />
              <div class="match-actions">
                <MatchManageActions :match="m" @updated="handleSearch" @deleted="handleSearch" />
                <div class="match-actions__main">
                  <v-btn
                    variant="outlined"
                    size="small"
                    prepend-icon="mdi-eye-outline"
                    @click="openDetail(m)"
                  >
                    상세 보기
                  </v-btn>
                  <v-btn
                    v-if="canAccept(m)"
                    class="accept-button"
                    color="#FBBF24"
                    variant="flat"
                    prepend-icon="mdi-sword-cross"
                    @click="openAcceptDialog(m)"
                  >
                    매치 잡기
                  </v-btn>
                </div>
              </div>
            </v-card>
          </div>
        </section>
      </v-col>
    </v-row>

    <v-expansion-panels v-if="archivedMatches.length" class="mt-4">
      <v-expansion-panel rounded="xl">
        <v-expansion-panel-title>
          <div class="d-flex align-center ga-2 font-weight-bold">
            <v-icon icon="mdi-archive-outline" />
            종료된 클랜전
            <v-chip size="x-small" variant="tonal">{{ archivedMatches.length }}건</v-chip>
          </div>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-list lines="two">
            <v-list-item
              v-for="m in archivedMatches"
              :key="m.id"
              :title="`${m.host_clan.name} VS ${m.guest_clan?.name ?? '-'}`"
              :subtitle="`${statusLabel(m.status)} · ${tierTitle(m.tier)} · ${formatDateTime(m.match_at)}`"
              prepend-icon="mdi-sword-cross"
              @click="openDetail(m)"
            >
              <template #append>
                <v-btn icon="mdi-chevron-right" variant="text" size="small" />
              </template>
            </v-list-item>
          </v-list>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>

    <!-- 수락 다이얼로그 -->
    <v-dialog v-model="acceptDialog.open" max-width="520">
      <v-card rounded="xl">
        <v-card-title class="text-h6 font-weight-bold">클랜전 수락</v-card-title>
        <v-card-text class="text-body-2 text-medium-emphasis">
          <div>
            <b>{{ acceptDialog.match?.host_clan.name }}</b> 클랜이 생성한
            <b>{{ tierTitle(acceptDialog.match?.tier) }}</b> 매치를 수락할까요?
          </div>
          <div class="mt-2">
            다음 화면에서 <b>우리 클랜 선수 5명</b>을 등록하면 수락이 완료됩니다.
          </div>
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn variant="text" @click="acceptDialog.open = false">취소</v-btn>
          <v-btn
            color="#FBBF24"
            variant="flat"
            class="accept-button"
            @click="acceptMatch"
            prepend-icon="mdi-arrow-right"
            >선수 등록하기</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snack.show" :timeout="2200">{{ snack.msg }}</v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import MatchManageActions from '@/components/clanmatch/MatchManageActions.vue';
import { getBaseUrl } from '@/@core/composable/createUrl';
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '@/@core/composable/useAxios';
import { CLAN_MATCH_PATH } from '@/router/clanmatch/index';
import { formatDateTime } from '@/utils/date';
import { useAccountStore } from '@/stores/useAccountStore';
import { can as canClan } from '@/stores/useClanPermissionStore';
import { canCreateClanMatch } from '@/utils/clanMatchPermission';

import topIcon from '@/assets/positions/top.svg';
import jugIcon from '@/assets/positions/jug.svg';
import midIcon from '@/assets/positions/mid.svg';
import adcIcon from '@/assets/positions/adc.webp';
import supIcon from '@/assets/positions/sup.svg';
import type { ClanMatch, MatchStatus, SlotKey } from '@/data/types/clanmatch';

const router = useRouter();
const route = useRoute();
const account = useAccountStore();
const clanName = computed(() => String(route.params.name ?? account.clan?.name ?? ''));

const slots: { key: SlotKey; label: string; short: string; icon: string }[] = [
  { key: 'TOP', label: '탑', short: 'TOP', icon: topIcon },
  { key: 'JUG', label: '정글', short: 'JG', icon: jugIcon },
  { key: 'MID', label: '미드', short: 'MID', icon: midIcon },
  { key: 'ADC', label: '원딜', short: 'ADC', icon: adcIcon },
  { key: 'SUP', label: '서포터', short: 'SUP', icon: supIcon },
];

const tierOptions = [
  { title: '무제한티어', value: 10, desc: '티어제한 없음' },
  { title: '9티어', value: 9, desc: '아이언 · 브론즈' },
  { title: '8티어', value: 8, desc: '브론즈 · 실버' },
  { title: '7티어', value: 7, desc: '실버 · 골드' },
  { title: '6티어', value: 6, desc: '골드 · 플래티넘' },
  { title: '5티어', value: 5, desc: '플래티넘 · 에메랄드' },
  { title: '4티어', value: 4, desc: '에메랄드 · 다이아몬드' },
  { title: '3티어', value: 3, desc: '다이아몬드 · 마스터' },
  { title: '2티어', value: 2, desc: '마스터 · 챌린저' },
  { title: '1티어', value: 1, desc: '그랜드마스터 · 챌린저' },
] as const;

// ✅ API host_member 형태 그대로

const items = ref<ClanMatch[]>([]);

const filters = ref({
  tier: null as number | null,
  keyword: '',
});

function tierTitle(v?: number | null) {
  if (!v) return '-';
  return v === 10 ? '무제한티어' : `${v}티어`;
}
function tierDesc(v?: number | null) {
  if (!v) return '';
  return tierOptions.find((x) => x.value === v)?.desc ?? '';
}

function statusLabel(s: MatchStatus) {
  const labels: Record<MatchStatus, string> = {
    WAITING: '대기중',
    MATCHED: '매칭됨',
    DONE: '완료',
    CANCELLED: '취소',
  };
  return labels[s] ?? s;
}

const filtered = computed(() => {
  return items.value
    .filter((m) => (filters.value.tier ? m.tier === filters.value.tier : true))
    .filter((m) => {
      const k = (filters.value.keyword ?? '').trim().toLowerCase();
      if (!k) return true;
      return [m.host_clan?.name, m.guest_clan?.name].some((name) =>
        (name ?? '').toLowerCase().includes(k),
      );
    })
    .sort((a, b) => a.match_at.localeCompare(b.match_at));
});

const matchColumns = computed(() => [
  {
    status: 'WAITING' as const,
    title: '대기중',
    description: '상대 클랜의 수락을 기다리는 경기',
    emptyMessage: '현재 대기중인 클랜전이 없습니다.',
    color: 'primary',
    icon: 'mdi-clock-outline',
    matches: filtered.value.filter((match) => match.status === 'WAITING'),
  },
  {
    status: 'MATCHED' as const,
    title: '매칭됨',
    description: '상대가 정해져 진행 예정인 경기',
    emptyMessage: '현재 매칭된 클랜전이 없습니다.',
    color: 'success',
    icon: 'mdi-handshake-outline',
    matches: filtered.value.filter((match) => match.status === 'MATCHED'),
  },
]);

const archivedMatches = computed(() =>
  filtered.value
    .filter((match) => match.status === 'DONE' || match.status === 'CANCELLED')
    .sort((a, b) => b.match_at.localeCompare(a.match_at)),
);

function canAccept(m: ClanMatch) {
  const clanId = account.clan?.id;
  return Boolean(
    clanId &&
      canClan('CLANMATCH', 'CLAN-SET-CLANMATCH-U') &&
      m.status === 'WAITING' &&
      m.host_clan?.id !== clanId,
  );
}

function isMyClanMatch(m: ClanMatch) {
  const clanId = account.clan?.id;
  return Boolean(clanId && m.host_clan?.id === clanId);
}

function openDetail(m: ClanMatch) {
  router.push(CLAN_MATCH_PATH.VIEW(clanName.value, m.id));
}

function openCreate() {
  router.push(CLAN_MATCH_PATH.ADD(clanName.value));
}

const acceptDialog = ref<{ open: boolean; match: ClanMatch | null }>({
  open: false,
  match: null,
});

function openAcceptDialog(m: ClanMatch) {
  if (!canAccept(m)) return;
  acceptDialog.value.open = true;
  acceptDialog.value.match = m;
}

const snack = ref({ show: false, msg: '' });
function toast(msg: string) {
  snack.value.msg = msg;
  snack.value.show = true;
}

async function acceptMatch() {
  const m = acceptDialog.value.match;
  if (!m || !canAccept(m)) return;

  acceptDialog.value.open = false;
  router.push(CLAN_MATCH_PATH.ACCEPT(clanName.value, m.id));
}

interface FetchParams {
  keyword: string;
  page: number;
  itemsPerPage: number;
  sortBy: { key: keyof ClanMatch; order: 'asc' | 'desc' }[];
}

const loading = ref<boolean>(false);
const itemsPerPage = 200;

function handleSearch() {
  loadItems({
    keyword: '',
    page: 1,
    itemsPerPage,
    sortBy: [],
  });
}

async function loadItems(options: FetchParams) {
  loading.value = true;
  try {
    const sortKey = options.sortBy[0]?.key || 'created_at';
    const sortOrder = options.sortBy[0]?.order || 'desc';

    const response = await api.get(`${getBaseUrl('DATA')}/clanmatch/search`, {
      params: {
        keyword: options.keyword,
        page: options.page,
        itemsPerPage: options.itemsPerPage,
        sortBy: sortKey,
        orderBy: sortOrder,
      },
    });

    items.value = response.data.datas;
  } catch (error) {
    toast('클랜전 목록을 불러오지 못했습니다.');
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  handleSearch();
});
</script>
<style scoped>
.match-board > .v-col {
  display: flex;
}
.match-column {
  width: 100%;
  min-height: 360px;
  overflow: hidden;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 20px;
  background: rgba(var(--v-theme-surface-variant), 0.24);
}
.match-column--waiting {
  border-top: 4px solid rgb(var(--v-theme-primary));
}
.match-column--matched {
  border-top: 4px solid rgb(var(--v-theme-success));
}
.match-column__header {
  min-height: 76px;
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  background: rgb(var(--v-theme-surface));
}
.match-column__list {
  display: grid;
  gap: 12px;
  padding: 12px;
}
.match-card {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
.match-card__versus {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  gap: 10px;
  text-align: center;
}
.match-card__versus strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.match-card__versus > span {
  color: rgb(var(--v-theme-primary));
  font-size: 0.75rem;
  font-weight: 900;
}
.lineup-list {
  display: grid;
  gap: 5px;
}
.lineup-list__item {
  min-width: 0;
  min-height: 32px;
  display: grid;
  grid-template-columns: 24px 36px minmax(0, 1fr) auto;
  align-items: center;
  gap: 7px;
  padding: 5px 8px;
  border-radius: 9px;
  background: rgba(var(--v-theme-surface-variant), 0.4);
}
.lineup-list__position,
.lineup-list__tier {
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-size: 0.7rem;
  font-weight: 700;
}
.lineup-list__player {
  overflow: hidden;
  font-size: 0.82rem;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.match-actions,
.match-actions__main {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}
.match-actions {
  justify-content: space-between;
}
.match-actions__main {
  margin-left: auto;
}
.accept-button {
  color: #18181b !important;
  font-weight: 800;
}
@media (max-width: 600px) {
  .match-column__header {
    align-items: flex-start;
  }
  .match-actions__main {
    width: 100%;
  }
  .match-actions__main > .v-btn {
    flex: 1;
  }
}

.pos-icon {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
