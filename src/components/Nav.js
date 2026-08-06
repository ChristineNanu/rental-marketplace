import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const LINKS = [
  { to: '/browse', label: 'Browse' },
  { to: '/my-listings', label: 'My Listings' },
  { to: '/my-bookings', label: 'My Bookings' },
  { to: '/dashboard', label: 'Dashboard' },
];

export default function Nav({ onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="max-w-5xl mx-auto flex items-center justify-between mb-6">
      <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-2xl p-1">
        {LINKS.map(link => (
          <button
            key={link.to}
            onClick={() => navigate(link.to)}
            className={`text-sm font-bold px-3 py-2 rounded-xl border-0 cursor-pointer transition-colors ${
              location.pathname.startsWith(link.to)
                ? 'bg-amber-500 text-white'
                : 'bg-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {link.label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <button onClick={() => navigate('/listings/new')} className="btn-primary text-sm px-4 py-2">
          + List an item
        </button>
        <button onClick={onLogout} className="text-sm font-bold text-slate-500 bg-white border border-slate-200 px-4 py-2 rounded-xl cursor-pointer">
          Sign out
        </button>
      </div>
    </div>
  );
}
