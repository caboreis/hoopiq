import { useState, useEffect, useRef } from "react";

const C = {
  bg: "#06060f", bg2: "#0d0d1f",
  surface: "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.07)",
  orange: "#ff5c00", gold: "#ffd700",
  green: "#22d37a", red: "#ff4d6d",
  blue: "#4fa3ff", purple: "#c084fc",
  text: "#f0f0ff", muted: "#6b6b88",
};

const TEAMS_INFO = {
  CHI: { name: "Chicago Bulls", color: "#CE1141", abbr: "CHI" },
  LAL: { name: "Los Angeles Lakers", color: "#552583", abbr: "LAL" },
  GSW: { name: "Golden State Warriors", color: "#1D428A", abbr: "GSW" },
  BOS: { name: "Boston Celtics", color: "#007A33", abbr: "BOS" },
  MIL: { name: "Milwaukee Bucks", color: "#00471B", abbr: "MIL" },
  DAL: { name: "Dallas Mavericks", color: "#00538C", abbr: "DAL" },
  DEN: { name: "Denver Nuggets", color: "#0E2240", abbr: "DEN" },
  PHX: { name: "Phoenix Suns", color: "#1D1160", abbr: "PHX" },
};

const INITIAL_GAMES = [
  {
    id: 1, status: "live", quarter: 3, clock: "4:23",
    home: { team: "CHI", score: 87, pts_q: [24, 18, 26, 0] },
    away: { team: "LAL", score: 82, pts_q: [22, 20, 22, 0] },
    momentum: "CHI",
    players: [
      { name: "Z. LaVine", team: "CHI", pts: 28, ast: 4, reb: 3, hot: true },
      { name: "C. White", team: "CHI", pts: 14, ast: 6, reb: 2, hot: false },
      { name: "LeBron James", team: "LAL", pts: 24, ast: 7, reb: 6, hot: true },
      { name: "A. Davis", team: "LAL", pts: 18, ast: 2, reb: 11, hot: false },
    ],
    prediction: 68,
    ai_comment: "LaVine EN FEU au 3ème quart ! Les Bulls contrôlent le rythme.",
  },
  {
    id: 2, status: "live", quarter: 2, clock: "1:45",
    home: { team: "GSW", score: 54, pts_q: [28, 21, 0, 0] },
    away: { team: "BOS", score: 58, pts_q: [30, 24, 0, 0] },
    momentum: "BOS",
    players: [
      { name: "S. Curry", team: "GSW", pts: 22, ast: 5, reb: 3, hot: true },
      { name: "J. Tatum", team: "BOS", pts: 26, ast: 4, reb: 7, hot: true },
      { name: "J. Brown", team: "BOS", pts: 18, ast: 2, reb: 4, hot: false },
    ],
    prediction: 45,
    ai_comment: "Tatum domine! Boston prend le contrôle avant la mi-temps.",
  },
  {
    id: 3, status: "upcoming", quarter: 0, clock: "20:00",
    home: { team: "MIL", score: 0, pts_q: [0, 0, 0, 0] },
    away: { team: "DAL", score: 0, pts_q: [0, 0, 0, 0] },
    momentum: null,
    players: [],
    prediction: 62,
    ai_comment: "Giannis vs Luka — le choc des titans ! Milwaukee favori à 62%.",
  },
  {
    id: 4, status: "final", quarter: 4, clock: "Final",
    home: { team: "DEN", score: 118, pts_q: [28, 32, 30, 28] },
    away: { team: "PHX", score: 112, pts_q: [26, 28, 28, 30] },
    momentum: null,
    players: [
      { name: "N. Jokić", team: "DEN", pts: 34, ast: 11, reb: 14, hot: true },
      { name: "K. Durant", team: "PHX", pts: 29, ast: 6, reb: 7, hot: false },
    ],
    prediction: 71,
    ai_comment: "Triple-double de Jokić ! Le Joker encore magique ce soir.",
  },
];

const AI_COMMENTS = [
  "LaVine explose ! +8 pts en 2 minutes 🔥",
  "LeBron répond avec un fadeaway clutch !",
  "Curry chauffe depuis le parking ! ☄️",
  "Tatum prend les commandes avec autorité",
  "Défense de fer côté Bulls ce soir 🛡️",
  "Run de 8-0 pour Chicago ! Timeout Lakers",
  "Momentum complètement renversé !",
  "Jokić distribue à 360° — génie pur 🎩",
  "Giannis impossible à stopper en transition",
  "Luka crée son propre shoot encore une fois",
];

function TeamScore({ teamId, score, pts_q, quarter, side }) {
  const team = TEAMS_INFO[teamId];
  return (
    <div style={{ textAlign: side === "away" ? "right" : "left", flex: 1 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexDirection: side === "away" ? "row-reverse" : "row" }}>
        <div style={{ width: 10, height: 36, background: team.color, borderRadius: 3, flexShrink: 0 }} />
        <div>
          <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 13, color: team.color, letterSpacing: 2 }}>{teamId}</div>
          <div style={{ fontSize: 11, color: C.muted, lineHeight: 1 }}>{team.name.split(" ").slice(-1)[0]}</div>
        </div>
      </div>
      <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 52, lineHeight: 1, marginTop: 4, color: "#fff" }}>{score}</div>
      <div style={{ display: "flex", gap: 3, marginTop: 4, flexDirection: side === "away" ? "row-reverse" : "row" }}>
        {pts_q.map((q, i) => (
          <div key={i} style={{ fontSize: 10, color: i < (quarter || 1) ? C.text : C.muted, background: i < (quarter || 1) ? "rgba(255,255,255,0.06)" : "transparent", padding: "2px 5px", borderRadius: 3, fontFamily: "monospace" }}>
            {q || "-"}
          </div>
        ))}
      </div>
    </div>
  );
}

function LiveBadge({ status, quarter, clock }) {
  if (status === "final") return <div style={{ padding: "4px 12px", background: "rgba(107,107,136,0.15)", borderRadius: 6, fontSize: 11, color: C.muted, fontWeight: 700 }}>FINAL</div>;
  if (status === "upcoming") return <div style={{ padding: "4px 12px", background: "rgba(79,163,255,0.1)", borderRadius: 6, fontSize: 11, color: C.blue, fontWeight: 700 }}>À VENIR</div>;
  return (
    <div style={{ display: "flex", flex: "column", alignItems: "center", gap: 4 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 12px", background: "rgba(255,77,109,0.15)", borderRadius: 6, border: "1px solid rgba(255,77,109,0.3)" }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.red, animation: "pulse 1s infinite" }} />
        <span style={{ fontSize: 11, color: C.red, fontWeight: 800 }}>LIVE</span>
      </div>
      <div style={{ fontSize: 12, color: C.text, fontWeight: 700, textAlign: "center" }}>Q{quarter} · {clock}</div>
    </div>
  );
}

function PredBar({ pct, homeTeam, awayTeam }) {
  const home = TEAMS_INFO[homeTeam];
  const away = TEAMS_INFO[awayTeam];
  return (
    <div style={{ margin: "10px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 5 }}>
        <span style={{ color: home.color, fontWeight: 700 }}>{pct}% {homeTeam}</span>
        <span style={{ color: C.muted, fontSize: 10 }}>Prédiction IA</span>
        <span style={{ color: away.color, fontWeight: 700 }}>{100 - pct}% {awayTeam}</span>
      </div>
      <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden", display: "flex" }}>
        <div style={{ width: `${pct}%`, background: home.color, transition: "width 1s ease" }} />
        <div style={{ flex: 1, background: away.color }} />
      </div>
    </div>
  );
}

export default function LiveCenter() {
  const [games, setGames] = useState(INITIAL_GAMES);
  const [selectedGame, setSelectedGame] = useState(INITIAL_GAMES[0]);
  const [aiMessages, setAiMessages] = useState([
    { id: 1, text: "🏀 HoopIQ Live Center activé ! Suivez tous les matchs NBA en temps réel.", time: "21:00", type: "system" },
    { id: 2, text: INITIAL_GAMES[0].ai_comment, time: "21:02", type: "analysis", game: "CHI vs LAL" },
    { id: 3, text: INITIAL_GAMES[1].ai_comment, time: "21:03", type: "analysis", game: "GSW vs BOS" },
  ]);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [ticker, setTicker] = useState(0);
  const feedRef = useRef(null);

  // Simulate live updates
  useEffect(() => {
    const interval = setInterval(() => {
      setGames(prev => prev.map(game => {
        if (game.status !== "live") return game;
        const homeAdd = Math.random() > 0.6 ? Math.floor(Math.random() * 3) + 1 : 0;
        const awayAdd = Math.random() > 0.6 ? Math.floor(Math.random() * 3) + 1 : 0;
        const secs = parseInt(game.clock.split(":")[1]) - 3;
        const mins = parseInt(game.clock.split(":")[0]);
        let newClock = `${mins}:${Math.max(0, secs).toString().padStart(2, "0")}`;
        if (secs <= 0 && mins > 0) newClock = `${mins - 1}:57`;

        const newHome = game.home.score + homeAdd;
        const newAway = game.away.score + awayAdd;
        const newPred = Math.max(20, Math.min(80, game.prediction + (newHome > newAway ? 1 : -1)));

        return {
          ...game,
          home: { ...game.home, score: newHome },
          away: { ...game.away, score: newAway },
          clock: newClock,
          prediction: newPred,
          momentum: newHome > newAway ? game.home.team : game.away.team,
        };
      }));
      setTicker(t => t + 1);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Random AI comments
  useEffect(() => {
    if (ticker > 0 && ticker % 3 === 0) {
      const comment = AI_COMMENTS[Math.floor(Math.random() * AI_COMMENTS.length)];
      const liveGame = games.find(g => g.status === "live");
      if (liveGame) {
        const newMsg = {
          id: Date.now(),
          text: comment,
          time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
          type: "alert",
          game: `${liveGame.home.team} vs ${liveGame.away.team}`,
        };
        setAiMessages(prev => [...prev.slice(-20), newMsg]);
        setTimeout(() => feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: "smooth" }), 100);
      }
    }
  }, [ticker]);

  // Sync selected game
  useEffect(() => {
    const updated = games.find(g => g.id === selectedGame.id);
    if (updated) setSelectedGame(updated);
  }, [games]);

  const askAI = async () => {
    if (!aiInput.trim() || aiLoading) return;
    const msg = aiInput.trim();
    setAiInput("");
    const userMsg = { id: Date.now(), text: msg, time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }), type: "user" };
    setAiMessages(prev => [...prev, userMsg]);
    setAiLoading(true);
    try {
      const liveInfo = games.filter(g => g.status === "live").map(g => `${g.home.team} ${g.home.score} - ${g.away.team} ${g.away.score} (Q${g.quarter} ${g.clock})`).join(", ");
      const res = await fetch("http://localhost:3001/api/anthropic", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001", max_tokens: 300,
          system: `Tu es HoopIQ Live Analyst, commentateur NBA en direct. Tu analyses les matchs en cours de façon passionnée et concise. Matchs live: ${liveInfo}. Réponds en 2-3 phrases max, en français, avec des emojis basketball.`,
          messages: [{ role: "user", content: msg }]
        })
      });
      const data = await res.json();
      const reply = data.content?.map(b => b.text || "").join("") || "Analyse indisponible.";
      setAiMessages(prev => [...prev, { id: Date.now() + 1, text: reply, time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }), type: "analysis" }]);
    } catch {
      setAiMessages(prev => [...prev, { id: Date.now() + 1, text: "❌ Erreur connexion IA.", time: "--:--", type: "system" }]);
    }
    setAiLoading(false);
    setTimeout(() => feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: "smooth" }), 100);
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;600;700;900&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: ${C.orange}; border-radius: 4px; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes slideIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .game-card:hover { border-color: rgba(255,92,0,0.4) !important; transform: translateY(-2px); }
        .player-row:hover { background: rgba(255,92,0,0.05) !important; }
      `}</style>

      {/* Header */}
      <div style={{ background: "rgba(6,6,15,0.95)", backdropFilter: "blur(20px)", borderBottom: `1px solid ${C.border}`, padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.red, animation: "pulse 1s infinite" }} />
          <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 20, background: `linear-gradient(135deg,${C.orange},${C.gold})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: 3 }}>HOOP IQ · LIVE CENTER</div>
        </div>
        <div style={{ display: "flex", gap: 16, fontSize: 12, color: C.muted }}>
          <span style={{ color: C.red }}>🔴 {games.filter(g => g.status === "live").length} matchs live</span>
          <span>{games.filter(g => g.status === "upcoming").length} à venir</span>
          <span>{games.filter(g => g.status === "final").length} terminés</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "340px 1fr 300px", gap: 0, height: "calc(100vh - 60px)" }}>

        {/* LEFT — Game list */}
        <div style={{ background: C.bg2, borderRight: `1px solid ${C.border}`, overflowY: "auto", padding: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2, color: C.muted, textTransform: "uppercase", marginBottom: 14, fontFamily: "monospace" }}>Matchs du soir</div>
          {games.map(game => {
            const home = TEAMS_INFO[game.home.team];
            const away = TEAMS_INFO[game.away.team];
            const isSelected = selectedGame.id === game.id;
            return (
              <div key={game.id} className="game-card" onClick={() => setSelectedGame(game)} style={{
                background: isSelected ? "rgba(255,92,0,0.07)" : C.surface,
                border: `1px solid ${isSelected ? "rgba(255,92,0,0.35)" : C.border}`,
                borderRadius: 14, padding: "14px 16px", marginBottom: 10, cursor: "pointer", transition: "all .2s",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <LiveBadge status={game.status} quarter={game.quarter} clock={game.clock} />
                  {game.momentum && <span style={{ fontSize: 10, color: TEAMS_INFO[game.momentum].color, fontWeight: 800 }}>↑ {game.momentum}</span>}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 6, height: 24, background: home.color, borderRadius: 2 }} />
                    <div>
                      <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 14, color: home.color }}>{game.home.team}</div>
                      <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 26, lineHeight: 1 }}>{game.home.score}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: C.muted }}>vs</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexDirection: "row-reverse" }}>
                    <div style={{ width: 6, height: 24, background: away.color, borderRadius: 2 }} />
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 14, color: away.color }}>{game.away.team}</div>
                      <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 26, lineHeight: 1 }}>{game.away.score}</div>
                    </div>
                  </div>
                </div>
                <PredBar pct={game.prediction} homeTeam={game.home.team} awayTeam={game.away.team} />
              </div>
            );
          })}
        </div>

        {/* CENTER — Match detail */}
        <div style={{ overflowY: "auto", padding: 24 }}>
          {selectedGame && (
            <div style={{ animation: "fadeUp .3s ease" }} key={selectedGame.id}>
              {/* Big scoreboard */}
              <div style={{ background: `linear-gradient(160deg, ${TEAMS_INFO[selectedGame.home.team].color}15, rgba(0,0,0,0.5), ${TEAMS_INFO[selectedGame.away.team].color}15)`, border: `1px solid rgba(255,255,255,0.08)`, borderRadius: 20, padding: "28px 32px", marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <TeamScore teamId={selectedGame.home.team} score={selectedGame.home.score} pts_q={selectedGame.home.pts_q} quarter={selectedGame.quarter} side="home" />
                  <div style={{ textAlign: "center", padding: "0 24px" }}>
                    <LiveBadge status={selectedGame.status} quarter={selectedGame.quarter} clock={selectedGame.clock} />
                    {selectedGame.status === "live" && (
                      <div style={{ marginTop: 12, fontSize: 11, color: C.muted }}>
                        Momentum → <span style={{ color: TEAMS_INFO[selectedGame.momentum]?.color, fontWeight: 800 }}>{selectedGame.momentum}</span>
                      </div>
                    )}
                  </div>
                  <TeamScore teamId={selectedGame.away.team} score={selectedGame.away.score} pts_q={selectedGame.away.pts_q} quarter={selectedGame.quarter} side="away" />
                </div>
                <div style={{ marginTop: 16 }}>
                  <PredBar pct={selectedGame.prediction} homeTeam={selectedGame.home.team} awayTeam={selectedGame.away.team} />
                </div>
              </div>

              {/* AI Comment */}
              <div style={{ background: "rgba(255,92,0,0.07)", border: `1px solid rgba(255,92,0,0.2)`, borderRadius: 14, padding: "14px 18px", marginBottom: 20, borderLeft: `3px solid ${C.orange}` }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: C.orange, fontFamily: "monospace", letterSpacing: 1.5 }}>🤖 IA LIVE</span>
                </div>
                <p style={{ fontSize: 14, color: "#dde", lineHeight: 1.6, margin: 0 }}>{selectedGame.ai_comment}</p>
              </div>

              {/* Players */}
              {selectedGame.players.length > 0 && (
                <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2, color: C.orange, textTransform: "uppercase", marginBottom: 16, fontFamily: "monospace" }}>⚡ Performances live</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    {selectedGame.players.map((p, i) => {
                      const teamColor = TEAMS_INFO[p.team]?.color || C.orange;
                      return (
                        <div key={i} className="player-row" style={{ padding: "12px 14px", background: "rgba(255,255,255,0.03)", borderRadius: 10, border: `1px solid ${C.border}`, transition: "background .15s" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 14 }}>{p.name} {p.hot ? "🔥" : ""}</div>
                              <div style={{ fontSize: 11, color: teamColor, fontWeight: 700 }}>{p.team}</div>
                            </div>
                            <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 28, color: teamColor }}>{p.pts}</div>
                          </div>
                          <div style={{ display: "flex", gap: 10 }}>
                            {[{ l: "AST", v: p.ast }, { l: "REB", v: p.reb }].map(s => (
                              <div key={s.l} style={{ fontSize: 12, color: C.muted }}><strong style={{ color: C.text }}>{s.v}</strong> {s.l}</div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT — AI Feed */}
        <div style={{ background: C.bg2, borderLeft: `1px solid ${C.border}`, display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "14px 16px", borderBottom: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2, color: C.orange, textTransform: "uppercase", fontFamily: "monospace" }}>🤖 Fil IA Live</div>
          </div>

          <div ref={feedRef} style={{ flex: 1, overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
            {aiMessages.map(msg => (
              <div key={msg.id} style={{ animation: "slideIn .3s ease", padding: "10px 12px", borderRadius: 10, background: msg.type === "user" ? "rgba(255,92,0,0.12)" : msg.type === "alert" ? "rgba(255,77,109,0.08)" : msg.type === "system" ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.04)", border: `1px solid ${msg.type === "user" ? "rgba(255,92,0,0.3)" : msg.type === "alert" ? "rgba(255,77,109,0.2)" : C.border}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 9, fontWeight: 800, color: msg.type === "user" ? C.orange : msg.type === "alert" ? C.red : C.muted, textTransform: "uppercase", letterSpacing: 1 }}>
                    {msg.type === "user" ? "Vous" : msg.type === "alert" ? "⚡ ALERTE" : msg.type === "system" ? "SYSTÈME" : "🤖 IA"}
                  </span>
                  <span style={{ fontSize: 9, color: C.muted }}>{msg.time}</span>
                </div>
                {msg.game && <div style={{ fontSize: 9, color: C.muted, marginBottom: 3 }}>Match: {msg.game}</div>}
                <div style={{ fontSize: 12, color: "#dde", lineHeight: 1.6 }}>{msg.text}</div>
              </div>
            ))}
            {aiLoading && <div style={{ padding: "10px 12px", borderRadius: 10, background: C.surface, border: `1px solid ${C.border}`, color: C.orange, fontSize: 18, letterSpacing: 4 }}>• • •</div>}
          </div>

          <div style={{ padding: "12px 14px", borderTop: `1px solid ${C.border}` }}>
            <div style={{ display: "flex", gap: 8 }}>
              <input value={aiInput} onChange={e => setAiInput(e.target.value)} onKeyDown={e => e.key === "Enter" && askAI()}
                placeholder="Analyse ce match..."
                style={{ flex: 1, padding: "9px 12px", borderRadius: 8, background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`, color: C.text, fontSize: 12, outline: "none", fontFamily: "inherit" }} />
              <button onClick={askAI} disabled={aiLoading} style={{ padding: "9px 14px", borderRadius: 8, border: "none", background: `linear-gradient(135deg,${C.orange},${C.gold.replace("ffd700","ff8c42")})`, color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>→</button>
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
              {["Qui performe ?", "Prédis la suite", "Stats Bulls ?"].map(s => (
                <button key={s} onClick={() => setAiInput(s)} style={{ padding: "3px 8px", borderRadius: 10, border: `1px solid rgba(255,92,0,0.25)`, background: "rgba(255,92,0,0.05)", color: C.orange, fontSize: 10, cursor: "pointer", fontFamily: "inherit" }}>{s}</button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
