import { useAlerts } from '../contexts/AlertsContext';
import { useAuth } from '../contexts/AuthContext';

const TYPE_LABELS = {
  regression: 'Regression Alert',
  protocol_breach: 'Protocol Breach Alert',
  capacity: 'Capacity Alert',
};

export default function AlertBanner({ junctionId }) {
  const { activeAlerts, dismiss } = useAlerts();
  const { isObserver } = useAuth();

  const relevant = activeAlerts.filter((a) => a.junctionId === junctionId);
  if (relevant.length === 0) return null;

  return (
    <div className="space-y-2 mb-4">
      {relevant.map((a) => (
        <div
          key={a.id}
          className="flex items-start justify-between gap-3 bg-arf-red/10 border border-arf-red/30 rounded-md px-4 py-3"
        >
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wide text-arf-red">
              {TYPE_LABELS[a.type] || a.type}
            </span>
            <p className="text-sm text-arf-text mt-0.5">{a.message}</p>
          </div>
          {isObserver && (
            <button
              onClick={() => dismiss(a.id)}
              className="text-xs font-medium text-arf-red border border-arf-red/40 rounded px-2 py-1 hover:bg-arf-red/10 whitespace-nowrap"
            >
              Dismiss
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
