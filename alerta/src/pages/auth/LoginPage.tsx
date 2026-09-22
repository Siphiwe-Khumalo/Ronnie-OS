import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '@/services/authService';
import { toFriendlyError } from '@/lib/errors';
import { Button } from '@/components/ui/Button';
import { Input, Label, ErrorBanner } from '@/components/ui/Primitives';
import { AlertaLogo } from '@/components/brand/AlertaLogo';

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(toFriendlyError(err, 'We could not log you in. Please try again.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <AlertaLogo size={40} />
        </div>
        <div className="bg-white rounded-2xl shadow-panel border border-ink-100 p-7">
          <h1 className="text-xl font-bold text-ink-900 mb-1">Welcome back</h1>
          <p className="text-sm text-ink-500 mb-6">Log in to your Alerta workspace.</p>

          {error && (
            <div className="mb-4">
              <ErrorBanner message={error} />
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" fullWidth size="lg" loading={loading}>
              Log in
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-ink-500 mt-6">
          Setting up your business for the first time?{' '}
          <Link to="/signup" className="text-brand-700 font-medium hover:underline">
            Create a workspace
          </Link>
        </p>
      </div>
    </div>
  );
}
