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
    profile: {
      config: '설정',
      account: '마이페이지',
      logout: '로그아웃',
    },
    validation: {
      field: {
        required: 'This field is required.',
        range: 'Only numbers between 1 and 5 are allowed.',
        version: 'Only numbers and dots (.) are allowed.',
      },
    },
    system_permission: {
      //System Permission
      'SET-R': '설정 조회',
      'SYS-SET-ACC-R': '계정 조회',
      'SYS-SET-ACC-U': '계정 수정',

      'SYS-SET-MATCH-C': '매치 생성',
      'SYS-SET-MATCH-R': '매치 조회',
      'SYS-SET-MATCH-D': '매치 삭제',

      'SYS-SET-PMS-C': '권한 생성',
      'SYS-SET-PMS-R': '권한 조회',
      'SYS-SET-PMS-U': '권한 수정',
      'SYS-SET-PMS-D': '권한 삭제',

      'SYS-SET-PLAYER-C': '플레이어 생성',
      'SYS-SET-PLAYER-R': '플레이어 조회',
      'SYS-SET-PLAYER-U': '플레이어 수정',

      'SYS-SET-TIER-R': '티어 조회',
      'SYS-SET-TIER-U': '티어 수정',

      'SYS-SET-PROFILE-R': '프로파일 조회',
      'SYS-SET-PROFILE-U': '프로파일 수정',

      'SYS-SET-CUP-C': '컵 생성',
      'SYS-SET-CUP-R': '컵 조회',
      'SYS-SET-CUP-D': '컵 삭제',

      'SYS-SET-NOTICE-C': '공지사항 생성',
      'SYS-SET-NOTICE-R': '공지사항 조회',
      'SYS-SET-NOTICE-U': '공지사항 수정',
      'SYS-SET-NOTICE-D': '공지사항 삭제',

      'SYS-SET-ENQUIRE-C': '건의사항 생성',
      'SYS-SET-ENQUIRE-R': '건의사항 조회',
      'SYS-SET-ENQUIRE-U': '건의사항 수정',
      'SYS-SET-ENQUIRE-D': '건의사항 삭제',

      'SYS-SET-FORUM-C': '자유게시판 생성',
      'SYS-SET-FORUM-R': '자유게시판 조회',
      'SYS-SET-FORUM-U': '자유게시판 수정',
      'SYS-SET-FORUM-D': '자유게시판 삭제',
    },

    clan_permission: {
      //Clan Permission
      'CLAN-SET-ACC-R': '계정 조회',
      'CLAN-SET-ACC-U': '계정 수정',

      'CLAN-SET-PLAYER-C': '플레이어 생성',
      'CLAN-SET-PLAYER-R': '플레이어 조회',
      'CLAN-SET-PLAYER-U': '플레이어 수정',

      'CLAN-SET-NOTICE-C': '공지사항 생성',
      'CLAN-SET-NOTICE-R': '공지사항 조회',
      'CLAN-SET-NOTICE-U': '공지사항 수정',
      'CLAN-SET-NOTICE-D': '공지사항 삭제',

      'CLAN-SET-ENQUIRE-C': '건의사항 생성',
      'CLAN-SET-ENQUIRE-R': '건의사항 조회',
      'CLAN-SET-ENQUIRE-U': '건의사항 수정',
      'CLAN-SET-ENQUIRE-D': '건의사항 삭제',

      'CLAN-SET-MATCH-C': '매치 생성',
      'CLAN-SET-MATCH-R': '매치 조회',
      'CLAN-SET-MATCH-D': '매치 삭제',

      'CLAN-SET-CUP-C': '컵 생성',
      'CLAN-SET-CUP-R': '컵 조회',
      'CLAN-SET-CUP-D': '컵 삭제',
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
  },
};

const i18n = createI18n({
  legacy: false, // Composition API 사용
  locale: 'ko', // 기본 언어
  messages,
});

export default i18n;

// required: (value: string) => !!value || '필수 입력 항목입니다.',
// range: (v: number) => (v >= 1 && v <= 5) || '1부터 5 사이 숫자만 입력 가능',
// versionFormat: (v: string) => /^[0-9.]+$/.test(v) || '숫자와 점(.)만 입력 가능',
