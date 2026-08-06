import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../constants';
import Nav from './Nav';
import ListingThumb from './ListingThumb';

export default function Browse({ onLogout }) {
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [areas, setAreas] = useState([]);
  const [categories, setCategories] = useState([]);
  const [areaId, setAreaId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/areas`).then(r => r.json()).then(setAreas);
    fetch(`${API_BASE_URL}/categories`).then(r => r.json()).then(setCategories);
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (areaId) params.set('area_id', areaId);
    if (categoryId) params.set('category_id', categoryId);
    if (q) params.set('q', q);
    fetch(`${API_BASE_URL}/listings?${params.toString()}`)
      .then(r => r.json())
      .then(setListings)
      .finally(() => setLoading(false));
  }, [areaId, categoryId, q]);

  return (
    <div className="page-bg min-h-screen p-8">
      <Nav onLogout={onLogout} />
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
          >
            All
          </button>
          {categories.map(c => (
            <button
              key={c.id}
              onClick={() => setCategoryId(String(c.id))}
              className={`text-xs font-bold px-3 py-1.5 rounded-full border cursor-pointer transition-colors ${
                String(categoryId) === String(c.id) ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {loading ? (
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
                  <p className="text-xs font-black text-amber-600 uppercase tracking-widest mb-1">{listing.category.name}</p>
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
        )}
      </div>
    </div>
  );
}
