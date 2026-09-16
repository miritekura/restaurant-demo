// Mock FatSecret integration — no backend or real FatSecret API exists in this demo.
// OAuth, nutrition lookup and sync are all simulated client-side; see FatSecretSyncModal.jsx.

const LINKED_KEY = "roofood_fatsecret_linked";
const MANUAL_MACROS_KEY = "roofood_fatsecret_manual_macros";

// No real auth system in this app — a real build would use the logged-in Deliveroo user id.
export const MOCK_USER_ID = "demo-user";

export function isLinked() {
  return localStorage.getItem(LINKED_KEY) === "true";
}

export function connect() {
  localStorage.setItem(LINKED_KEY, "true");
}

export function disconnect() {
  // Manual macro corrections are the user's own data entry, not tied to the account link.
  localStorage.removeItem(LINKED_KEY);
}

function readManualMacros() {
  try {
    return JSON.parse(localStorage.getItem(MANUAL_MACROS_KEY)) || {};
  } catch {
    return {};
  }
}

export function getManualMacros(dishId) {
  return readManualMacros()[dishId] || null;
}

export function saveManualMacros(dishId, macros) {
  const all = readManualMacros();
  all[dishId] = macros;
  localStorage.setItem(MANUAL_MACROS_KEY, JSON.stringify(all));
}

// Returns { source: "restaurant" | "user_input", macros } or null if nothing resolves.
// Never fabricates a value — a dish with no restaurant data and no manual entry stays unresolved.
export function lookupMacros(dish) {
  if (dish.macros) return { source: "restaurant", macros: dish.macros };
  const manual = getManualMacros(dish.id);
  if (manual) return { source: "user_input", macros: manual };
  return null;
}

// out of scope: macro_sync_disputed tracking is tied to the support-agent view (Story 4), not built in R1.
