import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { JUNCTION } from '../lib/baseline';

const JUNCTIONS = [
  { id: JUNCTION.id, name: 'Prem Nagar Chauraha' },
  { id: 'civil-lines-chauraha', name: 'Civil Lines Chauraha' },
  { id: 'kotwali-chauraha', name: 'Kotwali Chauraha' },
  { id: 'nainital-road-chauraha', name: 'Nainital Road Chauraha' },
  { id: 'rajendra-nagar-chauraha', name: 'Rajendra Nagar Chauraha' },
  { id: 'rampur-garden-chauraha', name: 'Rampur Garden Chauraha' },
  { id: 'subhash-nagar-chauraha', name: 'Subhash Nagar Chauraha' },
  { id: 'ddpuram-chauraha', name: 'DD Puram Chauraha' },
  { id: 'railway-station-chauraha', name: 'Railway Station Chauraha' },
  { id: 'picnic-spot-chauraha', name: 'Picnic Spot Chauraha' },
];
import { calculateJCS, jcsStatus } from '../lib/jcs';
import { addObservation, subscribeObservations } from '../lib/firestoreData';
import { evaluateAlerts } from '../lib/alertRules';

const inputCls =
  'w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-arf-navy/40 focus:border-arf-navy';
const labelCls = 'block text-sm font-medium text-arf-text mb-1';

const FREQUENCIES = ['Continuous', 'Frequent', 'Occasional', 'None'];
const SEVERITIES = ['High', 'Medium', 'Low'];
const CONFLICTS = [
  { key: 'redLightNonCompliance', label: 'Red light non-compliance' },
  { key: 'stopLineCreep', label: 'Stop-line creep (two-wheelers)' },
  { key: 'erickshawMidLaneStopping', label: 'E-rickshaw mid-lane stopping' },
  { key: 'informalPedestrianCrossing', label: 'Informal pedestrian crossing' },
  { key: 'carriagewayEncroachment', label: 'Carriageway encroachment' },
  { key: 'wrongWayMovement', label: 'Wrong-way movement' },
];

function emptyConflicts() {
  const c = {};
  CONFLICTS.forEach((conf) => {
    c[conf.key] = { frequency: 'None', severity: 'Low' };
  });
  return c;
}

const initialState = {
  cycle1: '',
  cycle2: '',
  cycle3: '',
  erickshaws: '',
  twoWheelers: '',
  cars: '',
  heavyVehicles: '',
  pedestrians: '',
  queueAtRed: '',
  queueCleared: null,
  carryover: '',
  conflicts: emptyConflicts(),
  signalOperational: null,
  laneMarkings: null,
  footpath: null,
  pedCrossingMarkings: null,
  encroachment: null,
  encroachmentType: '',
  enforcementPresent: null,
  enforcementCount: '',
  congestionRating: 3,
  keyObservation: '',
};

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-5 space-y-4">
      <h3 className="font-semibold text-arf-navy">{title}</h3>
      {children}
    </div>
  );
}

function ToggleGroup({ value, onChange, options }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          type="button"
          key={opt}
          onClick={() => onChange(opt)}
          className={`text-sm font-medium rounded-md px-3 py-1.5 border transition ${
            value === opt
              ? 'bg-arf-navy text-white border-arf-navy'
              : 'bg-white text-arf-navy border-gray-300 hover:border-arf-navy'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

export default function DataEntry() {
  const { name, user, isObserver } = useAuth();
  const [history, setHistory] = useState([]);
  const [form, setForm] = useState(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [selectedJunctionId, setSelectedJunctionId] = useState(JUNCTION.id);
  const [now, setNow] = useState(new Date());

  // Real-time clock — updates every second
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const today = format(now, 'yyyy-MM-dd');
  const nowTime = format(now, 'HH:mm:ss');
  const observerEmail = user?.email ?? '';

  useEffect(() => {
    const unsub = subscribeObservations(JUNCTION.id, setHistory);
    return unsub;
  }, []);

  const set = (field) => (val) => setForm((f) => ({ ...f, [field]: val }));
  const setEvt = (field) => (e) => set(field)(e.target.value);

  const cycleAvg = useMemo(() => {
    const vals = [form.cycle1, form.cycle2, form.cycle3].map(Number).filter((n) => !Number.isNaN(n) && n > 0);
    if (vals.length === 0) return null;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  }, [form.cycle1, form.cycle2, form.cycle3]);

  const composition = useMemo(() => {
    const counts = {
      'E-rickshaws': Number(form.erickshaws) || 0,
      'Two-wheelers': Number(form.twoWheelers) || 0,
      Cars: Number(form.cars) || 0,
      'Heavy vehicles': Number(form.heavyVehicles) || 0,
      'Informal pedestrians': Number(form.pedestrians) || 0,
    };
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    const percentages = Object.fromEntries(
      Object.entries(counts).map(([k, v]) => [k, total > 0 ? Math.round((v / total) * 1000) / 10 : 0])
    );
    return { counts, total, percentages };
  }, [form.erickshaws, form.twoWheelers, form.cars, form.heavyVehicles, form.pedestrians]);

  const capacityStatus = useMemo(() => {
    const carryover = Number(form.carryover) || 0;
    if (form.queueCleared === 'NO' || carryover > 0) return 'Over Capacity';
    if (form.queueCleared === 'YES') return 'Within Capacity';
    return null;
  }, [form.queueCleared, form.carryover]);

  const setConflict = (key, field, value) =>
    setForm((f) => ({
      ...f,
      conflicts: { ...f.conflicts, [key]: { ...f.conflicts[key], [field]: value } },
    }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);

    const totalVehicles = composition.total - (Number(form.pedestrians) || 0);
    if (totalVehicles <= 0) {
      setError('Please enter traffic composition counts before submitting.');
      return;
    }
    if (!form.queueAtRed || form.queueCleared === null) {
      setError('Please complete the queue and clearance section.');
      return;
    }
    if (form.signalOperational === null) {
      setError('Please complete the infrastructure check section.');
      return;
    }

    // Derive JCS calculation inputs from observation responses.
    const nonCompliantConflict = form.conflicts.redLightNonCompliance;
    const complianceFractionMap = { Continuous: 0.15, Frequent: 0.4, Occasional: 0.7, None: 0.95 };
    const complianceFraction = complianceFractionMap[nonCompliantConflict.frequency] ?? 0.5;
    const compliantVehicles = Math.round(totalVehicles * complianceFraction);

    const stopLineCreep = form.conflicts.stopLineCreep;
    const disciplineFractionMap = { Continuous: 15, Frequent: 40, Occasional: 70, None: 92 };
    const disciplinedPercent = disciplineFractionMap[stopLineCreep.frequency] ?? 50;

    const blockingEventsMap = { Continuous: 5, Frequent: 3, Occasional: 1, None: 0 };
    const blockingEvents = blockingEventsMap[form.conflicts.carriagewayEncroachment.frequency] ?? 0;

    const constablePostsManned = form.enforcementPresent === 'YES';

    const jcsScore = calculateJCS({
      compliantVehicles,
      totalVehicles,
      queueClearedInOneCycle: form.queueCleared === 'YES',
      disciplinedPercent,
      blockingEvents,
      constablePostsManned,
    });

    const selectedJunction = JUNCTIONS.find((j) => j.id === selectedJunctionId) ?? JUNCTIONS[0];
    const observation = {
      date: today,
      time: format(now, 'HH:mm'),
      observerName: form.observerName?.trim() || name || observerEmail,
      observerEmail,
      junctionId: selectedJunction.id,
      junctionName: selectedJunction.name,

      avgRedPhaseSec: cycleAvg ? Math.round(cycleAvg) : null,
      cycle1: Number(form.cycle1) || null,
      cycle2: Number(form.cycle2) || null,
      cycle3: Number(form.cycle3) || null,

      trafficComposition: composition.counts,
      trafficCompositionPercent: composition.percentages,
      erickshawPercent: composition.percentages['E-rickshaws'],

      queueAtRed: Number(form.queueAtRed),
      queueCleared: form.queueCleared === 'YES',
      carryoverVehicles: Number(form.carryover) || 0,
      capacityStatus,

      conflicts: form.conflicts,
      stopLineViolationPercent: 100 - disciplinedPercent,

      signalOperational: form.signalOperational,
      laneMarkings: form.laneMarkings,
      footpath: form.footpath,
      pedCrossingMarkings: form.pedCrossingMarkings,
      encroachment: form.encroachment,
      encroachmentType: form.encroachment === 'YES' ? form.encroachmentType : null,
      enforcementPresent: form.enforcementPresent === 'YES',
      enforcementCount: form.enforcementPresent === 'YES' ? Number(form.enforcementCount) || 0 : 0,
      constablePresent: form.enforcementPresent === 'YES',

      congestionRating: Number(form.congestionRating),
      keyObservation: form.keyObservation.slice(0, 200),

      jcsScore,
      status: jcsStatus(jcsScore).label,
    };

    setSubmitting(true);
    try {
      await addObservation(observation);
      const triggered = await evaluateAlerts([...history, observation], observation);
      setResult({ jcsScore, alerts: triggered });
      setForm(initialState);
    } catch (err) {
      setError('Could not save observation. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isObserver) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="text-lg font-bold text-arf-navy mb-2">Observer Access Required</h1>
        <p className="text-sm text-gray-500">
          Field observation entry is restricted to ARF Observers. Municipal officials have read-only access to dashboard
          and reports.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-arf-navy">Field Observation Entry</h1>
        <p className="text-sm text-gray-500">Complete this form on-site at the junction. Submission updates the dashboard in real time.</p>
      </div>

      {result && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-md px-4 py-3 text-sm text-emerald-800">
          <p className="font-semibold">Observation submitted. Calculated JCS: {result.jcsScore.toFixed(1)} / 10</p>
          {result.alerts.length > 0 && (
            <ul className="mt-1 list-disc list-inside">
              {result.alerts.map((a, i) => (
                <li key={i}>{a.message}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <Section title="Observation Details">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <span className={labelCls}>Junction</span>
              <select
                className={inputCls}
                value={selectedJunctionId}
                onChange={(e) => setSelectedJunctionId(e.target.value)}
              >
                {JUNCTIONS.map((j) => (
                  <option key={j.id} value={j.id}>{j.name}</option>
                ))}
              </select>
            </div>
            <div>
              <span className={labelCls}>Date</span>
              <input className={`${inputCls} bg-gray-50 text-gray-500`} disabled value={today} />
            </div>
            <div>
              <span className={labelCls}>Time (live)</span>
              <input className={`${inputCls} bg-gray-50 text-gray-500 font-mono`} disabled value={nowTime} />
            </div>
            <div>
              <span className={labelCls}>Observer name</span>
              <input
                className={inputCls}
                placeholder="Enter your full name"
                value={form.observerName ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, observerName: e.target.value }))}
              />
            </div>
            <div className="sm:col-span-2">
              <span className={labelCls}>Observer email</span>
              <input className={`${inputCls} bg-gray-50 text-gray-500`} disabled value={observerEmail} />
            </div>
          </div>
        </Section>

        <Section title="Section A — Signal Timing">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <span className={labelCls}>Cycle 1 duration (sec)</span>
              <input type="number" min="0" className={inputCls} value={form.cycle1} onChange={setEvt('cycle1')} />
            </div>
            <div>
              <span className={labelCls}>Cycle 2 duration (sec)</span>
              <input type="number" min="0" className={inputCls} value={form.cycle2} onChange={setEvt('cycle2')} />
            </div>
            <div>
              <span className={labelCls}>Cycle 3 duration (sec)</span>
              <input type="number" min="0" className={inputCls} value={form.cycle3} onChange={setEvt('cycle3')} />
            </div>
          </div>
          <p className="text-sm text-gray-500">
            Average cycle duration: <span className="font-semibold text-arf-text">{cycleAvg ? `${cycleAvg.toFixed(1)} sec` : '—'}</span>
          </p>
        </Section>

        <Section title="Section B — Traffic Composition (5-minute count)">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <span className={labelCls}>E-rickshaws</span>
              <input type="number" min="0" className={inputCls} value={form.erickshaws} onChange={setEvt('erickshaws')} />
            </div>
            <div>
              <span className={labelCls}>Two-wheelers</span>
              <input type="number" min="0" className={inputCls} value={form.twoWheelers} onChange={setEvt('twoWheelers')} />
            </div>
            <div>
              <span className={labelCls}>Cars</span>
              <input type="number" min="0" className={inputCls} value={form.cars} onChange={setEvt('cars')} />
            </div>
            <div>
              <span className={labelCls}>Heavy vehicles</span>
              <input type="number" min="0" className={inputCls} value={form.heavyVehicles} onChange={setEvt('heavyVehicles')} />
            </div>
            <div>
              <span className={labelCls}>Informal pedestrians</span>
              <input type="number" min="0" className={inputCls} value={form.pedestrians} onChange={setEvt('pedestrians')} />
            </div>
          </div>
          <div className="text-sm text-gray-500 space-y-1">
            <p>Total counted: <span className="font-semibold text-arf-text">{composition.total}</span></p>
            <ul className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-0.5">
              {Object.entries(composition.percentages).map(([k, v]) => (
                <li key={k}>{k}: <span className="font-medium text-arf-text">{v}%</span></li>
              ))}
            </ul>
          </div>
        </Section>

        <Section title="Section C — Queue and Clearance">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <span className={labelCls}>Queue length at red (vehicles)</span>
              <input type="number" min="0" className={inputCls} value={form.queueAtRed} onChange={setEvt('queueAtRed')} />
            </div>
            <div>
              <span className={labelCls}>Estimated carryover vehicles</span>
              <input type="number" min="0" className={inputCls} value={form.carryover} onChange={setEvt('carryover')} />
            </div>
          </div>
          <div>
            <span className={labelCls}>Queue cleared in green phase?</span>
            <ToggleGroup value={form.queueCleared} onChange={set('queueCleared')} options={['YES', 'NO']} />
          </div>
          <p className="text-sm text-gray-500">
            Capacity status: <span className="font-semibold text-arf-text">{capacityStatus ?? '—'}</span>
          </p>
        </Section>

        <Section title="Section D — Conflict Mapping">
          <div className="space-y-4">
            {CONFLICTS.map((c) => (
              <div key={c.key} className="border border-gray-100 rounded-md p-3">
                <p className="text-sm font-medium text-arf-text mb-2">{c.label}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="block text-xs text-gray-500 mb-1">Frequency</span>
                    <ToggleGroup
                      value={form.conflicts[c.key].frequency}
                      onChange={(v) => setConflict(c.key, 'frequency', v)}
                      options={FREQUENCIES}
                    />
                  </div>
                  <div>
                    <span className="block text-xs text-gray-500 mb-1">Severity</span>
                    <ToggleGroup
                      value={form.conflicts[c.key].severity}
                      onChange={(v) => setConflict(c.key, 'severity', v)}
                      options={SEVERITIES}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Section E — Infrastructure Check">
          <div className="space-y-4">
            <div>
              <span className={labelCls}>Signal operational?</span>
              <ToggleGroup value={form.signalOperational} onChange={set('signalOperational')} options={['YES', 'NO', 'PARTIAL']} />
            </div>
            <div>
              <span className={labelCls}>Lane markings visible?</span>
              <ToggleGroup value={form.laneMarkings} onChange={set('laneMarkings')} options={['CLEAR', 'FADED', 'ABSENT']} />
            </div>
            <div>
              <span className={labelCls}>Footpath present?</span>
              <ToggleGroup value={form.footpath} onChange={set('footpath')} options={['YES', 'NO', 'PARTIAL']} />
            </div>
            <div>
              <span className={labelCls}>Pedestrian crossing markings?</span>
              <ToggleGroup value={form.pedCrossingMarkings} onChange={set('pedCrossingMarkings')} options={['YES', 'NO']} />
            </div>
            <div>
              <span className={labelCls}>Encroachment observed?</span>
              <ToggleGroup value={form.encroachment} onChange={set('encroachment')} options={['YES', 'NO']} />
              {form.encroachment === 'YES' && (
                <input
                  type="text"
                  placeholder="Describe encroachment type"
                  className={`${inputCls} mt-2`}
                  value={form.encroachmentType}
                  onChange={setEvt('encroachmentType')}
                />
              )}
            </div>
            <div>
              <span className={labelCls}>Police / enforcement present?</span>
              <ToggleGroup value={form.enforcementPresent} onChange={set('enforcementPresent')} options={['YES', 'NO']} />
              {form.enforcementPresent === 'YES' && (
                <input
                  type="number"
                  min="0"
                  placeholder="Count of personnel present"
                  className={`${inputCls} mt-2`}
                  value={form.enforcementCount}
                  onChange={setEvt('enforcementCount')}
                />
              )}
            </div>
          </div>
        </Section>

        <Section title="Section F — Public Impact (optional)">
          <div>
            <span className={labelCls}>Overall congestion rating: {form.congestionRating} / 5</span>
            <input
              type="range"
              min="1"
              max="5"
              value={form.congestionRating}
              onChange={setEvt('congestionRating')}
              className="w-full accent-arf-navy"
            />
          </div>
          <div>
            <span className={labelCls}>Key observation (max 200 characters)</span>
            <textarea
              maxLength={200}
              rows={3}
              className={inputCls}
              value={form.keyObservation}
              onChange={setEvt('keyObservation')}
            />
            <p className="text-xs text-gray-400 mt-1">{form.keyObservation.length}/200</p>
          </div>
        </Section>

        {error && <div className="text-sm text-arf-red bg-arf-red/10 border border-arf-red/30 rounded-md px-3 py-2">{error}</div>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-arf-navy text-white font-semibold rounded-md py-3 text-sm hover:bg-arf-navy/90 transition disabled:opacity-60"
        >
          {submitting ? 'Submitting…' : 'Submit Observation'}
        </button>
      </form>
    </div>
  );
}
