import { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { subscribeObservations } from '../lib/firestoreData';
import { jcsStatus, STATUS_COLORS } from '../lib/jcs';
import { JUNCTION, BEFORE_PILOT_BASELINE, AFTER_PILOT_PROJECTED } from '../lib/baseline';
import MetricCard from './MetricCard';
import TrendCharts from './TrendCharts';
import AlertBanner from './AlertBanner';
import BaselineNotice from './BaselineNotice';
import { Spinner } from './Loading';

function fmtDateTime(date, time) {
  try {
    const d = parseISO(date);
    return `${format(d, 'd MMM yyyy')}${time ? `, ${time}` : ''}`;
  } catch {
    return date || '—';
  }
}

export default function JunctionDetailPanel({ onClose, asPage = false }) {
  const [observations, setObservations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeObservations(JUNCTION.id, (data) => {
      setObservations(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  if (loading) return <Spinner label="Loading junction data…" />;

  const latest = observations[observations.length - 1];
  const status = jcsStatus(latest.jcsScore);
  const tone = STATUS_COLORS[status.color];

  const violationPercent = latest.stopLineViolationPercent ?? 80; // baseline midpoint 75-85%
  const violationDisplay = latest.isBaseline ? '75–85%' : `${violationPercent}%`;
  const violationTrendDown = !latest.isBaseline && violationPercent < 80;

  const afterPilot = latest.isBaseline
    ? {
        avgQueueAtRed: 'Pending observations',
        queueClearance: 'Pending observations',
        stopLineViolations: 'Pending observations',
        constableOccupancy: 'Pending observations',
        avgPeakDelay: 'Pending observations',
      }
    : {
        avgQueueAtRed: `${latest.queueAtRed} vehicles`,
        queueClearance: latest.queueCleared ? 'Single-cycle clearance achieved' : 'Not yet clearing in single cycle',
        stopLineViolations: `${violationPercent}%`,
        constableOccupancy: latest.constablePresent ? '~100% (manned)' : '0% (unmanned)',
        avgPeakDelay: AFTER_PILOT_PROJECTED.avgPeakDelay.value,
      };

  return (
    <div className={asPage ? '' : 'h-full overflow-y-auto'}>
      <div className="bg-white border-b border-gray-200 px-5 py-4 sticky top-0 z-10 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-arf-navy">{JUNCTION.name}</h2>
          <p className="text-sm text-gray-500">{JUNCTION.location}</p>
          <p className="text-xs text-gray-400 mt-1">
            Last updated: {fmtDateTime(latest.date, latest.timeRange || latest.time)}
            {latest.observerName ? ` · Observer: ${latest.observerName}` : ''}
          </p>
        </div>
        <div className="flex items-start gap-3">
          <div className={`text-center rounded-lg px-4 py-2 ${tone.bg}`}>
            <div className={`text-3xl font-extrabold ${tone.text}`}>{latest.jcsScore.toFixed(1)}</div>
            <div className={`text-[11px] font-semibold uppercase ${tone.text}`}>{status.label}</div>
          </div>
          {onClose && (
            <button onClick={onClose} className="text-gray-400 hover:text-arf-navy text-xl leading-none px-1">
              ×
            </button>
          )}
        </div>
      </div>

      <div className="p-5 space-y-6">
        {latest.isBaseline && <BaselineNotice date={latest.date} />}
        <AlertBanner junctionId={JUNCTION.id} />

        <div>
          <h3 className="font-semibold text-arf-navy mb-3">Junction Metrics</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <MetricCard
              title="Signal Cycle"
              value={`${latest.avgRedPhaseSec ?? 98} sec`}
              sub="Recommended: 60–70 sec"
              status="Exceeds Threshold"
              statusTone="red"
            />
            <MetricCard
              title="Queue at Red"
              value={`${latest.queueAtRed ?? 25} vehicles`}
              sub="Target: under 10 vehicles"
              status={(latest.queueAtRed ?? 25) > 10 ? 'Above Target' : 'Within Target'}
              statusTone={(latest.queueAtRed ?? 25) > 10 ? 'red' : 'green'}
            />
            <MetricCard
              title="Queue Clearance"
              value={latest.queueCleared ? 'YES' : 'NO'}
              sub="Target: 80% single-cycle clearance"
              status={latest.queueCleared ? 'Clears in cycle' : 'Never clears in one cycle'}
              statusTone={latest.queueCleared ? 'green' : 'red'}
            />
            <MetricCard
              title="Stop-Line Violations"
              value={violationDisplay}
              sub="Target: under 15%"
              trend={violationTrendDown ? '↓' : '↑'}
              status="High Violation Rate"
              statusTone="red"
            />
            <MetricCard
              title="Constable Post Occupancy"
              value={latest.constablePresent ? 'YES' : 'NO'}
              sub="Target: 90%+ occupancy"
              status={latest.constablePresent ? 'Manned' : 'Not Deployed'}
              statusTone={latest.constablePresent ? 'green' : 'red'}
            />
            <MetricCard
              title="E-Rickshaw Flow"
              value={`${latest.erickshawPercent ?? 38}% of total flow`}
              sub="No fixed stops or routes"
              status="Unregulated"
              statusTone="red"
            />
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-arf-navy mb-3">Before / After Pilot Comparison</h3>
          <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-arf-navy text-white text-left">
                  <th className="px-4 py-2 font-semibold">Metric</th>
                  <th className="px-4 py-2 font-semibold">Before Pilot</th>
                  <th className="px-4 py-2 font-semibold">After Pilot (Projected / Live)</th>
                  <th className="px-4 py-2 font-semibold">Change</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Avg queue at red', BEFORE_PILOT_BASELINE.avgQueueAtRed, afterPilot.avgQueueAtRed, AFTER_PILOT_PROJECTED.avgQueueAtRed.change],
                  ['Queue clearance', BEFORE_PILOT_BASELINE.queueClearance, afterPilot.queueClearance, AFTER_PILOT_PROJECTED.queueClearance.change],
                  ['Stop-line violations', BEFORE_PILOT_BASELINE.stopLineViolations, afterPilot.stopLineViolations, AFTER_PILOT_PROJECTED.stopLineViolations.change],
                  ['Constable occupancy', BEFORE_PILOT_BASELINE.constableOccupancy, afterPilot.constableOccupancy, AFTER_PILOT_PROJECTED.constableOccupancy.change],
                  ['Avg peak delay', BEFORE_PILOT_BASELINE.avgPeakDelay, afterPilot.avgPeakDelay, AFTER_PILOT_PROJECTED.avgPeakDelay.change],
                ].map(([metric, before, after, change], i) => (
                  <tr key={metric} className={i % 2 === 0 ? 'bg-white' : 'bg-arf-bg'}>
                    <td className="px-4 py-2 font-medium text-arf-text">{metric}</td>
                    <td className="px-4 py-2 text-gray-500">{before} <span className="text-[10px] uppercase text-gray-400">(locked)</span></td>
                    <td className="px-4 py-2 text-arf-text">{after}</td>
                    <td className="px-4 py-2 font-semibold text-emerald-600">{change}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Before Pilot column is locked CS1 baseline data (30 Mar 2026). After Pilot column reflects projected targets until live observations populate it, then updates automatically.
          </p>
        </div>

        <TrendCharts observations={observations} />
      </div>
    </div>
  );
}
