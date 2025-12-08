<template>
  <v-container>
    <!-- 제목 + 글쓰기 버튼 -->
    <div class="d-flex justify-space-between align-center mb-4">
      <h2 class="text-h5">문의</h2>

      <v-btn
        v-if="can('ENQUIRE', 'SYS-SET-ENQUIRE-C')"
        color="primary"
        prepend-icon="mdi-pencil"
        @click="$router.push('/enquire/add')"
      >
        글쓰기
      </v-btn>
    </div>

    <!-- 공지 목록 테이블 (server) -->
    <v-data-table-server
      :headers="headers"
      :items="serverItems"
      :items-length="totalItems"
      v-model:items-per-page="itemsPerPage"
      v-model:page="page"
      :loading="loading"
      class="elevation-1"
      hide-default-footer
      @update:options="loadItems"
    >
      <!-- 제목 컬럼 (상세 이동) -->
      <template #item.title="{ item }">
        <span
          v-if="can('ENQUIRE', 'SYS-SET-ENQUIRE-R')"
          class="text-primary"
          style="cursor: pointer; text-decoration: underline"
          @click="onClickRow(item)"
        >
          {{ item.title }}
        </span>
        <span v-else>
          {{ item.title }}
        </span>
      </template>

      <!-- 날짜 포맷 -->
      <template #item.created_at="{ item }">
        {{ item.created_at.slice(0, 10) }}
      </template>

      <!-- 🔻 커스텀 footer (v-data-table 느낌으로) -->
      <template #bottom>
        <div class="d-flex justify-space-between align-center px-4 py-2">
          <div class="text-caption">{{ pageStart }} - {{ pageEnd }} of {{ totalItems }}</div>

          <div class="d-flex align-center gap-2">
            <span class="text-caption mr-2">Items per page:</span>
            <v-select
              v-model="itemsPerPage"
              :items="[10, 20, 50]"
              hide-details
              density="compact"
              style="max-width: 90px"
              @update:model-value="onChangePerPage"
            />

            <v-pagination
              v-model="page"
              :length="pageCount"
              density="comfortable"
              rounded="circle"
              @update:model-value="onChangePage"
            />
          </div>
        </div>
      </template>
    </v-data-table-server>
  </v-container>
</template>

<script setup lang="ts">
import { getBaseUrl } from '@/@core/composable/createUrl';
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/@core/composable/useAxios';
import type { Board } from '@/data/types/board';
import { ENQUIRE_PATH } from '@/router/enquire/type';
import { can } from '@/stores/usePermissionStore';
import type { Enquire } from '@/data/types/enquire';
import { useAccountStore } from '@/stores/useAccountStore';

const accountStore = useAccountStore();

const search = ref<string>('');
const serverItems = ref<Enquire[]>([]);
const loading = ref<boolean>(false);
const totalItems = ref<number>(0);

const itemsPerPage = ref<number>(10);
const page = ref<number>(1);

const router = useRouter();

const headers = [
  { title: '번호', key: 'id', align: 'center', width: 80 },
  { title: '제목', key: 'title', align: 'start' },
  { title: '작성자', key: 'account.nickname', align: 'center', width: 120 },
  { title: '등록일', key: 'created_at', align: 'center', width: 150 },
];

// 페이지 계산용
const pageCount = computed(() =>
  totalItems.value === 0 ? 1 : Math.ceil(totalItems.value / itemsPerPage.value)
);
const pageStart = computed(() =>
  totalItems.value === 0 ? 0 : (page.value - 1) * itemsPerPage.value + 1
);
const pageEnd = computed(() => Math.min(page.value * itemsPerPage.value, totalItems.value));

// 상세 페이지 이동
const onClickRow = (item: Board) => {
  router.push({ path: ENQUIRE_PATH.VIEW(item.id) });
};

type DataTableOptions = {
  page: number;
  itemsPerPage: number;
  sortBy: { key: string; order: 'asc' | 'desc' | false }[];
};

async function loadItems(options: DataTableOptions) {
  loading.value = true;

  try {
    const sortKey = options.sortBy[0]?.key || 'created_at';
    const sortOrder =
      options.sortBy[0]?.order === 'asc' || options.sortBy[0]?.order === 'desc'
        ? options.sortBy[0].order
        : 'desc';

    const response = await api.get(`${getBaseUrl('DATA')}/enquire/search`, {
      params: {
        keyword: search.value,
        page: options.page,
        itemsPerPage: options.itemsPerPage,
        sortBy: sortKey,
        orderBy: sortOrder,
        account: accountStore.id,
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

// 검색 버튼용 (필요하면 상단에 검색 UI 붙이면 됨)
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

// footer에서 페이지 변경 시
function onChangePage(p: number) {
  loadItems({
    page: p,
    itemsPerPage: itemsPerPage.value,
    sortBy: [],
  });
}

function onChangePerPage(size: number) {
  loadItems({
    page: 1,
    itemsPerPage: size,
    sortBy: [],
  });
}

onMounted(() => {
  handleSearch();
});
</script>
