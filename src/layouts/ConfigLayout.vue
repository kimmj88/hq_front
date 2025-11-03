<template>
  <v-app>
    <HeaderBar />
    <v-layout>
      <v-navigation-drawer :width="251" permanent>
        <v-list-item title="Autocrypt" subtitle="CORE" />
        <v-divider />

        <v-list density="comfortable" nav>
          <template v-for="group in menuItems" :key="group.title">
            <v-list-group
              v-if="group.children && group.children.length"
              v-model="openGroups[group.title]"
              :value="group.title"
              :prepend-icon="group.icon"
            >
              <template #activator="{ props }">
                <v-list-item v-bind="props" :title="group.title" />
              </template>
              <v-list-item
                v-for="item in group.children"
                :key="item.title"
                :title="item.title"
                :to="item.to"
                link
                class="ms-4"
              />
            </v-list-group>

            <v-list-item
              v-else
              :prepend-icon="group.icon"
              :title="group.title"
              :to="group.to"
              link
            />
          </template>
        </v-list>
      </v-navigation-drawer>

      <v-main>
        <router-view />
      </v-main>
    </v-layout>
  </v-app>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import HeaderBar from '@/components/header/Header.vue';
import { can } from '@/stores/usePermissionStore';

const menuItems = computed(() => {
  const items = [];

  if (can('ACCOUNT', 'SYS-SET-ACC-R')) {
    items.push({
      title: 'Account',
      icon: 'mdi-account-supervisor-circle',
      to: '/config/account',
    });
  }

  if (can('PLAYER', 'SYS-SET-PLAYER-R')) {
    items.push({
      title: 'Player',
      icon: 'mdi-account-supervisor-circle',
      to: '/config/player',
    });
  }

  if (can('TIER', 'SYS-SET-TIER-R')) {
    items.push({
      title: 'Tier',
      icon: 'mdi-account-supervisor-circle',
      to: '/config/tier',
    });
  }

  if (can('PROFILE', 'SYS-SET-PROFILE-R')) {
    items.push({
      title: 'Profile',
      icon: 'mdi-account-supervisor-circle',
      to: '/config/profile',
    });
  }

  if (can('PERMISSION', 'SYS-SET-PMS-R')) {
    items.push({
      title: 'Permission',
      icon: 'mdi-shield-lock-outline',
      children: [{ title: 'System', to: '/config/permission/system' }],
    });
  }

  return items;
});

const openGroups = ref<Record<string, boolean>>({
  Solution: false,
  Customer: false,
  Pipeline: false,
});
</script>
