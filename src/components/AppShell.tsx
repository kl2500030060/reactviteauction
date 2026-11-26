import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Bookmark,
  Briefcase,
  FileSpreadsheet,
  Gavel,
  LogOut,
  Moon,
  PlusCircle,
  Shield,
  Sun,
  Volume2,
  VolumeX,
  Wallet,
} from 'lucide-react';
import { useAuction } from '../context/AuctionContext';
import { formatINRCompact } from '../utils/format';
import { OfflineIndicator, PWAInstallButton } from './PWAInstallButton';
import { ToastViewport } from './ToastViewport';

export const AppShell: React.FC = () => {
  const {
    currentUser,
    theme,
    soundEnabled,
    wsConnected,
    watchlist,
    auctions,
    toggleTheme,
    toggleSound,
    logout,
  } = useAuction();
  const navigate = useNavigate();

  const pendingCount = auctions.filter((a) => a.status === 'pending_approval').length;

  const navItems = [
    { to: '/markets', label: 'Markets', icon: Gavel },
    { to: '/watchlist', label: 'Watchlist', icon: Bookmark, count: watchlist.length },
    { to: '/wallet', label: 'Wallet', icon: Wallet },
    { to: '/vault', label: 'Vault', icon: Briefcase },
    { to: '/history', label: 'Ledger', icon: FileSpreadsheet },
  ];

  if (currentUser?.role === 'seller' || currentUser?.role === 'admin') {
    navItems.push({ to: '/seller', label: 'Seller', icon: PlusCircle });
  }
  if (currentUser?.role === 'admin') {
    navItems.push({ to: '/admin', label: 'Admin', icon: Shield, count: pendingCount });
  }

  // Mobile bottom tab bar: 4 or 5 high-priority destinations strictly in thumb zone
  const mobileTabs = (() => {
    if (currentUser?.role === 'admin') {
      return [
        { to: '/markets', label: 'Markets', icon: Gavel },
        { to: '/admin', label: 'Admin', icon: Shield, count: pendingCount },
        { to: '/seller', label: 'List', icon: PlusCircle },
        { to: '/wallet', label: 'Wallet', icon: Wallet },
        { to: '/vault', label: 'Vault', icon: Briefcase },
      ];
    }
    if (currentUser?.role === 'seller') {
      return [
        { to: '/markets', label: 'Markets', icon: Gavel },
        { to: '/seller', label: 'Seller', icon: PlusCircle },
        { to: '/wallet', label: 'Wallet', icon: Wallet },
        { to: '/vault', label: 'Vault', icon: Briefcase },
      ];
    }
    return [
      { to: '/markets', label: 'Markets', icon: Gavel },
      { to: '/watchlist', label: 'Saved', icon: Bookmark, count: watchlist.length },
      { to: '/wallet', label: 'Wallet', icon: Wallet },
      { to: '/vault', label: 'Vault', icon: Briefcase },
    ];
  })();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 dark:bg-[#0B1120] dark:text-slate-100">
      <ToastViewport />
      <OfflineIndicator />

      <div className="flex min-h-screen">
        {/* Desktop 240px Sidebar */}
        <aside className="hidden lg:flex lg:w-60 lg:flex-col lg:fixed lg:inset-y-0 border-r border-slate-200 dark:border-slate-800/90 bg-white dark:bg-[#111827]">
          <div className="flex h-16 items-center px-5 border-b border-slate-200 dark:border-slate-800/90">
            <button
              type="button"
              onClick={() => navigate('/markets')}
              className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0"
            >
              Auto<span className="text-indigo-600 dark:text-indigo-400">Auction</span>
            </button>
          </div>

          <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex min-h-[42px] items-center justify-between rounded-xl px-3.5 text-sm font-medium transition ${
                      isActive
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white'
                    }`
                  }
                >
                  <span className="flex items-center gap-3 whitespace-nowrap">
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                  </span>
                  {typeof item.count === 'number' && item.count > 0 && (
                    <span className="font-mono text-xs tabular-nums opacity-85">
                      {item.count}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Desktop Account & Utilities */}
          <div className="border-t border-slate-200 dark:border-slate-800/90 p-4 space-y-3">
            {currentUser && (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/70 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-xs font-semibold text-slate-900 dark:text-white">
                    {currentUser.name}
                  </p>
                  <span className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 capitalize">
                    {currentUser.role === 'user' ? 'Bidder' : currentUser.role}
                  </span>
                </div>
                <p className="mt-1 font-mono text-xs tabular-nums text-emerald-600 dark:text-emerald-400">
                  {formatINRCompact(currentUser.availableBalance)} available
                </p>
              </div>
            )}

            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={toggleTheme}
                  aria-label="Toggle light or dark theme"
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  onClick={toggleSound}
                  aria-label="Toggle auction sound alerts"
                  className={`flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 ${
                    soundEnabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'
                  }`}
                >
                  {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                </button>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Main Column */}
        <div className="flex min-w-0 flex-1 flex-col lg:pl-60">
          {/* Mobile Compact Top Header (<= 56px + safe-area top for iPhone Dynamic Island) */}
          <header className="sticky top-0 z-30 border-b border-slate-200/80 dark:border-slate-800/90 bg-white/90 dark:bg-[#0B1120]/90 backdrop-blur-md pt-safe lg:hidden">
            <div className="flex h-13 items-center justify-between gap-3 px-4">
              <button
                type="button"
                onClick={() => navigate('/markets')}
                className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0"
              >
                Auto<span className="text-indigo-600 dark:text-indigo-400">Auction</span>
              </button>

              <div className="flex items-center gap-2 shrink-0">
                <PWAInstallButton compact />
                {currentUser && (
                  <button
                    type="button"
                    onClick={() => navigate('/wallet')}
                    className="font-mono text-xs font-semibold tabular-nums text-emerald-600 dark:text-emerald-400 px-1.5 py-1 whitespace-nowrap"
                  >
                    {formatINRCompact(currentUser.availableBalance)}
                  </button>
                )}
                <button
                  type="button"
                  onClick={toggleTheme}
                  aria-label="Toggle theme"
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 dark:text-slate-300 active:bg-slate-200/60 dark:active:bg-slate-800"
                >
                  {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  aria-label="Sign out"
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 dark:text-slate-300 active:bg-slate-200/60 dark:active:bg-slate-800"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          </header>

          {/* Desktop Top Utility Strip */}
          <header className="hidden lg:flex sticky top-0 z-20 h-16 items-center justify-between gap-8 border-b border-slate-200/80 dark:border-slate-800/90 bg-white/90 dark:bg-[#0B1120]/90 backdrop-blur-md px-8">
            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
              <span
                className={`h-2 w-2 rounded-full ${
                  wsConnected ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
              <span>{wsConnected ? 'LocalStorage + Cross-Tab Sync' : 'Offline Mode'}</span>
              <span aria-hidden="true">·</span>
              <span>Indian Asset Auction Exchange</span>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <PWAInstallButton />
              {currentUser?.role === 'seller' || currentUser?.role === 'admin' ? (
                <button
                  type="button"
                  onClick={() => navigate('/seller')}
                  className="min-h-[40px] rounded-lg bg-indigo-600 px-4 text-xs font-semibold text-white transition hover:bg-indigo-500 whitespace-nowrap shrink-0"
                >
                  List Asset
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate('/wallet')}
                  className="min-h-[40px] rounded-lg bg-indigo-600 px-4 text-xs font-semibold text-white transition hover:bg-indigo-500 whitespace-nowrap shrink-0"
                >
                  Add Funds
                </button>
              )}
            </div>
          </header>

          {/* Main Content Viewport */}
          <main className="flex-1 px-4 pt-4 pb-24 sm:px-6 lg:px-8 lg:py-6 lg:pb-10">
            <div className="mx-auto w-full max-w-7xl">
              <Outlet />
            </div>
          </main>

          {/* Fixed Bottom Tab Bar on Mobile (iPhone Pro Max thumb-zone ergonomic anchor) */}
          <nav
            aria-label="Primary mobile navigation"
            className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#0B1120]/95 backdrop-blur-md pb-safe lg:hidden"
          >
            <div
              className="grid h-15 items-center"
              style={{ gridTemplateColumns: `repeat(${mobileTabs.length}, minmax(0, 1fr))` }}
            >
              {mobileTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <NavLink
                    key={tab.to}
                    to={tab.to}
                    className={({ isActive }) =>
                      `relative flex min-h-[48px] flex-col items-center justify-center gap-0.5 transition ${
                        isActive
                          ? 'text-indigo-600 dark:text-indigo-400'
                          : 'text-slate-500 dark:text-slate-400'
                      }`
                    }
                  >
                    <div className="relative">
                      <Icon className="h-5 w-5" />
                      {typeof tab.count === 'number' && tab.count > 0 && (
                        <span className="absolute -top-1.5 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-600 px-1 font-mono text-[10px] font-bold text-white">
                          {tab.count}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-semibold tracking-tight">{tab.label}</span>
                  </NavLink>
                );
              })}
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
};
