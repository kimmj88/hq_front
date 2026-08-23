<template>
  <v-container class="py-6">
    <!-- ====== HEADER CARD ====== -->
    <v-card class="pa-5" rounded="xl" elevation="2">
      <div class="d-flex flex-wrap align-center justify-space-between" style="gap: 16px">
        <!-- left: avatar + text -->
        <div class="d-flex align-center" style="gap: 16px">
          <v-avatar size="72" color="blue-darken-2">
            <v-img v-if="account.datas.avatar" :src="avatarUrl(account.datas.avatar)" cover />
            <span v-else class="text-h6 font-weight-bold text-white">
              {{ getInitials(account.datas.nickname) }}
            </span>
          </v-avatar>

          <div>
            <div class="d-flex align-center" style="gap: 8px">
              <div class="text-h6 font-weight-medium">
                {{ account.datas.nickname || '-' }}
              </div>

              <v-chip v-if="selectedSystemRole && !props.profileOnly" size="small" color="cyan-darken-2" variant="flat">
                {{ selectedSystemRole.name }}
              </v-chip>
            </div>

            <div v-if="!props.profileOnly" class="text-caption text-medium-emphasis">
              {{ account.datas.email || '-' }}
              <span v-if="account.datas.department"> · {{ account.datas.department }}</span>
            </div>
            <div v-if="account.datas.clan" class="text-caption text-primary mt-1">
              {{ account.datas.clan.name }}
              <span v-if="account.datas.clanrole?.name"> · {{ account.datas.clanrole.name }}</span>
            </div>
          </div>
        </div>

        <!-- right: actions -->
        <div v-if="profileTab === 'settings'" class="d-flex flex-wrap justify-end" style="gap: 8px">
          <v-btn
            v-if="props.id === String(accountStore.id)"
            variant="tonal"
            prepend-icon="mdi-camera-outline"
            @click="openAvatarDialog"
          >
            아바타 변경
          </v-btn>
          <v-btn
            v-if="props.id === String(accountStore.id)"
            variant="tonal"
            prepend-icon="mdi-account-edit"
            @click="openNicknameDialog"
          >
            닉네임 변경
          </v-btn>

          <v-btn
            v-if="can('ACCOUNT', 'SYS-SET-ACC-U')"
            color="primary"
            variant="flat"
            prepend-icon="mdi-shield-account"
            @click="dialog = true"
          >
            권한/승인
          </v-btn>
        </div>
        <v-btn
          v-if="props.profileOnly && canManageClanRole"
          color="primary"
          variant="tonal"
          prepend-icon="mdi-shield-account-outline"
          @click="openClanRoleDialog"
        >
          클랜 권한 변경
        </v-btn>
      </div>
    </v-card>

    <v-card class="profile-tabs mt-4" rounded="xl" elevation="0">
      <v-tabs v-model="profileTab" color="primary" grow show-arrows>
        <v-tab value="game" prepend-icon="mdi-gamepad-variant-outline">게임 프로필</v-tab>
        <v-tab value="awards" prepend-icon="mdi-trophy-outline">우승 기록</v-tab>
        <v-tab value="activity" prepend-icon="mdi-history">활동 기록</v-tab>
        <v-tab v-if="!props.profileOnly" value="settings" prepend-icon="mdi-cog-outline">계정 설정</v-tab>
      </v-tabs>
    </v-card>

    <!-- ====== BODY GRID ====== -->
    <v-row class="mt-4" dense>
      <!-- ACCOUNT INFO -->
      <v-col v-if="profileTab === 'settings'" cols="12">
        <v-card class="pa-5" rounded="xl" elevation="2">
          <div class="d-flex align-center justify-space-between mb-3">
            <div class="text-subtitle-1 font-weight-bold">계정 정보</div>
            <v-icon color="grey-lighten-1">mdi-account</v-icon>
          </div>

          <v-divider class="mb-3" />

          <v-list density="compact" class="text-body-2">
            <v-list-item>
              <template #prepend><v-icon>mdi-account-circle</v-icon></template>
              <v-list-item-title class="font-weight-medium">Username</v-list-item-title>
              <v-list-item-subtitle>{{ account.datas.nickname || '-' }}</v-list-item-subtitle>
            </v-list-item>

            <v-list-item>
              <template #prepend><v-icon>mdi-email</v-icon></template>
              <v-list-item-title class="font-weight-medium">Email</v-list-item-title>
              <v-list-item-subtitle>{{ account.datas.email || '-' }}</v-list-item-subtitle>
            </v-list-item>

            <v-list-item>
              <template #prepend><v-icon>mdi-domain</v-icon></template>
              <v-list-item-title class="font-weight-medium">Department</v-list-item-title>
              <v-list-item-subtitle>{{ account.datas.department || '-' }}</v-list-item-subtitle>
            </v-list-item>

            <v-list-item>
              <template #prepend><v-icon>mdi-shield</v-icon></template>
              <v-list-item-title class="font-weight-medium">Role</v-list-item-title>
              <v-list-item-subtitle>{{ selectedSystemRole?.name || '-' }}</v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>

      <!-- PLAYER INFO -->
      <v-col v-if="profileTab === 'game'" cols="12">
        <v-card class="pa-5" rounded="xl" elevation="2">
          <div class="d-flex flex-wrap align-center justify-space-between mb-3" style="gap: 8px">
            <div class="d-flex align-center" style="gap: 8px">
              <div class="text-subtitle-1 font-weight-bold">플레이어</div>
              <v-chip v-if="player" size="small" variant="tonal">
                {{ player.nickname }}<span v-if="player.tagname">#{{ player.tagname }}</span>
              </v-chip>
            </div>

            <div class="d-flex flex-wrap justify-end" style="gap: 8px">
              <AccountPlayerMemberDialog
                v-if="props.id === String(accountStore.id)"
                v-model="playerDialog"
                @added="handleAdd"
              />

              <v-btn
                v-if="player && props.id === String(accountStore.id)"
                variant="tonal"
                prepend-icon="mdi-map-marker"
                @click="openPositionDialog"
              >
                희망 포지션 선택
              </v-btn>
            </div>
          </div>

          <v-divider class="mb-3" />

          <div v-if="!player">
            <v-alert type="info" variant="tonal" density="compact">
              아직 등록된 플레이어 정보가 없습니다.
            </v-alert>
          </div>

          <template v-else>
            <div class="d-flex align-center mb-4" style="gap: 12px">
              <v-avatar size="44" color="deep-purple-darken-2">
                <span class="text-subtitle-2 text-white">
                  {{ getInitials(player.nickname || account.datas.name) }}
                </span>
              </v-avatar>

              <div>
                <div class="text-body-1 font-weight-medium">
                  {{ player.nickname }}<span v-if="player.tagname">#{{ player.tagname }}</span>
                </div>
                <div class="text-caption text-medium-emphasis">
                  {{ player_comment }}
                </div>
              </div>
            </div>

            <v-row dense>
              <v-col cols="12" sm="6">
                <v-card variant="tonal" class="pa-4" rounded="lg">
                  <div class="text-caption text-medium-emphasis">티어</div>
                  <div class="text-body-1 font-weight-bold">
                    {{ player.tier?.name || '-' }}
                  </div>
                  <div class="text-caption">Point: {{ player.tier?.point ?? '-' }}</div>
                </v-card>
              </v-col>

              <v-col cols="12" sm="6">
                <v-card variant="tonal" class="pa-4" rounded="lg">
                  <div class="text-caption text-medium-emphasis">커스텀 티어</div>
                  <div class="text-body-1 font-weight-bold">
                    {{ player.custom_tier?.name || '-' }}
                  </div>
                  <div class="text-caption">클랜 내 평가 기준</div>
                </v-card>
              </v-col>

              <v-col cols="12" sm="6">
                <v-card variant="tonal" class="pa-4" rounded="lg">
                  <div class="text-caption text-medium-emphasis">클랜 티어</div>
                  <div class="text-body-1 font-weight-bold">
                    {{ player.clan_tier?.name || '-' }}
                  </div>
                  <div class="text-caption">Point: {{ player.clan_tier?.point ?? '-' }}</div>
                </v-card>
              </v-col>

              <v-col cols="12" sm="6">
                <v-card variant="tonal" class="pa-4" rounded="lg">
                  <div class="text-caption text-medium-emphasis">내부 점수</div>
                  <div class="text-body-1 font-weight-bold">
                    {{ player.point ?? '-' }}
                  </div>
                  <div class="text-caption">최근 평가 기준</div>
                </v-card>
              </v-col>

              <v-col cols="12">
                <v-card variant="tonal" class="pa-4" rounded="lg">
                  <div class="d-flex flex-wrap" style="gap: 8px">
                    <v-chip
                      v-for="position in player.positions ?? []"
                      :key="position.id ?? position.name"
                      size="small"
                      variant="tonal"
                      prepend-icon="mdi-sword-cross"
                    >
                      {{ position.name }}
                    </v-chip>
                    <span v-if="!(player.positions ?? []).length" class="text-body-2 text-medium-emphasis">
                      선택한 희망 포지션이 없습니다.
                    </span>
                  </div>
                </v-card>
              </v-col>
            </v-row>
          </template>
        </v-card>
      </v-col>
    </v-row>

    <v-row v-if="profileTab === 'awards'" class="mt-4" dense>
      <v-col cols="12" md="6">
        <v-card class="award-card award-card--main pa-6" rounded="xl" elevation="2">
          <v-icon size="42" color="amber">mdi-trophy</v-icon>
          <div><div class="text-caption text-medium-emphasis">난전 우승</div><strong>{{ player?.cup_count ?? 0 }}회</strong></div>
        </v-card>
      </v-col>
      <v-col cols="12" md="6">
        <v-card class="award-card award-card--auction pa-6" rounded="xl" elevation="2">
          <v-icon size="42" color="deep-purple-lighten-2">mdi-gavel</v-icon>
          <div><div class="text-caption text-medium-emphasis">경매내전 우승</div><strong>{{ player?.sub_cup_count ?? 0 }}회</strong></div>
        </v-card>
      </v-col>
      <v-col cols="12">
        <v-alert v-if="!player" type="info" variant="tonal">롤 계정을 연결하면 우승 기록을 확인할 수 있습니다.</v-alert>
      </v-col>
    </v-row>

    <v-row v-if="profileTab === 'activity'" class="mt-4" dense>
      <v-col cols="12">
        <v-card class="pa-5" rounded="xl" elevation="2">
          <div class="d-flex align-center justify-space-between mb-4">
            <div><div class="text-subtitle-1 font-weight-bold">파티 활동</div><div class="text-caption text-medium-emphasis">종료된 파티 참여 기록입니다.</div></div>
            <v-progress-circular v-if="activityLoading" indeterminate size="22" color="primary" />
          </div>
          <div v-if="partyActivity" class="activity-stats mb-4">
            <div><strong>{{ partyActivity.stats.total }}</strong><span>전체</span></div>
            <div><strong>{{ partyActivity.stats.duo_rank }}</strong><span>듀오랭크</span></div>
            <div><strong>{{ partyActivity.stats.flex_rank }}</strong><span>자유랭크</span></div>
            <div><strong>{{ partyActivity.stats.normal }}</strong><span>일반게임</span></div>
            <div><strong>{{ partyActivity.stats.inhouse }}</strong><span>내전</span></div>
          </div>
          <v-list v-if="partyActivity?.rooms.length" lines="two">
            <v-list-item v-for="room in partyActivity.rooms" :key="room.id" prepend-icon="mdi-account-group-outline">
              <v-list-item-title>{{ room.title }}</v-list-item-title>
              <v-list-item-subtitle>{{ partyTypeLabel(room.type) }} · {{ formatDate(room.closed_at) }}</v-list-item-subtitle>
            </v-list-item>
          </v-list>
          <v-alert v-else-if="!activityLoading" type="info" variant="tonal">아직 종료된 파티 활동 기록이 없습니다.</v-alert>
        </v-card>
      </v-col>
      <v-col cols="12">
        <v-card class="pa-5" rounded="xl" elevation="2">
          <div class="text-subtitle-1 font-weight-bold mb-1">경매내전 활동</div>
          <div class="text-caption text-medium-emphasis mb-4">참가했던 경매내전 기록입니다.</div>
          <v-list v-if="auctionActivity.length" lines="two">
            <v-list-item v-for="auction in auctionActivity" :key="auction.id" prepend-icon="mdi-gavel">
              <v-list-item-title>{{ auction.title }}</v-list-item-title>
              <v-list-item-subtitle>
                {{ auctionStatusLabel(auction.status) }} · {{ formatDate(auction.scheduledAt) }}
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>
          <v-alert v-else-if="!activityLoading" type="info" variant="tonal">경매내전 참가 기록이 없습니다.</v-alert>
        </v-card>
      </v-col>
    </v-row>

    <!-- ====== DIALOGS ====== -->

    <v-dialog v-model="clanRoleDialog" max-width="440">
      <v-card rounded="xl">
        <v-card-title class="pa-6 pb-2 text-h6">클랜 권한 변경</v-card-title>
        <v-card-text class="pa-6 pt-3">
          <div class="text-body-2 text-medium-emphasis mb-4">
            {{ account.datas.nickname }} 멤버에게 적용할 클랜 권한을 선택하세요.
          </div>
          <v-autocomplete
            v-model="selectedClanRole"
            :items="clanRoleList"
            item-title="name"
            item-value="id"
            label="클랜 권한"
            variant="outlined"
            return-object
          />
        </v-card-text>
        <v-card-actions class="pa-6 pt-0 justify-end">
          <v-btn variant="text" :disabled="clanRoleSaving" @click="clanRoleDialog = false">취소</v-btn>
          <v-btn color="primary" :loading="clanRoleSaving" :disabled="!selectedClanRole" @click="submitClanRole">저장</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 역할 변경 다이얼로그 -->
    <v-dialog v-model="dialog" max-width="480">
      <v-card rounded="xl">
        <v-card-title class="text-h6">계정 설정</v-card-title>
        <v-card-text>
          <v-text-field v-model="account.datas.name" label="Name" readonly />
          <v-text-field v-model="account.datas.email" label="Email" readonly />
          <v-text-field v-model="account.datas.department" label="Department" readonly />

          <v-autocomplete
            v-model="selectedSystemRole"
            :items="systemRoleList"
            item-title="name"
            item-value="id"
            label="System Role"
            return-object
            class="mt-2"
          />

          <v-switch
            v-model="accountIsConfirm"
            label="플레이어 로그인 승인"
            color="success"
            inset
            hide-details
            class="mt-4"
          />
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn variant="text" @click="dialog = false">취소</v-btn>
          <v-btn color="primary" @click="submitEdit">저장</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 닉네임 변경 다이얼로그 -->
    <v-dialog v-model="avatarDialog" max-width="460">
      <v-card rounded="xl">
        <v-card-title class="text-h6">아바타 이미지 변경</v-card-title>
        <v-card-text>
          <div class="d-flex justify-center mb-4">
            <v-avatar size="96" color="blue-darken-2">
              <v-img v-if="avatarPreview" :src="avatarPreview" cover />
              <span v-else class="text-h6 font-weight-bold text-white">
                {{ getInitials(account.datas.nickname) }}
              </span>
            </v-avatar>
          </div>
          <v-file-input
            v-model="avatarFile"
            label="아바타 이미지"
            accept="image/jpeg,image/png,image/webp"
            prepend-icon="mdi-camera"
            variant="outlined"
            show-size
            hint="JPG, PNG, WebP · 최대 5MB"
            persistent-hint
            @update:model-value="onAvatarSelected"
          />
          <v-alert v-if="avatarError" type="error" variant="tonal" density="compact" class="mt-3">
            {{ avatarError }}
          </v-alert>
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn variant="text" :disabled="avatarSubmitting" @click="avatarDialog = false">취소</v-btn>
          <v-btn color="primary" :loading="avatarSubmitting" @click="submitAvatar">저장</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 닉네임 변경 다이얼로그 -->
    <v-dialog v-model="nicknameDialog" max-width="420">
      <v-card rounded="xl">
        <v-card-title class="text-h6">닉네임 수정</v-card-title>

        <v-card-text>
          <v-alert
            v-if="nicknameGate.checked"
            :type="nicknameGate.allowed ? 'info' : 'warning'"
            variant="tonal"
            density="compact"
            class="mb-3"
          >
            {{ nicknameGate.message }}
          </v-alert>

          <v-text-field
            v-model="editNickname"
            label="새 닉네임"
            maxlength="20"
            counter="20"
            autocomplete="off"
            :disabled="nicknameGate.checked && !nicknameGate.allowed"
          />
        </v-card-text>

        <v-card-actions class="justify-end">
          <v-btn variant="text" @click="nicknameDialog = false">취소</v-btn>
          <v-btn
            color="primary"
            :disabled="!canSubmitNickname"
            :loading="nicknameGate.loading"
            @click="submitNickname"
          >
            저장
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 포지션 수정 다이얼로그 -->
    <v-dialog v-model="positionDialog" max-width="520">
      <v-card rounded="xl">
        <v-card-title class="text-h6">포지션 수정</v-card-title>

        <v-card-text>
          <v-autocomplete
            v-model="selectedPositions"
            :items="positions"
            item-title="name"
            item-value="name"
            variant="outlined"
            density="comfortable"
            label="Position"
            clearable
            multiple
            return-object
            :menu-props="{ maxHeight: 320 }"
          >
            <template #selection="{ item, index }">
              <v-chip
                color="primary"
                class="mr-1"
                closable
                @click:close="selectedPositions.splice(index, 1)"
              >
                {{ item.raw.name }}
              </v-chip>
            </template>
          </v-autocomplete>

          <div class="text-caption text-medium-emphasis mt-2">
            여러 개 선택 가능 / 칩에서 X로 제거 가능
          </div>
        </v-card-text>

        <v-card-actions class="justify-end">
          <v-btn variant="text" @click="positionDialog = false">취소</v-btn>
          <v-btn color="primary" :loading="positionLoading" @click="submitPosition"> 저장 </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import api from '@/@core/composable/useAxios';
import { getBaseUrl } from '@/@core/composable/createUrl';
import { can } from '@/stores/usePermissionStore';
import { can as canClan } from '@/stores/useClanPermissionStore';
import type { SystemRole } from '@/data/types/systemrole';
import type { Player } from '@/data/types/player';
import { useAccountStore } from '@/stores/useAccountStore';
import AccountPlayerMemberDialog from '@/components/dialogs/AccountPlayerMemberDialog.vue';
import type { Position } from '@/data/types/position';
import type { ClanRole } from '@/data/types/clanrole';

const props = withDefaults(defineProps<{ id: string; profileOnly?: boolean }>(), {
  profileOnly: false,
});

const router = useRouter();
const route = useRoute();
const accountStore = useAccountStore();
const profileTab = ref<'game' | 'awards' | 'activity' | 'settings'>('game');
const activityLoading = ref(false);
const clanRoleDialog = ref(false);
const clanRoleSaving = ref(false);
const selectedClanRole = ref<ClanRole | null>(null);
const clanRoleList = ref<ClanRole[]>([]);

interface PartyActivity {
  stats: { total: number; duo_rank: number; normal: number; flex_rank: number; inhouse: number };
  rooms: Array<{ id: number; type: string; title: string; closed_at: string }>;
}
interface AuctionActivity {
  id: number;
  title: string;
  status: string;
  scheduledAt: string;
  participants: Array<{ accountId: number }>;
}
const partyActivity = ref<PartyActivity | null>(null);
const auctionActivity = ref<AuctionActivity[]>([]);

const dialog = ref(false);
const nicknameDialog = ref(false);
const avatarDialog = ref(false);
const avatarSubmitting = ref(false);
const avatarFile = ref<File | null>(null);
const avatarPreview = ref('');
const avatarError = ref('');
const positionDialog = ref(false);
const positionLoading = ref(false);

const selectedSystemRole = ref<SystemRole | null>(null);
const systemRoleList = ref<SystemRole[]>([]);
const accountIsConfirm = ref<boolean>(false);

const positions = ref<Position[]>([]);
const selectedPositions = ref<Position[]>([]);

const playerDialog = ref(false); // 기존에 있던 것 그대로 사용한다고 가정

const account = ref<{
  datas: {
    name: string;
    nickname: string;
    email: string;
    department: string;
    avatar: string;
    systemrole: SystemRole | null;
    is_confirm: boolean;
    player?: Player | null;
    clan?: { id: number; name: string } | null;
    clanrole?: { id: number; name?: string } | null;
  };
}>({
  datas: {
    name: '',
    nickname: '',
    email: '',
    department: '',
    avatar: '',
    systemrole: null,
    is_confirm: false,
    player: null,
    clan: null,
    clanrole: null,
  },
});

const editNickname = ref('');
const nicknameGate = ref({
  loading: false,
  checked: false,
  allowed: true,
  message: '',
});

const clone = (v: any) => JSON.parse(JSON.stringify(v));

const player = computed<Player | null>(() => account.value.datas.player ?? null);
const canManageClanRole = computed(
  () => accountStore.isClanMaster || canClan('ACCOUNT', 'CLAN-SET-ACC-U'),
);

const player_comment = computed(() => {
  if (!player.value) return '';
  const tier = player.value.tier?.name;
  const positionNames = (player.value.positions ?? []).map((position) => position.name).join(' · ');
  if (tier && positionNames) return `${tier} · ${positionNames}`;
  if (tier) return `${tier} 플레이어`;
  if (positionNames) return `${positionNames} 포지션`;
  return '';
});

function formatDate(value: string) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium' }).format(new Date(value));
}

function partyTypeLabel(type: string) {
  return ({ DUO_RANK: '듀오랭크', NORMAL: '일반게임', FLEX_RANK: '자유랭크', INHOUSE: '내전' } as Record<string, string>)[type] ?? type;
}

function auctionStatusLabel(status: string) {
  return ({ RECRUITING: '모집 중', READY: '준비', IN_PROGRESS: '진행 중', FINISHED: '종료' } as Record<string, string>)[status] ?? status;
}

async function openClanRoleDialog() {
  selectedClanRole.value = account.value.datas.clanrole
    ? { ...account.value.datas.clanrole }
    : null;
  clanRoleDialog.value = true;
  if (clanRoleList.value.length) return;
  try {
    const response = await api.get(`${getBaseUrl('DATA')}/clanrole/all`);
    clanRoleList.value = response.data?.datas ?? [];
  } catch (error) {
    console.error('클랜 권한 목록 불러오기 실패:', error);
  }
}

async function submitClanRole() {
  if (!selectedClanRole.value?.id) return;
  try {
    clanRoleSaving.value = true;
    await api.post(`${getBaseUrl('DATA')}/account/edit_clanrole`, {
      id: Number(props.id),
      clanrole_id: selectedClanRole.value.id,
    });
    account.value.datas.clanrole = { ...selectedClanRole.value };
    clanRoleDialog.value = false;
  } catch (error) {
    console.error('클랜 권한 변경 실패:', error);
  } finally {
    clanRoleSaving.value = false;
  }
}

async function fetchActivity() {
  const clan = account.value.datas.clan;
  if (!clan) return;
  activityLoading.value = true;
  try {
    const keyword = account.value.datas.player?.nickname || account.value.datas.nickname;
    const [partyResult, auctionResult] = await Promise.allSettled([
      api.get(`${getBaseUrl('DATA')}/party-room/history/search`, {
        params: { clan_id: clan.id, keyword },
      }),
      api.get(`${getBaseUrl('DATA')}/auction/list`, {
        params: { clan_name: clan.name },
      }),
    ]);

    if (partyResult.status === 'fulfilled') {
      const results = partyResult.value.data?.datas ?? [];
      partyActivity.value = results.find((item: any) => item.account?.id === Number(props.id)) ?? null;
    }
    if (auctionResult.status === 'fulfilled') {
      auctionActivity.value = (auctionResult.value.data?.datas ?? []).filter((auction: AuctionActivity) =>
        auction.participants?.some((participant) => participant.accountId === Number(props.id)),
      );
    }
  } finally {
    activityLoading.value = false;
  }
}

function getInitials(name?: string) {
  if (!name) return '?';
  return name
    .trim()
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function avatarUrl(value: string) {
  return /^https?:\/\//i.test(value)
    ? value
    : `${getBaseUrl('DATA').replace(/\/$/, '')}${value}`;
}

async function fetchPositions() {
  try {
    const res = await api.get(`${getBaseUrl('DATA')}/position/all`);
    positions.value = res.data.datas ?? [];
  } catch (e) {
    console.error('포지션 목록 불러오기 실패:', e);
  }
}

async function fetchAccount() {
  try {
    const res = await api.get(`${getBaseUrl('DATA')}/account/find?id=${props.id}`);
    account.value = res.data;

    selectedSystemRole.value = account.value.datas.systemrole || null;
    accountIsConfirm.value = account.value.datas.is_confirm;

    // ✅ 선택된 포지션 미리 세팅
    selectedPositions.value = clone(account.value.datas.player?.positions ?? []);

    if (!props.profileOnly || can('ACCOUNT', 'SYS-SET-ACC-U')) {
      const roleRes = await api.get(`${getBaseUrl('DATA')}/systemrole/all`);
      systemRoleList.value = roleRes.data.datas;
    }
    await fetchActivity();
  } catch (error) {
    console.error('계정 정보 불러오기 실패:', error);
  }
}

const canSubmitNickname = computed(() => {
  if (!editNickname.value.trim()) return false;
  if (nicknameGate.value.loading) return false;
  if (nicknameGate.value.checked && !nicknameGate.value.allowed) return false;
  return true;
});

async function openNicknameDialog() {
  editNickname.value = account.value.datas.nickname || '';
  nicknameDialog.value = true;

  nicknameGate.value.loading = true;
  nicknameGate.value.checked = false;
  nicknameGate.value.allowed = true;
  nicknameGate.value.message = '';

  try {
    const res = await api.get(`${getBaseUrl('DATA')}/account/can_nickname`, {
      params: { id: props.id },
    });

    const allowed = !!res.data?.datas;
    nicknameGate.value.allowed = allowed;
    nicknameGate.value.checked = true;

    nicknameGate.value.message = allowed
      ? '닉네임을 변경할 수 있어요.'
      : '닉네임은 30일에 한 번만 변경할 수 있어요. 다음 변경 가능 날짜를 기다려주세요.';
  } catch (e) {
    nicknameGate.value.allowed = false;
    nicknameGate.value.checked = true;
    nicknameGate.value.message =
      '닉네임 변경 가능 여부를 확인하지 못했어요. 잠시 후 다시 시도해줘.';
  } finally {
    nicknameGate.value.loading = false;
  }
}

function openAvatarDialog() {
  avatarFile.value = null;
  avatarError.value = '';
  avatarPreview.value = account.value.datas.avatar
    ? avatarUrl(account.value.datas.avatar)
    : '';
  avatarDialog.value = true;
}

function onAvatarSelected(value: File | File[] | null) {
  const file = Array.isArray(value) ? value[0] : value;
  avatarFile.value = file ?? null;
  if (avatarPreview.value.startsWith('blob:')) URL.revokeObjectURL(avatarPreview.value);
  avatarPreview.value = file ? URL.createObjectURL(file) : '';
}

async function submitAvatar() {
  if (avatarSubmitting.value) return;
  avatarSubmitting.value = true;
  avatarError.value = '';
  try {
    const file = avatarFile.value;
    if (!file) {
      avatarError.value = '업로드할 이미지 파일을 선택해 주세요.';
      return;
    }
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await api.post(`${getBaseUrl('DATA')}/account/avatar`, formData);
    const avatar = String(response.data?.datas?.avatar ?? '');
    if (!avatar) throw new Error('아바타 경로를 받지 못했습니다.');
    account.value.datas.avatar = avatar;
    if (Number(props.id) === accountStore.id) accountStore.avatar = avatar;
    avatarDialog.value = false;
  } catch (error: any) {
    console.error('아바타 수정 실패:', error);
    avatarError.value =
      error?.response?.data?.message || error?.message || '아바타를 저장하지 못했습니다.';
  } finally {
    avatarSubmitting.value = false;
  }
}

async function submitNickname() {
  if (!canSubmitNickname.value) return;

  try {
    await api.post(`${getBaseUrl('DATA')}/account/update`, {
      id: props.id,
      nickname: editNickname.value.trim(),
    });

    account.value.datas.nickname = editNickname.value.trim();
    nicknameDialog.value = false;
  } catch (error) {
    console.error('닉네임 수정 실패:', error);
  }
}

async function submitEdit() {
  try {
    const payload = {
      id: props.id,
      systemrole_id: selectedSystemRole.value?.id,
      is_confirm: accountIsConfirm.value,
    };

    await api.post(`${getBaseUrl('DATA')}/account/update`, payload);

    account.value.datas.systemrole = selectedSystemRole.value || null;
    account.value.datas.is_confirm = accountIsConfirm.value;

    dialog.value = false;
  } catch (err) {
    console.error('계정 업데이트 실패:', err);
  }
}

async function handleAdd(param: any) {
  await fetchAccount();

  const inviteRedirect = sessionStorage.getItem('clanInviteRedirect');
  if (inviteRedirect) {
    await router.push(inviteRedirect);
  }
}

function openPositionDialog() {
  selectedPositions.value = clone(account.value.datas.player?.positions ?? []);
  positionDialog.value = true;
}

async function submitPosition() {
  try {
    positionLoading.value = true;

    await api.post(`${getBaseUrl('DATA')}/player/update_position`, {
      id: account.value.datas.player?.id,
      positions: selectedPositions.value,
    });

    if (account.value.datas.player) {
      account.value.datas.player.positions = clone(selectedPositions.value);
    }

    positionDialog.value = false;
  } catch (e) {
    console.error('포지션 수정 실패:', e);
  } finally {
    positionLoading.value = false;
  }
}

onMounted(async () => {
  await fetchPositions();

  if (props.profileOnly) {
    await fetchAccount();
    if (account.value.datas.clan?.id !== accountStore.clan?.id) {
      await router.push('/forbidden');
    }
  } else if (can('ACCOUNT', 'SYS-SET-ACC-R') == true) {
    await fetchAccount();
  } else if (accountStore.id != +route.params.id) {
    await router.push('/forbidden');
  } else {
    await fetchAccount();
  }
});
</script>

<style scoped>
.account-detail-card {
  min-height: 420px;
}
.profile-tabs {
  overflow: hidden;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  background: rgba(var(--v-theme-surface), 0.82);
}
.award-card {
  display: flex;
  min-height: 130px;
  align-items: center;
  gap: 20px;
  overflow: hidden;
}
.award-card strong {
  font-size: 30px;
}
.award-card--main {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.16), rgba(var(--v-theme-surface), 0.96));
}
.award-card--auction {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.18), rgba(var(--v-theme-surface), 0.96));
}
.activity-stats {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 8px;
}
.activity-stats > div {
  display: flex;
  padding: 14px 8px;
  border-radius: 12px;
  background: rgba(var(--v-theme-on-surface), 0.05);
  text-align: center;
  flex-direction: column;
}
.activity-stats strong {
  font-size: 20px;
}
.activity-stats span {
  color: rgba(var(--v-theme-on-surface), 0.55);
  font-size: 11px;
}
@media (max-width: 600px) {
  .activity-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
