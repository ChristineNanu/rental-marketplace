import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../constants';
import { apiFetch } from '../api';
import Nav from './Nav';
import RatingModal from './RatingModal';
import SimplePaymentModal from './SimplePaymentModal';
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
  claimed: 'Deposit claimed',
};

function ClaimDepositModal({ booking, onCancel, onSuccess }) {
  const [phone, setPhone] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSubmitting(true);
    try {
      const res = await apiFetch(`${API_BASE_URL}/bookings/${booking.id}/claim-deposit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, reason }),
      });
      const data = await res.json();
      if (res.ok) {
        onSuccess();
      } else {
        setError(data.detail || 'Could not claim deposit.');
      }
    } catch {
      setError('Connection error. Is the backend running?');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="card p-8 w-full max-w-md">
        <p className="text-xs font-black text-red-500 uppercase tracking-widest mb-1">Claim deposit</p>
        <h2 className="text-xl font-black text-slate-900 mb-1">{booking.listing.title}</h2>
        <p className="text-sm text-slate-500 mb-6">KES {booking.deposit_amount.toLocaleString()} will be paid out to the phone number below.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input className="input-field" type="tel" placeholder="Your M-PESA phone e.g. 0712345678" value={phone} onChange={e => setPhone(e.target.value)} required />
          <textarea className="input-field" rows={3} placeholder="Reason (e.g. item returned damaged)" value={reason} onChange={e => setReason(e.target.value)} required />
          {error && <p className="text-sm text-red-600 font-semibold">{error}</p>}
          <button type="submit" disabled={submitting} className="w-full py-3 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-bold border-0 cursor-pointer">
            {submitting ? 'Submitting...' : 'Claim deposit'}
          </button>
          <button type="button" onClick={onCancel} className="w-full text-sm font-bold text-slate-500 bg-transparent border-0 cursor-pointer py-1">Cancel</button>
        </form>
      </div>
    </div>
  );
}

function RequestsPanel({ listingId, onDepositResolved }) {
  const [bookings, setBookings] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [claimingBooking, setClaimingBooking] = useState(null);
  const [ratingBooking, setRatingBooking] = useState(null);
  const [ratedIds, setRatedIds] = useState([]);

  const load = () => apiFetch(`${API_BASE_URL}/listings/${listingId}/bookings`)
    .then(r => r.ok ? r.json() : [])
    .then(setBookings);

  useEffect(() => { load(); }, [listingId]); // eslint-disable-line react-hooks/exhaustive-deps

  const act = async (bookingId, status) => {
    setBusyId(bookingId);
    const res = await apiFetch(`${API_BASE_URL}/bookings/${bookingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      window.alert(data.detail || 'That action failed.');
    }
    await load();
    setBusyId(null);
  };

  const releaseDeposit = async (bookingId) => {
    setBusyId(bookingId);
    const res = await apiFetch(`${API_BASE_URL}/bookings/${bookingId}/release-deposit`, { method: 'POST' });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      window.alert(data.detail || 'Could not release deposit.');
    }
    await load();
    onDepositResolved();
    setBusyId(null);
  };

  if (bookings === null) return <p className="text-sm text-slate-400 py-3">Loading requests...</p>;
  if (bookings.length === 0) return <p className="text-sm text-slate-400 py-3">No requests yet.</p>;

  return (
    <div className="space-y-2 pt-3 border-t border-slate-100 mt-3">
      {bookings.map(b => (
        <div key={b.id} className="flex items-center justify-between text-sm bg-slate-50 rounded-xl px-3 py-2 flex-wrap gap-y-2">
          <div>
            <span className="font-bold text-slate-700">{b.renter.full_name || b.renter.username}</span>
            <span className="text-slate-400"> · {new Date(b.start_date).toLocaleDateString()} – {new Date(b.end_date).toLocaleDateString()}</span>
            <span className="text-slate-400"> · KES {b.total_price.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-2 py-1 rounded-lg text-xs font-bold ${STATUS_STYLES[b.status] || 'bg-slate-100 text-slate-500'}`}>{b.status}</span>
            {b.status === 'accepted' && b.payment_status === 'unpaid' && (
              <span className="px-2 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-600">Awaiting payment</span>
            )}
            {b.deposit_status !== 'none' && (
              <span className="px-2 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-500">{DEPOSIT_LABELS[b.deposit_status]}</span>
            )}
            {b.status === 'requested' && (
              <>
                <button disabled={busyId === b.id} onClick={() => act(b.id, 'accepted')} className="text-xs font-bold text-emerald-600 bg-white border border-emerald-200 rounded-lg px-2 py-1 cursor-pointer">Accept</button>
                <button disabled={busyId === b.id} onClick={() => act(b.id, 'declined')} className="text-xs font-bold text-red-500 bg-white border border-red-200 rounded-lg px-2 py-1 cursor-pointer">Decline</button>
              </>
            )}
            {b.status === 'accepted' && (
              <button disabled={busyId === b.id || b.payment_status !== 'paid'} onClick={() => act(b.id, 'completed')} className="text-xs font-bold text-blue-600 bg-white border border-blue-200 rounded-lg px-2 py-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">Mark completed</button>
            )}
            {b.status === 'completed' && b.deposit_status === 'held' && (
              <>
                <button disabled={busyId === b.id} onClick={() => releaseDeposit(b.id)} className="text-xs font-bold text-emerald-600 bg-white border border-emerald-200 rounded-lg px-2 py-1 cursor-pointer">Release deposit</button>
                <button disabled={busyId === b.id} onClick={() => setClaimingBooking(b)} className="text-xs font-bold text-red-500 bg-white border border-red-200 rounded-lg px-2 py-1 cursor-pointer">Claim deposit</button>
              </>
            )}
            {b.status === 'completed' && !ratedIds.includes(b.id) && (
              <button onClick={() => setRatingBooking(b)} className="text-xs font-bold text-amber-600 bg-white border border-amber-200 rounded-lg px-2 py-1 cursor-pointer">Rate renter</button>
            )}
          </div>
        </div>
      ))}

      {claimingBooking && (
        <ClaimDepositModal
          booking={claimingBooking}
          onCancel={() => setClaimingBooking(null)}
          onSuccess={() => { setClaimingBooking(null); load(); onDepositResolved(); }}
        />
      )}

      {ratingBooking && (
        <RatingModal
          booking={ratingBooking}
          targetLabel="the renter"
          onCancel={() => setRatingBooking(null)}
          onSuccess={() => { setRatedIds(ids => [...ids, ratingBooking.id]); setRatingBooking(null); }}
        />
      )}
    </div>
  );
}

export default function MyListings({ onLogout }) {
  const navigate = useNavigate();
  const [listings, setListings] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [featuringListing, setFeaturingListing] = useState(null);

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
          <div className="card-static p-8 text-center text-slate-400">
            You haven't listed anything yet.
            <button onClick={() => navigate('/listings/new')} className="block mx-auto mt-3 btn-primary px-6 py-2">List your first item</button>
          </div>
        ) : (
          listings.map(listing => (
            <div key={listing.id} className="card-static p-5">
              <div className="flex items-start gap-4">
                <ListingThumb photos={listing.photos} alt={listing.title} className="w-20 h-20 rounded-2xl shrink-0" iconClassName="text-2xl" />
                <div className="flex-1 min-w-0 flex items-start justify-between flex-wrap gap-2">
                  <div>
                    <p className="text-xs font-black text-amber-600 uppercase tracking-widest mb-1">{listing.category.name} · {listing.area.name}</p>
                    <h3 className="text-lg font-black text-slate-900 flex items-center gap-2 flex-wrap">
                      {listing.title}
                      {listing.is_featured && <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-amber-100 text-amber-700">★ Featured</span>}
                    </h3>
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
              </div>
              <div className="flex items-center gap-3 mt-2">
                <button
                  onClick={() => setExpanded(expanded === listing.id ? null : listing.id)}
                  className="text-xs font-bold text-amber-600 bg-transparent border-0 cursor-pointer"
                >
                  {expanded === listing.id ? 'Hide requests ▲' : 'View requests ▼'}
                </button>
                {!listing.is_featured && (
                  <button
                    onClick={() => setFeaturingListing(listing)}
                    className="text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-lg px-2 py-1 cursor-pointer border-0"
                  >
                    ★ Feature for 7 days (KES 200)
                  </button>
                )}
              </div>
              {expanded === listing.id && <RequestsPanel listingId={listing.id} onDepositResolved={load} />}
            </div>
          ))
        )}
      </div>

      {featuringListing && (
        <SimplePaymentModal
          title={`Feature "${featuringListing.title}"`}
          subtitle="Featured listings show first in Browse for 7 days."
          amount={200}
          payUrl={`/listings/${featuringListing.id}/feature`}
          onCancel={() => setFeaturingListing(null)}
          onSuccess={() => { setFeaturingListing(null); load(); }}
        />
      )}
    </div>
  );
}
