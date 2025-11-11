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

//cup
import { CUP_PATH } from '@/router/cup/type';
import Cup from '@/pages/cup/index.vue';
import CupAdd from '@/pages/cup/add.vue';
import CupView from '@/pages/cup/view.vue';

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
        { path: '', component: Match },
        { path: 'add', component: MatchAdd },
        { path: MATCH_PATH.VIEW(':id'), component: MatchView, props: true },
      ],
    },

    {
      path: '/cup',
      component: DefaultLayout,
      children: [
        { path: '/home', component: Home },
        { path: '', component: Cup },
        //{ path: '', component: Tourna },
        { path: 'add', component: CupAdd },
        { path: CUP_PATH.VIEW(':id'), component: CupView, props: true },
      ],
    },
  ],
});

let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(refreshToken: string): Promise<string> {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshPromise = axios
      .post(
        `${getBaseUrl('AUTH')}/auth/refresh-token/kakao`,
        { refreshToken },
        { withCredentials: true }
      )
      .then((res) => res.data.accessToken)
      .finally(() => {
        isRefreshing = false;
      });
  }
  // 이미 진행 중이면 같은 프라미스 대기
  const newAccess = await refreshPromise!;
  return newAccess;
}

async function hydrateUser(accessToken: string) {
  // /auth/me 한 번만 호출해서 계정/권한 세팅
  const { data } = await axios.post(
    `${getBaseUrl('AUTH')}/auth/me`,
    { accessToken },
    { withCredentials: true }
  );
  const auth = useAuthStore();
  const account = useAccountStore();
  const permission = usePermissionStore();

  const me = data.datas;
  const systemPermissions = await setSystemRole(me.systemrole.id);

  auth.setTokens(accessToken);
  account.setAccount(me);
  permission.setPermissions(systemPermissions);
}

async function ensureSession(): Promise<boolean> {
  const auth = useAuthStore();
  const refreshToken = Cookies.get('refreshToken') ?? '';
  let accessToken = Cookies.get('accessToken') ?? '';

  // accessToken이 있으면 검증(401 나오면 갱신 시도)
  if (accessToken) {
    try {
      await hydrateUser(accessToken);
      return true;
    } catch (err: any) {
      // 401 등 실패 시 리프레시 시도
    }
  }

  // 여기로 왔다는 건 accessToken이 없거나, me 실패한 경우
  if (!refreshToken) return false;

  try {
    const newAccess = await refreshAccessToken(refreshToken);
    Cookies.set('accessToken', newAccess, { sameSite: 'Lax' }); // 필요 시 secure: true(HTTPS)
    await hydrateUser(newAccess);
    return true;
  } catch {
    return false;
  }
}

router.beforeEach(async (to, from, next) => {
  // 로그인 페이지 접근 허용(이미 로그인 상태면 홈으로)
  if (to.path === '/login') {
    const hasRefresh = !!Cookies.get('refreshToken');
    if (hasRefresh) return next('/home');
    return next();
  }

  const ok = await ensureSession();
  if (!ok) {
    // 정리 후 로그인으로
    const auth = useAuthStore();
    const account = useAccountStore();
    const permission = usePermissionStore();
    auth.clear(); // 토큰/상태 초기화 메서드가 있다면 사용
    account.clear?.();
    permission.clear?.();
    Cookies.remove('accessToken');
    Cookies.remove('refreshToken');
    return next('/login');
  }

  return next();
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
