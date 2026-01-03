<template>
  <v-container class="py-6" style="max-width: 1100px">
    <div class="d-flex align-center justify-space-between mb-4">
      <div>
        <div class="text-h6 font-weight-bold">클랜전 목록</div>
        <div class="text-caption text-medium-emphasis">
          다른 클랜이 생성한 대기중 매치를 보고 “수락”하면 Step2로 진행합니다.
        </div>
      </div>

      <div class="d-flex align-center" style="gap: 8px">
        <v-chip variant="tonal" color="primary" v-if="myClanName">내 클랜: {{ myClanName }}</v-chip>
        <v-btn variant="tonal" prepend-icon="mdi-refresh" @click="reload">새로고침</v-btn>
      </div>
    </div>

    <!-- 필터 -->
    <v-card class="pa-4 mb-4" rounded="xl" elevation="2">
      <v-row dense>
        <v-col cols="12" md="4">
          <v-select
            v-model="filters.status"
            :items="statusOptions"
            item-title="title"
            item-value="value"
            label="상태"
            variant="outlined"
            density="comfortable"
            prepend-inner-icon="mdi-filter"
          />
        </v-col>

        <v-col cols="12" md="4">
          <v-select
            v-model="filters.tierLevel"
            :items="tierOptions"
            item-title="title"
            item-value="value"
            label="티어"
            variant="outlined"
            density="comfortable"
            clearable
            prepend-inner-icon="mdi-trophy"
          />
        </v-col>

        <v-col cols="12" md="4">
          <v-text-field
            v-model="filters.keyword"
            label="클랜명 검색"
            variant="outlined"
            density="comfortable"
            clearable
            prepend-inner-icon="mdi-magnify"
          />
        </v-col>
      </v-row>
    </v-card>

    <!-- 목록 -->
    <v-row dense>
      <v-col cols="12" v-if="filtered.length === 0">
        <v-alert type="info" variant="tonal" density="compact">
          조건에 맞는 클랜전이 없습니다.
        </v-alert>
      </v-col>

      <v-col cols="12" v-for="m in filtered" :key="m.id">
        <v-card rounded="xl" elevation="2" class="pa-4">
          <div class="d-flex align-center justify-space-between">
            <div class="d-flex align-center" style="gap: 10px; flex-wrap: wrap">
              <v-chip :color="statusColor(m.status)" variant="flat" size="small">
                {{ statusLabel(m.status) }}
              </v-chip>

              <v-chip color="secondary" variant="tonal" size="small">
                {{ tierTitle(m.tierLevel) }} · {{ tierDesc(m.tierLevel) }}
              </v-chip>

              <div class="text-subtitle-1 font-weight-bold">
                {{ m.hostClanName }}
              </div>

              <div class="text-caption text-medium-emphasis">
                {{ formatDateTime(m.matchAt) }}
              </div>
            </div>

            <div class="d-flex align-center" style="gap: 8px">
              <v-btn variant="text" prepend-icon="mdi-eye-outline" @click="openDetail(m)">
                상세
              </v-btn>

              <!-- ✅ 내 클랜이 만든 매치는 수락 버튼 숨김 -->
              <v-btn
                v-if="canAccept(m)"
                color="primary"
                prepend-icon="mdi-sword-cross"
                @click="openAcceptDialog(m)"
              >
                수락(매치잡기)
              </v-btn>

              <v-chip v-else variant="tonal" size="small" color="grey"> 내가 만든 매치 </v-chip>
            </div>
          </div>

          <v-divider class="my-3" />

          <!-- 우리팀(호스트) 라인업 -->
          <div class="text-subtitle-2 font-weight-bold mb-2">호스트 라인업 (Step1 등록)</div>

          <v-row dense>
            <v-col cols="12" md="6" v-for="slot in slots" :key="slot.key">
              <v-card variant="tonal" rounded="lg" class="pa-3">
                <div class="d-flex align-center" style="gap: 8px">
                  <v-icon :icon="slot.icon" size="18" />
                  <div class="font-weight-bold">{{ slot.label }}</div>
                  <v-spacer />
                  <v-chip size="x-small" variant="flat" color="secondary">{{ slot.short }}</v-chip>
                </div>

                <div class="mt-2 text-body-2">
                  <template v-if="m.hostLineup[slot.key]">
                    <b>{{ m.hostLineup[slot.key].nickname }}</b>
                    <span v-if="m.hostLineup[slot.key].tagname"
                      >#{{ m.hostLineup[slot.key].tagname }}</span
                    >
                    <span class="text-caption text-medium-emphasis">
                      · {{ m.hostLineup[slot.key].tierName || '-' }} · Point
                      {{ m.hostLineup[slot.key].point ?? 0 }}
                    </span>
                  </template>
                  <template v-else>
                    <span class="text-caption text-medium-emphasis">미등록</span>
                  </template>
                </div>
              </v-card>
            </v-col>
          </v-row>
        </v-card>
      </v-col>
    </v-row>

    <!-- 수락 다이얼로그 -->
    <v-dialog v-model="acceptDialog.open" max-width="520">
      <v-card rounded="xl">
        <v-card-title class="text-h6 font-weight-bold">클랜전 수락</v-card-title>
        <v-card-text class="text-body-2 text-medium-emphasis">
          <div>
            <b>{{ acceptDialog.match?.hostClanName }}</b> 클랜이 생성한
            <b>{{ tierTitle(acceptDialog.match?.tierLevel) }}</b> 매치를 수락할까요?
          </div>
          <div class="mt-2">
            수락하면 Step2에서 <b>상대(우리 클랜) 라인업 5명</b>을 입력하게 됩니다.
          </div>
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn variant="text" @click="acceptDialog.open = false">취소</v-btn>
          <v-btn color="primary" @click="acceptMatch" prepend-icon="mdi-check">수락</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snack.show" :timeout="2200">{{ snack.msg }}</v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

type SlotKey = 'TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT';

const slots: { key: SlotKey; label: string; short: string; icon: string }[] = [
  { key: 'TOP', label: '탑', short: 'TOP', icon: 'mdi-shield-sword-outline' },
  { key: 'JUNGLE', label: '정글', short: 'JG', icon: 'mdi-pine-tree' },
  { key: 'MID', label: '미드', short: 'MID', icon: 'mdi-sword-cross' },
  { key: 'ADC', label: '원딜', short: 'ADC', icon: 'mdi-bow-arrow' },
  { key: 'SUPPORT', label: '서포터', short: 'SUP', icon: 'mdi-hand-heart-outline' },
];

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

type MatchStatus = 'WAITING' | 'MATCHED' | 'DONE' | 'CANCELLED';

const statusOptions = [
  { title: '대기중', value: 'WAITING' },
  { title: '매칭됨', value: 'MATCHED' },
  { title: '완료', value: 'DONE' },
  { title: '취소', value: 'CANCELLED' },
];

type PlayerMini = {
  id: number;
  nickname: string;
  tagname?: string;
  tierName?: string;
  point?: number;
};
type ClanMatchItem = {
  id: number;
  status: MatchStatus;
  tierLevel: number;
  matchAt: string; // ISO or yyyy-mm-ddThh:mm
  hostClanId: number;
  hostClanName: string;
  hostLineup: Record<SlotKey, PlayerMini | null>;
};

const myClanId = ref<number>(2);
const myClanName = ref<string>('NOXUS'); // 샘플: 내 클랜
const items = ref<ClanMatchItem[]>([]);

const filters = ref({
  status: 'WAITING' as MatchStatus,
  tierLevel: null as number | null,
  keyword: '',
});

function tierTitle(v?: number | null) {
  if (!v) return '-';
  return `${v}티어`;
}
function tierDesc(v?: number | null) {
  if (!v) return '';
  return tierOptions.find((x) => x.value === v)?.desc ?? '';
}

function statusLabel(s: MatchStatus) {
  return statusOptions.find((x) => x.value === s)?.title ?? s;
}
function statusColor(s: MatchStatus) {
  if (s === 'WAITING') return 'primary';
  if (s === 'MATCHED') return 'success';
  if (s === 'DONE') return 'grey';
  return 'warning';
}

function formatDateTime(v: string) {
  // v가 datetime-local 형태여도 그대로 표시 가능
  return v.replace('T', ' ');
}

const filtered = computed(() => {
  return items.value
    .filter((m) => (filters.value.status ? m.status === filters.value.status : true))
    .filter((m) => (filters.value.tierLevel ? m.tierLevel === filters.value.tierLevel : true))
    .filter((m) => {
      const k = filters.value.keyword.trim().toLowerCase();
      if (!k) return true;
      return m.hostClanName.toLowerCase().includes(k);
    })
    .sort((a, b) => a.matchAt.localeCompare(b.matchAt)); // 시간순
});

function canAccept(m: ClanMatchItem) {
  return m.status === 'WAITING' && m.hostClanId !== myClanId.value;
}

function openDetail(m: ClanMatchItem) {
  // 상세 페이지 만들면 연결
  // router.push(`/clanmatch/${m.id}`)
  console.log('detail', m.id);
}

const acceptDialog = ref<{ open: boolean; match: ClanMatchItem | null }>({
  open: false,
  match: null,
});

function openAcceptDialog(m: ClanMatchItem) {
  acceptDialog.value.open = true;
  acceptDialog.value.match = m;
}

const snack = ref({ show: false, msg: '' });
function toast(msg: string) {
  snack.value.msg = msg;
  snack.value.show = true;
}

async function acceptMatch() {
  const m = acceptDialog.value.match;
  if (!m) return;

  // ✅ 실제라면:
  // await api.post(`/clanmatch/accept`, { match_id: m.id, clan_id: myClanId.value })
  // 성공 후 Step2로 이동:
  // router.push(`/clanmatch/${m.id}/step2`)

  // 샘플 동작: 상태 변경 + 이동
  m.status = 'MATCHED';
  acceptDialog.value.open = false;
  toast('매치를 수락했습니다. Step2로 이동합니다.');
  router.push(`/clanmatch/${m.id}/step2`);
}

async function reload() {
  // 실제라면:
  // const res = await api.get(`/clanmatch/list`, { params: { status: filters.value.status } })
  // items.value = res.data.datas;

  // 샘플
  seed();
}

function seed() {
  items.value = [
    {
      id: 1001,
      status: 'WAITING',
      tierLevel: 6,
      matchAt: '2026-01-10T21:00',
      hostClanId: 1,
      hostClanName: 'DEMACIA',
      hostLineup: {
        TOP: { id: 1, nickname: '탑장인', tagname: 'KR1', tierName: 'GOLD I', point: 50 },
        JUNGLE: { id: 2, nickname: '정글러', tagname: 'KR1', tierName: 'GOLD II', point: 45 },
        MID: { id: 3, nickname: '미드왕', tagname: 'KR1', tierName: 'PLATINUM IV', point: 70 },
        ADC: { id: 4, nickname: '원딜신', tagname: 'KR1', tierName: 'GOLD III', point: 40 },
        SUPPORT: { id: 5, nickname: '서폿킹', tagname: 'KR1', tierName: 'PLATINUM III', point: 80 },
      },
    },
    {
      id: 1002,
      status: 'WAITING',
      tierLevel: 8,
      matchAt: '2026-01-11T20:30',
      hostClanId: 3,
      hostClanName: 'PILTOVER',
      hostLineup: {
        TOP: { id: 11, nickname: 'TopP', tagname: 'KR1', tierName: 'SILVER I', point: 20 },
        JUNGLE: { id: 12, nickname: 'JgP', tagname: 'KR1', tierName: 'SILVER II', point: 18 },
        MID: { id: 13, nickname: 'MidP', tagname: 'KR1', tierName: 'BRONZE I', point: 10 },
        ADC: { id: 14, nickname: 'AdcP', tagname: 'KR1', tierName: 'SILVER IV', point: 12 },
        SUPPORT: { id: 15, nickname: 'SupP', tagname: 'KR1', tierName: 'BRONZE II', point: 9 },
      },
    },
    {
      id: 1003,
      status: 'MATCHED',
      tierLevel: 6,
      matchAt: '2026-01-12T22:00',
      hostClanId: 1,
      hostClanName: 'DEMACIA',
      hostLineup: { TOP: null, JUNGLE: null, MID: null, ADC: null, SUPPORT: null },
    },
  ];
}

onMounted(() => {
  seed();
});
</script>
