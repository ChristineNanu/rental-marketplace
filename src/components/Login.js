import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../constants';
import { setTokens } from '../api';

export default function Login({ onLogin }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setTokens(data);
        localStorage.setItem('user_id', data.user_id);
        localStorage.setItem('username', data.username);
        onLogin();
        navigate('/dashboard');
      } else {
        setError(data.detail || 'Login failed');
      }
    } catch { setError('Connection error. Is the backend running?'); }
    finally { setLoading(false); }
  };

  return (
    <div className="page-bg min-h-screen flex items-center justify-center px-6">
      <div className="card p-8 w-full max-w-md">
        <h1 className="text-2xl font-black text-slate-900 mb-1">Welcome back</h1>
        <p className="text-slate-500 text-sm mb-6">Sign in to manage your listings and bookings.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input className="input-field" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required />
          <input className="input-field" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
          {error && <p className="text-sm text-red-600 font-semibold">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full py-3">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <p className="text-center text-sm text-slate-500 mt-5">
          Don't have an account? <button onClick={() => navigate('/register')} className="text-amber-600 font-bold bg-transparent border-0 cursor-pointer">Register</button>
        </p>
      </div>
    </div>
  );
}
