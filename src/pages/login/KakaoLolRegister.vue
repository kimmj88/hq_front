<template>
  <v-container class="fill-height d-flex align-center justify-center">
    <v-row style="max-width: 900px" class="w-100" align="stretch">
      <!-- 왼쪽: 안내 카드 -->
      <v-col cols="12" md="5">
        <v-card class="pa-5 h-100 d-flex flex-column justify-space-between" rounded="xl">
          <div>
            <div class="text-caption text-medium-emphasis mb-1">Kakao 로그인 완료</div>
            <div class="text-h5 font-weight-bold mb-2">리그 오브 레전드 계정을 등록해주세요</div>
            <p class="text-body-2 text-medium-emphasis mb-4">
              계정 정보를 바탕으로 토너먼트 팀 배정과 티어 확인을 진행합니다. 관리자가 승인하면
              서비스에 정상적으로 로그인할 수 있어요.
            </p>

            <v-alert
              v-if="status === 'PENDING'"
              type="info"
              variant="tonal"
              density="comfortable"
              class="mb-2"
            >
              이미 승인 요청이 접수되었습니다. 관리자가 검토 중이에요.
            </v-alert>

            <v-alert
              v-if="status === 'APPROVED'"
              type="success"
              variant="tonal"
              density="comfortable"
              class="mb-2"
            >
              이미 승인된 계정입니다. 바로 서비스를 이용하실 수 있습니다.
            </v-alert>
          </div>

          <div class="mt-6">
            <div class="text-caption text-medium-emphasis mb-1">현재 로그인 계정</div>
            <div class="d-flex align-center" style="gap: 12px">
              <v-avatar size="40" color="amber-darken-3">
                <span class="text-subtitle-2 font-weight-bold text-white">
                  {{ kakaoInitials }}
                </span>
              </v-avatar>
              <div>
                <div class="text-body-2 font-weight-medium">
                  {{ account.name || '카카오 사용자' }}
                </div>
                <div class="text-caption text-medium-emphasis">
                  {{ kakaoProfile.email || '이메일 정보 없음' }}
                </div>
              </div>
            </div>
          </div>
        </v-card>
      </v-col>

      <!-- 오른쪽: 폼 -->
      <v-col cols="12" md="7">
        <v-card class="pa-5 h-100" rounded="xl">
          <template v-if="status === 'NONE'">
            <div class="d-flex justify-space-between align-center mb-4">
              <div class="text-subtitle-1 font-weight-medium">리그 오브 레전드 계정 정보</div>
              <v-chip size="small" color="deep-purple-accent-3" text-color="white" variant="flat">
                승인 요청 전
              </v-chip>
            </div>

            <v-form ref="formRef" @submit.prevent="onSubmit">
              <v-row dense>
                <v-col cols="12" sm="8">
                  <v-text-field
                    v-model="form.nickname"
                    label="Riot ID (이름)"
                    placeholder="예: 김민재"
                    :rules="[rules.required]"
                    variant="outlined"
                    density="comfortable"
                  />
                </v-col>
                <v-col cols="12" sm="4">
                  <v-text-field
                    v-model="form.tagname"
                    label="Riot ID (태그)"
                    placeholder="예: KR1"
                    :rules="[rules.required]"
                    variant="outlined"
                    density="comfortable"
                    append-inner-icon="mdi-magnify"
                    :loading="searching"
                    :disabled="searching"
                    @click:append-inner="onSearchRiot"
                    @keyup.enter="onSearchRiot"
                  />
                </v-col>

                <v-col cols="12" sm="6">
                  <v-select
                    v-model="form.mainPosition"
                    :items="positions"
                    return-object
                    item-title="name"
                    item-value="id"
                    label="주 포지션"
                    :rules="[rules.required]"
                    variant="outlined"
                    density="comfortable"
                  />
                </v-col>

                <v-col cols="12" sm="6">
                  <v-select
                    v-model="form.subPosition"
                    :items="positions"
                    return-object
                    item-title="name"
                    item-value="id"
                    label="부 포지션 (선택)"
                    variant="outlined"
                    clearable
                    density="comfortable"
                  />
                </v-col>

                <v-col cols="12">
                  <v-text-field
                    v-model="form.favoriteChamps"
                    label="선호 챔피언"
                    placeholder="예: 오리아나, 벡스, 리산드라"
                    variant="outlined"
                    density="comfortable"
                    hint="쉼표로 여러 챔피언을 구분해서 입력할 수 있어요."
                    persistent-hint
                  />
                </v-col>

                <v-col cols="12">
                  <v-textarea
                    v-model="form.comment"
                    label="한 줄 소개 / 기타 요청사항"
                    rows="3"
                    auto-grow
                    variant="outlined"
                    density="comfortable"
                    placeholder="예: 미드 AP 위주, 토너먼트 경험 있습니다."
                  />
                </v-col>
              </v-row>

              <div class="mt-4 d-flex justify-space-between align-center">
                <div class="text-caption text-medium-emphasis">
                  제출 후 관리자가 정보를 확인하고 승인 처리합니다.
                </div>
                <div class="d-flex" style="gap: 8px">
                  <v-btn type="button" variant="text" color="secondary" @click="goHome">
                    나중에 하기
                  </v-btn>
                  <v-btn type="submit" color="primary" @click="reqConfirm" :loading="submitting">
                    승인 요청 보내기
                  </v-btn>
                </div>
              </div>
            </v-form>
          </template>

          <!-- 승인 요청 후 / 승인 상태 화면 -->
          <template v-else>
            <v-card
              variant="tonal"
              :color="status === 'PENDING' ? 'indigo' : 'green'"
              class="pa-5 text-center"
            >
              <v-icon size="40" class="mb-2">
                {{ status === 'PENDING' ? 'mdi-timer-sand' : 'mdi-check-circle' }}
              </v-icon>
              <div class="text-h6 font-weight-medium mb-1">
                {{
                  status === 'PENDING' ? '승인 요청이 접수되었습니다.' : '승인이 완료되었습니다.'
                }}
              </div>
              <div class="text-body-2 text-medium-emphasis mb-4">
                {{ statusMessage }}
              </div>

              <div class="d-flex justify-center" style="gap: 8px">
                <v-btn color="primary" @click="goHome"> 메인으로 가기 </v-btn>
                <v-btn
                  v-if="status === 'PENDING'"
                  variant="text"
                  color="secondary"
                  @click="reloadStatus"
                >
                  상태 새로고침
                </v-btn>
              </div>
            </v-card>
          </template>
        </v-card>
      </v-col>
    </v-row>

    <!-- 스낵바 -->
    <v-snackbar v-model="snackbar.show" :timeout="2500">
      {{ snackbar.msg }}
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/@core/composable/useAxios';

const router = useRouter();
import { useAccountStore } from '@/stores/useAccountStore';
import { getBaseUrl } from '@/@core/composable/createUrl';
import type { Position } from '@/data/types/position';
import type { Tier } from '@/data/types/tier';
const account = useAccountStore();

// ---- 상태: NONE(요청 전), PENDING(승인 대기), APPROVED(승인 완료)
type Status = 'NONE' | 'PENDING' | 'APPROVED';
const status = ref<Status>('NONE');

// 카카오 프로필 (예시용)
const kakaoProfile = reactive({
  nickname: '',
  email: '',
});

const kakaoInitials = computed(() => {
  if (!kakaoProfile.nickname) return 'K';
  return kakaoProfile.nickname[0].toUpperCase();
});

// 폼 상태
const formRef = ref();
const form = reactive<{
  nickname: string;
  tagname: string;
  mainPosition: Position | null;
  subPosition: Position | null;
  favoriteChamps: string;
  comment: string;
}>({
  nickname: '',
  tagname: '',
  mainPosition: null,
  subPosition: null,
  favoriteChamps: '',
  comment: '',
});

const positions = ref<Position[]>([]);
const positionItems = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'];

const rules = {
  required: (v: string) => !!v || '필수 항목입니다.',
};

const submitting = ref(false);
const snackbar = reactive({ show: false, msg: '' });

const statusMessage = computed(() => {
  if (status.value === 'PENDING') {
    return '관리자가 정보를 확인한 뒤 승인하면 카카오 계정으로 바로 로그인할 수 있습니다.';
  }
  if (status.value === 'APPROVED') {
    return '이제 자유롭게 토너먼트와 서비스를 이용해보세요!';
  }
  return '';
});

// 최초 진입 시 현재 로그인 사용자 + 승인 상태 조회

async function onSubmit() {
  // const valid = await formRef.value?.validate();
  // if (!valid?.valid) return;
  // submitting.value = true;
  // try {
  //   const payload = {
  //     riot_name: form.riotName,
  //     riot_tag: form.riotTag,
  //     main_position: form.mainPosition,
  //     sub_position: form.subPosition || null,
  //     favorite_champs: form.favoriteChamps,
  //     comment: form.comment,
  //   };
  //   // 예시 API, 실제 엔드포인트로 교체: /player/request-approval 같은 느낌
  //   await api.post(`${getBaseUrl('DATA')}/player/request-approval`, payload);
  //   status.value = 'PENDING';
  //   snackbar.msg = '승인 요청이 등록되었습니다.';
  //   snackbar.show = true;
  // } catch (e) {
  //   console.error(e);
  //   snackbar.msg = '요청 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
  //   snackbar.show = true;
  // } finally {
  //   submitting.value = false;
  // }
}

function goHome() {
  router.push('/');
}

async function reqConfirm() {
  let a: Position | null = null;
  let b: Position | null = null;
  if (form.mainPosition != null) {
    a = form.mainPosition;
  }
  if (form.subPosition != null) {
    b = form.subPosition;
  }

  const { data } = await api.post(`${getBaseUrl('AUTH')}/auth/register`, {
    account_id: account.id,
    nickname: riotResult.value?.nickname,
    tagname: riotResult.value?.tagname,
    tier: riotResult.value?.tier,
    positions: [a, b],
  });

  router.push('/pendingapproval');
}

const searching = ref(false);

type RiotSearchResult = {
  nickname: string;
  tagname: string;
  tier?: Tier;
  profileIconUrl?: string;
};

const riotResult = ref<RiotSearchResult | null>(null);
const riotError = ref<string | null>(null);

async function onSearchRiot() {
  // 이름/태그 둘 다 있어야만
  if (!form.nickname || !form.tagname) {
    snackbar.msg = 'Riot ID 이름과 태그를 모두 입력해주세요.';
    snackbar.show = true;
    return;
  }

  searching.value = true;
  riotError.value = null;
  riotResult.value = null;

  try {
    // 백엔드에 Riot 검색 API 만들어둔다고 가정
    // 예: GET /lol/search?name=xxx&tag=yyy

    const { data } = await api.get(`${getBaseUrl('DATA')}/riot/account`, {
      params: {
        nickname: form.nickname,
        tagname: form.tagname,
      },
    });

    // 여기 구조는 너 백엔드 응답에 맞게 수정
    riotResult.value = {
      nickname: data.datas.nickname,
      tagname: data.datas.tagname,
      tier: data.datas.tier,
      profileIconUrl: data.profileIconUrl,
    };

    // 검색 성공하면 폼에 다시 한 번 세팅해두면 깔끔
    form.nickname = data.datas.nickname;
    form.tagname = data.datas.tagname;

    snackbar.msg = '소환사 정보를 확인했습니다.';
    snackbar.show = true;
  } catch (e: any) {
    console.error(e);
    riotError.value =
      e?.response?.status === 404
        ? '해당 Riot ID를 찾을 수 없습니다.'
        : '검색 중 오류가 발생했습니다.';
    snackbar.msg = riotError.value;
    snackbar.show = true;
  } finally {
    searching.value = false;
  }
}

async function reloadStatus() {
  snackbar.msg = '상태를 새로고침했습니다.';
  snackbar.show = true;
}

onMounted(async () => {
  const position_codedict = await api.get(`${getBaseUrl('DATA')}/position/all`);

  positions.value = position_codedict.data.datas;
});
</script>

<style scoped>
.fill-height {
  min-height: 100vh;
}

.account-detail-card {
  min-height: 420px;
}
</style>
