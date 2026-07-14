import { useState, useEffect } from "react";

const C = {
  bg: "#06060f", bg2: "#0d0d1f",
  surface: "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.07)",
  orange: "#ff5c00", gold: "#ffd700",
  green: "#22d37a", red: "#C8102E",
  blue: "#4fa3ff", text: "#f0f0ff", muted: "#6b6b88",
};

const ESPN_NFL = "https://site.api.espn.com/apis/site/v2/sports/football/nfl";

/* ── 32 équipes NFL ── */
const NFL_TEAMS = [
  { id: 22, abbr: "ARI", name: "Arizona Cardinals",       color: "#97233F" },
  { id: 1,  abbr: "ATL", name: "Atlanta Falcons",         color: "#A71930" },
  { id: 33, abbr: "BAL", name: "Baltimore Ravens",        color: "#241773" },
  { id: 2,  abbr: "BUF", name: "Buffalo Bills",           color: "#00338D" },
  { id: 29, abbr: "CAR", name: "Carolina Panthers",       color: "#0085CA" },
  { id: 3,  abbr: "CHI", name: "Chicago Bears",           color: "#0B162A" },
  { id: 4,  abbr: "CIN", name: "Cincinnati Bengals",      color: "#FB4F14" },
  { id: 5,  abbr: "CLE", name: "Cleveland Browns",        color: "#311D00" },
  { id: 6,  abbr: "DAL", name: "Dallas Cowboys",          color: "#003594" },
  { id: 7,  abbr: "DEN", name: "Denver Broncos",          color: "#FB4F14" },
  { id: 8,  abbr: "DET", name: "Detroit Lions",           color: "#0076B6" },
  { id: 9,  abbr: "GB",  name: "Green Bay Packers",       color: "#203731" },
  { id: 34, abbr: "HOU", name: "Houston Texans",          color: "#03202F" },
  { id: 11, abbr: "IND", name: "Indianapolis Colts",      color: "#002C5F" },
  { id: 30, abbr: "JAX", name: "Jacksonville Jaguars",    color: "#006778" },
  { id: 12, abbr: "KC",  name: "Kansas City Chiefs",      color: "#E31837" },
  { id: 13, abbr: "LAC", name: "Los Angeles Chargers",    color: "#0080C6" },
  { id: 14, abbr: "LAR", name: "Los Angeles Rams",        color: "#003594" },
  { id: 24, abbr: "LV",  name: "Las Vegas Raiders",       color: "#000000" },
  { id: 15, abbr: "MIA", name: "Miami Dolphins",          color: "#008E97" },
  { id: 16, abbr: "MIN", name: "Minnesota Vikings",       color: "#4F2683" },
  { id: 17, abbr: "NE",  name: "New England Patriots",    color: "#002244" },
  { id: 18, abbr: "NO",  name: "New Orleans Saints",      color: "#D3BC8D" },
  { id: 19, abbr: "NYG", name: "New York Giants",         color: "#0B2265" },
  { id: 20, abbr: "NYJ", name: "New York Jets",           color: "#125740" },
  { id: 21, abbr: "PHI", name: "Philadelphia Eagles",     color: "#004C54" },
  { id: 23, abbr: "PIT", name: "Pittsburgh Steelers",     color: "#FFB612" },
  { id: 26, abbr: "SEA", name: "Seattle Seahawks",        color: "#002244" },
  { id: 25, abbr: "SF",  name: "San Francisco 49ers",     color: "#AA0000" },
  { id: 27, abbr: "TB",  name: "Tampa Bay Buccaneers",    color: "#D50A0A" },
  { id: 10, abbr: "TEN", name: "Tennessee Titans",        color: "#0C2340" },
  { id: 28, abbr: "WAS", name: "Washington Commanders",   color: "#5A1414" },
];

/* ── Stars NFL avec ESPN IDs ── */
const NFL_STARS = [
  {
    id: 1, espnId: 3139477, name: "Patrick Mahomes", pos: "QB",
    team: "Kansas City Chiefs", teamColor: "#E31837",
    tds: 26, yards: 3928, sacks: 0, rating: 99, trend: +4, hot: true,
    stat1Label: "TDs lancés", stat2Label: "Yards pass.", stat3Label: "Rating",
    stat1: 26, stat2: 3928, stat3: 99,
  },
  {
    id: 2, espnId: 3916387, name: "Lamar Jackson", pos: "QB",
    team: "Baltimore Ravens", teamColor: "#241773",
    tds: 24, yards: 3200, sacks: 0, rating: 97, trend: +3, hot: true,
    stat1Label: "TDs total", stat2Label: "Yards rush.", stat3Label: "Rating",
    stat1: 24, stat2: 821, stat3: 97,
  },
  {
    id: 3, espnId: 4361579, name: "Justin Jefferson", pos: "WR",
    team: "Minnesota Vikings", teamColor: "#4F2683",
    tds: 7, yards: 1074, sacks: 0, rating: 96, trend: +2, hot: true,
    stat1Label: "TDs reçus", stat2Label: "Yards récep.", stat3Label: "Récep.",
    stat1: 7, stat2: 1074, stat3: 68,
  },
  {
    id: 4, espnId: 4241389, name: "CeeDee Lamb", pos: "WR",
    team: "Dallas Cowboys", teamColor: "#003594",
    tds: 9, yards: 1194, sacks: 0, rating: 95, trend: +1, hot: false,
    stat1Label: "TDs reçus", stat2Label: "Yards récep.", stat3Label: "Récep.",
    stat1: 9, stat2: 1194, stat3: 79,
  },
  {
    id: 5, espnId: 4360310, name: "Micah Parsons", pos: "LB",
    team: "Dallas Cowboys", teamColor: "#003594",
    tds: 0, yards: 0, sacks: 13, rating: 98, trend: +5, hot: true,
    stat1Label: "Sacks", stat2Label: "TFL", stat3Label: "Pressures",
    stat1: 13, stat2: 18, stat3: 47,
  },
];

/* ── Composants UI ── */
function Badge({ children, color = C.orange }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 800, padding: "2px 9px", borderRadius: 20,
      background: `${color}22`, color, border: `1px solid ${color}44`,
      letterSpacing: 1.2, textTransform: "uppercase", fontFamily: "monospace",
    }}>{children}</span>
  );
}

function Ring({ score, size = 64, color = C.orange }) {
  const r = size / 2 - 6, c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={5} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={5}
        strokeDasharray={c} strokeDashoffset={c * (1 - score / 100)} strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 1.3s cubic-bezier(.4,0,.2,1)" }} />
      <text x={size / 2} y={size / 2 + 5} textAnchor="middle" fill="#fff"
        fontSize={size * 0.22} fontWeight={800} fontFamily="'Permanent Marker', cursive"
        style={{ transform: `rotate(90deg)`, transformOrigin: `${size / 2}px ${size / 2}px` }}>{score}</text>
    </svg>
  );
}

function PlayerPhoto({ espnId, name, size = 72, color = C.red }) {
  const [err, setErr] = useState(false);
  const url = `https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/${espnId}.png&w=200&h=146`;
  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0, overflow: "hidden",
      background: err ? `${color}30` : "#111",
      border: `2px solid ${color}60`,
      boxShadow: `0 0 20px ${color}40`,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      {!err
        ? <img src={url} alt={name} onError={() => setErr(true)} style={{ width: "130%", height: "130%", objectFit: "cover", objectPosition: "top center", marginTop: -8 }} />
        : <span style={{ fontFamily: "'Permanent Marker', cursive", fontSize: size * 0.32, color, letterSpacing: 1 }}>{initials}</span>
      }
    </div>
  );
}

function NFLGameCard({ game, onClick, selected }) {
  const isLive = game.status === "live";
  const isFinal = game.status === "final";
  return (
    <div onClick={onClick} style={{
      padding: "14px 16px", borderRadius: 14, cursor: "pointer", transition: "all .2s",
      background: selected ? "rgba(200,16,46,0.08)" : "rgba(255,255,255,0.03)",
      border: `1px solid ${selected ? "rgba(200,16,46,0.4)" : isLive ? "rgba(200,16,46,0.3)" : C.border}`,
      borderLeft: `3px solid ${isLive ? C.red : isFinal ? C.green : C.muted}`,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1.5, color: isLive ? C.red : isFinal ? C.green : C.muted, textTransform: "uppercase" }}>
          {isLive ? "🔴 LIVE" : isFinal ? "✓ FINAL" : "🕐 À VENIR"}
        </span>
        {game.quarter > 0 && <span style={{ fontSize: 10, color: C.muted, fontFamily: "monospace" }}>Q{game.quarter} {game.clock}</span>}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 8 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 12, color: C.text }}>{game.home.abbr}</div>
          <div style={{ fontSize: 10, color: C.muted }}>{game.home.record}</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "'Permanent Marker', cursive", fontSize: 22, letterSpacing: 2, lineHeight: 1 }}>
            <span style={{ color: C.text }}>{game.home.score}</span>
            <span style={{ color: C.muted, fontSize: 14, margin: "0 4px" }}>–</span>
            <span style={{ color: C.text }}>{game.away.score}</span>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontWeight: 700, fontSize: 12, color: C.text }}>{game.away.abbr}</div>
          <div style={{ fontSize: 10, color: C.muted }}>{game.away.record}</div>
        </div>
      </div>
    </div>
  );
}

/* ── Page principale NFL ── */
export default function NFL() {
  const [view, setView] = useState("players"); // players | teams | live
  const [games, setGames] = useState([]);
  const [gamesLoading, setGamesLoading] = useState(true);
  const [selectedStar, setSelectedStar] = useState(NFL_STARS[0]);
  const [selectedGame, setSelectedGame] = useState(null);
  const [teamFilter, setTeamFilter] = useState(null);
  const [confFilter, setConfFilter] = useState("all"); // all | AFC | NFC

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const r = await fetch(`${ESPN_NFL}/scoreboard`);
        const d = await r.json();
        if (!active) return;
        const list = (d.events || []).map(ev => {
          const comp = ev.competitions?.[0] || {};
          const competitors = comp.competitors || [];
          const home = competitors.find(c => c.homeAway === "home") || competitors[0] || {};
          const away = competitors.find(c => c.homeAway === "away") || competitors[1] || {};
          const stateId = ev.status?.type?.id;
          const status = stateId === "2" ? "live" : stateId === "3" ? "final" : "upcoming";
          const mapTeam = c => ({
            abbr: c.team?.abbreviation || "?",
            name: c.team?.displayName || "",
            logo: c.team?.logo || "",
            color: "#" + (c.team?.color || "C8102E"),
            score: status === "upcoming" ? "—" : (c.score || "0"),
            record: c.records?.[0]?.summary || "",
          });
          return {
            id: ev.id,
            status, quarter: ev.status?.period || 0,
            clock: ev.status?.displayClock || "",
            home: mapTeam(home), away: mapTeam(away),
            date: ev.date || "",
            venue: comp.venue?.fullName || "",
          };
        });
        setGames(list);
        if (list.length) setSelectedGame(list.find(g => g.status === "live") || list[0]);
      } catch { /* ESPN indisponible */ }
      finally { if (active) setGamesLoading(false); }
    };
    load();
    const interval = setInterval(load, 30000);
    return () => { active = false; clearInterval(interval); };
  }, []);

  const liveCount = games.filter(g => g.status === "live").length;

  const AFC_ABBRS = ["BAL","BUF","KC","MIA","CIN","CLE","HOU","IND","JAX","TEN","DEN","LAC","LV","NE","NYJ","PIT"];
  const filteredTeams = NFL_TEAMS.filter(t => {
    if (confFilter === "AFC") return AFC_ABBRS.includes(t.abbr);
    if (confFilter === "NFC") return !AFC_ABBRS.includes(t.abbr);
    return true;
  });

  return (
    <div className="fade-in">
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes nflGlow { 0%,100%{box-shadow:0 0 0 0 rgba(200,16,46,0.4)} 50%{box-shadow:0 0 0 8px rgba(200,16,46,0)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .nfl-card:hover { border-color: rgba(200,16,46,0.4) !important; transform: translateY(-2px); }
        .nfl-team-card:hover { background: rgba(255,255,255,0.06) !important; transform: translateY(-1px); }
        .nfl-star-row:hover { background: rgba(200,16,46,0.06) !important; }
      `}</style>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 8, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "'Permanent Marker', cursive", fontSize: 52, letterSpacing: 3, lineHeight: 1, margin: 0 }}>
            <span style={{ color: C.text }}>NFL</span>{" "}
            <span style={{ background: "linear-gradient(135deg,#C8102E,#FFB612)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>ZONE</span>
          </h1>
          <p style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>Stats · Scores · Analyse IA · Powered by ESPN</p>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {liveCount > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 20, background: "rgba(200,16,46,0.1)", border: "1px solid rgba(200,16,46,0.35)", animation: "nflGlow 2s infinite" }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: C.red, animation: "pulse 1.2s infinite", display: "inline-block" }} />
              <span style={{ fontSize: 11, fontWeight: 800, color: C.red }}>{liveCount} LIVE</span>
            </div>
          )}
          {["players", "teams", "live"].map(v => (
            <button key={v} onClick={() => setView(v)} style={{
              padding: "7px 16px", borderRadius: 20, fontSize: 12, fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit", transition: "all .2s",
              background: view === v ? "rgba(200,16,46,0.15)" : "transparent",
              border: `1px solid ${view === v ? "rgba(200,16,46,0.45)" : C.border}`,
              color: view === v ? C.red : C.muted,
            }}>
              {v === "players" ? "🏈 Stars" : v === "teams" ? "🛡 Équipes" : `📺 Live${liveCount > 0 ? ` (${liveCount})` : ""}`}
            </button>
          ))}
        </div>
      </div>

      {/* ── KPI Bar ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 28 }}>
        {[
          { icon: "🏈", label: "Équipes NFL",    val: "32",    color: C.red },
          { icon: "📺", label: "Matchs live",    val: liveCount || "0", color: "#FFB612" },
          { icon: "🎯", label: "Stars suivies",  val: "5",     color: C.green },
          { icon: "⚡", label: "Saison en cours", val: "2025", color: C.blue },
        ].map(k => (
          <div key={k.label} style={{
            background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14,
            padding: "14px 18px", position: "relative", overflow: "hidden",
          }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: k.color, opacity: 0.8 }} />
            <div style={{ fontSize: 20, marginBottom: 4 }}>{k.icon}</div>
            <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 30, color: k.color, lineHeight: 1 }}>{k.val}</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* ── VIEW: STARS ── */}
      {view === "players" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          {/* Liste */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {NFL_STARS.map(star => (
              <div key={star.id} className="nfl-star-row" onClick={() => setSelectedStar(star)} style={{
                padding: "18px 20px", borderRadius: 16, cursor: "pointer", transition: "all .2s",
                background: selectedStar?.id === star.id ? "rgba(200,16,46,0.07)" : C.surface,
                border: `1px solid ${selectedStar?.id === star.id ? "rgba(200,16,46,0.45)" : C.border}`,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <PlayerPhoto espnId={star.espnId} name={star.name} size={56} color={star.teamColor} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontWeight: 800, fontSize: 15 }}>{star.name}</span>
                      {star.hot && <span style={{ fontSize: 12 }}>🔥</span>}
                    </div>
                    <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>
                      <span style={{ color: star.teamColor, fontWeight: 700 }}>{star.pos}</span>{" · "}{star.team}
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <Badge color={C.red}>{star.stat1} {star.stat1Label.split(" ")[0]}</Badge>
                      <Badge color="#FFB612">{star.stat2} {star.stat2Label.split(" ")[0]}</Badge>
                      {star.sacks > 0 && <Badge color={C.green}>{star.sacks} sacks</Badge>}
                    </div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <Ring score={star.rating} size={58} color={star.teamColor} />
                    <div style={{ fontSize: 11, fontWeight: 700, color: star.trend >= 0 ? C.green : C.red, marginTop: 2 }}>
                      {star.trend >= 0 ? "▲" : "▼"} {Math.abs(star.trend)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Panneau détail */}
          {selectedStar && (
            <div style={{ position: "sticky", top: 80, alignSelf: "start", display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Hero card */}
              <div style={{
                background: `linear-gradient(145deg, ${selectedStar.teamColor}20, rgba(0,0,0,0.6))`,
                border: `1px solid ${selectedStar.teamColor}50`,
                borderRadius: 20, padding: "28px 24px",
                boxShadow: `0 0 40px ${selectedStar.teamColor}15`,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 24 }}>
                  <PlayerPhoto espnId={selectedStar.espnId} name={selectedStar.name} size={84} color={selectedStar.teamColor} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "'Permanent Marker', cursive", fontSize: 32, letterSpacing: 2, lineHeight: 1.1 }}>
                      {selectedStar.name}
                    </div>
                    <div style={{ fontSize: 13, color: C.muted, marginTop: 3 }}>
                      <span style={{ color: selectedStar.teamColor, fontWeight: 800 }}>{selectedStar.pos}</span>
                      {" · "}{selectedStar.team}
                    </div>
                    <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                      <Badge color={selectedStar.teamColor}>{selectedStar.pos}</Badge>
                      {selectedStar.hot && <Badge color="#FFB612">🔥 En forme</Badge>}
                    </div>
                  </div>
                  <Ring score={selectedStar.rating} size={72} color={selectedStar.teamColor} />
                </div>

                {/* Stats grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
                  {[
                    { label: selectedStar.stat1Label, val: selectedStar.stat1, color: C.red },
                    { label: selectedStar.stat2Label, val: selectedStar.stat2, color: "#FFB612" },
                    { label: selectedStar.stat3Label, val: selectedStar.stat3, color: C.green },
                  ].map(s => (
                    <div key={s.label} style={{
                      background: "rgba(0,0,0,0.3)", borderRadius: 12, padding: "12px 14px", textAlign: "center",
                      border: `1px solid ${s.color}30`,
                    }}>
                      <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 28, color: s.color, lineHeight: 1 }}>{s.val}</div>
                      <div style={{ fontSize: 10, color: C.muted, marginTop: 3 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tendance */}
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: "18px 20px" }}>
                <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.5, color: C.muted, textTransform: "uppercase", marginBottom: 14 }}>Tendance saison</div>
                {[
                  { label: selectedStar.stat1Label, v: selectedStar.stat1, max: selectedStar.pos === "QB" ? 40 : selectedStar.pos === "LB" ? 20 : 12, c: C.red },
                  { label: selectedStar.stat2Label, v: Math.min(selectedStar.stat2, 1500), max: 1500, c: "#FFB612" },
                  { label: selectedStar.stat3Label, v: selectedStar.stat3, max: 100, c: C.green },
                ].map(s => (
                  <div key={s.label} style={{ marginBottom: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5 }}>
                      <span style={{ color: C.muted }}>{s.label}</span>
                      <strong style={{ color: s.c }}>{s.v}</strong>
                    </div>
                    <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 4, height: 5, overflow: "hidden" }}>
                      <div style={{ width: `${Math.min(100, (s.v / s.max) * 100)}%`, height: "100%", background: s.c, borderRadius: 4, transition: "width 1s ease" }} />
                    </div>
                  </div>
                ))}
                <div style={{ marginTop: 16, padding: "10px 14px", background: "rgba(200,16,46,0.06)", borderRadius: 10, border: "1px solid rgba(200,16,46,0.2)", fontSize: 12, color: C.muted }}>
                  📊 Données ESPN saison 2024-25 · Score HoopIQ : <strong style={{ color: C.red }}>{selectedStar.rating}/100</strong>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── VIEW: ÉQUIPES ── */}
      {view === "teams" && (
        <div>
          {/* Filtres conférence */}
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            {[["all","Toutes (32)"],["AFC","AFC (16)"],["NFC","NFC (16)"]].map(([id, label]) => (
              <button key={id} onClick={() => setConfFilter(id)} style={{
                padding: "7px 16px", borderRadius: 20, fontSize: 12, fontWeight: 700,
                cursor: "pointer", fontFamily: "inherit", transition: "all .2s",
                background: confFilter === id ? "rgba(200,16,46,0.15)" : "transparent",
                border: `1px solid ${confFilter === id ? "rgba(200,16,46,0.45)" : C.border}`,
                color: confFilter === id ? C.red : C.muted,
              }}>{label}</button>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
            {filteredTeams.map(team => (
              <div key={team.id} className="nfl-team-card"
                onClick={() => setTeamFilter(prev => prev === team.abbr ? null : team.abbr)}
                style={{
                  background: teamFilter === team.abbr ? `${team.color}12` : C.surface,
                  border: `1px solid ${teamFilter === team.abbr ? `${team.color}80` : C.border}`,
                  borderRadius: 14, padding: "16px 18px", cursor: "pointer", transition: "all .2s",
                  borderLeft: `3px solid ${team.color}`,
                }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: "50%",
                    background: `${team.color}25`, border: `1px solid ${team.color}50`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: "'Permanent Marker', cursive", fontSize: 11, color: team.color, fontWeight: 800,
                  }}>{team.abbr}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 12, color: C.text }}>{team.abbr}</div>
                    <div style={{ fontSize: 10, color: C.muted }}>{AFC_ABBRS.includes(team.abbr) ? "AFC" : "NFC"}</div>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.4 }}>{team.name}</div>
              </div>
            ))}
          </div>

          {/* Panneau équipe sélectionnée — cherche son match du jour */}
          {teamFilter && (() => {
            const team = NFL_TEAMS.find(t => t.abbr === teamFilter);
            const teamGame = games.find(g => g.home.abbr === teamFilter || g.away.abbr === teamFilter);
            return (
              <div style={{
                marginTop: 20, padding: "16px 20px", borderRadius: 14,
                background: `${team?.color || C.red}0d`, border: `1px solid ${team?.color || C.red}33`,
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap",
              }}>
                <div style={{ fontSize: 13, color: C.text }}>
                  {teamGame
                    ? <>🏈 <strong>{team?.name}</strong> joue aujourd'hui : {teamGame.away.abbr} @ {teamGame.home.abbr} ({teamGame.status === "live" ? "🔴 en direct" : teamGame.status === "final" ? "terminé" : "à venir"})</>
                    : <>Aucun match aujourd'hui pour <strong>{team?.name}</strong>.</>
                  }
                </div>
                {teamGame && (
                  <button onClick={() => { setSelectedGame(teamGame); setView("live"); }} style={{
                    padding: "7px 16px", borderRadius: 20, fontSize: 12, fontWeight: 700,
                    cursor: "pointer", fontFamily: "inherit", background: "rgba(200,16,46,0.15)",
                    border: "1px solid rgba(200,16,46,0.45)", color: C.red,
                  }}>Voir le match →</button>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* ── VIEW: LIVE ── */}
      {view === "live" && (
        <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 20 }}>
          {/* Liste matchs */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2, color: C.muted, textTransform: "uppercase", marginBottom: 12 }}>
              Matchs NFL du jour
            </div>
            {gamesLoading ? (
              <div style={{ color: C.muted, fontSize: 13, padding: 20, textAlign: "center" }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>🏈</div>
                Chargement ESPN…
              </div>
            ) : games.length === 0 ? (
              <div style={{ color: C.muted, fontSize: 13, padding: 20, textAlign: "center" }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>🏈</div>
                Aucun match NFL aujourd'hui
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {games.map(g => (
                  <NFLGameCard
                    key={g.id}
                    game={g}
                    selected={selectedGame?.id === g.id}
                    onClick={() => setSelectedGame(g)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Détail match sélectionné */}
          {selectedGame ? (
            <div style={{ animation: "fadeUp .3s ease" }}>
              <div style={{
                background: `linear-gradient(160deg, ${selectedGame.home.color}15, rgba(0,0,0,0.6), ${selectedGame.away.color}15)`,
                border: `1px solid rgba(200,16,46,0.2)`,
                borderRadius: 20, padding: "28px 32px", marginBottom: 20,
              }}>
                <div style={{ marginBottom: 12 }}>
                  <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: 2, color: C.red, background: "rgba(200,16,46,0.12)", padding: "3px 12px", borderRadius: 6, border: "1px solid rgba(200,16,46,0.25)" }}>🏈 NFL</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  {/* Home */}
                  <div style={{ textAlign: "center", flex: 1 }}>
                    <div style={{ fontFamily: "'Permanent Marker', cursive", fontSize: 42, color: selectedGame.home.color, lineHeight: 1 }}>{selectedGame.home.abbr}</div>
                    <div style={{ fontSize: 12, color: C.muted }}>{selectedGame.home.name}</div>
                    <div style={{ fontSize: 11, color: C.muted }}>{selectedGame.home.record}</div>
                  </div>
                  {/* Score */}
                  <div style={{ textAlign: "center", padding: "0 24px" }}>
                    <div style={{ fontFamily: "'Permanent Marker', cursive", fontSize: 52, lineHeight: 1, letterSpacing: 4 }}>
                      <span style={{ color: C.text }}>{selectedGame.home.score}</span>
                      <span style={{ color: C.muted, fontSize: 32, margin: "0 8px" }}>–</span>
                      <span style={{ color: C.text }}>{selectedGame.away.score}</span>
                    </div>
                    {selectedGame.status === "live" && (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 8 }}>
                        <span style={{ width: 7, height: 7, borderRadius: "50%", background: C.red, animation: "pulse 1s infinite", display: "inline-block" }} />
                        <span style={{ fontSize: 11, color: C.red, fontWeight: 800 }}>Q{selectedGame.quarter} · {selectedGame.clock}</span>
                      </div>
                    )}
                    {selectedGame.status === "final" && (
                      <div style={{ fontSize: 11, color: C.green, fontWeight: 800, marginTop: 8 }}>✓ MATCH TERMINÉ</div>
                    )}
                    {selectedGame.status === "upcoming" && (
                      <div style={{ fontSize: 11, color: C.muted, marginTop: 8 }}>À VENIR</div>
                    )}
                  </div>
                  {/* Away */}
                  <div style={{ textAlign: "center", flex: 1 }}>
                    <div style={{ fontFamily: "'Permanent Marker', cursive", fontSize: 42, color: selectedGame.away.color, lineHeight: 1 }}>{selectedGame.away.abbr}</div>
                    <div style={{ fontSize: 12, color: C.muted }}>{selectedGame.away.name}</div>
                    <div style={{ fontSize: 11, color: C.muted }}>{selectedGame.away.record}</div>
                  </div>
                </div>

                {selectedGame.venue && (
                  <div style={{ textAlign: "center", marginTop: 16, fontSize: 11, color: C.muted }}>
                    🏟 {selectedGame.venue}
                  </div>
                )}
              </div>

              {/* Pitch: rediriger vers Live Center pour box score */}
              <div style={{ background: "rgba(200,16,46,0.05)", border: "1px solid rgba(200,16,46,0.2)", borderRadius: 14, padding: "18px 20px", textAlign: "center" }}>
                <div style={{ fontSize: 13, color: C.muted, marginBottom: 10 }}>
                  📊 Box score complet et analyse IA disponibles dans Live Center
                </div>
                <div style={{ fontSize: 11, color: C.muted }}>
                  Filtre 🏈 NFL → clique sur ce match pour l'analyse détaillée
                </div>
              </div>
            </div>
          ) : (
            <div style={{ border: `1px dashed ${C.border}`, borderRadius: 18, padding: "60px 30px", textAlign: "center", color: C.muted }}>
              <div style={{ fontSize: 44, marginBottom: 12 }}>🏈</div>
              <div style={{ fontSize: 15, color: C.text, marginBottom: 6 }}>Sélectionne un match</div>
              <div style={{ fontSize: 13 }}>Les scores ESPN se mettent à jour toutes les 30 secondes.</div>
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: 32, fontSize: 11, color: C.muted, textAlign: "center" }}>
        🏈 NFL Zone · Données ESPN temps réel · Saison 2024-25
      </div>
    </div>
  );
}
