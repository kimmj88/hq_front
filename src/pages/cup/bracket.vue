<template>
  <v-container class="py-6">
    <v-row>
      <!-- 🔹 왼쪽: 팀 풀 -->
      <v-col cols="12" md="4">
        <v-card class="pa-4" rounded="lg">
          <div class="d-flex justify-space-between align-center mb-2">
            <h3 class="text-subtitle-1 font-weight-medium mb-1">팀 순서 / 풀</h3>

            <!-- 초기화 / 셔플 버튼 -->
            <div class="d-flex" style="gap: 6px">
              <v-btn size="x-small" variant="tonal" color="grey" @click="resetAll"> 초기화 </v-btn>
              <v-btn
                size="x-small"
                variant="tonal"
                color="deep-purple-accent-2"
                @click="shufflePool"
              >
                섞기
              </v-btn>
            </div>
          </div>

          <p class="text-caption text-medium-emphasis mb-3">
            왼쪽 팀 카드를 드래그해서 오른쪽 첫 라운드 슬롯에 배치하세요. 오른쪽 카드도 다시
            왼쪽으로 드래그해서 돌려보낼 수 있습니다.
          </p>

          <draggable
            v-model="poolTeams"
            item-key="id"
            :group="dndGroup"
            handle=".drag-handle"
            animation="200"
            ghost-class="drag-ghost"
            chosen-class="drag-chosen"
          >
            <template #item="{ element, index }">
              <div class="team-slot-row">
                <div class="seed-chip mr-2">
                  {{ index + 1 }}
                </div>

                <v-card class="flex-grow-1 py-2 px-3" rounded="lg">
                  <div class="d-flex justify-space-between align-center">
                    <span class="text-body-2 font-weight-medium">
                      {{ element.name }}
                    </span>
                    <span class="text-caption text-disabled">ID: {{ element.id }}</span>
                  </div>
                </v-card>

                <!-- 드래그 핸들 -->
                <v-icon class="ml-2 drag-handle" size="18"> mdi-drag-vertical </v-icon>

                <!-- 삭제 버튼 -->
                <!-- <v-btn
                  icon
                  size="x-small"
                  variant="text"
                  class="ml-1"
                  @click.stop="removeFromPool(element.id)"
                >
                  <v-icon size="16" color="red-lighten-2">mdi-close</v-icon>
                </v-btn> -->
              </div>
            </template>
          </draggable>
        </v-card>
      </v-col>

      <!-- 🔹 오른쪽: 라운드들 (16강/8강/4강/결승) -->
      <v-col cols="12" md="8">
        <v-card class="pa-4" rounded="lg">
          <!-- 첫 라운드 (드래그 가능) -->
          <div v-if="rounds.length">
            <h3 class="text-subtitle-2 mb-3">
              {{ rounds[0].label }} 매치 설정 (카드 끌어다 넣기 + 승자 선택)
            </h3>

            <v-row>
              <v-col
                v-for="(match, mIdx) in rounds[0].matches"
                :key="'r0-m' + mIdx"
                cols="12"
                md="6"
                class="mb-4"
              >
                <div class="match-card">
                  <div class="match-header text-caption text-medium-emphasis mb-1">
                    Match {{ mIdx + 1 }}
                  </div>

                  <draggable
                    v-model="rounds[0].matches[mIdx].teams"
                    item-key="id"
                    :group="dndGroup"
                    :move="onMove"
                    animation="200"
                    ghost-class="drag-ghost"
                    chosen-class="drag-chosen"
                  >
                    <template #item="{ element, index: teamIdx }">
                      <div
                        class="team-slot-row"
                        :class="{
                          'team-slot-row--winner': winnerIndexes[0][mIdx] === teamIdx,
                        }"
                        @click="selectWinner(0, mIdx, teamIdx)"
                      >
                        <v-card class="flex-grow-1 py-2 px-3" rounded="lg">
                          <div class="d-flex justify-space-between align-center">
                            <span class="text-body-2 font-weight-medium">
                              {{ element.name }}
                            </span>
                            <span class="text-caption text-disabled"> ID: {{ element.id }} </span>
                          </div>
                        </v-card>
                      </div>
                    </template>

                    <template #footer>
                      <div
                        v-if="match.teams.length < 2"
                        class="empty-slot text-caption text-disabled mt-1"
                      >
                        {{ 2 - match.teams.length }}개 팀을 더 배치할 수 있습니다.
                      </div>
                    </template>
                  </draggable>
                </div>
              </v-col>
            </v-row>

            <!-- 첫 라운드 → 두 번째 라운드 버튼 -->
            <v-alert class="mt-4" type="info" density="comfortable" variant="tonal">
              {{ rounds[0].label }}에서 승자를 선택하고 남은 팀(부전승 팀)까지 합쳐서
              <strong>{{ nextRoundLabel(0) }}에 필요한 팀 수</strong>가 맞으면
              {{ nextRoundLabel(0) }} 대진을 생성할 수 있습니다.
            </v-alert>

            <v-btn
              class="mt-2"
              color="deep-purple-accent-4"
              variant="flat"
              rounded="pill"
              :disabled="!canBuildNext(0)"
              @click="buildNextRound(0)"
            >
              {{ nextRoundLabel(0) }} 대진 생성
            </v-btn>
          </div>

          <!-- 나머지 라운드들 (클릭만) -->
          <template v-for="(round, rIndex) in rounds.slice(1)" :key="round.key">
            <v-row class="mt-6" v-if="round.matches.some((m:any) => m.teams.length)">
              <v-col cols="12">
                <h3 class="text-subtitle-2 mb-3">{{ round.label }}</h3>
              </v-col>

              <v-col
                v-for="(match, mIdx) in round.matches"
                :key="round.key + '-m' + mIdx"
                cols="12"
                md="6"
                class="mb-4"
              >
                <div class="match-card">
                  <div class="match-header text-caption text-medium-emphasis mb-1">
                    {{ round.label }} Match {{ mIdx + 1 }}
                  </div>

                  <div
                    v-for="(team, tIdx) in match.teams"
                    :key="team.id"
                    class="team-slot-row"
                    :class="{
                      'team-slot-row--winner': winnerIndexes[rIndex + 1][mIdx] === tIdx,
                    }"
                    @click="selectWinner(rIndex + 1, mIdx, tIdx)"
                  >
                    <v-card class="flex-grow-1 py-2 px-3" rounded="lg">
                      <div class="d-flex justify-space-between align-center">
                        <span class="text-body-2 font-weight-medium">
                          {{ team.name }}
                        </span>
                        <span class="text-caption text-disabled"> ID: {{ team.id }} </span>
                      </div>
                    </v-card>
                  </div>
                </div>
              </v-col>
            </v-row>

            <!-- 마지막 라운드가 아니면: 다음 라운드 생성 버튼 -->
            <div
              v-if="!isLastRound(rIndex + 1) && round.matches.some((m:any) => m.teams.length)"
              class="mt-2"
            >
              <v-alert class="mt-2" type="info" density="comfortable" variant="tonal">
                {{ round.label }}의 모든 경기에서 승자를 선택하면
                <strong>{{ nextRoundLabel(rIndex + 1) }}</strong> 대진을 생성할 수 있습니다.
              </v-alert>

              <v-btn
                class="mt-2"
                color="deep-purple-accent-4"
                variant="flat"
                rounded="pill"
                :disabled="!canBuildNext(rIndex + 1)"
                @click="buildNextRound(rIndex + 1)"
              >
                {{ nextRoundLabel(rIndex + 1) }} 대진 생성
              </v-btn>
            </div>

            <!-- 마지막 라운드(결승)이라면: 우승팀 표시 -->
            <div
              v-else-if="isLastRound(rIndex + 1) && round.matches.some((m :any) => m.teams.length)"
              class="mt-4"
            >
              <div v-if="finalChampion" class="text-center mt-2">
                <div class="text-caption text-medium-emphasis mb-1">최종 우승팀</div>
                <v-chip color="amber" variant="flat" size="large">
                  🏆 {{ finalChampion.name }}
                </v-chip>

                <div class="mt-4 d-flex justify-center" style="gap: 8px">
                  <v-btn color="success" variant="flat" rounded="pill" @click="finishCup">
                    우승팀 확정
                  </v-btn>
                  <!-- <v-btn variant="tonal" rounded="pill" color="grey" @click="resetFinalWinner">
                    우승팀 재선택
                  </v-btn> -->
                </div>
              </div>
              <div v-else class="text-caption text-disabled text-center mt-2">
                결승 카드 중 하나를 클릭하면 우승팀이 결정됩니다.
              </div>
            </div>
          </template>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { getBaseUrl } from '@/@core/composable/createUrl';
import { computed, onMounted, ref } from 'vue';
import draggable from 'vuedraggable';
import api from '@/@core/composable/useAxios';
import { useRoute, useRouter } from 'vue-router';
import type { Cup, CupMatch, CupTeam } from '@/data/types/cup';

const route = useRoute();
const router = useRouter();

const cup = ref<Cup | null>(null);

type RoundKey = 'R16' | 'QF' | 'SF' | 'F';

interface Match {
  teams: CupTeam[];
}

interface Round {
  key: RoundKey;
  label: string;
  matches: Match[];
}

// 팀 총 개수 (DB 값으로 치환 가능)
const teams = ref<CupTeam[]>();

const totalTeamCount = ref<number>(0);

// 왼쪽 풀
const poolTeams = ref<CupTeam[]>();

// 라운드들: 8팀이면 [8강, 4강, 결승], 16팀이면 [16강, 8강, 4강, 결승]
const rounds = ref<Round[]>([]);

// 각 라운드별 각 매치의 winner index (0/1, 없으면 null)
const winnerIndexes = ref<(number | null)[][]>([]);

// 공통 DnD 그룹
const dndGroup = { name: 'teams', pull: true, put: true };

/* 🔹 브래킷 초기화: 팀 수에 따라 라운드 구조 생성 */
function initBracket() {
  const n = totalTeamCount.value;

  // 1) 팀 수에 맞는 브래킷 사이즈 결정 (최대 16)
  let bracketSize: 2 | 4 | 8 | 16;

  if (n <= 2) {
    bracketSize = 2;
  } else if (n <= 4) {
    bracketSize = 4;
  } else if (n <= 8) {
    bracketSize = 8;
  } else {
    bracketSize = 16;
  }

  // 2) 브래킷 사이즈에 따라 라운드 정의
  let defs: { key: RoundKey; label: string; matchCount: number }[];

  if (bracketSize === 2) {
    defs = [{ key: 'F', label: '결승', matchCount: 1 }];
  } else if (bracketSize === 4) {
    defs = [
      { key: 'SF', label: '4강', matchCount: 2 },
      { key: 'F', label: '결승', matchCount: 1 },
    ];
  } else if (bracketSize === 8) {
    defs = [
      { key: 'QF', label: '8강', matchCount: 4 },
      { key: 'SF', label: '4강', matchCount: 2 },
      { key: 'F', label: '결승', matchCount: 1 },
    ];
  } else {
    defs = [
      { key: 'R16', label: '16강', matchCount: 8 },
      { key: 'QF', label: '8강', matchCount: 4 },
      { key: 'SF', label: '4강', matchCount: 2 },
      { key: 'F', label: '결승', matchCount: 1 },
    ];
  }

  // 3) rounds / winnerIndexes 초기화
  rounds.value = defs.map((d) => ({
    key: d.key,
    label: d.label,
    matches: Array.from({ length: d.matchCount }, () => ({ teams: [] })),
  }));

  winnerIndexes.value = rounds.value.map((r) => Array(r.matches.length).fill(null));

  // 4) 라운드별로 winnerIndexes 채우기
  rounds.value.forEach((round, rIdx) => {
    if (round.key === 'QF') {
      // QF (8강)
      for (const match of cup.value?.cup_matches ?? []) {
        if (match.round === 'QF') {
          const home = match.home_team;
          const away = match.away_team;
          const winner = match.winner_team?.id === home?.id ? 0 : 1;

          if (home) round.matches[match.match_no - 1].teams.push(home);
          if (away) round.matches[match.match_no - 1].teams.push(away);

          // 🔥 rIdx로 동적 인덱싱
          winnerIndexes.value[rIdx][match.match_no - 1] = winner;
        }
      }
    } else if (round.key === 'SF') {
      // SF (4강)
      for (const match of cup.value?.cup_matches ?? []) {
        if (match.round === 'SF') {
          const home = match.home_team;
          const away = match.away_team;
          const winner = match.winner_team?.id === home?.id ? 0 : 1;

          if (home) round.matches[match.match_no - 1].teams.push(home);
          if (away) round.matches[match.match_no - 1].teams.push(away);

          // 🔥 여기서도 rIdx 사용
          winnerIndexes.value[rIdx][match.match_no - 1] = winner;
        }
      }
    } else if (round.key === 'F') {
      // F (결승)
      const hasFinal = cup.value?.cup_matches?.some((v) => v.round === 'F') ?? false;

      const finalEntry =
        cup.value?.cup_matches
          ?.map((match, index) => ({ match, index }))
          .find((v) => v.match.round === 'F') ?? null;

      if (!hasFinal || !finalEntry) return;

      const home = finalEntry.match.home_team;
      const away = finalEntry.match.away_team;

      let winner: 0 | 1 | null = null;
      if (finalEntry.match.winner_team && home && away) {
        winner = finalEntry.match.winner_team.id === home.id ? 0 : 1;
      }

      // 결승은 matchCount가 1개라서 [0] 고정
      const matchModel = round.matches[0];
      if (home) matchModel.teams.push(home);
      if (away) matchModel.teams.push(away);

      // 🔥 결승도 rIdx 사용 (2, 1, 0 뭐가 되든 자동)
      winnerIndexes.value[rIdx][0] = winner;
    }
  });
}

async function finishCup() {
  console.log(rounds.value);
  if (!finalChampion.value) return;

  const ok = confirm(`우승팀 ${finalChampion.value.name}로 토너먼트를 종료할까요?`);

  if (!ok) return;

  let finalMatch: CupMatch;
  for (const match of cup.value?.cup_matches) {
    if (match.round == 'F') finalMatch = match;
  }
  debugger;
  await api.post(`${getBaseUrl('DATA')}/cupmatch/update`, {
    id: finalMatch.id,
    winner_team: winnerIndexes.value[1][0] == 0 ? finalMatch.home_team : finalMatch.away_team,
  });
}

// 첫 초기화

/* 🔹 DnD move 제약: 슬롯은 2명까지, pool은 무제한 */
function onMove(e: any) {
  const toList: CupTeam[] | undefined = e.relatedContext?.list;
  const fromList: CupTeam[] | undefined = e.draggedContext?.list;
  if (!toList || !fromList) return true;

  // 왼쪽 풀인지 여부
  const isToPool = toList === poolTeams.value;

  // 오른쪽 매치 슬롯인지 여부 (rounds[*].matches[*].teams 중 하나인지)
  const isToMatchSlot = rounds.value.some((round) =>
    round.matches.some((match) => match.teams === toList)
  );

  // 같은 리스트 내부에서 위치만 바꾸는지 여부
  const isSameList = toList === fromList;

  // ⛔ 매치 슬롯이고, 다른 리스트에서 가져오는 거고, 이미 2명 꽉 차 있으면 막기
  if (isToMatchSlot && !isSameList && toList.length >= 2) {
    return false;
  }

  // 풀은 제한 없음, 슬롯 내부 reorder 도 허용
  return true;
}

/* 🔹 풀에서 팀 삭제 */
function removeFromPool(teamId: number) {
  if (poolTeams.value != undefined)
    poolTeams.value = poolTeams.value.filter((t) => t.id !== teamId);
}

/* 🔹 전체 리셋 */
async function resetAll() {
  //poolTeams.value = cup.value?.cup_teams;
  for (const item of cup.value?.cup_matches) {
    await api.post(`${getBaseUrl('DATA')}/cupmatch/delete`, { id: item.id });
  }

  fetch();
}

/* 🔹 풀 섞기 */
function shufflePool() {
  if (poolTeams.value != undefined) {
    const arr = [...poolTeams.value];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    poolTeams.value = arr;
  }
}

/* 🔹 승자 선택 */
function selectWinner(roundIndex: number, matchIndex: number, teamIndex: number) {
  const round = rounds.value[roundIndex];
  const match = round?.matches[matchIndex];
  if (!match || !match.teams[teamIndex]) return;

  winnerIndexes.value[roundIndex][matchIndex] = teamIndex;
}

/* 🔹 roundIndex 가 마지막 라운드인지 */
function isLastRound(roundIndex: number) {
  return roundIndex === rounds.value.length - 1;
}

/* 🔹 다음 라운드 라벨 */
function nextRoundLabel(roundIndex: number) {
  const next = rounds.value[roundIndex + 1];
  return next ? next.label : '';
}

/* 🔹 다음 라운드 생성 가능 여부 */
function canBuildNext(roundIndex: number): boolean {
  const current = rounds.value[roundIndex];
  const next = rounds.value[roundIndex + 1];
  if (!current || !next) return false;

  const winnersCount = winnerIndexes.value[roundIndex].filter((v) => v !== null).length;
  const neededTeams = next.matches.length * 2;

  if (roundIndex === 0) {
    if (poolTeams.value != undefined) {
      const byeCount = poolTeams.value.length;
      return winnersCount + byeCount === neededTeams && winnersCount > 0;
    }
  }

  // 나머지 라운드: 승자만으로 정확히 맞아야
  return winnersCount === neededTeams;
}

/* 🔹 다음 라운드 생성 */
async function buildNextRound(roundIndex: number) {
  const current = rounds.value[roundIndex];
  const next = rounds.value[roundIndex + 1];
  if (!current || !next) return;

  const winners: CupTeam[] = [];

  // 1) 현재 라운드 승자들
  current.matches.forEach((match, mIdx) => {
    const wIdx = winnerIndexes.value[roundIndex][mIdx];
    if (wIdx !== null && match.teams[wIdx]) {
      winners.push(match.teams[wIdx]);
    }
  });

  if (poolTeams.value != undefined) {
    if (roundIndex === 0 && poolTeams.value.length) {
      winners.push(...poolTeams.value);
    }
  }

  if (current.key == 'SF') {
    const createCupMatches: CupMatch[] = [];
    let matchIndex = 1;

    for (const match of current.matches) {
      createCupMatches.push({
        cup_id: +route.params.id,
        match_no: matchIndex,
        home_team: match.teams[0],
        away_team: match.teams[1],
        round: 'SF',
        winner_team: winners[matchIndex - 1],
      });
      matchIndex++;
    }
    createCupMatches.push({
      cup_id: +route.params.id,
      match_no: 1,
      home_team: winners[0],
      away_team: winners[1],
      round: 'F',
    });

    const { data } = await api.post(`${getBaseUrl('DATA')}/cupmatch/create-many`, createCupMatches);
  } else if (current.key == 'QF') {
    const createCupMatches: CupMatch[] = [];
    let matchIndex = 1;

    for (const match of current.matches) {
      createCupMatches.push({
        cup_id: +route.params.id,
        match_no: matchIndex,
        home_team: match.teams[0],
        away_team: match.teams[1],
        round: 'QF',
        winner_team: winners[matchIndex - 1],
      });
      matchIndex++;
    }
    const { data } = await api.post(`${getBaseUrl('DATA')}/cupmatch/create-many`, createCupMatches);
  }

  const neededTeams = next.matches.length * 2;
  if (winners.length !== neededTeams) {
    console.warn('다음 라운드를 만들기 위한 팀 수가 맞지 않습니다.', {
      roundIndex,
      winners: winners.length,
      neededTeams,
    });
    return;
  }

  // 실제 매치 구성
  next.matches.forEach((match, i) => {
    match.teams = [winners[2 * i], winners[2 * i + 1]];
    winnerIndexes.value[roundIndex + 1][i] = null;
  });

  // 첫 라운드가 진행되면 풀은 소모되었다고 보고 비움 (부전승 포함)
  if (roundIndex === 0) {
    poolTeams.value = [];
  }

  if (current.key == 'SF') {
    fetch();
  }
}

/* 🔹 최종 우승팀 (마지막 라운드 기준) */
const finalChampion = computed<CupTeam | null>(() => {
  if (!rounds.value.length) return null;
  const lastIndex = rounds.value.length - 1;
  const lastRound = rounds.value[lastIndex];
  if (!lastRound.matches.length) return null;

  const finalMatch = lastRound.matches[0];
  const wIdx = winnerIndexes.value[lastIndex][0];
  if (wIdx === null) return null;

  return finalMatch.teams[wIdx] ?? null;
});

async function fetch() {
  const { data } = await api.get(`${getBaseUrl('DATA')}/cup/find?id=${route.params.id}`);
  cup.value = data.datas;
  teams.value = cup.value?.cup_teams;
  totalTeamCount.value = cup.value?.cup_teams.length as number;

  if (cup.value?.cup_matches != undefined && cup.value?.cup_matches.length == 0) {
    poolTeams.value = cup.value?.cup_teams;
  }

  initBracket();
}
onMounted(fetch);
</script>

<style scoped>
.team-slot-row {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  padding: 6px 8px;
  border-radius: 10px;
  background: rgba(15, 23, 42, 0.6);
  transition: background 0.12s ease, transform 0.12s ease, box-shadow 0.12s ease;
}

.drag-handle {
  opacity: 0.5;
}
.team-slot-row:hover .drag-handle {
  opacity: 1;
}

.drag-chosen {
  transform: scale(1.02);
  box-shadow: 0 10px 25px rgba(15, 23, 42, 0.8);
}

.drag-ghost {
  background: rgba(59, 130, 246, 0.18) !important;
  border: 1px dashed rgba(129, 140, 248, 0.7);
}

.seed-chip {
  width: 28px;
  height: 28px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.24);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
}

.match-card {
  background: rgba(15, 23, 42, 0.9);
  border-radius: 14px;
  padding: 8px 10px 10px;
}

.empty-slot {
  padding-left: 4px;
}

/* 승자 하이라이트 */
.team-slot-row--winner {
  background: rgba(245, 158, 11, 0.18);
  box-shadow: 0 0 0 1px rgba(245, 158, 11, 0.9), 0 8px 20px rgba(15, 23, 42, 0.9);
  transform: translateY(-1px);
}
</style>
