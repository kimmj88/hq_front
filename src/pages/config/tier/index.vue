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
          <template v-if="item.avatar">
            <v-img :src="item.avatar" />
          </template>
          <template v-else>
            <span :style="{ color: getTierColor(item.name), fontWeight: 'bold' }">
              {{ item.name }}
            </span>
          </template>
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
            <v-list-item v-if="can('TIER', 'SYS-SET-TIER-U')" @click="openEdit(item)">
              <v-list-item-title>
                <v-icon size="16" class="mr-2">mdi-pencil</v-icon> 수정
              </v-list-item-title>
            </v-list-item>

            <!-- 삭제 -->
            <!-- <v-list-item @click="openDelete(item)">
              <v-list-item-title class="text-error">
                <v-icon size="16" class="mr-2">mdi-trash-can-outline</v-icon> 삭제
              </v-list-item-title>
            </v-list-item> -->
          </v-list>
        </v-menu>
      </template>

      <template #item.created_at="{ item }">
        {{ item.created_at.slice(0, 10) }}
      </template>
    </server-data-table>
  </v-container>

  <!-- ✅ 수정 다이얼로그 -->
  <v-dialog v-model="edit.open" max-width="420">
    <v-card>
      <v-card-title class="text-h6">티어 수정</v-card-title>

      <v-card-text>
        <v-text-field
          label="티어명"
          v-model="edit.form.name"
          variant="outlined"
          density="compact"
          class="mb-3"
        />
        <v-text-field
          label="포인트"
          v-model="edit.form.point"
          type="number"
          variant="outlined"
          density="compact"
        />
      </v-card-text>

      <v-card-actions class="justify-end">
        <v-btn variant="text" @click="edit.open = false">취소</v-btn>
        <v-btn color="primary" :loading="edit.loading" @click="handleEditSave"> 저장 </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="confirm.open" max-width="420">
    <v-card>
      <v-card-title class="text-h6">삭제 확인</v-card-title>
      <v-card-text>
        <div>
          <strong>{{ confirm.target?.name }}</strong> 항목을 삭제할까요?
        </div>
        <div class="text-caption text-medium-emphasis mt-2">이 작업은 되돌릴 수 없습니다.</div>
      </v-card-text>
      <v-card-actions class="justify-end">
        <v-btn variant="text" @click="confirm.open = false">취소</v-btn>
        <v-btn color="error" :loading="confirm.loading" @click="handleDelete">삭제</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="edit.open" max-width="420">
    <v-card>
      <v-card-title class="text-h6">티어 수정</v-card-title>

      <v-card-text>
        <v-text-field
          label="티어명"
          v-model="edit.form.name"
          variant="outlined"
          density="compact"
          class="mb-3"
        />
        <v-text-field
          label="포인트"
          v-model="edit.form.point"
          type="number"
          variant="outlined"
          density="compact"
        />
      </v-card-text>

      <v-card-actions class="justify-end">
        <v-btn variant="text" @click="edit.open = false">취소</v-btn>
        <v-btn color="primary" :loading="edit.loading" @click="handleEditSave"> 저장 </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- ✅ 스낵바 -->
  <v-snackbar v-model="snackbar.show" :timeout="2200">
    {{ snackbar.msg }}
    <template #actions>
      <v-btn variant="text" @click="snackbar.show = false">닫기</v-btn>
    </template>
  </v-snackbar>
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
import { can } from '@/stores/usePermissionStore';

const itemsPerPage = ref<number>(10);

const search = ref<string>('');
const serverItems = ref<Tier[]>([]);
const loading = ref<boolean>(true);
const totalItems = ref<number>(0);

function getTierColor(tier: string): string {
  if (!tier) return 'grey';
  const key = tier.toLowerCase();
  if (key.includes('iron')) return '#615F5F';
  if (key.includes('bronze')) return '#AD5600';
  if (key.includes('silver')) return '#A0A0A0';
  if (key.includes('gold')) return '#FFD700';
  if (key.includes('platinum')) return '#00BBA3';
  if (key.includes('emerald')) return '#00D66B';
  if (key.includes('diamond')) return '#00BFFF';
  if (key.includes('grandmaster')) return '#FF4D4D';
  if (key.includes('master')) return '#C42AFF';
  if (key.includes('challenger')) return '#007BFF';
  return 'black';
}

const headers: VDataTableServer['headers'] = [
  { title: 'NAME', key: 'name' },
  { title: 'POINT', key: 'point' },
  { title: 'Created', key: 'created_at', sortable: true },
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
    name: string;
    point: number | null;
  };
}>({
  open: false,
  loading: false,
  target: null,
  form: { id: 0, name: '', point: null },
});

// ✨ 수정 버튼 열기
function openEdit(item: any) {
  edit.value.open = true;
  edit.value.loading = false;
  edit.value.target = item;
  edit.value.form.id = item.id;
  edit.value.form.name = item.name;
  edit.value.form.point = item.point;
}

// ✨ 저장 처리
async function handleEditSave() {
  if (!edit.value.target) return;
  try {
    edit.value.loading = true;

    await api.post(`${getBaseUrl('DATA')}/tier/update`, {
      id: edit.value.form.id,
      name: edit.value.form.name,
      point: edit.value.form.point,
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

async function handleDelete() {
  if (!confirm.value.target) return;
  try {
    confirm.value.loading = true;
    // ✅ 실제 삭제 API 경로에 맞게 수정하세요
    // 예: 티어 삭제라면 /tier/:id 형태일 가능성
    await api.delete(`${getBaseUrl('DATA')}/tier/${confirm.value.target.id}`);

    snackbar.value = { show: true, msg: '삭제되었습니다.' };
    confirm.value.open = false;
    // 삭제 후 목록 리로드
    handleSearch();
  } catch (e: any) {
    console.error(e);
    snackbar.value = { show: true, msg: '삭제에 실패했습니다.' };
  } finally {
    confirm.value.loading = false;
  }
}

async function loadItems(options: FetchParams) {
  try {
    const sortKey = options.sortBy[0]?.key || 'point';
    const sortOrder = options.sortBy[0]?.order || 'asc';

    const response = await api.get(
      `${getBaseUrl('DATA')}/tier/search?keyword=${search.value}&page=${
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
