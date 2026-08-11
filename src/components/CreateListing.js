import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../constants';
import { apiFetch } from '../api';
import Nav from './Nav';
import ListingThumb from './ListingThumb';

function PhotoUploader({ photoUrls, onChange }) {
  const inputRef = useRef();
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (files) => {
    setUploading(true);
    const uploaded = [];
    for (const file of files) {
      const form = new FormData();
      form.append('file', file);
      try {
        const res = await apiFetch('/upload-image', { method: 'POST', body: form });
        const data = await res.json();
        if (res.ok) uploaded.push(`${API_BASE_URL}${data.url}`);
      } catch { /* skip failed uploads */ }
    }
    onChange([...photoUrls, ...uploaded]);
    setUploading(false);
  };

  const remove = (i) => onChange(photoUrls.filter((_, idx) => idx !== i));

  return (
    <div>
      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Photos</label>
      <div
        className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center cursor-pointer hover:border-amber-400 transition-colors"
        onClick={() => inputRef.current.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); handleFiles([...e.dataTransfer.files]); }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          className="hidden"
          onChange={e => handleFiles([...e.target.files])}
        />
        {uploading
          ? <p className="text-sm text-amber-600 font-bold">Uploading...</p>
          : <p className="text-sm text-slate-400">Click or drag images here <span className="text-slate-300">(JPEG, PNG, WebP · max 5 MB each)</span></p>
        }
        {photoUrls.length === 0 && <p className="text-xs text-red-400 mt-1">At least one photo is required</p>}
      </div>
      {photoUrls.length > 0 && (
        <div className="flex gap-2 mt-3 flex-wrap">
          {photoUrls.map((url, i) => (
            <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden bg-slate-100">
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => remove(i)}
                className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 text-white text-xs leading-none border-0 cursor-pointer flex items-center justify-center"
              >×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CreateListing({ onLogout }) {
  const navigate = useNavigate();
  const [areas, setAreas] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    title: '', description: '', category_id: '', area_id: '',
    price_per_day: '', deposit_amount: '',
  });
  const [photoUrls, setPhotoUrls] = useState([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE_URL}/areas`).then(r => r.json()).then(setAreas);
    fetch(`${API_BASE_URL}/categories`).then(r => r.json()).then(setCategories);
  }, []);

  const update = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const categoryName = categories.find(c => String(c.id) === String(form.category_id))?.name;
  const areaName = areas.find(a => String(a.id) === String(form.area_id))?.name;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (photoUrls.length === 0) { setError('Please upload at least one photo.'); return; }
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
          photos: photoUrls.join(','),
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
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-6 items-start">
        <div className="card-static p-8">
          <h1 className="text-2xl font-black text-slate-900 mb-1">List an item or space</h1>
          <p className="text-slate-500 text-sm mb-6">It goes live immediately in Browse once submitted.</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input className="input-field" placeholder="Title (e.g. Bosch Cordless Drill)" value={form.title} onChange={update('title')} required />
            <textarea className="input-field" rows={3} placeholder="Description" value={form.description} onChange={update('description')} />
            <div className="flex flex-col sm:flex-row gap-3">
              <select className="input-field" value={form.category_id} onChange={update('category_id')} required>
                <option value="" disabled>Category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select className="input-field" value={form.area_id} onChange={update('area_id')} required>
                <option value="" disabled>Area</option>
                {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <input className="input-field" type="number" min="0" step="1" placeholder="Price/day (KES)" value={form.price_per_day} onChange={update('price_per_day')} required />
              <input className="input-field" type="number" min="0" step="1" placeholder="Deposit (KES)" value={form.deposit_amount} onChange={update('deposit_amount')} />
            </div>

            <PhotoUploader photoUrls={photoUrls} onChange={setPhotoUrls} />

            {error && <p className="text-sm text-red-600 font-semibold">{error}</p>}
            <button type="submit" disabled={submitting} className="btn-primary w-full py-3">
              {submitting ? 'Publishing...' : 'Publish listing'}
            </button>
          </form>
        </div>

        <div className="lg:sticky lg:top-8">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Preview</p>
          <div className="card-static p-5">
            <ListingThumb photos={photoUrls.join(',')} className="w-full aspect-[4/3] rounded-2xl mb-3" iconClassName="text-4xl" />
            <p className="text-xs font-black text-amber-600 uppercase tracking-widest mb-1">{categoryName || 'Category'}</p>
            <h3 className="text-lg font-black text-slate-900 mb-1">{form.title || 'Listing title'}</h3>
            <p className="text-sm text-slate-500 mb-3 line-clamp-2">{form.description || 'Your description will show up here.'}</p>
            <div className="flex items-center justify-between text-sm">
              <span className="font-bold text-slate-800">KES {form.price_per_day ? Number(form.price_per_day).toLocaleString() : '0'}/day</span>
              <span className="text-slate-400">{areaName || 'Area'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
