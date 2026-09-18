<template>
  <v-card rounded="xl" class="pa-5" variant="outlined">
    <div class="d-flex align-center flex-wrap ga-3 mb-4"><div><h2 class="text-h6">시즌 휘장</h2><p class="text-body-2 text-medium-emphasis">획득한 휘장은 시즌이 끝나도 보관됩니다.</p></div><v-spacer /><v-btn v-if="canManage" color="primary" variant="tonal" prepend-icon="mdi-shield-plus-outline" :disabled="loading || busy" @click="openGrant">휘장 지급</v-btn></div>
    <v-alert v-if="error" type="error" class="mb-4" closable @click:close="error = ''">{{ error }}</v-alert>
    <v-progress-linear v-if="loading" indeterminate />
    <v-select v-model="seasonFilter" :items="seasonOptions" item-title="name" item-value="id" label="시즌 필터" clearable density="compact" class="mt-4" style="max-width: 300px" />
    <p v-if="!loading && !filtered.length" class="text-medium-emphasis py-6 text-center">획득한 휘장이 없습니다.</p>
    <v-row>
      <v-col v-for="item in filtered" :key="item.id" cols="12" md="6">
        <BadgePreview :badge="item.badge" :subtitle="item.season.name" />
        <div class="d-flex flex-wrap align-center ga-2 mt-3">
          <v-chip v-if="item.revoked_at" size="small" color="error">회수됨</v-chip>
          <v-chip v-else-if="collection.equipped_id === item.id" size="small" color="success">장착 중</v-chip>
          <span class="text-caption">{{ new Date(item.earned_at).toLocaleDateString('ko-KR') }} 획득</span><v-spacer />
          <v-btn v-if="isOwner && !item.revoked_at" :disabled="busy" size="small" :color="collection.equipped_id === item.id ? undefined : 'primary'" variant="tonal" @click="equip(collection.equipped_id === item.id ? null : item.id)">{{ collection.equipped_id === item.id ? '장착 해제' : '장착' }}</v-btn>
          <v-btn v-if="canManage && !item.revoked_at" :disabled="busy" size="small" color="error" variant="text" @click="openRevoke(item)">회수</v-btn>
        </div>
        <p v-if="item.reason" class="text-caption mt-2">{{ item.reason }}</p><p v-if="item.revoke_reason" class="text-caption text-error mt-1">회수 사유: {{ item.revoke_reason }}</p>
      </v-col>
    </v-row>
    <v-dialog v-model="grantDialog" max-width="560" :persistent="busy">
      <v-card title="시즌 휘장 지급"><v-card-text>
        <v-alert v-if="dialogError" type="error" class="mb-4">{{ dialogError }}</v-alert>
        <v-select v-model="grantForm.season_id" :items="catalog.seasons.filter(s => s.status !== 'DRAFT')" item-title="name" item-value="id" label="획득 시즌" />
        <v-select v-model="grantForm.badge_id" :items="catalog.badges.filter(b => b.is_active)" item-title="name" item-value="id" label="지급할 휘장" />
        <BadgePreview v-if="selectedBadge" :badge="selectedBadge" class="mb-4" />
        <v-textarea v-model="grantForm.reason" label="지급 사유" rows="2" maxlength="500" />
        <v-text-field v-model="grantForm.grant_key" label="지급 키 (선택)" maxlength="200" hint="같은 시즌에 반복 수상할 때 대회 ID 등 고유한 키를 입력하세요. 비우면 시즌·휘장별 1회 지급됩니다." persistent-hint />
        <v-btn variant="text" size="small" to="/config/badge" class="mt-3">시즌 · 휘장 관리로 이동</v-btn>
      </v-card-text><v-card-actions><v-spacer /><v-btn :disabled="busy" @click="grantDialog = false">취소</v-btn><v-btn color="primary" :loading="busy" :disabled="!grantForm.badge_id || !grantForm.season_id" @click="grant">지급</v-btn></v-card-actions></v-card>
    </v-dialog>
    <v-dialog v-model="revokeDialog" max-width="480" :persistent="busy"><v-card title="휘장 회수"><v-card-text>
      <v-alert v-if="dialogError" type="error" class="mb-4">{{ dialogError }}</v-alert>
      <p class="mb-4">{{ revokeTarget?.badge.name }} 휘장을 회수합니다. 획득 이력은 남고 장착은 해제됩니다.</p><v-textarea v-model="revokeReason" label="회수 사유" maxlength="500" rows="3" />
    </v-card-text><v-card-actions><v-spacer /><v-btn :disabled="busy" @click="revokeDialog = false">취소</v-btn><v-btn color="error" :loading="busy" :disabled="!revokeReason.trim()" @click="revoke">회수</v-btn></v-card-actions></v-card></v-dialog>
    <v-snackbar v-model="success">{{ successMessage }}</v-snackbar>
  </v-card>
</template>
<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { can } from '@/stores/usePermissionStore';
import { useAccountStore } from '@/stores/useAccountStore';
import { badgeApi, badgeError } from '@/data/api/badge';
import type { AccountBadge, BadgeCatalog, BadgeCollection } from '@/data/types/badge';
import BadgePreview from './BadgePreview.vue';
const props = defineProps<{ accountId: number }>();
const store = useAccountStore();
const isOwner = computed(() => props.accountId === store.id);
const canManage = computed(() => can('ACCOUNT', 'SYS-SET-ACC-U') && can('ACCOUNT', 'SYS-SET-ACC-R'));
const collection = ref<BadgeCollection>({ items: [], equipped_id: null });
const catalog = ref<BadgeCatalog>({ badges: [], seasons: [] });
const loading = ref(false), busy = ref(false), error = ref(''), dialogError = ref('');
const seasonFilter = ref<number | null>(null);
const seasonOptions = computed(() => [...new Map(collection.value.items.map(item => [item.season.id, item.season])).values()]);
const filtered = computed(() => collection.value.items.filter(item => !seasonFilter.value || item.season.id === seasonFilter.value));
const grantDialog = ref(false), revokeDialog = ref(false), success = ref(false), successMessage = ref('');
const grantForm = ref({ season_id: null as number | null, badge_id: null as number | null, reason: '', grant_key: '' });
const selectedBadge = computed(() => catalog.value.badges.find(item => item.id === grantForm.value.badge_id));
const revokeTarget = ref<AccountBadge | null>(null), revokeReason = ref('');
let loadVersion = 0;
async function load() {
  const version = ++loadVersion;
  loading.value = true; error.value = '';
  try { const result = await badgeApi.collection(props.accountId); if (version === loadVersion) collection.value = result; }
  catch (e) { if (version === loadVersion) error.value = badgeError(e); }
  finally { if (version === loadVersion) loading.value = false; }
}
function notify(message: string) { successMessage.value = message; success.value = true; }
async function equip(id: number | null) {
  busy.value = true; error.value = '';
  try { await badgeApi.equip(id); await load(); notify(id === null ? '휘장 장착을 해제했습니다.' : '휘장을 장착했습니다. 내전매치에 표시됩니다.'); }
  catch (e) { error.value = badgeError(e); } finally { busy.value = false; }
}
async function openGrant() {
  busy.value = true; error.value = '';
  try { catalog.value = await badgeApi.catalog(); grantForm.value = { season_id: null, badge_id: null, reason: '', grant_key: '' }; dialogError.value = ''; grantDialog.value = true; }
  catch (e) { error.value = badgeError(e); } finally { busy.value = false; }
}
async function grant() {
  const form = grantForm.value;
  if (!form.badge_id || !form.season_id) return;
  busy.value = true; dialogError.value = '';
  try { await badgeApi.grant({ account_id: props.accountId, badge_id: form.badge_id, season_id: form.season_id, reason: form.reason, ...(form.grant_key.trim() ? { grant_key: form.grant_key.trim() } : {}) }); grantDialog.value = false; await load(); notify('휘장 지급을 처리했습니다. 동일한 지급 키는 중복 지급하지 않습니다.'); }
  catch (e) { dialogError.value = badgeError(e); } finally { busy.value = false; }
}
function openRevoke(item: AccountBadge) { revokeTarget.value = item; revokeReason.value = ''; dialogError.value = ''; revokeDialog.value = true; }
async function revoke() {
  if (!revokeTarget.value || !revokeReason.value.trim()) return;
  busy.value = true; dialogError.value = '';
  try { await badgeApi.revoke(revokeTarget.value.id, revokeReason.value); revokeDialog.value = false; await load(); notify('휘장을 회수했습니다.'); }
  catch (e) { dialogError.value = badgeError(e); } finally { busy.value = false; }
}
watch(() => props.accountId, () => { seasonFilter.value = null; collection.value = { items: [], equipped_id: null }; grantDialog.value = false; revokeDialog.value = false; void load(); }, { immediate: true });
</script>
