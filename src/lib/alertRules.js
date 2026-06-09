import { JUNCTION } from './baseline';
import { createAlert } from './firestoreData';

// Evaluate the three alert types against the new observation + recent history
// (history should be ordered oldest -> newest, and INCLUDE the new observation last).
export async function evaluateAlerts(history, newObservation) {
  const triggered = [];
  const idx = history.length - 1;
  const prev = history[idx - 1];

  // 1. Regression Alert — JCS drops 1.5+ points week-on-week
  if (prev && prev.jcsScore - newObservation.jcsScore >= 1.5) {
    triggered.push({
      type: 'regression',
      junctionId: JUNCTION.id,
      junctionName: JUNCTION.name,
      message: `Regression detected at ${JUNCTION.name}. JCS dropped from ${prev.jcsScore.toFixed(1)} to ${newObservation.jcsScore.toFixed(1)}. Review required within 3 days.`,
      severity: 'high',
    });
  }

  // 2. Protocol Breach Alert — Constable post marked unmanned
  if (newObservation.constablePresent === false) {
    triggered.push({
      type: 'protocol_breach',
      junctionId: JUNCTION.id,
      junctionName: JUNCTION.name,
      message: `Constable post unmanned at ${JUNCTION.name} on ${newObservation.date}. Implementation Stack v2.1 protocol breach. Circle Officer notification required.`,
      severity: 'medium',
    });
  }

  // 3. Capacity Alert — Queue fails to clear three consecutive observations
  const lastThree = history.slice(-3);
  if (
    lastThree.length === 3 &&
    lastThree.every((o) => o.queueCleared === false)
  ) {
    triggered.push({
      type: 'capacity',
      junctionId: JUNCTION.id,
      junctionName: JUNCTION.name,
      message: `Junction over capacity for three consecutive observations at ${JUNCTION.name}. Escalation to supervisor recommended.`,
      severity: 'high',
    });
  }

  for (const alert of triggered) {
    await createAlert(alert);
  }

  return triggered;
}
