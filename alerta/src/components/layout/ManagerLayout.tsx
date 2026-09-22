import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, FileWarning, UserCog, BarChart3, Settings, Menu, X } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { OfflineBanner } from '@/components/ui/Primitives';
import { AlertaLogo } from '@/components/brand/AlertaLogo';
import { useAuth } from '@/hooks/useAuth';
import { logout } from '@/services/authService';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/roster', label: 'Roster', icon: Users },
  { to: '/incidents', label: 'Incidents', icon: FileWarning },
  { to: '/employees', label: 'Employees', icon: UserCog },
  { to: '/stats', label: 'Stats', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function ManagerLayout({ children }: { children: ReactNode }) {
  const isOnline = useOnlineStatus();
  const { profile } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-surface">
      <aside className="hidden md:flex w-60 flex-col border-r border-ink-100 bg-white">
        <div className="px-5 py-5 border-b border-ink-100">
          <AlertaLogo size={26} />
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1" aria-label="Primary">
          {NAV_ITEMS.map((item) => (
            <SideNavItem key={item.to} {...item} />
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-ink-100">
          <p className="text-sm font-medium text-ink-800 truncate">{profile?.name}</p>
          <button
            onClick={() => logout()}
            className="text-sm text-ink-500 hover:text-ink-800 mt-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600 rounded"
          >
            Log out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {!isOnline && <OfflineBanner />}
        <header className="md:hidden bg-white border-b border-ink-100 px-4 py-3 flex items-center justify-between sticky top-0 z-20">
          <AlertaLogo size={24} />
          <button
            onClick={() => setMobileNavOpen((v) => !v)}
            aria-label={mobileNavOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileNavOpen}
            className="p-2 rounded-lg text-ink-700 hover:bg-ink-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600"
          >
            {mobileNavOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </header>

        {mobileNavOpen && (
          <nav className="md:hidden bg-white border-b border-ink-100 px-3 py-2 space-y-1" aria-label="Primary">
            {NAV_ITEMS.map((item) => (
              <SideNavItem key={item.to} {...item} onClick={() => setMobileNavOpen(false)} />
            ))}
            <button
              onClick={() => logout()}
              className="w-full text-left px-3 py-2.5 text-sm font-medium text-ink-500 hover:bg-ink-50 rounded-lg"
            >
              Log out
            </button>
          </nav>
        )}

        <main className="flex-1 p-4 md:p-8 max-w-6xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

function SideNavItem({
  to,
  label,
  icon: Icon,
  onClick,
}: {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  onClick?: () => void;
}) {
  return (
    <NavLink
      to={to}
      end
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600 ${
          isActive ? 'bg-brand-50 text-brand-800' : 'text-ink-600 hover:bg-ink-50'
        }`
      }
    >
      <Icon size={20} aria-hidden="true" />
      {label}
    </NavLink>
  );
}
