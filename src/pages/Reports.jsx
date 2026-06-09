import { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { useAlerts } from '../contexts/AlertsContext';
import { JUNCTION } from '../lib/baseline';
import { subscribeObservations, subscribeSchools } from '../lib/firestoreData';
import { optimizeSchedule } from '../lib/dispersal';
import { generateWeeklyComplianceReportPDF, generateMonthlyTrendReportPDF } from '../lib/pdf';
import { Spinner } from '../components/Loading';

export default function Reports() {
  const { name } = useAuth();
  const { alerts } = useAlerts();
  const [observations, setObservations] = useState([]);
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let loaded = { obs: false, schools: false };
    const unsub1 = subscribeObservations(JUNCTION.id, (data) => {
      setObservations(data);
      loaded.obs = true;
      if (loaded.schools) setLoading(false);
    });
    const unsub2 = subscribeSchools((data) => {
      setSchools(data);
      loaded.schools = true;
      if (loaded.obs) setLoading(false);
    });
    return () => {
      unsub1();
      unsub2();
    };
  }, []);

  if (loading) return <Spinner label="Loading report data…" />;

  const latest = observations[observations.length - 1];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-arf-navy">Reports</h1>
        <p className="text-sm text-gray-500">Generate professional, ARF-branded PDF reports for municipal stakeholders.</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-5 space-y-3">
        <h2 className="font-semibold text-arf-navy">Junction Compliance Score Report</h2>
        <p className="text-sm text-gray-500">
          Auto-generated weekly report for {JUNCTION.name}: JCS trend, metric-by-metric comparison vs. previous
          observation, regression alerts triggered, constable occupancy record and observer notes.
        </p>
        <p className="text-xs text-gray-400">
          Latest observation: {format(parseISO(latest.date), 'd MMM yyyy')} · JCS {latest.jcsScore.toFixed(1)} / 10
        </p>
        <button
          onClick={() =>
            generateWeeklyComplianceReportPDF({
              junctionName: JUNCTION.name,
              observations,
              alerts,
              observerName: name,
            })
          }
          className="bg-arf-navy text-white text-sm font-semibold rounded-md px-5 py-2.5 hover:bg-arf-navy/90 transition"
        >
          Download Weekly Report (PDF)
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-5 space-y-3">
        <h2 className="font-semibold text-arf-navy">Monthly Trend Report</h2>
        <p className="text-sm text-gray-500">
          Four-week summary: JCS trajectory, before/after comparison panel, School Dispersal compliance status, and
          alerts issued with responses received. One-click PDF generation with full ARF branding.
        </p>
        <button
          onClick={() =>
            generateMonthlyTrendReportPDF({
              junctionName: JUNCTION.name,
              observations,
              schools: optimizeSchedule(schools),
              alerts,
              observerName: name,
            })
          }
          className="border border-arf-navy text-arf-navy text-sm font-semibold rounded-md px-5 py-2.5 hover:bg-arf-navy hover:text-white transition"
        >
          Download Monthly Report (PDF)
        </button>
      </div>
    </div>
  );
}
