export default function MetricCard({ title, value, sub, status, statusTone = 'red', trend }) {
  const toneClasses = {
    red: 'text-arf-red bg-arf-red/10',
    amber: 'text-arf-orange bg-arf-orange/10',
    green: 'text-emerald-700 bg-emerald-100',
    neutral: 'text-arf-navy bg-arf-navy/10',
  }[statusTone];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 flex flex-col gap-2">
      <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</div>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-bold text-arf-text">{value}</span>
        {trend && <span className="text-sm text-gray-400 mb-0.5">{trend}</span>}
      </div>
      {sub && <div className="text-xs text-gray-500">{sub}</div>}
      {status && (
        <span className={`self-start text-[11px] font-semibold uppercase tracking-wide rounded px-2 py-1 ${toneClasses}`}>
          {status}
        </span>
      )}
    </div>
  );
}
