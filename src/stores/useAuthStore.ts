import { defineStore } from 'pinia';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    accessToken: '' as string,
  }),
  actions: {
    setTokens(access: string) {
      this.accessToken = access;
    },
    logout() {
      this.accessToken = '';
    },
    clear() {
      this.accessToken = '';
    },
  },
});
