<template>
  <v-container class="min-h-screen d-flex align-center justify-center py-12">
    <v-card class="mx-auto px-6 py-8 text-center glass" max-width="720" rounded="xl" elevation="8">
      <div class="mb-4 d-flex align-center justify-center">
        <v-avatar size="72" class="mr-3" :color="tone.color" variant="tonal">
          <v-icon :icon="tone.icon" size="42"></v-icon>
        </v-avatar>
        <div class="text-left">
          <div class="text-h5 font-weight-bold">{{ titleText }}</div>
          <div class="text-subtitle-2 text-medium-emphasis">
            {{ subtitleText }}
          </div>
        </div>
      </div>

      <div class="my-3">
        <v-chip color="grey" size="small" variant="tonal" class="mr-2">code: {{ code }}</v-chip>
        <v-chip
          v-if="pingUrl"
          :color="reachable === true ? 'success' : reachable === false ? 'error' : 'grey'"
          size="small"
          variant="tonal"
        >
          {{ pingStatusLabel }}
        </v-chip>
      </div>

      <v-alert v-if="detail" type="info" variant="tonal" class="mb-4" rounded="lg">
        {{ detail }}
      </v-alert>

      <div class="text-medium-emphasis mb-6">
        문제가 계속되면 페이지를 새로고침하거나 잠시 후 다시 시도해 주세요.
        <template v-if="retrySeconds > 0"> {{ countdown }}초 후 자동 재시도됩니다. </template>
      </div>

      <div class="d-flex flex-wrap justify-center ga-3">
        <v-btn :loading="loading" color="primary" prepend-icon="mdi-refresh" @click="retryNow"
          >다시 시도</v-btn
        >
        <v-btn variant="tonal" :to="homeTo" prepend-icon="mdi-home">홈으로</v-btn>
        <v-btn
          v-if="supportEmail"
          variant="text"
          :href="`mailto:${supportEmail}`"
          prepend-icon="mdi-lifebuoy"
          >문의하기</v-btn
        >
      </div>

      <v-divider class="my-6"></v-divider>

      <div class="caption text-disabled">단축키: <kbd>R</kbd> 재시도 · <kbd>H</kbd> 홈</div>
    </v-card>
  </v-container>
</template>

<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

/**
 * Props
 * - code: 404 | 500 | 502 | 503 | 0(네트워크/타임아웃) 등
 * - pingUrl: 서버 상태 확인용 경량 엔드포인트(예: /health, /ping). 생략 가능
 * - autoRetrySec: 자동 재시도까지 대기 초. 0이면 자동 재시도 안 함
 * - homeTo: 홈으로 이동할 경로
 */
const props = withDefaults(
  defineProps<{
    code?: number;
    pingUrl?: string;
    autoRetrySec?: number;
    homeTo?: string;
    title?: string;
    message?: string;
    detail?: string;
    supportEmail?: string;
  }>(),
  {
    code: 503,
    autoRetrySec: 10,
    homeTo: '/',
    title: '',
    message: '',
    detail: '',
    supportEmail: '',
  }
);

const router = useRouter();
const loading = ref(false);
const reachable = ref<boolean | null>(null); // ping 결과
const countdown = ref(props.autoRetrySec);

const tone = computed(() => {
  if (props.code === 404) return { color: 'warning', icon: 'mdi-magnify-close' };
  if (props.code === 0) return { color: 'error', icon: 'mdi-wifi-off' };
  return { color: 'primary', icon: 'mdi-tools' }; // 503 등
});

const titleText = computed(
  () =>
    props.title ||
    (props.code === 404
      ? '페이지를 찾을 수 없습니다'
      : props.code === 0
      ? '네트워크 연결을 확인해 주세요'
      : '현재 점검 중이에요')
);

const subtitleText = computed(
  () =>
    props.message ||
    (props.code === 404
      ? '요청하신 페이지가 삭제되었거나 주소가 변경되었어요.'
      : props.code === 0
      ? '인터넷 연결이 불안정하거나 서버와 통신할 수 없습니다.'
      : '서비스 안정화를 위한 작업 또는 일시적인 과부하일 수 있어요.')
);

const pingStatusLabel = computed(() => {
  if (reachable.value === true) return '서버 응답 OK';
  if (reachable.value === false) return '서버 응답 없음';
  return '상태 확인 중';
});

async function ping() {
  if (!props.pingUrl) return;
  reachable.value = null;
  try {
    // CORS 제약 고려: HEAD → 실패하면 no-cors GET 시도
    const r1 = await fetch(props.pingUrl, { method: 'HEAD', cache: 'no-store' });
    reachable.value = r1.ok;
  } catch {
    try {
      await fetch(props.pingUrl, { method: 'GET', mode: 'no-cors', cache: 'no-store' });
      // no-cors는 ok 판단 불가 → 접속 자체는 됨으로 간주
      reachable.value = true;
    } catch {
      reachable.value = false;
    }
  }
}

async function retryNow() {
  loading.value = true;
  try {
    if (props.pingUrl) {
      await ping();
      // 서버가 살아있으면 현재 라우트 다시 로드
      if (reachable.value) {
        // API가 복구됐다고 가정하고 하드 리로드
        window.location.reload();
        return;
      }
    }
    // pingUrl 없거나 아직 다운이면 소프트 리로드
    router.replace({ path: router.currentRoute.value.fullPath });
  } finally {
    loading.value = false;
    // 카운트다운 재시작
    if (props.autoRetrySec > 0) countdown.value = props.autoRetrySec;
  }
}

let ticker: number | null = null;
watch(countdown, (v) => {
  if (props.autoRetrySec <= 0) return;
  if (v <= 0) {
    retryNow();
  }
});

onMounted(() => {
  if (props.pingUrl) ping();
  if (props.autoRetrySec > 0) {
    ticker = window.setInterval(() => {
      if (countdown.value > 0 && !loading.value) countdown.value -= 1;
    }, 1000);
  }
  window.addEventListener('keydown', onKey);
});

onUnmounted(() => {
  if (ticker) window.clearInterval(ticker);
  window.removeEventListener('keydown', onKey);
});

function onKey(e: KeyboardEvent) {
  if (e.key.toLowerCase() === 'r') retryNow();
  if (e.key.toLowerCase() === 'h') router.push(props.homeTo);
}
</script>

<style scoped>
.min-h-screen {
  min-height: 100vh;
}
.glass {
  background: rgba(30, 32, 35, 0.75);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.06);
}
kbd {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 6px;
  padding: 2px 6px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace;
}
</style>
