'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong');
        setLoading(false);
        return;
      }

      login(data.token, data.user);
      router.push('/'); // redirect to home after successful register
    } catch (err) {
      setError('Could not connect to the server');
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto mt-16 p-6 border rounded-lg">
      <h1 className="text-2xl font-bold mb-4">Register for CITEMAS</h1>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="firstName" placeholder="First Name" value={form.firstName}
          onChange={handleChange} required
          className="w-full border rounded p-2"
        />
        <input
          name="lastName" placeholder="Last Name" value={form.lastName}
          onChange={handleChange} required
          className="w-full border rounded p-2"
        />
        <input
          name="email" type="email" placeholder="Email" value={form.email}
          onChange={handleChange} required
          className="w-full border rounded p-2"
        />
        <input
          name="password" type="password" placeholder="Password" value={form.password}
          onChange={handleChange} required
          className="w-full border rounded p-2"
        />
        <button
          type="submit" disabled={loading}
          className="w-full bg-black text-white rounded p-2"
        >
          {loading ? 'Creating account...' : 'Register'}
        </button>
      </form>
    </div>
  );
}