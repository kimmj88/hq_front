<template>
  <v-container fluid class="d-flex align-center justify-center" style="min-height: 100vh">
    <v-card max-width="520" class="pa-8 text-center" rounded="xl" elevation="6">
      <v-icon size="72" color="error" class="mb-4"> mdi-shield-lock-outline </v-icon>

      <div class="text-h4 font-weight-bold mb-2">접근 권한이 없습니다</div>

      <div class="text-body-1 text-medium-emphasis mb-6">
        이 페이지에 접근할 권한이 없어요.<br />
        권한이 필요하다면 클랜 관리자에게 문의하세요.
      </div>

      <v-divider class="mb-6" />

      <div class="d-flex justify-center gap-3">
        <v-btn color="primary" variant="flat" prepend-icon="mdi-home" @click="goHome">
          홈으로
        </v-btn>

        <v-btn variant="tonal" prepend-icon="mdi-arrow-left" @click="goBack"> 이전 페이지 </v-btn>
      </div>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();

function goHome() {
  router.push('/home'); // 너 홈 경로에 맞게 수정
}

function goBack() {
  router.back();
}
</script>
