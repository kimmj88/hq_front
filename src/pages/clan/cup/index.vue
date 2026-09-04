<template>
  <v-container class="competition-list-page py-8">
    <section class="page-hero mb-6">
      <div>
        <div class="hero-eyebrow">
          <v-icon size="16">mdi-trophy-variant-outline</v-icon>
          CLAN CUP
        </div>
        <h1>내전 컵</h1>
        <p>여러 팀이 참가하는 내전 컵을 만들고 팀 구성과 우승 결과를 관리하세요.</p>
      </div>

      <div class="hero-count">
        <strong>{{ totalItems }}</strong>
        <span>전체 내전 컵</span>
      </div>
    </section>

    <v-card class="competition-panel" rounded="xl" elevation="0">
      <div class="toolbar">
        <v-text-field
          v-model="search"
          placeholder="내전 컵 이름 검색"
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
          v-if="can('CUP', 'CLAN-SET-CUP-C')"
          class="create-button"
          color="primary"
          height="48"
          rounded="lg"
          prepend-icon="mdi-plus"
          @click="$router.push(CLAN_PATH.CUP_ADD(account.clan.name))"
        >
          새 내전 컵 만들기
        </v-btn>
      </div>

      <server-data-table
        class="competition-table"
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
          <router-link :to="CLAN_PATH.CUP_VIEW(account.clan.name, item.id)" class="competition-link">
            <span class="competition-icon competition-icon--cup"><v-icon size="18">mdi-trophy-outline</v-icon></span>
            <span>{{ item.name }}</span>
            <v-icon class="link-arrow" size="16">mdi-chevron-right</v-icon>
          </router-link>
        </template>

        <template #item.type="{ item }">
          <v-chip size="small" variant="tonal" color="indigo" class="font-weight-bold">
            {{ item.type }}
          </v-chip>
        </template>

        <template #item.team_count="{ item }">
          <div class="team-count">
            <v-icon size="17">mdi-account-group-outline</v-icon>
            <strong>{{ item.team_count }}</strong>
            <span>팀 · {{ item.team_count * 5 }}명</span>
          </div>
        </template>

        <template #item.is_confirm="{ item }">
          <span :class="['status-pill', item.is_confirm ? 'is-complete' : 'is-waiting']">
            <i />{{ item.is_confirm ? '팀 확정' : '구성 중' }}
          </span>
        </template>

        <template #item.created_at="{ item }">
          {{ formatDate(item.created_at) }}
        </template>

        <template #item.updated_at="{ item }">
          {{ formatDate(item.updated_at) }}
        </template>

        <template #item.actions="{ item }">
          <v-tooltip v-if="can('CUP', 'CLAN-SET-CUP-D')" text="삭제">
            <template #activator="{ props }">
              <v-btn
                v-bind="props"
                icon
                variant="text"
                color="error"
                density="comfortable"
                @click="deleteItem(item)"
              >
                <v-icon size="18">mdi-delete</v-icon>
              </v-btn>
            </template>
          </v-tooltip>
        </template>
      </server-data-table>
    </v-card>
  </v-container>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { can } from '@/stores/useClanPermissionStore';
import { getBaseUrl } from '@/@core/composable/createUrl';
import api from '@/@core/composable/useAxios';
import type { VDataTableServer } from 'vuetify/components';
import { CLAN_PATH } from '@/router/clan/type';
import { useAccountStore } from '@/stores/useAccountStore';

const account = useAccountStore();
const search = ref('');
const serverItems = ref<CupListItem[]>([]);
const loading = ref(false);
const totalItems = ref(0);
const page = ref(1);
const itemsPerPage = ref(10);

interface CupListItem {
  id: number;
  name: string;
  type: string;
  team_count: number;
  is_confirm: boolean;
  created_at: string;
  updated_at: string;
}

interface FetchParams {
  keyword: string;
  page: number;
  itemsPerPage: number;
  sortBy: { key: keyof CupListItem; order: 'asc' | 'desc' }[];
}

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
  { title: '내전 컵', key: 'name', sortable: true },
  { title: '방식', key: 'type', sortable: true },
  { title: '참가 규모', key: 'team_count', sortable: true },
  { title: '상태', key: 'is_confirm' },
  { title: '생성일', key: 'created_at', sortable: true },
  { title: '수정일', key: 'updated_at', sortable: true },
  { title: '', key: 'actions', sortable: false, align: 'center', width: '1px' },
]);

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

    loading.value = true;
    const response = await api.get(`${getBaseUrl('DATA')}/cup/search`, {
      params: {
        keyword: search.value,
        page: normalizedOptions.page,
        itemsPerPage: normalizedOptions.itemsPerPage,
        sortBy: normalizedOptions.sortBy[0]?.key || 'created_at',
        orderBy: normalizedOptions.sortBy[0]?.order || 'desc',
        clan: account.clan,
      },
    });
    serverItems.value = response.data.datas ?? [];
    totalItems.value = response.data.totalCount ?? 0;
  } catch (error) {
    console.error('내전 컵 목록을 불러오지 못했습니다.', error);
  } finally {
    loading.value = false;
  }
}

async function deleteItem(item: CupListItem) {
  if (!confirm(`정말로 '${item.name}'을(를) 삭제하시겠습니까?`)) return;
  try {
    await api.post(`${getBaseUrl('DATA')}/cup/delete`, { id: item.id });
    await loadItems(lastOptions.value);
  } catch (error) {
    console.error('내전 컵 삭제에 실패했습니다.', error);
    alert('삭제 중 오류가 발생했습니다.');
  }
}

function handleSearch() {
  page.value = 1;
  loadItems({ ...lastOptions.value, keyword: search.value, page: 1 });
}

function handleClear() {
  search.value = '';
  handleSearch();
}

function formatDate(value?: string) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'Asia/Seoul',
  }).format(new Date(value));
}
</script>

<style scoped>
.cup-page { max-width: 1440px; }
.page-hero {
  position: relative; display: flex; align-items: flex-end; justify-content: space-between;
  overflow: hidden; padding: 32px 36px; border: 1px solid rgba(var(--v-theme-primary), 0.2);
  border-radius: 24px;
  background: radial-gradient(circle at 85% 20%, rgba(var(--v-theme-primary), 0.22), transparent 34%),
    linear-gradient(135deg, rgba(35, 28, 62, 0.98), rgba(20, 20, 30, 0.98));
}
.hero-eyebrow { display: flex; align-items: center; gap: 7px; margin-bottom: 10px; color: rgb(var(--v-theme-primary)); font-size: 12px; font-weight: 800; letter-spacing: 0.14em; }
.page-hero h1 { margin: 0; font-size: clamp(28px, 4vw, 42px); line-height: 1.15; letter-spacing: -0.04em; }
.page-hero p { margin: 10px 0 0; color: rgba(255, 255, 255, 0.58); }
.hero-count { display: flex; min-width: 108px; flex-direction: column; align-items: flex-end; }
.hero-count strong { font-size: 36px; line-height: 1; }
.hero-count span { margin-top: 7px; color: rgba(255, 255, 255, 0.52); font-size: 12px; }
.cup-panel { overflow: hidden; border: 1px solid rgba(255, 255, 255, 0.08); background: rgba(var(--v-theme-surface), 0.78); backdrop-filter: blur(16px); }
.toolbar { display: flex; gap: 10px; align-items: center; padding: 20px; border-bottom: 1px solid rgba(255, 255, 255, 0.07); }
.search-field { max-width: 360px; }
.create-button { margin-left: auto; font-weight: 700; }
.cup-table :deep(th) { height: 52px !important; color: rgba(255, 255, 255, 0.48) !important; font-size: 12px !important; font-weight: 700 !important; }
.cup-table :deep(td) { height: 72px !important; border-color: rgba(255, 255, 255, 0.055) !important; }
.cup-table :deep(tbody tr) { transition: background-color 0.2s ease; }
.cup-table :deep(tbody tr:hover) { background: rgba(var(--v-theme-primary), 0.055) !important; }
.cup-link { display: inline-flex; align-items: center; gap: 10px; color: inherit; text-decoration: none; font-weight: 700; transition: color 0.2s ease; }
.cup-link:hover { color: rgb(var(--v-theme-primary)); }
.cup-icon { display: inline-grid; width: 34px; height: 34px; place-items: center; border-radius: 10px; color: #fbbf24; background: rgba(245, 158, 11, 0.12); }
.link-arrow { opacity: 0; transform: translateX(-4px); transition: 0.2s ease; }
.cup-link:hover .link-arrow { opacity: 1; transform: translateX(0); }
.team-count { display: inline-flex; align-items: center; gap: 6px; }
.team-count strong { color: rgb(var(--v-theme-primary)); }
.team-count span { color: rgba(255, 255, 255, 0.45); font-size: 11px; }
.status-pill { display: inline-flex; align-items: center; gap: 7px; padding: 6px 10px; border-radius: 999px; font-size: 12px; font-weight: 700; }
.status-pill i { width: 6px; height: 6px; border-radius: 50%; background: currentColor; box-shadow: 0 0 8px currentColor; }
.is-complete { color: #51d88a; background: rgba(81, 216, 138, 0.1); }
.is-waiting { color: #aeb5c4; background: rgba(174, 181, 196, 0.09); }
@media (max-width: 700px) {
  .cup-page { padding-inline: 12px !important; }
  .page-hero { align-items: flex-start; padding: 24px; }
  .page-hero p, .hero-count { display: none; }
  .toolbar { flex-wrap: wrap; padding: 14px; }
  .search-field { max-width: none; flex: 1 1 calc(100% - 78px); }
  .create-button { width: 100%; margin-left: 0; }
}
</style>
