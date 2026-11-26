import React, { useMemo, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Lock, Plus } from 'lucide-react';
import { useAuction } from '../context/AuctionContext';
import { formatINR } from '../utils/format';

const QUICK_TOPUP_PRESETS = [500000, 2500000, 10000000];

export const WalletPage: React.FC = () => {
  const { currentUser, transactions, topUpWallet } = useAuction();
  const [customAmount, setCustomAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const myTxns = useMemo(
    () => transactions.filter((t) => t.userId === currentUser?.id),
    [transactions, currentUser?.id]
  );

  if (!currentUser) return null;

  const handleTopUp = async (amount: number) => {
    setError(null);
    setSubmitting(true);
    const res = await topUpWallet(amount);
    setSubmitting(false);
    if (!res.ok) {
      setError(res.error || 'Could not process deposit.');
    } else {
      setCustomAmount('');
    }
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numeric = Number(customAmount.replace(/[^0-9]/g, ''));
    if (!numeric || numeric < 50000) {
      setError('Minimum instant deposit is ₹50,000.');
      return;
    }
    await handleTopUp(numeric);
  };

  const totalPower = currentUser.availableBalance + currentUser.escrowBalance;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Escrow Wallet
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Funds locked on active bids return instantly if you are outbid
        </p>
      </div>

      {/* Balance KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Available to Bid
          </p>
          <p className="mt-2 font-mono text-2xl font-extrabold tabular-nums text-emerald-600 dark:text-emerald-400">
            {formatINR(currentUser.availableBalance)}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5">
          <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
            <Lock className="h-3.5 w-3.5 text-amber-500" />
            <span>Locked in Escrow</span>
          </p>
          <p className="mt-2 font-mono text-2xl font-extrabold tabular-nums text-amber-600 dark:text-amber-400">
            {formatINR(currentUser.escrowBalance)}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Total Account Capital
          </p>
          <p className="mt-2 font-mono text-2xl font-extrabold tabular-nums text-slate-900 dark:text-white">
            {formatINR(totalPower)}
          </p>
        </div>
      </div>

      {/* Instant Deposit Panel */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 sm:p-6">
        <h2 className="text-base font-bold text-slate-900 dark:text-white">
          Add Virtual Escrow Funds
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Top up your bidding limit instantly for live auction participation.
        </p>

        {error && (
          <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-xs font-medium text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="mt-4 grid grid-cols-3 gap-2.5">
          {QUICK_TOPUP_PRESETS.map((amt) => (
            <button
              key={amt}
              type="button"
              disabled={submitting}
              onClick={() => void handleTopUp(amt)}
              className="inline-flex min-h-[46px] items-center justify-center gap-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 font-mono text-xs sm:text-sm font-semibold tabular-nums text-slate-900 dark:text-white transition hover:border-indigo-500 disabled:opacity-50"
            >
              <Plus className="h-3.5 w-3.5 text-indigo-500" />
              <span>{formatINR(amt)}</span>
            </button>
          ))}
        </div>

        <form onSubmit={handleCustomSubmit} className="mt-4 flex flex-col sm:flex-row gap-2.5">
          <input
            type="number"
            inputMode="numeric"
            min={50000}
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            placeholder="Custom deposit amount in INR (min 50,000)"
            className="min-h-[48px] flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 font-mono text-sm tabular-nums text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={submitting}
            className="min-h-[48px] rounded-xl bg-indigo-600 px-6 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50 whitespace-nowrap"
          >
            Deposit Funds
          </button>
        </form>
      </section>

      {/* Escrow Transaction Ledger */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 sm:p-6">
        <h2 className="text-base font-bold text-slate-900 dark:text-white">
          Wallet Activity Ledger
        </h2>

        {myTxns.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            No wallet transactions recorded yet.
          </p>
        ) : (
          <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-800/80">
            {myTxns.map((txn) => {
              const isCredit =
                txn.type === 'top_up' ||
                txn.type === 'escrow_release' ||
                txn.type === 'seller_payout' ||
                txn.type === 'platform_fee';
              return (
                <div key={txn.id} className="flex items-center justify-between gap-3 py-3.5">
                  <div className="flex items-start gap-3 min-w-0">
                    <span
                      className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                        isCredit
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {isCredit ? (
                        <ArrowDownLeft className="h-4 w-4" />
                      ) : (
                        <ArrowUpRight className="h-4 w-4" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {txn.note}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {new Date(txn.timestamp).toLocaleString('en-IN')}
                        {txn.lotId ? ` · ${txn.lotId}` : ''}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`font-mono text-sm font-bold tabular-nums shrink-0 ${
                      isCredit
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-slate-900 dark:text-slate-200'
                    }`}
                  >
                    {isCredit ? '+' : '−'}
                    {formatINR(txn.amount)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
