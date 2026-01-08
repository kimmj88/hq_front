<template>
  <v-app>
    <HeaderBar
      :drawer-open="drawerOpen"
      :is-mobile="isMobile"
      @toggle-drawer="drawerOpen = !drawerOpen"
    />

    <v-layout>
      <v-navigation-drawer
        v-model="drawerOpen"
        :rail="drawerRail"
        :rail-width="72"
        width="280"
        :permanent="!isMobile"
        :temporary="isMobile"
        class="pa-2"
      >
        <!-- ✅ drawer 상단에 토글 버튼 하나 추가 -->
        <div class="d-flex justify-end mb-2">
          <v-btn icon variant="text" density="comfortable" @click="toggleRail">
            <v-icon>{{ drawerRail ? 'mdi-chevron-right' : 'mdi-chevron-left' }}</v-icon>
          </v-btn>
        </div>

        <v-card rounded="lg" variant="outlined" class="mb-2" v-show="!drawerRail">
          <v-card-text>
            <div class="d-flex align-center justify-space-between">
              <div>
                <div class="text-subtitle-1 font-weight-bold">
                  {{ account.clan.name }}
                </div>
              </div>

              <v-chip size="small" label>{{ account.clanrole.name }}</v-chip>
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
        <!-- ✅ 모바일에서 본문 클릭 시 drawer 닫히게 하고 싶으면 옵션 -->
        <router-view />
      </v-main>

      <!-- 기존 dialog 그대로 -->
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

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useDisplay } from 'vuetify'; // ✅ 추가
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

// ✅ Vuetify breakpoint
const { smAndDown } = useDisplay();
const isMobile = computed(() => smAndDown.value);

// ✅ drawer open/close + rail(축소)
const drawerOpen = ref(true);
const drawerRail = ref(false);

function toggleRail() {
  if (isMobile.value) {
    drawerOpen.value = false; // ✅ 모바일은 닫기
    return;
  }
  drawerRail.value = !drawerRail.value; // ✅ 데스크탑은 rail 토글
}

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
