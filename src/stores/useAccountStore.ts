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
  }),
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
    },
  },
});
