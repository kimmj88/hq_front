<template>
  <v-container class="py-6">
    <v-row>
      <!-- 메인 설정 카드 -->
      <v-col cols="12" md="7">
        <v-card rounded="lg" variant="outlined">
          <v-card-title class="text-subtitle-1 font-weight-bold d-flex align-center">
            <v-icon class="mr-2">mdi-cog</v-icon>
            클랜 설정
          </v-card-title>

          <v-divider />

          <v-card-text class="pt-4">
            <!-- 클랜명 -->
            <v-text-field
              label="클랜명"
              v-model="account.clan.name"
              disabled
              variant="outlined"
              density="compact"
            />

            <!-- 클랜 소개 -->
            <v-textarea
              v-model="description"
              :disabled="!isClanMaster"
              label="클랜 소개"
              rows="4"
              variant="outlined"
              density="compact"
              counter="300"
            />

            <!-- <div class="text-caption text-medium-emphasis mb-2">클랜 배너 이미지</div>

            <v-file-input
              v-model="bannerFile"
              label="배너 이미지 선택"
              variant="outlined"
              density="compact"
              prepend-icon="mdi-image"
              accept="image/*"
              clearable
            />

            <v-card v-if="previewUrl" class="mt-3" variant="tonal" rounded="lg">
              <v-card-text class="pa-2">
                <v-img :src="previewUrl" height="160" cover class="rounded-lg" />
                <div class="text-caption text-medium-emphasis mt-2">배너 미리보기</div>
              </v-card-text>
            </v-card> -->

            <!-- 버튼 -->
            <div class="d-flex justify-end mt-4 gap-2">
              <v-btn
                v-if="account.clanrole.name == 'master'"
                color="primary"
                :loading="loading"
                @click="onSubmit"
              >
                저장
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- 우측 안내 -->
      <v-col cols="12" md="5">
        <v-card rounded="lg" variant="tonal">
          <v-card-title class="text-subtitle-1 font-weight-bold">안내</v-card-title>
          <v-divider />
          <v-card-text class="text-body-2 text-medium-emphasis">
            <ul class="pl-4">
              <li>클랜 소개는 최대 300자까지 작성할 수 있어.</li>
              <li>배너 이미지는 JPG / PNG 형식을 권장해.</li>
              <li>권장 비율은 4:1 (예: 1600 × 400)이야.</li>
            </ul>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { getBaseUrl } from '@/@core/composable/createUrl';
import { useAccountStore } from '@/stores/useAccountStore';
import api from '@/@core/composable/useAxios';

const account = useAccountStore();

const isClanMaster = computed(() => {
  return account.clanrole?.name === 'master';
});

const description = ref<string>(account.clan.description ?? '');
const bannerFile = ref<File | null>(null);
const previewUrl = ref<string | null>(null);
const loading = ref(false);

/** 파일 선택 시 미리보기 */
watch(bannerFile, (file) => {
  if (!file) {
    previewUrl.value = null;
    return;
  }
  previewUrl.value = URL.createObjectURL(file);
});

/** 되돌리기 */
function resetForm() {
  description.value = account.clan.description ?? '';
  bannerFile.value = null;
  previewUrl.value = null;
}

/** 저장 */
async function onSubmit() {
  try {
    loading.value = true;

    const formData = new FormData();
    formData.append('id', String(account.clan.id));
    formData.append('description', description.value);

    if (bannerFile.value) {
      formData.append('file', bannerFile.value);
    }

    await api.post(`${getBaseUrl('DATA')}/clan/update`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    // 성공 시 로컬 상태 반영
    account.clan.description = description.value;

    // TODO: 서버에서 banner_url 내려주면 같이 반영
  } catch (e) {
    console.error('클랜 설정 저장 실패', e);
  } finally {
    loading.value = false;
  }
}
</script>
