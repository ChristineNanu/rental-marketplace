import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../constants';
import { apiFetch } from '../api';
import { getErrorMessage } from '../utils/validation';
import Nav from './Nav';
import PhotoGallery from './PhotoGallery';

// Check if a single date falls within any booked range
function isDateInBookedRange(dateStr, bookedRanges) {
  const d = new Date(dateStr);
  return bookedRanges.some(({ start, end }) => {
    const s = new Date(start), e = new Date(end);
    return d >= s && d < e;
  });
}

// Check if a date range overlaps with ANY booked range
function doesRangeOverlapBookedDates(startStr, endStr, bookedRanges) {
  if (!startStr || !endStr) return false;
  const start = new Date(startStr);
  const end = new Date(endStr);
  return bookedRanges.some(({ start: bookedStart, end: bookedEnd }) => {
    const s = new Date(bookedStart), e = new Date(bookedEnd);
    // Ranges overlap if: start < bookedEnd AND end > bookedStart
    return start < e && end > s;
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
      setError('❌ That start date is already booked. Choose another date.');
      return;
    }
    // If end date is already set, check if the range overlaps
    if (endDate && doesRangeOverlapBookedDates(val, endDate, bookedRanges)) {
      setError('❌ Selected dates overlap with existing bookings. Choose different dates.');
      return;
    }
    setStartDate(val);
  };

  const handleEndDate = (val) => {
    setError('');
    if (isDateInBookedRange(val, bookedRanges)) {
      setError('❌ That end date is already booked. Choose another date.');
      return;
    }
    // Check if the full range overlaps with any booked dates
    if (startDate && doesRangeOverlapBookedDates(startDate, val, bookedRanges)) {
      setError('❌ Selected dates overlap with existing bookings. Choose different dates.');
      return;
    }
    setEndDate(val);
  };

  const handleRequest = async (e) => {
    e.preventDefault();
    setError(''); setSuccess(''); setSubmitting(true);
    
    // Final validation: ensure selected dates don't overlap with booked dates
    if (doesRangeOverlapBookedDates(startDate, endDate, bookedRanges)) {
      setError('❌ Your selected dates overlap with existing bookings. Please choose different dates.');
      setSubmitting(false);
      return;
    }
    
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
        setSuccess('✅ Booking request sent! The owner will review it soon. Track it in My Bookings.');
        setStartDate(''); setEndDate('');
      } else {
        // Use friendly error messages
        const detail = data.detail || '';
        if (detail.includes('overlap')) {
          setError('📅 These dates were just booked by someone else. Try different dates.');
        } else if (detail.includes('past')) {
          setError('⏰ Start date must be in the future.');
        } else if (detail.includes('own')) {
          setError('🚫 You can\'t book your own listing.');
        } else {
          setError(getErrorMessage(detail));
        }
      }
    } catch (e) {
      setError('📡 Connection error. Please check your internet and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!listing) {
    return (
      <div className="page-bg min-h-screen">
        <div className="max-w-6xl mx-auto px-4">
          <Nav onLogout={onLogout} isLoggedIn={isLoggedIn} />
          <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6 animate-pulse">
            <div className="aspect-[4/3] skeleton rounded-3xl" />
            <div className="card-static p-6 space-y-4">
              <div className="skeleton h-3 w-1/3 rounded-full" />
              <div className="skeleton h-7 w-2/3 rounded-full" />
              <div className="skeleton h-24 w-full rounded-2xl" />
              <div className="skeleton h-10 w-full rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const ownerInitial = (listing.owner.full_name || listing.owner.username || '?')[0].toUpperCase();

  return (
    <div className="page-bg min-h-screen">
      <div className="max-w-6xl mx-auto px-4 pb-16">
        <Nav onLogout={onLogout} isLoggedIn={isLoggedIn} />

        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 bg-transparent border-0 cursor-pointer mb-6 group transition-colors duration-200"
        >
          <span className="group-hover:-translate-x-1 transition-transform duration-200">←</span> Back to listings
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6 items-start animate-fade-up">
          {/* Left column */}
          <div className="space-y-5">
            <PhotoGallery photos={listing.photos} />

            <div className="card-static p-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-black text-amber-600 uppercase tracking-widest">
                  {listing.category.name} · {listing.area.name}
                </span>
                {listing.owner.is_business && (
                  <span className="badge bg-blue-100 text-blue-700">💼 Business</span>
                )}
                {listing.is_featured && (
                  <span className="badge bg-amber-100 text-amber-700">★ Featured</span>
                )}
              </div>
              <h1 className="text-2xl font-black text-slate-900 mb-4">{listing.title}</h1>
              <p className="text-slate-600 leading-relaxed">{listing.description || 'No description provided.'}</p>

              {/* Owner */}
              <div className="flex items-center gap-4 mt-6 pt-6 border-t border-slate-100">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-black text-lg shrink-0 shadow-md shadow-amber-200">
                  {ownerInitial}
                </div>
                <div>
                  <p className="font-black text-slate-900">{listing.owner.full_name || listing.owner.username}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {listing.owner.rating_as_owner_count > 0
                      ? `${listing.owner.rating_as_owner_avg.toFixed(1)}★ · ${listing.owner.rating_as_owner_count} rating${listing.owner.rating_as_owner_count === 1 ? '' : 's'} as owner`
                      : 'No ratings yet as an owner'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky booking card */}
          <div className="lg:sticky lg:top-24">
            <div className="glass p-6">
              <div className="flex items-baseline justify-between mb-1">
                <p className="text-3xl font-black text-slate-900">KES {listing.price_per_day.toLocaleString()}</p>
                <p className="text-slate-400 text-sm font-semibold">/day</p>
              </div>
              {listing.deposit_amount > 0 && (
                <p className="text-xs text-slate-400 mb-5 flex items-center gap-1">
                  <span>🔒</span> + KES {listing.deposit_amount.toLocaleString()} refundable deposit
                </p>
              )}

              {bookedRanges.length > 0 && (
                <div className="mb-5 p-4 bg-amber-50 border-2 border-amber-400 rounded-2xl">
                  <p className="text-xs font-black text-amber-800 mb-3 flex items-center gap-2">
                    <span>🚫</span> THESE DATES ARE BOOKED
                  </p>
                  <div className="space-y-2">
                    {bookedRanges.map((r, i) => (
                      <div key={i} className="bg-white/60 border border-amber-200 rounded-lg px-3 py-2">
                        <p className="text-xs text-amber-900 font-bold">
                          {new Date(r.start).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} – {new Date(r.end).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-amber-700 mt-3 font-medium">
                    ⚠️ Avoid these dates when booking below
                  </p>
                </div>
              )}

              {isLoggedIn ? (
                <form onSubmit={handleRequest} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Start Date</label>
                      <input type="date" className={`input-field ${bookedRanges.length > 0 ? 'border-amber-300 bg-amber-50/30' : ''}`} 
                        value={startDate} min={today}
                        onChange={e => handleStartDate(e.target.value)} required 
                        title={bookedRanges.length > 0 ? '⚠️ Some dates are already booked (see yellow box above)' : ''} />
                    </div>
                    <div>
                      <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5">End Date</label>
                      <input type="date" className={`input-field ${bookedRanges.length > 0 ? 'border-amber-300 bg-amber-50/30' : ''}`} 
                        value={endDate} min={startDate || today}
                        onChange={e => handleEndDate(e.target.value)} required 
                        title={bookedRanges.length > 0 ? '⚠️ Some dates are already booked (see yellow box above)' : ''} />
                    </div>
                  </div>

                  {days > 0 && (
                    <div className="bg-gradient-to-r from-amber-50 to-amber-100/50 border border-amber-200 rounded-2xl p-4 animate-scale-in">
                      <div className="flex justify-between text-sm text-slate-600 mb-1">
                        <span>KES {listing.price_per_day.toLocaleString()} × {days} day{days > 1 ? 's' : ''}</span>
                        <span className="font-bold">KES {estimate.toLocaleString()}</span>
                      </div>
                      {listing.deposit_amount > 0 && (
                        <div className="flex justify-between text-sm text-slate-500">
                          <span>Refundable deposit</span>
                          <span>KES {listing.deposit_amount.toLocaleString()}</span>
                        </div>
                      )}
                      <div className="border-t border-amber-200 mt-2 pt-2 flex justify-between font-black text-slate-900">
                        <span>Total due</span>
                        <span>KES {(estimate + (listing.deposit_amount || 0)).toLocaleString()}</span>
                      </div>
                    </div>
                  )}

                  {error && (
                    <p className="text-sm text-red-600 font-semibold flex items-center gap-1.5 animate-slide-down bg-red-50 border border-red-200 rounded-xl p-3">
                      {error}
                    </p>
                  )}
                  {success && (
                    <p className="text-sm text-emerald-600 font-semibold flex items-center gap-1.5 animate-slide-down bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                      {success}
                    </p>
                  )}

                  <button type="submit" 
                    disabled={submitting || !!error || doesRangeOverlapBookedDates(startDate, endDate, bookedRanges)} 
                    className={`btn-primary w-full py-3.5 text-base transition-all ${
                      submitting || !!error || doesRangeOverlapBookedDates(startDate, endDate, bookedRanges) 
                        ? 'opacity-50 cursor-not-allowed' 
                        : ''
                    }`}>
                    {submitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Sending...
                      </span>
                    ) : 'Send booking request'}
                  </button>
                </form>
              ) : (
                <div className="text-center space-y-3 pt-2">
                  <p className="text-sm text-slate-500">Sign in to send a booking request.</p>
                  <button onClick={() => navigate('/login')} className="btn-primary w-full py-3">
                    Sign in to book
                  </button>
                  <button onClick={() => navigate('/register')}
                    className="w-full btn-ghost py-2.5 text-sm">
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
