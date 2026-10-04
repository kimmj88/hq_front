<template>
  <div v-if="canEdit || canDelete" class="d-flex flex-wrap ga-2">
    <v-btn v-if="canEdit" variant="tonal" prepend-icon="mdi-account-edit" @click="openEditor">{{
      isHost ? '클랜전 수정' : '선수 수정'
    }}</v-btn>
    <v-btn
      v-if="canDelete"
      color="error"
      variant="text"
      prepend-icon="mdi-trash-can-outline"
      @click="deleteOpen = true"
      >삭제</v-btn
    >
  </div>
  <v-dialog v-model="editOpen" max-width="620" :persistent="saving">
    <v-card rounded="xl" :title="isHost ? '클랜전 수정' : '우리 클랜 선수 수정'">
      <v-card-text>
        <p class="text-body-2 mb-4">
          {{
            isHost
              ? '시간, 티어, 설명과 우리 팀 선수를 수정할 수 있습니다.'
              : '각 포지션의 선수를 선택하세요. 저장하면 우리 팀 라인업에 반영됩니다.'
          }}
        </p>
        <v-progress-linear v-if="loading" indeterminate class="mb-4" />
        <v-alert
          v-if="!loading && hasUnavailablePlayers"
          type="warning"
          variant="tonal"
          class="mb-4"
        >
          현재 클랜 선수 목록에 없는 선수가 포함되어 있습니다. 선수를 변경하려면 해당 포지션의
          선수를 다시 선택하세요.
        </v-alert>
        <template v-if="isHost">
          <v-select
            v-model="details.tier"
            :items="tierOptions"
            label="티어 선택"
            variant="outlined"
            :disabled="loading || saving"
          />
          <v-text-field
            v-model="details.matchAt"
            type="datetime-local"
            label="매치 시간"
            variant="outlined"
            :disabled="loading || saving"
          />
          <v-textarea
            v-model="details.description"
            label="설명 (선택)"
            variant="outlined"
            auto-grow
            rows="3"
            counter="200"
            :disabled="loading || saving"
          />
          <v-divider class="mb-4" />
          <div class="text-subtitle-1 font-weight-bold mb-3">우리 클랜 선수</div>
        </template>
        <v-autocomplete
          v-for="slot in slots"
          :key="slot.key"
          v-model="lineup[slot.key]"
          :label="slot.label"
          :items="availablePlayers(slot.key)"
          item-title="display"
          item-value="id"
          variant="outlined"
          clearable
          :disabled="loading || saving"
        />
        <v-alert v-if="error" type="error" variant="tonal">{{ error }}</v-alert>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn :disabled="saving" @click="editOpen = false">취소</v-btn>
        <v-btn
          color="primary"
          variant="flat"
          :loading="saving"
          :disabled="!canSave || loading"
          @click="saveChanges"
          >변경 저장</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-dialog>
  <v-dialog v-model="deleteOpen" max-width="460" :persistent="saving">
    <v-card rounded="xl" title="클랜전 삭제">
      <v-card-text>
        이 클랜전과 등록된 선수 정보를 삭제할까요? 삭제 후에는 복구할 수 없습니다.
        <p v-if="match.status === 'MATCHED'" class="mt-3">
          상대 클랜과 매칭된 경기입니다. 삭제하면 상대 클랜에서도 이 경기가 사라집니다.
        </p>
        <v-alert v-if="deleteError" type="error" variant="tonal" class="mt-3">{{
          deleteError
        }}</v-alert>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn :disabled="saving" @click="deleteOpen = false">취소</v-btn>
        <v-btn color="error" variant="flat" :loading="saving" @click="deleteMatch">삭제</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
  <v-snackbar v-model="notice" :timeout="2500">변경 사항이 저장되었습니다.</v-snackbar>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import api from '@/@core/composable/useAxios';
import { getBaseUrl } from '@/@core/composable/createUrl';
import { useAccountStore } from '@/stores/useAccountStore';
import { can } from '@/stores/useClanPermissionStore';
import type { ClanMini, MatchStatus, SlotKey } from '@/data/types/clanmatch';

const props = defineProps<{
  match: {
    id: number;
    status: MatchStatus;
    is_confirm: boolean;
    host_clan: ClanMini;
    guest_clan: ClanMini | null;
  };
}>();
const emit = defineEmits<{ updated: []; deleted: [] }>();
const account = useAccountStore();
const editable = computed(
  () =>
    props.match.id > 0 &&
    !props.match.is_confirm &&
    ['WAITING', 'MATCHED'].includes(props.match.status),
);
const isHost = computed(() => !!account.clan?.id && account.clan.id === props.match.host_clan.id);
const canDelete = computed(
  () =>
    editable.value &&
    isHost.value &&
    can('CLANMATCH', 'CLAN-SET-CLANMATCH-D'),
);
const canEdit = computed(
  () =>
    editable.value &&
    can('CLANMATCH', 'CLAN-SET-CLANMATCH-U') &&
    !!account.clan?.id &&
    (isHost.value || account.clan.id === props.match.guest_clan?.id),
);
const slots: { key: SlotKey; label: string }[] = [
  { key: 'TOP', label: '탑' },
  { key: 'JUG', label: '정글' },
  { key: 'MID', label: '미드' },
  { key: 'ADC', label: '원딜' },
  { key: 'SUP', label: '서포터' },
];
const lineup = ref<Record<SlotKey, number | null>>({
  TOP: null,
  JUG: null,
  MID: null,
  ADC: null,
  SUP: null,
});
const originalLineup = ref('');
const originalPlayersByPosition = ref<Partial<Record<SlotKey, number | null>>>({});
const originalDetails = ref('');
const loaded = ref(false);
const details = ref({ tier: null as number | null, matchAt: '', description: '' });
const tierOptions = [
  { title: '무제한티어', value: 10 },
  { title: '9티어 - 아이언 · 브론즈', value: 9 },
  { title: '8티어 - 브론즈 · 실버', value: 8 },
  { title: '7티어 - 실버 · 골드', value: 7 },
  { title: '6티어 - 골드 · 플래티넘', value: 6 },
  { title: '5티어 - 플래티넘 · 에메랄드', value: 5 },
  { title: '4티어 - 에메랄드 · 다이아몬드', value: 4 },
  { title: '3티어 - 다이아몬드 · 마스터', value: 3 },
  { title: '2티어 - 마스터 · 챌린저', value: 2 },
  { title: '1티어 - 그랜드마스터 · 챌린저', value: 1 },
];
const lineupChanged = computed(() => JSON.stringify(lineup.value) !== originalLineup.value);
const detailsChanged = computed(
  () => isHost.value && JSON.stringify(details.value) !== originalDetails.value,
);
const canSave = computed(
  () =>
    loaded.value &&
    (lineupChanged.value || detailsChanged.value) &&
    (!lineupChanged.value || validLineup.value) &&
    (!detailsChanged.value ||
      (tierOptions.some((t) => t.value === details.value.tier) &&
        Number.isFinite(new Date(details.value.matchAt).getTime()) &&
        details.value.description.length <= 200)),
);
function toLocalDatetime(value: string) {
  const date = new Date(value);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
const players = ref<{ id: number; display: string }[]>([]);
const registeredPlayers = ref<{ id: number; display: string }[]>([]);
const editOpen = ref(false);
const deleteOpen = ref(false);
const loading = ref(false);
const saving = ref(false);
const error = ref('');
const deleteError = ref('');
const notice = ref(false);
const validLineup = computed(() => {
  const ids = slots.map((s) => lineup.value[s.key]);
  return (
    slots.every(({ key }) => {
      const id = lineup.value[key];
      return (
        id &&
        (id === originalPlayersByPosition.value[key] || players.value.some((p) => p.id === id))
      );
    }) && new Set(ids).size === 5
  );
});
const hasUnavailablePlayers = computed(() =>
  slots.some(
    ({ key }) =>
      lineup.value[key] != null && !players.value.some((p) => p.id === lineup.value[key]),
  ),
);
function availablePlayers(key: SlotKey) {
  const selected = slots.filter((s) => s.key !== key).map((s) => lineup.value[s.key]);
  const available = players.value.filter(
    (p) => p.id === lineup.value[key] || !selected.includes(p.id),
  );
  const current = registeredPlayers.value.find((p) => p.id === lineup.value[key]);
  if (current && !available.some((p) => p.id === current.id)) {
    return [...available, { ...current, props: { disabled: true } }];
  }
  return available;
}
function toPlayerOption(player: {
  id: number | string;
  nickname: string;
  tagname?: string | null;
}) {
  return {
    id: Number(player.id),
    display: `${player.nickname}${player.tagname ? `#${player.tagname}` : ''}`,
  };
}
function errorMessage(e: any, fallback: string) {
  const message = e?.response?.data?.message;
  return typeof message === 'string' ? message : fallback;
}
async function openEditor() {
  if (!canEdit.value) return;
  editOpen.value = true;
  loading.value = true;
  error.value = '';
  loaded.value = false;
  details.value = { tier: null, matchAt: '', description: '' };
  players.value = [];
  registeredPlayers.value = [];
  for (const slot of slots) lineup.value[slot.key] = null;
  try {
    const [detail, pool] = await Promise.all([
      api.get(`${getBaseUrl('DATA')}/clanmatch/find`, { params: { id: props.match.id } }),
      api.post(`${getBaseUrl('DATA')}/player/list`, { clan: { id: account.clan.id } }),
    ]);
    const members = isHost.value ? detail.data.datas.host_member : detail.data.datas.guest_member;
    for (const slot of slots) {
      const member = members?.[slot.key];
      if (!member) continue;
      const player = toPlayerOption(member);
      registeredPlayers.value.push(player);
      lineup.value[slot.key] = player.id;
    }
    players.value = pool.data.datas.map(toPlayerOption);
    details.value = {
      tier: Number(detail.data.datas.tier),
      matchAt: toLocalDatetime(detail.data.datas.match_at),
      description: detail.data.datas.description ?? '',
    };
    originalPlayersByPosition.value = { ...lineup.value };
    originalLineup.value = JSON.stringify(lineup.value);
    originalDetails.value = JSON.stringify(details.value);
    loaded.value = true;
  } catch (e) {
    error.value = errorMessage(e, '선수 정보를 불러오지 못했습니다. 다시 시도하세요.');
  } finally {
    loading.value = false;
  }
}
async function saveChanges() {
  if (!canEdit.value || !canSave.value || saving.value) return;
  saving.value = true;
  error.value = '';
  try {
    const response = await api.post(`${getBaseUrl('DATA')}/clanmatch/lineup`, {
      id: props.match.id,
      account_id: account.id,
      ...(lineupChanged.value
        ? {
            match_members: slots.map((s) => ({ position: s.key, player_id: lineup.value[s.key] })),
          }
        : {}),
      ...(detailsChanged.value
        ? {
            tier: details.value.tier,
            match_at: new Date(details.value.matchAt).toISOString(),
            description: details.value.description.trim(),
          }
        : {}),
    });
    if (response.data.rows !== true) throw new Error('save failed');
    editOpen.value = false;
    notice.value = true;
    emit('updated');
  } catch (e) {
    error.value = errorMessage(e, '변경 사항 저장에 실패했습니다. 다시 시도하세요.');
  } finally {
    saving.value = false;
  }
}
async function deleteMatch() {
  if (!canDelete.value || saving.value) return;
  saving.value = true;
  deleteError.value = '';
  try {
    const response = await api.post(`${getBaseUrl('DATA')}/clanmatch/remove`, {
      id: props.match.id,
      account_id: account.id,
    });
    if (response.data.result !== true) throw new Error('delete failed');
    deleteOpen.value = false;
    emit('deleted');
  } catch (e) {
    deleteError.value = errorMessage(e, '삭제에 실패했습니다. 다시 시도하세요.');
  } finally {
    saving.value = false;
  }
}
</script>
