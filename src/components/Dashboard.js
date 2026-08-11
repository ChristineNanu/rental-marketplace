import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../constants';
import { apiFetch } from '../api';
import Nav from './Nav';

function StatCard({ icon, label, value, sub, delay = 0, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{ animationDelay: `${delay}ms` }}
      className="card p-6 text-left cursor-pointer w-full animate-fade-up group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-200">
          {icon}
        </div>
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</span>
      </div>
      <p className="text-3xl font-black text-slate-900 mb-1">{value}</p>
      {sub && <p className="text-sm text-slate-400">{sub}</p>}
    </button>
  );
}

export default function Dashboard({ onLogout }) {
  const navigate = useNavigate();
  const [me, setMe] = useState(null);
  const [listings, setListings] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([
      apiFetch(`${API_BASE_URL}/me`).then(r => r.ok ? r.json() : null),
      apiFetch(`${API_BASE_URL}/my-listings`).then(r => r.ok ? r.json() : []),
      apiFetch(`${API_BASE_URL}/my-bookings`).then(r => r.ok ? r.json() : []),
    ]).then(([meData, listingsData, bookingsData]) => {
      setMe(meData);
      setListings(listingsData || []);
      setBookings(bookingsData || []);
      setLoaded(true);
    }).catch(() => { setError(true); setLoaded(true); });
  }, []);

  const pendingRequests = bookings.filter(b => b.status === 'requested').length;
  const activeListings  = listings.filter(l => l.status === 'active').length;
  const activeBookings  = bookings.filter(b => ['accepted','requested'].includes(b.status)).length;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="page-bg min-h-screen">
      <div className="max-w-6xl mx-auto px-4 pb-16">
        <Nav onLogout={onLogout} isLoggedIn={true} />

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-100 text-sm text-red-600 font-semibold flex items-center gap-2 animate-slide-down">
            <span>⚠️</span> Could not load your data. Check your connection and refresh.
          </div>
        )}

        {/* Hero banner */}
        <div className="relative overflow-hidden rounded-3xl mb-8 animate-fade-up">
          <div
            className="animate-gradient p-8 sm:p-12 text-white"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706, #b45309, #f59e0b)', backgroundSize: '300% 300%' }}
          >
            {/* Decorative blobs */}
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/4" />
            <div className="absolute bottom-0 left-1/3 w-48 h-48 rounded-full bg-white/5 translate-y-1/2" />

            <div className="relative">
              <p className="text-amber-200 text-sm font-bold uppercase tracking-widest mb-2">
                {greeting()} 👋
              </p>
              <h1 className="text-3xl sm:text-4xl font-black mb-4 leading-tight">
                {me ? (me.full_name || me.username) : (
                  <span className="inline-block w-48 h-9 rounded-xl bg-white/20 animate-pulse" />
                )}
              </h1>
              {me && (
                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-2xl px-4 py-2 text-sm">
                    <span>🏠</span>
                    <span className="font-semibold">
                      Owner: {me.rating_as_owner.count > 0
                        ? `${me.rating_as_owner.avg.toFixed(1)}★ (${me.rating_as_owner.count})`
                        : 'No ratings yet'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-2xl px-4 py-2 text-sm">
                    <span>🛍️</span>
                    <span className="font-semibold">
                      Renter: {me.rating_as_renter.count > 0
                        ? `${me.rating_as_renter.avg.toFixed(1)}★ (${me.rating_as_renter.count})`
                        : 'No ratings yet'}
                    </span>
                  </div>
                  {me.is_business && (
                    <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-2xl px-4 py-2 text-sm font-bold">
                      <span>💼</span> Business account
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 stagger">
          <StatCard
            icon="🔍" label="Browse" delay={0}
            value="Explore"
            sub="Find something to rent nearby"
            onClick={() => navigate('/browse')}
          />
          <StatCard
            icon="🏷️" label="Owner" delay={60}
            value={loaded ? activeListings : '—'}
            sub={`listing${activeListings === 1 ? '' : 's'} live`}
            onClick={() => navigate('/my-listings')}
          />
          <StatCard
            icon="📅" label="Renter" delay={120}
            value={loaded ? (pendingRequests > 0 ? pendingRequests : activeBookings) : '—'}
            sub={pendingRequests > 0 ? `pending request${pendingRequests === 1 ? '' : 's'}` : `active booking${activeBookings === 1 ? '' : 's'}`}
            onClick={() => navigate('/my-bookings')}
          />
        </div>

        {/* Quick actions */}
        <div className="glass p-6 animate-fade-up" style={{ animationDelay: '200ms' }}>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Quick actions</p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate('/listings/new')}
              className="btn-primary px-5 py-2.5 text-sm flex items-center gap-2"
            >
              <span>+</span> List an item
            </button>
            <button
              onClick={() => navigate('/browse')}
              className="btn-ghost px-5 py-2.5 text-sm flex items-center gap-2"
            >
              <span>🔍</span> Browse listings
            </button>
            <button
              onClick={() => navigate('/business')}
              className="btn-ghost px-5 py-2.5 text-sm flex items-center gap-2"
            >
              <span>💼</span> Business plans
            </button>
          </div>
        </div>

        {/* Empty state */}
        {loaded && listings.length === 0 && bookings.length === 0 && (
          <div className="mt-6 card-static p-10 text-center animate-scale-in">
            <div className="text-5xl mb-4 animate-float inline-block">👋</div>
            <p className="font-black text-slate-900 text-xl mb-2">Nothing here yet</p>
            <p className="text-slate-500 mb-6 max-w-sm mx-auto">
              List an item to start earning, or browse what's already up in Kilimani.
            </p>
            <div className="flex justify-center gap-3">
              <button onClick={() => navigate('/listings/new')} className="btn-primary px-6 py-2.5 text-sm">
                List an item
              </button>
              <button onClick={() => navigate('/browse')} className="btn-ghost px-6 py-2.5 text-sm">
                Browse
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
