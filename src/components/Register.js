import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../constants';
import AuthLayout from './AuthLayout';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '', full_name: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) navigate('/login');
      else setError(data.detail || 'Registration failed');
    } catch { setError('Connection error. Is the backend running?'); }
    finally { setLoading(false); }
  };

  return (
    <AuthLayout title="Create your account" subtitle="List something, or find something to rent — same account either way.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <input className="input-field" placeholder="Username" value={form.username} onChange={set('username')} required />
        <input className="input-field" type="email" placeholder="Email" value={form.email} onChange={set('email')} required />
        <input className="input-field" placeholder="Full name" value={form.full_name} onChange={set('full_name')} />
        <input className="input-field" type="password" placeholder="Password" value={form.password} onChange={set('password')} required minLength={6} />
        {error && <p className="text-sm text-red-600 font-semibold">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary w-full py-3">
          {loading ? 'Creating account...' : 'Create Account'}
        </button>
      </form>
      <p className="text-center text-sm text-slate-500 mt-5">
        Already have an account? <button onClick={() => navigate('/login')} className="text-amber-600 font-bold bg-transparent border-0 cursor-pointer">Sign in</button>
      </p>
    </AuthLayout>
  );
}
