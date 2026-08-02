import { useState, useEffect } from "react";
import { authHeaders } from "./authHeaders.js";

const API = import.meta.env.DEV ? "http://localhost:3001" : "";

const C = {
  bg: "#06060f", bg2: "#0d0d1f",
  surface: "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.07)",
  orange: "#ff5c00", orangeL: "#ff8c42",
  gold: "#f5c842", green: "#22d37a",
  red: "#ff4d6d", blue: "#4fa3ff",
  purple: "#c084fc", text: "#f0f0ff", muted: "#6b6b88",
};

function Logo({ url, size = 40 }) {
  const [ok, setOk] = useState(true);
  if (!url || !ok) return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.4 }}>🏀</div>
  );
  return <img src={url} alt="" width={size} height={size} onError={() => setOk(false)} style={{ objectFit: "contain", filter: "drop-shadow(0 2px 12px rgba(0,0,0,0.7))" }} />;
}

function Countdown({ gameTime }) {
  const [diff, setDiff] = useState(null);
  useEffect(() => {
    if (!gameTime) return;
    const calc = () => {
      const d = new Date(gameTime).getTime() - Date.now();
      if (d <= 0) { setDiff(null); return; }
      setDiff({ h: Math.floor(d / 3600000), m: Math.floor((d % 3600000) / 60000), s: Math.floor((d % 60000) / 1000) });
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [gameTime]);
  if (!diff) return null;
  return (
    <div style={{ display: "flex", gap: 5, alignItems: "center", justifyContent: "center" }}>
      {[diff.h > 0 && `${diff.h}h`, `${String(diff.m).padStart(2, "0")}m`, `${String(diff.s).padStart(2, "0")}s`].filter(Boolean).map((v, i) => (
        <span key={i} style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 800, color: C.orange, background: "rgba(255,92,0,0.12)", padding: "2px 8px", borderRadius: 6, border: "1px solid rgba(255,92,0,0.3)", animation: "countPulse 1s ease-in-out infinite" }}>{v}</span>
      ))}
    </div>
  );
}

function ConfBadge({ conf }) {
  const map = {
    "Élevée":  { color: C.green,  icon: "🔥", label: "HAUTE CONFIANCE" },
    "Moyenne": { color: C.gold,   icon: "⚡", label: "PROBABLE" },
    "Faible":  { color: C.muted,  icon: "🎲", label: "INCERTAIN" },
  };
  const { color, icon, label } = map[conf] || map["Moyenne"];
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 14px", borderRadius: 20, background: `${color}18`, border: `1px solid ${color}44` }}>
      <span>{icon}</span>
      <span style={{ fontSize: 11, fontWeight: 800, color, letterSpacing: 1.2, fontFamily: "monospace" }}>{label}</span>
    </div>
  );
}

function PickBadge() {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 8, background: "linear-gradient(135deg,#f5c842,#ff8c00)", color: "#1a0800", fontSize: 10, fontWeight: 900, letterSpacing: 1.5, fontFamily: "monospace" }}>
      ⭐ PICK DU JOUR
    </div>
  );
}

export default function PreMatch() {
  const [games, setGames]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(false);
  const [predictions, setPredictions] = useState({});
  const [predLoading, setPredLoading] = useState({});
  const [selected, setSelected]       = useState(null);
  const [autoRunning, setAutoRunning] = useState(false);
  const [autoProgress, setAutoProgress] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API}/api/nba/livecenter`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        const all = data.games || [];
        setGames(all);
        if (all.length > 0) setSelected(all[0]);
        setLoading(false);
      } catch {
        setError(true);
        setLoading(false);
      }
    })();
  }, []);

  const predict = async (game) => {
    if (predictions[game.id] || predLoading[game.id]) return;
    setPredLoading(p => ({ ...p, [game.id]: true }));
    try {
      const res = await fetch(`${API}/api/nba/predict/${game.id}`, { headers: authHeaders() });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPredictions(p => ({ ...p, [game.id]: data.prediction }));
    } catch {
      setPredictions(p => ({ ...p, [game.id]: { error: true } }));
    }
    setPredLoading(p => ({ ...p, [game.id]: false }));
  };

  const predictAll = async () => {
    setAutoRunning(true);
    setAutoProgress(0);
    const unpredicted = games.filter(g => !predictions[g.id]);
    for (let i = 0; i < unpredicted.length; i++) {
      await predict(unpredicted[i]);
      setAutoProgress(Math.round(((i + 1) / unpredicted.length) * 100));
    }
    setAutoRunning(false);
  };

  const pred         = selected ? predictions[selected.id] : null;
  const isPredLoading = selected ? predLoading[selected.id] : false;
  const homePct      = pred && !pred.error ? Math.max(5, Math.min(95, pred.homeWinPct)) : 50;
  const winnerIsHome = pred && selected && pred.winner === selected.home.abbr;
  const winnerTeam   = pred && !pred.error && selected ? (winnerIsHome ? selected.home : selected.away) : null;

  // Le "Pick du jour" = prédiction avec la plus haute confiance
  const pickOfDay = games.find(g => predictions[g.id]?.confidence === "Élevée") || null;

  return (
    <div className="fade-in">
      <style>{`
        @keyframes predSpin   { to { transform: rotate(360deg); } }
        @keyframes countPulse { 0%,100%{opacity:1} 50%{opacity:.6} }
        @keyframes floatUp    { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes glowPulse  { 0%,100%{opacity:.7} 50%{opacity:1} }
        @keyframes progressFill { from{width:0%} to{width:100%} }
        .game-row:hover  { background: rgba(255,92,0,0.07) !important; border-color: rgba(255,92,0,0.35) !important; transform: translateX(3px); }
        .pred-btn:hover  { transform: translateY(-3px) !important; box-shadow: 0 12px 40px rgba(255,92,0,0.5) !important; }
        .pick-card:hover { transform: translateY(-3px); }
      `}</style>

      {/* ── HERO ── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 3, color: C.orange, textTransform: "uppercase", fontFamily: "monospace", marginBottom: 6, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: C.orange, animation: "glowPulse 1.5s infinite", display: "inline-block" }} />
              Analyse IA · NBA
            </div>
            <h1 style={{ margin: 0, fontFamily: "'Permanent Marker', cursive", fontSize: 56, letterSpacing: 2, lineHeight: .9 }}>
              PRONOSTICS<br />
              <span style={{ background: `linear-gradient(135deg,${C.orange},${C.gold})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>IA LIVE</span>
            </h1>
            <p style={{ margin: "8px 0 0", fontSize: 13, color: C.muted }}>Prédictions IA ancrées dans les vraies données ESPN · Cotes Vegas · Blessures · Confrontations</p>
          </div>

          {games.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
              <button className="pred-btn" onClick={predictAll} disabled={autoRunning} style={{
                padding: "14px 30px", borderRadius: 14, border: "none", cursor: autoRunning ? "wait" : "pointer",
                background: autoRunning ? "rgba(255,92,0,0.15)" : `linear-gradient(135deg,${C.orange},${C.gold})`,
                color: autoRunning ? C.orange : "#1a0800", fontWeight: 900, fontSize: 15,
                fontFamily: "inherit", transition: "all .2s", display: "flex", alignItems: "center", gap: 10,
                boxShadow: autoRunning ? "none" : "0 6px 28px rgba(255,92,0,0.4)",
              }}>
                {autoRunning ? (
                  <><div style={{ width: 16, height: 16, border: `2px solid ${C.orange}`, borderTopColor: "transparent", borderRadius: "50%", animation: "predSpin .6s linear infinite" }} /> Analyse en cours…</>
                ) : (
                  <>⚡ Tout prédire · {games.filter(g => !predictions[g.id]).length} matchs</>
                )}
              </button>
              {autoRunning && (
                <div style={{ width: "100%", height: 3, background: "rgba(255,92,0,0.15)", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ height: "100%", background: `linear-gradient(90deg,${C.orange},${C.gold})`, width: `${autoProgress}%`, transition: "width .4s ease" }} />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Stats pills */}
        <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
          {[
            { v: games.length, l: "matchs", c: C.blue, icon: "📅" },
            { v: Object.keys(predictions).filter(id => !predictions[id]?.error).length, l: "prédits", c: C.green, icon: "🤖" },
            { v: Object.values(predictions).filter(p => p?.confidence === "Élevée").length, l: "haute confiance", c: C.orange, icon: "🔥" },
          ].map(s => (
            <div key={s.l} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 20, background: `${s.c}12`, border: `1px solid ${s.c}30` }}>
              <span>{s.icon}</span>
              <span style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 20, color: s.c, letterSpacing: .5 }}>{s.v}</span>
              <span style={{ fontSize: 11, color: C.muted }}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── PICK DU JOUR ── */}
      {pickOfDay && predictions[pickOfDay.id] && !predictions[pickOfDay.id].error && (
        <div className="pick-card" style={{ marginBottom: 24, padding: "18px 22px", borderRadius: 18, background: "linear-gradient(135deg,rgba(245,200,66,0.1),rgba(255,92,0,0.08))", border: "1px solid rgba(245,200,66,0.35)", cursor: "pointer", transition: "transform .2s" }} onClick={() => setSelected(pickOfDay)}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <PickBadge />
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Logo url={pickOfDay.away.logo} size={32} />
                <span style={{ fontFamily: "'Permanent Marker',cursive", fontSize: 22, color: pickOfDay.away.color || C.text }}>{pickOfDay.away.abbr}</span>
                <span style={{ color: C.muted, fontSize: 12 }}>@</span>
                <span style={{ fontFamily: "'Permanent Marker',cursive", fontSize: 22, color: pickOfDay.home.color || C.text }}>{pickOfDay.home.abbr}</span>
                <Logo url={pickOfDay.home.logo} size={32} />
              </div>
              <div style={{ fontSize: 13, color: C.gold, fontWeight: 700 }}>→ {predictions[pickOfDay.id].winner} gagne · {Math.max(predictions[pickOfDay.id].homeWinPct, 100 - predictions[pickOfDay.id].homeWinPct)}% de confiance</div>
            </div>
            <span style={{ fontSize: 12, color: C.muted }}>Voir le pronostic →</span>
          </div>
        </div>
      )}

      {/* ── CONTENU ── */}
      {loading ? (
        <div style={{ display: "flex", alignItems: "center", gap: 14, color: C.muted, padding: "48px 0" }}>
          <div style={{ width: 28, height: 28, border: `2px solid ${C.border}`, borderTopColor: C.orange, borderRadius: "50%", animation: "predSpin .8s linear infinite" }} />
          Chargement des matchs NBA…
        </div>
      ) : error ? (
        <div style={{ textAlign: "center", padding: "60px 20px", border: `1px dashed ${C.border}`, borderRadius: 20, color: C.muted }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📡</div>
          <div style={{ fontSize: 16, color: C.text, marginBottom: 6 }}>Serveur NBA injoignable</div>
          <div style={{ fontSize: 13 }}>Vérifie que le serveur local tourne sur le port 3001</div>
        </div>
      ) : games.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", border: `1px dashed ${C.border}`, borderRadius: 20 }}>
          <div style={{ fontSize: 52, marginBottom: 14 }}>🏀</div>
          <div style={{ fontSize: 20, fontFamily: "'Permanent Marker',cursive", letterSpacing: 1, marginBottom: 8 }}>Aucun match programmé</div>
          <div style={{ fontSize: 13, color: C.muted }}>Reviens ce soir pour les pronostics de la prochaine soirée NBA !</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 22, alignItems: "start" }}>

          {/* ── LISTE ── */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2, color: C.muted, textTransform: "uppercase", marginBottom: 12, fontFamily: "monospace" }}>
              {games.length} match{games.length > 1 ? "s" : ""} · {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
            </div>
            {games.map(g => {
              const p = predictions[g.id];
              const isL = predLoading[g.id];
              const isSel = selected?.id === g.id;
              const isPick = pickOfDay?.id === g.id;
              const hw = p && !p.error ? Math.max(5, Math.min(95, p.homeWinPct)) : null;
              return (
                <div key={g.id} className="game-row" onClick={() => { setSelected(g); if (!p && !isL) predict(g); }} style={{
                  padding: "14px 16px", borderRadius: 14, marginBottom: 10, cursor: "pointer",
                  transition: "all .2s", position: "relative", overflow: "hidden",
                  background: isSel ? "rgba(255,92,0,0.09)" : C.surface,
                  border: `1px solid ${isSel ? "rgba(255,92,0,0.45)" : isPick ? "rgba(245,200,66,0.35)" : C.border}`,
                }}>
                  {/* Barre prob en fond */}
                  {hw && (
                    <div style={{ position: "absolute", inset: 0, display: "flex", pointerEvents: "none", opacity: .6 }}>
                      <div style={{ width: `${hw}%`, background: `${g.home.color || C.orange}18`, transition: "width 1s ease" }} />
                      <div style={{ flex: 1, background: `${g.away.color || C.blue}12` }} />
                    </div>
                  )}
                  <div style={{ position: "relative", zIndex: 1 }}>
                    {isPick && <div style={{ marginBottom: 6 }}><PickBadge /></div>}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: hw ? 10 : 4 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Logo url={g.away.logo} size={26} />
                        <div>
                          <div style={{ fontFamily: "'Permanent Marker',cursive", fontSize: 15, color: g.away.color || C.text, letterSpacing: .5 }}>{g.away.abbr}</div>
                          <div style={{ fontSize: 9, color: C.muted }}>{g.away.record}</div>
                        </div>
                        <span style={{ fontSize: 10, color: C.muted, margin: "0 2px" }}>@</span>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontFamily: "'Permanent Marker',cursive", fontSize: 15, color: g.home.color || C.text, letterSpacing: .5 }}>{g.home.abbr}</div>
                          <div style={{ fontSize: 9, color: C.muted }}>{g.home.record}</div>
                        </div>
                        <Logo url={g.home.logo} size={26} />
                      </div>
                      {isL && <div style={{ width: 13, height: 13, border: `2px solid ${C.border}`, borderTopColor: C.orange, borderRadius: "50%", animation: "predSpin .7s linear infinite" }} />}
                      {!isL && !p && <span style={{ fontSize: 10, color: C.muted, flexShrink: 0 }}>Analyser →</span>}
                    </div>

                    {hw ? (
                      <div>
                        <div style={{ height: 5, borderRadius: 3, overflow: "hidden", display: "flex", marginBottom: 5 }}>
                          <div style={{ width: `${hw}%`, background: g.home.color || C.orange, transition: "width 1.2s cubic-bezier(.4,0,.2,1)" }} />
                          <div style={{ flex: 1, background: g.away.color || C.blue }} />
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10 }}>
                          <span style={{ color: g.home.color || C.orange, fontWeight: 800 }}>{g.home.abbr} {hw}%</span>
                          <span style={{ color: p.confidence === "Élevée" ? C.green : p.confidence === "Moyenne" ? C.gold : C.muted, fontSize: 9, fontWeight: 700 }}>
                            {p.confidence === "Élevée" ? "🔥 SÛR" : p.confidence === "Moyenne" ? "⚡ PROBABLE" : "🎲"}
                          </span>
                          <span style={{ color: g.away.color || C.blue, fontWeight: 800 }}>{100 - hw}% {g.away.abbr}</span>
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: 10, color: g.status === "live" ? C.red : C.muted, display: "flex", alignItems: "center", gap: 5 }}>
                        {g.status === "live" && <span style={{ width: 5, height: 5, borderRadius: "50%", background: C.red, animation: "glowPulse 1.2s infinite", display: "inline-block" }} />}
                        {g.status === "live" ? "En direct" : g.status === "final" ? "Terminé" : "Cliquer pour prédire"}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── DETAIL ── */}
          {selected && (
            <div key={selected.id} style={{ animation: "floatUp .35s ease both" }}>

              {/* Banner cinématique */}
              <div style={{
                borderRadius: 22, overflow: "hidden", marginBottom: 20, position: "relative",
                background: `linear-gradient(135deg, ${selected.home.color || C.orange}25 0%, #06060f 35%, #06060f 65%, ${selected.away.color || C.blue}25 100%)`,
                border: `1px solid ${C.border}`, minHeight: 220,
              }}>
                {/* Glow orbs */}
                <div style={{ position: "absolute", width: 320, height: 320, borderRadius: "50%", background: `radial-gradient(circle, ${selected.home.color || C.orange}22 0%, transparent 70%)`, top: -120, left: -60, pointerEvents: "none" }} />
                <div style={{ position: "absolute", width: 320, height: 320, borderRadius: "50%", background: `radial-gradient(circle, ${selected.away.color || C.blue}22 0%, transparent 70%)`, top: -120, right: -60, pointerEvents: "none" }} />

                <div style={{ position: "relative", zIndex: 1, padding: "30px 36px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>

                    {/* Home */}
                    <div style={{ flex: 1, textAlign: "center" }}>
                      <Logo url={selected.home.logo} size={80} />
                      <div style={{ fontFamily: "'Permanent Marker',cursive", fontSize: 36, color: selected.home.color || C.text, letterSpacing: 2, marginTop: 10, textShadow: `0 0 40px ${selected.home.color || C.orange}70`, lineHeight: 1 }}>{selected.home.abbr}</div>
                      <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{selected.home.name}</div>
                      <div style={{ fontSize: 11, color: C.muted, fontFamily: "monospace", marginTop: 2 }}>{selected.home.record}</div>
                      {pred && !pred.error && (
                        <div style={{ fontFamily: "'Permanent Marker',cursive", fontSize: 42, color: selected.home.color || C.orange, marginTop: 10, letterSpacing: 1, textShadow: `0 0 20px ${selected.home.color || C.orange}60` }}>
                          {pred.projectedScore?.home}
                        </div>
                      )}
                    </div>

                    {/* Centre */}
                    <div style={{ textAlign: "center", flexShrink: 0, minWidth: 120 }}>
                      <div style={{ fontFamily: "'Permanent Marker',cursive", fontSize: 52, color: "rgba(255,255,255,0.08)", letterSpacing: 6, lineHeight: 1 }}>VS</div>
                      {selected.gameTime && <div style={{ marginTop: 10 }}><Countdown gameTime={selected.gameTime} /></div>}
                      {pred && !pred.error && <div style={{ fontSize: 10, color: C.muted, marginTop: 8, letterSpacing: 1 }}>SCORE PROJETÉ</div>}
                    </div>

                    {/* Away */}
                    <div style={{ flex: 1, textAlign: "center" }}>
                      <Logo url={selected.away.logo} size={80} />
                      <div style={{ fontFamily: "'Permanent Marker',cursive", fontSize: 36, color: selected.away.color || C.text, letterSpacing: 2, marginTop: 10, textShadow: `0 0 40px ${selected.away.color || C.blue}70`, lineHeight: 1 }}>{selected.away.abbr}</div>
                      <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{selected.away.name}</div>
                      <div style={{ fontSize: 11, color: C.muted, fontFamily: "monospace", marginTop: 2 }}>{selected.away.record}</div>
                      {pred && !pred.error && (
                        <div style={{ fontFamily: "'Permanent Marker',cursive", fontSize: 42, color: selected.away.color || C.blue, marginTop: 10, letterSpacing: 1, textShadow: `0 0 20px ${selected.away.color || C.blue}60` }}>
                          {pred.projectedScore?.away}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Barre de probabilité */}
                  {pred && !pred.error && (
                    <div style={{ marginTop: 22 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 7 }}>
                        <span style={{ color: selected.home.color || C.orange, fontWeight: 900 }}>{homePct}% {selected.home.abbr}</span>
                        <span style={{ fontSize: 10, color: C.muted, letterSpacing: 1 }}>PROBABILITÉ DE VICTOIRE</span>
                        <span style={{ color: selected.away.color || C.blue, fontWeight: 900 }}>{selected.away.abbr} {100 - homePct}%</span>
                      </div>
                      <div style={{ height: 12, borderRadius: 7, overflow: "hidden", display: "flex", boxShadow: "inset 0 2px 6px rgba(0,0,0,0.5)" }}>
                        <div style={{ width: `${homePct}%`, background: `linear-gradient(90deg,${selected.home.color || C.orange},${selected.home.color || C.orange}dd)`, transition: "width 1.4s cubic-bezier(.4,0,.2,1)", boxShadow: `4px 0 12px ${selected.home.color || C.orange}60` }} />
                        <div style={{ flex: 1, background: `linear-gradient(90deg,${selected.away.color || C.blue}cc,${selected.away.color || C.blue})` }} />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Bouton prédire */}
              {!pred && !isPredLoading && (
                <button className="pred-btn" onClick={() => predict(selected)} style={{
                  width: "100%", padding: "18px", borderRadius: 16, border: "none",
                  background: `linear-gradient(135deg,${C.orange},${C.gold})`,
                  color: "#1a0800", fontWeight: 900, fontSize: 17, cursor: "pointer",
                  fontFamily: "inherit", transition: "all .2s", marginBottom: 20,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
                  boxShadow: "0 8px 36px rgba(255,92,0,0.45)",
                }}>
                  ⚡ Lancer la Prédiction IA
                </button>
              )}

              {/* Loading */}
              {isPredLoading && (
                <div style={{ textAlign: "center", padding: "36px 20px", background: C.surface, borderRadius: 18, marginBottom: 20, border: `1px solid ${C.border}` }}>
                  <div style={{ width: 44, height: 44, border: `3px solid ${C.border}`, borderTopColor: C.orange, borderRadius: "50%", animation: "predSpin .8s linear infinite", margin: "0 auto 16px" }} />
                  <div style={{ fontSize: 15, color: C.text, fontWeight: 700, marginBottom: 4 }}>L'IA analyse le match…</div>
                  <div style={{ fontSize: 12, color: C.muted }}>Stats · Cotes Vegas · Blessures · Head-to-head · Forme récente</div>
                </div>
              )}

              {/* Résultat complet */}
              {pred && pred.error && (
                <div style={{ padding: 20, borderRadius: 14, background: "rgba(255,77,109,0.08)", border: "1px solid rgba(255,77,109,0.3)", color: C.red, marginBottom: 16, textAlign: "center" }}>
                  ❌ Prédiction indisponible pour ce match
                </div>
              )}

              {pred && !pred.error && (
                <div style={{ animation: "floatUp .5s ease both" }}>

                  {/* Vainqueur + confiance */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 16, padding: "18px 22px", background: `${winnerTeam?.color || C.orange}14`, border: `1px solid ${winnerTeam?.color || C.orange}35`, borderRadius: 18 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                      <Logo url={winnerTeam?.logo} size={50} />
                      <div>
                        <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 2 }}>Vainqueur prédit</div>
                        <div style={{ fontFamily: "'Permanent Marker',cursive", fontSize: 34, color: winnerTeam?.color || C.orange, letterSpacing: 1, lineHeight: 1 }}>{winnerTeam?.name}</div>
                      </div>
                    </div>
                    <ConfBadge conf={pred.confidence} />
                  </div>

                  {/* Verdict IA */}
                  <div style={{ background: "rgba(255,92,0,0.06)", border: `1px solid rgba(255,92,0,0.2)`, borderLeft: `4px solid ${C.orange}`, borderRadius: 14, padding: "18px 20px", marginBottom: 16 }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: C.orange, letterSpacing: 1.5, marginBottom: 8, textTransform: "uppercase", fontFamily: "monospace" }}>🔮 Analyse IA</div>
                    <p style={{ margin: 0, fontSize: 14, color: "#e8e8ff", lineHeight: 1.85 }}>{pred.verdict}</p>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                    {/* Facteurs clés */}
                    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "16px 18px" }}>
                      <div style={{ fontSize: 10, fontWeight: 800, color: C.blue, letterSpacing: 1.5, marginBottom: 12, textTransform: "uppercase", fontFamily: "monospace" }}>📊 Facteurs clés</div>
                      {(pred.keyFactors || []).map((f, i) => (
                        <div key={i} style={{ display: "flex", gap: 10, marginBottom: 10, fontSize: 13, color: "#dde", lineHeight: 1.6 }}>
                          <span style={{ color: C.orange, fontWeight: 900, flexShrink: 0, fontFamily: "monospace" }}>{i + 1}.</span>
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>

                    {/* X-Factor */}
                    <div style={{ background: `linear-gradient(135deg,rgba(245,200,66,0.09),${C.surface})`, border: `1px solid rgba(245,200,66,0.28)`, borderRadius: 14, padding: "16px 18px" }}>
                      <div style={{ fontSize: 10, fontWeight: 800, color: C.gold, letterSpacing: 1.5, marginBottom: 12, textTransform: "uppercase", fontFamily: "monospace" }}>⭐ X-Factor</div>
                      <div style={{ fontFamily: "'Permanent Marker',cursive", fontSize: 24, color: C.gold, marginBottom: 8, letterSpacing: 1 }}>{pred.xFactor?.player}</div>
                      <p style={{ margin: 0, fontSize: 13, color: "#dde", lineHeight: 1.6 }}>{pred.xFactor?.reason}</p>
                    </div>
                  </div>

                  <div style={{ fontSize: 10, color: C.muted, textAlign: "center", padding: "8px 0" }}>
                    ⚠️ Pronostic IA à but informatif — données ESPN en temps réel — Pariez responsable
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
