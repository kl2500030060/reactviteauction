import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { FileCheck2, PieChart } from 'lucide-react';
import { useAuction } from '../context/AuctionContext';
import { CATEGORY_LABELS } from '../data/catalog';
import type { AuctionLot } from '../types/auction';
import {
  formatINR,
  formatINRCompact,
  getCurrentPrice,
  getHighestBid,
  isLotLive,
} from '../utils/format';
import { AssetIllustration } from '../components/AssetIllustration';
import { ContractNoteModal } from '../components/ContractNoteModal';

export const VaultPage: React.FC = () => {
  const { auctions, currentUser, now } = useAuction();
  const navigate = useNavigate();
  const [contractLot, setContractLot] = useState<AuctionLot | null>(null);

  const buyerStats = useMemo(() => {
    if (!currentUser) return { won: [], leading: [], totalSpent: 0 };
    const won = auctions.filter((a) => {
      const top = getHighestBid(a);
      return a.status === 'sold' && top?.bidderId === currentUser.id;
    });
    const leading = auctions.filter((a) => {
      const top = getHighestBid(a);
      return isLotLive(a, now) && top?.bidderId === currentUser.id;
    });
    const totalSpent = won.reduce((acc, a) => acc + getCurrentPrice(a), 0);
    return { won, leading, totalSpent };
  }, [auctions, currentUser, now]);

  const sellerStats = useMemo(() => {
    if (!currentUser) return { mine: [], sold: [], revenue: 0 };
    const mine = auctions.filter((a) => a.sellerId === currentUser.id);
    const sold = mine.filter((a) => a.status === 'sold');
    const revenue = sold.reduce((acc, a) => acc + Math.round(getCurrentPrice(a) * 0.98), 0);
    return { mine, sold, revenue };
  }, [auctions, currentUser]);

  const adminStats = useMemo(() => {
    const allSold = auctions.filter((a) => a.status === 'sold');
    const volume = allSold.reduce((acc, a) => acc + getCurrentPrice(a), 0);
    const commission = Math.round(volume * 0.02);
    return { allSold, volume, commission };
  }, [auctions]);

  // Kite-Style Sector Exposure Chart Data (adapts per role)
  const sectorAllocationData = useMemo(() => {
    if (!currentUser) return [];
    const sourceLots =
      currentUser.role === 'admin'
        ? auctions.filter((a) => a.status === 'live' || a.status === 'sold')
        : currentUser.role === 'seller'
          ? sellerStats.mine
          : [...buyerStats.won, ...buyerStats.leading];

    const grouped = new Map<string, number>();
    for (const lot of sourceLots) {
      const label = CATEGORY_LABELS[lot.category];
      grouped.set(label, (grouped.get(label) ?? 0) + getCurrentPrice(lot));
    }

    return Array.from(grouped.entries())
      .map(([sector, value]) => ({ sector, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [auctions, buyerStats.leading, buyerStats.won, currentUser, sellerStats.mine]);

  if (!currentUser) return null;

  const totalBuyingPower = currentUser.availableBalance + currentUser.escrowBalance;
  const marginPct =
    totalBuyingPower > 0
      ? Math.min(100, Math.round((currentUser.escrowBalance / totalBuyingPower) * 100))
      : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
            Portfolio & Vault
          </h1>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm dark:text-slate-400">
            Margin utilization, sector exposure, and GST contract notes for {currentUser.name}
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/history')}
          className="min-h-[42px] self-start rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-800 hover:border-indigo-500 sm:self-auto dark:border-slate-800 dark:bg-[#111827] dark:text-slate-200"
        >
          Open Audit Ledger
        </button>
      </div>

      {/* Kite-Style Margin Utilization & Sector Exposure Row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Margin Utilization Meter */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 lg:col-span-5 dark:border-slate-800 dark:bg-[#111827]">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Margin Utilization Meter
            </h2>
            <span className="font-mono text-xs font-bold tabular-nums text-indigo-600 dark:text-indigo-400">
              {marginPct}% Used
            </span>
          </div>

          <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                marginPct > 80
                  ? 'bg-rose-500'
                  : marginPct > 50
                    ? 'bg-amber-500'
                    : 'bg-indigo-600'
              }`}
              style={{ width: `${Math.max(marginPct, currentUser.escrowBalance > 0 ? 4 : 0)}%` }}
            />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-slate-500 dark:text-slate-400">Available Margin</p>
              <p className="mt-0.5 font-mono text-sm font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                {formatINRCompact(currentUser.availableBalance)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-slate-500 dark:text-slate-400">Escrow Blocked</p>
              <p className="mt-0.5 font-mono text-sm font-bold tabular-nums text-amber-600 dark:text-amber-400">
                {formatINRCompact(currentUser.escrowBalance)}
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400">Total Buying Power</span>
            <span className="font-mono font-bold tabular-nums text-slate-900 dark:text-white">
              {formatINR(totalBuyingPower)}
            </span>
          </div>
        </section>

        {/* Sector Exposure Chart */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 lg:col-span-7 dark:border-slate-800 dark:bg-[#111827]">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
              <PieChart className="h-4 w-4 text-indigo-500" />
              <span>
                {currentUser.role === 'admin'
                  ? 'Platform Book Value by Sector'
                  : currentUser.role === 'seller'
                    ? 'Seller Inventory by Sector'
                    : 'Holdings & Active Bid Exposure'}
              </span>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">INR</span>
          </div>

          {sectorAllocationData.length === 0 ? (
            <p className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
              Place bids or acquire lots to see your sector allocation chart here.
            </p>
          ) : (
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={sectorAllocationData}
                  layout="vertical"
                  margin={{ top: 2, right: 16, left: 4, bottom: 2 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                    stroke="currentColor"
                    className="text-slate-200 dark:text-slate-800"
                  />
                  <XAxis
                    type="number"
                    tickFormatter={(v: number) => formatINRCompact(v)}
                    tick={{ fontSize: 10, fill: '#94A3B8', fontFamily: 'JetBrains Mono, monospace' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="sector"
                    width={112}
                    tick={{ fontSize: 11, fill: '#94A3B8' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const row = payload[0].payload as { sector: string; value: number };
                      return (
                        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg dark:border-slate-700 dark:bg-slate-900">
                          <p className="font-semibold text-slate-900 dark:text-white">
                            {row.sector}
                          </p>
                          <p className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                            {formatINR(row.value)}
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Bar
                    dataKey="value"
                    fill="#6366F1"
                    radius={[0, 6, 6, 0]}
                    barSize={18}
                    isAnimationActive={false}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>
      </div>

      {/* Role-Specific Vault Holdings & Contract Notes */}
      {currentUser.role === 'admin' ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#111827]">
              <p className="text-xs text-slate-500 dark:text-slate-400">Settled Auctions</p>
              <p className="mt-2 font-mono text-2xl font-extrabold tabular-nums text-slate-900 dark:text-white">
                {adminStats.allSold.length}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#111827]">
              <p className="text-xs text-slate-500 dark:text-slate-400">Gross Market Volume</p>
              <p className="mt-2 font-mono text-2xl font-extrabold tabular-nums text-indigo-600 dark:text-indigo-400">
                {formatINR(adminStats.volume)}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#111827]">
              <p className="text-xs text-slate-500 dark:text-slate-400">Platform Commission (2%)</p>
              <p className="mt-2 font-mono text-2xl font-extrabold tabular-nums text-emerald-600 dark:text-emerald-400">
                +{formatINR(adminStats.commission)}
              </p>
            </div>
          </div>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#111827]">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Settled Platform Contract Notes
            </h2>
            {adminStats.allSold.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                Settled auctions will appear here once live timers complete.
              </p>
            ) : (
              <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
                {adminStats.allSold.map((lot) => {
                  const finalPrice = getCurrentPrice(lot);
                  const winner = getHighestBid(lot)?.bidderName ?? '—';
                  return (
                    <div
                      key={lot.id}
                      className="flex flex-wrap items-center justify-between gap-3 py-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                          {lot.title}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {lot.id} · Winner: {winner} · Fee +{formatINR(Math.round(finalPrice * 0.02))}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <p className="font-mono text-sm font-bold tabular-nums text-slate-900 dark:text-white">
                          {formatINR(finalPrice)}
                        </p>
                        <button
                          type="button"
                          onClick={() => setContractLot(lot)}
                          className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-indigo-500/35 bg-indigo-500/10 px-3 text-xs font-semibold text-indigo-700 hover:bg-indigo-500/20 dark:text-indigo-300"
                        >
                          <FileCheck2 className="h-3.5 w-3.5" />
                          <span>Contract Note</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </>
      ) : currentUser.role === 'seller' ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#111827]">
              <p className="text-xs text-slate-500 dark:text-slate-400">Total Listings</p>
              <p className="mt-2 font-mono text-2xl font-extrabold tabular-nums text-slate-900 dark:text-white">
                {sellerStats.mine.length}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#111827]">
              <p className="text-xs text-slate-500 dark:text-slate-400">Lots Sold</p>
              <p className="mt-2 font-mono text-2xl font-extrabold tabular-nums text-indigo-600 dark:text-indigo-400">
                {sellerStats.sold.length}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#111827]">
              <p className="text-xs text-slate-500 dark:text-slate-400">Net Seller Revenue (98%)</p>
              <p className="mt-2 font-mono text-2xl font-extrabold tabular-nums text-emerald-600 dark:text-emerald-400">
                +{formatINR(sellerStats.revenue)}
              </p>
            </div>
          </div>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#111827]">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Your Inventory & Settlement Notes
              </h2>
              <button
                type="button"
                onClick={() => navigate('/seller')}
                className="text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
              >
                Manage Listings
              </button>
            </div>
            <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
              {sellerStats.mine.map((lot) => (
                <div
                  key={lot.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3"
                >
                  <button
                    type="button"
                    onClick={() => navigate(`/asset/${lot.id}`)}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  >
                    <AssetIllustration assetType={lot.assetType} size="sm" className="shrink-0" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                        {lot.title}
                      </p>
                      <p className="text-xs capitalize text-slate-500 dark:text-slate-400">
                        {lot.id} · {lot.status.replace('_', ' ')}
                      </p>
                    </div>
                  </button>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono text-sm font-bold tabular-nums text-slate-900 dark:text-white">
                      {formatINR(getCurrentPrice(lot))}
                    </span>
                    {lot.status === 'sold' && (
                      <button
                        type="button"
                        onClick={() => setContractLot(lot)}
                        className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-indigo-500/35 bg-indigo-500/10 px-3 text-xs font-semibold text-indigo-700 hover:bg-indigo-500/20 dark:text-indigo-300"
                      >
                        <FileCheck2 className="h-3.5 w-3.5" />
                        <span>Contract Note</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#111827]">
              <p className="text-xs text-slate-500 dark:text-slate-400">Currently Leading</p>
              <p className="mt-2 font-mono text-2xl font-extrabold tabular-nums text-emerald-600 dark:text-emerald-400">
                {buyerStats.leading.length}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#111827]">
              <p className="text-xs text-slate-500 dark:text-slate-400">Settled Holdings</p>
              <p className="mt-2 font-mono text-2xl font-extrabold tabular-nums text-slate-900 dark:text-white">
                {buyerStats.won.length}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#111827]">
              <p className="text-xs text-slate-500 dark:text-slate-400">Total Settled Spend</p>
              <p className="mt-2 font-mono text-2xl font-extrabold tabular-nums text-slate-900 dark:text-white">
                {formatINR(buyerStats.totalSpent)}
              </p>
            </div>
          </div>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#111827]">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Active Leading Bids
            </h2>
            {buyerStats.leading.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                You are not currently leading any live lots. Place a bid in Markets to track it here.
              </p>
            ) : (
              <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
                {buyerStats.leading.map((lot) => (
                  <button
                    key={lot.id}
                    type="button"
                    onClick={() => navigate(`/asset/${lot.id}`)}
                    className="flex w-full items-center justify-between gap-3 py-3 text-left"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <AssetIllustration assetType={lot.assetType} size="sm" className="shrink-0" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                          {lot.title}
                        </p>
                        <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                          {lot.id} · Leading
                        </p>
                      </div>
                    </div>
                    <span className="shrink-0 font-mono text-sm font-bold tabular-nums text-slate-900 dark:text-white">
                      {formatINR(getCurrentPrice(lot))}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#111827]">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Acquired Holdings & Settlement Contract Notes
            </h2>
            {buyerStats.won.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                Won auctions will settle into your Vault automatically when timers expire.
              </p>
            ) : (
              <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
                {buyerStats.won.map((lot) => (
                  <div
                    key={lot.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-3"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <AssetIllustration assetType={lot.assetType} size="sm" className="shrink-0" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                          {lot.title}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {lot.id} · Seller: {lot.sellerName}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-mono text-sm font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                        {formatINR(getCurrentPrice(lot))}
                      </span>
                      <button
                        type="button"
                        onClick={() => setContractLot(lot)}
                        className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-indigo-500/35 bg-indigo-500/10 px-3 text-xs font-semibold text-indigo-700 hover:bg-indigo-500/20 dark:text-indigo-300"
                      >
                        <FileCheck2 className="h-3.5 w-3.5" />
                        <span>Contract Note</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {contractLot && (
        <ContractNoteModal lot={contractLot} onClose={() => setContractLot(null)} />
      )}
    </div>
  );
};
