<template>
  <v-container class="auction-page py-6">
    <div class="d-flex flex-wrap align-end justify-space-between mb-5 ga-3">
      <div>
        <div class="d-flex align-center ga-2 mb-1">
          <v-chip size="small" color="deep-purple-accent-2" variant="flat">DEMO</v-chip>
          <span class="text-overline text-medium-emphasis">AUCTION SCRIM</span>
        </div>
        <h1 class="text-h4 font-weight-black">경매 내전</h1>
        <p class="text-body-2 text-medium-emphasis mt-1">
          참가 선수들을 경매로 영입해 팀을 완성합니다.
        </p>
      </div>

      <div class="d-flex ga-2">
        <v-btn
          v-if="isOwner"
          variant="tonal"
          prepend-icon="mdi-refresh"
          @click="openResetDialog"
        >
          초기화
        </v-btn>
        <v-btn
          v-if="isOwner"
          color="deep-purple-accent-2"
          prepend-icon="mdi-gavel"
          :disabled="availablePlayers.length === 0 || isRunning"
          @click="nominateNext"
        >
          랜덤 선수 지명
        </v-btn>
      </div>
    </div>

    <v-row>
      <v-col cols="12" lg="8">
        <v-card class="auction-stage overflow-hidden" rounded="xl" elevation="4">
          <div class="stage-top pa-5">
            <div class="d-flex align-center justify-space-between">
              <div>
                <div class="text-caption text-medium-emphasis">현재 경매</div>
                <div class="text-subtitle-1 font-weight-bold">
                  {{ currentPlayer ? `${currentPlayer.nickname} 선수` : '대기 중' }}
                </div>
              </div>
              <v-progress-circular
                :model-value="timerProgress"
                :color="seconds <= 5 ? 'error' : 'deep-purple-accent-2'"
                :size="68"
                :width="7"
              >
                <span class="text-h6 font-weight-black">{{ seconds }}</span>
              </v-progress-circular>
            </div>
          </div>

          <v-divider />

          <div v-if="currentPlayer" class="pa-5">
            <v-row align="center">
              <v-col cols="12" md="5">
                <div
                  class="player-spotlight pa-5 text-center profile-clickable"
                  role="button"
                  tabindex="0"
                  @click="openFowProfile(currentPlayer)"
                  @keydown.enter="openFowProfile(currentPlayer)"
                >
                  <v-avatar size="96" :color="positionColor(currentPlayer.position)">
                    <span class="text-h4 font-weight-black">{{ initials(currentPlayer.nickname) }}</span>
                  </v-avatar>
                  <div class="text-h5 font-weight-black mt-4">{{ currentPlayer.nickname }}</div>
                  <div class="text-body-2 text-medium-emphasis">#{{ currentPlayer.tag }}</div>
                  <div class="d-flex justify-center ga-2 mt-3">
                    <v-chip size="small" :color="positionColor(currentPlayer.position)" variant="flat">
                      {{ positionLabel(currentPlayer.position) }}
                    </v-chip>
                    <v-chip size="small" variant="tonal">{{ currentPlayer.tier }}</v-chip>
                  </div>
                  <div v-if="currentPlayer.winRate" class="text-caption text-medium-emphasis mt-3">
                    최근 승률 {{ currentPlayer.winRate }}% · KDA {{ currentPlayer.kda }}
                  </div>
                  <div v-else class="text-caption text-medium-emphasis mt-3">경매 참가 선수</div>
                </div>
              </v-col>

              <v-col cols="12" md="7">
                <div class="text-caption text-medium-emphasis">현재 최고 입찰가</div>
                <div class="bid-price my-1">{{ currentBid.toLocaleString() }} P</div>
                <div class="text-body-2 mb-5">
                  <template v-if="highestTeam">
                    <v-icon size="18" :color="highestTeam.color">mdi-crown</v-icon>
                    <strong :style="{ color: highestTeam.color }">{{ highestTeam.name }}</strong>
                    팀이 최고가를 제시했습니다.
                  </template>
                  <span v-else class="text-medium-emphasis">아직 입찰한 팀이 없습니다.</span>
                </div>

                <div class="text-caption text-medium-emphasis mb-2">입찰 단위</div>
                <v-btn-toggle v-model="bidStep" mandatory color="deep-purple-accent-2" class="mb-5">
                  <v-btn v-for="step in bidSteps" :key="step" :value="step" size="small">
                    +{{ step }}P
                  </v-btn>
                </v-btn-toggle>

                <div class="text-caption text-medium-emphasis mb-2">팀 선택 후 입찰</div>
                <div class="bid-team-grid">
                  <v-btn
                    v-for="team in teams"
                    :key="team.id"
                    :color="team.color"
                    variant="tonal"
                    height="54"
                    :disabled="!canBid(team)"
                    @click="placeBid(team)"
                  >
                    <span class="d-flex flex-column">
                      <strong>{{ team.name }}</strong>
                      <small>{{ team.points.toLocaleString() }}P 보유</small>
                    </span>
                  </v-btn>
                </div>
              </v-col>
            </v-row>

            <v-alert
              v-if="bidError"
              type="warning"
              variant="tonal"
              density="compact"
              class="mt-4"
            >
              {{ bidError }}
            </v-alert>
          </div>

          <div v-else class="empty-stage pa-10 text-center">
            <v-icon size="72" color="deep-purple-lighten-1">mdi-account-search-outline</v-icon>
            <div class="text-h6 font-weight-bold mt-4">경매할 선수를 지명해 주세요</div>
            <div class="text-body-2 text-medium-emphasis mt-1">
              아래 선수 풀에서 직접 선택하거나 랜덤 지명을 사용할 수 있습니다.
            </div>
          </div>

          <v-divider />
          <div class="d-flex flex-wrap align-center justify-space-between pa-4 ga-3">
            <div class="text-caption text-medium-emphasis">
              시작가 {{ startBid }}P · 팀당 최대 {{ rosterLimit }}명
            </div>
            <div class="d-flex ga-2">
              <v-text-field
                v-if="isOwner && !isRunning"
                v-model.number="configuredSeconds"
                type="number"
                min="5"
                max="300"
                label="제한 시간"
                suffix="초"
                density="compact"
                variant="outlined"
                hide-details
                style="width: 125px"
              />
              <v-btn v-if="isOwner && currentPlayer" variant="text" :disabled="isRunning" @click="cancelNomination">
                선수 변경
              </v-btn>
              <v-btn
                v-if="isOwner && currentPlayer && !isRunning"
                color="deep-purple-accent-2"
                prepend-icon="mdi-timer-play"
                @click="startAuction"
              >
                초시계 시작
              </v-btn>
              <v-btn
                v-if="isOwner && currentPlayer && isRunning"
                :color="isPaused ? 'deep-purple-accent-2' : 'warning'"
                :prepend-icon="isPaused ? 'mdi-timer-play' : 'mdi-timer-pause'"
                variant="tonal"
                @click="toggleTimer"
              >
                {{ isPaused ? '초시계 재개' : '초시계 정지' }}
              </v-btn>
              <v-btn
                v-if="isOwner && currentPlayer && isRunning"
                color="success"
                prepend-icon="mdi-hammer"
                :disabled="!highestTeam"
                @click="finishAuction"
              >
                즉시 낙찰
              </v-btn>
            </div>
          </div>
        </v-card>

        <v-card class="mt-5 pa-4" rounded="xl">
          <div class="d-flex align-center justify-space-between mb-3">
            <div>
              <div class="text-subtitle-1 font-weight-bold">선수 풀</div>
              <div class="text-caption text-medium-emphasis">
                대기 {{ availablePlayers.length }}명 · 낙찰 {{ soldCount }}명
              </div>
            </div>
            <v-select
              v-model="positionFilter"
              :items="positionFilters"
              density="compact"
              variant="outlined"
              hide-details
              style="max-width: 150px"
            />
          </div>

          <v-row dense>
            <v-col v-for="player in filteredPlayers" :key="player.id" cols="12" sm="6" md="4">
              <div
                class="pool-player"
                :class="{
                  selected: currentPlayer?.id === player.id,
                  disabled: isRunning || !isOwner,
                }"
                role="button"
                tabindex="0"
                @click="!isRunning && isOwner && nominate(player)"
                @keydown.enter="!isRunning && isOwner && nominate(player)"
              >
                <v-tooltip activator="parent" location="top">
                  {{ positionLabel(player.position) }} · {{ player.tier }}
                </v-tooltip>
                <v-avatar size="38" :color="positionColor(player.position)">
                  {{ initials(player.nickname) }}
                </v-avatar>
                <span class="text-left flex-grow-1">
                  <strong class="d-block">{{ player.nickname }}</strong>
                  <small class="text-medium-emphasis">
                    {{ positionLabel(player.position) }} · {{ player.tier }}
                  </small>
                </span>
                <v-btn
                  icon
                  size="x-small"
                  variant="text"
                  @click.stop="openFowProfile(player)"
                >
                  <v-icon size="18">mdi-card-account-details-outline</v-icon>
                </v-btn>
              </div>
            </v-col>
          </v-row>
        </v-card>

        <v-card class="mt-5 pa-4 unsold-card" rounded="xl">
          <div class="d-flex align-center justify-space-between mb-3">
            <div>
              <div class="text-subtitle-1 font-weight-bold">
                <v-icon size="20" color="warning" class="mr-1">mdi-package-variant</v-icon>
                유찰 매물
              </div>
              <div class="text-caption text-medium-emphasis">
                1차 경매가 끝나면 이 명단에서 랜덤으로 재경매합니다.
              </div>
            </div>
            <v-chip color="warning" variant="tonal">{{ unsoldPlayers.length }}명</v-chip>
          </div>

          <v-row v-if="unsoldPlayers.length" dense>
            <v-col v-for="player in unsoldPlayers" :key="`unsold-${player.id}`" cols="12" sm="6" md="4">
              <div
                class="pool-player unsold-player profile-clickable"
                role="button"
                tabindex="0"
                @click="openFowProfile(player)"
                @keydown.enter="openFowProfile(player)"
              >
                <v-tooltip activator="parent" location="top">
                  {{ positionLabel(player.position) }} · {{ player.tier }}
                </v-tooltip>
                <v-avatar size="38" color="warning">{{ initials(player.nickname) }}</v-avatar>
                <span class="text-left flex-grow-1">
                  <strong class="d-block">{{ player.nickname }}</strong>
                  <small class="text-medium-emphasis">{{ positionLabel(player.position) }} · {{ player.tier }}</small>
                </span>
                <v-chip size="x-small" color="warning">유찰</v-chip>
              </div>
            </v-col>
          </v-row>
          <div v-else class="text-caption text-medium-emphasis text-center py-5">
            유찰된 선수가 없습니다.
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" lg="4">
        <div class="team-stack">
          <v-card
            v-for="team in teams"
            :key="team.id"
            class="mb-4 pa-4 team-card"
            rounded="xl"
            :style="{ '--team-color': team.color }"
          >
            <div class="d-flex align-center justify-space-between">
              <div class="d-flex align-center ga-3">
                <v-avatar :color="team.color"><v-icon>mdi-shield-crown-outline</v-icon></v-avatar>
                <div>
                  <div class="font-weight-bold">{{ team.name }}</div>
                  <div class="text-caption text-medium-emphasis">팀장 {{ team.captain }}</div>
                </div>
              </div>
              <div class="text-right">
                <div class="text-caption text-medium-emphasis">잔여 포인트</div>
                <strong :style="{ color: team.color }">{{ team.points.toLocaleString() }}P</strong>
              </div>
            </div>

            <v-progress-linear
              class="my-3"
              :model-value="(team.members.length / rosterLimit) * 100"
              :color="team.color"
              height="5"
              rounded
            />

            <div v-if="team.members.length" class="roster-list">
              <div
                v-for="member in team.members"
                :key="member.player.id"
                class="roster-item profile-clickable"
                @click="openFowProfile(member.player)"
              >
                <v-chip size="x-small" :color="positionColor(member.player.position)">
                  {{ member.player.position }}
                </v-chip>
                <span class="text-body-2 flex-grow-1">{{ member.player.nickname }}</span>
                <strong class="text-caption">{{ member.price }}P</strong>
              </div>
            </div>
            <div v-else class="empty-roster text-caption text-medium-emphasis text-center py-3">
              아직 영입한 선수가 없습니다.
            </div>
          </v-card>
        </div>

        <v-card class="pa-4" rounded="xl">
          <div class="d-flex align-center ga-2 mb-3">
            <v-icon size="20">mdi-history</v-icon>
            <div class="font-weight-bold">경매 로그</div>
          </div>
          <div class="auction-log">
            <div v-for="(log, index) in logs" :key="index" class="log-row">
              <span class="log-time">{{ log.time }}</span>
              <span class="text-body-2">{{ log.message }}</span>
            </div>
            <div v-if="logs.length === 0" class="text-caption text-medium-emphasis text-center py-5">
              경매를 시작하면 기록이 표시됩니다.
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <v-dialog v-model="resultDialog" max-width="440">
      <v-card rounded="xl" class="pa-3">
        <v-card-text class="text-center py-7">
          <v-avatar size="72" color="amber-darken-2"><v-icon size="38">mdi-trophy</v-icon></v-avatar>
          <div class="text-h5 font-weight-black mt-4">낙찰!</div>
          <div class="text-body-1 mt-2">
            <strong>{{ lastResult?.player.nickname }}</strong> 선수를
            <strong :style="{ color: lastResult?.team.color }">{{ lastResult?.team.name }}</strong>
            팀이 영입했습니다.
          </div>
          <v-chip class="mt-3" color="deep-purple-accent-2" variant="flat">
            {{ lastResult?.price.toLocaleString() }}P
          </v-chip>
        </v-card-text>
        <v-card-actions>
          <v-btn
            v-if="isOwner"
            block
            color="deep-purple-accent-2"
            @click="closeResultAndContinue"
          >
            다음 선수 지명
          </v-btn>
          <v-btn v-else block variant="tonal" @click="dismissResultDialog">
            확인
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="2200">
      {{ snackbar.message }}
    </v-snackbar>

    <v-dialog v-model="resetDialog" max-width="450">
      <v-card rounded="xl">
        <v-card-title class="text-h6 font-weight-bold">경매 초기화</v-card-title>
        <v-card-text>
          모든 낙찰 결과를 지우고 처음부터 다시 진행할까요?
          <div class="text-caption text-medium-emphasis mt-2">
            팀장 포인트 설정 단계로 돌아가며 이 작업은 되돌릴 수 없습니다.
          </div>
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn variant="text" :disabled="resetting" @click="resetDialog = false">취소</v-btn>
          <v-btn color="error" :loading="resetting" @click="confirmReset">초기화</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </v-container>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

const props = withDefaults(
  defineProps<{
    teamCount?: number;
    bidSeconds?: number;
    auctionId?: number;
    currentAccountId?: number;
    isOwner?: boolean;
    webSocketUrl?: string;
    captains?: string[];
    captainPoints?: number[];
    captainAccountIds?: number[];
    auctionPlayers?: {
      accountId: number;
      id: number;
      nickname: string;
      tag: string;
      tier: string;
      position: string;
      teamCaptainAccountId: number | null;
      winningBid: number | null;
      isUnsold: boolean;
    }[];
    awardPlayer?: (payload: {
      playerAccountId: number;
      captainAccountId: number;
      winningBid: number;
    }) => Promise<boolean>;
    markUnsold?: (playerAccountId: number) => Promise<boolean>;
    resetAuction?: () => Promise<boolean>;
  }>(),
  {
    teamCount: 3,
    bidSeconds: 20,
    auctionId: 0,
    currentAccountId: 0,
    isOwner: false,
    webSocketUrl: '',
    captains: () => [],
    captainPoints: () => [],
    captainAccountIds: () => [],
    auctionPlayers: () => [],
    awardPlayer: async () => true,
    markUnsold: async () => true,
    resetAuction: async () => true,
  }
);
const isOwner = computed(() => props.isOwner);

type Position = 'TOP' | 'JUG' | 'MID' | 'ADC' | 'SUP';

interface AuctionPlayer {
  accountId?: number;
  id: number;
  nickname: string;
  tag: string;
  position: Position;
  tier: string;
  winRate: number;
  kda: number;
}

interface TeamMember {
  player: AuctionPlayer;
  price: number;
}

interface AuctionTeam {
  id: number;
  name: string;
  captain: string;
  captainAccountId: number;
  color: string;
  points: number;
  members: TeamMember[];
}

const initialPlayers: AuctionPlayer[] = [
  { id: 1, nickname: '검은별', tag: 'KR1', position: 'TOP', tier: 'Diamond IV', winRate: 54, kda: 2.8 },
  { id: 2, nickname: '정글차이', tag: 'JUG', position: 'JUG', tier: 'Emerald I', winRate: 58, kda: 3.4 },
  { id: 3, nickname: '미드킹', tag: 'MID', position: 'MID', tier: 'Diamond III', winRate: 61, kda: 3.9 },
  { id: 4, nickname: '한발이면돼', tag: 'ADC', position: 'ADC', tier: 'Emerald II', winRate: 52, kda: 3.1 },
  { id: 5, nickname: '시야장인', tag: 'SUP', position: 'SUP', tier: 'Diamond IV', winRate: 56, kda: 4.2 },
  { id: 6, nickname: '탑신병자', tag: 'TOP', position: 'TOP', tier: 'Platinum I', winRate: 51, kda: 2.4 },
  { id: 7, nickname: '블루내꺼', tag: 'BLUE', position: 'JUG', tier: 'Diamond II', winRate: 59, kda: 3.7 },
  { id: 8, nickname: '로밍갑니다', tag: 'ROAM', position: 'MID', tier: 'Emerald I', winRate: 55, kda: 3.3 },
  { id: 9, nickname: '카이팅머신', tag: 'KITE', position: 'ADC', tier: 'Diamond IV', winRate: 57, kda: 3.6 },
  { id: 10, nickname: '와드요정', tag: 'WARD', position: 'SUP', tier: 'Emerald III', winRate: 53, kda: 4.8 },
  { id: 11, nickname: '사이드장인', tag: 'SIDE', position: 'TOP', tier: 'Emerald II', winRate: 52, kda: 2.6 },
  { id: 12, nickname: '갱갈게요', tag: 'GANK', position: 'JUG', tier: 'Platinum I', winRate: 55, kda: 3.2 },
];

const teamDefinitions = [
  { name: '레드 드래곤', color: '#ff5252' },
  { name: '블루 피닉스', color: '#448aff' },
  { name: '그린 타이탄', color: '#00c853' },
  { name: '골드 그리핀', color: '#ffab00' },
  { name: '퍼플 나이츠', color: '#aa00ff' },
  { name: '실버 울브즈', color: '#90a4ae' },
  { name: '핑크 폭스', color: '#ff4081' },
  { name: '오렌지 타이거', color: '#ff6d00' },
  { name: '민트 샤크', color: '#00bfa5' },
  { name: '네이비 이글', color: '#536dfe' },
  { name: '화이트 베어', color: '#bdbdbd' },
  { name: '블랙 팬서', color: '#616161' },
];

const createTeams = (): AuctionTeam[] =>
  teamDefinitions.slice(0, props.teamCount).map((team, index) => ({
    id: index + 1,
    ...team,
    captain: props.captains[index] ?? `팀장 ${index + 1}`,
    captainAccountId: props.captainAccountIds[index] ?? 0,
    points: props.captainPoints[index] ?? 0,
    members: props.auctionPlayers
      .filter(
        (player) =>
          player.teamCaptainAccountId === (props.captainAccountIds[index] ?? 0)
      )
      .map((player) => ({
        player: {
          ...player,
          position: normalizePosition(player.position),
          winRate: 0,
          kda: 0,
        },
        price: player.winningBid ?? 0,
      })),
  }));

function normalizePosition(position: string): Position {
  const value = position.toUpperCase();
  if (value === 'JUNGLE' || value === 'JG') return 'JUG';
  if (value === 'BOTTOM' || value === 'BOT') return 'ADC';
  if (value === 'UTILITY' || value === 'SUPPORT') return 'SUP';
  return ['TOP', 'JUG', 'MID', 'ADC', 'SUP'].includes(value)
    ? (value as Position)
    : 'MID';
}

const configuredSeconds = ref(props.bidSeconds);
const startBid = 50;
const rosterLimit = Math.max(1, Math.ceil(props.auctionPlayers.length / props.teamCount));
const bidSteps = [10, 20, 50];
const players = ref<AuctionPlayer[]>(
  props.auctionPlayers
    .filter((player) => !player.teamCaptainAccountId && !player.isUnsold)
    .map((player) => ({
    ...player,
    position: normalizePosition(player.position),
    winRate: 0,
    kda: 0,
    }))
);
const unsoldPlayers = ref<AuctionPlayer[]>(
  props.auctionPlayers
    .filter((player) => !player.teamCaptainAccountId && player.isUnsold)
    .map((player) => ({
      ...player,
      position: normalizePosition(player.position),
      winRate: 0,
      kda: 0,
    }))
);
const teams = ref<AuctionTeam[]>(createTeams());
const currentPlayer = ref<AuctionPlayer | null>(null);
const currentBid = ref(startBid);
const highestTeamId = ref<number | null>(null);
const seconds = ref(configuredSeconds.value);
const isRunning = ref(false);
const isPaused = ref(false);
const bidStep = ref(10);
const positionFilter = ref('전체');
const bidError = ref('');
const soldPlayerIds = ref<number[]>([]);
const resultDialog = ref(false);
const lastResult = ref<{ player: AuctionPlayer; team: AuctionTeam; price: number } | null>(null);
const logs = ref<{ time: string; message: string }[]>([]);
const snackbar = ref({ show: false, message: '', color: 'success' });
const resetDialog = ref(false);
const resetting = ref(false);
let timerId: ReturnType<typeof setInterval> | null = null;
let socket: WebSocket | null = null;
const liveConnected = ref(false);

const positionFilters = ['전체', 'TOP', 'JUG', 'MID', 'ADC', 'SUP'];
const availablePlayers = computed(() =>
  players.value.filter((player) => !soldPlayerIds.value.includes(player.id))
);
const filteredPlayers = computed(() =>
  availablePlayers.value.filter(
    (player) => positionFilter.value === '전체' || player.position === positionFilter.value
  )
);
const highestTeam = computed(
  () => teams.value.find((team) => team.id === highestTeamId.value) ?? null
);
const timerProgress = computed(() => (seconds.value / configuredSeconds.value) * 100);
const soldCount = computed(() => soldPlayerIds.value.length);

function positionLabel(position: Position) {
  return ({ TOP: '탑', JUG: '정글', MID: '미드', ADC: '원딜', SUP: '서포터' })[position];
}

function positionColor(position: Position) {
  return ({ TOP: 'orange-darken-2', JUG: 'green-darken-2', MID: 'blue-darken-2', ADC: 'red-darken-2', SUP: 'purple-darken-2' })[position];
}

function initials(nickname: string) {
  return nickname.slice(0, 2);
}

function openFowProfile(player: AuctionPlayer) {
  let nickname = player.nickname.trim();
  let tag = player.tag?.trim() ?? '';

  if (!tag && nickname.includes('#')) {
    const separator = nickname.lastIndexOf('#');
    tag = nickname.slice(separator + 1).split('/')[0].trim();
    nickname = nickname.slice(0, separator).replace(/^\d+\//, '').trim();
  }

  if (!nickname || !tag) {
    window.open('https://www.fow.lol/', '_blank', 'noopener,noreferrer');
    showSnack('Riot 태그가 없어 FOW.LOL 검색 화면을 열었습니다.', 'info');
    return;
  }
  const summoner = `${nickname}-${tag}`;
  window.open(
    `https://www.fow.lol/find/kr/${encodeURIComponent(summoner)}`,
    '_blank',
    'noopener,noreferrer'
  );
}

function addLog(message: string) {
  logs.value.unshift({
    time: new Intl.DateTimeFormat('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date()),
    message,
  });
}

function showSnack(message: string, color = 'success') {
  snackbar.value = { show: true, message, color };
}

function nominate(player: AuctionPlayer) {
  if (isRunning.value) return;
  if (liveConnected.value && props.isOwner && player.accountId) {
    sendLive('select-player', {
      auctionId: props.auctionId,
      ownerId: props.currentAccountId,
      playerAccountId: player.accountId,
      seconds: configuredSeconds.value,
    });
  }
  applyNomination(player);
}

function applyNomination(player: AuctionPlayer) {
  resultDialog.value = false;
  unsoldPlayers.value = unsoldPlayers.value.filter((item) => item.id !== player.id);
  currentPlayer.value = player;
  currentBid.value = startBid;
  highestTeamId.value = null;
  seconds.value = configuredSeconds.value;
  bidError.value = '';
  addLog(`${player.nickname} 선수가 경매에 지명되었습니다.`);
}

function nominateNext() {
  const source = availablePlayers.value.length ? availablePlayers.value : unsoldPlayers.value;
  if (!source.length) return;
  const index = Math.floor(Math.random() * source.length);
  const player = source[index];
  if (!availablePlayers.value.length) {
    unsoldPlayers.value = unsoldPlayers.value.filter((item) => item.id !== player.id);
  }
  nominate(player);
}

function cancelNomination() {
  currentPlayer.value = null;
  highestTeamId.value = null;
  currentBid.value = startBid;
  seconds.value = configuredSeconds.value;
}

function startAuction() {
  if (!currentPlayer.value || isRunning.value) return;
  if (liveConnected.value && props.isOwner) {
    sendLive('start-timer', {
      auctionId: props.auctionId,
      ownerId: props.currentAccountId,
      seconds: configuredSeconds.value,
    });
    return;
  }
  applyTimerStart(configuredSeconds.value);
}

function applyTimerStart(duration: number) {
  if (!currentPlayer.value) return;

  isRunning.value = true;
  isPaused.value = false;
  configuredSeconds.value = Math.min(300, Math.max(5, Number(duration) || 20));
  seconds.value = configuredSeconds.value;
  addLog(`${currentPlayer.value.nickname} 선수 경매가 시작되었습니다.`);
  runTimer();
}

function runTimer() {
  timerId = setInterval(() => {
    seconds.value -= 1;
    if (seconds.value <= 0) {
      if (props.isOwner) {
        finishAuction();
      } else {
        clearTimer();
      }
    }
  }, 1000);
}

function canBid(team: AuctionTeam) {
  if (!isRunning.value || isPaused.value || team.members.length >= rosterLimit) return false;
  const nextBid = highestTeamId.value === null ? startBid : currentBid.value + bidStep.value;
  return (
    team.id !== highestTeamId.value &&
    team.points >= nextBid &&
    team.captainAccountId === props.currentAccountId
  );
}

function placeBid(team: AuctionTeam) {
  bidError.value = '';
  if (!isRunning.value) {
    bidError.value = '경매 시작 버튼을 먼저 눌러주세요.';
    return;
  }
  const nextBid = highestTeamId.value === null ? startBid : currentBid.value + bidStep.value;
  if (team.points < nextBid) {
    bidError.value = `${team.name} 팀의 포인트가 부족합니다.`;
    return;
  }
  if (liveConnected.value && currentPlayer.value?.accountId) {
    sendLive('bid', {
      auctionId: props.auctionId,
      captainAccountId: team.captainAccountId,
      playerAccountId: currentPlayer.value.accountId,
      amount: nextBid,
    });
    return;
  }
  applyBid(team, nextBid);
}

function applyBid(team: AuctionTeam, nextBid: number) {
  currentBid.value = nextBid;
  highestTeamId.value = team.id;
  seconds.value = Math.max(seconds.value, 8);
  addLog(`${team.name} 팀이 ${nextBid}P를 입찰했습니다.`);
}

function clearTimer() {
  if (timerId) clearInterval(timerId);
  timerId = null;
  isRunning.value = false;
  isPaused.value = false;
}

function toggleTimer() {
  if (!isRunning.value) return;
  if (liveConnected.value && props.isOwner) {
    sendLive('timer-toggle', {
      auctionId: props.auctionId,
      ownerId: props.currentAccountId,
      paused: !isPaused.value,
      seconds: seconds.value,
    });
    return;
  }
  applyTimerToggle(!isPaused.value, seconds.value);
}

function applyTimerToggle(paused: boolean, remainingSeconds: number) {
  seconds.value = remainingSeconds;
  if (!paused) {
    isPaused.value = false;
    addLog('초시계를 재개했습니다.');
    runTimer();
    return;
  }
  if (timerId) clearInterval(timerId);
  timerId = null;
  isPaused.value = true;
  addLog('초시계를 일시정지했습니다.');
}

function sendLive(event: string, data: unknown) {
  if (socket?.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ event, data }));
  }
}

function connectLiveAuction() {
  if (!props.webSocketUrl || !props.auctionId) return;
  socket = new WebSocket(props.webSocketUrl);
  socket.addEventListener('open', () => {
    liveConnected.value = true;
    sendLive('join', { auctionId: props.auctionId });
  });
  socket.addEventListener('close', () => {
    liveConnected.value = false;
  });
  socket.addEventListener('message', (message) => {
    try {
      const payload = JSON.parse(String(message.data));
      if (payload.event === 'player-selected') {
        const player =
          players.value.find((item) => item.accountId === payload.data.playerAccountId) ||
          unsoldPlayers.value.find((item) => item.accountId === payload.data.playerAccountId);
        if (player && currentPlayer.value?.accountId !== player.accountId) {
          applyNomination(player);
        }
      } else if (payload.event === 'timer-started') {
        applyTimerStart(payload.data.seconds);
      } else if (payload.event === 'bid-updated') {
        const team = teams.value.find(
          (item) => item.captainAccountId === payload.data.captainAccountId
        );
        if (team && payload.data.amount > 0) applyBid(team, payload.data.amount);
      } else if (payload.event === 'timer-toggled') {
        applyTimerToggle(payload.data.paused, payload.data.seconds);
      } else if (payload.event === 'player-awarded') {
        const team = teams.value.find(
          (item) => item.captainAccountId === payload.data.captainAccountId
        );
        const player =
          (currentPlayer.value?.accountId === payload.data.playerAccountId
            ? currentPlayer.value
            : null) ||
          players.value.find((item) => item.accountId === payload.data.playerAccountId) ||
          unsoldPlayers.value.find((item) => item.accountId === payload.data.playerAccountId);
        if (team && player) applyAward(team, player, payload.data.winningBid);
      } else if (payload.event === 'player-unsold') {
        const player =
          (currentPlayer.value?.accountId === payload.data.playerAccountId
            ? currentPlayer.value
            : null) ||
          players.value.find((item) => item.accountId === payload.data.playerAccountId) ||
          unsoldPlayers.value.find((item) => item.accountId === payload.data.playerAccountId);
        if (player) applyUnsold(player);
      }
    } catch {
      showSnack('실시간 경매 메시지를 처리하지 못했습니다.', 'error');
    }
  });
}

async function finishAuction() {
  clearTimer();

  // 낙찰/유찰 저장은 경매 생성자의 브라우저에서만 수행한다.
  // 참가자는 WebSocket으로 전달되는 player-awarded 이벤트를 통해 결과만 반영한다.
  if (!props.isOwner) return;

  if (!currentPlayer.value) return;
  if (!highestTeam.value) {
    const player = currentPlayer.value;
    if (!player.accountId) {
      showSnack('유찰 대상 정보를 확인할 수 없습니다.', 'error');
      return;
    }
    const saved = await props.markUnsold(player.accountId);
    if (!saved) {
      showSnack('유찰 정보를 저장하지 못했습니다.', 'error');
      return;
    }
    applyUnsold(player);
    if (availablePlayers.value.length || unsoldPlayers.value.length) nominateNext();
    return;
  }

  const team = highestTeam.value;
  const player = currentPlayer.value;
  if (!player.accountId || !team.captainAccountId) {
    showSnack('낙찰 대상 정보를 확인할 수 없습니다.', 'error');
    return;
  }
  const saved = await props.awardPlayer({
    playerAccountId: player.accountId,
    captainAccountId: team.captainAccountId,
    winningBid: currentBid.value,
  });
  if (!saved) {
    showSnack('낙찰 정보를 저장하지 못했습니다.', 'error');
    return;
  }

  // 저장 응답을 받은 진행자 화면에는 즉시 반영한다.
  // 다른 참가자 화면은 서버의 player-awarded 방송으로 갱신된다.
  applyAward(team, player, currentBid.value);
}

function applyAward(team: AuctionTeam, player: AuctionPlayer, winningBid: number) {
  if (soldPlayerIds.value.includes(player.id)) return;

  clearTimer();
  team.points -= winningBid;
  team.members.push({ player, price: winningBid });
  soldPlayerIds.value.push(player.id);
  players.value = players.value.filter((item) => item.id !== player.id);
  unsoldPlayers.value = unsoldPlayers.value.filter((item) => item.id !== player.id);
  lastResult.value = { player, team, price: winningBid };
  addLog(`${player.nickname} → ${team.name}, ${winningBid}P 낙찰`);
  resultDialog.value = true;
}

function applyUnsold(player: AuctionPlayer) {
  if (unsoldPlayers.value.some((item) => item.id === player.id)) return;

  clearTimer();
  addLog(`${player.nickname} 선수가 유찰되었습니다.`);
  players.value = players.value.filter((item) => item.id !== player.id);
  unsoldPlayers.value.push(player);
  if (currentPlayer.value?.id === player.id) {
    currentPlayer.value = null;
    highestTeamId.value = null;
    currentBid.value = startBid;
    seconds.value = configuredSeconds.value;
  }
  showSnack('입찰 팀이 없어 유찰되었습니다.', 'warning');
}

function closeResultAndContinue() {
  if (!props.isOwner) return;

  resultDialog.value = false;
  currentPlayer.value = null;
  highestTeamId.value = null;
  currentBid.value = startBid;
  seconds.value = configuredSeconds.value;
  bidError.value = '';
  if (props.isOwner && (availablePlayers.value.length || unsoldPlayers.value.length)) {
    nominateNext();
  }
}

function dismissResultDialog() {
  resultDialog.value = false;
}

function resetLocalState() {
  clearTimer();
  teams.value = createTeams();
  soldPlayerIds.value = [];
  currentPlayer.value = null;
  highestTeamId.value = null;
  currentBid.value = startBid;
  seconds.value = configuredSeconds.value;
  logs.value = [];
  lastResult.value = null;
  resultDialog.value = false;
  showSnack('경매가 초기화되었습니다.');
}

async function confirmReset() {
  if (resetting.value) return;
  resetting.value = true;
  const success = await props.resetAuction();
  resetting.value = false;
  if (!success) {
    resetDialog.value = false;
    showSnack('경매를 초기화하지 못했습니다.', 'error');
    return;
  }
  resetLocalState();
  resetDialog.value = false;
}

function openResetDialog() {
  if (isRunning.value && !isPaused.value) {
    toggleTimer();
  }
  resetDialog.value = true;
}

onMounted(connectLiveAuction);
onBeforeUnmount(() => {
  clearTimer();
  socket?.close();
});
</script>

<style scoped>
.auction-page {
  max-width: 1440px;
}

.auction-stage {
  border: 1px solid rgba(187, 134, 252, 0.22);
  background: linear-gradient(145deg, rgba(35, 31, 48, 0.98), rgba(25, 25, 29, 0.98));
}

.stage-top {
  background:
    radial-gradient(circle at 85% 0%, rgba(124, 77, 255, 0.24), transparent 38%),
    linear-gradient(90deg, rgba(124, 77, 255, 0.08), transparent);
}

.player-spotlight {
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.035);
}

.bid-price {
  font-size: clamp(2.2rem, 6vw, 4.3rem);
  line-height: 1;
  font-weight: 900;
  letter-spacing: -0.05em;
  color: #d1b3ff;
}

.bid-team-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.empty-stage {
  min-height: 390px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.pool-player {
  width: 100%;
  min-height: 66px;
  padding: 10px 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  color: inherit;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.025);
  cursor: pointer;
  transition: 0.18s ease;
}

.pool-player:hover,
.pool-player.selected {
  border-color: rgba(187, 134, 252, 0.7);
  background: rgba(187, 134, 252, 0.1);
  transform: translateY(-1px);
}

.pool-player:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.pool-player.disabled {
  cursor: default;
  opacity: 0.7;
}

.profile-clickable {
  cursor: pointer;
}

.team-stack {
  position: sticky;
  top: 16px;
}

.team-card {
  border-left: 4px solid var(--team-color);
}

.roster-list {
  display: grid;
  gap: 7px;
}

.roster-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 9px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.04);
}

.empty-roster {
  border: 1px dashed rgba(255, 255, 255, 0.12);
  border-radius: 10px;
}

.unsold-card {
  border: 1px solid rgba(255, 171, 0, 0.22);
}

.unsold-player {
  border-color: rgba(255, 171, 0, 0.28);
  cursor: default;
}

.auction-log {
  max-height: 280px;
  overflow-y: auto;
}

.log-row {
  display: grid;
  grid-template-columns: 72px 1fr;
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.log-time {
  color: rgba(255, 255, 255, 0.45);
  font-size: 0.72rem;
}

@media (max-width: 600px) {
  .bid-team-grid {
    grid-template-columns: 1fr;
  }

  .team-stack {
    position: static;
  }
}
</style>
