<template>
  <v-container class="py-6" style="max-width: 760px">
    <v-btn variant="text" prepend-icon="mdi-arrow-left" class="mb-3" @click="router.back()">
      목록으로
    </v-btn>

    <v-card class="pa-5 pa-md-7" rounded="xl">
      <div class="text-h5 font-weight-black">경매 내전 {{ isEditing ? '수정' : '생성' }}</div>
      <div class="text-body-2 text-medium-emphasis mt-1 mb-6">
        {{ isEditing ? '모집 중인 경매 내전 설정을 변경합니다.' : '참가 인원과 경매 팀 수를 설정하세요.' }}
      </div>

      <v-form ref="formRef" @submit.prevent="submit">
        <v-text-field
          v-model="form.title"
          label="경매 내전 이름"
          placeholder="예: 토요일 3팀 경매 내전"
          variant="outlined"
          :rules="[required]"
        />
        <v-textarea
          v-model="form.description"
          label="안내 사항"
          placeholder="참가 조건이나 진행 규칙을 입력하세요."
          variant="outlined"
          rows="3"
          auto-grow
        />
        <v-text-field
          v-model="form.scheduledAt"
          type="datetime-local"
          label="시작 예정 시간"
          variant="outlined"
          :rules="[required]"
        />

        <v-text-field
          v-model.number="form.bidSeconds"
          type="number"
          min="5"
          max="300"
          label="선수별 기본 경매 시간"
          suffix="초"
          variant="outlined"
          prepend-inner-icon="mdi-timer-outline"
          hint="경매 화면에서 선수별로 다시 변경할 수 있습니다."
          persistent-hint
          :rules="[
            required,
            (value) => (Number(value) >= 5 && Number(value) <= 300) || '5~300초로 입력하세요.',
          ]"
          class="mb-4"
        />

        <v-switch
          v-model="form.isBlind"
          color="deep-purple-accent-2"
          inset
          label="블라인드 모드"
          hint="경매 중 선수 닉네임과 태그를 숨기고 티어와 주 포지션 2개만 표시합니다."
          persistent-hint
          class="mb-5"
        />

        <v-row>
          <v-col cols="12" sm="6">
            <v-select
              v-model="form.teamCount"
              :items="[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]"
              label="팀 수"
              variant="outlined"
            />
          </v-col>
          <v-col cols="12" sm="6">
            <v-select
              v-model="form.maxParticipants"
              :items="[10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60]"
              label="최대 참가자"
              variant="outlined"
            />
          </v-col>
        </v-row>

        <v-alert v-if="!account.isLoggedIn" type="warning" variant="tonal" class="mb-4">
          경매 내전을 생성하려면 로그인이 필요합니다.
        </v-alert>
        <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-4">
          {{ errorMessage }}
        </v-alert>

        <div class="d-flex justify-end ga-2">
          <v-btn variant="text" :disabled="submitting" @click="router.back()">취소</v-btn>
          <v-btn
            type="submit"
            color="deep-purple-accent-2"
            prepend-icon="mdi-check"
            :disabled="!account.isLoggedIn"
            :loading="submitting"
          >
            {{ isEditing ? '수정하기' : '생성하기' }}
          </v-btn>
        </div>
      </v-form>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { VForm } from 'vuetify/components';
import { useAccountStore } from '@/stores/useAccountStore';
import { CLAN_PATH } from '@/router/clan/type';
import { getBaseUrl } from '@/@core/composable/createUrl';
import api from '@/@core/composable/useAxios';

const route = useRoute();
const router = useRouter();
const account = useAccountStore();
const formRef = ref<VForm>();
const submitting = ref(false);
const errorMessage = ref('');
const clanName = computed(() => String(route.params.name ?? ''));
const auctionId = computed(() => Number(route.params.id || 0));
const isEditing = computed(() => auctionId.value > 0);
const form = ref({
  title: '',
  description: '',
  scheduledAt: '',
  teamCount: 3,
  maxParticipants: 15,
  bidSeconds: 20,
  isBlind: false,
});
const required = (value: unknown) => !!value || '필수 입력 항목입니다.';

function toLocalDateTime(value: string) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

async function loadAuction() {
  if (!isEditing.value) return;
  try {
    const response = await api.get(`${getBaseUrl('DATA')}/auction/list`, {
      params: { clan_name: clanName.value },
    });
    const room = (response.data?.datas ?? []).find((item: any) => item.id === auctionId.value);
    if (!room) throw new Error('수정할 경매 내전을 찾을 수 없습니다.');
    if (room.ownerId !== account.id) throw new Error('경매 생성자만 수정할 수 있습니다.');
    if (room.status !== 'RECRUITING') throw new Error('참가 모집 중인 경매 내전만 수정할 수 있습니다.');
    form.value = {
      title: room.title,
      description: room.description || '',
      scheduledAt: toLocalDateTime(room.scheduledAt),
      teamCount: room.teamCount,
      maxParticipants: room.maxParticipants,
      bidSeconds: room.bidSeconds,
      isBlind: !!room.isBlind,
    };
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.message || error?.message || '경매 내전을 불러오지 못했습니다.';
  }
}

async function submit() {
  const result = await formRef.value?.validate();
  if (!result?.valid || !account.isLoggedIn || submitting.value) return;

  submitting.value = true;
  errorMessage.value = '';

  try {
    const response = await api.post(`${getBaseUrl('DATA')}/auction/${isEditing.value ? 'update' : 'create'}`, {
      ...(isEditing.value ? { id: auctionId.value } : { clan_id: account.clanId, owner_id: account.id }),
      title: form.value.title.trim(),
      description: form.value.description.trim() || undefined,
      scheduled_at: new Date(form.value.scheduledAt).toISOString(),
      team_count: form.value.teamCount,
      max_participants: form.value.maxParticipants,
      bid_seconds: form.value.bidSeconds,
      is_blind: form.value.isBlind,
    });

    if (response.status >= 400 || !response.data?.datas?.id) {
      throw new Error(response.data?.message || `경매 내전 ${isEditing.value ? '수정' : '생성'}에 실패했습니다.`);
    }

    await router.replace(CLAN_PATH.AUCTION_VIEW(clanName.value, response.data.datas.id));
  } catch (error: any) {
    errorMessage.value =
      error?.response?.data?.message || error?.message || `경매 내전 ${isEditing.value ? '수정' : '생성'} 중 오류가 발생했습니다.`;
  } finally {
    submitting.value = false;
  }
}

onMounted(loadAuction);
</script>
