<template>
  <v-container class="invite-page">
    <v-card class="invite-card" rounded="xl" elevation="0">
      <div class="invite-visual">
        <v-icon size="54">mdi-account-multiple-plus</v-icon>
      </div>

      <v-card-text class="pa-7 pa-sm-10">
        <div v-if="loading" class="text-center py-12">
          <v-progress-circular indeterminate color="primary" size="42" />
          <div class="text-medium-emphasis mt-4">초대 정보를 확인하고 있습니다.</div>
        </div>

        <template v-else-if="invite">
          <div class="text-overline text-primary font-weight-bold">CLAN INVITATION</div>
          <h1>{{ invite.clan.name }} 클랜에 초대받았습니다</h1>
          <p class="invite-description">
            {{ invite.clan.description || '함께 게임할 새로운 클랜원이 되어주세요.' }}
          </p>

          <v-alert
            v-if="!invite.is_available"
            type="error"
            variant="tonal"
            class="my-6"
          >
            {{ invite.unavailable_reason }}
          </v-alert>

          <div v-else class="steps my-7">
            <div :class="['step', account.isLoggedIn && 'is-done']">
              <span><v-icon>{{ account.isLoggedIn ? 'mdi-check' : 'mdi-numeric-1' }}</v-icon></span>
              <div><strong>카카오 로그인</strong><small>서비스 계정을 확인합니다.</small></div>
            </div>
            <div :class="['step', account.isPlayerLinked && 'is-done']">
              <span><v-icon>{{ account.isPlayerLinked ? 'mdi-check' : 'mdi-numeric-2' }}</v-icon></span>
              <div><strong>LoL 계정 연동</strong><small>클랜에서 사용할 플레이어를 연결합니다.</small></div>
            </div>
            <div :class="['step', joined && 'is-done']">
              <span><v-icon>{{ joined ? 'mdi-check' : 'mdi-numeric-3' }}</v-icon></span>
              <div><strong>클랜 가입</strong><small>초대 코드로 바로 가입합니다.</small></div>
            </div>
          </div>

          <v-alert v-if="account.isClaned && !isSameClan" type="warning" variant="tonal" class="mb-5">
            이미 다른 클랜에 가입되어 있습니다. 기존 클랜을 탈퇴한 뒤 이용해주세요.
          </v-alert>

          <v-btn
            v-if="!account.isLoggedIn"
            block size="large" rounded="lg" color="#FEE500" class="text-black font-weight-bold"
            prepend-icon="mdi-chat"
            @click="goLogin"
          >
            카카오로 계속하기
          </v-btn>

          <AccountPlayerMemberDialog
            v-else-if="!account.isPlayerLinked"
            button-text="LoL 계정 연동하기"
            button-color="primary"
            button-size="large"
            button-rounded="lg"
            block
            @added="handlePlayerLinked"
          />

          <v-btn
            v-else-if="!account.isClaned"
            block size="large" rounded="lg" color="primary"
            prepend-icon="mdi-account-plus"
            :loading="joining"
            :disabled="!invite.is_available"
            @click="joinClan"
          >
            {{ invite.clan.name }} 가입하기
          </v-btn>

          <v-btn
            v-else-if="isSameClan"
            block size="large" rounded="lg" color="success"
            prepend-icon="mdi-home-heart"
            @click="goClan"
          >
            클랜으로 이동
          </v-btn>
        </template>

        <v-alert v-else type="error" variant="tonal">{{ errorMessage }}</v-alert>
      </v-card-text>
    </v-card>

    <v-snackbar v-model="snackbar.show" color="error">{{ snackbar.message }}</v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '@/@core/composable/useAxios';
import { getBaseUrl } from '@/@core/composable/createUrl';
import { useAccountStore } from '@/stores/useAccountStore';
import { CLAN_PATH } from '@/router/clan/type';
import AccountPlayerMemberDialog from '@/components/dialogs/AccountPlayerMemberDialog.vue';

interface InviteInfo {
  code: string;
  clan: { id: number; name: string; description: string };
  expires_at: string | null;
  max_uses: number | null;
  used_count: number;
  is_available: boolean;
  unavailable_reason: string | null;
}

const route = useRoute();
const router = useRouter();
const account = useAccountStore();
const loading = ref(true);
const joining = ref(false);
const joined = ref(false);
const invite = ref<InviteInfo | null>(null);
const errorMessage = ref('초대 정보를 불러오지 못했습니다.');
const snackbar = ref({ show: false, message: '' });
const code = computed(() => String(route.params.code ?? ''));
const isSameClan = computed(() => account.clan?.id === invite.value?.clan.id);

function rememberInvite() {
  sessionStorage.setItem('clanInviteRedirect', route.fullPath);
}

function goLogin() {
  rememberInvite();
  router.push('/login');
}

function handlePlayerLinked() {
  rememberInvite();
  location.href = route.fullPath;
}

function goClan() {
  if (!invite.value) return;

  sessionStorage.removeItem('clanInviteRedirect');
  location.href = CLAN_PATH.VIEW(invite.value.clan.name);
}

async function joinClan() {
  try {
    joining.value = true;
    await api.post(`${getBaseUrl('DATA')}/clan-invite/join`, { code: code.value });
    joined.value = true;
    sessionStorage.removeItem('clanInviteRedirect');
    location.href = CLAN_PATH.VIEW(invite.value!.clan.name);
  } catch (error: any) {
    snackbar.value = {
      show: true,
      message: error?.response?.data?.message ?? '클랜 가입에 실패했습니다.',
    };
  } finally {
    joining.value = false;
  }
}

onMounted(async () => {
  try {
    const { data } = await api.get(`${getBaseUrl('DATA')}/clan-invite/code/${code.value}`);
    invite.value = data.datas;
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.message ?? errorMessage.value;
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.invite-page { display: grid; min-height: calc(100vh - 80px); max-width: 760px; place-items: center; padding-block: 48px; }
.invite-card { width: 100%; overflow: hidden; border: 1px solid rgba(var(--v-theme-primary), .18); background: rgba(var(--v-theme-surface), .94); }
.invite-visual { display: grid; height: 150px; place-items: center; color: white; background: radial-gradient(circle at 30% 20%, rgba(255,255,255,.25), transparent 35%), linear-gradient(135deg, #6750e8, #8b5cf6); }
h1 { margin: 4px 0 10px; font-size: clamp(25px, 5vw, 36px); letter-spacing: -.04em; }
.invite-description { color: rgba(var(--v-theme-on-surface), .6); }
.steps { display: grid; gap: 13px; }
.step { display: flex; align-items: center; gap: 14px; padding: 14px; border: 1px solid rgba(var(--v-border-color), .16); border-radius: 16px; }
.step > span { display: grid; width: 38px; height: 38px; flex: 0 0 auto; place-items: center; border-radius: 50%; color: rgba(var(--v-theme-on-surface), .55); background: rgba(var(--v-theme-on-surface), .07); }
.step div { display: flex; flex-direction: column; }
.step small { margin-top: 3px; color: rgba(var(--v-theme-on-surface), .48); }
.step.is-done { border-color: rgba(34,197,94,.25); background: rgba(34,197,94,.06); }
.step.is-done > span { color: white; background: #22c55e; }
</style>
