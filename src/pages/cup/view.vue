<template>
  <v-container class="pa-6">
    <!-- 상단 컨트롤 -->
    <div class="d-flex justify-center mb-6" style="gap: 16px">
      <v-btn
        v-if="can('CUP', 'SYS-SET-CUP-C')"
        color="primary"
        @click="shot"
        :disabled="isConfirmed"
        >SHOT</v-btn
      >
      <v-btn
        v-if="can('CUP', 'SYS-SET-CUP-C')"
        color="success"
        @click="confirm"
        :disabled="isConfirmed"
        >CONFIRM</v-btn
      >
    </div>

    <!-- 4팀 컬럼 -->
    <v-row dense>
      <v-col
        v-for="team in teams"
        :key="team.key"
        cols="12"
        sm="6"
        md="3"
        class="d-flex flex-column"
      >
        <!-- 팀 헤더 -->
        <v-card class="mb-3 team-header" rounded="xl">
          <v-card-text class="py-3">
            <div class="text-subtitle-1 font-weight-medium mb-1">팀명 : {{ team.name }}</div>
            <div class="text-body-2">
              총점 : <strong>{{ teamTotal(team).toLocaleString() }}</strong>
            </div>
          </v-card-text>
        </v-card>

        <!-- 팀 멤버 슬롯 -->
        <v-card class="team-body" rounded="xl">
          <v-card-text class="py-3">
            <div v-for="(member, idx) in team.cup_members" :key="idx" class="mb-2">
              <v-card
                rounded="xl"
                class="px-3 py-2 d-flex align-center justify-space-between member-card"
              >
                <div class="d-flex flex-column">
                  <span class="text-body-2 font-weight-medium">
                    {{ member.player.nickname }}#{{ member.player.tagname }}
                  </span>
                  <span class="text-caption text-medium-emphasis">
                    Tier: {{ member.player.tier.name }}
                  </span>
                  <span class="text-caption text-medium-emphasis">
                    Point: {{ member.player.tier.point }}
                  </span>
                </div>
              </v-card>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- 스낵바 -->
    <v-snackbar v-model="snackbar.show" :timeout="2000">
      {{ snackbar.msg }}
    </v-snackbar>
  </v-container>
</template>

<script lang="ts" setup>
import { can } from '@/stores/usePermissionStore';
import { getBaseUrl } from '@/@core/composable/createUrl';
import { computed, onMounted, reactive, ref } from 'vue';
import api from '@/@core/composable/useAxios';
import { useRoute } from 'vue-router';
import type { Match, MatchMember } from '@/data/types/match';
import type { Cup, CupMember, CupTeam } from '@/data/types/cup';
const route = useRoute();

const TEAM_SIZE = ref<number>(0);
const TEAM_LABELS = ref<string[]>([]);
const cup = ref<Cup | null>(null);
const teams = ref<CupTeam[]>([]);
const isConfirmed = ref(false);
const snackbar = ref({ show: false, msg: '' });

const teamTotal = (team: CupTeam) =>
  team.cup_members.reduce((sum, m) => sum + (m.player?.tier.point ?? 0), 0);

async function fetch() {
  const { data } = await api.get(`${getBaseUrl('DATA')}/cup/find?id=${route.params.id}`);

  cup.value = data.datas;
  isConfirmed.value = data.datas.is_confirm;

  TEAM_SIZE.value = cup.value?.cup_teams.length as number;

  for (let i = 0; i < TEAM_SIZE.value; i++) {
    TEAM_LABELS.value.push(String.fromCharCode(65 + i));
  }

  let ttt: any[];
  if (cup.value?.cup_teams && cup.value.cup_teams.length > 0) {
    TEAM_SIZE.value = cup.value?.cup_teams.length;

    for (let i = 0; i < TEAM_SIZE.value; i++) {
      TEAM_LABELS.value.push(cup.value?.cup_teams[i].name);
    }

    ttt = cup.value.cup_teams.map((team) => ({
      key: team.name,
      name: team.name,
      cup_members: team.cup_members,
    }));
    teams.value = ttt;
  } else {
    TEAM_SIZE.value = (cup.value?.cup_members.length as number) / 5;

    for (let i = 0; i < TEAM_SIZE.value; i++) {
      TEAM_LABELS.value.push(String.fromCharCode(65 + i));
    }

    const members: CupMember[] = cup.value?.cup_members ?? [];
    teams.value = buildTeams(members);
  }
}

function buildTeams(members: CupMember[]): CupTeam[] {
  return TEAM_LABELS.value.map((label, idx) => ({
    key: label,
    name: label,
    cup_members: members.slice(idx * 5, (idx + 1) * 5),
  }));
}

function shot() {
  if (isConfirmed.value) {
    snackbar.value = { show: true, msg: '이미 확정된 매치입니다.' };
    return;
  }
  if (!cup.value) return;

  const base = [...(cup.value.cup_members ?? [])];

  // 팀 수/팀당 인원은 현재 화면 상태 기준
  const teamCount = teams.value.length || Math.ceil(base.length / 5);
  const teamSize = teams.value[0]?.cup_members.length || 5;

  // 라벨 새로 생성
  const labels = Array.from({ length: teamCount }, (_, i) => String.fromCharCode(65 + i));

  // 점수 함수
  const score = (m: CupMember) => (m.player?.tier?.point ?? 0) + (m.player?.point ?? 0);

  // 1) 기본 섞기
  for (let i = base.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [base[i], base[j]] = [base[j], base[i]];
  }

  // 2) 점수 내림차순 + 동점 랜덤 타이브레이커
  base.sort((a, b) => {
    const diff = score(b) - score(a);
    return diff !== 0 ? diff : Math.random() - 0.5;
  });

  // 3) 빈 팀
  const acc = labels.map((l) => ({ key: l, name: l, cup_members: [] as CupMember[], sum: 0 }));

  // 4) 그리디 배치(최소 합계 팀들 중 랜덤 선택)
  for (const m of base) {
    // 아직 자리가 남은 팀만 후보
    const candidates = acc.filter((t) => t.cup_members.length < teamSize);
    // 최솟값
    const minSum = Math.min(...candidates.map((t) => t.sum));
    // 최소합 팀들 중 랜덤 하나
    const ties = candidates
      .map((t, idx) => ({ t, idx: acc.indexOf(t) }))
      .filter((x) => x.t.sum === minSum);
    const pick = ties[Math.floor(Math.random() * ties.length)].idx;

    acc[pick].cup_members.push(m);
    acc[pick].sum += score(m);
  }

  // 5) 로컬 스왑으로 점수차 줄이기(목표 ±100)
  const maxDiff = 200;
  const maxPasses = 300;
  const curDiff = () => {
    const sums = acc.map((t) => t.sum);
    return Math.max(...sums) - Math.min(...sums);
  };

  let passes = 0,
    improved = true;
  while (passes < maxPasses && curDiff() > maxDiff && improved) {
    passes++;
    improved = false;

    let maxIdx = 0,
      minIdx = 0;
    for (let i = 1; i < acc.length; i++) {
      if (acc[i].sum > acc[maxIdx].sum) maxIdx = i;
      if (acc[i].sum < acc[minIdx].sum) minIdx = i;
    }
    const strong = acc[maxIdx],
      weak = acc[minIdx];

    let bestGain = 0,
      ai = -1,
      bi = -1;
    for (let i = 0; i < strong.cup_members.length; i++) {
      const a = strong.cup_members[i],
        as = score(a);
      for (let j = 0; j < weak.cup_members.length; j++) {
        const b = weak.cup_members[j],
          bs = score(b);
        const before = Math.abs(strong.sum - weak.sum);
        const after = Math.abs(strong.sum - as + bs - (weak.sum - bs + as));
        const gain = before - after;
        if (gain > bestGain) {
          bestGain = gain;
          ai = i;
          bi = j;
        }
      }
    }

    if (bestGain > 0 && ai >= 0 && bi >= 0) {
      const a = strong.cup_members[ai],
        as = score(a);
      const b = weak.cup_members[bi],
        bs = score(b);
      strong.cup_members.splice(ai, 1, b);
      weak.cup_members.splice(bi, 1, a);
      strong.sum = strong.sum - as + bs;
      weak.sum = weak.sum - bs + as;
      improved = true;
    }
  }

  teams.value = acc.map((t) => ({ key: t.key, name: t.name, cup_members: t.cup_members }));

  snackbar.value = { show: true, msg: '밸런스를 고려해 팀을 재배치했습니다.' };
}

async function confirm() {
  if (isConfirmed.value) return;
  isConfirmed.value = true;
  snackbar.value = { show: true, msg: '팀 구성이 확정되었습니다.' };

  try {
    const response = await api.post(`${getBaseUrl('DATA')}/cup/update`, {
      id: route.params.id,
      is_confirm: isConfirmed.value,
    });
  } catch (error: any) {
    console.error('Cup 업데이트 실패:', error);
  }

  for (const team of teams.value) {
    try {
      const response = await api.post(`${getBaseUrl('DATA')}/cupteam/create`, {
        cup_id: route.params.id,
        name: team.name,
        cup_members: team.cup_members,
      });
    } catch (error: any) {
      console.error('Match 생성 실패:', error);
    }
  }
}

onMounted(fetch);
</script>

<style scoped>
.team-header {
  text-align: center;
}

.team-body {
  background-color: #1f2933;
}

.member-card {
  background-color: #243447;
  color: #fff;
}
</style>
