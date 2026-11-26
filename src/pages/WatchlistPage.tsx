import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark } from 'lucide-react';
import { useAuction } from '../context/AuctionContext';
import { SUBTYPE_LABELS } from '../data/catalog';
import {
  formatINR,
  formatTimeLeft,
  getCurrentPrice,
  getHighestBid,
  isLotLive,
} from '../utils/format';
import { AssetIllustration } from '../components/AssetIllustration';
import { BidSheet } from '../components/BidSheet';

export const WatchlistPage: React.FC = () => {
  const { auctions, watchlist, currentUser, now, toggleWatchlist } = useAuction();
  const navigate = useNavigate();
  const [bidLotId, setBidLotId] = useState<string | null>(null);

  const savedLots = useMemo(
    () => auctions.filter((a) => watchlist.includes(a.id)),
    [auctions, watchlist]
  );

  const activeBidLot = useMemo(
    () => auctions.find((a) => a.id === bidLotId) ?? null,
    [auctions, bidLotId]
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Watchlist
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Saved lots persisted in Local Storage for fast counter-bidding
        </p>
      </div>

      {savedLots.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] px-6 py-12 text-center">
          <p className="text-base font-semibold text-slate-900 dark:text-white">
            Your watchlist is empty
          </p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Bookmark any auction lot in Markets to track live bids and countdowns here.
          </p>
          <button
            type="button"
            onClick={() => navigate('/markets')}
            className="mt-4 min-h-[44px] rounded-xl bg-indigo-600 px-5 text-xs font-semibold text-white transition hover:bg-indigo-500"
          >
            Browse Markets
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {savedLots.map((lot) => {
            const live = isLotLive(lot, now);
            const current = getCurrentPrice(lot);
            const leader = getHighestBid(lot);
            const isLeading = leader?.bidderId === currentUser?.id;

            return (
              <article
                key={lot.id}
                className="flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-4"
              >
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => navigate(`/asset/${lot.id}`)}
                    className="block w-full"
                  >
                    <AssetIllustration assetType={lot.assetType} size="md" />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleWatchlist(lot.id)}
                    aria-label="Remove from watchlist"
                    className="absolute top-2.5 right-2.5 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white"
                  >
                    <Bookmark className="h-4 w-4" fill="currentColor" />
                  </button>
                </div>

                <div className="mt-3 flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-mono truncate">
                    {lot.id} · {SUBTYPE_LABELS[lot.assetType]}
                  </span>
                  <span className="font-mono font-semibold tabular-nums text-amber-600 dark:text-amber-400 shrink-0">
                    {live ? formatTimeLeft(lot.endTime, now) : 'Ended'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => navigate(`/asset/${lot.id}`)}
                  className="mt-1 text-left text-base font-bold text-slate-900 dark:text-white line-clamp-2 hover:text-indigo-600 dark:hover:text-indigo-400"
                >
                  {lot.title}
                </button>

                <div className="mt-3 flex items-baseline justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {isLeading ? 'You lead' : 'Current'}
                  </span>
                  <span
                    className={`font-mono text-lg font-bold tabular-nums ${
                      isLeading
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-slate-900 dark:text-white'
                    }`}
                  >
                    {formatINR(current)}
                  </span>
                </div>

                <div className="mt-3.5 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => navigate(`/asset/${lot.id}`)}
                    className="min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200"
                  >
                    Inspect
                  </button>
                  <button
                    type="button"
                    disabled={!live}
                    onClick={() => setBidLotId(lot.id)}
                    className="min-h-[44px] rounded-xl bg-indigo-600 text-xs font-semibold text-white disabled:opacity-40"
                  >
                    {live ? 'Bid Now' : 'Closed'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {activeBidLot && <BidSheet lot={activeBidLot} onClose={() => setBidLotId(null)} />}
    </div>
  );
};
