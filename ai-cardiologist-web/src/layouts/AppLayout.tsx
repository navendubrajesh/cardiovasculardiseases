import { Link, NavLink, Outlet } from 'react-router-dom';
import { HeartPulse, LogIn, LogOut } from 'lucide-react';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import { footerLinks, mainNavItems } from '../config/navigation';
import { useAuth } from '../state/AuthProvider';

export const AppLayout = () => {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 font-sans text-slate-900">
      <DisclaimerBanner />

      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white shadow-lg shadow-brand-500/30">
              <HeartPulse className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold tracking-wide text-brand-900">AI CARDIOLOGIST</p>
              <p className="text-xs text-slate-500">BRFSS · XAI · Ensemble</p>
            </div>
          </Link>

          <nav className="flex flex-wrap items-center gap-1" aria-label="Main navigation">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              if (!item.public && !isAuthenticated) return null;
              return (
                <NavLink
                  key={item.id}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                      isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`
                  }
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            {isAuthenticated && user ? (
              <>
                <span className="hidden text-xs text-slate-500 sm:inline">{user.email}</span>
                <button
                  type="button"
                  onClick={logout}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center gap-1 rounded-lg bg-brand-600 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-700"
              >
                <LogIn className="h-4 w-4" />
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <Outlet />
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white py-6 text-sm text-slate-500">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4">
          <p>© {new Date().getFullYear()} AI Cardiologist — Research demo only.</p>
          <div className="flex flex-wrap gap-4">
            {footerLinks.map((link) => (
              <a key={link.label} href={link.href} className="hover:text-brand-600">
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
};
