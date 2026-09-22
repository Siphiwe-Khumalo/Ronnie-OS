import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signUpNewBusiness } from '@/services/authService';
import { toFriendlyError } from '@/lib/errors';
import { Button } from '@/components/ui/Button';
import { Input, Label, ErrorBanner } from '@/components/ui/Primitives';
import { AlertaLogo } from '@/components/brand/AlertaLogo';

export function SignupBusinessPage() {
  const navigate = useNavigate();
  const [businessName, setBusinessName] = useState('');
  const [managerName, setManagerName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Your password should be at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      await signUpNewBusiness({ businessName, managerName, email, password });
      navigate('/', { replace: true });
    } catch (err) {
      setError(toFriendlyError(err, 'We could not create your workspace. Please try again.'));
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
          <h1 className="text-xl font-bold text-ink-900 mb-1">Set up your business</h1>
          <p className="text-sm text-ink-500 mb-6">
            You'll be the first Manager. You can invite your team afterward.
          </p>

          {error && (
            <div className="mb-4">
              <ErrorBanner message={error} />
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="businessName">Business name</Label>
              <Input
                id="businessName"
                required
                placeholder="e.g. Mandla Construction"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="managerName">Your name</Label>
              <Input id="managerName" required value={managerName} onChange={(e) => setManagerName(e.target.value)} />
            </div>
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
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <p className="text-xs text-ink-400 mt-1">At least 8 characters.</p>
            </div>
            <Button type="submit" fullWidth size="lg" loading={loading}>
              Create workspace
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-ink-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-700 font-medium hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
