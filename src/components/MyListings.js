import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../constants';
import { apiFetch } from '../api';
import Nav from './Nav';

const STATUS_STYLES = {
  requested: 'bg-amber-100 text-amber-700',
  accepted: 'bg-emerald-100 text-emerald-700',
  declined: 'bg-slate-100 text-slate-500',
  cancelled: 'bg-slate-100 text-slate-500',
  completed: 'bg-blue-100 text-blue-700',
};

function RequestsPanel({ listingId }) {
  const [bookings, setBookings] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = () => apiFetch(`${API_BASE_URL}/listings/${listingId}/bookings`)
    .then(r => r.ok ? r.json() : [])
    .then(setBookings);

  useEffect(() => { load(); }, [listingId]); // eslint-disable-line react-hooks/exhaustive-deps

  const act = async (bookingId, status) => {
    setBusyId(bookingId);
    await apiFetch(`${API_BASE_URL}/bookings/${bookingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    await load();
    setBusyId(null);
  };

  if (bookings === null) return <p className="text-sm text-slate-400 py-3">Loading requests...</p>;
  if (bookings.length === 0) return <p className="text-sm text-slate-400 py-3">No requests yet.</p>;

  return (
    <div className="space-y-2 pt-3 border-t border-slate-100 mt-3">
      {bookings.map(b => (
        <div key={b.id} className="flex items-center justify-between text-sm bg-slate-50 rounded-xl px-3 py-2">
          <div>
            <span className="font-bold text-slate-700">{b.renter.full_name || b.renter.username}</span>
            <span className="text-slate-400"> · {new Date(b.start_date).toLocaleDateString()} – {new Date(b.end_date).toLocaleDateString()}</span>
            <span className="text-slate-400"> · KES {b.total_price.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded-lg text-xs font-bold ${STATUS_STYLES[b.status] || 'bg-slate-100 text-slate-500'}`}>{b.status}</span>
            {b.status === 'requested' && (
              <>
                <button disabled={busyId === b.id} onClick={() => act(b.id, 'accepted')} className="text-xs font-bold text-emerald-600 bg-white border border-emerald-200 rounded-lg px-2 py-1 cursor-pointer">Accept</button>
                <button disabled={busyId === b.id} onClick={() => act(b.id, 'declined')} className="text-xs font-bold text-red-500 bg-white border border-red-200 rounded-lg px-2 py-1 cursor-pointer">Decline</button>
              </>
            )}
            {b.status === 'accepted' && (
              <button disabled={busyId === b.id} onClick={() => act(b.id, 'completed')} className="text-xs font-bold text-blue-600 bg-white border border-blue-200 rounded-lg px-2 py-1 cursor-pointer">Mark completed</button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function MyListings({ onLogout }) {
  const navigate = useNavigate();
  const [listings, setListings] = useState(null);
  const [expanded, setExpanded] = useState(null);

  const load = () => apiFetch(`${API_BASE_URL}/my-listings`)
    .then(r => r.ok ? r.json() : [])
    .then(setListings);

  useEffect(() => { load(); }, []);

  const togglePause = async (listing) => {
    await apiFetch(`${API_BASE_URL}/listings/${listing.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: listing.status === 'active' ? 'paused' : 'active' }),
    });
    load();
  };

  const remove = async (listing) => {
    if (!window.confirm(`Remove "${listing.title}"? This can't be undone.`)) return;
    await apiFetch(`${API_BASE_URL}/listings/${listing.id}`, { method: 'DELETE' });
    load();
  };

  return (
    <div className="page-bg min-h-screen p-8">
      <Nav onLogout={onLogout} />
      <div className="max-w-4xl mx-auto space-y-4">
        <h1 className="text-2xl font-black text-slate-900">My Listings</h1>

        {listings === null ? (
          <p className="text-center text-slate-400 py-12">Loading...</p>
        ) : listings.length === 0 ? (
          <div className="card p-8 text-center text-slate-400">
            You haven't listed anything yet.
            <button onClick={() => navigate('/listings/new')} className="block mx-auto mt-3 btn-primary px-6 py-2">List your first item</button>
          </div>
        ) : (
          listings.map(listing => (
            <div key={listing.id} className="card p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-black text-amber-600 uppercase tracking-widest mb-1">{listing.category.name} · {listing.area.name}</p>
                  <h3 className="text-lg font-black text-slate-900">{listing.title}</h3>
                  <p className="text-sm text-slate-500">KES {listing.price_per_day.toLocaleString()}/day</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-lg text-xs font-bold ${listing.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {listing.status}
                  </span>
                  <button onClick={() => togglePause(listing)} className="text-xs font-bold text-slate-500 bg-white border border-slate-200 rounded-lg px-2 py-1 cursor-pointer">
                    {listing.status === 'active' ? 'Pause' : 'Reactivate'}
                  </button>
                  <button onClick={() => remove(listing)} className="text-xs font-bold text-red-500 bg-white border border-red-200 rounded-lg px-2 py-1 cursor-pointer">
                    Remove
                  </button>
                </div>
              </div>
              <button
                onClick={() => setExpanded(expanded === listing.id ? null : listing.id)}
                className="text-xs font-bold text-amber-600 bg-transparent border-0 cursor-pointer mt-2"
              >
                {expanded === listing.id ? 'Hide requests ▲' : 'View requests ▼'}
              </button>
              {expanded === listing.id && <RequestsPanel listingId={listing.id} />}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
