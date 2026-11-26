import type {
  AssetSubtype,
  AuctionCategory,
  AuctionLot,
  BackendStatus,
  BidRecord,
  DemoSpeed,
  ServerStateSnapshot,
  UserAccount,
  UserRole,
  WalletTransaction,
} from '../types/auction';
import { getMinIncrement } from '../data/catalog';
import {
  SEED_USER_TEMPLATES,
  createSeedAuctions,
  createSeedTransactions,
} from '../data/seedData';
import { storage, type StoredCredential } from './storage';

const CATEGORY_PREFIX: Record<AuctionCategory, string> = {
  vehicles: 'VEH',
  real_estate: 'REA',
  bank: 'BNK',
  bullion: 'BUL',
  industrial: 'IND',
  gov_psu: 'PSU',
  logistics: 'LOG',
  electronics: 'ELC',
  luxury: 'LUX',
};

function randomId(prefix: string): string {
  const bytes = new Uint8Array(4);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${prefix}_${hex}`;
}

function randomHex(byteLen = 16): string {
  const bytes = new Uint8Array(byteLen);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function fallbackDigest(input: string): string {
  let h1 = 0xdeadbeef ^ input.length;
  let h2 = 0x41c6ce57 ^ input.length;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return `${(h2 >>> 0).toString(16).padStart(8, '0')}${(h1 >>> 0).toString(16).padStart(8, '0')}`;
}

async function hashPassword(password: string, salt?: string): Promise<{ hash: string; salt: string; algorithm: string }> {
  const actualSalt = salt || randomHex(16);
  const payload = `${actualSalt}:${password}`;
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoded = new TextEncoder().encode(payload);
    const digest = await crypto.subtle.digest('SHA-256', encoded);
    const hash = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
    return { hash, salt: actualSalt, algorithm: 'Salted SHA-256 (Web Crypto)' };
  }
  return { hash: fallbackDigest(payload), salt: actualSalt, algorithm: 'Salted Digest (Local)' };
}

export function getBrowserDeviceLabel(): string {
  if (typeof navigator === 'undefined') return 'Web Browser';
  const ua = navigator.userAgent || '';
  if (/iPhone/i.test(ua)) return /CriOS/i.test(ua) ? 'iPhone Chrome' : 'iPhone Safari';
  if (/iPad/i.test(ua)) return 'iPad Safari';
  if (/Android/i.test(ua)) return /EdgA/i.test(ua) ? 'Android Edge' : 'Android Chrome';
  if (/Windows/i.test(ua)) {
    if (/Edg\//i.test(ua)) return 'Windows Edge';
    if (/Firefox/i.test(ua)) return 'Windows Firefox';
    return 'Windows Chrome';
  }
  if (/Macintosh|Mac OS X/i.test(ua)) {
    return /Chrome\//i.test(ua) ? 'macOS Chrome' : 'macOS Safari';
  }
  return 'Web Browser';
}

function isMobileBrowser(): boolean {
  return /iPhone|iPad|Android/i.test(getBrowserDeviceLabel());
}

export interface CreateAuctionPayload {
  title: string;
  description: string;
  category: AuctionCategory;
  assetType: AssetSubtype;
  year: number;
  condition: AuctionLot['condition'];
  location: string;
  reservePrice: number;
  durationMinutes: number;
  specs?: string[];
}

class LocalAuctionEngine {
  private seeded = false;

  async ensureInitialized(): Promise<ServerStateSnapshot> {
    const existingUsers = storage.getUsers();
    const existingAuctions = storage.getAuctions();
    const existingCreds = storage.getCredentials();

    if (existingUsers.length === 0 || existingAuctions.length === 0 || existingCreds.length === 0) {
      await this.seedFresh(existingUsers, existingCreds);
    }
    this.seeded = true;
    return this.getSnapshot();
  }

  private async seedFresh(
    preserveUsers: UserAccount[] = [],
    preserveCreds: StoredCredential[] = []
  ): Promise<void> {
    const now = Date.now();
    const baseIds = new Set(SEED_USER_TEMPLATES.map((t) => t.id));

    const users: UserAccount[] = [];
    const creds: StoredCredential[] = [];

    for (const tpl of SEED_USER_TEMPLATES) {
      users.push({
        id: tpl.id,
        name: tpl.name,
        username: tpl.username,
        email: tpl.email,
        role: tpl.role,
        availableBalance: tpl.availableBalance,
        escrowBalance: 0,
        createdAt: now - 86400000 * 14,
      });
      const hashed = await hashPassword(tpl.password);
      creds.push({
        userId: tpl.id,
        salt: hashed.salt,
        hash: hashed.hash,
        algorithm: hashed.algorithm,
      });
    }

    // Keep any user-registered custom accounts across demo resets
    for (const u of preserveUsers) {
      if (baseIds.has(u.id)) continue;
      users.push({
        ...u,
        availableBalance: Math.max(u.availableBalance + u.escrowBalance, 15000000),
        escrowBalance: 0,
      });
      const cred = preserveCreds.find((c) => c.userId === u.id);
      if (cred) creds.push(cred);
    }

    const auctions = createSeedAuctions();
    const transactions = createSeedTransactions();

    // Reconcile initial escrow locks for currently leading demo bidders
    for (const lot of auctions) {
      if (lot.status !== 'live') continue;
      const top = lot.bids[lot.bids.length - 1];
      if (top && top.bidderId !== 'system') {
        const u = users.find((x) => x.id === top.bidderId);
        if (u && u.availableBalance >= top.amount) {
          u.availableBalance -= top.amount;
          u.escrowBalance += top.amount;
        }
      }
    }

    storage.saveUsers(users);
    storage.saveCredentials(creds);
    storage.saveAuctions(auctions);
    storage.saveTransactions(transactions);
    storage.saveBotSpeed(0);
  }

  getBackendStatus(): BackendStatus {
    const mobile = isMobileBrowser();
    const session = storage.getSession();
    return {
      storageMode: 'memory',
      storageLabel: 'Browser LocalStorage (Pure React + Vite)',
      connectedDevices: {
        total: 1,
        mobile: mobile ? 1 : 0,
        desktop: mobile ? 0 : 1,
      },
      activeSessionCount: session ? 1 : 0,
      hashAlgorithm: 'Salted SHA-256 (Web Crypto)',
    };
  }

  getSnapshot(): ServerStateSnapshot {
    const botSpeed = storage.getBotSpeed();
    return {
      users: storage.getUsers(),
      auctions: storage.getAuctions(),
      transactions: storage.getTransactions(),
      botActivityEnabled: botSpeed > 0,
      botSpeed,
      backendStatus: this.getBackendStatus(),
      serverTime: Date.now(),
    };
  }

  // --- AUTHENTICATION ---
  async login(
    identifier: string,
    password: string
  ): Promise<{ user: UserAccount; token: string } | { error: string }> {
    if (!this.seeded) await this.ensureInitialized();
    const users = storage.getUsers();
    const creds = storage.getCredentials();
    const norm = identifier.trim().toLowerCase();

    const user = users.find(
      (u) => u.username.toLowerCase() === norm || u.email.toLowerCase() === norm
    );
    if (!user) return { error: 'Account not found. Check your username or email.' };

    const cred = creds.find((c) => c.userId === user.id);
    if (!cred) return { error: 'Credentials missing for this account. Try resetting demo data.' };

    const check = await hashPassword(password, cred.salt);
    if (check.hash !== cred.hash) {
      return { error: 'Incorrect password. Demo accounts use "demo123".' };
    }

    const token = `local_${user.id}_${randomHex(12)}`;
    return { user, token };
  }

  async register(input: {
    name: string;
    username: string;
    email: string;
    password: string;
    role: UserRole;
  }): Promise<{ user: UserAccount; token: string } | { error: string }> {
    if (!this.seeded) await this.ensureInitialized();
    const users = storage.getUsers();
    const creds = storage.getCredentials();
    const txns = storage.getTransactions();

    const cleanName = input.name.trim();
    const cleanUsername = input.username.trim().toLowerCase();
    const cleanEmail = input.email.trim().toLowerCase();

    if (cleanName.length < 2) return { error: 'Full name must be at least 2 characters.' };
    if (!/^[a-z0-9_]{3,24}$/.test(cleanUsername)) {
      return { error: 'Username must be 3–24 letters, numbers, or underscores.' };
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return { error: 'Enter a valid email address.' };
    }
    if (input.password.length < 6) {
      return { error: 'Password must be at least 6 characters.' };
    }
    if (users.some((u) => u.username.toLowerCase() === cleanUsername)) {
      return { error: 'This username is already taken.' };
    }
    if (users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      return { error: 'An account with this email already exists.' };
    }

    const validRole: UserRole = ['user', 'seller', 'admin'].includes(input.role)
      ? input.role
      : 'user';
    const openingBalance = validRole === 'seller' ? 5000000 : 25000000;
    const now = Date.now();
    const newUser: UserAccount = {
      id: randomId('usr'),
      name: cleanName,
      username: cleanUsername,
      email: cleanEmail,
      role: validRole,
      availableBalance: openingBalance,
      escrowBalance: 0,
      createdAt: now,
    };

    const hashed = await hashPassword(input.password);
    creds.push({
      userId: newUser.id,
      salt: hashed.salt,
      hash: hashed.hash,
      algorithm: hashed.algorithm,
    });
    users.push(newUser);
    txns.unshift({
      id: randomId('txn'),
      userId: newUser.id,
      type: 'top_up',
      amount: openingBalance,
      note: 'Opening verified escrow wallet credit',
      timestamp: now,
    });

    storage.saveUsers(users);
    storage.saveCredentials(creds);
    storage.saveTransactions(txns);

    const token = `local_${newUser.id}_${randomHex(12)}`;
    return { user: newUser, token };
  }

  // --- WALLET ---
  topUpWallet(
    userId: string,
    amount: number
  ): { user: UserAccount; txn: WalletTransaction } | { error: string } {
    const cleanAmt = Math.round(Number(amount));
    if (!Number.isFinite(cleanAmt) || cleanAmt < 10000 || cleanAmt > 500000000) {
      return { error: 'Top-up amount must be between ₹10,000 and ₹50 Crore.' };
    }
    const users = storage.getUsers();
    const user = users.find((u) => u.id === userId);
    if (!user) return { error: 'Account not found.' };

    user.availableBalance += cleanAmt;
    const txn: WalletTransaction = {
      id: randomId('txn'),
      userId: user.id,
      type: 'top_up',
      amount: cleanAmt,
      note: 'Instant wallet deposit via LocalStorage Escrow',
      timestamp: Date.now(),
    };
    const txns = [txn, ...storage.getTransactions()];
    storage.saveUsers(users);
    storage.saveTransactions(txns);
    return { user, txn };
  }

  // --- BIDDING & ESCROW ---
  placeBid(
    lotId: string,
    bidderId: string,
    rawAmount: number,
    isAutoPilot = false,
    deviceOverride?: string
  ):
    | { lot: AuctionLot; outbidUserId?: string; autoPilotTriggered?: boolean }
    | { error: string } {
    const amount = Math.round(Number(rawAmount));
    const users = storage.getUsers();
    const auctions = storage.getAuctions();
    const txns = storage.getTransactions();

    const bidder = users.find((u) => u.id === bidderId);
    if (!bidder) return { error: 'Sign in to place a bid.' };

    const lot = auctions.find((a) => a.id === lotId);
    if (!lot) return { error: 'Auction lot not found.' };
    if (lot.status !== 'live') return { error: 'This auction is not currently live.' };

    const now = Date.now();
    if (lot.endTime <= now) return { error: 'This auction has already ended.' };
    if (lot.sellerId === bidder.id && bidder.role !== 'admin') {
      return { error: 'Sellers cannot bid on their own listing.' };
    }

    const prevTop = lot.bids[lot.bids.length - 1];
    const currentHighest = prevTop?.amount ?? lot.reservePrice;
    const minInc = getMinIncrement(lot.reservePrice);
    const minAllowed =
      prevTop && prevTop.bidderId !== 'system' ? currentHighest + minInc : lot.reservePrice;

    if (!Number.isFinite(amount) || amount < minAllowed) {
      return { error: `Minimum valid bid is ₹${minAllowed.toLocaleString('en-IN')}.` };
    }

    const alreadyLeading = prevTop && prevTop.bidderId === bidder.id;
    const neededAdditional = alreadyLeading ? amount - prevTop.amount : amount;
    if (bidder.availableBalance < neededAdditional) {
      return { error: 'Insufficient available balance. Add funds in your Wallet first.' };
    }

    let outbidUserId: string | undefined;

    // Release previous leader's escrow hold if another user was leading
    if (prevTop && prevTop.bidderId !== 'system' && !alreadyLeading) {
      const prevLeader = users.find((u) => u.id === prevTop.bidderId);
      if (prevLeader) {
        const releaseAmt = Math.min(prevLeader.escrowBalance, prevTop.amount);
        prevLeader.escrowBalance -= releaseAmt;
        prevLeader.availableBalance += releaseAmt;
        outbidUserId = prevLeader.id;
        txns.unshift({
          id: randomId('txn'),
          userId: prevLeader.id,
          type: 'escrow_release',
          amount: releaseAmt,
          lotId: lot.id,
          lotTitle: lot.title,
          note: `Escrow released after being outbid on ${lot.id}`,
          timestamp: now,
        });
      }
    }

    // Lock new escrow hold
    bidder.availableBalance -= neededAdditional;
    bidder.escrowBalance += neededAdditional;
    txns.unshift({
      id: randomId('txn'),
      userId: bidder.id,
      type: 'escrow_hold',
      amount: neededAdditional,
      lotId: lot.id,
      lotTitle: lot.title,
      note: isAutoPilot
        ? `Auto-Pilot escrow lock on ${lot.id}`
        : `Escrow lock for live bid on ${lot.id}`,
      timestamp: now,
    });

    const bidRecord: BidRecord = {
      id: randomId('bid'),
      bidderId: bidder.id,
      bidderName: bidder.name,
      amount,
      timestamp: now,
      isAutoPilot,
      deviceLabel: deviceOverride || (isAutoPilot ? 'Auto-Pilot Engine' : getBrowserDeviceLabel()),
    };
    lot.bids.push(bidRecord);

    // Anti-snipe protection: extend by 30s if bid arrives in final 30s
    if (lot.endTime - now < 30000) {
      lot.endTime = now + 30000;
    }

    let autoPilotTriggered = false;

    // Trigger Auto-Pilot proxy counter-bid if another user armed a higher ceiling
    if (
      lot.proxyBid &&
      lot.proxyBid.bidderId !== bidder.id &&
      lot.proxyBid.maxLimit >= amount + minInc
    ) {
      const proxyUser = users.find((u) => u.id === lot.proxyBid!.bidderId);
      const counterAmt = Math.min(lot.proxyBid.maxLimit, amount + minInc);
      if (proxyUser && proxyUser.availableBalance >= counterAmt) {
        // Release challenger's hold immediately
        const releaseChallenger = Math.min(bidder.escrowBalance, amount);
        bidder.escrowBalance -= releaseChallenger;
        bidder.availableBalance += releaseChallenger;
        outbidUserId = bidder.id;
        txns.unshift({
          id: randomId('txn'),
          userId: bidder.id,
          type: 'escrow_release',
          amount: releaseChallenger,
          lotId: lot.id,
          lotTitle: lot.title,
          note: `Escrow released after Auto-Pilot counter-bid on ${lot.id}`,
          timestamp: now + 10,
        });

        proxyUser.availableBalance -= counterAmt;
        proxyUser.escrowBalance += counterAmt;
        txns.unshift({
          id: randomId('txn'),
          userId: proxyUser.id,
          type: 'escrow_hold',
          amount: counterAmt,
          lotId: lot.id,
          lotTitle: lot.title,
          note: `Auto-Pilot counter-bid lock on ${lot.id}`,
          timestamp: now + 12,
        });

        lot.bids.push({
          id: randomId('bid'),
          bidderId: proxyUser.id,
          bidderName: proxyUser.name,
          amount: counterAmt,
          timestamp: now + 15,
          isAutoPilot: true,
          deviceLabel: 'Auto-Pilot Engine',
        });
        autoPilotTriggered = true;
      }
    }

    storage.saveUsers(users);
    storage.saveAuctions(auctions);
    storage.saveTransactions(txns.slice(0, 300));
    return { lot, outbidUserId, autoPilotTriggered };
  }

  setProxyBid(
    lotId: string,
    bidderId: string,
    maxLimit: number | null
  ): { lot: AuctionLot } | { error: string } {
    const users = storage.getUsers();
    const auctions = storage.getAuctions();
    const bidder = users.find((u) => u.id === bidderId);
    if (!bidder) return { error: 'Account not found.' };

    const lot = auctions.find((a) => a.id === lotId);
    if (!lot) return { error: 'Lot not found.' };
    if (lot.status !== 'live' || lot.endTime <= Date.now()) {
      return { error: 'Auto-Pilot can only be set on live auctions.' };
    }

    if (maxLimit === null) {
      if (lot.proxyBid?.bidderId === bidder.id) {
        lot.proxyBid = null;
        storage.saveAuctions(auctions);
      }
      return { lot };
    }

    const cleanMax = Math.round(Number(maxLimit));
    const prevTop = lot.bids[lot.bids.length - 1];
    const minInc = getMinIncrement(lot.reservePrice);
    const currentHighest = prevTop?.amount ?? lot.reservePrice;
    const minNeeded =
      prevTop && prevTop.bidderId === bidder.id
        ? currentHighest + minInc
        : prevTop && prevTop.bidderId !== 'system'
          ? currentHighest + minInc
          : lot.reservePrice;

    if (!Number.isFinite(cleanMax) || cleanMax < minNeeded) {
      return {
        error: `Auto-Pilot ceiling must be at least ₹${minNeeded.toLocaleString('en-IN')}.`,
      };
    }

    const existingHold = prevTop && prevTop.bidderId === bidder.id ? prevTop.amount : 0;
    if (bidder.availableBalance + existingHold < cleanMax) {
      return { error: 'Your available balance + current hold is below this Auto-Pilot ceiling.' };
    }

    lot.proxyBid = {
      bidderId: bidder.id,
      bidderName: bidder.name,
      maxLimit: cleanMax,
    };
    storage.saveAuctions(auctions);

    // If not currently leading, place an immediate minimum Auto-Pilot bid
    if (!prevTop || prevTop.bidderId !== bidder.id) {
      const nextBid =
        prevTop && prevTop.bidderId !== 'system' ? currentHighest + minInc : lot.reservePrice;
      const placed = this.placeBid(lot.id, bidder.id, nextBid, true, 'Auto-Pilot Engine');
      if ('error' in placed) return placed;
      return { lot: placed.lot };
    }

    return { lot };
  }

  // --- SELLER & ADMIN CRUD ---
  createAuction(
    userId: string,
    input: CreateAuctionPayload
  ): { lot: AuctionLot } | { error: string } {
    const users = storage.getUsers();
    const user = users.find((u) => u.id === userId);
    if (!user) return { error: 'Account not found.' };
    if (user.role !== 'seller' && user.role !== 'admin') {
      return { error: 'Only Seller or Admin accounts can list assets.' };
    }

    const title = input.title.trim();
    const description = input.description.trim();
    const location = input.location.trim();
    const reservePrice = Math.round(Number(input.reservePrice));
    const durationMinutes = Math.max(5, Math.min(240, Math.round(Number(input.durationMinutes) || 20)));

    if (title.length < 4) return { error: 'Title must be at least 4 characters.' };
    if (description.length < 10) return { error: 'Provide a short asset description.' };
    if (!location) return { error: 'Enter a city/location.' };
    if (!Number.isFinite(reservePrice) || reservePrice < 10000) {
      return { error: 'Reserve price must be at least ₹10,000.' };
    }

    const now = Date.now();
    const prefix = CATEGORY_PREFIX[input.category] || 'LOT';
    const id = `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
    const status = user.role === 'admin' ? 'live' : 'pending_approval';

    const lot: AuctionLot = {
      id,
      category: input.category,
      assetType: input.assetType,
      title,
      description,
      year: Math.max(1950, Math.min(2026, Number(input.year) || 2024)),
      condition: input.condition || 'A',
      location,
      sellerId: user.id,
      sellerName: user.name,
      reservePrice,
      endTime: now + durationMinutes * 60 * 1000,
      status,
      specs:
        input.specs && input.specs.length > 0
          ? input.specs.filter(Boolean).slice(0, 4)
          : ['Verified Asset', `Condition ${input.condition || 'A'}`, location],
      bids: [
        {
          id: randomId('bid_sys'),
          bidderId: 'system',
          bidderName: 'Reserve Opening',
          amount: reservePrice,
          timestamp: now,
          deviceLabel: 'System',
        },
      ],
      proxyBid: null,
      createdAt: now,
    };

    const auctions = [lot, ...storage.getAuctions()];
    storage.saveAuctions(auctions);
    return { lot };
  }

  updateAuction(
    userId: string,
    lotId: string,
    patch: Partial<
      Pick<
        AuctionLot,
        'title' | 'description' | 'location' | 'condition' | 'reservePrice' | 'assetType' | 'category'
      >
    >
  ): { lot: AuctionLot } | { error: string } {
    const users = storage.getUsers();
    const user = users.find((u) => u.id === userId);
    if (!user) return { error: 'Account not found.' };

    const auctions = storage.getAuctions();
    const lot = auctions.find((a) => a.id === lotId);
    if (!lot) return { error: 'Lot not found.' };
    if (lot.sellerId !== user.id && user.role !== 'admin') {
      return { error: 'You can only edit your own listings.' };
    }

    if (patch.title && patch.title.trim().length >= 4) lot.title = patch.title.trim();
    if (patch.description && patch.description.trim().length >= 8) {
      lot.description = patch.description.trim();
    }
    if (patch.location && patch.location.trim()) lot.location = patch.location.trim();
    if (patch.condition) lot.condition = patch.condition;
    if (patch.category) lot.category = patch.category;
    if (patch.assetType) lot.assetType = patch.assetType;
    if (
      patch.reservePrice !== undefined &&
      Number.isFinite(patch.reservePrice) &&
      patch.reservePrice >= 10000 &&
      lot.bids.filter((b) => b.bidderId !== 'system').length === 0
    ) {
      lot.reservePrice = Math.round(patch.reservePrice);
      if (lot.bids[0]?.bidderId === 'system') {
        lot.bids[0].amount = lot.reservePrice;
      }
    }

    storage.saveAuctions(auctions);
    return { lot };
  }

  deleteAuction(userId: string, lotId: string): { deletedId: string } | { error: string } {
    const users = storage.getUsers();
    const user = users.find((u) => u.id === userId);
    if (!user) return { error: 'Account not found.' };

    const auctions = storage.getAuctions();
    const idx = auctions.findIndex((a) => a.id === lotId);
    if (idx === -1) return { error: 'Lot not found.' };
    const lot = auctions[idx];

    if (lot.sellerId !== user.id && user.role !== 'admin') {
      return { error: 'Permission denied.' };
    }

    // Refund leading bidder's escrow if live lot is removed
    const txns = storage.getTransactions();
    const top = lot.bids[lot.bids.length - 1];
    if (lot.status === 'live' && top && top.bidderId !== 'system') {
      const leader = users.find((u) => u.id === top.bidderId);
      if (leader) {
        const refund = Math.min(leader.escrowBalance, top.amount);
        leader.escrowBalance -= refund;
        leader.availableBalance += refund;
        txns.unshift({
          id: randomId('txn'),
          userId: leader.id,
          type: 'escrow_release',
          amount: refund,
          lotId: lot.id,
          lotTitle: lot.title,
          note: `Escrow refunded after lot ${lot.id} was removed`,
          timestamp: Date.now(),
        });
      }
    }

    auctions.splice(idx, 1);
    storage.saveUsers(users);
    storage.saveAuctions(auctions);
    storage.saveTransactions(txns);
    return { deletedId: lotId };
  }

  moderateAuction(
    adminId: string,
    lotId: string,
    decision: 'approve' | 'reject',
    reason?: string
  ): { lot: AuctionLot } | { error: string } {
    const users = storage.getUsers();
    const admin = users.find((u) => u.id === adminId);
    if (!admin || admin.role !== 'admin') return { error: 'Admin access required.' };

    const auctions = storage.getAuctions();
    const lot = auctions.find((a) => a.id === lotId);
    if (!lot) return { error: 'Lot not found.' };

    if (decision === 'approve') {
      lot.status = 'live';
      lot.rejectionReason = undefined;
      if (lot.endTime <= Date.now() + 120000) {
        lot.endTime = Date.now() + 25 * 60 * 1000;
      }
    } else {
      lot.status = 'rejected';
      lot.rejectionReason = reason?.trim() || 'Incomplete asset documentation.';
    }

    storage.saveAuctions(auctions);
    return { lot };
  }

  updateUserRole(
    adminId: string,
    targetUserId: string,
    role: UserRole
  ): { user: UserAccount } | { error: string } {
    const users = storage.getUsers();
    const admin = users.find((u) => u.id === adminId);
    if (!admin || admin.role !== 'admin') return { error: 'Admin access required.' };
    if (adminId === targetUserId) return { error: 'You cannot change your own active admin role.' };
    if (!['user', 'seller', 'admin'].includes(role)) return { error: 'Invalid role.' };

    const target = users.find((u) => u.id === targetUserId);
    if (!target) return { error: 'User not found.' };
    target.role = role;
    storage.saveUsers(users);
    return { user: target };
  }

  deleteUser(adminId: string, targetUserId: string): { deletedId: string } | { error: string } {
    const users = storage.getUsers();
    const admin = users.find((u) => u.id === adminId);
    if (!admin || admin.role !== 'admin') return { error: 'Admin access required.' };
    if (adminId === targetUserId) return { error: 'Cannot delete the currently logged-in admin.' };

    const nextUsers = users.filter((u) => u.id !== targetUserId);
    if (nextUsers.length === users.length) return { error: 'User not found.' };

    storage.saveUsers(nextUsers);
    storage.saveCredentials(storage.getCredentials().filter((c) => c.userId !== targetUserId));
    return { deletedId: targetUserId };
  }

  // --- SETTLEMENT & DEMO CONTROLS ---
  settleExpiredAuctions(): AuctionLot[] {
    const now = Date.now();
    const users = storage.getUsers();
    const auctions = storage.getAuctions();
    const txns = storage.getTransactions();
    const settled: AuctionLot[] = [];

    for (const lot of auctions) {
      if (lot.status !== 'live' || lot.endTime > now) continue;
      const topBid = lot.bids[lot.bids.length - 1];
      if (topBid && topBid.bidderId !== 'system') {
        lot.status = 'sold';
        const winner = users.find((u) => u.id === topBid.bidderId);
        if (winner) {
          const deduct = Math.min(winner.escrowBalance, topBid.amount);
          winner.escrowBalance -= deduct;
          txns.unshift({
            id: randomId('txn'),
            userId: winner.id,
            type: 'settlement_debit',
            amount: topBid.amount,
            lotId: lot.id,
            lotTitle: lot.title,
            note: `Final settlement for won lot ${lot.id}`,
            timestamp: now,
          });
        }
        const commission = Math.round(topBid.amount * 0.02);
        const sellerNet = topBid.amount - commission;
        const seller = users.find((u) => u.id === lot.sellerId);
        if (seller) {
          seller.availableBalance += sellerNet;
          txns.unshift({
            id: randomId('txn'),
            userId: seller.id,
            type: 'seller_payout',
            amount: sellerNet,
            lotId: lot.id,
            lotTitle: lot.title,
            note: `Net payout (98%) for sold lot ${lot.id}`,
            timestamp: now,
          });
        }
        txns.unshift({
          id: randomId('txn'),
          userId: 'usr_admin',
          type: 'platform_fee',
          amount: commission,
          lotId: lot.id,
          lotTitle: lot.title,
          note: `2% platform settlement commission on ${lot.id}`,
          timestamp: now,
        });
      } else {
        lot.status = 'unsold';
      }
      settled.push(lot);
    }

    if (settled.length > 0) {
      storage.saveUsers(users);
      storage.saveAuctions(auctions);
      storage.saveTransactions(txns.slice(0, 300));
    }
    return settled;
  }

  setBotSpeed(adminId: string, speed: DemoSpeed): { speed: DemoSpeed; enabled: boolean } | { error: string } {
    const admin = storage.getUsers().find((u) => u.id === adminId);
    if (!admin || admin.role !== 'admin') return { error: 'Admin access required.' };
    if (![0, 1, 2, 5, 10].includes(speed)) return { error: 'Invalid speed.' };
    storage.saveBotSpeed(speed);
    return { speed, enabled: speed > 0 };
  }

  triggerBiddingWarStep(
    lotId: string,
    sourceLabel = 'Demo War Burst'
  ): { lot: AuctionLot; outbidUserId?: string; autoPilotTriggered?: boolean } | null {
    const auctions = storage.getAuctions();
    const lot = auctions.find((a) => a.id === lotId);
    if (!lot || lot.status !== 'live' || lot.endTime <= Date.now()) return null;

    const users = storage.getUsers();
    const botPool = users.filter((u) => u.id === 'usr_meera' || u.id === 'usr_vikram');
    if (botPool.length === 0) return null;

    const topBid = lot.bids[lot.bids.length - 1];
    const eligible = botPool.filter((b) => b.id !== topBid?.bidderId);
    const bot = eligible.length > 0 ? eligible[Math.floor(Math.random() * eligible.length)] : botPool[0];
    const nextAmt = (topBid?.amount ?? lot.reservePrice) + getMinIncrement(lot.reservePrice);

    if (bot.availableBalance < nextAmt) {
      bot.availableBalance += nextAmt + 50000000;
      storage.saveUsers(users);
    }

    const res = this.placeBid(lot.id, bot.id, nextAmt, false, sourceLabel);
    if ('error' in res) return null;
    return res;
  }

  runBotTick(): { lot: AuctionLot; outbidUserId?: string; autoPilotTriggered?: boolean } | null {
    const speed = storage.getBotSpeed();
    if (speed === 0) return null;
    const liveLots = storage.getAuctions().filter((a) => a.status === 'live' && a.endTime > Date.now());
    if (liveLots.length === 0) return null;
    const target = liveLots[Math.floor(Math.random() * liveLots.length)];
    return this.triggerBiddingWarStep(target.id, `Demo Bot (${speed}x)`);
  }

  async resetDemoMarket(adminId: string): Promise<{ ok: true; totalLots: number } | { error: string }> {
    const users = storage.getUsers();
    const admin = users.find((u) => u.id === adminId);
    if (!admin || admin.role !== 'admin') return { error: 'Admin access required.' };
    await this.seedFresh(users, storage.getCredentials());
    return { ok: true, totalLots: storage.getAuctions().length };
  }

  replenishDemoMarket(adminId: string): { added: number } | { error: string } {
    const admin = storage.getUsers().find((u) => u.id === adminId);
    if (!admin || admin.role !== 'admin') return { error: 'Admin access required.' };

    const pool = createSeedAuctions().filter((l) => l.status === 'live');
    const picks = [pool[0], pool[4], pool[12], pool[23]].filter(Boolean);
    const fresh = picks.map((lot) => ({
      ...lot,
      id: `${lot.id.slice(0, 3)}-${Math.floor(1000 + Math.random() * 9000)}`,
      endTime: Date.now() + (15 + Math.floor(Math.random() * 20)) * 60 * 1000,
      status: 'live' as const,
      createdAt: Date.now(),
    }));
    storage.saveAuctions([...fresh, ...storage.getAuctions()]);
    return { added: fresh.length };
  }
}

export const localEngine = new LocalAuctionEngine();
