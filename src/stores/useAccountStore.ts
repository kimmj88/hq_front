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
    isLoggedIn: (state) => state.id > 0,

    isPlayerLinked: (state) => (!!state.player?.id ? true : false),

    /** ✅ 스토어가 초기화/로딩 완료됐는지 */
    isReady: (state) => state.loaded,

    /** 🔹 자주 쓰는 값들 */
    clanRoleName: (state) => state.clanrole?.name ?? '',
    clanId: (state) => state.clan?.id ?? null,
  },
  isLoggedIn: (s) => s.id > 0 && !!s.email, // ✅ 핵심
  isPlayerLinked: (s) => s.player.id > 0 && !!s.player.nickname,

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
