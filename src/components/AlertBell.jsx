import { useState } from 'react';
import { useAlerts } from '../contexts/AlertsContext';
import { useAuth } from '../contexts/AuthContext';

const TYPE_LABELS = {
  regression: 'Regression',
  protocol_breach: 'Protocol Breach',
  capacity: 'Capacity',
};

export default function AlertBell() {
  const { activeAlerts, dismiss } = useAlerts();
  const { isObserver } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-full hover:bg-arf-navy/10 transition"
        aria-label="Alerts"
      >
        <svg className="w-6 h-6 text-arf-navy" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2c0 .53-.21 1.04-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {activeAlerts.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-arf-red text-white text-[10px] font-semibold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
            {activeAlerts.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
          <div className="px-4 py-3 border-b border-gray-100 font-semibold text-arf-navy">
            Active Alerts ({activeAlerts.length})
          </div>
          {activeAlerts.length === 0 ? (
            <div className="px-4 py-6 text-sm text-gray-500 text-center">No active alerts.</div>
          ) : (
            activeAlerts.map((a) => (
              <div key={a.id} className="px-4 py-3 border-b border-gray-50 text-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-arf-red">
                    {TYPE_LABELS[a.type] || a.type}
                  </span>
                  {isObserver && (
                    <button
                      onClick={() => dismiss(a.id)}
                      className="text-[11px] text-gray-400 hover:text-arf-navy"
                    >
                      Dismiss
                    </button>
                  )}
                </div>
                <p className="text-arf-text">{a.message}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
