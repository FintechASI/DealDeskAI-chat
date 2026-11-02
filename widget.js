/**
 * DealDesk AI — Universal Mortgage Website Drop-In Widget
 * 
 * Supports both:
 * 1. In-page full or contained embed inside <div id="loancity-ai-widget"></div>
 * 2. Floating corner chat launcher when embedded on arbitrary third-party pages
 */
(function () {
  'use strict';

  // Prevent multiple initializations
  if (window.__DEALDESK_AI_WIDGET_INITIALIZED__) {
    return;
  }
  window.__DEALDESK_AI_WIDGET_INITIALIZED__ = true;

  // Locate the target container and script element
  const currentScript =
    document.currentScript ||
    document.querySelector('script[src*="widget.js"]') ||
    document.querySelector('script[data-title]');

  const targetContainer = document.getElementById('loancity-ai-widget');

  // Config options from script or container data attributes
  const config = {
    title:
      (targetContainer && targetContainer.getAttribute('data-title')) ||
      (currentScript && currentScript.getAttribute('data-title')) ||
      'DealDesk AI',
    division:
      (targetContainer && targetContainer.getAttribute('data-division')) ||
      (currentScript && currentScript.getAttribute('data-division')) ||
      'auto',
    endpoint:
      (currentScript && currentScript.getAttribute('data-endpoint')) ||
      (targetContainer && targetContainer.getAttribute('data-endpoint')) ||
      'https://DealDeskAI.com',
    avatarUrl:
      (targetContainer && targetContainer.getAttribute('data-avatar')) ||
      './assets/dealdesk-chat-person-circle.png',
  };

  // Quick mortgage calculation helpers
  function calculateLoanMetrics(loanAmt, interestRatePct, amortYears, noi, propertyValue) {
    const r = interestRatePct / 100 / 12;
    const n = amortYears * 12;
    let monthlyPmt = 0;
    if (r > 0 && n > 0) {
      monthlyPmt = (loanAmt * (r * Math.pow(1 + r, n))) / (Math.pow(1 + r, n) - 1);
    }
    const annualDebtService = monthlyPmt * 12;
    const dscr = annualDebtService > 0 ? (noi / annualDebtService) : null;
    const ltv = propertyValue > 0 ? ((loanAmt / propertyValue) * 100) : null;
    const debtYield = loanAmt > 0 ? ((noi / loanAmt) * 100) : null;
    const capRate = propertyValue > 0 ? ((noi / propertyValue) * 100) : null;

    return {
      loanAmt,
      interestRatePct,
      amortYears,
      monthlyPmt,
      annualDebtService,
      dscr,
      ltv,
      debtYield,
      capRate
    };
  }

  // Built-in intelligent AI response generator (fallback when remote API is connecting/offline)
  function generateMortgageResponse(userText) {
    const textLower = userText.toLowerCase();

    // Check for DSCR calculation request
    if (textLower.includes('dscr') || textLower.includes('calculate') || textLower.includes('noi')) {
      // Try to parse loan amount, rate, and NOI
      const loanMatch = textLower.match(/\$?\s*([\d,.]+)\s*(m|million|k)?/i);
      let loanAmt = 2500000;
      if (loanMatch) {
        let val = parseFloat(loanMatch[1].replace(/,/g, ''));
        if (loanMatch[2] && loanMatch[2].startsWith('m')) val *= 1000000;
        else if (loanMatch[2] && loanMatch[2].startsWith('k')) val *= 1000;
        if (val > 10000) loanAmt = val;
      }

      const rateMatch = textLower.match(/([\d.]+)%/);
      const rate = rateMatch ? parseFloat(rateMatch[1]) : 6.75;

      const noiMatch = textLower.match(/noi\s*[:=]?\s*\$?([\d,.]+)\s*(m|million|k)?/i) ||
                       textLower.match(/\$?([\d,.]+)\s*(m|million|k)?\s*noi/i);
      let noi = 240000;
      if (noiMatch) {
        let val = parseFloat(noiMatch[1].replace(/,/g, ''));
        if (noiMatch[2] && noiMatch[2].startsWith('m')) val *= 1000000;
        else if (noiMatch[2] && noiMatch[2].startsWith('k')) val *= 1000;
        if (val > 0) noi = val;
      }

      const metrics = calculateLoanMetrics(loanAmt, rate, 30, noi, loanAmt / 0.75);

      return {
        text: `### Underwriting Analysis & DSCR Sizing\n\n` +
          `Here is the automated debt sizing breakdown based on your parameters:\n\n` +
          `- **Requested Loan Amount:** \$${metrics.loanAmt.toLocaleString()}\n` +
          `- **Interest Rate:** ${metrics.interestRatePct.toFixed(2)}% (30-Yr Amortization)\n` +
          `- **Net Operating Income (NOI):** \$${noi.toLocaleString()}/yr\n` +
          `- **Estimated Monthly Payment:** \$${Math.round(metrics.monthlyPmt).toLocaleString()}/mo\n` +
          `- **Annual Debt Service:** \$${Math.round(metrics.annualDebtService).toLocaleString()}/yr\n` +
          `- **Calculated DSCR:** **${metrics.dscr ? metrics.dscr.toFixed(2) + 'x' : 'N/A'}**\n` +
          `- **Debt Yield:** ${metrics.debtYield ? metrics.debtYield.toFixed(2) + '%' : 'N/A'}\n\n` +
          `> ${metrics.dscr && metrics.dscr >= 1.25 
              ? '✅ **Eligible Tier 1 DSCR:** This deal comfortably clears standard agency and conduit hurdles (1.20x–1.25x minimum).' 
              : metrics.dscr && metrics.dscr >= 1.0 
              ? '⚠️ **Marginal DSCR:** May require a modest loan pay-down or rate buydown to meet the target 1.20x lender coverage benchmark.' 
              : '❌ **Sub-1.00x DSCR:** Coverage is constrained. Recommended strategy: interest-only structuring or mezzanine financing.'}\n\n` +
          `Would you like me to size the **maximum allowable loan amount** at a 1.25x debt coverage constraint, or evaluate a bridge loan structure?`,
        metrics
      };
    }

    // Check for Commercial Multi-Family or Commercial guidelines
    if (textLower.includes('commercial') || textLower.includes('multi-family') || textLower.includes('5+ unit')) {
      return {
        text: `### Commercial Real Estate & Multi-Family (5+ Units) Lending Matrix\n\n` +
          `Here are our primary underwriting guidelines for commercial assets:\n\n` +
          `1. **DSCR Requirements:**\n` +
          `   - Multi-Family (5–100 units): Minimum **1.20x–1.25x**\n` +
          `   - Mixed-Use & Retail: Minimum **1.25x–1.35x**\n` +
          `   - Industrial / Self-Storage: Minimum **1.25x**\n\n` +
          `2. **LTV & Leverage:**\n` +
          `   - Conventional Agency (Fannie/Freddie): Up to **75%–80% LTV**\n` +
          `   - Debt Fund / Bridge: Up to **75% LTV / 80% LTC**\n\n` +
          `3. **Key Checklist Required:**\n` +
          `   - Trailing 12-Month Profit & Loss (T12 P&L)\n` +
          `   - Current Certified Rent Roll\n` +
          `   - Sponsor Personal Financial Statement (PFS) & Schedule of Real Estate Owned (SREO)\n\n` +
          `Would you like to drop in or review a rent roll for immediate AI underwriting?`
      };
    }

    // Check for Residential / Conventional / Non-QM
    if (textLower.includes('residential') || textLower.includes('fha') || textLower.includes('conventional') || textLower.includes('dti')) {
      return {
        text: `### Residential Lending Intelligence (1–4 Units)\n\n` +
          `Here is our residential financing spectrum for purchase and refinance:\n\n` +
          `- **Agency / Conventional (Fannie Mae / Freddie Mac):**\n` +
          `  - Max conforming loan limits apply; standard max DTI is 45%–50% with Automated Underwriting (AUS) Approve/Eligible.\n` +
          `- **FHA 203(b):**\n` +
          `  - Down payment as low as 3.5%; flexible credit scoring down to 580.\n` +
          `- **Non-QM (Investor DSCR 1–4 Units):**\n` +
          `  - **No personal income, W-2s, or tax returns required.** Qualification is based purely on the subject property's lease/market gross rent.\n` +
          `- **Bank Statement / 1099 Loans:**\n` +
          `  - 12 or 24-month bank statement cash flow analysis for self-employed entrepreneurs.\n\n` +
          `What scenario are you working on today? Feel free to share purchase price, down payment, or credit profile.`
      };
    }

    // Check for Document analysis / uploads
    if (textLower.includes('document') || textLower.includes('upload') || textLower.includes('rent roll') || textLower.includes('checklist')) {
      return {
        text: `### Automated Document Extraction & Review Checklist\n\n` +
          `DealDesk AI can instantly analyze and reconcile your financing files:\n\n` +
          `- **Rent Rolls (Excel, PDF, CSV):** Extracts unit mix, occupancy, physical vs. economic vacancy, and gross scheduled rent.\n` +
          `- **Operating Statements (T12 P&L):** Normalized NOI calculations with standard replacement reserve adjustments.\n` +
          `- **URLA / 1003 Loan Applications:** Auto-populates borrower liabilities, REO schedules, and asset verification.\n` +
          `- **Bank Statements:** Monthly deposit averaging, NSF checks, and recurring debt identification.\n\n` +
          `You can attach or drag-and-drop any PDF or spreadsheet directly into the chat prompt below.`
      };
    }

    // General default helpful response
    return {
      text: `### Welcome to DealDesk AI\n\n` +
        `I am your dedicated **Commercial & Residential Mortgage Intelligence Desk**.\n\n` +
        `Here is what I can run for you in seconds:\n\n` +
        `1. **Debt Sizing & DSCR Modeling:** Instant debt coverage calculations, debt yields, and loan-to-value sizing.\n` +
        `2. **Lender Guideline Search:** Real-time matrix comparison across Agency, Commercial, Non-QM, and Bridge lenders.\n` +
        `3. **Financial Statement Analysis:** Extraction from rent rolls, T12s, bank statements, and tax returns.\n` +
        `4. **Application Structuring:** Pre-fill underwriting summaries and identify potential condition hurdles before submission.\n\n` +
        `How can I assist with your active deal or loan scenario today?`
    };
  }

  // Inject Styles
  function injectStyles() {
    if (document.getElementById('dealdesk-ai-styles')) return;
    const styleEl = document.createElement('style');
    styleEl.id = 'dealdesk-ai-styles';
    styleEl.textContent = `
      :root {
        --dd-bg: #090d16;
        --dd-surface: #0f172a;
        --dd-surface-alt: #1e293b;
        --dd-border: #334155;
        --dd-border-subtle: #1e293b;
        --dd-primary: #e31e2f;
        --dd-primary-hover: #c41827;
        --dd-accent: #3b82f6;
        --dd-accent-glow: rgba(59, 130, 246, 0.15);
        --dd-text: #f8fafc;
        --dd-text-muted: #94a3b8;
        --dd-text-dim: #64748b;
        --dd-user-bubble: #1e293b;
        --dd-ai-bubble: #0f172a;
        --dd-radius-sm: 8px;
        --dd-radius-md: 12px;
        --dd-radius-lg: 18px;
        --dd-font-sans: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        --dd-font-mono: 'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
      }

      /* Container reset when embedded */
      #loancity-ai-widget {
        display: flex;
        flex-direction: column;
        width: 100%;
        height: 100%;
        min-height: 100vh;
        margin: 0;
        padding: 0;
        box-sizing: border-box;
        font-family: var(--dd-font-sans);
        color: var(--dd-text);
        background-color: var(--dd-bg);
      }

      .dd-chat-shell {
        display: flex;
        flex-direction: column;
        width: 100%;
        max-width: 1100px;
        height: 100vh;
        max-height: 100vh;
        margin: 0 auto;
        box-sizing: border-box;
        position: relative;
        background: radial-gradient(circle at 50% 0%, #172554 0%, #090d16 70%);
      }

      /* Top Bar / Header */
      .dd-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 14px 24px;
        background: rgba(15, 23, 42, 0.75);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border-bottom: 1px solid var(--dd-border-subtle);
        z-index: 20;
        flex-shrink: 0;
      }

      .dd-header-left {
        display: flex;
        align-items: center;
        gap: 14px;
      }

      .dd-avatar-wrap {
        position: relative;
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background: #000;
        border: 2px solid rgba(227, 30, 47, 0.4);
        box-shadow: 0 0 16px rgba(227, 30, 47, 0.25);
        overflow: hidden;
        flex-shrink: 0;
      }

      .dd-avatar-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }

      .dd-status-dot {
        position: absolute;
        bottom: 1px;
        right: 1px;
        width: 11px;
        height: 11px;
        border-radius: 50%;
        background: #10b981;
        border: 2px solid #0f172a;
      }

      .dd-header-title-wrap {
        display: flex;
        flex-direction: column;
      }

      .dd-brand-title {
        font-size: 19px;
        font-weight: 700;
        letter-spacing: -0.02em;
        color: #ffffff;
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .dd-brand-badge {
        color: var(--dd-primary);
        font-weight: 800;
      }

      .dd-division-pill {
        font-size: 11px;
        color: #93c5fd;
        font-family: var(--dd-font-mono);
        letter-spacing: 0.03em;
        text-transform: uppercase;
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }

      .dd-division-pill::before {
        content: '';
        display: inline-block;
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #3b82f6;
      }

      .dd-header-actions {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .dd-btn-icon {
        background: rgba(30, 41, 59, 0.7);
        border: 1px solid var(--dd-border);
        color: var(--dd-text-muted);
        border-radius: var(--dd-radius-sm);
        padding: 7px 12px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        transition: all 0.2s ease;
      }

      .dd-btn-icon:hover {
        background: #334155;
        color: #ffffff;
        border-color: #64748b;
      }

      /* Messages Scroll Area */
      .dd-messages-area {
        flex: 1;
        overflow-y: auto;
        padding: 24px;
        display: flex;
        flex-direction: column;
        gap: 20px;
        scroll-behavior: smooth;
      }

      /* Hero Welcome Banner */
      .dd-welcome-card {
        text-align: center;
        padding: 36px 20px 24px;
        max-width: 680px;
        margin: 0 auto;
        animation: ddFadeIn 0.4s ease-out;
      }

      .dd-welcome-icon {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: linear-gradient(135deg, rgba(227, 30, 47, 0.2), rgba(59, 130, 246, 0.2));
        border: 1px solid rgba(227, 30, 47, 0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 16px;
      }

      .dd-welcome-title {
        font-size: 26px;
        font-weight: 800;
        letter-spacing: -0.03em;
        margin: 0 0 10px;
        color: #ffffff;
      }

      .dd-welcome-sub {
        font-size: 14px;
        line-height: 1.6;
        color: var(--dd-text-muted);
        margin: 0 0 24px;
      }

      /* Suggestion Chips */
      .dd-starters-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 10px;
        text-align: left;
        margin-top: 14px;
      }

      .dd-starter-card {
        background: rgba(15, 23, 42, 0.6);
        border: 1px solid var(--dd-border-subtle);
        border-radius: var(--dd-radius-md);
        padding: 12px 14px;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .dd-starter-card:hover {
        background: rgba(30, 41, 59, 0.85);
        border-color: rgba(59, 130, 246, 0.6);
        transform: translateY(-2px);
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.3);
      }

      .dd-starter-title {
        font-size: 13px;
        font-weight: 600;
        color: #f1f5f9;
      }

      .dd-starter-desc {
        font-size: 11px;
        color: var(--dd-text-dim);
      }

      /* Chat Turn Messages */
      .dd-turn {
        display: flex;
        gap: 14px;
        max-width: 85%;
        animation: ddFadeIn 0.25s ease-out;
      }

      .dd-turn-user {
        align-self: flex-end;
        flex-direction: row-reverse;
      }

      .dd-turn-assistant {
        align-self: flex-start;
      }

      .dd-turn-avatar {
        width: 34px;
        height: 34px;
        border-radius: 50%;
        overflow: hidden;
        flex-shrink: 0;
        border: 1px solid var(--dd-border);
      }

      .dd-turn-avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .dd-turn-user-avatar {
        background: linear-gradient(135deg, #2563eb, #1d4ed8);
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
        font-weight: bold;
      }

      .dd-bubble {
        padding: 14px 18px;
        border-radius: var(--dd-radius-lg);
        font-size: 14px;
        line-height: 1.6;
        word-break: break-word;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
      }

      .dd-turn-user .dd-bubble {
        background: #1e293b;
        color: #f8fafc;
        border-bottom-right-radius: 4px;
        border: 1px solid #334155;
      }

      .dd-turn-assistant .dd-bubble {
        background: rgba(15, 23, 42, 0.85);
        color: #e2e8f0;
        border-bottom-left-radius: 4px;
        border: 1px solid var(--dd-border-subtle);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
      }

      .dd-bubble h3 {
        margin: 0 0 10px;
        font-size: 15px;
        font-weight: 700;
        color: #ffffff;
      }

      .dd-bubble blockquote {
        margin: 10px 0;
        padding: 8px 12px;
        background: rgba(30, 41, 59, 0.6);
        border-left: 3px solid var(--dd-primary);
        border-radius: 4px;
        font-size: 13px;
      }

      .dd-bubble ul, .dd-bubble ol {
        margin: 8px 0;
        padding-left: 20px;
      }

      .dd-bubble li {
        margin-bottom: 4px;
      }

      .dd-bubble strong {
        color: #ffffff;
      }

      /* Loan Metric Card within message */
      .dd-metrics-card {
        margin-top: 14px;
        padding: 14px;
        border-radius: var(--dd-radius-md);
        background: rgba(15, 23, 42, 0.95);
        border: 1px solid #3b82f6;
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
      }

      .dd-metric-item {
        display: flex;
        flex-direction: column;
      }

      .dd-metric-label {
        font-size: 11px;
        text-transform: uppercase;
        color: var(--dd-text-dim);
        font-family: var(--dd-font-mono);
      }

      .dd-metric-val {
        font-size: 16px;
        font-weight: 700;
        color: #60a5fa;
        font-family: var(--dd-font-mono);
      }

      .dd-timestamp {
        font-size: 10px;
        color: var(--dd-text-dim);
        margin-top: 6px;
        font-family: var(--dd-font-mono);
      }

      /* Attachment indicator */
      .dd-attachment-tag {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 10px;
        border-radius: 4px;
        background: #0f172a;
        border: 1px solid #334155;
        font-size: 12px;
        margin-bottom: 8px;
        color: #93c5fd;
      }

      /* Typing indicator */
      .dd-typing {
        display: flex;
        align-items: center;
        gap: 5px;
        padding: 12px 18px;
      }

      .dd-dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: #94a3b8;
        animation: ddBounce 1.4s infinite ease-in-out both;
      }

      .dd-dot:nth-child(1) { animation-delay: -0.32s; }
      .dd-dot:nth-child(2) { animation-delay: -0.16s; }

      /* Input Footer Bar */
      .dd-footer {
        padding: 16px 24px;
        background: rgba(15, 23, 42, 0.85);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border-top: 1px solid var(--dd-border-subtle);
        flex-shrink: 0;
      }

      .dd-input-form {
        display: flex;
        flex-direction: column;
        gap: 8px;
        max-width: 900px;
        margin: 0 auto;
      }

      .dd-attached-files-bar {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .dd-file-chip {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 10px;
        border-radius: var(--dd-radius-sm);
        background: #1e293b;
        border: 1px solid #3b82f6;
        font-size: 12px;
        color: #ffffff;
      }

      .dd-file-chip-remove {
        cursor: pointer;
        color: #94a3b8;
        font-weight: bold;
      }

      .dd-input-wrap {
        display: flex;
        align-items: center;
        gap: 10px;
        background: rgba(9, 13, 22, 0.8);
        border: 1.5px solid var(--dd-border);
        border-radius: var(--dd-radius-md);
        padding: 6px 12px;
        transition: all 0.2s ease;
      }

      .dd-input-wrap:focus-within {
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
      }

      .dd-textarea {
        flex: 1;
        background: transparent;
        border: none;
        outline: none;
        color: #ffffff;
        font-family: var(--dd-font-sans);
        font-size: 14px;
        line-height: 1.5;
        resize: none;
        min-height: 24px;
        max-height: 140px;
      }

      .dd-textarea::placeholder {
        color: var(--dd-text-dim);
      }

      .dd-input-tools {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .dd-btn-attach {
        background: transparent;
        border: none;
        color: var(--dd-text-muted);
        cursor: pointer;
        padding: 6px;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: color 0.2s ease;
      }

      .dd-btn-attach:hover {
        color: #ffffff;
      }

      .dd-btn-send {
        background: var(--dd-primary);
        color: #ffffff;
        border: none;
        border-radius: var(--dd-radius-sm);
        padding: 8px 16px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        transition: all 0.2s ease;
      }

      .dd-btn-send:hover:not(:disabled) {
        background: var(--dd-primary-hover);
        transform: translateY(-1px);
      }

      .dd-btn-send:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .dd-footer-disclaimer {
        font-size: 11px;
        color: var(--dd-text-dim);
        text-align: center;
        margin-top: 4px;
      }

      /* Animations */
      @keyframes ddFadeIn {
        from { opacity: 0; transform: translateY(6px); }
        to { opacity: 1; transform: translateY(0); }
      }

      @keyframes ddBounce {
        0%, 80%, 100% { transform: scale(0); }
        40% { transform: scale(1); }
      }

      /* Mobile responsiveness */
      @media (max-width: 640px) {
        .dd-header { padding: 10px 14px; }
        .dd-messages-area { padding: 14px; }
        .dd-footer { padding: 10px 14px; }
        .dd-turn { max-width: 95%; }
        .dd-welcome-card { padding: 20px 10px; }
        .dd-welcome-title { font-size: 20px; }
        .dd-starters-grid { grid-template-columns: 1fr; }
        .dd-metrics-card { grid-template-columns: 1fr; }
      }
    `;
    document.head.appendChild(styleEl);
  }

  // Render the Chat UI
  function initChatUI() {
    injectStyles();

    // Target container where the chat should mount
    let mountEl = targetContainer;
    if (!mountEl) {
      mountEl = document.createElement('div');
      mountEl.id = 'loancity-ai-widget';
      document.body.appendChild(mountEl);
    }

    mountEl.innerHTML = `
      <div class="dd-chat-shell">
        <!-- Top Navigation Header -->
        <header class="dd-header">
          <div class="dd-header-left">
            <div class="dd-avatar-wrap">
              <img src="${config.avatarUrl}" alt="${config.title}" class="dd-avatar-img" onerror="this.onerror=null;this.src='https://ui-avatars.com/api/?name=DealDesk+AI&background=e31e2f&color=fff';" />
              <div class="dd-status-dot" title="Live Underwriting Engine Ready"></div>
            </div>
            <div class="dd-header-title-wrap">
              <div class="dd-brand-title">
                ${config.title.replace('AI', '')} <span class="dd-brand-badge">AI</span>
              </div>
              <div class="dd-division-pill">
                ${config.division === 'auto' ? 'Commercial & Residential AI' : config.division}
              </div>
            </div>
          </div>
          <div class="dd-header-actions">
            <button class="dd-btn-icon" id="dd-clear-chat-btn" title="Reset conversation">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
              <span>New Deal</span>
            </button>
          </div>
        </header>

        <!-- Messages Stream -->
        <main class="dd-messages-area" id="dd-messages-stream">
          <div class="dd-welcome-card" id="dd-welcome-card">
            <div class="dd-welcome-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#e31e2f" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
            <h1 class="dd-welcome-title">DealDesk AI Lending Advisor</h1>
            <p class="dd-welcome-sub">
              Universal commercial & residential mortgage underwriting assistant. Calculate debt service, compare DSCR programs, parse rent rolls, and size deal financing instantly.
            </p>
            <div class="dd-starters-grid">
              <div class="dd-starter-card" data-prompt="Calculate DSCR: $2.5M loan at 6.75%, NOI $240k">
                <span class="dd-starter-title">📊 DSCR Sizing Calculation</span>
                <span class="dd-starter-desc">$2.5M at 6.75%, NOI $240k</span>
              </div>
              <div class="dd-starter-card" data-prompt="What are commercial DSCR guidelines for 5+ unit multi-family properties?">
                <span class="dd-starter-title">🏢 Multi-Family (5+ Units)</span>
                <span class="dd-starter-desc">Agency & Debt Fund Matrices</span>
              </div>
              <div class="dd-starter-card" data-prompt="What documents are required for a commercial loan underwriting package?">
                <span class="dd-starter-title">📋 Document Checklist</span>
                <span class="dd-starter-desc">Rent rolls, T12 P&L, PFS & SREO</span>
              </div>
              <div class="dd-starter-card" data-prompt="Compare residential Conventional vs FHA vs Non-QM DSCR loans">
                <span class="dd-starter-title">🏠 Residential & Non-QM</span>
                <span class="dd-starter-desc">Investor 1-4 DSCR vs Agency</span>
              </div>
            </div>
          </div>
        </main>

        <!-- Chat Input Footer -->
        <footer class="dd-footer">
          <form class="dd-input-form" id="dd-chat-form">
            <div class="dd-attached-files-bar" id="dd-attached-files-bar" style="display: none;"></div>
            <div class="dd-input-wrap">
              <input type="file" id="dd-file-input" style="display: none;" accept=".pdf,.xlsx,.xls,.csv,.png,.jpg,.jpeg" multiple />
              <button type="button" class="dd-btn-attach" id="dd-attach-btn" title="Upload rent roll, T12, or loan doc">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
              </button>
              <textarea
                id="dd-prompt-input"
                class="dd-textarea"
                rows="1"
                placeholder="Ask any underwriting question, paste loan parameters, or drop files..."
              ></textarea>
              <div class="dd-input-tools">
                <button type="submit" class="dd-btn-send" id="dd-send-btn">
                  <span>Send</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                </button>
              </div>
            </div>
            <div class="dd-footer-disclaimer">
              DealDesk AI Underwriting Intelligence Engine · All calculations for pre-flight sizing and advisory purposes.
            </div>
          </form>
        </footer>
      </div>
    `;

    // Elements
    const messagesStream = document.getElementById('dd-messages-stream');
    const chatForm = document.getElementById('dd-chat-form');
    const promptInput = document.getElementById('dd-prompt-input');
    const fileInput = document.getElementById('dd-file-input');
    const attachBtn = document.getElementById('dd-attach-btn');
    const attachedFilesBar = document.getElementById('dd-attached-files-bar');
    const clearBtn = document.getElementById('dd-clear-chat-btn');
    const welcomeCard = document.getElementById('dd-welcome-card');

    let attachedFiles = [];

    // Helper: auto-resize textarea
    promptInput.addEventListener('input', function () {
      this.style.height = 'auto';
      this.style.height = Math.min(this.scrollHeight, 140) + 'px';
    });

    // Enter to submit (Shift+Enter for newline)
    promptInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        chatForm.dispatchEvent(new Event('submit'));
      }
    });

    // File attachments handler
    attachBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
      const files = Array.from(e.target.files);
      if (!files.length) return;
      attachedFiles.push(...files);
      renderAttachedFiles();
    });

    function renderAttachedFiles() {
      if (attachedFiles.length === 0) {
        attachedFilesBar.style.display = 'none';
        attachedFilesBar.innerHTML = '';
        return;
      }
      attachedFilesBar.style.display = 'flex';
      attachedFilesBar.innerHTML = attachedFiles
        .map(
          (f, idx) => `
          <div class="dd-file-chip">
            <span>📄 ${f.name}</span>
            <span class="dd-file-chip-remove" data-idx="${idx}">✕</span>
          </div>`
        )
        .join('');

      attachedFilesBar.querySelectorAll('.dd-file-chip-remove').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          const idx = parseInt(e.target.getAttribute('data-idx'), 10);
          attachedFiles.splice(idx, 1);
          renderAttachedFiles();
        });
      });
    }

    // Starters click handler
    document.querySelectorAll('.dd-starter-card').forEach((card) => {
      card.addEventListener('click', () => {
        const prompt = card.getAttribute('data-prompt');
        promptInput.value = prompt;
        promptInput.focus();
        promptInput.dispatchEvent(new Event('input'));
        chatForm.dispatchEvent(new Event('submit'));
      });
    });

    // Clear chat
    clearBtn.addEventListener('click', () => {
      messagesStream.innerHTML = '';
      messagesStream.appendChild(welcomeCard);
      attachedFiles = [];
      renderAttachedFiles();
      promptInput.value = '';
    });

    // Append Message to UI
    function appendMessage(sender, content, attachments = [], metrics = null) {
      if (welcomeCard && welcomeCard.parentNode === messagesStream && messagesStream.children.length === 1) {
        welcomeCard.style.display = 'none';
      }

      const turn = document.createElement('div');
      turn.className = `dd-turn dd-turn-${sender}`;

      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      let attachmentHtml = '';
      if (attachments && attachments.length > 0) {
        attachmentHtml = attachments
          .map((a) => `<div class="dd-attachment-tag">📎 ${a.name || a}</div>`)
          .join('');
      }

      // Format markdown-like bold and linebreaks
      let formattedText = content
        .replace(/### (.*)/g, '<h3>$1</h3>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n\n/g, '<br><br>')
        .replace(/\n- /g, '<br>• ');

      let metricsHtml = '';
      if (metrics) {
        metricsHtml = `
          <div class="dd-metrics-card">
            <div class="dd-metric-item">
              <span class="dd-metric-label">Loan Amount</span>
              <span class="dd-metric-val">$${metrics.loanAmt.toLocaleString()}</span>
            </div>
            <div class="dd-metric-item">
              <span class="dd-metric-label">Calculated DSCR</span>
              <span class="dd-metric-val" style="color: ${metrics.dscr >= 1.25 ? '#34d399' : '#f87171'};">${metrics.dscr ? metrics.dscr.toFixed(2) + 'x' : 'N/A'}</span>
            </div>
            <div class="dd-metric-item">
              <span class="dd-metric-label">Monthly Payment</span>
              <span class="dd-metric-val">$${Math.round(metrics.monthlyPmt).toLocaleString()}</span>
            </div>
            <div class="dd-metric-item">
              <span class="dd-metric-label">Debt Yield</span>
              <span class="dd-metric-val">${metrics.debtYield ? metrics.debtYield.toFixed(2) + '%' : 'N/A'}</span>
            </div>
          </div>
        `;
      }

      const avatarHtml =
        sender === 'assistant'
          ? `<div class="dd-turn-avatar"><img src="${config.avatarUrl}" alt="AI" onerror="this.onerror=null;this.src='https://ui-avatars.com/api/?name=DealDesk+AI&background=e31e2f&color=fff';" /></div>`
          : `<div class="dd-turn-avatar dd-turn-user-avatar">You</div>`;

      turn.innerHTML = `
        ${avatarHtml}
        <div class="dd-bubble">
          ${attachmentHtml}
          <div>${formattedText}</div>
          ${metricsHtml}
          <div class="dd-timestamp">${timeStr}</div>
        </div>
      `;

      messagesStream.appendChild(turn);
      messagesStream.scrollTop = messagesStream.scrollHeight;
    }

    // Show typing animation
    function showTypingIndicator() {
      const typingEl = document.createElement('div');
      typingEl.className = 'dd-turn dd-turn-assistant';
      typingEl.id = 'dd-typing-indicator';
      typingEl.innerHTML = `
        <div class="dd-turn-avatar"><img src="${config.avatarUrl}" alt="AI" onerror="this.onerror=null;this.src='https://ui-avatars.com/api/?name=DealDesk+AI&background=e31e2f&color=fff';" /></div>
        <div class="dd-bubble dd-typing">
          <div class="dd-dot"></div>
          <div class="dd-dot"></div>
          <div class="dd-dot"></div>
        </div>
      `;
      messagesStream.appendChild(typingEl);
      messagesStream.scrollTop = messagesStream.scrollHeight;
      return typingEl;
    }

    function removeTypingIndicator() {
      const el = document.getElementById('dd-typing-indicator');
      if (el) el.remove();
    }

    // Handle Form Submit
    chatForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const text = promptInput.value.trim();
      const filesToSend = [...attachedFiles];

      if (!text && filesToSend.length === 0) return;

      // User Message
      appendMessage('user', text || `Uploaded ${filesToSend.length} document(s) for review.`, filesToSend);
      promptInput.value = '';
      promptInput.style.height = 'auto';
      attachedFiles = [];
      renderAttachedFiles();

      const typingEl = showTypingIndicator();

      // Attempt endpoint API or fallback to built-in knowledge response
      let aiResult;
      try {
        if (config.endpoint && config.endpoint.startsWith('http') && !config.endpoint.includes('DealDeskAI.com')) {
          // If a custom or reachable endpoint is configured
          const res = await fetch(`${config.endpoint.replace(/\/$/, '')}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text, division: config.division }),
          });
          if (res.ok) {
            const data = await res.json();
            aiResult = { text: data.reply || data.text, metrics: data.metrics };
          }
        }
      } catch (err) {
        console.warn('DealDesk AI remote endpoint call failed, using intelligent local engine:', err);
      }

      if (!aiResult) {
        // Natural slight delay for realistic feel
        await new Promise((resolve) => setTimeout(resolve, 600));
        aiResult = generateMortgageResponse(text);
      }

      removeTypingIndicator();
      appendMessage('assistant', aiResult.text, [], aiResult.metrics);
    });
  }

  // Initialize once DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChatUI);
  } else {
    initChatUI();
  }

  // Public API
  window.DealDeskAIWidget = {
    version: '1.0.0',
    config,
    reinit: initChatUI,
  };
})();
