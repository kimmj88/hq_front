<template>
  <v-container v-if="loading" class="py-6" style="max-width: 1100px">
    <v-skeleton-loader type="article, list-item-three-line, actions" />
  </v-container>

  <v-container v-else-if="!room" class="py-6" style="max-width: 1100px">
    <v-alert type="error" variant="tonal">경매 내전을 찾을 수 없습니다.</v-alert>
  </v-container>

  <template v-else>
    <v-container class="pt-6 pb-0" style="max-width: 1180px">
      <v-btn variant="text" prepend-icon="mdi-arrow-left" class="mb-2" @click="goToList">
        경매 내전 목록
      </v-btn>

      <v-card class="room-summary pa-5" rounded="xl">
        <div class="d-flex flex-wrap align-start justify-space-between ga-4">
          <div>
            <div class="d-flex align-center ga-2">
              <v-chip
                size="small"
                :color="room.status === 'RECRUITING' ? 'success' : 'deep-purple-accent-2'"
                variant="flat"
              >
                {{
                  room.status === 'RECRUITING'
                    ? '참가 모집 중'
                    : room.status === 'POINT_SETTING'
                      ? '팀장 포인트 설정'
                      : '경매 진행 중'
                }}
              </v-chip>
              <v-chip v-if="room.isBlind" size="small" color="blue-grey" variant="tonal">
                <v-icon start size="15">mdi-eye-off-outline</v-icon>
                블라인드
              </v-chip>
              <span class="text-caption text-medium-emphasis">방장 {{ room.ownerNickname }}</span>
            </div>
            <h1 class="text-h4 font-weight-black mt-3">{{ room.title }}</h1>
            <p class="text-body-2 text-medium-emphasis mt-1">
              {{ room.description || '등록된 안내 사항이 없습니다.' }}
            </p>
          </div>

          <div v-if="room.status === 'RECRUITING'" class="d-flex ga-2">
            <v-btn
              :color="isParticipating ? 'error' : 'success'"
              :variant="isParticipating ? 'tonal' : 'flat'"
              :disabled="
                !account.isLoggedIn ||
                participantSubmitting ||
                (!isParticipating && room.participants.length >= room.maxParticipants)
              "
              :loading="participantSubmitting"
              :prepend-icon="isParticipating ? 'mdi-account-minus' : 'mdi-account-plus'"
              @click="toggleParticipation"
            >
              {{ isParticipating ? '참가 취소' : '참가하기' }}
            </v-btn>
            <v-btn
              v-if="isParticipating"
              :color="hasAttended ? 'success' : 'amber'"
              :variant="hasAttended ? 'tonal' : 'flat'"
              :disabled="!attendanceWindowOpen || hasAttended || attendanceSubmitting"
              :loading="attendanceSubmitting"
              :prepend-icon="hasAttended ? 'mdi-check-circle' : 'mdi-calendar-check'"
              @click="attendAuction"
            >
              {{
                hasAttended
                  ? '출석 완료'
                  : attendanceWindowOpen
                    ? '출석 체크'
                    : '시작 10분 전 활성화'
              }}
            </v-btn>
            <v-btn
              v-if="isOwner"
              color="deep-purple-accent-2"
              prepend-icon="mdi-play"
              :disabled="
                room.participants.length !== room.maxParticipants ||
                captainCount !== room.teamCount ||
                starting
              "
              :loading="starting"
              @click="startRoom"
            >
              경매 시작
            </v-btn>
          </div>
          <v-btn
            v-else-if="isOwner && room.status !== 'FINISHED'"
            color="warning"
            variant="tonal"
            prepend-icon="mdi-arrow-u-left-top"
            @click="reopenDialog = true"
          >
            참가자 수정 단계로
          </v-btn>
        </div>
      </v-card>
    </v-container>

    <v-container
      v-if="room.status === 'RECRUITING'"
      class="py-5"
      style="max-width: 1180px"
    >
      <v-card class="pa-5" rounded="xl">
        <div class="d-flex align-center justify-space-between mb-4">
          <div>
            <div class="text-h6 font-weight-bold">참가자</div>
            <div class="text-caption text-medium-emphasis">
              {{ room.participants.length }}/{{ room.maxParticipants }}명 · 출석
              {{ attendedCount }}/{{ room.participants.length }}명
            </div>
          </div>
          <v-progress-circular
            :model-value="(room.participants.length / room.maxParticipants) * 100"
            color="success"
          >
            {{ room.participants.length }}
          </v-progress-circular>
        </div>

        <v-row v-if="room.participants.length" dense>
          <v-col
            v-for="participant in room.participants"
            :key="participant.accountId"
            cols="12"
            sm="6"
            md="4"
          >
            <div class="participant-card">
              <v-avatar size="38" color="deep-purple-darken-1">
                {{ initials(participantName(participant)) }}
              </v-avatar>
              <div>
                <div class="text-body-2 font-weight-bold">{{ participantName(participant) }}</div>
                <div class="text-caption text-medium-emphasis">
                  {{ participant.isCaptain ? '팀장' : '참가 완료' }} ·
                  <span :class="participant.attendedAt ? 'text-success' : 'text-warning'">
                    {{ participant.attendedAt ? '출석 완료' : '미출석' }}
                  </span>
                </div>
              </div>
              <v-chip
                class="ml-auto"
                size="x-small"
                :color="participant.attendedAt ? 'success' : 'warning'"
                variant="tonal"
              >
                {{ participant.attendedAt ? '출석' : '미출석' }}
              </v-chip>
              <v-btn
                v-if="isOwner"
                size="small"
                :color="participant.isCaptain ? 'amber' : 'deep-purple-lighten-1'"
                :variant="participant.isCaptain ? 'flat' : 'tonal'"
                :loading="captainSubmittingId === participant.accountId"
                :disabled="
                  captainSubmittingId !== null ||
                  (!participant.isCaptain && captainCount >= room.teamCount)
                "
                @click="toggleCaptain(participant)"
              >
                <v-icon start size="17">mdi-crown</v-icon>
                {{ participant.isCaptain ? '팀장 해제' : '팀장 지정' }}
              </v-btn>
              <v-btn
                v-if="isOwner"
                icon
                size="small"
                variant="text"
                color="error"
                :disabled="captainSubmittingId !== null || kicking"
                @click="openKickDialog(participant)"
              >
                <v-icon size="19">mdi-account-remove-outline</v-icon>
                <v-tooltip activator="parent" location="top">강제 퇴장</v-tooltip>
              </v-btn>
              <v-icon v-else class="ml-auto" size="19" :color="participant.isCaptain ? 'amber' : 'success'">
                {{ participant.isCaptain ? 'mdi-crown' : 'mdi-check-circle' }}
              </v-icon>
            </div>
          </v-col>
        </v-row>

        <div v-else class="text-center py-8 text-medium-emphasis">
          <v-icon size="48">mdi-account-group-outline</v-icon>
          <div class="mt-2">아직 참가자가 없습니다.</div>
        </div>

        <v-alert
          v-if="!account.isLoggedIn"
          type="warning"
          variant="tonal"
          density="compact"
          class="mt-4"
        >
          로그인한 클랜원만 참가할 수 있습니다.
        </v-alert>
        <v-alert
          v-else-if="participantError"
          type="error"
          variant="tonal"
          density="compact"
          class="mt-4"
        >
          {{ participantError }}
        </v-alert>
        <v-alert
          v-else-if="isOwner && room.participants.length !== room.maxParticipants"
          type="info"
          variant="tonal"
          density="compact"
          class="mt-4"
        >
          참가자 {{ room.maxParticipants }}명이 모두 모여야 시작할 수 있습니다.
        </v-alert>
        <v-alert
          v-else-if="isOwner && captainCount !== room.teamCount"
          type="info"
          variant="tonal"
          density="compact"
          class="mt-4"
        >
          참가자 중 팀장 {{ room.teamCount }}명을 지정해야 시작할 수 있습니다.
          (현재 {{ captainCount }}명)
        </v-alert>
      </v-card>
    </v-container>

    <v-container
      v-else-if="room.status === 'POINT_SETTING'"
      class="py-5"
      style="max-width: 900px"
    >
      <v-card class="pa-5 pa-md-7" rounded="xl">
        <div class="d-flex align-center ga-3 mb-2">
          <v-avatar color="deep-purple-accent-2"><v-icon>mdi-coins</v-icon></v-avatar>
          <div>
            <div class="text-h6 font-weight-bold">팀장별 경매 포인트 설정</div>
            <div class="text-body-2 text-medium-emphasis">
              각 팀장이 경매에서 사용할 시작 포인트를 직접 입력하세요.
            </div>
          </div>
        </div>

        <v-divider class="my-5" />

        <v-row>
          <v-col
            v-for="captain in captains"
            :key="captain.accountId"
            cols="12"
            sm="6"
          >
            <v-text-field
              v-model.number="captainPoints[captain.accountId]"
              type="number"
              min="1"
              :label="`${participantName(captain)} 팀장`"
              suffix="P"
              variant="outlined"
              prepend-inner-icon="mdi-crown"
              :readonly="!isOwner"
            />
          </v-col>
        </v-row>

        <v-alert v-if="participantError" type="error" variant="tonal" class="mb-4">
          {{ participantError }}
        </v-alert>

        <div class="d-flex justify-end">
          <v-btn
            v-if="isOwner"
            color="deep-purple-accent-2"
            prepend-icon="mdi-gavel"
            :disabled="!canBeginAuction || beginning"
            :loading="beginning"
            @click="beginAuction"
          >
            포인트 확정 후 경매 시작
          </v-btn>
        </div>
      </v-card>
    </v-container>

    <AuctionStage
      v-else
      :team-count="room.teamCount"
      :bid-seconds="room.bidSeconds"
      :auction-id="room.id"
      :current-account-id="account.id"
      :is-owner="isOwner"
      :is-blind="room.isBlind"
      :can-set-winner="can('AUCTION', 'CLAN-SET-AUCTION-C')"
      :winner-captain-account-id="room.winnerCaptainAccountId"
      :web-socket-url="`${getBaseUrl('DATA').replace(/^http/, 'ws').replace(/\/$/, '')}/auction-live`"
      :captains="
        captains.map((participant) => participantName(participant))
      "
      :captain-points="
        captains.map((participant) => participant.auctionPoints ?? 0)
      "
      :captain-account-ids="
        captains.map((participant) => participant.accountId)
      "
      :captain-cup-counts="captains.map((participant) => participant.player?.cupCount ?? 0)"
      :captain-sub-cup-counts="captains.map((participant) => participant.player?.subCupCount ?? 0)"
      :auction-players="
        room.participants
          .filter((participant) => !participant.isCaptain)
          .map((participant) => ({
            accountId: participant.accountId,
            id: participant.player?.id ?? participant.accountId,
            nickname: participant.player?.nickname || '플레이어 미연결',
            tag: participant.player?.tagname || '',
            tier: participant.player?.tierName || '티어 미정',
            position: participant.player?.position || '',
            positions: participant.player?.positions || [],
            cupCount: participant.player?.cupCount || 0,
            subCupCount: participant.player?.subCupCount || 0,
            teamCaptainAccountId: participant.teamCaptainAccountId,
            winningBid: participant.winningBid,
            isUnsold: participant.isUnsold,
          }))
      "
      :award-player="awardPlayer"
      :mark-unsold="markUnsold"
      :reset-auction="resetAuction"
      :set-winner="setWinner"
    />
  </template>

  <v-snackbar v-model="snackbar" color="success" :timeout="2200">
    경매 내전이 시작되었습니다.
  </v-snackbar>

  <v-dialog v-model="reopenDialog" max-width="460">
    <v-card rounded="xl">
      <v-card-title class="text-h6 font-weight-bold">참가자 수정 단계로 돌아가기</v-card-title>
      <v-card-text>
        참가 모집 단계로 되돌릴까요?
        <div class="text-caption text-medium-emphasis mt-2">
          팀장 지정은 유지되지만 입력한 팀장 포인트와 현재 화면의 경매 진행 내용은 초기화됩니다.
        </div>
      </v-card-text>
      <v-card-actions class="justify-end">
        <v-btn variant="text" :disabled="reopening" @click="reopenDialog = false">취소</v-btn>
        <v-btn color="warning" :loading="reopening" @click="reopenAuction">돌아가기</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="kickDialog" max-width="440">
    <v-card rounded="xl">
      <v-card-title class="text-h6 font-weight-bold">참가자 강제 퇴장</v-card-title>
      <v-card-text>
        <strong>{{ kickTarget?.nickname }}</strong> 님을 참가자에서 삭제할까요?
        <div class="text-caption text-medium-emphasis mt-2">
          팀장으로 지정된 참가자라면 팀장 지정도 함께 해제됩니다.
        </div>
      </v-card-text>
      <v-card-actions class="justify-end">
        <v-btn variant="text" :disabled="kicking" @click="kickDialog = false">취소</v-btn>
        <v-btn color="error" :loading="kicking" @click="kickParticipant">강제 퇴장</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AuctionStage from '@/components/auction/AuctionStage.vue';
import type { AuctionRoom } from '@/data/types/auction';
import { CLAN_PATH } from '@/router/clan/type';
import { useAccountStore } from '@/stores/useAccountStore';
import { getBaseUrl } from '@/@core/composable/createUrl';
import api from '@/@core/composable/useAxios';
import { can } from '@/stores/useClanPermissionStore';

const route = useRoute();
const router = useRouter();
const account = useAccountStore();
const room = ref<AuctionRoom | null>(null);
const loading = ref(true);
const participantSubmitting = ref(false);
const attendanceSubmitting = ref(false);
const participantError = ref('');
const starting = ref(false);
const captainSubmittingId = ref<number | null>(null);
const beginning = ref(false);
const captainPoints = ref<Record<number, number | null>>({});
const reopenDialog = ref(false);
const reopening = ref(false);
const kickDialog = ref(false);
const kicking = ref(false);
const kickTarget = ref<AuctionRoom['participants'][number] | null>(null);
const snackbar = ref(false);
const now = ref(Date.now());
const clanName = computed(() => String(route.params.name ?? ''));
const roomId = computed(() => Number(route.params.id));
const isOwner = computed(() => room.value?.ownerId === account.id);
const isParticipating = computed(
  () => room.value?.participants.some((participant) => participant.accountId === account.id) ?? false
);
const myParticipant = computed(
  () =>
    room.value?.participants.find((participant) => participant.accountId === account.id) ?? null
);
const hasAttended = computed(() => !!myParticipant.value?.attendedAt);
const attendedCount = computed(
  () => room.value?.participants.filter((participant) => participant.attendedAt).length ?? 0
);
const attendanceWindowOpen = computed(() => {
  if (!room.value || room.value.status !== 'RECRUITING') return false;
  return now.value >= new Date(room.value.scheduledAt).getTime() - 10 * 60 * 1000;
});
const captainCount = computed(
  () => room.value?.participants.filter((participant) => participant.isCaptain).length ?? 0
);
const captains = computed(() =>
  (room.value?.participants.filter((participant) => participant.isCaptain) ?? [])
    .slice()
    .sort(
      (a, b) =>
        (a.teamIndex ?? Number.MAX_SAFE_INTEGER) -
          (b.teamIndex ?? Number.MAX_SAFE_INTEGER) ||
        a.joinedAt.localeCompare(b.joinedAt) ||
        a.accountId - b.accountId
    )
);
const canBeginAuction = computed(
  () =>
    captains.value.length > 0 &&
    captains.value.every((captain) => Number(captainPoints.value[captain.accountId]) > 0)
);

function initials(value: string) {
  return value.slice(0, 2);
}

function participantName(participant: AuctionRoom['participants'][number]) {
  if (!participant.player?.nickname) return participant.nickname;
  return participant.player.tagname
    ? `${participant.player.nickname}#${participant.player.tagname}`
    : participant.player.nickname;
}

function goToList() {
  router.push(CLAN_PATH.AUCTION(clanName.value));
}

async function toggleParticipation() {
  if (
    !room.value ||
    !account.isLoggedIn ||
    room.value.status !== 'RECRUITING' ||
    participantSubmitting.value
  ) {
    return;
  }

  participantSubmitting.value = true;
  participantError.value = '';
  try {
    const action = isParticipating.value ? 'leave' : 'join';
    const response = await api.post(`${getBaseUrl('DATA')}/auction/participant/${action}`, {
      auction_id: room.value.id,
      account_id: account.id,
    });
    if (response.status >= 400) {
      throw new Error(response.data?.message || '참가 정보를 저장하지 못했습니다.');
    }
    await loadRoom();
  } catch (error: any) {
    participantError.value =
      error?.response?.data?.message ||
      error?.message ||
      '참가 정보를 저장하지 못했습니다.';
  } finally {
    participantSubmitting.value = false;
  }
}

async function attendAuction() {
  if (
    !room.value ||
    !isParticipating.value ||
    !attendanceWindowOpen.value ||
    hasAttended.value ||
    attendanceSubmitting.value
  ) {
    return;
  }

  attendanceSubmitting.value = true;
  participantError.value = '';
  try {
    const response = await api.post(`${getBaseUrl('DATA')}/auction/participant/attend`, {
      auction_id: room.value.id,
      account_id: account.id,
    });
    if (response.status >= 400) {
      throw new Error(response.data?.message || '출석 정보를 저장하지 못했습니다.');
    }
    await loadRoom();
  } catch (error: any) {
    participantError.value =
      error?.response?.data?.message ||
      error?.message ||
      '출석 정보를 저장하지 못했습니다.';
  } finally {
    attendanceSubmitting.value = false;
  }
}

async function startRoom() {
  if (
    !room.value ||
    !isOwner.value ||
    room.value.participants.length !== room.value.maxParticipants ||
    captainCount.value !== room.value.teamCount ||
    starting.value
  ) {
    return;
  }

  starting.value = true;
  participantError.value = '';
  try {
    const response = await api.post(`${getBaseUrl('DATA')}/auction/start`, {
      id: room.value.id,
      owner_id: account.id,
    });
    if (response.status >= 400) {
      throw new Error(response.data?.message || '경매 내전을 시작하지 못했습니다.');
    }
    await loadRoom();
    snackbar.value = true;
  } catch (error: any) {
    participantError.value =
      error?.response?.data?.message ||
      error?.message ||
      '경매 내전을 시작하지 못했습니다.';
  } finally {
    starting.value = false;
  }
}

async function toggleCaptain(participant: AuctionRoom['participants'][number]) {
  if (!room.value || !isOwner.value || captainSubmittingId.value !== null) return;

  captainSubmittingId.value = participant.accountId;
  participantError.value = '';
  try {
    const response = await api.post(`${getBaseUrl('DATA')}/auction/participant/captain`, {
      auction_id: room.value.id,
      account_id: participant.accountId,
      owner_id: account.id,
      is_captain: !participant.isCaptain,
    });
    if (response.status >= 400) {
      throw new Error(response.data?.message || '팀장 정보를 저장하지 못했습니다.');
    }
    await loadRoom();
  } catch (error: any) {
    participantError.value =
      error?.response?.data?.message ||
      error?.message ||
      '팀장 정보를 저장하지 못했습니다.';
  } finally {
    captainSubmittingId.value = null;
  }
}

async function beginAuction() {
  if (!room.value || !isOwner.value || !canBeginAuction.value || beginning.value) return;

  beginning.value = true;
  participantError.value = '';
  try {
    const response = await api.post(`${getBaseUrl('DATA')}/auction/begin`, {
      id: room.value.id,
      owner_id: account.id,
      captain_points: captains.value.map((captain) => ({
        account_id: captain.accountId,
        points: Number(captainPoints.value[captain.accountId]),
      })),
    });
    if (response.status >= 400) {
      throw new Error(response.data?.message || '경매를 시작하지 못했습니다.');
    }
    await loadRoom();
    snackbar.value = true;
  } catch (error: any) {
    participantError.value =
      error?.response?.data?.message || error?.message || '경매를 시작하지 못했습니다.';
  } finally {
    beginning.value = false;
  }
}

async function reopenAuction() {
  if (!room.value || !isOwner.value || reopening.value) return;

  reopening.value = true;
  participantError.value = '';
  try {
    const response = await api.post(`${getBaseUrl('DATA')}/auction/reopen`, {
      id: room.value.id,
      owner_id: account.id,
    });
    if (response.status >= 400) {
      throw new Error(response.data?.message || '참가자 수정 단계로 돌아가지 못했습니다.');
    }
    reopenDialog.value = false;
    captainPoints.value = {};
    await loadRoom();
  } catch (error: any) {
    participantError.value =
      error?.response?.data?.message ||
      error?.message ||
      '참가자 수정 단계로 돌아가지 못했습니다.';
    reopenDialog.value = false;
  } finally {
    reopening.value = false;
  }
}

function openKickDialog(participant: AuctionRoom['participants'][number]) {
  kickTarget.value = participant;
  kickDialog.value = true;
}

async function kickParticipant() {
  if (!room.value || !kickTarget.value || !isOwner.value || kicking.value) return;

  kicking.value = true;
  participantError.value = '';
  try {
    const response = await api.post(`${getBaseUrl('DATA')}/auction/participant/kick`, {
      auction_id: room.value.id,
      account_id: kickTarget.value.accountId,
      owner_id: account.id,
    });
    if (response.status >= 400) {
      throw new Error(response.data?.message || '참가자를 강제 퇴장하지 못했습니다.');
    }
    kickDialog.value = false;
    kickTarget.value = null;
    await loadRoom();
  } catch (error: any) {
    participantError.value =
      error?.response?.data?.message ||
      error?.message ||
      '참가자를 강제 퇴장하지 못했습니다.';
    kickDialog.value = false;
  } finally {
    kicking.value = false;
  }
}

async function awardPlayer(payload: {
  playerAccountId: number;
  captainAccountId: number;
  winningBid: number;
}) {
  if (!room.value || !isOwner.value) return false;
  try {
    const response = await api.post(`${getBaseUrl('DATA')}/auction/award`, {
      auction_id: room.value.id,
      owner_id: account.id,
      player_account_id: payload.playerAccountId,
      captain_account_id: payload.captainAccountId,
      winning_bid: payload.winningBid,
    });
    if (response.status >= 400) {
      throw new Error(response.data?.message || '낙찰 정보를 저장하지 못했습니다.');
    }
    return true;
  } catch (error: any) {
    participantError.value =
      error?.response?.data?.message ||
      error?.message ||
      '낙찰 정보를 저장하지 못했습니다.';
    return false;
  }
}

async function markUnsold(playerAccountId: number) {
  if (!room.value || !isOwner.value) return false;
  try {
    const response = await api.post(`${getBaseUrl('DATA')}/auction/unsold`, {
      auction_id: room.value.id,
      owner_id: account.id,
      player_account_id: playerAccountId,
    });
    if (response.status >= 400) {
      throw new Error(response.data?.message || '유찰 정보를 저장하지 못했습니다.');
    }
    return true;
  } catch (error: any) {
    participantError.value =
      error?.response?.data?.message ||
      error?.message ||
      '유찰 정보를 저장하지 못했습니다.';
    return false;
  }
}

async function resetAuction() {
  if (!room.value || !isOwner.value) return false;
  try {
    const response = await api.post(`${getBaseUrl('DATA')}/auction/reset`, {
      id: room.value.id,
      owner_id: account.id,
    });
    if (response.status >= 400) {
      throw new Error(response.data?.message || '경매를 초기화하지 못했습니다.');
    }
    captainPoints.value = {};
    await loadRoom();
    return true;
  } catch (error: any) {
    participantError.value =
      error?.response?.data?.message ||
      error?.message ||
      '경매를 초기화하지 못했습니다.';
    return false;
  }
}

async function setWinner(winnerCaptainAccountId: number) {
  if (!room.value || !can('AUCTION', 'CLAN-SET-AUCTION-C')) return false;
  try {
    const response = await api.post(`${getBaseUrl('DATA')}/auction/winner`, {
      auction_id: room.value.id,
      winner_captain_account_id: winnerCaptainAccountId,
    });
    if (response.status >= 400) throw new Error('승리 팀을 저장하지 못했습니다.');
    room.value.winnerCaptainAccountId = winnerCaptainAccountId;
    room.value.status = 'FINISHED';
    return true;
  } catch (error: any) {
    participantError.value =
      error?.response?.data?.message || error?.message || '승리 팀을 저장하지 못했습니다.';
    return false;
  }
}

async function loadRoom() {
  try {
    const response = await api.get(`${getBaseUrl('DATA')}/auction/list`, {
      params: { clan_name: clanName.value },
    });
    const rooms: AuctionRoom[] = Array.isArray(response.data?.datas) ? response.data.datas : [];
    room.value = rooms.find((item) => item.id === roomId.value) ?? null;
    if (room.value?.status === 'POINT_SETTING') {
      captainPoints.value = Object.fromEntries(
        room.value.participants
          .filter((participant) => participant.isCaptain)
          .map((participant) => [participant.accountId, participant.auctionPoints])
      );
    }
  } finally {
    loading.value = false;
  }
}

let clockTimer: ReturnType<typeof setInterval> | null = null;
let attendanceRefreshTimer: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  loadRoom();
  clockTimer = setInterval(() => {
    now.value = Date.now();
  }, 1000);
  attendanceRefreshTimer = setInterval(() => {
    if (room.value?.status === 'RECRUITING') loadRoom();
  }, 10000);
});

onBeforeUnmount(() => {
  if (clockTimer) clearInterval(clockTimer);
  if (attendanceRefreshTimer) clearInterval(attendanceRefreshTimer);
});
</script>

<style scoped>
.room-summary {
  border: 1px solid rgba(187, 134, 252, 0.2);
  background: radial-gradient(circle at 90% 0%, rgba(124, 77, 255, 0.2), transparent 35%);
}

.participant-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 13px;
  background: rgba(255, 255, 255, 0.025);
}
</style>
