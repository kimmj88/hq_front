import type { Account } from '@/data/types/account';
import { defineStore } from 'pinia';

export const useAccountStore = defineStore('account', {
  state: () => ({
    id: 0 as number,
    email: '' as string,
    name: '' as string,
  }),
  actions: {
    setAccount(account: Account) {
      this.id = account.id;
      this.name = account.name;
      this.email = account.email;
    },
    clear() {
      this.id = 0;
      this.email = '';
      this.name = '';
    },
  },
});
