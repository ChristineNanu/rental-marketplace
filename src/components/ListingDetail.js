import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../constants';
import { apiFetch } from '../api';
import Nav from './Nav';
import PhotoGallery from './PhotoGallery';

function isDateInBookedRange(dateStr, bookedRanges) {
  const d = new Date(dateStr);
  return bookedRanges.some(({ start, end }) => {
    const s = new Date(start), e = new Date(end);
    return d >= s && d < e;
  });
}

export default function ListingDetail({ onLogout, isLoggedIn }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [bookedRanges, setBookedRanges] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE_URL}/listings/${id}`).then(r => r.ok ? r.json() : null).then(setListing);
    fetch(`${API_BASE_URL}/listings/${id}/booked-dates`).then(r => r.ok ? r.json() : []).then(setBookedRanges);
  }, [id]);

  const today = new Date().toISOString().split('T')[0];

  const days = startDate && endDate
    ? Math.max(1, Math.round((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)))
    : 0;
  const estimate = listing ? days * listing.price_per_day : 0;

  const handleStartDate = (val) => {
    setError('');
    if (isDateInBookedRange(val, bookedRanges)) {
      setError('That start date falls within an existing booking. Please choose another date.');
      return;
    }
    setStartDate(val);
    setEndDate('');
  };

  const handleEndDate = (val) => {
    setError('');
    if (isDateInBookedRange(val, bookedRanges)) {
      setError('That end date falls within an existing booking. Please choose another date.');
      return;
    }
    setEndDate(val);
  };

  const handleRequest = async (e) => {
    e.preventDefault();
    setError(''); setSuccess(''); setSubmitting(true);
    try {
      const res = await apiFetch(`${API_BASE_URL}/listings/${id}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start_date: new Date(startDate).toISOString(),
          end_date: new Date(endDate).toISOString(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('Request sent! Track it under My Bookings.');
      } else {
        setError(data.detail || 'Could not send request.');
      }
    } catch {
      setError('Connection error. Is the backend running?');
    } finally {
      setSubmitting(false);
    }
  };

  if (!listing) {
    return (
      <div className="page-bg min-h-screen p-8">
        <Nav onLogout={onLogout} isLoggedIn={isLoggedIn} />
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6 animate-pulse">
          <div className="aspect-[4/3] bg-slate-100 rounded-3xl" />
          <div className="card-static p-6 space-y-3">
            <div className="h-3 w-1/3 bg-slate-100 rounded" />
            <div className="h-6 w-2/3 bg-slate-100 rounded" />
            <div className="h-24 w-full bg-slate-100 rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-bg min-h-screen p-8">
      <Nav onLogout={onLogout} isLoggedIn={isLoggedIn} />
      <div className="max-w-5xl mx-auto space-y-4">
        <button onClick={() => navigate(-1)} className="text-sm font-bold text-slate-500 bg-transparent border-0 cursor-pointer">
          ← Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6 items-start">
          <div className="space-y-4">
            <PhotoGallery photos={listing.photos} />

            <div className="card-static p-6">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-xs font-black text-amber-600 uppercase tracking-widest">{listing.category.name} · {listing.area.name}</p>
                {listing.owner.is_business && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-600">BUSINESS</span>
                )}
              </div>
              <h1 className="text-2xl font-black text-slate-900 mb-3">{listing.title}</h1>
              <p className="text-slate-600 leading-relaxed">{listing.description || 'No description provided.'}</p>

              <div className="flex items-center gap-3 mt-5 pt-5 border-t border-slate-100">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-black text-lg shrink-0">
                  {(listing.owner.full_name || listing.owner.username || '?')[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-black text-slate-900 text-sm">{listing.owner.full_name || listing.owner.username}</p>
                  <p className="text-xs text-slate-400">
                    {listing.owner.rating_as_owner_count > 0
                      ? `${listing.owner.rating_as_owner_avg.toFixed(1)}★ · ${listing.owner.rating_as_owner_count} rating${listing.owner.rating_as_owner_count === 1 ? '' : 's'} as an owner`
                      : 'No ratings yet as an owner'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:sticky lg:top-8">
            <div className="card-static p-6">
              <div className="flex items-baseline justify-between mb-1">
                <p className="text-2xl font-black text-slate-900">KES {listing.price_per_day.toLocaleString()}</p>
                <p className="text-slate-400 text-sm">/day</p>
              </div>
              {listing.deposit_amount > 0 && (
                <p className="text-xs text-slate-400 mb-4">+ KES {listing.deposit_amount.toLocaleString()} refundable deposit</p>
              )}

              {bookedRanges.length > 0 && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                  <p className="text-xs font-bold text-amber-700 mb-1">Already booked:</p>
                  {bookedRanges.map((r, i) => (
                    <p key={i} className="text-xs text-amber-600">
                      {new Date(r.start).toLocaleDateString()} – {new Date(r.end).toLocaleDateString()}
                    </p>
                  ))}
                </div>
              )}

              {isLoggedIn ? (
                <form onSubmit={handleRequest} className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1">Start</label>
                      <input
                        type="date"
                        className="input-field"
                        value={startDate}
                        min={today}
                        onChange={e => handleStartDate(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1">End</label>
                      <input
                        type="date"
                        className="input-field"
                        value={endDate}
                        min={startDate || today}
                        onChange={e => handleEndDate(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  {days > 0 && (
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-sm text-slate-700">
                      {days} day{days > 1 ? 's' : ''} × KES {listing.price_per_day.toLocaleString()} = <strong>KES {estimate.toLocaleString()}</strong>
                      {listing.deposit_amount > 0 && <> + KES {listing.deposit_amount.toLocaleString()} deposit</>}
                    </div>
                  )}
                  {error && <p className="text-sm text-red-600 font-semibold">{error}</p>}
                  {success && <p className="text-sm text-emerald-600 font-semibold">{success}</p>}
                  <button type="submit" disabled={submitting} className="btn-primary w-full py-3">
                    {submitting ? 'Sending...' : 'Send request'}
                  </button>
                </form>
              ) : (
                <div className="text-center space-y-3 pt-2">
                  <p className="text-sm text-slate-500">Sign in to send a booking request.</p>
                  <button onClick={() => navigate('/login')} className="btn-primary w-full py-3">Sign in to book</button>
                  <button onClick={() => navigate('/register')} className="w-full text-sm font-bold text-slate-500 bg-white border border-slate-200 py-2 rounded-xl cursor-pointer">
                    Create account
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
