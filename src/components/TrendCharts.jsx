import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Legend,
} from 'recharts';
import { format, parseISO } from 'date-fns';

const COLORS = ['#1B3A6B', '#C0392B', '#E67E22', '#27AE60'];

function fmtDate(d) {
  try {
    return format(parseISO(d), 'd MMM');
  } catch {
    return d;
  }
}

function Chart({ title, data, lines, yLabel, baselineDate }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h4 className="text-sm font-semibold text-arf-navy mb-3">{title}</h4>
      <div style={{ width: '100%', height: 220 }}>
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 5, right: 16, bottom: 5, left: -16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} label={{ value: yLabel, angle: -90, position: 'insideLeft', fontSize: 11 }} />
            <Tooltip labelFormatter={fmtDate} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {baselineDate && (
              <ReferenceLine
                x={baselineDate}
                stroke="#C0392B"
                strokeDasharray="4 4"
                label={{ value: 'Pilot Start', position: 'top', fontSize: 11, fill: '#C0392B' }}
              />
            )}
            {lines.map((l, i) => (
              <Line
                key={l.dataKey}
                type="monotone"
                dataKey={l.dataKey}
                name={l.name}
                stroke={COLORS[i % COLORS.length]}
                strokeWidth={2}
                dot={{ r: 3 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function TrendCharts({ observations }) {
  const baselineDate = observations.find((o) => o.isBaseline)?.date;

  const data = observations.map((o) => ({
    date: o.date,
    avgRedPhaseSec: o.avgRedPhaseSec,
    queueAtRed: o.queueAtRed,
    jcsScore: o.jcsScore,
    stopLineViolationPercent: o.stopLineViolationPercent ?? null,
  }));

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-arf-navy">Trend Charts</h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Chart
          title="Junction Compliance Score (JCS) Over Time"
          data={data}
          lines={[{ dataKey: 'jcsScore', name: 'JCS Score' }]}
          yLabel="JCS"
          baselineDate={baselineDate}
        />
        <Chart
          title="Average Red Phase Duration"
          data={data}
          lines={[{ dataKey: 'avgRedPhaseSec', name: 'Avg Red Phase (sec)' }]}
          yLabel="Seconds"
          baselineDate={baselineDate}
        />
        <Chart
          title="Queue at Red"
          data={data}
          lines={[{ dataKey: 'queueAtRed', name: 'Queue (vehicles)' }]}
          yLabel="Vehicles"
          baselineDate={baselineDate}
        />
        <Chart
          title="Stop-Line Violation Rate"
          data={data}
          lines={[{ dataKey: 'stopLineViolationPercent', name: 'Violations (%)' }]}
          yLabel="Percent"
          baselineDate={baselineDate}
        />
      </div>
    </div>
  );
}
