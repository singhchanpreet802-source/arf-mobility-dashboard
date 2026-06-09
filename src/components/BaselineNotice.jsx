import { format, parseISO } from 'date-fns';

// Shown wherever we're displaying the locked CS1 baseline as the "current" status —
// i.e. before any live field observations have been submitted — so officials and
// observers don't mistake a 30 Mar 2026 reference reading for live, up-to-date data.
export default function BaselineNotice({ date, compact = false }) {
  let formatted = date;
  try {
    formatted = format(parseISO(date), 'd MMM yyyy');
  } catch {
    // keep raw string
  }

  return (
    <div
      className={`flex items-start gap-2 bg-arf-orange/10 border border-arf-orange/30 rounded-md text-arf-text ${
        compact ? 'px-3 py-2 text-xs' : 'px-4 py-3 text-sm'
      }`}
    >
      <svg className="w-4 h-4 mt-0.5 shrink-0 text-arf-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
      </svg>
      <p>
        <span className="font-semibold text-arf-orange">No live field observations yet.</span>{' '}
        Showing the CS1 baseline reading from {formatted} as a reference point — this is{' '}
        <span className="font-semibold">not</span> a live status. ARF observers should submit the
        first field observation to activate real-time monitoring for this junction.
      </p>
    </div>
  );
}
