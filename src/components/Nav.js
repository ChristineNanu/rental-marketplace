import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiFetch } from '../api';

const LINKS = [
  { to: '/browse',      label: 'Browse',      icon: '🔍' },
  { to: '/my-listings', label: 'My Listings',  icon: '🏷️' },
  { to: '/my-bookings', label: 'My Bookings',  icon: '📅' },
  { to: '/business',    label: 'Business',     icon: '💼' },
  { to: '/dashboard',   label: 'Dashboard',    icon: '⚡' },
];

let _meCache = null;

export default function Nav({ onLogout, isLoggedIn }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(!!_meCache?.is_admin);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!isLoggedIn || _meCache) return;
    apiFetch('/me').then(r => r.ok ? r.json() : null).then(me => {
      _meCache = me;
      setIsAdmin(!!me?.is_admin);
    });
  }, [isLoggedIn]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const links = isAdmin ? [...LINKS, { to: '/admin/revenue', label: 'Revenue', icon: '📊' }] : LINKS;

  return (
    <div className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'py-2' : 'py-4'}`}>
      <div className={`max-w-6xl mx-auto px-4 transition-all duration-300 ${
        scrolled
          ? 'bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-2xl shadow-lg shadow-slate-200/50 px-5'
          : ''
      }`}>
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <button
            onClick={() => navigate(isLoggedIn ? '/dashboard' : '/browse')}
            className="flex items-center gap-2.5 bg-transparent border-0 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-md shadow-amber-200 group-hover:shadow-amber-300 group-hover:scale-105 transition-all duration-200">
              <span className="text-lg">📦</span>
            </div>
            <span className="font-black text-slate-900 text-lg tracking-tight hidden sm:inline">
              RentIt <span className="text-amber-500">Nairobi</span>
            </span>
          </button>

          {/* Desktop nav links */}
          {isLoggedIn && (
            <div className="hidden md:flex items-center gap-1 bg-slate-100/80 rounded-2xl p-1">
              {links.map(link => {
                const active = location.pathname.startsWith(link.to);
                return (
                  <button
                    key={link.to}
                    onClick={() => navigate(link.to)}
                    className={`relative text-sm font-bold px-3.5 py-2 rounded-xl border-0 cursor-pointer transition-all duration-200 whitespace-nowrap ${
                      active
                        ? 'bg-white text-amber-600 shadow-sm shadow-slate-200'
                        : 'bg-transparent text-slate-500 hover:text-slate-800 hover:bg-white/60'
                    }`}
                  >
                    {active && (
                      <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-amber-500" />
                    )}
                    {link.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2">
            {isLoggedIn ? (
              <>
                <button
                  onClick={() => navigate('/listings/new')}
                  className="btn-primary text-sm px-4 py-2 flex items-center gap-1.5"
                >
                  <span className="text-base leading-none">+</span> List item
                </button>
                <button
                  onClick={onLogout}
                  className="btn-ghost text-sm px-4 py-2"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <button onClick={() => navigate('/login')} className="btn-ghost text-sm px-4 py-2">
                  Sign in
                </button>
                <button onClick={() => navigate('/register')} className="btn-primary text-sm px-4 py-2">
                  Register
                </button>
              </>
            )}
          </div>
        </div>

        {/* Mobile nav */}
        {isLoggedIn && (
          <div className="flex md:hidden items-center gap-1 overflow-x-auto pb-2 pt-1 scrollbar-hide">
            {links.map(link => {
              const active = location.pathname.startsWith(link.to);
              return (
                <button
                  key={link.to}
                  onClick={() => navigate(link.to)}
                  className={`shrink-0 flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border-0 cursor-pointer transition-all duration-200 ${
                    active
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  <span>{link.icon}</span>{link.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
