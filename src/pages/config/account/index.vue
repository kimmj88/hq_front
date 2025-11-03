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
          {{ 'Search' }}
        </v-btn>
      </v-col>
      <v-spacer />
    </v-row>
  </v-container>
  <v-container>
    <server-data-table
      :headers="headers"
      :items="serverItems"
      :items-length="totalItems"
      :items-per-page="itemsPerPage"
      :loading="loading"
      :search="search"
      @update:options="loadItems"
    >
      <!-- 유저 프로필/이메일 -->
      <template #item.name="{ item }">
        <div class="d-flex align-center">
          <v-avatar size="30" class="mr-3" :color="getAvatarColor(item.name)">
            <template v-if="item.avatar">
              <v-img :src="item.avatar" />
            </template>
            <template v-else>
              <span class="text-caption font-weight-bold">
                {{ getInitials(item.name) }}
              </span>
            </template>
          </v-avatar>

          <!-- 이름에 링크 -->
          <div>
            <router-link :to="CONFIG_ACCOUNT_PATH.VIEW(item.id)" class="account-link">
              {{ item.name }}
            </router-link>
            <div class="text-caption text-grey">
              {{ item.email }}
            </div>
          </div>
        </div>
      </template>

      <!-- ROLE -->
      <template #item.systemrole="{ item }">
        <v-icon start size="large">
          {{ item.systemrole.name === 'admin' ? 'mdi-crown' : 'mdi-account' }}
        </v-icon>
        {{ item.systemrole.name }}
      </template>

      <template #item.status="{ item }">
        <v-chip :color="getStatusColor('active')" size="large" label>
          {{ 'active' }}
        </v-chip>
      </template>

      <template #item.actions="{ item }">
        <v-menu location="bottom">
          <template #activator="{ props }">
            <v-btn icon variant="text" v-bind="props">
              <v-icon>mdi-dots-vertical</v-icon>
            </v-btn>
          </template>
          <v-list>
            <v-list-item
              v-if="can('ACCOUNT', 'SYS-SET-ACC-U')"
              :to="CONFIG_ACCOUNT_PATH.VIEW(item.id)"
            >
              <v-list-item-title>{{ $t('form_control.button.edit') }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </template>
    </server-data-table>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CONFIG_ACCOUNT_PATH } from '@/router/config/type';
import { getBaseUrl } from '@/@core/composable/createUrl';
import api from '@/@core/composable/useAxios';
import type { Account } from '@/data/types/account';
import type { VDataTableServer } from 'vuetify/components';
import ServerDataTable from '@/components/common/ServerDataTable.vue';
import { can } from '@/stores/usePermissionStore';

const itemsPerPage = ref<number>(10);

const search = ref<string>('');
const serverItems = ref<Account[]>([]);
const loading = ref<boolean>(true);
const totalItems = ref<number>(0);

const headers: VDataTableServer['headers'] = [
  { title: 'NAME', key: 'name' },
  { title: 'ROLE', key: 'systemrole' },
  { title: 'DEPARTMENT', key: 'department' },
  { title: 'STATUS', key: 'status' },
  { title: 'ACTIONS', key: 'actions', sortable: false, align: 'center', width: '1px' },
] as const;

function getStatusColor(status: string) {
  switch (status) {
    case 'Active':
      return 'green';
    case 'Pending':
      return 'orange';
    case 'Inactive':
      return 'grey';
    default:
      return 'blue';
  }
}

interface FetchParams {
  keyword: string;
  page: number;
  itemsPerPage: number;
  sortBy: { key: keyof Account; order: 'asc' | 'desc' }[];
}

async function loadItems(options: FetchParams) {
  try {
    const sortKey = options.sortBy[0]?.key || 'created_at';
    const sortOrder = options.sortBy[0]?.order || 'desc';

    const response = await api.get(
      `${getBaseUrl('DATA')}/account/search?keyword=${search.value}&page=${
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

const avatarColors = [
  '#FF8A80', // red lighten
  '#FFD180', // orange lighten
  '#FFFF8D', // yellow lighten
  '#CFD8DC', // blue-grey lighten
  '#80D8FF', // light blue
  '#A7FFEB', // teal lighten
  '#CCFF90', // green lighten
  '#B388FF', // purple lighten
  '#F8BBD0', // pink lighten
];

function getAvatarColor(name: string): string {
  if (!name) return avatarColors[0];
  const code = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return avatarColors[code % avatarColors.length];
}

function getInitials(name: string) {
  return name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
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
.account-link {
  color: inherit;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s ease;
}

.account-link:hover {
  color: #2196f3; /* Vuetify 기본 primary 색상 */
}
</style>
