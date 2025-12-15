<!-- MyClanPage.vue -->
<template>
  <v-layout style="min-height: calc(100vh - 64px)">
    <!-- ✅ Left Menu -->
    <v-navigation-drawer width="280" permanent class="pa-2">
      <!-- Clan summary -->
      <v-card rounded="lg" variant="outlined" class="mb-2">
        <v-card-text>
          <div class="d-flex align-center justify-space-between">
            <div>
              <div class="text-subtitle-1 font-weight-bold">
                {{ clan2.name }}
                <!-- <span class="text-medium-emphasis">[{{ clan.tag }}]</span> -->
              </div>
              <div class="text-caption text-medium-emphasis">
                멤버 {{ clan.members }}/{{ clan.capacity }} · Lv. {{ clan.level }}
              </div>
            </div>

            <v-chip size="small" label>{{ my.roleLabel }}</v-chip>
          </div>

          <div class="mt-3 d-flex gap-2">
            <v-btn
              block
              color="primary"
              variant="tonal"
              prepend-icon="mdi-share-variant"
              @click="copyInvite"
            >
              초대코드
            </v-btn>
          </div>
        </v-card-text>
      </v-card>

      <v-divider class="my-2" />

      <!-- Menu -->
      <v-list nav density="comfortable">
        <v-list-item
          :active="section === 'notice'"
          prepend-icon="mdi-bullhorn-outline"
          title="공지"
          @click="section = 'notice'"
        />

        <v-list-item
          :active="section === 'members'"
          prepend-icon="mdi-account-multiple-outline"
          title="멤버"
          @click="section = 'members'"
        />

        <v-list-item
          :active="section === 'missions'"
          prepend-icon="mdi-trophy-outline"
          title="미션"
          @click="section = 'missions'"
        />

        <v-list-item
          v-if="isManager"
          :active="section === 'settings'"
          prepend-icon="mdi-cog-outline"
          title="설정"
          @click="section = 'settings'"
        />
      </v-list>

      <v-spacer />

      <v-divider class="my-2" />

      <v-list nav density="compact">
        <v-list-item prepend-icon="mdi-exit-run" title="클랜 나가기" @click="leaveDialog = true" />
      </v-list>
    </v-navigation-drawer>

    <!-- ✅ Main Content -->
    <v-main>
      <v-container class="py-6">
        <div class="d-flex align-start justify-space-between mb-4">
          <div>
            <h2 class="text-h6 font-weight-bold mb-1">{{ headerTitle }}</h2>
            <div class="text-body-2 text-medium-emphasis">{{ headerDesc }}</div>
          </div>

          <div class="d-flex gap-2">
            <!-- 각 섹션별 액션 버튼 -->
            <v-btn
              v-if="section === 'notice' && isManager"
              color="primary"
              prepend-icon="mdi-plus"
              @click="openNoticeDialog"
            >
              공지 작성
            </v-btn>

            <v-btn
              v-if="section === 'missions'"
              variant="outlined"
              prepend-icon="mdi-refresh"
              @click="runLoadMissions"
            >
              새로고침
            </v-btn>

            <v-btn
              v-if="section === 'members' && isManager"
              variant="outlined"
              prepend-icon="mdi-account-plus-outline"
              @click="openInviteDialog"
            >
              초대
            </v-btn>
          </div>
        </div>

        <v-card rounded="xl" elevation="2">
          <v-window v-model="section">
            <!-- 공지 -->
            <v-window-item value="notice">
              <v-card-text class="py-6">
                <v-timeline density="compact" side="end" v-if="notices.length">
                  <v-timeline-item
                    v-for="n in notices"
                    :key="n.id"
                    size="small"
                    dot-color="primary"
                  >
                    <template #opposite>
                      <div class="text-caption text-medium-emphasis">
                        {{ formatDate(n.createdAt) }}
                      </div>
                    </template>

                    <v-card variant="outlined" rounded="lg">
                      <v-card-title class="text-subtitle-2 font-weight-bold">
                        {{ n.title }}
                      </v-card-title>
                      <v-card-text class="text-body-2 text-medium-emphasis">
                        {{ n.content }}
                      </v-card-text>
                      <v-card-actions class="justify-end">
                        <v-btn variant="text" @click="openNoticeDetail(n)">자세히</v-btn>
                        <v-btn
                          v-if="isManager"
                          variant="text"
                          color="error"
                          @click="deleteNotice(n.id)"
                        >
                          삭제
                        </v-btn>
                      </v-card-actions>
                    </v-card>
                  </v-timeline-item>
                </v-timeline>

                <div v-else class="text-center py-10 text-medium-emphasis">아직 공지가 없어.</div>
              </v-card-text>
            </v-window-item>

            <!-- 멤버 -->
            <v-window-item value="members">
              <v-container>
                <server-data-table
                  :headers="headers"
                  :items="serverItems"
                  :items-length="totalItems"
                  :items-per-page="itemsPerPage"
                  :loading="loading"
                  :search="search"
                  @update:options="loadItems"
                >
                  <!-- 유저 프로필/이메일 -->
                  <template #item.name="{ item }">
                    <div class="d-flex align-center">
                      <template v-if="item.avatar">
                        <v-img :src="item.avatar" />
                      </template>
                      <template v-else>
                        <span class="text-caption font-weight-bold">
                          {{ item.nickname }}
                        </span>
                      </template>

                      <!-- 이름에 링크 -->
                      <div>
                        <div class="text-caption text-grey">
                          {{ '#' + item.tagname }}
                        </div>
                      </div>
                    </div>
                  </template>

                  <template #item.tier="{ item }">
                    <div class="d-flex align-center">
                      <span :style="{ color: getTierColor(item.tier.name), fontWeight: 'bold' }">
                        {{ item.tier.name }}
                      </span>
                      <div></div>
                    </div>
                  </template>

                  <template #item.custom_tier="{ item }">
                    <div class="d-flex align-center">
                      <span
                        :style="{ color: getTierColor(item.custom_tier?.name), fontWeight: 'bold' }"
                      >
                        {{ item.custom_tier?.name }}
                      </span>
                      <div></div>
                    </div>
                  </template>

                  <template #item.clan_tier="{ item }">
                    <div class="d-flex align-center">
                      <span
                        :style="{ color: getTierColor(item.clan_tier?.name), fontWeight: 'bold' }"
                      >
                        {{ item.clan_tier?.name }}
                      </span>
                      <div></div>
                    </div>
                  </template>

                  <template #item.cup_count="{ item }">
                    <div class="d-flex align-center">
                      <font-awesome-icon
                        v-for="index in item?.cup_count"
                        :icon="['fas', 'star']"
                        class="star-full"
                      />
                    </div>
                  </template>

                  <template #item.sub_cup_count="{ item }">
                    <div class="d-flex align-center">
                      <font-awesome-icon
                        v-for="index in item?.sub_cup_count"
                        :icon="['far', 'star']"
                        class="star-full"
                      />
                    </div>
                  </template>

                  <template #item.is_active="{ item }">
                    <v-switch
                      v-model="item.is_active"
                      readonly
                      inset
                      hide-details
                      color="success"
                    />
                  </template>

                  <template #item.created_at="{ item }">
                    {{ item.created_at.slice(0, 10) }}
                  </template>

                  <template #item.positions="{ item }">
                    <div class="d-flex flex-wrap" style="gap: 6px">
                      <v-chip
                        v-for="(pos, i) in normalizePositions(item.positions)"
                        :key="i"
                        size="x-small"
                        color="primary"
                        label
                        variant="tonal"
                      >
                        {{ pos.label }}
                      </v-chip>
                    </div>
                  </template>

                  <template #item.actions="{ item }">
                    <v-menu location="bottom">
                      <template #activator="{ props }">
                        <v-btn icon variant="text" v-bind="props">
                          <v-icon>mdi-dots-vertical</v-icon>
                        </v-btn>
                      </template>

                      <v-list density="compact">
                        <!-- 수정: 기존 라우팅 유지 -->
                        <v-list-item
                          v-if="can('PLAYER', 'SYS-SET-PLAYER-U')"
                          @click="openEdit(item)"
                        >
                          <v-list-item-title>
                            <v-icon size="16" class="mr-2">mdi-pencil</v-icon> 수정
                          </v-list-item-title>
                        </v-list-item>
                      </v-list>
                    </v-menu>
                  </template>
                </server-data-table>
              </v-container>
            </v-window-item>

            <!-- 미션 -->
            <v-window-item value="missions">
              <v-card-text class="py-6">
                <v-row>
                  <v-col cols="12" md="6" v-for="ms in missions" :key="ms.id">
                    <v-card variant="outlined" rounded="lg">
                      <v-card-title class="text-subtitle-2 font-weight-bold">
                        {{ ms.title }}
                      </v-card-title>
                      <v-card-text>
                        <div class="text-body-2 text-medium-emphasis mb-3">{{ ms.desc }}</div>

                        <v-progress-linear
                          :model-value="Math.floor((ms.progress / ms.target) * 100)"
                          height="10"
                          rounded
                        />
                        <div class="mt-2 text-caption text-medium-emphasis">
                          {{ ms.progress }} / {{ ms.target }} · 보상: {{ ms.reward }}
                        </div>
                      </v-card-text>
                    </v-card>
                  </v-col>
                </v-row>

                <div v-if="!missions.length" class="text-center py-10 text-medium-emphasis">
                  진행 중인 미션이 없어.
                </div>
              </v-card-text>
            </v-window-item>

            <!-- 설정 -->
            <v-window-item v-if="isManager" value="settings">
              <v-card-text class="py-6">
                <v-row>
                  <v-col cols="12" md="7">
                    <v-card variant="outlined" rounded="lg">
                      <v-card-title class="text-subtitle-1 font-weight-bold"
                        >클랜 설정</v-card-title
                      >
                      <v-card-text>
                        <v-text-field v-model="edit.name" label="클랜명" />
                        <v-text-field v-model="edit.tag" label="태그" />
                        <v-textarea v-model="edit.desc" label="소개" rows="3" />

                        <v-select
                          v-model="edit.joinType"
                          :items="joinTypeItems"
                          label="가입 방식"
                        />
                        <v-select
                          v-model="edit.playStyle"
                          :items="playStyleItems"
                          label="플레이 성향"
                        />

                        <div class="d-flex justify-end mt-2 gap-2">
                          <v-btn variant="text" @click="resetEdit">되돌리기</v-btn>
                          <v-btn color="primary" @click="saveSettings">저장</v-btn>
                        </div>
                      </v-card-text>
                    </v-card>
                  </v-col>

                  <v-col cols="12" md="5">
                    <v-card variant="outlined" rounded="lg">
                      <v-card-title class="text-subtitle-1 font-weight-bold"
                        >승인 대기</v-card-title
                      >
                      <v-card-text>
                        <v-alert v-if="!pending.length" type="info" variant="tonal" rounded="lg">
                          승인 대기 인원이 없어.
                        </v-alert>

                        <v-list v-else>
                          <v-list-item v-for="p in pending" :key="p.id" lines="two">
                            <template #prepend><v-icon icon="mdi-account" /></template>
                            <v-list-item-title>{{ p.nickname }}</v-list-item-title>
                            <v-list-item-subtitle>{{
                              formatDate(p.appliedAt)
                            }}</v-list-item-subtitle>

                            <template #append>
                              <div class="d-flex gap-2">
                                <v-btn size="small" color="primary" @click="approve(p)">승인</v-btn>
                                <v-btn
                                  size="small"
                                  variant="outlined"
                                  color="error"
                                  @click="reject(p)"
                                >
                                  거절
                                </v-btn>
                              </div>
                            </template>
                          </v-list-item>
                        </v-list>
                      </v-card-text>
                    </v-card>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-window-item>
          </v-window>
        </v-card>
      </v-container>
    </v-main>

    <!-- Leave Dialog -->
    <v-dialog v-model="leaveDialog" max-width="460">
      <v-card rounded="xl">
        <v-card-title class="text-h6 font-weight-bold">클랜 탈퇴</v-card-title>
        <v-card-text class="text-body-2 text-medium-emphasis">
          클랜을 탈퇴 하시겠습니까?
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn variant="text" @click="leaveDialog = false">취소</v-btn>
          <v-btn color="error" @click="leaveClan">나가기</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Notice Write Dialog -->
    <v-dialog v-model="noticeDialog" max-width="560">
      <v-card rounded="xl">
        <v-card-title class="text-h6 font-weight-bold">공지 작성</v-card-title>
        <v-card-text>
          <v-text-field v-model="noticeForm.title" label="제목" />
          <v-textarea v-model="noticeForm.content" label="내용" rows="5" />
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn variant="text" @click="noticeDialog = false">취소</v-btn>
          <v-btn color="primary" @click="createNotice">등록</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snack.show" :timeout="2200">{{ snack.msg }}</v-snackbar>
  </v-layout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/@core/composable/useAxios';
import { getBaseUrl } from '@/@core/composable/createUrl';
import { useAccountStore } from '@/stores/useAccountStore';
import type { Clan } from '@/data/types/clan';
import type { VDataTableServer } from 'vuetify/components';
import ServerDataTable from '@/components/common/ServerDataTable.vue';
import type { Player } from '@/data/types/player';
import type { Tier } from '@/data/types/tier';

const itemsPerPage = ref<number>(10);

const search = ref<string>('');
const serverItems = ref<Player[]>([]);
const loading = ref<boolean>(true);
const totalItems = ref<number>(0);

const headers: VDataTableServer['headers'] = [
  { title: 'NAME', key: 'name', sortable: false },
  { title: 'TIER', key: 'tier', sortable: false },
  { title: 'CUSTOM_TIER', key: 'custom_tier', sortable: false },
  { title: 'CLAN_TIER', key: 'clan_tier', sortable: false },
  { title: 'MAIN_CUP', key: 'cup_count', sortable: false },
  { title: 'SUB_CUP', key: 'sub_cup_count', sortable: true },
  { title: 'POINT', key: 'point', sortable: true },
  { title: 'Position', key: 'positions', sortable: false, width: 240 }, // ⬅️ 추가
  { title: 'ACTIVE', key: 'is_active', sortable: false },
  { title: 'Created', key: 'created_at', sortable: true },
  { title: 'ACTIONS', key: 'actions', sortable: false, align: 'center', width: '1px' },
] as const;

interface FetchParams {
  keyword: string;
  page: number;
  itemsPerPage: number;
  sortBy: { key: keyof Account; order: 'asc' | 'desc' }[];
}

const tierList = ref<Tier[]>([]);
const selectedTier = ref<Tier>();
const selectedCustomTier = ref<Tier>();

const positions = ref<Position[]>([]);
const selectedPositions = ref<Position[] | null>([]);

const account = useAccountStore();
const router = useRouter();
const section = ref<'notice' | 'members' | 'missions' | 'settings'>('notice');
const clan2 = ref<Clan>({ name: '', description: '', id: 0 });

const clan = ref({
  id: 1,
  name: 'My Clan',
  tag: 'MC01',
  desc: '저녁 위주로 캐주얼하게 플레이하는 클랜',
  joinType: 'approval' as 'approval' | 'open',
  playStyle: 'casual' as 'casual' | 'rank',
  level: 7,
  members: 32,
  capacity: 100,
  inviteCode: 'ABCD-1234',
});

const my = ref({
  role: 'owner' as 'owner' | 'admin' | 'member',
  roleLabel: '오너',
});

const isManager = computed(() => my.value.role === 'owner' || my.value.role === 'admin');

async function fetch() {
  try {
    const response = await api.get(`${getBaseUrl('DATA')}/tier/all`);

    tierList.value = response.data.datas;
    const position_codedict = await api.get(`${getBaseUrl('DATA')}/position/all`);

    positions.value = position_codedict.data.datas;
  } catch (error) {
    console.error('매치 정보 불러오기 실패:', error);
  }
}

/** header */
const headerTitle = computed(() => {
  switch (section.value) {
    case 'notice':
      return '공지';
    case 'members':
      return '멤버';
    case 'missions':
      return '미션';
    case 'settings':
      return '설정';
  }
});
const headerDesc = computed(() => {
  switch (section.value) {
    case 'notice':
      return '클랜 공지와 규칙을 확인해.';
    case 'members':
      return '클랜 멤버 목록과 역할을 관리해.';
    case 'missions':
      return '이번 주 미션 진행 상황이야.';
    case 'settings':
      return '클랜 설정과 승인 대기를 처리해.';
  }
});

/** Notice */
type Notice = { id: number; title: string; content: string; createdAt: string };
const notices = ref<Notice[]>([]);
const noticeDialog = ref(false);
const noticeForm = ref({ title: '', content: '' });

/** Members */
type Member = {
  id: number;
  nickname: string;
  roleLabel: string;
  weeklyContribution: number;
  lastActiveAt: string;
  avatarUrl?: string;
  isMe?: boolean;
};
const members = ref<Member[]>([]);

/** Missions */
type Mission = {
  id: number;
  title: string;
  desc: string;
  progress: number;
  target: number;
  reward: string;
};
const missions = ref<Mission[]>([]);

/** Settings */
const edit = ref({
  name: '',
  tag: '',
  desc: '',
  joinType: 'approval' as 'approval' | 'open',
  playStyle: 'casual' as 'casual' | 'rank',
});
const joinTypeItems = [
  { title: '승인제', value: 'approval' },
  { title: '자유가입', value: 'open' },
];
const playStyleItems = [
  { title: '캐주얼', value: 'casual' },
  { title: '랭크', value: 'rank' },
];
type Pending = { id: number; nickname: string; appliedAt: string };
const pending = ref<Pending[]>([]);

/** UI */
const leaveDialog = ref(false);
const snack = ref({ show: false, msg: '' });
function toast(msg: string) {
  snack.value.msg = msg;
  snack.value.show = true;
}

/** load */
onMounted(async () => {
  fetch();
  const res = await api.post(`${getBaseUrl('DATA')}/clan/list`, {
    id: account.id,
    clan_id: null,
  });

  clan2.value = res.data.datas[0];

  notices.value = [
    {
      id: 1,
      title: '이번주 스쿼드 모집',
      content: '금/토 9시~11시. 디코 필수!',
      createdAt: new Date().toISOString(),
    },
    {
      id: 2,
      title: '클랜 규칙',
      content: '욕설 금지, 팀킬 금지, 기본 매너.',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
  ];

  members.value = [
    {
      id: 10,
      nickname: 'me',
      roleLabel: '오너',
      weeklyContribution: 18,
      lastActiveAt: new Date().toISOString(),
      isMe: true,
    },
    {
      id: 11,
      nickname: 'alpha',
      roleLabel: '관리자',
      weeklyContribution: 12,
      lastActiveAt: new Date(Date.now() - 3600_000).toISOString(),
    },
    {
      id: 12,
      nickname: 'bravo',
      roleLabel: '멤버',
      weeklyContribution: 7,
      lastActiveAt: new Date(Date.now() - 7200_000).toISOString(),
    },
  ];

  missions.value = [
    {
      id: 1,
      title: 'TOP10 5회',
      desc: '클랜원과 함께 TOP10 달성',
      progress: 2,
      target: 5,
      reward: 'BP 3,000',
    },
    {
      id: 2,
      title: '처치 30회',
      desc: '클랜 누적 처치',
      progress: 14,
      target: 30,
      reward: 'BP 5,000',
    },
  ];

  pending.value = [
    { id: 21, nickname: 'newbie1', appliedAt: new Date(Date.now() - 2 * 3600_000).toISOString() },
  ];

  resetEdit();
});

/** Actions */
function copyInvite() {
  const text = clan.value.inviteCode;
  if (navigator?.clipboard?.writeText) {
    navigator.clipboard.writeText(text);
    toast('초대 코드를 복사했어.');
  } else {
    toast(`초대 코드: ${text}`);
  }
}

function openNoticeDialog() {
  noticeForm.value = { title: '', content: '' };
  noticeDialog.value = true;
}
function createNotice() {
  const id = Math.max(0, ...notices.value.map((n) => n.id)) + 1;
  notices.value.unshift({ id, ...noticeForm.value, createdAt: new Date().toISOString() });
  noticeDialog.value = false;
  toast('공지를 등록했어(샘플).');
}
function openNoticeDetail(n: Notice) {
  toast(`공지 열기: ${n.title}`);
}
function deleteNotice(id: number) {
  notices.value = notices.value.filter((n) => n.id !== id);
  toast('공지를 삭제했어(샘플).');
}

function openInviteDialog() {
  toast('초대 다이얼로그는 붙이면 돼(샘플).');
}
function promoteMember(m: Member) {
  toast(`권한 변경: ${m.nickname} (샘플)`);
}
function kickMember(m: Member) {
  members.value = members.value.filter((x) => x.id !== m.id);
  toast(`추방: ${m.nickname} (샘플)`);
}

function runLoadMissions() {
  toast('미션을 새로고침했어(샘플).');
}

function resetEdit() {
  edit.value = {
    name: clan.value.name,
    tag: clan.value.tag,
    desc: clan.value.desc,
    joinType: clan.value.joinType,
    playStyle: clan.value.playStyle,
  };
}
function saveSettings() {
  clan.value = { ...clan.value, ...edit.value };
  toast('설정을 저장했어(샘플).');
}
function approve(p: Pending) {
  pending.value = pending.value.filter((x) => x.id !== p.id);
  toast(`승인: ${p.nickname} (샘플)`);
}
function reject(p: Pending) {
  pending.value = pending.value.filter((x) => x.id !== p.id);
  toast(`거절: ${p.nickname} (샘플)`);
}

async function leaveClan() {
  await api.post(`${getBaseUrl('DATA')}/account/update`, {
    id: account.id,
    clan_id: null,
  });

  leaveDialog.value = false;
  toast('클랜 탈퇴');
  router.replace('/clan');
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString('ko-KR');
  } catch {
    return iso;
  }
}
</script>

<style scoped>
.gap-2 {
  gap: 8px;
}
</style>
