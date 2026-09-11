/**
 * IESO Directory Index Parser Utility
 * Fetches and parses available historical report dates and versions
 */

const DIRECTORY_PROXY_URL = '/api/ieso-reports/?C=M;O=D';
const DIRECTORY_DIRECT_URL = 'https://reports-public.ieso.ca/public/GenOutputCapability/?C=M;O=D';
const CORS_PROXY_URL = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(DIRECTORY_DIRECT_URL);

export async function fetchAvailableReportsIndex() {
  let html = null;

  try {
    const res = await fetch(DIRECTORY_PROXY_URL);
    if (res.ok) html = await res.text();
  } catch (err1) {
    console.warn('Vite proxy directory fetch failed, trying direct...', err1);
  }

  if (!html) {
    try {
      const res = await fetch(DIRECTORY_DIRECT_URL);
      if (res.ok) html = await res.text();
    } catch (err2) {
      console.warn('Direct directory fetch failed, trying CORS proxy...', err2);
    }
  }

  if (!html) {
    try {
      const res = await fetch(CORS_PROXY_URL);
      if (res.ok) html = await res.text();
    } catch (err3) {
      console.warn('CORS proxy directory fetch failed.', err3);
    }
  }

  if (!html) {
    return { dates: [], versionsByDate: {} };
  }

  const matches = html.match(/href=["'](PUB_GenOutputCapability[^"']+)["']/gi) || [];
  const versionsByDate = {};
  const datesSet = new Set();

  matches.forEach(m => {
    const filenameMatch = m.match(/PUB_GenOutputCapability[^"']+/i);
    if (!filenameMatch) return;
    const filename = filenameMatch[0];

    // Pattern: PUB_GenOutputCapability_YYYYMMDD_vN.xml
    const matchVer = filename.match(/PUB_GenOutputCapability_(\d{8})_v(\d+)\.xml/i);
    if (matchVer) {
      const dateStr = matchVer[1];
      const verNum = parseInt(matchVer[2], 10);
      const formattedDate = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;

      datesSet.add(formattedDate);
      if (!versionsByDate[formattedDate]) {
        versionsByDate[formattedDate] = new Set();
      }
      versionsByDate[formattedDate].add(verNum);
    }
  });

  const sortedDates = Array.from(datesSet).sort((a, b) => b.localeCompare(a));
  const resultVersionsMap = {};

  sortedDates.forEach(d => {
    resultVersionsMap[d] = Array.from(versionsByDate[d] || []).sort((a, b) => b - a);
  });

  return {
    dates: sortedDates,
    versionsByDate: resultVersionsMap
  };
}

/**
 * Format report filename for a given date (YYYY-MM-DD) and version (number)
 */
export function buildReportFilename(dateStr, verNum) {
  if (!dateStr || !verNum) return 'PUB_GenOutputCapability.xml';
  const cleanDate = dateStr.replace(/-/g, '');
  return `PUB_GenOutputCapability_${cleanDate}_v${verNum}.xml`;
}

/**
 * Calculate milliseconds until the next :20 past the hour (XX:20)
 */
export function getMsUntilNext20Past() {
  const now = new Date();
  const next20 = new Date(now);

  if (now.getMinutes() >= 20) {
    next20.setHours(now.getHours() + 1);
  }
  next20.setMinutes(20, 0, 0);

  return Math.max(1000, next20.getTime() - now.getTime());
}
