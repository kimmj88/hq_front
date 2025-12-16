<template>
  <v-container>
    <!-- 제목 영역 -->
    <v-card class="pa-4 mb-4">
      <h2 class="text-h6 mb-2">{{ enquire.title }}</h2>
      <div class="text-caption text-grey-darken-1">
        작성자: {{ enquire.writer }} · 등록일: {{ formatDateTime(enquire.createdAt) }} · 조회수:
        {{ enquire.viewCount }}
      </div>
    </v-card>

    <!-- 본문 영역 -->
    <v-card class="pa-6 mb-4">
      <!-- 내부 HTML을 그대로 출력할 수 있는 예시 -->
      <div v-html="enquire.content"></div>
    </v-card>

    <v-card class="pa-4 mb-4">
      <div class="d-flex justify-space-between align-center mb-3">
        <h3 class="text-subtitle-1">댓글 {{ enquire.comments.length }}</h3>
      </div>

      <v-divider class="mb-3" />

      <!-- 댓글 입력 -->
      <div class="d-flex align-start mb-4">
        <v-textarea
          v-model="newComment"
          rows="2"
          auto-grow
          placeholder="댓글을 입력하세요."
          class="flex-grow-1 mr-2"
        />
        <v-btn color="primary" :disabled="!newComment.trim()" @click="addComment"> 등록 </v-btn>
      </div>

      <!-- 댓글 리스트 -->
      <v-list v-if="enquire.comments.length">
        <v-list-item v-for="comment in enquire.comments" :key="comment.id" class="px-0">
          <v-list-item-title class="d-flex align-center">
            <span class="font-weight-medium mr-2">{{ comment.account.nickname }}</span>
            <span class="text-caption text-grey-darken-1">
              {{ formatDateTime(comment.created_at) }}
            </span>
          </v-list-item-title>

          <v-list-item-subtitle class="mt-1 comment-content">
            {{ comment.content }}
          </v-list-item-subtitle>

          <template #append>
            <v-btn
              v-if="comment.account.id == account.id"
              size="small"
              variant="text"
              color="error"
              @click="deleteComment(comment.id)"
            >
              삭제
            </v-btn>
          </template>
        </v-list-item>
      </v-list>

      <div v-else class="text-caption text-grey">아직 작성된 댓글이 없습니다.</div>
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
import { CLAN_PATH } from '@/router/clan/type';
import { can } from '@/stores/usePermissionStore';
import { useAccountStore } from '@/stores/useAccountStore';
import type { Comment } from '@/data/types/comment';
import { formatDateTime } from '@/utils/date';

const account = useAccountStore();

interface EnquireDetail {
  id: number;
  title: string;
  writer: string;
  createdAt: string;
  viewCount: number;
  content: string;
  comments: Comment[];
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
  comments: [],
});

// 게시글 로딩 (샘플 데이터)
const loadEnquire = async () => {
  const id = Number(route.params.id);

  const { data } = await api.get(`${getBaseUrl('DATA')}/enquire/find?id=${route.params.id}`);

  enquire.value = {
    id,
    title: data.datas.title,
    writer: data.datas.account.nickname,
    createdAt: data.datas.created_at,
    viewCount: 0,
    content: data.datas.description,
    comments: data.datas.comments,
  };
};

const goList = () => router.push('/enquire');

const deleteEnquire = async () => {
  if (confirm('정말 삭제하시겠습니까?')) {
    await api.post(`${getBaseUrl('DATA')}/enquire/delete`, {
      id: +route.params.id,
    });
    goList();
  }
};

const newComment = ref('');

const addComment = async () => {
  const content = newComment.value.trim();
  if (!content) return;

  await api.post(`${getBaseUrl('DATA')}/comment/create`, {
    ref_id: +route.params.id,
    content: content,
    type: 'ENQUIRE',
    account_id: account.id,
  });

  newComment.value = '';

  loadEnquire();
};

const deleteComment = async (id: number) => {
  const ok = confirm('정말 이 댓글을 삭제하시겠습니까?');
  if (!ok) return;

  await api.post(`${getBaseUrl('DATA')}/comment/delete`, {
    id,
  });

  loadEnquire();
};

onMounted(loadEnquire);
</script>
<style scoped>
.comment-content {
  white-space: normal !important;
  overflow: visible !important;
  -webkit-line-clamp: initial !important;
  display: block !important;
}
</style>
