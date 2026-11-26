import type {
  AuctionLot,
  AuthSession,
  DemoSpeed,
  UserAccount,
  WalletTransaction,
} from '../types/auction';

export interface StoredCredential {
  userId: string;
  salt: string;
  hash: string;
  algorithm: string;
}

/**
 * Clean, inspectable LocalStorage keys for pure React + Vite browser persistence.
 * Every entity supports Create, Read, Update, and Delete operations.
 */
export const STORAGE_KEYS = {
  USERS: 'autoauction_users_v1',
  CREDENTIALS: 'autoauction_credentials_v1',
  SESSION: 'autoauction_session_v1',
  AUCTIONS: 'autoauction_auctions_v1',
  WATCHLIST: 'autoauction_watchlist_v1',
  TRANSACTIONS: 'autoauction_wallet_txns_v1',
  BOT_SPEED: 'autoauction_bot_speed_v1',
  THEME: 'autoauction_theme_v1',
  SOUND: 'autoauction_sound_v1',
} as const;

function safeRead<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeWrite<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Handle storage quota errors gracefully
  }
}

function safeRemove(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore storage errors
  }
}

export const storage = {
  // --- SESSION CRUD (Refresh-safe; never stores raw passwords) ---
  getSession(): AuthSession | null {
    return safeRead<AuthSession | null>(STORAGE_KEYS.SESSION, null);
  },
  saveSession(session: AuthSession): void {
    safeWrite(STORAGE_KEYS.SESSION, session);
  },
  clearSession(): void {
    safeRemove(STORAGE_KEYS.SESSION);
  },

  // --- CREDENTIALS (Salted one-way hashes kept separate from public user records) ---
  getCredentials(): StoredCredential[] {
    return safeRead<StoredCredential[]>(STORAGE_KEYS.CREDENTIALS, []);
  },
  saveCredentials(creds: StoredCredential[]): void {
    safeWrite(STORAGE_KEYS.CREDENTIALS, creds);
  },

  // --- USERS CRUD ---
  getUsers(): UserAccount[] {
    return safeRead<UserAccount[]>(STORAGE_KEYS.USERS, []);
  },
  saveUsers(users: UserAccount[]): void {
    safeWrite(STORAGE_KEYS.USERS, users);
  },
  upsertUser(user: UserAccount): UserAccount[] {
    const users = this.getUsers();
    const idx = users.findIndex((u) => u.id === user.id);
    const next = idx >= 0 ? users.map((u, i) => (i === idx ? user : u)) : [...users, user];
    this.saveUsers(next);
    return next;
  },
  removeUser(userId: string): UserAccount[] {
    const next = this.getUsers().filter((u) => u.id !== userId);
    this.saveUsers(next);
    return next;
  },

  // --- AUCTIONS CRUD ---
  getAuctions(): AuctionLot[] {
    return safeRead<AuctionLot[]>(STORAGE_KEYS.AUCTIONS, []);
  },
  saveAuctions(auctions: AuctionLot[]): void {
    safeWrite(STORAGE_KEYS.AUCTIONS, auctions);
  },
  upsertAuction(lot: AuctionLot): AuctionLot[] {
    const list = this.getAuctions();
    const idx = list.findIndex((a) => a.id === lot.id);
    const next = idx >= 0 ? list.map((a, i) => (i === idx ? lot : a)) : [lot, ...list];
    this.saveAuctions(next);
    return next;
  },
  removeAuction(lotId: string): AuctionLot[] {
    const next = this.getAuctions().filter((a) => a.id !== lotId);
    this.saveAuctions(next);
    return next;
  },

  // --- WATCHLIST CRUD (per-user map of lot IDs) ---
  getWatchlistMap(): Record<string, string[]> {
    return safeRead<Record<string, string[]>>(STORAGE_KEYS.WATCHLIST, {});
  },
  getUserWatchlist(userId: string): string[] {
    return this.getWatchlistMap()[userId] ?? [];
  },
  toggleWatchlist(userId: string, lotId: string): string[] {
    const map = this.getWatchlistMap();
    const current = new Set(map[userId] ?? []);
    if (current.has(lotId)) {
      current.delete(lotId);
    } else {
      current.add(lotId);
    }
    const updated = Array.from(current);
    safeWrite(STORAGE_KEYS.WATCHLIST, { ...map, [userId]: updated });
    return updated;
  },

  // --- WALLET TRANSACTIONS CRUD ---
  getTransactions(): WalletTransaction[] {
    return safeRead<WalletTransaction[]>(STORAGE_KEYS.TRANSACTIONS, []);
  },
  saveTransactions(txns: WalletTransaction[]): void {
    safeWrite(STORAGE_KEYS.TRANSACTIONS, txns);
  },

  // --- DEMO SPEED ---
  getBotSpeed(): DemoSpeed {
    const saved = safeRead<number>(STORAGE_KEYS.BOT_SPEED, 0);
    return ([0, 1, 2, 5, 10].includes(saved) ? saved : 0) as DemoSpeed;
  },
  saveBotSpeed(speed: DemoSpeed): void {
    safeWrite(STORAGE_KEYS.BOT_SPEED, speed);
  },

  // --- PREFERENCES ---
  getTheme(): 'dark' | 'light' {
    const saved = safeRead<'dark' | 'light' | null>(STORAGE_KEYS.THEME, null);
    return saved === 'light' ? 'light' : 'dark';
  },
  saveTheme(theme: 'dark' | 'light'): void {
    safeWrite(STORAGE_KEYS.THEME, theme);
  },
  getSoundEnabled(): boolean {
    return safeRead<boolean>(STORAGE_KEYS.SOUND, false);
  },
  saveSoundEnabled(enabled: boolean): void {
    safeWrite(STORAGE_KEYS.SOUND, enabled);
  },
};
