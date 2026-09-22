import { NavLink } from 'react-router-dom';
import type { ReactNode } from 'react';
import { Home, FileWarning, User } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { OfflineBanner } from '@/components/ui/Primitives';
import { AlertaLogo } from '@/components/brand/AlertaLogo';
import { useAuth } from '@/hooks/useAuth';
import { logout } from '@/services/authService';

export function EmployeeLayout({ children }: { children: ReactNode }) {
  const isOnline = useOnlineStatus();
  const { profile } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      {!isOnline && <OfflineBanner />}
      <header className="safe-top bg-white border-b border-ink-100 px-4 py-3 flex items-center justify-between sticky top-0 z-20">
        <AlertaLogo size={26} />
        <button
          onClick={() => logout()}
          className="text-sm font-medium text-ink-500 hover:text-ink-800 rounded px-2 py-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600"
          aria-label={`Log out of ${profile?.name ?? 'account'}`}
        >
          Log out
        </button>
      </header>

      <main className="flex-1 pb-20 max-w-lg w-full mx-auto">
        {children}
      </main>

      <nav
        aria-label="Primary"
        className="safe-bottom fixed bottom-0 left-0 right-0 bg-white border-t border-ink-100 flex justify-around py-2 z-20"
      >
        <NavItem to="/" icon={<Home size={22} />} label="Home" />
        <NavItem to="/incidents" icon={<FileWarning size={22} />} label="Report" />
        <NavItem to="/profile" icon={<User size={22} />} label="Profile" />
      </nav>
    </div>
  );
}

function NavItem({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `flex flex-col items-center gap-1 px-5 py-1 rounded-lg text-xs font-medium min-w-[64px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600 ${
          isActive ? 'text-brand-700' : 'text-ink-400'
        }`
      }
    >
      {icon}
      {label}
    </NavLink>
  );
}
