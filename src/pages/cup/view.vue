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
      <!-- <v-btn
        v-if="can('CUP', 'SYS-SET-CUP-C')"
        color="success"
        @click="confirm"
        :disabled="isConfirmed"
        >CONFIRM</v-btn
      > -->
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
            <div v-for="(member, idx) in team.members" :key="idx" class="mb-2">
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
import type { Cup, CupMember } from '@/data/types/cup';
const route = useRoute();

const teamTotal = (team: Team) =>
  team.members.reduce((sum, m) => sum + (m.player?.tier.point ?? 0), 0);

async function fetch() {
  const { data } = await api.get(`${getBaseUrl('DATA')}/cup/find?id=${route.params.id}`);

  cup.value = data.datas;

  TEAM_SIZE.value = (data.datas.cup_members.length / 5) as number;

  for (let i = 0; i < TEAM_SIZE.value; i++) {
    TEAM_LABELS.value.push('a');
  }

  const members: CupMember[] = cup.value?.cup_members ?? [];
  debugger;
  teams.value = buildTeams(members);
}

function buildTeams(members: CupMember[]): Team[] {
  return TEAM_LABELS.value.map((label, idx) => ({
    key: label,
    name: label,
    members: members.slice(idx * 5, (idx + 1) * 5),
  }));
}

type Team = {
  key: string;
  name: string;
  members: CupMember[];
};
const TEAM_SIZE = ref<number>(0);
const TEAM_LABELS = ref<string[]>([]);
const cup = ref<Cup | null>(null);
const teams = ref<Team[]>([]);
const isConfirmed = ref(false);
const snackbar = ref({ show: false, msg: '' });
/**
 * 샘플 플레이어 20명
 */
// const allPlayers: Player[] = [
//   { id: 1, name: 'Netgate01', point: 400 },
//   { id: 2, name: 'Netgate02', point: 380 },
//   { id: 3, name: 'Netgate03', point: 420 },
//   { id: 4, name: 'Netgate04', point: 410 },
//   { id: 5, name: 'Netgate05', point: 390 },
//   { id: 6, name: 'Netgate06', point: 405 },
//   { id: 7, name: 'Netgate07', point: 395 },
//   { id: 8, name: 'Netgate08', point: 415 },
//   { id: 9, name: 'Netgate09', point: 385 },
//   { id: 10, name: 'Netgate10', point: 400 },
//   { id: 11, name: 'Netgate11', point: 410 },
//   { id: 12, name: 'Netgate12', point: 390 },
//   { id: 13, name: 'Netgate13', point: 405 },
//   { id: 14, name: 'Netgate14', point: 395 },
//   { id: 15, name: 'Netgate15', point: 415 },
//   { id: 16, name: 'Netgate16', point: 385 },
//   { id: 17, name: 'Netgate17', point: 400 },
//   { id: 18, name: 'Netgate18', point: 420 },
//   { id: 19, name: 'Netgate19', point: 380 },
//   { id: 20, name: 'Netgate20', point: 400 },
//   { id: 21, name: 'Netgate21', point: 385 },
//   { id: 22, name: 'Netgate22', point: 400 },
//   { id: 23, name: 'Netgate23', point: 420 },
//   { id: 24, name: 'Netgate24', point: 380 },
//   { id: 25, name: 'Netgate25', point: 400 },
// ];
// 초기: 그냥 순서대로 5명씩 잘라서 4팀

/**
 * 팀 총점 계산
 */

/**
 * SHOT: 20명을 랜덤으로 섞고 다시 5명씩 배치
 */
function shot() {
  debugger;
  if (isConfirmed.value) {
    snackbar.value = { show: true, msg: '이미 확정된 매치입니다.' };
    return;
  }
  if (!cup.value) return;

  const shuffled = [...(cup.value.cup_members ?? [])];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  teams.value = buildTeams(shuffled);
  snackbar.value = { show: true, msg: '팀이 랜덤으로 재배치되었습니다.' };
}

function confirm() {
  if (isConfirmed.value) return;
  isConfirmed.value = true;
  snackbar.value = { show: true, msg: '팀 구성이 확정되었습니다.' };
  // 여기서 API로 teams.value 보내서 저장하면 됨
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
