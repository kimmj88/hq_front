<template>
  <v-container class="notice-page py-8">
    <header class="notice-header">
      <div>
        <span class="eyebrow">CLAN NOTICE</span>
        <h1>공지사항</h1>
        <p>클랜 소식과 업데이트를 확인하세요.</p>
      </div>
      <v-btn
        v-if="can('NOTICE', 'CLAN-SET-NOTICE-C')"
        color="primary"
        rounded="lg"
        prepend-icon="mdi-pencil-outline"
        @click="router.push(CLAN_PATH.NOTICE_ADD(account.clan.name))"
      >
        글쓰기
      </v-btn>
    </header>

    <div class="notice-toolbar">
      <v-btn-toggle v-model="selectedType" mandatory class="type-filter" color="primary">
        <v-btn v-for="type in noticeTypes" :key="type.value" :value="type.value">
          {{ type.label }}
        </v-btn>
      </v-btn-toggle>

      <div class="toolbar-right">
        <v-text-field
          v-model="search"
          density="compact"
          variant="solo-filled"
          flat
          hide-details
          clearable
          placeholder="공지 검색"
          prepend-inner-icon="mdi-magnify"
          @keyup.enter="handleSearch"
          @click:clear="handleClear"
        />
      </div>
    </div>

    <div v-if="loading" class="notice-loading">
      <v-progress-circular indeterminate color="primary" />
    </div>

    <v-alert v-else-if="!serverItems.length" type="info" variant="tonal" rounded="lg">
      등록된 공지사항이 없습니다.
    </v-alert>

    <section v-else class="notice-list">
      <article
        v-for="item in serverItems"
        :key="item.id"
        class="notice-card"
        tabindex="0"
        @click="onClickRow(item)"
        @keydown.enter="onClickRow(item)"
      >
        <div class="notice-meta">
          <span v-if="item.is_pin" class="pin-badge"><v-icon size="13">mdi-pin</v-icon> 상단</span>
          <span :class="['type-badge', `is-${noticeMeta(item.notice_type).className}`]">
            {{ noticeMeta(item.notice_type).label }}
          </span>
          <time>{{ formatDate(item.created_at) }}</time>
        </div>
        <h2>{{ item.title }}</h2>
        <p>{{ excerpt(item.description) }}</p>
        <v-btn class="notice-arrow" icon="mdi-arrow-right" variant="text" size="small" tabindex="-1" />
      </article>
    </section>

    <footer v-if="totalItems" class="notice-footer">
      <span>{{ pageStart }}–{{ pageEnd }} / {{ totalItems }}</span>
      <div>
        <v-select
          v-model="itemsPerPage"
          :items="[10, 20, 50]"
          density="compact"
          variant="outlined"
          hide-details
          @update:model-value="onChangePerPage"
        />
        <v-pagination v-model="page" :length="pageCount" density="comfortable" @update:model-value="onChangePage" />
      </div>
    </footer>
  </v-container>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/@core/composable/useAxios';
import { getBaseUrl } from '@/@core/composable/createUrl';
import type { Board } from '@/data/types/board';
import { CLAN_PATH } from '@/router/clan/type';
import { can } from '@/stores/useClanPermissionStore';
import { useAccountStore } from '@/stores/useAccountStore';

type NoticeType = 'ALL' | 'URGENT' | 'EVENT' | 'GENERAL' | 'PATCH_NOTE';

const account = useAccountStore();
const router = useRouter();
const search = ref('');
const serverItems = ref<Board[]>([]);
const loading = ref(false);
const totalItems = ref(0);
const itemsPerPage = ref(10);
const page = ref(1);
const selectedType = ref<NoticeType>('ALL');

const noticeTypes: { label: string; value: NoticeType }[] = [
  { label: '전체', value: 'ALL' },
  { label: '긴급', value: 'URGENT' },
  { label: '이벤트', value: 'EVENT' },
  { label: '일반', value: 'GENERAL' },
  { label: '패치노트', value: 'PATCH_NOTE' },
];
const pageCount = computed(() => Math.max(1, Math.ceil(totalItems.value / itemsPerPage.value)));
const pageStart = computed(() => totalItems.value ? (page.value - 1) * itemsPerPage.value + 1 : 0);
const pageEnd = computed(() => Math.min(page.value * itemsPerPage.value, totalItems.value));

function noticeMeta(type?: Board['notice_type']) {
  if (type === 'URGENT') return { label: '긴급', className: 'urgent' };
  if (type === 'EVENT') return { label: '이벤트', className: 'event' };
  if (type === 'PATCH_NOTE') return { label: '패치노트', className: 'patch' };
  return { label: '일반', className: 'general' };
}
function formatDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
    .format(new Date(value)).replace(/\. /g, '.').replace(/\.$/, '');
}
function excerpt(value: unknown) {
  const text = String(value ?? '')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
  return text || '공지 내용을 확인하세요.';
}
function onClickRow(item: Board) {
  router.push(CLAN_PATH.NOTICE_VIEW(account.clan.name, item.id));
}

type DataTableOptions = { page: number; itemsPerPage: number; sortBy: { key: string; order: 'asc' | 'desc' | false }[] };
async function loadItems(options: DataTableOptions = { page: page.value, itemsPerPage: itemsPerPage.value, sortBy: [] }) {
  try {
    loading.value = true;
    const sortKey = options.sortBy[0]?.key || 'created_at';
    const sortOrder = options.sortBy[0]?.order === 'asc' ? 'asc' : 'desc';
    const { data } = await api.get(`${getBaseUrl('DATA')}/board/search`, {
      params: {
        keyword: search.value.trim(),
        page: options.page,
        itemsPerPage: options.itemsPerPage,
        sortBy: sortKey,
        orderBy: sortOrder,
        type: 'CLAN',
        category: selectedType.value === 'ALL' ? undefined : selectedType.value,
        clan: account.clan,
      },
    });
    serverItems.value = data.datas ?? [];
    totalItems.value = Number(data.totalCount ?? 0);
    page.value = options.page;
    itemsPerPage.value = options.itemsPerPage;
  } catch (error) {
    console.error('게시판 목록 불러오기 실패:', error);
  } finally {
    loading.value = false;
  }
}
function handleSearch() { loadItems({ page: 1, itemsPerPage: itemsPerPage.value, sortBy: [] }); }
function handleClear() { search.value = ''; handleSearch(); }
function onChangePage(value: number) { loadItems({ page: value, itemsPerPage: itemsPerPage.value, sortBy: [] }); }
function onChangePerPage(value: number) { loadItems({ page: 1, itemsPerPage: value, sortBy: [] }); }

watch(selectedType, handleSearch);
onMounted(handleSearch);
</script>

<style scoped>
.notice-page { max-width: 1120px; }
.notice-header { display:flex; align-items:flex-end; justify-content:space-between; gap:24px; margin-bottom:30px; }
.eyebrow { color:rgb(var(--v-theme-primary)); font-size:11px; font-weight:900; letter-spacing:.16em; }
.notice-header h1 { margin:5px 0 4px; font-size:32px; letter-spacing:-.04em; }
.notice-header p { margin:0; color:rgba(var(--v-theme-on-surface),.55); }
.notice-toolbar { display:flex; align-items:center; justify-content:space-between; gap:20px; margin-bottom:24px; }
.type-filter { padding:4px; border:1px solid rgba(var(--v-theme-on-surface),.06); border-radius:999px; background:rgba(var(--v-theme-surface),.7); }
.type-filter .v-btn { min-width:auto; padding:0 18px; border-radius:999px !important; color:rgba(var(--v-theme-on-surface),.55); }
.toolbar-right { display:flex; align-items:center; gap:10px; }
.toolbar-right .v-text-field { width:220px; }
.notice-loading { display:grid; place-items:center; min-height:260px; }
.notice-list { display:grid; gap:12px; }
.notice-card { position:relative; padding:20px 64px 20px 20px; overflow:hidden; border:1px solid rgba(var(--v-theme-on-surface),.1); border-radius:14px; background:rgba(var(--v-theme-surface),.72); cursor:pointer; transition:border-color .18s ease, background .18s ease, transform .18s ease; }
.notice-card:hover { border-color:rgba(var(--v-theme-primary),.42); background:rgba(var(--v-theme-primary),.055); transform:translateY(-1px); }
.notice-meta { display:flex; align-items:center; gap:8px; margin-bottom:8px; }
.notice-meta time { color:rgba(var(--v-theme-on-surface),.43); font-size:12px; }
.pin-badge,.type-badge { display:inline-flex; align-items:center; gap:3px; padding:3px 7px; border-radius:4px; font-size:11px; font-weight:800; }
.pin-badge { color:#ffc45d; background:rgba(245,158,11,.16); }
.type-badge.is-urgent { color:#ff7373; background:rgba(239,68,68,.16); }
.type-badge.is-event { color:#43dda4; background:rgba(16,185,129,.15); }
.type-badge.is-general { color:#b2bac7; background:rgba(148,163,184,.14); }
.type-badge.is-patch { color:#bc93ff; background:rgba(139,92,246,.16); }
.notice-card h2 { margin:0 0 5px; overflow:hidden; color:rgb(var(--v-theme-on-surface)); font-size:17px; line-height:1.4; text-overflow:ellipsis; white-space:nowrap; }
.notice-card p { margin:0; overflow:hidden; color:rgba(var(--v-theme-on-surface),.49); font-size:13px; text-overflow:ellipsis; white-space:nowrap; }
.notice-arrow { position:absolute; top:50%; right:18px; border:1px solid rgba(var(--v-theme-on-surface),.1); transform:translateY(-50%); }
.notice-footer { display:flex; align-items:center; justify-content:space-between; min-height:68px; color:rgba(var(--v-theme-on-surface),.55); font-size:12px; }
.notice-footer>div { display:flex; align-items:center; gap:14px; }
.notice-footer .v-select { width:86px; }
@media (max-width:800px) {
  .notice-header,.notice-toolbar { align-items:stretch; flex-direction:column; }
  .toolbar-right { width:100%; }
  .toolbar-right .v-text-field { flex:1; width:auto; }
  .type-filter { align-self:flex-start; max-width:100%; overflow-x:auto; }
  .type-filter .v-btn { padding:0 12px; }
  .notice-footer { align-items:flex-start; flex-direction:column; padding-top:16px; }
}
</style>
