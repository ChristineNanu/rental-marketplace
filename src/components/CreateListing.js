import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../constants';
import { apiFetch } from '../api';
import Nav from './Nav';

export default function CreateListing({ onLogout }) {
  const navigate = useNavigate();
  const [areas, setAreas] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    title: '', description: '', category_id: '', area_id: '',
    price_per_day: '', deposit_amount: '', photos: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE_URL}/areas`).then(r => r.json()).then(setAreas);
    fetch(`${API_BASE_URL}/categories`).then(r => r.json()).then(setCategories);
  }, []);

  const update = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSubmitting(true);
    try {
      const res = await apiFetch(`${API_BASE_URL}/listings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          category_id: Number(form.category_id),
          area_id: Number(form.area_id),
          price_per_day: Number(form.price_per_day),
          deposit_amount: Number(form.deposit_amount || 0),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        navigate(`/listings/${data.id}`);
      } else {
        setError(data.detail || 'Could not create listing.');
      }
    } catch {
      setError('Connection error. Is the backend running?');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-bg min-h-screen p-8">
      <Nav onLogout={onLogout} />
      <div className="max-w-2xl mx-auto">
        <div className="card p-8">
          <h1 className="text-2xl font-black text-slate-900 mb-1">List an item or space</h1>
          <p className="text-slate-500 text-sm mb-6">It goes live immediately in Browse once submitted.</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input className="input-field" placeholder="Title (e.g. Bosch Cordless Drill)" value={form.title} onChange={update('title')} required />
            <textarea className="input-field" rows={3} placeholder="Description" value={form.description} onChange={update('description')} />
            <div className="flex gap-3">
              <select className="input-field" value={form.category_id} onChange={update('category_id')} required>
                <option value="" disabled>Category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select className="input-field" value={form.area_id} onChange={update('area_id')} required>
                <option value="" disabled>Area</option>
                {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div className="flex gap-3">
              <input className="input-field" type="number" min="0" step="1" placeholder="Price per day (KES)" value={form.price_per_day} onChange={update('price_per_day')} required />
              <input className="input-field" type="number" min="0" step="1" placeholder="Deposit (KES, optional)" value={form.deposit_amount} onChange={update('deposit_amount')} />
            </div>
            <input className="input-field" placeholder="Photo URLs, comma-separated (optional)" value={form.photos} onChange={update('photos')} />
            {error && <p className="text-sm text-red-600 font-semibold">{error}</p>}
            <button type="submit" disabled={submitting} className="btn-primary w-full py-3">
              {submitting ? 'Publishing...' : 'Publish listing'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
