<template>
  <v-container class="match-wrap">
    <!-- 헤더 -->
    <div class="text-center mb-4">
      <div class="text-h5 font-weight-bold">
        {{ match?.type }}{{ match?.name ? `(${match?.name})` : '' }}
      </div>
    </div>

    <!-- 상단: 요약(좌) + 컨트롤(우) -->
    <v-row dense class="mb-4">
      <!-- 요약 -->
      <v-col cols="12" md="8">
        <v-row dense>
          <v-col cols="12" md="6">
            <v-card rounded="xl" variant="outlined" class="pa-3">
              <div class="text-caption text-medium-emphasis mb-2">1팀 합계</div>
              <div class="d-flex flex-wrap" style="gap: 8px">
                <v-chip color="primary" variant="flat">Point: {{ t1Point }}</v-chip>
                <v-chip color="teal" variant="flat">Tier: {{ t1Tier }}</v-chip>
                <v-chip color="indigo" variant="flat">총합: {{ t1Total }}</v-chip>
              </div>
            </v-card>
          </v-col>

          <v-col cols="12" md="6">
            <v-card rounded="xl" variant="outlined" class="pa-3">
              <div class="text-caption text-medium-emphasis mb-2">2팀 합계</div>
              <div class="d-flex flex-wrap" style="gap: 8px">
                <v-chip color="primary" variant="flat">Point: {{ t2Point }}</v-chip>
                <v-chip color="teal" variant="flat">Tier: {{ t2Tier }}</v-chip>
                <v-chip color="indigo" variant="flat">총합: {{ t2Total }}</v-chip>
              </div>
            </v-card>
          </v-col>
        </v-row>
      </v-col>

      <!-- 컨트롤 -->
      <v-col cols="12" md="4">
        <v-card rounded="xl" variant="outlined" class="pa-3 h-100">
          <div class="d-flex flex-column" style="gap: 10px">
            <div class="d-flex" style="gap: 8px">
              <v-btn
                v-if="can('MATCH', 'CLAN-SET-MATCH-C')"
                color="indigo"
                block
                :disabled="!canShot"
                @click="onShot"
              >
                SHOT
              </v-btn>

              <v-btn
                v-if="can('MATCH', 'CLAN-SET-MATCH-C')"
                color="success"
                block
                prepend-icon="mdi-check"
                :disabled="!canConfirm"
                @click="openConfirm"
              >
                확정
              </v-btn>
            </div>

            <v-chip
              :color="t1Total === t2Total ? 'grey' : t1Total > t2Total ? 'success' : 'error'"
              variant="tonal"
              class="justify-center"
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

            <div class="d-flex" style="gap: 8px">
              <v-btn
                prepend-icon="mdi-trophy"
                :disabled="!isConfirmed || winnerSaving || isFinished"
                :loading="winnerSaving && winnerTeam === 1"
                :color="winnerChosen === 1 ? 'success' : 'primary'"
                :variant="winnerChosen === 1 ? 'flat' : 'tonal'"
                block
                @click="setWinner(1)"
              >
                1팀 승리
              </v-btn>

              <v-btn
                prepend-icon="mdi-trophy"
                :disabled="!isConfirmed || winnerSaving || isFinished"
                :loading="winnerSaving && winnerTeam === 2"
                :color="winnerChosen === 2 ? 'error' : 'primary'"
                :variant="winnerChosen === 2 ? 'flat' : 'tonal'"
                block
                @click="setWinner(2)"
              >
                2팀 승리
              </v-btn>
            </div>

            <div v-if="!isConfirmed" class="text-caption text-medium-emphasis">
              팀을 확정하면 승리 버튼이 활성화됩니다.
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- ✅ Desktop: 테이블(가로 스크롤 안전) -->
    <div class="d-none d-md-block table-wrap">
      <v-simple-table class="text-center full-width-table">
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
                size="small"
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
                :key="`t1c${i}-${index}`"
                :icon="['fas', 'star']"
                class="star-full"
              />
              <font-awesome-icon
                v-for="index in team1[i - 1]?.player?.sub_cup_count"
                :key="`t1s${i}-${index}`"
                :icon="['far', 'star']"
                class="star-full"
              />
            </td>

            <td>{{ team1[i - 1]?.player?.point ?? '-' }}</td>
            <td>{{ team1[i - 1]?.player?.tier?.point ?? '-' }}</td>

            <td>
              <span
                :style="{
                  color: getTierColor(team1[i - 1]?.player?.tier?.name),
                  fontWeight: 'bold',
                }"
              >
                {{ team1[i - 1]?.player?.tier?.name ?? '-' }}
              </span>
            </td>

            <td>
              <span
                :style="{
                  color: getTierColor(team2[i - 1]?.player?.tier?.name),
                  fontWeight: 'bold',
                }"
              >
                {{ team2[i - 1]?.player?.tier?.name ?? '-' }}
              </span>
            </td>

            <td>{{ team2[i - 1]?.player?.tier?.point ?? '-' }}</td>
            <td>{{ team2[i - 1]?.player?.point ?? '-' }}</td>

            <td>
              <v-btn
                color="indigo"
                size="small"
                block
                class="text-wrap"
                :disabled="isConfirmed || match?.type !== 'POSITION'"
                @click="openPlayerPicker('t2', i - 1)"
              >
                {{
                  team2[i - 1]?.player?.nickname
                    ? `${team2[i - 1].player.nickname}#${team2[i - 1].player.tagname}`
                    : match?.type === 'POSITION'
                    ? '유저 선택'
                    : '—'
                }}
              </v-btn>

              <font-awesome-icon
                v-for="index in team2[i - 1]?.player?.cup_count"
                :key="`t2c${i}-${index}`"
                :icon="['fas', 'star']"
                class="star-full"
              />
              <font-awesome-icon
                v-for="index in team2[i - 1]?.player?.sub_cup_count"
                :key="`t2s${i}-${index}`"
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

    <!-- ✅ Mobile: 포지션별 카드 -->
    <div class="d-md-none">
      <v-card
        v-for="(m1, idx) in team1"
        :key="`m-${idx}`"
        class="mb-3"
        rounded="xl"
        variant="outlined"
      >
        <v-card-text class="py-3">
          <div class="d-flex align-center justify-space-between mb-2">
            <div class="d-flex align-center" style="gap: 10px">
              <div class="pos-icon-wrapper">
                <v-img :src="getPositionIcon(m1.position)" width="26" height="26" cover />
              </div>
              <div class="text-subtitle-2 font-weight-bold">
                {{ m1.position ?? `#${idx + 1}` }}
              </div>
            </div>

            <v-chip size="small" variant="tonal">
              {{ t1Total === t2Total ? '동점' : t1Total > t2Total ? '1팀 우세' : '2팀 우세' }}
            </v-chip>
          </div>

          <v-row dense>
            <v-col cols="12" class="pb-2">
              <div class="text-caption text-medium-emphasis mb-1">1팀</div>
              <v-btn
                color="indigo"
                block
                class="justify-start"
                :disabled="isConfirmed || match?.type !== 'POSITION'"
                @click="openPlayerPicker('t1', idx)"
              >
                {{
                  team1[idx]?.player?.nickname
                    ? `${team1[idx].player.nickname}#${team1[idx].player.tagname}`
                    : match?.type === 'POSITION'
                    ? '유저 선택'
                    : '—'
                }}
              </v-btn>

              <div class="mt-1 d-flex align-center justify-space-between text-caption">
                <span>
                  <b>{{ team1[idx]?.player?.point ?? 0 }}</b> pt ·
                  <span
                    :style="{
                      color: getTierColor(team1[idx]?.player?.tier?.name),
                      fontWeight: 'bold',
                    }"
                  >
                    {{ team1[idx]?.player?.tier?.name ?? '-' }}
                  </span>
                  ({{ team1[idx]?.player?.tier?.point ?? 0 }})
                </span>

                <span class="d-flex" style="gap: 6px">
                  <span v-if="team1[idx]?.player?.cup_count"
                    >★ {{ team1[idx]?.player?.cup_count }}</span
                  >
                  <span v-if="team1[idx]?.player?.sub_cup_count"
                    >☆ {{ team1[idx]?.player?.sub_cup_count }}</span
                  >
                </span>
              </div>
            </v-col>

            <v-divider class="my-2" />

            <v-col cols="12">
              <div class="text-caption text-medium-emphasis mb-1">2팀</div>
              <v-btn
                color="indigo"
                block
                class="justify-start"
                :disabled="isConfirmed || match?.type !== 'POSITION'"
                @click="openPlayerPicker('t2', idx)"
              >
                {{
                  team2[idx]?.player?.nickname
                    ? `${team2[idx].player.nickname}#${team2[idx].player.tagname}`
                    : match?.type === 'POSITION'
                    ? '유저 선택'
                    : '—'
                }}
              </v-btn>

              <div class="mt-1 d-flex align-center justify-space-between text-caption">
                <span>
                  <b>{{ team2[idx]?.player?.point ?? 0 }}</b> pt ·
                  <span
                    :style="{
                      color: getTierColor(team2[idx]?.player?.tier?.name),
                      fontWeight: 'bold',
                    }"
                  >
                    {{ team2[idx]?.player?.tier?.name ?? '-' }}
                  </span>
                  ({{ team2[idx]?.player?.tier?.point ?? 0 }})
                </span>

                <span class="d-flex" style="gap: 6px">
                  <span v-if="team2[idx]?.player?.cup_count"
                    >★ {{ team2[idx]?.player?.cup_count }}</span
                  >
                  <span v-if="team2[idx]?.player?.sub_cup_count"
                    >☆ {{ team2[idx]?.player?.sub_cup_count }}</span
                  >
                </span>
              </div>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </div>

    <!-- 확정 다이얼로그 -->
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

    <!-- 플레이어 선택 -->
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
          <v-btn color="primary" :disabled="!picker.selected" @click="applyPickedPlayer"
            >적용</v-btn
          >
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

const route = useRoute();

const team1 = ref<MatchMember[]>([]);
const team2 = ref<MatchMember[]>([]);
const allPositionMembers = ref<MatchMember[]>([]);
const match = ref<Match | null>(null);

const winnerTeam = ref<number | null>(null);
const winnerSaving = ref(false);
const winnerChosen = computed(() => winnerTeam.value);

// ✅ 합계 상태
const t1Point = ref(0);
const t1Tier = ref(0);
const t2Point = ref(0);
const t2Tier = ref(0);
const t1Total = ref(0);
const t2Total = ref(0);

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

const isConfirmed = ref(false);

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

let POSITIONS: string[] = [];

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

function emptyMemberWithPos(pos: string): MatchMember {
  const m = emptyMember();
  m.position = pos as any;
  return m;
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
    const combined = [...team1.value, ...team2.value];
    for (let i = combined.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [combined[i], combined[j]] = [combined[j], combined[i]];
    }
    team1.value = combined.slice(0, 5);
    team2.value = combined.slice(5, 10);
    updateTotals();
    return;
  }

  for (const pos of POSITIONS) {
    const idx1 = team1.value.findIndex((m) => m.position === pos);
    const idx2 = team2.value.findIndex((m) => m.position === pos);
    if (idx1 !== -1 && idx2 !== -1 && Math.random() < 0.5) {
      const temp = team1.value[idx1];
      team1.value[idx1] = team2.value[idx2];
      team2.value[idx2] = temp;
    }
  }
  updateTotals();
}

function onShot() {
  shuffleTeams();
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

const isFinished = computed(() => {
  const serverWinner = match.value?.winner_team;
  return (
    serverWinner === 1 || serverWinner === 2 || winnerTeam.value === 1 || winnerTeam.value === 2
  );
});

const canShot = computed(() => !isConfirmed.value);

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

// ▼ 플레이어 픽커
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

const pickedIds = computed(() => {
  const s = new Set<number>();
  team1.value.forEach((m) => m?.player?.id && s.add(m.player.id));
  team2.value.forEach((m) => m?.player?.id && s.add(m.player.id));
  return s;
});

const availableMembers = computed(() =>
  allPositionMembers.value.filter((m) => !pickedIds.value.has(m.player.id))
);

function openPlayerPicker(team: TeamKey, id: number) {
  if (isConfirmed.value) return;

  const slotArr = team === 't1' ? team1.value : team2.value;
  const target = slotArr[id];

  if (target?.player?.id && target.player.id !== 0) {
    slotArr[id] = { ...emptyMemberWithPos(target.position as any) };
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

  slotArr[picker.value.id] = { ...chosen, position: keepPos } as MatchMember;

  updateTotals();
  picker.value.open = false;
}

async function fetch() {
  // 혹시 재진입/리로드 시 중복 누적 방지
  POSITIONS = [];

  const positionData = await api.post(`${getBaseUrl('DATA')}/codedict/list`, {
    group: 'LOL_POSITION',
  });
  for (const item of positionData.data.datas) POSITIONS.push(item.value);

  const { data } = await api.get(`${getBaseUrl('DATA')}/match/find?id=${route.params.id}`);
  match.value = data.datas as Match;

  isConfirmed.value = truthy(match.value?.is_confirm);
  winnerTeam.value = (match.value?.winner_team ?? null) as number | null;

  if (match.value.type === 'POSITION') {
    allPositionMembers.value = data.datas.match_members;

    if (match.value.is_confirm) {
      for (let i = 0; i < 5; i++) team1.value[i] = data.datas.match_members[i] ?? null;
      for (let i = 0; i < 5; i++) team2.value[i] = data.datas.match_members[i + 5] ?? null;
    } else {
      team1.value = POSITIONS.map((p) => emptyMemberWithPos(p));
      team2.value = POSITIONS.map((p) => emptyMemberWithPos(p));
    }
  } else {
    for (let i = 0; i < 5; i++) team1.value[i] = data.datas.match_members[i] ?? null;
    for (let i = 0; i < 5; i++) team2.value[i] = data.datas.match_members[i + 5] ?? null;
  }

  updateTotals();
}

onMounted(fetch);
</script>

<style scoped>
.match-wrap {
  max-width: 1100px;
}

.text-wrap {
  white-space: normal !important;
  word-break: break-word;
}

.table-wrap {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.full-width-table {
  width: 100%;
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
  border-radius: 8px;
  overflow: hidden;
  margin: 0 auto;
}

.star-full {
  font-size: 12px;
  margin-left: 2px;
}
</style>
