import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiFetch } from '../api';

const LINKS = [
  { to: '/browse', label: 'Browse' },
  { to: '/my-listings', label: 'My Listings' },
  { to: '/my-bookings', label: 'My Bookings' },
  { to: '/business', label: 'Business' },
  { to: '/dashboard', label: 'Dashboard' },
];

// Module-level cache — survives re-renders, resets on page reload (which also
// clears tokens, so stale admin state is never an issue).
let _meCache = null;

export default function Nav({ onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(!!_meCache?.is_admin);

  useEffect(() => {
    if (_meCache) return;
    apiFetch('/me').then(r => r.ok ? r.json() : null).then(me => {
      _meCache = me;
      setIsAdmin(!!me?.is_admin);
    });
  }, []);

  const links = isAdmin ? [...LINKS, { to: '/admin/revenue', label: 'Revenue' }] : LINKS;

  return (
    <div className="max-w-5xl mx-auto mb-6 space-y-3">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 bg-transparent border-0 cursor-pointer">
          <span className="text-xl">📦</span>
          <span className="font-black text-slate-900 text-lg tracking-tight hidden sm:inline">RentIt Nairobi</span>
        </button>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/listings/new')} className="btn-primary text-sm px-4 py-2">
            + List an item
          </button>
          <button onClick={onLogout} className="text-sm font-bold text-slate-500 bg-white border border-slate-200 px-4 py-2 rounded-xl cursor-pointer">
            Sign out
          </button>
        </div>
      </div>
      <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-2xl p-1 overflow-x-auto">
        {links.map(link => (
          <button
            key={link.to}
            onClick={() => navigate(link.to)}
            className={`text-sm font-bold px-3 py-2 rounded-xl border-0 cursor-pointer transition-colors whitespace-nowrap ${
              location.pathname.startsWith(link.to)
                ? 'bg-amber-500 text-white'
                : 'bg-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {link.label}
          </button>
        ))}
      </div>
    </div>
  );
}
