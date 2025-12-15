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

              <!-- <v-chip size="small" label>{{ my.roleLabel }}</v-chip> -->
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
            title="공지"
            @click="section = 'notice'"
          />

          <v-list-item
            :active="section === 'players'"
            prepend-icon="mdi-account-multiple-outline"
            title="플레이어"
            :to="CLAN_PLAYER_PATH.BASE"
          />

          <v-list-item
            v-if="isManager"
            :active="section === 'settings'"
            prepend-icon="mdi-cog-outline"
            title="설정"
            @click="section = 'settings'"
          />
        </v-list>

        <v-spacer />

        <v-divider class="my-2" />

        <v-list nav density="compact">
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
import { can } from '@/stores/usePermissionStore';
import { useAccountStore } from '@/stores/useAccountStore';
import { getBaseUrl } from '@/@core/composable/createUrl';
import api from '@/@core/composable/useAxios';
import { useRouter } from 'vue-router';
import { CLAN_PLAYER_PATH } from '@/router/clan/type';

const router = useRouter();

const account = useAccountStore();

const leaveDialog = ref(false);

const openGroups = ref<Record<string, boolean>>({
  Solution: false,
  Customer: false,
  Pipeline: false,
});

async function leaveClan() {
  await api.post(`${getBaseUrl('DATA')}/account/update`, {
    id: account.id,
    clan_id: null,
  });

  leaveDialog.value = false;
  router.replace('/clan');
}
</script>
