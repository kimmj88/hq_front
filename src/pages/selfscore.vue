<template>
  <v-container class="py-6" style="max-width: 960px">
    <v-card rounded="xl" elevation="3" class="pa-6 mb-6 score-hero">
      <div class="d-flex flex-wrap align-center justify-space-between" style="gap: 16px">
        <div>
          <div class="text-h4 font-weight-bold mb-2">롤 멸망전 점수 조회</div>
          <div class="text-body-1 text-medium-emphasis">
            소환사 아이디를 입력하면 현재 시즌 기준 점수를 확인할 수 있습니다.
          </div>
        </div>

        <v-chip color="amber-darken-1" variant="flat" size="large"> 시즌 점수 산정 </v-chip>
      </div>
    </v-card>

    <v-card rounded="xl" elevation="2" class="pa-5 mb-6">
      <v-row>
        <v-col cols="12" md="5">
          <v-text-field
            v-model="form.gameName"
            label="소환사명"
            variant="outlined"
            density="comfortable"
            prepend-inner-icon="mdi-account"
            clearable
            @keyup.enter="searchPlayer"
          />
        </v-col>

        <v-col cols="12" md="4">
          <v-text-field
            v-model="form.tagLine"
            label="태그"
            variant="outlined"
            density="comfortable"
            prepend-inner-icon="mdi-pound"
            clearable
            @keyup.enter="searchPlayer"
          />
        </v-col>

        <v-col cols="12" md="3">
          <v-select
            v-model="selectedPosition"
            :items="positionOptions"
            label="포지션"
            variant="outlined"
            density="comfortable"
            prepend-inner-icon="mdi-sword"
          />
        </v-col>

        <v-col cols="12" md="3" class="d-flex align-center">
          <v-btn
            color="indigo"
            block
            size="large"
            :loading="loading"
            :disabled="!canSearch"
            @click="searchPlayer"
          >
            점수 조회
          </v-btn>
        </v-col>
      </v-row>

      <div class="text-caption text-medium-emphasis mt-2">예시: Hide on bush / KR1</div>
    </v-card>

    <v-alert
      v-if="errorMessage"
      type="error"
      variant="tonal"
      class="mb-6"
      closable
      @click:close="errorMessage = ''"
    >
      {{ errorMessage }}
    </v-alert>

    <template v-if="result">
      <v-row class="mb-4">
        <v-col cols="12" md="4">
          <v-card rounded="xl" elevation="2" class="pa-5 stat-card">
            <div class="d-flex align-center justify-space-between">
              <div>
                <div class="text-caption text-medium-emphasis">현재 티어</div>
                <div class="text-h5 font-weight-bold mt-1">{{ result.tier }} {{ result.rank }}</div>
              </div>
              <v-icon size="34" icon="mdi-shield-sword" />
            </div>
            <div class="mt-3 text-body-2">LP {{ result.lp }}</div>
          </v-card>
        </v-col>

        <v-col cols="12" md="4">
          <v-card rounded="xl" elevation="2" class="pa-5 stat-card">
            <div class="d-flex align-center justify-space-between">
              <div>
                <div class="text-caption text-medium-emphasis">현재 시즌 판수</div>
                <div class="text-h5 font-weight-bold mt-1">{{ result.totalGames }}</div>
              </div>
              <v-icon size="34" icon="mdi-sword-cross" />
            </div>
            <div class="mt-3 text-body-2">{{ result.wins }}승 {{ result.losses }}패</div>
          </v-card>
        </v-col>

        <v-col cols="12" md="4">
          <v-card rounded="xl" elevation="2" class="pa-5 stat-card score-card-main">
            <div class="d-flex align-center justify-space-between">
              <div>
                <div class="text-caption text-medium-emphasis">멸망전 점수</div>
                <div class="text-h4 font-weight-black mt-1">{{ result.meltdownScore }}</div>
              </div>
              <v-icon size="38" icon="mdi-trophy" />
            </div>
            <div class="mt-3 text-body-2">내부 환산 점수</div>
          </v-card>
        </v-col>
      </v-row>

      <v-card rounded="xl" elevation="2" class="pa-5 mb-6">
        <div class="d-flex align-center justify-space-between mb-4">
          <div>
            <div class="text-h6 font-weight-bold">{{ result.gameName }}#{{ result.tagLine }}</div>
            <div class="text-body-2 text-medium-emphasis">현재 시즌 기준 조회 결과</div>
          </div>

          <!-- <v-chip color="success" variant="flat"> 최고점수 {{ result.peakScore }} </v-chip> -->
        </div>

        <v-divider class="mb-4" />

        <v-row>
          <v-col cols="12" md="6">
            <!-- <div class="info-row">
              <span class="label">현재 티어</span>
              <span class="value">{{ result.tier }} {{ result.rank }}</span>
            </div> -->
            <!-- <div class="info-row">
              <span class="label">현재 LP</span>
              <span class="value">{{ result.lp }}</span>
            </div> -->
            <div class="info-row">
              <span class="label">솔로랭크 판수 어드벤티지</span>
              <span class="value">- {{ result.soloPanalty }}</span>
            </div>
            <div class="info-row">
              <span class="label">난전 우승 패널티</span>
              <span class="value">+ {{ result.maincupPanalty }}</span>
            </div>
            <div class="info-row">
              <span class="label">경매 우승 패널티</span>
              <span class="value">+ {{ result.subcupPanalty }}</span>
            </div>
            <div class="info-row">
              <span class="label">솔로랭크 100판이하 패널티</span>
              <span class="value">+ {{ result.soloCountPanalty }}</span>
            </div>
          </v-col>

          <v-col cols="12" md="6">
            <!-- <div class="info-row">
              <span class="label">탑 레이팅</span>
              <span class="value">{{ result.peakTier }} {{ result.peakRank }}</span>
            </div> -->
            <!-- <div class="info-row">
              <span class="label">최고 LP</span>
              <span class="value">{{ result.peakLp }}</span>
            </div> -->
            <!-- <div class="info-row">
              <span class="label">멸망전 점수</span>
              <span class="value score-text">{{ result.meltdownScore }}</span>
            </div> -->
            <div class="info-row">
              <span class="label">최근 갱신</span>
              <span class="value">{{ result.updatedAt }}</span>
            </div>
          </v-col>
        </v-row>
      </v-card>
    </template>

    <v-card rounded="xl" elevation="1" class="pa-5">
      <div class="text-h6 font-weight-bold mb-3">점수 산정 예시</div>
      <v-list density="comfortable">
        <v-list-item>
          <template #prepend><v-icon icon="mdi-circle-small" /></template>
          <v-list-item-title>솔로랭크 어드벤티지 100(-0.3), 200(-0.6), 300(-0.8)</v-list-item-title>
        </v-list-item>
        <v-list-item>
          <template #prepend><v-icon icon="mdi-circle-small" /></template>
          <v-list-item-title>난전우승 패널티 1회당 +2.5</v-list-item-title>
        </v-list-item>
        <v-list-item>
          <template #prepend><v-icon icon="mdi-circle-small" /></template>
          <v-list-item-title>경매내전 패널티 1회당 1.1 최대3회 까지만</v-list-item-title>
        </v-list-item>
        <v-list-item>
          <template #prepend><v-icon icon="mdi-circle-small" /></template>
          <v-list-item-title>솔로랭크 패널티 100판이하 + 2</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { getBaseUrl } from '@/@core/composable/createUrl';
import api from '@/@core/composable/useAxios';
import axios from 'axios';

type ScoreResult = {
  gameName: string;
  tagLine: string;
  tier: string;
  rank: string;
  lp: number;
  wins: number;
  losses: number;
  totalGames: number;
  peakTier: string;
  peakRank: string;
  peakLp: number;
  peakScore: number;
  meltdownScore: number;
  updatedAt: string;

  soloPanalty: number;
  soloCountPanalty: number;
  maincupPanalty: number;
  subcupPanalty: number;
};

type PositionKey = 'TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUP';

const loading = ref(false);
const errorMessage = ref('');
const result = ref<ScoreResult | null>(null);

const form = reactive({
  gameName: '',
  tagLine: '',
});

const selectedPosition = ref<PositionKey>('MID');

const positionOptions = [
  { title: '탑', value: 'TOP' },
  { title: '정글', value: 'JUNGLE' },
  { title: '미드', value: 'MID' },
  { title: '원딜', value: 'ADC' },
  { title: '서폿', value: 'SUP' },
];

const canSearch = computed(() => {
  return (
    form.gameName.trim().length > 0 && form.tagLine.trim().length > 0 && !!selectedPosition.value
  );
});

/**
 * 점수표 원본
 * key: 표의 티어 문자열
 * value: 포지션별 점수
 */
const tierScoreTable: Record<string, Record<PositionKey, number>> = {
  '마/그/챌 1800 이상': { TOP: 67, JUNGLE: 66, MID: 62, ADC: 65, SUP: 52 },
  '마/그/챌 1700 ~ 1799': { TOP: 66, JUNGLE: 64.3, MID: 61.1, ADC: 64.7, SUP: 51.5 },
  '마/그/챌 1600 ~ 1699': { TOP: 65.5, JUNGLE: 63.8, MID: 60.8, ADC: 64.4, SUP: 50.9 },
  '마/그/챌 1500 ~ 1599': { TOP: 64.6, JUNGLE: 63.3, MID: 59.9, ADC: 64.2, SUP: 50.6 },
  '마/그/챌 1400 ~ 1499': { TOP: 63.8, JUNGLE: 62.2, MID: 58.2, ADC: 63.9, SUP: 50.1 },
  '마/그/챌 1300 ~ 1399': { TOP: 63.1, JUNGLE: 61.3, MID: 57.3, ADC: 63.3, SUP: 49.8 },
  '마/그/챌 1200 ~ 1299': { TOP: 62.4, JUNGLE: 60.5, MID: 56, ADC: 62.7, SUP: 49.3 },
  '마/그/챌 1100 ~ 1199': { TOP: 59.9, JUNGLE: 59.4, MID: 54.7, ADC: 62.2, SUP: 48.7 },
  '마/그/챌 1000 ~ 1099': { TOP: 57.8, JUNGLE: 57.7, MID: 53.1, ADC: 61.3, SUP: 48 },
  '마/그/챌 900 ~ 999': { TOP: 54.8, JUNGLE: 55.4, MID: 51.4, ADC: 58.8, SUP: 46.2 },
  '마/그/챌 800 ~ 899': { TOP: 52.6, JUNGLE: 53.1, MID: 50.2, ADC: 56.1, SUP: 44.5 },
  '마/그/챌 700 ~ 799': { TOP: 51.3, JUNGLE: 50.6, MID: 49.3, ADC: 53.7, SUP: 42.8 },
  '마/그/챌 600 ~ 699': { TOP: 49.7, JUNGLE: 48.4, MID: 48, ADC: 51.1, SUP: 41.1 },
  '마/그/챌 500 ~ 599': { TOP: 47.9, JUNGLE: 46.3, MID: 46.2, ADC: 48.6, SUP: 39 },
  '마/그/챌 400 ~ 499': { TOP: 45.2, JUNGLE: 44.3, MID: 45.2, ADC: 46.2, SUP: 37.7 },
  '마/그/챌 300 ~ 399': { TOP: 43, JUNGLE: 42.4, MID: 44.7, ADC: 43.5, SUP: 36.1 },
  '마/그/챌 200 ~ 299': { TOP: 41.8, JUNGLE: 40.6, MID: 43, ADC: 40.6, SUP: 35 },
  '마/그/챌 100 ~ 199': { TOP: 39.1, JUNGLE: 39.4, MID: 41.3, ADC: 38.3, SUP: 34 },
  '마/그/챌 0 ~ 99': { TOP: 37.4, JUNGLE: 38.2, MID: 39.8, ADC: 36.1, SUP: 33.1 },

  다이아1: { TOP: 35.7, JUNGLE: 36.8, MID: 36.7, ADC: 34, SUP: 32.2 },
  다이아2: { TOP: 33.8, JUNGLE: 34.8, MID: 36, ADC: 32.1, SUP: 31.3 },
  다이아3: { TOP: 31.6, JUNGLE: 32.5, MID: 35.1, ADC: 29.7, SUP: 30.3 },
  다이아4: { TOP: 30.3, JUNGLE: 30.7, MID: 33.4, ADC: 27.6, SUP: 29.3 },

  에메랄드1: { TOP: 28.6, JUNGLE: 28.8, MID: 32.6, ADC: 25.7, SUP: 28.2 },
  에메랄드2: { TOP: 27.3, JUNGLE: 26.6, MID: 31, ADC: 24.3, SUP: 27 },
  에메랄드3: { TOP: 26.5, JUNGLE: 24.8, MID: 29.8, ADC: 22.8, SUP: 26 },
  에메랄드4: { TOP: 26, JUNGLE: 23.4, MID: 27.6, ADC: 21.6, SUP: 25.1 },

  플래티넘1: { TOP: 25.2, JUNGLE: 21.9, MID: 25.1, ADC: 20.3, SUP: 24.2 },
  플래티넘2: { TOP: 24.7, JUNGLE: 20.5, MID: 22.3, ADC: 18.7, SUP: 22.8 },
  플래티넘3: { TOP: 24, JUNGLE: 19.3, MID: 20.7, ADC: 17.5, SUP: 22 },
  플래티넘4: { TOP: 21.2, JUNGLE: 18.1, MID: 20.1, ADC: 16.4, SUP: 21.2 },

  골드1: { TOP: 19, JUNGLE: 16.7, MID: 18.7, ADC: 15.1, SUP: 20.5 },
  골드2: { TOP: 17.7, JUNGLE: 14.7, MID: 15.8, ADC: 13.4, SUP: 19.1 },
  골드3: { TOP: 15.9, JUNGLE: 13.8, MID: 14.8, ADC: 12.6, SUP: 18.3 },
  골드4: { TOP: 14.6, JUNGLE: 12.8, MID: 13.9, ADC: 11.9, SUP: 17.6 },

  실버1: { TOP: 13, JUNGLE: 11.9, MID: 12.8, ADC: 11.3, SUP: 16.7 },
  실버2: { TOP: 12, JUNGLE: 11, MID: 11.9, ADC: 10.6, SUP: 15.9 },
  '실버3 이하': { TOP: 11, JUNGLE: 10, MID: 13, ADC: 10, SUP: 15 },
};

function getPositionLabel(position: PositionKey): string {
  const map: Record<PositionKey, string> = {
    TOP: '탑',
    JUNGLE: '정글',
    MID: '미드',
    ADC: '원딜',
    SUP: '서폿',
  };
  return map[position];
}

function getMasterPlusKey(lp: number): string {
  if (lp >= 1800) return '마/그/챌 1800 이상';
  if (lp >= 1700) return '마/그/챌 1700 ~ 1799';
  if (lp >= 1600) return '마/그/챌 1600 ~ 1699';
  if (lp >= 1500) return '마/그/챌 1500 ~ 1599';
  if (lp >= 1400) return '마/그/챌 1400 ~ 1499';
  if (lp >= 1300) return '마/그/챌 1300 ~ 1399';
  if (lp >= 1200) return '마/그/챌 1200 ~ 1299';
  if (lp >= 1100) return '마/그/챌 1100 ~ 1199';
  if (lp >= 1000) return '마/그/챌 1000 ~ 1099';
  if (lp >= 900) return '마/그/챌 900 ~ 999';
  if (lp >= 800) return '마/그/챌 800 ~ 899';
  if (lp >= 700) return '마/그/챌 700 ~ 799';
  if (lp >= 600) return '마/그/챌 600 ~ 699';
  if (lp >= 500) return '마/그/챌 500 ~ 599';
  if (lp >= 400) return '마/그/챌 400 ~ 499';
  if (lp >= 300) return '마/그/챌 300 ~ 399';
  if (lp >= 200) return '마/그/챌 200 ~ 299';
  if (lp >= 100) return '마/그/챌 100 ~ 199';
  return '마/그/챌 0 ~ 99';
}

function getTierTableKey(tier: string, rank: string, lp: number): string {
  const upperTier = tier.toUpperCase();
  const upperRank = rank.toUpperCase();

  if (['MASTER', 'GRANDMASTER', 'CHALLENGER'].includes(upperTier)) {
    return getMasterPlusKey(lp);
  }

  if (upperTier === 'DIAMOND')
    return `다이아${upperRank === 'I' ? 1 : upperRank === 'II' ? 2 : upperRank === 'III' ? 3 : 4}`;
  if (upperTier === 'EMERALD')
    return `에메랄드${
      upperRank === 'I' ? 1 : upperRank === 'II' ? 2 : upperRank === 'III' ? 3 : 4
    }`;
  if (upperTier === 'PLATINUM')
    return `플래티넘${
      upperRank === 'I' ? 1 : upperRank === 'II' ? 2 : upperRank === 'III' ? 3 : 4
    }`;
  if (upperTier === 'GOLD')
    return `골드${upperRank === 'I' ? 1 : upperRank === 'II' ? 2 : upperRank === 'III' ? 3 : 4}`;
  if (upperTier === 'SILVER') {
    if (upperRank === 'I') return '실버1';
    if (upperRank === 'II') return '실버2';
    return '실버3 이하';
  }

  return '실버3 이하';
}

function getTierScore(tier: string, rank: string, lp: number, position: PositionKey): number {
  const key = getTierTableKey(tier, rank, lp);
  return tierScoreTable[key]?.[position] ?? 0;
}

function getGamePenalty(totalGames: number): number {
  let score = 0;
  if (totalGames >= 300) score += -0.8;
  if (totalGames >= 200) score += -0.6;
  if (totalGames >= 100) score += -0.3;

  return score;
}

async function searchPlayer() {
  if (!canSearch.value) return;

  loading.value = true;
  errorMessage.value = '';
  result.value = null;

  try {
    const name = encodeURIComponent(form.gameName.trim());
    const tag = encodeURIComponent(form.tagLine.trim());

    const a = await axios.get(
      `https://asia.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${name}/${tag}`,
      {
        headers: {
          'X-Riot-Token': 'RGAPI-ee1558af-f139-456c-aaf5-0e7b82135e35',
        },
      }
    );

    const puuid = a.data.puuid;

    const b = await axios.get(
      `https://kr.api.riotgames.com/lol/league/v4/entries/by-puuid/${encodeURIComponent(puuid)}`,
      {
        headers: {
          'X-Riot-Token': 'RGAPI-ee1558af-f139-456c-aaf5-0e7b82135e35',
        },
      }
    );

    const solo = b.data.find((item: any) => item.queueType === 'RANKED_SOLO_5x5');

    if (!solo) {
      errorMessage.value = '솔로랭크 정보가 없습니다.';
      return;
    }

    const res = await api.post(`${getBaseUrl('DATA')}/player/list`, {
      nickname: form.gameName.trim(),
      tagname: form.tagLine.trim(),
    });

    const totalGames = Number(solo.wins) + Number(solo.losses);

    const tierScore = getTierScore(
      solo.tier,
      solo.rank,
      Number(solo.leaguePoints),
      selectedPosition.value
    );

    const soloPanalty = getGamePenalty(totalGames);
    const maincupPanalty = res.data.datas[0].cup_count * 2.5;
    let subcupPanalty = 0;
    const soloCountPanalty = totalGames < 100 ? 2 : 0;

    if (res.data.datas[0].sub_cup_count >= 3) {
      subcupPanalty = 3 * 1.1;
    } else {
      subcupPanalty = res.data.datas[0].sub_cup_count * 1.1;
    }

    const penalty = soloPanalty + maincupPanalty + subcupPanalty + soloCountPanalty;
    debugger;

    const finalScore = Number((tierScore + penalty).toFixed(1));

    result.value = {
      gameName: form.gameName.trim(),
      tagLine: form.tagLine.trim(),
      tier: solo.tier,
      rank: solo.rank,
      lp: Number(solo.leaguePoints),
      wins: Number(solo.wins),
      losses: Number(solo.losses),
      totalGames,
      peakTier: solo.tier,
      peakRank: solo.rank,
      peakLp: Number(solo.leaguePoints),
      soloPanalty: soloPanalty,
      soloCountPanalty: totalGames < 100 ? 2 : 0,
      maincupPanalty: maincupPanalty,
      subcupPanalty: subcupPanalty,
      peakScore: finalScore,
      meltdownScore: finalScore,
      updatedAt: `${new Date().toLocaleString('ko-KR')} / ${getPositionLabel(
        selectedPosition.value
      )}`,
    };
  } catch (e) {
    console.error('라이엇 조회 실패', e);
    errorMessage.value = '소환사 조회에 실패했습니다.';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.score-hero {
  background: linear-gradient(135deg, rgba(63, 81, 181, 0.18), rgba(255, 193, 7, 0.12));
}

.stat-card {
  height: 100%;
}

.score-card-main {
  background: linear-gradient(135deg, rgba(255, 193, 7, 0.18), rgba(255, 152, 0, 0.12));
}

.info-row {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 10px 0;
  border-bottom: 1px solid rgba(120, 120, 120, 0.18);
}

.info-row:last-child {
  border-bottom: none;
}

.label {
  color: rgba(120, 120, 120, 0.95);
  font-size: 14px;
}

.value {
  font-weight: 700;
  text-align: right;
}

.score-text {
  color: rgb(255, 179, 0);
}
</style>
