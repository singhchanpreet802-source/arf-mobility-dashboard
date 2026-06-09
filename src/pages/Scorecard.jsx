import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { subscribeObservations } from '../lib/firestoreData';
import { jcsStatus, STATUS_COLORS } from '../lib/jcs';
import { JUNCTION } from '../lib/baseline';
import BaselineNotice from '../components/BaselineNotice';
import { Spinner } from '../components/Loading';

export default function Scorecard() {
  const [observations, setObservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('jcsScore');
  const [sortDir, setSortDir] = useState('asc');
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = subscribeObservations(JUNCTION.id, (data) => {
      setObservations(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  if (loading) return <Spinner label="Loading scorecard…" />;

  const latest = observations[observations.length - 1];
  const status = jcsStatus(latest.jcsScore);
  const tone = STATUS_COLORS[status.color];

  const rows = [
    {
      junction: JUNCTION.name,
      location: JUNCTION.location,
      lastObserved: latest.date,
      jcsScore: latest.jcsScore,
      status: status.label,
      statusColor: status.color,
    },
  ];

  const sorted = [...rows].sort((a, b) => {
    let cmp = 0;
    if (sortBy === 'jcsScore') cmp = a.jcsScore - b.jcsScore;
    else if (sortBy === 'status') cmp = a.status.localeCompare(b.status);
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const toggleSort = (col) => {
    if (sortBy === col) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortBy(col);
      setSortDir('asc');
    }
  };

  const SortHeader = ({ col, children }) => (
    <th
      className="px-4 py-3 font-semibold cursor-pointer select-none hover:bg-arf-navy/90"
      onClick={() => toggleSort(col)}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        {sortBy === col && <span className="text-[10px]">{sortDir === 'asc' ? '▲' : '▼'}</span>}
      </span>
    </th>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
      <h1 className="text-xl font-bold text-arf-navy mb-1">Junction Scorecard</h1>
      <p className="text-sm text-gray-500 mb-5">
        Overview of all monitored junctions in the ARF traffic pilot programme. Sort by JCS score or status.
      </p>

      {latest.isBaseline && (
        <div className="mb-4">
          <BaselineNotice date={latest.date} />
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-arf-navy text-white text-left">
              <th className="px-4 py-3 font-semibold">Junction</th>
              <th className="px-4 py-3 font-semibold">Location</th>
              <th className="px-4 py-3 font-semibold">Last Observed</th>
              <SortHeader col="jcsScore">JCS Score</SortHeader>
              <SortHeader col="status">Status</SortHeader>
              <th className="px-4 py-3 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r, i) => {
              const t = STATUS_COLORS[r.statusColor];
              return (
                <tr key={r.junction} className={i % 2 === 0 ? 'bg-white' : 'bg-arf-bg'}>
                  <td className="px-4 py-3 font-medium text-arf-text">{r.junction}</td>
                  <td className="px-4 py-3 text-gray-500">{r.location}</td>
                  <td className="px-4 py-3 text-gray-500">{format(parseISO(r.lastObserved), 'd MMM yyyy')}</td>
                  <td className="px-4 py-3 font-semibold text-arf-text">{r.jcsScore.toFixed(1)} / 10</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded ${t.bg} ${t.text}`}>
                      <span className={`w-2 h-2 rounded-full ${t.dot}`} />
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => navigate('/map')}
                      className="text-arf-navy font-medium text-sm hover:underline"
                    >
                      View
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-400 mt-3">
        {tone && `Currently 1 junction monitored under the active pilot. More junctions will be added as the ARF programme expands.`}
      </p>
    </div>
  );
}
