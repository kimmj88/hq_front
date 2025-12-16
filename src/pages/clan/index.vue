<!-- ClanPage.vue -->
<template>
  <v-container class="py-6">
    <!-- 헤더 -->
    <div class="d-flex align-center justify-space-between mb-4">
      <div>
        <h2 class="text-h5 font-weight-bold mb-1">클랜</h2>
        <div class="text-body-2 text-medium-emphasis">
          같이 하면 더 재밌게. 클랜을 만들거나 찾아서 합류해봐.
        </div>
      </div>

      <!-- ✅ Primary CTA: 한 군데만 크게 -->
      <v-btn color="primary" prepend-icon="mdi-account-group" @click="openCreateDialog">
        클랜 만들기
      </v-btn>
    </div>

    <!-- 탭 -->
    <v-card rounded="xl" elevation="2">
      <v-tabs v-model="tab" bg-color="transparent" class="px-2">
        <v-tab value="guide" prepend-icon="mdi-book-open-variant">가이드</v-tab>
        <v-tab value="search" prepend-icon="mdi-magnify">클랜 찾기</v-tab>
      </v-tabs>

      <v-divider />

      <v-window v-model="tab">
        <!-- ===================== -->
        <!-- 탭 1: 가이드 -->
        <!-- ===================== -->
        <v-window-item value="guide">
          <v-card-text class="py-6">
            <v-row>
              <v-col cols="12" md="7">
                <v-alert type="info" variant="tonal" class="mb-4" rounded="lg">
                  클랜은 고정 파티 플레이 + 협동 미션 + 보상 중심의 소셜 기능이야.
                </v-alert>

                <v-list density="comfortable">
                  <v-list-item>
                    <template #prepend>
                      <v-icon icon="mdi-check-circle-outline" />
                    </template>
                    <v-list-item-title>클랜 가입</v-list-item-title>
                    <v-list-item-subtitle
                      >리그오브레전드 플레이어는 클랜에 가입 할 수 있습니다.</v-list-item-subtitle
                    >
                    <v-list-item-subtitle
                      >클랜에 가입하여 다른 플레이어들과 함께 게임을
                      즐겨보세요.</v-list-item-subtitle
                    >
                  </v-list-item>

                  <v-list-item>
                    <template #prepend>
                      <v-icon icon="mdi-check-circle-outline" />
                    </template>
                    <v-list-item-title>클랜 레벨</v-list-item-title>
                    <v-list-item-subtitle>기능추가 예정</v-list-item-subtitle>
                  </v-list-item>

                  <v-list-item>
                    <template #prepend>
                      <v-icon icon="mdi-check-circle-outline" />
                    </template>
                    <v-list-item-title>클랜 매너</v-list-item-title>
                    <v-list-item-subtitle>불편한 발언 금지</v-list-item-subtitle>
                    <v-list-item-subtitle>인게임 내에 욕설, 과한 멘트 금지</v-list-item-subtitle>
                    <v-list-item-subtitle>즐거운 게임 유도, 과열방지</v-list-item-subtitle>
                  </v-list-item>
                </v-list>

                <div class="mt-6 d-flex flex-wrap gap-2">
                  <!-- ✅ 가이드에서도 버튼은 존재하되 덜 강하게 -->
                  <v-btn
                    variant="tonal"
                    color="primary"
                    prepend-icon="mdi-plus"
                    @click="openCreateDialog"
                  >
                    클랜 만들기
                  </v-btn>
                  <v-btn variant="text" prepend-icon="mdi-magnify" @click="tab = 'search'">
                    클랜 찾기로 이동
                  </v-btn>
                </div>
              </v-col>

              <v-col cols="12" md="5">
                <v-card rounded="lg" variant="outlined">
                  <v-card-title class="text-subtitle-1 font-weight-bold">
                    이런 사람에게 추천
                  </v-card-title>
                  <v-card-text>
                    <v-chip class="ma-1" label>디스코드 파티 자주함</v-chip>
                    <v-chip class="ma-1" label>고정 멤버 필요</v-chip>
                    <v-chip class="ma-1" label>미션/보상 좋아함</v-chip>
                    <v-chip class="ma-1" label>팀 플레이 선호</v-chip>
                  </v-card-text>
                </v-card>

                <v-card class="mt-3" rounded="lg" variant="outlined">
                  <v-card-title class="text-subtitle-1 font-weight-bold">
                    클랜 만들기 체크리스트
                  </v-card-title>
                  <v-card-text>
                    <v-list density="compact">
                      <v-list-item>
                        <template #prepend><v-icon icon="mdi-tag-outline" /></template>
                        <v-list-item-title>태그(3~5자) / 클랜명</v-list-item-title>
                      </v-list-item>
                      <v-list-item>
                        <template #prepend><v-icon icon="mdi-shield-account-outline" /></template>
                        <v-list-item-title>승인제 여부</v-list-item-title>
                      </v-list-item>
                      <v-list-item>
                        <template #prepend><v-icon icon="mdi-text-box-outline" /></template>
                        <v-list-item-title>간단 소개</v-list-item-title>
                      </v-list-item>
                    </v-list>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </v-card-text>
        </v-window-item>

        <!-- ===================== -->
        <!-- 탭 2: 클랜 찾기 -->
        <!-- ===================== -->
        <v-window-item value="search">
          <v-card-text class="py-6">
            <v-row class="align-center">
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="q"
                  label="클랜 검색 (이름/태그/설명)"
                  prepend-inner-icon="mdi-magnify"
                  clearable
                  hide-details
                />
              </v-col>

              <v-col cols="12" md="6" class="d-flex justify-end">
                <div class="d-flex flex-wrap gap-2">
                  <v-select
                    v-model="sort"
                    :items="sortItems"
                    label="정렬"
                    hide-details
                    style="min-width: 170px"
                  />
                  <v-btn
                    variant="outlined"
                    prepend-icon="mdi-filter-variant"
                    @click="filterDrawer = true"
                  >
                    필터
                  </v-btn>
                </div>
              </v-col>
            </v-row>

            <div class="mt-3 d-flex flex-wrap gap-2">
              <v-chip-group v-model="playStyle" selected-class="text-primary" mandatory>
                <v-chip value="any" label>전체</v-chip>
                <v-chip value="casual" label>캐주얼</v-chip>
                <v-chip value="rank" label>랭크</v-chip>
              </v-chip-group>

              <v-chip-group v-model="joinType" selected-class="text-primary" mandatory>
                <v-chip value="any" label>가입방식 전체</v-chip>
                <v-chip value="open" label>자유가입</v-chip>
                <v-chip value="approval" label>승인제</v-chip>
              </v-chip-group>
            </div>

            <v-divider class="my-4" />

            <!-- 로딩/결과 -->
            <v-row>
              <v-col cols="12" v-if="loading">
                <v-skeleton-loader type="card, card, card" />
              </v-col>

              <v-col cols="12" v-else>
                <v-row>
                  <v-col v-for="clan in serverItems" :key="clan.id" cols="12" md="6" lg="4">
                    <v-card rounded="lg" variant="outlined">
                      <v-card-title class="d-flex align-center justify-space-between">
                        <div class="text-subtitle-1 font-weight-bold">
                          {{ clan.name }}
                          <span class="text-medium-emphasis">[{{ clan.tag }}]</span>
                        </div>
                        <v-chip size="small" label> {{ clan.members }}/{{ clan.capacity }} </v-chip>
                      </v-card-title>

                      <v-card-text class="text-body-2 text-medium-emphasis">
                        {{ clan.description }}
                        <div class="mt-2 d-flex flex-wrap gap-1">
                          <v-chip size="small" label>{{ clan.playStyleLabel }}</v-chip>
                          <v-chip size="small" label>{{ clan.joinTypeLabel }}</v-chip>
                          <v-chip size="small" label>활동도 {{ clan.activity }}</v-chip>
                        </div>
                      </v-card-text>

                      <v-divider />

                      <v-card-actions class="justify-end">
                        <v-btn variant="text" @click="openClanDetail(clan)">자세히</v-btn>

                        <v-btn
                          color="primary"
                          :disabled="clan.members >= clan.capacity"
                          @click="openJoinDialog(clan)"
                        >
                          {{ clan.joinType === 'approval' ? '가입 신청' : '바로 가입' }}
                        </v-btn>
                      </v-card-actions>
                    </v-card>
                  </v-col>
                </v-row>

                <div v-if="!clans.length" class="text-center py-10 text-medium-emphasis">
                  검색 결과가 없어. 필터를 바꾸거나 다른 키워드로 찾아봐.
                </div>

                <div class="d-flex justify-center mt-6">
                  <v-pagination v-model="page" :length="totalPages" rounded="circle" />
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-window-item>
      </v-window>
    </v-card>

    <!-- ===================== -->
    <!-- Create Dialog -->
    <!-- ===================== -->
    <v-dialog v-model="createDialog" max-width="560">
      <v-card rounded="xl">
        <v-card-title class="text-h6 font-weight-bold">클랜 만들기</v-card-title>
        <v-card-text>
          <v-text-field v-model="form.name" label="클랜명" />
          <!-- <v-text-field
            v-model="form.tag"
            label="태그 (3~5자)"
            hint="닉네임 옆에 표시됨"
            persistent-hint
          /> -->
          <v-textarea v-model="form.description" label="소개" rows="3" />

          <!-- <v-select v-model="form.joinType" :items="joinTypeCreateItems" label="가입 방식" />
          <v-select v-model="form.playStyle" :items="playStyleItems" label="플레이 성향" /> -->
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn variant="text" @click="createDialog = false">취소</v-btn>
          <v-btn color="primary" @click="onCreate">생성</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="joinDialog" max-width="460">
      <v-card rounded="xl">
        <v-card-title class="text-h6 font-weight-bold">클랜 가입</v-card-title>

        <v-card-text class="text-body-2 text-medium-emphasis">
          <div>
            <b>{{ selectedClan?.name }}</b> 클랜에 합류 하시겠습니까?
          </div>
          <div v-if="selectedClan?.joinType === 'approval'" class="mt-1">
            (승인제 클랜입니다. 가입 신청이 전송돼요.)
          </div>
        </v-card-text>

        <v-card-actions class="justify-end">
          <v-btn variant="text" @click="joinDialog = false">취소</v-btn>
          <v-btn color="primary" :loading="joining" :disabled="joining" @click="confirmJoin">
            확인
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ===================== -->
    <!-- Filter Drawer -->
    <!-- ===================== -->
    <v-navigation-drawer v-model="filterDrawer" location="right" temporary width="360">
      <v-toolbar title="필터" />
      <v-divider />
      <v-container>
        <v-range-slider
          v-model="memberRange"
          :min="0"
          :max="100"
          step="5"
          label="멤버 수 범위"
          thumb-label
        />
        <v-checkbox v-model="hasSeatOnly" label="빈자리 있는 클랜만" />
        <v-btn block color="primary" @click="applyFilters">적용</v-btn>
        <v-btn block variant="text" @click="resetFilters">초기화</v-btn>
      </v-container>
    </v-navigation-drawer>

    <v-snackbar v-model="snackbar.show" :timeout="2200">
      {{ snackbar.msg }}
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { getBaseUrl } from '@/@core/composable/createUrl';
import { computed, onMounted, ref, watch } from 'vue';
import api from '@/@core/composable/useAxios';
import { useAccountStore } from '@/stores/useAccountStore';
import { useRouter } from 'vue-router';
import { CLAN_PATH } from '@/router/clan/type';

const router = useRouter();
const account = useAccountStore();

const joinDialog = ref(false);
const selectedClan = ref<Clan | null>(null);
const joining = ref(false);

function openJoinDialog(clan: Clan) {
  selectedClan.value = clan;
  joinDialog.value = true;
}

async function confirmJoin() {
  if (!selectedClan.value) return;

  joining.value = true;
  try {
    // ✅ 가입/신청 정책에 맞게 API 분기 가능
    // 승인제면 /clan/apply 같은 API로 분리 추천
    await api.post(`${getBaseUrl('DATA')}/account/update`, {
      id: account.id,
      clan_id: selectedClan.value.id,
    });

    toast('클랜에 합류했어.');
    joinDialog.value = false;

    router.replace(CLAN_PATH.VIEW(selectedClan.value.name));
  } catch (err) {
    toast('클랜 가입 중 오류가 발생했어.');
  } finally {
    joining.value = false;
  }
}

// ✅ snackbar 선언 (없어서 터지는 부분)
const snackbar = ref({ show: false, msg: '' });

// ✅ create 상태
const creating = ref(false);

// ✅ 필드 에러 (409일 때 name 아래 표시)
const nameError = ref<string | null>(null);

function toast(msg: string) {
  snackbar.value.msg = msg;
  snackbar.value.show = true;
}

type Clan = {
  id: number;
  name: string;
  tag: string;
  description: string;
  members: number;
  capacity: number;
  playStyle: 'casual' | 'rank';
  joinType: 'open' | 'approval';
  activity: number;
  playStyleLabel: string;
  joinTypeLabel: string;
};

const tab = ref<'guide' | 'search'>('guide');

/** Create */
const createDialog = ref(false);
const form = ref({
  name: '',
  description: '',
  account_id: 0,
  tag: '',
  desc: '',
  joinType: 'approval',
  playStyle: 'casual',
});

const joinTypeCreateItems = [
  { title: '승인제', value: 'approval' },
  { title: '자유가입', value: 'open' },
];
const playStyleItems = [
  { title: '캐주얼', value: 'casual' },
  { title: '랭크', value: 'rank' },
];

function openCreateDialog() {
  createDialog.value = true;
}

async function onCreate() {
  // 기본 검증
  const name = form.value.name.trim();
  if (!name) {
    nameError.value = '클랜명을 입력해줘.';
    return;
  }

  nameError.value = null;
  creating.value = true;

  const data = await api.post(`${getBaseUrl('DATA')}/clan/create`, {
    name,
    description: form.value.description,
    account_id: account.id,
  });

  if (data.status == 409) {
    nameError.value = '이미 존재하는 클랜명이야. 다른 이름으로 다시 만들어줘.';
    toast('같은 클랜명이 존재해');
    return;
  } else {
    form.value.name = '';
    form.value.description = '';
    createDialog.value = false;
    toast('클랜이 생성되었어.');

    router.replace(CLAN_PATH.VIEW(data.data.datas?.name));
  }

  // 성공
}

/** Search */
const q = ref('');
const sort = ref<'latest' | 'members' | 'activity'>('latest');
const sortItems = [
  { title: '최신순', value: 'latest' },
  { title: '인원 많은 순', value: 'members' },
  { title: '활동도 높은 순', value: 'activity' },
];

const playStyle = ref<'any' | 'casual' | 'rank'>('any');
const joinType = ref<'any' | 'open' | 'approval'>('any');

//const page = ref(1);
const pageSize = 9;
const total = ref(0);

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize)));

const loading = ref(false);
const clans = ref<Clan[]>([]);

/** Filter drawer */
const filterDrawer = ref(false);
const memberRange = ref<[number, number]>([0, 100]);
const hasSeatOnly = ref(false);

function applyFilters() {
  filterDrawer.value = false;
  page.value = 1;
  runSearch();
}

function resetFilters() {
  memberRange.value = [0, 100];
  hasSeatOnly.value = false;
  page.value = 1;
  runSearch();
  filterDrawer.value = false;
}

/** debounce */
let timer: any = null;
function debouncedSearch() {
  clearTimeout(timer);
  timer = setTimeout(() => {
    page.value = 1;
    runSearch();
  }, 250);
}

/** 실제 검색 호출 */
async function runSearch() {
  loading.value = true;
  try {
    // TODO: 서버 연결 시 파라미터 그대로 넘기면 됨
    const params = {
      q: q.value,
      sort: sort.value,
      playStyle: playStyle.value,
      joinType: joinType.value,
      page: page.value,
      size: pageSize,
      memberMin: memberRange.value[0],
      memberMax: memberRange.value[1],
      hasSeatOnly: hasSeatOnly.value,
    };
    // const res = await api.get('/clans/search', { params })
    // clans.value = res.data.items
    // total.value = res.data.total

    // ✅ 샘플 데이터 (프론트만으로도 UI 확인 가능)
    const sample = makeSample(params);
    clans.value = sample.items;
    total.value = sample.total;
  } finally {
    loading.value = false;
  }
}

function openClanDetail(c: Clan) {
  // TODO: 상세 다이얼로그/페이지 라우팅
  console.log('detail', c);
}

async function onJoin(c: Clan) {
  await api.post(`${getBaseUrl('DATA')}/account/update`, {
    id: account.id,
    clan_id: c.id,
  });
  router.replace(CLAN_PATH.VIEW(c.name));
}

/** watchers */
watch([q], () => debouncedSearch());
watch([sort, playStyle, joinType], () => {
  page.value = 1;
  runSearch();
});
//watch(page, () => runSearch());

onMounted(() => {
  handleSearch();
});

const search = ref<string>('');
const serverItems = ref<Clan[]>([]);
const totalItems = ref<number>(0);

const itemsPerPage = ref<number>(10);
const page = ref<number>(1);

type DataTableOptions = {
  page: number;
  itemsPerPage: number;
  sortBy: { key: string; order: 'asc' | 'desc' | false }[];
};

function handleSearch() {
  loadItems({
    page: 1,
    itemsPerPage: itemsPerPage.value,
    sortBy: [],
  });
}

async function loadItems(options: DataTableOptions) {
  loading.value = true;

  try {
    const sortKey = options.sortBy[0]?.key || 'created_at';
    const sortOrder =
      options.sortBy[0]?.order === 'asc' || options.sortBy[0]?.order === 'desc'
        ? options.sortBy[0].order
        : 'desc';

    const response = await api.get(`${getBaseUrl('DATA')}/clan/search`, {
      params: {
        keyword: search.value,
        page: options.page,
        itemsPerPage: options.itemsPerPage,
        sortBy: sortKey,
        orderBy: sortOrder,
      },
    });

    serverItems.value = response.data.datas;
    totalItems.value = response.data.totalCount;

    page.value = options.page;
    itemsPerPage.value = options.itemsPerPage;
  } catch (error) {
    console.error('게시판 목록 불러오기 실패:', error);
  } finally {
    loading.value = false;
  }
}

/** ----------------------
 *  샘플 데이터 생성기
 *  ---------------------- */
function makeSample(params: any): { items: Clan[]; total: number } {
  const all: Clan[] = Array.from({ length: 32 }).map((_, i) => {
    const joinType = i % 3 === 0 ? 'approval' : 'open';
    const playStyle = i % 2 === 0 ? 'casual' : 'rank';
    const members = (i * 3) % 100;
    const capacity = 100;
    return {
      id: i + 1,
      name: `Clan ${i + 1}`,
      tag: `TAG${(i % 99) + 1}`,
      desc: '클랜 소개 문구가 들어가는 자리. 분위기/시간대/디스코드 여부 등.',
      members,
      capacity,
      playStyle,
      joinType,
      activity: 10 + (i % 90),
      playStyleLabel: playStyle === 'casual' ? '캐주얼' : '랭크',
      joinTypeLabel: joinType === 'approval' ? '승인제' : '자유가입',
    };
  });

  // 간단 필터링
  const keyword = (params.q ?? '').trim().toLowerCase();
  let filtered = all.filter((c) => {
    if (keyword) {
      const s = `${c.name} ${c.tag} ${c.desc}`.toLowerCase();
      if (!s.includes(keyword)) return false;
    }
    if (params.playStyle !== 'any' && c.playStyle !== params.playStyle) return false;
    if (params.joinType !== 'any' && c.joinType !== params.joinType) return false;
    if (c.members < params.memberMin || c.members > params.memberMax) return false;
    if (params.hasSeatOnly && c.members >= c.capacity) return false;
    return true;
  });

  // 정렬
  if (params.sort === 'members') filtered = filtered.sort((a, b) => b.members - a.members);
  if (params.sort === 'activity') filtered = filtered.sort((a, b) => b.activity - a.activity);
  // latest는 샘플이라 id 역순으로
  if (params.sort === 'latest') filtered = filtered.sort((a, b) => b.id - a.id);

  const total = filtered.length;
  const start = (params.page - 1) * params.size;
  const items = filtered.slice(start, start + params.size);
  return { items, total };
}
</script>

<style scoped>
.gap-2 {
  gap: 8px;
}
</style>
