import React, { useEffect, useRef, useState } from 'react';
import { API_BASE_URL } from '../constants';
import { apiFetch } from '../api';

// Generic STK-push modal for flat-fee platform payments (featuring a listing,
// subscribing to a business plan) — bookings use MpesaPaymentModal instead since
// those need the rental/deposit price breakdown.
export default function SimplePaymentModal({ title, subtitle, amount, payUrl, extraBody, onSuccess, onCancel }) {
  const [phone, setPhone] = useState('');
  const [step, setStep] = useState('form'); // form | waiting | success | failed
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [paymentId, setPaymentId] = useState(null);
  const [countdown, setCountdown] = useState(90);
  const pollRef = useRef(null);
  const countRef = useRef(null);

  useEffect(() => () => { clearInterval(pollRef.current); clearInterval(countRef.current); }, []);

  const startPolling = (pid) => {
    setCountdown(90);
    countRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countRef.current);
          clearInterval(pollRef.current);
          setStep('failed');
          setError('Payment timed out. Please try again.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    pollRef.current = setInterval(async () => {
      try {
        const res = await apiFetch(`${API_BASE_URL}/payments/${pid}/status`);
        const data = await res.json();
        if (data.status === 'completed') {
          clearInterval(pollRef.current);
          clearInterval(countRef.current);
          setStep('success');
        }
      } catch { /* keep polling */ }
    }, 5000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await apiFetch(`${API_BASE_URL}${payUrl}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, ...extraBody }),
      });
      const data = await res.json();
      if (res.ok) {
        setPaymentId(data.payment_id);
        setStep('waiting');
        startPolling(data.payment_id);
      } else {
        setError(data.detail || 'Failed to initiate payment');
      }
    } catch {
      setError('Connection error. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const confirmManually = async () => {
    setConfirming(true);
    try {
      const res = await apiFetch(`${API_BASE_URL}/payments/${paymentId}/test-complete`, { method: 'POST' });
      if (res.ok) {
        clearInterval(pollRef.current);
        clearInterval(countRef.current);
        setStep('success');
      }
    } catch { /* ignore */ }
    setConfirming(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="card p-8 w-full max-w-md">
        <p className="text-xs font-black text-amber-600 uppercase tracking-widest mb-1">M-PESA Payment</p>
        <h2 className="text-xl font-black text-slate-900 mb-1">{title}</h2>
        {subtitle && <p className="text-sm text-slate-500 mb-6">{subtitle}</p>}

        {step === 'form' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex justify-between items-center">
              <span className="text-slate-600 text-sm font-bold">Total</span>
              <span className="font-black text-emerald-700 text-lg">KES {amount.toLocaleString()}</span>
            </div>
            <input className="input-field" type="tel" placeholder="M-PESA phone e.g. 0712345678" value={phone} onChange={e => setPhone(e.target.value)} required />
            {error && <p className="text-sm text-red-600 font-semibold">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? 'Sending prompt...' : `Pay KES ${amount.toLocaleString()}`}
            </button>
            <button type="button" onClick={onCancel} className="w-full text-sm font-bold text-slate-500 bg-transparent border-0 cursor-pointer py-1">Cancel</button>
          </form>
        )}

        {step === 'waiting' && (
          <div className="text-center space-y-4">
            <p className="text-slate-600 text-sm">An M-PESA prompt was sent to <strong>{phone}</strong>. Enter your PIN to confirm.</p>
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-3xl font-black text-amber-600">{countdown}s</p>
              <p className="text-xs text-slate-400 mt-1">Waiting for confirmation...</p>
            </div>
            <button disabled={confirming} onClick={confirmManually} className="btn-primary w-full py-2 text-sm">
              {confirming ? 'Confirming...' : "I already paid — confirm now"}
            </button>
            <button onClick={onCancel} className="w-full text-sm font-bold text-slate-500 bg-transparent border-0 cursor-pointer py-1">Cancel</button>
          </div>
        )}

        {step === 'success' && (
          <div className="text-center space-y-4">
            <p className="text-4xl">✅</p>
            <h3 className="text-lg font-black text-slate-900">Payment successful</h3>
            <button onClick={onSuccess} className="btn-primary w-full py-3">Done</button>
          </div>
        )}

        {step === 'failed' && (
          <div className="text-center space-y-4">
            <p className="text-4xl">❌</p>
            <h3 className="text-lg font-black text-slate-900">Payment failed</h3>
            <p className="text-sm text-slate-500">{error}</p>
            <button onClick={() => { setStep('form'); setError(''); }} className="btn-primary w-full py-3">Try again</button>
            <button onClick={onCancel} className="w-full text-sm font-bold text-slate-500 bg-transparent border-0 cursor-pointer py-1">Cancel</button>
          </div>
        )}
      </div>
    </div>
  );
}
