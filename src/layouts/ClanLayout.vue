<template>
  <v-app>
    <HeaderBar />
    <v-layout>
      <v-navigation-drawer width="280" permanent class="pa-2">
        <v-card rounded="lg" variant="outlined" class="mb-2">
          <v-card-text>
            <div class="d-flex align-center justify-space-between">
              <div>
                <div class="text-subtitle-1 font-weight-bold">
                  {{ account.clan.name }}
                </div>
                <!-- <div class="text-caption text-medium-emphasis">
                  멤버 {{ clan.members }}/{{ clan.capacity }} · Lv. {{ clan.level }}
                </div> -->
              </div>

              <v-chip size="small" label>{{ account.clanrole.name }}</v-chip>
            </div>

            <div class="mt-3 d-flex gap-2">
              <v-btn
                block
                color="primary"
                variant="tonal"
                prepend-icon="mdi-share-variant"
                @click="copyInvite"
              >
                초대코드
              </v-btn>
            </div>
          </v-card-text>
        </v-card>

        <v-divider class="my-2" />
        <v-list nav density="comfortable">
          <v-list-item
            :active="section === 'notice'"
            prepend-icon="mdi-bullhorn-outline"
            title="공지 사항"
            :to="CLAN_PATH.NOTICE(account.clan.name)"
            @click="section = 'notice'"
          />

          <v-list-item
            :active="section === 'enquire'"
            prepend-icon="mdi-help-circle-outline"
            title="문의 사항"
            :to="CLAN_PATH.ENQUIRE(account.clan.name)"
            @click="section = 'enquire'"
          />

          <v-list-item
            v-if="can('PLAYER', 'CLAN-SET-PLAYER-R')"
            :active="section === 'players'"
            prepend-icon="mdi-gamepad-variant-outline"
            title="플레이어"
            :to="CLAN_PATH.PLAYER(account.clan.name)"
            @click="section = 'players'"
          />

          <v-list-item
            v-if="can('ACCOUNT', 'CLAN-SET-ACC-R')"
            :active="section === 'accounts'"
            prepend-icon="mdi-account-group-outline"
            title="멤버"
            :to="CLAN_PATH.ACCOUNT(account.clan.name)"
            @click="section = 'accounts'"
          />

          <v-list-item
            v-if="can('MATCH', 'CLAN-SET-MATCH-R')"
            :active="section === 'matches'"
            prepend-icon="mdi-sword-cross"
            title="내전 매치"
            :to="CLAN_PATH.MATCH(account.clan.name)"
            @click="section = 'matches'"
          />

          <v-list-item
            v-if="can('CUP', 'CLAN-SET-CUP-R')"
            :active="section === 'cups'"
            prepend-icon="mdi-trophy-outline"
            title="내전 컵"
            :to="CLAN_PATH.CUP(account.clan.name)"
            @click="section = 'cups'"
          />

          <v-list-item
            v-if="account.clanrole.name == 'master'"
            :active="section === 'setting'"
            prepend-icon="mdi-cog-outline"
            title="설정"
            :to="CLAN_PATH.SETTING(account.clan.name)"
            @click="section = 'setting'"
          />
        </v-list>

        <v-spacer />

        <v-divider class="my-2" />

        <v-list nav density="compact">
          <v-list-item
            prepend-icon="mdi-account-search-outline"
            title="클랜 찾기"
            :to="CLAN_PATH.BASE"
          />
          <v-list-item
            prepend-icon="mdi-exit-run"
            title="클랜 나가기"
            @click="leaveDialog = true"
          />
        </v-list>
      </v-navigation-drawer>

      <v-main>
        <router-view />
      </v-main>

      <v-dialog v-model="leaveDialog" max-width="460">
        <v-card rounded="xl">
          <v-card-title class="text-h6 font-weight-bold">클랜 탈퇴</v-card-title>
          <v-card-text class="text-body-2 text-medium-emphasis">
            클랜을 탈퇴 하시겠습니까?
          </v-card-text>
          <v-card-actions class="justify-end">
            <v-btn variant="text" @click="leaveDialog = false">취소</v-btn>
            <v-btn color="error" @click="leaveClan">나가기</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-layout>
  </v-app>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import HeaderBar from '@/components/header/Header.vue';
import { can } from '@/stores/useClanPermissionStore';
import { useAccountStore } from '@/stores/useAccountStore';
import { getBaseUrl } from '@/@core/composable/createUrl';
import api from '@/@core/composable/useAxios';
import { useRouter } from 'vue-router';
import { CLAN_PATH } from '@/router/clan/type';

const router = useRouter();

const account = useAccountStore();

const leaveDialog = ref(false);

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
      icon: 'mdi-gamepad-variant',
      to: '/config/player',
    });
  }

  if (can('TIER', 'SYS-SET-TIER-R')) {
    items.push({
      title: 'Tier',
      icon: 'mdi-trophy-outline',
      to: '/config/tier',
    });
  }

  if (can('PROFILE', 'SYS-SET-PROFILE-R')) {
    items.push({
      title: 'Profile',
      icon: 'mdi-id-card',
      to: '/config/profile',
    });
  }

  if (can('PERMISSION', 'SYS-SET-PMS-R')) {
    items.push({
      title: 'Permission',
      icon: 'mdi-shield-lock-outline',
      children: [
        { title: 'System', icon: 'mdi-server-cog', to: '/config/permission/system' },
        { title: 'Clan', icon: 'mdi-server-cog', to: '/config/permission/clan' },
      ],
    });
  }

  return items;
});

async function leaveClan() {
  await api.post(`${getBaseUrl('DATA')}/account/leave_clan`, {
    id: account.id,
    clan_id: null,
    player_id: null,
  });

  leaveDialog.value = false;
  router.replace('/clan');
}
</script>
