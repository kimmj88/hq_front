<!-- components/header/HeaderNav.vue -->
<template>
  <v-container fluid class="px-4 mt-0">
    <v-row dense>
      <v-col v-for="(item, index) in menuItems" :key="item.key" cols="auto">
        <!-- 드롭다운 메뉴 -->
        <v-menu v-if="(item as MenuItem).children" v-model="openIndex[index]" offset-y>
          <template #activator="{ props }">
            <v-btn
              variant="text"
              class="tab-btn"
              v-bind="props"
              :class="{ active: currentTab === item.key }"
              @click="currentTab = item.key"
            >
              <v-icon start size="16">{{ item.icon }}</v-icon>
              {{ item.title }}
              <v-icon end size="16">mdi-chevron-down</v-icon>
            </v-btn>
          </template>

          <v-list>
            <v-list-item
              v-for="(child, i) in item.children"
              :key="child.to"
              @click="router.push(child.to)"
            >
              <v-list-item-title>{{ child.title }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>

        <!-- 일반 버튼 -->
        <v-btn
          v-else
          variant="text"
          class="tab-btn"
          :class="{ active: currentTab === item.key }"
          @click="router.push(item.to as string)"
        >
          <v-icon start size="16">{{ item.icon }}</v-icon>
          {{ item.title }}
        </v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { can } from '@/stores/usePermissionStore';
import { CLAN_PATH } from '@/router/clan/type';
import { useAccountStore } from '@/stores/useAccountStore';

const account = useAccountStore();

const router = useRouter();

const openIndex = ref<Record<number, boolean>>({});
const currentTab = ref('');

interface MenuItem {
  key: string;
  title: string;
  icon: string;
  to?: string;
  children?: { title: string; to: string }[];
}

const menuItems = computed(() => {
  const items = [];

  items.push({
    key: 'home',
    title: 'Home',
    icon: 'mdi-home',
    to: '/home',
  });

  items.push({
    key: 'board',
    title: '공지사항',
    icon: 'mdi-view-dashboard-outline',
    to: '/board',
  });

  items.push({
    key: 'forum',
    title: '자유게시판',
    icon: 'mdi-forum-outline',
    to: '/forum',
  });

  items.push({
    key: 'enquire',
    title: '문의게시판',
    icon: 'mdi-help-circle-outline',
    to: '/enquire',
  });

  if (account.clan != null) {
    items.push({
      key: 'clan',
      title: '클랜',
      icon: 'mdi-account-group-outline',
      to: `${CLAN_PATH.VIEW(account.clan.name)}`,
    });
  } else {
    items.push({
      key: 'clan',
      title: '클랜',
      icon: 'mdi-account-group-outline',
      to: `/clan`,
    });
  }

  return items;
});
</script>
