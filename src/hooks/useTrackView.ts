import { useEffect } from 'react';

export function useTrackView(contentId: string, contentType: string, slug?: string, title?: string) {
  useEffect(() => {
    if (!contentId) return;
    const controller = new AbortController();
    fetch('/api/content/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contentId, contentType, slug, title }),
      signal: controller.signal,
    }).catch(() => {});
    return () => controller.abort();
  }, [contentId, contentType, slug, title]);
}
