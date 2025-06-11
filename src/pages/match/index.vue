<template>
  <v-container>
    <v-row class="mb-2" align="center">
      <v-col cols="12" sm="1" md="2">
        <v-text-field
          v-model="search"
          label="Search"
          density="compact"
          hide-details
          clearable
          append-inner-icon="mdi-magnify"
          @keyup.enter="handleSearch"
          @click:clear="handleClear"
        />
      </v-col>
      <v-col cols="auto">
        <v-btn color="primary" @click="handleSearch"> "SEARCH" </v-btn>
      </v-col>

      <v-spacer />

      <v-col cols="auto">
        <v-btn color="secondary" @click="$router.push(MATCH_PATH.ADD)">
          "ADD"
        </v-btn>
      </v-col>
    </v-row>

    <server-data-table
      :headers="headers"
      :items="serverItems"
      :items-length="totalItems"
      :items-per-page="itemsPerPage"
      :loading="loading"
      :search="search"
      @update:options="loadItems"
    >
      <template #item.actions="{ item }">
        <v-tooltip text="수정">
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              icon
              variant="text"
              color="primary"
              density="comfortable"
              @click="modifyItem(item)"
            >
              <v-icon size="18"> mdi-pencil </v-icon>
            </v-btn>
          </template>
        </v-tooltip>

        <v-tooltip text="삭제">
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              icon
              variant="text"
              color="error"
              density="comfortable"
              @click="deleteItem(item)"
            >
              <v-icon size="18"> mdi-delete </v-icon>
            </v-btn>
          </template>
        </v-tooltip>
      </template>

      <!-- <template v-slot:item.actions="{ item }">
        <v-menu location="bottom end">
          <template #activator="{ props }">
            <v-btn v-bind="props" icon variant="text" density="comfortable">
              <v-icon size="20">mdi-dots-vertical</v-icon>
            </v-btn>
          </template>
  
          <v-list>
            <v-list-item @click="modifyItem(item)">
              <v-list-item-title>수정</v-list-item-title>
            </v-list-item>
            <v-list-item @click="deleteItem(item)">
              <v-list-item-title class="text-error">삭제</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </template> -->

      <template #item.created_at="{ item }">
        {{ item.created_at.slice(0, 10) }}
      </template>

      <template #item.updated_at="{ item }">
        {{ item.updated_at.slice(0, 10) }}
      </template>
    </server-data-table>
  </v-container>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
//import { MERCHANDISE_PATH } from '@/router/merchandise/type';
import { getBaseUrl } from "@/@core/composable/createUrl";
//import api from '@/@core/composable/useAxios';
import type { VDataTableServer } from "vuetify/components";
import { MATCH_PATH } from "@/router/match/type";
//import ServerDataTable from '@/components/common/ServerDataTable.vue';

const search = ref<string>("");
//const serverItems = ref<Customer[]>([]);
const loading = ref<boolean>(false);
const totalItems = ref<number>(0);
const router = useRouter();

const serverItems = ref<Customer[]>([
  {
    id: 1,
    name: "세운세운의 내전",
    company: {
      name: "오토크립트",
    },
    created_at: "2025-06-01T10:00:00Z",
    updated_at: "2025-06-05T15:00:00Z",
  },
  {
    id: 2,
    name: "김차라님의 내전",
    company: {
      name: "현대오토에버",
    },
    created_at: "2025-05-20T09:30:00Z",
    updated_at: "2025-06-03T12:45:00Z",
  },
  {
    id: 3,
    name: "김민재님의 내전",
    company: {
      name: "삼성SDS",
    },
    created_at: "2025-04-15T14:00:00Z",
    updated_at: "2025-06-02T08:20:00Z",
  },
  {
    id: 4,
    name: "갈리오의 자유랭크",
    company: {
      name: "LG CNS",
    },
    created_at: "2025-03-12T11:10:00Z",
    updated_at: "2025-06-01T16:50:00Z",
  },
]);

interface Customer {
  id: number;
  name: string;
  company: {
    name: string;
  };
  created_at: string;
  updated_at: string;
}

interface FetchParams {
  keyword: string;
  page: number;
  itemsPerPage: number;
  sortBy: { key: keyof Customer; order: "asc" | "desc" }[];
}

interface FetchResponse {
  items: Customer[];
  total: number;
}

const itemsPerPage = ref<number>(10);
const headers = ref<VDataTableServer["headers"]>([
  {
    title: "name",
    sortable: true,
    key: "name",
  },
  { title: "Created", key: "created_at", sortable: true },
  { title: "Updated", key: "updated_at", sortable: true },
  {
    title: "Actions",
    key: "actions",
    sortable: false,
    align: "center",
    width: "1px",
  },
]);

// ✅ 데이터 로드 함수
async function loadItems(options: FetchParams) {
  try {
    const sortKey = options.sortBy[0]?.key || "created_at";
    const sortOrder = options.sortBy[0]?.order || "desc";

    // const response = await api.get(
    //   `${getBaseUrl('DATA')}/merchandise/search?keyword=${search.value}&page=${
    //     options.page
    //   }&itemsPerPage=${options.itemsPerPage}&sortBy=${sortKey}&orderBy=${sortOrder}`,
    // );

    // loading.value = true;
    // serverItems.value = response.data.datas;
    // totalItems.value = response.data.totalCount;
    // loading.value = false;
  } catch (error) {
    console.error("기업 목록 불러오기 실패:", error);
  }
}

function modifyItem(item: Customer) {
  //router.push(MERCHANDISE_PATH.MODIFY(item.id));
}

async function deleteItem(item: Customer) {
  if (confirm(`정말로 '${item.name}'을(를) 삭제하시겠습니까?`)) {
    try {
      //   await api.post(`${getBaseUrl('DATA')}/merchandise/delete`, { id: item.id });
      //   alert('삭제 완료!');
      //   loadItems({
      //     keyword: '',
      //     page: 1,
      //     itemsPerPage: itemsPerPage.value,
      //     sortBy: [],
      //   }); // 목록 갱신
    } catch (error) {
      console.error("삭제 실패:", error);
      alert("삭제 중 오류가 발생했습니다.");
    }
  }
}

function handleSearch() {
  loadItems({
    keyword: search.value,
    page: 1,
    itemsPerPage: itemsPerPage.value,
    sortBy: [],
  });
}

function handleClear() {
  search.value = "";
  handleSearch();
}
</script>

<style scoped></style>
