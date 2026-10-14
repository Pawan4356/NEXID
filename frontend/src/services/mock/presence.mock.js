// Simulated collaborators for the collaboration preview. These people do not
// exist; there is no realtime backend. The UI labels them as simulated.
export const SIMULATED_PEOPLE = [
  { id: "sim-maya", name: "Maya Chen", color: "#d9730d" },
  { id: "sim-arjun", name: "Arjun Mehta", color: "#0f7b6c" },
  { id: "sim-sofia", name: "Sofia Rossi", color: "#9065b0" },
];

const ACTIVITIES = ["viewing", "editing", "idle"];

// Deterministic-ish pseudo random so a given page keeps a stable cast.
function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function presenceFor(resourceId, tick) {
  const seed = hash(resourceId);
  const count = 1 + (seed % SIMULATED_PEOPLE.length);
  return SIMULATED_PEOPLE.slice(0, count).map((p, i) => ({
    ...p,
    activity: ACTIVITIES[(seed + i + tick) % ACTIVITIES.length],
  }));
}
