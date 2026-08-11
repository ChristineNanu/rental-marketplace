import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../constants';
import { apiFetch } from '../api';
import Nav from './Nav';
import MpesaPaymentModal from './MpesaPaymentModal';
import RatingModal from './RatingModal';
import ListingThumb from './ListingThumb';

const STATUS_STYLES = {
  requested: 'bg-amber-100 text-amber-700',
  accepted: 'bg-emerald-100 text-emerald-700',
  declined: 'bg-slate-100 text-slate-500',
  cancelled: 'bg-slate-100 text-slate-500',
  completed: 'bg-blue-100 text-blue-700',
};

const DEPOSIT_LABELS = {
  held: 'Deposit held',
  released: 'Deposit refunded',
  claimed: 'Deposit claimed by owner',
};

export default function MyBookings({ onLogout }) {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [payingBooking, setPayingBooking] = useState(null);
  const [ratingBooking, setRatingBooking] = useState(null);
  const [ratedIds, setRatedIds] = useState(new Set());

  const load = async () => {
    const res = await apiFetch(`${API_BASE_URL}/my-bookings`);
    const data = res.ok ? await res.json() : [];
    setBookings(data);
    // For each completed booking, check if the renter has already rated
    const completed = data.filter(b => b.status === 'completed');
    const checks = await Promise.all(
      completed.map(b =>
        apiFetch(`${API_BASE_URL}/bookings/${b.id}/ratings`)
          .then(r => r.ok ? r.json() : [])
          .then(ratings => ratings.some(r => r.rated_role === 'owner') ? b.id : null)
      )
    );
    setRatedIds(new Set(checks.filter(Boolean)));
  };

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
          <div className="card-static p-8 text-center text-slate-400">
            No rental requests yet.
            <button onClick={() => navigate('/browse')} className="block mx-auto mt-3 btn-primary px-6 py-2">Browse listings</button>
          </div>
        ) : (
          bookings.map(b => (
            <div key={b.id} className="card-static p-5 flex items-center gap-4 flex-wrap">
              <ListingThumb photos={b.listing.photos} alt={b.listing.title} className="w-20 h-20 rounded-2xl shrink-0" iconClassName="text-2xl" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-amber-600 uppercase tracking-widest mb-1">{b.listing.category.name} · {b.listing.area.name}</p>
                <h3 className="text-lg font-black text-slate-900">{b.listing.title}</h3>
                <p className="text-sm text-slate-500">
                  {new Date(b.start_date).toLocaleDateString()} – {new Date(b.end_date).toLocaleDateString()} · KES {b.total_price.toLocaleString()}
                  {b.deposit_amount > 0 && <> + KES {b.deposit_amount.toLocaleString()} deposit</>}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-2 py-1 rounded-lg text-xs font-bold ${STATUS_STYLES[b.status] || 'bg-slate-100 text-slate-500'}`}>{b.status}</span>
                {b.payment_status === 'paid' && (
                  <span className="px-2 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-600">Paid</span>
                )}
                {b.deposit_status !== 'none' && (
                  <span className="px-2 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-500">{DEPOSIT_LABELS[b.deposit_status]}</span>
                )}
                {b.status === 'accepted' && b.payment_status === 'unpaid' && (
                  <button onClick={() => setPayingBooking(b)} className="text-xs font-bold text-white bg-emerald-600 rounded-lg px-3 py-1.5 cursor-pointer border-0">
                    Pay now
                  </button>
                )}
                {(b.status === 'requested' || b.status === 'accepted') && (
                  <button disabled={busyId === b.id} onClick={() => cancel(b.id)} className="text-xs font-bold text-red-500 bg-white border border-red-200 rounded-lg px-2 py-1 cursor-pointer">
                    Cancel
                  </button>
                )}
                {b.status === 'completed' && !ratedIds.has(b.id) && (
                  <button onClick={() => setRatingBooking(b)} className="text-xs font-bold text-amber-600 bg-white border border-amber-200 rounded-lg px-2 py-1 cursor-pointer">
                    Rate owner
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {payingBooking && (
        <MpesaPaymentModal
          booking={payingBooking}
          onCancel={() => setPayingBooking(null)}
          onSuccess={() => { setPayingBooking(null); load(); }}
        />
      )}

      {ratingBooking && (
        <RatingModal
          booking={ratingBooking}
          targetLabel="the owner"
          onCancel={() => setRatingBooking(null)}
          onSuccess={() => { setRatedIds(ids => new Set([...ids, ratingBooking.id])); setRatingBooking(null); }}
        />
      )}
    </div>
  );
}
