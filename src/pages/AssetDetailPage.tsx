import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Bookmark,
  Bot,
  Clock,
  FileCheck2,
  Flame,
  MapPin,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { useAuction } from '../context/AuctionContext';
import { CATEGORY_LABELS, SUBTYPE_LABELS, getMinIncrement } from '../data/catalog';
import {
  formatINR,
  formatTimeLeft,
  getCurrentPrice,
  getHighestBid,
  getUserBidCount,
  isLotLive,
} from '../utils/format';
import { AssetIllustration } from '../components/AssetIllustration';
import { BidSheet } from '../components/BidSheet';
import { BidAnalyticsPanel } from '../components/BidAnalyticsPanel';
import { ContractNoteModal } from '../components/ContractNoteModal';

export const AssetDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    auctions,
    currentUser,
    watchlist,
    now,
    toggleWatchlist,
    triggerBiddingWar,
  } = useAuction();
  const [bidSheetOpen, setBidSheetOpen] = useState(false);
  const [contractNoteOpen, setContractNoteOpen] = useState(false);
  const [warBusy, setWarBusy] = useState(false);

  const lot = useMemo(() => auctions.find((a) => a.id === id) ?? null, [auctions, id]);

  if (!lot) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-[#111827]">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Auction lot not found</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          This lot may have been removed or has an invalid identifier.
        </p>
        <button
          type="button"
          onClick={() => navigate('/markets')}
          className="mt-4 min-h-[44px] rounded-xl bg-indigo-600 px-5 text-xs font-semibold text-white"
        >
          Back to Markets
        </button>
      </div>
    );
  }

  const live = isLotLive(lot, now);
  const currentPrice = getCurrentPrice(lot);
  const leader = getHighestBid(lot);
  const isLeading = leader?.bidderId === currentUser?.id;
  const minInc = getMinIncrement(lot.reservePrice);
  const saved = watchlist.includes(lot.id);
  const hasMyProxy = lot.proxyBid?.bidderId === currentUser?.id;
  const realBids = [...lot.bids].reverse();
  const bidCount = getUserBidCount(lot);

  const handleWar = async () => {
    if (warBusy) return;
    setWarBusy(true);
    await triggerBiddingWar(lot.id);
    window.setTimeout(() => setWarBusy(false), 1800);
  };

  return (
    <div className="space-y-5 pb-20 lg:pb-0">
      {/* Contextual Top Breadcrumb & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-xl px-2 text-sm font-semibold text-slate-700 hover:bg-slate-200/60 dark:text-slate-300 dark:hover:bg-slate-800/70"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-2">
          {currentUser?.role === 'admin' && live && (
            <button
              type="button"
              disabled={warBusy}
              onClick={() => void handleWar()}
              className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-500/20 disabled:opacity-50 dark:text-amber-300"
            >
              <Flame className="h-4 w-4" />
              <span>{warBusy ? 'War Active…' : 'Trigger Bid War'}</span>
            </button>
          )}

          {lot.status === 'sold' && (
            <button
              type="button"
              onClick={() => setContractNoteOpen(true)}
              className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 text-xs font-semibold text-white transition hover:bg-emerald-500"
            >
              <FileCheck2 className="h-4 w-4" />
              <span>Contract Note</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => toggleWatchlist(lot.id)}
            className={`inline-flex min-h-[42px] items-center gap-2 rounded-xl border px-3.5 text-xs font-semibold transition ${
              saved
                ? 'border-indigo-500/40 bg-indigo-600 text-white'
                : 'border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-[#111827] dark:text-slate-200'
            }`}
          >
            <Bookmark className="h-4 w-4" fill={saved ? 'currentColor' : 'none'} />
            <span>{saved ? 'Saved' : 'Watchlist'}</span>
          </button>
        </div>
      </div>

      {/* Main Two-Column Responsive Layout */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        {/* Left: Technical Visual + Specs + Interactive Live Charts & Depth */}
        <div className="space-y-5 lg:col-span-7">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-[#111827]">
            <AssetIllustration assetType={lot.assetType} size="lg" />

            <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                {lot.id}
              </span>
              <span aria-hidden="true">·</span>
              <span>{CATEGORY_LABELS[lot.category]}</span>
              <span aria-hidden="true">·</span>
              <span>{SUBTYPE_LABELS[lot.assetType]}</span>
              <span aria-hidden="true">·</span>
              <span>Model {lot.year}</span>
              <span aria-hidden="true">·</span>
              <span>Condition {lot.condition}</span>
            </div>

            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
              {lot.title}
            </h1>

            <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {lot.description}
            </p>

            {/* Key Specifications Grid */}
            <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-200/80 pt-5 text-xs dark:border-slate-800/80">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
                <span>{lot.location}, India</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <UserCheck className="h-4 w-4 shrink-0 text-slate-400" />
                <span className="truncate">{lot.sellerName}</span>
              </div>
              {lot.specs.map((spec) => (
                <div
                  key={spec}
                  className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-200"
                >
                  <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-indigo-500" />
                  <span>{spec}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Recharts Bid Trajectory + 5-Level Live Bid Depth Ladder */}
          <BidAnalyticsPanel lot={lot} currentUserId={currentUser?.id} />
        </div>

        {/* Right: Bidding Summary + Complete Live Bid Log */}
        <div className="space-y-5 lg:col-span-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#111827]">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span
                className={`font-semibold ${
                  lot.status === 'pending_approval'
                    ? 'text-amber-600 dark:text-amber-400'
                    : lot.status === 'rejected'
                      ? 'text-rose-600 dark:text-rose-400'
                      : live
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-slate-500'
                }`}
              >
                {lot.status === 'pending_approval'
                  ? 'Pending Admin Review'
                  : lot.status === 'rejected'
                    ? 'Rejected'
                    : live
                      ? 'Live Auction'
                      : lot.status === 'sold'
                        ? 'Sold & Settled'
                        : 'Auction Ended'}
              </span>
              <span className="inline-flex items-center gap-1.5 font-mono font-semibold tabular-nums text-amber-600 dark:text-amber-400">
                <Clock className="h-3.5 w-3.5" />
                <span>{live ? formatTimeLeft(lot.endTime, now) : 'Closed'}</span>
              </span>
            </div>

            <div className="mt-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {bidCount > 0 ? 'Current Highest Bid' : 'Reserve Opening Price'}
              </p>
              <p
                className={`mt-1 font-mono text-3xl font-extrabold tabular-nums ${
                  isLeading
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-900 dark:text-white'
                }`}
              >
                {formatINR(currentPrice)}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Reserve: <span className="font-mono tabular-nums">{formatINR(lot.reservePrice)}</span>{' '}
                · Step: <span className="font-mono tabular-nums">{formatINR(minInc)}</span> ·{' '}
                {bidCount} {bidCount === 1 ? 'bid' : 'bids'}
              </p>
            </div>

            {isLeading && live && (
              <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                You hold the highest bid on this lot.
              </div>
            )}

            {hasMyProxy && live && lot.proxyBid && (
              <div className="mt-3 flex items-center justify-between rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-3.5 py-2.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                <span className="inline-flex items-center gap-1.5">
                  <Bot className="h-4 w-4" />
                  Auto-Pilot armed up to
                </span>
                <span className="font-mono tabular-nums">{formatINR(lot.proxyBid.maxLimit)}</span>
              </div>
            )}

            <div className="mt-5 hidden lg:block">
              {lot.status === 'sold' ? (
                <button
                  type="button"
                  onClick={() => setContractNoteOpen(true)}
                  className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 text-sm font-semibold text-white transition hover:bg-emerald-500"
                >
                  <FileCheck2 className="h-4 w-4" />
                  View Settlement Contract Note
                </button>
              ) : (
                <button
                  type="button"
                  disabled={!live}
                  onClick={() => setBidSheetOpen(true)}
                  className="min-h-[48px] w-full rounded-xl bg-indigo-600 text-sm font-semibold text-white transition hover:bg-indigo-500 active:scale-[0.98] disabled:opacity-40"
                >
                  {live
                    ? `Place Bid (Min ${formatINR(currentPrice + minInc)})`
                    : 'Bidding Closed'}
                </button>
              )}
            </div>
          </div>

          {/* Complete Live Bid Log */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#111827]">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Complete Bid Audit Trail
              </h2>
              <span className="font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400">
                {bidCount} recorded
              </span>
            </div>

            <div className="mt-3 max-h-80 divide-y divide-slate-100 overflow-y-auto dark:divide-slate-800/80">
              {realBids.map((b, idx) => {
                const isMine = b.bidderId === currentUser?.id;
                const isSystem = b.bidderId === 'system';
                return (
                  <div key={b.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                        {isMine ? `${b.bidderName} (You)` : b.bidderName}
                        {idx === 0 && !isSystem && (
                          <span className="ml-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                            Leading
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {new Date(b.timestamp).toLocaleTimeString('en-IN')}
                        {b.isAutoPilot ? ' · Auto-Pilot' : ''}
                      </p>
                    </div>
                    <span className="shrink-0 font-mono text-sm font-bold tabular-nums text-slate-900 dark:text-white">
                      {formatINR(b.amount)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Thumb-Zone Bid CTA Bar */}
      <div className="pb-safe fixed right-0 bottom-16 left-0 z-30 border-t border-slate-200/80 bg-white/95 px-4 py-3 backdrop-blur-md lg:hidden dark:border-slate-800/90 dark:bg-[#0B1120]/95">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {lot.status === 'sold' ? 'Settled Price' : 'Next Minimum'}
            </p>
            <p className="font-mono text-sm font-bold tabular-nums text-slate-900 dark:text-white">
              {lot.status === 'sold' ? formatINR(currentPrice) : formatINR(currentPrice + minInc)}
            </p>
          </div>
          {lot.status === 'sold' ? (
            <button
              type="button"
              onClick={() => setContractNoteOpen(true)}
              className="min-h-[46px] max-w-[220px] flex-1 rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white"
            >
              Contract Note
            </button>
          ) : (
            <button
              type="button"
              disabled={!live}
              onClick={() => setBidSheetOpen(true)}
              className="min-h-[46px] max-w-[220px] flex-1 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white transition hover:bg-indigo-500 active:scale-[0.98] disabled:opacity-40"
            >
              {live ? 'Place Bid' : 'Closed'}
            </button>
          )}
        </div>
      </div>

      {bidSheetOpen && <BidSheet lot={lot} onClose={() => setBidSheetOpen(false)} />}
      {contractNoteOpen && (
        <ContractNoteModal lot={lot} onClose={() => setContractNoteOpen(false)} />
      )}
    </div>
  );
};
