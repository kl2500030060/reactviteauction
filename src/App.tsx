import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuctionProvider, useAuction } from './context/AuctionContext';
import type { UserRole } from './types/auction';
import { AppShell } from './components/AppShell';
import { AuthPage } from './pages/AuthPage';
import { MarketsPage } from './pages/MarketsPage';
import { AssetDetailPage } from './pages/AssetDetailPage';
import { WatchlistPage } from './pages/WatchlistPage';
import { WalletPage } from './pages/WalletPage';
import { VaultPage } from './pages/VaultPage';
import { HistoryPage } from './pages/HistoryPage';
import { SellerPage } from './pages/SellerPage';
import { AdminPage } from './pages/AdminPage';

const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, isHydrating } = useAuction();
  if (isHydrating) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] dark:bg-[#0B1120]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }
  if (!session) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const RequireRole: React.FC<{ allowed: UserRole[]; children: React.ReactNode }> = ({
  allowed,
  children,
}) => {
  const { currentUser } = useAuction();
  if (!currentUser || !allowed.includes(currentUser.role)) {
    return <Navigate to="/markets" replace />;
  }
  return <>{children}</>;
};

const PublicOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session } = useAuction();
  if (session) {
    return <Navigate to="/markets" replace />;
  }
  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <AuctionProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path="/login"
            element={
              <PublicOnly>
                <AuthPage />
              </PublicOnly>
            }
          />
          <Route
            path="/"
            element={
              <RequireAuth>
                <AppShell />
              </RequireAuth>
            }
          >
            <Route index element={<Navigate to="/markets" replace />} />
            <Route path="markets" element={<MarketsPage />} />
            <Route path="asset/:id" element={<AssetDetailPage />} />
            <Route path="watchlist" element={<WatchlistPage />} />
            <Route path="wallet" element={<WalletPage />} />
            <Route path="vault" element={<VaultPage />} />
            <Route path="history" element={<HistoryPage />} />
            <Route
              path="seller"
              element={
                <RequireRole allowed={['seller', 'admin']}>
                  <SellerPage />
                </RequireRole>
              }
            />
            <Route
              path="admin"
              element={
                <RequireRole allowed={['admin']}>
                  <AdminPage />
                </RequireRole>
              }
            />
          </Route>
          <Route path="*" element={<Navigate to="/markets" replace />} />
        </Routes>
      </BrowserRouter>
    </AuctionProvider>
  );
};

export default App;
