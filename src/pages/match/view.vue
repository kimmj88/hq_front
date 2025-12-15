<template>
  <v-container>
    <h1 class="text-center mb-4">{{ match?.type }}{{ `(${match?.name})` }}</h1>

    <div class="d-flex justify-center gap-2 mb-2">
      <v-btn
        v-if="can('MATCH', 'SYS-SET-MATCH-C')"
        color="indigo"
        @click="onShot"
        :disabled="!canShot"
        >SHOT</v-btn
      >
      <v-btn
        v-if="can('MATCH', 'SYS-SET-MATCH-C')"
        color="success"
        :disabled="!canConfirm"
        @click="openConfirm"
        prepend-icon="mdi-check"
      >
        확정
      </v-btn>
    </div>

    <!-- ✅ 합계 요약 -->
    <div class="d-flex justify-center">
      <v-card class="pa-4 mb-4" style="max-width: 1000px; width: 100%">
        <v-row>
          <v-col cols="12" md="6" class="text-center">
            <div class="text-subtitle-2 mb-1">1팀 합계</div>
            <v-chip class="mr-2" color="primary" variant="flat">Point: {{ t1Point }}</v-chip>
            <v-chip class="mr-2" color="teal" variant="flat">Tier Point: {{ t1Tier }}</v-chip>
            <v-chip color="indigo" variant="flat">총합: {{ t1Total }}</v-chip>
          </v-col>

          <v-col cols="12" md="6" class="text-center">
            <div class="text-subtitle-2 mb-1">2팀 합계</div>
            <v-chip class="mr-2" color="primary" variant="flat">Point: {{ t2Point }}</v-chip>
            <v-chip class="mr-2" color="teal" variant="flat">Tier Point: {{ t2Tier }}</v-chip>
            <v-chip color="indigo" variant="flat">총합: {{ t2Total }}</v-chip>
          </v-col>
        </v-row>

        <v-divider class="my-3" />

        <div class="text-center">
          <div class="d-flex align-center justify-center" style="gap: 12px">
            <!-- 1팀 승리 -->
            <!-- 1팀 승리 -->
            <v-btn
              size="small"
              prepend-icon="mdi-trophy"
              :disabled="!isConfirmed || winnerSaving || isFinished"
              :loading="winnerSaving && winnerTeam === 1"
              :color="
                !isConfirmed
                  ? 'grey-darken-1'
                  : winnerChosen === 1
                  ? 'success'
                  : isFinished
                  ? 'grey-darken-1'
                  : 'primary'
              "
              :variant="
                !isConfirmed
                  ? 'tonal'
                  : winnerChosen === 1
                  ? 'flat'
                  : isFinished
                  ? 'tonal'
                  : 'elevated'
              "
              :ripple="isConfirmed && !isFinished"
              @click="setWinner(1)"
            >
              1팀 승리
            </v-btn>

            <!-- 우세/동점 칩 -->
            <v-chip
              :color="t1Total === t2Total ? 'grey' : t1Total > t2Total ? 'success' : 'error'"
              variant="flat"
              size="large"
            >
              {{
                t1Total === t2Total
                  ? '⚖️ 균형: 동점'
                  : t1Total > t2Total
                  ? `1팀 우세 (+${t1Total - t2Total})`
                  : `2팀 우세 (+${t2Total - t1Total})`
              }}
            </v-chip>

            <v-btn
              size="small"
              prepend-icon="mdi-trophy"
              :disabled="!isConfirmed || winnerSaving || isFinished"
              :loading="winnerSaving && winnerTeam === 2"
              :color="
                !isConfirmed
                  ? 'grey-darken-1'
                  : winnerChosen === 2
                  ? 'error'
                  : isFinished
                  ? 'grey-darken-1'
                  : 'primary'
              "
              :variant="
                !isConfirmed
                  ? 'tonal'
                  : winnerChosen === 2
                  ? 'flat'
                  : isFinished
                  ? 'tonal'
                  : 'elevated'
              "
              :ripple="isConfirmed && !isFinished"
              @click="setWinner(2)"
            >
              2팀 승리
            </v-btn>
          </div>

          <!-- 확정 전 안내 -->
          <div v-if="!isConfirmed" class="text-caption text-medium-emphasis mt-1">
            팀을 확정하면 승리 버튼이 활성화됩니다.
          </div>
        </div>
      </v-card>
    </div>

    <div class="d-flex justify-center">
      <v-simple-table class="text-center full-width-table" style="max-width: 1000px">
        <thead>
          <tr>
            <th v-if="match?.type === 'POSITION'">Position</th>
            <th>1팀</th>
            <th>Point</th>
            <th>Tier Point</th>
            <th>Tier</th>
            <th>Tier</th>
            <th>Tier Point</th>
            <th>Point</th>
            <th>2팀</th>
            <th v-if="match?.type === 'POSITION'">Position</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="i in team1.length" :key="i">
            <td v-if="match?.type === 'POSITION'">
              <div class="pos-icon-wrapper">
                <v-img :src="getPositionIcon(team1[i - 1].position)" width="26" height="26" cover />
              </div>
            </td>
            <td>
              <v-btn
                color="indigo"
                small
                block
                class="text-wrap"
                :disabled="isConfirmed || match?.type !== 'POSITION'"
                @click="openPlayerPicker('t1', i - 1)"
              >
                {{
                  team1[i - 1]?.player?.nickname
                    ? `${team1[i - 1].player.nickname}#${team1[i - 1].player.tagname}`
                    : match?.type === 'POSITION'
                    ? '유저 선택'
                    : '—'
                }}
              </v-btn>
              <font-awesome-icon
                v-for="index in team1[i - 1]?.player?.cup_count"
                :icon="['fas', 'star']"
                class="star-full"
              />
              <font-awesome-icon
                v-for="index in team1[i - 1]?.player?.sub_cup_count"
                :icon="['far', 'star']"
                class="star-full"
              />
            </td>
            <td>{{ team1[i - 1]?.player.point }}</td>
            <td>{{ team1[i - 1]?.player.tier.point }}</td>
            <td>
              <span
                :style="{
                  color: getTierColor(team1[i - 1]?.player?.tier.name),
                  fontWeight: 'bold',
                }"
              >
                {{ team1[i - 1].player.tier.name }}
              </span>
            </td>
            <td>
              <span
                :style="{
                  color: getTierColor(team2[i - 1]?.player?.tier.name),
                  fontWeight: 'bold',
                }"
              >
                {{ team2[i - 1]?.player.tier.name }}
              </span>
            </td>
            <td>{{ team2[i - 1]?.player?.tier.point }}</td>
            <td>{{ team2[i - 1]?.player?.point }}</td>
            <td>
              <v-btn
                color="indigo"
                small
                block
                class="text-wrap"
                :disabled="isConfirmed || match?.type !== 'POSITION'"
                @click="openPlayerPicker('t2', i - 1)"
              >
                {{
                  team2[i - 1]?.player?.nickname
                    ? `${team2[i - 1].player?.nickname}#${team2[i - 1].player.tagname}`
                    : match?.type === 'POSITION'
                    ? '유저 선택'
                    : '—'
                }}
              </v-btn>
              <font-awesome-icon
                v-for="index in team2[i - 1]?.player?.cup_count"
                :icon="['fas', 'star']"
                class="star-full"
              />
              <font-awesome-icon
                v-for="index in team2[i - 1]?.player?.sub_cup_count"
                :icon="['far', 'star']"
                class="star-full"
              />
            </td>

            <td v-if="match?.type === 'POSITION'">
              <div class="pos-icon-wrapper">
                <v-img :src="getPositionIcon(team2[i - 1].position)" width="26" height="26" cover />
              </div>
            </td>
          </tr>
        </tbody>
      </v-simple-table>
    </div>
    <v-dialog v-model="confirm.open" max-width="520">
      <v-card>
        <v-card-title class="text-h6">팀 구성 확정</v-card-title>
        <v-card-text>
          <div class="mb-2">현재 구성으로 팀을 확정할까요?</div>
          <v-divider class="my-3" />
          <div class="text-body-2">
            <div>
              <strong>1팀 총합:</strong> {{ t1Total }} (Point {{ t1Point }} / Tier {{ t1Tier }})
            </div>
            <div>
              <strong>2팀 총합:</strong> {{ t2Total }} (Point {{ t2Point }} / Tier {{ t2Tier }})
            </div>
          </div>
          <div class="text-caption text-medium-emphasis mt-2">
            확정 후에는 다시 SHOT으로 재배치할 수 있어요.
          </div>
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn variant="text" @click="confirm.open = false">취소</v-btn>
          <v-btn color="success" :loading="confirm.loading" @click="handleConfirm">확정</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="picker.open" max-width="560">
      <v-card>
        <v-card-title class="text-h6">플레이어 선택</v-card-title>
        <v-card-text>
          <v-autocomplete
            v-model="picker.selected"
            :items="availableMembers"
            return-object
            clearable
            density="comfortable"
            variant="outlined"
            label="닉네임 또는 태그 검색"
            :chips="true"
            :item-title="memberTitle"
          >
            <template #item="{ props, item }">
              <v-list-item v-bind="props">
                <template #title>
                  {{ item.raw.player.nickname }}#{{ item.raw.player.tagname }}
                </template>
                <template #subtitle>
                  Point {{ item.raw.player.point }} • {{ item.raw.player.tier.name }} ({{
                    item.raw.player.tier.point
                  }})
                </template>
              </v-list-item>
            </template>
          </v-autocomplete>

          <div class="text-caption mt-2">이미 양 팀에 배치된 유저는 목록에서 자동 제외돼요.</div>
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn variant="text" @click="picker.open = false">취소</v-btn>
          <v-btn color="primary" :disabled="!picker.selected" @click="applyPickedPlayer"
            >적용</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ✅ 스낵바 -->
    <v-snackbar v-model="snackbar.show" :timeout="2200">
      {{ snackbar.msg }}
      <template #actions>
        <v-btn variant="text" @click="snackbar.show = false">닫기</v-btn>
      </template>
    </v-snackbar>

    <v-divider class="my-3" />
  </v-container>
</template>

<script lang="ts" setup>
import topIcon from '@/assets/positions/top.svg';
import jugIcon from '@/assets/positions/jug.svg';
import midIcon from '@/assets/positions/mid.svg';
import adcIcon from '@/assets/positions/adc.webp';
import supIcon from '@/assets/positions/sup.svg';

import { can } from '@/stores/usePermissionStore';
import { getBaseUrl } from '@/@core/composable/createUrl';
import { computed, onMounted, ref } from 'vue';
import api from '@/@core/composable/useAxios';
import { useRoute } from 'vue-router';
import type { Match, MatchMember } from '@/data/types/match';
const route = useRoute();

const team1 = ref<MatchMember[]>([]);
const team2 = ref<MatchMember[]>([]);

const allPositionMembers = ref<MatchMember[]>([]);

const match = ref<Match | null>(null);
const winnerTeam = ref<number | null>(null);
const winnerSaving = ref(false);

// ✅ 합계 상태
const t1Point = ref(0);
const t1Tier = ref(0);
const t2Point = ref(0);
const t2Tier = ref(0);
const t1Total = ref(0);
const t2Total = ref(0);

// 합계 계산
function updateTotals() {
  t1Point.value = 0;
  t1Tier.value = 0;
  t2Point.value = 0;
  t2Tier.value = 0;
  t1Total.value = 0;
  t2Total.value = 0;

  for (let i = 0; i < Math.min(5, team1.value.length); i++) {
    t1Point.value += Number(team1.value[i]?.player?.point || 0);
    t1Tier.value += Number(team1.value[i]?.player?.tier?.point || 0);
  }
  for (let i = 0; i < Math.min(5, team2.value.length); i++) {
    t2Point.value += Number(team2.value[i]?.player?.point || 0);
    t2Tier.value += Number(team2.value[i]?.player?.tier?.point || 0);
  }

  t1Total.value = t1Point.value + t1Tier.value;
  t2Total.value = t2Point.value + t2Tier.value;
}

const isConfirmed = ref<boolean>(false);

function truthy(v: any): boolean {
  return v === true || v === 'true' || v === 't' || v === 1 || v === '1';
}

function getPositionColor(position: string) {
  switch (position) {
    case 'TOP':
      return 'deep-purple';
    case 'JUG':
      return 'green';
    case 'MID':
      return 'blue';
    case 'ADC':
      return 'red';
    case 'SUP':
      return 'pink';
    default:
      return 'grey';
  }
}

const positionIconMap: Record<string, string> = {
  TOP: topIcon,
  JUG: jugIcon,
  MID: midIcon,
  ADC: adcIcon,
  SUP: supIcon,
};

function getPositionIcon(pos?: string) {
  if (!pos) return '';
  return positionIconMap[pos] ?? '';
}

let POSITIONS: any[] = [];

const memberTitle = (m: MatchMember) => `${m.player.nickname}#${m.player.tagname}`;

function emptyMemberWithPos(pos: (typeof POSITIONS)[number]): MatchMember {
  const m = emptyMember();
  m.position = pos as any;
  return m;
}

function setWinner(team: 1 | 2) {
  if (!isConfirmed.value) {
    snackbar.value = { show: true, msg: '먼저 팀을 확정하세요.' };
    return;
  }
  if (isFinished.value) {
    snackbar.value = { show: true, msg: '이미 승리 팀이 확정되었습니다.' };
    return;
  }
  winnerTeam.value = team;
  saveWinner();
}

function getTierColor(tier: string): string {
  if (!tier) return 'grey';
  const key = tier.toLowerCase();
  if (key.includes('iron')) return '#615F5F';
  if (key.includes('bronze')) return '#AD5600';
  if (key.includes('silver')) return '#A0A0A0';
  if (key.includes('gold')) return '#FFD700';
  if (key.includes('platinum')) return '#00BBA3';
  if (key.includes('emerald')) return '#00D66B';
  if (key.includes('diamond')) return '#00BFFF';
  if (key.includes('grandmaster')) return '#FF4D4D';
  if (key.includes('master')) return '#C42AFF';
  if (key.includes('challenger')) return '#007BFF';
  return 'black';
}

// 기존 셔플
function shuffleTeams() {
  // POSITION 모드가 아닐 땐 기존 로직 그대로
  if (match.value?.type !== 'POSITION') {
    const combined = [...team1.value, ...team2.value];
    for (let i = combined.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [combined[i], combined[j]] = [combined[j], combined[i]];
    }
    team1.value = combined.slice(0, 5);
    team2.value = combined.slice(5, 10);
    return;
  }

  // POSITION 모드면 포지션별로 50% 확률로 팀만 교체
  for (const pos of POSITIONS) {
    const idx1 = team1.value.findIndex((m) => m.position === pos);
    const idx2 = team2.value.findIndex((m) => m.position === pos);

    // 두 팀에 해당 포지션이 존재해야만 교체 시도
    if (idx1 !== -1 && idx2 !== -1) {
      const swap = Math.random() < 0.5;
      if (swap) {
        const temp = team1.value[idx1];
        team1.value[idx1] = team2.value[idx2];
        team2.value[idx2] = temp;
      }
    }
  }

  updateTotals();
}

// SHOT 버튼 동작: 섞고 → 합계 업데이트
function onShot() {
  shuffleTeams();
  updateTotals();
}

async function fetch() {
  const positionData = await api.post(`${getBaseUrl('DATA')}/codedict/list`, {
    group: 'LOL_POSITION',
  });

  for (const item of positionData.data.datas) {
    POSITIONS.push(item.value);
  }

  const { data } = await api.get(`${getBaseUrl('DATA')}/match/find?id=${route.params.id}`);
  match.value = data.datas as Match;

  isConfirmed.value = truthy(match.value?.is_confirm);
  winnerTeam.value = (match.value?.winner_team ?? null) as number | null;

  if (match.value.type === 'POSITION') {
    // 후보 풀
    allPositionMembers.value = data.datas.match_members;

    if (match.value.is_confirm) {
      for (let i = 0; i < 5; i++) team1.value[i] = data.datas.match_members[i] ?? null;
      for (let i = 0; i < 5; i++) team2.value[i] = data.datas.match_members[i + 5] ?? null;
    } else {
      // 팀 슬롯을 포지션 순서대로 비워서 생성
      team1.value = POSITIONS.map((p) => emptyMemberWithPos(p));
      team2.value = POSITIONS.map((p) => emptyMemberWithPos(p));
    }
  } else {
    for (let i = 0; i < 5; i++) team1.value[i] = data.datas.match_members[i] ?? null;
    for (let i = 0; i < 5; i++) team2.value[i] = data.datas.match_members[i + 5] ?? null;
  }

  updateTotals();
}
const canConfirm = computed(() => {
  if (isConfirmed.value) return false;
  const baseFilled = team1.value.length === 5 && team2.value.length === 5;
  if (!baseFilled) return false;

  // POSITION 모드면 모든 슬롯에 player 채워져 있어야 함
  if (match.value?.type === 'POSITION') {
    return team1.value.every((m) => m.player?.id) && team2.value.every((m) => m.player?.id);
  }
  return t1Total.value > 0 || t2Total.value > 0;
});

const isFinished = computed<boolean>(() => {
  const serverWinner = match.value?.winner_team;
  return (
    serverWinner === 1 || serverWinner === 2 || winnerTeam.value === 1 || winnerTeam.value === 2
  );
});

const canShot = computed<boolean>(() => !isConfirmed.value);

const canSaveWinner = computed<boolean>(
  () => isConfirmed.value && (winnerTeam.value === 1 || winnerTeam.value === 2)
);

// ✅ 확정 상태/다이얼로그/스낵바
const confirm = ref({ open: false, loading: false });
const snackbar = ref({ show: false, msg: '' });

function openConfirm() {
  if (!canConfirm.value) {
    snackbar.value = { show: true, msg: '먼저 SHOT으로 팀을 섞어주세요.' };
    return;
  }
  confirm.value.open = true;
}

async function handleConfirm() {
  try {
    confirm.value.loading = true;

    const match_members: MatchMember[] = [...team1.value, ...team2.value];

    await api.post(`${getBaseUrl('DATA')}/match/update`, {
      id: +route.params.id,
      is_confirm: true,
      match_members,
    });

    // ✅ 서버 성공 후 로컬 상태를 명확히 true로
    isConfirmed.value = true;
    if (match.value) match.value.is_confirm = true;

    snackbar.value = { show: true, msg: '팀 구성이 확정되었습니다.' };
    confirm.value.open = false;
  } catch (e) {
    console.error(e);
    snackbar.value = { show: true, msg: '확정 처리에 실패했습니다.' };
  } finally {
    confirm.value.loading = false;
  }
}

async function saveWinner() {
  //if (!isConfirmed.value || isFinished.value) return;
  try {
    winnerSaving.value = true;
    await api.post(`${getBaseUrl('DATA')}/match/update`, {
      id: +route.params.id,
      winner_team: winnerTeam.value,
    });
    if (match.value) match.value.winner_team = winnerTeam.value as 1 | 2;
    snackbar.value = { show: true, msg: `승리 팀이 ${winnerTeam.value}팀으로 저장되었습니다.` };
  } catch (e) {
    console.error(e);
    snackbar.value = { show: true, msg: '승리 팀 저장에 실패했습니다.' };
  } finally {
    winnerSaving.value = false;
  }
}

function emptyMember(): MatchMember {
  return {
    id: 0,
    order: '' as any,
    create_at: '' as any,
    position: null as any,
    player: {
      id: 0,
      nickname: '',
      tagname: '',
      point: 0,
      create_at: '' as any,
      tier: {
        id: 0,
        name: '',
        point: 0,
        code: 0 as any,
        create_at: '' as any,
        updated_at: '' as any,
      },
    } as any,
  } as any;
}

// ▼ 추가: 플레이어 픽커(다이얼로그) 상태
type TeamKey = 't1' | 't2';
const picker = ref<{
  open: boolean;
  team: TeamKey | null;
  id: number;
  selected: MatchMember | null;
}>({
  open: false,
  team: null,
  id: -1,
  selected: null,
});

// ▼ 추가: 이미 선택된 player id 집합
const pickedIds = computed(() => {
  const s = new Set<number>();
  team1.value.forEach((m) => m?.player?.id && s.add(m.player.id));
  team2.value.forEach((m) => m?.player?.id && s.add(m.player.id));
  return s;
});

// const pickedIds = computed(() => {
//   const s = new Set<number>();
//   [...team1.value, ...team2.value].forEach((m) => {
//     if (m?.id && m.id !== 0) s.add(m.id);
//   });
//   return s;
// });

// ▼ 추가: 현재 다이얼로그에서 선택 가능한 후보(중복 방지)
const availableMembers = computed(() =>
  allPositionMembers.value.filter((m) => !pickedIds.value.has(m.player.id))
);

// ▼ 추가: 다이얼로그 열기
function openPlayerPicker(team: TeamKey, id: number) {
  if (isConfirmed.value) return;

  const slotArr = team === 't1' ? team1.value : team2.value;
  const target = slotArr[id];

  // 이미 유저가 선택되어 있으면 => 클릭 시 해제
  if (target?.player?.id && target.player.id !== 0) {
    slotArr[id] = {
      ...emptyMemberWithPos(target.position as any), // 포지션 유지한 빈 슬롯으로 교체
    };
    updateTotals();
    snackbar.value = { show: true, msg: '선택이 해제되었습니다.' };
    return;
  }

  // 평소처럼 다이얼로그 오픈
  picker.value = { open: true, team, id, selected: null };
}

// ▼ 추가: 선택 적용
function applyPickedPlayer() {
  if (!picker.value.team || picker.value.id < 0 || !picker.value.selected) return;

  const slotArr = picker.value.team === 't1' ? team1.value : team2.value;
  const oldSlot = slotArr[picker.value.id];
  if (!oldSlot) return;

  // 포지션은 슬롯에 고정해둔 값 유지
  const keepPos = oldSlot.position ?? null;

  // ✅ MatchMember 전체 교체: id/created_at 등도 같이 들어옴
  const chosen = picker.value.selected;
  slotArr[picker.value.id] = {
    ...chosen,
    position: keepPos, // 포지션만 슬롯 기준으로 유지
  } as MatchMember;

  updateTotals();
  picker.value.open = false;
}

onMounted(fetch);
</script>

<style scoped>
.text-center {
  text-align: center;
}
.text-wrap {
  white-space: normal !important;
  word-break: break-word;
}

.full-width-table {
  border-collapse: collapse;
}
.full-width-table th,
.full-width-table td {
  text-align: center;
  vertical-align: middle;
  border: 1px solid #444;
  padding: 8px;
}
.full-width-table th,
.full-width-table td {
  text-align: center;
  vertical-align: middle;
  border: 1px solid #444;
  padding: 8px;
}

/* 포지션 아이콘용 */
.pos-icon-wrapper {
  width: 28px;
  height: 28px;
  margin: 0 auto;
  border-radius: 6px;
  overflow: hidden; /* 이미지 밖 부분 잘라내기 */
}
</style>
