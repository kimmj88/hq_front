<template>
  <v-container class="party-page py-8">
    <section class="party-hero">
      <div>
        <div class="eyebrow">
          <v-icon size="16">mdi-account-multiple-plus-outline</v-icon> PARTY FINDER
        </div>
        <h1>파티 구하기</h1>
        <p>클랜원들과 함께할 게임을 빠르게 만들고 참가하세요.</p>
      </div>
      <v-btn
        v-if="canParty('CLAN-SET-PARTY-C')"
        color="primary"
        size="large"
        rounded="xl"
        prepend-icon="mdi-plus"
        @click="createDialog = true"
      >
        파티 만들기
      </v-btn>
    </section>

    <div class="party-toolbar">
      <v-chip-group v-model="selectedType" mandatory selected-class="text-primary">
        <v-chip value="ALL" filter color="success">진행 중</v-chip>
        <v-chip value="DUO" filter color="indigo">듀오랭크</v-chip>
        <v-chip value="NORMAL_FLEX" filter color="deep-purple">일반게임/자유랭크</v-chip>
        <v-chip value="INHOUSE" filter color="orange">내전</v-chip>
        <!-- <v-chip value="CLOSED" filter color="grey">종료</v-chip> -->
      </v-chip-group>
      <div class="toolbar-actions">
        <v-text-field
          v-model="historyKeyword"
          class="history-search"
          density="compact"
          variant="solo-filled"
          flat
          hide-details
          clearable
          placeholder="아이디 전적 검색"
          prepend-inner-icon="mdi-account-search-outline"
          @keyup.enter="searchHistory"
          @click:clear="clearHistory"
        />
        <v-btn
          icon="mdi-magnify"
          color="primary"
          variant="tonal"
          :loading="historyLoading"
          @click="searchHistory"
        />
        <v-btn icon="mdi-refresh" variant="text" :loading="loading" @click="loadRooms" />
      </div>
    </div>

    <section v-if="historyResults !== null" class="history-panel">
      <div class="history-title">
        <div>
          <span>PLAYER HISTORY</span>
          <h2>파티 게임 이력</h2>
        </div>
        <v-btn icon="mdi-close" variant="text" @click="clearHistory" />
      </div>
      <v-alert v-if="!historyResults.length" type="info" variant="tonal"
        >검색한 클랜원의 게임 이력이 없습니다.</v-alert
      >
      <div v-else class="history-results">
        <article v-for="result in historyResults" :key="result.account.id" class="history-card">
          <div class="history-player">
            <v-avatar size="48" color="blue-grey-darken-2">
              <v-img v-if="result.account.avatar" :src="avatarUrl(result.account.avatar)" cover />
              <span v-else class="font-weight-bold">{{ initial(historyPlayerName(result)) }}</span>
            </v-avatar>
            <div>
              <strong>{{ historyPlayerName(result) }}</strong
              ><small>{{ result.account.nickname }}</small>
            </div>
          </div>
          <div class="history-stats">
            <div class="total">
              <strong>{{ result.stats.total }}</strong
              ><span>전체 게임</span>
            </div>
            <div>
              <strong>{{ result.stats.duo_rank }}</strong
              ><span>듀오</span>
            </div>
            <div>
              <strong>{{ result.stats.normal }}</strong
              ><span>일반</span>
            </div>
            <div>
              <strong>{{ result.stats.flex_rank }}</strong
              ><span>자유랭크</span>
            </div>
            <div>
              <strong>{{ result.stats.inhouse }}</strong
              ><span>내전</span>
            </div>
          </div>
          <div v-if="result.rooms.length" class="history-rooms">
            <div v-for="historyRoom in result.rooms" :key="historyRoom.id" class="history-room">
              <v-chip size="x-small" :color="typeMeta(historyRoom.type).color" variant="tonal">{{
                typeMeta(historyRoom.type).label
              }}</v-chip>
              <strong>{{ historyRoom.title }}</strong>
              <span>{{ formatHistoryDate(historyRoom.closed_at) }}</span>
            </div>
          </div>
          <div v-else class="no-history">아직 종료된 파티 게임이 없습니다.</div>
        </article>
      </div>
    </section>

    <div v-if="loading && !rooms.length" class="loading-state">
      <v-progress-circular indeterminate color="primary" size="46" />
    </div>

    <v-alert v-else-if="!filteredRooms.length" type="info" variant="tonal" class="mt-5">
      현재 모집 중인 파티가 없습니다. 첫 번째 파티를 만들어보세요.
    </v-alert>

    <div v-else class="party-sections">
      <section v-for="group in groupedRooms" :key="group.type" class="party-section">
        <div class="section-heading">
          <div>
            <v-icon :color="typeMeta(group.type).color" size="22">{{
              typeMeta(group.type).icon
            }}</v-icon>
            <h2>{{ typeMeta(group.type).label }}</h2>
          </div>
          <span>{{ group.rooms.length }}개 방</span>
        </div>
        <div class="party-grid">
          <article
            v-for="room in group.rooms"
            :key="room.id"
            :class="[
              'party-card',
              room.is_joined && 'is-mine',
              room.status === 'CLOSED' && 'is-closed',
            ]"
          >
            <div class="card-top">
              <v-chip
                size="small"
                :color="typeMeta(room.type).color"
                variant="tonal"
                class="font-weight-bold"
              >
                <v-icon start size="15">{{ typeMeta(room.type).icon }}</v-icon
                >{{ typeMeta(room.type).label }}
              </v-chip>
              <span :class="['status', statusMeta(room.status).className]">
                <i />{{ statusMeta(room.status).label }}
              </span>
            </div>

            <h2>{{ room.title }}</h2>
            <p class="description">
              {{ room.description || '같이 즐겁게 게임하실 분을 기다리고 있어요.' }}
            </p>

            <div class="owner-highlight">
              <v-avatar size="40" color="amber-darken-3">
                <v-img v-if="room.owner.avatar" :src="avatarUrl(room.owner.avatar)" cover />
                <span v-else class="text-caption font-weight-bold">{{
                  initial(room.owner.nickname)
                }}</span>
              </v-avatar>
              <div class="owner-copy">
                <span><v-icon size="14">mdi-crown</v-icon> 파티장</span>
                <strong>{{ room.owner.nickname }}</strong>
              </div>
              <v-chip size="x-small" color="amber" variant="tonal" class="ml-auto font-weight-bold"
                >HOST</v-chip
              >
            </div>

            <div class="room-info">
              <span
                ><v-icon size="17">mdi-clock-outline</v-icon
                >{{ scheduleLabel(room.scheduled_at) }}</span
              >
            </div>

            <div class="member-head">
              <strong>참가자</strong>
              <span>{{ room.member_count }} / {{ room.max_members }}</span>
            </div>
            <div class="members">
              <div
                v-for="member in room.members"
                :key="member.id"
                class="member"
                :title="memberName(member)"
              >
                <v-avatar size="38" color="blue-grey-darken-2">
                  <v-img
                    v-if="member.account.avatar"
                    :src="avatarUrl(member.account.avatar)"
                    cover
                  />
                  <span v-else class="text-caption font-weight-bold">{{
                    initial(memberName(member))
                  }}</span>
                </v-avatar>
                <div class="member-copy">
                  <strong>{{ memberName(member) }}</strong>
                  <small>
                    <span class="member-position">
                      <v-img
                        v-if="positionIcon(member.position)"
                        :src="positionIcon(member.position)!"
                        width="18"
                        height="18"
                      />
                      <v-icon v-else size="15">mdi-all-inclusive</v-icon>
                      {{ positionLabel(member.position) }}
                    </span>
                    <template v-if="member.player?.tier"> · {{ member.player.tier }}</template>
                  </small>
                  <v-tooltip v-if="member.note" :text="member.note" location="top">
                    <template #activator="{ props }">
                      <div v-bind="props" class="member-note">
                        <v-icon size="12">mdi-message-text-outline</v-icon>
                        <span>{{ member.note }}</span>
                      </div>
                    </template>
                  </v-tooltip>
                </div>
                <v-tooltip
                  v-if="
                    room.status !== 'CLOSED' &&
                    (room.is_owner || canParty('CLAN-SET-PARTY-D')) &&
                    member.account.id !== room.owner.id &&
                    member.account.id !== account.id
                  "
                  text="참가자 내보내기"
                >
                  <template #activator="{ props }">
                    <v-btn
                      v-bind="props"
                      class="kick-button"
                      icon="mdi-account-remove-outline"
                      size="x-small"
                      variant="text"
                      color="error"
                      @click="kickMember(room, member)"
                    />
                  </template>
                </v-tooltip>
              </div>
              <div
                v-for="slot in room.max_members - room.member_count"
                :key="`empty-${slot}`"
                class="empty-member"
              >
                <v-icon size="19">mdi-account-plus-outline</v-icon><span>자리 있음</span>
              </div>
            </div>

            <div v-if="room.waitlist_count" class="waitlist-box">
              <div class="waitlist-head">
                <span><v-icon size="17">mdi-timer-sand</v-icon> 대기열</span>
                <strong>{{ room.waitlist_count }}명</strong>
              </div>
              <div class="waitlist-people">
                <v-chip
                  v-for="waiter in room.waitlist"
                  :key="waiter.id"
                  size="small"
                  :color="waiter.account.id === account.id ? 'warning' : 'default'"
                  variant="tonal"
                >
                  {{ waiter.order }}. {{ waitlistName(waiter) }}
                  <v-tooltip v-if="waiter.note" :text="waiter.note" location="top">
                    <template #activator="{ props }">
                      <v-icon v-bind="props" class="ml-1" size="14"
                        >mdi-message-text-outline</v-icon
                      >
                    </template>
                  </v-tooltip>
                </v-chip>
              </div>
            </div>

            <div class="card-actions">
              <v-btn
                v-if="room.status !== 'CLOSED'"
                color="teal-lighten-1"
                variant="tonal"
                rounded="lg"
                prepend-icon="mdi-link-variant"
                @click="copyJoinLink(room)"
                >참여 링크</v-btn
              >
              <v-chip
                v-if="room.status === 'CLOSED'"
                color="grey"
                variant="tonal"
                prepend-icon="mdi-lock-outline"
                >종료</v-chip
              >
              <v-btn
                v-if="
                  room.status !== 'CLOSED' &&
                  !room.is_owner &&
                  room.is_joined &&
                  canParty('CLAN-SET-PARTY-U')
                "
                color="secondary"
                variant="tonal"
                rounded="lg"
                @click="leaveRoom(room)"
                >나가기</v-btn
              >
              <v-btn
                v-if="room.status !== 'CLOSED' && (room.is_owner || canParty('CLAN-SET-PARTY-D'))"
                color="error"
                variant="tonal"
                rounded="lg"
                @click="closeRoom(room)"
                >파티 종료</v-btn
              >
              <v-btn
                v-if="room.discord_url"
                :href="room.discord_url"
                target="_blank"
                rel="noopener noreferrer"
                color="indigo-lighten-1"
                variant="tonal"
                rounded="lg"
                prepend-icon="mdi-discord"
                >디스코드 참가</v-btn
              >
              <v-btn
                v-if="
                  room.status !== 'CLOSED' &&
                  !room.is_owner &&
                  !room.is_joined &&
                  !room.is_waiting &&
                  room.status === 'RECRUITING' &&
                  canParty('CLAN-SET-PARTY-U')
                "
                color="primary"
                rounded="lg"
                @click="openJoin(room)"
              >
                참가하기
              </v-btn>
              <v-btn
                v-if="
                  room.status === 'FULL' &&
                  !room.is_owner &&
                  !room.is_joined &&
                  !room.is_waiting &&
                  canParty('CLAN-SET-PARTY-U')
                "
                color="warning"
                variant="tonal"
                rounded="lg"
                prepend-icon="mdi-timer-sand"
                @click="openWaitlist(room)"
              >
                대기하기
              </v-btn>
              <v-btn
                v-if="room.status !== 'CLOSED' && room.is_waiting"
                color="warning"
                variant="outlined"
                rounded="lg"
                @click="cancelWaitlist(room)"
              >
                대기 {{ room.waitlist_order }}번 취소
              </v-btn>
            </div>
          </article>
        </div>
      </section>
    </div>

    <v-dialog v-model="createDialog" max-width="620">
      <v-card rounded="xl">
        <v-card-title class="pa-6 pb-2 text-h6 font-weight-bold">새 파티 만들기</v-card-title>
        <v-card-text class="pa-6 pt-3">
          <v-select
            v-model="form.type"
            :items="typeOptions"
            item-title="label"
            item-value="value"
            label="게임 종류"
            variant="outlined"
          />
          <v-text-field
            v-model="form.title"
            label="방 제목"
            maxlength="100"
            counter
            variant="outlined"
          />
          <v-textarea
            v-model="form.description"
            label="간단한 설명"
            rows="3"
            maxlength="500"
            counter
            variant="outlined"
          />
          <v-text-field
            v-model="form.discordUrl"
            label="디스코드 초대 링크"
            placeholder="https://discord.gg/..."
            maxlength="500"
            prepend-inner-icon="mdi-discord"
            clearable
            variant="outlined"
          />
          <v-row dense>
            <v-col cols="12" sm="6"
              ><v-select
                v-model="form.position"
                :items="positions"
                item-title="label"
                item-value="value"
                label="내 포지션"
                clearable
                variant="outlined"
            /></v-col>
            <v-col cols="12" sm="6"
              ><v-text-field
                v-model="form.scheduledAt"
                type="datetime-local"
                label="시작 예정 시간"
                clearable
                variant="outlined"
            /></v-col>
          </v-row>
        </v-card-text>
        <v-card-actions class="pa-6 pt-0 justify-end">
          <v-btn variant="text" @click="createDialog = false">취소</v-btn>
          <v-btn
            color="primary"
            :loading="saving"
            :disabled="!form.title.trim()"
            @click="createRoom"
            >파티 만들기</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="joinDialog" max-width="430">
      <v-card rounded="xl">
        <v-card-title class="pa-6 pb-2 text-h6 font-weight-bold">
          {{ joinMode === 'WAITLIST' ? '파티 대기 신청' : '파티 참가' }}
        </v-card-title>
        <v-card-text class="pa-6 pt-3">
          <p class="text-body-2 text-medium-emphasis mb-4">{{ joiningRoom?.title }}</p>
          <v-select
            v-model="joinPosition"
            :items="positions"
            item-title="label"
            item-value="value"
            :label="joinMode === 'WAITLIST' ? '대기 포지션' : '참가 포지션'"
            clearable
            variant="outlined"
            hint="정해지지 않았다면 비워두세요."
            persistent-hint
          />
          <v-textarea
            v-model="joinNote"
            class="mt-4"
            label="메모 (선택)"
            placeholder="파티장이나 팀원에게 전달할 내용을 적어주세요."
            variant="outlined"
            rows="2"
            auto-grow
            maxlength="20"
            counter="20"
            hide-details="auto"
          />
        </v-card-text>
        <v-card-actions class="pa-6 pt-0 justify-end">
          <v-btn variant="text" @click="joinDialog = false">취소</v-btn>
          <v-btn
            :color="joinMode === 'WAITLIST' ? 'warning' : 'primary'"
            :loading="saving"
            @click="joinRoom"
          >
            {{ joinMode === 'WAITLIST' ? '대기 신청' : '참가하기' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color">{{ snackbar.message }}</v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '@/@core/composable/useAxios';
import { getBaseUrl } from '@/@core/composable/createUrl';
import { useAccountStore } from '@/stores/useAccountStore';
import { can } from '@/stores/useClanPermissionStore';
import topIcon from '@/assets/positions/top.svg';
import jugIcon from '@/assets/positions/jug.svg';
import midIcon from '@/assets/positions/mid.svg';
import adcIcon from '@/assets/positions/adc.webp';
import supIcon from '@/assets/positions/sup.svg';

type RoomType = 'DUO_RANK' | 'NORMAL' | 'FLEX_RANK' | 'INHOUSE';
interface PartyMember {
  id: number;
  position: string | null;
  note: string | null;
  account: { id: number; nickname: string; avatar: string | null };
  player: { nickname: string; tagname: string; tier: string | null } | null;
}
interface PartyWaiter {
  id: number;
  order: number;
  position: string | null;
  note: string | null;
  account: { id: number; nickname: string; avatar: string | null };
  player: { nickname: string; tagname: string } | null;
}
interface PartyRoom {
  id: number;
  type: RoomType;
  title: string;
  description: string | null;
  status: 'RECRUITING' | 'FULL' | 'CLOSED';
  max_members: number;
  member_count: number;
  scheduled_at: string | null;
  discord_url: string | null;
  owner: { id: number; nickname: string; avatar: string | null };
  members: PartyMember[];
  waitlist: PartyWaiter[];
  waitlist_count: number;
  is_owner: boolean;
  is_joined: boolean;
  is_waiting: boolean;
  waitlist_order: number | null;
}
interface HistoryResult {
  account: { id: number; nickname: string; avatar: string | null };
  player: { id: number; nickname: string; tagname: string } | null;
  stats: { total: number; duo_rank: number; normal: number; flex_rank: number; inhouse: number };
  rooms: {
    id: number;
    type: RoomType;
    title: string;
    scheduled_at: string | null;
    closed_at: string;
    member_count: number;
    owner: { id: number; nickname: string };
  }[];
}

const account = useAccountStore();
const route = useRoute();
const router = useRouter();
function canParty(code: string) {
  return account.isClanMaster || can('PARTY', code);
}
const rooms = ref<PartyRoom[]>([]);
const loading = ref(false);
const saving = ref(false);
const selectedType = ref<'ALL' | 'DUO' | 'NORMAL_FLEX' | 'INHOUSE' | 'CLOSED'>('ALL');
const createDialog = ref(false);
const joinDialog = ref(false);
const joiningRoom = ref<PartyRoom | null>(null);
const joinPosition = ref<string | null>(null);
const joinNote = ref('');
const joinMode = ref<'JOIN' | 'WAITLIST'>('JOIN');
const snackbar = ref({ show: false, message: '', color: 'success' });
const historyKeyword = ref('');
const historyLoading = ref(false);
const historyResults = ref<HistoryResult[] | null>(null);
const positions = [
  { label: '탑', value: 'TOP' },
  { label: '정글', value: 'JUG' },
  { label: '미드', value: 'MID' },
  { label: '원딜', value: 'ADC' },
  { label: '서포터', value: 'SUP' },
];
const typeOptions = [
  { label: '듀오랭크 (2명)', value: 'DUO_RANK' },
  { label: '일반게임 (5명)', value: 'NORMAL' },
  { label: '자유랭크 (5명)', value: 'FLEX_RANK' },
  { label: '내전 (10명)', value: 'INHOUSE' },
];
const form = reactive({
  type: 'DUO_RANK' as RoomType,
  title: '',
  description: '',
  position: null as string | null,
  scheduledAt: '',
  discordUrl: '',
});
const filteredRooms = computed(() =>
  rooms.value.filter((room) => {
    if (selectedType.value === 'CLOSED') return room.status === 'CLOSED';
    if (room.status === 'CLOSED') return false;
    if (selectedType.value === 'DUO') return room.type === 'DUO_RANK';
    if (selectedType.value === 'NORMAL_FLEX') {
      return room.type === 'NORMAL' || room.type === 'FLEX_RANK';
    }
    if (selectedType.value === 'INHOUSE') return room.type === 'INHOUSE';
    return true;
  })
);
const groupedRooms = computed(() =>
  (['DUO_RANK', 'INHOUSE', 'FLEX_RANK', 'NORMAL'] as RoomType[])
    .map((type) => ({ type, rooms: filteredRooms.value.filter((room) => room.type === type) }))
    .filter((group) => group.rooms.length)
);
const positionIcons: Record<string, string> = {
  탑: topIcon,
  TOP: topIcon,
  정글: jugIcon,
  JUG: jugIcon,
  미드: midIcon,
  MID: midIcon,
  원딜: adcIcon,
  ADC: adcIcon,
  서포터: supIcon,
  SUP: supIcon,
};

function typeMeta(type: RoomType) {
  if (type === 'DUO_RANK') {
    return { label: '듀오랭크', color: 'indigo', icon: 'mdi-account-multiple' };
  }
  if (type === 'NORMAL') {
    return { label: '일반게임', color: 'teal', icon: 'mdi-gamepad-variant-outline' };
  }
  if (type === 'INHOUSE') {
    return { label: '내전', color: 'orange', icon: 'mdi-sword-cross' };
  }
  return { label: '자유랭크', color: 'deep-purple', icon: 'mdi-shield-sword-outline' };
}
function statusMeta(status: PartyRoom['status']) {
  if (status === 'RECRUITING') return { label: '모집 중', className: 'recruiting' };
  if (status === 'FULL') return { label: '모집 완료', className: 'full' };
  return { label: '종료', className: 'closed' };
}
function notify(message: string, color = 'success') {
  snackbar.value = { show: true, message, color };
}
function avatarUrl(value: string) {
  return /^https?:\/\//i.test(value) ? value : `${getBaseUrl('DATA').replace(/\/$/, '')}${value}`;
}
function initial(value: string) {
  return value.trim().slice(0, 2) || '?';
}
function positionIcon(position: string | null) {
  return position ? positionIcons[position] ?? null : null;
}
function positionLabel(position: string | null) {
  if (!position) return '포지션 무관';
  return positions.find((item) => item.value === position)?.label ?? position;
}
function memberName(member: PartyMember) {
  return member.player
    ? `${member.player.nickname}#${member.player.tagname}`
    : member.account.nickname;
}
function waitlistName(waiter: PartyWaiter) {
  return waiter.player
    ? `${waiter.player.nickname}#${waiter.player.tagname}`
    : waiter.account.nickname;
}
function scheduleLabel(value: string | null) {
  if (!value) return '시간 협의';
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}
function historyPlayerName(result: HistoryResult) {
  return result.player
    ? `${result.player.nickname}#${result.player.tagname}`
    : result.account.nickname;
}
function formatHistoryDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(value)
  );
}
function clearHistory() {
  historyKeyword.value = '';
  historyResults.value = null;
}
async function searchHistory() {
  if (!historyKeyword.value.trim()) {
    notify('검색할 아이디를 입력해주세요.', 'warning');
    return;
  }
  try {
    historyLoading.value = true;
    const { data } = await api.get(`${getBaseUrl('DATA')}/party-room/history/search`, {
      params: { clan_id: account.clan.id, keyword: historyKeyword.value.trim() },
    });
    historyResults.value = data.datas ?? [];
  } catch (error: any) {
    notify(error?.response?.data?.message ?? '게임 이력을 검색하지 못했습니다.', 'error');
  } finally {
    historyLoading.value = false;
  }
}

async function loadRooms() {
  try {
    loading.value = true;
    const { data } = await api.get(`${getBaseUrl('DATA')}/party-room/list`, {
      params: { clan_id: account.clan.id },
    });
    rooms.value = data.datas ?? [];
    await openJoinFromLink();
  } catch (error: any) {
    notify(error?.response?.data?.message ?? '파티 목록을 불러오지 못했습니다.', 'error');
  } finally {
    loading.value = false;
  }
}

async function copyJoinLink(room: PartyRoom) {
  const url = `${window.location.origin}${route.path}?join=${room.id}`;
  try {
    await navigator.clipboard.writeText(url);
    notify('참여 링크를 복사했습니다.');
  } catch {
    const input = document.createElement('textarea');
    input.value = url;
    input.style.position = 'fixed';
    input.style.opacity = '0';
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    input.remove();
    notify('참여 링크를 복사했습니다.');
  }
}

async function openJoinFromLink() {
  const roomId = Number(route.query.join);
  if (!Number.isInteger(roomId) || roomId <= 0) return;

  const nextQuery = { ...route.query };
  delete nextQuery.join;
  await router.replace({ query: nextQuery });

  const room = rooms.value.find((item) => item.id === roomId);
  if (!room) {
    notify('참여할 파티방을 찾을 수 없습니다.', 'warning');
    return;
  }
  if (room.status === 'CLOSED') {
    notify('종료된 파티방입니다.', 'warning');
    return;
  }
  if (room.is_owner || room.is_joined) {
    notify('이미 참가 중인 파티방입니다.', 'info');
    return;
  }
  if (room.is_waiting) {
    notify(`이미 대기 ${room.waitlist_order}번으로 등록되어 있습니다.`, 'info');
    return;
  }
  if (!canParty('CLAN-SET-PARTY-U')) {
    notify('파티에 참가할 권한이 없습니다.', 'error');
    return;
  }
  if (room.status === 'FULL') openWaitlist(room);
  else openJoin(room);
}

async function createRoom() {
  try {
    saving.value = true;
    await api.post(`${getBaseUrl('DATA')}/party-room/create`, {
      clan_id: account.clan.id,
      type: form.type,
      title: form.title,
      description: form.description,
      position: form.position,
      scheduled_at: form.scheduledAt || undefined,
      discord_url: form.discordUrl.trim() || undefined,
    });
    createDialog.value = false;
    Object.assign(form, {
      type: 'DUO_RANK',
      title: '',
      description: '',
      position: null,
      scheduledAt: '',
      discordUrl: '',
    });
    await loadRooms();
    notify('파티방을 만들었습니다.');
  } catch (error: any) {
    notify(error?.response?.data?.message ?? '파티방을 만들지 못했습니다.', 'error');
  } finally {
    saving.value = false;
  }
}

function openJoin(room: PartyRoom) {
  joiningRoom.value = room;
  joinPosition.value = null;
  joinNote.value = '';
  joinMode.value = 'JOIN';
  joinDialog.value = true;
}
function openWaitlist(room: PartyRoom) {
  joiningRoom.value = room;
  joinPosition.value = null;
  joinNote.value = '';
  joinMode.value = 'WAITLIST';
  joinDialog.value = true;
}
async function joinRoom() {
  if (!joiningRoom.value) return;
  try {
    saving.value = true;
    const endpoint = joinMode.value === 'WAITLIST' ? 'waitlist' : 'join';
    await api.post(`${getBaseUrl('DATA')}/party-room/${endpoint}`, {
      room_id: joiningRoom.value.id,
      position: joinPosition.value,
      note: joinNote.value.trim() || undefined,
    });
    joinDialog.value = false;
    await loadRooms();
    notify(joinMode.value === 'WAITLIST' ? '파티 대기열에 등록했습니다.' : '파티에 참가했습니다.');
  } catch (error: any) {
    notify(
      error?.response?.data?.message ??
        (joinMode.value === 'WAITLIST'
          ? '대기 신청에 실패했습니다.'
          : '파티에 참가하지 못했습니다.'),
      'error'
    );
  } finally {
    saving.value = false;
  }
}
async function cancelWaitlist(room: PartyRoom) {
  if (!confirm(`'${room.title}' 파티 대기를 취소할까요?`)) return;
  try {
    await api.post(`${getBaseUrl('DATA')}/party-room/waitlist/cancel`, { room_id: room.id });
    await loadRooms();
    notify('대기를 취소했습니다.');
  } catch (error: any) {
    notify(error?.response?.data?.message ?? '대기를 취소하지 못했습니다.', 'error');
  }
}
async function leaveRoom(room: PartyRoom) {
  if (!confirm(`'${room.title}' 파티에서 나갈까요?`)) return;
  try {
    await api.post(`${getBaseUrl('DATA')}/party-room/leave`, { room_id: room.id });
    await loadRooms();
    notify('파티에서 나왔습니다.');
  } catch (error: any) {
    notify(error?.response?.data?.message ?? '파티에서 나가지 못했습니다.', 'error');
  }
}
async function closeRoom(room: PartyRoom) {
  if (!confirm(`'${room.title}' 파티를 종료할까요?`)) return;
  try {
    await api.post(`${getBaseUrl('DATA')}/party-room/close`, { room_id: room.id });
    await loadRooms();
    notify('파티를 종료했습니다.');
  } catch (error: any) {
    notify(error?.response?.data?.message ?? '파티를 종료하지 못했습니다.', 'error');
  }
}
async function kickMember(room: PartyRoom, member: PartyMember) {
  if (!confirm(`${memberName(member)} 님을 파티에서 내보낼까요?`)) return;
  try {
    await api.post(`${getBaseUrl('DATA')}/party-room/kick`, {
      room_id: room.id,
      target_account_id: member.account.id,
    });
    await loadRooms();
    notify(`${memberName(member)} 님을 파티에서 내보냈습니다.`);
  } catch (error: any) {
    notify(error?.response?.data?.message ?? '참가자를 내보내지 못했습니다.', 'error');
  }
}
onMounted(loadRooms);
</script>

<style scoped>
.party-page {
  max-width: 1320px;
}
.party-hero {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
  padding: 32px 36px;
  border: 1px solid rgba(var(--v-theme-primary), 0.18);
  border-radius: 26px;
  background: radial-gradient(
      circle at 82% 10%,
      rgba(var(--v-theme-primary), 0.24),
      transparent 35%
    ),
    linear-gradient(135deg, #171324, #24203a);
}
.eyebrow {
  display: flex;
  align-items: center;
  gap: 7px;
  color: rgb(var(--v-theme-primary));
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.12em;
}
.party-hero h1 {
  margin: 7px 0 5px;
  font-size: clamp(30px, 5vw, 44px);
  letter-spacing: -0.045em;
}
.party-hero p {
  margin: 0;
  color: rgba(255, 255, 255, 0.55);
}
.party-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-top: 20px;
}
.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 7px;
}
.history-search {
  width: 250px;
}
.history-panel {
  margin: 8px 0 24px;
  padding: 22px;
  border: 1px solid rgba(var(--v-theme-primary), 0.18);
  border-radius: 22px;
  background: rgba(var(--v-theme-surface), 0.78);
}
.history-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.history-title span {
  color: rgb(var(--v-theme-primary));
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.13em;
}
.history-title h2 {
  margin: 2px 0 0;
  font-size: 21px;
}
.history-results {
  display: grid;
  gap: 12px;
}
.history-card {
  display: grid;
  grid-template-columns: minmax(210px, 1fr) minmax(310px, 1.4fr);
  gap: 16px;
  padding: 16px;
  border: 1px solid rgba(var(--v-border-color), 0.14);
  border-radius: 17px;
  background: rgba(var(--v-theme-on-surface), 0.025);
}
.history-player {
  display: flex;
  align-items: center;
  gap: 12px;
}
.history-player div {
  display: flex;
  min-width: 0;
  flex-direction: column;
}
.history-player strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.history-player small {
  color: rgba(var(--v-theme-on-surface), 0.42);
}
.history-stats {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 7px;
}
.history-stats > div {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  padding: 9px;
  border-radius: 12px;
  background: rgba(var(--v-theme-on-surface), 0.045);
}
.history-stats strong {
  font-size: 18px;
}
.history-stats span {
  color: rgba(var(--v-theme-on-surface), 0.42);
  font-size: 10px;
}
.history-stats .total {
  color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.09);
}
.history-rooms,
.no-history {
  grid-column: 1/-1;
}
.history-rooms {
  display: grid;
  gap: 6px;
  padding-top: 4px;
}
.history-room {
  display: grid;
  grid-template-columns: 82px 1fr auto;
  align-items: center;
  gap: 9px;
  padding: 8px 10px;
  border-radius: 10px;
  background: rgba(var(--v-theme-on-surface), 0.035);
}
.history-room strong {
  font-size: 12px;
}
.history-room > span {
  color: rgba(var(--v-theme-on-surface), 0.42);
  font-size: 10px;
}
.no-history {
  padding: 10px;
  color: rgba(var(--v-theme-on-surface), 0.4);
  font-size: 12px;
  text-align: center;
}
.party-sections {
  display: grid;
  gap: 34px;
  margin-top: 22px;
}
.section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  padding: 0 3px 10px;
  border-bottom: 1px solid rgba(var(--v-border-color), 0.15);
}
.section-heading > div {
  display: flex;
  align-items: center;
  gap: 9px;
}
.section-heading h2 {
  margin: 0;
  font-size: 21px;
}
.section-heading > span {
  color: rgba(var(--v-theme-on-surface), 0.48);
  font-size: 12px;
  font-weight: 700;
}
.party-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}
.party-card {
  display: flex;
  min-height: 430px;
  flex-direction: column;
  padding: 22px;
  border: 1px solid rgba(var(--v-border-color), 0.16);
  border-radius: 22px;
  background: rgba(var(--v-theme-surface), 0.9);
  transition: 0.2s ease;
}
.party-card:hover {
  border-color: rgba(var(--v-theme-primary), 0.35);
  transform: translateY(-3px);
  box-shadow: 0 18px 45px rgba(0, 0, 0, 0.16);
}
.party-card.is-mine {
  border-color: rgba(var(--v-theme-primary), 0.38);
  box-shadow: inset 0 0 0 1px rgba(var(--v-theme-primary), 0.08);
}
.party-card.is-closed {
  border-color: rgba(148, 163, 184, 0.13);
  background: rgba(var(--v-theme-surface), 0.62);
}
.card-top,
.member-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.status {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 13px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 900;
  letter-spacing: -0.01em;
}
.status i {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
  box-shadow: 0 0 10px currentColor;
}
.status.recruiting {
  color: #43e78f;
  background: rgba(53, 208, 127, 0.12);
  border: 1px solid rgba(53, 208, 127, 0.24);
}
.status.full {
  color: #aab4c4;
  background: rgba(148, 163, 184, 0.1);
  border: 1px solid rgba(148, 163, 184, 0.18);
}
.status.closed {
  color: #8b95a5;
  background: rgba(100, 116, 139, 0.12);
  border: 1px solid rgba(100, 116, 139, 0.2);
}
.status.closed i {
  box-shadow: none;
}
.party-card h2 {
  margin: 18px 0 7px;
  font-size: 21px;
  letter-spacing: -0.025em;
}
.description {
  min-height: 44px;
  margin: 0;
  color: rgba(var(--v-theme-on-surface), 0.55);
  font-size: 14px;
  line-height: 1.55;
}
.owner-highlight {
  display: flex;
  align-items: center;
  gap: 11px;
  margin-top: 16px;
  padding: 11px 12px;
  border: 1px solid rgba(245, 158, 11, 0.22);
  border-radius: 15px;
  background: linear-gradient(90deg, rgba(245, 158, 11, 0.11), rgba(245, 158, 11, 0.025));
}
.owner-highlight .v-avatar {
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.13);
}
.owner-copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
}
.owner-copy span {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #fbbf24;
  font-size: 10px;
  font-weight: 800;
}
.owner-copy strong {
  overflow: hidden;
  margin-top: 2px;
  font-size: 14px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.room-info {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 14px;
  margin: 13px 0 17px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(var(--v-border-color), 0.13);
}
.room-info span {
  display: flex;
  align-items: center;
  gap: 5px;
  color: rgba(var(--v-theme-on-surface), 0.57);
  font-size: 12px;
}
.member-head {
  margin-bottom: 10px;
  font-size: 13px;
}
.member-head span {
  color: rgb(var(--v-theme-primary));
  font-weight: 800;
}
.members {
  display: grid;
  gap: 7px;
}
.waitlist-box {
  margin-top: 12px;
  padding: 11px 12px;
  border: 1px solid rgba(245, 158, 11, 0.22);
  border-radius: 14px;
  background: rgba(245, 158, 11, 0.07);
}
.waitlist-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  color: #f59e0b;
  font-size: 12px;
}
.waitlist-head span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-weight: 850;
}
.waitlist-people {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.member,
.empty-member {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 46px;
  padding: 5px 8px;
  border-radius: 12px;
  background: rgba(var(--v-theme-on-surface), 0.035);
}
.member > .v-avatar {
  flex: 0 0 auto;
}
.member-copy {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
}
.member strong {
  overflow: hidden;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.member small {
  display: flex;
  align-items: center;
  color: rgba(var(--v-theme-on-surface), 0.45);
  font-size: 10px;
}
.member-note {
  display: flex;
  min-width: 0;
  max-width: 100%;
  align-items: center;
  gap: 4px;
  margin-top: 2px;
  color: rgba(var(--v-theme-on-surface), 0.6);
  cursor: help;
  font-size: 10px;
}
.member-note span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.member-position {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.member-position .v-img {
  flex: 0 0 auto;
}
.kick-button {
  flex: 0 0 auto;
}
.empty-member {
  justify-content: center;
  color: rgba(var(--v-theme-on-surface), 0.28);
  border: 1px dashed rgba(var(--v-border-color), 0.16);
  background: transparent;
  font-size: 11px;
}
.card-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
  margin-top: auto;
  padding-top: 20px;
}
.loading-state {
  display: grid;
  height: 280px;
  place-items: center;
}
@media (max-width: 1050px) {
  .party-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 680px) {
  .party-page {
    padding-inline: 12px !important;
  }
  .party-hero {
    align-items: flex-start;
    flex-direction: column;
    padding: 24px;
  }
  .party-hero .v-btn {
    width: 100%;
  }
  .party-grid {
    grid-template-columns: 1fr;
  }
  .party-toolbar {
    align-items: stretch;
    flex-direction: column;
  }
  .party-toolbar :deep(.v-slide-group__content) {
    flex-wrap: wrap;
  }
  .toolbar-actions {
    width: 100%;
  }
  .history-search {
    width: auto;
    flex: 1;
  }
  .history-card {
    grid-template-columns: 1fr;
  }
  .history-stats {
    grid-template-columns: repeat(3, 1fr);
  }
  .history-room {
    grid-template-columns: 72px 1fr;
  }
  .history-room > span {
    grid-column: 2;
  }
}
</style>
