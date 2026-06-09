// School Dispersal Optimizer logic.
// Stagger slots: 13:00, 13:20, 13:40 — maximum three batches.
export const STAGGER_SLOTS = ['13:00', '13:20', '13:40'];

export function optimizeSchool(school) {
  const distance = Number(school.distanceMeters) || 0;
  const population = Number(school.population) || 0;

  let impact;
  let slotIndex;

  if (distance <= 200 && population > 500) {
    impact = 'High';
    slotIndex = 0; // unchanged / earliest slot
  } else if (distance <= 400) {
    impact = 'Medium';
    slotIndex = 1; // 20-minute stagger
  } else {
    impact = 'Low';
    slotIndex = 2; // 40-minute stagger
  }

  const proposedDispersal = STAGGER_SLOTS[slotIndex];
  const status = proposedDispersal === school.currentDispersalTime ? 'Active' : 'Pending';

  return { ...school, impact, proposedDispersal, status };
}

export function optimizeSchedule(schools) {
  return schools.map(optimizeSchool);
}
