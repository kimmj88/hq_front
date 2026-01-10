<template>
  <v-container class="py-6" style="max-width: 980px">
    <v-card class="pa-5" rounded="xl" elevation="2">
      <div class="d-flex align-center justify-space-between mb-4">
        <div>
          <div class="text-h6 font-weight-bold">
            {{ isCreate ? '클랜전 생성' : '클랜전 수락 (Step 2 입력 전 단계)' }}
          </div>
          <div class="text-caption text-medium-emphasis">
            {{
              isCreate
                ? '티어 · 시간 · 우리 클랜 라인업(5인)만 먼저 등록'
                : '상대 클랜(Host) 정보 확인 후, 우리 라인업을 입력하고 수락하세요'
            }}
          </div>
        </div>

        <div class="d-flex align-center" style="gap: 8px">
          <!-- <v-chip color="primary" variant="flat">{{ myClanName }}</v-chip>
          <v-chip :color="modeChip.color" variant="flat">{{ modeChip.label }}</v-chip> -->
        </div>
      </div>

      <v-divider class="mb-4" />

      <!-- 티어 / 시간 (Create에서는 입력, Detail에서는 readonly) -->
      <v-row dense class="mb-2">
        <v-col cols="12" md="6">
          <v-select
            v-model="form.tier"
            :items="tierOptions"
            item-title="title"
            item-value="value"
            label="티어 선택"
            variant="outlined"
            density="comfortable"
            prepend-inner-icon="mdi-trophy"
            :disabled="!isCreate"
          />
          <div class="text-caption text-medium-emphasis mt-1">
            {{ selectedTierDesc || '티어를 선택하세요.' }}
          </div>
        </v-col>

        <v-col cols="12" md="6">
          <v-text-field
            v-model="form.matchAt"
            type="datetime-local"
            label="매치 시간"
            variant="outlined"
            density="comfortable"
            prepend-inner-icon="mdi-calendar-clock"
            :disabled="!isCreate"
          />
          <div class="text-caption text-medium-emphasis mt-1">
            {{
              isCreate
                ? '상대 클랜이 수락하면 라인업을 확정합니다.'
                : '시간/티어는 Host가 설정한 값입니다.'
            }}
          </div>
        </v-col>
      </v-row>

      <v-divider class="my-4" />

      <!-- ===================== -->
      <!-- Host 라인업(상대팀) 표시 -->
      <!-- ===================== -->
      <div class="d-flex align-center justify-space-between mb-2">
        <div class="text-subtitle-1 font-weight-bold">
          {{ isCreate ? '우리 클랜 라인업(Host)' : `${clanMatch?.host_clan.name} 라인업(Host)` }}
        </div>

        <v-btn
          v-if="isCreate"
          size="small"
          variant="tonal"
          prepend-icon="mdi-refresh"
          @click="resetLineup('host')"
        >
          초기화
        </v-btn>
      </div>

      <v-row dense>
        <v-col v-for="slot in slots" :key="'host-' + slot.key" cols="12" md="6">
          <v-card variant="tonal" class="pa-3" rounded="lg">
            <div class="d-flex align-center mb-2" style="gap: 8px">
              <v-icon :icon="slot.icon" size="18" />
              <div class="text-subtitle-2 font-weight-bold">{{ slot.label }}</div>
              <v-spacer />
              <v-chip size="x-small" variant="flat" color="secondary">{{ slot.short }}</v-chip>
            </div>

            <v-autocomplete
              v-model="form.hostLineup[slot.key]"
              :items="availablePlayersFor('host', slot.key)"
              item-title="display"
              item-value="id"
              label="플레이어 선택"
              variant="outlined"
              density="comfortable"
              clearable
              prepend-inner-icon="mdi-account"
              :disabled="!isCreate"
            />
          </v-card>
        </v-col>
      </v-row>

      <v-divider class="my-4" />

      <!-- ===================== -->
      <!-- Guest 라인업(우리팀) 입력 -->
      <!-- ===================== -->
      <div class="d-flex align-center justify-space-between mb-2">
        <div class="text-subtitle-1 font-weight-bold">
          {{ isCreate ? '상대 클랜 라인업(Guest)' : '우리 클랜 라인업(Guest)' }}
        </div>

        <v-btn
          v-if="isGuestMode"
          size="small"
          variant="tonal"
          prepend-icon="mdi-refresh"
          @click="resetLineup('guest')"
        >
          초기화
        </v-btn>
      </div>

      <v-alert
        v-if="isGuestMode && guestPlayers.length === 0"
        type="info"
        variant="tonal"
        density="compact"
        class="mb-3"
      >
        우리 클랜에 등록된 플레이어가 없습니다. 먼저 플레이어 연동/등록을 해주세요.
      </v-alert>

      <v-row dense>
        <v-col v-for="slot in slots" :key="'guest-' + slot.key" cols="12" md="6">
          <v-card variant="tonal" class="pa-3" rounded="lg">
            <div class="d-flex align-center mb-2" style="gap: 8px">
              <v-icon :icon="slot.icon" size="18" />
              <div class="text-subtitle-2 font-weight-bold">{{ slot.label }}</div>
              <v-spacer />
              <v-chip size="x-small" variant="flat" color="secondary">{{ slot.short }}</v-chip>
            </div>

            <v-autocomplete
              v-model="form.guestLineup[slot.key]"
              :items="availablePlayersFor('guest', slot.key)"
              item-title="display"
              item-value="id"
              label="플레이어 선택"
              variant="outlined"
              density="comfortable"
              clearable
              prepend-inner-icon="mdi-account"
              :disabled="!isGuestMode || guestPlayers.length === 0"
              :rules="[() => true]"
            />
          </v-card>
        </v-col>
      </v-row>

      <v-divider class="my-4" />

      <!-- 하단 액션 -->
      <div class="d-flex justify-end" style="gap: 8px">
        <v-btn variant="text" @click="router.back()">뒤로</v-btn>

        <!-- Create -->
        <v-btn
          v-if="isCreate"
          color="primary"
          :disabled="!canSubmitCreate"
          prepend-icon="mdi-check"
          @click="submitCreate"
        >
          등록 (Step1)
        </v-btn>

        <!-- Guest Accept -->
        <v-btn
          v-else-if="isGuestMode"
          color="success"
          :disabled="!canSubmitGuest"
          prepend-icon="mdi-handshake"
          @click="submitAccept"
        >
          수락 + 라인업 제출
        </v-btn>
      </div>

      <v-alert v-if="errorMsg" type="warning" variant="tonal" density="compact" class="mt-3">
        {{ errorMsg }}
      </v-alert>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { getBaseUrl } from '@/@core/composable/createUrl';
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '@/@core/composable/useAxios';
import { useAccountStore } from '@/stores/useAccountStore';
import type { Player } from '@/data/types/player';
import type { ClanMatch } from '@/data/types/clanmatch';
import { CLAN_MATCH_PATH } from '@/router/clanmatch';

const account = useAccountStore();
const router = useRouter();
const route = useRoute();

// 수정인지 신규인지
const isEdit = computed(() => !!route.params.id);

/** route.params.id 있으면 상세(수락/조회), 없으면 생성 */
const matchId = computed(() => route.params.id as string | undefined);
const isCreate = computed(() => !matchId.value);

type SlotKey = 'TOP' | 'JUG' | 'MID' | 'ADC' | 'SUP';

const tierOptions = [
  { title: '1티어 - 그랜드마스터 · 챌린저', value: 1, desc: '그랜드마스터 · 챌린저' },
  { title: '2티어 - 마스터 · 챌린저', value: 2, desc: '마스터 · 챌린저' },
  { title: '3티어 - 다이아몬드 · 마스터', value: 3, desc: '다이아몬드 · 마스터' },
  { title: '4티어 - 에메랄드 · 다이아몬드', value: 4, desc: '에메랄드 · 다이아몬드' },
  { title: '5티어 - 플래티넘 · 에메랄드', value: 5, desc: '플래티넘 · 에메랄드' },
  { title: '6티어 - 골드 · 플래티넘', value: 6, desc: '골드 · 플래티넘' },
  { title: '7티어 - 실버 · 골드', value: 7, desc: '실버 · 골드' },
  { title: '8티어 - 브론즈 · 실버', value: 8, desc: '브론즈 · 실버' },
  { title: '9티어 - 아이언 · 브론즈', value: 9, desc: '아이언 · 브론즈' },
];

const slots: { key: SlotKey; label: string; short: string; icon: string }[] = [
  { key: 'TOP', label: '탑', short: 'TOP', icon: 'mdi-shield-sword-outline' },
  { key: 'JUG', label: '정글', short: 'JG', icon: 'mdi-pine-tree' },
  { key: 'MID', label: '미드', short: 'MID', icon: 'mdi-sword-cross' },
  { key: 'ADC', label: '원딜', short: 'ADC', icon: 'mdi-bow-arrow' },
  { key: 'SUP', label: '서포터', short: 'SUP', icon: 'mdi-hand-heart-outline' },
];

const errorMsg = ref('');
const clanMatch = ref<ClanMatch>();

const form = ref({
  tier: null as number | null,
  matchAt: '' as string,
  hostLineup: { TOP: null, JUG: null, MID: null, ADC: null, SUP: null } as Record<
    SlotKey,
    number | null
  >,
  guestLineup: { TOP: null, JUG: null, MID: null, ADC: null, SUP: null } as Record<
    SlotKey,
    number | null
  >,
});

const selectedTierDesc = computed(
  () => tierOptions.find((x) => x.value === form.value.tier)?.desc ?? ''
);

const mode = computed(() => {
  if (isCreate.value) return 'CREATE';
  return clanMatch.value?.host_clan.id === account.clan.id ? 'HOST_VIEW' : 'GUEST_ACCEPT';
});

const isGuestMode = computed(() => mode.value === 'GUEST_ACCEPT');

const modeChip = computed(() => {
  if (mode.value === 'CREATE') return { label: 'CREATE', color: 'primary' };
  if (mode.value === 'HOST_VIEW') return { label: 'HOST', color: 'indigo' };
  return { label: 'GUEST', color: 'success' };
});

/** 샘플: 내 클랜 플레이어(생성자) */
const hostPlayers = ref<Player[]>([]);
const guestPlayers = ref<Player[]>([]);

/** 중복 선택 방지(팀 안에서만) */
function availablePlayersFor(team: 'host' | 'guest', slotKey: SlotKey) {
  const lineup = team === 'host' ? form.value.hostLineup : form.value.guestLineup;
  const pool = team === 'host' ? hostPlayers.value : guestPlayers.value;

  const picked = new Set<number>(
    Object.entries(lineup)
      .filter(([k, v]) => k !== slotKey && v != null)
      .map(([, v]) => v as number)
  );

  return pool
    .filter((p) => !picked.has(p.id))
    .map((p) => ({ ...p, display: `${p.nickname}#${p.tagname}` }));
}

function resetLineup(team: 'host' | 'guest') {
  const target = team === 'host' ? form.value.hostLineup : form.value.guestLineup;
  target.TOP = target.JUG = target.MID = target.ADC = target.SUP = null;
}

const canSubmitCreate = computed(() => {
  if (!form.value.tier || !form.value.matchAt) return false;
  const v = form.value.hostLineup;
  return !!(v.TOP && v.JUG && v.MID && v.ADC && v.SUP);
});

const canSubmitGuest = computed(() => {
  const v = form.value.guestLineup;
  return !!(v.TOP && v.JUG && v.MID && v.ADC && v.SUP);
});

async function submitCreate() {
  errorMsg.value = '';

  try {
    // datetime-local → ISO(+09:00 유지)
    const matchAt = new Date(form.value.matchAt).toISOString();

    const payload = {
      host_clan_id: account.clan.id, // 또는 myClanId.value
      match_at: matchAt,
      tier: form.value.tier,
      match_members: [
        { position: 'TOP', player_id: form.value.hostLineup.TOP },
        { position: 'JUG', player_id: form.value.hostLineup.JUG },
        { position: 'MID', player_id: form.value.hostLineup.MID },
        { position: 'ADC', player_id: form.value.hostLineup.ADC },
        { position: 'SUP', player_id: form.value.hostLineup.SUP },
      ],
    };

    await api.post(`${getBaseUrl('DATA')}/clanmatch/create`, payload);

    router.push('/clanmatch');
  } catch (e) {
    console.error(e);
    errorMsg.value = '등록에 실패했습니다.';
  }
}

async function submitAccept() {
  errorMsg.value = '';
  try {
    const payload = {
      id: matchId.value,
      status: 'MATCHED',
      guest_clan_id: account.clan.id,
      match_members: [
        { position: 'TOP', player_id: form.value.guestLineup.TOP },
        { position: 'JUG', player_id: form.value.guestLineup.JUG },
        { position: 'MID', player_id: form.value.guestLineup.MID },
        { position: 'ADC', player_id: form.value.guestLineup.ADC },
        { position: 'SUP', player_id: form.value.guestLineup.SUP },
      ],
    };

    await api.post(`${getBaseUrl('DATA')}/clanmatch/update`, payload);
    router.push(CLAN_MATCH_PATH.VIEW(matchId.value));
  } catch (e) {
    console.error(e);
    errorMsg.value = '수락에 실패했습니다.';
  }
}

function toDatetimeLocal(iso: string) {
  const d = new Date(iso); // iso가 Z면 UTC로 파싱되고, getHours()는 로컬(KST)
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

onMounted(async () => {
  debugger;
  if (isEdit.value == true) {
    const { data } = await api.get(`${getBaseUrl('DATA')}/clanmatch/find?id=${route.params.id}`);
    clanMatch.value = data.datas;

    form.value.hostLineup.TOP = clanMatch.value?.host_member.TOP?.id;
    form.value.hostLineup.JUG = clanMatch.value?.host_member.JUG?.id;
    form.value.hostLineup.MID = clanMatch.value?.host_member.MID?.id;
    form.value.hostLineup.ADC = clanMatch.value?.host_member.ADC?.id;
    form.value.hostLineup.SUP = clanMatch.value?.host_member.SUP?.id;

    form.value.tier = clanMatch.value?.tier;

    form.value.matchAt = clanMatch.value?.match_at ? toDatetimeLocal(clanMatch.value.match_at) : '';

    //host players
    const res = await api.post(`${getBaseUrl('DATA')}/player/list`, {
      clan: clanMatch.value?.host_clan,
    });
    hostPlayers.value = res.data.datas;

    //guest players
    const res2 = await api.post(`${getBaseUrl('DATA')}/player/list`, {
      clan: account.clan,
    });
    guestPlayers.value = res2.data.datas;
  } else {
    const res = await api.post(`${getBaseUrl('DATA')}/player/list`, {
      clan: account.clan,
    });

    hostPlayers.value = res.data.datas;
  }
});
</script>
