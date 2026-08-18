import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../constants';
import { setTokens } from '../api';
import { getErrorMessage } from '../utils/validation';
import AuthLayout from './AuthLayout';

export default function Login({ onLogin }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('📝 Please enter both username and password.');
      return;
    }
    
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
        localStorage.setItem('is_admin', data.is_admin ? 'true' : '');
        onLogin();
        navigate('/dashboard');
      } else {
        // Use user-friendly error message
        if (data.detail.includes('not found')) {
          setError('👤 Username not found. Check your spelling or create an account.');
        } else if (data.detail.includes('Incorrect password')) {
          setError('🔒 Password incorrect. Please try again.');
        } else {
          setError(getErrorMessage(data.detail));
        }
      }
    } catch (e) {
      setError('📡 Connection error. Please check your internet and try again.');
    }
    finally { setLoading(false); }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to manage your listings and bookings.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-400 mb-1.5">Username</label>
          <input 
            className="input-field" 
            placeholder="Enter your username" 
            value={username} 
            onChange={e => setUsername(e.target.value)} 
            required 
            autoComplete="username"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-400 mb-1.5">Password</label>
          <input 
            className="input-field" 
            type="password" 
            placeholder="Enter your password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            required 
            autoComplete="current-password"
          />
        </div>
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3">
            <p className="text-sm text-red-600 font-semibold">{error}</p>
          </div>
        )}
        <button type="submit" disabled={loading} className="btn-primary w-full py-3">
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Signing in...
            </span>
          ) : 'Sign In'}
        </button>
      </form>
      <p className="text-center text-sm text-slate-500 mt-5">
        Don't have an account? <button onClick={() => navigate('/register')} className="text-amber-600 font-bold bg-transparent border-0 cursor-pointer hover:underline">Register now</button>
      </p>
    </AuthLayout>
  );
}
