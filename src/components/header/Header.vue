<template>
  <v-container style="background-color: #1e1e2f; min-height: 60px" fluid>
    <v-row align="center" justify="space-between">
      <!-- 좌측: 로고 -->
      <v-col cols="auto">
        <router-link to="/home" style="display: inline-block">
          <img :src="logo" alt="로고" style="height: 100px; cursor: pointer" />
        </router-link>
      </v-col>

      <!-- 우측: 사용자 메뉴 -->
      <v-col cols="auto">
        <v-menu>
          <template #activator="{ props }">
            <v-btn v-bind="props" color="primary" variant="text">
              <v-avatar size="28" class="mr-2">
                <v-icon>mdi-account</v-icon>
              </v-avatar>
              <span class="text-body-2 font-weight-medium">{{ account.name }}</span>
              <v-icon right size="18">mdi-chevron-down</v-icon>
            </v-btn>
          </template>
          <v-list>
            <v-list-item title="Config" @click="router.push('/config')" />
            <v-list-item title="Logout" @click="logout" />
          </v-list>
        </v-menu>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useAccountStore } from '@/stores/useAccountStore';

import logo from '@/assets/hq_logo7.png';

const router = useRouter();
const account = useAccountStore();

function logout() {
  //auth.logout();
  router.push('/login');
}
</script>
