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

const API = (import.meta.env.DEV ? "http://localhost:3001" : "") + "";
const POLL_MS = 15000;
const ESPN_WNBA = "https://site.api.espn.com/apis/site/v2/sports/basketball/wnba";

function parseWnbaGames(data) {
  return (data.events || []).map(ev => {
    const comp = ev.competitions?.[0] || {};
    const competitors = comp.competitors || [];
    const home = competitors.find(c => c.homeAway === "home") || competitors[0] || {};
    const away = competitors.find(c => c.homeAway === "away") || competitors[1] || {};

    const stateId = ev.status?.type?.id;
    const status = stateId === "2" ? "live" : stateId === "3" ? "final" : "upcoming";

    const mapTeam = (c) => ({
      abbr: c.team?.abbreviation || "?",
      name: c.team?.displayName || "",
      short: c.team?.shortDisplayName || "",
      logo: c.team?.logo || "",
      color: "#" + (c.team?.color || "c084fc"),
      score: status === "upcoming" ? "-" : (c.score || "0"),
      pts_q: (c.linescores || []).map(l => l.value ?? l.displayValue ?? ""),
      record: c.records?.[0]?.summary || "",
    });

    const homeTeam = mapTeam(home);
    const awayTeam = mapTeam(away);
    const winProb = home.probabilities?.[0]?.homeWinPercentage;
    const prediction = winProb != null ? Math.round(winProb * 100) : 50;

    return {
      id: ev.id,
      league: "wnba",
      status,
      quarter: ev.status?.period || 0,
      clock: ev.status?.displayClock || "",
      home: homeTeam,
      away: awayTeam,
      prediction,
      ai_comment: `${homeTeam.abbr} accueille ${awayTeam.abbr}${status === "live" ? ` — Q${ev.status?.period} ${ev.status?.displayClock}` : status === "final" ? " — Match terminé" : " — À venir"}.`,
      momentum: null,
    };
  });
}

async function fetchWnbaDetail(gameId) {
  const res = await fetch(`${ESPN_WNBA}/summary?event=${gameId}`);
  if (!res.ok) throw new Error();
  const d = await res.json();
  const box = d.boxscore || {};
  const teams = (box.teams || []).map(t => ({
    abbr: t.team?.abbreviation,
    players: (t.statistics?.[0]?.athletes || t.players || []).map(p => {
      const stats = p.stats || [];
      return {
        name: p.athlete?.shortName || p.athlete?.displayName || "",
        headshot: p.athlete?.headshot?.href || null,
        pts: stats[18] ?? stats[13] ?? 0,
        reb: stats[6] ?? 0,
        ast: stats[7] ?? 0,
        pm: stats[20] ?? stats[15] ?? "",
        starter: p.starter ?? false,
      };
    }).filter(p => p.name),
  }));

  const teamStats = (box.teams || []).map(t => {
    const stats = t.statistics || [];
    const get = (k) => stats.find(s => s.name === k || s.abbreviation === k)?.displayValue || "0";
    return {
      abbr: t.team?.abbreviation,
      fg: get("fieldGoalsMade") || get("fieldGoals"),
      fgPct: get("fieldGoalPct"),
      tpPct: get("threePointPct"),
      reb: get("rebounds") || get("totalRebounds"),
      ast: get("assists"),
      to: get("turnovers"),
    };
  });

  const plays = (d.plays || []).slice(-30).reverse().map(p => ({
    period: p.period?.number || p.period || 1,
    clock: p.clock?.displayValue || "",
    text: p.text || "",
    scoring: p.scoringPlay || false,
    home: p.homeScore ?? "",
    away: p.awayScore ?? "",
  }));

  return { id: String(gameId), teams, teamStats, plays, winProbHome: null };
}

const lastWord = (n) => (n || "").split(" ").slice(-1)[0];
const numOf = (v) => parseInt(String(v).replace(/[^\d-]/g, ""), 10) || 0;

function extractYouTubeId(url) {
  if (!url) return null;
  const m = String(url).match(/(?:youtube\.com\/(?:watch\?v=|live\/|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  if (m) return m[1];
  const t = String(url).trim();
  return /^[A-Za-z0-9_-]{11}$/.test(t) ? t : null;
}

const watchMeta = (status) => {
  // Label always "Watch Live" for clarity; the search query still adapts to status.
  if (status === "live") return { label: "📺 Watch Live", kind: "live stream", live: true };
  if (status === "final") return { label: "📺 Watch Live", kind: "NBA highlights", live: false };
  return { label: "📺 Watch Live", kind: "NBA preview", live: false };
};

function WatchLiveModal({ game, onClose }) {
  const [videoId, setVideoId] = useState(null);
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("searching"); // searching | found | none
  const [manualUrl, setManualUrl] = useState("");
  const [manualErr, setManualErr] = useState(false);

  const meta = watchMeta(game.status);
  const query = `${game.home.name} vs ${game.away.name} ${meta.kind} NBA`;
  const ytSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch(`${API}/api/youtube/live?q=${encodeURIComponent(query)}&live=${meta.live}`);
        const data = await res.json().catch(() => ({}));
        if (!active) return;
        if (res.ok && data.videoId) { setVideoId(data.videoId); setTitle(data.title || ""); setStatus("found"); }
        else setStatus("none");
      } catch { if (active) setStatus("none"); }
    })();
    return () => { active = false; };
  }, [query, meta.live]);

  const playManual = () => {
    const id = extractYouTubeId(manualUrl);
    if (id) { setVideoId(id); setTitle("Lien manuel"); setManualErr(false); setStatus("found"); }
    else setManualErr(true);
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(2,2,8,0.82)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: "min(900px, 96vw)", maxHeight: "92vh", overflowY: "auto", background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 18, boxShadow: "0 30px 80px rgba(0,0,0,0.6)" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {game.status === "live" ? (
              <span style={{ display: "flex", alignItems: "center", gap: 6, padding: "3px 10px", background: "rgba(255,77,109,0.15)", borderRadius: 6, border: "1px solid rgba(255,77,109,0.3)" }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.red, animation: "pulse 1s infinite" }} />
                <span style={{ fontSize: 10, color: C.red, fontWeight: 800 }}>LIVE</span>
              </span>
            ) : (
              <span style={{ padding: "3px 10px", background: "rgba(255,255,255,0.06)", borderRadius: 6, fontSize: 10, color: C.muted, fontWeight: 800 }}>{game.status === "final" ? "REPLAY" : "PREVIEW"}</span>
            )}
            <span style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 20, letterSpacing: 1 }}>
              <span style={{ color: game.home.color }}>{game.home.abbr}</span> <span style={{ color: C.muted }}>vs</span> <span style={{ color: game.away.color }}>{game.away.abbr}</span>
            </span>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.muted, fontSize: 22, cursor: "pointer", lineHeight: 1 }}>✕</button>
        </div>

        {/* Player */}
        <div style={{ position: "relative", width: "100%", aspectRatio: "16 / 9", background: "#000" }}>
          {status === "found" && videoId ? (
            <iframe
              title="Live stream"
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
            />
          ) : (
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, color: C.muted, textAlign: "center", padding: 20 }}>
              {status === "searching" ? (
                <>
                  <div style={{ width: 36, height: 36, border: `3px solid ${C.border}`, borderTopColor: C.orange, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                  <div style={{ fontSize: 13 }}>Recherche du stream en cours…</div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 40 }}>📺</div>
                  <div style={{ fontSize: 14, color: C.text }}>Aucun stream trouvé automatiquement</div>
                  <div style={{ fontSize: 12, maxWidth: 420 }}>Active la recherche auto avec une clé <code>YOUTUBE_API_KEY</code>, colle un lien YouTube Live ci-dessous, ou cherche directement sur YouTube.</div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Controls */}
        <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
          {title && status === "found" && <div style={{ fontSize: 12, color: C.muted }}>▶️ {title}</div>}

          <div>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1, color: C.muted, textTransform: "uppercase", marginBottom: 6 }}>Coller un lien YouTube Live</div>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={manualUrl}
                onChange={e => { setManualUrl(e.target.value); setManualErr(false); }}
                onKeyDown={e => e.key === "Enter" && playManual()}
                placeholder="https://www.youtube.com/watch?v=..."
                style={{ flex: 1, padding: "9px 12px", borderRadius: 8, background: "rgba(255,255,255,0.05)", border: `1px solid ${manualErr ? C.red : C.border}`, color: C.text, fontSize: 12, outline: "none", fontFamily: "inherit" }}
              />
              <button onClick={playManual} style={{ padding: "9px 16px", borderRadius: 8, border: "none", background: `linear-gradient(135deg,${C.orange},#ff8c42)`, color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>▶ Lire</button>
            </div>
            {manualErr && <div style={{ fontSize: 11, color: C.red, marginTop: 4 }}>Lien YouTube invalide.</div>}
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <a href={ytSearchUrl} target="_blank" rel="noopener noreferrer" style={{ flex: 1, minWidth: 160, textAlign: "center", padding: "9px 14px", borderRadius: 8, border: `1px solid ${C.border}`, background: "rgba(255,255,255,0.04)", color: C.text, fontSize: 12, fontWeight: 700, textDecoration: "none" }}>🔎 Chercher sur YouTube</a>
            <a href="https://www.nba.com/watch" target="_blank" rel="noopener noreferrer" style={{ flex: 1, minWidth: 160, textAlign: "center", padding: "9px 14px", borderRadius: 8, border: `1px solid rgba(255,92,0,0.3)`, background: "rgba(255,92,0,0.06)", color: C.orange, fontSize: 12, fontWeight: 700, textDecoration: "none" }}>🏀 NBA League Pass (officiel)</a>
          </div>

          <div style={{ fontSize: 10, color: C.muted, textAlign: "center", lineHeight: 1.5 }}>
            HoopIQ n'héberge aucun flux. Le lecteur intègre uniquement des vidéos YouTube publiques. Pour les diffusions officielles, utilise NBA League Pass ou les chaînes TV détentrices des droits.
          </div>
        </div>
      </div>
    </div>
  );
}

function Logo({ url, size = 26 }) {
  const [ok, setOk] = useState(true);
  if (!url || !ok) return null;
  return <img src={url} alt="" width={size} height={size} onError={() => setOk(false)} style={{ objectFit: "contain", filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.5))" }} />;
}

function TeamScore({ team, score, pts_q, quarter, side }) {
  return (
    <div style={{ textAlign: side === "away" ? "right" : "left", flex: 1 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexDirection: side === "away" ? "row-reverse" : "row" }}>
        <Logo url={team.logo} size={40} />
        <div>
          <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 15, color: team.color, letterSpacing: 2 }}>{team.abbr}</div>
          <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.2 }}>{team.short || lastWord(team.name)}</div>
          {team.record && <div style={{ fontSize: 10, color: C.muted, opacity: 0.7 }}>{team.record}</div>}
        </div>
      </div>
      <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 54, lineHeight: 1, marginTop: 6, color: "#fff" }}>{score}</div>
      <div style={{ display: "flex", gap: 3, marginTop: 4, flexDirection: side === "away" ? "row-reverse" : "row", flexWrap: "wrap" }}>
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
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 12px", background: "rgba(255,77,109,0.15)", borderRadius: 6, border: "1px solid rgba(255,77,109,0.3)" }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.red, animation: "pulse 1s infinite" }} />
        <span style={{ fontSize: 11, color: C.red, fontWeight: 800 }}>LIVE</span>
      </div>
      <div style={{ fontSize: 12, color: C.text, fontWeight: 700, textAlign: "center" }}>Q{quarter} · {clock}</div>
    </div>
  );
}

function PredBar({ pct, home, away, label = "Prédiction IA" }) {
  return (
    <div style={{ margin: "10px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 5 }}>
        <span style={{ color: home.color, fontWeight: 700 }}>{pct}% {home.abbr}</span>
        <span style={{ color: C.muted, fontSize: 10 }}>{label}</span>
        <span style={{ color: away.color, fontWeight: 700 }}>{100 - pct}% {away.abbr}</span>
      </div>
      <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden", display: "flex" }}>
        <div style={{ width: `${pct}%`, background: home.color, transition: "width 1s ease" }} />
        <div style={{ flex: 1, background: away.color }} />
      </div>
    </div>
  );
}

function StatCompare({ label, homeRaw, awayRaw, homeColor, awayColor }) {
  const h = numOf(homeRaw), a = numOf(awayRaw);
  const total = h + a || 1;
  const hPct = Math.round((h / total) * 100);
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
        <strong style={{ color: C.text }}>{homeRaw || 0}</strong>
        <span style={{ color: C.muted, fontSize: 10, textTransform: "uppercase", letterSpacing: 1 }}>{label}</span>
        <strong style={{ color: C.text }}>{awayRaw || 0}</strong>
      </div>
      <div style={{ height: 5, background: "rgba(255,255,255,0.05)", borderRadius: 4, overflow: "hidden", display: "flex" }}>
        <div style={{ width: `${hPct}%`, background: homeColor, transition: "width .6s ease" }} />
        <div style={{ flex: 1, background: awayColor }} />
      </div>
    </div>
  );
}

function BoxScore({ team, color }) {
  if (!team || !team.players?.length) return null;
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <div style={{ width: 8, height: 18, background: color, borderRadius: 2 }} />
        <span style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 16, color, letterSpacing: 1 }}>{team.abbr}</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 30px 30px 30px 38px", gap: 4, fontSize: 9, color: C.muted, fontWeight: 800, padding: "0 8px 6px", textTransform: "uppercase", letterSpacing: 0.5 }}>
        <span>Joueur</span><span style={{ textAlign: "center" }}>PTS</span><span style={{ textAlign: "center" }}>REB</span><span style={{ textAlign: "center" }}>AST</span><span style={{ textAlign: "center" }}>+/-</span>
      </div>
      {team.players.map((p, i) => (
        <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 30px 30px 30px 38px", gap: 4, alignItems: "center", fontSize: 12, padding: "6px 8px", borderRadius: 8, background: i % 2 ? "rgba(255,255,255,0.02)" : "transparent" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
            {p.headshot
              ? <img src={p.headshot} alt="" width={22} height={22} style={{ borderRadius: "50%", background: "rgba(255,255,255,0.05)", objectFit: "cover", flexShrink: 0 }} />
              : <div style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(255,255,255,0.06)", flexShrink: 0 }} />}
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: p.starter ? C.text : "#aab" }}>
              {p.name}{p.starter ? "" : ""} {p.pts >= 25 ? "🔥" : ""}
            </span>
          </div>
          <span style={{ textAlign: "center", fontWeight: 800, color }}>{p.pts}</span>
          <span style={{ textAlign: "center", color: C.text }}>{p.reb}</span>
          <span style={{ textAlign: "center", color: C.text }}>{p.ast}</span>
          <span style={{ textAlign: "center", color: numOf(p.pm) > 0 ? C.green : numOf(p.pm) < 0 ? C.red : C.muted, fontSize: 11 }}>{p.pm || "—"}</span>
        </div>
      ))}
    </div>
  );
}

// Playlist YouTube NBA Hype — remplace l'ID par ta propre playlist si besoin
const NBA_PLAYLIST_ID = "PLRBp0Fe2GpgmsW46rJyudVFlY6IYjFBIm";

function NBAMusicPlayer({ visible }) {
  const [playing, setPlaying] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const iframeKey = useRef(0);

  const embedSrc = `https://www.youtube.com/embed/videoseries?list=${NBA_PLAYLIST_ID}&autoplay=1&rel=0&modestbranding=1`;

  const togglePlay = () => {
    if (!playing) iframeKey.current += 1;
    setPlaying(p => !p);
  };

  if (!visible) return null;

  return (
    <div style={{
      position: "sticky", bottom: 0, zIndex: 50,
      background: "rgba(10,10,22,0.97)", backdropFilter: "blur(16px)",
      borderTop: `1px solid rgba(255,215,0,0.2)`,
      boxShadow: "0 -8px 32px rgba(0,0,0,0.5)",
    }}>
      {/* Iframe visible uniquement si expanded + playing */}
      {expanded && playing && (
        <div style={{ width: "100%", background: "#000", overflow: "hidden" }}>
          <iframe
            key={iframeKey.current}
            title="NBA Hype Music"
            src={embedSrc}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ display: "block", width: "100%", height: 220, border: "none" }}
          />
        </div>
      )}

      {/* Iframe audio-only quand playing mais pas expanded */}
      {!expanded && playing && (
        <iframe
          key={`audio-${iframeKey.current}`}
          title="NBA Hype Music (audio)"
          src={embedSrc}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          style={{ display: "none" }}
        />
      )}

      {/* Barre de contrôle */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 20px" }}>
        {/* Badge */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "3px 10px", background: "rgba(255,215,0,0.1)", border: "1px solid rgba(255,215,0,0.25)", borderRadius: 20, flexShrink: 0 }}>
          {playing && <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.gold, animation: "pulse 1s infinite", display: "inline-block" }} />}
          <span style={{ fontSize: 14 }}>🎵</span>
          <span style={{ fontSize: 10, fontWeight: 800, color: C.gold, letterSpacing: 1.5, textTransform: "uppercase" }}>NBA Hype</span>
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: playing ? C.text : C.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", transition: "color .2s" }}>
            {playing ? "🏀 NBA Hype Playlist — en cours" : "Ambient NBA music en attente du match…"}
          </div>
          <div style={{ fontSize: 10, color: C.muted, marginTop: 1 }}>HoopIQ Radio · YouTube</div>
        </div>

        {/* Bouton Play / Pause */}
        <button onClick={togglePlay} style={{
          padding: "8px 20px", borderRadius: 20, cursor: "pointer", fontFamily: "inherit",
          fontWeight: 800, fontSize: 12, display: "flex", alignItems: "center", gap: 7,
          border: playing ? "1px solid rgba(255,77,109,0.35)" : "none",
          background: playing
            ? "rgba(255,77,109,0.14)"
            : `linear-gradient(135deg,${C.gold},#ffb300)`,
          color: playing ? C.red : "#000",
          transition: "all .2s",
        }}>
          {playing ? "⏸ Pause" : "▶ Lancer la musique"}
        </button>

        {/* Bouton voir la vidéo */}
        <button onClick={() => setExpanded(e => !e)} style={{
          background: "none", border: `1px solid ${C.border}`, color: expanded ? C.orange : C.muted,
          fontSize: 11, cursor: "pointer", padding: "6px 12px", borderRadius: 8, fontFamily: "inherit",
          transition: "color .15s",
        }}>
          {expanded ? "▾ Réduire" : "▸ Vidéo"}
        </button>
      </div>
    </div>
  );
}

export default function LiveCenter() {
  const [games, setGames] = useState([]);
  const [wnbaGames, setWnbaGames] = useState([]);
  const [leagueFilter, setLeagueFilter] = useState("all");
  const [selectedId, setSelectedId] = useState(null);
  const [selectedLeague, setSelectedLeague] = useState("nba");
  const [detail, setDetail] = useState(null);
  const [centerTab, setCenterTab] = useState("box"); // box | stats
  const [feedTab, setFeedTab] = useState("ia"); // ia | plays
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [watchGame, setWatchGame] = useState(null);
  const [aiMessages, setAiMessages] = useState([
    { id: 1, text: "🏀 HoopIQ Live Center activé ! Données NBA en direct via ESPN.", time: "--:--", type: "system" },
  ]);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const feedRef = useRef(null);
  const prevScores = useRef({});
  const seeded = useRef(false);

  const now = () => new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  // ---- Fetch NBA game list + poll ----
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await fetch(`${API}/api/nba/livecenter`);
        if (!res.ok) throw new Error("fetch failed");
        const data = await res.json();
        if (!active) return;
        const list = (data.games || []).map(g => ({ ...g, league: "nba" }));
        setGames(list);
        setError(false);
        setLoading(false);

        if (!seeded.current) {
          seeded.current = true;
          const liveComments = list.filter(g => g.status === "live").slice(0, 3).map((g, i) => ({
            id: 100 + i, text: g.ai_comment, time: now(), type: "analysis",
            game: `${g.home.abbr} vs ${g.away.abbr}`,
          }));
          if (liveComments.length) setAiMessages(prev => [...prev, ...liveComments]);
        }

        list.filter(g => g.status === "live").forEach(g => {
          const sig = `${g.home.score}-${g.away.score}`;
          if (prevScores.current[g.id] && prevScores.current[g.id] !== sig) {
            setAiMessages(prev => [...prev.slice(-25), {
              id: Date.now() + g.home.score + g.away.score,
              text: `${g.ai_comment} (${g.home.abbr} ${g.home.score}–${g.away.score} ${g.away.abbr})`,
              time: now(), type: "alert", game: `${g.home.abbr} vs ${g.away.abbr}`,
            }]);
            setTimeout(() => feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: "smooth" }), 100);
          }
          prevScores.current[g.id] = sig;
        });
      } catch {
        if (!active) return;
        setError(true);
        setLoading(false);
      }
    }
    load();
    const interval = setInterval(load, POLL_MS);
    return () => { active = false; clearInterval(interval); };
  }, []);

  // ---- Fetch WNBA games + poll ----
  useEffect(() => {
    let active = true;
    async function loadWnba() {
      try {
        const res = await fetch(`${ESPN_WNBA}/scoreboard`);
        if (!res.ok) return;
        const data = await res.json();
        if (!active) return;
        const list = parseWnbaGames(data);
        setWnbaGames(list);
        setLoading(false);

        // auto-select first game if nothing selected yet
        setSelectedId(prev => {
          if (prev) return prev;
          const live = list.find(g => g.status === "live");
          return (live || list[0])?.id ?? null;
        });
      } catch { /* WNBA fetch is best-effort */ }
    }
    loadWnba();
    const iv = setInterval(loadWnba, POLL_MS);
    return () => { active = false; clearInterval(iv); };
  }, []);

  // ---- Fetch detail for selected game + poll ----
  useEffect(() => {
    if (!selectedId) return;
    let active = true;
    async function loadDetail() {
      try {
        if (selectedLeague === "wnba") {
          const d = await fetchWnbaDetail(selectedId);
          if (active) setDetail(d);
        } else {
          const res = await fetch(`${API}/api/nba/game/${selectedId}`);
          if (!res.ok) throw new Error();
          const d = await res.json();
          if (active) setDetail(d);
        }
      } catch {
        if (active) setDetail(null);
      }
    }
    loadDetail();
    const iv = setInterval(loadDetail, POLL_MS);
    return () => { active = false; clearInterval(iv); };
  }, [selectedId, selectedLeague]);

  const allGames = [
    ...games,
    ...wnbaGames.filter(w => !games.some(n => n.id === w.id)),
  ];
  const visibleGames = leagueFilter === "nba" ? games
    : leagueFilter === "wnba" ? wnbaGames
    : allGames;

  const selectedGame = allGames.find(g => g.id === selectedId) || allGames[0] || null;
  const det = detail && selectedGame && detail.id === String(selectedGame.id) ? detail : null;

  // win prob: prefer real ESPN curve, fallback to heuristic
  const winPct = selectedGame
    ? (det && det.winProbHome != null ? det.winProbHome : selectedGame.prediction)
    : 50;
  const winLabel = det && det.winProbHome != null ? "Win Probability (ESPN)" : "Prédiction IA";

  const homeBox = det?.teams?.find(t => t.abbr === selectedGame?.home.abbr);
  const awayBox = det?.teams?.find(t => t.abbr === selectedGame?.away.abbr);
  const homeStats = det?.teamStats?.find(t => t.abbr === selectedGame?.home.abbr);
  const awayStats = det?.teamStats?.find(t => t.abbr === selectedGame?.away.abbr);

  const askAI = async () => {
    if (!aiInput.trim() || aiLoading) return;
    const msg = aiInput.trim();
    setAiInput("");
    setAiMessages(prev => [...prev, { id: Date.now(), text: msg, time: now(), type: "user" }]);
    setAiLoading(true);
    try {
      const liveInfo = games.filter(g => g.status === "live").map(g => `${g.home.abbr} ${g.home.score} - ${g.away.abbr} ${g.away.score} (Q${g.quarter} ${g.clock})`).join(", ") || "aucun match live actuellement";
      const selInfo = selectedGame ? `Match sélectionné: ${selectedGame.home.name} ${selectedGame.home.score} - ${selectedGame.away.score} ${selectedGame.away.name}.` : "";
      const res = await fetch(`${API}/api/anthropic`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001", max_tokens: 300,
          system: `Tu es HoopIQ Live Analyst, commentateur NBA en direct. Tu analyses les matchs de façon passionnée et concise. ${selInfo} Matchs live: ${liveInfo}. Réponds en 2-3 phrases max, en français, avec des emojis basketball.`,
          messages: [{ role: "user", content: msg }]
        })
      });
      const data = await res.json();
      const reply = data.content?.map(b => b.text || "").join("") || "Analyse indisponible.";
      setAiMessages(prev => [...prev, { id: Date.now() + 1, text: reply, time: now(), type: "analysis" }]);
    } catch {
      setAiMessages(prev => [...prev, { id: Date.now() + 1, text: "❌ Erreur connexion IA.", time: "--:--", type: "system" }]);
    }
    setAiLoading(false);
    setTimeout(() => feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: "smooth" }), 100);
    setFeedTab("ia");
  };

  const liveCount = allGames.filter(g => g.status === "live").length;
  const upcomingCount = allGames.filter(g => g.status === "upcoming").length;
  const finalCount = allGames.filter(g => g.status === "final").length;
  const wnbaLiveCount = wnbaGames.filter(g => g.status === "live").length;

  const tabBtn = (active) => ({
    flex: 1, padding: "9px 0", borderRadius: 8, border: "none", cursor: "pointer", fontFamily: "inherit",
    fontSize: 11, fontWeight: 800, letterSpacing: 0.5, textTransform: "uppercase",
    background: active ? "rgba(255,92,0,0.12)" : "transparent",
    color: active ? C.orange : C.muted,
    transition: "all .15s",
  });

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;600;700;900&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: ${C.orange}; border-radius: 4px; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes slideIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to { transform: rotate(360deg); } }
        .game-card:hover { border-color: rgba(255,92,0,0.4) !important; transform: translateY(-2px); }
      `}</style>

      {/* Header */}
      <div style={{ background: "rgba(6,6,15,0.95)", backdropFilter: "blur(20px)", borderBottom: `1px solid ${C.border}`, padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: liveCount ? C.red : C.muted, animation: liveCount ? "pulse 1s infinite" : "none" }} />
          <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 20, background: `linear-gradient(135deg,${C.orange},${C.gold})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: 3 }}>HOOP IQ · LIVE CENTER</div>
        </div>
        <div style={{ display: "flex", gap: 16, fontSize: 12, color: C.muted, alignItems: "center" }}>
          <span style={{ color: liveCount ? C.red : C.muted }}>🔴 {liveCount} live</span>
          {wnbaLiveCount > 0 && <span style={{ color: C.purple }}>🌸 {wnbaLiveCount} WNBA live</span>}
          <span>{upcomingCount} à venir</span>
          <span>{finalCount} terminés</span>
        </div>
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "calc(100vh - 60px)", gap: 16, color: C.muted }}>
          <div style={{ width: 36, height: 36, border: `3px solid ${C.border}`, borderTopColor: C.orange, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          <div style={{ fontSize: 13 }}>Chargement des matchs NBA & WNBA en direct…</div>
        </div>
      ) : error ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "calc(100vh - 60px)", gap: 10, color: C.muted }}>
          <div style={{ fontSize: 40 }}>📡</div>
          <div style={{ fontSize: 14, color: C.text }}>Impossible de joindre le serveur NBA</div>
          <div style={{ fontSize: 12 }}>Vérifie que le backend tourne (npm run dev:all) sur le port 3001.</div>
        </div>
      ) : allGames.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "calc(100vh - 60px)", gap: 10, color: C.muted }}>
          <div style={{ fontSize: 40 }}>🏀</div>
          <div style={{ fontSize: 14, color: C.text }}>Aucun match NBA ou WNBA programmé aujourd'hui</div>
          <div style={{ fontSize: 12 }}>Reviens un soir de match pour le suivi en direct !</div>
        </div>
      ) : (
      <div style={{ display: "grid", gridTemplateColumns: "340px 1fr 320px", gap: 0, height: "calc(100vh - 60px)" }}>

        {/* LEFT — Game list */}
        <div style={{ background: C.bg2, borderRight: `1px solid ${C.border}`, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column" }}>
          {/* League toggle */}
          <div style={{ display: "flex", gap: 4, marginBottom: 14, background: "rgba(255,255,255,0.04)", padding: 3, borderRadius: 10, border: `1px solid ${C.border}` }}>
            {[
              { id: "all", label: "Tous", count: allGames.length },
              { id: "nba", label: "🏀 NBA", count: games.length },
              { id: "wnba", label: "🌸 WNBA", count: wnbaGames.length },
            ].map(f => (
              <button key={f.id} onClick={() => setLeagueFilter(f.id)} style={{
                flex: 1, padding: "6px 4px", borderRadius: 7, border: "none", cursor: "pointer", fontFamily: "inherit",
                fontSize: 11, fontWeight: 800, transition: "all .15s",
                background: leagueFilter === f.id ? (f.id === "wnba" ? "rgba(192,132,252,0.18)" : "rgba(255,92,0,0.15)") : "transparent",
                color: leagueFilter === f.id ? (f.id === "wnba" ? C.purple : C.orange) : C.muted,
              }}>{f.label} <span style={{ opacity: 0.6 }}>({f.count})</span></button>
            ))}
          </div>

          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2, color: C.muted, textTransform: "uppercase", marginBottom: 12, fontFamily: "monospace" }}>Matchs du soir</div>

          {visibleGames.length === 0 && (
            <div style={{ textAlign: "center", padding: "24px 0", color: C.muted, fontSize: 12 }}>
              {leagueFilter === "wnba" ? "Aucun match WNBA aujourd'hui" : "Aucun match NBA aujourd'hui"}
            </div>
          )}

          {visibleGames.map(game => {
            const isWnba = game.league === "wnba";
            const isSelected = selectedGame && selectedGame.id === game.id;
            const accentColor = isWnba ? C.purple : C.orange;
            return (
              <div key={game.id} className="game-card" onClick={() => { setSelectedId(game.id); setSelectedLeague(isWnba ? "wnba" : "nba"); setDetail(null); }} style={{
                background: isSelected ? (isWnba ? "rgba(192,132,252,0.07)" : "rgba(255,92,0,0.07)") : C.surface,
                border: `1px solid ${isSelected ? (isWnba ? "rgba(192,132,252,0.35)" : "rgba(255,92,0,0.35)") : C.border}`,
                borderRadius: 14, padding: "12px 14px", marginBottom: 10, cursor: "pointer", transition: "all .2s",
              }}>
                {/* League badge + status */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {isWnba && (
                      <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1, color: C.purple, background: "rgba(192,132,252,0.14)", padding: "2px 7px", borderRadius: 5, border: "1px solid rgba(192,132,252,0.25)" }}>🌸 WNBA</span>
                    )}
                    <LiveBadge status={game.status} quarter={game.quarter} clock={game.clock} />
                  </div>
                  {game.momentum && <span style={{ fontSize: 10, color: (game.momentum === game.home.abbr ? game.home.color : game.away.color), fontWeight: 800 }}>↑ {game.momentum}</span>}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Logo url={game.home.logo} size={28} />
                    <div>
                      <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 14, color: game.home.color }}>{game.home.abbr}</div>
                      <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 26, lineHeight: 1 }}>{game.home.score}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: C.muted }}>vs</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexDirection: "row-reverse" }}>
                    <Logo url={game.away.logo} size={28} />
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 14, color: game.away.color }}>{game.away.abbr}</div>
                      <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 26, lineHeight: 1 }}>{game.away.score}</div>
                    </div>
                  </div>
                </div>
                <PredBar pct={game.prediction} home={game.home} away={game.away} />
                {!isWnba && (
                  <button onClick={(e) => { e.stopPropagation(); setWatchGame(game); }} style={{
                    width: "100%", marginTop: 4, padding: "8px 0", borderRadius: 9,
                    border: `1px solid ${game.status === "live" ? "rgba(255,77,109,0.35)" : C.border}`,
                    background: game.status === "live" ? "rgba(255,77,109,0.1)" : "rgba(255,255,255,0.04)",
                    color: game.status === "live" ? C.red : C.muted, fontWeight: 800, fontSize: 12, cursor: "pointer", fontFamily: "inherit",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  }}>{watchMeta(game.status).label}</button>
                )}
              </div>
            );
          })}
        </div>

        {/* CENTER — Match detail */}
        <div style={{ overflowY: "auto", padding: 24 }}>
          {selectedGame && (
            <div style={{ animation: "fadeUp .3s ease" }} key={selectedGame.id}>
              {/* Scoreboard */}
              <div style={{ background: selectedGame.league === "wnba"
                  ? `linear-gradient(160deg, rgba(192,132,252,0.12), rgba(0,0,0,0.5), rgba(192,132,252,0.08))`
                  : `linear-gradient(160deg, ${selectedGame.home.color}15, rgba(0,0,0,0.5), ${selectedGame.away.color}15)`,
                border: `1px solid ${selectedGame.league === "wnba" ? "rgba(192,132,252,0.2)" : "rgba(255,255,255,0.08)"}`,
                borderRadius: 20, padding: "28px 32px", marginBottom: 20 }}>
                {selectedGame.league === "wnba" && (
                  <div style={{ marginBottom: 12 }}>
                    <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2, color: C.purple, background: "rgba(192,132,252,0.12)", padding: "3px 12px", borderRadius: 6, border: "1px solid rgba(192,132,252,0.25)" }}>🌸 WNBA · EN DIRECT</span>
                  </div>
                )}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <TeamScore team={selectedGame.home} score={selectedGame.home.score} pts_q={selectedGame.home.pts_q} quarter={selectedGame.quarter} side="home" />
                  <div style={{ textAlign: "center", padding: "0 24px" }}>
                    <LiveBadge status={selectedGame.status} quarter={selectedGame.quarter} clock={selectedGame.clock} />
                    {selectedGame.status === "live" && selectedGame.momentum && (
                      <div style={{ marginTop: 12, fontSize: 11, color: C.muted }}>
                        Momentum → <span style={{ color: (selectedGame.momentum === selectedGame.home.abbr ? selectedGame.home.color : selectedGame.away.color), fontWeight: 800 }}>{selectedGame.momentum}</span>
                      </div>
                    )}
                  </div>
                  <TeamScore team={selectedGame.away} score={selectedGame.away.score} pts_q={selectedGame.away.pts_q} quarter={selectedGame.quarter} side="away" />
                </div>
                <div style={{ marginTop: 16 }}>
                  <PredBar pct={winPct} home={selectedGame.home} away={selectedGame.away} label={winLabel} />
                </div>
                {selectedGame.league !== "wnba" && (
                  <button onClick={() => setWatchGame(selectedGame)} style={{
                    width: "100%", marginTop: 14, padding: "11px 0", borderRadius: 11,
                    border: `1px solid ${selectedGame.status === "live" ? "rgba(255,77,109,0.4)" : "rgba(255,255,255,0.12)"}`,
                    background: selectedGame.status === "live" ? "linear-gradient(135deg, rgba(255,77,109,0.18), rgba(255,92,0,0.12))" : "rgba(255,255,255,0.05)",
                    color: "#fff", fontWeight: 800, fontSize: 14,
                    cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  }}>{watchMeta(selectedGame.status).label} — {selectedGame.home.abbr} vs {selectedGame.away.abbr}</button>
                )}
                {selectedGame.league === "wnba" && (
                  <a href="https://www.wnba.com/watch" target="_blank" rel="noopener noreferrer" style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    width: "100%", marginTop: 14, padding: "11px 0", borderRadius: 11, textDecoration: "none",
                    border: "1px solid rgba(192,132,252,0.3)",
                    background: "rgba(192,132,252,0.08)",
                    color: C.purple, fontWeight: 800, fontSize: 14, fontFamily: "inherit",
                  }}>🌸 Regarder sur WNBA.com</a>
                )}
              </div>

              {/* AI Comment */}
              {(() => {
                const isWnba = selectedGame.league === "wnba";
                const ac = isWnba ? C.purple : C.orange;
                return (
                  <div style={{ background: isWnba ? "rgba(192,132,252,0.06)" : "rgba(255,92,0,0.07)", border: `1px solid ${isWnba ? "rgba(192,132,252,0.2)" : "rgba(255,92,0,0.2)"}`, borderRadius: 14, padding: "14px 18px", marginBottom: 20, borderLeft: `3px solid ${ac}` }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: ac, fontFamily: "monospace", letterSpacing: 1.5, marginBottom: 6 }}>🤖 {isWnba ? "IA WNBA" : "IA LIVE"}</div>
                    <p style={{ fontSize: 14, color: "#dde", lineHeight: 1.6, margin: 0 }}>{selectedGame.ai_comment}</p>
                  </div>
                );
              })()}

              {/* Tabs */}
              <div style={{ display: "flex", gap: 6, background: C.surface, padding: 4, borderRadius: 12, marginBottom: 16, border: `1px solid ${C.border}` }}>
                <button onClick={() => setCenterTab("box")} style={tabBtn(centerTab === "box")}>📋 Box Score</button>
                <button onClick={() => setCenterTab("stats")} style={tabBtn(centerTab === "stats")}>📊 Stats équipes</button>
              </div>

              {!det ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 40, color: C.muted, gap: 12 }}>
                  <div style={{ width: 22, height: 22, border: `2px solid ${C.border}`, borderTopColor: C.orange, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                  <span style={{ fontSize: 12 }}>Chargement des stats détaillées…</span>
                </div>
              ) : centerTab === "box" ? (
                (homeBox?.players?.length || awayBox?.players?.length) ? (
                  <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20, display: "flex", gap: 24 }}>
                    <BoxScore team={homeBox} color={selectedGame.home.color} />
                    <div style={{ width: 1, background: C.border }} />
                    <BoxScore team={awayBox} color={selectedGame.away.color} />
                  </div>
                ) : (
                  <div style={{ textAlign: "center", padding: 40, color: C.muted, fontSize: 13 }}>Box score indisponible (match pas encore commencé).</div>
                )
              ) : (
                (homeStats && awayStats) ? (
                  <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 18, fontSize: 13, fontWeight: 800 }}>
                      <span style={{ color: selectedGame.home.color }}>{selectedGame.home.abbr}</span>
                      <span style={{ color: selectedGame.away.color }}>{selectedGame.away.abbr}</span>
                    </div>
                    <StatCompare label="Tirs (FG)" homeRaw={homeStats.fg} awayRaw={awayStats.fg} homeColor={selectedGame.home.color} awayColor={selectedGame.away.color} />
                    <StatCompare label="FG %" homeRaw={homeStats.fgPct} awayRaw={awayStats.fgPct} homeColor={selectedGame.home.color} awayColor={selectedGame.away.color} />
                    <StatCompare label="3 PTS %" homeRaw={homeStats.tpPct} awayRaw={awayStats.tpPct} homeColor={selectedGame.home.color} awayColor={selectedGame.away.color} />
                    <StatCompare label="Rebonds" homeRaw={homeStats.reb} awayRaw={awayStats.reb} homeColor={selectedGame.home.color} awayColor={selectedGame.away.color} />
                    <StatCompare label="Passes" homeRaw={homeStats.ast} awayRaw={awayStats.ast} homeColor={selectedGame.home.color} awayColor={selectedGame.away.color} />
                    <StatCompare label="Pertes de balle" homeRaw={homeStats.to} awayRaw={awayStats.to} homeColor={selectedGame.home.color} awayColor={selectedGame.away.color} />
                  </div>
                ) : (
                  <div style={{ textAlign: "center", padding: 40, color: C.muted, fontSize: 13 }}>Stats d'équipe indisponibles pour ce match.</div>
                )
              )}
            </div>
          )}
        </div>

        {/* RIGHT — AI feed / Play-by-play */}
        <div style={{ background: C.bg2, borderLeft: `1px solid ${C.border}`, display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "10px 12px", borderBottom: `1px solid ${C.border}`, display: "flex", gap: 6 }}>
            <button onClick={() => setFeedTab("ia")} style={tabBtn(feedTab === "ia")}>🤖 Fil IA</button>
            <button onClick={() => setFeedTab("plays")} style={tabBtn(feedTab === "plays")}>📋 Play-by-Play</button>
          </div>

          {feedTab === "ia" ? (
            <>
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
                  <button onClick={askAI} disabled={aiLoading} style={{ padding: "9px 14px", borderRadius: 8, border: "none", background: `linear-gradient(135deg,${C.orange},#ff8c42)`, color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>→</button>
                </div>
                <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                  {["Qui performe ?", "Prédis la suite", "Analyse le match"].map(s => (
                    <button key={s} onClick={() => setAiInput(s)} style={{ padding: "3px 8px", borderRadius: 10, border: `1px solid rgba(255,92,0,0.25)`, background: "rgba(255,92,0,0.05)", color: C.orange, fontSize: 10, cursor: "pointer", fontFamily: "inherit" }}>{s}</button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 8 }}>
              {!det ? (
                <div style={{ color: C.muted, fontSize: 12, textAlign: "center", padding: 20 }}>Chargement…</div>
              ) : det.plays?.length ? (
                det.plays.map((p, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, padding: "8px 10px", borderRadius: 8, background: p.scoring ? "rgba(34,211,122,0.07)" : "rgba(255,255,255,0.02)", border: `1px solid ${p.scoring ? "rgba(34,211,122,0.18)" : C.border}` }}>
                    <div style={{ flexShrink: 0, textAlign: "center", minWidth: 38 }}>
                      <div style={{ fontSize: 9, color: C.muted, fontFamily: "monospace" }}>Q{p.period}</div>
                      <div style={{ fontSize: 10, color: C.text, fontFamily: "monospace" }}>{p.clock}</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, color: "#dde", lineHeight: 1.4 }}>{p.text}</div>
                      <div style={{ fontSize: 10, color: p.scoring ? C.green : C.muted, fontWeight: 700, marginTop: 2, fontFamily: "monospace" }}>
                        {selectedGame.home.abbr} {p.home} – {p.away} {selectedGame.away.abbr}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ color: C.muted, fontSize: 12, textAlign: "center", padding: 20 }}>Pas encore d'actions (match à venir).</div>
              )}
            </div>
          )}
        </div>
      </div>
      )}

      <NBAMusicPlayer visible={!loading && !error && upcomingCount > 0} />

      {watchGame && <WatchLiveModal game={watchGame} onClose={() => setWatchGame(null)} />}
    </div>
  );
}
