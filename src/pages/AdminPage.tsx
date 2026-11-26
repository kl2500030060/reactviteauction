import React, { useMemo, useState } from 'react';
import { Check, Database, RefreshCw, ShieldCheck, Smartphone, Trash2, X } from 'lucide-react';
import { useAuction } from '../context/AuctionContext';
import type { UserRole } from '../types/auction';
import { SUBTYPE_LABELS } from '../data/catalog';
import { formatINR, formatINRCompact, getCurrentPrice, isLotLive } from '../utils/format';
import { AssetIllustration } from '../components/AssetIllustration';
import { DemoControlBar } from '../components/DemoControlBar';

export const AdminPage: React.FC = () => {
  const {
    users,
    auctions,
    currentUser,
    backendStatus,
    now,
    moderateAuction,
    deleteAuction,
    updateUserRole,
    deleteUser,
    replenishMarket,
  } = useAuction();

  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const pendingLots = useMemo(
    () => auctions.filter((a) => a.status === 'pending_approval'),
    [auctions]
  );

  const liveCount = useMemo(
    () => auctions.filter((a) => isLotLive(a, now)).length,
    [auctions, now]
  );

  const totalCatalogValue = useMemo(
    () => auctions.reduce((sum, a) => sum + getCurrentPrice(a), 0),
    [auctions]
  );

  const handleConfirmReject = async (lotId: string) => {
    await moderateAuction(lotId, 'reject', rejectReason || 'Documentation incomplete.');
    setRejectingId(null);
    setRejectReason('');
  };

  return (
    <div className="space-y-6">
      {/* Header + Live Demo Controls */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Admin Control Center
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Moderate seller submissions, manage accounts and roles, and control live demo traffic
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void replenishMarket()}
            className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-indigo-600 px-3.5 text-xs font-semibold text-white transition hover:bg-indigo-500"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Add Fresh Lots</span>
          </button>
        </div>
      </div>

      {/* Live Demo Speed & Bidding War Control Center */}
      <DemoControlBar showLotSelector />

      {/* KPI Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-4 sm:p-5">
          <p className="text-xs text-slate-500 dark:text-slate-400">Registered Users</p>
          <p className="mt-1.5 font-mono text-2xl font-extrabold tabular-nums text-slate-900 dark:text-white">
            {users.length}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-4 sm:p-5">
          <p className="text-xs text-slate-500 dark:text-slate-400">Live Auctions</p>
          <p className="mt-1.5 font-mono text-2xl font-extrabold tabular-nums text-emerald-600 dark:text-emerald-400">
            {liveCount}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-4 sm:p-5">
          <p className="text-xs text-slate-500 dark:text-slate-400">Pending Approvals</p>
          <p className="mt-1.5 font-mono text-2xl font-extrabold tabular-nums text-amber-600 dark:text-amber-400">
            {pendingLots.length}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-4 sm:p-5">
          <p className="text-xs text-slate-500 dark:text-slate-400">Active Book Value</p>
          <p className="mt-1.5 font-mono text-2xl font-extrabold tabular-nums text-indigo-600 dark:text-indigo-400">
            {formatINRCompact(totalCatalogValue)}
          </p>
        </div>
      </div>

      {/* Client Storage & Security Runtime */}
      {backendStatus && (
        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-indigo-500" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                LocalStorage Persistence & Security Runtime
              </h2>
            </div>
            <p className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
              Pure React + Vite SPA · BroadcastChannel Cross-Tab Live Sync
            </p>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Storage Engine</p>
              <p className="mt-1 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                {backendStatus.storageLabel}
              </p>
            </div>
            <div>
              <p className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                <Smartphone className="h-3.5 w-3.5" />
                Active Client Environment
              </p>
              <p className="mt-1 font-mono font-bold tabular-nums text-slate-900 dark:text-white">
                {backendStatus.connectedDevices.mobile > 0 ? 'Mobile Browser' : 'Desktop Browser'} · Sync Active
              </p>
            </div>
            <div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Persisted Entities</p>
              <p className="mt-1 font-mono font-bold tabular-nums text-slate-900 dark:text-white">
                Users · Lots · Bids · Escrow · Watchlist
              </p>
            </div>
            <div>
              <p className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                Password Hashing
              </p>
              <p className="mt-1 font-mono font-bold text-slate-900 dark:text-white">
                {backendStatus.hashAlgorithm}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Pending Listing Moderation Queue */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 sm:p-6">
        <h2 className="text-base font-bold text-slate-900 dark:text-white">
          Listing Approval Queue ({pendingLots.length})
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Approving a lot immediately broadcasts it live to all connected devices.
        </p>

        {pendingLots.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            All submitted seller listings have been reviewed.
          </p>
        ) : (
          <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
            {pendingLots.map((lot) => (
              <div key={lot.id} className="py-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <AssetIllustration assetType={lot.assetType} size="sm" className="shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {lot.title}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-mono">{lot.id}</span> · {SUBTYPE_LABELS[lot.assetType]} ·{' '}
                        {lot.sellerName} · {lot.location}
                      </p>
                      <p className="mt-0.5 font-mono text-xs font-semibold tabular-nums text-slate-800 dark:text-slate-200">
                        Reserve: {formatINR(lot.reservePrice)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => void moderateAuction(lot.id, 'approve')}
                      className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl bg-emerald-600 px-4 text-xs font-semibold text-white transition hover:bg-emerald-500"
                    >
                      <Check className="h-4 w-4" />
                      <span>Approve</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRejectingId(rejectingId === lot.id ? null : lot.id);
                        setRejectReason('');
                      }}
                      className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl border border-red-500/40 bg-red-500/10 px-4 text-xs font-semibold text-red-700 dark:text-red-300"
                    >
                      <X className="h-4 w-4" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>

                {rejectingId === lot.id && (
                  <div className="flex flex-col sm:flex-row gap-2 pt-1">
                    <input
                      type="text"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Optional rejection note for seller..."
                      className="min-h-[42px] flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3.5 text-xs text-slate-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => void handleConfirmReject(lot.id)}
                      className="min-h-[42px] rounded-xl bg-red-600 px-4 text-xs font-semibold text-white"
                    >
                      Confirm Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Two-Column User CRUD & Market Inventory Moderation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User & Role CRUD Table */}
        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 sm:p-6">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Accounts & Role Control ({users.length})
          </h2>
          <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
            {users.map((u) => {
              const isSelf = u.id === currentUser?.id;
              return (
                <div key={u.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {u.name} {isSelf ? '(You)' : ''}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      @{u.username} · {formatINRCompact(u.availableBalance)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <select
                      aria-label={`Change role for ${u.username}`}
                      disabled={isSelf}
                      value={u.role}
                      onChange={(e) => void updateUserRole(u.id, e.target.value as UserRole)}
                      className="min-h-[38px] rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200 disabled:opacity-50"
                    >
                      <option value="user">Bidder</option>
                      <option value="seller">Seller</option>
                      <option value="admin">Admin</option>
                    </select>

                    <button
                      type="button"
                      disabled={isSelf}
                      onClick={() => void deleteUser(u.id)}
                      aria-label={`Remove ${u.username}`}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-red-600 dark:text-red-400 hover:border-red-500 disabled:opacity-30"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* All Lots Moderation */}
        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 sm:p-6">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Catalog Moderation ({auctions.length})
          </h2>
          <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800 max-h-96 overflow-y-auto">
            {auctions.map((lot) => (
              <div key={lot.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                    {lot.title}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-mono">{lot.id}</span> ·{' '}
                    <span className="capitalize">{lot.status.replace('_', ' ')}</span> ·{' '}
                    <span className="font-mono tabular-nums">{formatINR(getCurrentPrice(lot))}</span>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => void deleteAuction(lot.id)}
                  aria-label={`Delete lot ${lot.id}`}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-red-600 dark:text-red-400 hover:border-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
