import React, { useState } from 'react';
import { API_BASE_URL } from '../constants';
import { apiFetch } from '../api';

export default function RatingModal({ booking, targetLabel, onSuccess, onCancel }) {
  const [score, setScore] = useState(5);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSubmitting(true);
    try {
      const res = await apiFetch(`${API_BASE_URL}/bookings/${booking.id}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score, comment }),
      });
      const data = await res.json();
      if (res.ok) {
        onSuccess();
      } else {
        setError(data.detail || 'Could not submit rating.');
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
        <p className="text-xs font-black text-amber-600 uppercase tracking-widest mb-1">Rate {targetLabel}</p>
        <h2 className="text-xl font-black text-slate-900 mb-6">{booking.listing.title}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex justify-center gap-2 text-3xl">
            {[1, 2, 3, 4, 5].map(n => (
              <button
                type="button"
                key={n}
                onClick={() => setScore(n)}
                className="bg-transparent border-0 cursor-pointer leading-none"
              >
                {n <= score ? '★' : '☆'}
              </button>
            ))}
          </div>
          <textarea className="input-field" rows={3} placeholder="Optional comment" value={comment} onChange={e => setComment(e.target.value)} />
          {error && <p className="text-sm text-red-600 font-semibold">{error}</p>}
          <button type="submit" disabled={submitting} className="btn-primary w-full py-3">
            {submitting ? 'Submitting...' : 'Submit rating'}
          </button>
          <button type="button" onClick={onCancel} className="w-full text-sm font-bold text-slate-500 bg-transparent border-0 cursor-pointer py-1">Cancel</button>
        </form>
      </div>
    </div>
  );
}
