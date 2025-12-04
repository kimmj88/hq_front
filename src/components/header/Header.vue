<template>
  <v-container style="background-color: #1e1e2f; min-height: 60px" fluid>
    <v-row align="center" justify="center" style="position: relative">
      <!-- 로고 -->
      <v-col cols="auto">
        <router-link to="/home" style="display: inline-block">
          <img
            :src="logo"
            alt="로고"
            style="height: 130px; width: 2000px; display: block; cursor: pointer"
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
              <span class="text-body-2 font-weight-medium">{{ account.nickname }}</span>
              <v-icon right size="18">mdi-chevron-down</v-icon>
            </v-btn>
          </template>
          <v-list>
            <v-list-item v-if="can('SETTING', 'SET-R')" :to="'/config'" router>
              <template #prepend>
                <v-icon>mdi-cog</v-icon>
              </template>
              <v-list-item-title>Config</v-list-item-title>
            </v-list-item>

            <v-list-item :to="CONFIG_ACCOUNT_PATH.VIEW(account.id)" router>
              <template #prepend>
                <v-icon>mdi-account-circle-outline</v-icon>
              </template>
              <v-list-item-title>My Account</v-list-item-title>
            </v-list-item>

            <v-list-item @click="logout">
              <template #prepend>
                <v-icon>mdi-logout</v-icon>
              </template>
              <v-list-item-title>Logout</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { can } from '@/stores/usePermissionStore';
import Cookies from 'js-cookie';
import { useRouter } from 'vue-router';
import { useAccountStore } from '@/stores/useAccountStore';
import { CONFIG_ACCOUNT_PATH } from '@/router/config/type';

import logo from '@/assets/hq_logo11.jpeg';

const router = useRouter();
const account = useAccountStore();

function logout() {
  Cookies.remove('refreshToken');
  router.push('/login');
}
</script>
