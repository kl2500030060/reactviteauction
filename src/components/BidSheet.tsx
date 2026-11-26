import React, { useMemo, useState } from 'react';
import { Bot, ShieldCheck, X, Zap } from 'lucide-react';
import type { AuctionLot } from '../types/auction';
import { useAuction } from '../context/AuctionContext';
import { getMinIncrement } from '../data/catalog';
import { formatINR, getCurrentPrice, getHighestBid } from '../utils/format';

interface BidSheetProps {
  lot: AuctionLot;
  onClose: () => void;
}

export const BidSheet: React.FC<BidSheetProps> = ({ lot, onClose }) => {
  const { currentUser, placeBid, setProxyBid } = useAuction();
  const [mode, setMode] = useState<'manual' | 'autopilot'>('manual');
  const [customAmount, setCustomAmount] = useState('');
  const [proxyLimit, setProxyLimit] = useState(
    lot.proxyBid && lot.proxyBid.bidderId === currentUser?.id
      ? String(lot.proxyBid.maxLimit)
      : ''
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentPrice = getCurrentPrice(lot);
  const topBid = getHighestBid(lot);
  const minInc = getMinIncrement(lot.reservePrice);
  const minNextBid = currentPrice + minInc;
  const jumpBid = Math.round(currentPrice * 1.1);
  const isAlreadyLeading = topBid?.bidderId === currentUser?.id;
  const hasMyProxy = lot.proxyBid?.bidderId === currentUser?.id;

  const buyingPower = useMemo(() => {
    if (!currentUser) return 0;
    return currentUser.availableBalance + (isAlreadyLeading && topBid ? topBid.amount : 0);
  }, [currentUser, isAlreadyLeading, topBid]);

  const handleQuickBid = async (amount: number) => {
    setError(null);
    setSubmitting(true);
    const res = await placeBid(lot.id, amount);
    setSubmitting(false);
    if (!res.ok) {
      setError(res.error || 'Could not place bid.');
      return;
    }
    onClose();
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numeric = Number(customAmount.replace(/[^0-9]/g, ''));
    if (!numeric || numeric < minNextBid) {
      setError(`Enter at least ${formatINR(minNextBid)}.`);
      return;
    }
    await handleQuickBid(numeric);
  };

  const handleProxySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const numeric = Number(proxyLimit.replace(/[^0-9]/g, ''));
    if (!numeric || numeric < minNextBid) {
      setError(`Maximum Auto-Pilot limit must be at least ${formatINR(minNextBid)}.`);
      return;
    }
    setSubmitting(true);
    const res = await setProxyBid(lot.id, numeric);
    setSubmitting(false);
    if (!res.ok) {
      setError(res.error || 'Failed to activate Auto-Pilot.');
      return;
    }
    onClose();
  };

  const handleDisableProxy = async () => {
    setSubmitting(true);
    const res = await setProxyBid(lot.id, null);
    setSubmitting(false);
    if (res.ok) onClose();
    else setError(res.error || 'Failed to disable Auto-Pilot.');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/65 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="animate-sheet-up w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] px-5 pt-3 pb-6 pb-safe shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag affordance for iPhone sheet */}
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-slate-300 dark:bg-slate-700 sm:hidden" />

        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-xs text-slate-500 dark:text-slate-400">{lot.id}</p>
            <h3 className="truncate text-base font-bold text-slate-900 dark:text-white">
              {lot.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close bid sheet"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Live Price & Buying Power Strip */}
        <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/70 p-3.5">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Current Highest</p>
            <p className="mt-0.5 font-mono text-base font-bold tabular-nums text-slate-900 dark:text-white">
              {formatINR(currentPrice)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500 dark:text-slate-400">Available Escrow Power</p>
            <p className="mt-0.5 font-mono text-base font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
              {formatINR(buyingPower)}
            </p>
          </div>
        </div>

        {/* Mode Switcher */}
        <div className="mt-4 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 dark:bg-slate-900 p-1">
          <button
            type="button"
            onClick={() => {
              setMode('manual');
              setError(null);
            }}
            className={`min-h-[40px] rounded-lg text-xs font-semibold transition ${
              mode === 'manual'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Direct Bid
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('autopilot');
              setError(null);
            }}
            className={`min-h-[40px] inline-flex items-center justify-center gap-1.5 rounded-lg text-xs font-semibold transition ${
              mode === 'autopilot'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Bot className="h-3.5 w-3.5" />
            <span>Auto-Pilot Proxy</span>
          </button>
        </div>

        {error && (
          <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-xs font-medium text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {mode === 'manual' ? (
          <div className="mt-4 space-y-3">
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                disabled={submitting}
                onClick={() => void handleQuickBid(minNextBid)}
                className="flex min-h-[56px] flex-col items-center justify-center rounded-xl bg-indigo-600 px-3 py-2 text-white transition hover:bg-indigo-500 active:scale-[0.98] disabled:opacity-50"
              >
                <span className="text-[11px] font-medium text-indigo-100">
                  Min Increment (+{formatINR(minInc)})
                </span>
                <span className="font-mono text-sm font-bold tabular-nums">
                  {formatINR(minNextBid)}
                </span>
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={() => void handleQuickBid(jumpBid)}
                className="flex min-h-[56px] flex-col items-center justify-center rounded-xl border border-indigo-500/40 bg-indigo-500/10 px-3 py-2 text-indigo-700 dark:text-indigo-300 transition hover:bg-indigo-500/15 active:scale-[0.98] disabled:opacity-50"
              >
                <span className="inline-flex items-center gap-1 text-[11px] font-medium">
                  <Zap className="h-3 w-3" /> Jump +10%
                </span>
                <span className="font-mono text-sm font-bold tabular-nums">
                  {formatINR(jumpBid)}
                </span>
              </button>
            </div>

            <form onSubmit={handleCustomSubmit} className="pt-1">
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                Or enter custom amount (INR)
              </label>
              <div className="mt-1.5 flex gap-2">
                <input
                  type="number"
                  inputMode="numeric"
                  min={minNextBid}
                  step={minInc}
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder={`Min ${minNextBid.toLocaleString('en-IN')}`}
                  className="min-h-[48px] flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 font-mono text-sm tabular-nums text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="min-h-[48px] rounded-xl bg-slate-900 dark:bg-white px-5 text-sm font-semibold text-white dark:text-slate-900 transition hover:opacity-90 active:scale-[0.98] disabled:opacity-50 whitespace-nowrap shrink-0"
                >
                  Place Bid
                </button>
              </div>
            </form>
          </div>
        ) : (
          <form onSubmit={handleProxySubmit} className="mt-4 space-y-3">
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Set a confidential ceiling. AutoAuction will automatically counter-bid in minimum increments ({formatINR(minInc)}) whenever someone outbids you.
            </p>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                Maximum Budget Limit (₹)
              </label>
              <input
                type="number"
                inputMode="numeric"
                min={minNextBid}
                value={proxyLimit}
                onChange={(e) => setProxyLimit(e.target.value)}
                placeholder={`e.g. ${(minNextBid + minInc * 4).toLocaleString('en-IN')}`}
                className="mt-1.5 min-h-[48px] w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 font-mono text-sm tabular-nums text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="min-h-[48px] flex-1 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white transition hover:bg-indigo-500 active:scale-[0.98] disabled:opacity-50"
              >
                {hasMyProxy ? 'Update Auto-Pilot' : 'Activate Auto-Pilot'}
              </button>
              {hasMyProxy && (
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => void handleDisableProxy()}
                  className="min-h-[48px] rounded-xl border border-slate-300 dark:border-slate-700 px-4 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Stop
                </button>
              )}
            </div>
          </form>
        )}

        <div className="mt-4 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
          <span>Escrow funds are released immediately if another bidder surpasses your bid.</span>
        </div>
      </div>
    </div>
  );
};
