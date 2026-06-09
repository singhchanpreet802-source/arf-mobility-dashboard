import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { subscribeSchools, addSchool } from '../lib/firestoreData';
import { optimizeSchedule } from '../lib/dispersal';
import { generateDispersalSchedulePDF } from '../lib/pdf';
import { Spinner, EmptyState } from '../components/Loading';

const initialForm = {
  name: '',
  currentDispersalTime: '13:00',
  distanceMeters: '',
  population: '',
  privateCarPercent: '',
  autoPercent: '',
  busPercent: '',
  walkerPercent: '',
};

export default function SchoolDispersal() {
  const { isObserver, name } = useAuth();
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const unsub = subscribeSchools((data) => {
      setSchools(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  const optimized = optimizeSchedule(schools);

  const handleChange = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const splitTotal =
    (Number(form.privateCarPercent) || 0) +
    (Number(form.autoPercent) || 0) +
    (Number(form.busPercent) || 0) +
    (Number(form.walkerPercent) || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) {
      setError('School name is required.');
      return;
    }
    if (splitTotal !== 0 && splitTotal !== 100) {
      setError('Vehicle type split percentages should add up to 100%.');
      return;
    }
    setSubmitting(true);
    try {
      await addSchool({
        name: form.name.trim(),
        currentDispersalTime: form.currentDispersalTime,
        distanceMeters: Number(form.distanceMeters) || 0,
        population: Number(form.population) || 0,
        vehicleSplit: {
          privateCarPercent: Number(form.privateCarPercent) || 0,
          autoPercent: Number(form.autoPercent) || 0,
          busPercent: Number(form.busPercent) || 0,
          walkerPercent: Number(form.walkerPercent) || 0,
        },
      });
      setForm(initialForm);
    } catch {
      setError('Could not save school. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrint = () => {
    generateDispersalSchedulePDF({
      schools: optimized,
      date: format(new Date(), 'yyyy-MM-dd'),
      observerName: name,
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-arf-navy">School Dispersal Optimizer</h1>
        <p className="text-sm text-gray-500">
          Recommends staggered dispersal times for schools near Prem Nagar Chauraha to ease congestion during 13:00–15:00.
        </p>
      </div>

      {isObserver && (
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="font-semibold text-arf-navy mb-4">Add a School</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field label="School name">
              <input className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-arf-navy/40 focus:border-arf-navy" value={form.name} onChange={handleChange('name')} required />
            </Field>
            <Field label="Current dispersal time">
              <input type="time" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-arf-navy/40 focus:border-arf-navy" value={form.currentDispersalTime} onChange={handleChange('currentDispersalTime')} required />
            </Field>
            <Field label="Approx. distance from junction (m)">
              <input type="number" min="0" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-arf-navy/40 focus:border-arf-navy" value={form.distanceMeters} onChange={handleChange('distanceMeters')} required />
            </Field>
            <Field label="Estimated student population">
              <input type="number" min="0" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-arf-navy/40 focus:border-arf-navy" value={form.population} onChange={handleChange('population')} required />
            </Field>
            <Field label="Private cars (%)">
              <input type="number" min="0" max="100" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-arf-navy/40 focus:border-arf-navy" value={form.privateCarPercent} onChange={handleChange('privateCarPercent')} />
            </Field>
            <Field label="Autos (%)">
              <input type="number" min="0" max="100" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-arf-navy/40 focus:border-arf-navy" value={form.autoPercent} onChange={handleChange('autoPercent')} />
            </Field>
            <Field label="School buses (%)">
              <input type="number" min="0" max="100" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-arf-navy/40 focus:border-arf-navy" value={form.busPercent} onChange={handleChange('busPercent')} />
            </Field>
            <Field label="Walkers (%)">
              <input type="number" min="0" max="100" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-arf-navy/40 focus:border-arf-navy" value={form.walkerPercent} onChange={handleChange('walkerPercent')} />
            </Field>

            <div className="lg:col-span-3 flex items-center gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="bg-arf-navy text-white text-sm font-semibold rounded-md px-5 py-2.5 hover:bg-arf-navy/90 transition disabled:opacity-60"
              >
                {submitting ? 'Saving…' : 'Add School'}
              </button>
              {error && <span className="text-sm text-arf-red">{error}</span>}
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-arf-navy">Recommended Staggered Schedule</h2>
          <button
            onClick={handlePrint}
            disabled={optimized.length === 0}
            className="text-sm font-medium border border-arf-navy text-arf-navy rounded-md px-4 py-2 hover:bg-arf-navy hover:text-white transition disabled:opacity-40"
          >
            Generate Printable Schedule (PDF)
          </button>
        </div>

        {loading ? (
          <Spinner label="Loading schools…" />
        ) : optimized.length === 0 ? (
          <EmptyState
            title="No schools added yet"
            message={
              isObserver
                ? 'Add a school above to generate optimized dispersal recommendations for the pilot zone.'
                : 'ARF observers have not yet registered any schools for this junction.'
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-arf-navy text-white text-left">
                  <th className="px-4 py-3 font-semibold">School</th>
                  <th className="px-4 py-3 font-semibold">Current Dispersal</th>
                  <th className="px-4 py-3 font-semibold">Proposed Dispersal</th>
                  <th className="px-4 py-3 font-semibold">Distance</th>
                  <th className="px-4 py-3 font-semibold">Impact Score</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {optimized.map((s, i) => (
                  <tr key={s.id} className={i % 2 === 0 ? 'bg-white' : 'bg-arf-bg'}>
                    <td className="px-4 py-3 font-medium text-arf-text">{s.name}</td>
                    <td className="px-4 py-3 text-gray-500">{s.currentDispersalTime}</td>
                    <td className="px-4 py-3 text-arf-text font-semibold">{s.proposedDispersal}</td>
                    <td className="px-4 py-3 text-gray-500">{s.distanceMeters}m</td>
                    <td className="px-4 py-3">
                      <ImpactBadge level={s.impact} />
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded ${
                          s.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-arf-text mb-1">{label}</span>
      {children}
    </label>
  );
}

function ImpactBadge({ level }) {
  const tone = { High: 'bg-arf-red/10 text-arf-red', Medium: 'bg-arf-orange/10 text-arf-orange', Low: 'bg-arf-navy/10 text-arf-navy' }[level];
  return <span className={`text-xs font-semibold px-2 py-1 rounded ${tone}`}>{level}</span>;
}
