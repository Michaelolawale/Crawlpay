export interface GscUrlEntry {
  url: string;
  reason?: string;
  lastCrawled?: string;
}

export interface GscAnalysisResult {
  fileName: string;
  totalUrls: number;
  unindexedUrls: string[];
  reasonsDetected: string[];
}

/**
 * Parses Google Search Console Indexing export CSV or JSON
 * specifically extracting "Crawled - currently not indexed" URLs
 */
export function parseGscExport(content: string, fileName: string): GscAnalysisResult {
  const unindexedUrls: string[] = [];
  const reasonsDetected = new Set<string>();

  // Check if content is JSON
  if (content.trim().startsWith('{') || content.trim().startsWith('[')) {
    try {
      const data = JSON.parse(content);
      const items = Array.isArray(data) ? data : data.rows || data.pages || [];
      for (const item of items) {
        const url = item.url || item.page || item.URL || item.Page;
        if (url && typeof url === 'string' && url.startsWith('http')) {
          unindexedUrls.push(url.trim());
        }
      }
      return {
        fileName,
        totalUrls: unindexedUrls.length,
        unindexedUrls,
        reasonsDetected: ['JSON Export'],
      };
    } catch {}
  }

  // Parse CSV format
  const lines = content.split(/\r?\n/);
  let urlColIndex = -1;
  let reasonColIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = line.split(',').map((c) => c.replace(/^["']|["']$/g, '').trim());

    // Check header line
    if (urlColIndex === -1) {
      for (let c = 0; c < cols.length; c++) {
        const h = cols[c].toLowerCase();
        if (h === 'url' || h === 'page' || h === 'address' || h === 'landing page') {
          urlColIndex = c;
        } else if (h === 'reason' || h === 'status' || h === 'type') {
          reasonColIndex = c;
        }
      }
      continue;
    }

    // Data line
    if (urlColIndex >= 0 && cols[urlColIndex]) {
      const rawUrl = cols[urlColIndex];
      if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
        unindexedUrls.push(rawUrl);
        if (reasonColIndex >= 0 && cols[reasonColIndex]) {
          reasonsDetected.add(cols[reasonColIndex]);
        }
      }
    }
  }

  return {
    fileName,
    totalUrls: unindexedUrls.length,
    unindexedUrls,
    reasonsDetected: Array.from(reasonsDetected),
  };
}
