<template>
  <v-container class="py-6" style="max-width: 980px">
    <v-card class="pa-5" rounded="xl" elevation="2">
      <div class="d-flex align-center justify-space-between mb-4">
        <div>
          <div class="text-h6 font-weight-bold">
            {{ isCreate ? '클랜전 생성 (Step 1)' : '클랜전 수락 (Step 2 입력 전 단계)' }}
          </div>
          <div class="text-caption text-medium-emphasis">
            {{
              isCreate
                ? '티어 · 시간 · 우리 클랜 라인업(5인)만 먼저 등록'
                : '상대 클랜(Host) 정보 확인 후, 우리 라인업을 입력하고 수락하세요'
            }}
          </div>
        </div>

        <div class="d-flex align-center" style="gap: 8px">
          <v-chip color="primary" variant="flat">{{ myClanName }}</v-chip>
          <v-chip :color="modeChip.color" variant="flat">{{ modeChip.label }}</v-chip>
        </div>
      </div>

      <v-divider class="mb-4" />

      <!-- 티어 / 시간 (Create에서는 입력, Detail에서는 readonly) -->
      <v-row dense class="mb-2">
        <v-col cols="12" md="6">
          <v-select
            v-model="form.tierLevel"
            :items="tierOptions"
            item-title="title"
            item-value="value"
            label="티어 선택"
            variant="outlined"
            density="comfortable"
            prepend-inner-icon="mdi-trophy"
            :disabled="!isCreate"
          />
          <div class="text-caption text-medium-emphasis mt-1">
            {{ selectedTierDesc || '티어를 선택하세요.' }}
          </div>
        </v-col>

        <v-col cols="12" md="6">
          <v-text-field
            v-model="form.matchAt"
            type="datetime-local"
            label="매치 시간"
            variant="outlined"
            density="comfortable"
            prepend-inner-icon="mdi-calendar-clock"
            :disabled="!isCreate"
          />
          <div class="text-caption text-medium-emphasis mt-1">
            {{
              isCreate
                ? '상대 클랜이 수락하면 라인업을 확정합니다.'
                : '시간/티어는 Host가 설정한 값입니다.'
            }}
          </div>
        </v-col>
      </v-row>

      <v-divider class="my-4" />

      <!-- ===================== -->
      <!-- Host 라인업(상대팀) 표시 -->
      <!-- ===================== -->
      <div class="d-flex align-center justify-space-between mb-2">
        <div class="text-subtitle-1 font-weight-bold">
          {{ isCreate ? '우리 클랜 라인업(Host)' : `${hostClanName} 라인업(Host)` }}
        </div>

        <v-btn
          v-if="isCreate"
          size="small"
          variant="tonal"
          prepend-icon="mdi-refresh"
          @click="resetLineup('host')"
        >
          초기화
        </v-btn>
      </div>

      <v-row dense>
        <v-col v-for="slot in slots" :key="'host-' + slot.key" cols="12" md="6">
          <v-card variant="tonal" class="pa-3" rounded="lg">
            <div class="d-flex align-center mb-2" style="gap: 8px">
              <v-icon :icon="slot.icon" size="18" />
              <div class="text-subtitle-2 font-weight-bold">{{ slot.label }}</div>
              <v-spacer />
              <v-chip size="x-small" variant="flat" color="secondary">{{ slot.short }}</v-chip>
            </div>

            <v-autocomplete
              v-model="form.hostLineup[slot.key]"
              :items="availablePlayersFor('host', slot.key)"
              item-title="display"
              item-value="id"
              label="플레이어 선택"
              variant="outlined"
              density="comfortable"
              clearable
              prepend-inner-icon="mdi-account"
              :disabled="!isCreate"
            />
          </v-card>
        </v-col>
      </v-row>

      <v-divider class="my-4" />

      <!-- ===================== -->
      <!-- Guest 라인업(우리팀) 입력 -->
      <!-- ===================== -->
      <div class="d-flex align-center justify-space-between mb-2">
        <div class="text-subtitle-1 font-weight-bold">
          {{ isCreate ? '상대 클랜 라인업(Guest)' : '우리 클랜 라인업(Guest)' }}
        </div>

        <v-btn
          v-if="isGuestMode"
          size="small"
          variant="tonal"
          prepend-icon="mdi-refresh"
          @click="resetLineup('guest')"
        >
          초기화
        </v-btn>
      </div>

      <v-alert
        v-if="isGuestMode && guestPlayers.length === 0"
        type="info"
        variant="tonal"
        density="compact"
        class="mb-3"
      >
        우리 클랜에 등록된 플레이어가 없습니다. 먼저 플레이어 연동/등록을 해주세요.
      </v-alert>

      <v-row dense>
        <v-col v-for="slot in slots" :key="'guest-' + slot.key" cols="12" md="6">
          <v-card variant="tonal" class="pa-3" rounded="lg">
            <div class="d-flex align-center mb-2" style="gap: 8px">
              <v-icon :icon="slot.icon" size="18" />
              <div class="text-subtitle-2 font-weight-bold">{{ slot.label }}</div>
              <v-spacer />
              <v-chip size="x-small" variant="flat" color="secondary">{{ slot.short }}</v-chip>
            </div>

            <v-autocomplete
              v-model="form.guestLineup[slot.key]"
              :items="availablePlayersFor('guest', slot.key)"
              item-title="display"
              item-value="id"
              label="플레이어 선택"
              variant="outlined"
              density="comfortable"
              clearable
              prepend-inner-icon="mdi-account"
              :disabled="!isGuestMode || guestPlayers.length === 0"
              :rules="[() => true]"
            />
          </v-card>
        </v-col>
      </v-row>

      <v-divider class="my-4" />

      <!-- 하단 액션 -->
      <div class="d-flex justify-end" style="gap: 8px">
        <v-btn variant="text" @click="router.back()">뒤로</v-btn>

        <!-- Create -->
        <v-btn
          v-if="isCreate"
          color="primary"
          :disabled="!canSubmitCreate"
          prepend-icon="mdi-check"
          @click="submitCreate"
        >
          등록 (Step1)
        </v-btn>

        <!-- Guest Accept -->
        <v-btn
          v-else-if="isGuestMode"
          color="success"
          :disabled="!canSubmitGuest"
          prepend-icon="mdi-handshake"
          @click="submitAccept"
        >
          수락 + 라인업 제출
        </v-btn>
      </div>

      <v-alert v-if="errorMsg" type="warning" variant="tonal" density="compact" class="mt-3">
        {{ errorMsg }}
      </v-alert>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const router = useRouter();
const route = useRoute();

/** route.params.id 있으면 상세(수락/조회), 없으면 생성 */
const matchId = computed(() => route.params.id as string | undefined);
const isCreate = computed(() => !matchId.value);

/** 예시: 로그인한 내 클랜 */
const myClanName = ref('DEMACIA');

/** 예시: host 클랜 (상세에서 서버로 받아옴) */
const hostClanName = ref('DEMACIA');

type SlotKey = 'TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT';
type PlayerItem = {
  id: number;
  nickname: string;
  tagname: string;
  point: number;
  tierName?: string;
  display: string;
};

const tierOptions = [
  { title: '1티어', value: 1, desc: '그랜드마스터 · 챌린저' },
  { title: '2티어', value: 2, desc: '마스터 · 챌린저' },
  { title: '3티어', value: 3, desc: '다이아몬드 · 마스터' },
  { title: '4티어', value: 4, desc: '에메랄드 · 다이아몬드' },
  { title: '5티어', value: 5, desc: '플래티넘 · 에메랄드' },
  { title: '6티어', value: 6, desc: '골드 · 플래티넘' },
  { title: '7티어', value: 7, desc: '실버 · 골드' },
  { title: '8티어', value: 8, desc: '브론즈 · 실버' },
  { title: '9티어', value: 9, desc: '아이언 · 브론즈' },
];

const slots: { key: SlotKey; label: string; short: string; icon: string }[] = [
  { key: 'TOP', label: '탑', short: 'TOP', icon: 'mdi-shield-sword-outline' },
  { key: 'JUNGLE', label: '정글', short: 'JG', icon: 'mdi-pine-tree' },
  { key: 'MID', label: '미드', short: 'MID', icon: 'mdi-sword-cross' },
  { key: 'ADC', label: '원딜', short: 'ADC', icon: 'mdi-bow-arrow' },
  { key: 'SUPPORT', label: '서포터', short: 'SUP', icon: 'mdi-hand-heart-outline' },
];

const errorMsg = ref('');

const form = ref({
  tierLevel: null as number | null,
  matchAt: '' as string,
  hostLineup: { TOP: null, JUNGLE: null, MID: null, ADC: null, SUPPORT: null } as Record<
    SlotKey,
    number | null
  >,
  guestLineup: { TOP: null, JUNGLE: null, MID: null, ADC: null, SUPPORT: null } as Record<
    SlotKey,
    number | null
  >,
});

const selectedTierDesc = computed(
  () => tierOptions.find((x) => x.value === form.value.tierLevel)?.desc ?? ''
);

const mode = computed(() => {
  // 상세 페이지일 때: 내가 host인지 guest인지 판단해야 함
  // 지금은 샘플: hostClanName === myClanName 이면 host, 아니면 guest
  if (isCreate.value) return 'CREATE';
  return hostClanName.value === myClanName.value ? 'HOST_VIEW' : 'GUEST_ACCEPT';
});
const isGuestMode = computed(() => mode.value === 'GUEST_ACCEPT');

const modeChip = computed(() => {
  if (mode.value === 'CREATE') return { label: 'CREATE', color: 'primary' };
  if (mode.value === 'HOST_VIEW') return { label: 'HOST', color: 'indigo' };
  return { label: 'GUEST', color: 'success' };
});

/** 샘플: 내 클랜 플레이어(생성자) */
const hostPlayers = ref<PlayerItem[]>([]);
const guestPlayers = ref<PlayerItem[]>([]);

/** 중복 선택 방지(팀 안에서만) */
function availablePlayersFor(team: 'host' | 'guest', slotKey: SlotKey) {
  const lineup = team === 'host' ? form.value.hostLineup : form.value.guestLineup;
  const pool = team === 'host' ? hostPlayers.value : guestPlayers.value;

  const picked = new Set<number>(
    Object.entries(lineup)
      .filter(([k, v]) => k !== slotKey && v != null)
      .map(([, v]) => v as number)
  );

  return pool.filter((p) => !picked.has(p.id)).map((p) => ({ ...p, display: p.display }));
}

function resetLineup(team: 'host' | 'guest') {
  const target = team === 'host' ? form.value.hostLineup : form.value.guestLineup;
  target.TOP = target.JUNGLE = target.MID = target.ADC = target.SUPPORT = null;
}

const canSubmitCreate = computed(() => {
  if (!form.value.tierLevel || !form.value.matchAt) return false;
  const v = form.value.hostLineup;
  return !!(v.TOP && v.JUNGLE && v.MID && v.ADC && v.SUPPORT);
});

const canSubmitGuest = computed(() => {
  const v = form.value.guestLineup;
  return !!(v.TOP && v.JUNGLE && v.MID && v.ADC && v.SUPPORT);
});

async function submitCreate() {
  errorMsg.value = '';
  try {
    const payload = {
      tier_level: form.value.tierLevel,
      match_at: form.value.matchAt,
      host_lineup: {
        top_player_id: form.value.hostLineup.TOP,
        jungle_player_id: form.value.hostLineup.JUNGLE,
        mid_player_id: form.value.hostLineup.MID,
        adc_player_id: form.value.hostLineup.ADC,
        support_player_id: form.value.hostLineup.SUPPORT,
      },
    };
    console.log('CREATE payload', payload);
    // await api.post('/clanmatch/create_step1', payload);
    // router.push('/clanmatch/list');
  } catch (e) {
    console.error(e);
    errorMsg.value = '등록에 실패했습니다.';
  }
}

async function submitAccept() {
  errorMsg.value = '';
  try {
    const payload = {
      match_id: matchId.value,
      guest_lineup: {
        top_player_id: form.value.guestLineup.TOP,
        jungle_player_id: form.value.guestLineup.JUNGLE,
        mid_player_id: form.value.guestLineup.MID,
        adc_player_id: form.value.guestLineup.ADC,
        support_player_id: form.value.guestLineup.SUPPORT,
      },
    };
    console.log('ACCEPT payload', payload);
    // await api.post('/clanmatch/accept', payload);
    // router.push(`/clanmatch/${matchId.value}`); // 확정 화면
  } catch (e) {
    console.error(e);
    errorMsg.value = '수락에 실패했습니다.';
  }
}

onMounted(async () => {
  // 여기서 실제로는:
  // - create면 내 클랜 player 로드 → hostPlayers
  // - detail이면 matchId로 match 상세 로드 → hostClanName, tier/matchAt, hostLineup 세팅
  //   그리고 내 클랜 player 로드 → guestPlayers

  // 샘플 데이터
  hostPlayers.value = [
    {
      id: 1,
      nickname: '힐링큐',
      tagname: 'KR1',
      point: 120,
      tierName: 'PLATINUM IV',
      display: '힐링큐#KR1',
    },
    { id: 2, nickname: '민재', tagname: 'KR1', point: 80, tierName: 'GOLD I', display: '민재#KR1' },
    {
      id: 3,
      nickname: '탑장인',
      tagname: 'KR1',
      point: 50,
      tierName: 'SILVER I',
      display: '탑장인#KR1',
    },
    {
      id: 4,
      nickname: '정글러',
      tagname: 'KR1',
      point: 30,
      tierName: 'BRONZE I',
      display: '정글러#KR1',
    },
    {
      id: 5,
      nickname: '서폿킹',
      tagname: 'KR1',
      point: 200,
      tierName: 'EMERALD IV',
      display: '서폿킹#KR1',
    },
  ];
  guestPlayers.value = [
    {
      id: 11,
      nickname: '상대탑',
      tagname: 'KR1',
      point: 90,
      tierName: 'GOLD II',
      display: '상대탑#KR1',
    },
    {
      id: 12,
      nickname: '상대정글',
      tagname: 'KR1',
      point: 110,
      tierName: 'PLATINUM IV',
      display: '상대정글#KR1',
    },
    {
      id: 13,
      nickname: '상대미드',
      tagname: 'KR1',
      point: 70,
      tierName: 'GOLD III',
      display: '상대미드#KR1',
    },
    {
      id: 14,
      nickname: '상대원딜',
      tagname: 'KR1',
      point: 40,
      tierName: 'SILVER I',
      display: '상대원딜#KR1',
    },
    {
      id: 15,
      nickname: '상대서폿',
      tagname: 'KR1',
      point: 60,
      tierName: 'SILVER II',
      display: '상대서폿#KR1',
    },
  ];

  if (!isCreate.value) {
    // 상세 샘플: host가 만든 값 세팅
    hostClanName.value = 'DEMACIA'; // 서버에서 받아온 hostClan
    myClanName.value = 'NOXUS'; // 로그인 클랜(예시)
    form.value.tierLevel = 6;
    form.value.matchAt = '2026-01-15T20:00';
    form.value.hostLineup = { TOP: 1, JUNGLE: 4, MID: 2, ADC: 3, SUPPORT: 5 };
  } else {
    myClanName.value = 'DEMACIA';
  }
});
</script>
