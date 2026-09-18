<template>
  <span v-if="source" class="badge-frame" :style="frameStyle" aria-hidden="true" />
  <span v-if="badge.season_code" class="badge-season-code">{{ badge.season_code }}</span>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { badgeImageUrl } from '@/data/api/badge';
const props = defineProps<{ badge: { frame_image_url: string; frame_slice: number; frame_width: number; season_code?: string } }>();
const source = computed(() => badgeImageUrl(props.badge.frame_image_url));
const frameStyle = computed(() => ({
  borderImageSource: `url(${JSON.stringify(source.value)})`,
  borderImageSlice: String(Math.max(1, Math.min(512, Number(props.badge.frame_slice) || 32))),
  borderWidth: `${Math.max(1, Math.min(48, Number(props.badge.frame_width) || 24))}px`,
}));
</script>

<style scoped>
.badge-frame {
  position: absolute;
  z-index: -1;
  inset: 0;
  border: 24px solid transparent;
  border-image-repeat: stretch;
  pointer-events: none;
}
.badge-season-code {
  position: absolute;
  z-index: 5;
  bottom: 5px;
  left: 50%;
  transform: translateX(-50%);
  padding: 1px 7px 2px;
  border: 1px solid rgba(242, 221, 255, .7);
  border-radius: 5px;
  background: rgba(40, 22, 64, .92);
  color: #f7eaff;
  font-family: Arial, sans-serif;
  font-size: 10px;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: .4px;
  white-space: nowrap;
  pointer-events: none;
}
</style>
