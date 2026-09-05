<template>
  <v-dialog v-model="dialog" max-width="640">
    <!-- 액티베이터 -->
    <template #activator="{ props }">
      <v-btn
        :color="buttonColor"
        :block="block"
        :size="buttonSize"
        :rounded="buttonRounded"
        v-bind="props"
        prepend-icon="mdi-link-variant"
      >
        {{ buttonText }}
      </v-btn>
    </template>

    <v-card class="link-dialog" rounded="xl">
      <div class="link-dialog__hero">
        <div class="riot-mark"><v-icon size="30">mdi-sword-cross</v-icon></div>
        <div>
          <span>LEAGUE OF LEGENDS</span>
          <h2>LoL 계정 연동</h2>
          <p>클랜에서 사용할 본인의 Riot ID를 확인해 주세요.</p>
        </div>
        <v-btn icon="mdi-close" variant="text" size="small" aria-label="닫기" @click="dialog = false" />
      </div>

      <v-card-text class="link-dialog__body">
        <div class="guide-row">
          <v-icon size="17">mdi-information-outline</v-icon>
          <span>게임 이름과 태그는 리그 오브 레전드 클라이언트 프로필에서 확인할 수 있습니다.</span>
        </div>

        <v-form @submit.prevent="searchPlayer">
          <div class="riot-id-label"><strong>Riot ID</strong><span>게임 이름과 # 뒤의 태그를 입력하세요.</span></div>
          <div class="riot-id-inputs">
            <v-text-field v-model="searchId" label="게임 이름" placeholder="예: 힐링큐" variant="outlined" clearable hide-details="auto" prepend-inner-icon="mdi-account-outline" />
            <span class="hash">#</span>
            <v-text-field v-model="searchTag" label="태그" placeholder="KR1" variant="outlined" clearable hide-details="auto" class="tag-field" />
          </div>
          <v-btn block size="large" rounded="lg" color="primary" type="submit" class="search-button" prepend-icon="mdi-magnify" :loading="searching" :disabled="!searchId.trim() || !searchTag.trim()">
            Riot 계정 확인
          </v-btn>
        </v-form>

        <v-alert v-if="searchError" type="error" variant="tonal" density="comfortable" rounded="lg" class="mt-4">{{ searchError }}</v-alert>

        <v-expand-transition>
          <section v-if="searched && !searchError" class="player-result">
            <div class="result-check"><v-icon>mdi-check</v-icon></div>
            <div class="result-main">
              <span>연동할 계정을 확인해 주세요</span>
              <strong>{{ searchId }}<em>#{{ searchTag }}</em></strong>
              <div class="rank-line">
                <v-chip color="primary" variant="tonal" size="small">{{ tier }} {{ rank }}</v-chip>
                <b>{{ Number(point || 0).toLocaleString() }} LP</b>
              </div>
            </div>
            <div class="result-record">
              <div><strong>{{ win || 0 }}</strong><span>승리</span></div>
              <i />
              <div><strong>{{ lose || 0 }}</strong><span>패배</span></div>
            </div>
          </section>
        </v-expand-transition>
      </v-card-text>

      <v-card-actions class="link-dialog__actions">
        <v-btn variant="text" size="large" @click="dialog = false">취소</v-btn>
        <v-btn color="primary" size="large" rounded="lg" :disabled="!canAdd" :loading="linking" @click="handleAdd" prepend-icon="mdi-link-variant">
          이 계정 연동하기
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-snackbar v-model="snack.show" :timeout="2200">
    {{ snack.msg }}
  </v-snackbar>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { getBaseUrl } from '@/@core/composable/createUrl';
import { useRoute } from 'vue-router';
import api from '@/@core/composable/useAxios';
import type { Tier } from '@/data/types/tier';
import { useAccountStore } from '@/stores/useAccountStore';

withDefaults(
  defineProps<{
    buttonText?: string;
    buttonColor?: string;
    buttonSize?: string;
    buttonRounded?: string;
    block?: boolean;
  }>(),
  {
    buttonText: '롤 계정 동기화',
    buttonColor: 'secondary',
    buttonSize: 'default',
    buttonRounded: undefined,
    block: false,
  }
);

const account = useAccountStore();

const route = useRoute();

const tiers = ref<Tier[]>([]);

const emit = defineEmits<{
  (e: 'added', users: UserOption[]): void;
}>();

interface UserOption {
  id: number;
  name: string;
  email: string;
  display: string;
}

const dialog = ref(false);
const allUsers = ref<UserOption[]>([]);
const selectedUsers = ref<number[]>([]);

const searchId = ref('');
const searchTag = ref('');
const puuid = ref<string>('');

const tier = ref('');
const rank = ref('');
const win = ref('');
const lose = ref('');
const point = ref('');

const autocompleteRef = ref<any>(null);
let prevLength = ref(0);

const currentKey = computed(() => `${searchId.value}#${searchTag.value}`.trim());
const searched = ref(false);
const lastKey = ref(''); // "name#tag" 형태 저장
const searching = ref(false);
const linking = ref(false);
const searchError = ref('');
const canAdd = computed(() => searched.value && currentKey.value === lastKey.value && !!tier.value);

watch(selectedUsers, () => {
  if (selectedUsers.value.length > prevLength.value) {
    // 칩 추가된 경우만
    const inputEl = autocompleteRef.value?.$el.querySelector('input') as HTMLInputElement;
    if (inputEl) {
      inputEl.value = '';
      inputEl.dispatchEvent(new Event('input'));
    }
  }
  prevLength.value = selectedUsers.value.length;
});

onMounted(fetch);

async function searchPlayer() {
  searchError.value = '';
  searched.value = false;
  searching.value = true;
  try {
    const response = await api.get(`${getBaseUrl('DATA')}/riot/account`, {
      params: { nickname: searchId.value.trim(), tagname: searchTag.value.trim() },
    });
    const result = response.data?.datas;
    const ranked = result?.ranked;
    tier.value = ranked?.tier ?? 'UNRANK';
    rank.value = ranked?.rank ?? '';
    point.value = ranked?.leaguePoints ?? 0;
    win.value = ranked?.wins ?? 0;
    lose.value = ranked?.losses ?? 0;
    puuid.value = result?.puuid ?? '';
    searched.value = true;
    lastKey.value = currentKey.value;
  } catch (e) {
    console.error('라이엇 조회 실패', e);
    searchError.value = '해당 Riot ID를 찾지 못했습니다. 게임 이름과 태그를 다시 확인해 주세요.';
  } finally {
    searching.value = false;
  }
}

async function fetch() {
  try {
    const response = await api.get(`${getBaseUrl('DATA')}/tier/all`);
    tiers.value = response.data.datas;
  } catch (error) {
    console.error('매치 정보 불러오기 실패:', error);
  }
}

const snack = ref({ show: false, msg: '' });
function toast(msg: string) {
  snack.value.msg = msg;
  snack.value.show = true;
}

async function handleAdd() {
  linking.value = true;
  let findID = 0;

  for (const item of tiers.value) {
    if (item.name == `${tier.value} ${rank.value}`) {
      findID = item.id;
    } else if (item.name == tier.value && item.name == 'CHALLENGER') {
      findID = item.id;
    } else if (item.name == tier.value && item.name == 'MASTER') {
      findID = item.id;
    } else if (item.name == tier.value && item.name == 'GRANDMASTER') {
      findID = item.id;
    } else if (item.name == tier.value && item.name == 'UNRANK') {
      findID = item.id;
    }
  }

  try {
    const response = await api.post(`${getBaseUrl('DATA')}/account/link_player`, {
      id: account.id,
      nickname: searchId.value,
      tagname: searchTag.value,
      puuid: puuid.value,
      tier: { id: findID },
    });

    if (!response.data.datas) {
      toast('이미 다른 계정에 연동된 Riot ID입니다.');
      return;
    }

  searchId.value = '';
  searchTag.value = '';
  tier.value = '';
  rank.value = '';
  win.value = '';
  lose.value = '';
  point.value = '';

  searched.value = false;
  lastKey.value = '';

    const selected = response.data;

    emit('added', selected);

    dialog.value = false;
    selectedUsers.value = [];
  } catch (error) {
    console.error('롤 계정 연동 실패', error);
    toast('계정을 연동하지 못했습니다. 잠시 후 다시 시도해 주세요.');
  } finally {
    linking.value = false;
  }
}
</script>

<style scoped>
.link-dialog{overflow:hidden;border:1px solid rgba(var(--v-theme-primary),.25);background:rgb(var(--v-theme-surface))}.link-dialog__hero{display:flex;align-items:flex-start;gap:16px;padding:26px 28px 24px;background:radial-gradient(circle at 85% 0,rgba(var(--v-theme-primary),.28),transparent 43%),linear-gradient(135deg,#171426,#25203b)}.link-dialog__hero>div:nth-child(2){min-width:0;flex:1}.riot-mark{display:grid;width:54px;height:54px;flex:0 0 54px;place-items:center;border:1px solid rgba(190,148,255,.42);border-radius:16px;color:#c4a3ff;background:rgba(var(--v-theme-primary),.17)}.link-dialog__hero span{color:#b794f6;font-size:10px;font-weight:900;letter-spacing:.14em}.link-dialog__hero h2{margin:3px 0 4px;font-size:25px}.link-dialog__hero p{margin:0;color:rgba(255,255,255,.58);font-size:13px}.link-dialog__body{padding:24px 28px!important}.guide-row{display:flex;align-items:flex-start;gap:8px;margin-bottom:22px;padding:11px 13px;border-radius:10px;color:rgba(var(--v-theme-on-surface),.62);font-size:12px;background:rgba(var(--v-theme-primary),.07)}.riot-id-label{display:flex;align-items:baseline;justify-content:space-between;gap:12px;margin-bottom:9px}.riot-id-label span{color:rgba(var(--v-theme-on-surface),.48);font-size:11px}.riot-id-inputs{display:grid;grid-template-columns:minmax(0,1fr) 18px 150px;align-items:center;gap:7px}.hash{text-align:center;color:#a78bfa;font-size:22px;font-weight:800}.search-button{margin-top:14px}.player-result{display:grid;grid-template-columns:42px 1fr auto;align-items:center;gap:13px;margin-top:18px;padding:17px;border:1px solid rgba(74,222,128,.28);border-radius:15px;background:linear-gradient(135deg,rgba(34,197,94,.1),rgba(var(--v-theme-primary),.06))}.result-check{display:grid;width:38px;height:38px;place-items:center;border-radius:50%;color:#86efac;background:rgba(34,197,94,.16)}.result-main{display:flex;min-width:0;flex-direction:column}.result-main>span{color:rgba(var(--v-theme-on-surface),.5);font-size:10px}.result-main>strong{overflow:hidden;margin:2px 0 8px;font-size:18px;text-overflow:ellipsis;white-space:nowrap}.result-main em{color:#a78bfa;font-size:13px;font-style:normal}.rank-line{display:flex;align-items:center;gap:9px}.rank-line b{font-size:11px}.result-record{display:flex;align-items:center;gap:14px}.result-record>div{display:flex;align-items:center;flex-direction:column}.result-record strong{font-size:18px}.result-record span{color:rgba(var(--v-theme-on-surface),.45);font-size:10px}.result-record i{width:1px;height:30px;background:rgba(var(--v-theme-on-surface),.12)}.link-dialog__actions{gap:8px;padding:16px 28px 24px!important;border-top:1px solid rgba(var(--v-theme-on-surface),.08)}
@media(max-width:600px){.link-dialog__hero{padding:22px 20px}.link-dialog__body{padding:20px!important}.riot-id-label{align-items:flex-start;flex-direction:column;gap:2px}.riot-id-inputs{grid-template-columns:minmax(0,1fr) 12px 105px}.player-result{grid-template-columns:38px 1fr}.result-record{grid-column:2}.link-dialog__actions{padding:14px 20px 20px!important}.link-dialog__actions .v-btn:last-child{flex:1}}
</style>
