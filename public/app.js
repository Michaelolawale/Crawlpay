document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const form = document.getElementById('audit-form');
  const targetUrlInput = document.getElementById('input-target-url');
  const compUrlInput = document.getElementById('input-competitor-url');
  const compWrapper = document.getElementById('wrapper-competitor-url');
  const btnSubmit = document.getElementById('btn-submit-audit');
  const btnText = btnSubmit.querySelector('.btn-text');
  const btnSpinner = btnSubmit.querySelector('.btn-spinner');

  const btnModeSingle = document.getElementById('btn-mode-single');
  const btnModeCompare = document.getElementById('btn-mode-compare');

  const terminalSection = document.getElementById('terminal-section');
  const terminalLog = document.getElementById('terminal-log');
  const resultsSection = document.getElementById('results-section');

  const btnTabComparison = document.getElementById('btn-tab-comparison');
  let activeMode = 'single';
  let currentPatches = null;
  let activePatchType = 'nextjs';

  // Mode switching
  btnModeSingle.addEventListener('click', () => {
    activeMode = 'single';
    btnModeSingle.classList.add('active');
    btnModeCompare.classList.remove('active');
    compWrapper.style.display = 'none';
    compUrlInput.required = false;
    btnTabComparison.style.display = 'none';
  });

  btnModeCompare.addEventListener('click', () => {
    activeMode = 'compare';
    btnModeCompare.classList.add('active');
    btnModeSingle.classList.remove('active');
    compWrapper.style.display = 'block';
    compUrlInput.required = true;
    if (!compUrlInput.value) {
      compUrlInput.value = 'https://valoraapp.com';
    }
  });

  // Tab navigation
  const tabBtns = document.querySelectorAll('.tab-nav-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const targetPane = document.getElementById(btn.dataset.tab);
      if (targetPane) targetPane.classList.add('active');
    });
  });

  // Framework Patch Pills
  const fwPills = document.querySelectorAll('.fw-pill');
  fwPills.forEach(pill => {
    pill.addEventListener('click', () => {
      fwPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      activePatchType = pill.dataset.patch;
      renderCurrentPatch();
    });
  });

  // Copy code button
  const btnCopyCode = document.getElementById('btn-copy-code');
  btnCopyCode.addEventListener('click', () => {
    const codeContent = document.getElementById('code-patch-content').innerText;
    navigator.clipboard.writeText(codeContent).then(() => {
      btnCopyCode.innerText = 'Copied! ✓';
      setTimeout(() => { btnCopyCode.innerText = 'Copy Code'; }, 2000);
    });
  });

  // Form Submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const targetUrl = targetUrlInput.value.trim();
    const competitorUrl = compUrlInput.value.trim();

    if (!targetUrl) return;

    // UI Loading state
    btnSubmit.disabled = true;
    btnText.innerText = 'Crawling on Celo...';
    btnSpinner.style.display = 'inline-block';
    terminalSection.style.display = 'block';
    resultsSection.style.display = 'none';
    terminalLog.innerHTML = '';

    // Stream animated terminal logs
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

    for (let i = 0; i < logSteps.length; i++) {
      await new Promise(r => setTimeout(r, 340));
      appendTerminalLog(logSteps[i].text, logSteps[i].cls);
    }

    try {
      let endpoint = '/api/audit';
      let payload = { url: targetUrl };

      if (activeMode === 'compare' && competitorUrl) {
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

      appendTerminalLog(`[3.10s] ✓ Audit completed successfully. Rendering dashboard.`, 'highlight');
      await new Promise(r => setTimeout(r, 400));

      if (activeMode === 'compare') {
        renderAuditResults(data.targetReport);
        renderComparisonResults(data.comparison);
      } else {
        renderAuditResults(data);
      }

      resultsSection.style.display = 'block';
      resultsSection.scrollIntoView({ behavior: 'smooth' });

    } catch (err) {
      appendTerminalLog(`[Error] Execution failed: ${err.message}`, 'highlight');
    } finally {
      btnSubmit.disabled = false;
      btnText.innerText = 'Run Autonomous Audit';
      btnSpinner.style.display = 'none';
    }
  });

  function appendTerminalLog(msg, cls = '') {
    const line = document.createElement('div');
    line.className = 'log-line';
    const time = new Date().toLocaleTimeString();
    line.innerHTML = `<span class="log-time">${time}</span> <span class="log-msg ${cls}">${escapeHtml(msg)}</span>`;
    terminalLog.appendChild(line);
    terminalLog.scrollTop = terminalLog.scrollHeight;
  }

  function renderAuditResults(report) {
    currentPatches = report.codePatches;

    // Overall Score Circle
    const scoreVal = report.scores.overall;
    const ringEl = document.getElementById('score-ring-val');
    const numEl = document.getElementById('score-overall-num');
    numEl.innerText = scoreVal;

    // Circumference = 2 * PI * 52 ≈ 326.7
    const offset = 326 - (326 * (scoreVal / 100));
    ringEl.style.strokeDashoffset = offset;
    if (scoreVal >= 80) ringEl.style.stroke = '#00e599';
    else if (scoreVal >= 60) ringEl.style.stroke = '#00b4d8';
    else ringEl.style.stroke = '#ff9f1c';

    // Archetype Badge
    const badgeText = document.getElementById('badge-archetype-text');
    badgeText.innerText = `${report.archetype.label} (${report.archetype.confidence}% Match)`;
    document.getElementById('result-target-domain').innerText = new URL(report.targetUrl).hostname;
    document.getElementById('result-target-focus').innerText = `Primary Audit Focus: ${report.archetype.keyAuditFocus}`;

    // Category Metric Bars
    setMetricBar('bar-technical', 'score-technical', report.scores.technical);
    setMetricBar('bar-content', 'score-content', report.scores.content);
    setMetricBar('bar-performance', 'score-performance', report.scores.performance);
    setMetricBar('bar-social', 'score-social', report.scores.social);

    // Top 3 Needle Movers
    const nmGrid = document.getElementById('needle-movers-grid');
    nmGrid.innerHTML = '';
    report.topNeedleMovers.forEach(item => {
      const card = document.createElement('div');
      const prioClass = item.priority === 'Critical' ? 'critical' : item.priority === 'High' ? 'high' : 'quick-win';
      card.className = `needle-card ${prioClass}`;
      card.innerHTML = `
        <span class="priority-pill ${prioClass}">${item.priority}</span>
        <div class="needle-title">${escapeHtml(item.title)}</div>
        <div class="needle-desc">${escapeHtml(item.description)}</div>
        <div class="needle-action">→ Action: ${escapeHtml(item.action)}</div>
      `;
      nmGrid.appendChild(card);
    });

    // Semantic Tab
    document.getElementById('semantic-current-h1').innerText = report.semantics.currentH1 || '(None)';
    document.getElementById('semantic-recommended-h1').innerText = report.semantics.recommendedH1;
    document.getElementById('semantic-intent').innerText = `${report.semantics.searchIntent} · Primary Keyword: "${report.semantics.primaryKeywordDetected}"`;
    document.getElementById('semantic-editorial').innerText = report.semantics.editorialVerdict;

    // Technical Checklist Tab
    const checklistGrid = document.getElementById('technical-checklist-grid');
    checklistGrid.innerHTML = '';
    const checks = [
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
    ];

    checks.forEach(c => {
      const item = document.createElement('div');
      item.className = 'check-item';
      item.innerHTML = `
        <div class="check-item-info">
          <span class="check-name">${c.name}</span>
          <span class="check-detail">${escapeHtml(c.detail)}</span>
        </div>
        <span class="check-status ${c.pass ? 'pass' : 'fail'}">${c.pass ? 'PASSED' : 'ACTION'}</span>
      `;
      checklistGrid.appendChild(item);
    });

    // Render initial code patch
    renderCurrentPatch();

    // Onchain Receipt Tab
    const rc = report.onchainReceipt;
    document.getElementById('receipt-exec-id').innerText = `ID: ${rc.executionId}`;
    document.getElementById('receipt-client-paid').innerText = rc.clientPaidUsd;
    document.getElementById('receipt-browser-cost').innerText = `$${rc.upstreamBrowserReceipt.costUsd} USD₮`;
    document.getElementById('receipt-browser-link').href = rc.upstreamBrowserReceipt.celoscanUrl;
    document.getElementById('receipt-social-cost').innerText = `$${rc.upstreamSocialReceipt.costUsd} USD₮`;
    document.getElementById('receipt-social-link').href = rc.upstreamSocialReceipt.celoscanUrl;
    document.getElementById('receipt-margin').innerText = `+${rc.agentMarginUsd}`;
  }

  function renderCurrentPatch() {
    if (!currentPatches) return;
    const preEl = document.getElementById('code-patch-content');
    const labelEl = document.getElementById('code-lang-label');

    if (activePatchType === 'nextjs') {
      labelEl.innerText = 'TypeScript (Next.js 14/15 App Router)';
      preEl.innerText = currentPatches.nextJsMetadata;
    } else if (activePatchType === 'shopify') {
      labelEl.innerText = 'Liquid (Shopify theme.liquid)';
      preEl.innerText = currentPatches.shopifyLiquid;
    } else if (activePatchType === 'html') {
      labelEl.innerText = 'HTML5 (<head> Block)';
      preEl.innerText = currentPatches.htmlHeadBlock;
    } else if (activePatchType === 'schema') {
      labelEl.innerText = 'JSON-LD (Schema.org Structured Data)';
      preEl.innerText = currentPatches.schemaJsonLd;
    }
  }

  function renderComparisonResults(comp) {
    btnTabComparison.style.display = 'block';
    const compView = document.getElementById('comparison-content');
    compView.innerHTML = `
      <div class="comp-battle-grid">
        <div class="battle-card ${comp.winner === 'target' ? 'winner' : ''}">
          <div class="battle-site-name">Your Site: ${escapeHtml(comp.target.url)}</div>
          <div class="battle-score" style="color: ${comp.target.score >= 70 ? '#00e599' : '#ff9f1c'}">${comp.target.score} / 100</div>
          <p>LCP: <strong>${comp.target.lcpSeconds}s</strong> · Schemas: <strong>${comp.target.schemaCount}</strong></p>
        </div>
        <div class="battle-card ${comp.winner === 'competitor' ? 'winner' : ''}">
          <div class="battle-site-name">Competitor: ${escapeHtml(comp.competitor.url)}</div>
          <div class="battle-score" style="color: ${comp.competitor.score >= 70 ? '#00e599' : '#ff9f1c'}">${comp.competitor.score} / 100</div>
          <p>LCP: <strong>${comp.competitor.lcpSeconds}s</strong> · Schemas: <strong>${comp.competitor.schemaCount}</strong></p>
        </div>
      </div>

      <div class="comp-insights-card">
        <h4>⚔️ Why They Are Winning & What To Fix</h4>
        <ul class="comp-insights-list">
          ${comp.whyTheyAreWinning.map(w => `<li>${escapeHtml(w)}</li>`).join('')}
        </ul>
        <h4 style="margin-top: 16px;">🚀 3 High-Impact Steps to Overtake Them:</h4>
        <ul class="comp-insights-list">
          ${comp.threeStepsToBeatThem.map(s => `<li><strong>→</strong> ${escapeHtml(s)}</li>`).join('')}
        </ul>
      </div>
    `;

    // Automatically switch to comparison tab
    btnTabComparison.click();
  }

  function setMetricBar(barId, scoreId, val) {
    document.getElementById(barId).style.width = `${val}%`;
    document.getElementById(scoreId).innerText = `${val} / 100`;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
});
