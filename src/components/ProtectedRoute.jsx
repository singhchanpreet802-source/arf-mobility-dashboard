import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Spinner } from './Loading';
import Navbar from './Navbar';
import { AlertsProvider } from '../contexts/AlertsContext';

export default function ProtectedRoute() {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-arf-bg">
        <Spinner label="Checking your session…" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  // Every signed-in person picks "ARF Member" or "Municipal Officer" once per
  // session before they can reach any dashboard page — that choice drives what
  // they can see/do (data entry vs. read-only viewing).
  if (!role) return <Navigate to="/select-role" replace />;

  return (
    <AlertsProvider>
      <div className="min-h-screen bg-arf-bg flex flex-col">
        <Navbar />
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </AlertsProvider>
  );
}

export function RoleRedirect() {
  const { role, isObserver, loading } = useAuth();
  if (loading) return null;
  if (!role) return <Navigate to="/select-role" replace />;
  return <Navigate to={isObserver ? '/data-entry' : '/map'} replace />;
}
