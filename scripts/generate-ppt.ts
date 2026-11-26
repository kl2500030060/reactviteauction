import path from 'path';
import { fileURLToPath } from 'url';
import PptxGenJS from 'pptxgenjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUTPUT_PATH = path.resolve(__dirname, '..', 'AutoAuction_Presentation.pptx');

// Refined Fintech Trading-Terminal Palette (60-30-10 discipline)
const COLORS = {
  bg: '0B1120',        // Deep slate navy canvas
  surface: '111827',   // Primary card surface
  surfaceAlt: '1E293B',// Elevated highlight card
  border: '334155',    // Crisp hairline border
  indigo: '6366F1',    // Primary action & brand accent
  indigoSoft: '312E81',// Deep indigo tint
  emerald: '10B981',   // Live / Trust / Positive accent
  emeraldDark: '064E3B',
  amber: 'F59E0B',     // Trend / Warning / Speed accent
  amberDark: '78350F',
  rose: 'F43F5E',      // Problem / Friction accent
  roseDark: '881337',
  cyan: '06B6D4',      // Mobile / Live stream accent
  text: 'F8FAFC',      // Crisp white primary text
  muted: 'CBD5E1',     // Readable body slate
  dim: '94A3B8',       // Captions & footers
};

const FONT_HEAD = 'Segoe UI';
const FONT_BODY = 'Segoe UI';
const FONT_MONO = 'Consolas';

const pptx = new PptxGenJS();
pptx.layout = 'LAYOUT_WIDE'; // 13.333 x 7.5 in (16:9)
pptx.author = 'AutoAuction Project Team';
pptx.company = 'AutoAuction';
pptx.subject = 'Real-Time Asset Auction Terminal Showcase';
pptx.title = 'AutoAuction — Real-Time Asset Auction Terminal';

function addBaseChrome(
  slide: PptxGenJS.Slide,
  slideNum: number,
  sectionTag: string,
  headline: string,
  subtitle?: string
) {
  slide.background = { color: COLORS.bg };

  // Top subtle accent bar
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 13.333,
    h: 0.08,
    fill: { color: COLORS.indigo },
    line: { color: COLORS.indigo, width: 0 },
  });

  // Section Eyebrow
  slide.addText(sectionTag.toUpperCase(), {
    x: 0.65,
    y: 0.34,
    w: 8.5,
    h: 0.28,
    fontFace: FONT_MONO,
    fontSize: 10.5,
    bold: true,
    color: COLORS.indigo,
    charSpacing: 1.5,
  });

  // Slide Headline
  slide.addText(headline, {
    x: 0.65,
    y: 0.64,
    w: 11.8,
    h: 0.56,
    fontFace: FONT_HEAD,
    fontSize: 26,
    bold: true,
    color: COLORS.text,
  });

  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.65,
      y: 1.22,
      w: 11.8,
      h: 0.36,
      fontFace: FONT_BODY,
      fontSize: 13.5,
      color: COLORS.dim,
    });
  }

  // Footer hairline & slide numbering
  slide.addShape(pptx.ShapeType.line, {
    x: 0.65,
    y: 6.95,
    w: 12.03,
    h: 0,
    line: { color: COLORS.border, width: 0.75 },
  });

  slide.addText('AUTOAUC  ·  REAL-TIME ASSET AUCTION TERMINAL', {
    x: 0.65,
    y: 7.04,
    w: 7.5,
    h: 0.28,
    fontFace: FONT_MONO,
    fontSize: 9,
    color: COLORS.dim,
  });

  slide.addText(`${String(slideNum).padStart(2, '0')} / 11`, {
    x: 11.2,
    y: 7.04,
    w: 1.48,
    h: 0.28,
    align: 'right',
    fontFace: FONT_MONO,
    fontSize: 9.5,
    bold: true,
    color: COLORS.muted,
  });
}

function addCard(
  slide: PptxGenJS.Slide,
  x: number,
  y: number,
  w: number,
  h: number,
  opts?: { fill?: string; border?: string; topStripe?: string }
) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x,
    y,
    w,
    h,
    rectRadius: 0.1,
    fill: { color: opts?.fill ?? COLORS.surface },
    line: { color: opts?.border ?? COLORS.border, width: 1 },
  });
  if (opts?.topStripe) {
    slide.addShape(pptx.ShapeType.rect, {
      x: x + 0.02,
      y: y + 0.02,
      w: w - 0.04,
      h: 0.06,
      fill: { color: opts.topStripe },
      line: { color: opts.topStripe, width: 0 },
    });
  }
}

// =============================================================================
// SLIDE 1 — TITLE SLIDE
// =============================================================================
{
  const s = pptx.addSlide();
  s.background = { color: COLORS.bg };

  // Subtle geometric accent blocks on right
  s.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 13.333,
    h: 0.1,
    fill: { color: COLORS.indigo },
    line: { color: COLORS.indigo, width: 0 },
  });
  s.addShape(pptx.ShapeType.roundRect, {
    x: 8.65,
    y: 1.1,
    w: 4.0,
    h: 4.65,
    rectRadius: 0.14,
    fill: { color: COLORS.surface },
    line: { color: COLORS.border, width: 1.2 },
  });

  // Mini visual terminal preview on right
  s.addText('LIVE TERMINAL PREVIEW', {
    x: 8.95,
    y: 1.38,
    w: 3.4,
    h: 0.25,
    fontFace: FONT_MONO,
    fontSize: 9.5,
    bold: true,
    color: COLORS.emerald,
  });

  const previewRows = [
    { lot: 'BUL-7710', name: '1kg 999.9 Gold Vault', price: '₹17.80 L', chg: '+4.7%' },
    { lot: 'VEH-4821', name: 'BMW M340i xDrive', price: '₹15.50 L', chg: '+6.9%' },
    { lot: 'BNK-5520', name: 'Powai Lake 2BHK NPA', price: '₹66.00 L', chg: '+8.2%' },
    { lot: 'IND-6204', name: 'Mazak 5-Axis CNC', price: '₹49.50 L', chg: '+5.3%' },
    { lot: 'LUX-9012', name: 'Rolex Daytona Steel', price: '₹26.00 L', chg: '+9.4%' },
  ];
  previewRows.forEach((row, idx) => {
    const ry = 1.82 + idx * 0.68;
    s.addShape(pptx.ShapeType.roundRect, {
      x: 8.92,
      y: ry,
      w: 3.46,
      h: 0.56,
      rectRadius: 0.06,
      fill: { color: COLORS.surfaceAlt },
      line: { color: COLORS.border, width: 0.6 },
    });
    s.addText(row.lot, {
      x: 9.05,
      y: ry + 0.06,
      w: 1.1,
      h: 0.2,
      fontFace: FONT_MONO,
      fontSize: 8.5,
      bold: true,
      color: COLORS.indigo,
    });
    s.addText(row.name, {
      x: 9.05,
      y: ry + 0.27,
      w: 2.1,
      h: 0.22,
      fontFace: FONT_BODY,
      fontSize: 9.5,
      color: COLORS.text,
    });
    s.addText(row.price, {
      x: 11.15,
      y: ry + 0.06,
      w: 1.12,
      h: 0.22,
      align: 'right',
      fontFace: FONT_MONO,
      fontSize: 10,
      bold: true,
      color: COLORS.text,
    });
    s.addText(row.chg, {
      x: 11.15,
      y: ry + 0.29,
      w: 1.12,
      h: 0.2,
      align: 'right',
      fontFace: FONT_MONO,
      fontSize: 8.5,
      bold: true,
      color: COLORS.emerald,
    });
  });

  // Left hero text
  s.addText('PROJECT SHOWCASE & LIVE DEMO', {
    x: 0.75,
    y: 1.3,
    w: 6.5,
    h: 0.3,
    fontFace: FONT_MONO,
    fontSize: 11,
    bold: true,
    color: COLORS.indigo,
    charSpacing: 2,
  });

  s.addText('AutoAuction', {
    x: 0.75,
    y: 1.72,
    w: 7.4,
    h: 0.95,
    fontFace: FONT_HEAD,
    fontSize: 54,
    bold: true,
    color: COLORS.text,
  });

  s.addText('A Real-Time Asset Auction Terminal Built for Speed, Clarity, and Trust', {
    x: 0.75,
    y: 2.82,
    w: 7.4,
    h: 0.9,
    fontFace: FONT_BODY,
    fontSize: 21,
    color: COLORS.muted,
  });

  s.addText(
    'Inspired by Kite Web & SBI Securities — bringing instant live bidding, smooth price trajectories, escrow protection, and verifiable PostgreSQL settlement to high-value Indian asset auctions.',
    {
      x: 0.75,
      y: 3.85,
      w: 7.3,
      h: 0.95,
      fontFace: FONT_BODY,
      fontSize: 13.5,
      color: COLORS.dim,
    }
  );

  // 3 Hero Stat Tiles at bottom
  const stats = [
    { val: '9 Markets', lbl: '30 Verified Live Lots' },
    { val: 'Sub-Second', lbl: 'Phone ↔ Laptop Live Sync' },
    { val: '100% Escrow', lbl: 'Funded Bids & GST Notes' },
    { val: 'Ubuntu + SQL', lbl: 'Live 3-Window Audit Wall' },
  ];
  stats.forEach((st, i) => {
    const sx = 0.75 + i * 3.02;
    addCard(s, sx, 5.95, 2.84, 1.05, { topStripe: i % 2 === 0 ? COLORS.indigo : COLORS.emerald });
    s.addText(st.val, {
      x: sx + 0.18,
      y: 6.14,
      w: 2.48,
      h: 0.36,
      fontFace: FONT_MONO,
      fontSize: 16,
      bold: true,
      color: COLORS.text,
    });
    s.addText(st.lbl, {
      x: sx + 0.18,
      y: 6.53,
      w: 2.48,
      h: 0.32,
      fontFace: FONT_BODY,
      fontSize: 10.5,
      color: COLORS.dim,
    });
  });

  s.addNotes(
    'Introduce AutoAuction in one sentence: it takes messy, slow Indian asset auction sites and reimagines them as a clean, fast, trustworthy trading terminal that runs live across phone, laptop, and an Ubuntu PostgreSQL backend.'
  );
}

// =============================================================================
// SLIDE 2 — THE PROBLEM
// =============================================================================
{
  const s = pptx.addSlide();
  addBaseChrome(
    s,
    2,
    '01 · The Problem',
    'High-Value Auctions Still Run Like Slow Paper Forms',
    'Why buyers and sellers lose trust in traditional Indian auction websites'
  );

  const problems = [
    {
      num: '01',
      title: 'Manual Page Refreshes Lose Bids',
      body: 'Bidders repeatedly hit refresh in the final 30 seconds, often finding out they lost only after the timer expires.',
      accent: COLORS.rose,
    },
    {
      num: '02',
      title: 'Fake & Unfunded Offers',
      body: 'Weak portals let users place reckless bids without verifying funds, forcing sellers to restart auctions from scratch.',
      accent: COLORS.amber,
    },
    {
      num: '03',
      title: 'Zero Price Trend Visibility',
      body: 'Plain static tables only show one number — bidders cannot tell if bidding is accelerating, stalling, or overpriced.',
      accent: COLORS.indigo,
    },
    {
      num: '04',
      title: 'Cluttered, Unreadable Interfaces',
      body: 'Broken photos, buried terms, and slow offline PDFs make evaluating bank foreclosures or industrial lots intimidating.',
      accent: COLORS.cyan,
    },
  ];

  problems.forEach((p, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const x = 0.65 + col * 6.14;
    const y = 1.85 + row * 2.42;
    addCard(s, x, y, 5.88, 2.15, { topStripe: p.accent });
    s.addText(p.num, {
      x: x + 0.28,
      y: y + 0.28,
      w: 0.7,
      h: 0.35,
      fontFace: FONT_MONO,
      fontSize: 16,
      bold: true,
      color: p.accent,
    });
    s.addText(p.title, {
      x: x + 0.98,
      y: y + 0.28,
      w: 4.65,
      h: 0.4,
      fontFace: FONT_HEAD,
      fontSize: 17,
      bold: true,
      color: COLORS.text,
    });
    s.addText(p.body, {
      x: x + 0.28,
      y: y + 0.85,
      w: 5.32,
      h: 1.05,
      fontFace: FONT_BODY,
      fontSize: 13.5,
      color: COLORS.muted,
    });
  });

  s.addNotes(
    'Explain these four everyday pain points slowly. Anyone who has seen government tender portals or bank foreclosure sites recognizes how frustrating static forms and manual refreshes are.'
  );
}

// =============================================================================
// SLIDE 3 — WHY THIS INTERFACE MUST EXIST
// =============================================================================
{
  const s = pptx.addSlide();
  addBaseChrome(
    s,
    3,
    '02 · Why This Interface Must Exist',
    'Bringing Stock-Market Discipline to High-Value Asset Auctions',
    'Inspired by Kite Web & SBI Securities — turning stressful bidding into calm, data-backed decisions'
  );

  // Left: Old Way
  addCard(s, 0.65, 1.85, 5.65, 4.75, { fill: COLORS.surface, topStripe: COLORS.rose });
  s.addText('TRADITIONAL AUCTION PORTALS', {
    x: 0.95,
    y: 2.12,
    w: 5.0,
    h: 0.34,
    fontFace: FONT_MONO,
    fontSize: 12,
    bold: true,
    color: COLORS.rose,
  });

  const oldItems = [
    'Single static webpage — press F5 to check new bids',
    'Blind bidding with no price history or momentum chart',
    'No upfront balance lock — high rate of defaulted winners',
    'Desktop-only tables that break completely on mobile phones',
    'Manual email invoices days after the auction closes',
  ];
  oldItems.forEach((txt, idx) => {
    const iy = 2.68 + idx * 0.72;
    s.addText('✕', {
      x: 0.95,
      y: iy,
      w: 0.35,
      h: 0.35,
      fontFace: FONT_HEAD,
      fontSize: 14,
      bold: true,
      color: COLORS.rose,
    });
    s.addText(txt, {
      x: 1.35,
      y: iy,
      w: 4.65,
      h: 0.56,
      fontFace: FONT_BODY,
      fontSize: 13,
      color: COLORS.muted,
    });
  });

  // Center Arrow
  s.addText('➔', {
    x: 6.38,
    y: 3.85,
    w: 0.6,
    h: 0.6,
    align: 'center',
    fontFace: FONT_HEAD,
    fontSize: 28,
    bold: true,
    color: COLORS.indigo,
  });

  // Right: AutoAuction Way
  addCard(s, 7.05, 1.85, 5.63, 4.75, { fill: COLORS.surfaceAlt, border: COLORS.indigo, topStripe: COLORS.emerald });
  s.addText('AUTOAUC LIVE TERMINAL', {
    x: 7.35,
    y: 2.12,
    w: 5.0,
    h: 0.34,
    fontFace: FONT_MONO,
    fontSize: 12,
    bold: true,
    color: COLORS.emerald,
  });

  const newItems = [
    'Instant WebSocket sync across laptop & iPhone with zero reloads',
    'Smooth bid trajectory charts, moving average & 5-level depth',
    'Escrow-locked wallet guarantees every bid is 100% funded',
    'Touch-ready responsive workspace built for both big & small screens',
    'Printable GST settlement contract notes generated automatically',
  ];
  newItems.forEach((txt, idx) => {
    const iy = 2.68 + idx * 0.72;
    s.addText('✓', {
      x: 7.35,
      y: iy,
      w: 0.35,
      h: 0.35,
      fontFace: FONT_HEAD,
      fontSize: 15,
      bold: true,
      color: COLORS.emerald,
    });
    s.addText(txt, {
      x: 7.75,
      y: iy,
      w: 4.65,
      h: 0.56,
      fontFace: FONT_BODY,
      fontSize: 13,
      bold: true,
      color: COLORS.text,
    });
  });

  s.addNotes(
    'This is the core justification slide for the jury: people already trust interfaces like Kite Web for lakhs of rupees every day because clarity creates confidence. AutoAuction applies that exact visual clarity to real-world asset auctions.'
  );
}

// =============================================================================
// SLIDE 4 — 9 VERIFIED MARKETS & VISUAL CLARITY
// =============================================================================
{
  const s = pptx.addSlide();
  addBaseChrome(
    s,
    4,
    '03 · Multi-Market Coverage',
    'One Unified Interface Across 9 High-Value Indian Sectors',
    '30 curated lots organized with crisp vector silhouettes and a live 9-sector heatmap'
  );

  const markets = [
    { code: 'VEH', name: 'Automobiles & Fleet', ex: 'Luxury sedans, EVs, commercial SUVs', col: COLORS.indigo },
    { code: 'EST', name: 'Real Estate & Land', ex: 'Grade-A offices, villas, industrial plots', col: COLORS.emerald },
    { code: 'BNK', name: 'Bank Foreclosures (NPA)', ex: 'SARFAESI flats & seized collateral', col: COLORS.amber },
    { code: 'BUL', name: 'Gold & Bullion Vaults', ex: '999.9 gold bars, silver bricks, coins', col: COLORS.amber },
    { code: 'IND', name: 'Industrial Machinery', ex: '5-axis CNC mills, tower cranes, presses', col: COLORS.cyan },
    { code: 'PSU', name: 'Govt & PSU Surplus', ex: 'Rail coaches, solar arrays, transformers', col: COLORS.indigo },
    { code: 'LOG', name: 'Logistics & Marine', ex: 'Tractor trailers, coastal barges, stackers', col: COLORS.emerald },
    { code: 'ELC', name: 'IT & Plant Liquidation', ex: 'Laptop fleets, servers, silent generators', col: COLORS.cyan },
    { code: 'LUX', name: 'Luxury & Collectibles', ex: 'Swiss watches, fine art, rare assets', col: COLORS.rose },
  ];

  markets.forEach((m, idx) => {
    const col = idx % 3;
    const row = Math.floor(idx / 3);
    const x = 0.65 + col * 4.1;
    const y = 1.78 + row * 1.46;
    addCard(s, x, y, 3.88, 1.28, { topStripe: m.col });
    s.addText(m.code, {
      x: x + 0.2,
      y: y + 0.22,
      w: 0.72,
      h: 0.3,
      fontFace: FONT_MONO,
      fontSize: 10.5,
      bold: true,
      color: m.col,
    });
    s.addText(m.name, {
      x: x + 0.92,
      y: y + 0.2,
      w: 2.8,
      h: 0.34,
      fontFace: FONT_HEAD,
      fontSize: 13.5,
      bold: true,
      color: COLORS.text,
    });
    s.addText(m.ex, {
      x: x + 0.2,
      y: y + 0.68,
      w: 3.48,
      h: 0.44,
      fontFace: FONT_BODY,
      fontSize: 11,
      color: COLORS.dim,
    });
  });

  // Bottom callout strip
  addCard(s, 0.65, 6.18, 12.03, 0.62, { fill: COLORS.surfaceAlt, border: COLORS.indigo });
  s.addText(
    'WHY CLEAN VECTOR ICONS + SECTOR HEATMAP?   Zero broken images, instant visual scanning across asset types, and real-time market breadth showing which sectors are hottest.',
    {
      x: 0.9,
      y: 6.32,
      w: 11.55,
      h: 0.36,
      fontFace: FONT_BODY,
      fontSize: 11.5,
      bold: true,
      color: COLORS.text,
    }
  );
}

// =============================================================================
// SLIDE 5 — CHARACTERISTIC 1: SPLIT-SCREEN LIVE TERMINAL
// =============================================================================
{
  const s = pptx.addSlide();
  addBaseChrome(
    s,
    5,
    '04 · Interface Characteristic 1',
    'Split-Screen MarketWatch & Live Bidding Terminal',
    'Monitor all 30 lots on the left while analyzing and bidding on the right — zero page switching'
  );

  // Left: Wireframe representation of Split-Screen Terminal
  addCard(s, 0.65, 1.82, 7.55, 4.88, { fill: COLORS.surface, border: COLORS.indigo });
  s.addText('KITE-INSPIRED SPLIT-SCREEN WORKSPACE', {
    x: 0.9,
    y: 2.02,
    w: 5.5,
    h: 0.28,
    fontFace: FONT_MONO,
    fontSize: 10,
    bold: true,
    color: COLORS.indigo,
  });

  // Left sub-pane (MarketWatch)
  addCard(s, 0.9, 2.42, 2.55, 4.02, { fill: COLORS.bg, border: COLORS.border });
  s.addText('MarketWatch (30)', {
    x: 1.05,
    y: 2.54,
    w: 2.25,
    h: 0.28,
    fontFace: FONT_HEAD,
    fontSize: 11,
    bold: true,
    color: COLORS.text,
  });
  const watchItems = [
    ['BUL-7710', '₹17.8L', true],
    ['VEH-4821', '₹15.5L', false],
    ['BNK-5520', '₹66.0L', false],
    ['IND-6204', '₹49.5L', false],
    ['LOG-2190', '₹43.0L', false],
    ['LUX-9012', '₹26.0L', false],
  ] as const;
  watchItems.forEach(([id, price, active], i) => {
    const wy = 2.94 + i * 0.54;
    s.addShape(pptx.ShapeType.roundRect, {
      x: 1.02,
      y: wy,
      w: 2.31,
      h: 0.44,
      rectRadius: 0.05,
      fill: { color: active ? COLORS.indigoSoft : COLORS.surface },
      line: { color: active ? COLORS.indigo : COLORS.border, width: 0.7 },
    });
    s.addText(id, {
      x: 1.12,
      y: wy + 0.1,
      w: 1.05,
      h: 0.24,
      fontFace: FONT_MONO,
      fontSize: 9.5,
      bold: true,
      color: active ? COLORS.text : COLORS.muted,
    });
    s.addText(price, {
      x: 2.15,
      y: wy + 0.1,
      w: 1.08,
      h: 0.24,
      align: 'right',
      fontFace: FONT_MONO,
      fontSize: 9.5,
      bold: true,
      color: COLORS.emerald,
    });
  });

  // Right sub-pane (Active Lot Workbench)
  addCard(s, 3.62, 2.42, 4.35, 4.02, { fill: COLORS.bg, border: COLORS.border });
  s.addText('ACTIVE LOT · BUL-7710 (MMTC-PAMP 1kg Gold)', {
    x: 3.8,
    y: 2.55,
    w: 4.0,
    h: 0.26,
    fontFace: FONT_HEAD,
    fontSize: 10.5,
    bold: true,
    color: COLORS.text,
  });
  // Chart box placeholder
  s.addShape(pptx.ShapeType.roundRect, {
    x: 3.8,
    y: 2.94,
    w: 3.98,
    h: 1.92,
    rectRadius: 0.06,
    fill: { color: COLORS.surface },
    line: { color: COLORS.border, width: 0.8 },
  });
  s.addText('Live Trajectory Chart + 5-Level Bid Depth\n(Drop in your live app screenshot here if desired)', {
    x: 3.95,
    y: 3.55,
    w: 3.68,
    h: 0.7,
    align: 'center',
    fontFace: FONT_BODY,
    fontSize: 10.5,
    color: COLORS.dim,
  });
  // Quick bid buttons mockup
  s.addShape(pptx.ShapeType.roundRect, {
    x: 3.8,
    y: 5.04,
    w: 1.92,
    h: 0.56,
    rectRadius: 0.06,
    fill: { color: COLORS.indigo },
    line: { color: COLORS.indigo, width: 0 },
  });
  s.addText('Place Bid  ₹18.00 L', {
    x: 3.8,
    y: 5.18,
    w: 1.92,
    h: 0.28,
    align: 'center',
    fontFace: FONT_HEAD,
    fontSize: 10.5,
    bold: true,
    color: COLORS.text,
  });
  s.addShape(pptx.ShapeType.roundRect, {
    x: 5.86,
    y: 5.04,
    w: 1.92,
    h: 0.56,
    rectRadius: 0.06,
    fill: { color: COLORS.surfaceAlt },
    line: { color: COLORS.amber, width: 1 },
  });
  s.addText('Arm Auto-Pilot', {
    x: 5.86,
    y: 5.18,
    w: 1.92,
    h: 0.28,
    align: 'center',
    fontFace: FONT_HEAD,
    fontSize: 10.5,
    bold: true,
    color: COLORS.amber,
  });
  s.addText('Escrow Available: ₹4.50 Cr  ·  Timer: 18m 42s', {
    x: 3.8,
    y: 5.8,
    w: 3.98,
    h: 0.35,
    fontFace: FONT_MONO,
    fontSize: 9.5,
    color: COLORS.emerald,
  });

  // Right side: 4 Crisp Characteristic Bullets
  const points = [
    {
      t: 'Zero Context Switching',
      d: 'Keep your eyes on all 30 live prices while bidding on your target asset.',
    },
    {
      t: 'Instant Visual Feedback',
      d: 'Price flashes, outbid alerts, and live timers react the moment a bid lands.',
    },
    {
      t: '1-Tap Quick Increments',
      d: 'Pre-calculated valid step buttons prevent mistyped amounts under pressure.',
    },
    {
      t: 'Built for Phone & Desktop',
      d: 'Splits into two panes on laptop and adapts cleanly into thumb-sized taps on iPhone.',
    },
  ];
  points.forEach((pt, idx) => {
    const py = 1.82 + idx * 1.24;
    addCard(s, 8.45, py, 4.23, 1.08, { topStripe: idx % 2 === 0 ? COLORS.indigo : COLORS.emerald });
    s.addText(pt.t, {
      x: 8.68,
      y: py + 0.16,
      w: 3.8,
      h: 0.3,
      fontFace: FONT_HEAD,
      fontSize: 13.5,
      bold: true,
      color: COLORS.text,
    });
    s.addText(pt.d, {
      x: 8.68,
      y: py + 0.48,
      w: 3.8,
      h: 0.48,
      fontFace: FONT_BODY,
      fontSize: 11,
      color: COLORS.muted,
    });
  });
}

// =============================================================================
// SLIDE 6 — CHARACTERISTIC 2: SMOOTH TRAJECTORIES & BID DEPTH
// =============================================================================
{
  const s = pptx.addSlide();
  addBaseChrome(
    s,
    6,
    '05 · Interface Characteristic 2',
    'Smooth Price Trajectories & Live Market Depth',
    'Helping bidders read momentum and estimate fair closing value before committing funds'
  );

  // Left card: Smooth Trajectory Chart explanation + native pptx line chart
  addCard(s, 0.65, 1.82, 6.75, 4.88, { topStripe: COLORS.indigo });
  s.addText('SMOOTH BID TRAJECTORY + MOVING AVERAGE', {
    x: 0.9,
    y: 2.04,
    w: 5.5,
    h: 0.28,
    fontFace: FONT_MONO,
    fontSize: 10.5,
    bold: true,
    color: COLORS.indigo,
  });
  s.addText('5m  |  15m  |  ALL     ·     Est. Hammer: ₹19.20 L', {
    x: 0.9,
    y: 2.34,
    w: 6.2,
    h: 0.26,
    fontFace: FONT_MONO,
    fontSize: 10,
    color: COLORS.emerald,
  });

  // Real PowerPoint Chart embedded cleanly!
  s.addChart(
    pptx.ChartType.line,
    [
      {
        name: 'Live Bid Curve (₹L)',
        labels: ['Open', '#2', '#3', '#4', '#5', 'Est +50%', 'Est Close'],
        values: [16.5, 16.9, 17.2, 17.5, 17.8, null, null],
      },
      {
        name: '3-Pt EMA Trend',
        labels: ['Open', '#2', '#3', '#4', '#5', 'Est +50%', 'Est Close'],
        values: [16.5, 16.7, 16.95, 17.23, 17.52, null, null],
      },
      {
        name: 'Projected Trajectory',
        labels: ['Open', '#2', '#3', '#4', '#5', 'Est +50%', 'Est Close'],
        values: [null, null, null, null, 17.8, 18.5, 19.2],
      },
    ],
    {
      x: 0.85,
      y: 2.68,
      w: 6.35,
      h: 2.85,
      chartColors: [COLORS.indigo, COLORS.amber, COLORS.emerald],
      lineSmooth: true,
      lineSize: 2.5,
      showLegend: true,
      legendPos: 'b',
      legendColor: COLORS.muted,
      legendFontSize: 9,
      catAxisLabelColor: COLORS.dim,
      valAxisLabelColor: COLORS.dim,
      valAxisMinVal: 16,
      valAxisMaxVal: 20,
      catGridLine: { style: 'none' },
      valGridLine: { color: COLORS.border, style: 'dash', size: 0.5 },
      plotArea: { fill: { color: COLORS.bg } },
      chartArea: { fill: { color: COLORS.surface } },
    }
  );

  s.addText(
    '• Smooth spline curve removes jagged jumps   • Projected corridor estimates closing price from live bid pace',
    {
      x: 0.9,
      y: 5.75,
      w: 6.25,
      h: 0.72,
      fontFace: FONT_BODY,
      fontSize: 11.5,
      color: COLORS.muted,
    }
  );

  // Right card: 5-Level Kite Bid Depth Ladder
  addCard(s, 7.65, 1.82, 5.03, 4.88, { topStripe: COLORS.emerald });
  s.addText('5-LEVEL MARKET BID DEPTH LADDER', {
    x: 7.9,
    y: 2.04,
    w: 4.5,
    h: 0.28,
    fontFace: FONT_MONO,
    fontSize: 10.5,
    bold: true,
    color: COLORS.emerald,
  });

  const ladder = [
    { rank: '1', name: 'Meera Nair', dev: 'iPhone Safari', amt: '₹17.80 L', pct: 1.0, lead: true },
    { rank: '2', name: 'Vikram Desai', dev: 'Windows Chrome', amt: '₹17.50 L', pct: 0.82, lead: false },
    { rank: '3', name: 'Rahul Sharma', dev: 'Auto-Pilot', amt: '₹17.20 L', pct: 0.65, lead: false },
    { rank: '4', name: 'Vikram Desai', dev: 'Windows Chrome', amt: '₹16.90 L', pct: 0.48, lead: false },
    { rank: '5', name: 'Opening Reserve', dev: 'Verified Base', amt: '₹16.50 L', pct: 0.3, lead: false },
  ];

  ladder.forEach((row, idx) => {
    const ry = 2.52 + idx * 0.56;
    const barW = 4.5 * row.pct;
    s.addShape(pptx.ShapeType.roundRect, {
      x: 7.9,
      y: ry,
      w: 4.53,
      h: 0.46,
      rectRadius: 0.05,
      fill: { color: COLORS.bg },
      line: { color: COLORS.border, width: 0.5 },
    });
    s.addShape(pptx.ShapeType.rect, {
      x: 7.9 + (4.53 - barW),
      y: ry + 0.02,
      w: barW - 0.02,
      h: 0.42,
      fill: { color: row.lead ? COLORS.emeraldDark : COLORS.indigoSoft },
      line: { color: row.lead ? COLORS.emeraldDark : COLORS.indigoSoft, width: 0 },
    });
    s.addText(`${row.rank}  ${row.name} (${row.dev})`, {
      x: 8.02,
      y: ry + 0.1,
      w: 2.95,
      h: 0.26,
      fontFace: FONT_BODY,
      fontSize: 10,
      bold: row.lead,
      color: COLORS.text,
    });
    s.addText(row.amt, {
      x: 11.1,
      y: ry + 0.1,
      w: 1.22,
      h: 0.26,
      align: 'right',
      fontFace: FONT_MONO,
      fontSize: 10.5,
      bold: true,
      color: row.lead ? COLORS.emerald : COLORS.text,
    });
  });

  s.addText(
    'Why it matters:\n• Shows top 5 active bids, origin device, and bid frequency.\n• Live pulse highlights each new incoming offer.\n• Switch anytime to Step Velocity bars.',
    {
      x: 7.9,
      y: 5.42,
      w: 4.55,
      h: 1.15,
      fontFace: FONT_BODY,
      fontSize: 11.5,
      color: COLORS.muted,
    }
  );
}

// =============================================================================
// SLIDE 7 — CHARACTERISTIC 3: ESCROW, AUTO-PILOT & GST CONTRACT NOTES
// =============================================================================
{
  const s = pptx.addSlide();
  addBaseChrome(
    s,
    7,
    '06 · Financial Trust Mechanics',
    'Real Money Backing Every Bid — Zero Fake Offers',
    'How AutoAuction protects both buyers and sellers from opening bid to final settlement'
  );

  const pillars = [
    {
      step: 'STEP 01',
      title: 'Instant Escrow Locking',
      accent: COLORS.emerald,
      bullets: [
        'Every bid immediately locks the bid amount from your available wallet.',
        'If another user outbids you, locked money unlocks automatically in milliseconds.',
        'Margin Utilization Meter clearly displays Available vs. Locked funds.',
      ],
    },
    {
      step: 'STEP 02',
      title: 'Hands-Free Auto-Pilot',
      accent: COLORS.amber,
      bullets: [
        'Set your maximum comfortable budget once on any live lot.',
        'System automatically bids the minimum needed step whenever rivals bid.',
        'Stops strictly at your limit — no emotional overbidding.',
      ],
    },
    {
      step: 'STEP 03',
      title: 'Instant GST Contract Notes',
      accent: COLORS.indigo,
      bullets: [
        'When the timer hits zero, winning escrow settles cleanly to the seller.',
        'Generates a clean, printable GST-compliant settlement contract note.',
        'Complete immutable wallet audit trail for every deposit, lock, and release.',
      ],
    },
  ];

  pillars.forEach((p, i) => {
    const x = 0.65 + i * 4.1;
    addCard(s, x, 1.88, 3.88, 4.78, { topStripe: p.accent });
    s.addText(p.step, {
      x: x + 0.25,
      y: 2.15,
      w: 1.8,
      h: 0.28,
      fontFace: FONT_MONO,
      fontSize: 10.5,
      bold: true,
      color: p.accent,
    });
    s.addText(p.title, {
      x: x + 0.25,
      y: 2.5,
      w: 3.38,
      h: 0.45,
      fontFace: FONT_HEAD,
      fontSize: 17.5,
      bold: true,
      color: COLORS.text,
    });
    p.bullets.forEach((b, bi) => {
      const by = 3.18 + bi * 1.1;
      s.addText('▸', {
        x: x + 0.25,
        y: by,
        w: 0.25,
        h: 0.3,
        fontFace: FONT_HEAD,
        fontSize: 12,
        color: p.accent,
      });
      s.addText(b, {
        x: x + 0.52,
        y: by,
        w: 3.1,
        h: 0.95,
        fontFace: FONT_BODY,
        fontSize: 12.5,
        color: COLORS.muted,
      });
    });
  });
}

// =============================================================================
// SLIDE 8 — ROLES & REAL-TIME SYNC
// =============================================================================
{
  const s = pptx.addSlide();
  addBaseChrome(
    s,
    8,
    '07 · Roles & Real-Time Collaboration',
    'Built for Every Participant — Synced Across Devices Instantly',
    'Clean role separation with live WebSocket updates connecting iPhone, Laptop, and Admin desk'
  );

  const roles = [
    {
      role: 'BIDDER',
      accent: COLORS.emerald,
      items: [
        'Explore 9 sectors, filter lots & pin Watchlist',
        'Top up wallet & monitor live Escrow Margin Meter',
        'Place 1-tap bids or arm Auto-Pilot proxy limits',
        'Download GST Contract Notes for won lots',
      ],
    },
    {
      role: 'SELLER',
      accent: COLORS.cyan,
      items: [
        'List new vehicles, machinery, bullion, or property',
        'Set reserve price, duration, condition & specs',
        'Edit active listings & track live bidder interest',
        'Receive automatic net payouts after hammer close',
      ],
    },
    {
      role: 'ADMIN',
      accent: COLORS.indigo,
      items: [
        'Approve or reject pending seller lots before launch',
        'Manage user accounts and role permissions',
        'Control Live Demo Speed (1x, 2x, 5x, 10x)',
        'Trigger 5-step Bidding War Bursts & 1-click reset',
      ],
    },
  ];

  roles.forEach((r, i) => {
    const x = 0.65 + i * 4.1;
    addCard(s, x, 1.85, 3.88, 3.85, { topStripe: r.accent });
    s.addText(r.role, {
      x: x + 0.25,
      y: 2.12,
      w: 3.3,
      h: 0.36,
      fontFace: FONT_MONO,
      fontSize: 14,
      bold: true,
      color: r.accent,
    });
    r.items.forEach((it, ii) => {
      const iy = 2.66 + ii * 0.72;
      s.addText('•', {
        x: x + 0.25,
        y: iy,
        w: 0.22,
        h: 0.3,
        fontFace: FONT_HEAD,
        fontSize: 14,
        color: r.accent,
      });
      s.addText(it, {
        x: x + 0.48,
        y: iy,
        w: 3.15,
        h: 0.64,
        fontFace: FONT_BODY,
        fontSize: 12,
        color: COLORS.muted,
      });
    });
  });

  // Bottom real-time sync banner
  addCard(s, 0.65, 5.9, 12.03, 0.85, { fill: COLORS.surfaceAlt, border: COLORS.emerald });
  s.addText('REAL-TIME SYNC PROMISE', {
    x: 0.9,
    y: 6.02,
    w: 3.2,
    h: 0.25,
    fontFace: FONT_MONO,
    fontSize: 10,
    bold: true,
    color: COLORS.emerald,
  });
  s.addText(
    'Tap "Place Bid" on your iPhone Pro Max → Server verifies balance & commits to SQL → Laptop charts, bid depth & escrow meters update immediately.',
    {
      x: 0.9,
      y: 6.3,
      w: 11.5,
      h: 0.35,
      fontFace: FONT_BODY,
      fontSize: 12.5,
      color: COLORS.text,
    }
  );
}

// =============================================================================
// SLIDE 9 — DATABASE INTEGRITY & SECURITY (PLAIN ENGLISH)
// =============================================================================
{
  const s = pptx.addSlide();
  addBaseChrome(
    s,
    9,
    '08 · Reliability & Security',
    'Behind the Curtain: Database & Security Made Simple',
    'Real production engineering running on Ubuntu Server 24.04 LTS — explained without jargon'
  );

  // Left: PostgreSQL 16 Integrity
  addCard(s, 0.65, 1.85, 5.88, 4.82, { topStripe: COLORS.indigo });
  s.addText('POSTGRESQL 16 DATABASE INTEGRITY', {
    x: 0.95,
    y: 2.12,
    w: 5.3,
    h: 0.32,
    fontFace: FONT_MONO,
    fontSize: 11.5,
    bold: true,
    color: COLORS.indigo,
  });

  const dbPoints = [
    [
      'All-or-Nothing Transactions',
      'Placing a bid, locking buyer escrow, and refunding the previous leader happen as one atomic SQL unit.',
    ],
    [
      'Structured Relational Tables',
      'Clean tables for users, auctions, bids, wallet transactions, active sessions, and live device events.',
    ],
    [
      'Safe Against SQL Injection',
      'Every query uses strict parameterized inputs — user text can never hijack database commands.',
    ],
    [
      'Persistent Across Restarts',
      'Restarting the Ubuntu server preserves every account, bid history, and rupee balance.',
    ],
  ];
  dbPoints.forEach(([h, d], idx) => {
    const py = 2.62 + idx * 0.96;
    s.addText(h, {
      x: 0.95,
      y: py,
      w: 5.25,
      h: 0.28,
      fontFace: FONT_HEAD,
      fontSize: 13.5,
      bold: true,
      color: COLORS.text,
    });
    s.addText(d, {
      x: 0.95,
      y: py + 0.3,
      w: 5.25,
      h: 0.56,
      fontFace: FONT_BODY,
      fontSize: 11.5,
      color: COLORS.muted,
    });
  });

  // Right: Security & Cryptography
  addCard(s, 6.8, 1.85, 5.88, 4.82, { topStripe: COLORS.emerald });
  s.addText('ACCOUNT & SESSION SECURITY', {
    x: 7.1,
    y: 2.12,
    w: 5.3,
    h: 0.32,
    fontFace: FONT_MONO,
    fontSize: 11.5,
    bold: true,
    color: COLORS.emerald,
  });

  const secPoints = [
    [
      'Zero Plain-Text Passwords',
      'Each password gets its own unique random salt and a one-way scrypt hash — even identical passwords look completely different.',
    ],
    [
      'Signed Session Tokens (HMAC-SHA256)',
      'Logged-in devices receive a tamper-proof token checked on every bid and wallet action.',
    ],
    [
      'Device & Session Visibility',
      'Server logs which device signed in (iPhone Safari vs. Windows Chrome) and when it was last active.',
    ],
    [
      'Server-Only Audit Access',
      'Security and hash monitors only respond to local SSH sessions inside Ubuntu — external browsers are blocked (HTTP 403).',
    ],
  ];
  secPoints.forEach(([h, d], idx) => {
    const py = 2.62 + idx * 0.96;
    s.addText(h, {
      x: 7.1,
      y: py,
      w: 5.25,
      h: 0.28,
      fontFace: FONT_HEAD,
      fontSize: 13.5,
      bold: true,
      color: COLORS.text,
    });
    s.addText(d, {
      x: 7.1,
      y: py + 0.3,
      w: 5.25,
      h: 0.56,
      fontFace: FONT_BODY,
      fontSize: 11.5,
      color: COLORS.muted,
    });
  });
}

// =============================================================================
// SLIDE 10 — LIVE DEMO ARCHITECTURE (IPHONE + LAPTOP + 3 SSH WINDOWS)
// =============================================================================
{
  const s = pptx.addSlide();
  addBaseChrome(
    s,
    10,
    '09 · Live Review Showcase',
    'What You Are About to See Live Right Now',
    'Two live bidding devices connected to our Ubuntu Server + 3 side-by-side Windows CMD SSH monitors'
  );

  // Top flow: Devices -> Ubuntu Server
  addCard(s, 0.65, 1.82, 3.3, 1.55, { fill: COLORS.surfaceAlt, topStripe: COLORS.cyan });
  s.addText('CLIENT DEVICES (LIVE)', {
    x: 0.85,
    y: 2.02,
    w: 2.9,
    h: 0.25,
    fontFace: FONT_MONO,
    fontSize: 10,
    bold: true,
    color: COLORS.cyan,
  });
  s.addText('• iPhone Pro Max (Safari)\n• Windows Laptop (Chrome)\nConnected via WebSocket', {
    x: 0.85,
    y: 2.34,
    w: 2.95,
    h: 0.9,
    fontFace: FONT_BODY,
    fontSize: 12,
    color: COLORS.text,
  });

  s.addText('⇄', {
    x: 4.02,
    y: 2.3,
    w: 0.55,
    h: 0.5,
    align: 'center',
    fontFace: FONT_HEAD,
    fontSize: 28,
    bold: true,
    color: COLORS.indigo,
  });

  addCard(s, 4.65, 1.82, 3.9, 1.55, { fill: COLORS.surfaceAlt, border: COLORS.indigo, topStripe: COLORS.indigo });
  s.addText('UBUNTU SERVER 24.04 VM', {
    x: 4.88,
    y: 2.02,
    w: 3.5,
    h: 0.25,
    fontFace: FONT_MONO,
    fontSize: 10,
    bold: true,
    color: COLORS.indigo,
  });
  s.addText('Express + WebSocket Engine\nPostgreSQL 16 Database\nSalted scrypt Auth & Escrow', {
    x: 4.88,
    y: 2.34,
    w: 3.5,
    h: 0.9,
    fontFace: FONT_BODY,
    fontSize: 12,
    color: COLORS.text,
  });

  s.addText('➔', {
    x: 8.62,
    y: 2.3,
    w: 0.55,
    h: 0.5,
    align: 'center',
    fontFace: FONT_HEAD,
    fontSize: 26,
    bold: true,
    color: COLORS.emerald,
  });

  addCard(s, 9.25, 1.82, 3.43, 1.55, { fill: COLORS.surfaceAlt, topStripe: COLORS.emerald });
  s.addText('WINDOWS CMD SSH WALL', {
    x: 9.48,
    y: 2.02,
    w: 3.0,
    h: 0.25,
    fontFace: FONT_MONO,
    fontSize: 10,
    bold: true,
    color: COLORS.emerald,
  });
  s.addText('3 Live Terminal Windows\nshowing real SQL commits,\nhashes & device traffic.', {
    x: 9.48,
    y: 2.34,
    w: 3.0,
    h: 0.9,
    fontFace: FONT_BODY,
    fontSize: 12,
    color: COLORS.text,
  });

  // Bottom 3 Terminal Window Cards
  const windows = [
    {
      win: 'SSH WINDOW 1',
      cmd: 'npm run monitor:db',
      title: 'Live PostgreSQL Watcher',
      desc: 'Refreshes every 1.5s showing live table row counts, top active lots, latest bids, and locked escrow balances.',
      accent: COLORS.cyan,
    },
    {
      win: 'SSH WINDOW 2',
      cmd: 'npm run monitor:security',
      title: 'Security & Hash Inspector',
      desc: 'Displays each account’s unique 16B salt, non-reversible scrypt hash fingerprint, and active signed sessions.',
      accent: COLORS.indigo,
    },
    {
      win: 'SSH WINDOW 3',
      cmd: 'npm run monitor:stream',
      title: 'Multi-Device Event Stream',
      desc: 'Prints every tap tagged [iPhone Safari], [Windows Chrome], or [Demo War Burst] with SQL commit latency in ms.',
      accent: COLORS.emerald,
    },
  ];

  windows.forEach((w, i) => {
    const x = 0.65 + i * 4.1;
    addCard(s, x, 3.68, 3.88, 3.0, { fill: '090E1A', border: w.accent, topStripe: w.accent });
    s.addText(w.win, {
      x: x + 0.22,
      y: 3.92,
      w: 2.0,
      h: 0.24,
      fontFace: FONT_MONO,
      fontSize: 10,
      bold: true,
      color: w.accent,
    });
    s.addText(w.title, {
      x: x + 0.22,
      y: 4.22,
      w: 3.45,
      h: 0.36,
      fontFace: FONT_HEAD,
      fontSize: 15.5,
      bold: true,
      color: COLORS.text,
    });
    s.addShape(pptx.ShapeType.roundRect, {
      x: x + 0.22,
      y: 4.68,
      w: 3.44,
      h: 0.38,
      rectRadius: 0.05,
      fill: { color: COLORS.surfaceAlt },
      line: { color: COLORS.border, width: 0.6 },
    });
    s.addText(`$ ${w.cmd}`, {
      x: x + 0.34,
      y: 4.74,
      w: 3.2,
      h: 0.26,
      fontFace: FONT_MONO,
      fontSize: 10.5,
      bold: true,
      color: COLORS.amber,
    });
    s.addText(w.desc, {
      x: x + 0.22,
      y: 5.2,
      w: 3.44,
      h: 1.25,
      fontFace: FONT_BODY,
      fontSize: 11.5,
      color: COLORS.muted,
    });
  });

  s.addNotes(
    'Right after this slide, switch directly to your live demo: show iPhone Pro Max + Laptop Chrome side by side with the 3 Windows CMD SSH monitors!'
  );
}

// =============================================================================
// SLIDE 11 — SUMMARY, FUTURE SCOPE & THANK YOU
// =============================================================================
{
  const s = pptx.addSlide();
  addBaseChrome(
    s,
    11,
    '10 · Summary & Future Scope',
    'Why AutoAuction Matters — and Where It Goes Next',
    'A transparent, real-time auction standard ready for real-world deployment'
  );

  // Left: 3 Core Pillars
  addCard(s, 0.65, 1.85, 5.85, 3.65, { topStripe: COLORS.indigo });
  s.addText('THREE DEFINING PILLARS', {
    x: 0.95,
    y: 2.12,
    w: 5.2,
    h: 0.3,
    fontFace: FONT_MONO,
    fontSize: 11.5,
    bold: true,
    color: COLORS.indigo,
  });
  const recaps = [
    ['Clarity Over Clutter', 'Split-screen terminal, smooth trajectories, and 9-sector heatmap remove guesswork.'],
    ['Real-Time Speed', 'Instant WebSocket updates keep phone and desktop bidders on an equal footing.'],
    ['Verifiable Trust', 'Escrow locking, PostgreSQL ACID commits, and salted hashing protect every rupee.'],
  ];
  recaps.forEach(([h, d], i) => {
    const ry = 2.6 + i * 0.92;
    s.addText(h, {
      x: 0.95,
      y: ry,
      w: 5.2,
      h: 0.28,
      fontFace: FONT_HEAD,
      fontSize: 14,
      bold: true,
      color: COLORS.text,
    });
    s.addText(d, {
      x: 0.95,
      y: ry + 0.3,
      w: 5.2,
      h: 0.52,
      fontFace: FONT_BODY,
      fontSize: 11.5,
      color: COLORS.muted,
    });
  });

  // Right: Future Roadmap
  addCard(s, 6.8, 1.85, 5.88, 3.65, { topStripe: COLORS.emerald });
  s.addText('PRACTICAL FUTURE ROADMAP', {
    x: 7.1,
    y: 2.12,
    w: 5.2,
    h: 0.3,
    fontFace: FONT_MONO,
    fontSize: 11.5,
    bold: true,
    color: COLORS.emerald,
  });
  const roadmap = [
    ['Live UPI / Razorpay Escrow', 'Connect real banking rails for instant earnest-money deposits and refunds.'],
    ['Aadhaar & GST e-KYC', 'Verify institutional buyers and bank liquidation sellers automatically.'],
    ['Smart Push Alerts', 'Send mobile alerts for final-minute countdowns and outbid warnings.'],
  ];
  roadmap.forEach(([h, d], i) => {
    const ry = 2.6 + i * 0.92;
    s.addText(h, {
      x: 7.1,
      y: ry,
      w: 5.2,
      h: 0.28,
      fontFace: FONT_HEAD,
      fontSize: 14,
      bold: true,
      color: COLORS.text,
    });
    s.addText(d, {
      x: 7.1,
      y: ry + 0.3,
      w: 5.2,
      h: 0.52,
      fontFace: FONT_BODY,
      fontSize: 11.5,
      color: COLORS.muted,
    });
  });

  // Bottom Thank You / Q&A Banner
  addCard(s, 0.65, 5.75, 12.03, 0.98, { fill: COLORS.indigoSoft, border: COLORS.indigo });
  s.addText('Thank You — Questions & Live Demo Ready!', {
    x: 0.95,
    y: 5.9,
    w: 11.4,
    h: 0.4,
    align: 'center',
    fontFace: FONT_HEAD,
    fontSize: 21,
    bold: true,
    color: COLORS.text,
  });
  s.addText('iPhone Pro Max  ·  Windows Laptop  ·  Ubuntu Server 24.04 + PostgreSQL 16  ·  3 Live SSH Monitors', {
    x: 0.95,
    y: 6.32,
    w: 11.4,
    h: 0.28,
    align: 'center',
    fontFace: FONT_MONO,
    fontSize: 10.5,
    color: COLORS.muted,
  });
}

async function buildDeck() {
  await pptx.writeFile({ fileName: OUTPUT_PATH });
  console.log(`Generated 11-slide PowerPoint presentation: ${OUTPUT_PATH}`);
}

buildDeck().catch((err) => {
  console.error('Failed to generate presentation:', err);
  process.exit(1);
});
