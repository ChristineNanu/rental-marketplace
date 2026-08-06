import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../constants';
import { apiFetch } from '../api';
import Nav from './Nav';

function StatTile({ icon, label, value, sublabel }) {
  return (
    <div className="card-static p-6">
      <p className="text-2xl mb-2">{icon}</p>
      <p className="text-xs font-black text-amber-600 uppercase tracking-widest mb-2">{label}</p>
      <p className="text-2xl font-black text-slate-900">{value}</p>
      {sublabel && <p className="text-xs text-slate-400 mt-1">{sublabel}</p>}
    </div>
  );
}

const kes = (n) => `KES ${Math.round(n).toLocaleString()}`;

export default function AdminRevenue({ onLogout }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch(`${API_BASE_URL}/admin/revenue`).then(async r => {
      if (r.ok) setData(await r.json());
      else setError((await r.json().catch(() => ({}))).detail || 'Could not load revenue.');
    });
  }, []);

  return (
    <div className="page-bg min-h-screen p-8">
      <Nav onLogout={onLogout} />
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-black text-slate-900">Platform revenue</h1>

        {error && <p className="text-sm text-red-600 font-semibold">{error}</p>}

        {data && (
          <>
            <div className="card-static p-6 bg-gradient-to-r from-amber-500 to-amber-600 border-0">
              <p className="text-xs font-black text-amber-100 uppercase tracking-widest mb-2">Total platform revenue</p>
              <p className="text-3xl font-black text-white">{kes(data.total_platform_revenue_kes)}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <StatTile
                icon="🤝"
                label="Booking commission"
                value={kes(data.commission_kes)}
                sublabel={`${data.commission_transaction_count} paid booking(s) · ${kes(data.gross_rental_kes)} gross rental`}
              />
              <StatTile
                icon="★"
                label="Featured listings"
                value={kes(data.featured_listing_revenue_kes)}
                sublabel={`${data.featured_listing_count} purchase(s)`}
              />
              <StatTile
                icon="💼"
                label="Business subscriptions"
                value={kes(data.subscription_revenue_kes)}
                sublabel={`${data.active_business_subscriptions} active`}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
