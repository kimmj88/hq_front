<template>
  <v-container class="py-8" style="max-width: 960px">
    <!-- 헤더 -->
    <div class="d-flex justify-space-between align-center mb-6">
      <h1 class="text-h5 font-weight-bold">
        {{ isEdit ? '공지사항 수정' : '공지사항 작성' }}
      </h1>

      <v-btn variant="text" @click="goList">목록으로</v-btn>
    </div>

    <!-- 폼 카드 -->
    <v-card class="pa-6" elevation="1">
      <v-form ref="formRef" v-model="isValid" lazy-validation>
        <v-row dense>
          <v-col cols="12" md="5">
            <v-select
              v-model="form.notice_type"
              :items="noticeTypes"
              item-title="label"
              item-value="value"
              label="공지 유형"
              variant="outlined"
              hide-details
            />
          </v-col>
          <!-- 상단 고정 -->
          <v-col cols="12" md="3">
            <v-switch v-model="form.is_pin" label="상단 고정" color="success" inset hide-details />
          </v-col>
        </v-row>

        <!-- 제목 -->
        <v-text-field
          v-model="form.title"
          label="제목"
          density="comfortable"
          variant="outlined"
          class="mt-4"
          :rules="[rules.required]"
        />

        <v-card class="calendar-link-card mt-2 mb-5" variant="tonal" rounded="lg">
          <v-card-text>
            <div class="d-flex align-center justify-space-between mb-3">
              <div>
                <strong class="d-block">클랜 달력에도 등록</strong>
                <small class="text-medium-emphasis">공지와 연결된 일정을 자동으로 생성합니다.</small>
              </div>
              <v-switch v-model="form.calendar_enabled" color="primary" inset hide-details />
            </div>
            <template v-if="form.calendar_enabled">
              <v-switch v-model="form.calendar_is_all_day" label="종일 일정" color="primary" inset hide-details class="mb-3" />
              <v-row dense>
                <v-col cols="12" sm="6">
                  <v-text-field v-model="form.calendar_starts_at" :type="form.calendar_is_all_day ? 'date' : 'datetime-local'" label="일정 시작" variant="outlined" :rules="[rules.required]" />
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field v-model="form.calendar_ends_at" :type="form.calendar_is_all_day ? 'date' : 'datetime-local'" label="일정 종료 (선택)" variant="outlined" clearable />
                </v-col>
              </v-row>
            </template>
          </v-card-text>
        </v-card>

        <!-- 🔥 Toast UI Editor 영역 -->
        <div class="mt-4">
          <label class="text-body-2 mb-1 d-block">내용</label>
          <div ref="editorRoot" />
        </div>

        <!-- 이미지/파일 첨부 -->
        <!-- <v-file-input
          v-model="form.attachments"
          label="첨부 파일"
          prepend-icon="mdi-paperclip"
          multiple
          show-size
          variant="outlined"
          density="comfortable"
          class="mt-4"
        /> -->

        <!-- 버튼 영역 -->
        <div class="d-flex justify-end gap-2 mt-6">
          <v-btn variant="tonal" @click="goList">취소</v-btn>
          <v-btn
            v-if="can('NOTICE', 'CLAN-SET-NOTICE-C')"
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
import type { Board } from '@/data/types/board';
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '@/@core/composable/useAxios';
import { useAccountStore } from '@/stores/useAccountStore';
import { can } from '@/stores/useClanPermissionStore';
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

const form = ref<Board>({
  type: 'CLAN',
  title: '',
  description: '', // 여기 HTML 저장
  attachments: [],
  // Board 타입에 isPinned 없으면 타입에 추가하거나 any로
  // @ts-ignore
  is_pin: false,
  notice_type: 'GENERAL',
  calendar_enabled: true,
  calendar_starts_at: toInput(new Date()),
  calendar_ends_at: '',
  calendar_is_all_day: false,
});

function toInput(date: Date, allDay = false) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString();
  return allDay ? local.slice(0, 10) : local.slice(0, 16);
}

function calendarIso(value?: string, allDay = false) {
  if (!value) return undefined;
  return new Date(allDay ? `${value}T00:00:00` : value).toISOString();
}

const noticeTypes = [
  { label: '긴급', value: 'URGENT' },
  { label: '이벤트', value: 'EVENT' },
  { label: '일반', value: 'GENERAL' },
  { label: '패치노트', value: 'PATCH_NOTE' },
];

const rules = {
  required: (v: string) => (!!v && v.trim().length > 0) || '필수 입력 항목입니다.',
};

// 에디터 초기화
onMounted(async () => {
  // 수정 모드면 데이터 먼저 가져오기
  if (isEdit.value) {
    const id = Number(route.params.id);
    //const res = await api.get(`${getBaseUrl('DATA')}/board/${id}`);
    const { data } = await api.get(`${getBaseUrl('DATA')}/board/find?id=${route.params.id}`);
    form.value.title = data.datas.title;
    form.value.description = data.datas.description;
    form.value.is_pin = data.datas.is_pin;
    form.value.notice_type = data.datas.notice_type || 'GENERAL';
    const schedule = data.datas.calendar_schedule;
    form.value.calendar_enabled = !!schedule;
    if (schedule) {
      form.value.calendar_is_all_day = !!schedule.is_all_day;
      form.value.calendar_starts_at = toInput(new Date(schedule.starts_at), !!schedule.is_all_day);
      form.value.calendar_ends_at = schedule.ends_at
        ? toInput(new Date(schedule.ends_at), !!schedule.is_all_day)
        : '';
    }
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
  router.push(CLAN_PATH.NOTICE(account.clan.name));
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
      await api.post(`${getBaseUrl('DATA')}/board/update`, {
        id: +route.params.id,
        title: form.value.title,
        description: form.value.description,
        account_id: account.id,
        type: form.value.type,
        notice_type: form.value.notice_type,
        calendar_enabled: form.value.calendar_enabled,
        calendar_starts_at: calendarIso(form.value.calendar_starts_at, form.value.calendar_is_all_day),
        calendar_ends_at: calendarIso(form.value.calendar_ends_at, form.value.calendar_is_all_day),
        calendar_is_all_day: form.value.calendar_is_all_day,
        // @ts-ignore
        is_pin: form.value.is_pin,
      });
    } else {
      await api.post(`${getBaseUrl('DATA')}/board/create`, {
        title: form.value.title,
        description: form.value.description,
        account_id: account.id,
        type: form.value.type,
        notice_type: form.value.notice_type,
        calendar_enabled: form.value.calendar_enabled,
        calendar_starts_at: calendarIso(form.value.calendar_starts_at, form.value.calendar_is_all_day),
        calendar_ends_at: calendarIso(form.value.calendar_ends_at, form.value.calendar_is_all_day),
        calendar_is_all_day: form.value.calendar_is_all_day,
        // @ts-ignore
        is_pin: form.value.is_pin,
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

<style scoped>
.calendar-link-card { border: 1px solid rgba(var(--v-theme-primary), .18); }
</style>
