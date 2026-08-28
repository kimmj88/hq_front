<template>
  <v-container class="py-8">
    <!-- 🔹 포지션 버튼들 -->
    <v-row v-if="!cup?.is_confirm" class="mb-6 justify-center flex-wrap position-btn-row">
      <v-col v-for="pos in positions" :key="pos" cols="auto" class="d-flex justify-center">
        <CupMemberDialog
          mode="add"
          :activator-label="pos"
          activator-color="primary"
          @added="onAdded"
        >
          <!-- 🔹 여기부터 커스텀 activator -->
          <template #activator="{ activatorProps }">
            <v-btn v-bind="activatorProps" class="pos-icon-btn" variant="tonal" rounded="lg">
              <div class="pos-icon-wrapper">
                <v-img :src="getPositionIcon(pos)" width="22" height="22" cover />
              </div>
            </v-btn>
          </template>
        </CupMemberDialog>
      </v-col>
    </v-row>

    <!-- 🔹 정보 + 컨트롤 바 -->
    <v-row class="mb-4">
      <v-col cols="12">
        <v-alert type="info" variant="tonal" density="comfortable" class="mb-4">
          전체 플레이어: {{ cup?.team_count * 5 }}명 / 포지션당 최대: {{ cup?.team_count }}명
          <br />
          현재 선택:
          <span v-for="pos in positions" :key="pos" class="mr-3">
            <strong>{{ pos }}</strong> : {{ selectedByPosition[pos]?.length || 0 }}명
          </span>
        </v-alert>

        <!-- 컨트롤 버튼 -->
        <div class="d-flex justify-center" style="gap: 12px">
          <v-btn
            color="deep-purple-accent-4"
            variant="flat"
            rounded="pill"
            :disabled="cup?.is_confirm"
            @click="onShot"
          >
            SHOT
          </v-btn>

          <v-btn
            color="secondary"
            variant="tonal"
            rounded="pill"
            @click="onTempSave"
            :disabled="cup?.is_confirm"
          >
            중간 저장
          </v-btn>

          <v-btn
            color="success"
            variant="flat"
            rounded="pill"
            :disabled="isConfirmDisabled"
            @click="onConfirm"
          >
            확정
          </v-btn>
        </div>
      </v-col>
    </v-row>

    <!-- 🔹 포지션별 선택 리스트 -->
    <v-row class="mb-8">
      <v-col v-for="pos in positions" :key="pos" cols="12" md="2">
        <div class="d-flex align-center justify-space-between mb-1">
          <div class="d-flex align-center">
            <div class="pos-icon-wrapper">
              <v-img :src="getPositionIcon(pos)" width="20" height="20" cover />
            </div>

            <span class="text-subtitle-2 ml-1">{{ pos }}</span>
          </div>

          <div class="d-flex align-center" style="gap: 6px">
            <span class="text-caption text-medium-emphasis">
              {{ selectedByPosition[pos]?.length || 0 }}명
            </span>

            <v-btn
              v-if="selectedByPosition[pos]?.length && !cup?.is_confirm"
              variant="text"
              size="x-small"
              @click="clearPosition(pos)"
            >
              초기화
            </v-btn>
          </div>
        </div>

        <v-sheet class="pa-2 rounded-lg position-slot">
          <div v-if="!selectedByPosition[pos]?.length" class="text-caption text-disabled">
            아직 선택된 플레이어가 없습니다.
          </div>

          <div
            v-for="p in selectedByPosition[pos] || []"
            :key="p.id"
            class="player-card d-flex align-center justify-space-between mb-2"
          >
            <div class="d-flex flex-column">
              <span class="text-body-2 font-weight-medium"> {{ p.nickname }}#{{ p.tagname }} </span>
              <span class="text-caption text-medium-emphasis">
                {{ p.clan_tier?.name }} · {{ getPlayerPoint(p) }}pt
              </span>
            </div>

            <div class="d-flex flex-column align-end">
              <!-- 확정 전: 삭제 버튼 -->
              <v-btn
                v-if="!cup?.is_confirm"
                icon
                size="x-small"
                variant="text"
                @click.stop="removePlayer(pos, p.id)"
              >
                <v-icon size="16">mdi-close</v-icon>
              </v-btn>

              <!-- 확정 후: 수정 다이얼로그 -->
              <CupMemberDialog
                v-else
                mode="edit"
                activator-color="orange"
                activator-label=""
                :initial-user-ids="[p.id]"
                :exclude-ids="getExcludeIdsForEdit(pos, p.id)"
                @added="(payload : any) => onEdited(pos, p, payload.users[0])"
              >
                <template #activator="{ activatorProps }">
                  <v-btn v-bind="activatorProps" icon size="x-small" variant="text">
                    <v-icon size="16">mdi-pencil</v-icon>
                  </v-btn>
                </template>
              </CupMemberDialog>

              <v-icon size="18" class="drag-handle mt-1">mdi-drag-vertical</v-icon>
            </div>
          </div>
        </v-sheet>
      </v-col>
    </v-row>

    <!-- 🔹 팀 프레임 (SHOT 이후 표시) -->
    <v-row v-if="teams.length" class="team-grid mb-8">
      <v-col v-for="(team, teamIndex) in teams" :key="team.id" cols="12" md="3" sm="6">
        <v-card
          class="team-card"
          :class="{
            'team-card--selectable': cup?.is_confirm && !cup?.winner_team && canSetWinner,
            'team-card--selected': selectedWinnerTeamId === team.id,
            'team-card--champion': cup?.winner_team?.id === team.id,
          }"
          rounded="xl"
          @click="selectWinnerTeam(team.id)"
        >
          <v-card-title class="d-flex justify-space-between align-center py-3">
            <div class="d-flex flex-column">
              <span class="text-subtitle-1 font-weight-medium">
                {{ team.label }}
              </span>
              <span class="text-caption text-medium-emphasis">
                {{ team.slots.filter((s: any) => s.player).length }} / {{ positions.length }}명 배정
              </span>
            </div>
            <v-chip size="small" color="amber-accent-3" text-color="black" variant="flat">
              {{ team.totalPoint }} pt
            </v-chip>
          </v-card-title>

          <v-divider />

          <v-card-text class="py-3">
            <div
              v-for="slot in team.slots"
              :key="slot.position"
              class="team-slot-row d-flex align-center justify-space-between mb-2"
              :class="{ 'swap-selected': isSwapSelected(teamIndex, slot.position) }"
              @click="onClickSwapSlot(teamIndex, slot.position)"
            >
              <v-chip
                size="x-small"
                color="indigo-darken-3"
                text-color="white"
                variant="flat"
                label
                class="mr-2"
                style="width: 52px; justify-content: center"
              >
                {{ slot.position }}
              </v-chip>

              <div v-if="slot.player" class="flex-grow-1 ml-2">
                <!-- 🔹 닉네임 + 별 한 줄 -->
                <div class="d-flex justify-space-between align-center">
                  <span class="text-body-2 font-weight-medium">
                    {{ slot.player.nickname }}#{{ slot.player.tagname }}
                  </span>

                  <span class="player-stars">
                    <font-awesome-icon
                      v-for="index in slot.player?.cup_count"
                      :key="'main-' + index"
                      :icon="['fas', 'star']"
                      class="star-full"
                    />
                    <font-awesome-icon
                      v-for="index in slot.player?.sub_cup_count"
                      :key="'sub-' + index"
                      :icon="['far', 'star']"
                      class="star-sub"
                    />
                  </span>
                </div>

                <div class="text-caption text-medium-emphasis">
                  {{ slot.player.clan_tier?.name || slot.player.tier?.name }} ·
                  {{ getPlayerPoint(slot.player) }}pt
                </div>
              </div>

              <span v-else class="text-caption text-disabled flex-grow-1 ml-2"> 미배정 </span>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-card v-if="cup?.is_confirm" class="winner-select-panel pa-5" rounded="xl" variant="tonal">
      <div class="text-center">
        <v-icon size="38" color="amber">mdi-trophy-variant</v-icon>
        <div class="text-h6 font-weight-black mt-2">
          {{ cup.winner_team ? '내전 컵 우승팀' : '우승팀을 선택하세요' }}
        </div>
        <div class="text-body-2 text-medium-emphasis mt-1">
          {{ cup.winner_team ? cup.winner_team.name : '위 팀 카드를 클릭한 뒤 우승을 확정할 수 있습니다.' }}
        </div>
        <v-btn
          v-if="!cup.winner_team && canSetWinner"
          class="mt-4"
          color="amber"
          size="large"
          rounded="pill"
          prepend-icon="mdi-check-decagram"
          :disabled="!selectedWinnerTeamId"
          :loading="winnerSaving"
          @click="confirmWinner"
        >
          우승팀 확정
        </v-btn>
      </div>
    </v-card>
  </v-container>

  <!-- 스낵바 -->
  <v-snackbar v-model="snackbar.show" :timeout="2000">
    {{ snackbar.msg }}
  </v-snackbar>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import CupMemberDialog from '@/components/dialogs/CupMemberDialog.vue';
import type { Player } from '@/data/types/player';
import { getBaseUrl } from '@/@core/composable/createUrl';
import api from '@/@core/composable/useAxios';
import { useRoute } from 'vue-router';
import type { Cup, PositionPlayerList } from '@/data/types/cup';
import { useAccountStore } from '@/stores/useAccountStore';
import { can } from '@/stores/useClanPermissionStore';

const route = useRoute();

const account = useAccountStore();

import topIcon from '@/assets/positions/top.svg';
import jugIcon from '@/assets/positions/jug.svg';
import midIcon from '@/assets/positions/mid.svg';
import adcIcon from '@/assets/positions/adc.webp';
import supIcon from '@/assets/positions/sup.svg';

const positionIconMap: Record<string, string> = {
  TOP: topIcon,
  JUG: jugIcon,
  MID: midIcon,
  ADC: adcIcon,
  SUP: supIcon,
};

const swapTarget = ref<{ teamIndex: number; position: string } | null>(null);

function isSwapSelected(teamIndex: number, position: string) {
  return swapTarget.value?.teamIndex === teamIndex && swapTarget.value?.position === position;
}

function onClickSwapSlot(teamIndex: number, position: string) {
  // 확정된 컵이면 스왑 불가
  if (cup.value?.is_confirm) return;

  const team = teams.value[teamIndex];
  if (!team) return;

  const slot = team.slots.find((s) => s.position === position);
  // 빈 슬롯이면 무시
  if (!slot || !slot.player) return;

  // 아직 첫 선택이 없으면 → 선택 상태로 저장
  if (!swapTarget.value) {
    swapTarget.value = { teamIndex, position };
    snackbar.msg = '교체할 다른 팀의 같은 포지션을 선택하세요.';
    snackbar.show = true;
    return;
  }

  // 같은 슬롯 다시 클릭 → 취소
  if (swapTarget.value.teamIndex === teamIndex && swapTarget.value.position === position) {
    swapTarget.value = null;
    snackbar.msg = '선택이 취소되었습니다.';
    snackbar.show = true;
    return;
  }

  // 포지션 다르면 스왑 불가
  if (swapTarget.value.position !== position) {
    snackbar.msg = '같은 포지션끼리만 스왑할 수 있습니다.';
    snackbar.show = true;
    swapTarget.value = null;
    return;
  }

  // 여기까지 왔으면: 같은 포지션, 다른 팀 → 실제 스왑 수행
  const prevTeam = teams.value[swapTarget.value.teamIndex];
  const prevSlot = prevTeam.slots.find((s) => s.position === swapTarget.value!.position);

  if (!prevSlot || !prevSlot.player) {
    swapTarget.value = null;
    return;
  }

  // 🔥 플레이어 스왑
  const tmp = prevSlot.player;
  prevSlot.player = slot.player;
  slot.player = tmp;

  // 팀 점수 다시 계산
  prevTeam.totalPoint = prevTeam.slots.reduce((sum, s) => {
    return sum + (s.player ? getPlayerPoint(s.player) : 0);
  }, 0);

  team.totalPoint = team.slots.reduce((sum, s) => {
    return sum + (s.player ? getPlayerPoint(s.player) : 0);
  }, 0);

  // 선택 초기화
  swapTarget.value = null;

  snackbar.msg = '두 팀의 포지션이 서로 교체되었습니다.';
  snackbar.show = true;
}

function getPositionIcon(pos: string) {
  return positionIconMap[pos] ?? '';
}

const positions: string[] = ['TOP', 'JUG', 'MID', 'ADC', 'SUP'];
const cup = ref<Cup | null>(null);
const selectedWinnerTeamId = ref<number | null>(null);
const winnerSaving = ref(false);
const canSetWinner = computed(() => account.isClanMaster || can('CUP', 'CLAN-SET-CUP-C'));

const is_btnActive = ref<boolean>(false);

// 포지션별 선택된 플레이어
const selectedByPosition = reactive<Record<string, Player[]>>({});

const teams = ref<TeamFrame[]>([]);

const snackbar = reactive({ show: false, msg: '' });

const isConfirmDisabled = computed(() => {
  const c = cup.value;
  if (!c) return true;

  // 1) 이미 확정된 컵이면 비활성화
  if (c.is_confirm) return true;

  // 2) 현재 화면에서 선택된 전체 플레이어 수 (포지션별 합)
  const totalSelected = positions.reduce((sum, pos) => {
    return sum + (selectedByPosition[pos]?.length || 0);
  }, 0);

  // 아무도 선택 안 되어 있으면 당연히 비활성화
  if (totalSelected === 0) return true;

  // 3) 한 팀이 5명이니 전체 / 5가 team_count와 일치해야 함
  const teamCountFromMembers = totalSelected / 5;

  const teamCountMatched =
    Number.isInteger(teamCountFromMembers) && teamCountFromMembers === c.team_count;

  // 4) SHOT을 눌러서 팀 프레임이 실제로 만들어졌는지 + 각 팀에 5명씩 들어가 있는지
  const hasTeams = teams.value.length === c.team_count;

  const eachTeamFilled =
    hasTeams &&
    teams.value.every(
      (team) => team.slots.filter((slot) => !!slot.player).length === positions.length // 5포지션
    );

  // 🔥 최종 활성 조건
  const canConfirmNow = is_btnActive.value && teamCountMatched && eachTeamFilled;

  // 버튼에는 disabled를 넘기니까 반대로
  return !canConfirmNow;
});

// 팀 프레임 타입 & 상태
interface TeamSlot {
  position: string;
  player: Player | null;
}

interface TeamFrame {
  id: number;
  label: string;
  slots: TeamSlot[];
  totalPoint: number;
}

function selectWinnerTeam(teamId: number) {
  if (!cup.value?.is_confirm || cup.value.winner_team || !canSetWinner.value) return;
  selectedWinnerTeamId.value = teamId;
}

async function confirmWinner() {
  if (!selectedWinnerTeamId.value || !cup.value) return;
  const team = cup.value.cup_teams.find((item) => item.id === selectedWinnerTeamId.value);
  if (!team || !confirm(`${team.name} 팀을 우승팀으로 확정할까요? 확정 후에는 변경할 수 없습니다.`)) return;
  try {
    winnerSaving.value = true;
    await api.post(`${getBaseUrl('DATA')}/cup/winner`, {
      cup_id: cup.value.id,
      winner_team_id: team.id,
    });
    snackbar.msg = `${team.name} 팀이 우승팀으로 확정되었습니다.`;
    snackbar.show = true;
    await fetch();
  } catch (error: any) {
    snackbar.msg = error?.response?.data?.message ?? '우승팀을 확정하지 못했습니다.';
    snackbar.show = true;
  } finally {
    winnerSaving.value = false;
  }
}

/* 유틸: 점수 계산 */
function getPlayerPoint(p: Player): number {
  const tierPoint = p.clan_tier?.point ?? p.tier?.point;
  return (Number(tierPoint) || 0) + (Number(p.point) || 0);
}

function getExcludeIdsForEdit(position: string, playerId: number) {
  return Object.entries(selectedByPosition)
    .flatMap(([pos, list]) => (pos === position ? list.filter((p) => p.id !== playerId) : list))
    .map((p) => p.id);
}

async function onEdited(position: string, oldPlayer: any, newPlayer: Player) {
  if (!newPlayer) return;

  const list = selectedByPosition[position] ?? [];
  const idx = list.findIndex((u) => u.id === oldPlayer.id);
  if (idx === -1) return;

  // 교체
  list[idx] = newPlayer;
  selectedByPosition[position] = [...list];

  await api.post(`${getBaseUrl('DATA')}/cupmember/update`, {
    id: oldPlayer.cupmember_id,
    cup_id: +route.params.id,
    player_id: newPlayer.id,
  });

  snackbar.msg = '플레이어를 수정했습니다.';
  snackbar.show = true;
  fetch();
}

/* 선택 콜백 */
async function onAdded(payload: { users: Player[]; label: string }) {
  const pos = payload.label;
  const prev = selectedByPosition[pos] ?? [];

  const teamCount = cup.value?.team_count ?? 0;
  const newList = [...prev, ...payload.users];

  const merged = newList.filter(
    (item, index, self) => index === self.findIndex((x) => x.id === item.id)
  );

  // 전체 포지션 기준 플레이어 중복 검사 (닉네임 기준)
  const existingNames = new Set(
    Object.values(selectedByPosition)
      .flat()
      .map((u) => u.nickname)
  );
  const exists = payload.users.some((u) => existingNames.has(u.nickname));

  if (exists) {
    snackbar.msg = 'Player가 중복되었습니다.';
    snackbar.show = true;
    return;
  }

  // 포지션 인원 제한 검사
  if (merged.length > teamCount) {
    snackbar.msg = `${pos} 포지션은 최대 ${teamCount}명만 선택할 수 있습니다.`;
    snackbar.show = true;
    return;
  }

  selectedByPosition[pos] = merged;
}

/* 삭제 관련 */
function removePlayer(position: string, userId: number) {
  const list = selectedByPosition[position] ?? [];
  selectedByPosition[position] = list.filter((u) => u.id !== userId);
}
function clearPosition(position: string) {
  selectedByPosition[position] = [];
}

/* 🔥 SHOT: 포지션별로만 섞으면서 전체 팀 점수 밸런싱 */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function onShot() {
  is_btnActive.value = true;
  const teamCount = cup.value?.team_count ?? 0;
  if (!teamCount) {
    snackbar.msg = '팀 개수가 설정되지 않았습니다.';
    snackbar.show = true;
    return;
  }

  // 🔒 포지션별 인원 수가 팀 개수와 정확히 같은지 검사
  const invalidPos = positions.find((pos) => (selectedByPosition[pos]?.length || 0) !== teamCount);
  if (invalidPos) {
    snackbar.msg = `${invalidPos} 포지션 인원 수가 팀 개수와 맞지 않습니다.`;
    snackbar.show = true;
    return;
  }

  // 1️⃣ 포지션별로 미리 섞어둔 배열 준비
  const shuffledByPos: Record<string, Player[]> = {};
  for (const pos of positions) {
    shuffledByPos[pos] = shuffle(selectedByPosition[pos] ?? []);
  }

  // 2️⃣ 팀 프레임 생성 + 포지션별로 섞인 배열에서 i번째를 가져와 팀에 배정
  const frames: TeamFrame[] = [];

  for (let i = 0; i < teamCount; i++) {
    const slots: TeamSlot[] = positions.map((pos) => ({
      position: pos,
      player: shuffledByPos[pos][i] ?? null,
    }));

    const totalPoint = slots.reduce((sum, slot) => {
      return slot.player ? sum + getPlayerPoint(slot.player) : sum;
    }, 0);

    frames.push({
      id: i + 1,
      label: `TEAM ${String.fromCharCode(65 + i)}`, // TEAM A, B, C...
      slots,
      totalPoint,
    });
  }

  teams.value = frames;

  snackbar.msg = '포지션별로 플레이어를 섞어서 팀을 재배치했습니다. (SHOT)';
  snackbar.show = true;
}

/* 임시 저장 */
async function onTempSave() {
  try {
    const positionPlayers: PositionPlayerList[] = [];

    for (const pos of positions) {
      positionPlayers.push({ key: pos, players: selectedByPosition[pos] ?? [] });
    }

    await api.post(`${getBaseUrl('DATA')}/cup/update`, {
      id: +route.params.id,
      position_players: positionPlayers,
    });

    snackbar.msg = '현재 포지션 구성을 임시 저장했습니다.';
    snackbar.show = true;
  } catch (e) {
    console.error(e);
    snackbar.msg = '임시 저장 중 오류가 발생했습니다.';
    snackbar.show = true;
  }
}

/* 확정: 현재 teams 상태를 바탕으로 저장 */
async function onConfirm() {
  try {
    const payload = {
      cup_id: +route.params.id,
      teams: teams.value.map((t) => ({
        name: t.label,
        cup_members: t.slots
          .filter((s) => s.player)
          .map((s) => ({
            position: s.position,
            id: s.player!.id,
          })),
      })),
    };

    await api.post(`${getBaseUrl('DATA')}/cup/update`, { id: +route.params.id, is_confirm: true });
    await api.post(`${getBaseUrl('DATA')}/cupteam/create-many`, payload);

    if (cup.value) {
      cup.value.is_confirm = true;
    }

    snackbar.msg = '팀 구성이 확정되었습니다.';
    snackbar.show = true;
    fetch();
  } catch (e) {
    console.error(e);
    snackbar.msg = '확정 처리 중 오류가 발생했습니다.';
    snackbar.show = true;
  }
}

async function fetch() {
  const { data } = await api.get(`${getBaseUrl('DATA')}/cup/find?id=${route.params.id}`);
  cup.value = data.datas;

  if (data.datas.position_players?.length) {
    for (const item of data.datas.position_players) {
      selectedByPosition[item.key] = item.players;
    }
  }

  const teamCount = cup.value?.team_count ?? 0;
  let frames: TeamFrame[] = [];

  // ⭐️ 1단계: teamCount만큼 기본 구조 먼저 생성
  for (let i = 0; i < teamCount; i++) {
    frames.push({
      id: i + 1,
      label: '',
      slots: [], // 일단 빈 배열
      totalPoint: 0,
    });
  }

  // ⭐️ 2단계: cup_teams 데이터를 채워넣기
  for (let i = 0; i < teamCount; i++) {
    const teamData = data.datas.cup_teams[i];
    frames[i].id = teamData.id;
    frames[i].label = teamData.name;

    for (const item of teamData.cup_members) {
      frames[i].slots.push({
        position: item.position,
        player: item.player,
      });
    }

    // 팀 점수 합산
    frames[i].totalPoint = frames[i].slots.reduce((sum, slot) => {
      return sum + (slot.player ? getPlayerPoint(slot.player) : 0);
    }, 0);
  }

  teams.value = frames;
}
onMounted(fetch);
</script>

<style scoped>
.position-btn-row {
  row-gap: 12px;
}

.position-slot {
  min-height: 220px;
  max-height: 350px;
  overflow-y: auto;
  background: rgba(255, 255, 255, 0.05);
  padding-right: 6px;
}

.player-card {
  padding: 6px 8px;
  border-radius: 10px;
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid rgba(148, 163, 184, 0.3);
}

.player-card .drag-handle {
  opacity: 0.5;
}
.player-card:hover .drag-handle {
  opacity: 1;
}

/* 팀 카드 그리드 */
.team-grid {
  row-gap: 16px;
}

.team-card {
  background: radial-gradient(circle at top left, #1e293b, #020617);
  border: 1px solid rgba(148, 163, 184, 0.35);
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.7);
}
.team-card--selectable {
  cursor: pointer;
  transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
}
.team-card--selectable:hover {
  border-color: rgba(245, 158, 11, 0.7);
  transform: translateY(-3px);
}
.team-card--selected {
  border: 2px solid #facc15;
  box-shadow: 0 0 0 2px rgba(250, 204, 21, 0.18), 0 18px 45px rgba(245, 158, 11, 0.22);
}
.team-card--champion {
  border: 2px solid #facc15;
  background: radial-gradient(circle at top, rgba(245, 158, 11, 0.25), #020617 68%);
  box-shadow: 0 0 28px rgba(245, 158, 11, 0.28);
}
.winner-select-panel {
  border: 1px solid rgba(245, 158, 11, 0.28);
  background: radial-gradient(circle at 50% 0, rgba(245, 158, 11, 0.16), transparent 62%);
}

.team-slot-row {
  padding: 6px 4px;
  border-radius: 10px;
}

.team-slot-row:hover {
  background: rgba(15, 23, 42, 0.8);
}
.position-btn-row {
  row-gap: 12px;
}

/* 기존 pos-icon-wrapper 그대로 사용 */
.pos-icon-wrapper {
  width: 24px;
  height: 24px;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 상단 포지션 아이콘 버튼용 */
.pos-icon-btn {
  min-width: 40px;
  padding: 4px 6px;
}
.pos-icon-btn .v-btn__content {
  padding: 0; /* 안쪽 여백 줄여서 아이콘만 꽉 차게 */
}

.swap-selected {
  outline: 2px solid #facc15; /* 노란색 */
  background-color: rgba(250, 204, 21, 0.08);
}
</style>
