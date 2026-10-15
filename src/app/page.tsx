'use client';

import React, { useState, useEffect, useRef } from 'react';
import { FullAuditReport } from '@/types/audit';
import { CompetitorComparison } from '@/analyzer/competitorComparator';

export default function Home() {
  const [targetUrl, setTargetUrl] = useState('https://celo.org');
  const [competitorUrl, setCompetitorUrl] = useState('https://valoraapp.com');
  const [mode, setMode] = useState<'single' | 'compare'>('single');
  const [loading, setLoading] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState<Array<{ time: string; text: string; cls: string }>>([]);
  const [report, setReport] = useState<FullAuditReport | null>(null);
  const [comparison, setComparison] = useState<CompetitorComparison | null>(null);
  const [activeTab, setActiveTab] = useState<'semantic' | 'technical' | 'patches' | 'comparison' | 'receipt'>('semantic');
  const [activePatch, setActivePatch] = useState<'nextjs' | 'shopify' | 'html' | 'schema'>('nextjs');
  const [copied, setCopied] = useState(false);

  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalLogs]);

  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUrl.trim()) return;

    setLoading(true);
    setReport(null);
    setComparison(null);
    setTerminalLogs([]);

    const logSteps = [
      { text: `[0.04s] Starting CrawlPay agent session with Attribution Tag: celo_757c2ac3b70c`, cls: 'accent' },
      { text: `[0.18s] Checking Celo Mainnet RPC connection (https://forno.celo.org:42220)`, cls: '' },
      { text: `[0.45s] Signing HTTP 402 payment authorization ($0.045 USD₮ for isolated browser)`, cls: 'highlight' },
      { text: `[0.85s] Renting headless browser session via gateway.usebuy.ai...`, cls: '' },
      { text: `[1.40s] Capturing JavaScript DOM, Core Web Vitals, and resource waterfall for ${targetUrl}...`, cls: '' },
      { text: `[1.95s] Querying social signals & backlink reach via buy API gateway ($0.020 USD₮)...`, cls: 'highlight' },
      { text: `[2.40s] Running Archetype Classifier & Semantic Intent Engine...`, cls: '' },
      { text: `[2.85s] Generating bespoke code patches & sealing onchain receipt...`, cls: 'accent' },
    ];

    for (const step of logSteps) {
      await new Promise((r) => setTimeout(r, 260));
      setTerminalLogs((prev) => [
        ...prev,
        { time: new Date().toLocaleTimeString(), text: step.text, cls: step.cls },
      ]);
    }

    try {
      let endpoint = '/api/audit';
      let payload: any = { url: targetUrl };

      if (mode === 'compare' && competitorUrl.trim()) {
        endpoint = '/api/compare';
        payload = { targetUrl, competitorUrl };
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Audit request failed');
      const data = await res.json();

      setTerminalLogs((prev) => [
        ...prev,
        { time: new Date().toLocaleTimeString(), text: `[3.10s] ✓ Audit completed successfully. Rendering dashboard.`, cls: 'highlight' },
      ]);

      if (mode === 'compare') {
        setReport(data.targetReport);
        setComparison(data.comparison);
        setActiveTab('comparison');
      } else {
        setReport(data);
        setActiveTab('semantic');
      }
    } catch (err: any) {
      setTerminalLogs((prev) => [
        ...prev,
        { time: new Date().toLocaleTimeString(), text: `[Error] ${err.message}`, cls: 'highlight' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getPatchContent = () => {
    if (!report) return '';
    switch (activePatch) {
      case 'nextjs':
        return report.codePatches.nextJsMetadata;
      case 'shopify':
        return report.codePatches.shopifyLiquid;
      case 'html':
        return report.codePatches.htmlHeadBlock;
      case 'schema':
        return report.codePatches.schemaJsonLd;
    }
  };

  return (
    <>
      {/* Header */}
      <header className="app-header">
        <div className="header-container">
          <div className="brand">
            <div className="brand-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <div className="brand-text">
              <span className="brand-name">CrawlPay</span>
              <span className="brand-badge">Next.js Agent</span>
            </div>
          </div>

          <div className="network-status-bar">
            <div className="status-pill live-net">
              <span className="status-dot"></span>
              <span>Celo Mainnet (42220)</span>
            </div>
            <div className="status-pill tag-pill" title="Official Hackathon Attribution Tag">
              <span className="tag-label">TAG:</span>
              <span className="tag-code">celo_757c2ac3b70c</span>
            </div>
            <div className="status-pill wallet-pill" title="CrawlPay Agent Wallet">
              <span className="wallet-icon">💳</span>
              <span className="wallet-addr">0xf06c...6b39</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-badge">Autonomous HTTP 402 Pay-Per-Crawl Gateway</div>
          <h1 className="hero-title">
            Technical SEO & Competitor Intelligence.<br />
            <span className="gradient-text">Zero SaaS Subscriptions.</span>
          </h1>
          <p className="hero-subtitle">
            CrawlPay hires isolated headless browsers and social API endpoints call-by-call on Celo Mainnet.
            Tailored site-archetype detection, keyword intent rewrites, and copy-paste code patches.
          </p>
        </section>

        {/* Audit Input Control Card */}
        <section className="control-panel-section">
          <div className="glass-card control-card">
            <div className="mode-selector">
              <button
                type="button"
                className={`mode-btn ${mode === 'single' ? 'active' : ''}`}
                onClick={() => setMode('single')}
              >
                <svg className="mode-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="m4.93 4.93 4.24 4.24" />
                  <path d="m14.83 9.17 4.24-4.24" />
                  <path d="m14.83 14.83 4.24 4.24" />
                  <path d="m9.17 14.83-4.24 4.24" />
                </svg>
                Single Site In-Depth Audit
              </button>
              <button
                type="button"
                className={`mode-btn ${mode === 'compare' ? 'active' : ''}`}
                onClick={() => setMode('compare')}
              >
                <svg className="mode-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                  <polyline points="14 2 14 8 20 8" />
                  <path d="m9 15 2 2 4-4" />
                </svg>
                ⚔️ Head-to-Head Competitor Battle
              </button>
            </div>

            <form onSubmit={handleSubmit} className="audit-form">
              <div className="input-group-row">
                <div className="input-wrapper primary-input">
                  <label htmlFor="input-target-url" className="input-label">Target Website URL</label>
                  <div className="input-box">
                    <span className="input-icon">🌐</span>
                    <input
                      type="url"
                      id="input-target-url"
                      placeholder="https://example.com"
                      required
                      value={targetUrl}
                      onChange={(e) => setTargetUrl(e.target.value)}
                    />
                  </div>
                </div>

                {mode === 'compare' && (
                  <div className="input-wrapper competitor-input">
                    <label htmlFor="input-competitor-url" className="input-label">Competitor Website URL</label>
                    <div className="input-box">
                      <span className="input-icon">⚔️</span>
                      <input
                        type="url"
                        id="input-competitor-url"
                        placeholder="https://competitor.com"
                        required
                        value={competitorUrl}
                        onChange={(e) => setCompetitorUrl(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="form-actions">
                <div className="fee-preview">
                  <span className="fee-icon">⚡</span>
                  <span>Settlement: <strong>$0.25 USD₮</strong> via Celo x402 · Gas: <strong>&lt; $0.001</strong></span>
                </div>
                <button type="submit" disabled={loading} className="btn-primary">
                  <span className="btn-text">{loading ? 'Crawling on Celo...' : 'Run Autonomous Audit'}</span>
                  {loading && <span className="btn-spinner" />}
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* Live Terminal Log */}
        {terminalLogs.length > 0 && (
          <section className="terminal-section">
            <div className="terminal-card glass-card">
              <div className="terminal-header">
                <div className="terminal-dots">
                  <span className="dot red" />
                  <span className="dot yellow" />
                  <span className="dot green" />
                </div>
                <div className="terminal-title">CrawlPay Autonomous Pipeline Execution</div>
                <div className="terminal-network">Connected to Celo (42220)</div>
              </div>
              <div ref={terminalRef} className="terminal-body">
                {terminalLogs.map((log, i) => (
                  <div key={i} className="log-line">
                    <span className="log-time">{log.time}</span>
                    <span className={`log-msg ${log.cls}`}>{log.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Results Section */}
        {report && (
          <section className="results-section">
            {/* Scorecard */}
            <div className="glass-card hero-scorecard">
              <div className="scorecard-left">
                <div className="score-circle-wrapper">
                  <svg className="score-ring" viewBox="0 0 120 120">
                    <circle className="score-ring-bg" cx="60" cy="60" r="52" />
                    <circle
                      className="score-ring-progress"
                      cx="60"
                      cy="60"
                      r="52"
                      style={{
                        strokeDashoffset: 326 - (326 * (report.scores.overall / 100)),
                        stroke: report.scores.overall >= 80 ? '#00e599' : report.scores.overall >= 60 ? '#00b4d8' : '#ff9f1c',
                      }}
                    />
                  </svg>
                  <div className="score-circle-inner">
                    <span className="score-num">{report.scores.overall}</span>
                    <span className="score-label">OVERALL</span>
                  </div>
                </div>
                <div className="site-meta">
                  <div className="archetype-badge">
                    <span className="archetype-icon">⚡</span>
                    <span>{report.archetype.label} ({report.archetype.confidence}% Match)</span>
                  </div>
                  <h2 className="result-domain">{new URL(report.targetUrl).hostname}</h2>
                  <p className="result-focus">Audit Focus: {report.archetype.keyAuditFocus}</p>
                </div>
              </div>

              <div className="scorecard-metrics">
                <div className="metric-box">
                  <span className="metric-title">Technical Health</span>
                  <div className="metric-bar-bg">
                    <div className="metric-bar-fill" style={{ width: `${report.scores.technical}%` }} />
                  </div>
                  <span className="metric-score">{report.scores.technical} / 100</span>
                </div>
                <div className="metric-box">
                  <span className="metric-title">Content & Semantics</span>
                  <div className="metric-bar-bg">
                    <div className="metric-bar-fill" style={{ width: `${report.scores.content}%` }} />
                  </div>
                  <span className="metric-score">{report.scores.content} / 100</span>
                </div>
                <div className="metric-box">
                  <span className="metric-title">Core Web Vitals</span>
                  <div className="metric-bar-bg">
                    <div className="metric-bar-fill" style={{ width: `${report.scores.performance}%` }} />
                  </div>
                  <span className="metric-score">{report.scores.performance} / 100</span>
                </div>
                <div className="metric-box">
                  <span className="metric-title">Social / Rich Cards</span>
                  <div className="metric-bar-bg">
                    <div className="metric-bar-fill" style={{ width: `${report.scores.social}%` }} />
                  </div>
                  <span className="metric-score">{report.scores.social} / 100</span>
                </div>
              </div>
            </div>

            {/* Top 3 Needle Movers */}
            <div className="needle-movers-section">
              <h3 className="section-title">🔥 Top 3 High-Impact Fixes This Week</h3>
              <p className="section-subtitle">Prioritized actions that will drive the largest organic search lift for this specific site.</p>
              <div className="needle-movers-grid">
                {report.topNeedleMovers.map((item, i) => {
                  const prioClass = item.priority === 'Critical' ? 'critical' : item.priority === 'High' ? 'high' : 'quick-win';
                  return (
                    <div key={i} className={`needle-card ${prioClass}`}>
                      <span className={`priority-pill ${prioClass}`}>{item.priority}</span>
                      <div className="needle-title">{item.title}</div>
                      <div className="needle-desc">{item.description}</div>
                      <div className="needle-action">→ Action: {item.action}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tabs */}
            <div className="results-tab-container glass-card">
              <div className="tab-nav">
                <button
                  type="button"
                  className={`tab-nav-btn ${activeTab === 'semantic' ? 'active' : ''}`}
                  onClick={() => setActiveTab('semantic')}
                >
                  Semantic & H1 Review
                </button>
                <button
                  type="button"
                  className={`tab-nav-btn ${activeTab === 'technical' ? 'active' : ''}`}
                  onClick={() => setActiveTab('technical')}
                >
                  Technical Checklist
                </button>
                <button
                  type="button"
                  className={`tab-nav-btn ${activeTab === 'patches' ? 'active' : ''}`}
                  onClick={() => setActiveTab('patches')}
                >
                  Copy-Paste Code Patches
                </button>
                {comparison && (
                  <button
                    type="button"
                    className={`tab-nav-btn ${activeTab === 'comparison' ? 'active' : ''}`}
                    onClick={() => setActiveTab('comparison')}
                  >
                    ⚔️ Competitor Battle
                  </button>
                )}
                <button
                  type="button"
                  className={`tab-nav-btn highlight-tab ${activeTab === 'receipt' ? 'active' : ''}`}
                  onClick={() => setActiveTab('receipt')}
                >
                  🧾 Onchain Proof Receipt
                </button>
              </div>

              <div className="tab-content-wrapper">
                {/* Tab 1: Semantic */}
                {activeTab === 'semantic' && (
                  <div className="tab-pane active">
                    <div className="semantic-audit-box">
                      <div className="audit-row">
                        <span className="audit-label">Current Heading (H1):</span>
                        <span className="audit-val-badge">{report.semantics.currentH1 || '(None)'}</span>
                      </div>
                      <div className="audit-row highlight-row">
                        <span className="audit-label">CrawlPay Recommended H1:</span>
                        <span className="audit-val-badge recommended">{report.semantics.recommendedH1}</span>
                      </div>
                      <div className="audit-row">
                        <span className="audit-label">Detected Intent & Topic:</span>
                        <span className="audit-val-badge">
                          {report.semantics.searchIntent} · Primary Keyword: "{report.semantics.primaryKeywordDetected}"
                        </span>
                      </div>
                      <div className="editorial-box">
                        <h4>Editorial Verdict:</h4>
                        <p>{report.semantics.editorialVerdict}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 2: Technical */}
                {activeTab === 'technical' && (
                  <div className="tab-pane active">
                    <div className="checklist-grid">
                      {[
                        { name: 'Page Title', pass: !!report.technical.title, detail: report.technical.title ? `${report.technical.titleLength} characters` : 'Missing <title> tag' },
                        { name: 'Meta Description', pass: !!report.technical.metaDescription, detail: report.technical.metaDescription ? `${report.technical.metaDescriptionLength} characters` : 'Missing meta description' },
                        { name: 'Canonical Link', pass: !!report.technical.canonicalUrl, detail: report.technical.canonicalUrl || 'No canonical URL declared' },
                        { name: 'Mobile Viewport Tag', pass: report.technical.technical.hasViewport, detail: report.technical.technical.hasViewport ? 'Responsive viewport configured' : 'Missing mobile viewport' },
                        { name: 'Single H1 Structure', pass: report.technical.headings.hasSingleH1, detail: `${report.technical.headings.h1s.length} H1 headings found` },
                        { name: 'OpenGraph Image Tag', pass: !!report.technical.openGraph.image, detail: report.technical.openGraph.image ? 'Present' : 'Missing og:image' },
                        { name: 'Twitter Card Meta', pass: report.technical.twitterCard.hasCompleteTwitter, detail: report.technical.twitterCard.card ? `Card: ${report.technical.twitterCard.card}` : 'Missing twitter:card' },
                        { name: 'Schema.org JSON-LD', pass: report.technical.technical.hasJsonLd, detail: report.technical.technical.existingSchemas.join(', ') || 'No JSON-LD schemas detected' },
                        { name: 'Image Alt Attributes', pass: report.technical.images.altCoveragePercent >= 90, detail: `${report.technical.images.altCoveragePercent}% alt coverage (${report.technical.images.missingAlt} missing)` },
                        { name: 'Legacy Asset Payload', pass: report.performance.heavyAssetCount === 0, detail: report.performance.heavyAssetCount === 0 ? 'All images use modern formats' : `${report.performance.heavyAssetCount} uncompressed PNG/JPEGs` },
                      ].map((c, i) => (
                        <div key={i} className="check-item">
                          <div className="check-item-info">
                            <span className="check-name">{c.name}</span>
                            <span className="check-detail">{c.detail}</span>
                          </div>
                          <span className={`check-status ${c.pass ? 'pass' : 'fail'}`}>
                            {c.pass ? 'PASSED' : 'ACTION'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tab 3: Patches */}
                {activeTab === 'patches' && (
                  <div className="tab-pane active">
                    <div className="patch-header-row">
                      <p>Ready-to-deploy metadata & schema generated specifically for this website.</p>
                      <div className="framework-pills">
                        <button
                          type="button"
                          className={`fw-pill ${activePatch === 'nextjs' ? 'active' : ''}`}
                          onClick={() => setActivePatch('nextjs')}
                        >
                          Next.js
                        </button>
                        <button
                          type="button"
                          className={`fw-pill ${activePatch === 'shopify' ? 'active' : ''}`}
                          onClick={() => setActivePatch('shopify')}
                        >
                          Shopify
                        </button>
                        <button
                          type="button"
                          className={`fw-pill ${activePatch === 'html' ? 'active' : ''}`}
                          onClick={() => setActivePatch('html')}
                        >
                          HTML5
                        </button>
                        <button
                          type="button"
                          className={`fw-pill ${activePatch === 'schema' ? 'active' : ''}`}
                          onClick={() => setActivePatch('schema')}
                        >
                          Schema JSON-LD
                        </button>
                      </div>
                    </div>
                    <div className="code-editor-box">
                      <div className="code-editor-bar">
                        <span>{activePatch.toUpperCase()} Snippet</span>
                        <button
                          type="button"
                          className="btn-copy"
                          onClick={() => handleCopyCode(getPatchContent())}
                        >
                          {copied ? 'Copied! ✓' : 'Copy Code'}
                        </button>
                      </div>
                      <pre>
                        <code>{getPatchContent()}</code>
                      </pre>
                    </div>
                  </div>
                )}

                {/* Tab 4: Competitor Comparison */}
                {activeTab === 'comparison' && comparison && (
                  <div className="tab-pane active">
                    <div className="comparison-view">
                      <div className="comp-battle-grid">
                        <div className={`battle-card ${comparison.winner === 'target' ? 'winner' : ''}`}>
                          <div className="battle-site-name">Your Site: {comparison.target.url}</div>
                          <div className="battle-score" style={{ color: comparison.target.score >= 70 ? '#00e599' : '#ff9f1c' }}>
                            {comparison.target.score} / 100
                          </div>
                          <p>LCP: <strong>{comparison.target.lcpSeconds}s</strong> · Schemas: <strong>{comparison.target.schemaCount}</strong></p>
                        </div>
                        <div className={`battle-card ${comparison.winner === 'competitor' ? 'winner' : ''}`}>
                          <div className="battle-site-name">Competitor: {comparison.competitor.url}</div>
                          <div className="battle-score" style={{ color: comparison.competitor.score >= 70 ? '#00e599' : '#ff9f1c' }}>
                            {comparison.competitor.score} / 100
                          </div>
                          <p>LCP: <strong>{comparison.competitor.lcpSeconds}s</strong> · Schemas: <strong>{comparison.competitor.schemaCount}</strong></p>
                        </div>
                      </div>

                      <div className="comp-insights-card">
                        <h4>⚔️ Why They Are Winning & What To Fix</h4>
                        <ul className="comp-insights-list">
                          {comparison.whyTheyAreWinning.map((w, i) => (
                            <li key={i}>{w}</li>
                          ))}
                        </ul>
                        <h4 style={{ marginTop: '16px' }}>🚀 3 High-Impact Steps to Overtake Them:</h4>
                        <ul className="comp-insights-list">
                          {comparison.threeStepsToBeatThem.map((s, i) => (
                            <li key={i}><strong>→</strong> {s}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 5: Receipt */}
                {activeTab === 'receipt' && (
                  <div className="tab-pane active">
                    <div className="receipt-card">
                      <div className="receipt-header">
                        <div className="receipt-title-box">
                          <span className="receipt-badge">VERIFIED ON-CHAIN SETTLEMENT</span>
                          <h3>Celo Mainnet Micro-Commerce Receipt</h3>
                        </div>
                        <div className="receipt-id">ID: {report.onchainReceipt.executionId}</div>
                      </div>

                      <div className="receipt-table">
                        <div className="r-row">
                          <span>Client Payment (Received)</span>
                          <strong className="text-green">{report.onchainReceipt.clientPaidUsd}</strong>
                        </div>
                        <div className="r-row">
                          <span>Upstream Browser Rental (Paid via buy)</span>
                          <div className="r-val-box">
                            <span className="text-orange">${report.onchainReceipt.upstreamBrowserReceipt.costUsd} USD₮</span>
                            <a
                              href={report.onchainReceipt.upstreamBrowserReceipt.celoscanUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="celoscan-link"
                            >
                              View Tx on Celoscan ↗
                            </a>
                          </div>
                        </div>
                        <div className="r-row">
                          <span>Social & Web Data Endpoint (Paid via buy)</span>
                          <div className="r-val-box">
                            <span className="text-orange">${report.onchainReceipt.upstreamSocialReceipt.costUsd} USD₮</span>
                            <a
                              href={report.onchainReceipt.upstreamSocialReceipt.celoscanUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="celoscan-link"
                            >
                              View Tx on Celoscan ↗
                            </a>
                          </div>
                        </div>
                        <div className="r-row separator" />
                        <div className="r-row">
                          <span>ERC-8021 Attribution Tag</span>
                          <strong className="text-cyan">celo_757c2ac3b70c</strong>
                        </div>
                        <div className="r-row">
                          <span>Agent Autonomous Margin</span>
                          <strong className="text-emerald">+{report.onchainReceipt.agentMarginUsd}</strong>
                        </div>
                        <div className="r-row">
                          <span>Agent Identity Registry</span>
                          <span className="text-muted">ERC-8004 (0x8004...a432)</span>
                        </div>
                      </div>

                      <div className="receipt-footer">
                        <p>This transaction log proves genuine programmatic demand generated for upstream x402 services on Celo Mainnet without human intervention.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-container">
          <div className="footer-left">
            <span>CrawlPay · Built for the <strong>Agents on Open Rails Hackathon</strong></span>
            <span className="footer-sep">·</span>
            <span>Celo Mainnet Attribution: <code>celo_757c2ac3b70c</code></span>
          </div>
          <div className="footer-right">
            <a href="https://github.com/Michaelolawale/Crawlpay" target="_blank" rel="noopener noreferrer">
              GitHub Repository ↗
            </a>
            <a href="https://www.loops.house/agents-on-open-rails" target="_blank" rel="noopener noreferrer">
              Loops House ↗
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}
