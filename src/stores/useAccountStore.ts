import type { Account } from '@/data/types/account';
import { defineStore } from 'pinia';

export const useAccountStore = defineStore('account', {
  state: () => ({
    id: 0 as number,
    email: '' as string,
    name: '' as string,
    nickname: '' as string,
    is_confirm: false as boolean,
    player: null as any,
    clan: null as any,
    clanrole: null as any,

    // 🔹 추가: 계정 로딩 완료 여부
    loaded: false as boolean,
  }),

  getters: {
    /** ✅ 로그인 여부 */
    isLoggedIn: (state) => state.id > 0 && !!state.email,

    /** ✅ 플레이어 연동 여부 */
    isPlayerLinked: (state) => !!state.player?.id,

    /** ✅ 클랜 가입 여부 */
    isClaned: (state) => !!state.clan?.id,

    /** ✅ 클랜 마스터 여부 */
    isClanMaster: (state) => state.clanrole?.name === 'master',

    /** ✅ 스토어 초기화 완료 여부 */
    isReady: (state) => state.loaded,

    /** 🔹 자주 쓰는 값 */
    clanRoleName: (state) => state.clanrole?.name ?? '',
    clanId: (state) => state.clan?.id ?? null,
  },

  actions: {
    setAccount(account: Account) {
      this.id = account.id;
      this.email = account.email;
      this.name = account.name;
      this.nickname = account.nickname;
      this.is_confirm = account.is_confirm;
      this.player = account.player;
      this.clan = account.clan;
      this.clanrole = account.clanrole;

      this.loaded = true; // ✅ 중요
    },

    clear() {
      this.id = 0;
      this.email = '';
      this.name = '';
      this.nickname = '';
      this.is_confirm = false;
      this.player = null;
      this.clan = null;
      this.clanrole = null;

      this.loaded = true; // ✅ 로그아웃 후에도 “확정 상태”
    },
  },
});
