import { useState, useEffect, useCallback, useRef } from "react";
import { authHeaders } from "./authHeaders.js";

const API = import.meta.env.DEV ? "http://localhost:3001" : "";

const C = {
  bg: "#06060f", bg2: "#0d0d1f",
  surface: "rgba(255,255,255,0.04)", border: "rgba(255,255,255,0.07)",
  orange: "#ff5c00", orangeL: "#ff8c42",
  green: "#22d37a", blue: "#4fa3ff", purple: "#a855f7", gold: "#f5c842",
  red: "#ff4d6d", cyan: "#22d3ee", text: "#f0f0ff", muted: "#6b6b88",
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
    sport: "nba-g-league",
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
    sport: "mens-college-basketball",
    desc: "Futures stars NBA",
  },
  {
    id: "wnba",
    label: "WNBA",
    icon: "🌸",
    color: "#c084fc",
    api: "https://site.api.espn.com/apis/site/v2/sports/basketball/wnba/scoreboard",
    summaryBase: "https://site.api.espn.com/apis/site/v2/sports/basketball/wnba/summary",
    badge: "WNBA",
    sport: "wnba",
    desc: "Futures stars WNBA",
  },
];

/* ── Stats parsing ──────────────────────────────────────────── */
function parseSplit(str) {
  if (!str || !str.includes("-")) return { made: 0, att: 0 };
  const [m, a] = str.split("-").map(Number);
  return { made: m || 0, att: a || 0 };
}

function parseStats(raw) {
  if (!raw || raw.length < 8) return null;
  // ESPN order: MIN, FG, 3PT, FT, OREB, DREB, REB, AST, STL, BLK, TO, PF, +/-, PTS
  const fg  = parseSplit(raw[1]);
  const tpt = parseSplit(raw[2]);
  const ft  = parseSplit(raw[3]);
  const oreb = parseInt(raw[4], 10) || 0;
  const dreb = parseInt(raw[5], 10) || 0;
  const reb  = parseInt(raw[6], 10) || 0;
  const ast  = parseInt(raw[7], 10) || 0;
  const stl  = parseInt(raw[8], 10) || 0;
  const blk  = parseInt(raw[9], 10) || 0;
  const to   = parseInt(raw[10], 10) || 0;
  const pf   = parseInt(raw[11], 10) || 0;
  const pm   = parseInt(raw[12], 10) || 0;
  const pts  = parseInt(raw[raw.length - 1], 10) || 0;
  const min  = raw[0] || "0";

  // Advanced stats
  const tsDenom = 2 * (fg.att + 0.44 * ft.att);
  const ts   = tsDenom > 0 ? Math.round((pts / tsDenom) * 100) : 0;
  const efg  = fg.att > 0 ? Math.round(((fg.made + 0.5 * tpt.made) / fg.att) * 100) : 0;
  const atr  = to > 0 ? parseFloat((ast / to).toFixed(1)) : ast;
  const usageProxy = fg.att + 0.44 * ft.att + to; // raw possession usage

  return {
    min, pts, reb, ast, stl, blk, to, pf, pm, oreb, dreb,
    fgm: fg.made, fga: fg.att, fgStr: raw[1] || "0-0",
    tpm: tpt.made, tpa: tpt.att,
    ftm: ft.made, fta: ft.att,
    ts, efg, atr, usageProxy,
  };
}

/* ── JARVIS Score algorithm (0-100) ─────────────────────────── */
function calcJarvisScore(s) {
  if (!s) return 0;
  // Scoring (0-28): normalize pts over 40 max
  const scoringPts = Math.min(s.pts / 40, 1) * 28;
  // Efficiency (0-25): TS% centered at 55%
  const effPts = s.ts > 0 ? Math.min(Math.max((s.ts - 35) / 35, 0), 1) * 25 : 12;
  // Playmaking (0-15): ast weighted, penalize turnovers
  const playPts = Math.min(Math.max((s.ast * 2.5 - s.to * 1.5) / 15, 0), 1) * 15;
  // Defense (0-12): stl + blk value
  const defPts = Math.min((s.stl * 3 + s.blk * 2) / 10, 1) * 12;
  // Rebounding (0-10)
  const rebPts = Math.min(s.reb / 18, 1) * 10;
  // X-factor (0-10): bonus for elite performances
  const xPts = (s.pts >= 30 && s.ts >= 60) ? 10 : (s.pts >= 25 || s.ts >= 65) ? 6 : s.pts >= 20 ? 3 : 0;

  return Math.min(Math.round(scoringPts + effPts + playPts + defPts + rebPts + xPts), 100);
}

function jarvisBadge(score) {
  if (score >= 88) return { icon: "💎", label: "PÉPITE", color: C.gold };
  if (score >= 80) return { icon: "🚀", label: "PROCHAIN ALL-STAR", color: C.cyan };
  if (score >= 70) return { icon: "⭐", label: "PROSPECT SOLIDE", color: C.green };
  return null;
}

function scoreColor(score) {
  if (score >= 88) return C.gold;
  if (score >= 80) return C.cyan;
  if (score >= 70) return C.green;
  if (score >= 55) return C.orange;
  return C.muted;
}

/* ── Fetch helpers ──────────────────────────────────────────── */
async function fetchBoxScore(summaryBase, eventId) {
  try {
    const r = await fetch(`${summaryBase}?event=${eventId}`);
    const d = await r.json();
    const players = [];
    for (const teamData of (d.boxscore?.players || [])) {
      const teamName = teamData.team?.displayName || "";
      const teamAbbr = teamData.team?.abbreviation || "";
      const teamColor = teamData.team?.color ? `#${teamData.team.color}` : C.muted;
      for (const statGroup of (teamData.statistics || [])) {
        for (const ath of (statGroup.athletes || [])) {
          const s = parseStats(ath.stats);
          if (!s || s.pts < 1) continue;
          const jarvis = calcJarvisScore(s);
          players.push({
            id: ath.athlete?.id,
            name: ath.athlete?.displayName || "?",
            pos: ath.athlete?.position?.abbreviation || "?",
            headshot: ath.athlete?.headshot?.href || null,
            teamName, teamAbbr, teamColor,
            ...s,
            jarvis,
            badge: jarvisBadge(jarvis),
          });
        }
      }
    }
    players.sort((a, b) => b.jarvis - a.jarvis);
    return players.slice(0, 10);
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
          status: stateId === "2" ? "live" : stateId === "3" ? "final" : "upcoming",
          shortDetail: ev.status?.type?.shortDetail || "",
          home: { name: home.team?.displayName || "", abbr: home.team?.abbreviation || "", score: home.score || "0" },
          away: { name: away.team?.displayName || "", abbr: away.team?.abbreviation || "", score: away.score || "0" },
        };
      })
      .filter(g => g.status === "final" || g.status === "live")
      .slice(0, 8);
  } catch {
    return [];
  }
}

/* ── Mini stat bar ──────────────────────────────────────────── */
function StatBar({ value, max, color }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
      <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 2, transition: "width .8s ease" }} />
    </div>
  );
}

/* ── JARVIS Score Ring ──────────────────────────────────────── */
function ScoreRing({ score, size = 56 }) {
  const r = size / 2 - 5;
  const circ = 2 * Math.PI * r;
  const col = scoreColor(score);
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={4} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={col} strokeWidth={4}
          strokeDasharray={circ} strokeDashoffset={circ * (1 - score / 100)}
          strokeLinecap="round" style={{ transition: "stroke-dashoffset 1s ease" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontFamily: "'Bebas Neue', cursive", fontSize: size * 0.28, color: col, lineHeight: 1 }}>{score}</span>
      </div>
    </div>
  );
}

/* ── Advanced Stats Pill ────────────────────────────────────── */
function StatPill({ label, value, color, sub }) {
  return (
    <div style={{ textAlign: "center", padding: "6px 10px", background: "rgba(255,255,255,0.04)", borderRadius: 8, minWidth: 52 }}>
      <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 18, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: C.muted, letterSpacing: 0.5, textTransform: "uppercase", marginTop: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: 8, color, marginTop: 1 }}>{sub}</div>}
    </div>
  );
}

/* ── Player Card (premium) ──────────────────────────────────── */
function PlayerCard({ player, leagueColor, rank, onAnalyze, isAnalyzing, isAnalyzed }) {
  const badge = player.badge;
  const col = scoreColor(player.jarvis);

  return (
    <div style={{
      borderRadius: 16, overflow: "hidden",
      background: badge ? `linear-gradient(145deg, ${badge.color}08, rgba(13,13,31,0.95))` : "rgba(255,255,255,0.03)",
      border: `1px solid ${badge ? badge.color + "33" : "rgba(255,255,255,0.07)"}`,
      boxShadow: badge?.icon === "💎" ? `0 0 30px ${C.gold}15` : "none",
      marginBottom: 10,
      transition: "all .2s",
    }}>
      {/* Alert banner for PÉPITE */}
      {badge?.icon === "💎" && (
        <div style={{
          background: `linear-gradient(90deg, ${C.gold}22, ${C.gold}08)`,
          borderBottom: `1px solid ${C.gold}33`,
          padding: "6px 14px", display: "flex", alignItems: "center", gap: 8,
        }}>
          <span style={{ animation: "pulse 1.5s infinite", display: "inline-block" }}>💎</span>
          <span style={{ fontSize: 13, fontWeight: 800, color: C.gold, letterSpacing: 2 }}>ALERTE PÉPITE — TALENT EXCEPTIONNEL DÉTECTÉ</span>
        </div>
      )}
      {badge?.icon === "🚀" && (
        <div style={{
          background: `linear-gradient(90deg, ${C.cyan}15, transparent)`,
          borderBottom: `1px solid ${C.cyan}22`,
          padding: "5px 14px", display: "flex", alignItems: "center", gap: 8,
        }}>
          <span>🚀</span>
          <span style={{ fontSize: 13, fontWeight: 800, color: C.cyan, letterSpacing: 1.5 }}>PROCHAIN ALL-STAR</span>
        </div>
      )}

      <div style={{ padding: "18px 20px" }}>
        <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
          {/* Rank + photo */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <div style={{
              width: 26, height: 26, borderRadius: "50%",
              background: rank === 1 ? C.gold : rank === 2 ? "#aaa" : rank === 3 ? "#cd7f32" : "rgba(255,255,255,0.08)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 800, color: rank <= 3 ? "#000" : C.muted,
            }}>{rank}</div>
            {player.headshot ? (
              <img src={player.headshot} alt={player.name}
                style={{ width: 54, height: 54, borderRadius: "50%", objectFit: "cover", objectPosition: "top", border: `2px solid ${badge ? badge.color : leagueColor}44`, background: "#111" }}
                onError={e => { e.target.style.display = "none"; }} />
            ) : (
              <div style={{
                width: 54, height: 54, borderRadius: "50%",
                background: `linear-gradient(135deg, ${leagueColor}, ${leagueColor}66)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18, fontWeight: 800, color: "#fff", border: `2px solid ${leagueColor}44`,
              }}>{player.name.split(" ").map(w => w[0]).join("").slice(0, 2)}</div>
            )}
          </div>

          {/* Info + stats */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
              <div style={{ fontWeight: 800, fontSize: 17, color: C.text }}>{player.name}</div>
              {badge && (
                <span style={{ fontSize: 12, fontWeight: 800, padding: "3px 10px", borderRadius: 6,
                  background: `${badge.color}22`, color: badge.color, letterSpacing: 1.2, border: `1px solid ${badge.color}44` }}>
                  {badge.icon} {badge.label}
                </span>
              )}
            </div>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 12 }}>
              {player.pos} · {player.teamName} · {player.fgStr} FG · {player.min} min
            </div>

            {/* Core stats */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
              <StatPill label="PTS"  value={player.pts}  color={C.orange} />
              <StatPill label="REB"  value={player.reb}  color={C.green} />
              <StatPill label="AST"  value={player.ast}  color={C.blue} />
              <StatPill label="STL"  value={player.stl}  color={C.gold} />
              <StatPill label="BLK"  value={player.blk}  color={C.purple} />
            </div>

            {/* Advanced stats */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
              <StatPill label="TS%"  value={`${player.ts}%`}  color={player.ts >= 60 ? C.gold : player.ts >= 50 ? C.green : C.muted} sub={player.ts >= 60 ? "ELITE" : player.ts >= 55 ? "BON" : ""} />
              <StatPill label="eFG%" value={`${player.efg}%`} color={player.efg >= 55 ? C.cyan : C.muted} />
              <StatPill label="A/T"  value={player.atr}  color={player.atr >= 3 ? C.green : player.atr >= 2 ? C.orange : C.muted} />
              <StatPill label="+/-"  value={player.pm >= 0 ? `+${player.pm}` : player.pm} color={player.pm > 5 ? C.green : player.pm < -5 ? C.red : C.muted} />
            </div>

            {/* Stat bars */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 16px", marginBottom: 10 }}>
              {[
                { l: "Scoring", v: player.pts, max: 50, c: C.orange },
                { l: "Efficacité TS%", v: player.ts, max: 80, c: player.ts >= 60 ? C.gold : C.green },
                { l: "Playmaking", v: player.ast, max: 15, c: C.blue },
                { l: "Impact défensif", v: player.stl + player.blk, max: 6, c: C.purple },
              ].map(b => (
                <div key={b.l}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                    <span style={{ fontSize: 11, color: C.muted }}>{b.l}</span>
                    <span style={{ fontSize: 11, color: b.c, fontWeight: 700 }}>{b.v}</span>
                  </div>
                  <StatBar value={b.v} max={b.max} color={b.c} />
                </div>
              ))}
            </div>
          </div>

          {/* JARVIS Score */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <ScoreRing score={player.jarvis} size={66} />
            <div style={{ fontSize: 10, color: col, fontWeight: 800, letterSpacing: 0.5, textTransform: "uppercase" }}>JARVIS</div>
          </div>
        </div>

        {/* Analyse button */}
        {!isAnalyzed && (
          <button onClick={() => onAnalyze(player)} disabled={isAnalyzing} style={{
            marginTop: 8, width: "100%", padding: "10px", borderRadius: 10, border: "none",
            background: isAnalyzing ? "rgba(255,255,255,0.04)" : `${leagueColor}18`,
            color: isAnalyzing ? C.muted : leagueColor,
            fontSize: 14, fontWeight: 700, cursor: isAnalyzing ? "default" : "pointer",
            fontFamily: "inherit", transition: "all .2s",
          }}>
            {isAnalyzing ? "⏳ Analyse JARVIS en cours..." : "🦾 Analyser avec JARVIS"}
          </button>
        )}
      </div>
    </div>
  );
}

/* ── JARVIS Single Player Analysis Card ─────────────────────── */
function JarvisCard({ player, analysis, leagueColor }) {
  const badge = player.badge;
  return (
    <div style={{
      background: `linear-gradient(145deg, ${badge ? badge.color + "0a" : leagueColor + "08"}, rgba(13,13,31,0.95))`,
      border: `1px solid ${badge ? badge.color + "33" : leagueColor + "22"}`,
      borderRadius: 14, padding: "14px 16px", marginBottom: 12,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        {player.headshot ? (
          <img src={player.headshot} alt={player.name}
            style={{ width: 46, height: 46, borderRadius: "50%", objectFit: "cover", objectPosition: "top", border: `2px solid ${badge?.color || leagueColor}55` }} />
        ) : (
          <div style={{ width: 46, height: 46, borderRadius: "50%", background: leagueColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: "#fff" }}>
            {player.name.split(" ").map(w => w[0]).join("").slice(0, 2)}
          </div>
        )}
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: C.text }}>{player.name}</div>
          <div style={{ fontSize: 13, color: C.muted }}>{player.pos} · {player.teamName}</div>
        </div>
        <ScoreRing score={player.jarvis} size={50} />
      </div>
      <div style={{ fontSize: 16, lineHeight: 1.8, color: C.text, whiteSpace: "pre-wrap", fontFamily: "'DM Sans', sans-serif" }}>
        {analysis.split("\n").map((line, i) => {
          if (line.startsWith("**") || line.includes("**")) {
            const parts = line.replace(/\*\*/g, "|||").split("|||");
            return <div key={i}>{parts.map((p, j) => j % 2 === 1 ? <strong key={j} style={{ color: badge?.color || leagueColor }}>{p}</strong> : <span key={j}>{p}</span>)}</div>;
          }
          if (line.startsWith("→") || line.startsWith("▸")) return <div key={i} style={{ color: C.green, paddingLeft: 10, fontSize: 15 }}>{line}</div>;
          if (line.startsWith("⚠")) return <div key={i} style={{ color: C.gold, fontSize: 15 }}>{line}</div>;
          if (line.startsWith("🔮")) return <div key={i} style={{ color: C.cyan, marginTop: 6, fontStyle: "italic", fontSize: 15 }}>{line}</div>;
          return <div key={i}>{line}</div>;
        })}
      </div>
    </div>
  );
}

/* ── JARVIS Analysis Panel ──────────────────────────────────── */
function JarvisPanel({ allPlayers }) {
  const [analyses, setAnalyses] = useState({});
  const [loading, setLoading] = useState({});
  const [globalLoading, setGlobalLoading] = useState(false);
  const [globalDone, setGlobalDone] = useState(false);
  const [globalAnalysis, setGlobalAnalysis] = useState("");
  const streamRef = useRef(null);
  const autoFiredRef = useRef(false);

  const analyzePlayer = useCallback(async (player) => {
    if (analyses[player.name] || loading[player.name]) return;
    setLoading(prev => ({ ...prev, [player.name]: true }));

    try {
      const res = await fetch(`${API}/api/anthropic`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 500,
          messages: [{
            role: "user",
            content: `Tu es JARVIS HoopIQ, le scout NBA numéro 1 au monde. Tu as le flair de Bob Myers, la data de Daryl Morey, et l'œil de Doc Rivers.

Analyse ce joueur en 4 points ULTRA-CONCIS (max 2 lignes chacun) :

**${player.name}** — ${player.pos} — ${player.teamName}
Stats : ${player.pts} pts / ${player.reb} reb / ${player.ast} ast / ${player.stl} stl / ${player.blk} blk
Stats avancées : TS% ${player.ts}% — eFG% ${player.efg}% — A/T ${player.atr} — +/- ${player.pm}
JARVIS Score : ${player.jarvis}/100${player.badge ? ` — Badge : ${player.badge.icon} ${player.badge.label}` : ""}

Format :
**PROFIL** : [type de joueur, comparaison NBA]
**FORCES** : [ses 2 atouts majeurs avec les stats]
**LIMITES** : [son point faible principal]
🔮 **PRÉDICTION 6 MOIS** : [va-t-il exploser ? niveau NBA attendu ?]

Sois précis, direct, comme un vrai scout. En français.`,
          }],
        }),
      });
      const data = await res.json();
      const text = data.content?.map(b => b.text || "").join("") || "Analyse indisponible.";
      setAnalyses(prev => ({ ...prev, [player.name]: text }));
    } catch {
      setAnalyses(prev => ({ ...prev, [player.name]: "❌ Erreur JARVIS." }));
    }
    setLoading(prev => ({ ...prev, [player.name]: false }));
  }, [analyses, loading]);

  const runGlobalAnalysis = async () => {
    if (globalLoading || globalDone) return;
    setGlobalLoading(true);
    setGlobalAnalysis("");

    const top = allPlayers.slice(0, 8);
    const lines = top.map(p =>
      `${p.name} (${p.league}, ${p.pos}, score ${p.jarvis}/100): ${p.pts}pts ${p.reb}reb ${p.ast}ast | TS%${p.ts} eFG%${p.efg} A/T${p.atr}`
    ).join("\n");

    try {
      const res = await fetch(`${API}/api/anthropic`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 1400,
          messages: [{
            role: "user",
            content: `Tu es JARVIS HoopIQ, le scout NBA élite. Analyse ces prospects des ligues de développement :

${lines}

Structure ta réponse EXACTEMENT ainsi :

## VERDICT DU SCOUT
[2 phrases sur le niveau général de cette cuvée]

## TOP PROSPECTS

Pour chaque joueur parmi les 3 meilleurs :
• **NOM** (score X/100) — [niveau NBA : élite/rotation/G-League] — Ressemble à [joueur NBA actuel]
  → Pourquoi : [1 phrase avec stat clé]
  🔮 Dans 6 mois : [prédiction concrète]

## COUP DE CŒUR JARVIS 💎
[Ton joueur chouchou et pourquoi en 3 phrases passionnées de vrai scout]

## USAGE RATE & IMPACT
[1 phrase sur qui crée le plus de situations pour son équipe]

Style : scout NBA pro, direct, data-driven, en français.`,
          }],
        }),
      });
      const data = await res.json();
      const text = data.content?.map(b => b.text || "").join("") || "Analyse indisponible.";

      let i = 0;
      if (streamRef.current) clearInterval(streamRef.current);
      streamRef.current = setInterval(() => {
        if (i >= text.length) {
          setGlobalAnalysis(text);
          setGlobalDone(true);
          setGlobalLoading(false);
          clearInterval(streamRef.current);
        } else {
          setGlobalAnalysis(text.slice(0, i));
          i += 18;
        }
      }, 16);
    } catch {
      setGlobalAnalysis("❌ Erreur JARVIS."); setGlobalDone(true); setGlobalLoading(false);
    }
  };

  // Auto-trigger global analysis once players are loaded
  useEffect(() => {
    if (allPlayers.length > 0 && !autoFiredRef.current) {
      autoFiredRef.current = true;
      runGlobalAnalysis();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allPlayers.length]);

  const topPlayers = allPlayers.filter(p => p.jarvis >= 88);

  return (
    <div>
      {/* Alert banner */}
      {topPlayers.length > 0 && (
        <div style={{
          background: `linear-gradient(135deg, ${C.gold}18, ${C.gold}08)`,
          border: `1px solid ${C.gold}44`, borderRadius: 14, padding: "12px 16px",
          marginBottom: 16, display: "flex", alignItems: "center", gap: 10,
        }}>
          <span style={{ fontSize: 22, animation: "pulse 1.5s infinite" }}>💎</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, color: C.gold }}>
              {topPlayers.length} PÉPITE{topPlayers.length > 1 ? "S" : ""} DÉTECTÉE{topPlayers.length > 1 ? "S" : ""} !
            </div>
            <div style={{ fontSize: 14, color: C.muted }}>
              {topPlayers.map((p, i) => (
                <span key={p.name}>
                  {i > 0 && ", "}
                  <span
                    onClick={() => analyzePlayer(p)}
                    style={{ cursor: "pointer", textDecoration: "underline", textDecorationStyle: "dotted", opacity: loading[p.name] ? 0.5 : 1 }}
                    title="Cliquer pour l'analyse JARVIS individuelle"
                  >{p.name}{loading[p.name] ? " ⏳" : ""}</span>
                </span>
              ))} — score JARVIS ≥ 88 · clique un nom pour l'analyse détaillée
            </div>
          </div>
        </div>
      )}

      {/* Global JARVIS */}
      <div style={{ background: "rgba(168,85,247,0.07)", border: "1px solid rgba(168,85,247,0.25)", borderRadius: 16, padding: 18, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: C.purple, letterSpacing: 2, textTransform: "uppercase" }}>🦾 JARVIS — Rapport Scout</div>
            <div style={{ fontSize: 14, color: C.muted, marginTop: 2 }}>{allPlayers.length} joueurs analysés</div>
          </div>
          {!globalDone && allPlayers.length > 0 && (
            <button onClick={runGlobalAnalysis} disabled={globalLoading} style={{
              padding: "8px 16px", borderRadius: 10, border: "none",
              cursor: globalLoading ? "default" : "pointer",
              background: globalLoading ? "rgba(255,255,255,0.06)" : `linear-gradient(135deg, ${C.purple}, #7c3aed)`,
              color: "#fff", fontWeight: 700, fontSize: 14, fontFamily: "inherit",
              opacity: globalLoading ? 0.7 : 1,
            }}>
              {globalLoading ? "⏳ En cours..." : "Rapport complet"}
            </button>
          )}
        </div>

        {!globalAnalysis && !globalLoading && (
          <div style={{ textAlign: "center", padding: "16px 0", color: C.muted, fontSize: 16 }}>
            {allPlayers.length === 0
              ? "Ouvre un match pour charger les joueurs."
              : `${allPlayers.length} joueur${allPlayers.length > 1 ? "s" : ""} prêt${allPlayers.length > 1 ? "s" : ""} — clique sur "Rapport complet"`
            }
          </div>
        )}

        {globalAnalysis && (
          <div style={{ fontSize: 16, lineHeight: 1.8, color: C.text, whiteSpace: "pre-wrap" }}>
            {globalAnalysis.split("\n").map((line, i) => {
              if (line.startsWith("## ")) return <div key={i} style={{ fontFamily: "'Permanent Marker', cursive", fontSize: 22, color: C.purple, letterSpacing: 1, marginTop: 14, marginBottom: 4 }}>{line.replace("## ", "")}</div>;
              if (line.startsWith("• **") || line.match(/^\*\*.+\*\*/)) {
                const parts = line.replace(/\*\*/g, "|||").split("|||");
                return <div key={i} style={{ marginTop: 10, fontSize: 16 }}>{parts.map((p, j) => j % 2 === 1 ? <strong key={j} style={{ color: C.cyan }}>{p}</strong> : <span key={j}>{p}</span>)}</div>;
              }
              if (line.startsWith("  →") || line.startsWith("→")) return <div key={i} style={{ color: C.green, paddingLeft: 14, fontSize: 14 }}>{line}</div>;
              if (line.startsWith("  🔮") || line.startsWith("🔮")) return <div key={i} style={{ color: C.cyan, paddingLeft: 14, fontSize: 14, fontStyle: "italic" }}>{line}</div>;
              return <div key={i}>{line}</div>;
            })}
            {!globalDone && <span style={{ animation: "blink 1s infinite", color: C.purple }}>▌</span>}
          </div>
        )}
      </div>

      {/* Per-player analyses */}
      {Object.entries(analyses).map(([name, text]) => {
        const player = allPlayers.find(p => p.name === name);
        if (!player) return null;
        return <JarvisCard key={name} player={player} analysis={text} leagueColor={player.leagueColor || C.blue} />;
      })}
    </div>
  );
}

/* ── Game Row ────────────────────────────────────────────────── */
function GameRow({ game, league, expanded, onToggle, players, loading }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <button onClick={onToggle} style={{
        width: "100%", padding: "11px 14px", borderRadius: 12,
        background: expanded ? `${league.color}0d` : "rgba(255,255,255,0.03)",
        border: `1px solid ${expanded ? league.color + "40" : "rgba(255,255,255,0.07)"}`,
        cursor: "pointer", display: "flex", alignItems: "center", gap: 10,
        fontFamily: "inherit", color: C.text, transition: "all .2s",
      }}>
        {game.status === "live" && <span style={{ width: 7, height: 7, borderRadius: "50%", background: C.red, animation: "pulse 1.2s infinite", flexShrink: 0 }} />}
        <div style={{ flex: 1, textAlign: "left" }}>
          <div style={{ fontSize: 13, fontWeight: 700 }}>
            {game.away.abbr} <span style={{ color: C.muted, fontSize: 11 }}>vs</span> {game.home.abbr}
          </div>
          <div style={{ fontSize: 10, color: C.muted }}>
            {game.status === "live" ? `🔴 Live · ${game.shortDetail}` : `${game.away.score} – ${game.home.score} · Terminé`}
          </div>
        </div>
        {players.length > 0 && (
          <div style={{ fontSize: 10, color: league.color }}>
            {players.filter(p => p.badge).length > 0 && (
              <span style={{ marginRight: 6 }}>{players.filter(p => p.badge?.icon === "💎").length > 0 ? "💎" : "🚀"}</span>
            )}
            {players.length} joueurs
          </div>
        )}
        <span style={{ color: C.muted, fontSize: 11 }}>{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded && (
        <div style={{ paddingTop: 8 }}>
          {loading ? (
            <div style={{ padding: "20px", textAlign: "center", color: C.muted, fontSize: 13 }}>⏳ Chargement box score...</div>
          ) : players.length === 0 ? (
            <div style={{ padding: "12px 14px", color: C.muted, fontSize: 13 }}>Aucune stat disponible.</div>
          ) : null}
        </div>
      )}
    </div>
  );
}

/* ── Main Scout ──────────────────────────────────────────────── */
export default function Scout() {
  const [activeLeague, setActiveLeague] = useState("gleague");
  const [gamesData, setGamesData] = useState({ gleague: [], ncaa: [] });
  const [loadingLeague, setLoadingLeague] = useState({ gleague: true, ncaa: true });
  const [expanded, setExpanded] = useState({});
  const [boxScores, setBoxScores] = useState({});
  const [boxLoading, setBoxLoading] = useState({});
  const [allPlayers, setAllPlayers] = useState([]);
  const [analyzingPlayer, setAnalyzingPlayer] = useState(null);
  const [playerAnalyses, setPlayerAnalyses] = useState({});

  useEffect(() => {
    LEAGUES.forEach(async (league) => {
      const games = await fetchLeagueGames(league);
      setGamesData(prev => ({ ...prev, [league.id]: games }));
      setLoadingLeague(prev => ({ ...prev, [league.id]: false }));
    });
  }, []);

  const openGame = useCallback(async (league, game) => {
    const key = `${league.id}_${game.id}`;
    const isOpen = expanded[key];
    setExpanded(prev => ({ ...prev, [key]: !isOpen }));
    if (isOpen || boxScores[key] || boxLoading[key]) return;

    setBoxLoading(prev => ({ ...prev, [key]: true }));
    const players = await fetchBoxScore(league.summaryBase, game.id);
    setBoxScores(prev => ({ ...prev, [key]: players }));
    setBoxLoading(prev => ({ ...prev, [key]: false }));

    // Add to global player pool
    setAllPlayers(prev => {
      const tagged = players.slice(0, 4).map(p => ({ ...p, league: league.label, leagueColor: league.color }));
      const combined = [...prev, ...tagged];
      const seen = new Set();
      return combined.filter(p => { if (seen.has(p.name)) return false; seen.add(p.name); return true; })
        .sort((a, b) => b.jarvis - a.jarvis);
    });
  }, [expanded, boxScores, boxLoading]);

  const handleAnalyzePlayer = useCallback(async (player) => {
    if (playerAnalyses[player.name] || analyzingPlayer === player.name) return;
    setAnalyzingPlayer(player.name);
    try {
      const res = await fetch(`${API}/api/anthropic`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 500,
          messages: [{
            role: "user",
            content: `Tu es JARVIS HoopIQ, le scout NBA numéro 1 au monde.

**${player.name}** — ${player.pos} — ${player.teamName} (${player.league})
Stats : ${player.pts} pts / ${player.reb} reb / ${player.ast} ast / ${player.stl} stl / ${player.blk} blk
TS% ${player.ts}% — eFG% ${player.efg}% — A/T ${player.atr} — +/- ${player.pm} — FG: ${player.fgStr}
JARVIS Score : ${player.jarvis}/100${player.badge ? ` (${player.badge.icon} ${player.badge.label})` : ""}

Analyse en 4 points (2 lignes max chacun) :
**PROFIL** : type + comparaison NBA
**FORCES** : 2 atouts clés avec chiffres
**LIMITES** : point faible principal
🔮 **DANS 6 MOIS** : prédiction concrète (niveau NBA, draft position si NCAA, call-up si G-League)

Direct, data-driven, en français.`,
          }],
        }),
      });
      const data = await res.json();
      const text = data.content?.map(b => b.text || "").join("") || "Analyse indisponible.";
      setPlayerAnalyses(prev => ({ ...prev, [player.name]: text }));
    } catch {
      setPlayerAnalyses(prev => ({ ...prev, [player.name]: "❌ Erreur JARVIS." }));
    }
    setAnalyzingPlayer(null);
  }, [playerAnalyses, analyzingPlayer]);

  const league = LEAGUES.find(l => l.id === activeLeague);
  const games = gamesData[activeLeague] || [];
  const isLoading = loadingLeague[activeLeague];

  // Collect all players from active league's open games
  const activeGamesPlayers = Object.entries(boxScores)
    .filter(([key]) => key.startsWith(activeLeague))
    .flatMap(([, players]) => players)
    .reduce((acc, p) => {
      if (!acc.find(x => x.name === p.name)) acc.push(p);
      return acc;
    }, [])
    .sort((a, b) => b.jarvis - a.jarvis);

  return (
    <div className="fade-in">
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: "'Permanent Marker', cursive", fontSize: 46, letterSpacing: 2, lineHeight: 1, marginBottom: 4 }}>
          SCOUT <span style={{ color: C.orange }}>IA</span>
        </h1>
        <p style={{ color: C.muted, fontSize: 13 }}>G-League · NCAA — Stats avancées · JARVIS Score · Prédictions IA</p>
      </div>

      {/* League tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {LEAGUES.map(l => (
          <button key={l.id} onClick={() => setActiveLeague(l.id)} style={{
            padding: "9px 18px", borderRadius: 12, border: "none", cursor: "pointer",
            background: activeLeague === l.id ? `${l.color}22` : "rgba(255,255,255,0.04)",
            color: activeLeague === l.id ? l.color : C.muted,
            fontWeight: 700, fontSize: 13, fontFamily: "inherit",
            borderBottom: `2px solid ${activeLeague === l.id ? l.color : "transparent"}`,
            transition: "all .2s",
          }}>
            {l.icon} {l.label}
            {!loadingLeague[l.id] && gamesData[l.id]?.length > 0 && (
              <span style={{ marginLeft: 6, fontSize: 10, background: `${l.color}22`, color: l.color, padding: "1px 6px", borderRadius: 5 }}>
                {gamesData[l.id].length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: 20, alignItems: "start" }}>

        {/* Left: games + player cards */}
        <div>
          {/* Games list */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: league.color, letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>
              {league.label} — Matchs récents
            </div>
            {isLoading ? (
              <div style={{ padding: "24px", textAlign: "center", color: C.muted, fontSize: 13 }}>⏳ Chargement...</div>
            ) : games.length === 0 ? (
              <div style={{ padding: "28px", textAlign: "center", background: "rgba(255,255,255,0.02)", borderRadius: 14, border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🏀</div>
                <div style={{ color: C.muted, fontSize: 13 }}>Hors-saison {league.label}</div>
                <div style={{ color: C.muted, fontSize: 11, marginTop: 4 }}>Les matchs apparaissent en saison active.</div>
              </div>
            ) : (
              games.map(game => {
                const key = `${activeLeague}_${game.id}`;
                return (
                  <GameRow
                    key={key}
                    game={game}
                    league={league}
                    expanded={!!expanded[key]}
                    onToggle={() => openGame(league, game)}
                    players={boxScores[key] || []}
                    loading={!!boxLoading[key]}
                  />
                );
              })
            )}
          </div>

          {/* Player cards from open games */}
          {activeGamesPlayers.length > 0 && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, color: C.orange, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>
                🏆 Top Performers — Classement JARVIS
              </div>
              {activeGamesPlayers.map((p, i) => (
                <PlayerCard
                  key={p.id || p.name}
                  player={p}
                  leagueColor={league.color}
                  rank={i + 1}
                  onAnalyze={handleAnalyzePlayer}
                  isAnalyzing={analyzingPlayer === p.name}
                  isAnalyzed={!!playerAnalyses[p.name]}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right: JARVIS panel */}
        <div style={{ position: "sticky", top: 20 }}>
          <JarvisPanel allPlayers={allPlayers} />
        </div>
      </div>
    </div>
  );
}
