import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../constants';
import { apiFetch } from '../api';
import Nav from './Nav';
import SimplePaymentModal from './SimplePaymentModal';

const PLANS = [
  { id: 'free', name: 'Free', price: 0, perks: ['List items and spaces', 'Standard placement in Browse'] },
  { id: 'pro', name: 'Pro', price: 1000, perks: ['Everything in Free', 'Business badge on your listings', 'Priority support'] },
  { id: 'premium', name: 'Premium', price: 2500, perks: ['Everything in Pro', 'One free featured listing slot/month', 'Early access to new categories'] },
];

export default function Business({ onLogout }) {
  const [sub, setSub] = useState(null);
  const [subscribingPlan, setSubscribingPlan] = useState(null);

  const load = () => apiFetch(`${API_BASE_URL}/business/subscription`)
    .then(r => r.ok ? r.json() : null)
    .then(setSub);

  useEffect(() => { load(); }, []);

  const currentPlan = sub?.active ? sub.plan : 'free';

  return (
    <div className="page-bg min-h-screen p-8">
      <Nav onLogout={onLogout} />
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Business plans</h1>
          <p className="text-slate-500 text-sm mt-1">
            For hardware shops and repeat owners renting out inventory in downtime.
            {sub?.active && sub.current_period_end && (
              <> Current plan renews {new Date(sub.current_period_end).toLocaleDateString()}.</>
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PLANS.map(plan => (
            <div key={plan.id} className={`card p-6 flex flex-col ${currentPlan === plan.id ? 'ring-2 ring-amber-400' : ''}`}>
              <p className="text-xs font-black text-amber-600 uppercase tracking-widest mb-1">{plan.name}</p>
              <p className="text-2xl font-black text-slate-900 mb-4">
                {plan.price === 0 ? 'Free' : `KES ${plan.price.toLocaleString()}`}
                {plan.price > 0 && <span className="text-sm text-slate-400 font-medium">/month</span>}
              </p>
              <ul className="space-y-2 text-sm text-slate-600 mb-6 flex-1">
                {plan.perks.map(p => <li key={p}>✓ {p}</li>)}
              </ul>
              {currentPlan === plan.id ? (
                <span className="text-center text-xs font-bold text-amber-600 bg-amber-50 rounded-xl py-2">Current plan</span>
              ) : plan.id === 'free' ? (
                <span className="text-center text-xs font-bold text-slate-400 py-2">Default plan</span>
              ) : (
                <button onClick={() => setSubscribingPlan(plan)} className="btn-primary py-2 text-sm">
                  Subscribe
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {subscribingPlan && (
        <SimplePaymentModal
          title={`Subscribe to ${subscribingPlan.name}`}
          subtitle="Billed monthly via M-PESA."
          amount={subscribingPlan.price}
          payUrl="/business/subscribe"
          extraBody={{ plan: subscribingPlan.id }}
          onCancel={() => setSubscribingPlan(null)}
          onSuccess={() => { setSubscribingPlan(null); load(); }}
        />
      )}
    </div>
  );
}
