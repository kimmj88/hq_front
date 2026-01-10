<template>
  <v-container class="py-6" style="max-width: 1100px">
    <div class="d-flex align-center justify-space-between mb-4">
      <div>
        <div class="text-h6 font-weight-bold">클랜전 목록</div>
        <div class="text-caption text-medium-emphasis">
          다른 클랜이 생성한 대기중 매치를 보고 “수락”하면 Step2로 진행합니다.
        </div>
      </div>

      <div class="d-flex align-center" style="gap: 8px">
        <v-btn color="primary" prepend-icon="mdi-plus" @click="$router.push(CLAN_MATCH_PATH.ADD)">
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

    <!-- 목록 -->
    <v-row dense>
      <v-col cols="12" v-if="filtered.length === 0">
        <v-alert type="info" variant="tonal" density="compact">
          조건에 맞는 클랜전이 없습니다.
        </v-alert>
      </v-col>

      <v-col cols="12" v-for="m in filtered" :key="m.id">
        <v-card rounded="xl" elevation="2" class="pa-4">
          <div class="d-flex align-center justify-space-between">
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

            <div class="d-flex align-center" style="gap: 8px">
              <v-btn variant="text" prepend-icon="mdi-eye-outline" @click="openDetail(m)">
                상세
              </v-btn>

              <!-- ✅ 내 클랜이 만든 매치는 수락 버튼 숨김 -->
              <v-btn
                v-if="canAccept(m)"
                color="primary"
                prepend-icon="mdi-sword-cross"
                @click="openAcceptDialog(m)"
              >
                수락(매치잡기)
              </v-btn>

              <v-chip v-else variant="tonal" size="small" color="grey"> 내가 만든 매치 </v-chip>
            </div>
          </div>

          <v-divider class="my-3" />

          <!-- 우리팀(호스트) 라인업 -->
          <div class="text-subtitle-2 font-weight-bold mb-2">호스트 라인업 (Step1 등록)</div>

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
                    <b>{{ m.host_member[slot.key].nickname }}</b>
                    <span v-if="m.host_member[slot.key].tagname"
                      >#{{ m.host_member[slot.key].tagname }}</span
                    >
                    <span class="text-caption text-medium-emphasis">
                      · {{ m.host_member[slot.key].tier || '-' }} · Point
                      {{ m.host_member[slot.key].point ?? 0 }}
                    </span>
                  </template>
                  <template v-else>
                    <span class="text-caption text-medium-emphasis">미등록</span>
                  </template>
                </div>
              </v-card>
            </v-col>
          </v-row>
        </v-card>
      </v-col>
    </v-row>

    <!-- 수락 다이얼로그 -->
    <v-dialog v-model="acceptDialog.open" max-width="520">
      <v-card rounded="xl">
        <v-card-title class="text-h6 font-weight-bold">클랜전 수락</v-card-title>
        <v-card-text class="text-body-2 text-medium-emphasis">
          <div>
            <b>{{ acceptDialog.match?.hostClanName }}</b> 클랜이 생성한
            <b>{{ tierTitle(acceptDialog.match?.tierLevel) }}</b> 매치를 수락할까요?
          </div>
          <div class="mt-2">
            수락하면 Step2에서 <b>상대(우리 클랜) 라인업 5명</b>을 입력하게 됩니다.
          </div>
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn variant="text" @click="acceptDialog.open = false">취소</v-btn>
          <v-btn color="primary" @click="acceptMatch" prepend-icon="mdi-check">수락</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snack.show" :timeout="2200">{{ snack.msg }}</v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { getBaseUrl } from '@/@core/composable/createUrl';
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/@core/composable/useAxios';
import { CLAN_MATCH_PATH } from '@/router/clanmatch/index';
import { formatDateTime } from '@/utils/date';
import { useAccountStore } from '@/stores/useAccountStore';

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
  { title: '1티어', value: 1, desc: '그랜드마스터 · 챌린저' },
  { title: '2티어', value: 2, desc: '마스터 · 챌린저' },
  { title: '3티어', value: 3, desc: '다이아몬드 · 마스터' },
  { title: '4티어', value: 4, desc: '에메랄드 · 다이아몬드' },
  { title: '5티어', value: 5, desc: '플래티넘 · 에메랄드' },
  { title: '6티어', value: 6, desc: '골드 · 플래티넘' },
  { title: '7티어', value: 7, desc: '실버 · 골드' },
  { title: '8티어', value: 8, desc: '브론즈 · 실버' },
  { title: '9티어', value: 9, desc: '아이언 · 브론즈' },
] as const;

const statusOptions = [
  { title: '대기중', value: 'WAITING' },
  { title: '매칭됨', value: 'MATCHED' },
  { title: '완료', value: 'DONE' },
  { title: '취소', value: 'CANCELLED' },
] as const;

// ✅ API host_member 형태 그대로

const items = ref<ClanMatch[]>([]);

const filters = ref({
  status: 'WAITING' as MatchStatus,
  tier: null as number | null,
  keyword: '',
});

function tierTitle(v?: number | null) {
  if (!v) return '-';
  return `${v}티어`;
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

const filtered = computed(() => {
  return items.value
    .filter((m) => (filters.value.status ? m.status === filters.value.status : true))
    .filter((m) => (filters.value.tier ? m.tier === filters.value.tier : true))
    .filter((m) => {
      const k = filters.value.keyword.trim().toLowerCase();
      if (!k) return true;
      return (m.host_clan?.name ?? '').toLowerCase().includes(k);
    })
    .sort((a, b) => a.match_at.localeCompare(b.match_at));
});

function canAccept(m: ClanMatch) {
  return m.status === 'WAITING' && m.host_clan?.id !== account.clan.id;
}

function openDetail(m: ClanMatch) {
  router.push(CLAN_MATCH_PATH.VIEW(m.id));
}

const acceptDialog = ref<{ open: boolean; match: ClanMatch | null }>({
  open: false,
  match: null,
});

function openAcceptDialog(m: ClanMatch) {
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
  if (!m) return;

  // TODO: 실제 API 연결
  // await api.post(`${getBaseUrl('DATA')}/clanmatch/accept`, { match_id: m.id, clan_id: myClanId.value })

  acceptDialog.value.open = false;
  toast('매치를 수락했습니다. Step2로 이동합니다.');
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
  try {
    const sortKey = options.sortBy[0]?.key || 'created_at';
    const sortOrder = options.sortBy[0]?.order || 'desc';

    const response = await api.get(
      `${getBaseUrl('DATA')}/clanmatch/search?keyword=${search.value}&page=${
        options.page
      }&itemsPerPage=${options.itemsPerPage}&sortBy=${sortKey}&orderBy=${sortOrder}`
    );

    loading.value = true;
    items.value = response.data.datas;
    totalItems.value = response.data.totalCount;
    loading.value = false;
  } catch (error) {
    console.error('기업 목록 불러오기 실패:', error);
  }
}

onMounted(() => {
  handleSearch();
});
</script>
<style>
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
