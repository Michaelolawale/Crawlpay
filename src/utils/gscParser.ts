import JSZip from 'jszip';

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
  suggestedDomain?: string;
}

/**
 * Detects whether content is separated by comma, semicolon, or tab.
 */
function detectDelimiter(text: string): string {
  const sample = text.slice(0, 4000);
  const commaCount = (sample.match(/,/g) || []).length;
  const semicolonCount = (sample.match(/;/g) || []).length;
  const tabCount = (sample.match(/\t/g) || []).length;

  if (tabCount > commaCount && tabCount > semicolonCount) return '\t';
  if (semicolonCount > commaCount && semicolonCount > tabCount) return ';';
  return ',';
}

/**
 * Split a delimited line into cells respecting quotes.
 */
function splitDelimitedLine(line: string, delimiter: string): string[] {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"' || char === "'") {
      if (inQuotes && line[i + 1] === char) {
        current += char;
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      cells.push(current.trim().replace(/^["']|["']$/g, ''));
      current = '';
    } else {
      current += char;
    }
  }

  cells.push(current.trim().replace(/^["']|["']$/g, ''));
  return cells;
}

/**
 * Parses Google Search Console Indexing export CSV, TSV, or JSON string.
 */
export function parseGscExport(content: string, fileName: string): GscAnalysisResult {
  // 1. Strip UTF-8 Byte Order Mark (BOM) if present
  let clean = content.replace(/^\uFEFF/, '').trim();
  const unindexedUrlsSet = new Set<string>();
  const reasonsDetected = new Set<string>();

  // 2. Try JSON parsing
  if (clean.startsWith('{') || clean.startsWith('[')) {
    try {
      const data = JSON.parse(clean);
      const items = Array.isArray(data)
        ? data
        : data.rows || data.pages || data.items || data.urls || [];

      for (const item of items) {
        if (typeof item === 'string' && item.startsWith('http')) {
          unindexedUrlsSet.add(item.trim());
        } else if (item && typeof item === 'object') {
          const url =
            item.url ||
            item.page ||
            item.URL ||
            item.Page ||
            item.landingPage ||
            item.address;
          if (url && typeof url === 'string' && url.startsWith('http')) {
            unindexedUrlsSet.add(url.trim());
          }
          const reason = item.reason || item.status || item.issue || item.type;
          if (reason && typeof reason === 'string') {
            reasonsDetected.add(reason.trim());
          }
        }
      }

      if (unindexedUrlsSet.size > 0) {
        const urls = Array.from(unindexedUrlsSet);
        return {
          fileName,
          totalUrls: urls.length,
          unindexedUrls: urls,
          reasonsDetected: reasonsDetected.size > 0 ? Array.from(reasonsDetected) : ['JSON Export'],
          suggestedDomain: extractSuggestedDomain(urls),
        };
      }
    } catch {
      // Continue to CSV parser if JSON fails
    }
  }

  // 3. Delimited Table Parsing (CSV, TSV, Semicolon)
  const delimiter = detectDelimiter(clean);
  const lines = clean.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  let urlColIndex = -1;
  let reasonColIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const cols = splitDelimitedLine(rawLine, delimiter);

    // Look for header row if not yet identified
    if (urlColIndex === -1) {
      for (let c = 0; c < cols.length; c++) {
        const header = cols[c].toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
        if (
          header === 'url' ||
          header === 'page' ||
          header === 'top pages' ||
          header === 'page url' ||
          header === 'address' ||
          header === 'landing page' ||
          header === 'inspected url'
        ) {
          urlColIndex = c;
        } else if (
          header === 'reason' ||
          header === 'status' ||
          header === 'type' ||
          header === 'issue' ||
          header === 'indexing state' ||
          header === 'last crawled'
        ) {
          reasonColIndex = c;
        }
      }

      // If this row was the header row, move to next row
      if (urlColIndex !== -1) {
        continue;
      }
    }

    // Process data rows
    if (urlColIndex >= 0 && cols[urlColIndex]) {
      let rawUrl = cols[urlColIndex].trim();
      if (rawUrl.startsWith('//')) {
        rawUrl = `https:${rawUrl}`;
      } else if (/^www\./i.test(rawUrl) || (/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(\/.*)?$/.test(rawUrl) && !rawUrl.includes(' '))) {
        rawUrl = `https://${rawUrl}`;
      }

      if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
        unindexedUrlsSet.add(rawUrl);
        if (reasonColIndex >= 0 && cols[reasonColIndex]) {
          reasonsDetected.add(cols[reasonColIndex].trim());
        }
      }
    }
  }

  // 4. Universal Fallback Regex: If header matching didn't yield URLs, extract any valid URLs
  if (unindexedUrlsSet.size === 0) {
    const urlRegex = /https?:\/\/[^\s"'<>,;()]+/gi;
    let match;
    while ((match = urlRegex.exec(clean)) !== null) {
      const candidate = match[0].trim();
      // Filter out schema.org / w3.org / google namespace references
      if (
        !candidate.includes('schema.org') &&
        !candidate.includes('w3.org') &&
        !candidate.includes('google.com/search') &&
        candidate.length > 10
      ) {
        unindexedUrlsSet.add(candidate);
      }
    }

    if (unindexedUrlsSet.size > 0) {
      reasonsDetected.add('Extracted URLs');
    }
  }

  const unindexedUrls = Array.from(unindexedUrlsSet);

  return {
    fileName,
    totalUrls: unindexedUrls.length,
    unindexedUrls,
    reasonsDetected: Array.from(reasonsDetected),
    suggestedDomain: extractSuggestedDomain(unindexedUrls),
  };
}

/**
 * Parses any uploaded GSC file (handling CSV, TSV, JSON, and ZIP archives directly).
 */
export async function parseGscFile(file: File): Promise<GscAnalysisResult> {
  const isZip =
    file.name.toLowerCase().endsWith('.zip') ||
    file.type === 'application/zip' ||
    file.type === 'application/x-zip-compressed';

  if (isZip) {
    try {
      const buffer = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(buffer);

      // Find relevant CSV files within GSC export ZIP
      // Priority: Table.csv, Pages.csv, then any .csv or .tsv
      const fileNames = Object.keys(zip.files).filter((name) => !zip.files[name].dir);

      const targetFileName =
        fileNames.find((name) => /table\.csv/i.test(name)) ||
        fileNames.find((name) => /pages\.csv/i.test(name)) ||
        fileNames.find((name) => /\.csv$/i.test(name)) ||
        fileNames.find((name) => /\.tsv$/i.test(name)) ||
        fileNames.find((name) => /\.txt$/i.test(name));

      if (targetFileName) {
        const content = await zip.files[targetFileName].async('string');
        return parseGscExport(content, `${file.name} (${targetFileName})`);
      }

      // If no file found inside ZIP
      throw new Error('No CSV or TSV data table found inside this ZIP archive.');
    } catch (err: any) {
      throw new Error(`Failed to extract ZIP archive: ${err?.message || 'Invalid ZIP format'}`);
    }
  }

  // Regular text/CSV/TSV/JSON file
  const text = await file.text();
  return parseGscExport(text, file.name);
}

/**
 * Extracts the most common root domain from a list of URLs to suggest target URL.
 */
function extractSuggestedDomain(urls: string[]): string | undefined {
  if (urls.length === 0) return undefined;
  const domainCounts = new Map<string, number>();

  for (const u of urls) {
    try {
      const parsed = new URL(u);
      const origin = parsed.origin;
      domainCounts.set(origin, (domainCounts.get(origin) || 0) + 1);
    } catch {}
  }

  let topOrigin: string | undefined;
  let maxCount = 0;
  for (const [origin, count] of domainCounts.entries()) {
    if (count > maxCount) {
      maxCount = count;
      topOrigin = origin;
    }
  }

  return topOrigin;
}
