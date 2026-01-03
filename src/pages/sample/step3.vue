<template>
  <v-container class="py-6" style="max-width: 1100px">
    <!-- 상단 헤더 -->
    <v-card class="pa-5 mb-4" rounded="xl" elevation="2">
      <div class="d-flex flex-wrap align-center justify-space-between" style="gap: 12px">
        <div>
          <div class="text-h6 font-weight-bold">클랜전 매치</div>
          <div class="text-caption text-medium-emphasis">
            티어 {{ match.tierLevel }} · {{ formatKST(match.matchAt) }}
          </div>
        </div>

        <div class="d-flex align-center" style="gap: 8px">
          <v-chip color="primary" variant="flat">#{{ match.id }}</v-chip>
          <v-chip v-if="match.status === 'MATCHED'" color="success" variant="flat"
            >매치 성사</v-chip
          >
          <v-chip v-else color="warning" variant="flat">대기</v-chip>
        </div>
      </div>
    </v-card>

    <!-- 팀 카드 2개 -->
    <v-row dense>
      <!-- 우리팀 -->
      <v-col cols="12" md="6">
        <v-card class="pa-4 team-card" rounded="xl" elevation="2">
          <div class="d-flex align-center justify-space-between mb-3">
            <div class="d-flex align-center" style="gap: 10px">
              <v-avatar size="36" color="indigo">
                <v-icon>mdi-shield-account</v-icon>
              </v-avatar>
              <div>
                <div class="text-subtitle-1 font-weight-bold">{{ match.homeClan.name }}</div>
                <div class="text-caption text-medium-emphasis">HOME</div>
              </div>
            </div>

            <v-btn
              size="small"
              :variant="winner === 'HOME' ? 'flat' : 'tonal'"
              color="success"
              prepend-icon="mdi-trophy"
              @click="pickWinner('HOME')"
            >
              승리
            </v-btn>
          </div>

          <v-divider class="mb-3" />

          <div class="roster">
            <div v-for="slot in slots" :key="'H-' + slot.key" class="roster-row">
              <div class="slot">
                <v-chip size="x-small" variant="tonal" color="secondary">
                  {{ slot.short }}
                </v-chip>
                <span class="ml-2">{{ slot.label }}</span>
              </div>

              <div class="player" v-if="match.homeLineup[slot.key]">
                <v-avatar size="28" color="deep-purple-darken-2" class="mr-2">
                  <span class="text-caption text-white">
                    {{ initials(match.homeLineup[slot.key].nickname) }}
                  </span>
                </v-avatar>

                <div class="player__name">
                  <div class="text-body-2 font-weight-medium">
                    {{ match.homeLineup[slot.key].nickname }}
                    <span class="text-caption" v-if="match.homeLineup[slot.key].tagname">
                      #{{ match.homeLineup[slot.key].tagname }}
                    </span>
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    {{ match.homeLineup[slot.key].tierName || '-' }} · Point
                    {{ match.homeLineup[slot.key].point ?? 0 }}
                  </div>
                </div>
              </div>

              <div class="player text-medium-emphasis" v-else>
                <v-icon size="18" class="mr-2">mdi-account-off-outline</v-icon>
                미등록
              </div>
            </div>
          </div>
        </v-card>
      </v-col>

      <!-- 상대팀 -->
      <v-col cols="12" md="6">
        <v-card class="pa-4 team-card" rounded="xl" elevation="2">
          <div class="d-flex align-center justify-space-between mb-3">
            <div class="d-flex align-center" style="gap: 10px">
              <v-avatar size="36" color="purple">
                <v-icon>mdi-sword-cross</v-icon>
              </v-avatar>
              <div>
                <div class="text-subtitle-1 font-weight-bold">{{ match.awayClan.name }}</div>
                <div class="text-caption text-medium-emphasis">AWAY</div>
              </div>
            </div>

            <v-btn
              size="small"
              :variant="winner === 'AWAY' ? 'flat' : 'tonal'"
              color="success"
              prepend-icon="mdi-trophy"
              @click="pickWinner('AWAY')"
            >
              승리
            </v-btn>
          </div>

          <v-divider class="mb-3" />

          <div class="roster">
            <div v-for="slot in slots" :key="'A-' + slot.key" class="roster-row">
              <div class="slot">
                <v-chip size="x-small" variant="tonal" color="secondary">
                  {{ slot.short }}
                </v-chip>
                <span class="ml-2">{{ slot.label }}</span>
              </div>

              <div class="player" v-if="match.awayLineup[slot.key]">
                <v-avatar size="28" color="deep-purple-darken-2" class="mr-2">
                  <span class="text-caption text-white">
                    {{ initials(match.awayLineup[slot.key].nickname) }}
                  </span>
                </v-avatar>

                <div class="player__name">
                  <div class="text-body-2 font-weight-medium">
                    {{ match.awayLineup[slot.key].nickname }}
                    <span class="text-caption" v-if="match.awayLineup[slot.key].tagname">
                      #{{ match.awayLineup[slot.key].tagname }}
                    </span>
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    {{ match.awayLineup[slot.key].tierName || '-' }} · Point
                    {{ match.awayLineup[slot.key].point ?? 0 }}
                  </div>
                </div>
              </div>

              <div class="player text-medium-emphasis" v-else>
                <v-icon size="18" class="mr-2">mdi-account-off-outline</v-icon>
                미등록
              </div>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- 하단 액션 -->
    <v-card class="pa-4 mt-4" rounded="xl" elevation="2">
      <div class="d-flex flex-wrap align-center justify-space-between" style="gap: 12px">
        <div class="text-caption text-medium-emphasis">
          승리팀을 선택하면 결과를 저장할 수 있어요.
        </div>

        <div class="d-flex" style="gap: 8px">
          <v-btn variant="text" @click="winner = null">선택 해제</v-btn>
          <v-btn
            color="primary"
            :disabled="!winner"
            prepend-icon="mdi-content-save"
            @click="confirmDialog = true"
          >
            결과 저장
          </v-btn>
        </div>
      </div>

      <v-alert v-if="winner" type="success" variant="tonal" density="compact" class="mt-3">
        현재 선택된 승리팀:
        <b>{{ winner === 'HOME' ? match.homeClan.name : match.awayClan.name }}</b>
      </v-alert>
    </v-card>

    <!-- 확인 다이얼로그 -->
    <v-dialog v-model="confirmDialog" max-width="420">
      <v-card>
        <v-card-title class="text-h6">승리팀 확정</v-card-title>
        <v-card-text class="text-body-2 text-medium-emphasis">
          승리팀을 <b>{{ winner === 'HOME' ? match.homeClan.name : match.awayClan.name }}</b> 로
          저장할까요?
          <div class="text-caption mt-2">
            (저장 후에는 운영 정책에 따라 수정 제한을 둘 수도 있어요.)
          </div>
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn variant="text" @click="confirmDialog = false">취소</v-btn>
          <v-btn color="primary" @click="saveResult">저장</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snack.show" :timeout="2200">{{ snack.msg }}</v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue';

type SlotKey = 'TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT';
type TeamSide = 'HOME' | 'AWAY';

type PlayerItem = {
  id: number;
  nickname: string;
  tagname?: string;
  point?: number;
  tierName?: string;
};

const slots: { key: SlotKey; label: string; short: string }[] = [
  { key: 'TOP', label: '탑', short: 'TOP' },
  { key: 'JUNGLE', label: '정글', short: 'JG' },
  { key: 'MID', label: '미드', short: 'MID' },
  { key: 'ADC', label: '원딜', short: 'ADC' },
  { key: 'SUPPORT', label: '서포터', short: 'SUP' },
];

const snack = ref({ show: false, msg: '' });
function toast(msg: string) {
  snack.value.msg = msg;
  snack.value.show = true;
}

function initials(name?: string) {
  if (!name) return '?';
  return name.trim().slice(0, 2).toUpperCase();
}

function formatKST(iso: string) {
  // iso가 "2026-01-01T20:00" 같은 형태여도 그냥 표시용으로만
  return iso.replace('T', ' ');
}

const winner = ref<TeamSide | null>(null);
const confirmDialog = ref(false);

function pickWinner(side: TeamSide) {
  winner.value = side;
}

async function saveResult() {
  confirmDialog.value = false;

  try {
    // TODO: API 연결
    // await api.post(`${getBaseUrl('DATA')}/clanmatch/set_winner`, {
    //   match_id: match.value.id,
    //   winner: winner.value, // 'HOME' | 'AWAY'
    // });

    toast('결과가 저장되었습니다.');
  } catch (e) {
    console.error(e);
    toast('저장에 실패했습니다.');
  }
}

// ✅ 샘플 매치 데이터 (서버 연결 전까지 임시)
const match = ref({
  id: 1004,
  status: 'MATCHED', // WAITING | MATCHED | DONE ...
  tierLevel: 6,
  matchAt: '2026-01-10T20:00',
  homeClan: { id: 1, name: 'DEMACIA' },
  awayClan: { id: 2, name: 'NOXUS' },
  homeLineup: {
    TOP: { id: 1, nickname: '탑장인', tagname: 'KR1', point: 40, tierName: 'GOLD' },
    JUNGLE: { id: 2, nickname: '정글러', tagname: 'KR1', point: 55, tierName: 'GOLD' },
    MID: { id: 3, nickname: '미드신', tagname: 'KR1', point: 90, tierName: 'PLATINUM' },
    ADC: { id: 4, nickname: '원딜킹', tagname: 'KR1', point: 35, tierName: 'GOLD' },
    SUPPORT: { id: 5, nickname: '서폿킹', tagname: 'KR1', point: 70, tierName: 'PLATINUM' },
  } as Record<SlotKey, PlayerItem | null>,
  awayLineup: {
    TOP: { id: 11, nickname: 'NoxTop', tagname: 'KR1', point: 60, tierName: 'GOLD' },
    JUNGLE: { id: 12, nickname: 'NoxJg', tagname: 'KR1', point: 65, tierName: 'PLATINUM' },
    MID: { id: 13, nickname: 'NoxMid', tagname: 'KR1', point: 80, tierName: 'PLATINUM' },
    ADC: { id: 14, nickname: 'NoxAdc', tagname: 'KR1', point: 50, tierName: 'GOLD' },
    SUPPORT: { id: 15, nickname: 'NoxSup', tagname: 'KR1', point: 45, tierName: 'GOLD' },
  } as Record<SlotKey, PlayerItem | null>,
});
</script>

<style scoped>
.team-card {
  background: radial-gradient(circle at 20% 0%, rgba(255, 255, 255, 0.06), rgba(0, 0, 0, 0.2));
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.roster {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.roster-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.04);
}

.slot {
  display: flex;
  align-items: center;
  min-width: 140px;
  color: rgba(255, 255, 255, 0.9);
}

.player {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex: 1;
  text-align: right;
}

.player__name {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}
</style>
