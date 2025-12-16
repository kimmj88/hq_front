<template>
  <v-container class="py-8" style="max-width: 960px">
    <!-- 헤더 -->
    <div class="d-flex justify-space-between align-center mb-6">
      <h1 class="text-h5 font-weight-bold">
        {{ isEdit ? '문의 수정' : '문의 작성' }}
      </h1>

      <v-btn variant="text" @click="goList">목록으로</v-btn>
    </div>

    <!-- 폼 카드 -->
    <v-card class="pa-6" elevation="1">
      <v-form ref="formRef" v-model="isValid" lazy-validation>
        <!-- 제목 -->
        <v-text-field
          v-model="form.title"
          label="제목"
          density="comfortable"
          variant="outlined"
          class="mt-4"
          :rules="[rules.required]"
        />

        <!-- 🔥 Toast UI Editor 영역 -->
        <div class="mt-4">
          <label class="text-body-2 mb-1 d-block">내용</label>
          <div ref="editorRoot" />
        </div>

        <!-- 버튼 영역 -->
        <div class="d-flex justify-end gap-2 mt-6">
          <v-btn variant="tonal" @click="goList">취소</v-btn>
          <v-btn
            v-if="can('ENQUIRE', 'SYS-SET-ENQUIRE-C')"
            color="primary"
            :disabled="!isValid"
            @click="onSubmit"
          >
            {{ isEdit ? '수정하기' : '등록하기' }}
          </v-btn>
        </div>
      </v-form>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { getBaseUrl } from '@/@core/composable/createUrl';
import type { Enquire } from '@/data/types/enquire';
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '@/@core/composable/useAxios';
import { useAccountStore } from '@/stores/useAccountStore';
import { can } from '@/stores/usePermissionStore';
import { CLAN_PATH } from '@/router/clan/type';

// 🔥 Toast UI Editor core import
import Editor from '@toast-ui/editor';
import '@toast-ui/editor/dist/toastui-editor.css';

const account = useAccountStore();

const route = useRoute();
const router = useRouter();

// 수정인지 신규인지
const isEdit = computed(() => !!route.params.id);

const formRef = ref();
const isValid = ref(false);

// 🔥 Editor DOM & 인스턴스
const editorRoot = ref<HTMLElement | null>(null);
const editorInstance = ref<Editor | null>(null);

const form = ref<Enquire>({
  type: 'ANY',
  title: '',
  description: '', // 여기 HTML 저장
  attachments: [],
  // Board 타입에 isPinned 없으면 타입에 추가하거나 any로
  // @ts-ignore
  isPinned: false,
});

const rules = {
  required: (v: string) => (!!v && v.trim().length > 0) || '필수 입력 항목입니다.',
};

// 에디터 초기화
onMounted(async () => {
  // 수정 모드면 데이터 먼저 가져오기
  if (isEdit.value) {
    const id = Number(route.params.id);
    //const res = await api.get(`${getBaseUrl('DATA')}/board/${id}`);
    const { data } = await api.get(`${getBaseUrl('DATA')}/enquire/find?id=${route.params.id}`);
    form.value.title = data.datas.title;
    form.value.description = data.datas.description;
    // const data = res.data as Board;

    // form.value = {
    //   ...form.value,
    //   ...data,
    // };
  }

  // Editor 생성
  if (editorRoot.value) {
    editorInstance.value = new Editor({
      el: editorRoot.value,
      height: '400px',
      initialEditType: 'wysiwyg',
      previewStyle: 'vertical',
      initialValue: form.value.description || '',
      usageStatistics: false,
      events: {
        change: () => {
          // 내용 바뀔 때마다 HTML을 form.description에 반영
          const html = editorInstance.value?.getHTML() ?? '';
          form.value.description = html;
        },
      },
    });
  }
});

onBeforeUnmount(() => {
  editorInstance.value?.destroy();
});

// 내용 비었는지 체크 (태그 제거 후)
const isDescriptionEmpty = () => {
  const text = form.value.description
    ?.replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim();
  return !text;
};

const goList = () => {
  router.push(CLAN_PATH.ENQUIRE(account.clan.name));
};

const errorMessage = ref('');
const errorSnackbar = ref(false);

const onSubmit = async () => {
  const ok = await formRef.value?.validate();
  if (!ok.valid) return;

  // 🔥 혹시 몰라 마지막으로 에디터에서 한번 더 sync
  if (editorInstance.value) {
    form.value.description = editorInstance.value.getHTML();
  }

  if (isDescriptionEmpty()) {
    errorMessage.value = '내용을 입력해 주세요.';
    errorSnackbar.value = true;
    return;
  }

  try {
    if (isEdit.value) {
      await api.post(`${getBaseUrl('DATA')}/enquire/update`, {
        id: +route.params.id,
        title: form.value.title,
        description: form.value.description,
        account_id: account.id,
        type: form.value.type,
        // @ts-ignore
        isPinned: form.value.isPinned,
      });
    } else {
      await api.post(`${getBaseUrl('DATA')}/enquire/create`, {
        title: form.value.title,
        description: form.value.description,
        account_id: account.id,
        type: form.value.type,
        // @ts-ignore
        isPinned: form.value.isPinned,
        clan: account.clan,
      });
    }

    alert(isEdit.value ? '수정되었습니다.' : '등록되었습니다.');
    goList();
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.message ?? '알 수 없는 오류 발생';
    errorSnackbar.value = true;
    console.error('게시글 저장 실패:', error);
  }
};
</script>
