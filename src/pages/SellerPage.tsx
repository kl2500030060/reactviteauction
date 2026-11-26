import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pencil, Plus, Trash2, X } from 'lucide-react';
import { useAuction } from '../context/AuctionContext';
import { ASSET_SUBTYPES, CATEGORIES, CATEGORY_LABELS, SUBTYPE_LABELS } from '../data/catalog';
import type { AssetSubtype, AuctionCategory, AuctionLot } from '../types/auction';
import { formatINR, getCurrentPrice } from '../utils/format';
import { AssetIllustration } from '../components/AssetIllustration';

const CITIES = ['Mumbai', 'Delhi', 'Bangalore', 'Pune', 'Hyderabad', 'Chennai', 'Ahmedabad', 'Kochi'];

export const SellerPage: React.FC = () => {
  const { auctions, currentUser, createAuction, updateAuction, deleteAuction } = useAuction();
  const navigate = useNavigate();

  const [editingLotId, setEditingLotId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<AuctionCategory>('vehicles');
  const [assetType, setAssetType] = useState<AssetSubtype>('sedan');
  const [year, setYear] = useState('2023');
  const [condition, setCondition] = useState<AuctionLot['condition']>('A');
  const [location, setLocation] = useState('Mumbai');
  const [reservePrice, setReservePrice] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('25');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const filteredSubtypes = useMemo(
    () => ASSET_SUBTYPES.filter((s) => s.category === category),
    [category]
  );

  const myListings = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'admin') return auctions;
    return auctions.filter((a) => a.sellerId === currentUser.id);
  }, [auctions, currentUser]);

  const handleCategoryChange = (nextCat: AuctionCategory) => {
    setCategory(nextCat);
    const first = ASSET_SUBTYPES.find((s) => s.category === nextCat);
    if (first) setAssetType(first.id);
  };

  const resetForm = () => {
    setEditingLotId(null);
    setTitle('');
    setDescription('');
    setCategory('vehicles');
    setAssetType('sedan');
    setYear('2023');
    setCondition('A');
    setLocation('Mumbai');
    setReservePrice('');
    setDurationMinutes('25');
    setError(null);
  };

  const startEdit = (lot: AuctionLot) => {
    setEditingLotId(lot.id);
    setTitle(lot.title);
    setDescription(lot.description);
    setCategory(lot.category);
    setAssetType(lot.assetType);
    setYear(String(lot.year));
    setCondition(lot.condition);
    setLocation(lot.location);
    setReservePrice(String(lot.reservePrice));
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const priceNum = Number(reservePrice);
    const durNum = Number(durationMinutes);
    const yearNum = Number(year);

    if (title.trim().length < 4) {
      setError('Asset title must be at least 4 characters.');
      return;
    }
    if (!priceNum || priceNum < 10000) {
      setError('Reserve price must be at least ₹10,000.');
      return;
    }

    setSubmitting(true);
    const res = editingLotId
      ? await updateAuction(editingLotId, {
          title: title.trim(),
          description: description.trim(),
          category,
          assetType,
          condition,
          location,
          reservePrice: priceNum,
        })
      : await createAuction({
          title: title.trim(),
          description: description.trim(),
          category,
          assetType,
          year: yearNum || 2024,
          condition,
          location,
          reservePrice: priceNum,
          durationMinutes: durNum || 25,
        });
    setSubmitting(false);

    if (!res.ok) {
      setError(res.error || 'Could not save listing.');
      return;
    }
    resetForm();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Seller Portal
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Submit new assets for admin review, choose exact technical silhouettes, and manage your lots
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Listing Form */}
        <section className="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 sm:p-6">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {editingLotId ? `Edit Listing ${editingLotId}` : 'Submit New Auction Lot'}
            </h2>
            {editingLotId && (
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
                Cancel
              </button>
            )}
          </div>

          {/* Live Technical Vector Preview */}
          <div className="mt-4">
            <AssetIllustration assetType={assetType} size="md" />
            <p className="mt-1.5 text-center text-xs text-slate-500 dark:text-slate-400">
              Preview: {CATEGORY_LABELS[category]} · {SUBTYPE_LABELS[assetType]}
            </p>
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-xs font-medium text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => handleCategoryChange(e.target.value as AuctionCategory)}
                  className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                >
                  {CATEGORIES.filter((c) => c.id !== 'all').map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Asset Representation
                </label>
                <select
                  value={assetType}
                  onChange={(e) => setAssetType(e.target.value as AssetSubtype)}
                  className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                >
                  {filteredSubtypes.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Asset Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. 2023 Hyundai Verna SX Turbo Sedan"
                className="mt-1 min-h-[46px] w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3.5 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Description & Documentation Notes
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ownership status, inspection details, RC/title readiness..."
                className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Year
                </label>
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 font-mono text-sm text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Condition
                </label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value as AuctionLot['condition'])}
                  className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 text-sm text-slate-900 dark:text-white"
                >
                  <option value="A+">A+</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="Salvage">Salvage</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  City
                </label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-2.5 text-sm text-slate-900 dark:text-white"
                >
                  {CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Reserve Price (₹)
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={reservePrice}
                  onChange={(e) => setReservePrice(e.target.value)}
                  placeholder="1200000"
                  className="mt-1 min-h-[46px] w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3.5 font-mono text-sm tabular-nums text-slate-900 dark:text-white"
                />
              </div>

              {!editingLotId && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={2}
                    max={1440}
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                    className="mt-1 min-h-[46px] w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3.5 font-mono text-sm tabular-nums text-slate-900 dark:text-white"
                  />
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 text-sm font-semibold text-white transition hover:bg-indigo-500 active:scale-[0.98] disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              <span>
                {submitting
                  ? 'Saving...'
                  : editingLotId
                    ? 'Save Changes'
                    : currentUser?.role === 'admin'
                      ? 'Publish Directly to Live Market'
                      : 'Submit for Admin Approval'}
              </span>
            </button>
          </form>
        </section>

        {/* Seller's Listings List */}
        <section className="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Managed Listings ({myListings.length})
            </h2>
          </div>

          {myListings.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
              You have not created any auction listings yet.
            </p>
          ) : (
            <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800/80">
              {myListings.map((lot) => (
                <div key={lot.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={() => navigate(`/asset/${lot.id}`)}
                      className="shrink-0"
                    >
                      <AssetIllustration assetType={lot.assetType} size="sm" />
                    </button>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {lot.title}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-mono">{lot.id}</span> · {SUBTYPE_LABELS[lot.assetType]} ·{' '}
                        <span
                          className={`font-semibold ${
                            lot.status === 'live'
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : lot.status === 'pending_approval'
                                ? 'text-amber-600 dark:text-amber-400'
                                : lot.status === 'rejected'
                                  ? 'text-red-600 dark:text-red-400'
                                  : 'text-slate-500'
                          }`}
                        >
                          {lot.status.replace('_', ' ')}
                        </span>
                      </p>
                      {lot.rejectionReason && (
                        <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                          Reason: {lot.rejectionReason}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                    <span className="font-mono text-sm font-bold tabular-nums text-slate-900 dark:text-white">
                      {formatINR(getCurrentPrice(lot))}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => startEdit(lot)}
                        aria-label={`Edit ${lot.title}`}
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-500"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      {(lot.status === 'pending_approval' ||
                        lot.status === 'rejected' ||
                        currentUser?.role === 'admin') && (
                        <button
                          type="button"
                          onClick={() => void deleteAuction(lot.id)}
                          aria-label={`Delete ${lot.title}`}
                          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-red-600 dark:text-red-400 hover:border-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
