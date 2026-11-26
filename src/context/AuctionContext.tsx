import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type {
  AssetSubtype,
  AuctionCategory,
  AuctionLot,
  AuthSession,
  BackendStatus,
  DemoSpeed,
  ServerStateSnapshot,
  ToastItem,
  UserAccount,
  UserRole,
  WalletTransaction,
} from '../types/auction';
import { storage, STORAGE_KEYS } from '../services/storage';
import { localEngine } from '../services/localEngine';
import { formatINR, playAuctionSound } from '../utils/format';

interface ActionResult {
  ok: boolean;
  error?: string;
}

interface CreateAuctionInput {
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

interface AuctionContextValue {
  session: AuthSession | null;
  currentUser: UserAccount | null;
  users: UserAccount[];
  auctions: AuctionLot[];
  transactions: WalletTransaction[];
  watchlist: string[];
  botActivityEnabled: boolean;
  botSpeed: DemoSpeed;
  backendStatus: BackendStatus | null;
  isHydrating: boolean;
  wsConnected: boolean;
  theme: 'dark' | 'light';
  soundEnabled: boolean;
  now: number;
  flashedLots: Record<string, number>;
  toasts: ToastItem[];
  toggleTheme: () => void;
  toggleSound: () => void;
  dismissToast: (id: string) => void;
  pushToast: (toast: Omit<ToastItem, 'id'>) => void;
  login: (identifier: string, password: string) => Promise<ActionResult>;
  register: (input: {
    name: string;
    username: string;
    email: string;
    password: string;
    role: UserRole;
  }) => Promise<ActionResult>;
  logout: () => void;
  toggleWatchlist: (lotId: string) => void;
  placeBid: (lotId: string, amount: number) => Promise<ActionResult>;
  setProxyBid: (lotId: string, maxLimit: number | null) => Promise<ActionResult>;
  topUpWallet: (amount: number) => Promise<ActionResult>;
  createAuction: (input: CreateAuctionInput) => Promise<ActionResult>;
  updateAuction: (
    lotId: string,
    patch: Partial<
      Pick<
        AuctionLot,
        'title' | 'description' | 'location' | 'condition' | 'reservePrice' | 'assetType' | 'category'
      >
    >
  ) => Promise<ActionResult>;
  deleteAuction: (lotId: string) => Promise<ActionResult>;
  moderateAuction: (
    lotId: string,
    decision: 'approve' | 'reject',
    reason?: string
  ) => Promise<ActionResult>;
  updateUserRole: (userId: string, role: UserRole) => Promise<ActionResult>;
  deleteUser: (userId: string) => Promise<ActionResult>;
  toggleBotActivity: () => Promise<ActionResult>;
  setBotSpeed: (speed: DemoSpeed) => Promise<ActionResult>;
  triggerBiddingWar: (lotId: string) => Promise<ActionResult>;
  resetDemoMarket: () => Promise<ActionResult>;
  replenishMarket: () => Promise<ActionResult>;
}

const SPEED_INTERVAL_MS: Record<DemoSpeed, number | null> = {
  0: null,
  1: 4500,
  2: 2200,
  5: 900,
  10: 450,
};

interface SyncBroadcastMessage {
  type: 'state:sync' | 'bid:placed' | 'auction:settled';
  lotId?: string;
  outbidUserId?: string;
}

const SYNC_CHANNEL_NAME = 'autoauction_local_sync_v1';

const AuctionContext = createContext<AuctionContextValue | null>(null);

export const AuctionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<AuthSession | null>(() => storage.getSession());
  const [users, setUsers] = useState<UserAccount[]>(() => storage.getUsers());
  const [auctions, setAuctions] = useState<AuctionLot[]>(() => storage.getAuctions());
  const [transactions, setTransactions] = useState<WalletTransaction[]>(() =>
    storage.getTransactions()
  );
  const [watchlist, setWatchlist] = useState<string[]>(() => {
    const s = storage.getSession();
    return s ? storage.getUserWatchlist(s.userId) : [];
  });
  const [botSpeed, setBotSpeedState] = useState<DemoSpeed>(() => storage.getBotSpeed());
  const [backendStatus, setBackendStatus] = useState<BackendStatus | null>(() =>
    localEngine.getBackendStatus()
  );
  const [isHydrating, setIsHydrating] = useState(true);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => storage.getTheme());
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => storage.getSoundEnabled());
  const [now, setNow] = useState<number>(() => Date.now());
  const [flashedLots, setFlashedLots] = useState<Record<string, number>>({});
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const sessionRef = useRef(session);
  const soundRef = useRef(soundEnabled);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const activeWarTimersRef = useRef<Set<number>>(new Set());

  sessionRef.current = session;
  soundRef.current = soundEnabled;

  // Apply Tailwind v4 .dark class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', theme === 'dark' ? '#0B1120' : '#F8FAFC');
    }
    storage.saveTheme(theme);
  }, [theme]);

  // Global 1-second clock for live countdowns
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const pushToast = useCallback((toast: Omit<ToastItem, 'id'>) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [{ ...toast, id }, ...prev].slice(0, 4));
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4200);
  }, []);

  const applySnapshot = useCallback((snapshot: ServerStateSnapshot) => {
    setUsers(snapshot.users);
    setAuctions(snapshot.auctions);
    setTransactions(snapshot.transactions);
    setBotSpeedState(snapshot.botSpeed);
    if (snapshot.backendStatus) {
      setBackendStatus(snapshot.backendStatus);
    }

    // Keep stored session role/name synced if admin changed role or deleted account
    const current = sessionRef.current;
    if (current) {
      const updatedMe = snapshot.users.find((u) => u.id === current.userId);
      if (!updatedMe) {
        storage.clearSession();
        setSession(null);
        setWatchlist([]);
      } else if (updatedMe.role !== current.role || updatedMe.name !== current.name) {
        const nextSession: AuthSession = {
          ...current,
          role: updatedMe.role,
          name: updatedMe.name,
        };
        setSession(nextSession);
        storage.saveSession(nextSession);
      }
    }
  }, []);

  const handleBidEffect = useCallback(
    (lotId: string, outbidUserId?: string) => {
      setFlashedLots((prev) => ({ ...prev, [lotId]: Date.now() }));
      const activeUserId = sessionRef.current?.userId;
      if (outbidUserId && activeUserId === outbidUserId) {
        const lot = storage.getAuctions().find((a) => a.id === lotId);
        playAuctionSound('outbid', soundRef.current);
        pushToast({
          title: 'You have been outbid',
          message: lot
            ? `${lot.title} is now at ${formatINR(lot.bids[lot.bids.length - 1]?.amount ?? lot.reservePrice)}. Your escrow hold was released.`
            : 'Another bidder placed a higher bid.',
          variant: 'warning',
          actionLabel: 'Counter-Bid',
          actionLotId: lotId,
        });
      } else {
        playAuctionSound('bid', soundRef.current);
      }
    },
    [pushToast]
  );

  const syncAndBroadcast = useCallback(
    (msg: SyncBroadcastMessage = { type: 'state:sync' }) => {
      const snap = localEngine.getSnapshot();
      applySnapshot(snap);
      if (msg.type === 'bid:placed' && msg.lotId) {
        handleBidEffect(msg.lotId, msg.outbidUserId);
      } else if (msg.type === 'auction:settled') {
        playAuctionSound('sold', soundRef.current);
      }
      try {
        channelRef.current?.postMessage(msg);
      } catch {
        // Ignore channel errors if closed
      }
    },
    [applySnapshot, handleBidEffect]
  );

  // Initial localStorage seed & session validation
  useEffect(() => {
    let active = true;
    void localEngine.ensureInitialized().then((snapshot) => {
      if (!active) return;
      applySnapshot(snapshot);
      const saved = storage.getSession();
      if (saved && !snapshot.users.some((u) => u.id === saved.userId)) {
        storage.clearSession();
        setSession(null);
        setWatchlist([]);
      }
      setIsHydrating(false);
    });
    return () => {
      active = false;
    };
  }, [applySnapshot]);

  // Real-time Cross-Tab Synchronization via BroadcastChannel + window storage event
  useEffect(() => {
    if (typeof BroadcastChannel !== 'undefined') {
      const ch = new BroadcastChannel(SYNC_CHANNEL_NAME);
      channelRef.current = ch;
      ch.onmessage = (event: MessageEvent<SyncBroadcastMessage>) => {
        const msg = event.data;
        applySnapshot(localEngine.getSnapshot());
        if (msg?.type === 'bid:placed' && msg.lotId) {
          handleBidEffect(msg.lotId, msg.outbidUserId);
        } else if (msg?.type === 'auction:settled') {
          playAuctionSound('sold', soundRef.current);
        }
      };
    }

    const onStorage = (e: StorageEvent) => {
      if (
        e.key === STORAGE_KEYS.AUCTIONS ||
        e.key === STORAGE_KEYS.USERS ||
        e.key === STORAGE_KEYS.TRANSACTIONS ||
        e.key === STORAGE_KEYS.BOT_SPEED
      ) {
        applySnapshot(localEngine.getSnapshot());
      } else if (e.key === STORAGE_KEYS.WATCHLIST && sessionRef.current) {
        setWatchlist(storage.getUserWatchlist(sessionRef.current.userId));
      }
    };

    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('storage', onStorage);
      channelRef.current?.close();
      channelRef.current = null;
    };
  }, [applySnapshot, handleBidEffect]);

  // Periodic local auction settlement check (every 2 seconds)
  useEffect(() => {
    const id = window.setInterval(() => {
      const settled = localEngine.settleExpiredAuctions();
      if (settled.length > 0) {
        syncAndBroadcast({ type: 'auction:settled' });
      }
    }, 2000);
    return () => window.clearInterval(id);
  }, [syncAndBroadcast]);

  // Dynamic Demo Speed Simulator loop (OFF / 1x / 2x / 5x / 10x)
  useEffect(() => {
    const intervalMs = SPEED_INTERVAL_MS[botSpeed];
    if (!intervalMs) return undefined;

    const timer = window.setInterval(() => {
      const tick = localEngine.runBotTick();
      if (tick) {
        syncAndBroadcast({
          type: 'bid:placed',
          lotId: tick.lot.id,
          outbidUserId: tick.outbidUserId,
        });
      }
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [botSpeed, syncAndBroadcast]);

  // Clean up any active war timers on unmount
  useEffect(() => {
    const timers = activeWarTimersRef.current;
    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      timers.clear();
    };
  }, []);

  const clearAllWars = useCallback(() => {
    activeWarTimersRef.current.forEach((t) => window.clearTimeout(t));
    activeWarTimersRef.current.clear();
  }, []);

  const login = useCallback(
    async (identifier: string, password: string): Promise<ActionResult> => {
      const result = await localEngine.login(identifier, password);
      if ('error' in result) {
        return { ok: false, error: result.error };
      }
      const { user, token } = result;
      const nextSession: AuthSession = {
        userId: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        token,
        loggedInAt: Date.now(),
      };
      setSession(nextSession);
      storage.saveSession(nextSession);
      setWatchlist(storage.getUserWatchlist(user.id));
      syncAndBroadcast({ type: 'state:sync' });
      pushToast({
        title: `Welcome back, ${user.name}`,
        message: `Signed in as ${user.role === 'user' ? 'Bidder' : user.role === 'seller' ? 'Seller' : 'Administrator'}.`,
        variant: 'success',
      });
      return { ok: true };
    },
    [pushToast, syncAndBroadcast]
  );

  const register = useCallback(
    async (input: {
      name: string;
      username: string;
      email: string;
      password: string;
      role: UserRole;
    }): Promise<ActionResult> => {
      const result = await localEngine.register(input);
      if ('error' in result) {
        return { ok: false, error: result.error };
      }
      const { user, token } = result;
      const nextSession: AuthSession = {
        userId: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        token,
        loggedInAt: Date.now(),
      };
      setSession(nextSession);
      storage.saveSession(nextSession);
      setWatchlist(storage.getUserWatchlist(user.id));
      syncAndBroadcast({ type: 'state:sync' });
      pushToast({
        title: 'Account created',
        message: `Verified wallet funded with ${formatINR(user.availableBalance)}.`,
        variant: 'success',
      });
      return { ok: true };
    },
    [pushToast, syncAndBroadcast]
  );

  const logout = useCallback(() => {
    storage.clearSession();
    setSession(null);
    setWatchlist([]);
    applySnapshot(localEngine.getSnapshot());
    pushToast({ title: 'Signed out', message: 'Your session was cleared safely.', variant: 'info' });
  }, [applySnapshot, pushToast]);

  const toggleWatchlist = useCallback(
    (lotId: string) => {
      const uid = sessionRef.current?.userId;
      if (!uid) return;
      const updated = storage.toggleWatchlist(uid, lotId);
      setWatchlist(updated);
      const added = updated.includes(lotId);
      pushToast({
        title: added ? 'Added to Watchlist' : 'Removed from Watchlist',
        variant: 'info',
      });
    },
    [pushToast]
  );

  const placeBid = useCallback(
    async (lotId: string, amount: number): Promise<ActionResult> => {
      const uid = sessionRef.current?.userId;
      if (!uid) return { ok: false, error: 'Please sign in first.' };
      const res = localEngine.placeBid(lotId, uid, amount);
      if ('error' in res) return { ok: false, error: res.error };
      syncAndBroadcast({ type: 'bid:placed', lotId, outbidUserId: res.outbidUserId });
      pushToast({
        title: 'Bid confirmed',
        message: `Placed ${formatINR(amount)} on ${lotId}. Funds secured in escrow.`,
        variant: 'success',
      });
      return { ok: true };
    },
    [pushToast, syncAndBroadcast]
  );

  const setProxyBid = useCallback(
    async (lotId: string, maxLimit: number | null): Promise<ActionResult> => {
      const uid = sessionRef.current?.userId;
      if (!uid) return { ok: false, error: 'Please sign in first.' };
      const res = localEngine.setProxyBid(lotId, uid, maxLimit);
      if ('error' in res) return { ok: false, error: res.error };
      syncAndBroadcast({ type: 'bid:placed', lotId });
      pushToast({
        title: maxLimit === null ? 'Auto-Pilot disabled' : 'Auto-Pilot active',
        message:
          maxLimit === null
            ? `Proxy bidding stopped for ${lotId}.`
            : `Automatically bidding up to ${formatINR(maxLimit)} on ${lotId}.`,
        variant: 'success',
      });
      return { ok: true };
    },
    [pushToast, syncAndBroadcast]
  );

  const topUpWallet = useCallback(
    async (amount: number): Promise<ActionResult> => {
      const uid = sessionRef.current?.userId;
      if (!uid) return { ok: false, error: 'Please sign in first.' };
      const res = localEngine.topUpWallet(uid, amount);
      if ('error' in res) return { ok: false, error: res.error };
      syncAndBroadcast({ type: 'state:sync' });
      pushToast({
        title: 'Wallet funded',
        message: `Added ${formatINR(amount)} to your available balance.`,
        variant: 'success',
      });
      return { ok: true };
    },
    [pushToast, syncAndBroadcast]
  );

  const createAuction = useCallback(
    async (input: CreateAuctionInput): Promise<ActionResult> => {
      const uid = sessionRef.current?.userId;
      if (!uid) return { ok: false, error: 'Please sign in first.' };
      const res = localEngine.createAuction(uid, input);
      if ('error' in res) return { ok: false, error: res.error };
      syncAndBroadcast({ type: 'state:sync' });
      pushToast({
        title: res.lot.status === 'live' ? 'Lot published live' : 'Submitted for approval',
        message:
          res.lot.status === 'live'
            ? `${res.lot.id} is now accepting bids.`
            : `${res.lot.id} is queued in the Admin Control Center.`,
        variant: 'success',
      });
      return { ok: true };
    },
    [pushToast, syncAndBroadcast]
  );

  const updateAuction = useCallback(
    async (
      lotId: string,
      patch: Partial<
        Pick<
          AuctionLot,
          'title' | 'description' | 'location' | 'condition' | 'reservePrice' | 'assetType' | 'category'
        >
      >
    ): Promise<ActionResult> => {
      const uid = sessionRef.current?.userId;
      if (!uid) return { ok: false, error: 'Please sign in first.' };
      const res = localEngine.updateAuction(uid, lotId, patch);
      if ('error' in res) return { ok: false, error: res.error };
      syncAndBroadcast({ type: 'state:sync' });
      pushToast({ title: 'Listing updated', message: `Saved changes to ${lotId}.`, variant: 'success' });
      return { ok: true };
    },
    [pushToast, syncAndBroadcast]
  );

  const deleteAuction = useCallback(
    async (lotId: string): Promise<ActionResult> => {
      const uid = sessionRef.current?.userId;
      if (!uid) return { ok: false, error: 'Please sign in first.' };
      const res = localEngine.deleteAuction(uid, lotId);
      if ('error' in res) return { ok: false, error: res.error };
      syncAndBroadcast({ type: 'state:sync' });
      pushToast({ title: 'Listing removed', message: `Deleted lot ${lotId}.`, variant: 'info' });
      return { ok: true };
    },
    [pushToast, syncAndBroadcast]
  );

  const moderateAuction = useCallback(
    async (lotId: string, decision: 'approve' | 'reject', reason?: string): Promise<ActionResult> => {
      const uid = sessionRef.current?.userId;
      if (!uid) return { ok: false, error: 'Please sign in first.' };
      const res = localEngine.moderateAuction(uid, lotId, decision, reason);
      if ('error' in res) return { ok: false, error: res.error };
      syncAndBroadcast({ type: 'state:sync' });
      pushToast({
        title: decision === 'approve' ? 'Listing approved' : 'Listing rejected',
        message:
          decision === 'approve'
            ? `${lotId} is now live in the terminal.`
            : `${lotId} was returned to the seller.`,
        variant: decision === 'approve' ? 'success' : 'warning',
      });
      return { ok: true };
    },
    [pushToast, syncAndBroadcast]
  );

  const updateUserRole = useCallback(
    async (userId: string, role: UserRole): Promise<ActionResult> => {
      const uid = sessionRef.current?.userId;
      if (!uid) return { ok: false, error: 'Please sign in first.' };
      const res = localEngine.updateUserRole(uid, userId, role);
      if ('error' in res) return { ok: false, error: res.error };
      syncAndBroadcast({ type: 'state:sync' });
      pushToast({ title: 'Role updated', message: `User role set to ${role}.`, variant: 'success' });
      return { ok: true };
    },
    [pushToast, syncAndBroadcast]
  );

  const deleteUser = useCallback(
    async (userId: string): Promise<ActionResult> => {
      const uid = sessionRef.current?.userId;
      if (!uid) return { ok: false, error: 'Please sign in first.' };
      const res = localEngine.deleteUser(uid, userId);
      if ('error' in res) return { ok: false, error: res.error };
      syncAndBroadcast({ type: 'state:sync' });
      pushToast({ title: 'Account deleted', variant: 'info' });
      return { ok: true };
    },
    [pushToast, syncAndBroadcast]
  );

  const setBotSpeed = useCallback(
    async (speed: DemoSpeed): Promise<ActionResult> => {
      const uid = sessionRef.current?.userId;
      if (!uid) return { ok: false, error: 'Please sign in first.' };
      const res = localEngine.setBotSpeed(uid, speed);
      if ('error' in res) return { ok: false, error: res.error };
      syncAndBroadcast({ type: 'state:sync' });
      pushToast({
        title: speed === 0 ? 'Auto-bid simulator paused' : `Demo speed set to ${speed}x`,
        message:
          speed === 0
            ? 'Live market activity returned to manual bidding only.'
            : `Competing bids streaming locally at ${speed}x pace.`,
        variant: 'info',
      });
      return { ok: true };
    },
    [pushToast, syncAndBroadcast]
  );

  const toggleBotActivity = useCallback(async (): Promise<ActionResult> => {
    return setBotSpeed(botSpeed > 0 ? 0 : 1);
  }, [botSpeed, setBotSpeed]);

  const triggerBiddingWar = useCallback(
    async (lotId: string): Promise<ActionResult> => {
      const uid = sessionRef.current?.userId;
      const user = users.find((u) => u.id === uid);
      if (!user || user.role !== 'admin') {
        return { ok: false, error: 'Admin access required.' };
      }

      const first = localEngine.triggerBiddingWarStep(lotId, 'Demo War Burst');
      if (!first) {
        return { ok: false, error: 'Selected lot is not live or cannot accept demo bids.' };
      }
      syncAndBroadcast({ type: 'bid:placed', lotId, outbidUserId: first.outbidUserId });

      for (let step = 1; step <= 4; step++) {
        const timer = window.setTimeout(() => {
          activeWarTimersRef.current.delete(timer);
          const next = localEngine.triggerBiddingWarStep(lotId, 'Demo War Burst');
          if (next) {
            syncAndBroadcast({ type: 'bid:placed', lotId, outbidUserId: next.outbidUserId });
          }
        }, step * 650);
        activeWarTimersRef.current.add(timer);
      }

      pushToast({
        title: `Bidding war triggered on ${lotId}`,
        message: '5 rapid competing bids firing in real time.',
        variant: 'warning',
        actionLabel: 'Inspect Lot',
        actionLotId: lotId,
      });
      return { ok: true };
    },
    [pushToast, syncAndBroadcast, users]
  );

  const resetDemoMarket = useCallback(async (): Promise<ActionResult> => {
    const uid = sessionRef.current?.userId;
    if (!uid) return { ok: false, error: 'Please sign in first.' };
    clearAllWars();
    const res = await localEngine.resetDemoMarket(uid);
    if ('error' in res) return { ok: false, error: res.error };
    syncAndBroadcast({ type: 'state:sync' });
    pushToast({
      title: 'Demo market reset',
      message: `Re-seeded ${res.totalLots} fresh lots across all 9 sectors in LocalStorage.`,
      variant: 'success',
    });
    return { ok: true };
  }, [clearAllWars, pushToast, syncAndBroadcast]);

  const replenishMarket = useCallback(async (): Promise<ActionResult> => {
    const uid = sessionRef.current?.userId;
    if (!uid) return { ok: false, error: 'Please sign in first.' };
    const res = localEngine.replenishDemoMarket(uid);
    if ('error' in res) return { ok: false, error: res.error };
    syncAndBroadcast({ type: 'state:sync' });
    pushToast({
      title: 'Market replenished',
      message: `Added ${res.added} fresh live lots to LocalStorage.`,
      variant: 'success',
    });
    return { ok: true };
  }, [pushToast, syncAndBroadcast]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev;
      storage.saveSoundEnabled(next);
      if (next) playAuctionSound('bid', true);
      return next;
    });
  }, []);

  const currentUser = useMemo(() => {
    if (!session) return null;
    return (
      users.find((u) => u.id === session.userId) ?? {
        id: session.userId,
        name: session.name,
        username: session.username,
        email: session.email,
        role: session.role,
        availableBalance: 0,
        escrowBalance: 0,
        createdAt: session.loggedInAt,
      }
    );
  }, [session, users]);

  const value: AuctionContextValue = {
    session,
    currentUser,
    users,
    auctions,
    transactions,
    watchlist,
    botActivityEnabled: botSpeed > 0,
    botSpeed,
    backendStatus,
    isHydrating,
    wsConnected: true,
    theme,
    soundEnabled,
    now,
    flashedLots,
    toasts,
    toggleTheme,
    toggleSound,
    dismissToast,
    pushToast,
    login,
    register,
    logout,
    toggleWatchlist,
    placeBid,
    setProxyBid,
    topUpWallet,
    createAuction,
    updateAuction,
    deleteAuction,
    moderateAuction,
    updateUserRole,
    deleteUser,
    toggleBotActivity,
    setBotSpeed,
    triggerBiddingWar,
    resetDemoMarket,
    replenishMarket,
  };

  return <AuctionContext.Provider value={value}>{children}</AuctionContext.Provider>;
};

export function useAuction() {
  const ctx = useContext(AuctionContext);
  if (!ctx) throw new Error('useAuction must be used inside AuctionProvider');
  return ctx;
}
