import { createI18n } from 'vue-i18n';

const messages = {
  ko: {
    form_control: {
      search_textbox: { label: '검색' },
      button: {
        add: '추가',
        search: '검색',
        cancel: '취소',
        save: '저장',
        edit: '수정',
        delete: '삭제',
      },
    },
    validation: {
      field: {
        required: 'This field is required.',
        range: 'Only numbers between 1 and 5 are allowed.',
        version: 'Only numbers and dots (.) are allowed.',
      },
    },
    system_permission: {
      'SYS-SET-R': '설정 조회',
      'SYS-SET-ACC-R': '계정 조회',
      'SYS-SET-ACC-U': '계정 수정',
      'SYS-SET-PMS-R': '권한 조회',
      'SYS-SET-PMS-C': '권한 생성',
      'SYS-SET-PMS-U': '권한 수정',
      'SYS-SET-PMS-D': '권한 삭제',
      'SYS-PRJ-R': '프로젝트 조회',
      'SYS-PRJ-C': '프로젝트 생성',
      'SYS-PRJ-U': '프로젝트 수정',
      'SYS-PRJ-D': '프로젝트 삭제',
      'SYS-SLT-R': '솔루션 조회',
      'SYS-SLT-C': '솔루션 생성',
      'SYS-SLT-U': '솔루션 수정',
      'SYS-SLT-D': '솔루션 삭제',
      'SYS-PDT-R': '제품 조회',
      'SYS-PDT-C': '제품 생성',
      'SYS-PDT-U': '제품 수정',
      'SYS-PDT-D': '제품 삭제',
    },
    project_permission: {
      'PRJ-PMB-R': '맴버 조회',
      'PRJ-PMB-C': '맴버 생성',
      'PRJ-PMB-D': '맴버 삭제',
      'PRJ-DFT-R': '기안 조회',
      'PRJ-DFT-C': '기안 생성',
      'PRJ-DFT-D': '기안 삭제',
      'PRJ-LOG-R': '로그 조회',
      'PRJ-LOG-D': '로그 삭제',
    },
  },
  en: {
    form_control: {
      search_textbox: { label: 'Search' },
      button: {
        add: 'Add',
        search: 'Search',
        cancel: 'Cancel',
        save: 'Save',
        edit: 'Edit',
        delete: 'Delete',
      },
    },
    validation: {
      field: {
        required: 'This field is required.',
        range: 'Only numbers between 1 and 5 are allowed.',
        version: 'Only numbers and dots (.) are allowed.',
      },
    },
    system_permission: {
      'SYS-SET-R': 'Setting Read',
      'SYS-SET-ACC-R': 'Account Read',
      'SYS-SET-ACC-U': 'Account Update',
      'SYS-SET-PMS-R': 'Permission Read',
      'SYS-SET-PMS-C': 'Permission Create',
      'SYS-SET-PMS-U': 'Permission Update',
      'SYS-SET-PMS-D': 'Permission Delete',
      'SYS-PRJ-R': 'Project Read',
      'SYS-PRJ-C': 'Project Create',
      'SYS-PRJ-U': 'Project Update',
      'SYS-PRJ-D': 'Project Delete',
      'SYS-SLT-R': 'Solution Read',
      'SYS-SLT-C': 'Solution Create',
      'SYS-SLT-U': 'Solution Update',
      'SYS-SLT-D': 'Solution Delete',
      'SYS-PDT-R': 'Proudct Read',
      'SYS-PDT-C': 'Proudct Create',
      'SYS-PDT-U': 'Proudct Update',
      'SYS-PDT-D': 'Proudct Delete',
    },

    project_permission: {
      'PRJ-PMB-R': 'Member Read',
      'PRJ-PMB-C': 'Member Create',
      'PRJ-PMB-D': 'Member Delete',
      'PRJ-DFT-R': 'Draft Read',
      'PRJ-DFT-C': 'Draft Create',
      'PRJ-DFT-D': 'Draft Delete',
      'PRJ-LOG-R': 'Log Read',
      'PRJ-LOG-D': 'Log Delete',
    },
  },
};

const i18n = createI18n({
  legacy: false, // Composition API 사용
  locale: 'en', // 기본 언어
  messages,
});

export default i18n;

// required: (value: string) => !!value || '필수 입력 항목입니다.',
// range: (v: number) => (v >= 1 && v <= 5) || '1부터 5 사이 숫자만 입력 가능',
// versionFormat: (v: string) => /^[0-9.]+$/.test(v) || '숫자와 점(.)만 입력 가능',
