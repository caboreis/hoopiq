// Petit utilitaire partagé : construit les en-têtes d'authentification envoyés aux routes
// serveur protégées (/api/anthropic, /api/nba/predict/:id — voir requireActiveUser côté
// serveur). Lit la session déjà stockée par Root() dans localStorage sous la même clé
// (USER_STORAGE_KEY = "hoopiq_user" dans App.jsx) plutôt que de la dupliquer.
export function authHeaders() {
  try {
    const raw = localStorage.getItem("hoopiq_user");
    if (!raw) return {};
    const u = JSON.parse(raw);
    if (!u?.email || !u?._s) return {};
    return { "X-HoopIQ-Email": u.email, "X-HoopIQ-Token": u._s };
  } catch {
    return {};
  }
}
