<template>
  <v-container>
    <v-row class="mb-2" align="center">
      <v-col cols="12" sm="1" md="2">
        <v-text-field
          v-model="search"
          label="Search"
          density="compact"
          hide-details
          clearable
          append-inner-icon="mdi-magnify"
          @keyup.enter="handleSearch"
          @click:clear="handleClear"
        />
      </v-col>
      <v-col cols="auto">
        <v-btn color="primary" @click="handleSearch">
          {{ $t('form_control.button.search') }}
        </v-btn>
      </v-col>

      <v-spacer />

      <v-col cols="auto">
        <v-btn
          v-if="can('MATCH', 'SYS-SET-MATCH-C')"
          color="secondary"
          @click="$router.push(MATCH_PATH.ADD)"
        >
          {{ $t('form_control.button.add') }}
        </v-btn>
      </v-col>
    </v-row>

    <server-data-table
      :headers="headers"
      :items="serverItems"
      :items-length="totalItems"
      :items-per-page="itemsPerPage"
      :loading="loading"
      :search="search"
      @update:options="loadItems"
    >
      <template #item.name="{ item }">
        <router-link :to="MATCH_PATH.VIEW(item.id)" class="account-link">
          {{ item.name }}
        </router-link>
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

        <v-tooltip v-if="can('MATCH', 'SYS-SET-MATCH-D')" text="삭제">
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
  </v-container>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { can } from '@/stores/usePermissionStore';
import { getBaseUrl } from '@/@core/composable/createUrl';
import api from '@/@core/composable/useAxios';
import type { VDataTableServer } from 'vuetify/components';
import { MATCH_PATH } from '@/router/match/type';

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

const itemsPerPage = ref<number>(10);
const headers = ref<VDataTableServer['headers']>([
  {
    title: 'name',
    sortable: true,
    key: 'name',
  },
  {
    title: 'type',
    sortable: true,
    key: 'type',
  },
  {
    title: 'confirm',
    key: 'is_confirm',
  },
  {
    title: 'winner',
    key: 'winner_team',
  },
  { title: 'Created', key: 'created_at', sortable: true },
  { title: 'Updated', key: 'updated_at', sortable: true },
  {
    title: 'Actions',
    key: 'actions',
    sortable: false,
    align: 'center',
    width: '1px',
  },
]);

// ✅ 데이터 로드 함수
async function loadItems(options: FetchParams) {
  try {
    const sortKey = options.sortBy[0]?.key || 'created_at';
    const sortOrder = options.sortBy[0]?.order || 'desc';

    const response = await api.get(
      `${getBaseUrl('DATA')}/match/search?keyword=${search.value}&page=${
        options.page
      }&itemsPerPage=${options.itemsPerPage}&sortBy=${sortKey}&orderBy=${sortOrder}`
    );

    loading.value = true;
    serverItems.value = response.data.datas;
    totalItems.value = response.data.totalCount;
    loading.value = false;
  } catch (error) {
    console.error('기업 목록 불러오기 실패:', error);
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
</script>

<style scoped>
.name-link {
  color: inherit;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s ease;
}
.name-link:hover {
  color: #2196f3; /* Vuetify primary color */
}
</style>
