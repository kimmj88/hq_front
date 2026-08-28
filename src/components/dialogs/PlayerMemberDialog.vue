<template>
  <v-dialog v-model="dialog" max-width="640">
    <!-- 액티베이터 -->
    <template #activator="{ props }">
      <v-btn color="secondary" v-bind="props" prepend-icon="mdi-account-plus">Add Player</v-btn>
    </template>

    <v-card>
      <v-card-title class="text-h6 d-flex align-center">
        <v-icon class="mr-2" size="20">mdi-account-search</v-icon>
        Add Player
      </v-card-title>

      <v-divider />

      <!-- 입력 영역 -->
      <v-card-text class="pt-4">
        <v-form>
          <v-row dense>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="searchId"
                label="아이디 입력"
                placeholder="예) 힐링큐"
                variant="outlined"
                density="compact"
                clearable
                prepend-inner-icon="mdi-account"
              />
            </v-col>

            <v-col cols="12" sm="6">
              <v-text-field
                v-model="searchTag"
                label="태그 입력"
                placeholder="예) KR1"
                variant="outlined"
                density="compact"
                clearable
                prepend-inner-icon="mdi-pound"
              />
            </v-col>

            <v-col cols="12" class="d-flex">
              <v-spacer />
              <v-btn color="secondary" @click="searchPlayer" prepend-icon="mdi-magnify">
                Search
              </v-btn>
            </v-col>
          </v-row>
        </v-form>

        <!-- 결과 영역 -->
        <v-expand-transition>
          <div v-if="tier || rank || point || win || lose">
            <v-divider class="my-4" />

            <v-card variant="tonal" class="pa-3">
              <div class="d-flex flex-wrap align-center gap-2 mb-2">
                <v-chip color="primary" variant="flat" size="small" class="mr-2">
                  티어: {{ tier || '—' }}
                </v-chip>
                <v-chip color="indigo" variant="flat" size="small" class="mr-2">
                  랭크: {{ rank || '—' }}
                </v-chip>
                <v-chip color="teal" variant="flat" size="small"> LP: {{ point || '0' }} </v-chip>
              </div>

              <v-row dense>
                <v-col cols="6">
                  <v-text-field
                    v-model="win"
                    label="승리"
                    variant="outlined"
                    density="compact"
                    readonly
                    prepend-inner-icon="mdi-trophy"
                  />
                </v-col>
                <v-col cols="6">
                  <v-text-field
                    v-model="lose"
                    label="패배"
                    variant="outlined"
                    density="compact"
                    readonly
                    prepend-inner-icon="mdi-emoticon-sad-outline"
                  />
                </v-col>
              </v-row>
            </v-card>
          </div>
        </v-expand-transition>
      </v-card-text>

      <v-divider />

      <!-- 하단 액션 -->
      <v-card-actions class="justify-end">
        <v-btn variant="text" @click="dialog = false">취소</v-btn>
        <v-btn color="primary" :disabled="!canAdd" @click="handleAdd" prepend-icon="mdi-check">
          추가
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
import axios from 'axios';
import { useAccountStore } from '@/stores/useAccountStore';

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

// async function searchPlayer() {
//   try {
//     const res = await api.get(
//       `https://asia.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${searchId.value}/${searchTag.value}?api_key=RGAPI-ee1558af-f139-456c-aaf5-0e7b82135e35`
//     ); // 예: 전체 사용자 리스트

//     const res2 = await api
//       .get(
//         `https://kr.api.riotgames.com/lol/league/v4/entries/by-puuid/${res.data.puuid}?api_key=RGAPI-ee1558af-f139-456c-aaf5-0e7b82135e35`
//       )
//       .then((value) => {
//         for (const item of value.data) {
//           if (item.queueType == 'RANKED_SOLO_5x5') {
//             tier.value = item.tier;
//             rank.value = item.rank;
//             point.value = item.leaguePoints;
//             win.value = item.wins;
//             lose.value = item.losses;

//             searched.value = true;
//             lastKey.value = currentKey.value;
//           }
//         }
//       });
//   } catch (e) {
//     console.error('사용자 목록 로드 실패', e);
//   }
// }

async function searchPlayer() {
  try {
    const name = encodeURIComponent(searchId.value.trim());
    const tag = encodeURIComponent(searchTag.value.trim());
    // 외부 호출은 공용 axios/페치 쓰거나, api 인스턴스에 baseURL/interceptor가 껴있다면 제외
    const a = await axios.get(
      `https://asia.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${name}/${tag}`,
      { headers: { 'X-Riot-Token': 'RGAPI-e02e009e-5fbd-4010-95e9-c7e5074809eb' } } // 브라우저에 키 노출됨(권장 X)
    );

    const puuid = a.data.puuid;

    const b = await axios.get(
      `https://kr.api.riotgames.com/lol/league/v4/entries/by-puuid/${encodeURIComponent(puuid)}`,
      { headers: { 'X-Riot-Token': 'RGAPI-e02e009e-5fbd-4010-95e9-c7e5074809eb' } }
    );

    if (b.status == 200) {
      for (const item of b.data) {
        if (item.queueType === 'RANKED_SOLO_5x5') {
          tier.value = item.tier;
          rank.value = item.rank;
          point.value = item.leaguePoints;
          win.value = item.wins;
          lose.value = item.losses;

          searched.value = true;
          lastKey.value = currentKey.value;
          return;
        }
      }

      tier.value = 'UNRANK';

      searched.value = true;
      lastKey.value = currentKey.value;
    }
  } catch (e) {
    console.error('라이엇 조회 실패', e);
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

  const response = await api.post(`${getBaseUrl('DATA')}/player/create`, {
    nickname: searchId.value,
    tagname: searchTag.value,
    tier: {
      id: findID,
    },
    clan: { id: account.clan.id },
  });

  if (response.status == 409) {
    toast('이미 다른 클랜에 추가되어 있습니다.');
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

  emit('added', selected); // 🔥 선택된 사용자 전달

  dialog.value = false;
  selectedUsers.value = [];
}
</script>
