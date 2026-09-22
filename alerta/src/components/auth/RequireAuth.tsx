import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Spinner } from '@/components/ui/Primitives';

export function RequireAuth() {
  const { session, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  if (!session) return <Navigate to="/login" replace />;
  if (!profile) return <Navigate to="/login" replace />;

  return <Outlet />;
}

export function RequireRole({ role }: { role: 'employee' | 'manager' }) {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  if (!profile) return <Navigate to="/login" replace />;
  if (profile.role !== role) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
