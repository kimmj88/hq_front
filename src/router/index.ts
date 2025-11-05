/**
 * router/index.ts
 *
 * Automatic routes for `./src/pages/*.vue`
 */

import api from '@/@core/composable/useAxios';

import {
  CONFIG_ACCOUNT_PATH,
  CONFIG_PLAYER_PATH,
  CONFIG_TIER_PATH,
  CONFIG_PROFILE_PATH,
} from '@/router/config/type';
// Composables
import { createRouter, createWebHistory } from 'vue-router/auto';
import { routes } from 'vue-router/auto-routes';
import Home from '@/pages/Home.vue';

import Config from '@/pages/config/index.vue';
import Account from '@/pages/config/account/index.vue';
import AccountView from '@/pages/config/account/view.vue';

import Player from '@/pages/config/player/index.vue';
import Tier from '@/pages/config/tier/index.vue';
import Profile from '@/pages/config/profile/index.vue';

//Config Permission System
import SystemPermission from '@/pages/config/permission/system/index.vue';

//DefaultLayout
import DefaultLayout from '@/layouts/DefaultLayout.vue';
import ConfigLayout from '@/layouts/ConfigLayout.vue';

//match
import { MATCH_PATH } from '@/router/match/type';
import Match from '@/pages/match/index.vue';
import MatchAdd from '@/pages/match/add.vue';
import MatchView from '@/pages/match/view.vue';

//Login
import Login from '@/pages/login/index.vue';

import Cookies from 'js-cookie';
import { useAuthStore } from '@/stores/useAuthStore';
import { useAccountStore } from '@/stores/useAccountStore';
import { getBaseUrl } from '@/@core/composable/createUrl';
import axios from 'axios';
import { CONFIG_PERMISSION_SYSTEM_PATH } from './permission/system/type';
import { usePermissionStore } from '@/stores/usePermissionStore';
import type { SystemRole } from '@/data/types/systemrole';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/home' },
    {
      path: '/login',
      component: Login,
    },
    {
      path: '/config',
      component: ConfigLayout,
      children: [
        { path: '/config', component: Config },
        { path: CONFIG_ACCOUNT_PATH.BASE, component: Account },
        {
          path: CONFIG_ACCOUNT_PATH.VIEW(':id'),
          component: AccountView,
          props: true,
        },
        { path: CONFIG_PLAYER_PATH.BASE, component: Player },
        { path: CONFIG_TIER_PATH.BASE, component: Tier },
        { path: CONFIG_PROFILE_PATH.BASE, component: Profile },
        { path: CONFIG_PERMISSION_SYSTEM_PATH.BASE, component: SystemPermission },
      ],
    },
    {
      path: '/match',
      component: DefaultLayout,
      children: [
        { path: '/home', component: Home },
        { path: '', component: Match }, // ✅ 이게 "/project/"를 의미함
        { path: 'add', component: MatchAdd },
        { path: MATCH_PATH.VIEW(':id'), component: MatchView, props: true },
      ],
    },
  ],
});

router.beforeEach(async (to, from, next) => {
  const auth = useAuthStore();
  const permission = usePermissionStore();
  const account = useAccountStore();
  const refreshToken = Cookies.get('refreshToken');
  //let accessToken = auth.$state.accessToken || Cookies.get('accessToken');
  let accessToken = Cookies.get('accessToken');

  //Cookies.remove('accessToken');
  auth.setTokens(accessToken as string);
  if (to.path === '/login') {
    if (refreshToken) {
      return next('/home');
    }
    return next();
  }

  if (refreshToken && !accessToken) {
    try {
      const res = await axios.post(
        `${getBaseUrl('AUTH')}/auth/refresh-token/kakao`,
        { refreshToken },
        { withCredentials: true }
      );

      const resAccount: any = await axios.post(
        `${getBaseUrl('AUTH')}/auth/me`,
        { accessToken: res.data.accessToken },
        { withCredentials: true }
      );

      const systemPermissions = await setSystemRole(resAccount.data.datas.systemrole.id);

      account.setAccount(resAccount);
      permission.setPermissions(systemPermissions);

      accessToken = res.data.accessToken;
      auth.setTokens(accessToken as string);
      Cookies.set('accessToken', accessToken as string);
    } catch (error) {
      console.error('토큰 재발급 실패:', error);
      return next('/login');
    }
  }

  if (accessToken) {
    try {
      const value = await axios.post(
        `${getBaseUrl('AUTH')}/auth/me`,
        { accessToken },
        { withCredentials: true }
      );
      const systemPermissions = await setSystemRole(value.data.datas.systemrole.id);

      account.setAccount(value.data.datas);
      permission.setPermissions(systemPermissions);
      auth.setTokens(accessToken as string);
      return next();
    } catch (error) {
      Cookies.remove('accessToken');
      return next('/login');
    }
  }

  return next('/login');
});

// Workaround for https://github.com/vitejs/vite/issues/11804
router.onError((err, to) => {
  if (err?.message?.includes?.('Failed to fetch dynamically imported module')) {
    if (!localStorage.getItem('vuetify:dynamic-reload')) {
      console.log('Reloading page to fix dynamic import error');
      localStorage.setItem('vuetify:dynamic-reload', 'true');
      location.assign(to.fullPath);
    } else {
      console.error('Dynamic import error, reloading page did not fix it', err);
    }
  } else {
    console.error(err);
  }
});

async function setSystemRole(systemrole_id: number): Promise<any> {
  const resSystemPermission = await api.get(
    `${getBaseUrl('DATA')}/systemrole/find?id=${systemrole_id}`
  );

  const systemRole: SystemRole = resSystemPermission.data.datas;
  const systemPermissions = [];

  if (systemRole.permissionGroups) {
    for (const item of systemRole.permissionGroups) {
      for (const subItem of item.children) {
        if (subItem.access === true) {
          systemPermissions.push({ action: item.code, subject: subItem.code });
        }
      }
    }
  }

  return systemPermissions;
}

router.isReady().then(() => {
  localStorage.removeItem('vuetify:dynamic-reload');
});

export default router;
