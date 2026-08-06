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

export default function MyBookings({ onLogout }) {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = () => apiFetch(`${API_BASE_URL}/my-bookings`)
    .then(r => r.ok ? r.json() : [])
    .then(setBookings);

  useEffect(() => { load(); }, []);

  const cancel = async (id) => {
    setBusyId(id);
    await apiFetch(`${API_BASE_URL}/bookings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'cancelled' }),
    });
    await load();
    setBusyId(null);
  };

  return (
    <div className="page-bg min-h-screen p-8">
      <Nav onLogout={onLogout} />
      <div className="max-w-4xl mx-auto space-y-4">
        <h1 className="text-2xl font-black text-slate-900">My Bookings</h1>

        {bookings === null ? (
          <p className="text-center text-slate-400 py-12">Loading...</p>
        ) : bookings.length === 0 ? (
          <div className="card p-8 text-center text-slate-400">
            No rental requests yet.
            <button onClick={() => navigate('/browse')} className="block mx-auto mt-3 btn-primary px-6 py-2">Browse listings</button>
          </div>
        ) : (
          bookings.map(b => (
            <div key={b.id} className="card p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-amber-600 uppercase tracking-widest mb-1">{b.listing.category.name} · {b.listing.area.name}</p>
                <h3 className="text-lg font-black text-slate-900">{b.listing.title}</h3>
                <p className="text-sm text-slate-500">
                  {new Date(b.start_date).toLocaleDateString()} – {new Date(b.end_date).toLocaleDateString()} · KES {b.total_price.toLocaleString()}
                  {b.deposit_amount > 0 && <> + KES {b.deposit_amount.toLocaleString()} deposit</>}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-lg text-xs font-bold ${STATUS_STYLES[b.status] || 'bg-slate-100 text-slate-500'}`}>{b.status}</span>
                {(b.status === 'requested' || b.status === 'accepted') && (
                  <button disabled={busyId === b.id} onClick={() => cancel(b.id)} className="text-xs font-bold text-red-500 bg-white border border-red-200 rounded-lg px-2 py-1 cursor-pointer">
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
