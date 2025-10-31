import { defineAbility } from '@casl/ability';
import { abilitiesPlugin } from '@casl/vue';
import type { App } from 'vue';

export const ability = defineAbility(() => {});

export function registerCasl(app: App) {
  app.use(abilitiesPlugin, ability);
}
