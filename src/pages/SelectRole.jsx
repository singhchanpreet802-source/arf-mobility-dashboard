import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Logo from '../components/Logo';
import { Spinner } from '../components/Loading';

const ROLES = [
  {
    key: 'observer',
    title: 'ARF Member',
    subtitle: 'Field observer / researcher',
    description:
      'Submit field observations, run the school dispersal optimizer, manage alerts, and generate reports for the pilot junction.',
    permissions: [
      'Enter field observation data (Sections A–F)',
      'View live map, scorecard and trend data',
      'Run the School Dispersal Optimizer & export schedules',
      'Acknowledge / dismiss alerts',
      'Generate and download reports',
    ],
    cta: 'Continue as ARF Member',
    accent: 'navy',
  },
  {
    key: 'official',
    title: 'Municipal Officer',
    subtitle: 'Nagar Nigam / read-only access',
    description:
      'View the live junction map, scorecards, trend charts and download published reports — read-only access for oversight.',
    permissions: [
      'View live map, scorecard and junction details',
      'View trend charts and before/after comparisons',
      'View active alerts (read-only)',
      'Download published reports',
    ],
    cta: 'Continue as Municipal Officer',
    accent: 'red',
  },
];

export default function SelectRole() {
  const { user, role, loading, chooseRole, name, logout } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-arf-bg">
        <Spinner label="Checking your session…" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (role) return <Navigate to="/redirect" replace />;

  const handleSelect = (key) => {
    chooseRole(key);
    navigate('/redirect', { replace: true });
  };

  return (
    <div className="min-h-screen bg-arf-bg flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-4xl">
        <div className="flex flex-col items-center mb-8 text-center">
          <Logo size="lg" />
          <h1 className="text-xl font-bold text-arf-navy mt-6">How would you like to continue{name ? `, ${name}` : ''}?</h1>
          <p className="text-sm text-gray-500 mt-1 max-w-xl">
            Choose the role that matches why you're here today. This determines what you can see and do on the
            dashboard for this session — you can switch by signing out and back in.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {ROLES.map((r) => {
            const accentText = r.accent === 'navy' ? 'text-arf-navy' : 'text-arf-red';
            const accentBorder = r.accent === 'navy' ? 'hover:border-arf-navy' : 'hover:border-arf-red';
            const accentBg = r.accent === 'navy' ? 'bg-arf-navy hover:bg-arf-navy/90' : 'bg-arf-red hover:bg-arf-red/90';
            const dot = r.accent === 'navy' ? 'bg-arf-navy' : 'bg-arf-red';
            return (
              <div
                key={r.key}
                className={`bg-white rounded-xl border border-gray-200 p-6 flex flex-col transition shadow-sm hover:shadow-md ${accentBorder}`}
              >
                <h2 className={`text-lg font-bold ${accentText}`}>{r.title}</h2>
                <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold mt-0.5">{r.subtitle}</p>
                <p className="text-sm text-gray-600 mt-3">{r.description}</p>

                <ul className="mt-4 space-y-2 flex-1">
                  {r.permissions.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-sm text-arf-text">
                      <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${dot}`} />
                      {p}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSelect(r.key)}
                  className={`mt-6 w-full text-white font-semibold rounded-md py-2.5 text-sm transition ${accentBg}`}
                >
                  {r.cta}
                </button>
              </div>
            );
          })}
        </div>

        <p className="text-center text-xs text-gray-400 mt-8">
          Wrong account?{' '}
          <button onClick={() => logout()} className="text-arf-navy font-medium hover:underline">
            Sign out
          </button>
        </p>
      </div>
    </div>
  );
}
