import type { AssetSubtype, AuctionCategory } from '../types/auction';

export interface CategoryMeta {
  id: AuctionCategory | 'all';
  label: string;
  shortLabel: string;
  description: string;
}

export interface SubtypeMeta {
  id: AssetSubtype;
  label: string;
  category: AuctionCategory;
}

export const CATEGORIES: CategoryMeta[] = [
  {
    id: 'all',
    label: 'All Markets',
    shortLabel: 'All',
    description: 'All 9 live Indian asset auction sectors',
  },
  {
    id: 'vehicles',
    label: 'Vehicles',
    shortLabel: 'Vehicles',
    description: 'Sedans, SUVs, pickups, tractors, and fleet transport',
  },
  {
    id: 'real_estate',
    label: 'Real Estate',
    shortLabel: 'Real Estate',
    description: 'Villas, flats, commercial towers, and NA land parcels',
  },
  {
    id: 'bank',
    label: 'Bank NPA',
    shortLabel: 'Bank NPA',
    description: 'SARFAESI foreclosed retail units and secured assets',
  },
  {
    id: 'bullion',
    label: 'Bullion Vaults',
    shortLabel: 'Bullion',
    description: 'Assayed 24K gold bars, silver ingots, and sovereign coins',
  },
  {
    id: 'industrial',
    label: 'Industrial Plants',
    shortLabel: 'Industrial',
    description: 'CNC machining centers, tower cranes, and factory units',
  },
  {
    id: 'gov_psu',
    label: 'Gov & PSU Tenders',
    shortLabel: 'Gov / PSU',
    description: 'Substation transformers, railway steel, and solar arrays',
  },
  {
    id: 'logistics',
    label: 'Marine & Logistics',
    shortLabel: 'Logistics',
    description: 'Container trailers, coastal vessels, and reach-stackers',
  },
  {
    id: 'electronics',
    label: 'IT & Liquidation',
    shortLabel: 'Liquidation',
    description: 'Corporate laptop fleets, DG generators, and medical tech',
  },
  {
    id: 'luxury',
    label: 'Luxury & Fine Art',
    shortLabel: 'Luxury',
    description: 'Mechanical chronographs, fine art, and collector coupes',
  },
];

export const ASSET_SUBTYPES: SubtypeMeta[] = [
  // Vehicles
  { id: 'sedan', label: 'Sedan', category: 'vehicles' },
  { id: 'suv', label: 'SUV / 4x4', category: 'vehicles' },
  { id: 'pickup', label: 'Pickup Truck', category: 'vehicles' },
  { id: 'tractor', label: 'Agricultural Tractor', category: 'vehicles' },
  { id: 'motorcycle', label: 'Motorcycle', category: 'vehicles' },
  // Real Estate
  { id: 'villa', label: 'Residential Villa', category: 'real_estate' },
  { id: 'apartment', label: 'Apartment / Flat', category: 'real_estate' },
  { id: 'office', label: 'Commercial Tower', category: 'real_estate' },
  { id: 'land', label: 'Land / Plot', category: 'real_estate' },
  // Bank NPA
  { id: 'shop', label: 'Commercial Shopfront', category: 'bank' },
  { id: 'bank_vault', label: 'Bank Secured Asset', category: 'bank' },
  // Bullion Vaults
  { id: 'gold', label: '24K Gold Bullion', category: 'bullion' },
  { id: 'silver', label: 'Silver Ingot Stack', category: 'bullion' },
  { id: 'coin_vault', label: 'Sovereign Coin Reserve', category: 'bullion' },
  // Industrial Plants
  { id: 'cnc_machine', label: '5-Axis CNC Center', category: 'industrial' },
  { id: 'crane', label: 'Heavy Tower Crane', category: 'industrial' },
  { id: 'factory_unit', label: 'Turnkey Factory Plant', category: 'industrial' },
  // Gov & PSU Tenders
  { id: 'psu_transformer', label: 'Power Transformer', category: 'gov_psu' },
  { id: 'rail_scrap', label: 'Railway Rolling Stock', category: 'gov_psu' },
  { id: 'solar_array', label: 'Utility Solar Array', category: 'gov_psu' },
  // Marine & Logistics
  { id: 'container_truck', label: 'Container Trailer', category: 'logistics' },
  { id: 'cargo_vessel', label: 'Coastal Cargo Vessel', category: 'logistics' },
  { id: 'forklift', label: 'Reach-Stacker Forklift', category: 'logistics' },
  // IT & Liquidation
  { id: 'laptops', label: 'IT / Laptop Fleet', category: 'electronics' },
  { id: 'generator', label: 'Industrial Generator', category: 'electronics' },
  { id: 'medical', label: 'Medical MRI Equipment', category: 'electronics' },
  // Luxury & Fine Art
  { id: 'chronograph', label: 'Swiss Chronograph', category: 'luxury' },
  { id: 'fine_art', label: 'Fine Art Masterwork', category: 'luxury' },
  { id: 'vintage_car', label: 'Collector Classic Coupe', category: 'luxury' },
];

export const CATEGORY_LABELS: Record<AuctionCategory, string> = {
  vehicles: 'Vehicles',
  real_estate: 'Real Estate',
  bank: 'Bank NPA',
  bullion: 'Bullion Vaults',
  industrial: 'Industrial Plants',
  gov_psu: 'Gov & PSU',
  logistics: 'Marine & Logistics',
  electronics: 'Liquidation',
  luxury: 'Luxury & Art',
};

export const SUBTYPE_LABELS: Record<AssetSubtype, string> = ASSET_SUBTYPES.reduce(
  (acc, item) => {
    acc[item.id] = item.label;
    return acc;
  },
  {} as Record<AssetSubtype, string>
);

export function getMinIncrement(reservePrice: number): number {
  if (reservePrice >= 10000000) return 200000;
  if (reservePrice >= 5000000) return 100000;
  if (reservePrice >= 1000000) return 50000;
  if (reservePrice >= 200000) return 10000;
  return 5000;
}
