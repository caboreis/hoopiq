import { useState, useEffect } from "react";

const C = {
  bg: "#06060f", bg2: "#0d0d1f",
  surface: "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.07)",
  orange: "#ff5c00", gold: "#ffd700",
  green: "#22d37a", red: "#ff4d6d",
  blue: "#4fa3ff", purple: "#c084fc",
  text: "#f0f0ff", muted: "#6b6b88",
};

const API = import.meta.env.DEV ? "http://localhost:3001" : "";

function Logo({ url, size = 30 }) {
  const [ok, setOk] = useState(true);
  if (!url || !ok) return null;
  return <img src={url} alt="" width={size} height={size} onError={() => setOk(false)} style={{ objectFit: "contain" }} />;
}

const confColor = (c) => (c === "Élevée" ? C.green : c === "Faible" ? C.red : C.gold);

export default function Oracle() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState(null);
  const [pred, setPred] = useState(null);
  const [predLoading, setPredLoading] = useState(false);
  const [predError, setPredError] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch(`${API}/api/nba/livecenter`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (!active) return;
        const list = data.games || [];
        setGames(list);
        setLoading(false);
        // Auto-select: live game first, otherwise first game
        const autoGame = list.find(g => g.status === "live") || list[0];
        if (autoGame) runPrediction(autoGame);
      } catch {
        if (active) { setError(true); setLoading(false); }
      }
    })();
    return () => { active = false; };
  }, []);

  const runPrediction = async (game) => {
    setSelected(game);
    setPred(null);
    setPredError(false);
    setPredLoading(true);
    try {
      const res = await fetch(`${API}/api/nba/predict/${game.id}`);
      const data = await res.json();
      if (!res.ok || !data.prediction) {
        console.error('Oracle error:', data);
        setPredError(data.detail || data.error || 'Erreur inconnue');
      } else {
        setPred(data.prediction);
      }
    } catch (err) {
      setPredError(err.message || 'Erreur réseau');
    }
    setPredLoading(false);
  };

  const homePct = pred ? Math.max(0, Math.min(100, pred.homeWinPct)) : 50;
  const winnerIsHome = selected && pred && pred.winner === selected.home.abbr;
  const winnerTeam = selected && pred ? (winnerIsHome ? selected.home : selected.away) : null;

  return (
    <div className="fade-in">
      <style>{`
        @keyframes oraclePulse { 0%,100%{box-shadow:0 0 0 0 rgba(192,132,252,0.4)} 50%{box-shadow:0 0 0 8px rgba(192,132,252,0)} }
        @keyframes spin { to { transform: rotate(360deg); } }
        .oracle-game:hover { border-color: rgba(192,132,252,0.45) !important; transform: translateY(-2px); }
      `}</style>

      {/* Hero */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 8 }}>
        <div style={{ fontSize: 30 }}>🔮</div>
        <div>
          <h1 style={{ margin: 0, fontFamily: "'Permanent Marker', cursive", fontSize: 34, letterSpacing: 2, background: `linear-gradient(135deg,${C.purple},${C.blue})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>HOOP IQ ORACLE</h1>
          <p style={{ margin: 0, color: C.muted, fontSize: 13 }}>Pronostics IA ancrés dans les vraies données NBA — cotes Vegas, confrontations, blessures, stats.</p>
        </div>
      </div>

      <div className="oracle-grid" style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 20, marginTop: 22, alignItems: "start" }}>
        {/* Game picker */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2, color: C.muted, textTransform: "uppercase", marginBottom: 12 }}>Choisis un match</div>
          {loading ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10, color: C.muted, padding: 20 }}>
              <div style={{ width: 20, height: 20, border: `2px solid ${C.border}`, borderTopColor: C.purple, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              <span style={{ fontSize: 12 }}>Chargement des matchs…</span>
            </div>
          ) : error ? (
            <div style={{ color: C.muted, fontSize: 12, padding: 16 }}>📡 Serveur NBA injoignable (port 3001).</div>
          ) : games.length === 0 ? (
            <div style={{ color: C.muted, fontSize: 12, padding: 16 }}>🏀 Aucun match programmé aujourd'hui.</div>
          ) : (
            games.map(g => {
              const isSel = selected?.id === g.id;
              return (
                <div key={g.id} className="oracle-game" onClick={() => runPrediction(g)} style={{
                  background: isSel ? "rgba(192,132,252,0.08)" : C.surface,
                  border: `1px solid ${isSel ? "rgba(192,132,252,0.4)" : C.border}`,
                  borderRadius: 12, padding: "12px 14px", marginBottom: 10, cursor: "pointer", transition: "all .2s",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Logo url={g.away.logo} size={24} />
                      <span style={{ fontFamily: "'Permanent Marker', cursive", fontSize: 16, color: g.away.color }}>{g.away.abbr}</span>
                      <span style={{ color: C.muted, fontSize: 11 }}>@</span>
                      <span style={{ fontFamily: "'Permanent Marker', cursive", fontSize: 16, color: g.home.color }}>{g.home.abbr}</span>
                      <Logo url={g.home.logo} size={24} />
                    </div>
                    <span style={{ fontSize: 9, fontWeight: 800, color: g.status === "live" ? C.red : g.status === "final" ? C.muted : C.blue, textTransform: "uppercase" }}>
                      {g.status === "live" ? "🔴 Live" : g.status === "final" ? "Final" : "À venir"}
                    </span>
                  </div>
                  <div style={{ fontSize: 10, color: C.muted, marginTop: 6 }}>{g.away.record} · {g.home.record}</div>
                </div>
              );
            })
          )}
        </div>

        {/* Prediction panel */}
        <div>
          {!selected ? (
            <div style={{ border: `1px dashed ${C.border}`, borderRadius: 18, padding: "60px 30px", textAlign: "center", color: C.muted }}>
              <div style={{ fontSize: 44, marginBottom: 12 }}>🔮</div>
              <div style={{ fontSize: 15, color: C.text, marginBottom: 6 }}>Sélectionne un match</div>
              <div style={{ fontSize: 13 }}>L'Oracle analysera les vraies données et livrera son pronostic.</div>
            </div>
          ) : predLoading ? (
            <div style={{ border: `1px solid ${C.border}`, borderRadius: 18, padding: "60px 30px", textAlign: "center", color: C.muted }}>
              <div style={{ width: 44, height: 44, border: `3px solid ${C.border}`, borderTopColor: C.purple, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 18px" }} />
              <div style={{ fontSize: 14, color: C.text }}>L'Oracle consulte les données…</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>Cotes, confrontations, blessures, stats en cours d'analyse</div>
            </div>
          ) : predError ? (
            <div style={{ border: `1px solid rgba(255,77,109,0.3)`, borderRadius: 18, padding: 40, textAlign: "center", color: C.red }}>
              <div style={{ marginBottom: 12 }}>❌ Échec de la prédiction</div>
              {typeof predError === 'string' && predError !== 'true' && (
                <div style={{ fontSize: 12, color: C.muted, marginBottom: 12, fontFamily: "monospace" }}>{predError}</div>
              )}
              <button onClick={() => runPrediction(selected)} style={{ background: "none", border: `1px solid ${C.red}`, color: C.red, borderRadius: 8, padding: "6px 16px", cursor: "pointer" }}>Réessayer</button>
            </div>
          ) : pred ? (
            <div className="fade-in">
              {/* Winner banner */}
              <div style={{ background: `linear-gradient(135deg, ${winnerTeam?.color}25, rgba(0,0,0,0.4))`, border: `1px solid ${winnerTeam?.color}55`, borderRadius: 18, padding: "22px 26px", marginBottom: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <Logo url={winnerTeam?.logo} size={48} />
                    <div>
                      <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1.5, textTransform: "uppercase" }}>Vainqueur prédit</div>
                      <div style={{ fontFamily: "'Permanent Marker', cursive", fontSize: 34, color: winnerTeam?.color, letterSpacing: 1 }}>{winnerTeam?.name}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1, textTransform: "uppercase" }}>Score projeté</div>
                    <div style={{ fontFamily: "'Permanent Marker', cursive", fontSize: 30, color: C.text }}>
                      {selected.home.abbr} {pred.projectedScore?.home} – {pred.projectedScore?.away} {selected.away.abbr}
                    </div>
                  </div>
                </div>

                {/* win prob bar */}
                <div style={{ marginTop: 18 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5 }}>
                    <span style={{ color: selected.home.color, fontWeight: 800 }}>{homePct}% {selected.home.abbr}</span>
                    <span style={{ color: C.muted, fontSize: 10 }}>Probabilité de victoire</span>
                    <span style={{ color: selected.away.color, fontWeight: 800 }}>{100 - homePct}% {selected.away.abbr}</span>
                  </div>
                  <div style={{ height: 8, background: "rgba(255,255,255,0.06)", borderRadius: 5, overflow: "hidden", display: "flex" }}>
                    <div style={{ width: `${homePct}%`, background: selected.home.color, transition: "width .8s ease" }} />
                    <div style={{ flex: 1, background: selected.away.color }} />
                  </div>
                </div>

                <div style={{ marginTop: 16, display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 12px", borderRadius: 20, background: "rgba(0,0,0,0.3)", border: `1px solid ${confColor(pred.confidence)}55` }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: confColor(pred.confidence) }} />
                  <span style={{ fontSize: 11, color: confColor(pred.confidence), fontWeight: 700 }}>Confiance : {pred.confidence}</span>
                </div>
              </div>

              {/* Verdict */}
              <div style={{ background: "rgba(192,132,252,0.07)", border: `1px solid rgba(192,132,252,0.22)`, borderLeft: `3px solid ${C.purple}`, borderRadius: 14, padding: "16px 18px", marginBottom: 18 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: C.purple, letterSpacing: 1.5, marginBottom: 6, textTransform: "uppercase" }}>🔮 Verdict de l'Oracle</div>
                <p style={{ margin: 0, fontSize: 14, color: "#e8e8ff", lineHeight: 1.6 }}>{pred.verdict}</p>
              </div>

              <div className="oracle-grid2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {/* Key factors */}
                <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 18 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: C.orange, letterSpacing: 1.5, marginBottom: 12, textTransform: "uppercase" }}>📊 Facteurs clés</div>
                  {(pred.keyFactors || []).map((f, i) => (
                    <div key={i} style={{ display: "flex", gap: 10, marginBottom: 10, fontSize: 13, color: "#dde", lineHeight: 1.5 }}>
                      <span style={{ color: C.orange, fontWeight: 800, flexShrink: 0 }}>{i + 1}.</span>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>

                {/* X-factor */}
                <div style={{ background: `linear-gradient(135deg, rgba(255,215,0,0.06), ${C.surface})`, border: `1px solid rgba(255,215,0,0.2)`, borderRadius: 14, padding: 18 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: C.gold, letterSpacing: 1.5, marginBottom: 12, textTransform: "uppercase" }}>⭐ X-Factor</div>
                  <div style={{ fontFamily: "'Permanent Marker', cursive", fontSize: 24, color: C.gold, marginBottom: 6 }}>{pred.xFactor?.player}</div>
                  <p style={{ margin: 0, fontSize: 13, color: "#dde", lineHeight: 1.5 }}>{pred.xFactor?.reason}</p>
                </div>
              </div>

              <div style={{ marginTop: 16, fontSize: 10, color: C.muted, textAlign: "center" }}>
                ⚠️ Pronostic IA à but informatif — données ESPN en temps réel. Pariez responsable.
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
