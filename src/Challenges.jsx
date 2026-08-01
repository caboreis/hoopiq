import { useState, useEffect, useCallback } from "react";

const API_BASE = import.meta.env.DEV ? "http://localhost:3001" : "";

const ARENA_PHOTOS = [
  "/jc-gellidon-XmYSlYrupL8-unsplash.jpg",
  "/edgar-chaparro-kB5DnieBLtM-unsplash.jpg",
  "/logan-weaver-lgnwvr-XcBPc0Q_2h8-unsplash.jpg",
  "/kylie-osullivan-BfaBLVCBTI8-unsplash.jpg",
];

const C = {
  bg: "#06060f", surface: "rgba(255,255,255,0.04)", border: "rgba(255,255,255,0.07)",
  orange: "#ff5c00", gold: "#ffd700", green: "#22d37a", red: "#ff4d6d",
  blue: "#4fa3ff", purple: "#c084fc", text: "#f0f0ff", muted: "#6b6b88",
};

const POINTS_PER_PICK = 100;
const PICKS_KEY = "hoopiq_picks_v1";
const todayKey = () => new Date().toISOString().split("T")[0];

// Les pronos sont conservés par match (et pas par jour) : un match commencé
// hier et fini cette nuit doit rester comptabilisé.
function loadPicks() {
  try { return JSON.parse(localStorage.getItem(PICKS_KEY)) || {}; } catch { return {}; }
}
function savePicks(p) {
  try { localStorage.setItem(PICKS_KEY, JSON.stringify(p)); } catch { /* quota plein : le prono reste valable pour la session */ }
}

// Série = nombre de jours consécutifs, en remontant depuis aujourd'hui,
// où au moins un prono a été posé. Calculée sur l'historique réel.
function computeStreak(picks) {
  const days = new Set(Object.values(picks).map(p => p.day));
  let streak = 0;
  const d = new Date();
  for (;;) {
    const key = d.toISOString().split("T")[0];
    if (!days.has(key)) break;
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

function TeamButton({ side, game, pick, onPick }) {
  const team = game[side];
  const locked = game.state !== "pre" || !!pick;
  const isPick = pick === side;
  const resolved = game.state === "final" && game.winner;
  const isWinner = resolved && game.winner === side;
  const pickWasRight = resolved && pick && game.winner === pick;

  const border = isWinner ? "rgba(34,211,122,0.5)"
    : isPick && resolved && !pickWasRight ? "rgba(255,77,109,0.5)"
    : isPick ? "rgba(255,92,0,0.5)" : C.border;
  const bg = isWinner ? "rgba(34,211,122,0.14)"
    : isPick && resolved && !pickWasRight ? "rgba(255,77,109,0.14)"
    : isPick ? "rgba(255,92,0,0.12)" : "rgba(255,255,255,0.04)";

  return (
    <button
      disabled={locked}
      onClick={() => onPick(game.id, side)}
      style={{
        display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0,
        padding: "12px 14px", borderRadius: 12, border: `1px solid ${border}`,
        background: bg, cursor: locked ? "default" : "pointer",
        fontFamily: "inherit", textAlign: "left",
        transition: "background .2s, border-color .2s",
      }}>
      {team.logo
        ? <img src={team.logo} alt="" width={26} height={26} style={{ objectFit: "contain", flexShrink: 0 }} />
        : <span style={{ fontSize: 18, flexShrink: 0 }}>🏀</span>}
      <span style={{
        flex: 1, minWidth: 0, fontSize: 13, fontWeight: isPick || isWinner ? 800 : 500,
        color: isWinner ? C.green : isPick ? C.orange : C.text,
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
      }}>{team.name}</span>
      {team.score != null && game.state !== "pre" && (
        <span style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 20, color: isWinner ? C.green : C.muted, flexShrink: 0 }}>
          {team.score}
        </span>
      )}
      {isPick && <span style={{ fontSize: 11, color: C.orange, flexShrink: 0 }}>★</span>}
    </button>
  );
}

function GameCard({ game, pick, onPick }) {
  const resolved = game.state === "final" && game.winner;
  const won = resolved && pick && game.winner === pick;
  const lost = resolved && pick && game.winner !== pick;

  const tag = game.state === "live" ? { label: "EN DIRECT", color: C.red }
    : game.state === "final" ? { label: "TERMINÉ", color: C.muted }
    : { label: "À VENIR", color: C.blue };

  return (
    <div style={{
      background: won ? "rgba(34,211,122,0.06)" : lost ? "rgba(255,77,109,0.06)" : C.surface,
      border: `1px solid ${won ? "rgba(34,211,122,0.3)" : lost ? "rgba(255,77,109,0.3)" : C.border}`,
      borderRadius: 18, padding: "18px 20px",
      transition: "background .3s, border-color .3s",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1, color: C.orange, background: "rgba(255,92,0,0.12)", padding: "3px 8px", borderRadius: 6 }}>
            {game.league}
          </span>
          <span style={{ fontSize: 11, color: C.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{game.detail}</span>
        </div>
        <span style={{ fontSize: 10, fontWeight: 800, color: tag.color, flexShrink: 0 }}>{tag.label}</span>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: pick || game.state !== "pre" ? 12 : 0 }}>
        <TeamButton side="away" game={game} pick={pick} onPick={onPick} />
        <TeamButton side="home" game={game} pick={pick} onPick={onPick} />
      </div>

      {!pick && game.state === "pre" && (
        <div style={{ fontSize: 11, color: C.muted, marginTop: 12 }}>Choisis le vainqueur pour valider ton prono.</div>
      )}
      {pick && !resolved && (
        <div style={{ fontSize: 11, color: C.orange }}>
          ★ Ton prono est posé — résultat à la fin du match.
        </div>
      )}
      {resolved && pick && (
        <div style={{ fontSize: 12, fontWeight: 700, color: won ? C.green : C.red }}>
          {won ? `✓ Bien vu — +${POINTS_PER_PICK} pts` : "✗ Raté cette fois"}
        </div>
      )}
      {resolved && !pick && (
        <div style={{ fontSize: 11, color: C.muted }}>Match terminé — pas de prono posé.</div>
      )}
      {!pick && game.state === "live" && (
        <div style={{ fontSize: 11, color: C.muted }}>Match déjà commencé — trop tard pour pronostiquer.</div>
      )}
    </div>
  );
}

export default function Challenges({ user }) {
  const [games, setGames] = useState(null);
  const [state, setState] = useState("loading"); // loading | ready | error
  const [picks, setPicks] = useState(loadPicks);
  const [arenaIdx, setArenaIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setArenaIdx(i => (i + 1) % ARENA_PHOTOS.length), 8000);
    return () => clearInterval(t);
  }, []);

  const loadGames = useCallback(() => {
    fetch(`${API_BASE}/api/challenges/today`)
      .then(r => r.json())
      .then(d => { setGames(d.games || []); setState("ready"); })
      .catch(() => setState("error"));
  }, []);

  useEffect(() => {
    loadGames();
    // Un match peut se terminer pendant que la page est ouverte : on rafraîchit
    // pour que les pronos se résolvent sans rechargement manuel.
    const t = setInterval(loadGames, 60000);
    return () => clearInterval(t);
  }, [loadGames]);

  const resolvedGames = (games || []).filter(g => g.state === "final" && g.winner);
  const correct = resolvedGames.filter(g => picks[g.id]?.side === g.winner).length;
  const points = correct * POINTS_PER_PICK;
  const settled = resolvedGames.filter(g => picks[g.id]).length;
  const streak = computeStreak(picks);

  // Le score part au serveur pour alimenter le classement — uniquement quand
  // au moins un prono a été tranché, sinon on écrirait des lignes vides.
  useEffect(() => {
    if (!user?.email || !settled) return;
    fetch(`${API_BASE}/api/challenge-score`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: user.email, points, correct }),
    }).catch(() => { /* le score local reste affiché ; il repartira au prochain passage */ });
  }, [user?.email, points, correct, settled]);

  const handlePick = (gameId, side) => {
    const next = { ...picks, [gameId]: { side, day: todayKey() } };
    setPicks(next);
    savePicks(next);
  };

  const openGames = (games || []).filter(g => g.state === "pre");
  const pendingPicks = (games || []).filter(g => picks[g.id] && g.state !== "final").length;

  return (
    <div className="fade-in">
      <style>{`
        @keyframes popIn { 0%{transform:scale(0.8);opacity:0} 100%{transform:scale(1);opacity:1} }
        @keyframes shimmer { 0%,100%{opacity:1} 50%{opacity:0.6} }
      `}</style>

      {/* Arena hero banner — slideshow */}
      <div style={{ position: "relative", borderRadius: 20, overflow: "hidden", marginBottom: 24, height: 160 }}>
        {ARENA_PHOTOS.map((src, i) => (
          <div key={src} style={{
            position: "absolute", inset: 0,
            backgroundImage: `url(${src})`, backgroundSize: "cover", backgroundPosition: "center 40%",
            opacity: i === arenaIdx ? 1 : 0, transition: "opacity 2s ease-in-out",
          }} />
        ))}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(6,6,15,0.85) 0%, rgba(6,6,15,0.4) 100%)" }} />
        <div style={{ position: "relative", zIndex: 1, padding: "28px 32px", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <h1 style={{ fontFamily: "'Permanent Marker', cursive", fontSize: 46, letterSpacing: 2, lineHeight: 1, margin: 0 }}>
            DÉFIS <span style={{ color: C.orange }}>QUOTIDIENS</span>
          </h1>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, marginTop: 6 }}>
            Pronostique les vrais matchs du jour · {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>
      </div>

      {/* Score bar */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: "18px 22px", marginBottom: 28, display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}>
            {settled > 0
              ? `${correct} bon${correct > 1 ? "s" : ""} prono${correct > 1 ? "s" : ""} sur ${settled} match${settled > 1 ? "s" : ""} terminé${settled > 1 ? "s" : ""}`
              : "Aucun prono tranché pour l'instant"}
          </div>
          <div style={{ fontSize: 12, color: C.muted }}>
            {pendingPicks > 0 ? `${pendingPicks} prono${pendingPicks > 1 ? "s" : ""} en attente de résultat` : " "}
          </div>
        </div>
        <div style={{ textAlign: "center", padding: "0 20px", borderLeft: `1px solid ${C.border}` }}>
          <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 36, color: C.gold, lineHeight: 1 }}>{points}</div>
          <div style={{ fontSize: 11, color: C.muted }}>points gagnés</div>
        </div>
        {streak > 1 && (
          <div style={{ padding: "8px 16px", borderRadius: 12, background: "rgba(255,92,0,0.1)", border: `1px solid rgba(255,92,0,0.3)`, fontSize: 13, color: C.orange }}>
            🔥 {streak} jours de suite
          </div>
        )}
      </div>

      {state === "loading" && (
        <div style={{ textAlign: "center", padding: 60, color: C.muted }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🏀</div>
          Chargement des matchs du jour...
        </div>
      )}

      {state === "error" && (
        <div style={{ textAlign: "center", padding: 50, color: C.muted, fontSize: 13 }}>
          Impossible de charger les matchs. Réessaie dans un instant.
        </div>
      )}

      {state === "ready" && games.length === 0 && (
        <div style={{ textAlign: "center", padding: 50, color: C.muted, fontSize: 13, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 18 }}>
          <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.6 }}>🗓️</div>
          Aucun match NBA ou WNBA programmé aujourd'hui.<br />
          Reviens demain pour de nouveaux pronos.
        </div>
      )}

      {state === "ready" && games.length > 0 && (
        <>
          {openGames.length === 0 && (
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 14 }}>
              Tous les matchs du jour ont déjà commencé — les pronos rouvrent demain.
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
            {games.map(g => (
              <GameCard key={g.id} game={g} pick={picks[g.id]?.side} onPick={handlePick} />
            ))}
          </div>
        </>
      )}

      <div style={{ marginTop: 20, fontSize: 11, color: C.muted, textAlign: "center" }}>
        🏀 {POINTS_PER_PICK} points par prono gagné · Matchs et résultats fournis par ESPN
      </div>
    </div>
  );
}
