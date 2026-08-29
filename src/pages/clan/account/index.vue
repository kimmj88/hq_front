<template>
  <v-container class="member-page py-6">
    <section class="member-hero mb-5">
      <div>
        <div class="hero-label mb-2"><v-icon size="16">mdi-account-group</v-icon> CLAN MEMBERS</div>
        <h1 class="text-h4 font-weight-black mb-1">클랜 멤버</h1>
        <p class="text-medium-emphasis mb-0">멤버 정보와 권한을 한곳에서 관리하세요.</p>
      </div>
      <div class="member-count">
        <v-icon size="22">mdi-account-group</v-icon>
        <strong>{{ totalItems }}</strong>
        <span>명</span>
      </div>
    </section>

    <v-card class="member-panel" rounded="xl" variant="outlined">
      <div class="member-toolbar">
        <div class="toolbar-title">
          <strong>멤버 목록</strong>
          <span>닉네임으로 원하는 멤버를 빠르게 찾아보세요.</span>
        </div>
        <v-text-field
          v-model="search"
          label="닉네임 검색"
          density="comfortable"
          hide-details
          clearable
          prepend-inner-icon="mdi-magnify"
          @keyup.enter="handleSearch"
          @click:clear="handleClear"
        />
        <v-btn color="primary" height="48" prepend-icon="mdi-magnify" @click="handleSearch">
          검색
        </v-btn>
      </div>

      <server-data-table
        v-if="can('ACCOUNT', 'CLAN-SET-ACC-R')"
        :headers="headers"
        :items="serverItems"
        :items-length="totalItems"
        :items-per-page="itemsPerPage"
        :page="page"
        :sort-by="lastOptions.sortBy"
        :loading="loading"
        :search="search"
        class="member-table"
        @update:page="handlePageChange"
        @update:items-per-page="itemsPerPage = $event"
        @update:options="loadItems"
      >
        <template #item.name="{ item }">
          <router-link :to="memberPath(item.id)" class="member-profile">
            <v-avatar size="56" :color="getAvatarColor(displayName(item))" class="member-avatar">
              <v-img v-if="item.avatar" :src="avatarUrl(item.avatar)" cover />
              <span v-else class="font-weight-black">{{ getInitials(displayName(item)) }}</span>
            </v-avatar>
            <div class="member-profile__text">
              <strong>{{ displayName(item) }}</strong>
              <span>{{ playerName(item) }}</span>
            </div>
          </router-link>
        </template>

        <template #item.clanrole="{ item }">
          <v-chip size="default" label variant="tonal" class="role-chip" :color="getRoleColor(item?.clanrole?.name)">
            <v-icon start size="18">{{ getRoleIcon(item?.clanrole?.name) }}</v-icon>
            {{ getRoleLabel(item?.clanrole?.name) }}
          </v-chip>
        </template>

        <template #item.created_at="{ item }">
          <span class="text-medium-emphasis">{{ formatDate(item.created_at) }}</span>
        </template>

        <template #item.actions="{ item }">
          <div class="member-actions">
            <v-btn
              v-if="canManageMembers"
              size="default"
              variant="tonal"
              color="primary"
              prepend-icon="mdi-shield-account-outline"
              @click="openRoleDialog(item)"
            >
              권한 수정
            </v-btn>
            <v-tooltip v-if="kickDisabledReason(item)" location="top" :text="kickDisabledReason(item)">
              <template #activator="{ props }">
                <span v-bind="props">
                  <v-btn size="default" variant="text" color="grey" disabled prepend-icon="mdi-account-remove-outline">
                    추방
                  </v-btn>
                </span>
              </template>
            </v-tooltip>
            <v-btn
              v-else-if="canManageMembers"
              size="default"
              variant="text"
              color="error"
              prepend-icon="mdi-account-remove-outline"
              @click="openKickDialog(item)"
            >
              추방
            </v-btn>
          </div>
        </template>

        <template #no-data>
          <div class="empty-state">
            <v-icon size="48" color="grey">mdi-account-search-outline</v-icon>
            <strong>조건에 맞는 멤버가 없습니다.</strong>
            <span>검색어를 다시 확인해 주세요.</span>
          </div>
        </template>
      </server-data-table>

      <div v-else class="empty-state py-16">
        <v-icon size="48" color="grey">mdi-lock-outline</v-icon>
        <strong>멤버 조회 권한이 없습니다.</strong>
      </div>
    </v-card>
  </v-container>

  <v-dialog v-model="kickDialog" max-width="430">
    <v-card rounded="xl" class="pa-2">
      <v-card-title class="d-flex align-center ga-3 pt-5">
        <v-avatar color="error" variant="tonal"><v-icon>mdi-account-remove</v-icon></v-avatar>
        멤버를 추방할까요?
      </v-card-title>
      <v-card-text class="text-body-1">
        <strong>{{ selectedMember ? displayName(selectedMember) : '' }}</strong> 님이 클랜에서 제외됩니다.
        추방 후 다시 가입하려면 초대 또는 가입 절차가 필요합니다.
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" :disabled="kicking" @click="kickDialog = false">취소</v-btn>
        <v-btn color="error" variant="flat" :loading="kicking" @click="confirmKick">추방하기</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="roleDialog" max-width="480">
    <v-card rounded="xl" class="pa-2">
      <v-card-title class="d-flex align-center ga-3 pt-5">
        <v-avatar color="primary" variant="tonal"><v-icon>mdi-shield-account</v-icon></v-avatar>
        클랜 권한 변경
      </v-card-title>
      <v-card-text>
        <div class="role-member mb-5">
          <v-avatar size="44" :color="getAvatarColor(selectedMember ? displayName(selectedMember) : '')">
            <v-img v-if="selectedMember?.avatar" :src="avatarUrl(selectedMember.avatar)" cover />
            <span v-else class="font-weight-black">{{ selectedMember ? getInitials(displayName(selectedMember)) : '' }}</span>
          </v-avatar>
          <div>
            <strong>{{ selectedMember ? displayName(selectedMember) : '' }}</strong>
            <span>{{ selectedMember ? playerName(selectedMember) : '' }}</span>
          </div>
        </div>

        <v-autocomplete
          v-model="selectedClanRole"
          :items="clanRoleList"
          :loading="roleLoading"
          item-title="name"
          item-value="id"
          label="클랜 권한"
          prepend-inner-icon="mdi-shield-key-outline"
          return-object
          variant="outlined"
        />

        <v-switch
          v-model="selectedIsConfirm"
          label="플레이어 로그인 승인"
          color="success"
          inset
          hide-details
        />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" :disabled="roleSaving" @click="roleDialog = false">취소</v-btn>
        <v-btn color="primary" variant="flat" :loading="roleSaving" @click="saveRole">저장</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">
    {{ snackbar.message }}
  </v-snackbar>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { AxiosError } from 'axios';
import type { VDataTableServer } from 'vuetify/components';
import { CLAN_PATH } from '@/router/clan/type';
import { getBaseUrl } from '@/@core/composable/createUrl';
import api from '@/@core/composable/useAxios';
import type { Account } from '@/data/types/account';
import type { ClanRole } from '@/data/types/clanrole';
import ServerDataTable from '@/components/common/ServerDataTable.vue';
import { can } from '@/stores/useClanPermissionStore';
import { useAccountStore } from '@/stores/useAccountStore';

type MemberAccount = Account & { player?: any };
interface FetchParams {
  keyword: string;
  page: number;
  itemsPerPage: number;
  sortBy: { key: keyof Account; order: 'asc' | 'desc' }[];
}

const account = useAccountStore();
const route = useRoute();
const router = useRouter();
const queryNumber = (value: unknown, fallback: number) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const page = ref(queryNumber(route.query.memberPage, 1));
const itemsPerPage = ref(queryNumber(route.query.memberSize, 10));
const search = ref(String(route.query.memberSearch ?? ''));
const serverItems = ref<MemberAccount[]>([]);
const loading = ref(true);
const totalItems = ref(0);
const kickDialog = ref(false);
const kicking = ref(false);
const selectedMember = ref<MemberAccount | null>(null);
const roleDialog = ref(false);
const roleLoading = ref(false);
const roleSaving = ref(false);
const clanRoleList = ref<ClanRole[]>([]);
const selectedClanRole = ref<ClanRole | null>(null);
const selectedIsConfirm = ref(false);
const snackbar = ref({ show: false, message: '', color: 'success' });

const canManageMembers = computed(
  () => account.isClanMaster || can('ACCOUNT', 'CLAN-SET-ACC-U'),
);

const headers: VDataTableServer['headers'] = [
  { title: '멤버', key: 'name', minWidth: '230px' },
  { title: '클랜 권한', key: 'clanrole', minWidth: '130px' },
  { title: '가입일', key: 'created_at', minWidth: '115px' },
  { title: '관리', key: 'actions', sortable: false, align: 'end', width: '230px' },
] as const;

const lastOptions = ref<FetchParams>({
  keyword: search.value,
  page: page.value,
  itemsPerPage: itemsPerPage.value,
  sortBy: route.query.memberSort
    ? [{ key: String(route.query.memberSort) as keyof Account, order: route.query.memberOrder === 'asc' ? 'asc' : 'desc' }]
    : [],
});

let pendingPageChange = false;
function handlePageChange(nextPage: number) {
  page.value = nextPage;
  pendingPageChange = true;
}

function saveListState(options: FetchParams) {
  const sort = options.sortBy[0];
  void router.replace({
    query: {
      ...route.query,
      memberPage: String(options.page),
      memberSize: String(options.itemsPerPage),
      memberSearch: search.value || undefined,
      memberSort: sort?.key ? String(sort.key) : undefined,
      memberOrder: sort?.order,
    },
  });
}

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
    saveListState(normalizedOptions);
    loading.value = true;
    const sortKey = normalizedOptions.sortBy[0]?.key || 'created_at';
    const sortOrder = normalizedOptions.sortBy[0]?.order || 'desc';
    const response = await api.get(`${getBaseUrl('DATA')}/account/search`, {
      params: {
        keyword: search.value,
        page: normalizedOptions.page,
        itemsPerPage: normalizedOptions.itemsPerPage,
        sortBy: sortKey,
        orderBy: sortOrder,
        clan: account.clan?.name,
      },
    });
    serverItems.value = response.data.datas ?? [];
    totalItems.value = response.data.totalCount ?? 0;
  } catch (error) {
    showMessage(errorMessage(error, '멤버 목록을 불러오지 못했습니다.'), 'error');
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  loadItems({ ...lastOptions.value, keyword: search.value, page: 1 });
}

function handleClear() {
  search.value = '';
  handleSearch();
}

function openKickDialog(item: MemberAccount) {
  selectedMember.value = item;
  kickDialog.value = true;
}

async function openRoleDialog(item: MemberAccount) {
  selectedMember.value = item;
  selectedClanRole.value = item.clanrole ?? null;
  selectedIsConfirm.value = !!item.is_confirm;
  roleDialog.value = true;

  if (clanRoleList.value.length) return;
  roleLoading.value = true;
  try {
    const response = await api.get(`${getBaseUrl('DATA')}/clanrole/all`);
    clanRoleList.value = response.data.datas ?? [];
  } catch (error) {
    showMessage(errorMessage(error, '클랜 권한 목록을 불러오지 못했습니다.'), 'error');
    roleDialog.value = false;
  } finally {
    roleLoading.value = false;
  }
}

async function saveRole() {
  if (!selectedMember.value || !selectedClanRole.value?.id || roleSaving.value) return;
  roleSaving.value = true;
  try {
    await api.post(`${getBaseUrl('DATA')}/account/edit_clanrole`, {
      id: selectedMember.value.id,
      clanrole_id: selectedClanRole.value.id,
      is_confirm: selectedIsConfirm.value,
    });
    selectedMember.value.clanrole = selectedClanRole.value as any;
    selectedMember.value.is_confirm = selectedIsConfirm.value;
    roleDialog.value = false;
    showMessage(`${displayName(selectedMember.value)} 님의 클랜 권한을 변경했습니다.`, 'success');
  } catch (error) {
    showMessage(errorMessage(error, '클랜 권한을 변경하지 못했습니다.'), 'error');
  } finally {
    roleSaving.value = false;
  }
}

async function confirmKick() {
  if (!selectedMember.value || kicking.value) return;
  kicking.value = true;
  try {
    await api.post(`${getBaseUrl('DATA')}/account/kick_clan_member`, {
      target_account_id: selectedMember.value.id,
    });
    kickDialog.value = false;
    showMessage(`${displayName(selectedMember.value)} 님을 클랜에서 추방했습니다.`, 'success');
    const targetPage = serverItems.value.length === 1 && page.value > 1 ? page.value - 1 : page.value;
    await loadItems({ ...lastOptions.value, page: targetPage });
    selectedMember.value = null;
  } catch (error) {
    showMessage(errorMessage(error, '멤버를 추방하지 못했습니다.'), 'error');
  } finally {
    kicking.value = false;
  }
}

function kickDisabledReason(item: MemberAccount) {
  if (!canManageMembers.value) return '';
  if (item.id === account.id) return '본인은 추방할 수 없습니다.';
  if (item.clanrole?.name?.toLowerCase() === 'master') return '클랜 마스터는 추방할 수 없습니다.';
  return '';
}

function memberPath(id: number) {
  return CLAN_PATH.ACCOUNT_VIEW(account.clan?.name, id);
}

function displayName(item: MemberAccount) {
  return item.nickname || item.name || '이름 없음';
}

function playerName(item: MemberAccount) {
  if (!item.player) return item.email || '롤 계정 미연동';
  return `${item.player.nickname ?? ''}${item.player.tagname ? `#${item.player.tagname}` : ''}`;
}

function formatDate(value?: string) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(value));
}

function avatarUrl(value: string) {
  if (!value) return '';
  if (/^(https?:|data:|blob:)/i.test(value)) return value;
  return `${getBaseUrl('DATA')}${value.startsWith('/') ? '' : '/'}${value}`;
}

const avatarColors = ['#5C6BC0', '#7E57C2', '#26A69A', '#42A5F5', '#EC407A', '#FF7043'];
function getAvatarColor(name: string) {
  const code = [...(name || 'A')].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return avatarColors[code % avatarColors.length];
}

function getInitials(name: string) {
  return [...(name || '?')].slice(0, 2).join('').toUpperCase();
}

function getRoleIcon(role?: string) {
  return { master: 'mdi-crown', manager: 'mdi-shield-account', member: 'mdi-account', guest: 'mdi-account-outline' }[(role ?? '').toLowerCase()] || 'mdi-help-circle-outline';
}

function getRoleColor(role?: string) {
  return { master: 'amber-darken-2', manager: 'deep-purple', member: 'indigo', guest: 'grey' }[(role ?? '').toLowerCase()] || 'grey';
}

function getRoleLabel(role?: string) {
  return { master: '마스터', manager: '관리자', member: '멤버', guest: '게스트' }[(role ?? '').toLowerCase()] || role || '-';
}

function errorMessage(error: unknown, fallback: string) {
  const axiosError = error as AxiosError<{ message?: string }>;
  return axiosError.response?.data?.message || fallback;
}

function showMessage(message: string, color: string) {
  snackbar.value = { show: true, message, color };
}
</script>

<style scoped>
.member-page { max-width: 1480px; }
.member-hero { position: relative; display: flex; align-items: center; justify-content: space-between; gap: 24px; overflow: hidden; padding: 28px 32px; border: 1px solid rgba(var(--v-theme-primary), .2); border-radius: 24px; background: linear-gradient(125deg, rgba(var(--v-theme-primary), .16), rgba(var(--v-theme-surface), .92) 55%, rgba(126, 87, 194, .12)); box-shadow: 0 18px 45px rgba(0, 0, 0, .12); }
.member-hero::after { content: ''; position: absolute; right: 9%; top: -80px; width: 210px; height: 210px; border-radius: 50%; background: rgba(var(--v-theme-primary), .12); filter: blur(2px); pointer-events: none; }
.hero-label { display: inline-flex; align-items: center; gap: 7px; color: rgb(var(--v-theme-primary)); font-size: .72rem; font-weight: 900; letter-spacing: .12em; }
.member-count { position: relative; z-index: 1; display: flex; align-items: baseline; gap: 8px; min-width: 118px; justify-content: center; padding: 18px 22px; border: 1px solid rgba(var(--v-theme-primary), .25); border-radius: 20px; background: rgba(var(--v-theme-surface), .72); box-shadow: inset 0 1px rgba(255, 255, 255, .08), 0 10px 24px rgba(0, 0, 0, .12); backdrop-filter: blur(12px); }
.member-count strong { font-size: 2rem; line-height: 1; color: rgb(var(--v-theme-primary)); }
.member-panel { overflow: hidden; border-color: rgba(var(--v-border-color), .75) !important; background: rgba(var(--v-theme-surface), .82); box-shadow: 0 18px 50px rgba(0, 0, 0, .1); }
.member-toolbar { display: grid; grid-template-columns: minmax(220px, 1fr) minmax(260px, 420px) auto; align-items: center; gap: 14px; padding: 24px 26px 18px; border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)); background: linear-gradient(90deg, rgba(var(--v-theme-on-surface), .025), transparent); }
.toolbar-title { display: flex; flex-direction: column; gap: 3px; }
.toolbar-title strong { font-size: 1.05rem; }
.toolbar-title span { color: rgba(var(--v-theme-on-surface), .55); font-size: .78rem; }
.member-profile { display: inline-flex; align-items: center; gap: 16px; color: inherit; text-decoration: none; padding-block: 12px; }
.member-profile:hover strong { color: rgb(var(--v-theme-primary)); }
.member-avatar { border: 2px solid rgba(255, 255, 255, .16); box-shadow: 0 6px 16px rgba(0, 0, 0, .2); }
.member-profile__text { display: flex; flex-direction: column; min-width: 0; }
.member-profile__text strong { font-size: 1.05rem; transition: color .18s ease; }
.member-profile__text strong, .member-profile__text span { max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.member-profile__text span { color: rgba(var(--v-theme-on-surface), .58); font-size: .82rem; margin-top: 4px; }
.role-chip { min-width: 102px; justify-content: center; font-weight: 700; letter-spacing: .02em; }
.member-actions { display: flex; justify-content: flex-end; align-items: center; gap: 8px; white-space: nowrap; }
.role-member { display: flex; align-items: center; gap: 12px; padding: 14px; border-radius: 14px; background: rgba(var(--v-theme-primary), .07); }
.role-member > div { display: flex; flex-direction: column; min-width: 0; }
.role-member span { color: rgba(var(--v-theme-on-surface), .6); font-size: .8rem; }
.empty-state { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 44px 16px; color: rgba(var(--v-theme-on-surface), .6); }
:deep(.member-table table) { border-collapse: separate; border-spacing: 0 7px; padding: 0 16px 10px; }
:deep(.member-table thead th) { height: 54px !important; border-bottom: 0 !important; font-size: .78rem; font-weight: 700 !important; text-transform: none; color: rgba(var(--v-theme-on-surface), .52); background: transparent; }
:deep(.member-table tbody tr) { background: rgba(var(--v-theme-on-surface), .028); box-shadow: none; transition: transform .18s ease, background .18s ease, box-shadow .18s ease; }
:deep(.member-table tbody tr:hover) { position: relative; z-index: 1; transform: translateY(-2px); background: rgba(var(--v-theme-primary), .075); box-shadow: 0 10px 24px rgba(0, 0, 0, .12); }
:deep(.member-table tbody td) { height: 84px !important; border-bottom: 0 !important; }
:deep(.member-table tbody td:first-child) { border-radius: 16px 0 0 16px; padding-left: 20px !important; }
:deep(.member-table tbody td:last-child) { border-radius: 0 16px 16px 0; padding-right: 18px !important; }
:deep(.member-table .v-data-table-footer) { border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)); padding: 10px 18px; }
@media (max-width: 600px) {
  .member-page { padding-inline: 12px !important; }
  .member-hero { align-items: flex-end; padding: 22px 20px; }
  .member-hero h1 { font-size: 1.65rem !important; }
  .member-hero p { display: none; }
  .member-count { min-width: 92px; padding: 14px; }
  .member-toolbar { grid-template-columns: 1fr auto; padding: 16px; }
  .toolbar-title { grid-column: 1 / -1; }
  .member-toolbar .v-btn { min-width: 52px; padding-inline: 12px; }
  :deep(.member-table table) { padding-inline: 8px; }
}
</style>
