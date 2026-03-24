const BASE = 'https://www.googleapis.com/youtube/v3';

async function yt(path, token) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `YouTube API error ${res.status}`);
  }
  return res.json();
}

/**
 * Get authenticated channel's statistics + snippet
 */
export async function getChannelStats(token) {
  const data = await yt(
    '/channels?part=snippet,statistics,brandingSettings&mine=true',
    token
  );
  const ch = data.items?.[0];
  if (!ch) return null;
  return {
    id: ch.id,
    title: ch.snippet.title,
    description: ch.snippet.description,
    thumbnail: ch.snippet.thumbnails?.high?.url || ch.snippet.thumbnails?.default?.url,
    customUrl: ch.snippet.customUrl || '',
    bannerUrl: ch.brandingSettings?.image?.bannerExternalUrl || '',
    keywords: ch.brandingSettings?.channel?.keywords 
      ? ch.brandingSettings.channel.keywords.match(/(?:[^\s"]+|"[^"]*")+/g)?.map(k => k.replace(/"/g, '')) || [] 
      : [],
    subscribers: Number(ch.statistics.subscriberCount || 0),
    totalViews: Number(ch.statistics.viewCount || 0),
    videoCount: Number(ch.statistics.videoCount || 0),
    country: ch.snippet.country || '—',
    publishedAt: ch.snippet.publishedAt,
  };
}

/**
 * Get recent videos of the authenticated channel
 */
export async function getRecentVideos(token, channelId, maxResults = 10) {
  // Step 1: Search for own videos by channelId
  const searchData = await yt(
    `/search?part=snippet&channelId=${channelId}&order=date&type=video&maxResults=${maxResults}`,
    token
  );

  const videoIds = searchData.items?.map(i => i.id.videoId).join(',');
  if (!videoIds) return [];

  // Step 2: Get detailed stats for those videos
  const detailData = await yt(
    `/videos?part=snippet,statistics,contentDetails&id=${videoIds}`,
    token
  );

  return detailData.items?.map(v => ({
    id: v.id,
    title: v.snippet.title,
    thumbnail: v.snippet.thumbnails?.medium?.url,
    publishedAt: v.snippet.publishedAt,
    views: Number(v.statistics.viewCount || 0),
    likes: Number(v.statistics.likeCount || 0),
    comments: Number(v.statistics.commentCount || 0),
    tags: v.snippet.tags || [],
    description: v.snippet.description || '',
    duration: v.contentDetails.duration,
  })) || [];
}

/**
 * Get full details of a single video by ID
 */
export async function getVideoDetails(token, videoId) {
  const data = await yt(
    `/videos?part=snippet,statistics,contentDetails&id=${videoId}`,
    token
  );
  const v = data.items?.[0];
  if (!v) return null;
  return {
    id: v.id,
    title: v.snippet.title,
    description: v.snippet.description,
    tags: v.snippet.tags || [],
    thumbnail: v.snippet.thumbnails?.high?.url,
    views: Number(v.statistics.viewCount || 0),
    likes: Number(v.statistics.likeCount || 0),
    comments: Number(v.statistics.commentCount || 0),
    publishedAt: v.snippet.publishedAt,
    duration: v.contentDetails.duration,
    categoryId: v.snippet.categoryId,
  };
}

/**
 * Search YouTube for a keyword and return video results + rough stats
 */
export async function searchYouTube(token, query, maxResults = 15) {
  const searchData = await yt(
    `/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=${maxResults}&order=viewCount`,
    token
  );
  const videoIds = searchData.items?.map(i => i.id.videoId).join(',');
  if (!videoIds) return { items: [] };

  const detailData = await yt(
    `/videos?part=statistics,snippet&id=${videoIds}`,
    token
  );

  const videos = detailData.items?.map(v => ({
    id: v.id,
    title: v.snippet.title,
    channel: v.snippet.channelTitle,
    thumbnail: v.snippet.thumbnails?.medium?.url,
    views: Number(v.statistics.viewCount || 0),
    likes: Number(v.statistics.likeCount || 0),
    publishedAt: v.snippet.publishedAt,
    tags: v.snippet.tags || [],
  })) || [];

  return { items: videos, totalResults: searchData.pageInfo?.totalResults };
}

/**
 * Get trending videos (most popular globally or by category)
 */
export async function getTrendingVideos(token, regionCode = 'US', maxResults = 10) {
  const data = await yt(
    `/videos?part=snippet,statistics&chart=mostPopular&regionCode=${regionCode}&maxResults=${maxResults}`,
    token
  );
  return data.items?.map(v => ({
    id: v.id,
    title: v.snippet.title,
    channel: v.snippet.channelTitle,
    thumbnail: v.snippet.thumbnails?.medium?.url,
    views: Number(v.statistics.viewCount || 0),
    likes: Number(v.statistics.likeCount || 0),
    publishedAt: v.snippet.publishedAt,
    categoryId: v.snippet.categoryId,
    tags: v.snippet.tags || [],
  })) || [];
}

/**
 * Get search suggestions / related searches for keyword analysis
 * Uses YouTube search to estimate competitive landscape
 */
export async function getKeywordAnalysis(token, keyword) {
  const [main, related1, related2] = await Promise.all([
    searchYouTube(token, keyword, 10),
    searchYouTube(token, `${keyword} tutorial`, 5),
    searchYouTube(token, `${keyword} 2025`, 5),
  ]);

  const allVideos = main.items;
  const totalVideos = main.totalResults || 0;
  const avgViews = allVideos.length
    ? Math.round(allVideos.reduce((s, v) => s + v.views, 0) / allVideos.length)
    : 0;
  const maxViews = allVideos.length ? Math.max(...allVideos.map(v => v.views)) : 0;

  // Compute scores heuristically
  const volumeScore = Math.min(100, Math.round((avgViews / 500000) * 100));
  const competitionScore = Math.min(100, Math.round((totalVideos / 1000000) * 100));
  const opportunityScore = Math.max(0, Math.round(volumeScore - competitionScore * 0.4));

  return {
    keyword,
    totalResults: totalVideos,
    avgViews,
    maxViews,
    volumeScore,
    competitionScore,
    opportunityScore,
    topVideos: allVideos.slice(0, 5),
    relatedKeywords: [
      `${keyword} tutorial`,
      `${keyword} 2025`,
      `best ${keyword}`,
      `${keyword} for beginners`,
      `${keyword} tips`,
    ],
    relatedVideos: [...related1.items, ...related2.items].slice(0, 4),
  };
}

/**
 * Parse a YouTube video ID from a URL
 */
export function parseVideoId(url) {
  if (!url) return null;
  // youtu.be/ID
  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch) return shortMatch[1];
  // youtube.com/watch?v=ID
  const longMatch = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (longMatch) return longMatch[1];
  // youtube.com/shorts/ID
  const shortsMatch = url.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
  if (shortsMatch) return shortsMatch[1];
  // plain 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(url.trim())) return url.trim();
  return null;
}

/**
 * Simple SEO scorer for title / description / tags
 */
export function scoreVideo({ title, description, tags }) {
  let score = 0;
  const issues = { title: [], description: [], tags: [] };

  // --- Title ---
  if (title.length >= 40 && title.length <= 70) {
    score += 20; issues.title.push({ type: 'success', text: `Title length is ideal (${title.length} chars)` });
  } else if (title.length < 40) {
    score += 8; issues.title.push({ type: 'warning', text: `Title is short (${title.length} chars) — aim for 40-70` });
  } else {
    score += 12; issues.title.push({ type: 'warning', text: `Title is a bit long (${title.length} chars)` });
  }
  if (/\d/.test(title)) { score += 8; issues.title.push({ type: 'success', text: 'Title contains a number — great for CTR' }); }
  if (/how|why|what|top|best|\d+ (ways|tips|things)/i.test(title)) { score += 7; issues.title.push({ type: 'success', text: 'Title uses a high-CTR keyword format' }); }
  if (title.length > 0) { issues.title.push({ type: 'success', text: 'Title is present ✓' }); }

  // --- Description ---
  if (description.length >= 500) {
    score += 20; issues.description.push({ type: 'success', text: 'Description is detailed (500+ chars)' });
  } else if (description.length >= 200) {
    score += 12; issues.description.push({ type: 'warning', text: 'Description is decent but could be longer (aim for 500+)' });
  } else {
    score += 4; issues.description.push({ type: 'error', text: 'Description is too short — add more detail' });
  }
  if (/(http|www\.)/i.test(description)) { score += 5; issues.description.push({ type: 'success', text: 'Links detected in description ✓' }); }
  else { issues.description.push({ type: 'warning', text: 'Add timestamps and relevant links to description' }); }
  if (/(subscribe|follow|like)/i.test(description)) { score += 4; issues.description.push({ type: 'success', text: 'CTA (subscribe/like) found in description ✓' }); }
  else { issues.description.push({ type: 'warning', text: 'Add a call-to-action (subscribe, follow, etc.)' }); }

  // --- Tags ---
  const tagCount = tags.length;
  if (tagCount >= 8 && tagCount <= 15) {
    score += 15; issues.tags.push({ type: 'success', text: `${tagCount} tags used — ideal range` });
  } else if (tagCount >= 4) {
    score += 8; issues.tags.push({ type: 'warning', text: `${tagCount} tags — add more (aim for 8-15)` });
  } else {
    score += 2; issues.tags.push({ type: 'error', text: 'Too few tags — add at least 8 relevant tags' });
  }
  const hasLongTail = tags.some(t => t.split(' ').length >= 3);
  if (hasLongTail) { score += 6; issues.tags.push({ type: 'success', text: 'Long-tail keyword tags detected ✓' }); }
  else { issues.tags.push({ type: 'warning', text: 'Add long-tail tags (3+ words) for better targeting' }); }

  const overall = Math.min(100, score);
  const titleScore = Math.min(100, Math.round((issues.title.filter(i => i.type === 'success').length / issues.title.length) * 100));
  const descScore = Math.min(100, Math.round((issues.description.filter(i => i.type === 'success').length / issues.description.length) * 100));
  const tagScore = Math.min(100, Math.round((issues.tags.filter(i => i.type === 'success').length / issues.tags.length) * 100));

  return { overall, titleScore, descScore, tagScore, issues };
}

export function formatNumber(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function parseDuration(duration) {
  if (!duration) return '0:00';
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return '0:00';
  const h = (parseInt(match[1]) || 0);
  const m = (parseInt(match[2]) || 0);
  const s = (parseInt(match[3]) || 0);
  let res = '';
  if (h > 0) res += `${h}:`;
  res += `${h > 0 ? m.toString().padStart(2, '0') : m}:${s.toString().padStart(2, '0')}`;
  return res;
}
