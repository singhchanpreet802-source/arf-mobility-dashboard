import { useEffect, useState } from 'react';
import { subscribeObservations } from '../lib/firestoreData';
import { jcsStatus, scoreToColorKey } from '../lib/jcs';
import { JUNCTION } from '../lib/baseline';
import JunctionMap from '../components/JunctionMap';
import JunctionDetailPanel from '../components/JunctionDetailPanel';
import BaselineNotice from '../components/BaselineNotice';
import { Spinner } from '../components/Loading';

export default function DashboardHome() {
  const [observations, setObservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const unsub = subscribeObservations(JUNCTION.id, (data) => {
      setObservations(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  if (loading) {
    return (
      <div className="h-[calc(100vh-64px)] flex items-center justify-center">
        <Spinner label="Loading map data…" />
      </div>
    );
  }

  const latest = observations[observations.length - 1];
  const status = jcsStatus(latest.jcsScore);
  const junctions = [
    {
      ...JUNCTION,
      jcsScore: latest.jcsScore,
      statusLabel: status.label,
      colorKey: scoreToColorKey(latest.jcsScore),
    },
  ];

  return (
    <div className="relative h-[calc(100vh-64px)] flex">
      <div className="flex-1">
        <JunctionMap junctions={junctions} onSelect={() => setSelected(junctions[0])} />
      </div>

      {latest.isBaseline && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[92%] sm:w-auto sm:max-w-xl z-[500]">
          <BaselineNotice date={latest.date} compact />
        </div>
      )}

      {selected && (
        <div className="absolute inset-y-0 right-0 w-full sm:w-[480px] bg-white shadow-2xl border-l border-gray-200 z-[1000]">
          <JunctionDetailPanel onClose={() => setSelected(null)} />
        </div>
      )}

      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-md border border-gray-200 px-4 py-3 text-xs space-y-1.5 z-[500]">
        <div className="font-semibold text-arf-navy mb-1">Junction Health (JCS)</div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ background: '#27AE60' }} /> Functioning (7.5–10)</div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ background: '#E67E22' }} /> Stressed (5–7.4)</div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ background: '#C0392B' }} /> Failing (0–4.9)</div>
      </div>
    </div>
  );
}
