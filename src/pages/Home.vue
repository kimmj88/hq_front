<template>
  <main class="report-home">
    <v-container class="report-container py-8 py-md-12">
      <section class="hero-section">
        <div class="hero-copy">
          <div class="hero-kicker"><v-icon size="17">mdi-shield-search</v-icon> PLAYER CHECK</div>
          <h1>같이 게임하기 전,<br /><span>먼저 검색하세요.</span></h1>
          <p>욕설·탈주·고의 트롤 등 운영자 검토를 거친 공개 제보 기록을 확인할 수 있습니다.</p>
        </div>

        <v-card class="search-card" rounded="xl" elevation="0">
          <div class="search-label">Riot ID 검색</div>
          <div class="search-fields">
            <v-text-field
              v-model="searchForm.nickname"
              label="게임 닉네임"
              placeholder="플레이어 이름"
              variant="outlined"
              hide-details
              @keyup.enter="searchReports"
            />
            <v-text-field
              v-model="searchForm.tagname"
              label="태그"
              placeholder="KR1"
              prefix="#"
              variant="outlined"
              hide-details
              @keyup.enter="searchReports"
            />
            <v-btn color="deep-purple-accent-2" size="large" height="56" :loading="searching" @click="searchReports">
              <v-icon start>mdi-magnify</v-icon>검색
            </v-btn>
          </div>
          <div class="search-foot">
            <span><v-icon size="15">mdi-information-outline</v-icon> 제보 내용은 사실로 확정된 정보가 아닙니다.</span>
            <v-btn class="report-cta" variant="flat" color="error" size="large" prepend-icon="mdi-alert-plus-outline" @click="openReportDialog()">
              비매너 사용자 제보하기
            </v-btn>
          </div>
        </v-card>
      </section>

      <v-alert v-if="pageError" type="error" variant="tonal" closable class="mb-5" @click:close="pageError = ''">
        {{ pageError }}
      </v-alert>

      <section v-if="searchResult" class="result-section mb-8">
        <div class="result-head">
          <div>
            <span class="section-kicker">SEARCH RESULT</span>
            <h2>{{ searchResult.player.nickname }}<small>#{{ searchResult.player.tagname }}</small></h2>
            <div v-if="canReadReports" class="tracking-status">
              <v-icon size="15">mdi-fingerprint</v-icon>
              <button type="button" @click="openIdentityHistory">PUUID로 아이디 변경 확인</button>
            </div>
          </div>
          <div class="report-total" :class="{ clean: searchResult.totalCount === 0 }">
            <span>공개 제보</span><strong>{{ searchResult.totalCount }}</strong><em>건</em>
          </div>
        </div>

        <div v-if="searchResult.totalCount" class="category-grid">
          <div v-for="category in categories" :key="category.value" class="category-card">
            <v-icon :color="category.color">{{ category.icon }}</v-icon>
            <span>{{ category.title }}</span>
            <strong>{{ searchResult.counts[category.value] || 0 }}건</strong>
          </div>
        </div>

        <div v-if="searchResult.reports.length" class="report-list">
          <article v-for="report in searchResult.reports" :key="report.id" class="report-row">
            <v-avatar size="44" :color="categoryMeta(report.category).color" variant="tonal">
              <v-icon>{{ categoryMeta(report.category).icon }}</v-icon>
            </v-avatar>
            <div class="report-content">
              <div class="report-row-head">
                <strong>{{ categoryMeta(report.category).title }}</strong>
                <time>{{ formatDate(report.createdAt) }}</time>
              </div>
              <p>{{ report.description }}</p>
              <button v-if="report.evidenceUrl" type="button" class="evidence-thumb" @click="openEvidence(report.evidenceUrl)">
                <v-img :src="evidenceUrl(report.evidenceUrl)" width="180" height="104" cover />
                <span><v-icon size="15">mdi-magnify-plus-outline</v-icon> 증거 이미지 크게 보기</span>
              </button>
            </div>
            <div class="report-actions">
              <v-btn class="appeal-button" size="default" variant="tonal" color="warning" prepend-icon="mdi-message-alert-outline" @click="openAppealDialog(report)">이의 신청</v-btn>
              <v-btn v-if="canDeleteReports" size="small" variant="text" color="error" icon="mdi-delete-outline" @click="removeReportAsManager(report)" />
            </div>
          </article>
        </div>

        <div v-else class="clean-result">
          <v-icon size="54" color="success">mdi-shield-check-outline</v-icon>
          <strong>공개된 제보 기록이 없습니다.</strong>
          <span>기록이 없다는 것이 해당 사용자의 행동을 보증하지는 않습니다.</span>
        </div>
      </section>

      <section class="recent-section">
        <div class="section-title-row">
          <div><span class="section-kicker">RECENT REPORTS</span><h2>최근 공개 제보</h2></div>
          <div class="d-flex ga-2">
            <v-btn v-if="account.isLoggedIn" variant="tonal" color="deep-purple-lighten-1" prepend-icon="mdi-file-account-outline" @click="openMyReports">
              내 제보 관리
            </v-btn>
            <v-btn v-if="canReadReports" variant="tonal" color="warning" prepend-icon="mdi-clipboard-check-outline" @click="openModeration">
              검토 대기 {{ pendingReviewCount ? `(${pendingReviewCount})` : '' }}
            </v-btn>
          </div>
        </div>

        <v-table v-if="recentReports.length" class="recent-table" density="comfortable">
          <thead>
            <tr><th>Riot ID</th><th>제보 유형</th><th>내용</th><th>등록일</th><th></th></tr>
          </thead>
          <tbody>
            <tr v-for="report in recentReports" :key="report.id" @click="searchTarget(report)">
              <td><strong>{{ report.targetNickname }}</strong><small>#{{ report.targetTagname }}</small></td>
              <td><v-chip size="small" :color="categoryMeta(report.category).color" variant="tonal">{{ categoryMeta(report.category).title }}</v-chip></td>
              <td><span class="recent-description">{{ report.description }}</span></td>
              <td><time>{{ formatDate(report.createdAt) }}</time></td>
              <td><v-icon size="17" color="deep-purple-lighten-2">mdi-chevron-right</v-icon></td>
            </tr>
          </tbody>
        </v-table>
        <div v-else class="empty-recent"><v-icon size="42">mdi-shield-check-outline</v-icon><span>아직 공개된 제보가 없습니다.</span></div>
      </section>
    </v-container>

    <v-dialog v-model="reportDialog" max-width="620" persistent>
      <v-card rounded="xl" class="dialog-card">
        <v-card-title class="dialog-head"><div><span>NEW REPORT</span><h2>비매너 사용자 제보</h2></div><v-btn icon="mdi-close" variant="text" @click="reportDialog = false" /></v-card-title>
        <v-card-text class="px-6">
          <v-alert type="warning" variant="tonal" density="compact" class="mb-5">
            제보는 운영자 검토 후 공개됩니다. 실명, 연락처, SNS 등 개인정보를 작성하지 마세요.
          </v-alert>
          <v-row dense>
            <v-col cols="8"><v-text-field v-model="reportForm.nickname" label="게임 닉네임" variant="outlined" /></v-col>
            <v-col cols="4"><v-text-field v-model="reportForm.tagname" label="태그" prefix="#" variant="outlined" /></v-col>
          </v-row>
          <v-select v-model="reportForm.category" :items="categories" item-title="title" item-value="value" label="제보 유형" variant="outlined" />
          <v-textarea v-model="reportForm.description" label="상황 설명" placeholder="언제, 어떤 일이 있었는지 사실 중심으로 작성해 주세요. (10~500자)" maxlength="500" counter variant="outlined" rows="4" />
          <v-file-input v-model="reportForm.evidenceFile" label="인게임 채팅 증거 이미지 (선택)" accept="image/jpeg,image/png,image/webp" prepend-icon="mdi-camera-outline" variant="outlined" hint="JPG, PNG, WebP · 최대 8MB" persistent-hint />
          <v-img v-if="evidencePreview" :src="evidencePreview" class="upload-preview mt-3" height="220" cover />
          <v-checkbox v-model="reportForm.acceptedTerms" color="primary" hide-details>
            <template #label><span class="terms-label">허위 제보와 개인정보 노출에 대한 책임이 작성자에게 있으며, 운영 정책에 따라 숨김·삭제될 수 있음에 동의합니다.</span></template>
          </v-checkbox>
          <v-alert v-if="dialogError" type="error" variant="tonal" density="compact" class="mt-3">{{ dialogError }}</v-alert>
        </v-card-text>
        <v-card-actions class="px-6 pb-6"><v-spacer /><v-btn variant="text" :disabled="submitting" @click="reportDialog = false">취소</v-btn><v-btn color="deep-purple-accent-2" :loading="submitting" @click="submitReport">검토 요청</v-btn></v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="appealDialog" max-width="520">
      <v-card rounded="xl" class="dialog-card">
        <v-card-title class="dialog-head"><div><span>APPEAL</span><h2>공개 제보 이의 신청</h2></div><v-btn icon="mdi-close" variant="text" @click="appealDialog = false" /></v-card-title>
        <v-card-text class="px-6"><v-textarea v-model="appealMessage" label="이의 신청 내용" maxlength="500" counter rows="5" variant="outlined" /><v-alert v-if="dialogError" type="error" variant="tonal" density="compact">{{ dialogError }}</v-alert></v-card-text>
        <v-card-actions class="px-6 pb-6"><v-spacer /><v-btn variant="text" @click="appealDialog = false">취소</v-btn><v-btn color="primary" :loading="submitting" @click="submitAppeal">신청하기</v-btn></v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="moderationDialog" max-width="760" scrollable>
      <v-card rounded="xl" class="dialog-card">
        <v-card-title class="dialog-head"><div><span>MODERATION</span><h2>사용자 제보 관리</h2></div><v-btn icon="mdi-close" variant="text" @click="moderationDialog = false" /></v-card-title>
        <v-card-text class="px-6">
          <v-tabs v-model="moderationTab" color="deep-purple-accent-2" class="mb-3">
            <v-tab value="reports">제보 검토 <v-chip class="ml-2" size="x-small">{{ pendingReports.length }}</v-chip></v-tab>
            <v-tab value="appeals">이의 신청 <v-chip class="ml-2" size="x-small" color="warning">{{ pendingAppeals.length }}</v-chip></v-tab>
          </v-tabs>
          <div v-if="moderationTab === 'reports'">
            <div v-for="report in pendingReports" :key="report.id" class="moderation-row">
              <div><strong>{{ report.targetNickname }}#{{ report.targetTagname }}</strong><span>{{ categoryMeta(report.category).title }} · {{ formatDate(report.createdAt) }}</span><p>{{ report.description }}</p><button v-if="report.evidenceUrl" type="button" class="moderation-evidence" @click="openEvidence(report.evidenceUrl)"><v-icon size="15">mdi-image-search-outline</v-icon> 증거 이미지 확인</button></div>
              <div v-if="canUpdateReports || canDeleteReports"><v-btn v-if="canUpdateReports" size="small" color="success" variant="tonal" @click="moderate(report.id, 'PUBLIC')">공개 승인</v-btn><v-btn v-if="canUpdateReports" size="small" color="warning" variant="text" @click="moderate(report.id, 'HIDDEN')">숨김</v-btn><v-btn v-if="canDeleteReports" size="small" color="error" variant="text" @click="removeReportAsManager(report)">삭제</v-btn></div>
            </div>
            <div v-if="!pendingReports.length" class="empty-recent">검토 대기 중인 제보가 없습니다.</div>
          </div>
          <div v-else>
            <div v-for="appeal in pendingAppeals" :key="appeal.id" class="moderation-row appeal-review-row">
              <div><strong>{{ appeal.report.targetNickname }}#{{ appeal.report.targetTagname }}</strong><span>신청자 {{ appeal.claimant.name }} · {{ formatDate(appeal.createdAt) }}</span><p class="appeal-message">{{ appeal.message }}</p><small>원 제보: {{ appeal.report.description }}</small></div>
              <div v-if="canUpdateReports"><v-btn size="small" color="success" variant="tonal" @click="resolveAppeal(appeal.id, 'APPROVED')">인용</v-btn><v-btn size="small" color="error" variant="text" @click="resolveAppeal(appeal.id, 'REJECTED')">기각</v-btn></div>
            </div>
            <div v-if="!pendingAppeals.length" class="empty-recent">검토 대기 중인 이의 신청이 없습니다.</div>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-dialog v-model="myReportsDialog" max-width="720" scrollable>
      <v-card rounded="xl" class="dialog-card">
        <v-card-title class="dialog-head"><div><span>MY REPORTS</span><h2>내가 작성한 제보</h2></div><v-btn icon="mdi-close" variant="text" @click="myReportsDialog = false" /></v-card-title>
        <v-card-text class="px-6 pb-6">
          <div v-for="report in myReports" :key="report.id" class="moderation-row my-report-row">
            <div><strong>{{ report.targetNickname }}#{{ report.targetTagname }}</strong><span>{{ categoryMeta(report.category).title }} · {{ formatDate(report.createdAt) }}</span><p>{{ report.description }}</p><v-chip :color="reportStatusMeta(report.status).color" variant="tonal" size="x-small">{{ reportStatusMeta(report.status).label }}</v-chip></div>
            <div><v-btn size="small" color="error" variant="tonal" prepend-icon="mdi-delete-outline" @click="removeMyReport(report)">삭제</v-btn></div>
          </div>
          <div v-if="!myReports.length && !myReportsLoading" class="empty-recent">작성한 제보가 없습니다.</div>
          <div v-if="myReportsLoading" class="empty-recent"><v-progress-circular indeterminate color="deep-purple-accent-2" /></div>
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-dialog v-model="evidenceDialog" max-width="980">
      <v-card rounded="xl" class="evidence-dialog">
        <v-card-title class="d-flex align-center justify-space-between">
          증거 이미지
          <v-btn icon="mdi-close" variant="text" @click="evidenceDialog = false" />
        </v-card-title>
        <v-img :src="selectedEvidence" max-height="78vh" contain />
      </v-card>
    </v-dialog>

    <v-dialog v-model="identityDialog" max-width="520">
      <v-card rounded="xl" class="dialog-card">
        <v-card-title class="dialog-head">
          <div><span>IDENTITY HISTORY</span><h2>Riot ID 변경 이력</h2></div>
          <v-btn icon="mdi-close" variant="text" @click="identityDialog = false" />
        </v-card-title>
        <v-card-text class="px-6 pb-6">
          <v-alert type="info" variant="tonal" density="compact" class="mb-4">운영자 검토용 정보입니다. 동일 PUUID에서 관측된 아이디만 표시합니다.</v-alert>
          <div v-if="identityHistory.length > 1">
            <div v-for="identity in identityHistory" :key="`${identity.nickname}#${identity.tagname}`" class="identity-history-row">
              <div><strong>{{ identity.nickname }}<small>#{{ identity.tagname }}</small></strong><span>{{ formatDate(identity.lastSeenAt) }} 마지막 확인</span></div>
              <v-chip :color="identity.isCurrent ? 'success' : 'grey'" size="small" variant="tonal">{{ identity.isCurrent ? '현재' : '이전' }}</v-chip>
            </div>
          </div>
          <div v-if="identityChecked && identityHistory.length <= 1 && !identityLoading" class="identity-empty-result">
            <v-icon color="success" size="36">mdi-account-check-outline</v-icon>
            <strong>확인된 아이디 변경 이력이 없습니다.</strong>
            <span>현재까지 동일 PUUID에서 다른 Riot ID가 관측되지 않았습니다.</span>
          </div>
          <div v-if="identityLoading" class="empty-recent"><v-progress-circular indeterminate color="deep-purple-accent-2" /></div>
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3200">{{ snackbar.message }}</v-snackbar>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import api from '@/@core/composable/useAxios';
import { getBaseUrl } from '@/@core/composable/createUrl';
import { useAccountStore } from '@/stores/useAccountStore';
import { can } from '@/stores/usePermissionStore';

type ReportItem = { id: number; targetNickname: string; targetTagname: string; category: string; description: string; evidenceUrl?: string; createdAt: string; status?: 'PENDING' | 'PUBLIC' | 'HIDDEN' | 'REMOVED' };
type SearchResult = { player: { nickname: string; tagname: string }; tracking?: { key: 'PUUID'; identityChanged: boolean }; totalCount: number; counts: Record<string, number>; reports: ReportItem[] };
type IdentityHistory = { nickname: string; tagname: string; firstSeenAt: string; lastSeenAt: string; isCurrent: boolean };
type AppealReview = { id: number; message: string; createdAt: string; claimant: { id: number; name: string }; report: ReportItem };
const categories = [
  { value: 'VERBAL_ABUSE', title: '욕설·혐오 발언', icon: 'mdi-message-alert-outline', color: 'red-lighten-1' },
  { value: 'INTENTIONAL_TROLL', title: '고의 트롤', icon: 'mdi-emoticon-devil-outline', color: 'deep-orange' },
  { value: 'AFK', title: '탈주·잠수', icon: 'mdi-account-off-outline', color: 'amber-darken-1' },
  { value: 'GAME_DISRUPTION', title: '게임 방해', icon: 'mdi-sword-cross', color: 'purple-lighten-1' },
  { value: 'BOOSTING_SUSPECTED', title: '사기·대리 의심', icon: 'mdi-account-alert-outline', color: 'blue-grey-lighten-1' },
  { value: 'OTHER', title: '기타', icon: 'mdi-alert-circle-outline', color: 'grey-lighten-1' },
];

const account = useAccountStore();
const canReadReports = computed(() => can('PLAYER_REPORT', 'SYS-SET-REPORT-R'));
const canUpdateReports = computed(() => can('PLAYER_REPORT', 'SYS-SET-REPORT-U'));
const canDeleteReports = computed(() => can('PLAYER_REPORT', 'SYS-SET-REPORT-D'));
const searchForm = ref({ nickname: '', tagname: '' });
const reportForm = ref<{ nickname: string; tagname: string; category: string; description: string; evidenceFile: File | File[] | null; acceptedTerms: boolean }>({ nickname: '', tagname: '', category: '', description: '', evidenceFile: null, acceptedTerms: false });
const searchResult = ref<SearchResult | null>(null);
const recentReports = ref<ReportItem[]>([]);
const pendingReports = ref<ReportItem[]>([]);
const pendingAppeals = ref<AppealReview[]>([]);
const moderationTab = ref<'reports' | 'appeals'>('reports');
const pendingReviewCount = computed(() => pendingReports.value.length + pendingAppeals.value.length);
const searching = ref(false);
const submitting = ref(false);
const reportDialog = ref(false);
const appealDialog = ref(false);
const moderationDialog = ref(false);
const myReportsDialog = ref(false);
const myReportsLoading = ref(false);
const myReports = ref<ReportItem[]>([]);
const evidenceDialog = ref(false);
const identityDialog = ref(false);
const identityLoading = ref(false);
const identityChecked = ref(false);
const identityHistory = ref<IdentityHistory[]>([]);
const selectedEvidence = ref('');
const appealTarget = ref<ReportItem | null>(null);
const appealMessage = ref('');
const pageError = ref('');
const dialogError = ref('');
const snackbar = ref({ show: false, message: '', color: 'success' });
const evidencePreview = computed(() => {
  const value = reportForm.value.evidenceFile;
  const file = Array.isArray(value) ? value[0] : value;
  return file instanceof File ? URL.createObjectURL(file) : '';
});

function categoryMeta(value: string) { return categories.find((item) => item.value === value) ?? categories[5]; }
function reportStatusMeta(status?: ReportItem['status']) { return ({ PENDING: { label: '검토 대기', color: 'warning' }, PUBLIC: { label: '공개', color: 'success' }, HIDDEN: { label: '숨김', color: 'grey' }, REMOVED: { label: '삭제', color: 'error' } } as const)[status || 'PENDING']; }
function formatDate(value: string) { return new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)); }
function responseError(response: any, fallback: string) { return response?.data?.message || fallback; }
function evidenceUrl(value: string) { return /^https?:\/\//i.test(value) ? value : `${getBaseUrl('DATA').replace(/\/$/, '')}${value.startsWith('/') ? '' : '/'}${value}`; }
function openEvidence(value: string) { selectedEvidence.value = evidenceUrl(value); evidenceDialog.value = true; }
async function openIdentityHistory() {
  if (!searchResult.value) return;
  identityDialog.value = true; identityLoading.value = true; identityChecked.value = false; identityHistory.value = [];
  try {
    const response = await api.get(`${getBaseUrl('DATA')}/player-report/identity-history`, { params: searchResult.value.player });
    identityHistory.value = response.data?.datas ?? [];
  } catch (error: any) {
    snackbar.value = { show: true, message: error?.response?.data?.message || '아이디 변경 이력을 불러오지 못했습니다.', color: 'error' };
    identityDialog.value = false;
  } finally { identityLoading.value = false; identityChecked.value = true; }
}

async function loadRecent() {
  try { const response = await api.get(`${getBaseUrl('DATA')}/player-report/recent`, { params: { limit: 8 } }); recentReports.value = response.data?.datas ?? []; }
  catch { recentReports.value = []; }
}

async function searchReports() {
  if (!searchForm.value.nickname.trim() || !searchForm.value.tagname.trim()) { pageError.value = '닉네임과 태그를 모두 입력해 주세요.'; return; }
  searching.value = true; pageError.value = '';
  try {
    const response = await api.get(`${getBaseUrl('DATA')}/player-report/search`, { params: { nickname: searchForm.value.nickname.trim(), tagname: searchForm.value.tagname.trim().replace(/^#/, '') } });
    searchResult.value = response.data?.datas ?? null;
  } catch (error: any) { pageError.value = error?.response?.data?.message || '제보 기록을 검색하지 못했습니다.'; }
  finally { searching.value = false; }
}

function searchTarget(report: ReportItem) { searchForm.value = { nickname: report.targetNickname, tagname: report.targetTagname }; void searchReports(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
function openReportDialog(report?: ReportItem) {
  if (!account.isLoggedIn) { snackbar.value = { show: true, message: '로그인 후 제보할 수 있습니다.', color: 'warning' }; return; }
  reportForm.value = { nickname: report?.targetNickname || searchForm.value.nickname, tagname: report?.targetTagname || searchForm.value.tagname, category: '', description: '', evidenceFile: null, acceptedTerms: false };
  dialogError.value = ''; reportDialog.value = true;
}

async function submitReport() {
  const form = reportForm.value;
  if (!form.nickname.trim() || !form.tagname.trim() || !form.category || form.description.trim().length < 10 || !form.acceptedTerms) { dialogError.value = '대상, 유형, 10자 이상의 설명과 책임 동의를 확인해 주세요.'; return; }
  submitting.value = true; dialogError.value = '';
  try {
    let uploadedEvidenceUrl: string | undefined;
    const fileValue = form.evidenceFile;
    const evidenceFile = Array.isArray(fileValue) ? fileValue[0] : fileValue;
    if (evidenceFile) {
      const uploadData = new FormData();
      uploadData.append('evidence', evidenceFile);
      const uploadResponse = await api.post(`${getBaseUrl('DATA')}/player-report/evidence`, uploadData);
      uploadedEvidenceUrl = uploadResponse.data?.datas?.evidenceUrl;
      if (!uploadedEvidenceUrl) throw new Error('증거 이미지를 업로드하지 못했습니다.');
    }
    const response = await api.post(`${getBaseUrl('DATA')}/player-report/create`, { nickname: form.nickname.trim(), tagname: form.tagname.trim().replace(/^#/, ''), category: form.category, description: form.description.trim(), evidence_url: uploadedEvidenceUrl, accepted_terms: form.acceptedTerms });
    if (response.status >= 400) throw new Error(responseError(response, '제보를 접수하지 못했습니다.'));
    reportDialog.value = false; snackbar.value = { show: true, message: '제보가 접수되었습니다. 운영자 검토 후 공개됩니다.', color: 'success' };
    if (canReadReports.value) await loadPending();
  } catch (error: any) { dialogError.value = error?.response?.data?.message || error?.message || '제보를 접수하지 못했습니다.'; }
  finally { submitting.value = false; }
}

function openAppealDialog(report: ReportItem) { if (!account.isLoggedIn) { snackbar.value = { show: true, message: '로그인 후 이의를 신청할 수 있습니다.', color: 'warning' }; return; } appealTarget.value = report; appealMessage.value = ''; dialogError.value = ''; appealDialog.value = true; }
async function submitAppeal() {
  if (!appealTarget.value || appealMessage.value.trim().length < 10) { dialogError.value = '이의 신청 내용을 10자 이상 입력해 주세요.'; return; }
  submitting.value = true;
  try { const response = await api.post(`${getBaseUrl('DATA')}/player-report/appeal`, { report_id: appealTarget.value.id, message: appealMessage.value.trim() }); if (response.status >= 400) throw new Error(responseError(response, '이의 신청에 실패했습니다.')); appealDialog.value = false; snackbar.value = { show: true, message: '이의 신청이 접수되었습니다.', color: 'success' }; }
  catch (error: any) { dialogError.value = error?.response?.data?.message || error?.message || '이의 신청에 실패했습니다.'; }
  finally { submitting.value = false; }
}

async function loadPending() { if (!canReadReports.value) return; try { const response = await api.get(`${getBaseUrl('DATA')}/player-report/pending`); pendingReports.value = response.data?.datas ?? []; } catch { pendingReports.value = []; } }
async function loadMyReports() { if (!account.isLoggedIn) return; myReportsLoading.value = true; try { const response = await api.get(`${getBaseUrl('DATA')}/player-report/mine`); myReports.value = response.data?.datas ?? []; } catch { myReports.value = []; } finally { myReportsLoading.value = false; } }
async function openMyReports() { myReportsDialog.value = true; await loadMyReports(); }
async function removeMyReport(report: ReportItem) { if (!window.confirm(`${report.targetNickname}#${report.targetTagname} 제보를 삭제할까요?`)) return; try { await api.post(`${getBaseUrl('DATA')}/player-report/mine/remove`, { id: report.id }); await Promise.all([loadMyReports(), loadRecent(), loadPending(), loadPendingAppeals()]); if (searchResult.value) await searchReports(); snackbar.value = { show: true, message: '제보를 삭제했습니다.', color: 'success' }; } catch (error: any) { snackbar.value = { show: true, message: error?.response?.data?.message || '제보를 삭제하지 못했습니다.', color: 'error' }; } }
async function removeReportAsManager(report: ReportItem) { if (!window.confirm(`${report.targetNickname}#${report.targetTagname} 제보를 관리 권한으로 삭제할까요?`)) return; try { await api.post(`${getBaseUrl('DATA')}/player-report/remove`, { id: report.id }); await Promise.all([loadRecent(), loadPending(), loadPendingAppeals()]); if (searchResult.value) await searchReports(); snackbar.value = { show: true, message: '제보를 삭제했습니다.', color: 'success' }; } catch (error: any) { snackbar.value = { show: true, message: error?.response?.data?.message || '제보를 삭제하지 못했습니다.', color: 'error' }; } }
async function loadPendingAppeals() { if (!canReadReports.value) return; try { const response = await api.get(`${getBaseUrl('DATA')}/player-report/appeals/pending`); pendingAppeals.value = response.data?.datas ?? []; } catch { pendingAppeals.value = []; } }
async function openModeration() { await Promise.all([loadPending(), loadPendingAppeals()]); moderationDialog.value = true; }
async function moderate(id: number, status: 'PUBLIC' | 'HIDDEN') { try { await api.post(`${getBaseUrl('DATA')}/player-report/moderate`, { id, status }); await Promise.all([loadPending(), loadRecent()]); snackbar.value = { show: true, message: status === 'PUBLIC' ? '제보를 공개했습니다.' : '제보를 숨겼습니다.', color: 'success' }; } catch (error: any) { snackbar.value = { show: true, message: error?.response?.data?.message || '처리하지 못했습니다.', color: 'error' }; } }
async function resolveAppeal(id: number, status: 'APPROVED' | 'REJECTED') { try { await api.post(`${getBaseUrl('DATA')}/player-report/appeals/resolve`, { id, status }); await Promise.all([loadPendingAppeals(), loadRecent()]); snackbar.value = { show: true, message: status === 'APPROVED' ? '이의 신청을 인용하고 제보를 숨겼습니다.' : '이의 신청을 기각했습니다.', color: 'success' }; } catch (error: any) { snackbar.value = { show: true, message: error?.response?.data?.message || '이의 신청을 처리하지 못했습니다.', color: 'error' }; } }

onMounted(async () => { await loadRecent(); if (canReadReports.value) await Promise.all([loadPending(), loadPendingAppeals()]); });
</script>

<style scoped>
.report-home { min-height: calc(100vh - 64px); color: #f8fafc; background: radial-gradient(circle at 15% 0, rgba(124,58,237,.18), transparent 28%), radial-gradient(circle at 90% 25%, rgba(239,68,68,.08), transparent 24%), #0b0e14; }
.report-container { max-width: 1180px; }
.hero-section { display: grid; grid-template-columns: .9fr 1.25fr; align-items: center; gap: 52px; min-height: 430px; }
.hero-kicker,.section-kicker { display: flex; align-items: center; gap: 7px; color: #a78bfa; font-size: 11px; font-weight: 900; letter-spacing: .14em; }
.hero-copy h1 { margin: 15px 0; font-size: clamp(38px,5vw,64px); line-height: 1.08; letter-spacing: -.055em; }.hero-copy h1 span { color: #a78bfa; }.hero-copy p { max-width: 460px; color: rgba(226,232,240,.62); font-size: 15px; line-height: 1.75; }
.search-card { padding: 28px; border: 1px solid rgba(139,92,246,.3); background: rgba(21,25,34,.9); box-shadow: 0 24px 70px rgba(0,0,0,.34); }.search-label { margin-bottom: 14px; font-size: 13px; font-weight: 800; }.search-fields { display: grid; grid-template-columns: 1.5fr .8fr auto; gap: 10px; }.search-foot { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 18px; color: rgba(226,232,240,.45); font-size: 11px; }.search-foot span { display: flex; align-items: center; gap: 5px; }.report-cta { min-height: 46px; padding-inline: 20px !important; font-weight: 800; box-shadow: 0 8px 24px rgba(239,68,68,.28); }
.result-section,.recent-section { padding: 28px; border: 1px solid rgba(148,163,184,.13); border-radius: 24px; background: #121620; }.result-head,.section-title-row { display: flex; align-items: center; justify-content: space-between; gap: 20px; margin-bottom: 22px; }.result-head h2,.section-title-row h2 { margin: 4px 0 0; font-size: 24px; }.result-head h2 small { margin-left: 3px; color: rgba(226,232,240,.46); font-size: 14px; }.report-total { display: flex; align-items: baseline; gap: 4px; color: #fb7185; }.report-total span { margin-right: 5px; color: rgba(226,232,240,.45); font-size: 11px; }.report-total strong { font-size: 32px; }.report-total em { font-size: 12px; font-style: normal; }.report-total.clean { color: #34d399; }
.tracking-status { display: inline-flex; align-items: center; gap: 5px; margin-top: 9px; padding: 5px 9px; border: 1px solid rgba(52,211,153,.2); border-radius: 999px; color: #6ee7b7; background: rgba(16,185,129,.08); font-size: 11px; font-weight: 700; }.tracking-status.changed { border-color: rgba(251,191,36,.25); color: #fbbf24; background: rgba(245,158,11,.08); }
.tracking-status button { color: inherit; font-weight: 900; text-decoration: underline; cursor: pointer; }.identity-history-row { display: flex; min-height: 66px; align-items: center; justify-content: space-between; gap: 14px; border-bottom: 1px solid rgba(148,163,184,.1); }.identity-history-row > div { display: flex; gap: 4px; flex-direction: column; }.identity-history-row strong { font-size: 15px; }.identity-history-row strong small { margin-left: 3px; color: rgba(226,232,240,.5); font-size: 12px; }.identity-history-row span { color: rgba(226,232,240,.42); font-size: 10px; }.identity-empty-result { display: flex; min-height: 150px; align-items: center; justify-content: center; gap: 7px; color: rgba(226,232,240,.5); text-align: center; flex-direction: column; }.identity-empty-result strong { color: #a7f3d0; font-size: 15px; }.identity-empty-result span { font-size: 11px; }
.category-grid { display: grid; grid-template-columns: repeat(6,minmax(0,1fr)); gap: 8px; margin-bottom: 24px; }.category-card { display: flex; min-height: 100px; align-items: center; justify-content: center; gap: 3px; border-radius: 14px; background: rgba(255,255,255,.035); flex-direction: column; }.category-card span { color: rgba(226,232,240,.5); font-size: 10px; }.category-card strong { font-size: 17px; }
.report-list { border-top: 1px solid rgba(148,163,184,.12); }.report-row { display: grid; grid-template-columns: auto 1fr auto; align-items: start; gap: 14px; padding: 18px 4px; border-bottom: 1px solid rgba(148,163,184,.09); }.report-row-head { display: flex; justify-content: space-between; gap: 12px; }.report-row-head time { color: rgba(226,232,240,.38); font-size: 10px; }.report-content p { display: -webkit-box; overflow: hidden; margin: 5px 0; color: rgba(226,232,240,.64); font-size: 13px; line-height: 1.55; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }.report-actions { display: flex; align-items: center; gap: 3px; }.appeal-button { margin-top: 3px; font-weight: 800; box-shadow: 0 5px 16px rgba(245,158,11,.13); }.evidence-thumb { display: block; overflow: hidden; width: 180px; margin-top: 10px; padding: 0; border: 1px solid rgba(139,92,246,.26); border-radius: 11px; color: #c4b5fd; background: rgba(139,92,246,.08); text-align: left; cursor: pointer; }.evidence-thumb span { display: flex; align-items: center; gap: 4px; padding: 7px 9px; font-size: 10px; }.upload-preview { overflow: hidden; border: 1px solid rgba(139,92,246,.25); border-radius: 14px; }.evidence-dialog { overflow: hidden; background: #10131b; }.moderation-evidence { display: inline-flex; align-items: center; gap: 4px; color: #a78bfa; font-size: 11px; }.clean-result,.empty-recent { display: flex; min-height: 190px; align-items: center; justify-content: center; gap: 8px; color: rgba(226,232,240,.48); flex-direction: column; }.clean-result strong { color: #d1fae5; font-size: 17px; }.clean-result span { font-size: 11px; }
.recent-table { overflow: hidden; border: 1px solid rgba(148,163,184,.1); border-radius: 14px; background: rgba(255,255,255,.015); }.recent-table th { height: 48px !important; color: rgba(226,232,240,.5) !important; font-size: 12px !important; font-weight: 700 !important; }.recent-table tbody tr { height: 62px; cursor: pointer; transition: background .15s ease; }.recent-table tbody tr:hover { background: rgba(139,92,246,.08); }.recent-table td { font-size: 14px; }.recent-table td:first-child { white-space: nowrap; }.recent-table td:first-child strong { font-size: 15px; }.recent-table td:first-child small { margin-left: 3px; color: rgba(226,232,240,.48); font-size: 12px; }.recent-table time { color: rgba(226,232,240,.5); font-size: 12px; white-space: nowrap; }.recent-description { display: block; overflow: hidden; max-width: 330px; color: rgba(226,232,240,.66); font-size: 13px; text-overflow: ellipsis; white-space: nowrap; }
.dialog-card { border: 1px solid rgba(139,92,246,.24); background: #151922; }.dialog-head { display: flex; align-items: center; justify-content: space-between; padding: 22px 24px 16px; }.dialog-head span { color: #a78bfa; font-size: 10px; font-weight: 900; letter-spacing: .13em; }.dialog-head h2 { margin-top: 3px; font-size: 21px; }.terms-label { color: rgba(226,232,240,.62); font-size: 12px; line-height: 1.5; }.moderation-row { display: grid; grid-template-columns: 1fr auto; gap: 16px; padding: 17px 0; border-bottom: 1px solid rgba(148,163,184,.1); }.moderation-row > div:first-child { display: flex; gap: 4px; flex-direction: column; }.moderation-row span { color: rgba(226,232,240,.45); font-size: 11px; }.moderation-row p { margin: 5px 0; color: rgba(226,232,240,.7); font-size: 13px; }.moderation-row > div:last-child { display: flex; align-items: center; gap: 5px; }
.appeal-review-row .appeal-message { padding: 10px 12px; border-left: 3px solid #f59e0b; border-radius: 0 8px 8px 0; background: rgba(245,158,11,.08); }.appeal-review-row small { color: rgba(226,232,240,.42); font-size: 11px; }
@media (max-width: 800px) { .hero-section { grid-template-columns: 1fr; gap: 24px; padding-block: 30px 44px; }.search-fields { grid-template-columns: 1fr .7fr; }.search-fields .v-btn { grid-column: 1/-1; }.category-grid { grid-template-columns: repeat(3,minmax(0,1fr)); }.recent-table th:nth-child(3),.recent-table td:nth-child(3) { display: none; } }
@media (max-width: 520px) { .report-container { padding-inline: 14px; }.search-card,.result-section,.recent-section { padding: 19px; }.hero-copy h1 { font-size: 39px; }.search-foot { align-items: flex-start; flex-direction: column; }.report-row { grid-template-columns: auto 1fr; }.report-row > .v-btn { grid-column: 2; justify-self: end; }.moderation-row { grid-template-columns: 1fr; } }
</style>
