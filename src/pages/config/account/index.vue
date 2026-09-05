<template>
  <div class="account-root">
  <v-container class="account-page py-6">
    <section class="account-hero mb-5">
      <div>
        <div class="hero-label mb-2"><v-icon size="16">mdi-account-cog</v-icon> SYSTEM ACCOUNTS</div>
        <h1 class="text-h4 font-weight-black mb-1">전체 사용자</h1>
        <p class="text-medium-emphasis mb-0">서비스에 가입한 사용자 정보와 시스템 권한을 관리하세요.</p>
      </div>
      <div class="account-count"><v-icon size="22">mdi-account-multiple</v-icon><strong>{{ totalItems }}</strong><span>명</span></div>
    </section>

    <v-card class="account-panel" rounded="xl" variant="outlined">
      <div class="account-toolbar">
        <div class="toolbar-title"><strong>사용자 목록</strong><span>이름, 닉네임 또는 이메일로 검색하세요.</span></div>
        <v-text-field
          v-model="search"
          label="사용자 검색"
          density="comfortable"
          hide-details
          clearable
          prepend-inner-icon="mdi-magnify"
          @keyup.enter="handleSearch"
          @click:clear="handleClear"
        />
        <v-btn color="primary" height="48" prepend-icon="mdi-magnify" @click="handleSearch">검색</v-btn>
      </div>

    <server-data-table
      v-show="can('ACCOUNT', 'SYS-SET-ACC-R')"
      :headers="headers"
      :items="serverItems"
      :items-length="totalItems"
      :items-per-page="itemsPerPage"
      :page="page"
      :sort-by="lastOptions.sortBy"
      :loading="false"
      :search="search"
      class="account-table"
      @update:page="handlePageChange"
      @update:items-per-page="itemsPerPage = $event"
      @update:options="loadItems"
    >
      <template #item.name="{ item }">
        <button type="button" class="account-profile" @click="openAccountDetails(item.id)">
          <v-avatar size="56" :color="getAvatarColor(displayName(item))" class="account-avatar">
            <v-img v-if="item.avatar" :src="avatarUrl(item.avatar)" cover />
            <span v-else class="font-weight-black">{{ getInitials(displayName(item)) }}</span>
          </v-avatar>
          <div class="account-profile__text">
            <strong>{{ displayName(item) }}</strong>
            <span>{{ item.email || '이메일 정보 없음' }}</span>
          </div>
        </button>
      </template>

      <template #item.player="{ item }">
        <div v-if="item.player" class="player-cell">
          <div class="player-cell__body">
            <strong>{{ item.player.nickname }}<em v-if="item.player.tagname">#{{ item.player.tagname }}</em></strong>
            <span v-if="item.player.created_at || item.player.create_at">
              플레이어 생성 {{ formatDate(item.player.created_at || item.player.create_at) }}
            </span>
          </div>
        </div>
        <div v-else class="unlinked-player">
          <v-icon size="18">mdi-link-variant-off</v-icon>
          <span>LoL 계정 미연동</span>
        </div>
      </template>

      <template #item.systemrole="{ item }">
        <v-chip size="default" label variant="tonal" class="role-chip" :color="getRoleColor(item.systemrole?.name)">
          <v-icon start size="18">{{ getRoleIcon(item.systemrole?.name) }}</v-icon>
          {{ item.systemrole?.name || '-' }}
        </v-chip>
      </template>

      <template #item.clan="{ item }">
        <div v-if="item.clan" class="clan-cell">
          <div>
            <strong>{{ item.clan.name }}</strong>
            <span v-if="item.clan.created_at">클랜 생성 {{ formatDate(item.clan.created_at) }}</span>
          </div>
        </div>
        <v-chip v-else size="small" variant="tonal" color="grey">미가입</v-chip>
      </template>

      <template #item.created_at="{ item }">
        <div class="joined-date">
          <strong>{{ formatDate(item.created_at) }}</strong>
          <span>서비스 가입</span>
        </div>
      </template>

      <template #item.actions="{ item }">
        <div class="account-actions">
          <v-btn size="default" variant="text" prepend-icon="mdi-account-details-outline" @click="openAccountDetails(item.id)">상세</v-btn>
          <v-btn v-if="can('ACCOUNT', 'SYS-SET-ACC-U')" size="default" variant="tonal" color="primary" prepend-icon="mdi-shield-account-outline" @click="openSystemRoleDialog(item)">권한 변경</v-btn>
        </div>
      </template>

      <template #no-data><div class="empty-state"><v-icon size="48" color="grey">mdi-account-search-outline</v-icon><strong>조건에 맞는 사용자가 없습니다.</strong><span>검색어를 다시 확인해 주세요.</span></div></template>
    </server-data-table>

      <div v-show="!can('ACCOUNT', 'SYS-SET-ACC-R')" class="empty-state py-16"><v-icon size="48" color="grey">mdi-lock-outline</v-icon><strong>사용자 조회 권한이 없습니다.</strong></div>
    </v-card>
  </v-container>

  <v-dialog v-model="roleDialog" max-width="480">
    <v-card rounded="xl" class="pa-2">
      <v-card-title class="d-flex align-center ga-3 pt-5">
        <v-avatar color="primary" variant="tonal"><v-icon>mdi-shield-account</v-icon></v-avatar>
        시스템 권한 변경
      </v-card-title>
      <v-card-text>
        <div v-if="selectedAccount" class="role-account mb-5">
          <v-avatar size="46" :color="getAvatarColor(displayName(selectedAccount))">
            <v-img v-if="selectedAccount.avatar" :src="avatarUrl(selectedAccount.avatar)" cover />
            <span v-else class="font-weight-black">{{ getInitials(displayName(selectedAccount)) }}</span>
          </v-avatar>
          <div><strong>{{ displayName(selectedAccount) }}</strong><span>{{ selectedAccount.email }}</span></div>
        </div>
        <v-autocomplete v-model="selectedSystemRole" :items="systemRoles" :loading="roleLoading" item-title="name" item-value="id" return-object label="시스템 권한" variant="outlined" prepend-inner-icon="mdi-shield-key-outline" />
        <v-alert type="warning" variant="tonal" density="compact">시스템 권한은 전체 서비스 접근 범위에 영향을 줍니다.</v-alert>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" :disabled="roleSaving" @click="roleDialog = false">취소</v-btn>
        <v-btn color="primary" variant="flat" :loading="roleSaving" :disabled="!selectedSystemRole" @click="saveSystemRole">저장</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">{{ snackbar.message }}</v-snackbar>
  </div>
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
import { useAccountStore } from '@/stores/useAccountStore';
import { useRouter } from 'vue-router';
import type { SystemRole } from '@/data/types/systemrole';

const router = useRouter();

const account = useAccountStore();

const itemsPerPage = ref<number>(10);
const page = ref(1);

const search = ref<string>('');
const serverItems = ref<Account[]>([]);
const loading = ref<boolean>(true);
const totalItems = ref<number>(0);
const roleDialog = ref(false);
const roleLoading = ref(false);
const roleSaving = ref(false);
const selectedAccount = ref<Account | null>(null);
const selectedSystemRole = ref<SystemRole | null>(null);
const systemRoles = ref<SystemRole[]>([]);
const snackbar = ref({ show: false, message: '', color: 'success' });

const headers: VDataTableServer['headers'] = [
  { title: '사용자', key: 'name', minWidth: '230px' },
  { title: '연동 플레이어', key: 'player', sortable: false, width: '180px', minWidth: '180px' },
  { title: '시스템 권한', key: 'systemrole', minWidth: '130px' },
  { title: '소속 클랜', key: 'clan', sortable: false },
  { title: '가입일', key: 'created_at', minWidth: '125px' },
  { title: '관리', key: 'actions', sortable: false, align: 'end', width: '260px' },
] as const;

function getAccessNextPath(id: number): string {
  if (account.id == id || can('ACCOUNT', 'SYS-SET-ACC-R')) {
    return CONFIG_ACCOUNT_PATH.VIEW(id);
  }
  return '/forbidden';
}

function openAccountDetails(id: number) {
  void router.push(getAccessNextPath(id));
}

interface FetchParams {
  keyword: string;
  page: number;
  itemsPerPage: number;
  sortBy: { key: keyof Account; order: 'asc' | 'desc' }[];
}

const lastOptions = ref<FetchParams>({
  keyword: '',
  page: 1,
  itemsPerPage: itemsPerPage.value,
  sortBy: [],
});

let pendingPageChange = false;
function handlePageChange(nextPage: number) {
  page.value = nextPage;
  pendingPageChange = true;
}

async function loadItems(options: FetchParams) {
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
  loading.value = true;
  try {
    const sortKey = normalizedOptions.sortBy[0]?.key || 'created_at';
    const sortOrder = normalizedOptions.sortBy[0]?.order || 'desc';

    const response = await api.get(`${getBaseUrl('DATA')}/account/search`, {
      params: {
        keyword: search.value,
        page: normalizedOptions.page,
        itemsPerPage: normalizedOptions.itemsPerPage,
        sortBy: sortKey,
        orderBy: sortOrder,
      },
    });

    serverItems.value = response.data.datas ?? [];
    totalItems.value = response.data.totalCount ?? 0;
  } catch (error) {
    console.error('사용자 목록 불러오기 실패:', error);
  } finally {
    loading.value = false;
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

function avatarUrl(value: string) {
  return /^https?:\/\//i.test(value) ? value : `${getBaseUrl('DATA').replace(/\/$/, '')}${value}`;
}

function displayName(item: Account) {
  return item.nickname || item.name || '이름 없음';
}

function formatDate(value?: string) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function getRoleIcon(role?: string) {
  return ['admin', 'master'].includes((role ?? '').toLowerCase()) ? 'mdi-crown' : 'mdi-account-shield-outline';
}

function getRoleColor(role?: string) {
  return ['admin', 'master'].includes((role ?? '').toLowerCase()) ? 'amber-darken-2' : 'indigo';
}

async function openSystemRoleDialog(item: Account) {
  selectedAccount.value = item;
  selectedSystemRole.value = item.systemrole ? { ...item.systemrole } : null;
  roleDialog.value = true;
  if (systemRoles.value.length) return;
  roleLoading.value = true;
  try {
    const response = await api.get(`${getBaseUrl('DATA')}/systemrole/all`);
    systemRoles.value = response.data.datas ?? [];
  } catch (error) {
    console.error('시스템 권한 목록 불러오기 실패:', error);
    showMessage('시스템 권한 목록을 불러오지 못했습니다.', 'error');
  } finally {
    roleLoading.value = false;
  }
}

async function saveSystemRole() {
  if (!selectedAccount.value || !selectedSystemRole.value?.id) return;
  roleSaving.value = true;
  try {
    await api.post(`${getBaseUrl('DATA')}/account/update`, {
      id: selectedAccount.value.id,
      systemrole_id: selectedSystemRole.value.id,
      is_confirm: selectedAccount.value.is_confirm,
    });
    selectedAccount.value.systemrole = { ...selectedSystemRole.value };
    roleDialog.value = false;
    showMessage('시스템 권한을 변경했습니다.', 'success');
  } catch (error) {
    console.error('시스템 권한 변경 실패:', error);
    showMessage('시스템 권한을 변경하지 못했습니다.', 'error');
  } finally {
    roleSaving.value = false;
  }
}

function showMessage(message: string, color: string) {
  snackbar.value = { show: true, message, color };
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
  page.value = 1;
  loadItems({ ...lastOptions.value, keyword: search.value, page: 1 });
}

function handleClear() {
  search.value = '';
  handleSearch();
}
</script>

<style scoped>
.account-page{max-width:1480px}.account-hero{position:relative;display:flex;align-items:center;justify-content:space-between;gap:24px;overflow:hidden;padding:28px 32px;border:1px solid rgba(var(--v-theme-primary),.2);border-radius:24px;background:linear-gradient(125deg,rgba(var(--v-theme-primary),.16),rgba(var(--v-theme-surface),.92) 55%,rgba(126,87,194,.12));box-shadow:0 18px 45px rgba(0,0,0,.12)}.account-hero::after{position:absolute;top:-80px;right:9%;width:210px;height:210px;border-radius:50%;background:rgba(var(--v-theme-primary),.12);content:'';pointer-events:none}.hero-label{display:inline-flex;align-items:center;gap:7px;color:rgb(var(--v-theme-primary));font-size:.72rem;font-weight:900;letter-spacing:.12em}.account-count{position:relative;z-index:1;display:flex;align-items:baseline;justify-content:center;gap:8px;min-width:118px;padding:18px 22px;border:1px solid rgba(var(--v-theme-primary),.25);border-radius:20px;background:rgba(var(--v-theme-surface),.72);box-shadow:inset 0 1px rgba(255,255,255,.08),0 10px 24px rgba(0,0,0,.12)}.account-count strong{color:rgb(var(--v-theme-primary));font-size:2rem;line-height:1}.account-panel{overflow:hidden;border-color:rgba(var(--v-border-color),.75)!important;background:rgba(var(--v-theme-surface),.82);box-shadow:0 18px 50px rgba(0,0,0,.1)}.account-toolbar{display:grid;grid-template-columns:minmax(220px,1fr) minmax(260px,420px) auto;align-items:center;gap:14px;padding:24px 26px 18px;border-bottom:1px solid rgba(var(--v-border-color),var(--v-border-opacity));background:linear-gradient(90deg,rgba(var(--v-theme-on-surface),.025),transparent)}.toolbar-title{display:flex;flex-direction:column;gap:3px}.toolbar-title strong{font-size:1.05rem}.toolbar-title span{color:rgba(var(--v-theme-on-surface),.55);font-size:.78rem}.account-profile{display:inline-flex;align-items:center;gap:16px;padding-block:12px;color:inherit;text-decoration:none}.account-profile:hover strong{color:rgb(var(--v-theme-primary))}.account-avatar{border:2px solid rgba(255,255,255,.16);box-shadow:0 6px 16px rgba(0,0,0,.2)}.account-profile__text{display:flex;min-width:0;flex-direction:column}.account-profile__text strong{font-size:1.05rem;transition:color .18s ease}.account-profile__text strong,.account-profile__text span{overflow:hidden;max-width:280px;text-overflow:ellipsis;white-space:nowrap}.account-profile__text span{margin-top:4px;color:rgba(var(--v-theme-on-surface),.58);font-size:.82rem}.player-cell{display:flex;align-items:center;gap:11px}.player-avatar{border:1px solid rgba(var(--v-theme-primary),.3)}.player-cell__body{display:flex;min-width:0;flex-direction:column;gap:6px}.player-cell__body>strong{overflow:hidden;max-width:220px;text-overflow:ellipsis;white-space:nowrap}.player-cell__body em{color:rgb(var(--v-theme-primary));font-size:.78rem;font-style:normal}.player-tiers{display:flex;align-items:center;gap:7px}.player-tiers>span{color:rgba(var(--v-theme-on-surface),.48);font-size:.68rem}.unlinked-player{display:flex;align-items:center;gap:7px;color:rgba(var(--v-theme-on-surface),.42);font-size:.78rem}.role-chip{min-width:102px;justify-content:center;font-weight:700}.clan-cell,.role-account{display:flex;align-items:center;gap:11px}.clan-cell>div,.role-account>div{display:flex;min-width:0;flex-direction:column}.clan-cell strong,.clan-cell span,.role-account strong,.role-account span{overflow:hidden;max-width:180px;text-overflow:ellipsis;white-space:nowrap}.clan-cell span,.role-account span{color:rgba(var(--v-theme-on-surface),.5);font-size:.75rem}.role-account{padding:14px;border-radius:14px;background:rgba(var(--v-theme-primary),.07)}.account-actions{display:flex;justify-content:flex-end;gap:6px;white-space:nowrap}.empty-state{display:flex;align-items:center;flex-direction:column;gap:8px;padding:44px 16px;color:rgba(var(--v-theme-on-surface),.6)}:deep(.account-table table){padding:0 16px 10px;border-collapse:separate;border-spacing:0 7px}:deep(.account-table thead th){height:54px!important;border-bottom:0!important;background:transparent;color:rgba(var(--v-theme-on-surface),.52);font-size:.78rem;font-weight:700!important;text-transform:none}:deep(.account-table tbody tr){background:rgba(var(--v-theme-on-surface),.028);box-shadow:none;transition:transform .18s ease,background .18s ease,box-shadow .18s ease}:deep(.account-table tbody tr:hover){position:relative;z-index:1;transform:translateY(-2px);background:rgba(var(--v-theme-primary),.075);box-shadow:0 10px 24px rgba(0,0,0,.12)}:deep(.account-table tbody td){height:90px!important;border-bottom:0!important}:deep(.account-table tbody td:first-child){padding-left:20px!important;border-radius:16px 0 0 16px}:deep(.account-table tbody td:last-child){padding-right:18px!important;border-radius:0 16px 16px 0}:deep(.account-table .v-data-table-footer){padding:10px 18px;border-top:1px solid rgba(var(--v-border-color),var(--v-border-opacity))}@media(max-width:600px){.account-page{padding-inline:12px!important}.account-hero{align-items:flex-end;padding:22px 20px}.account-hero h1{font-size:1.65rem!important}.account-hero p{display:none}.account-count{min-width:92px;padding:14px}.account-toolbar{grid-template-columns:1fr auto;padding:16px}.toolbar-title{grid-column:1/-1}.account-toolbar .v-btn{min-width:52px;padding-inline:12px}:deep(.account-table table){padding-inline:8px}}
.account-profile{border:0;background:transparent;font:inherit;text-align:left;cursor:pointer}.player-cell__body>span{color:rgba(var(--v-theme-on-surface),.5);font-size:.72rem}.joined-date{display:flex;flex-direction:column;gap:3px}.joined-date strong{font-size:.86rem}.joined-date span{color:rgba(var(--v-theme-on-surface),.45);font-size:.68rem}
</style>
