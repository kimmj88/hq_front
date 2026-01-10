<template>
  <v-container class="py-6" style="max-width: 1100px">
    <!-- 상단 헤더 -->
    <v-card class="pa-5 mb-4" rounded="xl" elevation="2">
      <div class="d-flex flex-wrap align-center justify-space-between" style="gap: 12px">
        <div>
          <div class="text-h6 font-weight-bold">클랜전 매치</div>
          <div class="text-caption text-medium-emphasis">
            티어 {{ match.tier }} · {{ formatDateTime(match.match_at) }}
            <!-- 티어 {{ match.tier }} -->
          </div>
        </div>

        <div class="d-flex align-center" style="gap: 8px">
          <v-chip color="primary" variant="flat">#{{ match.id }}</v-chip>

          <v-chip v-if="match.status === 'WAITING'" color="warning" variant="flat">대기중</v-chip>
          <v-chip v-else-if="match.status === 'MATCHED'" color="success" variant="flat"
            >매치 성사</v-chip
          >
          <v-chip v-else-if="match.status === 'DONE'" color="warning" variant="flat">완료</v-chip>
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
                <div class="text-subtitle-1 font-weight-bold">{{ match.host_clan.name }}</div>
                <div class="text-caption text-medium-emphasis">HOME</div>
              </div>
            </div>

            <v-btn
              size="small"
              :disabled="match.is_confirm"
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

              <div
                class="player clickable"
                v-if="match.host_member[slot.key]"
                role="button"
                tabindex="0"
                @click="openPlayer(match.host_member[slot.key])"
                @keydown.enter="openPlayer(match.host_member[slot.key])"
              >
                <v-avatar size="28" color="deep-purple-darken-2" class="mr-2">
                  <span class="text-caption text-white">
                    {{ initials(match.host_member[slot.key].nickname) }}
                  </span>
                </v-avatar>

                <div class="player__name">
                  <div class="text-body-2 font-weight-medium">
                    {{ match.host_member[slot.key].nickname }}
                    <span class="text-caption" v-if="match.host_member[slot.key].tagname">
                      #{{ match.host_member[slot.key].tagname }}
                    </span>
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    {{ match.host_member[slot.key].tierName || '-' }} · Point
                    {{ match.host_member[slot.key].point ?? 0 }}
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
                <div class="text-subtitle-1 font-weight-bold">{{ match.guest_clan.name }}</div>
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

              <div
                class="player clickable"
                v-if="match.guest_member[slot.key]"
                role="button"
                tabindex="0"
                @click="openPlayer(match.guest_member[slot.key])"
                @keydown.enter="openPlayer(match.guest_member[slot.key])"
              >
                <v-avatar size="28" color="deep-purple-darken-2" class="mr-2">
                  <span class="text-caption text-white">
                    {{ initials(match.guest_member[slot.key].nickname) }}
                  </span>
                </v-avatar>

                <div class="player__name">
                  <div class="text-body-2 font-weight-medium">
                    {{ match.guest_member[slot.key].nickname }}
                    <span class="text-caption" v-if="match.guest_member[slot.key].tagname">
                      #{{ match.guest_member[slot.key].tagname }}
                    </span>
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    {{ match.guest_member[slot.key].tierName || '-' }} · Point
                    {{ match.guest_member[slot.key].point ?? 0 }}
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
          <!-- <v-btn variant="text" @click="winner = null">선택 해제</v-btn> -->
          <v-btn
            v-if="!match.is_confirm"
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
        <b>{{ winner === 'HOME' ? match.host_clan?.name : match.guest_clan?.name }}</b>
      </v-alert>
    </v-card>

    <!-- 확인 다이얼로그 -->
    <v-dialog v-model="confirmDialog" max-width="420">
      <v-card>
        <v-card-title class="text-h6">승리팀 확정</v-card-title>
        <v-card-text class="text-body-2 text-medium-emphasis">
          승리팀을
          <b>{{ winner === 'HOME' ? match.host_clan?.name : match.guest_clan?.name }}</b> 로
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
import { getBaseUrl } from '@/@core/composable/createUrl';
import { onMounted, ref } from 'vue';
import api from '@/@core/composable/useAxios';
import { useRoute } from 'vue-router';
import type { ClanMini, MatchStatus } from '@/data/types/clanmatch';
import { formatDateTime } from '@/utils/date';

const route = useRoute();

type SlotKey = 'TOP' | 'JUG' | 'MID' | 'ADC' | 'SUP';
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
  { key: 'JUG', label: '정글', short: 'JG' },
  { key: 'MID', label: '미드', short: 'MID' },
  { key: 'ADC', label: '원딜', short: 'ADC' },
  { key: 'SUP', label: '서포터', short: 'SUP' },
];

const snack = ref({ show: false, msg: '' });
function toast(msg: string) {
  snack.value.msg = msg;
  snack.value.show = true;
}

type ClickablePlayer = {
  nickname: string;
  tagname: string;
};

function openPlayer(p?: ClickablePlayer | null) {
  if (!p?.nickname || !p?.tagname) return;

  const region = 'kr';
  // op.gg는 보통 "nickname-tag" 형태 (공백/특수문자 때문에 encode 필요)
  const riotId = `${p.nickname}-${p.tagname}`;
  const url = `https://www.op.gg/summoners/${region}/${encodeURIComponent(riotId)}`;

  window.open(url, '_blank', 'noopener,noreferrer');
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

    const payload = {
      id: match.value.id,
      status: 'DONE',
      winner_team: winner.value == 'HOME' ? 1 : 2,
      is_confirm: true,
    };

    await api.post(`${getBaseUrl('DATA')}/clanmatch/update`, payload);

    toast('결과가 저장되었습니다.');
  } catch (e) {
    console.error(e);
    toast('저장에 실패했습니다.');
  }
}

// ✅ 샘플 매치 데이터 (서버 연결 전까지 임시)
type ApiMember = {
  id: number;
  nickname: string;
  tagname: string;
  tier: string; // API tier 문자열
  point: number;
};

type ApiClanMatchFind = {
  id: number;
  is_confirm: boolean;
  status: MatchStatus;
  match_at: string;
  winner_team: number | null;
  tier: number;
  host_clan: ClanMini;
  guest_clan: ClanMini | null;
  host_member: Partial<Record<SlotKey, ApiMember>>;
  guest_member: Partial<Record<SlotKey, ApiMember>>;
};

function toPlayerItem(m?: ApiMember | null): PlayerItem | null {
  if (!m) return null;
  return {
    id: m.id,
    nickname: m.nickname,
    tagname: m.tagname,
    point: m.point,
    tierName: m.tier, // ✅ 화면용 tierName으로 복사
  };
}

const match = ref({
  id: 0,
  status: 'WAITING' as MatchStatus,
  tier: 0,
  is_confirm: false,
  match_at: '',
  host_clan: { id: 0, name: '' },
  guest_clan: { id: 0, name: '' },
  host_member: {
    TOP: null,
    JUG: null,
    MID: null,
    ADC: null,
    SUP: null,
  } as Record<SlotKey, PlayerItem | null>,
  guest_member: {
    TOP: null,
    JUG: null,
    MID: null,
    ADC: null,
    SUP: null,
  } as Record<SlotKey, PlayerItem | null>,
});

onMounted(async () => {
  const id = Number(route.params.id);
  const { data } = await api.get(`${getBaseUrl('DATA')}/clanmatch/find?id=${id}`);
  const cm: ApiClanMatchFind = data.datas;

  if (cm.winner_team != null) {
    winner.value = cm.winner_team == 1 ? 'HOME' : 'AWAY';
  }

  match.value = {
    id: cm.id,
    status: cm.status,
    tier: cm.tier,
    match_at: cm.match_at,
    is_confirm: cm.is_confirm,
    // ✅ 화면에서 home/away로 보여주고 싶으면 여기서 결정
    // 지금은 "HOME=host, AWAY=guest"로 고정
    host_clan: cm.host_clan,
    guest_clan: cm.guest_clan ?? { id: 0, name: '상대 미정' },

    host_member: {
      TOP: toPlayerItem(cm.host_member.TOP),
      JUG: toPlayerItem(cm.host_member.JUG),
      MID: toPlayerItem(cm.host_member.MID),
      ADC: toPlayerItem(cm.host_member.ADC),
      SUP: toPlayerItem(cm.host_member.SUP),
    } as any,

    guest_member: {
      TOP: toPlayerItem(cm.guest_member.TOP),
      JUG: toPlayerItem(cm.guest_member.JUG),
      MID: toPlayerItem(cm.guest_member.MID),
      ADC: toPlayerItem(cm.guest_member.ADC),
      SUP: toPlayerItem(cm.guest_member.SUP),
    } as any,
  };
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
.clickable {
  cursor: pointer;
}

.clickable:hover {
  opacity: 0.9;
}
</style>
