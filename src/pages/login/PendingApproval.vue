<template>
  <v-container class="min-h-screen d-flex align-center justify-center py-12">
    <v-card class="mx-auto px-6 py-8 approval-card" max-width="780" rounded="xl" elevation="8">
      <!-- 헤더 -->
      <div class="d-flex align-center mb-4">
        <v-avatar size="72" color="indigo" variant="tonal" class="mr-4">
          <v-icon size="42">mdi-account-clock</v-icon>
        </v-avatar>

        <div class="flex-grow-1">
          <div class="text-h5 font-weight-bold mb-1">관리자 승인 대기 중입니다</div>
          <div class="text-subtitle-2 text-medium-emphasis">
            가입 신청은 완료되었고, 관리자가 승인하면 로그인이 가능해집니다.
          </div>

          <div class="mt-2 d-flex flex-wrap align-center ga-2">
            <v-chip size="small" :color="statusColor" variant="flat" class="font-weight-medium">
              상태: {{ statusLabel }}
            </v-chip>

            <v-chip
              v-if="requestedAt"
              size="small"
              color="grey"
              variant="tonal"
              prepend-icon="mdi-calendar-clock"
            >
              신청일 {{ requestedAt }}
            </v-chip>
          </div>
        </div>
      </div>

      <v-divider class="my-4" />

      <!-- 단계 표시 -->
      <div class="d-flex justify-space-around mb-6 text-center step-row">
        <div class="step-item">
          <v-avatar size="36" color="success" variant="tonal">
            <v-icon>mdi-checkbox-marked-circle</v-icon>
          </v-avatar>
          <div class="mt-1 text-body-2">회원가입 완료</div>
        </div>
        <v-icon class="step-arrow">mdi-chevron-right</v-icon>
        <div class="step-item">
          <v-avatar size="36" color="warning" variant="tonal">
            <v-icon>mdi-account-clock</v-icon>
          </v-avatar>
          <div class="mt-1 text-body-2">관리자 승인 대기</div>
        </div>
        <v-icon class="step-arrow">mdi-chevron-right</v-icon>
        <div class="step-item">
          <v-avatar size="36" color="primary" variant="tonal">
            <v-icon>mdi-shield-check</v-icon>
          </v-avatar>
          <div class="mt-1 text-body-2">승인 후 서비스 이용</div>
        </div>
      </div>

      <!-- 요약 정보 -->
      <v-row dense>
        <v-col cols="12" md="6">
          <v-card variant="tonal" rounded="lg">
            <v-card-title class="py-2 text-subtitle-1">
              <v-icon size="18" class="mr-1">mdi-account</v-icon>
              계정 정보
            </v-card-title>
            <v-card-text class="py-2">
              <div class="info-row">
                <span class="label">이름</span>
                <span class="value">{{ account?.name || '-' }}</span>
              </div>
              <div class="info-row">
                <span class="label">이메일</span>
                <span class="value">{{ account?.email || '-' }}</span>
              </div>
              <div class="info-row">
                <span class="label">권한</span>
                <span class="value">{{ roleLabel }}</span>
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="6">
          <v-card variant="tonal" rounded="lg">
            <v-card-title class="py-2 text-subtitle-1">
              <v-icon size="18" class="mr-1">mdi-controller-classic</v-icon>
              플레이어 정보
            </v-card-title>
            <v-card-text class="py-2">
              <div class="info-row">
                <span class="label">닉네임</span>
                <span class="value">
                  {{ account?.player.nickname || '-' }}#{{ account?.player.tagname }}
                </span>
              </div>
              <div class="info-row">
                <span class="label">티어</span>
                <span class="value">{{ account?.player.tier.name || '-' }}</span>
              </div>
              <div class="info-row">
                <span class="label">포인트</span>
                <span class="value">
                  {{ account?.player.point != null ? account?.player.point.toLocaleString() : '-' }}
                </span>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- 안내 문구 -->
      <v-alert v-if="helpMessage" type="info" variant="tonal" class="mt-6" rounded="lg">
        {{ helpMessage }}
      </v-alert>

      <!-- 버튼들 -->
      <div class="d-flex flex-wrap justify-center ga-3 mt-6">
        <v-btn color="primary" prepend-icon="mdi-refresh" :loading="loading" @click="onRetry">
          상태 새로고침
        </v-btn>

        <v-btn variant="tonal" color="grey" prepend-icon="mdi-logout" @click="onLogout">
          로그아웃
        </v-btn>

        <v-btn
          v-if="adminContact"
          variant="text"
          prepend-icon="mdi-email"
          :href="`mailto:${adminContact}`"
        >
          관리자에게 메일 보내기
        </v-btn>
      </div>

      <div class="caption text-disabled text-center mt-4">
        관리자가 승인하면 다시 로그인하실 수 있습니다.
      </div>
    </v-card>
  </v-container>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import Cookies from 'js-cookie';
import { useRouter } from 'vue-router';

const router = useRouter();
import { useAccountStore } from '@/stores/useAccountStore';
debugger;
const account = useAccountStore();

const props = withDefaults(
  defineProps<{
    status?: 'PENDING' | 'REJECTED' | 'APPROVED';
    accountName?: string;
    email?: string;
    role?: string;
    requestedAt?: string; // '2025-06-30 14:32' 이런 식
    playerNickname?: string;
    playerTag?: string;
    playerTier?: string;
    playerPoint?: number | null;
    helpMessage?: string;
    adminContact?: string;
  }>(),
  {
    status: 'PENDING',
    accountName: '',
    email: '',
    role: '',
    requestedAt: '',
    playerNickname: '',
    playerTag: '',
    playerTier: '',
    playerPoint: null,
    helpMessage:
      '승인까지 시간이 조금 걸릴 수 있습니다. 담당자에게 문의가 필요한 경우 관리자 연락처로 문의해 주세요.',
    adminContact: '',
  }
);

const emit = defineEmits<{
  (e: 'retry'): void;
  (e: 'logout'): void;
}>();

const loading = ref(false);

const statusLabel = computed(() => {
  switch (props.status) {
    case 'APPROVED':
      return '승인 완료';
    case 'REJECTED':
      return '승인 반려';
    default:
      return '승인 대기중';
  }
});

const statusColor = computed(() => {
  switch (props.status) {
    case 'APPROVED':
      return 'success';
    case 'REJECTED':
      return 'error';
    default:
      return 'warning';
  }
});

const roleLabel = computed(() => props.role || 'general');

async function onRetry() {
  loading.value = true;
  try {
    router.push('/home');
  } finally {
    loading.value = false;
  }
}

function onLogout() {
  Cookies.remove('refreshToken');
  router.push('/login');
  emit('logout'); // 부모에서 토큰 삭제 + 로그인 페이지로 이동
}
</script>

<style scoped>
.min-h-screen {
  min-height: 100vh;
}

.approval-card {
  background: rgba(18, 19, 23, 0.92);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  font-size: 0.875rem;
}
.info-row .label {
  color: rgba(255, 255, 255, 0.54);
}
.info-row .value {
  font-weight: 500;
}

.step-row .step-item {
  min-width: 120px;
}
.step-arrow {
  align-self: center;
  opacity: 0.5;
}
</style>
