export type UserRole = 'user' | 'seller' | 'admin';

export type AuctionCategory =
  | 'vehicles'
  | 'real_estate'
  | 'bank'
  | 'bullion'
  | 'industrial'
  | 'gov_psu'
  | 'logistics'
  | 'electronics'
  | 'luxury';

export type AssetSubtype =
  | 'sedan'
  | 'suv'
  | 'pickup'
  | 'tractor'
  | 'motorcycle'
  | 'villa'
  | 'apartment'
  | 'office'
  | 'land'
  | 'shop'
  | 'bank_vault'
  | 'gold'
  | 'silver'
  | 'coin_vault'
  | 'cnc_machine'
  | 'crane'
  | 'factory_unit'
  | 'psu_transformer'
  | 'rail_scrap'
  | 'solar_array'
  | 'container_truck'
  | 'cargo_vessel'
  | 'forklift'
  | 'laptops'
  | 'generator'
  | 'medical'
  | 'chronograph'
  | 'fine_art'
  | 'vintage_car';

export type AuctionStatus = 'pending_approval' | 'live' | 'sold' | 'unsold' | 'rejected';

export type DemoSpeed = 0 | 1 | 2 | 5 | 10;

export interface UserAccount {
  id: string;
  name: string;
  username: string;
  email: string;
  role: UserRole;
  availableBalance: number;
  escrowBalance: number;
  createdAt: number;
}

export interface AuthSession {
  userId: string;
  username: string;
  name: string;
  email: string;
  role: UserRole;
  token: string;
  loggedInAt: number;
}

export interface BidRecord {
  id: string;
  bidderId: string;
  bidderName: string;
  amount: number;
  timestamp: number;
  isAutoPilot?: boolean;
  deviceLabel?: string;
}

export interface BackendStatus {
  storageMode: 'postgresql' | 'memory';
  storageLabel: string;
  connectedDevices: {
    total: number;
    mobile: number;
    desktop: number;
  };
  activeSessionCount: number;
  hashAlgorithm: string;
}

export interface ProxyBid {
  bidderId: string;
  bidderName: string;
  maxLimit: number;
}

export interface AuctionLot {
  id: string;
  category: AuctionCategory;
  assetType: AssetSubtype;
  title: string;
  description: string;
  year: number;
  condition: 'A+' | 'A' | 'B' | 'C' | 'Salvage';
  location: string;
  sellerId: string;
  sellerName: string;
  reservePrice: number;
  endTime: number;
  status: AuctionStatus;
  rejectionReason?: string;
  specs: string[];
  bids: BidRecord[];
  proxyBid?: ProxyBid | null;
  createdAt: number;
}

export type WalletTxnType =
  | 'top_up'
  | 'escrow_hold'
  | 'escrow_release'
  | 'settlement_debit'
  | 'seller_payout'
  | 'platform_fee';

export interface WalletTransaction {
  id: string;
  userId: string;
  type: WalletTxnType;
  amount: number;
  lotId?: string;
  lotTitle?: string;
  note: string;
  timestamp: number;
}

export interface ToastItem {
  id: string;
  title: string;
  message?: string;
  variant: 'info' | 'success' | 'warning' | 'danger';
  actionLabel?: string;
  actionLotId?: string;
}

export interface ServerStateSnapshot {
  users: UserAccount[];
  auctions: AuctionLot[];
  transactions: WalletTransaction[];
  botActivityEnabled: boolean;
  botSpeed: DemoSpeed;
  backendStatus?: BackendStatus;
  serverTime: number;
}
