import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Logo from '../components/Logo';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/redirect', { replace: true });
    } catch (err) {
      setError('Invalid email or password. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-arf-bg px-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Logo size="lg" />
        </div>
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-8">
          <h1 className="text-xl font-bold text-arf-navy mb-1">Sign in to your account</h1>
          <p className="text-sm text-gray-500 mb-6">Access for ARF observers and authorized Nagar Nigam officials.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-arf-text mb-1">Email address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-arf-navy/40 focus:border-arf-navy"
                placeholder="you@example.org"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-arf-text mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-arf-navy/40 focus:border-arf-navy"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="text-sm text-arf-red bg-arf-red/10 border border-arf-red/30 rounded-md px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-arf-navy text-white font-semibold rounded-md py-2.5 text-sm hover:bg-arf-navy/90 transition disabled:opacity-60"
            >
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
        <p className="text-center text-xs text-gray-400 mt-6">
          Accounts are provisioned by ARF administrators. Contact your ARF coordinator for access.
        </p>
      </div>
    </div>
  );
}
