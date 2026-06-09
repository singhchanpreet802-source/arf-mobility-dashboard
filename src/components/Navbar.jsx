import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AlertBell from './AlertBell';
import Logo from './Logo';

const links = [
  { to: '/map', label: 'Map' },
  { to: '/scorecard', label: 'Scorecard' },
  { to: '/data-entry', label: 'Data Entry', observerOnly: true },
  { to: '/schools', label: 'Schools' },
  { to: '/reports', label: 'Reports' },
];

export default function Navbar() {
  const { name, role, isObserver, logout } = useAuth();
  const navigate = useNavigate();
  const visibleLinks = links.filter((l) => !l.observerOnly || isObserver);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <Logo size="sm" />

        <nav className="hidden md:flex items-center gap-1">
          {visibleLinks.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `px-3 py-2 rounded-md text-sm font-medium transition ${
                  isActive ? 'bg-arf-navy text-white' : 'text-arf-navy hover:bg-arf-navy/10'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <AlertBell />
          <div className="hidden sm:block text-right leading-tight">
            <div className="text-sm font-semibold text-arf-text">{name}</div>
            <div className="text-[11px] text-gray-500 capitalize">
              {role === 'observer' ? 'ARF Member' : 'Municipal Officer'}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm font-medium text-arf-red border border-arf-red/30 hover:bg-arf-red/10 rounded-md px-3 py-1.5 transition"
          >
            Logout
          </button>
        </div>
      </div>
      <nav className="md:hidden flex items-center gap-1 px-4 pb-2 overflow-x-auto">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition ${
                isActive ? 'bg-arf-navy text-white' : 'text-arf-navy hover:bg-arf-navy/10'
              }`
            }
          >
            {l.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
