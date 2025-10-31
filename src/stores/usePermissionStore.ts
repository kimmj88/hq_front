import { defineStore } from 'pinia';
import { AbilityBuilder, createMongoAbility } from '@casl/ability';

export const ability = createMongoAbility(); // 전역에서 공유하는 CASL 인스턴스

export function can(action: string, subject: string) {
  return ability.can(action, subject);
}

export const usePermissionStore = defineStore('permission', {
  state: () => ({
    rules: [] as any[],
  }),

  actions: {
    setPermissions(permissions: { action: string; subject: string }[]) {
      const { can, rules } = new AbilityBuilder(createMongoAbility);

      permissions.forEach(({ action, subject }) => {
        can(action, subject);
      });

      this.rules = rules;
      ability.update(rules);
    },

    clearPermissions() {
      this.rules = [];
      ability.update([]);
    },
  },
});
