<template>
  <v-container>
    <!-- 🔍 검색 & 정렬 영역 -->
    <v-row class="mb-2" align="center">
      <v-col cols="12" sm="3" md="3">
        <v-text-field
          v-model="search"
          label="닉네임 검색"
          density="compact"
          hide-details
          clearable
          append-inner-icon="mdi-magnify"
          @keyup.enter="handleSearch"
          @click:clear="handleClear"
        />
      </v-col>

      <v-col cols="auto">
        <v-btn color="primary" @click="handleSearch">검색</v-btn>
      </v-col>

      <v-spacer />

      <!-- 정렬 기준 (점수 / 난전 / 컵 / 매치) -->
      <v-col cols="12" sm="3" md="3">
        <v-select
          v-model="sortKey"
          :items="sortOptions"
          item-title="label"
          item-value="key"
          label="정렬 기준"
          density="compact"
          hide-details
        />
      </v-col>
    </v-row>

    <!-- 🔝 내 순위 요약 카드 (선택) -->
    <v-row class="mb-4" v-if="myRecord">
      <v-col cols="12">
        <v-card class="pa-3" variant="tonal" color="indigo">
          <div class="d-flex justify-space-between align-center">
            <div>
              <div class="text-caption text-medium-emphasis">내 랭킹</div>
              <div class="text-h6 font-weight-bold">
                #{{ myRecord.rank }} · {{ myRecord.nickname }}
              </div>
              <div class="text-caption mt-1">
                Score {{ myRecord.score }} · 난전 {{ myRecord.rumble_count }} · 컵
                {{ myRecord.cup_count }} · 매치 {{ myRecord.match_count }}
              </div>
            </div>

            <div style="min-width: 220px">
              <div class="text-caption text-right mb-1">
                상위 {{ Math.round((myRecord.rank / totalItems) * 100) }}%
              </div>
              <v-progress-linear :model-value="myPercent" height="10" rounded striped />
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- 📊 순위 테이블 -->
    <server-data-table
      :headers="headers"
      :items="serverItems"
      :items-length="totalItems"
      :items-per-page="itemsPerPage"
      :loading="loading"
      @update:options="loadItems"
    >
      <!-- 순위 / 메달 -->
      <template #item.rank="{ item }">
        <div class="d-flex justify-center">
          <span v-if="item.rank === 1" class="rank-medal gold">🥇</span>
          <span v-else-if="item.rank === 2" class="rank-medal silver">🥈</span>
          <span v-else-if="item.rank === 3" class="rank-medal bronze">🥉</span>
          <span v-else class="rank-text">#{{ item.rank }}</span>
        </div>
      </template>

      <!-- 닉네임 + 내행 하이라이트 -->
      <template #item.nickname="{ item }">
        <div class="d-flex align-center" :class="{ 'me-row': item.nickname === myNickname }">
          <span class="name-text">
            {{ item.nickname }}
          </span>
        </div>
      </template>

      <!-- 난전 / 컵 / 매치 숫자 대신 칩 -->
      <template #item.rumble_count="{ item }">
        <font-awesome-icon
          v-for="index in item.rumble_count"
          :icon="['fas', 'star']"
          class="star-full"
        />
      </template>

      <template #item.cup_count="{ item }">
        <font-awesome-icon
          v-for="index in item.cup_count"
          :icon="['far', 'star']"
          class="star-full"
        />
      </template>

      <template #item.match_count="{ item }"> {{ item.match_count }} </template>

      <!-- Score + ProgressBar -->
      <template #item.score="{ item }">
        <div>
          <div class="d-flex justify-space-between text-caption mb-1">
            <span>Score {{ item.score }}</span>
            <span>{{ Math.round((item.score / maxScore) * 100) }}%</span>
          </div>
          <v-progress-linear :model-value="(item.score / maxScore) * 100" height="6" rounded />
        </div>
      </template>
    </server-data-table>
  </v-container>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import type { VDataTableServer } from 'vuetify/components';

interface PlayerRecord {
  id: number;
  nickname: string;
  rumble_count: number; // 난전 승
  cup_count: number; // 컵 우승
  match_count: number; // 전체 경기 수
  score: number; // 종합 점수
  rank: number; // 순위
}

/* 🔹 샘플 데이터 (너가 캡처해서 준 내용 일부) */
const rawData: Omit<PlayerRecord, 'score' | 'rank'>[] = [
  { id: 41, nickname: '좋은아침', rumble_count: 1, cup_count: 3, match_count: 2 },
  { id: 3, nickname: '개그맨님', rumble_count: 1, cup_count: 2, match_count: 2 },
  { id: 86, nickname: '이겨만준다', rumble_count: 0, cup_count: 2, match_count: 2 },
  { id: 47, nickname: '스의', rumble_count: 0, cup_count: 0, match_count: 2 },
  { id: 55, nickname: '방패로때린다', rumble_count: 0, cup_count: 0, match_count: 1 },
  { id: 37, nickname: '오늘두', rumble_count: 0, cup_count: 2, match_count: 4 },
  { id: 19, nickname: '암비샤', rumble_count: 0, cup_count: 2, match_count: 2 },
  { id: 8, nickname: '전자양', rumble_count: 0, cup_count: 2, match_count: 1 },
  { id: 97, nickname: '코첼', rumble_count: 0, cup_count: 2, match_count: 2 },
  { id: 39, nickname: '레몬맛네모기', rumble_count: 0, cup_count: 0, match_count: 1 },
  { id: 19, nickname: '수정잘정하다', rumble_count: 0, cup_count: 1, match_count: 1 },
  { id: 42, nickname: 'usdt', rumble_count: 0, cup_count: 2, match_count: 0 },
  { id: 4, nickname: '아무르', rumble_count: 0, cup_count: 2, match_count: 0 },
  { id: 15, nickname: '하이퍼', rumble_count: 0, cup_count: 2, match_count: 0 },
  { id: 56, nickname: 'netgate', rumble_count: 0, cup_count: 1, match_count: 4 },
  { id: 57, nickname: '반도만나요과', rumble_count: 0, cup_count: 1, match_count: 2 },
  { id: 81, nickname: '도사님', rumble_count: 0, cup_count: 1, match_count: 2 },
  { id: 51, nickname: 'flash', rumble_count: 0, cup_count: 1, match_count: 2 },
  { id: 2, nickname: '길감붕', rumble_count: 0, cup_count: 1, match_count: 2 },
  { id: 22, nickname: '둘계찜', rumble_count: 0, cup_count: 1, match_count: 1 },
];

const myNickname = '개그맨님'; // 나중에 로그인한 유저 닉네임으로 교체

const search = ref('');
const sortKey = ref<'score' | 'rumble_count' | 'cup_count' | 'match_count'>('score');

const sortOptions = [
  { label: '종합 점수(Score)', key: 'score' },
  { label: '난전 승', key: 'rumble_count' },
  { label: '컵 우승', key: 'cup_count' },
  { label: '전체 매치 수', key: 'match_count' },
];

// 서버 테이블용 상태
const serverItems = ref<PlayerRecord[]>([]);
const totalItems = ref(0);
const loading = ref(false);
const itemsPerPage = ref(10);

/* 🔹 테이블 헤더 */
const headers = ref<VDataTableServer['headers']>([
  { title: '순위', key: 'rank', sortable: false, width: 80, align: 'center' },
  { title: '닉네임', key: 'nickname', sortable: true },
  { title: '난전', key: 'rumble_count', sortable: true, align: 'center' },
  { title: '컵', key: 'cup_count', sortable: true, align: 'center' },
  { title: '매치', key: 'match_count', sortable: true, align: 'center' },
  { title: 'Score', key: 'score', sortable: true, align: 'start', width: 220 },
]);

// 전체 래더 데이터 (점수 계산 + 순위 매기기)
function buildRankedData(): PlayerRecord[] {
  // 점수 계산: 난전*2 + 컵*5 + 매치*1 (가중치는 마음대로 조정해도 됨)
  const scored = rawData.map((p) => ({
    ...p,
    score: p.rumble_count * 2 + p.cup_count * 5 + p.match_count * 1,
    rank: 0,
  }));

  // 검색 필터
  let filtered = scored.filter((item) =>
    item.nickname.toLowerCase().includes(search.value.toLowerCase())
  );

  // 정렬 기준
  filtered.sort((a, b) => {
    const key = sortKey.value;
    if (b[key] === a[key]) return b.score - a.score; // 동점이면 score로
    return b[key] - a[key]; // 내림차순
  });

  // 순위 매기기
  filtered.forEach((item, idx) => {
    item.rank = idx + 1;
  });

  return filtered;
}

const maxScore = computed(() => Math.max(...buildRankedData().map((p) => p.score), 1));

const myRecord = computed(() => buildRankedData().find((p) => p.nickname === myNickname) || null);

const myPercent = computed(() => {
  if (!myRecord.value) return 0;
  return (myRecord.value.score / maxScore.value) * 100;
});

/* 🔹 server-data-table 에서 호출되는 함수 */
async function loadItems(options: any) {
  loading.value = true;

  const ranked = buildRankedData();

  const start = (options.page - 1) * options.itemsPerPage;
  const end = start + options.itemsPerPage;

  serverItems.value = ranked.slice(start, end);
  totalItems.value = ranked.length;

  loading.value = false;
}

function handleSearch() {
  loadItems({
    page: 1,
    itemsPerPage: itemsPerPage.value,
    sortBy: [],
  });
}

function handleClear() {
  search.value = '';
  handleSearch();
}

// 초기 로딩
loadItems({ page: 1, itemsPerPage: itemsPerPage.value, sortBy: [] });
</script>

<style scoped>
.rank-medal {
  font-size: 20px;
}
.rank-text {
  font-weight: 600;
}
.name-text {
  font-weight: 500;
}
.me-row {
  padding: 2px 6px;
  border-radius: 999px;
  background: rgba(63, 81, 181, 0.12);
}
</style>
