// JCS (Junction Compliance Score) calculation per ARF weighted formula.

export function jcsStatus(score) {
  if (score >= 7.5) return { label: 'Functioning', color: 'green' };
  if (score >= 5) return { label: 'Stressed', color: 'amber' };
  return { label: 'Failing', color: 'red' };
}

export const STATUS_COLORS = {
  green: { hex: '#27AE60', text: 'text-emerald-600', bg: 'bg-emerald-100', dot: 'bg-emerald-500' },
  amber: { hex: '#E67E22', text: 'text-orange-600', bg: 'bg-orange-100', dot: 'bg-orange-500' },
  red: { hex: '#C0392B', text: 'text-red-700', bg: 'bg-red-100', dot: 'bg-red-600' },
};

// Junction box blocking score lookup: 0=10, 1=7, 2-3=4, 4+=0
function blockingScore(count) {
  if (count <= 0) return 10;
  if (count === 1) return 7;
  if (count <= 3) return 4;
  return 0;
}

/**
 * Compute JCS from an observation's raw inputs.
 * @param {Object} o
 * @param {number} o.compliantVehicles - vehicles stopping on red
 * @param {number} o.totalVehicles
 * @param {boolean} o.queueClearedInOneCycle
 * @param {number} o.disciplinedPercent - % vehicles behind stop-line at red (0-100)
 * @param {number} o.blockingEvents - count of junction box blocking events
 * @param {boolean} o.constablePostsManned - both posts manned
 * @returns {number} JCS to one decimal place
 */
export function calculateJCS({
  compliantVehicles,
  totalVehicles,
  queueClearedInOneCycle,
  disciplinedPercent,
  blockingEvents,
  constablePostsManned,
}) {
  const complianceRate = totalVehicles > 0 ? (compliantVehicles / totalVehicles) * 10 : 0;
  const clearanceScore = queueClearedInOneCycle ? 10 : 0;
  const disciplineScore = (disciplinedPercent / 100) * 10;
  const blockScore = blockingScore(blockingEvents);
  const constableScore = constablePostsManned ? 10 : 0;

  const jcs =
    complianceRate * 0.30 +
    clearanceScore * 0.25 +
    disciplineScore * 0.20 +
    blockScore * 0.15 +
    constableScore * 0.10;

  return Math.round(jcs * 10) / 10;
}

export const PIN_COLORS = {
  green: '#27AE60',
  amber: '#E67E22',
  red: '#C0392B',
};

export function scoreToColorKey(score) {
  if (score >= 7.5) return 'green';
  if (score >= 5) return 'amber';
  return 'red';
}
