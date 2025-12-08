<template>
  <v-container>
    <!-- 제목 영역 -->
    <v-card class="pa-4 mb-4">
      <h2 class="text-h6 mb-2">{{ enquire.title }}</h2>
      <div class="text-caption text-grey-darken-1">
        작성자: {{ enquire.writer }} · 등록일: {{ enquire.createdAt }} · 조회수:
        {{ enquire.viewCount }}
      </div>
    </v-card>

    <!-- 본문 영역 -->
    <v-card class="pa-6 mb-4">
      <!-- 내부 HTML을 그대로 출력할 수 있는 예시 -->
      <div v-html="enquire.content"></div>
    </v-card>

    <!-- 버튼 영역 -->
    <div class="d-flex justify-end gap-2">
      <v-btn variant="tonal" @click="goList">목록</v-btn>
      <v-btn
        v-if="can('ENQUIRE', 'SYS-SET-ENQUIRE-U')"
        color="primary"
        :to="ENQUIRE_PATH.EDIT(route.params.id)"
        >수정</v-btn
      >
      <v-btn v-if="can('ENQUIRE', 'SYS-SET-ENQUIRE-D')" color="error" @click="deleteEnquire"
        >삭제</v-btn
      >
    </div>
  </v-container>
</template>

<script setup lang="ts">
import { getBaseUrl } from '@/@core/composable/createUrl';
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '@/@core/composable/useAxios';
import { ENQUIRE_PATH } from '@/router/enquire/type';
import { can } from '@/stores/usePermissionStore';

interface EnquireDetail {
  id: number;
  title: string;
  writer: string;
  createdAt: string;
  viewCount: number;
  content: string;
}

const route = useRoute();
const router = useRouter();

const enquire = ref<EnquireDetail>({
  id: 0,
  title: '',
  writer: '',
  createdAt: '',
  viewCount: 0,
  content: '',
});

// 게시글 로딩 (샘플 데이터)
const loadEnquire = async () => {
  debugger;
  const id = Number(route.params.id);

  const { data } = await api.get(`${getBaseUrl('DATA')}/enquire/find?id=${route.params.id}`);

  enquire.value = {
    id,
    title: data.datas.title,
    writer: data.datas.account.nickname,
    createdAt: data.datas.created_at,
    viewCount: 0,
    content: data.datas.description,
  };

  debugger;
};

const goList = () => router.push('/enquire');

const editEnquire = () => {
  router.push(ENQUIRE_PATH.EDIT(route.params.id as any));
};

const deleteEnquire = async () => {
  if (confirm('정말 삭제하시겠습니까?')) {
    await api.post(`${getBaseUrl('DATA')}/enquire/delete`, {
      id: +route.params.id,
    });
    goList();
  }
};

onMounted(loadEnquire);
</script>
