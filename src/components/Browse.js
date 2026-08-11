import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../constants';
import { apiFetch } from '../api';
import Nav from './Nav';
import ListingThumb from './ListingThumb';

const PAGE_SIZE = 12;

const CATEGORY_ICONS = {
  'Tools': '🔧', 'Camping Gear': '⛺', 'Event Equipment': '🔊',
  'Electronics': '📷', 'Spare Rooms': '🏠', 'Parking Spots': '🅿️',
};

function SkeletonCard() {
  return (
    <div className="card-static overflow-hidden">
      <div className="aspect-[4/3] skeleton" />
      <div className="p-5 space-y-3">
        <div className="skeleton h-3 w-1/3 rounded-full" />
        <div className="skeleton h-5 w-2/3 rounded-full" />
        <div className="skeleton h-3 w-full rounded-full" />
        <div className="skeleton h-3 w-4/5 rounded-full" />
      </div>
    </div>
  );
}

export default function Browse({ onLogout, isLoggedIn }) {
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [areas, setAreas] = useState([]);
  const [categories, setCategories] = useState([]);
  const [areaId, setAreaId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    const fetcher = isLoggedIn ? apiFetch : (url) => fetch(`${API_BASE_URL}${url}`);
    fetcher('/areas').then(r => r.json()).then(setAreas);
    fetcher('/categories').then(r => r.json()).then(setCategories);
  }, [isLoggedIn]);

  const fetchListings = useCallback((newOffset = 0, replace = true) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (areaId) params.set('area_id', areaId);
    if (categoryId) params.set('category_id', categoryId);
    if (q) params.set('q', q);
    params.set('limit', PAGE_SIZE + 1);
    params.set('offset', newOffset);

    const fetcher = isLoggedIn ? apiFetch : (url) => fetch(`${API_BASE_URL}${url}`);
    fetcher(`/listings?${params.toString()}`)
      .then(r => r.json())
      .then(data => {
        setHasMore(data.length > PAGE_SIZE);
        const page = data.slice(0, PAGE_SIZE);
        setListings(prev => replace ? page : [...prev, ...page]);
        setOffset(newOffset);
      })
      .finally(() => setLoading(false));
  }, [areaId, categoryId, q, isLoggedIn]);

  useEffect(() => { fetchListings(0, true); }, [areaId, categoryId, q]); // eslint-disable-line

  return (
    <div className="page-bg min-h-screen">
      <div className="max-w-6xl mx-auto px-4 pb-16">
        <Nav onLogout={onLogout} isLoggedIn={isLoggedIn} />

        {/* Hero search */}
        <div className="relative overflow-hidden rounded-3xl mb-8 animate-fade-up"
          style={{ background: 'linear-gradient(135deg, #1e293b 0%, #334155 60%, #1e293b 100%)' }}>
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #f59e0b 0%, transparent 50%), radial-gradient(circle at 80% 20%, #fbbf24 0%, transparent 40%)' }} />
          <div className="relative px-8 py-10">
            <p className="text-amber-400 text-xs font-black uppercase tracking-widest mb-2">Nairobi's rental marketplace</p>
            <h1 className="text-3xl sm:text-4xl font-black text-white mb-6 leading-tight">
              Borrow instead of buying.<br />
              <span className="text-amber-400">List what you're not using.</span>
            </h1>
            <div className="flex flex-col sm:flex-row gap-3 max-w-2xl">
              <div className="relative flex-1">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
                <input
                  className="w-full pl-11 pr-4 py-3.5 rounded-2xl border-2 border-white/10 bg-white/10 backdrop-blur-sm text-white placeholder:text-slate-400 focus:border-amber-400 focus:outline-none focus:ring-4 focus:ring-amber-400/20 transition-all duration-200 text-sm font-medium"
                  placeholder="Search tools, gear, spaces..."
                  value={q}
                  onChange={e => setQ(e.target.value)}
                />
              </div>
              <select
                className="py-3.5 px-4 rounded-2xl border-2 border-white/10 bg-white/10 backdrop-blur-sm text-white focus:border-amber-400 focus:outline-none transition-all duration-200 text-sm font-medium cursor-pointer"
                value={areaId}
                onChange={e => setAreaId(e.target.value)}
              >
                <option value="" className="text-slate-800">All areas</option>
                {areas.map(a => <option key={a.id} value={a.id} className="text-slate-800">{a.name}{a.is_launch_area ? ' ✓' : ''}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Category pills */}
        <div className="flex flex-wrap gap-2 mb-6 animate-slide-down">
          <button
            onClick={() => setCategoryId('')}
            className={`flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-full border-2 cursor-pointer transition-all duration-200 ${
              !categoryId
                ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/20'
                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >All</button>
          {categories.map(c => (
            <button
              key={c.id}
              onClick={() => setCategoryId(String(c.id))}
              className={`flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-full border-2 cursor-pointer transition-all duration-200 ${
                String(categoryId) === String(c.id)
                  ? 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-500/30'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-amber-300 hover:text-amber-600 hover:bg-amber-50'
              }`}
            >
              <span>{CATEGORY_ICONS[c.name] || '📦'}</span>
              {c.name}
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading && listings.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-24 animate-scale-in">
            <div className="text-5xl mb-4 animate-float inline-block">🔍</div>
            <p className="font-black text-slate-900 text-xl mb-2">No listings found</p>
            <p className="text-slate-400">Try different filters or search terms.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 stagger">
              {listings.map((listing, i) => (
                <div
                  key={listing.id}
                  onClick={() => navigate(`/listings/${listing.id}`)}
                  style={{ animationDelay: `${i * 50}ms` }}
                  className={`card overflow-hidden cursor-pointer animate-fade-up group ${
                    listing.is_featured ? 'ring-2 ring-amber-400 ring-offset-2' : ''
                  }`}
                >
                  <div className="relative overflow-hidden">
                    <ListingThumb
                      photos={listing.photos}
                      alt={listing.title}
                      className="w-full aspect-[4/3] group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    {listing.is_featured && (
                      <span className="absolute top-3 left-3 badge bg-amber-500 text-white shadow-lg shadow-amber-500/40 animate-pulse-ring">
                        ★ Featured
                      </span>
                    )}
                    {listing.owner.is_business && (
                      <span className="absolute top-3 right-3 badge bg-blue-600 text-white shadow-md">
                        💼 Business
                      </span>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="text-sm">{CATEGORY_ICONS[listing.category.name] || '📦'}</span>
                      <p className="text-xs font-black text-amber-600 uppercase tracking-widest">{listing.category.name}</p>
                    </div>
                    <h3 className="text-base font-black text-slate-900 mb-1.5 line-clamp-1 group-hover:text-amber-600 transition-colors duration-200">
                      {listing.title}
                    </h3>
                    <p className="text-sm text-slate-500 mb-4 line-clamp-2 leading-relaxed">
                      {listing.description || 'No description yet.'}
                    </p>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-lg font-black text-slate-900">KES {listing.price_per_day.toLocaleString()}</span>
                        <span className="text-xs text-slate-400 ml-1">/day</span>
                      </div>
                      <span className="flex items-center gap-1 text-xs text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full">
                        📍 {listing.area.name}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex justify-center gap-3 pt-8">
              {offset > 0 && (
                <button
                  onClick={() => fetchListings(offset - PAGE_SIZE, true)}
                  className="btn-ghost px-6 py-2.5 text-sm"
                >← Previous</button>
              )}
              {hasMore && (
                <button
                  onClick={() => fetchListings(offset + PAGE_SIZE, true)}
                  disabled={loading}
                  className="btn-primary px-6 py-2.5 text-sm"
                >Next →</button>
              )}
            </div>
          </>
        )}

        {/* Guest CTA */}
        {!isLoggedIn && (
          <div className="mt-10 relative overflow-hidden rounded-3xl animate-fade-up"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
            <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/10 -translate-y-1/2 translate-x-1/4" />
            <div className="relative p-8 text-white text-center">
              <p className="text-2xl font-black mb-2">Ready to rent or list?</p>
              <p className="text-amber-100 mb-6">Create a free account to send booking requests or list your own items.</p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => navigate('/register')}
                  className="bg-white text-amber-600 font-black px-6 py-2.5 rounded-2xl hover:bg-amber-50 transition-colors duration-200 cursor-pointer border-0"
                >
                  Create account
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="bg-white/20 backdrop-blur-sm text-white font-bold px-6 py-2.5 rounded-2xl hover:bg-white/30 transition-colors duration-200 cursor-pointer border border-white/30"
                >
                  Sign in
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
