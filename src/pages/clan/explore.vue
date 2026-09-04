<template>
  <v-container class="explore-page py-6">
    <section class="explore-hero mb-6">
      <div>
        <span class="eyebrow">CLAN DISCOVERY</span>
        <h1>클랜 엿보기</h1>
        <p>다른 클랜의 활동과 기록을 공개 대시보드로 살펴보세요.</p>
        <div v-if="!account.isClaned" class="hero-actions mt-5">
          <v-btn
            color="deep-purple-accent-2"
            prepend-icon="mdi-account-plus-outline"
            @click="openJoinDialog"
          >
            클랜 가입하기
          </v-btn>
          <v-btn
            v-if="account.isLoggedIn"
            variant="tonal"
            color="deep-purple-accent-2"
            prepend-icon="mdi-account-group"
            @click="openCreateDialog"
          >
            클랜 만들기
          </v-btn>
        </div>
      </div>
      <v-text-field
        v-model="keyword"
        class="explore-search"
        prepend-inner-icon="mdi-magnify"
        label="클랜 이름 검색"
        variant="solo-filled"
        hide-details
        clearable
        @keyup.enter="loadClans(1)"
        @click:clear="loadClans(1)"
      />
    </section>

    <v-row v-if="loadingList">
      <v-col v-for="index in 6" :key="index" cols="12" md="6" lg="4">
        <v-skeleton-loader type="image, article" class="rounded-xl" />
      </v-col>
    </v-row>

    <v-row v-else-if="clans.length">
      <v-col v-for="clan in clans" :key="clan.id" cols="12" md="6" lg="4">
        <v-card class="clan-preview" rounded="xl" @click="openDashboard(clan.id)">
          <div class="clan-preview__banner" :style="bannerStyle(clan.banner_url)">
            <v-chip color="white" variant="flat" size="small" prepend-icon="mdi-account-group">
              {{ clan.member_count }}명
            </v-chip>
          </div>
          <v-card-text>
            <h2>{{ clan.name }}</h2>
            <p>{{ clan.description || '등록된 클랜 소개가 없습니다.' }}</p>
            <div class="clan-preview__stats">
              <span><v-icon size="17">mdi-sword-cross</v-icon> 내전 {{ clan.completed_match_count }}</span>
              <span><v-icon size="17">mdi-gavel</v-icon> 경매 {{ clan.completed_auction_count }}</span>
            </div>
          </v-card-text>
          <v-card-actions>
            <v-btn block variant="tonal" color="primary" append-icon="mdi-arrow-right">공개 대시보드</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <v-alert v-else type="info" variant="tonal">검색된 클랜이 없습니다.</v-alert>

    <v-pagination
      v-if="totalPages > 1"
      v-model="page"
      class="mt-7"
      :length="totalPages"
      rounded="circle"
      @update:model-value="loadClans"
    />

    <v-dialog v-model="joinDialog" max-width="520">
      <v-card rounded="xl">
        <v-card-title class="d-flex align-center px-6 pt-6">
          <v-avatar color="primary" variant="tonal" class="mr-3">
            <v-icon>mdi-account-plus-outline</v-icon>
          </v-avatar>
          <div>
            <div class="text-h6 font-weight-bold">클랜 가입하기</div>
            <div class="text-caption text-medium-emphasis">전달받은 초대코드 또는 초대 링크를 입력하세요.</div>
          </div>
        </v-card-title>
        <v-card-text class="px-6 pt-5">
          <v-alert v-if="!account.isLoggedIn" type="info" variant="tonal" class="mb-4">
            클랜에 가입하려면 먼저 로그인해야 합니다.
          </v-alert>
          <v-alert v-else-if="!account.isPlayerLinked" type="warning" variant="tonal" class="mb-4">
            클랜에 가입하려면 리그 오브 레전드 계정을 먼저 연동해야 합니다.
          </v-alert>
          <v-text-field
            v-model="inviteInput"
            label="초대코드 또는 초대 링크"
            placeholder="예: abcd1234 또는 https://clangg.kr/clan/invite/abcd1234"
            prepend-inner-icon="mdi-link-variant"
            variant="outlined"
            :disabled="joiningClan || !account.isLoggedIn || !account.isPlayerLinked"
            :error-messages="joinError"
            @keyup.enter="joinClan"
          />
        </v-card-text>
        <v-card-actions class="px-6 pb-6 justify-end">
          <v-btn variant="text" :disabled="joiningClan" @click="joinDialog = false">취소</v-btn>
          <v-btn v-if="!account.isLoggedIn" color="primary" @click="goLogin">로그인하기</v-btn>
          <v-btn v-else-if="!account.isPlayerLinked" color="primary" @click="goPlayerLink">롤 계정 연동</v-btn>
          <v-btn
            v-else
            color="primary"
            prepend-icon="mdi-check"
            :loading="joiningClan"
            :disabled="!inviteInput.trim()"
            @click="joinClan"
          >가입하기</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="dashboardDialog" max-width="1080" scrollable>
      <v-card class="dashboard-dialog" rounded="xl">
        <v-btn class="dialog-close" icon="mdi-close" variant="flat" size="small" @click="dashboardDialog = false" />
        <div v-if="dashboard" class="dashboard-banner" :style="bannerStyle(dashboard.clan.banner_url)">
          <div class="dashboard-banner__shade">
            <span class="eyebrow">PUBLIC DASHBOARD</span>
            <h2>{{ dashboard.clan.name }}</h2>
            <p>{{ dashboard.clan.description || '등록된 클랜 소개가 없습니다.' }}</p>
          </div>
        </div>

        <v-card-text v-if="dashboardLoading" class="text-center py-16">
          <v-progress-circular indeterminate color="primary" size="52" />
        </v-card-text>
        <v-card-text v-else-if="dashboard" class="dashboard-body">
          <v-row>
            <v-col cols="12" md="4">
              <div class="summary-card summary-card--master">
                <v-avatar size="54" color="deep-purple-darken-2">
                  <v-img v-if="dashboard.master?.avatar" :src="assetUrl(dashboard.master.avatar)" cover />
                  <span v-else>{{ masterInitial }}</span>
                </v-avatar>
                <div>
                  <span class="master-label">CLAN MASTER</span>
                  <strong>{{ dashboard.master?.account_name || '마스터 미정' }}</strong>
                  <small v-if="dashboard.master?.player_nickname">
                    {{ dashboard.master.player_nickname }}#{{ dashboard.master.tagname }}
                  </small>
                </div>
              </div>
            </v-col>
            <v-col v-for="card in summaryCards" :key="card.label" cols="6" md="2">
              <div class="summary-card">
                <v-icon :color="card.color">{{ card.icon }}</v-icon>
                <strong>{{ card.value }}</strong>
                <span>{{ card.label }}</span>
              </div>
            </v-col>
          </v-row>

          <v-row class="mt-2">
            <v-col cols="12">
              <section class="dashboard-section tier-panel">
                <div class="section-title"><div><span class="panel-kicker">TIER BALANCE</span><h3>클랜 티어 분포</h3></div></div>
                <div class="tier-list">
                  <div v-for="tier in tierDistribution" :key="tier.name" class="tier-row">
                    <div><strong>{{ tier.name }}</strong><span>{{ tier.count }}명</span></div>
                    <v-progress-linear :model-value="tier.percent" :color="tier.color" height="7" rounded />
                  </div>
                </div>
                <div v-if="!dashboard.tier_distribution.length" class="empty-copy">표시할 티어 정보가 없습니다.</div>
              </section>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-dialog v-model="createDialog" max-width="560">
      <v-card rounded="xl">
        <v-card-title class="d-flex align-center px-6 pt-6">
          <v-avatar color="deep-purple-accent-2" variant="tonal" class="mr-3">
            <v-icon>mdi-account-group</v-icon>
          </v-avatar>
          <div>
            <div class="text-h6 font-weight-bold">새 클랜 만들기</div>
            <div class="text-caption text-medium-emphasis">클랜 이름과 소개는 설정에서 다시 수정할 수 있습니다.</div>
          </div>
        </v-card-title>
        <v-card-text class="px-6 pt-5">
          <v-alert v-if="!account.isPlayerLinked" type="warning" variant="tonal" class="mb-4">
            클랜을 만들려면 먼저 리그 오브 레전드 계정을 연동해야 합니다.
          </v-alert>
          <v-text-field
            v-model="createForm.name"
            label="클랜 이름"
            maxlength="100"
            counter
            variant="outlined"
            :disabled="!account.isPlayerLinked || creating"
            :error-messages="createNameError"
            @keyup.enter="createClan"
          />
          <v-textarea
            v-model="createForm.description"
            label="클랜 소개"
            maxlength="300"
            counter
            rows="4"
            variant="outlined"
            :disabled="!account.isPlayerLinked || creating"
          />
        </v-card-text>
        <v-card-actions class="px-6 pb-6 justify-end">
          <v-btn variant="text" :disabled="creating" @click="createDialog = false">취소</v-btn>
          <v-btn
            v-if="account.isPlayerLinked"
            color="deep-purple-accent-2"
            :loading="creating"
            prepend-icon="mdi-plus"
            @click="createClan"
          >
            생성하기
          </v-btn>
          <v-btn v-else color="primary" @click="goPlayerLink">롤 계정 연동</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :timeout="2400">{{ snackbar.message }}</v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useRouter } from 'vue-router';
import { useAccountStore } from '@/stores/useAccountStore';
import { CONFIG_ACCOUNT_PATH } from '@/router/config/type';
import { CLAN_PATH } from '@/router/clan/type';
import api from '@/@core/composable/useAxios';
import { getBaseUrl } from '@/@core/composable/createUrl';

type ClanPreview = {
  id: number; name: string; description: string; banner_url: string | null;
  member_count: number; completed_match_count: number; completed_auction_count: number;
};
type Distribution = { name: string; count: number };
type PublicDashboard = {
  clan: { id: number; name: string; description: string; banner_url: string | null; created_at: string };
  summary: { member_count: number; active_player_count: number; completed_match_count: number; completed_cup_count: number; completed_auction_count: number };
  master: { id: number; account_name: string; avatar: string | null; player_nickname: string | null; tagname: string | null; tier_name: string | null } | null;
  tier_distribution: Distribution[];
};

const keyword = ref('');
const route = useRoute();
const router = useRouter();
const account = useAccountStore();
const createDialog = ref(false);
const joinDialog = ref(false);
const joiningClan = ref(false);
const inviteInput = ref('');
const joinError = ref('');
const creating = ref(false);
const createNameError = ref('');
const createForm = ref({ name: '', description: '' });
const snackbar = ref({ show: false, message: '' });
const page = ref(1);
const pageSize = 9;
const total = ref(0);
const clans = ref<ClanPreview[]>([]);
const loadingList = ref(false);
const dashboardDialog = ref(false);
const dashboardLoading = ref(false);
const dashboard = ref<PublicDashboard | null>(null);
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize)));
const summaryCards = computed(() => {
  const value = dashboard.value?.summary;
  if (!value) return [];
  return [
    { label: '클랜 멤버', value: `${value.member_count}명`, icon: 'mdi-account-group', color: 'blue-lighten-1' },
    { label: '활성 플레이어', value: `${value.active_player_count}명`, icon: 'mdi-account-check', color: 'green-lighten-1' },
    { label: '완료된 내전', value: `${value.completed_match_count}회`, icon: 'mdi-sword-cross', color: 'red-lighten-1' },
    { label: '컵 · 경매내전', value: `${value.completed_cup_count + value.completed_auction_count}회`, icon: 'mdi-trophy', color: 'amber' },
  ];
});
const tierColors: Record<string, string> = {
  CHALLENGER: '#38bdf8', GRANDMASTER: '#f43f5e', MASTER: '#c084fc', DIAMOND: '#60a5fa',
  EMERALD: '#34d399', PLATINUM: '#2dd4bf', GOLD: '#fbbf24', SILVER: '#94a3b8',
  BRONZE: '#b45309', IRON: '#78716c', UNRANK: '#64748b', '티어 미정': '#64748b',
};
const tierDistribution = computed(() => {
  const items = dashboard.value?.tier_distribution ?? [];
  const totalCount = items.reduce((sum, item) => sum + Number(item.count), 0) || 1;
  return items.map((item) => {
    const group = item.name.split(' ')[0].toUpperCase();
    return { ...item, percent: (Number(item.count) / totalCount) * 100, color: tierColors[group] || '#64748b' };
  });
});
const masterInitial = computed(() => dashboard.value?.master?.account_name?.slice(0, 1) || 'M');

function assetUrl(value: string | null) {
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  return `${getBaseUrl('DATA').replace(/\/$/, '')}/${value.replace(/^\//, '')}`;
}
function bannerStyle(value: string | null) {
  const url = assetUrl(value);
  return url ? { backgroundImage: `url("${url}")` } : {};
}
async function loadClans(nextPage = page.value) {
  page.value = nextPage;
  loadingList.value = true;
  try {
    const response = await api.get(`${getBaseUrl('DATA')}/Clan/public_explore`, {
      params: { keyword: keyword.value.trim(), page: page.value, size: pageSize },
    });
    clans.value = response.data?.datas?.items ?? [];
    total.value = Number(response.data?.datas?.total ?? 0);
  } finally {
    loadingList.value = false;
  }
}
async function openDashboard(clanId: number) {
  dashboardDialog.value = true;
  dashboardLoading.value = true;
  dashboard.value = null;
  try {
    const response = await api.get(`${getBaseUrl('DATA')}/Clan/public_dashboard`, { params: { clan_id: clanId } });
    dashboard.value = response.data?.datas ?? null;
  } finally {
    dashboardLoading.value = false;
  }
}
function openCreateDialog() {
  createNameError.value = '';
  createDialog.value = true;
}
function openJoinDialog() {
  inviteInput.value = '';
  joinError.value = '';
  joinDialog.value = true;
}
function goLogin() {
  joinDialog.value = false;
  router.push('/login');
}
function goPlayerLink() {
  joinDialog.value = false;
  createDialog.value = false;
  router.push(CONFIG_ACCOUNT_PATH.VIEW(account.id));
}
function inviteCode(value: string) {
  const normalized = value.trim().replace(/\/+$/, '');
  const marker = '/clan/invite/';
  const markerIndex = normalized.toLowerCase().lastIndexOf(marker);
  return decodeURIComponent(markerIndex >= 0 ? normalized.slice(markerIndex + marker.length) : normalized);
}
async function joinClan() {
  if (joiningClan.value || !account.isLoggedIn || !account.isPlayerLinked) return;
  const code = inviteCode(inviteInput.value);
  if (!code) {
    joinError.value = '초대코드 또는 초대 링크를 입력해 주세요.';
    return;
  }
  joiningClan.value = true;
  joinError.value = '';
  try {
    const response = await api.post(`${getBaseUrl('DATA')}/clan-invite/join`, { code });
    const joined = response.data?.datas;
    if (!joined?.clan?.name) throw new Error('가입한 클랜 정보를 받지 못했습니다.');
    joinDialog.value = false;
    window.location.href = CLAN_PATH.VIEW(joined.clan.name);
  } catch (error: any) {
    joinError.value = error?.response?.data?.message ?? '클랜에 가입하지 못했습니다.';
  } finally {
    joiningClan.value = false;
  }
}
async function createClan() {
  if (creating.value || !account.isPlayerLinked) return;
  const name = createForm.value.name.trim();
  if (!name) {
    createNameError.value = '클랜 이름을 입력해 주세요.';
    return;
  }
  createNameError.value = '';
  creating.value = true;
  try {
    const response = await api.post(`${getBaseUrl('DATA')}/clan/create`, {
      name,
      description: createForm.value.description.trim(),
      account_id: account.id,
    });
    const clan = response.data?.datas;
    if (!clan?.name) throw new Error('생성된 클랜 정보를 받지 못했습니다.');
    createDialog.value = false;
    snackbar.value = { show: true, message: '클랜을 만들었습니다.' };
    window.location.href = CLAN_PATH.VIEW(clan.name);
  } catch (error: any) {
    const message = error?.response?.data?.message;
    if (error?.response?.status === 409 || String(message).includes('duplicate')) {
      createNameError.value = '이미 사용 중인 클랜 이름입니다.';
    } else {
      snackbar.value = { show: true, message: message ?? '클랜을 만들지 못했습니다.' };
    }
  } finally {
    creating.value = false;
  }
}
onMounted(async () => {
  await loadClans();
  const clanId = Number(route.params.id);
  if (Number.isFinite(clanId) && clanId > 0) await openDashboard(clanId);
});
</script>

<style scoped>
.explore-page { max-width: 1440px; }
.explore-hero { display:flex; align-items:end; justify-content:space-between; gap:24px; padding:30px; border:1px solid rgba(139,92,246,.25); border-radius:24px; background:radial-gradient(circle at 85% 20%,rgba(124,58,237,.28),transparent 35%),linear-gradient(135deg,#171325,#211a35); }
.eyebrow { color:#a78bfa; font-size:11px; font-weight:800; letter-spacing:.16em; }
.explore-hero h1 { margin:5px 0; font-size:30px; }
.explore-hero p { margin:0; color:rgba(255,255,255,.62); }
.explore-search { max-width:390px; }
.hero-actions { display:flex; flex-wrap:wrap; gap:10px; }
.clan-preview { height:100%; overflow:hidden; border:1px solid rgba(255,255,255,.1); transition:.2s ease; cursor:pointer; }
.clan-preview:hover { transform:translateY(-4px); border-color:rgba(167,139,250,.7); box-shadow:0 16px 40px rgba(0,0,0,.25); }
.clan-preview__banner { height:135px; padding:14px; display:flex; justify-content:flex-end; background:linear-gradient(135deg,#312e81,#6d28d9); background-size:cover; background-position:center; }
.clan-preview h2 { font-size:19px; }
.clan-preview p { height:42px; margin-top:6px; color:rgba(255,255,255,.55); overflow:hidden; }
.clan-preview__stats { display:flex; gap:16px; margin-top:14px; font-size:13px; color:rgba(255,255,255,.72); }
.dashboard-dialog { position:relative; overflow:hidden; }
.dialog-close { position:absolute; z-index:5; top:14px; right:14px; }
.dashboard-banner { min-height:210px; background:linear-gradient(135deg,#312e81,#6d28d9); background-size:cover; background-position:center; }
.dashboard-banner__shade { min-height:210px; display:flex; flex-direction:column; justify-content:end; padding:34px; background:linear-gradient(0deg,rgba(12,10,20,.94),rgba(12,10,20,.1)); }
.dashboard-banner h2 { font-size:30px; margin:5px 0; }.dashboard-banner p { max-width:650px; margin:0; color:rgba(255,255,255,.7); }
.dashboard-body { padding:26px; }
.summary-card { display:flex; min-height:132px; flex-direction:column; justify-content:center; align-items:center; gap:5px; border:1px solid rgba(255,255,255,.1); border-radius:16px; background:rgba(255,255,255,.025); }
.summary-card strong { font-size:24px; }.summary-card span { color:rgba(255,255,255,.55); font-size:13px; }
.summary-card--master { align-items:center; justify-content:flex-start; padding:20px; color:inherit; background:linear-gradient(135deg,rgba(245,158,11,.1),rgba(124,58,237,.08)); flex-direction:row; gap:15px; }.summary-card--master>div { display:flex; min-width:0; flex-direction:column; align-items:flex-start; }.summary-card--master strong { overflow:hidden; max-width:210px; font-size:18px; text-overflow:ellipsis; white-space:nowrap; }.summary-card--master small { overflow:hidden; max-width:210px; color:rgba(255,255,255,.5); font-size:11px; text-overflow:ellipsis; white-space:nowrap; }
.dashboard-section { height:100%; padding:20px; border:1px solid rgba(255,255,255,.09); border-radius:18px; background:rgba(255,255,255,.02); }
.section-title { display:flex; align-items:center; gap:9px; margin-bottom:16px; }.section-title h3 { font-size:16px; }
.master-label,.panel-kicker { color:#a78bfa!important; font-size:10px!important; font-weight:900; letter-spacing:.15em; }
.tier-list { display:grid; gap:15px; }.tier-row>div { display:flex; justify-content:space-between; margin-bottom:6px; }.tier-row strong { font-size:11px; }.tier-row span { color:rgba(226,232,240,.5); font-size:10px; }
.empty-copy { padding:20px; text-align:center; color:rgba(255,255,255,.45); }
@media(max-width:700px){.explore-hero{align-items:stretch;flex-direction:column;padding:22px}.explore-search{max-width:none}.dashboard-banner__shade{padding:24px}.dashboard-body{padding:16px}}
</style>
