import React, { useState } from 'react';
import { Flame, Gauge, RotateCcw } from 'lucide-react';
import { useAuction } from '../context/AuctionContext';
import type { DemoSpeed } from '../types/auction';

interface DemoControlBarProps {
  targetLotId?: string;
  showLotSelector?: boolean;
  compact?: boolean;
}

const SPEED_OPTIONS: { value: DemoSpeed; label: string }[] = [
  { value: 0, label: 'OFF' },
  { value: 1, label: '1x' },
  { value: 2, label: '2x' },
  { value: 5, label: '5x' },
  { value: 10, label: '10x' },
];

export const DemoControlBar: React.FC<DemoControlBarProps> = ({
  targetLotId,
  showLotSelector = false,
  compact = false,
}) => {
  const {
    currentUser,
    auctions,
    botSpeed,
    setBotSpeed,
    triggerBiddingWar,
    resetDemoMarket,
  } = useAuction();

  const liveLots = auctions.filter((a) => a.status === 'live');
  const [selectedWarLot, setSelectedWarLot] = useState<string>('');
  const [busyWar, setBusyWar] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  if (currentUser?.role !== 'admin') return null;

  const activeLotId =
    targetLotId || selectedWarLot || liveLots[0]?.id || '';

  const handleTriggerWar = async () => {
    if (!activeLotId || busyWar) return;
    setBusyWar(true);
    await triggerBiddingWar(activeLotId);
    window.setTimeout(() => setBusyWar(false), 1800);
  };

  const handleReset = async () => {
    if (!confirmReset) {
      setConfirmReset(true);
      window.setTimeout(() => setConfirmReset(false), 4000);
      return;
    }
    setConfirmReset(false);
    await resetDemoMarket();
  };

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/80 ${
        compact ? 'px-3 py-2' : 'p-3.5'
      }`}
    >
      {/* Speed Multiplier */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
          <Gauge className="h-3.5 w-3.5 text-indigo-500" />
          <span>Auto-Bid Speed</span>
        </div>
        <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 dark:border-slate-800 dark:bg-slate-950">
          {SPEED_OPTIONS.map((opt) => {
            const active = botSpeed === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => void setBotSpeed(opt.value)}
                className={`min-h-[30px] rounded-md px-2.5 font-mono text-[11px] font-semibold transition-colors ${
                  active
                    ? opt.value === 0
                      ? 'bg-slate-800 text-white dark:bg-slate-700'
                      : 'bg-indigo-600 text-white'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* War Trigger + Reset */}
      <div className="flex flex-wrap items-center gap-2">
        {showLotSelector && liveLots.length > 0 && (
          <select
            value={activeLotId}
            onChange={(e) => setSelectedWarLot(e.target.value)}
            aria-label="Select lot for bidding war"
            className="h-8 max-w-[200px] rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs font-medium text-slate-800 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
          >
            {liveLots.map((lot) => (
              <option key={lot.id} value={lot.id}>
                {lot.id} · {lot.title.slice(0, 26)}
              </option>
            ))}
          </select>
        )}

        <button
          type="button"
          disabled={!activeLotId || busyWar}
          onClick={() => void handleTriggerWar()}
          className="inline-flex min-h-[32px] items-center gap-1.5 rounded-lg border border-amber-500/35 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-700 transition-colors hover:bg-amber-500/20 disabled:opacity-50 dark:text-amber-300"
        >
          <Flame className="h-3.5 w-3.5" />
          {busyWar ? 'War Running…' : targetLotId ? `Bid War (${targetLotId})` : 'Trigger Bid War'}
        </button>

        <button
          type="button"
          onClick={() => void handleReset()}
          className={`inline-flex min-h-[32px] items-center gap-1.5 rounded-lg border px-3 py-1 text-xs font-semibold transition-colors ${
            confirmReset
              ? 'border-rose-500 bg-rose-600 text-white'
              : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800'
          }`}
        >
          <RotateCcw className="h-3.5 w-3.5" />
          {confirmReset ? 'Tap Again to Reset' : 'Reset Demo'}
        </button>
      </div>
    </div>
  );
};
