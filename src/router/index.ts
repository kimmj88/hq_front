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
import ClanPermission from '@/pages/config/permission/clan/index.vue';

//DefaultLayout
import DefaultLayout from '@/layouts/DefaultLayout.vue';
import ConfigLayout from '@/layouts/ConfigLayout.vue';
import ClanLayout from '@/layouts/ClanLayout.vue';

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
import Bracket from '@/pages/cup/bracket.vue';

//Login
import Login from '@/pages/login/index.vue';

//Exception
import Exception from '@/pages/exception/Exception.vue';

//pending
import PendingApproval from '@/pages/login/PendingApproval.vue';

//register
import KakaoLolRegister from '@/pages/login/KakaoLolRegister.vue';

//record
import Record from '@/pages/record/index.vue';

//Board
import Board from '@/pages/board/index.vue';
import BoardAdd from '@/pages/board/add.vue';
import BoardView from '@/pages/board/view.vue';

//Forum
import { FORUM_PATH } from '@/router/forum/type';
import Forum from '@/pages/forum/index.vue';
import ForumAdd from '@/pages/forum/add.vue';
import ForumView from '@/pages/forum/view.vue';

//Enquire
import { ENQUIRE_PATH } from '@/router/enquire/type';
import Enquire from '@/pages/enquire/index.vue';
import EnquireAdd from '@/pages/enquire/add.vue';
import EnquireView from '@/pages/enquire/view.vue';

//Clan
import { CLAN_PATH } from '@/router/clan/type';
import Clan from '@/pages/clan/index.vue';
import ClanBoard from '@/pages/clan/board/index.vue';
import ClanBoardAdd from '@/pages/clan/board/add.vue';
import ClanBoardView from '@/pages/clan/board/view.vue';
import ClanEnquire from '@/pages/clan/enquire/index.vue';
import ClanEnquireAdd from '@/pages/clan/enquire/add.vue';
import ClanEnquireView from '@/pages/clan/enquire/view.vue';
import ClanPlayer from '@/pages/clan/player.vue';
import ClanAccount from '@/pages/clan/account/index.vue';
import ClanAccountView from '@/pages/clan/account/view.vue';

import MyClan from '@/pages/clan/myclan.vue';

import Cookies from 'js-cookie';
import { useAuthStore } from '@/stores/useAuthStore';
import { useAccountStore } from '@/stores/useAccountStore';
import { getBaseUrl } from '@/@core/composable/createUrl';
import axios from 'axios';
import {
  CONFIG_PERMISSION_SYSTEM_PATH,
  CONFIG_PERMISSION_CLAN_PATH,
} from './permission/system/type';
import { usePermissionStore } from '@/stores/usePermissionStore';
import { useClanPermissionStore } from '@/stores/useClanPermissionStore';
import type { SystemRole } from '@/data/types/systemrole';
import { BOARD_PATH } from './board/type';
import type { ClanRole } from '@/data/types/clanrole';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/home' },
    { path: '/exception', component: Exception },
    { path: '/pendingapproval', component: PendingApproval },
    { path: '/register', component: KakaoLolRegister },
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
        { path: CONFIG_PERMISSION_CLAN_PATH.BASE, component: ClanPermission },
      ],
    },

    //Clan router
    {
      path: CLAN_PATH.VIEW(':name'),
      component: ClanLayout,
      children: [
        { path: CLAN_PATH.NOTICE(':name'), component: ClanBoard },
        { path: CLAN_PATH.NOTICE_ADD(':name'), component: ClanBoardAdd },
        { path: CLAN_PATH.NOTICE_VIEW(':name', ':id'), component: ClanBoardView, props: true },
        { path: CLAN_PATH.ENQUIRE(':name'), component: ClanEnquire },
        { path: CLAN_PATH.ENQUIRE_ADD(':name'), component: ClanEnquireAdd },
        { path: CLAN_PATH.ENQUIRE_VIEW(':name', ':id'), component: ClanEnquireView, props: true },
        { path: CLAN_PATH.PLAYER(':name'), component: ClanPlayer },
        { path: CLAN_PATH.ACCOUNT(':name'), component: ClanAccount },
        { path: CLAN_PATH.ACCOUNT_VIEW(':name', ':id'), component: ClanAccountView, props: true },
        { path: CLAN_PATH.PERMISSION(':name'), component: ClanPermission },
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
        { path: CUP_PATH.BRACKET(':id'), component: Bracket, props: true },
      ],
    },

    {
      path: '/record',
      component: DefaultLayout,
      children: [
        { path: '/home', component: Home },
        { path: '', component: Record },
      ],
    },
    {
      path: '/board',
      component: DefaultLayout,
      children: [
        { path: '/home', component: Home },
        { path: '', component: Board },
        { path: 'add', component: BoardAdd },
        { path: BOARD_PATH.VIEW(':id'), component: BoardView, props: true },
        { path: BOARD_PATH.EDIT(':id'), component: BoardAdd, props: true },
      ],
    },

    {
      path: '/enquire',
      component: DefaultLayout,
      children: [
        { path: '/home', component: Home },
        { path: '', component: Enquire },
        { path: 'add', component: EnquireAdd },
        { path: ENQUIRE_PATH.VIEW(':id'), component: EnquireView, props: true },
        { path: ENQUIRE_PATH.EDIT(':id'), component: EnquireAdd, props: true },
      ],
    },

    {
      path: '/forum',
      component: DefaultLayout,
      children: [
        { path: '/home', component: Home },
        { path: '', component: Forum },
        { path: 'add', component: ForumAdd },
        { path: FORUM_PATH.VIEW(':id'), component: ForumView, props: true },
        { path: FORUM_PATH.EDIT(':id'), component: ForumAdd, props: true },
      ],
    },

    {
      path: '/clan',
      component: DefaultLayout,
      children: [
        { path: '/home', component: Home },
        { path: '', component: Clan },
        // { path: CLAN_PATH.VIEW(':name'), component: MyClan, props: true },
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
  const systemPermissionStore = usePermissionStore();
  const clanPermissionStore = useClanPermissionStore();

  const me = data.datas;
  const systemPermissions = await setSystemRole(me.systemrole.id);
  const clanPermissions = await setClanRole(me.systemrole.id);

  auth.setTokens(accessToken);
  account.setAccount(me);
  systemPermissionStore.setPermissions(systemPermissions);
  clanPermissionStore.setClanPermissions(clanPermissions);
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
      console.log(401);
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
  if (to.path === '/exception') {
    return next();
  }

  // if (to.path === '/register') {
  //   let accessToken = Cookies.get('accessToken') ?? '';
  //   await hydrateUser(accessToken);
  //   return next();
  // }

  // if (to.path === '/pendingapproval') {
  //   let accessToken = Cookies.get('accessToken') ?? '';
  //   await hydrateUser(accessToken);
  //   return next();
  // }

  // 로그인 페이지 접근 허용(이미 로그인 상태면 홈으로)
  if (to.path === '/login') {
    const hasRefresh = !!Cookies.get('refreshToken');
    if (hasRefresh) return next('/home');
    return next();
  }

  const auth = useAuthStore();
  const account = useAccountStore();
  const permission = usePermissionStore();
  const ok = await ensureSession();

  if (!ok) {
    auth.clear(); // 토큰/상태 초기화 메서드가 있다면 사용
    account.clear?.();
    permission.clear?.();
    Cookies.remove('accessToken');
    Cookies.remove('refreshToken');
    return next('/login');
  }

  return next();
  // if (account.is_confirm) return next();
  // else {
  //   next('/pendingapproval');
  // }
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

async function setClanRole(clanrole_id: number): Promise<any> {
  const resClanPermission = await api.get(`${getBaseUrl('DATA')}/clanrole/find?id=${clanrole_id}`);

  const clanRole: ClanRole = resClanPermission.data.datas;
  const clanPermissions = [];

  if (clanRole.permissionGroups) {
    for (const item of clanRole.permissionGroups) {
      for (const subItem of item.children) {
        if (subItem.access === true) {
          clanPermissions.push({ action: item.code, subject: subItem.code });
        }
      }
    }
  }

  return clanPermissions;
}

router.isReady().then(() => {
  localStorage.removeItem('vuetify:dynamic-reload');
});

export default router;
