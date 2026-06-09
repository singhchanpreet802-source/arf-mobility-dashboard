export function Spinner({ label = 'Loading…' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-gray-400">
      <div className="w-8 h-8 border-4 border-arf-navy/20 border-t-arf-navy rounded-full animate-spin" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function EmptyState({ title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center gap-2 py-16 px-6">
      <div className="w-12 h-12 rounded-full bg-arf-navy/10 flex items-center justify-center text-arf-navy mb-1">
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <h3 className="font-semibold text-arf-navy">{title}</h3>
      <p className="text-sm text-gray-500 max-w-sm">{message}</p>
      {action}
    </div>
  );
}
