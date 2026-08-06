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

  return (
    <div className="page-bg min-h-screen p-8">
      <Nav onLogout={onLogout} />
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-black text-slate-900">
          {me ? `Hey, ${me.full_name || me.username}` : 'Loading...'}
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button onClick={() => navigate('/browse')} className="card p-6 text-left cursor-pointer border-0">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Browse</p>
            <p className="text-lg font-black text-slate-900">Find something to rent</p>
          </button>
          <button onClick={() => navigate('/my-listings')} className="card p-6 text-left cursor-pointer border-0">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Owner</p>
            <p className="text-lg font-black text-slate-900">{listings.length} listing{listings.length === 1 ? '' : 's'} live</p>
          </button>
          <button onClick={() => navigate('/my-bookings')} className="card p-6 text-left cursor-pointer border-0">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Renter</p>
            <p className="text-lg font-black text-slate-900">
              {pendingRequests > 0 ? `${pendingRequests} pending request${pendingRequests === 1 ? '' : 's'}` : `${bookings.length} booking${bookings.length === 1 ? '' : 's'}`}
            </p>
          </button>
        </div>

        <div className="card p-6 text-center text-slate-400 text-sm">
          Deposit/escrow via M-Pesa and ratings arrive in Phase 2.
        </div>
      </div>
    </div>
  );
}
