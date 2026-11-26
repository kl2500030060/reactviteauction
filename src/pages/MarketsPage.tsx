import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowUpRight,
  Bookmark,
  Bot,
  Flame,
  Grid2x2,
  LayoutGrid,
  Monitor,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import { useAuction } from '../context/AuctionContext';
import {
  CATEGORIES,
  CATEGORY_LABELS,
  SUBTYPE_LABELS,
  getMinIncrement,
} from '../data/catalog';
import type { AuctionCategory, AuctionLot } from '../types/auction';
import {
  formatINR,
  formatINRCompact,
  formatTimeLeft,
  getCurrentPrice,
  getHighestBid,
  getUserBidCount,
  isLotLive,
} from '../utils/format';
import { AssetIllustration } from '../components/AssetIllustration';
import { BidSheet } from '../components/BidSheet';
import { BidAnalyticsPanel } from '../components/BidAnalyticsPanel';
import { DemoControlBar } from '../components/DemoControlBar';

type StatusFilter = 'all' | 'live' | 'ending' | 'mybids';
type WorkspaceMode = 'terminal' | 'cards' | 'heatmap';

const MiniTrendBars: React.FC<{ lot: AuctionLot; currentUserId?: string }> = ({
  lot,
  currentUserId,
}) => {
  const recent = lot.bids.slice(-7);
  if (recent.length < 2) return null;
  const min = recent[0].amount;
  const max = recent[recent.length - 1].amount;
  const span = Math.max(1, max - min);

  return (
    <div className="flex h-4 items-end gap-0.5" aria-hidden="true">
      {recent.map((b) => {
        const pct = Math.max(22, Math.round(((b.amount - min) / span) * 100));
        const color =
          b.bidderId === currentUserId
            ? 'bg-emerald-500'
            : b.bidderId === 'system'
              ? 'bg-slate-400 dark:bg-slate-600'
              : 'bg-indigo-500';
        return (
          <span
            key={b.id}
            style={{ height: `${pct}%` }}
            className={`w-1 rounded-t-sm ${color}`}
          />
        );
      })}
    </div>
  );
};

export const MarketsPage: React.FC = () => {
  const {
    auctions,
    currentUser,
    watchlist,
    now,
    flashedLots,
    toggleWatchlist,
    placeBid,
  } = useAuction();
  const navigate = useNavigate();

  const [category, setCategory] = useState<AuctionCategory | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('live');
  const [search, setSearch] = useState('');
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>('terminal');
  const [mobileHeatmap, setMobileHeatmap] = useState(false);
  const [selectedLotId, setSelectedLotId] = useState<string | null>(null);
  const [activeBidLotId, setActiveBidLotId] = useState<string | null>(null);
  const [quickBidBusy, setQuickBidBusy] = useState(false);

  const visibleLots = useMemo(() => {
    const q = search.trim().toLowerCase();
    return auctions
      .filter((lot) => lot.status !== 'pending_approval' && lot.status !== 'rejected')
      .filter((lot) => {
        if (category !== 'all' && lot.category !== category) return false;
        const live = isLotLive(lot, now);
        const diff = lot.endTime - now;
        const myBid = lot.bids.some((b) => b.bidderId === currentUser?.id);

        if (statusFilter === 'live' && !live) return false;
        if (statusFilter === 'ending' && (!live || diff > 15 * 60 * 1000)) return false;
        if (statusFilter === 'mybids' && !myBid) return false;

        if (q) {
          const hay = `${lot.id} ${lot.title} ${lot.location} ${lot.sellerName} ${SUBTYPE_LABELS[lot.assetType]} ${CATEGORY_LABELS[lot.category]}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const aLive = isLotLive(a, now) ? 0 : 1;
        const bLive = isLotLive(b, now) ? 0 : 1;
        if (aLive !== bLive) return aLive - bLive;
        return a.endTime - b.endTime;
      });
  }, [auctions, category, statusFilter, search, now, currentUser?.id]);

  // Active lot selected in Kite-Web split-screen Terminal workbench
  const selectedLot = useMemo(() => {
    if (visibleLots.length === 0) return null;
    const match = visibleLots.find((l) => l.id === selectedLotId);
    return match ?? visibleLots[0];
  }, [visibleLots, selectedLotId]);

  const activeBidLot = useMemo(
    () => auctions.find((a) => a.id === activeBidLotId) ?? null,
    [auctions, activeBidLotId]
  );

  // Market breadth & 9-sector heatmap metrics
  const marketOverview = useMemo(() => {
    const liveLots = auctions.filter((a) => isLotLive(a, now));
    const totalVolume = liveLots.reduce((acc, a) => acc + getCurrentPrice(a), 0);
    const totalOffers = liveLots.reduce((acc, a) => acc + getUserBidCount(a), 0);
    const activeBidLots = liveLots.filter((a) => getUserBidCount(a) > 0).length;
    const avgPremium =
      liveLots.length > 0
        ? liveLots.reduce((acc, a) => {
            const p = ((getCurrentPrice(a) - a.reservePrice) / Math.max(1, a.reservePrice)) * 100;
            return acc + p;
          }, 0) / liveLots.length
        : 0;

    const sectors = CATEGORIES.filter((c) => c.id !== 'all').map((cat) => {
      const catId = cat.id as AuctionCategory;
      const lots = liveLots.filter((a) => a.category === catId);
      const volume = lots.reduce((s, a) => s + getCurrentPrice(a), 0);
      const bids = lots.reduce((s, a) => s + getUserBidCount(a), 0);
      const premium =
        lots.length > 0
          ? lots.reduce((s, a) => {
              return s + ((getCurrentPrice(a) - a.reservePrice) / Math.max(1, a.reservePrice)) * 100;
            }, 0) / lots.length
          : 0;
      const topLot = [...lots].sort((a, b) => getUserBidCount(b) - getUserBidCount(a))[0];
      return {
        id: catId,
        label: cat.label,
        shortLabel: cat.shortLabel,
        description: cat.description,
        lotCount: lots.length,
        volume,
        bids,
        premium,
        topLot,
      };
    });

    return {
      liveCount: liveLots.length,
      totalVolume,
      totalOffers,
      activeBidLots,
      avgPremium,
      sectors,
    };
  }, [auctions, now]);

  const handleQuickStepBid = async (lot: AuctionLot, steps: number) => {
    if (quickBidBusy) return;
    const target = getCurrentPrice(lot) + getMinIncrement(lot.reservePrice) * steps;
    setQuickBidBusy(true);
    await placeBid(lot.id, target);
    setQuickBidBusy(false);
  };

  const renderSectorHeatmap = () => (
    <div className="space-y-4">
      {/* SBI Securities-Style Market Breadth Bar */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-[#111827]">
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            Active Book Value
          </p>
          <p className="mt-1 font-mono text-xl font-extrabold tabular-nums text-slate-900 dark:text-white">
            {formatINRCompact(marketOverview.totalVolume)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-[#111827]">
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            Market Breadth (With Bids)
          </p>
          <p className="mt-1 font-mono text-xl font-extrabold tabular-nums text-emerald-600 dark:text-emerald-400">
            {marketOverview.activeBidLots} / {marketOverview.liveCount}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-[#111827]">
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            Avg Reserve Premium
          </p>
          <p className="mt-1 font-mono text-xl font-extrabold tabular-nums text-indigo-600 dark:text-indigo-400">
            +{marketOverview.avgPremium.toFixed(1)}%
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-[#111827]">
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            Live Order Flow
          </p>
          <p className="mt-1 font-mono text-xl font-extrabold tabular-nums text-slate-900 dark:text-white">
            {marketOverview.totalOffers} bids
          </p>
        </div>
      </div>

      {/* 9 Interactive Sector Heatmap Tiles */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {marketOverview.sectors.map((sec) => {
          const heatClass =
            sec.premium >= 6
              ? 'border-emerald-500/35 bg-emerald-500/[0.06] dark:bg-emerald-500/[0.09]'
              : sec.premium >= 2.5
                ? 'border-indigo-500/30 bg-indigo-500/[0.05] dark:bg-indigo-500/[0.08]'
                : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-[#111827]';

          return (
            <button
              key={sec.id}
              type="button"
              onClick={() => {
                setCategory(sec.id);
                setWorkspaceMode('terminal');
                setMobileHeatmap(false);
              }}
              className={`group flex flex-col justify-between rounded-2xl border p-4 text-left transition hover:border-indigo-500 ${heatClass}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400">
                    {sec.label}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    {sec.lotCount} live {sec.lotCount === 1 ? 'lot' : 'lots'} · {sec.bids} bids
                  </p>
                </div>
                <span
                  className={`font-mono text-xs font-bold tabular-nums ${
                    sec.premium >= 5
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : sec.premium > 0
                        ? 'text-indigo-600 dark:text-indigo-400'
                        : 'text-slate-500'
                  }`}
                >
                  +{sec.premium.toFixed(1)}%
                </span>
              </div>

              <div className="mt-4 flex items-end justify-between border-t border-slate-200/70 pt-3 dark:border-slate-800/80">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-400">
                    Sector Book
                  </p>
                  <p className="font-mono text-base font-extrabold tabular-nums text-slate-900 dark:text-white">
                    {formatINRCompact(sec.volume)}
                  </p>
                </div>
                {sec.topLot && (
                  <div className="flex items-center gap-2">
                    <AssetIllustration assetType={sec.topLot.assetType} size="xs" />
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Page Title & Workspace View Switcher */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
            Market Terminal
          </h1>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm dark:text-slate-400">
            <span className="font-mono font-semibold tabular-nums text-slate-800 dark:text-slate-200">
              {marketOverview.liveCount}
            </span>{' '}
            live lots across 9 sectors · Book{' '}
            <span className="font-mono font-semibold tabular-nums text-slate-800 dark:text-slate-200">
              {formatINRCompact(marketOverview.totalVolume)}
            </span>
          </p>
        </div>

        {/* Desktop Kite/SBI Workspace Mode Switcher */}
        <div className="hidden items-center gap-1 rounded-xl bg-slate-100 p-1 lg:inline-flex dark:bg-slate-900">
          {(
            [
              ['terminal', 'Terminal', Monitor],
              ['heatmap', 'Sector Heatmap', Grid2x2],
              ['cards', 'Cards', LayoutGrid],
            ] as const
          ).map(([mode, label, Icon]) => (
            <button
              key={mode}
              type="button"
              onClick={() => setWorkspaceMode(mode)}
              className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition ${
                workspaceMode === mode
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-white'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Mobile Heatmap Quick Toggle */}
        <div className="flex items-center gap-2 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileHeatmap((prev) => !prev)}
            className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border px-3.5 text-xs font-semibold transition ${
              mobileHeatmap
                ? 'border-indigo-500 bg-indigo-600 text-white'
                : 'border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-[#111827] dark:text-slate-200'
            }`}
          >
            <Grid2x2 className="h-3.5 w-3.5" />
            <span>{mobileHeatmap ? 'Back to Feed' : '9-Sector Heatmap'}</span>
          </button>
        </div>
      </div>

      {/* Admin Live Demo Lab Bar (compact, appears only for Admin role) */}
      {currentUser?.role === 'admin' && (
        <DemoControlBar targetLotId={selectedLot?.id} compact />
      )}

      {/* 9-Market Category Filter Strip */}
      <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-0.5">
        {CATEGORIES.map((cat) => {
          const active = category === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setCategory(cat.id);
                setMobileHeatmap(false);
              }}
              className={`min-h-[38px] shrink-0 whitespace-nowrap rounded-xl px-3.5 text-xs font-semibold transition ${
                active
                  ? 'bg-indigo-600 text-white'
                  : 'border border-slate-200 bg-white text-slate-700 hover:border-indigo-500/50 dark:border-slate-800 dark:bg-[#111827] dark:text-slate-300'
              }`}
            >
              {cat.shortLabel}
            </button>
          );
        })}
      </div>

      {/* Search + Status Segmented Filter */}
      {!(workspaceMode === 'heatmap' && !mobileHeatmap) && (
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search symbol (BUL-7710), sector, CNC, gold, city, or seller..."
              className="min-h-[44px] w-full rounded-xl border border-slate-200 bg-white pr-4 pl-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-[#111827] dark:text-white"
            />
          </div>

          <div className="grid shrink-0 grid-cols-4 items-center gap-1 rounded-xl bg-slate-100 p-1 sm:inline-flex dark:bg-slate-900">
            {(
              [
                ['live', 'Live'],
                ['ending', 'Ending'],
                ['mybids', 'My Bids'],
                ['all', 'All'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setStatusFilter(key)}
                className={`min-h-[36px] whitespace-nowrap rounded-lg px-3 text-xs font-semibold transition ${
                  statusFilter === key
                    ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-white'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* DESKTOP SECTOR HEATMAP VIEW */}
      {workspaceMode === 'heatmap' && (
        <div className="hidden lg:block">{renderSectorHeatmap()}</div>
      )}

      {/* MOBILE SECTOR HEATMAP VIEW */}
      {mobileHeatmap && <div className="lg:hidden">{renderSectorHeatmap()}</div>}

      {/* EMPTY STATE */}
      {!mobileHeatmap && workspaceMode !== 'heatmap' && visibleLots.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center dark:border-slate-800 dark:bg-[#111827]">
          <p className="text-base font-semibold text-slate-900 dark:text-white">
            No matching auction lots
          </p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Try clearing your search query or switching back to All Markets.
          </p>
          <button
            type="button"
            onClick={() => {
              setCategory('all');
              setStatusFilter('all');
              setSearch('');
            }}
            className="mt-4 min-h-[44px] rounded-xl bg-indigo-600 px-5 text-xs font-semibold text-white transition hover:bg-indigo-500"
          >
            Reset Filters
          </button>
        </div>
      ) : null}

      {/* DESKTOP KITE-WEB SPLIT-SCREEN TERMINAL WORKSPACE */}
      {workspaceMode === 'terminal' && selectedLot && (
        <div className="hidden gap-4 lg:grid lg:grid-cols-12 lg:items-start">
          {/* Left Pinned MarketWatch Rail (340px / 4 cols) */}
          <aside className="lg:col-span-4 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-[#111827]">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-[11px] font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-400">
              <span>MARKETWATCH ({visibleLots.length})</span>
              <span>LTP / PREMIUM</span>
            </div>

            <div className="max-h-[700px] divide-y divide-slate-100 overflow-y-auto dark:divide-slate-800/80">
              {visibleLots.map((lot) => {
                const live = isLotLive(lot, now);
                const price = getCurrentPrice(lot);
                const prem =
                  lot.reservePrice > 0
                    ? ((price - lot.reservePrice) / lot.reservePrice) * 100
                    : 0;
                const active = selectedLot.id === lot.id;
                const leader = getHighestBid(lot);
                const isLeading = leader?.bidderId === currentUser?.id;
                const flashed = Boolean(flashedLots[lot.id] && now - flashedLots[lot.id] < 1200);
                const urgent = live && lot.endTime - now < 120000;

                return (
                  <button
                    key={lot.id}
                    type="button"
                    onClick={() => setSelectedLotId(lot.id)}
                    className={`flex w-full items-center justify-between gap-2.5 px-3.5 py-3 text-left transition ${
                      active
                        ? 'bg-indigo-50/90 dark:bg-indigo-500/12'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    } ${flashed ? 'animate-bid-flash' : ''}`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`font-mono text-xs font-bold ${
                            active
                              ? 'text-indigo-600 dark:text-indigo-400'
                              : 'text-slate-900 dark:text-white'
                          }`}
                        >
                          {lot.id}
                        </span>
                        <span className="text-[10px] text-slate-400">·</span>
                        <span className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                          {CATEGORY_LABELS[lot.category]}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {lot.title}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-400">
                        <span
                          className={`font-mono tabular-nums ${
                            urgent
                              ? 'font-semibold text-rose-500'
                              : live
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-slate-400'
                          }`}
                        >
                          {live ? formatTimeLeft(lot.endTime, now) : lot.status.toUpperCase()}
                        </span>
                        <span>·</span>
                        <span>{lot.location}</span>
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <p
                        className={`font-mono text-xs font-bold tabular-nums ${
                          isLeading
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {formatINRCompact(price)}
                      </p>
                      <p className="mt-0.5 font-mono text-[11px] tabular-nums text-emerald-600 dark:text-emerald-400">
                        +{prem.toFixed(1)}%
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Right Live Chart, Bid Depth & Order Pad Workbench (8 cols) */}
          <section className="lg:col-span-8 space-y-4">
            {(() => {
              const live = isLotLive(selectedLot, now);
              const price = getCurrentPrice(selectedLot);
              const minInc = getMinIncrement(selectedLot.reservePrice);
              const leader = getHighestBid(selectedLot);
              const isLeading = leader?.bidderId === currentUser?.id;
              const saved = watchlist.includes(selectedLot.id);
              const hasProxy = selectedLot.proxyBid?.bidderId === currentUser?.id;

              return (
                <>
                  {/* Active Instrument Header + Quick Order Strip */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#111827]">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex items-start gap-4 min-w-0 flex-1">
                        <AssetIllustration
                          assetType={selectedLot.assetType}
                          size="sm"
                          className="shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                            <span className="font-mono font-bold text-slate-900 dark:text-white">
                              {selectedLot.id}
                            </span>
                            <span>·</span>
                            <span>{CATEGORY_LABELS[selectedLot.category]}</span>
                            <span>·</span>
                            <span>{SUBTYPE_LABELS[selectedLot.assetType]}</span>
                            <span>·</span>
                            <span>{selectedLot.location}</span>
                          </div>
                          <h2 className="mt-1 text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
                            {selectedLot.title}
                          </h2>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {selectedLot.specs.join(' · ')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => toggleWatchlist(selectedLot.id)}
                          aria-label="Toggle watchlist"
                          className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border transition ${
                            saved
                              ? 'border-indigo-500/40 bg-indigo-600 text-white'
                              : 'border-slate-200 text-slate-500 hover:border-indigo-500 dark:border-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <Bookmark className="h-4 w-4" fill={saved ? 'currentColor' : 'none'} />
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate(`/asset/${selectedLot.id}`)}
                          className="inline-flex min-h-[36px] items-center gap-1 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-700 hover:border-indigo-500 dark:border-slate-700 dark:text-slate-200"
                        >
                          <span>Full Dossier</span>
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Ticker Metrics + 1-Click Bid Execution Row */}
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-4 dark:border-slate-800">
                      <div className="flex flex-wrap items-baseline gap-5">
                        <div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {isLeading
                              ? 'You are leading'
                              : leader && leader.bidderId !== 'system'
                                ? `Leader: ${leader.bidderName}`
                                : 'Reserve Opening'}
                          </p>
                          <p
                            className={`font-mono text-2xl font-extrabold tabular-nums ${
                              isLeading
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-slate-900 dark:text-white'
                            }`}
                          >
                            {formatINR(price)}
                          </p>
                        </div>

                        <div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">Timer</p>
                          <p className="font-mono text-base font-bold tabular-nums text-amber-600 dark:text-amber-400">
                            {live ? formatTimeLeft(selectedLot.endTime, now) : 'Closed'}
                          </p>
                        </div>

                        {hasProxy && selectedLot.proxyBid && (
                          <div>
                            <p className="text-[11px] text-indigo-500">Auto-Pilot Cap</p>
                            <p className="inline-flex items-center gap-1 font-mono text-sm font-bold text-indigo-600 dark:text-indigo-400">
                              <Bot className="h-3.5 w-3.5" />
                              {formatINRCompact(selectedLot.proxyBid.maxLimit)}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          disabled={!live || quickBidBusy}
                          onClick={() => void handleQuickStepBid(selectedLot, 1)}
                          className="min-h-[40px] rounded-xl bg-indigo-600 px-4 font-mono text-xs font-bold text-white transition hover:bg-indigo-500 active:scale-[0.98] disabled:opacity-40"
                        >
                          +{formatINRCompact(minInc)} Bid
                        </button>
                        <button
                          type="button"
                          disabled={!live || quickBidBusy}
                          onClick={() => void handleQuickStepBid(selectedLot, 2)}
                          className="min-h-[40px] rounded-xl border border-indigo-500/35 bg-indigo-500/10 px-3.5 font-mono text-xs font-bold text-indigo-700 transition hover:bg-indigo-500/20 disabled:opacity-40 dark:text-indigo-300"
                        >
                          +{formatINRCompact(minInc * 2)}
                        </button>
                        <button
                          type="button"
                          disabled={!live}
                          onClick={() => setActiveBidLotId(selectedLot.id)}
                          className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 text-xs font-semibold text-slate-800 hover:border-indigo-500 disabled:opacity-40 dark:border-slate-700 dark:text-slate-200"
                        >
                          <SlidersHorizontal className="h-3.5 w-3.5" />
                          <span>Custom / Auto-Pilot</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Interactive Recharts Price Curve + 5-Level Live Bid Depth Ladder */}
                  <BidAnalyticsPanel lot={selectedLot} currentUserId={currentUser?.id} />
                </>
              );
            })()}
          </section>
        </div>
      )}

      {/* MOBILE-FIRST CARD GRID (Always shown on iPhone/Tablet when not in Heatmap, and on Desktop when 'Cards' selected) */}
      {!mobileHeatmap && visibleLots.length > 0 && (
        <div
          className={`grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 ${
            workspaceMode !== 'cards' ? 'lg:hidden' : ''
          }`}
        >
          {visibleLots.map((lot) => {
            const live = isLotLive(lot, now);
            const currentPrice = getCurrentPrice(lot);
            const leader = getHighestBid(lot);
            const isLeading = leader?.bidderId === currentUser?.id;
            const bidCount = getUserBidCount(lot);
            const saved = watchlist.includes(lot.id);
            const diff = lot.endTime - now;
            const urgent = live && diff < 120000;
            const hasProxy = lot.proxyBid?.bidderId === currentUser?.id;
            const flashed = Boolean(flashedLots[lot.id] && now - flashedLots[lot.id] < 1200);
            const prem =
              lot.reservePrice > 0
                ? ((currentPrice - lot.reservePrice) / lot.reservePrice) * 100
                : 0;

            return (
              <article
                key={lot.id}
                className={`flex flex-col rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 dark:border-slate-800 dark:bg-[#111827] dark:hover:border-slate-700 ${
                  flashed ? 'animate-bid-flash' : ''
                }`}
              >
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => navigate(`/asset/${lot.id}`)}
                    className="block w-full text-left focus:outline-none"
                  >
                    <AssetIllustration assetType={lot.assetType} size="md" />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleWatchlist(lot.id)}
                    aria-label={saved ? 'Remove from watchlist' : 'Save to watchlist'}
                    className={`absolute top-2.5 right-2.5 flex h-10 w-10 items-center justify-center rounded-xl border backdrop-blur-md transition ${
                      saved
                        ? 'border-indigo-500/40 bg-indigo-600 text-white'
                        : 'border-slate-200/80 bg-white/85 text-slate-600 dark:border-slate-700/80 dark:bg-slate-900/85 dark:text-slate-300'
                    }`}
                  >
                    <Bookmark className="h-4 w-4" fill={saved ? 'currentColor' : 'none'} />
                  </button>
                </div>

                <div className="mt-3.5 flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="truncate font-mono">
                    {lot.id} · {SUBTYPE_LABELS[lot.assetType]} · {lot.location}
                  </span>
                  <span
                    className={`shrink-0 font-mono font-semibold tabular-nums ${
                      !live
                        ? 'text-slate-400'
                        : urgent
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {live ? formatTimeLeft(lot.endTime, now) : lot.status === 'sold' ? 'Sold' : 'Ended'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => navigate(`/asset/${lot.id}`)}
                  className="mt-1 line-clamp-2 text-left text-base font-bold leading-snug text-slate-900 transition hover:text-indigo-600 dark:text-white dark:hover:text-indigo-400"
                >
                  {lot.title}
                </button>

                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {CATEGORY_LABELS[lot.category]} · {lot.year} · Cond {lot.condition} ·{' '}
                  {bidCount} {bidCount === 1 ? 'bid' : 'bids'}
                </p>

                <div className="mt-4 flex items-end justify-between gap-3 border-t border-slate-100 pt-3 dark:border-slate-800/90">
                  <div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {isLeading
                        ? 'You are leading'
                        : hasProxy
                          ? 'Auto-Pilot armed'
                          : leader && leader.bidderId !== 'system'
                            ? `High: ${leader.bidderName}`
                            : 'Opening Reserve'}
                    </p>
                    <div className="mt-0.5 flex items-baseline gap-2">
                      <p
                        className={`font-mono text-lg font-bold tabular-nums ${
                          isLeading
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {formatINR(currentPrice)}
                      </p>
                      {prem > 0 && (
                        <span className="font-mono text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                          +{prem.toFixed(1)}%
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5">
                    <MiniTrendBars lot={lot} currentUserId={currentUser?.id} />
                    {hasProxy && live && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                        <Bot className="h-3 w-3" /> Auto
                      </span>
                    )}
                    {prem >= 10 && live && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                        <Flame className="h-3 w-3" /> Active
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-3.5 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => navigate(`/asset/${lot.id}`)}
                    className="min-h-[44px] rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 transition hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600"
                  >
                    Chart & Depth
                  </button>
                  <button
                    type="button"
                    disabled={!live}
                    onClick={() => setActiveBidLotId(lot.id)}
                    className="min-h-[44px] rounded-xl bg-indigo-600 text-xs font-semibold text-white transition hover:bg-indigo-500 active:scale-[0.98] disabled:opacity-40"
                  >
                    {live ? 'Place Bid' : 'Auction Closed'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {activeBidLot && <BidSheet lot={activeBidLot} onClose={() => setActiveBidLotId(null)} />}
    </div>
  );
};
