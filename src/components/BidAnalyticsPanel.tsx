import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Activity, BarChart3, Layers, TrendingUp, Zap } from 'lucide-react';
import type { AuctionLot } from '../types/auction';
import { getMinIncrement } from '../data/catalog';
import { formatINRCompact, formatINR } from '../utils/format';

interface BidAnalyticsPanelProps {
  lot: AuctionLot;
  currentUserId?: string | null;
  compact?: boolean;
}

type TimeframeWindow = '5m' | '15m' | 'all';

interface ChartPoint {
  step: string;
  timeLabel: string;
  amount: number | null;
  ema: number | null;
  projected: number | null;
  projBase: number | null;
  projSpan: number | null;
  projLow: number | null;
  projHigh: number | null;
  delta: number;
  bidder: string;
  deviceLabel?: string;
  isAutoPilot?: boolean;
  isProjected?: boolean;
  isLatestActual?: boolean;
}

function formatClockShort(ts: number): string {
  return new Date(ts).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

export const BidAnalyticsPanel: React.FC<BidAnalyticsPanelProps> = ({
  lot,
  currentUserId,
  compact = false,
}) => {
  const [chartMode, setChartMode] = useState<'curve' | 'velocity'>('curve');
  const [timeframe, setTimeframe] = useState<TimeframeWindow>('all');
  const [tickActive, setTickActive] = useState(false);

  const latestBidId = lot.bids[lot.bids.length - 1]?.id ?? null;
  const prevBidRef = useRef<{ lotId: string; bidId: string | null }>({
    lotId: lot.id,
    bidId: latestBidId,
  });

  // Trigger a brief highlight ring strictly when a real new bid arrives for the currently viewed lot
  useEffect(() => {
    const prev = prevBidRef.current;
    if (prev.lotId === lot.id && prev.bidId !== null && latestBidId !== prev.bidId) {
      setTickActive(true);
      const timer = window.setTimeout(() => setTickActive(false), 1600);
      prevBidRef.current = { lotId: lot.id, bidId: latestBidId };
      return () => window.clearTimeout(timer);
    }
    prevBidRef.current = { lotId: lot.id, bidId: latestBidId };
    setTickActive(false);
    return undefined;
  }, [lot.id, latestBidId]);

  const minInc = getMinIncrement(lot.reservePrice);
  const currentPrice = lot.bids[lot.bids.length - 1]?.amount ?? lot.reservePrice;
  const premiumPct =
    lot.reservePrice > 0
      ? ((currentPrice - lot.reservePrice) / lot.reservePrice) * 100
      : 0;
  const nextMinBid = currentPrice + minInc;

  const { chartData, velocityData, estimatedHammer, pacePerMin } = useMemo(() => {
    const baseBids =
      lot.bids.length > 0
        ? lot.bids
        : [
            {
              id: 'opening',
              bidderId: 'system',
              bidderName: 'Reserve Opening',
              amount: lot.reservePrice,
              timestamp: lot.createdAt,
              deviceLabel: 'System',
            },
          ];

    const nowTs = Date.now();
    const cutoff =
      timeframe === '5m'
        ? nowTs - 5 * 60 * 1000
        : timeframe === '15m'
        ? nowTs - 15 * 60 * 1000
        : 0;

    let filtered = cutoff > 0 ? baseBids.filter((b) => b.timestamp >= cutoff) : baseBids;
    if (filtered.length < 2) {
      filtered = baseBids.slice(-Math.min(baseBids.length, 4));
    }

    // Build actual bid points + smooth 3-period EMA moving average
    const alpha = 0.5;
    let runningEma = filtered[0].amount;
    const actualPoints: ChartPoint[] = filtered.map((b, idx) => {
      const prevAmt = idx > 0 ? filtered[idx - 1].amount : lot.reservePrice;
      const delta = idx === 0 && b.bidderId === 'system' ? 0 : Math.max(0, b.amount - prevAmt);
      runningEma = idx === 0 ? b.amount : Math.round(alpha * b.amount + (1 - alpha) * runningEma);
      const isLast = idx === filtered.length - 1;
      return {
        step: idx === 0 && b.bidderId === 'system' ? 'Open' : `#${idx + 1}`,
        timeLabel: formatClockShort(b.timestamp),
        amount: b.amount,
        ema: runningEma,
        projected: isLast ? b.amount : null,
        projBase: isLast ? b.amount : null,
        projSpan: isLast ? 0 : null,
        projLow: isLast ? b.amount : null,
        projHigh: isLast ? b.amount : null,
        delta,
        bidder: b.bidderName,
        deviceLabel: b.deviceLabel,
        isAutoPilot: b.isAutoPilot,
        isProjected: false,
        isLatestActual: isLast,
      };
    });

    // Compute bid velocity (INR/min) over recent bids to project closing price trajectory band
    const recentSlice = baseBids.slice(-Math.min(baseBids.length, 6));
    const firstRecent = recentSlice[0];
    const lastRecent = recentSlice[recentSlice.length - 1];
    const elapsedMin = Math.max(0.5, (lastRecent.timestamp - firstRecent.timestamp) / 60000);
    const totalRise = Math.max(0, lastRecent.amount - firstRecent.amount);
    const rawPace = totalRise > 0 ? totalRise / elapsedMin : minInc * 0.25;
    // Clamp velocity so projections stay realistic even during a 5x demo burst
    const clampedPace = Math.min(rawPace, minInc * 3.5);
    const remainingMin = lot.status === 'live' ? Math.max(0, (lot.endTime - nowTs) / 60000) : 0;
    const horizonMin = Math.min(remainingMin, 12);

    let estHammer = currentPrice;
    const projectedPoints: ChartPoint[] = [];

    if (lot.status === 'live' && remainingMin > 0.25) {
      const stepCount = 3;
      const stepLabels = ['Est +33%', 'Est +66%', 'Close'];
      for (let i = 1; i <= stepCount; i++) {
        const frac = i / stepCount;
        // Gentle logarithmic damping toward hammer close
        const projectedRise = Math.round(clampedPace * horizonMin * Math.pow(frac, 0.85));
        const mid = currentPrice + Math.max(Math.round(minInc * frac), projectedRise);
        const bandHalf = Math.max(minInc, Math.round((mid - currentPrice) * 0.35 + minInc * frac));
        const low = Math.max(currentPrice, mid - bandHalf);
        const high = mid + bandHalf;
        if (i === stepCount) estHammer = mid;
        projectedPoints.push({
          step: stepLabels[i - 1],
          timeLabel: i === stepCount ? 'Est. Hammer' : `+${Math.max(1, Math.round(horizonMin * frac))}m`,
          amount: null,
          ema: null,
          projected: mid,
          projBase: low,
          projSpan: Math.max(0, high - low),
          projLow: low,
          projHigh: high,
          delta: 0,
          bidder: 'Projected Corridor',
          isProjected: true,
        });
      }
    }

    return {
      chartData: [...actualPoints, ...projectedPoints],
      velocityData: actualPoints,
      estimatedHammer: estHammer,
      pacePerMin: Math.round(clampedPace),
    };
  }, [lot.bids, lot.createdAt, lot.endTime, lot.reservePrice, lot.status, timeframe, minInc, currentPrice]);

  // Top 5 live bids (newest first) for Kite-style Market Depth ladder
  const depthLevels = useMemo(() => {
    const reversed = [...lot.bids].reverse().slice(0, 5);
    const maxAmt = reversed[0]?.amount ?? lot.reservePrice;
    const minAmt = lot.reservePrice;
    const span = Math.max(maxAmt - minAmt, minInc);
    return reversed.map((bid, idx) => {
      const strength = Math.min(
        100,
        Math.max(18, Math.round(((bid.amount - minAmt) / span) * 82 + 18))
      );
      return {
        ...bid,
        rank: idx + 1,
        strength,
        isCurrentUser: Boolean(currentUserId && bid.bidderId === currentUserId),
      };
    });
  }, [lot.bids, lot.reservePrice, minInc, currentUserId]);

  const recentBidCount = useMemo(() => {
    const cutoff = Date.now() - 10 * 60 * 1000;
    return lot.bids.filter((b) => b.bidderId !== 'system' && b.timestamp >= cutoff).length;
  }, [lot.bids]);

  const yDomain = useMemo<[number, number]>(() => {
    const values: number[] = [lot.reservePrice];
    for (const d of chartData) {
      if (d.amount !== null) values.push(d.amount);
      if (d.ema !== null) values.push(d.ema);
      if (d.projHigh !== null) values.push(d.projHigh);
      if (d.projLow !== null) values.push(d.projLow);
    }
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const pad = Math.max(minInc, Math.round((maxVal - minVal) * 0.14));
    return [Math.max(0, minVal - Math.round(pad * 0.35)), maxVal + pad];
  }, [chartData, lot.reservePrice, minInc]);

  return (
    <div className={`grid gap-4 ${compact ? 'grid-cols-1' : 'grid-cols-1 xl:grid-cols-12'}`}>
      {/* Smooth Spline Trajectory + EMA + Projected Closing Band Chart */}
      <div
        className={`${
          compact ? '' : 'xl:col-span-7'
        } rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/70`}
      >
        <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-900 dark:text-slate-100">
              <TrendingUp className="h-3.5 w-3.5 text-indigo-500" />
              <span>{chartMode === 'curve' ? 'Smooth Bid Trajectory' : 'Bid Step Velocity'}</span>
              {chartMode === 'curve' && lot.status === 'live' && (
                <span className="font-mono text-[11px] font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                  · Est. Hammer {formatINRCompact(estimatedHammer)}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
              Reserve {formatINRCompact(lot.reservePrice)} · Pace{' '}
              <span className="font-mono tabular-nums text-slate-700 dark:text-slate-300">
                +{formatINRCompact(pacePerMin)}/m
              </span>{' '}
              ·{' '}
              <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                +{premiumPct.toFixed(1)}%
              </span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {/* Timeframe Zoom Segmented Buttons */}
            <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 dark:border-slate-800 dark:bg-slate-950">
              {(['5m', '15m', 'all'] as const).map((tf) => (
                <button
                  key={tf}
                  type="button"
                  onClick={() => setTimeframe(tf)}
                  className={`rounded-md px-2 py-1 text-[10px] font-mono font-semibold uppercase transition-colors ${
                    timeframe === tf
                      ? 'bg-white text-indigo-600 shadow-xs dark:bg-slate-800 dark:text-indigo-400'
                      : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>

            {/* Mode Switch */}
            <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 dark:border-slate-800 dark:bg-slate-950">
              <button
                type="button"
                onClick={() => setChartMode('curve')}
                className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                  chartMode === 'curve'
                    ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-white'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <Activity className="h-3 w-3" />
                Curve
              </button>
              <button
                type="button"
                onClick={() => setChartMode('velocity')}
                className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                  chartMode === 'velocity'
                    ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-white'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <BarChart3 className="h-3 w-3" />
                Steps
              </button>
            </div>
          </div>
        </div>

        {/* Inline Legend */}
        {chartMode === 'curve' && (
          <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] font-medium text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-0.5 w-3.5 bg-indigo-500" />
              Live Bid Spline
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-0.5 w-3.5 border-t-2 border-dashed border-amber-500" />
              3-Pt EMA
            </span>
            {lot.status === 'live' && (
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-3 rounded-xs bg-emerald-500/25 border border-emerald-500/60" />
                Projected Corridor
              </span>
            )}
          </div>
        )}

        <div className="h-52 w-full sm:h-56">
          <ResponsiveContainer width="100%" height="100%">
            {chartMode === 'curve' ? (
              <ComposedChart data={chartData} margin={{ top: 8, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={`bidGrad-${lot.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.34} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id={`projBand-${lot.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity={0.22} />
                    <stop offset="100%" stopColor="#10B981" stopOpacity={0.06} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="currentColor"
                  className="text-slate-200 dark:text-slate-800"
                />
                <XAxis
                  dataKey="step"
                  tick={{ fontSize: 10, fill: '#94A3B8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={yDomain}
                  tickFormatter={(val: number) => formatINRCompact(val)}
                  tick={{ fontSize: 10, fill: '#94A3B8', fontFamily: 'JetBrains Mono, monospace' }}
                  axisLine={false}
                  tickLine={false}
                  width={62}
                />
                <ReferenceLine
                  y={lot.reservePrice}
                  stroke="#F59E0B"
                  strokeDasharray="4 4"
                  strokeOpacity={0.65}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const pt = payload[0].payload as ChartPoint;
                    if (pt.isProjected && pt.projected !== null) {
                      return (
                        <div className="rounded-lg border border-emerald-500/30 bg-white px-3 py-2 text-xs shadow-lg dark:border-emerald-500/40 dark:bg-slate-900">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                            Projected Trajectory ({pt.timeLabel})
                          </p>
                          <p className="mt-0.5 font-mono font-bold text-slate-900 dark:text-white">
                            {formatINR(pt.projected)}
                          </p>
                          {pt.projLow !== null && pt.projHigh !== null && (
                            <p className="mt-0.5 font-mono text-[10px] text-slate-500 dark:text-slate-400">
                              Band: {formatINRCompact(pt.projLow)} – {formatINRCompact(pt.projHigh)}
                            </p>
                          )}
                        </div>
                      );
                    }
                    return (
                      <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg dark:border-slate-700 dark:bg-slate-900">
                        <p className="font-mono font-bold text-slate-900 dark:text-white">
                          {formatINR(pt.amount ?? 0)}
                        </p>
                        <p className="mt-0.5 text-slate-600 dark:text-slate-300">
                          {pt.bidder}
                          {pt.isAutoPilot ? ' · Auto-Pilot' : ''}
                        </p>
                        <p className="mt-0.5 font-mono text-[10px] text-slate-400">
                          {pt.timeLabel}
                          {pt.deviceLabel ? ` · ${pt.deviceLabel}` : ''}
                          {pt.delta > 0 ? ` · +${formatINRCompact(pt.delta)}` : ''}
                        </p>
                        {pt.ema !== null && (
                          <p className="mt-0.5 font-mono text-[10px] text-amber-600 dark:text-amber-400">
                            EMA Trend: {formatINRCompact(pt.ema)}
                          </p>
                        )}
                      </div>
                    );
                  }}
                />

                {/* Projected confidence corridor (stacked transparent base + shaded span) */}
                <Area
                  type="monotone"
                  dataKey="projBase"
                  stackId="proj"
                  stroke="none"
                  fill="transparent"
                  isAnimationActive={false}
                  connectNulls={false}
                />
                <Area
                  type="monotone"
                  dataKey="projSpan"
                  stackId="proj"
                  stroke="none"
                  fill={`url(#projBand-${lot.id})`}
                  isAnimationActive={false}
                  connectNulls={false}
                />

                {/* Smooth Monotone Spline Live Bid Curve */}
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="#6366F1"
                  strokeWidth={2.4}
                  fill={`url(#bidGrad-${lot.id})`}
                  connectNulls={false}
                  isAnimationActive={false}
                  dot={(dotProps) => {
                    const { cx, cy, payload, index } = dotProps as {
                      cx?: number;
                      cy?: number;
                      payload?: ChartPoint;
                      index?: number;
                    };
                    if (
                      typeof cx !== 'number' ||
                      typeof cy !== 'number' ||
                      !payload ||
                      payload.amount === null
                    ) {
                      return <g key={`empty-${index}`} />;
                    }
                    if (payload.isLatestActual) {
                      return (
                        <g key={`latest-${index}`}>
                          {tickActive && (
                            <circle
                              cx={cx}
                              cy={cy}
                              r={10}
                              fill="rgba(99, 102, 241, 0.25)"
                              className="motion-safe:animate-ping"
                            />
                          )}
                          <circle
                            cx={cx}
                            cy={cy}
                            r={4.5}
                            fill="#6366F1"
                            stroke="#FFFFFF"
                            strokeWidth={2}
                          />
                        </g>
                      );
                    }
                    return (
                      <circle
                        key={`dot-${index}`}
                        cx={cx}
                        cy={cy}
                        r={2.5}
                        fill="#6366F1"
                        strokeWidth={0}
                      />
                    );
                  }}
                  activeDot={{ r: 5.5, fill: '#6366F1', stroke: '#FFFFFF', strokeWidth: 2 }}
                />

                {/* 3-Point Exponential Moving Average Overlay */}
                <Line
                  type="monotone"
                  dataKey="ema"
                  stroke="#F59E0B"
                  strokeWidth={1.6}
                  strokeDasharray="4 4"
                  dot={false}
                  connectNulls={false}
                  isAnimationActive={false}
                />

                {/* Projected Closing Trajectory Line */}
                <Line
                  type="monotone"
                  dataKey="projected"
                  stroke="#10B981"
                  strokeWidth={2}
                  strokeDasharray="5 4"
                  dot={{ r: 3, fill: '#10B981', strokeWidth: 0 }}
                  connectNulls={false}
                  isAnimationActive={false}
                />
              </ComposedChart>
            ) : (
              <BarChart data={velocityData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="currentColor"
                  className="text-slate-200 dark:text-slate-800"
                />
                <XAxis
                  dataKey="step"
                  tick={{ fontSize: 10, fill: '#94A3B8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(val: number) => formatINRCompact(val)}
                  tick={{ fontSize: 10, fill: '#94A3B8', fontFamily: 'JetBrains Mono, monospace' }}
                  axisLine={false}
                  tickLine={false}
                  width={62}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const pt = payload[0].payload as ChartPoint;
                    return (
                      <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg dark:border-slate-700 dark:bg-slate-900">
                        <p className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          +{formatINR(pt.delta)}
                        </p>
                        <p className="mt-0.5 text-slate-600 dark:text-slate-300">
                          {pt.bidder} · Total {formatINRCompact(pt.amount ?? 0)}
                        </p>
                        <p className="mt-0.5 font-mono text-[10px] text-slate-400">
                          {pt.timeLabel}
                          {pt.deviceLabel ? ` · ${pt.deviceLabel}` : ''}
                        </p>
                      </div>
                    );
                  }}
                />
                <Bar
                  dataKey="delta"
                  fill="#10B981"
                  radius={[4, 4, 0, 0]}
                  isAnimationActive={false}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Kite-Style 5-Level Live Bid Depth Ladder */}
      <div
        className={`${
          compact ? '' : 'xl:col-span-5'
        } flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/70`}
      >
        <div>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 dark:text-slate-100">
              <Layers className="h-3.5 w-3.5 text-indigo-500" />
              <span>Market Bid Depth (Top 5)</span>
            </div>
            <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
              {recentBidCount} bids / 10m
            </span>
          </div>

          <div className="mb-1.5 grid grid-cols-12 px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            <span className="col-span-5">Bidder</span>
            <span className="col-span-3 text-right">Time</span>
            <span className="col-span-4 text-right">Bid (INR)</span>
          </div>

          <div className="space-y-1">
            {depthLevels.map((row) => (
              <div
                key={row.id}
                className="relative grid grid-cols-12 items-center overflow-hidden rounded-md px-2 py-1.5 text-xs"
              >
                <div
                  className={`pointer-events-none absolute inset-y-0 right-0 transition-all duration-300 ${
                    row.rank === 1
                      ? 'bg-emerald-500/12 dark:bg-emerald-500/18'
                      : 'bg-indigo-500/8 dark:bg-indigo-500/12'
                  }`}
                  style={{ width: `${row.strength}%` }}
                />

                <div className="relative z-10 col-span-5 flex items-center gap-1.5 truncate">
                  <span className="font-mono text-[10px] text-slate-400">{row.rank}</span>
                  <div className="min-w-0">
                    <span
                      className={`block truncate font-medium ${
                        row.isCurrentUser
                          ? 'text-indigo-600 dark:text-indigo-400'
                          : 'text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {row.isCurrentUser ? 'You' : row.bidderName}
                    </span>
                    {row.deviceLabel && row.deviceLabel !== 'System' && (
                      <span className="block truncate font-mono text-[9px] text-slate-400">
                        {row.deviceLabel}
                      </span>
                    )}
                  </div>
                  {row.isAutoPilot && (
                    <Zap className="h-3 w-3 shrink-0 text-amber-500" aria-label="Auto-Pilot" />
                  )}
                </div>

                <span className="relative z-10 col-span-3 text-right font-mono text-[11px] text-slate-500 dark:text-slate-400">
                  {formatClockShort(row.timestamp)}
                </span>

                <span
                  className={`relative z-10 col-span-4 text-right font-mono font-semibold tabular-nums ${
                    row.rank === 1
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-slate-900 dark:text-slate-100'
                  }`}
                >
                  {formatINRCompact(row.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-400">Next Min Bid</p>
            <p className="mt-0.5 font-mono font-bold tabular-nums text-slate-900 dark:text-white">
              {formatINR(nextMinBid)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-slate-400">Total Offers</p>
            <p className="mt-0.5 font-mono font-bold tabular-nums text-slate-900 dark:text-white">
              {Math.max(0, lot.bids.length - 1)} bids
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
