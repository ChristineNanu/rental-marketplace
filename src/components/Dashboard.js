import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../constants';
import { apiFetch } from '../api';
import Nav from './Nav';

export default function Dashboard({ onLogout }) {
  const navigate = useNavigate();
  const [me, setMe] = useState(null);
  const [listings, setListings] = useState([]);
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    apiFetch(`${API_BASE_URL}/me`).then(r => r.ok ? r.json() : null).then(setMe);
    apiFetch(`${API_BASE_URL}/my-listings`).then(r => r.ok ? r.json() : []).then(setListings);
    apiFetch(`${API_BASE_URL}/my-bookings`).then(r => r.ok ? r.json() : []).then(setBookings);
  }, []);

  const pendingRequests = bookings.filter(b => b.status === 'requested').length;
  const activeListings = listings.filter(l => l.status === 'active').length;

  return (
    <div className="page-bg min-h-screen p-8">
      <Nav onLogout={onLogout} />
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="card-static p-8 bg-gradient-to-br from-amber-500 to-amber-600 border-0 text-white">
          <p className="text-amber-100 text-sm font-bold uppercase tracking-widest mb-1">Welcome back</p>
          <h1 className="text-3xl font-black mb-4">
            {me ? (me.full_name || me.username) : 'Loading...'}
          </h1>
          {me && (
            <div className="flex flex-wrap gap-4 text-sm">
              <span className="bg-white/15 rounded-xl px-3 py-1.5">
                As owner: {me.rating_as_owner.count > 0 ? `${me.rating_as_owner.avg.toFixed(1)}★ (${me.rating_as_owner.count})` : 'No ratings yet'}
              </span>
              <span className="bg-white/15 rounded-xl px-3 py-1.5">
                As renter: {me.rating_as_renter.count > 0 ? `${me.rating_as_renter.avg.toFixed(1)}★ (${me.rating_as_renter.count})` : 'No ratings yet'}
              </span>
              {me.is_business && <span className="bg-white/15 rounded-xl px-3 py-1.5 font-bold">★ Business account</span>}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button onClick={() => navigate('/browse')} className="card p-6 text-left cursor-pointer border-0">
            <p className="text-2xl mb-2">🔍</p>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Browse</p>
            <p className="text-lg font-black text-slate-900">Find something to rent</p>
          </button>
          <button onClick={() => navigate('/my-listings')} className="card p-6 text-left cursor-pointer border-0">
            <p className="text-2xl mb-2">🏷️</p>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Owner</p>
            <p className="text-lg font-black text-slate-900">{activeListings} listing{activeListings === 1 ? '' : 's'} live</p>
          </button>
          <button onClick={() => navigate('/my-bookings')} className="card p-6 text-left cursor-pointer border-0">
            <p className="text-2xl mb-2">📅</p>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Renter</p>
            <p className="text-lg font-black text-slate-900">
              {pendingRequests > 0 ? `${pendingRequests} pending request${pendingRequests === 1 ? '' : 's'}` : `${bookings.length} booking${bookings.length === 1 ? '' : 's'}`}
            </p>
          </button>
        </div>

        {listings.length === 0 && bookings.length === 0 && (
          <div className="card-static p-8 text-center">
            <p className="text-3xl mb-2">👋</p>
            <p className="font-black text-slate-900 mb-1">Nothing here yet</p>
            <p className="text-sm text-slate-500 mb-4">List an item to start earning, or browse what's already up in Kilimani.</p>
            <div className="flex justify-center gap-3">
              <button onClick={() => navigate('/listings/new')} className="btn-primary px-5 py-2 text-sm">List an item</button>
              <button onClick={() => navigate('/browse')} className="text-sm font-bold text-slate-500 bg-white border border-slate-200 px-5 py-2 rounded-xl cursor-pointer">Browse</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
