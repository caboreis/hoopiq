import { useState, useEffect, useCallback } from "react";

const API = import.meta.env.DEV ? "http://localhost:3001" : "";

const C = {
  bg: "#06060f", bg2: "#0d0d1f",
  surface: "rgba(255,255,255,0.04)", border: "rgba(255,255,255,0.07)",
  orange: "#ff5c00", orangeL: "#ff8c42",
  green: "#22d37a", blue: "#4fa3ff", purple: "#a855f7", gold: "#f5c842",
  red: "#ff4d6d", text: "#f0f0ff", muted: "#6b6b88",
};

const LEAGUES = [
  {
    id: "gleague",
    label: "G-League",
    icon: "🏀",
    color: C.blue,
    api: "https://site.api.espn.com/apis/site/v2/sports/basketball/nba-g-league/scoreboard",
    summaryBase: "https://site.api.espn.com/apis/site/v2/sports/basketball/nba-g-league/summary",
    badge: "G",
    desc: "Prêts pour la NBA",
  },
  {
    id: "ncaa",
    label: "NCAA",
    icon: "🎓",
    color: C.purple,
    api: "https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard",
    summaryBase: "https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/summary",
    badge: "NCAA",
    desc: "Futures stars NBA",
  },
];

// ESPN box score stat indices (standard order)
function parsePlayerStats(rawStats) {
  if (!rawStats || rawStats.length < 2) return null;
  // ESPN stats array: MIN, FG, 3PT, FT, OREB, DREB, REB, AST, STL, BLK, TO, PF, +/-, PTS
  const pts = parseInt(rawStats[rawStats.length - 1], 10) || 0;
  const reb = parseInt(rawStats[6], 10) || 0;
  const ast = parseInt(rawStats[7], 10) || 0;
  const min = rawStats[0] || "0";
  const fg  = rawStats[1] || "0-0";
  return { pts, reb, ast, min, fg };
}

function scoutScore(s) {
  if (!s) return 0;
  return s.pts * 1.0 + s.reb * 0.7 + s.ast * 0.8;
}

async function fetchBoxScore(summaryBase, eventId) {
  try {
    const r = await fetch(`${summaryBase}?event=${eventId}`);
    const d = await r.json();
    const players = [];
    for (const teamData of (d.boxscore?.players || [])) {
      const teamName = teamData.team?.displayName || "";
      const teamColor = teamData.team?.color ? `#${teamData.team.color}` : C.muted;
      for (const statGroup of (teamData.statistics || [])) {
        for (const ath of (statGroup.athletes || [])) {
          const s = parsePlayerStats(ath.stats);
          if (!s || s.pts < 1) continue;
          players.push({
            id: ath.athlete?.id,
            name: ath.athlete?.displayName || "?",
            pos: ath.athlete?.position?.abbreviation || "?",
            headshot: ath.athlete?.headshot?.href || null,
            teamName, teamColor,
            ...s,
            scoutScore: scoutScore(s),
          });
        }
      }
    }
    players.sort((a, b) => b.scoutScore - a.scoutScore);
    return players.slice(0, 8);
  } catch {
    return [];
  }
}

async function fetchLeagueGames(league) {
  try {
    const r = await fetch(league.api);
    const d = await r.json();
    const events = d.events || [];
    return events
      .map(ev => {
        const comp = ev.competitions?.[0] || {};
        const home = comp.competitors?.find(c => c.homeAway === "home") || {};
        const away = comp.competitors?.find(c => c.homeAway === "away") || {};
        const stateId = ev.status?.type?.id;
        return {
          id: ev.id,
          statusId: stateId,
          status: stateId === "2" ? "live" : stateId === "3" ? "final" : "upcoming",
          shortDetail: ev.status?.type?.shortDetail || "",
          home: { name: home.team?.displayName || "", abbr: home.team?.abbreviation || "", score: home.score || "0", logo: home.team?.logo || "" },
          away: { name: away.team?.displayName || "", abbr: away.team?.abbreviation || "", score: away.score || "0", logo: away.team?.logo || "" },
        };
      })
      .filter(g => g.status === "final" || g.status === "live")
      .slice(0, 6);
  } catch {
    return [];
  }
}

/* ── Scout Card ─────────────────────────────────────────────── */
function PlayerCard({ player, leagueColor, rank }) {
  const isTop = rank <= 3;
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "12px 14px", borderRadius: 12,
      background: isTop ? `${leagueColor}0d` : "rgba(255,255,255,0.03)",
      border: `1px solid ${isTop ? leagueColor + "33" : "rgba(255,255,255,0.07)"}`,
      borderLeft: `3px solid ${isTop ? leagueColor : "transparent"}`,
    }}>
      {/* Rank */}
      <div style={{
        width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
        background: rank === 1 ? C.gold : rank === 2 ? "#aaa" : rank === 3 ? "#cd7f32" : "rgba(255,255,255,0.06)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 11, fontWeight: 800, color: rank <= 3 ? "#000" : C.muted,
      }}>{rank}</div>

      {/* Photo */}
      {player.headshot ? (
        <img src={player.headshot} alt={player.name}
          style={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover", objectPosition: "top", flexShrink: 0, background: "#111" }}
          onError={e => { e.target.style.display = "none"; }} />
      ) : (
        <div style={{
          width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
          background: `linear-gradient(135deg, ${leagueColor}, ${leagueColor}88)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 13, fontWeight: 800, color: "#fff",
        }}>{player.name.split(" ").map(w => w[0]).join("").slice(0, 2)}</div>
      )}

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{player.name}</div>
        <div style={{ fontSize: 11, color: C.muted }}>{player.pos} · {player.teamName}</div>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: 14, flexShrink: 0 }}>
        {[
          { val: player.pts, lbl: "PTS", color: C.orange },
          { val: player.reb, lbl: "REB", color: C.green },
          { val: player.ast, lbl: "AST", color: C.blue },
        ].map(s => (
          <div key={s.lbl} style={{ textAlign: "center", minWidth: 28 }}>
            <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 20, color: s.color, lineHeight: 1 }}>{s.val}</div>
            <div style={{ fontSize: 9, color: C.muted, letterSpacing: 0.5 }}>{s.lbl}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Game Section ───────────────────────────────────────────── */
function GameSection({ game, league, expanded, onToggle, players, loading }) {
  const isLive = game.status === "live";
  return (
    <div style={{ marginBottom: 12 }}>
      <button onClick={onToggle} style={{
        width: "100%", padding: "12px 16px", borderRadius: 12,
        background: expanded ? `${league.color}0d` : "rgba(255,255,255,0.03)",
        border: `1px solid ${expanded ? league.color + "33" : "rgba(255,255,255,0.07)"}`,
        cursor: "pointer", display: "flex", alignItems: "center", gap: 12,
        fontFamily: "inherit", color: C.text, transition: "all .2s",
      }}>
        {isLive && <span style={{ width: 7, height: 7, borderRadius: "50%", background: C.red, animation: "pulse 1.2s infinite", flexShrink: 0 }} />}
        <div style={{ flex: 1, textAlign: "left" }}>
          <div style={{ fontSize: 13, fontWeight: 700 }}>
            {game.away.abbr || game.away.name} <span style={{ color: C.muted }}>vs</span> {game.home.abbr || game.home.name}
          </div>
          <div style={{ fontSize: 11, color: C.muted }}>{isLive ? `🔴 En direct · ${game.shortDetail}` : `${game.away.score} – ${game.home.score}`}</div>
        </div>
        <div style={{ fontSize: 12, color: league.color, fontWeight: 700 }}>{expanded ? "▲" : "▼ Top performers"}</div>
      </button>

      {expanded && (
        <div style={{ padding: "8px 0 0" }}>
          {loading ? (
            <div style={{ padding: "16px", textAlign: "center", color: C.muted, fontSize: 13 }}>⏳ Chargement des stats...</div>
          ) : players.length === 0 ? (
            <div style={{ padding: "12px 16px", color: C.muted, fontSize: 13 }}>Aucune stat disponible.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {players.map((p, i) => <PlayerCard key={p.id || i} player={p} leagueColor={league.color} rank={i + 1} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── JARVIS Prospects Analysis ──────────────────────────────── */
function JarvisProspects({ topPlayers }) {
  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const runAnalysis = async () => {
    if (loading || done) return;
    setLoading(true);
    setAnalysis("");

    const playerLines = topPlayers.slice(0, 8).map(p =>
      `${p.name} (${p.league}, ${p.pos}): ${p.pts}pts / ${p.reb}reb / ${p.ast}ast`
    ).join("\n");

    try {
      const res = await fetch(`${API}/api/anthropic`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 1200,
          messages: [{
            role: "user",
            content: `Tu es JARVIS HoopIQ, le meilleur scout NBA au monde. Tu as l'oeil de Bob Myers et la data de Daryl Morey.

Voici les meilleurs performers récents des ligues de développement :
${playerLines}

Pour chaque joueur, donne :
• **NOM** (ligue) — Niveau NBA : [prêt/proche/projet] — Style : comparaison avec un joueur NBA actuel
  → Pourquoi il va percer : 1 phrase percutante

Termine par une section ## COUP DE CŒUR avec le joueur qui t'excite le plus et pourquoi en 2 phrases.

Style : direct, confiant, comme un vrai scout qui a tout vu. En français.`
          }]
        })
      });
      const data = await res.json();
      const text = data.content?.map(b => b.text || "").join("") || "Analyse non disponible.";

      let i = 0;
      const tick = setInterval(() => {
        if (i >= text.length) {
          setAnalysis(text); setDone(true); setLoading(false); clearInterval(tick);
        } else {
          setAnalysis(text.slice(0, i)); i += 15;
        }
      }, 16);
    } catch {
      setAnalysis("❌ Erreur JARVIS. Vérifie la connexion."); setDone(true); setLoading(false);
    }
  };

  return (
    <div style={{ background: "rgba(168,85,247,0.07)", border: "1px solid rgba(168,85,247,0.25)", borderRadius: 18, padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, color: C.purple, letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>🦾 JARVIS Scout</div>
          <div style={{ fontSize: 13, color: C.muted }}>Analyse IA des futures stars NBA</div>
        </div>
        {!done && (
          <button onClick={runAnalysis} disabled={loading} style={{
            padding: "9px 18px", borderRadius: 10, border: "none", cursor: loading ? "default" : "pointer",
            background: loading ? "rgba(255,255,255,0.06)" : `linear-gradient(135deg, ${C.purple}, #7c3aed)`,
            color: "#fff", fontWeight: 700, fontSize: 13, fontFamily: "inherit",
            opacity: loading ? 0.7 : 1, transition: "all .2s",
          }}>
            {loading ? "⏳ Analyse..." : "Lancer l'analyse"}
          </button>
        )}
      </div>

      {!analysis && !loading && (
        <div style={{ textAlign: "center", padding: "24px 0", color: C.muted, fontSize: 13 }}>
          Clique sur "Lancer l'analyse" pour que JARVIS identifie les meilleurs prospects du moment.
        </div>
      )}

      {analysis && (
        <div style={{
          fontSize: 13, lineHeight: 1.8, color: C.text, whiteSpace: "pre-wrap",
          fontFamily: "'DM Sans', sans-serif",
        }}>
          {analysis.split("\n").map((line, i) => {
            if (line.startsWith("## ")) return <div key={i} style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 20, color: C.purple, letterSpacing: 1, marginTop: 16, marginBottom: 4 }}>{line.replace("## ", "")}</div>;
            if (line.startsWith("• **") || line.startsWith("**")) {
              const parts = line.replace(/\*\*/g, "|||").split("|||");
              return (
                <div key={i} style={{ marginTop: 12 }}>
                  {parts.map((p, j) => j % 2 === 1 ? <strong key={j} style={{ color: C.purple }}>{p}</strong> : <span key={j}>{p}</span>)}
                </div>
              );
            }
            if (line.startsWith("  →")) return <div key={i} style={{ color: C.green, marginLeft: 16, fontSize: 12 }}>{line}</div>;
            return <div key={i}>{line}</div>;
          })}
          {!done && <span style={{ animation: "blink 1s infinite", color: C.purple }}>▌</span>}
        </div>
      )}
    </div>
  );
}

/* ── Main Scout Component ───────────────────────────────────── */
export default function Scout() {
  const [activeLeague, setActiveLeague] = useState("gleague");
  const [gamesData, setGamesData] = useState({ gleague: [], ncaa: [] });
  const [loadingLeague, setLoadingLeague] = useState({ gleague: true, ncaa: true });
  const [expanded, setExpanded] = useState({});
  const [boxScores, setBoxScores] = useState({});
  const [boxLoading, setBoxLoading] = useState({});
  const [allTopPlayers, setAllTopPlayers] = useState([]);

  // Fetch games for both leagues on mount
  useEffect(() => {
    LEAGUES.forEach(async (league) => {
      const games = await fetchLeagueGames(league);
      setGamesData(prev => ({ ...prev, [league.id]: games }));
      setLoadingLeague(prev => ({ ...prev, [league.id]: false }));
    });
  }, []);

  // Auto-expand first game when games load
  useEffect(() => {
    LEAGUES.forEach(league => {
      const games = gamesData[league.id];
      if (games.length > 0 && !Object.keys(expanded).some(k => k.startsWith(league.id))) {
        const key = `${league.id}_${games[0].id}`;
        toggleGame(league, games[0], key);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gamesData]);

  const toggleGame = useCallback(async (league, game, key) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
    if (boxScores[key] || boxLoading[key]) return;

    setBoxLoading(prev => ({ ...prev, [key]: true }));
    const players = await fetchBoxScore(league.summaryBase, game.id);
    setBoxScores(prev => ({ ...prev, [key]: players }));
    setBoxLoading(prev => ({ ...prev, [key]: false }));

    // Accumulate top players for JARVIS analysis
    setAllTopPlayers(prev => {
      const tagged = players.slice(0, 3).map(p => ({ ...p, league: league.label }));
      const combined = [...prev, ...tagged];
      // dedupe by name
      const seen = new Set();
      return combined.filter(p => { if (seen.has(p.name)) return false; seen.add(p.name); return true; });
    });
  }, [boxScores, boxLoading]);

  const league = LEAGUES.find(l => l.id === activeLeague);
  const games = gamesData[activeLeague] || [];
  const isLoading = loadingLeague[activeLeague];

  return (
    <div className="fade-in">
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 46, letterSpacing: 2, lineHeight: 1, marginBottom: 6 }}>
          SCOUT <span style={{ color: C.orange }}>IA</span>
        </h1>
        <p style={{ color: C.muted, fontSize: 13 }}>G-League · NCAA — Détecte les futures stars NBA avant tout le monde</p>
      </div>

      {/* League Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {LEAGUES.map(l => (
          <button key={l.id} onClick={() => setActiveLeague(l.id)} style={{
            padding: "10px 20px", borderRadius: 12, border: "none", cursor: "pointer",
            background: activeLeague === l.id ? `${l.color}22` : "rgba(255,255,255,0.04)",
            color: activeLeague === l.id ? l.color : C.muted,
            fontWeight: 700, fontSize: 13, fontFamily: "inherit",
            borderBottom: `2px solid ${activeLeague === l.id ? l.color : "transparent"}`,
            transition: "all .2s",
          }}>
            {l.icon} {l.label}
            <span style={{ marginLeft: 8, fontSize: 10, opacity: 0.8 }}>— {l.desc}</span>
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 20, alignItems: "start" }}>
        {/* Games column */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: league.color }} />
            <span style={{ fontSize: 11, fontWeight: 800, color: league.color, letterSpacing: 2, textTransform: "uppercase" }}>
              {league.label} — Matchs récents
            </span>
            {!isLoading && (
              <span style={{ fontSize: 11, color: C.muted }}>({games.length} matchs)</span>
            )}
          </div>

          {isLoading ? (
            <div style={{ padding: "32px", textAlign: "center", color: C.muted, fontSize: 14 }}>
              ⏳ Chargement des matchs {league.label}...
            </div>
          ) : games.length === 0 ? (
            <div style={{ padding: "32px", textAlign: "center" }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🏀</div>
              <div style={{ color: C.muted, fontSize: 14 }}>Aucun match récent pour la {league.label}.</div>
              <div style={{ color: C.muted, fontSize: 12, marginTop: 6 }}>Les matchs apparaissent en saison active.</div>
            </div>
          ) : (
            games.map(game => {
              const key = `${activeLeague}_${game.id}`;
              return (
                <GameSection
                  key={key}
                  game={game}
                  league={league}
                  expanded={!!expanded[key]}
                  onToggle={() => toggleGame(league, game, key)}
                  players={boxScores[key] || []}
                  loading={!!boxLoading[key]}
                />
              );
            })
          )}
        </div>

        {/* JARVIS column */}
        <div style={{ position: "sticky", top: 20 }}>
          <JarvisProspects topPlayers={allTopPlayers} />

          {/* League info cards */}
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
            {LEAGUES.map(l => (
              <div key={l.id} onClick={() => setActiveLeague(l.id)} style={{
                padding: "12px 16px", borderRadius: 12, cursor: "pointer",
                background: activeLeague === l.id ? `${l.color}0d` : "rgba(255,255,255,0.03)",
                border: `1px solid ${activeLeague === l.id ? l.color + "33" : "rgba(255,255,255,0.06)"}`,
                transition: "all .2s",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 18 }}>{l.icon}</span>
                  <span style={{ fontWeight: 700, fontSize: 13, color: l.color }}>{l.label}</span>
                  <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 6px", borderRadius: 5, background: `${l.color}22`, color: l.color, letterSpacing: 1 }}>{l.badge}</span>
                </div>
                <div style={{ fontSize: 11, color: C.muted }}>{l.desc}</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
                  {loadingLeague[l.id] ? "Chargement..." : `${gamesData[l.id]?.length || 0} matchs récents`}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
