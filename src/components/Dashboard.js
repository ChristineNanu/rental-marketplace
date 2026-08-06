import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../constants';
import { apiFetch } from '../api';

export default function Dashboard({ onLogout }) {
  const [me, setMe] = useState(null);
  const [areas, setAreas] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    apiFetch(`${API_BASE_URL}/me`).then(r => r.ok ? r.json() : null).then(setMe);
    fetch(`${API_BASE_URL}/areas`).then(r => r.json()).then(setAreas);
    fetch(`${API_BASE_URL}/categories`).then(r => r.json()).then(setCategories);
  }, []);

  return (
    <div className="page-bg min-h-screen p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black text-slate-900">
            {me ? `Hey, ${me.full_name || me.username}` : 'Loading...'}
          </h1>
          <button onClick={onLogout} className="text-sm font-bold text-slate-500 bg-white border border-slate-200 px-4 py-2 rounded-xl cursor-pointer">
            Sign out
          </button>
        </div>

        <div className="card p-6">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Phase 0 scaffold check</p>
          <p className="text-sm text-slate-600 mb-1">✅ Logged in as <strong>{me?.username}</strong></p>
          <p className="text-sm text-slate-600 mb-1">✅ {areas.length} launch areas seeded ({areas.filter(a => a.is_launch_area).map(a => a.name).join(', ') || 'none marked live yet'})</p>
          <p className="text-sm text-slate-600">✅ {categories.length} categories seeded ({categories.map(c => c.name).join(', ')})</p>
        </div>

        <div className="card p-6 text-center text-slate-400 text-sm">
          Listings, browsing, and bookings arrive in Phase 1+.
        </div>
      </div>
    </div>
  );
}
