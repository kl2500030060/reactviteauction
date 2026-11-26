import React, { useMemo, useState } from 'react';
import { Download, Search } from 'lucide-react';
import { useAuction } from '../context/AuctionContext';
import { exportAuditCSV, formatINR } from '../utils/format';

export const HistoryPage: React.FC = () => {
  const { auctions, pushToast } = useAuction();
  const [query, setQuery] = useState('');

  const bidRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows: Array<{
      id: string;
      lotId: string;
      title: string;
      bidder: string;
      amount: number;
      timestamp: number;
      isAutoPilot: boolean;
    }> = [];

    auctions.forEach((lot) => {
      lot.bids.forEach((b) => {
        if (b.bidderId === 'system') return;
        rows.push({
          id: b.id,
          lotId: lot.id,
          title: lot.title,
          bidder: b.bidderName,
          amount: b.amount,
          timestamp: b.timestamp,
          isAutoPilot: Boolean(b.isAutoPilot),
        });
      });
    });

    rows.sort((a, b) => b.timestamp - a.timestamp);
    if (!q) return rows;
    return rows.filter((r) =>
      `${r.lotId} ${r.title} ${r.bidder}`.toLowerCase().includes(q)
    );
  }, [auctions, query]);

  const handleExport = () => {
    if (bidRows.length === 0) {
      pushToast({ title: 'Nothing to export', message: 'No bids recorded yet.', variant: 'info' });
      return;
    }
    exportAuditCSV(auctions);
    pushToast({ title: 'Audit CSV downloaded', variant: 'success' });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Audit Ledger
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Chronological log of all verified bids across every auction lot
          </p>
        </div>

        <button
          type="button"
          onClick={handleExport}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-xs font-semibold text-white transition hover:bg-emerald-500 whitespace-nowrap"
        >
          <Download className="h-4 w-4" />
          <span>Export CSV</span>
        </button>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter ledger by lot ID, asset, or bidder name..."
          className="min-h-[46px] w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] pl-10 pr-4 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827]">
        {bidRows.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
            No matching bids found.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/70 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Lot</th>
                  <th className="px-4 py-3">Asset</th>
                  <th className="px-4 py-3">Bidder</th>
                  <th className="px-4 py-3 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {bidRows.map((row) => (
                  <tr key={row.id}>
                    <td className="px-4 py-3 font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {new Date(row.timestamp).toLocaleTimeString('en-IN')}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                      {row.lotId}
                    </td>
                    <td className="px-4 py-3 text-xs sm:text-sm text-slate-700 dark:text-slate-200">
                      {row.title}
                    </td>
                    <td className="px-4 py-3 text-xs font-medium text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                      {row.bidder}
                      {row.isAutoPilot ? ' · Auto' : ''}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs sm:text-sm font-bold tabular-nums text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                      {formatINR(row.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
