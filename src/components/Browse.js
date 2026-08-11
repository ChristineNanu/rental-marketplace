import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../constants';
import { apiFetch } from '../api';
import Nav from './Nav';
import ListingThumb from './ListingThumb';

const PAGE_SIZE = 12;

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
    params.set('limit', PAGE_SIZE + 1); // fetch one extra to know if there's a next page
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

  useEffect(() => { fetchListings(0, true); }, [areaId, categoryId, q]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="page-bg min-h-screen p-8">
      <Nav onLogout={onLogout} isLoggedIn={isLoggedIn} />
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Browse Nairobi</h1>
          <p className="text-slate-500 text-sm mt-1">Tools, gear, and spaces from people nearby — no need to buy what you'll use once.</p>
        </div>

        <div className="card p-4 flex flex-wrap gap-3 items-center">
          <input
            className="input-field flex-1 min-w-[180px]"
            placeholder="Search listings..."
            value={q}
            onChange={e => setQ(e.target.value)}
          />
          <select className="input-field w-auto" value={areaId} onChange={e => setAreaId(e.target.value)}>
            <option value="">All areas</option>
            {areas.map(a => <option key={a.id} value={a.id}>{a.name}{a.is_launch_area ? ' (live)' : ''}</option>)}
          </select>
          <select className="input-field w-auto" value={categoryId} onChange={e => setCategoryId(e.target.value)}>
            <option value="">All categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCategoryId('')}
            className={`text-xs font-bold px-3 py-1.5 rounded-full border cursor-pointer transition-colors ${
              !categoryId ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
            }`}
          >All</button>
          {categories.map(c => (
            <button
              key={c.id}
              onClick={() => setCategoryId(String(c.id))}
              className={`text-xs font-bold px-3 py-1.5 rounded-full border cursor-pointer transition-colors ${
                String(categoryId) === String(c.id) ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
              }`}
            >{c.name}</button>
          ))}
        </div>

        {loading && listings.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card-static overflow-hidden animate-pulse">
                <div className="aspect-[4/3] bg-slate-100" />
                <div className="p-5 space-y-2">
                  <div className="h-3 w-1/3 bg-slate-100 rounded" />
                  <div className="h-4 w-2/3 bg-slate-100 rounded" />
                  <div className="h-3 w-full bg-slate-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : listings.length === 0 ? (
          <p className="text-center text-slate-400 py-16">No listings match those filters yet.</p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {listings.map(listing => (
                <div
                  key={listing.id}
                  onClick={() => navigate(`/listings/${listing.id}`)}
                  className={`card overflow-hidden cursor-pointer relative ${listing.is_featured ? 'ring-2 ring-amber-400' : ''}`}
                >
                  <div className="relative">
                    <ListingThumb photos={listing.photos} alt={listing.title} className="w-full aspect-[4/3]" />
                    {listing.is_featured && (
                      <span className="absolute top-3 right-3 px-2 py-0.5 rounded-lg text-xs font-bold bg-amber-100 text-amber-700 shadow">★ Featured</span>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-xs font-black text-amber-600 uppercase tracking-widest">{listing.category.name}</p>
                      {listing.owner.is_business && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-600">BUSINESS</span>
                      )}
                    </div>
                    <h3 className="text-lg font-black text-slate-900 mb-1">{listing.title}</h3>
                    <p className="text-sm text-slate-500 mb-3 line-clamp-2">{listing.description || 'No description yet.'}</p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-bold text-slate-800">KES {listing.price_per_day.toLocaleString()}/day</span>
                      <span className="text-slate-400">{listing.area.name}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center gap-3 pt-2">
              {offset > 0 && (
                <button
                  onClick={() => fetchListings(offset - PAGE_SIZE, true)}
                  className="text-sm font-bold text-slate-500 bg-white border border-slate-200 px-5 py-2 rounded-xl cursor-pointer"
                >← Previous</button>
              )}
              {hasMore && (
                <button
                  onClick={() => fetchListings(offset + PAGE_SIZE, true)}
                  disabled={loading}
                  className="btn-primary px-5 py-2 text-sm"
                >Next →</button>
              )}
            </div>
          </>
        )}

        {!isLoggedIn && (
          <div className="card-static p-6 text-center">
            <p className="font-black text-slate-900 mb-1">Ready to rent or list something?</p>
            <p className="text-sm text-slate-500 mb-4">Create a free account to send booking requests or list your own items.</p>
            <div className="flex justify-center gap-3">
              <button onClick={() => navigate('/register')} className="btn-primary px-5 py-2 text-sm">Create account</button>
              <button onClick={() => navigate('/login')} className="text-sm font-bold text-slate-500 bg-white border border-slate-200 px-5 py-2 rounded-xl cursor-pointer">Sign in</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
