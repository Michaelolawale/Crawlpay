export type BotAccessStatus = 'allowed' | 'blocked' | 'unknown';

export interface RobotsRule {
  path: string;
  allow: boolean;
  patternRegex?: RegExp;
}

export interface UserAgentRecord {
  userAgents: string[];
  rules: RobotsRule[];
}

export interface BotRuleEvaluation {
  bot: string;
  status: BotAccessStatus;
  matchedRule?: string;
  rulePrecedence: 'specific_user_agent' | 'wildcard_fallback' | 'default_allow' | 'fetch_failed';
}

/**
 * RFC 9309 Compliant Robots.txt Parser
 * - Record grouping (User-agent blocks)
 * - Most specific user-agent group matching
 * - Longest-match path precedence (Allow takes precedence on ties)
 * - Wildcard (*) and end-of-string ($) matching
 */
export class RobotsParser {
  private records: UserAgentRecord[] = [];
  private sitemaps: string[] = [];
  private raw?: string;
  private isFetchFailed: boolean = false;
  private defaultUa: string;

  constructor(robotsTxtContent?: string, defaultUserAgent: string = 'CrawlPayBot', isFetchFailed: boolean = false) {
    this.defaultUa = defaultUserAgent;
    this.isFetchFailed = isFetchFailed;
    if (robotsTxtContent !== undefined) {
      this.raw = robotsTxtContent;
      this.parse(robotsTxtContent);
    }
  }

  private parse(content: string): void {
    const lines = content.split(/\r?\n/);
    this.records = [];
    this.sitemaps = [];

    let currentUserAgents: string[] = [];
    let currentRules: RobotsRule[] = [];

    for (let rawLine of lines) {
      // Remove comments
      const commentIdx = rawLine.indexOf('#');
      const line = (commentIdx >= 0 ? rawLine.substring(0, commentIdx) : rawLine).trim();
      if (!line) continue;

      const colonIdx = line.indexOf(':');
      if (colonIdx === -1) continue;

      const field = line.substring(0, colonIdx).trim().toLowerCase();
      const value = line.substring(colonIdx + 1).trim();

      if (field === 'sitemap') {
        if (value && !this.sitemaps.includes(value)) {
          this.sitemaps.push(value);
        }
        continue;
      }

      if (field === 'user-agent') {
        // If we were collecting rules and encounter a new user-agent, save previous record
        if (currentRules.length > 0 && currentUserAgents.length > 0) {
          this.records.push({
            userAgents: [...currentUserAgents],
            rules: [...currentRules],
          });
          currentUserAgents = [];
          currentRules = [];
        }
        if (value) {
          currentUserAgents.push(value.toLowerCase());
        }
      } else if (field === 'disallow' || field === 'allow') {
        if (currentUserAgents.length === 0) continue; // Directive outside a user-agent block is ignored per RFC 9309
        const isAllow = field === 'allow';
        currentRules.push({
          path: value,
          allow: isAllow,
          patternRegex: this.pathToRegex(value),
        });
      }
    }

    // Flush last record
    if (currentUserAgents.length > 0) {
      this.records.push({
        userAgents: [...currentUserAgents],
        rules: [...currentRules],
      });
    }
  }

  /**
   * Converts RFC 9309 path pattern with * and $ to RegExp
   */
  private pathToRegex(pattern: string): RegExp | undefined {
    if (!pattern) return undefined;
    // Escape regex special chars except * and $
    let escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
    escaped = escaped.replace(/\*/g, '.*');
    if (escaped.endsWith('\\$')) {
      // It had an actual $, replace with end anchor
      escaped = escaped.slice(0, -2) + '$';
    } else {
      escaped = escaped + '.*';
    }
    return new RegExp(`^${escaped}`);
  }

  /**
   * RFC 9309 Group Matching:
   * 1. Look for record matching target UA explicitly.
   * 2. If found, evaluate against rules in that record.
   * 3. Else fallback to User-agent: * record.
   * 4. Else default allow.
   */
  public evaluateBot(botName: string, pathname: string = '/'): BotRuleEvaluation {
    if (this.isFetchFailed || this.raw === undefined) {
      return {
        bot: botName,
        status: 'unknown',
        rulePrecedence: 'fetch_failed',
      };
    }

    const target = botName.toLowerCase();

    // 1. Check for specific UA match
    const specificRecord = this.records.find((rec) =>
      rec.userAgents.some((ua) => ua === target || target.includes(ua) || ua.includes(target))
    );

    if (specificRecord) {
      return this.matchRules(specificRecord.rules, pathname, botName, 'specific_user_agent');
    }

    // 2. Check for wildcard * match
    const wildcardRecord = this.records.find((rec) =>
      rec.userAgents.some((ua) => ua === '*')
    );

    if (wildcardRecord) {
      return this.matchRules(wildcardRecord.rules, pathname, botName, 'wildcard_fallback');
    }

    // 3. Default allow
    return {
      bot: botName,
      status: 'allowed',
      rulePrecedence: 'default_allow',
    };
  }

  /**
   * RFC 9309 Rule Evaluation:
   * Longest match takes precedence.
   * If allow and disallow have identical length, Allow takes precedence.
   */
  private matchRules(
    rules: RobotsRule[],
    pathname: string,
    botName: string,
    precedence: 'specific_user_agent' | 'wildcard_fallback'
  ): BotRuleEvaluation {
    let longestMatchLen = -1;
    let matchedRule: RobotsRule | null = null;

    for (const rule of rules) {
      if (!rule.path) {
        // Disallow: with empty value means allow everything
        if (longestMatchLen < 0) {
          longestMatchLen = 0;
          matchedRule = { path: '', allow: true };
        }
        continue;
      }

      const isMatch = rule.patternRegex
        ? rule.patternRegex.test(pathname)
        : pathname.startsWith(rule.path);

      if (isMatch) {
        const matchLen = rule.path.length;
        if (matchLen > longestMatchLen) {
          longestMatchLen = matchLen;
          matchedRule = rule;
        } else if (matchLen === longestMatchLen && rule.allow && matchedRule && !matchedRule.allow) {
          // RFC 9309 tie-breaker: Allow overrides Disallow on identical match lengths
          matchedRule = rule;
        }
      }
    }

    if (matchedRule) {
      return {
        bot: botName,
        status: matchedRule.allow ? 'allowed' : 'blocked',
        matchedRule: `${matchedRule.allow ? 'Allow' : 'Disallow'}: ${matchedRule.path}`,
        rulePrecedence: precedence,
      };
    }

    return {
      bot: botName,
      status: 'allowed',
      rulePrecedence: precedence,
    };
  }

  public isAllowed(pathname: string, userAgent: string = this.defaultUa): boolean {
    const res = this.evaluateBot(userAgent, pathname);
    return res.status !== 'blocked';
  }

  public getSitemaps(): string[] {
    return this.sitemaps;
  }

  public getRaw(): string | undefined {
    return this.raw;
  }

  public getDisallowedRules(): string[] {
    const rules: string[] = [];
    for (const rec of this.records) {
      for (const r of rec.rules) {
        if (!r.allow && r.path) rules.push(r.path);
      }
    }
    return rules;
  }
}
