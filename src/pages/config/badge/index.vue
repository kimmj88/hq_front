<template>
  <v-container class="py-8">
    <div class="d-flex align-center flex-wrap ga-3 mb-6">
      <div><h1 class="text-h5 font-weight-bold">시즌 · 휘장 관리</h1><p class="text-body-2 text-medium-emphasis mt-2">시즌과 휘장을 등록하고 계정의 수상 기록에서 지급하세요.</p></div>
      <v-spacer />
      <v-btn v-if="editable" variant="tonal" prepend-icon="mdi-calendar-plus" @click="editSeason()">시즌 등록</v-btn>
      <v-btn v-if="editable" color="primary" prepend-icon="mdi-shield-plus-outline" @click="editBadge()">휘장 등록</v-btn>
    </div>
    <v-alert v-if="error" type="error" closable class="mb-4" @click:close="error = ''">{{ error }}</v-alert>
    <v-progress-linear v-if="loading" indeterminate class="mb-4" />
    <v-tabs v-model="tab" class="mb-5"><v-tab value="badges">휘장 마스터</v-tab><v-tab value="seasons">시즌</v-tab></v-tabs>
    <template v-if="tab === 'badges'">
      <v-alert v-if="!loading && !catalog.badges.length" type="info" variant="tonal">등록된 휘장이 없습니다. 테두리 이미지를 지정해 첫 휘장을 등록하세요.</v-alert>
      <v-row>
        <v-col v-for="badge in catalog.badges" :key="badge.id" cols="12" md="6" xl="4">
          <v-card rounded="lg" variant="outlined" class="pa-4 h-100">
            <BadgePreview :badge="badge" />
            <div class="d-flex align-center ga-2 mt-4"><v-chip size="small" :color="badge.is_active ? 'success' : 'grey'">{{ badge.is_active ? '지급 가능' : '지급 중지' }}</v-chip><v-spacer /><v-btn v-if="editable" size="small" variant="text" @click="editBadge(badge)">수정</v-btn></div>
            <p class="text-body-2 mt-3">{{ badge.description }}</p>
          </v-card>
        </v-col>
      </v-row>
    </template>
    <v-table v-else>
      <thead><tr><th>시즌</th><th>기간</th><th>상태</th><th /></tr></thead>
      <tbody>
        <tr v-for="season in catalog.seasons" :key="season.id"><td><strong>{{ season.name }}</strong><div class="text-caption">{{ season.code }}</div></td><td>{{ date(season.starts_at) }} ~ {{ date(season.ends_at) }}</td><td>{{ statusName(season.status) }}</td><td><v-btn v-if="editable" variant="text" size="small" @click="editSeason(season)">수정</v-btn></td></tr>
        <tr v-if="!catalog.seasons.length"><td colspan="4" class="text-center py-6">등록된 시즌이 없습니다.</td></tr>
      </tbody>
    </v-table>

    <v-dialog v-model="badgeDialog" max-width="780" :persistent="saving">
      <v-card title="휘장 마스터 설정">
        <v-card-text>
          <v-alert v-if="formError" type="error" class="mb-4">{{ formError }}</v-alert>
          <v-row>
            <v-col cols="12" md="6"><v-text-field v-model="badgeForm.name" label="휘장 이름" maxlength="100" /><v-textarea v-model="badgeForm.description" label="설명 · 획득 조건" rows="3" maxlength="1000" /><v-switch v-model="badgeForm.is_active" label="신규 지급 가능" color="primary" hide-details /></v-col>
            <v-col cols="12" md="6"><BadgePreview :badge="badgeForm" /><p class="text-caption text-medium-emphasis mt-3">이미 지급된 휘장도 테두리 이미지를 교체할 수 있습니다. 변경하면 해당 휘장을 장착한 모든 화면에 새 디자인이 표시됩니다.</p></v-col>
          </v-row>
          <v-file-input
            :key="uploadKey"
            label="테두리 이미지"
            accept="image/png,image/webp,image/jpeg,image/svg+xml,.svg"
            :disabled="saving"
            show-size
            class="mt-4"
            :loading="preparingFrame"
            hint="PNG·WebP·JPG·SVG, 최대 5MB · SVG는 투명 PNG로 변환됩니다."
            persistent-hint
            @update:model-value="selectFrame"
          />
          <p v-if="badgeForm.frame_image_name && !frameFile" class="text-caption text-medium-emphasis mt-2">등록된 파일: {{ badgeForm.frame_image_name }}</p>
        </v-card-text>
        <v-card-actions><v-spacer /><v-btn :disabled="saving" @click="badgeDialog = false">취소</v-btn><v-btn color="primary" :loading="saving" :disabled="preparingFrame" @click="saveBadge">저장</v-btn></v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog v-model="seasonDialog" max-width="540" :persistent="saving">
      <v-card title="시즌 설정"><v-card-text>
        <v-alert v-if="formError" type="error" class="mb-4">{{ formError }}</v-alert>
        <v-text-field v-model="seasonForm.code" label="시즌 코드 (예: 2026-S1)" maxlength="64" /><v-text-field v-model="seasonForm.name" label="시즌 이름" maxlength="100" />
        <v-text-field v-model="seasonForm.starts_at" label="시작 시간" type="datetime-local" /><v-text-field v-model="seasonForm.ends_at" label="종료 시간" type="datetime-local" />
        <v-select v-model="seasonForm.status" :items="statuses" item-title="title" item-value="value" label="상태" />
        <p class="text-caption">준비 중인 시즌에는 휘장을 지급할 수 없습니다. 시즌 종료 후에도 결과에 따라 휘장을 지급할 수 있습니다.</p>
      </v-card-text><v-card-actions><v-spacer /><v-btn :disabled="saving" @click="seasonDialog = false">취소</v-btn><v-btn color="primary" :loading="saving" @click="saveSeason">저장</v-btn></v-card-actions></v-card>
    </v-dialog>
    <v-snackbar v-model="success">저장했습니다.</v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { can } from '@/stores/usePermissionStore';
import { badgeApi, badgeError } from '@/data/api/badge';
import type { BadgeCatalog, BadgeMaster, Season } from '@/data/types/badge';
import BadgePreview from '@/components/badges/BadgePreview.vue';
import { prepareBadgeImage } from '@/utils/badgeImage';
const editable = computed(() => can('ACCOUNT', 'SYS-SET-ACC-U'));
const catalog = ref<BadgeCatalog>({ badges: [], seasons: [] });
const tab = ref('badges'), loading = ref(false), saving = ref(false);
const error = ref(''), formError = ref(''), success = ref(false);
const badgeDialog = ref(false), seasonDialog = ref(false), uploadKey = ref(0);
const blankBadge = (): Omit<BadgeMaster, 'id'> & { id?: number } => ({ code: '', name: '', description: '', icon_image_url: null, frame_image_url: '', frame_slice: 32, frame_width: 24, is_active: true });
const badgeForm = ref<ReturnType<typeof blankBadge> & { frame_image_name?: string | null }>(blankBadge());
const frameFile = ref<File | null>(null);
const preparingFrame = ref(false);
let frameSelection = 0;
let previewUrl = '';
let originalFrameUrl = '';
function releasePreview() {
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  previewUrl = '';
}
watch(badgeDialog, (open) => { if (!open) { frameSelection++; preparingFrame.value = false; releasePreview(); frameFile.value = null; } });
onBeforeUnmount(() => { frameSelection++; releasePreview(); });
const seasonForm = ref<Omit<Season, 'id'> & { id?: number }>({ code: '', name: '', starts_at: '', ends_at: '', status: 'DRAFT' });
const statuses = [{ title: '준비', value: 'DRAFT' }, { title: '진행 중', value: 'ACTIVE' }, { title: '종료', value: 'CLOSED' }];
const statusName = (status: string) => statuses.find((item) => item.value === status)?.title;
const date = (value: string) => new Date(value).toLocaleString('ko-KR');
function localDate(value: string) { const d = new Date(value); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16); }
async function load() {
  loading.value = true; error.value = '';
  try { catalog.value = await badgeApi.catalog(); } catch (e) { error.value = badgeError(e); } finally { loading.value = false; }
}
function editBadge(badge?: BadgeMaster) {
  releasePreview(); frameFile.value = null;
  badgeForm.value = badge ? { ...badge } : blankBadge();
  originalFrameUrl = badgeForm.value.frame_image_url;
  formError.value = ''; uploadKey.value++; badgeDialog.value = true;
}
function editSeason(season?: Season) { seasonForm.value = season ? { ...season, starts_at: localDate(season.starts_at), ends_at: localDate(season.ends_at) } : { code: '', name: '', starts_at: '', ends_at: '', status: 'DRAFT' }; formError.value = ''; seasonDialog.value = true; }
async function selectFrame(value: File | File[] | null) {
  const selection = ++frameSelection;
  preparingFrame.value = false;
  const file = Array.isArray(value) ? value[0] : value;
  releasePreview(); frameFile.value = null; formError.value = '';
  badgeForm.value.frame_image_url = originalFrameUrl;
  if (!file) return;
  preparingFrame.value = true;
  try {
    const prepared = await prepareBadgeImage(file);
    if (selection !== frameSelection) return;
    frameFile.value = prepared;
    previewUrl = URL.createObjectURL(prepared);
    badgeForm.value.frame_image_url = previewUrl;
  } catch (e) {
    if (selection === frameSelection) formError.value = e instanceof Error && e.name !== 'EncodingError' ? e.message : 'SVG 이미지를 읽을 수 없습니다. 파일을 확인해주세요.';
  } finally {
    if (selection === frameSelection) preparingFrame.value = false;
  }
}
async function saveBadge() {
  if (preparingFrame.value) return;
  if (!badgeForm.value.name.trim() || (!badgeForm.value.id && !frameFile.value)) { formError.value = '이름과 테두리 이미지를 입력해주세요.'; return; }
  saving.value = true; formError.value = '';
  try { await badgeApi.saveMaster(badgeForm.value, frameFile.value); badgeDialog.value = false; success.value = true; await load(); } catch (e) { formError.value = badgeError(e); } finally { saving.value = false; }
}
async function saveSeason() {
  const form = seasonForm.value;
  if (!form.code.trim() || !form.name.trim() || !form.starts_at || !form.ends_at || !(new Date(form.starts_at) < new Date(form.ends_at))) { formError.value = '코드, 이름과 올바른 시즌 기간을 입력해주세요.'; return; }
  saving.value = true; formError.value = '';
  try { await badgeApi.saveSeason({ ...form, starts_at: new Date(form.starts_at).toISOString(), ends_at: new Date(form.ends_at).toISOString() }); seasonDialog.value = false; success.value = true; await load(); } catch (e) { formError.value = badgeError(e); } finally { saving.value = false; }
}
onMounted(load);
</script>
