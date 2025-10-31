<template>
  <v-container>
    <v-row class="mb-2" align="center">
      <v-col cols="12" sm="1" md="2">
        <v-text-field
          v-model="search"
          :label="$t('form_control.search_textbox.label')"
          density="compact"
          hide-details
          clearable
          append-inner-icon="mdi-magnify"
          @keyup.enter="handleSearch"
          @click:clear="handleClear"
        />
      </v-col>
      <v-col cols="auto">
        <v-btn color="primary" @click="handleSearch">
          {{ $t('form_control.button.search') }}
        </v-btn>
      </v-col>

      <v-spacer />
      <v-col cols="auto">
        <v-btn
          v-if="can('PERMISSION', 'SYS-SET-PMS-C')"
          color="secondary"
          @click="openCreateDialog"
        >
          {{ $t('form_control.button.add') }}
        </v-btn>
      </v-col>
    </v-row>
  </v-container>
  <v-container>
    <server-data-table
      :headers="headers"
      :items="serverItems"
      :items-length="totalItems"
      :items-per-page="itemsPerPage"
      :loading="loading"
      :search="search"
      @update:options="loadItems"
    >
      <template #item.created_at="{ item }">
        {{ item.created_at?.slice(0, 10) }}
      </template>

      <template #item.updated_at="{ item }">
        {{ item.updated_at?.slice(0, 10) }}
      </template>
      <!-- 액션 -->
      <template #item.actions="{ item }">
        <v-menu location="bottom">
          <template #activator="{ props }">
            <v-btn icon variant="text" v-bind="props">
              <v-icon>mdi-dots-vertical</v-icon>
            </v-btn>
          </template>
          <v-list>
            <v-list-item v-if="can('PERMISSION', 'SYS-SET-PMS-U')" @click="editItem(item)">
              <v-list-item-title>{{ $t('form_control.button.edit') }}</v-list-item-title>
            </v-list-item>
            <v-list-item v-if="can('PERMISSION', 'SYS-SET-PMS-D')" @click="deleteItem(item)">
              <v-list-item-title class="text-error">
                {{ $t('form_control.button.delete') }}
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </template>
    </server-data-table>

    <v-dialog v-model="editDialog" max-width="800">
      <v-card>
        <v-card-title v-if="!isCreating">
          <span class="text-h6">{{ selectedRole?.name }}</span>
          <v-spacer />
        </v-card-title>

        <v-text-field
          v-if="isCreating"
          v-model="inputRoleName"
          label="역할 이름"
          density="compact"
          class="mt-2 mb-2"
        />

        <v-card-text>
          <v-expansion-panels v-model="expandedPanels" multiple>
            <v-expansion-panel v-for="(group, gIdx) in editedPermissions" :key="group.code">
              <v-expansion-panel-title class="text-subtitle-1 font-weight-bold">
                {{ group.code }}
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <v-row>
                  <v-col v-for="(perm, pIdx) in group.children" :key="perm.code" cols="12" sm="6">
                    <v-checkbox
                      v-model="editedPermissions[gIdx].children[pIdx].access"
                      :disabled="
                        ['admin', 'general'].includes(selectedRole?.name as string) && !isCreating
                      "
                      :label="$t('system_permission.' + perm.code)"
                      hide-details
                      density="compact"
                    />
                  </v-col>
                </v-row>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" color="grey" @click="editDialog = false">
            {{ $t('form_control.button.cancel') }}
          </v-btn>
          <v-btn variant="flat" color="primary" @click="savePermissions">
            {{ $t('form_control.button.save') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { getBaseUrl } from '@/@core/composable/createUrl';
import api from '@/@core/composable/useAxios';
import { can } from '@/stores/usePermissionStore';
import type { PermissionGroup, SystemRole } from '@/data/types/systemrole';
import type { VDataTableServer } from 'vuetify/components';
import ServerDataTable from '@/components/common/ServerDataTable.vue';

// 기존 변수들
const itemsPerPage = ref(10);
const search = ref('');
const serverItems = ref<SystemRole[]>([]);
const loading = ref(true);
const totalItems = ref(0);

// 다이얼로그 상태 및 수정용 데이터
const isCreating = ref(false); // 생성인지 수정인지 구분
const editDialog = ref(false);
const selectedRole = ref<SystemRole | null>(null);
const inputRoleName = ref<string>('');
const editedPermissions = ref<PermissionGroup[]>([]);
const expandedPanels = ref<number[]>([]);

debugger;

const headers: VDataTableServer['headers'] = [
  { title: 'NAME', key: 'name' },
  { title: 'CREATED', key: 'created_at' },
  { title: 'UPDATED', key: 'updated_at' },
  { title: 'ACTIONS', key: 'actions', sortable: false, align: 'center', width: '1px' },
] as const;

// edit 클릭 → 다이얼로그 열기
async function editItem(item: SystemRole) {
  isCreating.value = false;
  selectedRole.value = item;
  try {
    const response = await api.get(`${getBaseUrl('DATA')}/systemrole/find?id=${item.id}`);
    const raw = response.data.datas;
    selectedRole.value = response.data.datas;
    editedPermissions.value = JSON.parse(JSON.stringify(selectedRole.value?.permissionGroups));
    expandedPanels.value = editedPermissions.value.map((_, idx) => idx);
    editDialog.value = true;
  } catch (error) {
    console.error('회사 정보 불러오기 실패:', error);
  }
}

async function openCreateDialog() {
  isCreating.value = true;

  try {
    const response = await api.get(`${getBaseUrl('DATA')}/systempermission/all`);
    const rawPermissions: PermissionGroup[] = response.data.datas;
    editedPermissions.value = JSON.parse(JSON.stringify(response.data.datas));
    expandedPanels.value = rawPermissions.map((_, idx) => idx);
    editDialog.value = true;
  } catch (error) {
    console.error('회사 정보 불러오기 실패:', error);
  }
}

// 저장 버튼
async function savePermissions() {
  try {
    if (isCreating.value) {
      if (!inputRoleName.value.trim()) {
        alert('역할 이름은 필수 항목입니다.');
        return;
      }

      await api.post(`${getBaseUrl('DATA')}/systemrole/create`, {
        name: inputRoleName.value,
        permissionGroups: editedPermissions.value,
      });
      inputRoleName.value = '';
    } else {
      await api.post(`${getBaseUrl('DATA')}/systemrole/sync`, {
        id: selectedRole.value?.id,
        permissionGroups: editedPermissions.value,
      });
    }
  } catch (error) {
    console.error('저장 실패:', error);
    alert('저장 중 오류가 발생했습니다.');
  }

  editDialog.value = false;
  isCreating.value = false;
  handleSearch(); // 리스트 리프레시
}

async function deleteItem(item: SystemRole) {
  const confirmed = confirm(`정말로 "${item.name}" 역할을 삭제하시겠습니까?`);
  if (!confirmed) return;

  try {
    await api.post(`${getBaseUrl('DATA')}/systemrole/delete`, {
      id: item.id,
    });

    alert('삭제하였습니다.');
    handleSearch();
  } catch (error) {
    console.error('삭제 실패:', error);
    alert('삭제 중 오류가 발생했습니다.');
  }
}

async function loadItems(options: any) {
  debugger;
  try {
    const sortKey = options.sortBy?.[0]?.key || 'created_at';
    const sortOrder = options.sortBy?.[0]?.order || 'desc';

    const response = await api.get(
      `${getBaseUrl('DATA')}/systemrole/search?keyword=${search.value}&page=${
        options.page
      }&itemsPerPage=${options.itemsPerPage}&sortBy=${sortKey}&orderBy=${sortOrder}`
    );

    serverItems.value = response.data.datas;
    totalItems.value = response.data.totalCount;
    loading.value = false;
  } catch (error) {
    console.error('역할 목록 불러오기 실패:', error);
  }
}

function handleSearch() {
  loadItems({ keyword: search.value, page: 1, itemsPerPage: itemsPerPage.value, sortBy: [] });
}
function handleClear() {
  search.value = '';
  handleSearch();
}
</script>

<style scoped></style>
