import { useState, useEffect, useRef, useCallback } from "react";

const C = {
  bg: "#06060f", surface: "rgba(255,255,255,0.04)", border: "rgba(255,255,255,0.07)",
  orange: "#ff5c00", gold: "#ffd700", green: "#22d37a", red: "#ff4d6d",
  blue: "#4fa3ff", purple: "#c084fc", text: "#f0f0ff", muted: "#6b6b88",
};

const API   = import.meta.env.DEV ? "http://localhost:3001" : "";
const TODAY = new Date().toISOString().split("T")[0];
const STORE = `hoopiq_duel_${TODAY}`;

// ── helpers ────────────────────────────────────────────────────────────────────
function loadStored() {
  try { return JSON.parse(localStorage.getItem(STORE)) || {}; } catch { return {}; }
}
function persist(s) {
  try { localStorage.setItem(STORE, JSON.stringify(s)); } catch {}
}

function isFinal(status) {
  if (!status) return false;
  const s = String(status).toLowerCase();
  return s === "final" || s.startsWith("final");
}
function isLive(status) {
  if (!status) return false;
  const s = String(status).toLowerCase();
  return s === "live" || s.includes("live") || /^\d+:\d+$/.test(s)
    || s.includes("q") || s.includes("half") || s.includes("ot");
}
function gameWinner(game) {
  if (!isFinal(game.status)) return null;
  const hs = parseInt(game.home?.score ?? 0, 10);
  const as = parseInt(game.away?.score ?? 0, 10);
  if (hs === as) return null;
  return hs > as ? game.home.abbr : game.away.abbr;
}
function pickedAbbr(game, side) {
  return side === "home" ? game.home?.abbr : game.away?.abbr;
}
function confColor(c) {
  return c === "Élevée" ? C.green : c === "Faible" ? C.red : C.gold;
}
function dateLabel() {
  return new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
}

// ── Logo ───────────────────────────────────────────────────────────────────────
function Logo({ url, size = 38 }) {
  const [ok, setOk] = useState(true);
  if (!url || !ok) return <div style={{ width: size, height: size }} />;
  return (
    <img src={url} width={size} height={size}
      style={{ objectFit: "contain" }}
      onError={() => setOk(false)} alt="" />
  );
}

// ── TeamBtn ────────────────────────────────────────────────────────────────────
function TeamBtn({ game, side, userPick, locked, winner, onPick }) {
  const team     = side === "home" ? game.home : game.away;
  const isPicked = userPick === side;
  const abbr     = team?.abbr;
  const isWinner = winner && abbr === winner;
  const isLoser  = winner && abbr !== winner;
  const correct  = isPicked && isWinner;
  const wrong    = isPicked && isLoser;

  let bg      = C.surface;
  let border  = C.border;
  let nameCol = C.text;

  if (correct)       { bg = "rgba(34,211,122,0.12)"; border = "rgba(34,211,122,0.45)"; nameCol = C.green; }
  else if (wrong)    { bg = "rgba(255,77,109,0.06)";  border = "rgba(255,77,109,0.18)"; nameCol = C.muted; }
  else if (isPicked) { bg = "rgba(255,92,0,0.13)";    border = "rgba(255,92,0,0.45)";  nameCol = C.orange; }
  else if (isLoser)  { nameCol = C.muted; }

  return (
    <button
      onClick={() => !locked && onPick(side)}
      disabled={locked}
      style={{
        flex: 1, padding: "16px 10px", borderRadius: 14, border: `1.5px solid ${border}`,
        background: bg, cursor: locked ? "default" : "pointer",
        fontFamily: "inherit", transition: "all .2s", display: "flex",
        flexDirection: "column", alignItems: "center", gap: 6, position: "relative",
      }}
    >
      {correct && (
        <div style={{ position: "absolute", top: 8, right: 10, fontSize: 14, color: C.green }}>✓</div>
      )}
      {wrong && (
        <div style={{ position: "absolute", top: 8, right: 10, fontSize: 12, color: C.red }}>✗</div>
      )}
      <Logo url={team?.logo} size={40} />
      <span style={{
        fontFamily: "'Permanent Marker', cursive", fontSize: 26, letterSpacing: 1, color: team?.color || nameCol,
        opacity: isLoser && !isPicked ? 0.4 : 1,
      }}>{abbr}</span>
      <span style={{ fontSize: 11, color: nameCol, fontWeight: 600, opacity: isLoser && !isPicked ? 0.5 : 1 }}>
        {team?.name?.split(" ").slice(-1)[0]}
      </span>
      {team?.record && <span style={{ fontSize: 10, color: C.muted }}>{team.record}</span>}
    </button>
  );
}

// ── AIPrediction ───────────────────────────────────────────────────────────────
function AIPrediction({ game, pred, loading, winner }) {
  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "14px 0", animation: "fadeIn .3s" }}>
        <div style={{ width: 18, height: 18, border: `2px solid ${C.border}`, borderTopColor: C.purple, borderRadius: "50%", animation: "spin .7s linear infinite" }} />
        <span style={{ fontSize: 12, color: C.purple }}>L'IA analyse…</span>
      </div>
    );
  }
  if (!pred) return null;

  const aiTeam    = pred.winner === game.home.abbr ? game.home : game.away;
  const aiCorrect = winner && pred.winner === winner;
  const aiWrong   = winner && pred.winner !== winner;

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 12,
      background: aiCorrect ? "rgba(34,211,122,0.08)" : aiWrong ? "rgba(255,77,109,0.06)" : "rgba(192,132,252,0.08)",
      border: `1px solid ${aiCorrect ? "rgba(34,211,122,0.3)" : aiWrong ? "rgba(255,77,109,0.2)" : "rgba(192,132,252,0.25)"}`,
      animation: "slideDown .35s ease",
    }}>
      <span style={{ fontSize: 16 }}>🤖</span>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, color: C.purple, fontWeight: 800, letterSpacing: 1 }}>IA HOOPIQ</span>
          <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 10, background: `${confColor(pred.confidence)}20`, color: confColor(pred.confidence), fontWeight: 700 }}>
            {pred.confidence}
          </span>
          {winner && (
            <span style={{ marginLeft: "auto", fontSize: 14, color: aiCorrect ? C.green : C.red }}>
              {aiCorrect ? "✓" : "✗"}
            </span>
          )}
        </div>
        <div style={{ fontSize: 13, color: C.text, marginTop: 3, fontWeight: 700 }}>
          Prédit :{" "}
          <span style={{ color: aiTeam?.color || C.purple, fontFamily: "'Permanent Marker', cursive", fontSize: 15, letterSpacing: .5 }}>
            {pred.winner}
          </span>
          {" "}· {pred.homeWinPct && (pred.winner === game.home.abbr ? pred.homeWinPct : 100 - pred.homeWinPct)}%
        </div>
      </div>
    </div>
  );
}

// ── GameCard ───────────────────────────────────────────────────────────────────
function GameCard({ game, userPick, aiPred, aiLoading, onPick }) {
  const final  = isFinal(game.status);
  const live   = isLive(game.status);
  const locked = !!userPick || live || final;
  const winner = gameWinal(game);
  const userAbbr   = userPick ? pickedAbbr(game, userPick) : null;
  const userCorrect = userAbbr && winner && userAbbr === winner;
  const userWrong   = userAbbr && winner && userAbbr !== winner;

  function gameWinal(g) {
    if (!isFinal(g.status)) return null;
    const hs = parseInt(g.home?.score ?? 0, 10);
    const as = parseInt(g.away?.score ?? 0, 10);
    if (hs === as) return null;
    return hs > as ? g.home.abbr : g.away.abbr;
  }

  let borderColor = C.border;
  if (live)         borderColor = "rgba(255,77,109,0.35)";
  if (userCorrect)  borderColor = "rgba(34,211,122,0.4)";
  if (userWrong)    borderColor = "rgba(255,77,109,0.3)";

  return (
    <div style={{
      background: C.surface, border: `1.5px solid ${borderColor}`,
      borderRadius: 20, padding: "20px 18px", transition: "border-color .3s",
    }}>
      {/* Status row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <span style={{
          fontSize: 10, fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase",
          color: live ? C.red : final ? C.muted : C.blue,
          display: "flex", alignItems: "center", gap: 5,
        }}>
          {live && <span style={{ width: 7, height: 7, borderRadius: "50%", background: C.red, display: "inline-block", animation: "pulse 1.2s infinite" }} />}
          {live ? "LIVE " + (game.clock || "") : final ? "FINAL" : "À VENIR"}
        </span>
        {final && (
          <span style={{ fontFamily: "'Permanent Marker', cursive", fontSize: 20, color: C.text, letterSpacing: 1 }}>
            {game.away?.score} – {game.home?.score}
          </span>
        )}
        {live && (
          <span style={{ fontFamily: "'Permanent Marker', cursive", fontSize: 20, color: C.red, letterSpacing: 1 }}>
            {game.away?.score} – {game.home?.score}
          </span>
        )}
      </div>

      {/* Pick buttons */}
      <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
        <TeamBtn game={game} side="away" userPick={userPick} locked={locked} winner={winner} onPick={onPick} />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, padding: "0 4px" }}>
          <span style={{ fontSize: 10, color: C.muted, fontWeight: 700 }}>@</span>
          {!userPick && !live && !final && (
            <span style={{ fontSize: 9, color: C.muted }}>Choisis</span>
          )}
        </div>
        <TeamBtn game={game} side="home" userPick={userPick} locked={locked} winner={winner} onPick={onPick} />
      </div>

      {/* AI prediction — shown only after user picks */}
      {(userPick || final) && (
        <AIPrediction game={game} pred={aiPred} loading={aiLoading} winner={winner} />
      )}

      {/* Result summary */}
      {final && userPick && (
        <div style={{ marginTop: 10, textAlign: "center", fontSize: 12, fontWeight: 800, letterSpacing: .5,
          color: userCorrect ? C.green : C.red }}>
          {userCorrect ? "✓ TU AS BIEN VU" : "✗ RATÉ — " + winner + " A GAGNÉ"}
        </div>
      )}
    </div>
  );
}

// ── Share modal ────────────────────────────────────────────────────────────────
function ShareModal({ games, userPicks, aiPicks, userScore, aiScore, total, onClose }) {
  const [copied, setCopied] = useState(false);

  const dateStr = new Date().toLocaleDateString("fr-FR", {
    day: "numeric", month: "long", year: "numeric"
  }).toUpperCase();

  const lines = games.map(g => {
    const winner  = gameWinner(g);
    const uSide   = userPicks[g.id];
    const uAbbr   = uSide ? pickedAbbr(g, uSide) : null;
    const uMark   = !winner ? "⏳" : uAbbr === winner ? "✅" : "❌";
    const aiAbbr  = aiPicks[g.id]?.winner;
    const aiMark  = !winner ? "⏳" : aiAbbr === winner ? "✅" : "❌";
    const uLabel  = uAbbr ? `Moi: ${uAbbr} ${uMark}` : "Moi: ? ⏳";
    const aiLabel = aiAbbr ? `IA: ${aiAbbr} ${aiMark}` : "IA: ? ⏳";
    return `🏀 ${g.away.abbr} @ ${g.home.abbr}  ⟶  ${uLabel}  ${aiLabel}`;
  }).join("\n");

  const result = userScore > aiScore ? `MOI: ${userScore}/${total}  IA: ${aiScore}/${total} — 🔥 J'AI BATTU L'IA!`
    : aiScore > userScore             ? `MOI: ${userScore}/${total}  IA: ${aiScore}/${total} — 🤖 L'IA A GAGNÉ`
    : `MOI: ${userScore}/${total}  IA: ${aiScore}/${total} — ⚖️ ÉGALITÉ!`;

  const card = `⚔️ DUEL IA — HoopIQ\n📅 ${dateStr}\n\n${lines}\n\n${result}\n🔗 hoopiq-zeta.vercel.app\n#HoopIQ #NBA #NBAFrance`;

  const copy = () => {
    navigator.clipboard?.writeText(card).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "#0d0d1f", border: `1px solid ${C.border}`, borderRadius: 24, padding: "28px 24px", maxWidth: 480, width: "100%", animation: "fadeIn .2s" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontFamily: "'Permanent Marker', cursive", fontSize: 28, letterSpacing: 2, color: C.orange }}>PARTAGE TA VICTOIRE</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.muted, fontSize: 22, cursor: "pointer" }}>✕</button>
        </div>

        <pre style={{
          background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`,
          borderRadius: 14, padding: "16px 14px", fontSize: 12, color: C.text,
          fontFamily: "monospace", lineHeight: 1.8, whiteSpace: "pre-wrap", marginBottom: 18,
        }}>{card}</pre>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={copy} style={{
            flex: 1, padding: "12px 0", borderRadius: 12, fontSize: 14, fontWeight: 800, cursor: "pointer",
            fontFamily: "inherit", transition: "all .2s",
            background: copied ? "rgba(34,211,122,0.15)" : "rgba(255,92,0,0.15)",
            border: `1px solid ${copied ? "rgba(34,211,122,0.4)" : "rgba(255,92,0,0.4)"}`,
            color: copied ? C.green : C.orange,
          }}>
            {copied ? "✓ COPIÉ !" : "📋 COPIER"}
          </button>
          <button onClick={onClose} style={{
            padding: "12px 20px", borderRadius: 12, fontSize: 14, cursor: "pointer",
            fontFamily: "inherit", background: "none", border: `1px solid ${C.border}`, color: C.muted,
          }}>Fermer</button>
        </div>
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function Duel() {
  const stored          = loadStored();
  const [games, setGames]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(false);
  const [userPicks, setUserPicks] = useState(stored.picks   || {});
  const [aiPicks, setAiPicks]     = useState(stored.ai      || {});
  const [aiLoading, setAiLoading] = useState({});
  const [showShare, setShowShare] = useState(false);
  const prefetchedRef = useRef({});
  const pollRef       = useRef(null);

  // ── Fetch games ──────────────────────────────────────────────────────────────
  const fetchGames = useCallback(async () => {
    try {
      const res  = await fetch(`${API}/api/nba/livecenter`);
      const data = await res.json();
      setGames(data.games || []);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  // ── Poll while any game is live ──────────────────────────────────────────────
  useEffect(() => {
    const anyLive = games.some(g => isLive(g.status));
    if (anyLive) {
      pollRef.current = setInterval(fetchGames, 60_000);
    }
    return () => clearInterval(pollRef.current);
  }, [games, fetchGames]);

  // ── Pre-fetch AI predictions for all games silently in background ───────────
  useEffect(() => {
    games.forEach(g => {
      if (prefetchedRef.current[g.id]) return;
      if (aiPicks[g.id]) { prefetchedRef.current[g.id] = true; return; }
      prefetchedRef.current[g.id] = true;
      fetch(`${API}/api/nba/predict/${g.id}`)
        .then(r => r.json())
        .then(d => {
          if (d.prediction) {
            setAiPicks(prev => {
              const next = { ...prev, [g.id]: d.prediction };
              persist({ picks: userPicks, ai: next });
              return next;
            });
          }
        })
        .catch(() => {});
    });
  }, [games]);   // eslint-disable-line react-hooks/exhaustive-deps

  // ── Pick handler ─────────────────────────────────────────────────────────────
  const handlePick = (gameId, side) => {
    if (userPicks[gameId]) return;
    const next = { ...userPicks, [gameId]: side };
    setUserPicks(next);
    persist({ picks: next, ai: aiPicks });

    // If AI prediction not yet fetched, trigger loading state + fetch
    if (!aiPicks[gameId]) {
      setAiLoading(prev => ({ ...prev, [gameId]: true }));
      fetch(`${API}/api/nba/predict/${gameId}`)
        .then(r => r.json())
        .then(d => {
          if (d.prediction) {
            setAiPicks(prev => {
              const n = { ...prev, [gameId]: d.prediction };
              persist({ picks: next, ai: n });
              return n;
            });
          }
        })
        .catch(() => {})
        .finally(() => setAiLoading(prev => ({ ...prev, [gameId]: false })));
    }
  };

  // ── Score calculation ────────────────────────────────────────────────────────
  const finishedGames = games.filter(g => isFinal(g.status));
  let userScore = 0, aiScore = 0;
  finishedGames.forEach(g => {
    const winner = gameWinner(g);
    if (!winner) return;
    const uAbbr = userPicks[g.id] ? pickedAbbr(g, userPicks[g.id]) : null;
    if (uAbbr === winner) userScore++;
    if (aiPicks[g.id]?.winner === winner) aiScore++;
  });
  const pickedCount  = Object.keys(userPicks).length;
  const totalGames   = games.length;
  const allDone      = totalGames > 0 && finishedGames.length === totalGames;
  const hasAnyLive   = games.some(g => isLive(g.status));

  // ── Result label ─────────────────────────────────────────────────────────────
  let resultBg    = "rgba(255,92,0,0.1)";
  let resultBdr   = "rgba(255,92,0,0.3)";
  let resultLabel = null;
  let resultColor = C.orange;
  if (allDone && pickedCount > 0) {
    if (userScore > aiScore)       { resultBg = "rgba(34,211,122,0.1)"; resultBdr = "rgba(34,211,122,0.35)"; resultColor = C.green; resultLabel = "🔥 TU AS BATTU L'IA !"; }
    else if (aiScore > userScore)  { resultBg = "rgba(255,77,109,0.08)"; resultBdr = "rgba(255,77,109,0.25)"; resultColor = C.red;  resultLabel = "🤖 L'IA GAGNE CE SOIR"; }
    else                           { resultBg = "rgba(255,215,0,0.08)"; resultBdr = "rgba(255,215,0,0.3)";  resultColor = C.gold; resultLabel = "⚖️ ÉGALITÉ PARFAITE"; }
  }

  return (
    <div className="fade-in">
      <style>{`
        @keyframes fadeIn    { from{opacity:0} to{opacity:1} }
        @keyframes slideDown { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin      { to{transform:rotate(360deg)} }
        @keyframes pulse     { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes popIn     { 0%{transform:scale(0.92);opacity:0} 100%{transform:scale(1);opacity:1} }
      `}</style>

      {/* ── Header ── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: "'Permanent Marker', cursive", fontSize: 52, letterSpacing: 3, lineHeight: 1, margin: 0 }}>
              DUEL <span style={{ color: C.orange }}>IA</span> <span style={{ fontSize: 36 }}>⚔️</span>
            </h1>
            <p style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>
              {dateLabel()} · Fais tes pronostics, l'IA fait les siens — qui voit mieux ?
            </p>
          </div>

          {/* Score scoreboard */}
          {pickedCount > 0 && (
            <div style={{
              display: "flex", alignItems: "center", gap: 0,
              background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden",
              animation: "popIn .4s ease",
            }}>
              <div style={{ padding: "12px 20px", textAlign: "center", borderRight: `1px solid ${C.border}` }}>
                <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 32, color: C.orange, lineHeight: 1 }}>{userScore}</div>
                <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>TOI</div>
              </div>
              <div style={{ padding: "8px 14px", fontSize: 18, color: C.muted }}>vs</div>
              <div style={{ padding: "12px 20px", textAlign: "center", borderLeft: `1px solid ${C.border}` }}>
                <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 32, color: C.purple, lineHeight: 1 }}>{aiScore}</div>
                <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>IA</div>
              </div>
            </div>
          )}
        </div>

        {/* Live badge */}
        {hasAnyLive && (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 10, padding: "5px 12px", borderRadius: 20, background: "rgba(255,77,109,0.1)", border: "1px solid rgba(255,77,109,0.3)" }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: C.red, display: "inline-block", animation: "pulse 1.2s infinite" }} />
            <span style={{ fontSize: 11, color: C.red, fontWeight: 800 }}>MATCHS EN COURS — résultats mis à jour automatiquement</span>
          </div>
        )}
      </div>

      {/* ── Result banner ── */}
      {resultLabel && (
        <div style={{
          padding: "18px 24px", borderRadius: 18, marginBottom: 24, display: "flex",
          alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12,
          background: resultBg, border: `1px solid ${resultBdr}`, animation: "popIn .5s ease",
        }}>
          <div>
            <div style={{ fontFamily: "'Permanent Marker', cursive", fontSize: 30, letterSpacing: 2, color: resultColor }}>
              {resultLabel}
            </div>
            <div style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>
              Toi : {userScore}/{finishedGames.length} correct{userScore > 1 ? "s" : ""} · IA : {aiScore}/{finishedGames.length}
            </div>
          </div>
          <button
            onClick={() => setShowShare(true)}
            style={{
              padding: "10px 22px", borderRadius: 12, fontSize: 14, fontWeight: 800,
              cursor: "pointer", fontFamily: "inherit",
              background: `${resultColor}20`, border: `1px solid ${resultColor}50`, color: resultColor,
              transition: "all .2s",
            }}
          >
            📤 PARTAGER
          </button>
        </div>
      )}

      {/* ── Game cards ── */}
      {loading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, padding: "80px 0", color: C.muted }}>
          <div style={{ width: 24, height: 24, border: `2px solid ${C.border}`, borderTopColor: C.orange, borderRadius: "50%", animation: "spin .7s linear infinite" }} />
          <span style={{ fontSize: 14 }}>Chargement des matchs de ce soir…</span>
        </div>
      ) : error ? (
        <div style={{ textAlign: "center", padding: "80px 20px", color: C.muted }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📡</div>
          <div style={{ fontSize: 15, color: C.text, marginBottom: 6 }}>Serveur NBA injoignable</div>
          <div style={{ fontSize: 13 }}>Vérifie ta connexion ou réessaie dans quelques secondes.</div>
          <button onClick={() => { setLoading(true); fetchGames(); }} style={{
            marginTop: 16, padding: "8px 20px", borderRadius: 10, cursor: "pointer",
            fontFamily: "inherit", background: "none", border: `1px solid ${C.orange}`, color: C.orange, fontSize: 13,
          }}>Réessayer</button>
        </div>
      ) : games.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 20px", color: C.muted }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🏀</div>
          <div style={{ fontFamily: "'Permanent Marker', cursive", fontSize: 28, color: C.text, letterSpacing: 2, marginBottom: 8 }}>
            PAS DE MATCHS CE SOIR
          </div>
          <div style={{ fontSize: 14, maxWidth: 360, margin: "0 auto", lineHeight: 1.7 }}>
            Aucun match NBA programmé aujourd'hui. Reviens demain pour défier l'IA !
          </div>
          <div style={{ marginTop: 24, display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <div style={{ padding: "14px 22px", borderRadius: 14, background: C.surface, border: `1px solid ${C.border}` }}>
              <div style={{ fontFamily: "'Permanent Marker', cursive", fontSize: 22, color: C.orange }}>ORACLE</div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>Pronostics IA sur les prochains matchs</div>
            </div>
            <div style={{ padding: "14px 22px", borderRadius: 14, background: C.surface, border: `1px solid ${C.border}` }}>
              <div style={{ fontFamily: "'Permanent Marker', cursive", fontSize: 22, color: C.gold }}>DÉFIS</div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>Challenges NBA quotidiens</div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Instructions (first time) */}
          {pickedCount === 0 && !loading && (
            <div style={{
              display: "flex", alignItems: "center", gap: 12, padding: "12px 18px", borderRadius: 14, marginBottom: 20,
              background: "rgba(255,92,0,0.06)", border: "1px solid rgba(255,92,0,0.18)",
            }}>
              <span style={{ fontSize: 20 }}>👆</span>
              <span style={{ fontSize: 13, color: C.muted }}>
                Clique sur une équipe pour faire ton pronostic — l'IA révèle ensuite le sien.
              </span>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
            {games.map(g => (
              <GameCard
                key={g.id}
                game={g}
                userPick={userPicks[g.id] || null}
                aiPred={aiPicks[g.id] || null}
                aiLoading={!!aiLoading[g.id]}
                onPick={(side) => handlePick(g.id, side)}
              />
            ))}
          </div>

          {/* Progress footer */}
          <div style={{ marginTop: 24, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 6 }}>
                <span style={{ color: C.muted }}>Tes pronostics : {pickedCount}/{totalGames}</span>
                <span style={{ color: C.orange }}>{Math.round(pickedCount / totalGames * 100)}%</span>
              </div>
              <div style={{ height: 5, background: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ width: `${pickedCount / totalGames * 100}%`, height: "100%", background: `linear-gradient(90deg,${C.orange},${C.gold})`, borderRadius: 4, transition: "width .4s ease" }} />
              </div>
            </div>
            {pickedCount > 0 && !allDone && (
              <div style={{ fontSize: 11, color: C.muted }}>
                {finishedGames.length}/{totalGames} terminé{finishedGames.length > 1 ? "s" : ""}
              </div>
            )}
            {pickedCount > 0 && allDone && (
              <button onClick={() => setShowShare(true)} style={{
                padding: "7px 16px", borderRadius: 10, fontSize: 12, fontWeight: 800, cursor: "pointer",
                fontFamily: "inherit", background: "rgba(255,92,0,0.15)", border: "1px solid rgba(255,92,0,0.4)", color: C.orange,
              }}>
                📤 Partager mes résultats
              </button>
            )}
          </div>
        </>
      )}

      {/* ── Share modal ── */}
      {showShare && (
        <ShareModal
          games={games}
          userPicks={userPicks}
          aiPicks={aiPicks}
          userScore={userScore}
          aiScore={aiScore}
          total={finishedGames.length}
          onClose={() => setShowShare(false)}
        />
      )}
    </div>
  );
}
