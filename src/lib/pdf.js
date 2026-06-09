import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { ARF_CONTACT, JUNCTION } from './baseline';

const NAVY = [27, 58, 107];
const RED = [192, 57, 43];

function addHeader(doc, title, subtitle) {
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, 210, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('ARF', 14, 13);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(ARF_CONTACT.tagline, 14, 19);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 196, 13, { align: 'right' });
  if (subtitle) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(subtitle, 196, 19, { align: 'right' });
  }
  doc.setTextColor(26, 26, 46);
}

function addFooter(doc, observerName) {
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(
      `Generated ${format(new Date(), 'd MMM yyyy, HH:mm')} · ${observerName || 'ARF Observer'} · ${ARF_CONTACT.email}`,
      14,
      290
    );
    doc.text(`Page ${i} of ${pageCount}`, 196, 290, { align: 'right' });
  }
}

export function generateDispersalSchedulePDF({ schools, date, observerName }) {
  const doc = new jsPDF();
  addHeader(doc, 'School Dispersal Schedule', `${JUNCTION.name} · ${format(new Date(date), 'd MMM yyyy')}`);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Recommended Staggered Dispersal Schedule', 14, 38);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(
    'Prepared for the attention of the Circle Officer, Bareilly, in support of the Prem Nagar Chauraha traffic pilot during school dispersal hours (13:00–15:00).',
    14,
    44,
    { maxWidth: 182 }
  );

  autoTable(doc, {
    startY: 56,
    head: [['School', 'Current Dispersal', 'Proposed Dispersal', 'Distance', 'Impact', 'Status']],
    body: schools.map((s) => [
      s.name,
      s.currentDispersalTime,
      s.proposedDispersal,
      `${s.distanceMeters} m`,
      s.impact,
      s.status,
    ]),
    headStyles: { fillColor: NAVY, textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [244, 246, 249] },
    styles: { fontSize: 9, cellPadding: 3 },
  });

  const finalY = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('ARF Contact', 14, finalY);
  doc.setFont('helvetica', 'normal');
  doc.text(`${ARF_CONTACT.name} · ${ARF_CONTACT.email} · ${ARF_CONTACT.phone}`, 14, finalY + 5);

  addFooter(doc, observerName);
  doc.save(`ARF_Dispersal_Schedule_${date}.pdf`);
}

export function generateWeeklyComplianceReportPDF({ junctionName, observations, alerts, observerName }) {
  const doc = new jsPDF();
  const latest = observations[observations.length - 1];
  const prev = observations[observations.length - 2];

  addHeader(doc, 'Junction Compliance Score Report', `${junctionName} · Week ending ${format(new Date(latest.date), 'd MMM yyyy')}`);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('JCS Trend', 14, 38);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Current JCS: ${latest.jcsScore.toFixed(1)} / 10   |   Previous: ${prev ? prev.jcsScore.toFixed(1) : 'N/A'}`, 14, 44);

  autoTable(doc, {
    startY: 52,
    head: [['Date', 'JCS Score', 'Avg Red Phase (s)', 'Queue at Red', 'Cleared in Cycle', 'Constable Present']],
    body: observations.slice(-8).map((o) => [
      format(new Date(o.date), 'd MMM'),
      o.jcsScore.toFixed(1),
      o.avgRedPhaseSec ?? '—',
      o.queueAtRed ?? '—',
      o.queueCleared ? 'Yes' : 'No',
      o.constablePresent ? 'Yes' : 'No',
    ]),
    headStyles: { fillColor: NAVY, textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [244, 246, 249] },
    styles: { fontSize: 8, cellPadding: 2.5 },
  });

  let y = doc.lastAutoTable.finalY + 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Metric-by-Metric Comparison vs. Previous Observation', 14, y);
  y += 4;

  autoTable(doc, {
    startY: y + 4,
    head: [['Metric', 'Previous', 'Current', 'Change']],
    body: prev
      ? [
          ['JCS Score', prev.jcsScore.toFixed(1), latest.jcsScore.toFixed(1), (latest.jcsScore - prev.jcsScore).toFixed(1)],
          ['Avg Red Phase (s)', prev.avgRedPhaseSec ?? '—', latest.avgRedPhaseSec ?? '—', ((latest.avgRedPhaseSec ?? 0) - (prev.avgRedPhaseSec ?? 0))],
          ['Queue at Red', prev.queueAtRed ?? '—', latest.queueAtRed ?? '—', ((latest.queueAtRed ?? 0) - (prev.queueAtRed ?? 0))],
        ]
      : [['No prior observation available for comparison.', '—', '—', '—']],
    headStyles: { fillColor: NAVY, textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [244, 246, 249] },
    styles: { fontSize: 9, cellPadding: 3 },
  });

  y = doc.lastAutoTable.finalY + 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...RED);
  doc.text('Regression Alerts Triggered', 14, y);
  doc.setTextColor(26, 26, 46);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  y += 6;
  const relevantAlerts = alerts.filter((a) => a.junctionId === latest.junctionId).slice(0, 6);
  if (relevantAlerts.length === 0) {
    doc.text('No alerts recorded for this period.', 14, y);
    y += 6;
  } else {
    relevantAlerts.forEach((a) => {
      const lines = doc.splitTextToSize(`• [${a.type.replace('_', ' ')}] ${a.message}`, 182);
      doc.text(lines, 14, y);
      y += lines.length * 5;
    });
  }

  y += 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Constable Occupancy Record', 14, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  y += 6;
  doc.text(
    `Most recent observation: ${latest.constablePresent ? 'Constable post manned' : 'Constable post unmanned (protocol breach)'}`,
    14,
    y
  );

  y += 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Observer Notes', 14, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  y += 6;
  const note = latest.keyObservation || 'No additional observer notes recorded.';
  doc.text(doc.splitTextToSize(note, 182), 14, y);

  addFooter(doc, observerName || latest.observerName);
  doc.save(`ARF_Weekly_Compliance_Report_${latest.date}.pdf`);
}

export function generateMonthlyTrendReportPDF({ junctionName, observations, schools = [], alerts = [], observerName }) {
  const doc = new jsPDF();
  const latest = observations[observations.length - 1];
  const baseline = observations.find((o) => o.isBaseline) || observations[0];

  addHeader(doc, 'Monthly Trend Report', `${junctionName} · ${format(new Date(), 'MMMM yyyy')}`);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('JCS Trajectory (Four-Week Summary)', 14, 38);

  autoTable(doc, {
    startY: 44,
    head: [['Date', 'JCS Score', 'Status']],
    body: observations.slice(-6).map((o) => [
      format(new Date(o.date), 'd MMM yyyy'),
      o.jcsScore.toFixed(1),
      o.jcsScore >= 7.5 ? 'Functioning' : o.jcsScore >= 5 ? 'Stressed' : 'Failing',
    ]),
    headStyles: { fillColor: NAVY, textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [244, 246, 249] },
    styles: { fontSize: 9, cellPadding: 3 },
  });

  let y = doc.lastAutoTable.finalY + 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Before / After Comparison Panel', 14, y);

  autoTable(doc, {
    startY: y + 4,
    head: [['Metric', 'Before Pilot (CS1 Baseline)', 'Latest Observation']],
    body: [
      ['Avg queue at red', `${baseline.queueAtRed} vehicles`, `${latest.queueAtRed ?? '—'} vehicles`],
      ['Queue clearance', baseline.queueCleared ? 'Yes' : 'No (0% single-cycle)', latest.queueCleared ? 'Yes' : 'No'],
      ['Avg red phase', `${baseline.avgRedPhaseSec} sec`, `${latest.avgRedPhaseSec ?? '—'} sec`],
      ['Constable present', baseline.constablePresent ? 'Yes' : 'No', latest.constablePresent ? 'Yes' : 'No'],
      ['JCS Score', baseline.jcsScore.toFixed(1), latest.jcsScore.toFixed(1)],
    ],
    headStyles: { fillColor: NAVY, textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [244, 246, 249] },
    styles: { fontSize: 9, cellPadding: 3 },
  });

  y = doc.lastAutoTable.finalY + 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('School Dispersal Compliance Status', 14, y);
  if (schools.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('No schools registered in the dispersal optimizer yet.', 14, y + 6);
    y += 12;
  } else {
    autoTable(doc, {
      startY: y + 4,
      head: [['School', 'Proposed Dispersal', 'Status']],
      body: schools.map((s) => [s.name, s.proposedDispersal, s.status]),
      headStyles: { fillColor: NAVY, textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [244, 246, 249] },
      styles: { fontSize: 9, cellPadding: 3 },
    });
    y = doc.lastAutoTable.finalY + 10;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Alerts Issued and Responses Received', 14, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  y += 6;
  if (alerts.length === 0) {
    doc.text('No alerts issued during this period.', 14, y);
  } else {
    alerts.slice(0, 8).forEach((a) => {
      const lines = doc.splitTextToSize(`• [${a.type.replace('_', ' ')}] ${a.message} — ${a.dismissed ? 'Reviewed/Resolved' : 'Awaiting response'}`, 182);
      doc.text(lines, 14, y);
      y += lines.length * 5;
    });
  }

  addFooter(doc, observerName);
  doc.save(`ARF_Monthly_Trend_Report_${format(new Date(), 'yyyy-MM')}.pdf`);
}
