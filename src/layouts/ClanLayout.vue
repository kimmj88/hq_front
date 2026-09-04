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
            <v-icon>
              {{ drawerOpen ? 'mdi-chevron-left' : 'mdi-chevron-right' }}
            </v-icon>
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
            :active="section === 'home'"
            prepend-icon="mdi-home"
            title="홈"
            :to="CLAN_PATH.VIEW(account.clan.name)"
            @click="section = 'home'"
          />
          <v-list-item
            :active="section === 'explore'"
            prepend-icon="mdi-telescope"
            title="클랜 엿보기"
            :to="CLAN_PATH.BASE"
            @click="section = 'explore'"
          />
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
            v-if="account.isClanMaster || can('PARTY', 'CLAN-SET-PARTY-R')"
            :active="section === 'party'"
            prepend-icon="mdi-account-multiple-plus-outline"
            title="파티 구하기"
            :to="CLAN_PATH.PARTY(account.clan.name)"
            @click="section = 'party'"
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
            v-if="can('AUCTION', 'CLAN-SET-AUCTION-R')"
            :active="section === 'auction'"
            prepend-icon="mdi-gavel"
            title="경매 내전"
            :to="CLAN_PATH.AUCTION(account.clan.name)"
            @click="section = 'auction'"
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
            class="support-link"
            prepend-icon="mdi-heart-outline"
            title="서비스 후원"
            @click="openSupport"
          />
          <v-list-item
            prepend-icon="mdi-account-search-outline"
            title="클랜 찾기"
            :to="CLAN_PATH.BASE"
          />
          <v-list-item
            prepend-icon="mdi-exit-run"
            title="클랜 나가기"
            :subtitle="account.isClanMaster ? '마스터 위임 후 탈퇴 가능' : undefined"
            :disabled="account.isClanMaster"
            @click="!account.isClanMaster && (leaveDialog = true)"
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
            {{ account.isClanMaster ? '클랜 마스터는 탈퇴할 수 없습니다. 다른 멤버에게 마스터를 위임해 주세요.' : '클랜을 탈퇴 하시겠습니까?' }}
            <v-alert v-if="leaveError" class="mt-4" type="error" variant="tonal" density="compact">
              {{ leaveError }}
            </v-alert>
          </v-card-text>
          <v-card-actions class="justify-end">
            <v-btn variant="text" @click="leaveDialog = false">취소</v-btn>
            <v-btn color="error" :disabled="account.isClanMaster" :loading="leaveLoading" @click="leaveClan">나가기</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <v-dialog v-model="supportDialog" max-width="500">
        <v-card class="support-dialog" rounded="xl" overflow-hidden>
          <div class="support-dialog__head">
            <div>
              <span>KAKAO PAY</span>
              <h2>서비스 후원</h2>
            </div>
            <v-btn icon="mdi-close" variant="text" color="#111827" @click="supportDialog = false" />
          </div>
          <v-card-text class="pa-0">
            <v-img
              src="/kakao-pay-qr.jpg"
              alt="김민재 카카오페이 후원 QR 코드"
              class="support-dialog__qr"
            />
            <p class="support-dialog__guide">
              카카오톡 또는 카카오페이의 코드 스캔으로 후원할 수 있습니다.
            </p>
          </v-card-text>
        </v-card>
      </v-dialog>
    </v-layout>
  </v-app>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useDisplay } from 'vuetify'; // ✅ 추가
import HeaderBar from '@/components/header/Header.vue';
import { can, useClanPermissionStore } from '@/stores/useClanPermissionStore';
import { useAccountStore } from '@/stores/useAccountStore';
import { getBaseUrl } from '@/@core/composable/createUrl';
import api from '@/@core/composable/useAxios';
import { useRouter } from 'vue-router';
import { CLAN_PATH } from '@/router/clan/type';

const router = useRouter();
const account = useAccountStore();
const clanPermissionStore = useClanPermissionStore();

const leaveDialog = ref(false);
const supportDialog = ref(false);
const leaveLoading = ref(false);
const leaveError = ref('');

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

function openSupport() {
  supportDialog.value = true;
  if (isMobile.value) drawerOpen.value = false;
}

async function leaveClan() {
  if (account.isClanMaster || leaveLoading.value) return;
  leaveLoading.value = true;
  leaveError.value = '';
  leaveDialog.value = false;
  try {
    await api.post(`${getBaseUrl('DATA')}/account/leave_clan`);
    account.clan = null;
    account.clanrole = null;
    clanPermissionStore.clear();
    window.location.replace('/clan');
  } catch (error: any) {
    leaveError.value = error?.response?.data?.message ?? '클랜을 탈퇴하지 못했습니다.';
    leaveDialog.value = true;
  } finally {
    leaveLoading.value = false;
  }
}
</script>

<style scoped>
.support-link {
  margin-bottom: 4px;
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.1);
}

.support-link :deep(.v-list-item-title) {
  font-size: 13px;
  font-weight: 800;
}

.support-dialog {
  background: #f7f7f8;
}

.support-dialog__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px;
  color: #111827;
  background: #fee500;
}

.support-dialog__head span {
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.14em;
}

.support-dialog__head h2 {
  margin: 2px 0 0;
  font-size: 23px;
  letter-spacing: -0.04em;
}

.support-dialog__qr {
  width: 80%;
  margin: 18px auto;
}

.support-dialog__guide {
  margin: 0;
  padding: 0 20px 20px;
  color: #374151;
  font-size: 13px;
  font-weight: 650;
  text-align: center;
}
</style>
