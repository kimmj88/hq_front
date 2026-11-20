<template>
  <v-container class="py-6" style="max-width: 960px">
    <v-card rounded="xl" elevation="3" class="pa-6 mb-6 score-hero">
      <div class="d-flex flex-wrap align-center justify-space-between" style="gap: 16px">
        <div>
          <div class="text-h4 font-weight-bold mb-2">롤 멸망전 점수 조회</div>
          <div class="text-body-1 text-medium-emphasis">
            등록된 플레이어의 클랜 티어와 포지션 기준 점수를 확인할 수 있습니다.
          </div>
        </div>

        <v-chip color="amber-darken-1" variant="flat" size="large"> 시즌 점수 산정 </v-chip>
      </div>
    </v-card>

    <v-card rounded="xl" elevation="2" class="pa-5 mb-6">
      <v-row>
        <v-col cols="12" md="4">
          <v-text-field
            v-model="form.gameName"
            label="소환사명 또는 Riot ID"
            variant="outlined"
            density="comfortable"
            prepend-inner-icon="mdi-account"
            clearable
            placeholder="소환사명 또는 소환사명#태그"
            @keyup.enter="searchPlayer"
          />
        </v-col>

        <v-col cols="12" md="3">
          <v-text-field
            v-model="form.tagLine"
            label="태그 (# 포함 가능)"
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

        <v-col cols="12" md="2" class="d-flex align-center">
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

      <div class="text-caption text-medium-emphasis mt-2">
        예시: Hide on bush / KR1 또는 Hide on bush#KR1
      </div>
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
                <div class="text-caption text-medium-emphasis">클랜 티어</div>
                <div class="text-h5 font-weight-bold mt-1">{{ result.tier }}</div>
              </div>
              <v-icon size="34" icon="mdi-shield-sword" />
            </div>
            <div class="mt-3 text-body-2">관리자가 설정한 클랜 티어</div>
          </v-card>
        </v-col>

        <v-col cols="12" md="4">
          <v-card rounded="xl" elevation="2" class="pa-5 stat-card">
            <div class="d-flex align-center justify-space-between">
              <div>
                <div class="text-caption text-medium-emphasis">기준 포지션</div>
                <div class="text-h5 font-weight-bold mt-1">{{ result.positionLabel }}</div>
              </div>
              <v-icon size="34" icon="mdi-sword-cross" />
            </div>
            <div class="mt-3 text-body-2">포지션별 멸망전 점수표</div>
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
            <div class="mt-3 text-body-2">내전 매치 어드벤티지를 반영한 최종 점수</div>
          </v-card>
        </v-col>
      </v-row>

      <v-card rounded="xl" elevation="2" class="pa-5 mb-6">
        <div class="d-flex align-center justify-space-between mb-4">
          <div>
            <div class="text-h6 font-weight-bold">{{ result.gameName }}#{{ result.tagLine }}</div>
            <div class="text-body-2 text-medium-emphasis">등록 플레이어 기준 조회 결과</div>
          </div>

          <!-- <v-chip color="success" variant="flat"> 최고점수 {{ result.peakScore }} </v-chip> -->
        </div>

        <v-divider class="mb-4" />

        <v-row>
          <v-col cols="12" md="6">
            <div class="info-row">
              <span class="label">클랜 티어</span>
              <span class="value">{{ result.tier }}</span>
            </div>
            <div class="info-row">
              <span class="label">기본 점수</span>
              <span class="value">{{ result.peakScore }}점</span>
            </div>
            <div class="info-row">
              <span class="label">내전 매치 어드벤티지 ({{ result.matchCount }}판)</span>
              <span class="value">{{ -result.matchDiscount }}점</span>
            </div>
          </v-col>

          <v-col cols="12" md="6">
            <div class="info-row">
              <span class="label">조회 기준</span>
              <span class="value">{{ result.updatedAt }}</span>
            </div>
          </v-col>
        </v-row>
      </v-card>
    </template>

    <v-card rounded="xl" elevation="1" class="pa-5">
      <div class="text-h6 font-weight-bold mb-3">점수 기준</div>
      <v-list density="comfortable">
        <v-list-item>
          <template #prepend><v-icon icon="mdi-circle-small" /></template>
          <v-list-item-title class="text-wrap">
            내전 매치 누적 {{ matchThreshold }}판 이상이면 기본 점수에서 {{ matchAdvantage }}점을 한
            번 차감합니다.
          </v-list-item-title>
        </v-list-item>
        <v-list-item>
          <template #prepend><v-icon icon="mdi-circle-small" /></template>
          <v-list-item-title class="text-wrap"
            >등록된 플레이어의 클랜 티어를 사용합니다.</v-list-item-title
          >
        </v-list-item>
        <v-list-item>
          <template #prepend><v-icon icon="mdi-circle-small" /></template>
          <v-list-item-title class="text-wrap"
            >클랜 티어와 선택 포지션으로 기본 점수를 산정합니다.</v-list-item-title
          >
        </v-list-item>
        <v-list-item>
          <template #prepend><v-icon icon="mdi-circle-small" /></template>
          <v-list-item-title class="text-wrap"
            >같은 티어에서 미드와 원딜의 점수 차이는 최대 2점입니다.</v-list-item-title
          >
        </v-list-item>
      </v-list>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { getBaseUrl } from '@/@core/composable/createUrl';
import api from '@/@core/composable/useAxios';
import type { Player } from '@/data/types/player';

type ScoreResult = {
  gameName: string;
  tagLine: string;
  tier: string;
  peakScore: number;
  matchCount: number;
  matchDiscount: number;
  meltdownScore: number;
  updatedAt: string;
  positionLabel: string;
};

type PositionKey = 'TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUP';

const matchThreshold = 100;
const matchAdvantage = 1.2;

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

function getSearchRiotId(): { gameName: string; tagLine: string } | null {
  const rawGameName = form.gameName.trim();
  let gameName = rawGameName;
  let tagLine = form.tagLine.trim().replace(/^#+/, '');
  const separatorIndex = rawGameName.lastIndexOf('#');

  if (separatorIndex > 0) {
    gameName = rawGameName.slice(0, separatorIndex).trim();
    if (!tagLine) {
      tagLine = rawGameName
        .slice(separatorIndex + 1)
        .trim()
        .replace(/^#+/, '');
    }
  }

  return gameName && tagLine ? { gameName, tagLine } : null;
}

const canSearch = computed(() => getSearchRiotId() !== null && !!selectedPosition.value);

/**
 * 점수표
 * key: 표의 티어 문자열
 * value: 포지션별 점수
 */
const tierScoreTable: Record<string, Record<PositionKey, number>> = {
  '마/그/챌 1800 이상': { TOP: 67, JUNGLE: 66, MID: 62.5, ADC: 64.5, SUP: 52 },
  '마/그/챌 1700 ~ 1799': { TOP: 66, JUNGLE: 64.3, MID: 61.9, ADC: 63.9, SUP: 51.5 },
  '마/그/챌 1600 ~ 1699': { TOP: 65.5, JUNGLE: 63.8, MID: 61.6, ADC: 63.6, SUP: 50.9 },
  '마/그/챌 1500 ~ 1599': { TOP: 64.6, JUNGLE: 63.3, MID: 61, ADC: 63, SUP: 50.6 },
  '마/그/챌 1400 ~ 1499': { TOP: 63.8, JUNGLE: 62.2, MID: 60, ADC: 62, SUP: 50.1 },
  '마/그/챌 1300 ~ 1399': { TOP: 63.1, JUNGLE: 61.3, MID: 59.3, ADC: 61.3, SUP: 49.8 },
  '마/그/챌 1200 ~ 1299': { TOP: 62.4, JUNGLE: 60.5, MID: 58.4, ADC: 60.4, SUP: 49.3 },
  '마/그/챌 1100 ~ 1199': { TOP: 59.9, JUNGLE: 59.4, MID: 57.5, ADC: 59.5, SUP: 48.7 },
  '마/그/챌 1000 ~ 1099': { TOP: 57.8, JUNGLE: 57.7, MID: 56.2, ADC: 58.2, SUP: 48 },
  '마/그/챌 900 ~ 999': { TOP: 54.8, JUNGLE: 55.4, MID: 54.1, ADC: 56.1, SUP: 46.2 },
  '마/그/챌 800 ~ 899': { TOP: 52.6, JUNGLE: 53.1, MID: 52.2, ADC: 54.2, SUP: 44.5 },
  '마/그/챌 700 ~ 799': { TOP: 51.3, JUNGLE: 50.6, MID: 50.5, ADC: 52.5, SUP: 42.8 },
  '마/그/챌 600 ~ 699': { TOP: 49.7, JUNGLE: 48.4, MID: 48.5, ADC: 50.5, SUP: 41.1 },
  '마/그/챌 500 ~ 599': { TOP: 47.9, JUNGLE: 46.3, MID: 46.4, ADC: 48.4, SUP: 39 },
  '마/그/챌 400 ~ 499': { TOP: 45.2, JUNGLE: 44.3, MID: 45.2, ADC: 46.2, SUP: 37.7 },
  '마/그/챌 300 ~ 399': { TOP: 43, JUNGLE: 42.4, MID: 44.7, ADC: 43.5, SUP: 36.1 },
  '마/그/챌 200 ~ 299': { TOP: 41.8, JUNGLE: 40.6, MID: 42.8, ADC: 40.8, SUP: 35 },
  '마/그/챌 100 ~ 199': { TOP: 39.1, JUNGLE: 39.4, MID: 40.8, ADC: 38.8, SUP: 34 },
  '마/그/챌 0 ~ 99': { TOP: 37.4, JUNGLE: 38.2, MID: 39, ADC: 37, SUP: 35.1 },

  다이아1: { TOP: 35.7, JUNGLE: 36.8, MID: 36.4, ADC: 35.4, SUP: 34.2 },
  다이아2: { TOP: 33.8, JUNGLE: 34.6, MID: 35, ADC: 33.6, SUP: 32.3 },
  다이아3: { TOP: 31.6, JUNGLE: 32.9, MID: 33.4, ADC: 32.8, SUP: 30.3 },
  다이아4: { TOP: 30.3, JUNGLE: 31.7, MID: 31.5, ADC: 30.9, SUP: 29.3 },

  에메랄드1: { TOP: 28.6, JUNGLE: 29.8, MID: 30.1, ADC: 29.7, SUP: 30.1 },
  에메랄드2: { TOP: 27.3, JUNGLE: 27.6, MID: 28.9, ADC: 27.6, SUP: 28 },
  에메랄드3: { TOP: 26.5, JUNGLE: 25.8, MID: 27.7, ADC: 26.8, SUP: 27 },
  에메랄드4: { TOP: 26, JUNGLE: 24.4, MID: 25.6, ADC: 24.6, SUP: 26.1 },

  플래티넘1: { TOP: 24.2, JUNGLE: 23.9, MID: 23.7, ADC: 23.7, SUP: 25.2 },
  플래티넘2: { TOP: 23.7, JUNGLE: 21.5, MID: 21.5, ADC: 22.4, SUP: 23.8 },
  플래티넘3: { TOP: 24, JUNGLE: 20.3, MID: 20.1, ADC: 20.2, SUP: 22 },
  플래티넘4: { TOP: 21.2, JUNGLE: 19.1, MID: 19.3, ADC: 19.3, SUP: 21.2 },

  골드1: { TOP: 19, JUNGLE: 17.7, MID: 17.9, ADC: 17.9, SUP: 20.5 },
  골드2: { TOP: 17.7, JUNGLE: 15.7, MID: 15.6, ADC: 15.6, SUP: 19.1 },
  골드3: { TOP: 15.9, JUNGLE: 14.8, MID: 14.7, ADC: 14.7, SUP: 18.3 },
  골드4: { TOP: 14.6, JUNGLE: 13.8, MID: 13.9, ADC: 13.9, SUP: 17.6 },

  실버1: { TOP: 13, JUNGLE: 12.9, MID: 12.8, ADC: 12.3, SUP: 16.7 },
  실버2: { TOP: 12, JUNGLE: 11, MID: 11.9, ADC: 11.6, SUP: 15.9 },
  '실버3 이하': { TOP: 11, JUNGLE: 10, MID: 12.5, ADC: 11.5, SUP: 15 },
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

function parseClanTier(tierName: string): { tier: string; rank: string; lp: number } {
  const normalized = tierName.trim().toUpperCase().replace(/\s+/g, ' ');
  const lpMatch = normalized.match(/\s+(\d+)\s*(?:LP|점)$/);
  const tierWithoutLp = lpMatch ? normalized.slice(0, lpMatch.index).trim() : normalized;
  const rankMatch = tierWithoutLp.match(/(IV|III|II|I|[1-4])$/);
  const rawRank = rankMatch?.[1] ?? 'IV';
  const rankMap: Record<string, string> = { '1': 'I', '2': 'II', '3': 'III', '4': 'IV' };
  const rank = rankMap[rawRank] ?? rawRank;
  const tierPart = rankMatch ? tierWithoutLp.slice(0, rankMatch.index).trim() : tierWithoutLp;
  const tierAliases: Record<string, string> = {
    아이언: 'IRON',
    브론즈: 'BRONZE',
    실버: 'SILVER',
    골드: 'GOLD',
    플래티넘: 'PLATINUM',
    에메랄드: 'EMERALD',
    다이아: 'DIAMOND',
    다이아몬드: 'DIAMOND',
    마스터: 'MASTER',
    그랜드마스터: 'GRANDMASTER',
    챌린저: 'CHALLENGER',
  };
  const tier = tierAliases[tierPart] ?? tierPart;
  return { tier, rank, lp: lpMatch ? Number(lpMatch[1]) : 0 };
}

async function searchPlayer() {
  if (loading.value || !canSearch.value) return;

  const riotId = getSearchRiotId();
  if (!riotId) return;

  loading.value = true;
  errorMessage.value = '';
  result.value = null;
  const position = selectedPosition.value;
  const { gameName, tagLine } = riotId;

  try {
    const response = await api.get<{ datas: Player[] }>(`${getBaseUrl('DATA')}/player/search`, {
      params: {
        keyword: gameName,
        page: 1,
        itemsPerPage: 100,
        sortBy: 'point',
        orderBy: 'desc',
      },
    });
    const players = Array.isArray(response.data?.datas) ? response.data.datas : [];
    const player = players.find(
      (item) =>
        item.nickname?.trim().toLowerCase() === gameName.toLowerCase() &&
        item.tagname?.trim().replace(/^#+/, '').toLowerCase() === tagLine.toLowerCase()
    );
    if (!player) {
      errorMessage.value = '등록된 플레이어를 찾을 수 없습니다.';
      return;
    }
    if (!player.clan_tier) {
      errorMessage.value = '클랜 티어가 설정되지 않은 플레이어입니다.';
      return;
    }
    const parsedTier = parseClanTier(player.clan_tier.name);
    const tierScore = getTierScore(parsedTier.tier, parsedTier.rank, parsedTier.lp, position);
    const { data: record } = await api.get<{ totalMatchCount: number | null }>(
      `${getBaseUrl('DATA')}/Clan/player_match_count`,
      { params: { player_id: player.id } }
    );
    const matchCount = record.totalMatchCount;
    if (matchCount === null || !Number.isInteger(matchCount) || matchCount < 0) {
      errorMessage.value = '내전 전적을 확인할 수 없습니다.';
      return;
    }
    const matchDiscount = matchCount >= matchThreshold ? matchAdvantage : 0;
    const finalScore = Number((tierScore - matchDiscount).toFixed(1));

    result.value = {
      gameName: player.nickname,
      tagLine: player.tagname.replace(/^#+/, ''),
      tier: player.clan_tier.name,
      positionLabel: getPositionLabel(position),
      peakScore: tierScore,
      matchCount,
      matchDiscount,
      meltdownScore: finalScore,
      updatedAt: `${new Date().toLocaleString('ko-KR')} / ${getPositionLabel(position)}`,
    };
  } catch (e) {
    console.error('플레이어 조회 실패', e);
    errorMessage.value = '플레이어 조회에 실패했습니다. 잠시 후 다시 시도해 주세요.';
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
</style>
