<template>
  <v-container class="match-page py-8">
    <section class="page-hero mb-6">
      <div>
        <div class="hero-eyebrow">
          <v-icon size="16">mdi-sword-cross</v-icon>
          CLAN MATCH
        </div>
        <h1>내전 매치</h1>
        <p>클랜 매치를 만들고 참가 현황과 결과를 한곳에서 관리하세요.</p>
      </div>

      <div class="hero-count">
        <strong>{{ totalItems }}</strong>
        <span>전체 매치</span>
      </div>
    </section>

    <v-card class="match-panel" rounded="xl" elevation="0">
      <div class="toolbar">
        <v-text-field
          v-model="search"
          placeholder="매치 이름 검색"
          density="comfortable"
          hide-details
          clearable
          prepend-inner-icon="mdi-magnify"
          variant="solo-filled"
          flat
          class="search-field"
          @keyup.enter="handleSearch"
          @click:clear="handleClear"
        />
        <v-btn class="search-button" color="primary" height="48" rounded="lg" @click="handleSearch">
          검색
        </v-btn>
        <v-btn
          v-if="can('MATCH', 'CLAN-SET-MATCH-C')"
          class="create-button"
          color="primary"
          height="48"
          rounded="lg"
          prepend-icon="mdi-plus"
          @click="$router.push(CLAN_PATH.MATCH_ADD(account.clan.name))"
        >
          새 매치 만들기
        </v-btn>
      </div>

      <server-data-table
        class="match-table"
        :headers="headers"
        :items="serverItems"
        :items-length="totalItems"
        :items-per-page="itemsPerPage"
        :page="page"
        :sort-by="lastOptions.sortBy"
        :loading="loading"
        :search="search"
        @update:page="handlePageChange"
        @update:items-per-page="itemsPerPage = $event"
        @update:options="loadItems"
      >
      <template #item.name="{ item }">
        <router-link :to="CLAN_PATH.MATCH_VIEW(account.clan.name, item.id)" class="match-link">
          <span class="match-icon"><v-icon size="18">mdi-gamepad-variant-outline</v-icon></span>
          <span>{{ item.name }}</span>
          <v-icon class="link-arrow" size="16">mdi-chevron-right</v-icon>
        </router-link>
      </template>

      <template #item.type="{ item }">
        <v-chip size="small" variant="tonal" color="indigo" class="font-weight-bold">
          {{ item.type }}
        </v-chip>
      </template>

      <template #item.created_by="{ item }">
        <div v-if="item.created_by" class="creator-cell">
          <v-avatar size="30" color="blue-grey-darken-2">
            <v-img
              v-if="item.created_by.avatar"
              :src="avatarUrl(item.created_by.avatar)"
              cover
            />
            <span v-else class="text-caption font-weight-bold">
              {{ creatorInitial(item.created_by.nickname || item.created_by.name) }}
            </span>
          </v-avatar>
          <div class="creator-copy">
            <strong>{{ item.created_by.nickname || item.created_by.name }}</strong>
            <small>생성자</small>
          </div>
        </div>
        <span v-else class="text-medium-emphasis">-</span>
      </template>

      <template #item.is_confirm="{ item }">
        <span :class="['status-pill', item.is_confirm ? 'is-complete' : 'is-waiting']">
          <i />{{ item.is_confirm ? '확정' : '진행 전' }}
        </span>
      </template>

      <template #item.winner_team="{ item }">
        <span v-if="item.winner_team" class="winner-text">
          <v-icon size="16" color="amber">mdi-trophy</v-icon>
          {{ item.winner_team }}팀
        </span>
        <span v-else class="text-medium-emphasis">미정</span>
      </template>

      <template #item.actions="{ item }">
        <!-- <v-tooltip text="수정">
            <template #activator="{ props }">
              <v-btn
                v-bind="props"
                icon
                variant="text"
                color="primary"
                density="comfortable"
                @click="modifyItem(item)"
              >
                <v-icon size="18"> mdi-pencil </v-icon>
              </v-btn>
            </template>
          </v-tooltip> -->

        <v-tooltip v-if="can('MATCH', 'CLAN-SET-MATCH-D')" text="삭제">
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              icon
              variant="text"
              color="error"
              density="comfortable"
              @click="deleteItem(item)"
            >
              <v-icon size="18"> mdi-delete </v-icon>
            </v-btn>
          </template>
        </v-tooltip>
      </template>

      <!-- <template v-slot:item.actions="{ item }">
          <v-menu location="bottom end">
            <template #activator="{ props }">
              <v-btn v-bind="props" icon variant="text" density="comfortable">
                <v-icon size="20">mdi-dots-vertical</v-icon>
              </v-btn>
            </template>
    
            <v-list>
              <v-list-item @click="modifyItem(item)">
                <v-list-item-title>수정</v-list-item-title>
              </v-list-item>
              <v-list-item @click="deleteItem(item)">
                <v-list-item-title class="text-error">삭제</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </template> -->

      <template #item.created_at="{ item }">
        {{ item.created_at.slice(0, 10) }}
      </template>

      <template #item.updated_at="{ item }">
        {{ item.updated_at.slice(0, 10) }}
      </template>
      </server-data-table>
    </v-card>
  </v-container>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { can } from '@/stores/useClanPermissionStore';
import { getBaseUrl } from '@/@core/composable/createUrl';
import api from '@/@core/composable/useAxios';
import type { VDataTableServer } from 'vuetify/components';
import { CLAN_PATH } from '@/router/clan/type';
import { useAccountStore } from '@/stores/useAccountStore';

const account = useAccountStore();

const search = ref<string>('');
const serverItems = ref<Match[]>([]);
const loading = ref<boolean>(false);
const totalItems = ref<number>(0);
const router = useRouter();

interface Match {
  id: number;
  name: string;
  type: string;
  created_at: string;
  updated_at: string;
  is_confirm: boolean;
  winner_team: number | null;
  created_by: {
    id: number;
    name: string;
    nickname: string;
    avatar: string | null;
  } | null;
}

interface FetchParams {
  keyword: string;
  page: number;
  itemsPerPage: number;
  sortBy: { key: keyof Match; order: 'asc' | 'desc' }[];
}

interface FetchResponse {
  items: Match[];
  total: number;
}

const page = ref<number>(1);
const itemsPerPage = ref<number>(10);
const lastOptions = ref<FetchParams>({
  keyword: '',
  page: 1,
  itemsPerPage: itemsPerPage.value,
  sortBy: [],
});

let pendingPageChange = false;

function handlePageChange(nextPage: number) {
  page.value = nextPage;
  pendingPageChange = true;
}
const headers = ref<VDataTableServer['headers']>([
  {
    title: '매치',
    sortable: true,
    key: 'name',
  },
  {
    title: '방식',
    sortable: true,
    key: 'type',
  },
  {
    title: '생성자',
    key: 'created_by',
    sortable: false,
  },
  {
    title: '상태',
    key: 'is_confirm',
  },
  {
    title: '승리 팀',
    key: 'winner_team',
  },
  { title: '생성일', key: 'created_at', sortable: true },
  { title: '수정일', key: 'updated_at', sortable: true },
  {
    title: '',
    key: 'actions',
    sortable: false,
    align: 'center',
    width: '1px',
  },
]);

// ✅ 데이터 로드 함수
async function loadItems(options: FetchParams) {
  try {
    const requestedPage = pendingPageChange ? page.value : options.page || page.value;
    pendingPageChange = false;

    const normalizedOptions: FetchParams = {
      ...options,
      keyword: search.value,
      page: requestedPage,
      itemsPerPage: options.itemsPerPage || itemsPerPage.value,
      sortBy: options.sortBy ?? [],
    };
    lastOptions.value = normalizedOptions;
    page.value = normalizedOptions.page;
    itemsPerPage.value = normalizedOptions.itemsPerPage;

    const sortKey = normalizedOptions.sortBy[0]?.key || 'created_at';
    const sortOrder = normalizedOptions.sortBy[0]?.order || 'desc';

    loading.value = true;

    const response = await api.get(`${getBaseUrl('DATA')}/match/search`, {
      params: {
        keyword: search.value,
        page: normalizedOptions.page,
        itemsPerPage: normalizedOptions.itemsPerPage,
        sortBy: sortKey,
        orderBy: sortOrder,
        clan: account.clan,
      },
    });

    serverItems.value = response.data.datas;
    totalItems.value = response.data.totalCount;
  } catch (error) {
    console.error('기업 목록 불러오기 실패:', error);
  } finally {
    loading.value = false;
  }
}

function modifyItem(item: Match) {
  //router.push(MERCHANDISE_PATH.MODIFY(item.id));
}

async function deleteItem(item: Match) {
  if (confirm(`정말로 '${item.name}'을(를) 삭제하시겠습니까?`)) {
    try {
      await api.post(`${getBaseUrl('DATA')}/match/delete`, { id: item.id });
      alert('삭제 완료!');
      loadItems({
        keyword: '',
        page: 1,
        itemsPerPage: itemsPerPage.value,
        sortBy: [],
      }); // 목록 갱신
    } catch (error) {
      console.error('삭제 실패:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  }
}

function handleSearch() {
  loadItems({
    keyword: search.value,
    page: 1,
    itemsPerPage: itemsPerPage.value,
    sortBy: [],
  });
}

function handleClear() {
  search.value = '';
  handleSearch();
}

function avatarUrl(value: string) {
  return /^https?:\/\//i.test(value)
    ? value
    : `${getBaseUrl('DATA').replace(/\/$/, '')}${value}`;
}

function creatorInitial(value?: string) {
  return value?.trim().slice(0, 2) || '?';
}
</script>

<style scoped>
.match-page {
  max-width: 1440px;
}

.page-hero {
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  overflow: hidden;
  padding: 32px 36px;
  border: 1px solid rgba(var(--v-theme-primary), 0.2);
  border-radius: 24px;
  background:
    radial-gradient(circle at 85% 20%, rgba(var(--v-theme-primary), 0.22), transparent 34%),
    linear-gradient(135deg, rgba(35, 28, 62, 0.98), rgba(20, 20, 30, 0.98));
}

.hero-eyebrow {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 10px;
  color: rgb(var(--v-theme-primary));
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.14em;
}

.page-hero h1 {
  margin: 0;
  font-size: clamp(28px, 4vw, 42px);
  line-height: 1.15;
  letter-spacing: -0.04em;
}

.page-hero p {
  margin: 10px 0 0;
  color: rgba(255, 255, 255, 0.58);
}

.hero-count {
  display: flex;
  min-width: 108px;
  flex-direction: column;
  align-items: flex-end;
}

.hero-count strong {
  font-size: 36px;
  line-height: 1;
}

.hero-count span {
  margin-top: 7px;
  color: rgba(255, 255, 255, 0.52);
  font-size: 12px;
}

.match-panel {
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(var(--v-theme-surface), 0.78);
  backdrop-filter: blur(16px);
}

.toolbar {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
}

.search-field {
  max-width: 360px;
}

.create-button {
  margin-left: auto;
  font-weight: 700;
}

.match-table :deep(th) {
  height: 52px !important;
  color: rgba(255, 255, 255, 0.48) !important;
  font-size: 12px !important;
  font-weight: 700 !important;
}

.match-table :deep(td) {
  height: 72px !important;
  border-color: rgba(255, 255, 255, 0.055) !important;
}

.match-table :deep(tbody tr) {
  transition: background-color 0.2s ease;
}

.match-table :deep(tbody tr:hover) {
  background: rgba(var(--v-theme-primary), 0.055) !important;
}

.match-link {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: inherit;
  text-decoration: none;
  font-weight: 700;
  transition: color 0.2s ease;
}

.match-link:hover {
  color: rgb(var(--v-theme-primary));
}

.match-icon {
  display: inline-grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border-radius: 10px;
  color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.12);
}

.link-arrow {
  opacity: 0;
  transform: translateX(-4px);
  transition: 0.2s ease;
}

.match-link:hover .link-arrow {
  opacity: 1;
  transform: translateX(0);
}

.creator-cell {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}

.creator-copy {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.creator-copy strong {
  font-size: 13px;
}

.creator-copy small {
  margin-top: 3px;
  color: rgba(255, 255, 255, 0.4);
  font-size: 10px;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.status-pill i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  box-shadow: 0 0 8px currentColor;
}

.is-complete {
  color: #51d88a;
  background: rgba(81, 216, 138, 0.1);
}

.is-waiting {
  color: #aeb5c4;
  background: rgba(174, 181, 196, 0.09);
}

.winner-text {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-weight: 700;
}

@media (max-width: 700px) {
  .match-page {
    padding-inline: 12px !important;
  }

  .page-hero {
    align-items: flex-start;
    padding: 24px;
  }

  .page-hero p,
  .hero-count {
    display: none;
  }

  .toolbar {
    flex-wrap: wrap;
    padding: 14px;
  }

  .search-field {
    max-width: none;
    flex: 1 1 calc(100% - 78px);
  }

  .create-button {
    width: 100%;
    margin-left: 0;
  }
}
</style>
