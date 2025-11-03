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
      <v-col cols="auto">
        <PlayerMemberDialog @added="handleAdd" />
      </v-col>
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
            <span class="text-caption font-weight-bold">
              {{ item.nickname }}
            </span>
          </template>

          <!-- 이름에 링크 -->
          <div>
            <div class="text-caption text-grey">
              {{ '#' + item.tagname }}
            </div>
          </div>
        </div>
      </template>

      <template #item.tier="{ item }">
        <div class="d-flex align-center">
          <span :style="{ color: getTierColor(item.tier.name), fontWeight: 'bold' }">
            {{ item.tier.name }}
          </span>
          <div></div>
        </div>
      </template>

      <template #item.custom_tier="{ item }">
        <div class="d-flex align-center">
          <span :style="{ color: getTierColor(item.custom_tier?.name), fontWeight: 'bold' }">
            {{ item.custom_tier?.name }}
          </span>
          <div></div>
        </div>
      </template>

      <template #item.created_at="{ item }">
        {{ item.created_at.slice(0, 10) }}
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
            <!-- <v-list-item @click="openDelete(item)">
              <v-list-item-title class="text-error">
                <v-icon size="16" class="mr-2">mdi-trash-can-outline</v-icon> 삭제
              </v-list-item-title>
            </v-list-item> -->
          </v-list>
        </v-menu>
      </template>
    </server-data-table>
  </v-container>

  <v-dialog v-model="edit.open" max-width="420">
    <v-card>
      <!-- 제목 + 버튼 -->
      <v-card-title>
        <span class="text-h6">티어 수정</span>
      </v-card-title>

      <!-- 본문 -->
      <v-card-text>
        <v-text-field
          label="Name"
          v-model="edit.form.name"
          variant="outlined"
          density="compact"
          class="mb-3"
        />
        <v-row align="center" no-gutters>
          <v-col>
            <v-autocomplete
              label="Tier"
              v-model="selectedTier"
              :items="tierList"
              item-title="name"
              item-value="id"
              variant="outlined"
              density="compact"
              return-object="{false}"
              clearable
              :menu-props="{ maxHeight: 300 }"
            >
              <template #selection="{ item }">
                <v-chip color="primary" small>{{ selectedTier?.name }}</v-chip>
              </template>
            </v-autocomplete>
          </v-col>

          <v-col cols="auto" class="ml-2">
            <!-- <v-btn
              height="50"
              variant="tonal"
              color="primary"
              prepend-icon="mdi-refresh"
              @click="onAddTier"
            >
              새로고침
            </v-btn> -->
          </v-col>
        </v-row>

        <v-divider class="mb-8"></v-divider>
        <v-text-field
          label="Point"
          v-model="edit.form.point"
          type="number"
          variant="outlined"
          density="compact"
        />

        <v-autocomplete
          label="Custom Tier"
          v-model="selectedCustomTier"
          :items="tierList"
          item-title="name"
          item-value="id"
          variant="outlined"
          density="compact"
          clearable
          return-object="{false}"
          :menu-props="{ maxHeight: 300 }"
        >
          <template #selection="{ item }">
            <v-chip color="primary" small>{{ selectedCustomTier?.name }}</v-chip>
          </template>
        </v-autocomplete>
      </v-card-text>

      <!-- 하단 버튼 -->
      <v-card-actions class="justify-end">
        <v-btn variant="text" @click="edit.open = false">취소</v-btn>
        <v-btn color="primary" :loading="edit.loading" @click="handleEditSave">저장</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { getBaseUrl } from '@/@core/composable/createUrl';
import api from '@/@core/composable/useAxios';
import type { Account } from '@/data/types/account';
import type { VDataTableServer } from 'vuetify/components';
import ServerDataTable from '@/components/common/ServerDataTable.vue';
import PlayerMemberDialog from '@/components/dialogs/PlayerMemberDialog.vue';
import type { Player } from '@/data/types/player';
import type { Tier } from '@/data/types/tier';

const itemsPerPage = ref<number>(10);

const search = ref<string>('');
const serverItems = ref<Player[]>([]);
const loading = ref<boolean>(true);
const totalItems = ref<number>(0);

const headers: VDataTableServer['headers'] = [
  { title: 'NAME', key: 'name' },
  { title: 'TIER', key: 'tier' },
  { title: 'CUSTOM_TIER', key: 'custom_tier' },
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
  debugger;
  selectedTier.value = item.tier;
  selectedCustomTier.value = item.custom_tier;
  edit.value.open = true;
  edit.value.loading = false;
  edit.value.target = item;
  edit.value.form.id = item.id;
  edit.value.form.name = `${item.nickname}#${item.tagname}`;
  edit.value.form.point = item.point;
}

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

async function loadItems(options: FetchParams) {
  try {
    const sortKey = options.sortBy[0]?.key || 'created_at';
    const sortOrder = options.sortBy[0]?.order || 'desc';

    const response = await api.get(
      `${getBaseUrl('DATA')}/player/search?keyword=${search.value}&page=${
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

const tierList = ref<Tier[]>([]);
const selectedTier = ref<Tier>();
const selectedCustomTier = ref<Tier>();

async function fetch() {
  try {
    const response = await api.get(`${getBaseUrl('DATA')}/tier/all`);

    tierList.value = response.data.datas;
  } catch (error) {
    console.error('매치 정보 불러오기 실패:', error);
  }
}

async function handleEditSave() {
  if (!edit.value.target) return;
  try {
    edit.value.loading = true;

    const [nick, tag] = edit.value.form.name.split('#');

    await api.post(`${getBaseUrl('DATA')}/player/update2`, {
      id: edit.value.form.id,
      nickname: nick,
      tagname: tag,
      point: edit.value.form.point,
      custom_tier: selectedCustomTier.value,
      tier: selectedTier.value,
    });

    edit.value.open = false;

    // 목록 리로드
    handleSearch();
  } catch (e) {
    console.error(e);
  } finally {
    edit.value.loading = false;
  }
}
onMounted(fetch);
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
