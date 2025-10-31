// youtube.ts
export function extractYouTubeVideoId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === 'youtu.be') return u.pathname.slice(1) || null;

    if (/(www\.)?youtube\.com$/.test(u.hostname)) {
      // watch?v=, shorts/ID, embed/ID
      if (u.pathname === '/watch') return u.searchParams.get('v');
      const m = u.pathname.match(/\/(shorts|embed)\/([^/?#]+)/);
      if (m) return m[2];
    }
    return null;
  } catch {
    return null;
  }
}

export function youtubeThumbUrl(videoId: string): string {
  // maxres가 없는 영상도 있어서 fallback 준비
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
}
export function youtubeThumbFallback(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}
