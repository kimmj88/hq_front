<template>
  <div class="badge-preview" :style="{ padding: `${Math.max(24, badge.frame_width + 6)}px` }">
    <BadgeFrame :badge="badge" />
    <v-avatar size="44" color="blue-grey-darken-2">
      <v-img v-if="badge.icon_image_url" :src="badgeImageUrl(badge.icon_image_url)" />
      <v-icon v-else>mdi-shield-star-outline</v-icon>
    </v-avatar>
    <div class="badge-copy"><strong>{{ badge.name || '휘장 미리보기' }}</strong><span>{{ subtitle || '플레이어 테두리' }}</span></div>
  </div>
</template>
<script setup lang="ts">
import BadgeFrame from './BadgeFrame.vue';
import { badgeImageUrl } from '@/data/api/badge';
defineProps<{ badge: { name: string; icon_image_url: string | null; frame_image_url: string; frame_slice: number; frame_width: number }; subtitle?: string }>();
</script>
<style scoped>
.badge-preview { position: relative; isolation: isolate; display: flex; align-items: center; gap: 14px; min-height: 122px; border-radius: 8px; background: linear-gradient(180deg, #5b6472, #434c5a); color: #f8fafc; }
.badge-copy { display: grid; gap: 4px; min-width: 0; overflow-wrap: anywhere; }
.badge-copy span { font-size: 12px; opacity: .8; }
</style>
