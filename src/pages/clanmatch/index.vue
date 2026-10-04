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
          @click="$router.push(CLAN_MATCH_PATH.ADD)"
        >
          클랜전 생성
        </v-btn>

        <v-btn variant="tonal" prepend-icon="mdi-refresh" @click="handleSearch">새로고침</v-btn>
      </div>
    </div>

    <!-- 필터 -->
    <v-card class="pa-4 mb-4" rounded="xl" elevation="2">
      <v-row dense>
        <v-col cols="12" md="4">
          <v-select
            v-model="filters.status"
            :items="statusOptions"
            item-title="title"
            item-value="value"
            label="상태"
            variant="outlined"
            density="comfortable"
            prepend-inner-icon="mdi-filter"
          />
        </v-col>

        <v-col cols="12" md="4">
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

        <v-col cols="12" md="4">
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
    <!-- 목록 -->
    <v-row dense>
      <v-col cols="12" v-if="filtered.length === 0">
        <v-alert type="info" variant="tonal" density="compact">
          조건에 맞는 클랜전이 없습니다.
        </v-alert>
      </v-col>

      <v-col cols="12" v-for="m in filtered" :key="m.id">
        <v-card rounded="xl" elevation="2" class="pa-4">
          <div class="d-flex flex-wrap ga-2 align-center justify-space-between">
            <div class="d-flex align-center" style="gap: 10px; flex-wrap: wrap">
              <v-chip :color="statusColor(m.status)" variant="flat" size="small">
                {{ statusLabel(m.status) }}
              </v-chip>

              <v-chip color="secondary" variant="tonal" size="small">
                {{ tierTitle(m.tier) }} · {{ tierDesc(m.tier) }}
              </v-chip>

              <div class="text-subtitle-1 font-weight-bold">
                {{ m.host_clan.name }}
              </div>

              <div class="text-caption text-medium-emphasis">
                {{ formatDateTime(m.match_at) }}
              </div>
            </div>

            <v-chip v-if="isMyClanMatch(m)" variant="tonal" size="small" color="grey"
              >우리 클랜 매치</v-chip
            >
          </div>

          <v-divider class="my-3" />

          <!-- 우리팀(호스트) 라인업 -->
          <div class="text-subtitle-2 font-weight-bold mb-2">호스트 라인업</div>

          <v-row dense>
            <v-col cols="12" md="6" v-for="slot in slots" :key="slot.key">
              <v-card variant="tonal" rounded="lg" class="pa-3">
                <div class="d-flex align-center" style="gap: 8px">
                  <div class="pos-icon">
                    <v-img :src="slot.icon" width="18" height="18" contain />
                  </div>
                  <div class="font-weight-bold">{{ slot.label }}</div>
                  <v-spacer />
                  <v-chip size="x-small" variant="flat" color="secondary">{{ slot.short }}</v-chip>
                </div>

                <div class="mt-2 text-body-2">
                  <template v-if="m.host_member?.[slot.key]">
                    <b>{{ m.host_member[slot.key]?.nickname }}</b>
                    <span v-if="m.host_member[slot.key]?.tagname"
                      >#{{ m.host_member[slot.key]?.tagname }}</span
                    >
                    <span class="text-caption text-medium-emphasis">
                      · {{ m.host_member[slot.key]?.tier || '-' }} · Point
                      {{ m.host_member[slot.key]?.point ?? 0 }}
                    </span>
                  </template>
                  <template v-else>
                    <span class="text-caption text-medium-emphasis">미등록</span>
                  </template>
                </div>
              </v-card>
            </v-col>
          </v-row>
          <v-divider class="my-4" />
          <div class="match-actions">
            <MatchManageActions :match="m" @updated="handleSearch" @deleted="handleSearch" />
            <div class="match-actions__main">
              <v-btn variant="outlined" prepend-icon="mdi-eye-outline" @click="openDetail(m)"
                >상세 보기</v-btn
              >
              <v-btn
                v-if="canAccept(m)"
                class="accept-button"
                color="#FBBF24"
                variant="flat"
                size="large"
                prepend-icon="mdi-sword-cross"
                @click="openAcceptDialog(m)"
                >매치 잡기 · 수락</v-btn
              >
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

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
import { useRouter } from 'vue-router';
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
const account = useAccountStore();

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

const statusOptions = [
  { title: '전체', value: null },
  { title: '대기중', value: 'WAITING' },
  { title: '매칭됨', value: 'MATCHED' },
  { title: '완료', value: 'DONE' },
  { title: '취소', value: 'CANCELLED' },
] as const;

// ✅ API host_member 형태 그대로

const items = ref<ClanMatch[]>([]);

const filters = ref({
  status: null as MatchStatus | null, // ✅ 전체 기본값이면 null
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
  return statusOptions.find((x) => x.value === s)?.title ?? s;
}
function statusColor(s: MatchStatus) {
  if (s === 'WAITING') return 'primary';
  if (s === 'MATCHED') return 'success';
  if (s === 'DONE') return 'grey';
  return 'warning';
}

const statusRank: Record<MatchStatus, number> = {
  WAITING: 0,
  MATCHED: 1,
  DONE: 2,
  CANCELLED: 3,
};

const filtered = computed(() => {
  return items.value
    .filter((m) => (filters.value.status ? m.status === filters.value.status : true))
    .filter((m) => (filters.value.tier ? m.tier === filters.value.tier : true))
    .filter((m) => {
      const k = (filters.value.keyword ?? '').trim().toLowerCase();
      if (!k) return true;
      return (m.host_clan?.name ?? '').toLowerCase().includes(k);
    })
    .sort((a, b) => {
      // 1) 상태 우선 (WAITING 먼저)
      const sa = statusRank[a.status] ?? 99;
      const sb = statusRank[b.status] ?? 99;
      if (sa !== sb) return sa - sb;

      // 2) 같은 상태면 match_at 빠른 순
      return a.match_at.localeCompare(b.match_at);
    });
});

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
  router.push(CLAN_MATCH_PATH.VIEW(m.id));
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
  router.push(CLAN_MATCH_PATH.ACCEPT(m.id));
}

interface FetchParams {
  keyword: string;
  page: number;
  itemsPerPage: number;
  sortBy: { key: keyof ClanMatch; order: 'asc' | 'desc' }[];
}

const search = ref<string>('');
const serverItems = ref<ClanMatch[]>([]);
const loading = ref<boolean>(false);
const totalItems = ref<number>(0);
const itemsPerPage = ref<number>(10);

function handleSearch() {
  loadItems({
    keyword: search.value,
    page: 1,
    itemsPerPage: itemsPerPage.value,
    sortBy: [],
  });
}

async function loadItems(options: FetchParams) {
  loading.value = true;
  try {
    const sortKey = options.sortBy[0]?.key || 'created_at';
    const sortOrder = options.sortBy[0]?.order || 'desc';

    const response = await api.get(
      `${getBaseUrl('DATA')}/clanmatch/search?keyword=${search.value}&page=${
        options.page
      }&itemsPerPage=${options.itemsPerPage}&sortBy=${sortKey}&orderBy=${sortOrder}`,
    );

    items.value = response.data.datas;
    totalItems.value = response.data.totalCount;
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
