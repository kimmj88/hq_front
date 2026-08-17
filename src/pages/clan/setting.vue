<template>
  <v-container class="py-6">
    <v-row>
      <!-- 메인 설정 카드 -->
      <v-col cols="12" md="7">
        <v-card rounded="lg" variant="outlined">
          <v-card-title class="text-subtitle-1 font-weight-bold d-flex align-center">
            <v-icon class="mr-2">mdi-cog</v-icon>
            클랜 설정
          </v-card-title>

          <v-divider />

          <v-card-text class="pt-4">
            <!-- 클랜명 -->
            <v-text-field
              label="클랜명"
              v-model="account.clan.name"
              disabled
              variant="outlined"
              density="compact"
            />

            <!-- 클랜 소개 -->
            <v-textarea
              v-model="description"
              :disabled="!isClanMaster"
              label="클랜 소개"
              rows="4"
              variant="outlined"
              density="compact"
              counter="300"
            />

            <!-- <div class="text-caption text-medium-emphasis mb-2">클랜 배너 이미지</div>

            <v-file-input
              v-model="bannerFile"
              label="배너 이미지 선택"
              variant="outlined"
              density="compact"
              prepend-icon="mdi-image"
              accept="image/*"
              clearable
            />

            <v-card v-if="previewUrl" class="mt-3" variant="tonal" rounded="lg">
              <v-card-text class="pa-2">
                <v-img :src="previewUrl" height="160" cover class="rounded-lg" />
                <div class="text-caption text-medium-emphasis mt-2">배너 미리보기</div>
              </v-card-text>
            </v-card> -->

            <!-- 버튼 -->
            <div class="d-flex justify-end mt-4 gap-2">
              <v-btn
                v-if="account.clanrole.name == 'master'"
                color="primary"
                :loading="loading"
                @click="onSubmit"
              >
                저장
              </v-btn>
            </div>
          </v-card-text>
        </v-card>

        <v-card rounded="lg" variant="outlined" class="mt-5">
          <v-card-title class="text-subtitle-1 font-weight-bold d-flex align-center">
            <v-icon class="mr-2">mdi-account-multiple-plus</v-icon>
            클랜 초대 링크
          </v-card-title>
          <v-divider />
          <v-card-text>
            <p class="text-body-2 text-medium-emphasis mb-4">
              링크를 받은 사용자는 카카오 로그인과 LoL 계정 연동 후 클랜에 바로 가입할 수 있습니다.
            </p>

            <v-row dense>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model.number="inviteForm.expiresInDays"
                  type="number"
                  min="1"
                  max="365"
                  label="유효 기간(일)"
                  hint="비워두면 만료되지 않습니다."
                  persistent-hint
                  clearable
                  variant="outlined"
                  density="compact"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model.number="inviteForm.maxUses"
                  type="number"
                  min="1"
                  label="최대 사용 횟수"
                  hint="비워두면 횟수 제한이 없습니다."
                  persistent-hint
                  clearable
                  variant="outlined"
                  density="compact"
                />
              </v-col>
            </v-row>

            <div class="d-flex justify-end mt-4">
              <v-btn color="primary" prepend-icon="mdi-link-plus" :loading="inviteCreating" @click="createInvite">
                초대 링크 만들기
              </v-btn>
            </div>

            <v-divider class="my-5" />

            <div v-if="inviteLoading" class="text-center py-5">
              <v-progress-circular indeterminate color="primary" />
            </div>
            <v-alert v-else-if="!invites.length" type="info" variant="tonal">
              아직 발급된 초대 링크가 없습니다.
            </v-alert>
            <v-list v-else lines="two" class="invite-list">
              <v-list-item v-for="invite in invites" :key="invite.id">
                <template #prepend>
                  <v-avatar :color="inviteAvailable(invite) ? 'success' : 'grey'" variant="tonal">
                    <v-icon>mdi-link-variant</v-icon>
                  </v-avatar>
                </template>
                <v-list-item-title class="font-weight-bold">
                  {{ inviteAvailable(invite) ? '사용 가능' : '사용 종료' }}
                </v-list-item-title>
                <v-list-item-subtitle>
                  사용 {{ invite.used_count }}{{ invite.max_uses ? ` / ${invite.max_uses}` : '회' }} ·
                  {{ invite.expires_at ? `${formatDate(invite.expires_at)} 만료` : '기간 제한 없음' }}
                </v-list-item-subtitle>
                <template #append>
                  <div class="d-flex" style="gap: 4px">
                    <v-btn icon="mdi-content-copy" variant="text" size="small" @click="copyInvite(invite.code)" />
                    <v-btn v-if="invite.is_active" icon="mdi-link-off" color="error" variant="text" size="small" @click="revokeInvite(invite.id)" />
                  </div>
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- 우측 안내 -->
      <v-col cols="12" md="5">
        <v-card rounded="lg" variant="tonal">
          <v-card-title class="text-subtitle-1 font-weight-bold">안내</v-card-title>
          <v-divider />
          <v-card-text class="text-body-2 text-medium-emphasis">
            <ul class="pl-4">
              <li>클랜 소개는 최대 300자까지 작성할 수 있어.</li>
              <li>배너 이미지는 JPG / PNG 형식을 권장해.</li>
              <li>권장 비율은 4:1 (예: 1600 × 400)이야.</li>
            </ul>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { getBaseUrl } from '@/@core/composable/createUrl';
import { useAccountStore } from '@/stores/useAccountStore';
import api from '@/@core/composable/useAxios';

const account = useAccountStore();

const isClanMaster = computed(() => {
  return account.clanrole?.name === 'master';
});

const description = ref<string>(account.clan.description ?? '');
const bannerFile = ref<File | null>(null);
const previewUrl = ref<string | null>(null);
const loading = ref(false);

interface ClanInvite {
  id: number;
  code: string;
  expires_at: string | null;
  max_uses: number | null;
  used_count: number;
  is_active: boolean;
}

const invites = ref<ClanInvite[]>([]);
const inviteLoading = ref(false);
const inviteCreating = ref(false);
const inviteForm = reactive<{ expiresInDays: number | null; maxUses: number | null }>({
  expiresInDays: 7,
  maxUses: null,
});

function inviteAvailable(invite: ClanInvite) {
  const expired = invite.expires_at ? new Date(invite.expires_at).getTime() <= Date.now() : false;
  const exhausted = invite.max_uses != null && invite.used_count >= invite.max_uses;
  return invite.is_active && !expired && !exhausted;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium' }).format(new Date(value));
}

function inviteUrl(code: string) {
  return `${location.origin}/clan/invite/${code}`;
}

async function loadInvites() {
  try {
    inviteLoading.value = true;
    const { data } = await api.get(`${getBaseUrl('DATA')}/clan-invite/list`, {
      params: { clan_id: account.clan.id },
    });
    invites.value = data.datas ?? [];
  } finally {
    inviteLoading.value = false;
  }
}

async function createInvite() {
  try {
    inviteCreating.value = true;
    const { data } = await api.post(`${getBaseUrl('DATA')}/clan-invite/create`, {
      clan_id: account.clan.id,
      expires_in_days: inviteForm.expiresInDays || undefined,
      max_uses: inviteForm.maxUses || undefined,
    });
    await loadInvites();
    await navigator.clipboard.writeText(inviteUrl(data.datas.code));
    alert('초대 링크를 만들고 클립보드에 복사했습니다.');
  } catch (error: any) {
    alert(error?.response?.data?.message ?? '초대 링크를 만들지 못했습니다.');
  } finally {
    inviteCreating.value = false;
  }
}

async function copyInvite(code: string) {
  await navigator.clipboard.writeText(inviteUrl(code));
  alert('초대 링크를 복사했습니다.');
}

async function revokeInvite(id: number) {
  if (!confirm('이 초대 링크를 폐기할까요?')) return;
  await api.post(`${getBaseUrl('DATA')}/clan-invite/revoke`, { id });
  await loadInvites();
}

onMounted(loadInvites);

/** 파일 선택 시 미리보기 */
watch(bannerFile, (file) => {
  if (!file) {
    previewUrl.value = null;
    return;
  }
  previewUrl.value = URL.createObjectURL(file);
});

/** 되돌리기 */
function resetForm() {
  description.value = account.clan.description ?? '';
  bannerFile.value = null;
  previewUrl.value = null;
}

/** 저장 */
async function onSubmit() {
  try {
    loading.value = true;

    const formData = new FormData();
    formData.append('id', String(account.clan.id));
    formData.append('description', description.value);

    if (bannerFile.value) {
      formData.append('file', bannerFile.value);
    }

    await api.post(`${getBaseUrl('DATA')}/clan/update`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    // 성공 시 로컬 상태 반영
    account.clan.description = description.value;

    // TODO: 서버에서 banner_url 내려주면 같이 반영
  } catch (e) {
    console.error('클랜 설정 저장 실패', e);
  } finally {
    loading.value = false;
  }
}
</script>
