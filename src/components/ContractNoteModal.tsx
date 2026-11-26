import React from 'react';
import { FileCheck2, Printer, ShieldCheck, X } from 'lucide-react';
import type { AuctionLot } from '../types/auction';
import { CATEGORY_LABELS, SUBTYPE_LABELS } from '../data/catalog';
import { formatINR } from '../utils/format';
import { AssetIllustration } from './AssetIllustration';

interface ContractNoteModalProps {
  lot: AuctionLot | null;
  onClose: () => void;
}

export const ContractNoteModal: React.FC<ContractNoteModalProps> = ({ lot, onClose }) => {
  if (!lot) return null;

  const winningBid = lot.bids[lot.bids.length - 1];
  const hammerPrice = winningBid?.amount ?? lot.reservePrice;
  const buyerName = winningBid?.bidderName ?? 'Unsettled';
  const brokerage = Math.round(hammerPrice * 0.02);
  const cgst = Math.round(brokerage * 0.09);
  const sgst = Math.round(brokerage * 0.09);
  const totalGst = cgst + sgst;
  const buyerTotalPayable = hammerPrice + brokerage + totalGst;
  const sellerNetPayout = hammerPrice - brokerage;
  const contractRef = `CN-2026-${lot.id.replace(/[^A-Z0-9]/g, '')}`;
  const settledAt = new Date(lot.endTime).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-3 backdrop-blur-xs sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`Settlement Contract Note for ${lot.id}`}
    >
      <div className="print-contract-sheet relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-2xl dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">
        {/* Top Action Bar (hidden during print) */}
        <div className="print-hide sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-slate-50/95 px-5 py-3 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/95">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
            <FileCheck2 className="h-4 w-4 text-indigo-500" />
            <span>Settlement Contract Note · {contractRef}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500"
            >
              <Printer className="h-3.5 w-3.5" />
              Print / Save PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
              aria-label="Close Contract Note"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Formal Brokerage Contract Document Body */}
        <div className="space-y-6 p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-800">
            <div>
              <p className="font-mono text-[11px] font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                AUTOAUCTION CLEARING HOUSE · INDIA
              </p>
              <h2 className="mt-1 text-xl font-bold tracking-tight">
                Digital Auction Settlement Contract Note
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Issued electronically under Escrow Settlement Protocol · Tax Invoice Cum Delivery Advice
              </p>
            </div>
            <div className="text-left sm:text-right">
              <p className="font-mono text-xs font-bold">{contractRef}</p>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Settled: {settledAt}
              </p>
              <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="h-3.5 w-3.5" />
                Escrow Cleared
              </p>
            </div>
          </div>

          {/* Counterparties */}
          <div className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-xs sm:grid-cols-2 dark:border-slate-800 dark:bg-slate-900/50">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Winning Buyer (Allottee)
              </p>
              <p className="mt-1 text-sm font-bold">{buyerName}</p>
              <p className="mt-0.5 text-slate-500 dark:text-slate-400">
                Escrow Verified · Direct Custody Transfer
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Consignor / Verified Seller
              </p>
              <p className="mt-1 text-sm font-bold">{lot.sellerName}</p>
              <p className="mt-0.5 text-slate-500 dark:text-slate-400">
                Location: {lot.location} · Condition Grade {lot.condition}
              </p>
            </div>
          </div>

          {/* Asset Schedule */}
          <div className="flex flex-col gap-4 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center dark:border-slate-800">
            <AssetIllustration assetType={lot.assetType} size="sm" className="shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="font-mono text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                {lot.id} · {CATEGORY_LABELS[lot.category]} · {SUBTYPE_LABELS[lot.assetType]}
              </p>
              <h3 className="mt-0.5 text-base font-bold leading-snug">{lot.title}</h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {lot.specs.join(' · ')}
              </p>
            </div>
          </div>

          {/* Financial Ledger Table */}
          <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-2.5">Settlement Component</th>
                  <th className="px-4 py-2.5 text-right">Rate / Basis</th>
                  <th className="px-4 py-2.5 text-right">Amount (INR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                <tr>
                  <td className="px-4 py-2.5 font-medium">Closing Hammer Price (Lot {lot.id})</td>
                  <td className="px-4 py-2.5 text-right font-mono text-slate-500">
                    Reserve {formatINR(lot.reservePrice)}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono font-semibold tabular-nums">
                    {formatINR(hammerPrice)}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 font-medium">Platform Auction Brokerage</td>
                  <td className="px-4 py-2.5 text-right font-mono text-slate-500">2.00%</td>
                  <td className="px-4 py-2.5 text-right font-mono tabular-nums">
                    {formatINR(brokerage)}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300">
                    CGST on Brokerage
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-slate-500">9.00%</td>
                  <td className="px-4 py-2.5 text-right font-mono tabular-nums">
                    {formatINR(cgst)}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300">
                    SGST on Brokerage
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-slate-500">9.00%</td>
                  <td className="px-4 py-2.5 text-right font-mono tabular-nums">
                    {formatINR(sgst)}
                  </td>
                </tr>
                <tr className="bg-slate-50/80 font-bold dark:bg-slate-900/80">
                  <td className="px-4 py-3 text-sm">Net Buyer Obligation (Incl. Brokerage & GST)</td>
                  <td className="px-4 py-3 text-right font-mono text-[11px] text-emerald-600 dark:text-emerald-400">
                    SETTLED
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-sm tabular-nums text-indigo-600 dark:text-indigo-400">
                    {formatINR(buyerTotalPayable)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-4 text-[11px] text-slate-500 dark:border-slate-800 dark:text-slate-400">
            <span>Seller Net Credit (98% after brokerage): {formatINR(sellerNetPayout)}</span>
            <span className="font-mono">HSN/SAC 997152 · Digitally Signed</span>
          </div>
        </div>
      </div>
    </div>
  );
};
