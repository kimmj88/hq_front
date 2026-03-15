<template>
  <v-container>
    <h1 class="text-center mb-4">{{ match?.type }}{{ `(${match?.name})` }}</h1>

    <div class="d-flex justify-center gap-2 mb-2">
      <v-btn
        v-if="can('MATCH', 'CLAN-SET-MATCH-C')"
        color="indigo"
        @click="onShot"
        :disabled="!canShot"
      >
        SHOT
      </v-btn>

      <v-btn
        v-if="can('MATCH', 'CLAN-SET-MATCH-C')"
        color="success"
        :disabled="!canConfirm"
        @click="openConfirm"
        prepend-icon="mdi-check"
      >
        확정
      </v-btn>
    </div>

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
            <v-btn
              size="small"
              prepend-icon="mdi-trophy"
              :disabled="!isConfirmed || winnerSaving || isFinished"
              :loading="winnerSaving && winnerTeam === 1"
              :color="
                !isConfirmed
                  ? 'grey-darken-1'
                  : winnerTeam === 1
                  ? 'success'
                  : isFinished
                  ? 'grey-darken-1'
                  : 'primary'
              "
              :variant="
                !isConfirmed
                  ? 'tonal'
                  : winnerTeam === 1
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
                  : winnerTeam === 2
                  ? 'error'
                  : isFinished
                  ? 'grey-darken-1'
                  : 'primary'
              "
              :variant="
                !isConfirmed
                  ? 'tonal'
                  : winnerTeam === 2
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
            <th>Position</th>
            <th>1팀</th>
            <th>Point</th>
            <th>Tier Point</th>
            <th>Tier</th>
            <th>Tier</th>
            <th>Tier Point</th>
            <th>Point</th>
            <th>2팀</th>
            <th>Position</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="i in team1.length" :key="i">
            <td>
              <div class="pos-icon-wrapper">
                <v-img :src="getPositionIcon(team1[i - 1].position)" width="26" height="26" cover />
              </div>
            </td>

            <!-- 1팀 -->
            <td>
              <div class="player-slot">
                <v-btn
                  small
                  block
                  class="text-wrap player-btn"
                  :class="getPlayerButtonClass(team1[i - 1]?.player)"
                  :disabled="isConfirmed"
                  @click="openPlayerPicker('t1', i - 1)"
                >
                  <span class="player-name">
                    {{
                      team1[i - 1]?.player?.nickname
                        ? `${team1[i - 1].player.nickname}#${team1[i - 1].player.tagname}`
                        : match?.type === 'POSITION'
                        ? '유저 선택'
                        : '—'
                    }}
                  </span>
                </v-btn>

                <div
                  v-if="
                    (team1[i - 1]?.player?.cup_count ?? 0) > 0 ||
                    (team1[i - 1]?.player?.sub_cup_count ?? 0) > 0
                  "
                  class="player-awards"
                >
                  <div
                    v-if="(team1[i - 1]?.player?.cup_count ?? 0) > 0"
                    class="award-chip award-chip--major"
                  >
                    <v-icon size="24">mdi-trophy</v-icon>
                    <span>{{ team1[i - 1]?.player?.cup_count }}</span>
                  </div>

                  <div
                    v-if="(team1[i - 1]?.player?.sub_cup_count ?? 0) > 0"
                    class="award-chip award-chip--minor"
                  >
                    <v-icon size="22">mdi-star</v-icon>
                    <span>{{ team1[i - 1]?.player?.sub_cup_count }}</span>
                  </div>
                </div>
              </div>
            </td>

            <td>{{ team1[i - 1]?.player?.point }}</td>
            <td>
              {{ (team1[i - 1]?.player?.tier?.point ?? 0) + (team1[i - 1]?.player?.point ?? 0) }}
            </td>

            <td>
              <span
                :style="{
                  color: getTierColor(team1[i - 1]?.player?.tier?.name),
                  fontWeight: 'bold',
                }"
              >
                {{ team1[i - 1]?.player?.tier?.name }}
              </span>
            </td>

            <td>
              <span
                :style="{
                  color: getTierColor(team2[i - 1]?.player?.tier?.name),
                  fontWeight: 'bold',
                }"
              >
                {{ team2[i - 1]?.player?.tier?.name }}
              </span>
            </td>

            <td>
              {{ (team2[i - 1]?.player?.tier?.point ?? 0) + (team2[i - 1]?.player?.point ?? 0) }}
            </td>
            <td>{{ team2[i - 1]?.player?.point }}</td>

            <!-- 2팀 -->
            <td>
              <div class="player-slot">
                <v-btn
                  small
                  block
                  class="text-wrap player-btn"
                  :class="getPlayerButtonClass(team2[i - 1]?.player)"
                  :disabled="isConfirmed"
                  @click="openPlayerPicker('t2', i - 1)"
                >
                  <span class="player-name">
                    {{
                      team2[i - 1]?.player?.nickname
                        ? `${team2[i - 1].player.nickname}#${team2[i - 1].player.tagname}`
                        : match?.type === 'POSITION'
                        ? '유저 선택'
                        : '—'
                    }}
                  </span>
                </v-btn>

                <div
                  v-if="
                    (team2[i - 1]?.player?.cup_count ?? 0) > 0 ||
                    (team2[i - 1]?.player?.sub_cup_count ?? 0) > 0
                  "
                  class="player-awards"
                >
                  <div
                    v-if="(team2[i - 1]?.player?.cup_count ?? 0) > 0"
                    class="award-chip award-chip--major"
                  >
                    <v-icon size="24">mdi-trophy</v-icon>
                    <span>{{ team2[i - 1]?.player?.cup_count }}</span>
                  </div>

                  <div
                    v-if="(team2[i - 1]?.player?.sub_cup_count ?? 0) > 0"
                    class="award-chip award-chip--minor"
                  >
                    <v-icon size="22">mdi-star</v-icon>
                    <span>{{ team2[i - 1]?.player?.sub_cup_count }}</span>
                  </div>
                </div>
              </div>
            </td>

            <td>
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
          <v-btn color="success" :loading="confirm.loading" @click="handleConfirm"> 확정 </v-btn>
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

                <template #append>
                  <div class="d-flex flex-wrap" style="gap: 4px">
                    <v-chip
                      v-for="pos in item.raw.player.positions ?? []"
                      :key="pos.id"
                      size="x-small"
                      color="primary"
                      variant="tonal"
                    >
                      {{ pos.name }}
                    </v-chip>
                  </div>
                </template>
              </v-list-item>
            </template>
          </v-autocomplete>

          <div class="text-caption mt-2">이미 양 팀에 배치된 유저는 목록에서 자동 제외돼요.</div>
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn variant="text" @click="picker.open = false">취소</v-btn>
          <v-btn color="primary" :disabled="!picker.selected" @click="applyPickedPlayer">
            적용
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

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

import { can } from '@/stores/useClanPermissionStore';
import { getBaseUrl } from '@/@core/composable/createUrl';
import { computed, onMounted, ref } from 'vue';
import api from '@/@core/composable/useAxios';
import { useRoute } from 'vue-router';
import type { Match, MatchMember } from '@/data/types/match';
import { useAccountStore } from '@/stores/useAccountStore';

const account = useAccountStore();
const route = useRoute();

const team1 = ref<MatchMember[]>([]);
const team2 = ref<MatchMember[]>([]);
const allPositionMembers = ref<MatchMember[]>([]);

const match = ref<Match | null>(null);
const winnerTeam = ref<number | null>(null);
const winnerSaving = ref(false);

const t1Point = ref(0);
const t1Tier = ref(0);
const t2Point = ref(0);
const t2Tier = ref(0);
const t1Total = ref(0);
const t2Total = ref(0);

const isConfirmed = ref<boolean>(false);
const confirm = ref({ open: false, loading: false });
const snackbar = ref({ show: false, msg: '' });

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

let POSITIONS: any[] = [];
const ROW_POSITIONS = ['TOP', 'JUG', 'MID', 'ADC', 'SUP'] as const;

function getPlayerButtonClass(player?: any) {
  const major = Number(player?.cup_count ?? 0);
  const minor = Number(player?.sub_cup_count ?? 0);

  if (major >= 3) return 'player-legend';
  if (major >= 1) return 'player-major';
  if (minor >= 3) return 'player-minor-elite';
  if (minor >= 1) return 'player-minor';
  return 'player-default';
}

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

function truthy(v: any): boolean {
  return v === true || v === 'true' || v === 't' || v === 1 || v === '1';
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

function orderKey(m: MatchMember): number {
  const raw: any = (m as any).order;
  const n = Number(raw);
  if (!Number.isNaN(n)) return n;

  const digits = String(raw ?? '').match(/\d+/)?.[0];
  if (digits) return Number(digits);

  return 9999;
}

const memberTitle = (m: MatchMember) => `${m.player.nickname}#${m.player.tagname}`;

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

function shuffleTeams() {
  if (match.value?.type !== 'POSITION') {
    const players = [...team1.value, ...team2.value]
      .map((m) => m.player)
      .filter((p) => p?.id && p.id !== 0);

    for (let i = players.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [players[i], players[j]] = [players[j], players[i]];
    }

    team1.value = ROW_POSITIONS.map((pos, idx) => ({
      ...team1.value[idx],
      position: pos as any,
      player: players[idx] ?? emptyMember().player,
    }));

    team2.value = ROW_POSITIONS.map((pos, idx) => ({
      ...team2.value[idx],
      position: pos as any,
      player: players[idx + 5] ?? emptyMember().player,
    }));

    updateTotals();
    return;
  }

  for (const pos of POSITIONS) {
    const idx1 = team1.value.findIndex((m) => m.position === pos);
    const idx2 = team2.value.findIndex((m) => m.position === pos);

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

function onShot() {
  shuffleTeams();
  updateTotals();
}

async function fetch() {
  POSITIONS.length = 0;

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

  const members: MatchMember[] = data.datas.match_members ?? [];
  allPositionMembers.value = members;

  if (match.value?.type === 'POSITION') {
    if (truthy(match.value?.is_confirm)) {
      team1.value = members.slice(0, 5);
      team2.value = members.slice(5, 10);
    } else {
      team1.value = POSITIONS.map((p) => emptyMemberWithPos(p));
      team2.value = POSITIONS.map((p) => emptyMemberWithPos(p));
    }
  } else {
    const membersSorted = [...members].sort((a, b) => orderKey(a) - orderKey(b));

    team1.value = ROW_POSITIONS.map((pos, idx) => {
      const m = membersSorted[idx] ?? emptyMember();
      return { ...m, position: pos as any };
    });

    team2.value = ROW_POSITIONS.map((pos, idx) => {
      const m = membersSorted[idx + 5] ?? emptyMember();
      return { ...m, position: pos as any };
    });
  }

  updateTotals();
}

const canConfirm = computed(() => {
  if (isConfirmed.value) return false;

  const baseFilled = team1.value.length === 5 && team2.value.length === 5;
  if (!baseFilled) return false;

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

const pickedIds = computed(() => {
  const s = new Set<number>();
  team1.value.forEach((m) => m?.player?.id && s.add(m.player.id));
  team2.value.forEach((m) => m?.player?.id && s.add(m.player.id));
  return s;
});

const availableMembers = computed(() =>
  allPositionMembers.value.filter((m) => !pickedIds.value.has(m.player.id))
);

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
      type: match.value?.type,
      match_members,
    });

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

function openPlayerPicker(team: TeamKey, id: number) {
  if (isConfirmed.value) return;

  const slotArr = team === 't1' ? team1.value : team2.value;
  const target = slotArr[id];

  if (target?.player?.id && target.player.id !== 0) {
    slotArr[id] = {
      ...emptyMemberWithPos(target.position as any),
    };
    updateTotals();
    snackbar.value = { show: true, msg: '선택이 해제되었습니다.' };
    return;
  }

  picker.value = { open: true, team, id, selected: null };
}

function applyPickedPlayer() {
  if (!picker.value.team || picker.value.id < 0 || !picker.value.selected) return;

  const slotArr = picker.value.team === 't1' ? team1.value : team2.value;
  const oldSlot = slotArr[picker.value.id];
  if (!oldSlot) return;

  const keepPos = oldSlot.position ?? null;
  const chosen = picker.value.selected;

  slotArr[picker.value.id] = {
    ...chosen,
    position: keepPos,
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

.pos-icon-wrapper {
  width: 28px;
  height: 28px;
  margin: 0 auto;
  border-radius: 6px;
  overflow: hidden;
}

.player-slot {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  min-width: 180px;
}

.player-btn {
  min-height: 46px;
  width: 100%;
  border-radius: 999px !important;
  transition: transform 0.18s ease, box-shadow 0.18s ease, filter 0.18s ease;
}

.player-btn:hover {
  transform: translateY(-1px);
}

.player-name {
  display: inline-block;
  width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 700;
  letter-spacing: 0.2px;
}

/* 버튼 아래 업적 표시줄 */
.player-awards {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  min-height: 30px;
  flex-wrap: wrap;
}

.award-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 800;
  line-height: 1;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.18);
}

.award-chip--major {
  background: linear-gradient(135deg, #fff0a8 0%, #f0c654 35%, #b78016 100%);
  color: #2d2108;
  border: 1px solid rgba(255, 223, 120, 0.55);
}

.award-chip--major .v-icon {
  color: #8b5e00;
  animation: trophyFloat 1.8s ease-in-out infinite;
}

.award-chip--minor {
  background: linear-gradient(135deg, #eef5ff 0%, #bfd7ff 35%, #7ba7eb 100%);
  color: #10233f;
  border: 1px solid rgba(173, 210, 255, 0.5);
}

.award-chip--minor .v-icon {
  color: #2d5ea8;
  animation: starPulse 2.2s ease-in-out infinite;
}

/* 기본 플레이어 */
/* 기본 플레이어 */
/* 기본 플레이어 */
.player-default {
  background: linear-gradient(180deg, #5b6472, #434c5a) !important;
  color: #f1f5f9 !important;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 4px 10px rgba(0, 0, 0, 0.16);
}

/* 난전 우승자 */
.player-major {
  background: linear-gradient(135deg, #f7d774 0%, #d4a62f 45%, #8f6715 100%) !important;
  color: #2d2108 !important;
  box-shadow: 0 0 0 1px rgba(255, 221, 120, 0.55), 0 0 14px rgba(255, 196, 46, 0.32),
    0 0 28px rgba(255, 196, 46, 0.16), inset 0 1px 0 rgba(255, 250, 220, 0.55);
}

/* 난전 다관왕 */
.player-legend {
  background: linear-gradient(
    135deg,
    #fff0a8 0%,
    #f0c654 30%,
    #b78016 68%,
    #6f4b08 100%
  ) !important;
  color: #241700 !important;
  box-shadow: 0 0 0 1px rgba(255, 223, 120, 0.7), 0 0 18px rgba(255, 196, 46, 0.38),
    0 0 34px rgba(255, 196, 46, 0.22), inset 0 1px 0 rgba(255, 255, 240, 0.7);
  animation: legendGlow 2s ease-in-out infinite;
}

/* 경매 우승자 */
.player-minor {
  background: linear-gradient(135deg, #dbe7ff 0%, #9ec0ff 40%, #6f97d8 100%) !important;
  color: #10233f !important;
  box-shadow: 0 0 0 1px rgba(173, 210, 255, 0.45), 0 0 12px rgba(120, 180, 255, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.5);
}

/* 경매 다관왕 */
.player-minor-elite {
  background: linear-gradient(
    135deg,
    #eef5ff 0%,
    #bfd7ff 30%,
    #7ba7eb 70%,
    #557fbe 100%
  ) !important;
  color: #0f2545 !important;
  box-shadow: 0 0 0 1px rgba(173, 210, 255, 0.55), 0 0 14px rgba(120, 180, 255, 0.26),
    0 0 24px rgba(120, 180, 255, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.55);
}

@keyframes trophyFloat {
  0% {
    transform: translateY(0) scale(1);
    opacity: 0.9;
  }
  50% {
    transform: translateY(-2px) scale(1.08);
    opacity: 1;
  }
  100% {
    transform: translateY(0) scale(1);
    opacity: 0.9;
  }
}

@keyframes starPulse {
  0% {
    transform: scale(1);
    opacity: 0.85;
  }
  50% {
    transform: scale(1.12);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 0.85;
  }
}

@keyframes legendGlow {
  0% {
    box-shadow: 0 0 0 1px rgba(255, 223, 120, 0.7), 0 0 18px rgba(255, 196, 46, 0.32),
      0 0 34px rgba(255, 196, 46, 0.18), inset 0 1px 0 rgba(255, 255, 240, 0.7);
  }
  50% {
    box-shadow: 0 0 0 1px rgba(255, 223, 120, 0.82), 0 0 24px rgba(255, 196, 46, 0.45),
      0 0 42px rgba(255, 196, 46, 0.25), inset 0 1px 0 rgba(255, 255, 240, 0.85);
  }
  100% {
    box-shadow: 0 0 0 1px rgba(255, 223, 120, 0.7), 0 0 18px rgba(255, 196, 46, 0.32),
      0 0 34px rgba(255, 196, 46, 0.18), inset 0 1px 0 rgba(255, 255, 240, 0.7);
  }
}
</style>
