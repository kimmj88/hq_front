<template>
  <v-container style="background-color: #1e1e2f; min-height: 60px" fluid>
    <v-row align="center" justify="center" style="position: relative">
      <!-- 로고 -->
      <v-col cols="auto">
        <router-link to="/home" style="display: inline-block">
          <img
            :src="logo"
            alt="로고"
            style="height: 120px; width: 1400px; display: block; cursor: pointer"
          />
        </router-link>
      </v-col>

      <!-- 사용자 메뉴: 오른쪽 상단 고정 -->
      <v-col cols="auto" style="position: absolute; right: 16px">
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
import Cookies from 'js-cookie';
import { useRouter } from 'vue-router';
import { useAccountStore } from '@/stores/useAccountStore';

import logo from '@/assets/hq_logo10.png';

const router = useRouter();
const account = useAccountStore();

function logout() {
  Cookies.remove('refreshToken');
  router.push('/login');
}
</script>
