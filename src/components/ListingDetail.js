import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../constants';
import { apiFetch } from '../api';
import Nav from './Nav';

export default function ListingDetail({ onLogout }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE_URL}/listings/${id}`).then(r => r.ok ? r.json() : null).then(setListing);
  }, [id]);

  const days = startDate && endDate
    ? Math.max(1, Math.round((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)))
    : 0;
  const estimate = listing ? days * listing.price_per_day : 0;

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
        <Nav onLogout={onLogout} />
        <p className="text-center text-slate-400 py-12">Loading listing...</p>
      </div>
    );
  }

  return (
    <div className="page-bg min-h-screen p-8">
      <Nav onLogout={onLogout} />
      <div className="max-w-3xl mx-auto space-y-6">
        <button onClick={() => navigate(-1)} className="text-sm font-bold text-slate-500 bg-transparent border-0 cursor-pointer">
          ← Back
        </button>

        <div className="card p-6">
          <p className="text-xs font-black text-amber-600 uppercase tracking-widest mb-1">{listing.category.name} · {listing.area.name}</p>
          <h1 className="text-2xl font-black text-slate-900 mb-2">{listing.title}</h1>
          <p className="text-slate-600 mb-4">{listing.description || 'No description provided.'}</p>
          <div className="flex gap-6 text-sm">
            <div>
              <p className="text-slate-400 font-bold uppercase text-xs">Price</p>
              <p className="font-black text-slate-900">KES {listing.price_per_day.toLocaleString()}/day</p>
            </div>
            <div>
              <p className="text-slate-400 font-bold uppercase text-xs">Deposit</p>
              <p className="font-black text-slate-900">KES {listing.deposit_amount.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-slate-400 font-bold uppercase text-xs">Owner</p>
              <p className="font-black text-slate-900">
                {listing.owner.full_name || listing.owner.username}
                {listing.owner.is_business && (
                  <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-600 align-middle">BUSINESS</span>
                )}
                {listing.owner.rating_as_owner_count > 0 && (
                  <span className="text-slate-400 font-medium"> · {listing.owner.rating_as_owner_avg.toFixed(1)}★ ({listing.owner.rating_as_owner_count})</span>
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Request to rent</p>
          <form onSubmit={handleRequest} className="space-y-4">
            <div className="flex gap-3">
              <input type="date" className="input-field" value={startDate} onChange={e => setStartDate(e.target.value)} required />
              <input type="date" className="input-field" value={endDate} onChange={e => setEndDate(e.target.value)} required />
            </div>
            {days > 0 && (
              <p className="text-sm text-slate-600">
                {days} day{days > 1 ? 's' : ''} · estimated total <strong>KES {estimate.toLocaleString()}</strong>
                {listing.deposit_amount > 0 && <> + KES {listing.deposit_amount.toLocaleString()} deposit</>}
              </p>
            )}
            {error && <p className="text-sm text-red-600 font-semibold">{error}</p>}
            {success && <p className="text-sm text-emerald-600 font-semibold">{success}</p>}
            <button type="submit" disabled={submitting} className="btn-primary px-6 py-3">
              {submitting ? 'Sending...' : 'Send request'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
