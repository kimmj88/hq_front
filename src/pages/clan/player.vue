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
        <PlayerMemberDialog v-if="can('PLAYER', 'CLAN-SET-PLAYER-C')" @added="handleAdd" />
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

      <template #item.clan_tier="{ item }">
        <div class="d-flex align-center">
          <span :style="{ color: getTierColor(item.clan_tier?.name), fontWeight: 'bold' }">
            {{ item.clan_tier?.name }}
          </span>
          <div></div>
        </div>
      </template>

      <template #item.cup_count="{ item }">
        <div class="d-flex align-center">
          <font-awesome-icon
            v-for="index in item?.cup_count"
            :icon="['fas', 'star']"
            class="star-full"
          />
        </div>
      </template>

      <template #item.sub_cup_count="{ item }">
        <div class="d-flex align-center">
          <font-awesome-icon
            v-for="index in item?.sub_cup_count"
            :icon="['far', 'star']"
            class="star-full"
          />
        </div>
      </template>

      <template #item.is_active="{ item }">
        <v-switch v-model="item.is_active" readonly inset hide-details color="success" />
      </template>

      <template #item.created_at="{ item }">
        {{ item.created_at.slice(0, 10) }}
      </template>

      <template #item.positions="{ item }">
        <div class="d-flex flex-wrap" style="gap: 6px">
          <v-chip
            v-for="(pos, i) in normalizePositions(item.positions)"
            :key="i"
            size="x-small"
            color="primary"
            label
            variant="tonal"
          >
            {{ pos.label }}
          </v-chip>
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
            <v-list-item v-if="can('PLAYER', 'SYS-SET-PLAYER-U')" @click="openEdit(item)">
              <v-list-item-title>
                <v-icon size="16" class="mr-2">mdi-pencil</v-icon> 수정
              </v-list-item-title>
            </v-list-item>
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
        <v-row align="center" no-gutters>
          <v-col cols="9" class="pr-2">
            <!-- 약 70% 정도 -->
            <v-text-field
              label="Name"
              v-model="edit.form.name"
              variant="outlined"
              density="compact"
              disabled="true"
            />
          </v-col>

          <v-col cols="3" class="text-right">
            <!-- 약 30% 정도 -->
            <v-btn variant="text" @click="refreshTier" style="min-width: 80px"> 갱신 </v-btn>
          </v-col>
        </v-row>

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
              disabled="true"
              :menu-props="{ maxHeight: 300 }"
            >
              <template #selection="{ item }">
                <v-chip color="primary" small>{{ selectedTier?.name }}</v-chip>
              </template>
            </v-autocomplete>
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

        <v-divider class="mb-8"></v-divider>
        <v-text-field
          label="Cup"
          v-model="edit.form.cup_count"
          type="number"
          variant="outlined"
          density="compact"
        />

        <v-divider class="mb-8"></v-divider>
        <v-text-field
          label="Sub Cup"
          v-model="edit.form.sub_cup_count"
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

        <v-autocomplete
          label="Position"
          v-model="selectedPositions"
          :items="positions"
          item-title="name"
          item-value="name"
          variant="outlined"
          density="compact"
          clearable
          multiple
          return-object
          :menu-props="{ maxHeight: 300 }"
        >
          <template #selection="{ item, index }">
            <v-chip
              color="primary"
              class="mr-1"
              closable
              size="large"
              @click:close="selectedPositions.splice(index, 1)"
            >
              {{ item.raw.name }}
            </v-chip>
          </template>
        </v-autocomplete>

        <v-divider class="my-1"></v-divider>

        <v-switch
          v-model="edit.form.is_active"
          label="플레이어 활성화"
          color="success"
          inset
          hide-details
        />
      </v-card-text>

      <!-- 하단 버튼 -->
      <v-card-actions class="justify-end">
        <v-btn variant="text" @click="handleCancel">취소</v-btn>
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
import { can } from '@/stores/useClanPermissionStore';
import type { Codedict } from '@/data/types/codedict';
import type { Position } from '@/data/types/position';
import { useAccountStore } from '@/stores/useAccountStore';

const account = useAccountStore();

const itemsPerPage = ref<number>(10);

const search = ref<string>('');
const serverItems = ref<Player[]>([]);
const loading = ref<boolean>(true);
const totalItems = ref<number>(0);

const headers: VDataTableServer['headers'] = [
  { title: 'NAME', key: 'name', sortable: false },
  { title: 'TIER', key: 'tier', sortable: false },
  { title: 'CUSTOM_TIER', key: 'custom_tier', sortable: false },
  { title: 'CLAN_TIER', key: 'clan_tier', sortable: false },
  { title: 'MAIN_CUP', key: 'cup_count', sortable: false },
  { title: 'SUB_CUP', key: 'sub_cup_count', sortable: true },
  { title: 'POINT', key: 'point', sortable: true },
  { title: 'Position', key: 'positions', sortable: false, width: 240 }, // ⬅️ 추가
  { title: 'ACTIVE', key: 'is_active', sortable: false },
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
    cup_count: number | null;
    sub_cup_count: number | null;
    is_active: boolean;
  };
}>({
  open: false,
  loading: false,
  target: null,
  form: { id: 0, name: '', point: null, cup_count: null, sub_cup_count: null, is_active: false },
});

function openEdit(item: any) {
  // 참조 끊기: 깊은 복사
  const clone = (v: any) => JSON.parse(JSON.stringify(v));

  edit.value.open = true;
  edit.value.loading = false;
  edit.value.target = item;

  selectedPositions.value = clone(item.positions ?? []);
  selectedTier.value = clone(item.tier ?? null);
  selectedCustomTier.value = clone(item.custom_tier ?? null);

  edit.value.form.id = item.id;
  edit.value.form.name = `${item.nickname}#${item.tagname}`;
  edit.value.form.point = item.point;

  edit.value.form.cup_count = item.cup_count;
  edit.value.form.sub_cup_count = item.sub_cup_count;

  edit.value.form.is_active = item.is_active;
}

function normalizePositions(positions: any[] | undefined | null) {
  if (!positions || !Array.isArray(positions)) return [];
  return positions
    .map((p) => {
      if (typeof p === 'string') return { label: p };

      // common shapes
      if (p.value) return { label: p.value };
      if (p.title) return { label: p.title };
      if (p.name) return { label: p.name };

      // codedict relation
      if (p.codedict?.title) return { label: p.codedict.title };
      if (p.codedict?.code_value) return { label: p.codedict.code_value };

      // last resort
      return { label: String(p.id ?? '') };
    })
    .filter((x) => x.label);
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
    const sortKey = options.sortBy[0]?.key || 'point';
    const sortOrder = options.sortBy[0]?.order || 'desc';

    const response = await api.get(
      `${getBaseUrl('DATA')}/player/search?keyword=${search.value}&page=${
        options.page
      }&itemsPerPage=${options.itemsPerPage}&sortBy=${sortKey}&orderBy=${sortOrder}&clan=${
        account.clan.name
      }`
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

const positions = ref<Position[]>([]);
const selectedPositions = ref<Position[] | null>([]);

async function fetch() {
  try {
    const response = await api.get(`${getBaseUrl('DATA')}/tier/all`);

    tierList.value = response.data.datas;
    const position_codedict = await api.get(`${getBaseUrl('DATA')}/position/all`);

    positions.value = position_codedict.data.datas;
  } catch (error) {
    console.error('매치 정보 불러오기 실패:', error);
  }
}

async function handleCancel() {
  edit.value.open = false;

  edit.value.target = null;
  edit.value.form.id = 0;
  edit.value.form.name = '';
  edit.value.form.point = 0;

  selectedTier.value = undefined;
  selectedCustomTier.value = undefined;
  selectedPositions.value = [];
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
      cup_count: edit.value.form.cup_count,
      sub_cup_count: edit.value.form.sub_cup_count,
      custom_tier: selectedCustomTier.value,
      tier: selectedTier.value,
      positions: selectedPositions.value,
      is_active: edit.value.form.is_active,
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

async function refreshTier() {
  try {
    const [nick, tag] = edit.value.form.name.split('#');

    const res = await api.post(`${getBaseUrl('DATA')}/player/refresh`, {
      id: edit.value.form.id,
      nickname: nick,
      tagname: tag,
    });
    const clone = (v: any) => JSON.parse(JSON.stringify(v));
    selectedTier.value = clone(res.data.datas.tier ?? null);
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
