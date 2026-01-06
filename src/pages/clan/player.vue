<template>
  <v-container>
    <!-- ✅ 상단 툴바(정리) -->
    <v-container>
      <v-card class="pa-3 mb-3" rounded="lg" variant="tonal">
        <div class="toolbar">
          <!-- Search -->
          <v-text-field
            v-model="search"
            class="toolbar__search"
            label="플레이어 검색 (닉네임)"
            density="compact"
            variant="outlined"
            hide-details
            clearable
            prepend-inner-icon="mdi-magnify"
            @keyup.enter="handleSearch"
            @click:clear="handleClear"
          />

          <!-- Tier Filter -->
          <v-select
            v-model="selectedClanTierGroups"
            class="toolbar__select"
            :items="clanTierGroupOptions"
            item-title="title"
            item-value="value"
            label="클랜 티어"
            density="compact"
            variant="outlined"
            hide-details
            clearable
            multiple
            chips
            closable-chips
            prepend-inner-icon="mdi-filter-variant"
            @update:modelValue="handleSearch"
          />

          <!-- Buttons -->
          <div class="toolbar__actions">
            <v-btn
              color="primary"
              variant="flat"
              density="comfortable"
              prepend-icon="mdi-magnify"
              @click="handleSearch"
            >
              검색
            </v-btn>

            <v-btn
              variant="tonal"
              density="comfortable"
              prepend-icon="mdi-refresh"
              @click="handleResetFilters"
            >
              초기화
            </v-btn>

            <PlayerMemberDialog v-if="can('PLAYER', 'CLAN-SET-PLAYER-C')" @added="handleAdd" />
          </div>
        </div>
      </v-card>
    </v-container>

    <!-- ✅ 테이블 -->
    <server-data-table
      :headers="headers"
      :items="serverItems"
      :items-length="totalItems"
      :items-per-page="itemsPerPage"
      :loading="loading"
      :search="search"
      @update:options="loadItems"
    >
      <!-- ✅ NAME: 아바타 + 닉#태그 + 서브 -->
      <template #item.name="{ item }">
        <div
          class="d-flex align-center opgg-link"
          role="button"
          tabindex="0"
          style="gap: 12px; cursor: pointer"
          @click="openOpgg(item)"
          @keyup.enter="openOpgg(item)"
        >
          <v-avatar size="32" color="deep-purple-darken-2">
            <span class="text-caption text-white">
              {{ (item.nickname ?? '?').slice(0, 2).toUpperCase() }}
            </span>
          </v-avatar>

          <div style="line-height: 1.2">
            <div class="text-body-2 font-weight-bold">
              {{ item.nickname }}
              <span class="text-medium-emphasis">#{{ item.tagname }}</span>
            </div>
            <div class="text-caption text-medium-emphasis">
              Point {{ item.point ?? 0 }} · {{ item.clan_tier?.name ?? '-' }}
            </div>
          </div>
        </div>
      </template>

      <!-- ✅ TIER: 칩 통일 -->
      <template #item.tier="{ item }">
        <v-chip size="small" variant="tonal" class="tier-chip">
          <span :style="{ color: getTierColor(item.tier?.name), fontWeight: '700' }">
            {{ item.tier?.name ?? '-' }}
          </span>
        </v-chip>
      </template>

      <template #item.custom_tier="{ item }">
        <v-chip size="small" variant="tonal" class="tier-chip">
          <span :style="{ color: getTierColor(item.custom_tier?.name), fontWeight: '700' }">
            {{ item.custom_tier?.name ?? '-' }}
          </span>
        </v-chip>
      </template>

      <template #item.clan_tier="{ item }">
        <v-chip size="small" variant="tonal" class="tier-chip">
          <span :style="{ color: getTierColor(item.clan_tier?.name), fontWeight: '700' }">
            {{ item.clan_tier?.name ?? '-' }}
          </span>
        </v-chip>
      </template>

      <!-- ✅ CUP: 별 반복 → 숫자 뱃지 -->
      <template #item.cup_count="{ item }">
        <v-chip size="small" color="amber" variant="tonal" prepend-icon="mdi-star">
          {{ item?.cup_count ?? 0 }}
        </v-chip>
      </template>

      <template #item.sub_cup_count="{ item }">
        <v-chip size="small" color="grey" variant="tonal" prepend-icon="mdi-star-outline">
          {{ item?.sub_cup_count ?? 0 }}
        </v-chip>
      </template>

      <template #item.is_active="{ item }">
        <v-switch v-model="item.is_active" readonly inset hide-details color="success" />
      </template>

      <template #item.created_at="{ item }">
        {{ item.created_at.slice(0, 10) }}
      </template>

      <!-- ✅ Position: 최대 2개 +N -->
      <template #item.positions="{ item }">
        <div class="d-flex flex-wrap" style="gap: 6px">
          <v-chip
            v-for="(pos, i) in normalizePositions(item.positions).slice(0, 2)"
            :key="i"
            size="x-small"
            color="primary"
            label
            variant="tonal"
          >
            {{ pos.label }}
          </v-chip>

          <v-chip
            v-if="normalizePositions(item.positions).length > 2"
            size="x-small"
            variant="tonal"
            color="secondary"
          >
            +{{ normalizePositions(item.positions).length - 2 }}
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
            <v-list-item v-if="can('PLAYER', 'CLAN-SET-PLAYER-U')" @click="openEdit(item)">
              <v-list-item-title>
                <v-icon size="16" class="mr-2">mdi-pencil</v-icon> 수정
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </template>
    </server-data-table>
  </v-container>

  <!-- ✅ 기존 수정 다이얼로그 그대로 -->
  <v-dialog v-model="edit.open" max-width="420">
    <v-card>
      <v-card-title>
        <span class="text-h6">티어 수정</span>
      </v-card-title>

      <v-card-text>
        <v-row align="center" no-gutters>
          <v-col cols="9" class="pr-2">
            <v-text-field
              label="Name"
              v-model="edit.form.name"
              variant="outlined"
              density="compact"
              disabled="true"
            />
          </v-col>

          <v-col cols="3" class="text-right">
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

      <v-card-actions class="justify-end">
        <v-btn variant="text" @click="handleCancel">취소</v-btn>
        <v-btn color="primary" :loading="edit.loading" @click="handleEditSave">저장</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { getBaseUrl } from '@/@core/composable/createUrl';
import api from '@/@core/composable/useAxios';
import type { Account } from '@/data/types/account';
import type { VDataTableServer } from 'vuetify/components';
import ServerDataTable from '@/components/common/ServerDataTable.vue';
import PlayerMemberDialog from '@/components/dialogs/PlayerMemberDialog.vue';
import type { Player } from '@/data/types/player';
import type { Tier } from '@/data/types/tier';
import { can } from '@/stores/useClanPermissionStore';
import type { Position } from '@/data/types/position';
import { useAccountStore } from '@/stores/useAccountStore';

const account = useAccountStore();

const itemsPerPage = ref<number>(10);

const search = ref<string>('');
const serverItems = ref<Player[]>([]);
const loading = ref<boolean>(true);
const totalItems = ref<number>(0);

const headers: VDataTableServer['headers'] = [
  { title: 'NAME', key: 'name', sortable: false, width: 280 },
  { title: 'TIER', key: 'tier', sortable: false },
  { title: 'CUSTOM', key: 'custom_tier', sortable: false },
  { title: 'CLAN', key: 'clan_tier', sortable: false },
  { title: 'MAIN', key: 'cup_count', sortable: false },
  { title: 'SUB', key: 'sub_cup_count', sortable: true },
  { title: 'POINT', key: 'point', sortable: true },
  { title: 'POSITION', key: 'positions', sortable: false, width: 220 },
  { title: 'ACTIVE', key: 'is_active', sortable: false },
  { title: 'CREATED', key: 'created_at', sortable: true },
  { title: '', key: 'actions', sortable: false, align: 'center', width: '1px' },
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

function openOpgg(item: any) {
  if (!item.nickname || !item.tagname) return;

  const region = 'kr';
  const riotId = `${item.nickname}-${item.tagname}`;
  const encoded = encodeURIComponent(riotId);
  const url = `https://www.op.gg/summoners/${region}/${encoded}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

function openEdit(item: any) {
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
      if (p.value) return { label: p.value };
      if (p.title) return { label: p.title };
      if (p.name) return { label: p.name };
      if (p.codedict?.title) return { label: p.codedict.title };
      if (p.codedict?.code_value) return { label: p.codedict.code_value };
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

    loading.value = true;

    const response = await api.get(`${getBaseUrl('DATA')}/player/search`, {
      params: {
        keyword: search.value || undefined,
        page: options.page,
        itemsPerPage: options.itemsPerPage,
        sortBy: sortKey,
        orderBy: sortOrder,
        clan: account.clan.name,

        // ✅ 배열로 전송: tier=GOLD&tier=EMERALD...
        tier: selectedClanTierGroups.value.length ? selectedClanTierGroups.value : undefined,
      },
    });

    serverItems.value = response.data.datas;
    totalItems.value = response.data.totalCount;
  } catch (error) {
    console.error('플레이어 목록 불러오기 실패:', error);
  } finally {
    loading.value = false;
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

function handleAdd() {
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
    console.error('기초 데이터 불러오기 실패:', error);
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
    handleSearch();
  } catch (e) {
    console.error(e);
  } finally {
    edit.value.loading = false;
  }
}

const selectedClanTierGroups = ref<string[]>([]);

// GOLD IV -> GOLD, PLATINUM I -> PLATINUM, UNRANK -> UNRANK
function toTierGroupName(name?: string) {
  if (!name) return '';
  const upper = name.toUpperCase().trim();
  // 앞 단어만 그룹으로 (GOLD IV -> GOLD)
  return upper.split(' ')[0];
}

// v-select items (중복 제거)
const clanTierGroupOptions = computed(() => {
  const groups = new Set<string>();
  for (const t of tierList.value) {
    const g = toTierGroupName(t.name);
    if (g) groups.add(g);
  }
  return Array.from(groups).map((g) => ({ title: g, value: g }));
});

function handleResetFilters() {
  search.value = '';
  selectedClanTierGroups.value = [];
  handleSearch();
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
.opgg-link:hover {
  text-decoration: underline;
}

.tier-chip {
  border: 1px solid rgba(255, 255, 255, 0.12);
}
.toolbar {
  display: grid;
  grid-template-columns: 320px 220px 1fr;
  gap: 12px;
  align-items: center;
}

.toolbar__actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 10px;
}

@media (max-width: 960px) {
  .toolbar {
    grid-template-columns: 1fr;
  }
  .toolbar__actions {
    justify-content: flex-start;
    flex-wrap: wrap;
  }
}
</style>
