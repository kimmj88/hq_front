<template>
  <v-container>
    <!-- 3열 레이아웃 -->
    <v-row class="gx-4">
      <!-- Left Ad Rail (md↑) -->
      <v-col v-if="mdAndUp" cols="12" md="3">
        <div class="sticky-rail">
          <v-card
            v-for="(ad, i) in leftAds"
            :key="'L' + i"
            class="mb-4 rounded-xl overflow-hidden elevation-2 ad-card"
            @click="openAd(ad)"
          >
            <v-img
              :src="ad.image"
              height="160"
              cover
              @error="(e:any) => {
    const id = ad.href ? extractYouTubeVideoId(ad.href) : null;
    if (id) (e.target as HTMLImageElement).src = youtubeThumbFallback(id);
  }"
            />
            <v-card-text class="py-3">
              <div class="text-subtitle-2 font-weight-medium">{{ ad.title }}</div>
              <div class="text-caption text-medium-emphasis mt-1">{{ ad.subtitle }}</div>
              <v-btn size="small" class="mt-2" color="primary" prepend-icon="mdi-open-in-new">
                {{ ad.cta || '자세히' }}
              </v-btn>
            </v-card-text>
          </v-card>
        </div>
      </v-col>

      <!-- Main (기존 내용 전부) -->
      <v-col cols="12" md="6">
        <!-- ====== 여기부터 네가 이미 만든 메인 콘텐츠 ====== -->

        <!-- 공지 배너 -->
        <v-alert
          v-if="showAnnouncement"
          type="info"
          variant="tonal"
          class="mb-3"
          prominent
          closable
          @click:close="dismissAnnouncement"
        >
          <div class="d-flex align-center">
            <v-icon class="mr-2">mdi-bullhorn</v-icon>
            <div class="text-body-2">
              <strong>{{ announcement.title }}</strong>
              <span class="ml-2">{{ announcement.message }}</span>
            </div>
            <v-spacer />
            <v-btn size="small" variant="text" @click.stop="goToNotice">자세히</v-btn>
          </div>
        </v-alert>

        <!-- 프로모션 캐러셀 -->
        <v-carousel
          v-if="promos.length"
          height="180"
          hide-delimiter-background
          show-arrows="hover"
          class="mb-4 rounded-xl overflow-hidden elevation-2"
        >
          <v-carousel-item
            v-for="(p, i) in promos"
            :key="i"
            :src="p.image"
            cover
            @click="openPromo(p)"
          >
            <div class="promo-caption">
              <div class="text-subtitle-2 font-weight-medium">{{ p.title }}</div>
              <div class="text-caption opacity-80">{{ p.subtitle }}</div>
            </div>
          </v-carousel-item>
        </v-carousel>

        <!-- 빠른 액션 -->
        <v-card class="mb-4 pa-3 rounded-xl">
          <div class="d-flex align-center flex-wrap" style="gap: 8px">
            <v-btn size="small" prepend-icon="mdi-plus-circle" @click="addPost">새 글</v-btn>
            <v-btn size="small" variant="tonal" prepend-icon="mdi-ticket-percent" @click="goEvent"
              >이벤트</v-btn
            >
            <v-btn size="small" variant="tonal" prepend-icon="mdi-chart-bar" @click="goRanking"
              >랭킹</v-btn
            >
            <v-btn size="small" variant="tonal" prepend-icon="mdi-bell-outline" @click="goToNotice"
              >공지</v-btn
            >
            <v-spacer />
            <v-chip size="small" variant="flat" color="indigo"> #프로모션 #업데이트 </v-chip>
          </div>
        </v-card>

        <!-- 공지/공유 보드 -->
        <v-row class="mb-4" dense>
          <v-col cols="12" md="6">
            <v-card class="rounded-xl">
              <v-card-title class="py-2">
                <v-icon size="18" class="mr-2">mdi-bell</v-icon> 공지사항
                <v-spacer />
                <v-btn size="small" variant="text" @click="goToNotice">더보기</v-btn>
              </v-card-title>
              <v-divider />
              <v-list density="comfortable">
                <v-list-item
                  v-for="(n, i) in notices"
                  :key="i"
                  @click="openNotice(n)"
                  title-class="text-body-2"
                >
                  <template #title>
                    <div class="d-flex align-center">
                      <span class="truncate-1">{{ n.title }}</span>
                      <v-chip class="ml-2" size="x-small" color="error" v-if="n.badge">New</v-chip>
                      <v-spacer />
                      <span class="text-caption text-medium-emphasis">{{ n.date }}</span>
                    </div>
                  </template>
                </v-list-item>
              </v-list>
            </v-card>
          </v-col>

          <v-col cols="12" md="6">
            <v-card class="rounded-xl">
              <v-card-title class="py-2">
                <v-icon size="18" class="mr-2">mdi-share-variant</v-icon> 팀 공유
                <v-spacer />
                <v-btn size="small" variant="text" @click="goShare">더보기</v-btn>
              </v-card-title>
              <v-divider />
              <v-list density="comfortable">
                <v-list-item v-for="(s, i) in shares" :key="i" @click="openShare(s)">
                  <template #title>
                    <div class="d-flex align-center">
                      <span class="truncate-1">{{ s.title }}</span>
                      <v-spacer />
                      <span class="text-caption text-medium-emphasis">{{ s.date }}</span>
                    </div>
                  </template>
                  <template #subtitle>
                    <div class="truncate-1 text-caption">{{ s.snippet }}</div>
                  </template>
                </v-list-item>
              </v-list>
            </v-card>
          </v-col>
        </v-row>

        <!-- 스폰서/광고 카드 (메인 안쪽 배너) -->
        <v-card class="mb-6 rounded-xl overflow-hidden elevation-2" @click="openSponsor">
          <v-row no-gutters>
            <v-col cols="8" class="pa-4">
              <div class="text-subtitle-1 font-weight-medium mb-1">오늘의 스폰서</div>
              <div class="text-body-2 text-medium-emphasis mb-3">
                프로 모드로 업그레이드하고 추가 기능을 경험해보세요.
              </div>
              <v-btn size="small" color="primary" prepend-icon="mdi-rocket-launch">지금 확인</v-btn>
            </v-col>
            <v-col cols="4">
              <v-img
                src="https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1200&auto=format&fit=crop"
                height="140"
                cover
              />
            </v-col>
          </v-row>
        </v-card>

        <!-- 기존 피드 -->
        <v-btn color="primary" class="mb-4" @click="addPost">Add</v-btn>

        <template v-if="isLoading">
          <v-skeleton-loader type="image, article, actions" class="mb-4 rounded-xl" />
          <v-skeleton-loader type="image, article, actions" class="mb-4 rounded-xl" />
        </template>

        <div v-for="(post, index) in allPosts" :key="index">
          <v-card class="instagram-card" flat>
            <v-card-title class="d-flex align-center justify-space-between px-3 py-2">
              <div class="d-flex align-center">
                <v-avatar size="32"><v-img :src="post.userAvatar" /></v-avatar>
                <div class="ml-3">
                  <div class="text-subtitle-2 font-weight-medium">{{ post.account.name }}</div>
                  <div class="text-caption text-grey-lighten-1">
                    {{ post.created_at.slice(0, 10) }}
                  </div>
                </div>
              </div>
              <v-icon size="20">mdi-dots-horizontal</v-icon>
            </v-card-title>
            <v-img :src="post.image_url" height="400" cover />
            <v-card-actions class="px-3 py-2">
              <v-btn icon variant="text"><v-icon>mdi-heart-outline</v-icon></v-btn>
              <v-btn icon variant="text" @click="openDialog(post)"
                ><v-icon>mdi-comment-outline</v-icon></v-btn
              >
              <v-btn icon variant="text"><v-icon>mdi-share-outline</v-icon></v-btn>
              <v-spacer />
              <v-btn icon variant="text"><v-icon>mdi-bookmark-outline</v-icon></v-btn>
            </v-card-actions>
            <v-card-text class="px-3 py-0">
              <div class="text-body-2">{{ post.description }}</div>
              <div class="text-caption text-grey">
                댓글 {{ post.post_comments.length }}개 모두 보기
              </div>
            </v-card-text>
          </v-card>
        </div>

        <v-dialog v-model="commentDialog" max-width="900">
          <v-card style="max-height: 90vh">
            <v-row no-gutters>
              <v-col cols="6"
                ><v-img v-if="selectedPost" :src="selectedPost.image_url" height="100%" cover
              /></v-col>
              <v-col cols="6" class="d-flex flex-column">
                <v-card-title class="text-h6">댓글</v-card-title>
                <v-divider />
                <v-card-text class="flex-grow-1 overflow-y-auto" style="max-height: 300px">
                  <div
                    v-for="(comment, index) in selectedPost.post_comments"
                    :key="index"
                    class="mb-2"
                  >
                    <strong>{{ comment.account.name }}</strong
                    >: {{ comment.message }}
                  </div>
                </v-card-text>
                <v-divider />
                <v-card-actions>
                  <v-text-field
                    v-model="newComment"
                    label="댓글 입력"
                    variant="plain"
                    class="flex-grow-1"
                    density="compact"
                  />
                  <v-btn variant="text" @click="submitComment(selectedPost)">게시</v-btn>
                </v-card-actions>
              </v-col>
            </v-row>
          </v-card>
        </v-dialog>

        <!-- ====== 여기까지 기존 메인 콘텐츠 ====== -->
      </v-col>

      <!-- Right Ad Rail (md↑) -->
      <v-col v-if="mdAndUp" cols="12" md="3">
        <div class="sticky-rail">
          <v-card
            v-for="(ad, i) in rightAds"
            :key="'R' + i"
            class="mb-4 rounded-xl overflow-hidden elevation-2 ad-card"
            @click="openAd(ad)"
          >
            <v-img
              :src="ad.image"
              height="160"
              cover
              @error="(e:any) => {
    const id = ad.href ? extractYouTubeVideoId(ad.href) : null;
    if (id) (e.target as HTMLImageElement).src = youtubeThumbFallback(id);
  }"
            />
            <v-card-text class="py-3">
              <div class="text-subtitle-2 font-weight-medium">{{ ad.title }}</div>
              <div class="text-caption text-medium-emphasis mt-1">{{ ad.subtitle }}</div>
              <v-btn size="small" class="mt-2" color="primary" prepend-icon="mdi-open-in-new">
                {{ ad.cta || '바로가기' }}
              </v-btn>
            </v-card-text>
          </v-card>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { useDisplay } from 'vuetify';
import { getBaseUrl } from '@/@core/composable/createUrl';
import axios from 'axios';
import { computed, onMounted, ref } from 'vue';
import { useAccountStore } from '@/stores/useAccountStore';
import { usePostStore } from '@/stores/usePostSotre';

import { extractYouTubeVideoId, youtubeThumbUrl, youtubeThumbFallback } from '@/utils/youtube';

const accountStore = useAccountStore();
const postStore = usePostStore();
const allPosts = computed(() => postStore.posts);

// 로딩 제어
const isLoading = ref(false);

// 공지 배너
const ANNOUNCE_KEY = 'home_announcement_closed_v1';
const showAnnouncement = ref(localStorage.getItem(ANNOUNCE_KEY) !== '1');
const announcement = ref({
  title: '시스템 업데이트',
  message: '오늘 22:00–23:00 점검 예정입니다.',
});
function dismissAnnouncement() {
  showAnnouncement.value = false;
  localStorage.setItem(ANNOUNCE_KEY, '1');
}
function goToNotice() {
  // 라우팅 연결
  // router.push({ name: 'notice' });
  console.log('공지 이동');
}

// 프로모션 캐러셀
const promos = ref([
  {
    title: '신규 이벤트 시작!',
    subtitle: '참여하고 리워드 받기',
    image:
      'https://images.unsplash.com/photo-1531297484001-80022131f5a1?q=80&w=1200&auto=format&fit=crop',
    href: '#',
  },
  {
    title: '프로필 꾸미기',
    subtitle: '새로운 템플릿 업데이트',
    image:
      'https://images.unsplash.com/photo-1520975922215-230f2b565a3c?q=80&w=1200&auto=format&fit=crop',
    href: '#',
  },
]);
function openPromo(p: any) {
  if (p.href) window.open(p.href, '_blank');
}

// 공지/공유 보드
const notices = ref([
  { title: '!!!협곡난전 큐드컵!!!', date: '2025-11-01', badge: true },
  { title: '!!!협곡난전 큐드컵!!!', date: '2025-11-01', badge: true },
  { title: '!!!협곡난전 큐드컵!!!', date: '2025-11-01', badge: true },
  // { title: '운영 정책 변경 안내', date: '2025-10-12', badge: false },
  // { title: '보안 점검 결과 보고', date: '2025-10-05', badge: false },
]);
const shares = ref([
  { title: 'UI 가이드 초안 공유', snippet: '버튼/칩/카드 표준안입니다.', date: '2025-10-22' },
  { title: '이미지 CDN 교체 테스트', snippet: '로딩속도 30% 개선.', date: '2025-10-18' },
  { title: '게시물 API 페이징 최적화', snippet: 'limit/offset → cursor', date: '2025-10-10' },
]);
function openNotice(n: any) {
  console.log('공지:', n);
}
function openShare(s: any) {
  console.log('공유:', s);
}
function goShare() {
  console.log('공유 더보기');
}
function goEvent() {
  console.log('이벤트');
}
function goRanking() {
  console.log('랭킹');
}

// 스폰서
function openSponsor() {
  console.log('스폰서 클릭');
}

// 기존 포스트/댓글
const commentDialog = ref(false);
const newComment = ref('');
const selectedPost = ref<any>(null);

function openDialog(post: any) {
  selectedPost.value = post;
  commentDialog.value = true;
}

async function submitComment(item: any) {
  if (!newComment.value.trim()) return;
  try {
    const response = await axios.post(`${getBaseUrl('DATA')}/postcomment/create`, {
      post_id: item.id,
      account_id: accountStore.id,
      message: newComment.value,
    });
    selectedPost.value.post_comments.unshift(response.data.datas);
    newComment.value = '';
  } catch (error) {
    console.error('댓글 등록 실패:', error);
  }
}

// 데모용 “Add” 버튼
function addPost() {
  postStore.posts.unshift({
    id: Math.random(),
    description: '데모 포스트입니다.',
    created_at: new Date().toISOString(),
    image_url: 'https://picsum.photos/800/600?random=' + Math.random(),
    account: { name: 'demo' },
    userAvatar: 'https://randomuser.me/api/portraits/men/75.jpg',
    post_comments: [],
  });
}

const { mdAndUp } = useDisplay();

// 좌우 광고 데이터
// ✅ 광고 타입
type AdItem = { title: string; subtitle?: string; image?: string; href?: string; cta?: string };

const leftAds = computed<AdItem[]>(() =>
  leftAdsRaw.value.map((ad) => {
    if (!ad.image && ad.href) {
      const id = extractYouTubeVideoId(ad.href);
      if (id) return { ...ad, image: youtubeThumbUrl(id) };
    }
    return ad;
  })
);

// ✅ 원본(이미지 없을 수 있음): 유튜브 영상 링크만 있어도 OK
const leftAdsRaw = ref<AdItem[]>([
  // 유튜브 영상 링크 → 썸네일 자동
  {
    title: '힐링큐 Youtube',
    subtitle: '구독과 좋아요 눌러주세요!!!!',
    href: 'https://www.youtube.com/watch?v=mJ4cBFQQiiQ',
    cta: '참여하기',
  },
  // 일반 이미지 광고
  {
    title: '프리미엄 구독',
    subtitle: '더 강력한 도구 모음',
    image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=1200&auto=format',
    href: '#',
    cta: '업그레이드',
  },
]);
const rightAds = ref<AdItem[]>([
  {
    title: '디자인 템플릿',
    subtitle: '새로운 UI 킷 공개',
    image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1200&auto=format',
    href: '#',
  },
  {
    title: '데이터 인사이트',
    subtitle: '리포트 다운받기',
    image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=1200&auto=format',
    href: '#',
    cta: '다운받기',
  },
]);

function openAd(ad: AdItem) {
  if (ad.href) window.open(ad.href, '_blank', 'noopener,noreferrer');
}

onMounted(async () => {
  try {
    isLoading.value = true;
    await postStore.fetchPosts();
  } finally {
    isLoading.value = false;
  }
});
</script>

<style scoped>
/* 사이드 레일 상단 고정 */
.sticky-rail {
  position: sticky;
  top: 72px; /* 헤더 높이에 맞춰 조절 */
}

/* 사이드 광고 카드 폭/여백 미세 조정 */
.ad-card .v-card-text {
  background: rgba(0, 0, 0, 0.04);
}

/* 기존 스타일 유지 */
.instagram-card {
  background-color: #121212;
  color: #fff;
  border-radius: 12px;
  max-width: 500px;
  margin: 20px auto;
}

.promo-caption {
  position: absolute;
  left: 12px;
  bottom: 12px;
  padding: 10px 12px;
  background: rgba(0, 0, 0, 0.45);
  border-radius: 10px;
}

.truncate-1 {
  display: inline-block;
  max-width: 75%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
