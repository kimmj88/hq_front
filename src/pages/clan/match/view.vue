<template>
  <v-container fluid class="match-page">
    <section class="match-hero">
      <div>
        <div class="match-label">10인 내전</div>
        <h1>{{ match?.type }}{{ match?.name ? ` (${match.name})` : '' }}</h1>
        <p>팀 밸런스를 확인하고 SHOT으로 재배치한 뒤 확정할 수 있습니다.</p>
      </div>

      <div class="match-actions">
        <v-btn
          v-if="can('MATCH', 'CLAN-SET-MATCH-C')"
          color="primary"
          size="large"
          rounded="xl"
          prepend-icon="mdi-shuffle"
          :disabled="!canShot"
          @click="onShot"
        >
          SHOT
        </v-btn>

        <v-btn
          v-if="can('MATCH', 'CLAN-SET-MATCH-C')"
          color="success"
          size="large"
          rounded="xl"
          prepend-icon="mdi-check"
          :disabled="!canConfirm"
          @click="openConfirm"
        >
          확정
        </v-btn>
      </div>
    </section>

    <section class="score-board">
      <div class="team-score team-blue">
        <div class="team-title">1팀</div>
        <div class="team-total">{{ t1Total }}</div>
        <div class="team-detail">Point {{ t1Point }} · Tier {{ t1Tier }}</div>
      </div>

      <div class="versus-box">
        <div class="versus">VS</div>
        <v-chip
          size="large"
          :color="t1Total === t2Total ? 'grey' : t1Total > t2Total ? 'success' : 'error'"
          variant="flat"
        >
          {{
            t1Total === t2Total
              ? '⚖️ 동점'
              : t1Total > t2Total
              ? `1팀 우세 +${t1Total - t2Total}`
              : `2팀 우세 +${t2Total - t1Total}`
          }}
        </v-chip>
      </div>

      <div class="team-score team-red">
        <div class="team-title">2팀</div>
        <div class="team-total">{{ t2Total }}</div>
        <div class="team-detail">Point {{ t2Point }} · Tier {{ t2Tier }}</div>
      </div>
    </section>

    <section class="winner-panel">
      <v-btn
        prepend-icon="mdi-trophy"
        :disabled="!isConfirmed || winnerSaving || isFinished"
        :loading="winnerSaving && winnerTeam === 1"
        :color="winnerTeam === 1 ? 'success' : 'primary'"
        variant="flat"
        rounded="xl"
        @click="setWinner(1)"
      >
        1팀 승리
      </v-btn>

      <div class="winner-help">
        {{ !isConfirmed ? '팀을 확정하면 승리 버튼이 활성화됩니다.' : '승리 팀을 선택하세요.' }}
      </div>

      <v-btn
        prepend-icon="mdi-trophy"
        :disabled="!isConfirmed || winnerSaving || isFinished"
        :loading="winnerSaving && winnerTeam === 2"
        :color="winnerTeam === 2 ? 'error' : 'primary'"
        variant="flat"
        rounded="xl"
        @click="setWinner(2)"
      >
        2팀 승리
      </v-btn>
    </section>

    <section class="line-board">
      <div v-for="i in team1.length" :key="i" class="line-row">
        <div
          class="player-card player-card-blue"
          :class="getPlayerButtonClass(team1[i - 1]?.player)"
          @click="openPlayerPicker('t1', i - 1)"
        >
          <div class="player-top">
            <span class="team-badge">1팀</span>
            <span
              class="tier-text"
              :style="{ color: getTierColor(team1[i - 1]?.player?.tier?.name) }"
            >
              {{ team1[i - 1]?.player?.tier?.name || 'EMPTY' }}
            </span>
          </div>

          <div class="player-name">
            {{
              team1[i - 1]?.player?.nickname
                ? `${team1[i - 1].player.nickname}#${team1[i - 1].player.tagname}`
                : match?.type === 'POSITION'
                ? '유저 선택'
                : '—'
            }}
          </div>

          <div class="player-score">
            <span>Point {{ team1[i - 1]?.player?.point ?? 0 }}</span>
            <span>
              Total
              {{ (team1[i - 1]?.player?.tier?.point ?? 0) + (team1[i - 1]?.player?.point ?? 0) }}
            </span>
          </div>

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
              <v-icon size="18">mdi-trophy</v-icon>
              <span>{{ team1[i - 1]?.player?.cup_count }}</span>
            </div>

            <div
              v-if="(team1[i - 1]?.player?.sub_cup_count ?? 0) > 0"
              class="award-chip award-chip--minor"
            >
              <v-icon size="18">mdi-star</v-icon>
              <span>{{ team1[i - 1]?.player?.sub_cup_count }}</span>
            </div>
          </div>
        </div>

        <div class="line-center">
          <div class="line-icon">
            <v-img :src="getPositionIcon(team1[i - 1].position)" width="34" height="34" />
          </div>
          <div class="line-name">{{ team1[i - 1].position }}</div>
        </div>

        <div
          class="player-card player-card-red"
          :class="getPlayerButtonClass(team2[i - 1]?.player)"
          @click="openPlayerPicker('t2', i - 1)"
        >
          <div class="player-top">
            <span
              class="tier-text"
              :style="{ color: getTierColor(team2[i - 1]?.player?.tier?.name) }"
            >
              {{ team2[i - 1]?.player?.tier?.name || 'EMPTY' }}
            </span>
            <span class="team-badge">2팀</span>
          </div>

          <div class="player-name">
            {{
              team2[i - 1]?.player?.nickname
                ? `${team2[i - 1].player.nickname}#${team2[i - 1].player.tagname}`
                : match?.type === 'POSITION'
                ? '유저 선택'
                : '—'
            }}
          </div>

          <div class="player-score">
            <span>Point {{ team2[i - 1]?.player?.point ?? 0 }}</span>
            <span>
              Total
              {{ (team2[i - 1]?.player?.tier?.point ?? 0) + (team2[i - 1]?.player?.point ?? 0) }}
            </span>
          </div>

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
              <v-icon size="18">mdi-trophy</v-icon>
              <span>{{ team2[i - 1]?.player?.cup_count }}</span>
            </div>

            <div
              v-if="(team2[i - 1]?.player?.sub_cup_count ?? 0) > 0"
              class="award-chip award-chip--minor"
            >
              <v-icon size="18">mdi-star</v-icon>
              <span>{{ team2[i - 1]?.player?.sub_cup_count }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <v-dialog v-model="confirm.open" max-width="520">
      <v-card rounded="xl">
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
      <v-card rounded="xl">
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
                  Point {{ item.raw.player.point }} · {{ item.raw.player.tier.name }} ({{
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
  </v-container>
</template>

<script lang="ts" setup>
const TIER_SCORE_MASTER = [
  { tier: 'CHALLENGER', top: 1800, jungle: 1850, mid: 1820, adc: 1830, support: 1720 },
  { tier: 'GRANDMASTER', top: 1300, jungle: 1350, mid: 1320, adc: 1330, support: 1220 },
  { tier: 'MASTER', top: 1250, jungle: 1300, mid: 1270, adc: 1280, support: 1180 },
  { tier: 'MASTER', top: 1175, jungle: 1225, mid: 1195, adc: 1205, support: 1110 },
  { tier: 'MASTER', top: 1100, jungle: 1150, mid: 1120, adc: 1130, support: 1040 },
  { tier: 'MASTER', top: 1000, jungle: 1050, mid: 1020, adc: 1030, support: 960 },
  { tier: 'DIAMOND I', top: 930, jungle: 970, mid: 945, adc: 955, support: 900 },
  { tier: 'DIAMOND II', top: 890, jungle: 930, mid: 905, adc: 915, support: 865 },
  { tier: 'DIAMOND III', top: 850, jungle: 890, mid: 865, adc: 875, support: 830 },
  { tier: 'DIAMOND IV', top: 810, jungle: 850, mid: 825, adc: 835, support: 795 },
  { tier: 'EMERALD I', top: 760, jungle: 795, mid: 775, adc: 785, support: 745 },
  { tier: 'EMERALD II', top: 730, jungle: 765, mid: 745, adc: 755, support: 715 },
  { tier: 'EMERALD III', top: 700, jungle: 735, mid: 715, adc: 725, support: 685 },
  { tier: 'EMERALD IV', top: 670, jungle: 705, mid: 685, adc: 695, support: 655 },
  { tier: 'PLATINUM I', top: 630, jungle: 660, mid: 645, adc: 650, support: 615 },
  { tier: 'PLATINUM II', top: 605, jungle: 635, mid: 620, adc: 625, support: 590 },
  { tier: 'PLATINUM III', top: 580, jungle: 610, mid: 595, adc: 600, support: 565 },
  { tier: 'PLATINUM IV', top: 555, jungle: 585, mid: 570, adc: 575, support: 540 },
  { tier: 'GOLD I', top: 525, jungle: 550, mid: 535, adc: 540, support: 515 },
  { tier: 'GOLD II', top: 505, jungle: 530, mid: 515, adc: 520, support: 495 },
  { tier: 'GOLD III', top: 485, jungle: 510, mid: 495, adc: 500, support: 475 },
  { tier: 'GOLD IV', top: 465, jungle: 490, mid: 475, adc: 480, support: 455 },
  { tier: 'SILVER I', top: 440, jungle: 460, mid: 450, adc: 455, support: 435 },
  { tier: 'SILVER II', top: 420, jungle: 440, mid: 430, adc: 435, support: 415 },
  { tier: 'SILVER III', top: 400, jungle: 420, mid: 410, adc: 415, support: 395 },
  { tier: 'SILVER IV', top: 380, jungle: 400, mid: 390, adc: 395, support: 375 },
  { tier: 'BRONZE I', top: 360, jungle: 380, mid: 370, adc: 375, support: 355 },
  { tier: 'BRONZE II', top: 345, jungle: 365, mid: 355, adc: 360, support: 340 },
  { tier: 'BRONZE III', top: 330, jungle: 350, mid: 340, adc: 345, support: 325 },
  { tier: 'BRONZE IV', top: 315, jungle: 335, mid: 325, adc: 330, support: 310 },
  { tier: 'IRON I', top: 0, jungle: 0, mid: 0, adc: 0, support: 0 },
  { tier: 'IRON II', top: 0, jungle: 0, mid: 0, adc: 0, support: 0 },
  { tier: 'IRON III', top: 0, jungle: 0, mid: 0, adc: 0, support: 0 },
  { tier: 'IRON IV', top: 0, jungle: 0, mid: 0, adc: 0, support: 0 },
  { tier: 'UNRANK', top: 0, jungle: 0, mid: 0, adc: 0, support: 0 },
];

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
  if (!tier) return '#94a3b8';
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

  return '#111827';
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

      for (const item of team1.value) {
        item.player.tier.point = getTierPositionPoint(item.player.tier.name, item.position);
      }

      for (const item of team2.value) {
        item.player.tier.point = getTierPositionPoint(item.player.tier.name, item.position);
      }
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

const POSITION_SCORE_KEY = {
  TOP: 'top',
  JUG: 'jungle',
  MID: 'mid',
  ADC: 'adc',
  SUP: 'support',
};

function getTierPositionPoint(tierName: string, position: string) {
  const row = TIER_SCORE_MASTER.find((v) => v.tier === tierName);

  if (!row) {
    return 0;
  }

  const key = POSITION_SCORE_KEY[position as keyof typeof POSITION_SCORE_KEY];

  return row[key as keyof typeof row] ?? 0;
}

function applyPickedPlayer() {
  if (!picker.value.team || picker.value.id < 0 || !picker.value.selected) return;

  const slotArr = picker.value.team === 't1' ? team1.value : team2.value;
  const oldSlot = slotArr[picker.value.id];
  if (!oldSlot) return;

  const keepPos = oldSlot.position;
  const chosen = picker.value.selected;

  chosen.player.tier.point = getTierPositionPoint(chosen.player.tier.name, keepPos);

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
.match-page {
  max-width: 1180px;
  margin: 0 auto;
  padding: 28px 16px 48px;
}

.match-hero {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
  padding: 30px;
  border-radius: 30px;
  background: radial-gradient(circle at top left, rgba(99, 102, 241, 0.34), transparent 34%),
    radial-gradient(circle at bottom right, rgba(14, 165, 233, 0.22), transparent 36%),
    linear-gradient(135deg, #111827, #1f2937);
  color: white;
  box-shadow: 0 22px 48px rgba(15, 23, 42, 0.24);
}

.match-label {
  display: inline-flex;
  padding: 6px 13px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.14);
  font-size: 13px;
  font-weight: 800;
  margin-bottom: 10px;
}

.match-hero h1 {
  margin: 0;
  font-size: 34px;
  font-weight: 950;
  letter-spacing: -0.5px;
}

.match-hero p {
  margin: 8px 0 0;
  color: rgba(255, 255, 255, 0.72);
}

.match-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.score-board {
  display: grid;
  grid-template-columns: 1fr 180px 1fr;
  gap: 16px;
  margin: 22px 0;
}

.team-score {
  padding: 24px;
  border-radius: 26px;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(148, 163, 184, 0.25);
  box-shadow: 0 14px 34px rgba(15, 23, 42, 0.08);
}

.team-blue {
  border-left: 7px solid #3b82f6;
}

.team-red {
  border-left: 7px solid #ef4444;
}

.team-title {
  font-size: 15px;
  font-weight: 900;
  color: #64748b;
}

.team-total {
  font-size: 44px;
  font-weight: 950;
  line-height: 1;
  margin-top: 9px;
  color: #0f172a;
}

.team-detail {
  margin-top: 8px;
  font-size: 14px;
  font-weight: 700;
  color: #64748b;
}

.versus-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 11px;
}

.versus {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: #0f172a;
  color: white;
  font-size: 22px;
  font-weight: 950;
  box-shadow: 0 16px 34px rgba(15, 23, 42, 0.24);
}

.winner-panel {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 14px;
  align-items: center;
  padding: 16px;
  margin-bottom: 20px;
  border-radius: 24px;
  background: #f8fafc;
  border: 1px solid rgba(148, 163, 184, 0.24);
}

.winner-panel > .v-btn:first-child {
  justify-self: end;
}

.winner-panel > .v-btn:last-child {
  justify-self: start;
}

.winner-help {
  color: #64748b;
  font-size: 14px;
  font-weight: 700;
  text-align: center;
}

.line-board {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.line-row {
  display: grid;
  grid-template-columns: 1fr 112px 1fr;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border-radius: 28px;
  background: rgba(248, 250, 252, 0.92);
  border: 1px solid rgba(148, 163, 184, 0.25);
  box-shadow: 0 10px 26px rgba(15, 23, 42, 0.06);
}

.line-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 7px;
}

.line-icon {
  width: 58px;
  height: 58px;
  border-radius: 20px;
  display: grid;
  place-items: center;
  background: radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.18), transparent 38%),
    #111827;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08);
}

.line-name {
  font-size: 13px;
  font-weight: 950;
  color: #475569;
}

.player-card {
  min-height: 132px;
  padding: 18px;
  border-radius: 24px;
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease, filter 0.18s ease;
  overflow: hidden;
  position: relative;
}

.player-card:hover {
  transform: translateY(-2px);
  filter: brightness(1.03);
}

.player-card-blue {
  border-left: 6px solid rgba(59, 130, 246, 0.8);
}

.player-card-red {
  border-right: 6px solid rgba(239, 68, 68, 0.8);
}

.player-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.team-badge {
  display: inline-flex;
  align-items: center;
  height: 24px;
  padding: 0 10px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.12);
  font-size: 12px;
  font-weight: 900;
}

.tier-text {
  font-size: 14px;
  font-weight: 950;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
}

.player-name {
  margin-top: 14px;
  font-size: 19px;
  font-weight: 950;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.player-score {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-top: 12px;
  font-size: 13px;
  font-weight: 800;
  opacity: 0.86;
}

.player-awards {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  flex-wrap: wrap;
}

.award-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 900;
}

.award-chip--major {
  background: linear-gradient(135deg, #fff0a8 0%, #f0c654 45%, #b78016 100%);
  color: #2d2108;
}

.award-chip--minor {
  background: linear-gradient(135deg, #eef5ff 0%, #bfd7ff 45%, #7ba7eb 100%);
  color: #10233f;
}

.player-default {
  background: linear-gradient(180deg, #5b6472, #434c5a);
  color: #f8fafc;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06), 0 8px 18px rgba(0, 0, 0, 0.16);
}

.player-major {
  background: linear-gradient(135deg, #f7d774 0%, #d4a62f 45%, #8f6715 100%);
  color: #2d2108;
  box-shadow: 0 0 0 1px rgba(255, 221, 120, 0.55), 0 0 18px rgba(255, 196, 46, 0.26),
    inset 0 1px 0 rgba(255, 250, 220, 0.55);
}

.player-legend {
  background: linear-gradient(135deg, #fff0a8 0%, #f0c654 30%, #b78016 68%, #6f4b08 100%);
  color: #241700;
  box-shadow: 0 0 0 1px rgba(255, 223, 120, 0.7), 0 0 24px rgba(255, 196, 46, 0.34),
    inset 0 1px 0 rgba(255, 255, 240, 0.7);
  animation: legendGlow 2s ease-in-out infinite;
}

.player-minor {
  background: linear-gradient(135deg, #dbe7ff 0%, #9ec0ff 40%, #6f97d8 100%);
  color: #10233f;
  box-shadow: 0 0 0 1px rgba(173, 210, 255, 0.45), 0 0 14px rgba(120, 180, 255, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.5);
}

.player-minor-elite {
  background: linear-gradient(135deg, #eef5ff 0%, #bfd7ff 30%, #7ba7eb 70%, #557fbe 100%);
  color: #0f2545;
  box-shadow: 0 0 0 1px rgba(173, 210, 255, 0.55), 0 0 18px rgba(120, 180, 255, 0.22),
    inset 0 1px 0 rgba(255, 255, 255, 0.55);
}

@keyframes legendGlow {
  0% {
    box-shadow: 0 0 0 1px rgba(255, 223, 120, 0.7), 0 0 20px rgba(255, 196, 46, 0.3),
      inset 0 1px 0 rgba(255, 255, 240, 0.7);
  }

  50% {
    box-shadow: 0 0 0 1px rgba(255, 223, 120, 0.85), 0 0 34px rgba(255, 196, 46, 0.48),
      inset 0 1px 0 rgba(255, 255, 240, 0.86);
  }

  100% {
    box-shadow: 0 0 0 1px rgba(255, 223, 120, 0.7), 0 0 20px rgba(255, 196, 46, 0.3),
      inset 0 1px 0 rgba(255, 255, 240, 0.7);
  }
}

@media (max-width: 900px) {
  .match-hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .match-actions {
    justify-content: flex-start;
  }

  .score-board {
    grid-template-columns: 1fr;
  }

  .winner-panel {
    grid-template-columns: 1fr;
  }

  .winner-panel > .v-btn:first-child,
  .winner-panel > .v-btn:last-child {
    justify-self: stretch;
  }

  .line-row {
    grid-template-columns: 1fr;
  }

  .line-center {
    order: -1;
  }
}
</style>
