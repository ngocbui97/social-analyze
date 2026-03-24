const BASE = 'https://youtubeanalytics.googleapis.com/v2';

async function yta(path, params, token) {
  const query = new URLSearchParams({
    ids: 'channel==MINE',
    ...params
  }).toString();

  const res = await fetch(`${BASE}${path}?${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `YouTube Analytics API error ${res.status}`);
  }
  return res.json();
}

function getDates(daysAgo = 28) {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - daysAgo);
  
  const formatDate = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };
  return { startDate: formatDate(start), endDate: formatDate(end) };
}

/**
 * Helper to parse the rows and columnHeaders from the API response into a friendly array of objects
 */
function parseReport(data) {
  if (!data || !data.rows || !data.columnHeaders) return [];
  return data.rows.map(row => {
    const obj = {};
    data.columnHeaders.forEach((header, index) => {
      obj[header.name] = row[index];
    });
    return obj;
  });
}

export async function getViewerDemographics(token, days = 28) {
  const { startDate, endDate } = getDates(days);
  const data = await yta('/reports', {
    startDate,
    endDate,
    metrics: 'viewerPercentage',
    dimensions: 'ageGroup,gender',
    sort: 'gender,ageGroup'
  }, token);
  return parseReport(data);
}

export async function getTrafficSources(token, days = 28) {
  const { startDate, endDate } = getDates(days);
  const data = await yta('/reports', {
    startDate,
    endDate,
    metrics: 'views,estimatedMinutesWatched',
    dimensions: 'insightTrafficSourceType',
    sort: '-views',
    maxResults: '10'
  }, token);
  return parseReport(data);
}

export async function getGeography(token, days = 28) {
  const { startDate, endDate } = getDates(days);
  const data = await yta('/reports', {
    startDate,
    endDate,
    metrics: 'views,estimatedMinutesWatched,averageViewDuration',
    dimensions: 'country',
    sort: '-views',
    maxResults: '10'
  }, token);
  return parseReport(data);
}

export async function getDeviceTypes(token, days = 28) {
  const { startDate, endDate } = getDates(days);
  const data = await yta('/reports', {
    startDate,
    endDate,
    metrics: 'views,estimatedMinutesWatched',
    dimensions: 'deviceType',
    sort: '-views'
  }, token);
  return parseReport(data);
}

export async function getTimeSeriesMetrics(token, days = 28) {
  const { startDate, endDate } = getDates(days);
  const data = await yta('/reports', {
    startDate,
    endDate,
    metrics: 'views,estimatedMinutesWatched,averageViewDuration,likes,subscribersGained,shares,comments',
    dimensions: 'day',
    sort: 'day'
  }, token);
  return parseReport(data);
}

export async function getOverviewMetrics(token, days = 28) {
  const { startDate, endDate } = getDates(days);
  const data = await yta('/reports', {
    startDate,
    endDate,
    metrics: 'views,estimatedMinutesWatched,averageViewDuration,likes,subscribersGained,shares,comments',
  }, token);
  return parseReport(data)?.[0] || null;
}
