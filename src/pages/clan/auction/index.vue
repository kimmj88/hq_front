<template>
  <v-container class="py-6" style="max-width: 1180px">
    <div class="d-flex flex-wrap align-center justify-space-between ga-3 mb-5">
      <div>
        <h1 class="text-h5 font-weight-black">경매 내전</h1>
        <p class="text-body-2 text-medium-emphasis mt-1">
          클랜원을 모집하고 포인트 경매로 팀을 구성합니다.
        </p>
      </div>
      <v-btn
        v-if="can('AUCTION', 'CLAN-SET-AUCTION-C')"
        color="deep-purple-accent-2"
        prepend-icon="mdi-plus"
        @click="router.push(CLAN_PATH.AUCTION_ADD(clanName))"
      >
        경매 내전 생성
      </v-btn>
    </div>

    <v-row v-if="loading">
      <v-col v-for="index in 4" :key="index" cols="12" md="6">
        <v-skeleton-loader type="article, actions" />
      </v-col>
    </v-row>

    <v-alert v-else-if="errorMessage" type="error" variant="tonal">
      {{ errorMessage }}
      <template #append>
        <v-btn variant="text" @click="loadRooms">다시 시도</v-btn>
      </template>
    </v-alert>

    <v-row v-else-if="rooms.length">
      <v-col v-for="room in rooms" :key="room.id" cols="12" md="6">
        <v-card
          class="room-card pa-5"
          rounded="xl"
          hover
          @click="router.push(CLAN_PATH.AUCTION_VIEW(clanName, room.id))"
        >
          <div class="d-flex align-start justify-space-between ga-3">
            <div>
              <v-chip size="x-small" :color="statusMeta(room.status).color" variant="flat">
                {{ statusMeta(room.status).label }}
              </v-chip>
              <div class="text-h6 font-weight-bold mt-3">{{ room.title }}</div>
              <div class="text-caption text-medium-emphasis mt-1">
                방장 {{ room.ownerNickname }} · {{ formatDate(room.scheduledAt) }}
              </div>
            </div>
            <div class="d-flex align-center ga-1">
              <v-btn
                v-if="room.status === 'RECRUITING' && room.ownerId === account.id && can('AUCTION', 'CLAN-SET-AUCTION-C')"
                icon
                size="small"
                variant="text"
                color="primary"
                @click.stop="router.push(CLAN_PATH.AUCTION_EDIT(clanName, room.id))"
              >
                <v-icon size="19">mdi-pencil-outline</v-icon>
                <v-tooltip activator="parent" location="top">수정</v-tooltip>
              </v-btn>
              <v-btn
                v-if="can('AUCTION', 'CLAN-SET-AUCTION-D')"
                icon
                size="small"
                variant="text"
                color="error"
                @click.stop="openDeleteDialog(room)"
              >
                <v-icon size="19">mdi-delete-outline</v-icon>
                <v-tooltip activator="parent" location="top">삭제</v-tooltip>
              </v-btn>
            </div>
          </div>

          <v-divider class="my-4" />

          <div class="d-flex align-center ga-4 text-body-2">
            <span
              ><v-icon size="17">mdi-account-group</v-icon> {{ room.participants.length }}/{{
                room.maxParticipants
              }}명</span
            >
            <span><v-icon size="17">mdi-shield-half-full</v-icon> {{ room.teamCount }}팀</span>
            <span><v-icon size="17">mdi-timer-outline</v-icon> {{ room.bidSeconds }}초</span>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <v-card v-else class="pa-10 text-center" rounded="xl" variant="outlined">
      <v-icon size="64" color="deep-purple-lighten-1">mdi-gavel</v-icon>
      <div class="text-h6 font-weight-bold mt-3">아직 생성된 경매 내전이 없습니다</div>
      <div class="text-body-2 text-medium-emphasis mt-1">첫 번째 경매 내전을 만들어보세요.</div>
    </v-card>

    <v-dialog v-model="deleteDialog" max-width="430">
      <v-card rounded="xl">
        <v-card-title class="text-h6 font-weight-bold">경매 내전 삭제</v-card-title>
        <v-card-text>
          <strong>{{ selectedRoom?.title }}</strong
          >을 삭제할까요?
          <div class="text-caption text-medium-emphasis mt-2">
            삭제한 경매 내전은 복구할 수 없습니다.
          </div>
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn variant="text" :disabled="deleting" @click="deleteDialog = false">취소</v-btn>
          <v-btn color="error" :loading="deleting" @click="deleteRoom">삭제</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar" color="success" :timeout="2200">
      경매 내전을 삭제했습니다.
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { CLAN_PATH } from '@/router/clan/type';
import type { AuctionRoom, AuctionRoomStatus } from '@/data/types/auction';
import { getBaseUrl } from '@/@core/composable/createUrl';
import api from '@/@core/composable/useAxios';
import { useAccountStore } from '@/stores/useAccountStore';
import { can } from '@/stores/useClanPermissionStore';

const route = useRoute();
const router = useRouter();
const account = useAccountStore();
const rooms = ref<AuctionRoom[]>([]);
const loading = ref(false);
const errorMessage = ref('');
const deleteDialog = ref(false);
const deleting = ref(false);
const selectedRoom = ref<AuctionRoom | null>(null);
const snackbar = ref(false);
const clanName = computed(() => String(route.params.name ?? ''));

async function loadRooms() {
  loading.value = true;
  errorMessage.value = '';
  try {
    const response = await api.get(`${getBaseUrl('DATA')}/auction/list`, {
      params: { clan_name: clanName.value },
    });
    rooms.value = Array.isArray(response.data?.datas) ? response.data.datas : [];
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.message || '경매 내전 목록을 불러오지 못했습니다.';
  } finally {
    loading.value = false;
  }
}

function statusMeta(status: AuctionRoomStatus) {
  return {
    RECRUITING: { label: '참가 모집 중', color: 'success' },
    POINT_SETTING: { label: '포인트 설정 중', color: 'warning' },
    IN_PROGRESS: { label: '경매 진행 중', color: 'deep-purple-accent-2' },
    FINISHED: { label: '종료', color: 'grey' },
  }[status];
}

function formatDate(value: string) {
  if (!value) return '일정 미정';
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function openDeleteDialog(room: AuctionRoom) {
  selectedRoom.value = room;
  deleteDialog.value = true;
}

async function deleteRoom() {
  if (!selectedRoom.value || selectedRoom.value.ownerId !== account.id || deleting.value) return;

  deleting.value = true;
  try {
    await api.post(`${getBaseUrl('DATA')}/auction/delete`, {
      id: selectedRoom.value.id,
      owner_id: account.id,
    });
    deleteDialog.value = false;
    selectedRoom.value = null;
    snackbar.value = true;
    await loadRooms();
  } catch (error: any) {
    deleteDialog.value = false;
    errorMessage.value = error?.response?.data?.message || '경매 내전을 삭제하지 못했습니다.';
  } finally {
    deleting.value = false;
  }
}

onMounted(loadRooms);
</script>

<style scoped>
.room-card {
  cursor: pointer;
  border: 1px solid rgba(187, 134, 252, 0.16);
  transition: 0.18s ease;
}
.room-card:hover {
  border-color: rgba(187, 134, 252, 0.6);
  transform: translateY(-2px);
}
</style>
