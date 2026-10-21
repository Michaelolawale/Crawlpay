export interface RobotsRule {
  path: string;
  allow: boolean;
}

export interface ParsedRobotsTxt {
  raw: string;
  sitemaps: string[];
  rules: RobotsRule[];
  disallowAll: boolean;
}

export class RobotsParser {
  private rules: RobotsRule[] = [];
  private sitemaps: string[] = [];
  private raw: string = '';

  constructor(robotsTxtContent?: string, userAgent: string = 'CrawlPayBot') {
    if (robotsTxtContent) {
      this.raw = robotsTxtContent;
      this.parse(robotsTxtContent, userAgent);
    }
  }

  private parse(content: string, targetUa: string): void {
    const lines = content.split(/\r?\n/);
    const uaLower = targetUa.toLowerCase();

    let currentUaMatches = false;
    const specificRules: RobotsRule[] = [];
    const wildcardRules: RobotsRule[] = [];

    for (let line of lines) {
      // Remove comments
      const commentIndex = line.indexOf('#');
      if (commentIndex >= 0) {
        line = line.substring(0, commentIndex);
      }
      line = line.trim();
      if (!line) continue;

      const colonIndex = line.indexOf(':');
      if (colonIndex === -1) continue;

      const field = line.substring(0, colonIndex).trim().toLowerCase();
      const value = line.substring(colonIndex + 1).trim();

      if (field === 'user-agent') {
        const ua = value.toLowerCase();
        if (ua === '*' || ua === uaLower) {
          currentUaMatches = true;
        } else {
          currentUaMatches = false;
        }
      } else if (field === 'sitemap') {
        if (value && !this.sitemaps.includes(value)) {
          this.sitemaps.push(value);
        }
      } else if (currentUaMatches && (field === 'disallow' || field === 'allow')) {
        const isAllow = field === 'allow';
        const rule: RobotsRule = {
          path: value,
          allow: isAllow,
        };
        specificRules.push(rule);
      }
    }

    this.rules = specificRules.length > 0 ? specificRules : wildcardRules;
  }

  public isAllowed(pathname: string): boolean {
    if (this.rules.length === 0) return true;

    // Check longest matching rule
    let matchedRule: RobotsRule | null = null;
    let maxMatchLen = -1;

    for (const rule of this.rules) {
      if (!rule.path) continue; // Empty Disallow: means allow all
      if (pathname.startsWith(rule.path)) {
        if (rule.path.length > maxMatchLen) {
          maxMatchLen = rule.path.length;
          matchedRule = rule;
        }
      }
    }

    if (matchedRule) {
      return matchedRule.allow;
    }

    return true;
  }

  public getSitemaps(): string[] {
    return this.sitemaps;
  }

  public getRaw(): string {
    return this.raw;
  }

  public getDisallowedRules(): string[] {
    return this.rules.filter((r) => !r.allow && r.path).map((r) => r.path);
  }
}
