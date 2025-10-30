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
          {{ item.section }}
        </div>
      </template>

      <template #item.actions="{ item }">
        <v-menu location="bottom">
          <template #activator="{ props }">
            <v-btn icon variant="text" v-bind="props">
              <v-icon>mdi-dots-vertical</v-icon>
            </v-btn>
          </template>

          <v-list density="compact">
            <!-- 수정: 기존 라우팅 유지 -->
            <v-list-item @click="openEdit(item)">
              <v-list-item-title>
                <v-icon size="16" class="mr-2">mdi-pencil</v-icon> 수정
              </v-list-item-title>
            </v-list-item>

            <!-- 삭제 -->
            <v-list-item @click="openDelete(item)">
              <v-list-item-title class="text-error">
                <v-icon size="16" class="mr-2">mdi-trash-can-outline</v-icon> 삭제
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </template>
    </server-data-table>
  </v-container>

  <v-dialog v-model="edit.open" max-width="420">
    <v-card>
      <v-card-title class="text-h6">프로파일 수정</v-card-title>

      <v-card-text>
        <v-text-field
          label="value"
          v-model="edit.form.value"
          variant="outlined"
          density="compact"
          class="mb-3"
        />
      </v-card-text>

      <v-card-actions class="justify-end">
        <v-btn variant="text" @click="edit.open = false">취소</v-btn>
        <v-btn color="primary" :loading="edit.loading" @click="handleEditSave"> 저장 </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { getBaseUrl } from '@/@core/composable/createUrl';
import api from '@/@core/composable/useAxios';
import type { Account } from '@/data/types/account';
import type { VDataTableServer } from 'vuetify/components';
import ServerDataTable from '@/components/common/ServerDataTable.vue';
import PlayerMemberDialog from '@/components/dialogs/PlayerMemberDialog.vue';
import type { Tier } from '@/data/types/tier';
import type { Profile } from '@/data/types/profile';

const itemsPerPage = ref<number>(10);

const search = ref<string>('');
const serverItems = ref<Profile[]>([]);
const loading = ref<boolean>(true);
const totalItems = ref<number>(0);

const headers: VDataTableServer['headers'] = [
  { title: 'SECTION', key: 'section' },
  { title: 'ENTRY', key: 'entry' },
  { title: 'VALUE', key: 'value' },
  { title: 'ACTIONS', key: 'actions', sortable: false, align: 'center', width: '1px' },
] as const;

interface FetchParams {
  keyword: string;
  page: number;
  itemsPerPage: number;
  sortBy: { key: keyof Account; order: 'asc' | 'desc' }[];
}

const snackbar = ref({ show: false, msg: '' });

// 삭제 확인 상태
const confirm = ref<{
  open: boolean;
  loading: boolean;
  target: any | null;
}>({
  open: false,
  loading: false,
  target: null,
});

function openDelete(item: any) {
  confirm.value.open = true;
  confirm.value.loading = false;
  confirm.value.target = item;
}

const edit = ref<{
  open: boolean;
  loading: boolean;
  target: any | null;
  form: {
    id: number;
    value: string;
  };
}>({
  open: false,
  loading: false,
  target: null,
  form: { id: 0, value: '' },
});

// ✨ 수정 버튼 열기
function openEdit(item: any) {
  edit.value.open = true;
  edit.value.loading = false;
  edit.value.target = item;
  edit.value.form.id = item.id;
  edit.value.form.value = item.value;
}

// ✨ 저장 처리
async function handleEditSave() {
  if (!edit.value.target) return;
  try {
    edit.value.loading = true;

    await api.post(`${getBaseUrl('DATA')}/profile/update`, {
      id: edit.value.form.id,
      value: edit.value.form.value,
    });

    snackbar.value = { show: true, msg: '수정되었습니다.' };
    edit.value.open = false;

    // 목록 리로드
    handleSearch();
  } catch (e) {
    console.error(e);
    snackbar.value = { show: true, msg: '수정에 실패했습니다.' };
  } finally {
    edit.value.loading = false;
  }
}

async function loadItems(options: FetchParams) {
  try {
    const sortKey = options.sortBy[0]?.key || 'section';
    const sortOrder = options.sortBy[0]?.order || 'asc';

    const response = await api.get(
      `${getBaseUrl('DATA')}/profile/search?keyword=${search.value}&page=${
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

function handleSearch() {
  //player
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

function handleAdd(param: any) {
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
