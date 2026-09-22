import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getInvitePreview, signUpWithInvite } from '@/services/authService';
import { toFriendlyError } from '@/lib/errors';
import { Button } from '@/components/ui/Button';
import { Input, Label, ErrorBanner, Spinner } from '@/components/ui/Primitives';
import { AlertaLogo } from '@/components/brand/AlertaLogo';

export function JoinInvitePage() {
  const { code = '' } = useParams();
  const navigate = useNavigate();
  const [preview, setPreview] = useState<{ business_name: string; invitee_name: string; role: string; status: string } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getInvitePreview(code)
      .then(setPreview)
      .catch(() => setPreview(null))
      .finally(() => setPreviewLoading(false));
  }, [code]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError('Your password should be at least 8 characters.');
      return;
    }
    setLoading(true);
    try {
      await signUpWithInvite({ inviteCode: code, email, password });
      navigate('/', { replace: true });
    } catch (err) {
      setError(toFriendlyError(err, 'We could not create your account. Please try again.'));
    } finally {
      setLoading(false);
    }
  }

  if (previewLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  if (!preview || preview.status !== 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface px-4">
        <div className="max-w-sm text-center">
          <AlertaLogo size={36} className="justify-center mb-6" />
          <h1 className="text-lg font-bold text-ink-900 mb-2">This invite isn't valid</h1>
          <p className="text-sm text-ink-500 mb-6">
            This invite link may have expired or already been used. Ask your manager to send a new one.
          </p>
          <Link to="/login">
            <Button variant="outline">Go to login</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <AlertaLogo size={40} />
        </div>
        <div className="bg-white rounded-2xl shadow-panel border border-ink-100 p-7">
          <h1 className="text-xl font-bold text-ink-900 mb-1">Join {preview.business_name}</h1>
          <p className="text-sm text-ink-500 mb-6">
            You've been invited as <strong>{preview.invitee_name}</strong>. Set a password to finish creating your
            account.
          </p>

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
              <Label htmlFor="password">Choose a password</Label>
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
              Join team
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
