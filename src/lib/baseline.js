// CS1 baseline observation for Prem Nagar Chauraha — locked, never edited or deleted.

export const JUNCTION = {
  id: 'prem-nagar-chauraha',
  name: 'Prem Nagar Chauraha',
  location: 'Civil Lines, Bareilly, U.P.',
  lat: 28.3833,
  lng: 79.4167,
};

export const BASELINE_OBSERVATION = {
  id: 'cs1-baseline',
  junctionId: JUNCTION.id,
  isBaseline: true,
  locked: true,
  date: '2026-03-30',
  timeRange: '17:35–17:45 hrs',
  observerName: 'ARF Field Team (CS1)',

  avgRedPhaseSec: 98,
  queueAtRed: 25,
  queueCleared: false,

  erickshawPercent: 38,
  twoWheelerPercent: 30,
  carPercent: 19,
  heavyVehiclePercent: 13,

  conflicts: {
    redLightNonCompliance: { frequency: 'Continuous', severity: 'High' },
    stopLineCreep: { frequency: 'Every cycle', severity: 'High' },
    erickshawMidLaneStopping: { frequency: 'Frequent', severity: 'High' },
    informalPedestrianCrossing: { frequency: 'Continuous', severity: 'High' },
    carriagewayEncroachment: { frequency: 'Permanent', severity: 'Medium' },
  },

  constablePresent: false,
  jcsScore: 3.2,
  status: 'Failing',
};

export const BEFORE_PILOT_BASELINE = {
  avgQueueAtRed: '25 vehicles',
  queueClearance: '0% single-cycle',
  stopLineViolations: '75–85%',
  constableOccupancy: '0%',
  avgPeakDelay: '4–6 min',
};

export const AFTER_PILOT_PROJECTED = {
  avgQueueAtRed: { value: '8–10 vehicles', change: '-64%' },
  queueClearance: { value: '≥80% single-cycle', change: '+80%' },
  stopLineViolations: { value: '10–15%', change: '-82%' },
  constableOccupancy: { value: '≥90%', change: '+90%' },
  avgPeakDelay: { value: '1–2 min', change: '-65%' },
};

export const ARF_CONTACT = {
  name: 'Aneja Research Foundation',
  tagline: 'Aneja Research Foundation | Bareilly, U.P.',
  email: 'contact@anejaresearch.org',
  phone: '+91-XXXXXXXXXX',
};
