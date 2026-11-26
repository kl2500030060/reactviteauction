import type { AuctionLot } from '../types/auction';

export function formatINR(amount: number): string {
  return '₹' + Math.round(amount).toLocaleString('en-IN');
}

export function formatINRCompact(amount: number): string {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)} L`;
  }
  return formatINR(amount);
}

export function formatTimeLeft(endTime: number, now: number = Date.now()): string {
  const diff = endTime - now;
  if (diff <= 0) return 'Ended';
  const totalSeconds = Math.floor(diff / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}h ${String(minutes).padStart(2, '0')}m`;
  }
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function getCurrentPrice(lot: AuctionLot): number {
  if (!lot.bids || lot.bids.length === 0) return lot.reservePrice;
  return lot.bids[lot.bids.length - 1].amount;
}

export function getHighestBid(lot: AuctionLot) {
  if (!lot.bids || lot.bids.length === 0) return null;
  return lot.bids[lot.bids.length - 1];
}

export function getUserBidCount(lot: AuctionLot): number {
  return lot.bids.filter((b) => b.bidderId !== 'system').length;
}

export function isLotLive(lot: AuctionLot, now: number = Date.now()): boolean {
  return lot.status === 'live' && lot.endTime > now;
}

// Web Audio API synthesizer — zero external MP3 dependencies
let audioCtx: AudioContext | null = null;

function ensureAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtor) return null;
  if (!audioCtx) {
    audioCtx = new AudioCtor();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function playAuctionSound(
  type: 'bid' | 'outbid' | 'sold',
  enabled: boolean
): void {
  if (!enabled) return;
  const ctx = ensureAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const t = ctx.currentTime;
    if (type === 'bid') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(720, t);
      osc.frequency.exponentialRampToValueAtTime(340, t + 0.09);
      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
      osc.start(t);
      osc.stop(t + 0.09);
    } else if (type === 'outbid') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(520, t);
      osc.frequency.setValueAtTime(380, t + 0.08);
      gain.gain.setValueAtTime(0.09, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      osc.start(t);
      osc.stop(t + 0.18);
    } else {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, t);
      osc.frequency.setValueAtTime(659.25, t + 0.08);
      osc.frequency.setValueAtTime(783.99, t + 0.16);
      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.36);
      osc.start(t);
      osc.stop(t + 0.36);
    }
  } catch {
    // Ignore autoplay restrictions before user gesture
  }
}

export function exportAuditCSV(auctions: AuctionLot[]): void {
  const rows: Array<{
    time: string;
    rawTime: number;
    lotId: string;
    title: string;
    category: string;
    bidder: string;
    amount: number;
    mode: string;
  }> = [];

  auctions.forEach((lot) => {
    lot.bids.forEach((b) => {
      if (b.bidderId === 'system') return;
      rows.push({
        time: new Date(b.timestamp).toLocaleString('en-IN'),
        rawTime: b.timestamp,
        lotId: lot.id,
        title: lot.title,
        category: lot.category,
        bidder: b.bidderName,
        amount: b.amount,
        mode: b.isAutoPilot ? 'Auto-Pilot' : 'Manual',
      });
    });
  });

  rows.sort((a, b) => b.rawTime - a.rawTime);

  const header = 'Timestamp,Lot ID,Asset Name,Category,Bidder,Bid Amount (INR),Mode\n';
  const body = rows
    .map(
      (r) =>
        `"${r.time.replace(/"/g, '""')}","${r.lotId}","${r.title.replace(/"/g, '""')}","${r.category}","${r.bidder.replace(/"/g, '""')}",${r.amount},"${r.mode}"`
    )
    .join('\n');

  const blob = new Blob([header + body], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `autoauction_audit_${Date.now()}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
