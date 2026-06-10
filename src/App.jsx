import { useState, useEffect, useRef } from "react";
import Agent from "./Agent.jsx";
import Marketing from "./Marketing.jsx";
import Jarvis from "./Jarvis.jsx";
import Cards from "./Cards.jsx";
import LiveCenter from "./LiveCenter.jsx";
import Oracle from "./Oracle.jsx";
import Vestiaire from "./Vestiaire.jsx";
import PreMatch from "./PreMatch.jsx";
import Challenges from "./Challenges.jsx";
import Leaderboard from "./Leaderboard.jsx";
import Duel from "./Duel.jsx";
import Scout from "./Scout.jsx";
/* ─────────────────────────────────────────
   DESIGN SYSTEM
───────────────────────────────────────── */
const C = {
  bg: "#06060f",
  bg2: "#0d0d1f",
  surface: "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.07)",
  orange: "#ff5c00",
  orangeL: "#ff8c42",
  gold: "#f5c842",
  green: "#22d37a",
  red: "#ff4d6d",
  blue: "#4fa3ff",
  text: "#f0f0ff",
  muted: "#6b6b88",
};

const G = {
  orange: `linear-gradient(135deg, ${C.orange}, ${C.orangeL})`,
  gold: `linear-gradient(135deg, #f5c842, #ffaa00)`,
  dark: `linear-gradient(160deg, #0d0d1f 0%, #06060f 100%)`,
  glow: `radial-gradient(ellipse 60% 40% at 50% 0%, rgba(255,92,0,0.18) 0%, transparent 70%)`,
};

/* ─────────────────────────────────────────
   DATA
───────────────────────────────────────── */
const PLANS = [
  {
    id: "scout",
    name: "Scout",
    price: "9",
    period: "/ mois",
    color: C.blue,
    icon: "🔭",
    desc: "Pour les fans passionnés",
    features: ["5 analyses joueurs / mois", "Résultats en temps réel", "Stats de base", "1 ligue au choix"],
    locked: ["IA Chat illimité", "Prédictions avancées", "Export PDF", "API Access"],
  },
  {
    id: "pro",
    name: "Pro",
    price: "29",
    period: "/ mois",
    color: C.orange,
    icon: "⚡",
    desc: "Pour les analystes sérieux",
    popular: true,
    features: ["Analyses joueurs illimitées", "IA Chat 24/7", "Prédictions IA avancées", "Toutes les ligues", "Export PDF & Excel"],
    locked: ["API Access", "Accès équipe (5 users)"],
  },
  {
    id: "elite",
    name: "Elite",
    price: "89",
    period: "/ mois",
    color: C.gold,
    icon: "👑",
    desc: "Pour les clubs & agences",
    features: ["Tout le plan Pro", "API Access complète", "Équipe jusqu'à 20 users", "Dashboard personnalisé", "Support prioritaire 24/7", "Rapports automatisés"],
    locked: [],
  },
];

const PLAYERS = [
  { id: 1,  name: "Caitlin Clark",     pos: "PG", team: "Indiana Fever",      pts: 19.2, ast: 8.4, reb: 5.7,  fg: 40, score: 97, trend: +5, hot: true,  league: "wnba", espnId: 4433403 },
  { id: 2,  name: "A'ja Wilson",       pos: "C",  team: "Las Vegas Aces",     pts: 26.4, ast: 3.5, reb: 11.9, fg: 52, score: 98, trend: +3, hot: true,  league: "wnba", espnId: 3149391 },
  { id: 3,  name: "Breanna Stewart",   pos: "PF", team: "New York Liberty",   pts: 19.3, ast: 3.3, reb: 9.3,  fg: 45, score: 94, trend: +2, hot: true,  league: "wnba", espnId: 2998928 },
  { id: 4,  name: "Sabrina Ionescu",   pos: "PG", team: "New York Liberty",   pts: 17.4, ast: 8.1, reb: 4.5,  fg: 42, score: 92, trend: +1, hot: false, league: "wnba", espnId: 4066533 },
  { id: 5,  name: "Napheesa Collier",  pos: "PF", team: "Minnesota Lynx",     pts: 20.1, ast: 3.1, reb: 9.8,  fg: 51, score: 91, trend: +4, hot: true,  league: "wnba", espnId: 3917450 },
  { id: 6,  name: "Angel Reese",       pos: "PF", team: "Atlanta Dream",      pts: 13.1, ast: 2.2, reb: 13.1, fg: 44, score: 89, trend: +3, hot: true,  league: "wnba", espnId: 4433402 },
];

const NBA_TEAMS = [
  { id: 1,  name: "Atlanta Hawks",          abbr: "ATL", color: "#E03A3E" },
  { id: 2,  name: "Boston Celtics",         abbr: "BOS", color: "#007A33" },
  { id: 3,  name: "Brooklyn Nets",          abbr: "BKN", color: "#000000" },
  { id: 4,  name: "Chicago Bulls",          abbr: "CHI", color: "#CE1141" },
  { id: 5,  name: "Cleveland Cavaliers",    abbr: "CLE", color: "#860038" },
  { id: 6,  name: "Dallas Mavericks",       abbr: "DAL", color: "#00538C" },
  { id: 7,  name: "Denver Nuggets",         abbr: "DEN", color: "#0E2240" },
  { id: 8,  name: "Detroit Pistons",        abbr: "DET", color: "#C8102E" },
  { id: 9,  name: "Golden State Warriors",  abbr: "GSW", color: "#1D428A" },
  { id: 10, name: "Houston Rockets",        abbr: "HOU", color: "#CE1141" },
  { id: 11, name: "Indiana Pacers",         abbr: "IND", color: "#002D62" },
  { id: 12, name: "LA Clippers",            abbr: "LAC", color: "#C8102E" },
  { id: 13, name: "Los Angeles Lakers",     abbr: "LAL", color: "#552583" },
  { id: 14, name: "Memphis Grizzlies",      abbr: "MEM", color: "#5D76A9" },
  { id: 15, name: "Miami Heat",             abbr: "MIA", color: "#98002E" },
  { id: 16, name: "Milwaukee Bucks",        abbr: "MIL", color: "#00471B" },
  { id: 17, name: "Minnesota Timberwolves", abbr: "MIN", color: "#0C2340" },
  { id: 18, name: "New Orleans Pelicans",   abbr: "NOP", color: "#0C2340" },
  { id: 19, name: "New York Knicks",        abbr: "NYK", color: "#006BB6" },
  { id: 20, name: "Oklahoma City Thunder",  abbr: "OKC", color: "#007AC1" },
  { id: 21, name: "Orlando Magic",          abbr: "ORL", color: "#0077C0" },
  { id: 22, name: "Philadelphia 76ers",     abbr: "PHI", color: "#006BB6" },
  { id: 23, name: "Phoenix Suns",           abbr: "PHX", color: "#1D1160" },
  { id: 24, name: "Portland Trail Blazers", abbr: "POR", color: "#E03A3E" },
  { id: 25, name: "Sacramento Kings",       abbr: "SAC", color: "#5A2D81" },
  { id: 26, name: "San Antonio Spurs",      abbr: "SAS", color: "#C4CED4" },
  { id: 27, name: "Toronto Raptors",        abbr: "TOR", color: "#CE1141" },
  { id: 28, name: "Utah Jazz",              abbr: "UTA", color: "#002B5C" },
  { id: 29, name: "Washington Wizards",     abbr: "WAS", color: "#002B5C" },
  { id: 30, name: "Charlotte Hornets",      abbr: "CHA", color: "#1D1160" },
];


/* ─────────────────────────────────────────
   UTILS / ATOMS
───────────────────────────────────────── */

function Avatar({ name, size = 44, glow, espnId, headshot, league }) {
  const [imgError, setImgError] = useState(false);
  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const sport = league === "wnba" ? "wnba" : "nba";
  const photoUrl = headshot || (espnId ? `https://a.espncdn.com/combiner/i?img=/i/headshots/${sport}/players/full/${espnId}.png&w=200&h=146` : null);
  const showPhoto = photoUrl && !imgError;

  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0, overflow: "hidden",
      background: showPhoto ? "#111" : G.orange,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Bebas Neue', cursive", fontSize: size * 0.36, color: "#fff", letterSpacing: 1,
      boxShadow: glow ? `0 0 24px rgba(255,92,0,0.55)` : `0 2px 10px rgba(0,0,0,0.5)`,
      position: "relative",
    }}>
      {showPhoto ? (
        <img src={photoUrl} alt={name} onError={() => setImgError(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center" }} />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}

function Badge({ children, color = C.orange }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 800, padding: "2px 9px", borderRadius: 20,
      background: `${color}22`, color, border: `1px solid ${color}44`,
      letterSpacing: 1.2, textTransform: "uppercase", fontFamily: "monospace",
    }}>{children}</span>
  );
}

function Ring({ score, size = 68 }) {
  const r = size / 2 - 6, c = 2 * Math.PI * r;
  const col = score >= 90 ? C.orange : score >= 80 ? C.gold : C.green;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={5} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={col} strokeWidth={5}
        strokeDasharray={c} strokeDashoffset={c * (1 - score / 100)} strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 1.3s cubic-bezier(.4,0,.2,1)" }} />
      <text x={size / 2} y={size / 2 + 5} textAnchor="middle" fill="#fff"
        fontSize={size * 0.22} fontWeight={800} fontFamily="'Bebas Neue', cursive"
        style={{ transform: `rotate(90deg)`, transformOrigin: `${size / 2}px ${size / 2}px` }}>{score}</text>
    </svg>
  );
}

function Bar({ value, max = 100, color = C.orange }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 4, height: 5, overflow: "hidden" }}>
      <div style={{ width: `${Math.min(100, (value / max) * 100)}%`, height: "100%", background: color, borderRadius: 4, transition: "width 1s ease" }} />
    </div>
  );
}

function Btn({ children, onClick, variant = "primary", small, full, disabled, style: sx }) {
  const base = {
    border: "none", cursor: disabled ? "not-allowed" : "pointer", fontWeight: 700,
    borderRadius: 10, transition: "all .2s", fontFamily: "inherit",
    padding: small ? "8px 18px" : "13px 28px", fontSize: small ? 13 : 15,
    width: full ? "100%" : undefined, opacity: disabled ? 0.5 : 1,
  };
  const variants = {
    primary: { background: G.orange, color: "#fff", boxShadow: `0 4px 20px rgba(255,92,0,0.35)` },
    ghost: { background: "rgba(255,255,255,0.06)", color: C.text, border: `1px solid ${C.border}` },
    outline: { background: "transparent", color: C.orange, border: `1px solid ${C.orange}` },
    gold: { background: G.gold, color: "#1a0e00", boxShadow: `0 4px 20px rgba(245,200,66,0.35)` },
  };
  return <button style={{ ...base, ...variants[variant], ...sx }} onClick={onClick} disabled={disabled}>{children}</button>;
}

function Card({ children, style: sx, glow }) {
  return (
    <div style={{
      background: C.surface, border: `1px solid ${glow ? "rgba(255,92,0,0.3)" : C.border}`,
      borderRadius: 18, padding: 24, backdropFilter: "blur(12px)",
      boxShadow: glow ? `0 0 40px rgba(255,92,0,0.08)` : "none",
      ...sx,
    }}>{children}</div>
  );
}

function SectionTitle({ children }) {
  return <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2.5, color: C.orange, textTransform: "uppercase", marginBottom: 18, fontFamily: "monospace" }}>{children}</div>;
}

/* ─────────────────────────────────────────
   HOOPIQ RADIO
───────────────────────────────────────── */
const SPOTIFY_SRC = "https://open.spotify.com/embed/playlist/37i9dQZF1DX0XUsuxWHRQd?utm_source=generator&theme=0";

function HoopiqRadio() {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "fixed", bottom: 20, right: 20, zIndex: 1000,
        width: hovered ? 300 : 52, height: hovered ? 232 : 52,
        borderRadius: hovered ? 16 : "50%",
        overflow: "hidden",
        background: hovered ? "#121212" : "#1ed760",
        border: hovered ? "1px solid rgba(30,215,96,0.35)" : "none",
        boxShadow: "0 8px 32px rgba(0,0,0,0.8)",
        transition: "all 0.3s ease",
        cursor: "pointer",
      }}
    >
      {hovered ? (
        <>
          <div style={{
            height: 32, display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "0 12px", background: "#0d0d0d",
            borderBottom: "1px solid rgba(30,215,96,0.15)",
          }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: "#1ed760", letterSpacing: 1.5 }}>🎵 NBA HYPE HITS</span>
          </div>
          <iframe
            src={SPOTIFY_SRC}
            width="300" height="200"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            style={{ display: "block", border: "none" }}
          />
        </>
      ) : (
        <div style={{ width: 52, height: 52, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🎵</div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
   LANDING PAGE
───────────────────────────────────────── */
// Mix extérieurs + intérieurs (parquet/tribunes) d'arénas NBA — Wikimedia
const HERO_ARENAS = [
  "https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/United_Center_1.jpg/1280px-United_Center_1.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/United_Center_Interior.jpg/1280px-United_Center_Interior.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/Crypto.com_Arena_interior_-_Lakers_2022.jpg/1280px-Crypto.com_Arena_interior_-_Lakers_2022.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Madison_Square_Garden_court.jpg/1280px-Madison_Square_Garden_court.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Celtics_game_versus_the_Timberwolves%2C_February%2C_1_2009.jpg/1280px-Celtics_game_versus_the_Timberwolves%2C_February%2C_1_2009.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Chase_Center.jpg/1280px-Chase_Center.jpg",
];

function Landing({ onAuth }) {
  const [arenaIdx, setArenaIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setArenaIdx(i => (i + 1) % HERO_ARENAS.length), 8000);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${C.bg}; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: ${C.orange}; border-radius: 4px; }
        @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @keyframes pulse-ring { 0% { transform: scale(1); opacity:.8; } 100% { transform: scale(1.5); opacity:0; } }
        @keyframes slide-up { from { opacity:0; transform:translateY(30px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        .plan-card:hover { transform: translateY(-6px) !important; }
        .glow-btn:hover { box-shadow: 0 8px 40px rgba(255,92,0,0.6) !important; transform:translateY(-2px); }
        .fade-in { animation: slide-up .7s ease both; }
      `}</style>

      {/* NAV */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 200, padding: "0 40px", height: 66, display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(6,6,15,0.85)", backdropFilter: "blur(24px)", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 26, background: G.orange, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: 3 }}>HOOP IQ</div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn variant="ghost" small onClick={() => onAuth("login")}>Connexion</Btn>
          <Btn small onClick={() => onAuth("signup")} style={{ boxShadow: "0 4px 20px rgba(255,92,0,0.4)" }}>Commencer →</Btn>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "120px 24px 80px", position: "relative", overflow: "hidden" }}>
        {/* Arena slideshow background */}
        <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
          {HERO_ARENAS.map((src, i) => (
            <div key={i} style={{
              position: "absolute", inset: 0,
              backgroundImage: `url(${src})`, backgroundSize: "cover", backgroundPosition: "center",
              opacity: i === arenaIdx ? 1 : 0, transition: "opacity 2s ease-in-out",
            }} />
          ))}
        </div>
        {/* Dark overlay for text readability */}
        <div style={{ position: "absolute", inset: 0, zIndex: 1, background: "rgba(6,6,15,0.75)" }} />
        {/* Background glow */}
        <div style={{ position: "absolute", inset: 0, background: G.glow, pointerEvents: "none" }} />
        {/* Orbs */}
        <div style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,92,0,0.06) 0%, transparent 70%)", top: "10%", left: "10%", animation: "float 8s ease-in-out infinite" }} />
        <div style={{ position: "absolute", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(79,163,255,0.05) 0%, transparent 70%)", bottom: "20%", right: "15%", animation: "float 11s ease-in-out infinite reverse" }} />

        <div style={{ position: "relative", zIndex: 2, width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div className="fade-in" style={{ animationDelay: "0s" }}>
          <Badge color={C.orange}>🏀 IA Basket · Saison 2025-26</Badge>
        </div>

        <h1 className="fade-in" style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "clamp(60px, 10vw, 110px)", lineHeight: .9, marginTop: 24, letterSpacing: 2, animationDelay: ".1s" }}>
          L'INTELLIGENCE<br />
          <span style={{ background: G.orange, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>ARTIFICIELLE</span><br />
          DU BASKET
        </h1>

        <p className="fade-in" style={{ fontSize: 18, color: C.muted, maxWidth: 520, lineHeight: 1.8, marginTop: 24, fontFamily: "'DM Sans', sans-serif", animationDelay: ".2s" }}>
          Analyse en temps réel · Prédictions IA · Stats avancées · Scout de talent
          <br />Tout ce qu'il faut pour dominer le jeu.
        </p>

        <div className="fade-in" style={{ display: "flex", gap: 12, marginTop: 36, flexWrap: "wrap", justifyContent: "center", animationDelay: ".3s" }}>
          <button className="glow-btn" onClick={() => onAuth("signup")} style={{
            padding: "16px 36px", borderRadius: 12, border: "none", cursor: "pointer",
            background: G.orange, color: "#fff", fontWeight: 800, fontSize: 16,
            boxShadow: "0 4px 30px rgba(255,92,0,0.45)", transition: "all .2s", fontFamily: "'DM Sans', sans-serif",
          }}>Essai gratuit 14 jours →</button>
          <Btn variant="ghost" onClick={() => onAuth("login")}>Déjà membre ? Connexion</Btn>
        </div>

        {/* Social proof */}
        <div className="fade-in" style={{ marginTop: 48, display: "flex", gap: 32, alignItems: "center", animationDelay: ".4s" }}>
          {[["2 400+", "Analystes"], ["89%", "Précision IA"], ["48", "Ligues"]].map(([v, l]) => (
            <div key={l} style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 32, color: C.orange }}>{v}</div>
              <div style={{ fontSize: 12, color: C.muted, fontFamily: "'DM Sans', sans-serif" }}>{l}</div>
            </div>
          ))}
        </div>
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ padding: "80px 40px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <SectionTitle>Fonctionnalités</SectionTitle>
          <h2 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 52, letterSpacing: 1 }}>TOUT CE DONT TU AS <span style={{ color: C.orange }}>BESOIN</span></h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20 }}>
          {[
            { icon: "🤖", title: "IA Générative", desc: "Analyses textuelles détaillées générées par Claude pour chaque joueur et match." },
            { icon: "📊", title: "Stats Avancées", desc: "Plus de 120 métriques par joueur. Efficacité, impact, +/-, heat maps." },
            { icon: "🎯", title: "Prédictions", desc: "Algorithme ML entraîné sur 10 ans de data. 89% de précision sur les résultats." },
            { icon: "⚡", title: "Temps Réel", desc: "Live scoring, notifications push, alertes de performance pendant les matchs." },
            { icon: "📁", title: "Rapports PDF", desc: "Export automatique de rapports personnalisés pour ton staff ou tes clients." },
            { icon: "🔗", title: "API Access", desc: "Intègre HoopIQ dans tes propres outils. Endpoints REST documentés." },
          ].map((f) => (
            <Card key={f.title} sx={{ transition: "all .3s" }} style={{ transition: "all .3s" }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>{f.icon}</div>
              <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 22, letterSpacing: 1, marginBottom: 8 }}>{f.title}</div>
              <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.7, fontFamily: "'DM Sans', sans-serif" }}>{f.desc}</div>
            </Card>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section style={{ padding: "80px 40px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <SectionTitle>Tarifs</SectionTitle>
          <h2 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 52, letterSpacing: 1 }}>CHOISIS TON <span style={{ color: C.orange }}>NIVEAU</span></h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
          {PLANS.map((plan) => (
            <div key={plan.id} className="plan-card" style={{
              background: plan.popular ? `linear-gradient(160deg, rgba(255,92,0,0.1), rgba(255,140,66,0.05))` : C.surface,
              border: `1px solid ${plan.popular ? "rgba(255,92,0,0.4)" : C.border}`,
              borderRadius: 20, padding: 28, transition: "all .3s", cursor: "pointer", position: "relative",
              boxShadow: plan.popular ? `0 0 50px rgba(255,92,0,0.12)` : "none",
            }} onClick={() => onAuth("signup")}>
              {plan.popular && <div style={{ position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)", background: G.orange, color: "#fff", fontSize: 11, fontWeight: 800, padding: "4px 16px", borderRadius: 20, letterSpacing: 1.5, whiteSpace: "nowrap" }}>⚡ PLUS POPULAIRE</div>}
              <div style={{ fontSize: 40, marginBottom: 12 }}>{plan.icon}</div>
              <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 28, letterSpacing: 2, color: plan.color }}>{plan.name}</div>
              <div style={{ fontSize: 13, color: C.muted, marginBottom: 20, fontFamily: "'DM Sans', sans-serif" }}>{plan.desc}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 24 }}>
                <span style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 52, color: plan.color }}>{plan.price}€</span>
                <span style={{ color: C.muted, fontSize: 14 }}>{plan.period}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
                {plan.features.map(f => (
                  <div key={f} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>
                    <span style={{ color: C.green }}>✓</span> {f}
                  </div>
                ))}
                {plan.locked.map(f => (
                  <div key={f} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, color: C.muted, fontFamily: "'DM Sans', sans-serif" }}>
                    <span>🔒</span> {f}
                  </div>
                ))}
              </div>
              <Btn variant={plan.popular ? "primary" : plan.id === "elite" ? "gold" : "ghost"} full>
                Choisir {plan.name} →
              </Btn>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: `1px solid ${C.border}`, padding: "40px", textAlign: "center", color: C.muted, fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 22, background: G.orange, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 12 }}>HOOP IQ</div>
        © 2026 HoopIQ · Propulsé par Claude AI · Tous droits réservés
      </footer>
    </div>
  );
}

/* ─────────────────────────────────────────
   AUTH MODAL
───────────────────────────────────────── */
function AuthModal({ mode, onClose, onSuccess }) {
  const [m, setM] = useState(mode);
  const [step, setStep] = useState(m === "signup" ? 1 : 0); // 0=login, 1=info, 2=plan, 3=payment
  const [form, setForm] = useState({ name: "", email: "", password: "", plan: "pro" });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const field = (key) => ({
    value: form[key],
    onChange: (e) => setForm(f => ({ ...f, [key]: e.target.value })),
  });

  const inputStyle = {
    width: "100%", padding: "12px 16px", borderRadius: 10,
    background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`,
    color: C.text, fontSize: 14, outline: "none", fontFamily: "'DM Sans', sans-serif",
    transition: "border-color .2s",
  };

  const handleLogin = async () => {
    if (!form.email || !form.password) { setErrors({ general: "Remplis tous les champs." }); return; }
    // Accès admin secret
    if (form.email === "admin@hoopiq.com" && form.password === "bulls23") {
      onSuccess({ name: "Jorge", email: "admin@hoopiq.com", plan: "elite" });
      return;
    }
    setLoading(true);
    await new Promise(r => setTimeout(r, 900));
    setLoading(false);
    onSuccess({ name: form.email.split("@")[0], email: form.email, plan: "pro" });
  };

  const handleSignup = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    setLoading(false);
    onSuccess({ name: form.name || form.email.split("@")[0], email: form.email, plan: form.plan });
  };

  const selectedPlan = PLANS.find(p => p.id === form.plan);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.75)", backdropFilter: "blur(10px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 22, padding: 36, width: "100%", maxWidth: 440, position: "relative", boxShadow: "0 30px 100px rgba(0,0,0,0.7)" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", color: C.muted, fontSize: 22, cursor: "pointer" }}>×</button>

        <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 22, background: G.orange, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: 2, marginBottom: 24 }}>HOOP IQ</div>

        {/* LOGIN */}
        {m === "login" && (
          <div>
            <h2 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 34, letterSpacing: 1, marginBottom: 6 }}>Bon retour 👋</h2>
            <p style={{ color: C.muted, fontSize: 13, marginBottom: 24, fontFamily: "'DM Sans', sans-serif" }}>Connecte-toi pour accéder à ton dashboard</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <input style={inputStyle} placeholder="Email" type="email" {...field("email")} />
              <input style={inputStyle} placeholder="Mot de passe" type="password" {...field("password")} />
              {errors.general && <div style={{ color: C.red, fontSize: 13 }}>{errors.general}</div>}
              <Btn full onClick={handleLogin} disabled={loading}>{loading ? "Connexion..." : "Se connecter →"}</Btn>
            </div>
            <div style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: C.muted, fontFamily: "'DM Sans', sans-serif" }}>
              Pas encore membre ?{" "}
              <span style={{ color: C.orange, cursor: "pointer", fontWeight: 700 }} onClick={() => { setM("signup"); setStep(1); }}>S'inscrire</span>
            </div>
          </div>
        )}

        {/* SIGNUP STEP 1 */}
        {m === "signup" && step === 1 && (
          <div>
            <h2 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 34, letterSpacing: 1, marginBottom: 6 }}>Créer un compte</h2>
            <p style={{ color: C.muted, fontSize: 13, marginBottom: 24, fontFamily: "'DM Sans', sans-serif" }}>14 jours gratuits · Sans carte bancaire</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <input style={inputStyle} placeholder="Prénom ou pseudo" {...field("name")} />
              <input style={inputStyle} placeholder="Email" type="email" {...field("email")} />
              <input style={inputStyle} placeholder="Mot de passe" type="password" {...field("password")} />
              <Btn full onClick={() => setStep(2)}>Suivant : Choix du plan →</Btn>
            </div>
            <div style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: C.muted, fontFamily: "'DM Sans', sans-serif" }}>
              Déjà membre ?{" "}
              <span style={{ color: C.orange, cursor: "pointer", fontWeight: 700 }} onClick={() => setM("login")}>Se connecter</span>
            </div>
          </div>
        )}

        {/* SIGNUP STEP 2 — PLAN */}
        {m === "signup" && step === 2 && (
          <div>
            <h2 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 34, letterSpacing: 1, marginBottom: 6 }}>Ton plan</h2>
            <p style={{ color: C.muted, fontSize: 13, marginBottom: 20, fontFamily: "'DM Sans', sans-serif" }}>Tu peux changer à tout moment</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
              {PLANS.map(plan => (
                <div key={plan.id} onClick={() => setForm(f => ({ ...f, plan: plan.id }))} style={{
                  padding: "14px 18px", borderRadius: 12, cursor: "pointer", transition: "all .2s",
                  border: `1px solid ${form.plan === plan.id ? plan.color : C.border}`,
                  background: form.plan === plan.id ? `${plan.color}11` : "rgba(255,255,255,0.02)",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 22 }}>{plan.icon}</span>
                    <div>
                      <div style={{ fontWeight: 700, fontFamily: "'DM Sans', sans-serif" }}>{plan.name}</div>
                      <div style={{ fontSize: 12, color: C.muted }}>{plan.desc}</div>
                    </div>
                  </div>
                  <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 22, color: plan.color }}>{plan.price}€/m</div>
                </div>
              ))}
            </div>
            <Btn full onClick={() => setStep(3)}>Suivant : Paiement →</Btn>
            <Btn variant="ghost" full onClick={() => setStep(1)} style={{ marginTop: 8 }}>← Retour</Btn>
          </div>
        )}

        {/* SIGNUP STEP 3 — PAYMENT (simulated) */}
        {m === "signup" && step === 3 && (
          <div>
            <h2 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 34, letterSpacing: 1, marginBottom: 6 }}>Paiement</h2>
            <div style={{ background: `${selectedPlan.color}11`, border: `1px solid ${selectedPlan.color}33`, borderRadius: 10, padding: "10px 14px", marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}>{selectedPlan.icon} Plan {selectedPlan.name} · 14j gratuit</span>
              <span style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 20, color: selectedPlan.color }}>{selectedPlan.price}€/mois</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input style={inputStyle} placeholder="Numéro de carte  •••• •••• •••• ••••" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <input style={inputStyle} placeholder="MM / AA" />
                <input style={inputStyle} placeholder="CVC" />
              </div>
              <input style={inputStyle} placeholder="Nom sur la carte" />
              <Btn full onClick={handleSignup} disabled={loading} style={{ marginTop: 4 }}>
                {loading ? "⏳ Traitement..." : `Démarrer l'essai gratuit →`}
              </Btn>
            </div>
            <div style={{ textAlign: "center", marginTop: 14, fontSize: 11, color: C.muted, fontFamily: "'DM Sans', sans-serif" }}>
              🔒 Paiement sécurisé · Annulation à tout moment · Aucun débit pendant 14 jours
            </div>
            <Btn variant="ghost" full onClick={() => setStep(2)} style={{ marginTop: 10 }}>← Retour</Btn>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   MATCHES TAB
───────────────────────────────────────── */
function MatchesTab({ liveScores, wnbaScores, nbaLoading, nbaError, setTab }) {
  const [predictions, setPredictions] = useState({});
  const [loadingPred, setLoadingPred] = useState({});
  const API = import.meta.env.DEV ? "http://localhost:3001" : "";

  const fetchPrediction = async (game) => {
    if (predictions[game.id] || loadingPred[game.id]) return;
    setLoadingPred(p => ({ ...p, [game.id]: true }));
    try {
      const res = await fetch(`${API}/api/nba/predict/${game.id}`);
      const data = await res.json();
      if (data.prediction) setPredictions(p => ({ ...p, [game.id]: data.prediction }));
    } catch {}
    setLoadingPred(p => ({ ...p, [game.id]: false }));
  };

  const allGames = [...liveScores, ...wnbaScores];

  return (
    <div className="fade-in">
      <h1 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 46, letterSpacing: 2, marginBottom: 8 }}>
        ANALYSE <span style={{ color: C.orange }}>MATCHS</span>
      </h1>
      <p style={{ color: C.muted, fontSize: 13, marginBottom: 24 }}>
        🏀 NBA · 🌸 WNBA — {allGames.length} matchs aujourd'hui
      </p>
      {nbaLoading ? (
        <div style={{ color: C.muted, fontSize: 14 }}>⏳ Chargement des matchs...</div>
      ) : nbaError ? (
        <div style={{ color: C.red, fontSize: 14 }}>❌ {nbaError}</div>
      ) : allGames.length === 0 ? (
        <div style={{ color: C.muted, fontSize: 14 }}>Aucun match disponible pour le moment.</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 20 }}>
          {allGames.map(game => {
            const isWnba = game.league === "wnba";
            const isLive = game.status === "live" || (!isWnba && game.clock && !game.status?.includes("Final"));
            const isFinished = game.status === "Final" || game.status?.includes("Final");
            const accentColor = isWnba ? "#c084fc" : C.orange;
            const pred = predictions[game.id];
            const predLoading = loadingPred[game.id];

            return (
              <Card key={game.id}>
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div>
                    {isWnba && (
                      <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1.5, color: "#c084fc", background: "rgba(192,132,252,0.12)", padding: "2px 8px", borderRadius: 5, border: "1px solid rgba(192,132,252,0.25)", display: "inline-block", marginBottom: 6 }}>🌸 WNBA</span>
                    )}
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{game.home.name}</div>
                    <div style={{ fontSize: 12, color: C.muted }}>vs {game.away.name}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 32, color: isLive ? C.blue : accentColor }}>
                      {game.home.score}–{game.away.score}
                    </div>
                    {isLive && game.clock && <div style={{ fontSize: 10, color: accentColor }}>{game.clock}</div>}
                  </div>
                </div>

                {/* Badges */}
                <div style={{ marginBottom: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {isLive && <Badge color={C.blue}>⏱ EN DIRECT</Badge>}
                  {isFinished && <Badge color={C.green}>✓ TERMINÉ</Badge>}
                  {!isLive && !isFinished && <Badge color={C.muted}>📅 À VENIR</Badge>}
                </div>

                {/* Score bar */}
                <div style={{ padding: 12, background: "rgba(255,255,255,0.03)", borderRadius: 8, marginBottom: 12 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 32px 1fr", alignItems: "center", textAlign: "center" }}>
                    <div>
                      <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>{game.home.abbreviation}</div>
                      <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 26 }}>{game.home.score}</div>
                    </div>
                    <div style={{ fontSize: 11, color: C.muted }}>vs</div>
                    <div>
                      <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>{game.away.abbreviation}</div>
                      <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 26 }}>{game.away.score}</div>
                    </div>
                  </div>
                </div>

                {/* Oracle prediction */}
                {!isWnba && (
                  <>
                    {pred ? (
                      <div style={{ padding: 12, background: "rgba(255,92,0,0.07)", borderRadius: 8, border: "1px solid rgba(255,92,0,0.2)", marginBottom: 10 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: C.orange, marginBottom: 6, letterSpacing: 1 }}>🔮 ORACLE</div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                          <div>
                            <div style={{ fontSize: 11, color: C.muted }}>Vainqueur prédit</div>
                            <div style={{ fontWeight: 700, fontSize: 14 }}>{pred.winner}</div>
                          </div>
                          <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: 11, color: C.muted }}>Score projeté</div>
                            <div style={{ fontWeight: 700, fontSize: 14 }}>{pred.projectedScore?.home}–{pred.projectedScore?.away}</div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: 11, color: C.muted }}>Confiance</div>
                            <div style={{ fontWeight: 700, fontSize: 14, color: pred.confidence === "Élevée" ? C.green : pred.confidence === "Moyenne" ? C.orange : C.muted }}>{pred.confidence}</div>
                          </div>
                        </div>
                        {pred.verdict && (
                          <div style={{ fontSize: 12, color: C.muted, fontStyle: "italic", borderTop: `1px solid rgba(255,255,255,0.06)`, paddingTop: 8 }}>
                            "{pred.verdict}"
                          </div>
                        )}
                        {pred.xFactor && (
                          <div style={{ marginTop: 8, fontSize: 12, padding: "6px 10px", background: "rgba(255,255,255,0.04)", borderRadius: 6 }}>
                            ⚡ <strong>X-Factor :</strong> {pred.xFactor.player} — {pred.xFactor.reason}
                          </div>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => fetchPrediction(game)}
                        disabled={predLoading}
                        style={{ width: "100%", padding: "10px", borderRadius: 8, border: `1px solid rgba(255,92,0,0.3)`, background: "rgba(255,92,0,0.07)", color: predLoading ? C.muted : C.orange, fontWeight: 600, fontSize: 13, cursor: predLoading ? "default" : "pointer", fontFamily: "var(--font-sans)", marginBottom: 10, transition: "all 0.2s" }}
                      >
                        {predLoading ? "⏳ Analyse Oracle en cours..." : "🔮 Lancer l'analyse Oracle"}
                      </button>
                    )}
                  </>
                )}

                {/* Live center link */}
                {(isLive || isFinished) && (
                  <button
                    onClick={() => setTab("live")}
                    style={{ width: "100%", padding: "8px", borderRadius: 8, border: `1px solid rgba(255,255,255,0.08)`, background: "rgba(255,255,255,0.03)", color: C.muted, fontSize: 12, cursor: "pointer", fontFamily: "var(--font-sans)" }}
                  >
                    📊 Voir le box score complet →
                  </button>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
   DASHBOARD APP
───────────────────────────────────────── */
function App({ user, onLogout }) {
  const [tab, setTab] = useState("dashboard");
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiDone, setAiDone] = useState(false);
  const [chatHistory, setChatHistory] = useState([
  { role: "assistant", text: "Bonjour ! Je suis HoopIQ IA, ton analyste basket. Pose-moi une question !" }
]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [bullsPlayers, setBullsPlayers] = useState([]);
  const [playerSearch, setPlayerSearch] = useState("");
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [showNflTeaser, setShowNflTeaser] = useState(false);
  const [favoriteTeam, setFavoriteTeamState] = useState(() => {
    try { return JSON.parse(localStorage.getItem("hoopiq_fav_team")) || NBA_TEAMS[3]; } catch { return NBA_TEAMS[3]; }
  });
  const setFavoriteTeam = (team) => {
    setFavoriteTeamState(team);
    localStorage.setItem("hoopiq_fav_team", JSON.stringify(team));
  };
  const [liveScores, setLiveScores] = useState([]);
  const [wnbaScores, setWnbaScores] = useState([]);
  const [wnbaLiveCount, setWnbaLiveCount] = useState(0);
  const [nbaLoading, setNbaLoading] = useState(true);
  const [nbaError, setNbaError] = useState(null);
  const anthopicProxy = (import.meta.env.DEV ? 'http://localhost:3001' : '') + '/api/anthropic'
  const chatEndRef = useRef(null);
  const streamIntervalRef = useRef(null);
  const plan = PLANS.find(p => p.id === user.plan) || PLANS[1];

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatHistory]);

  useEffect(() => {
    // Cleanup intervalle de streaming quand on quitte l'onglet joueurs ou démontage
    if (tab !== "players" && streamIntervalRef.current) {
      clearInterval(streamIntervalRef.current);
      streamIntervalRef.current = null;
      setAiLoading(false);
    }
    return () => {
      if (streamIntervalRef.current) {
        clearInterval(streamIntervalRef.current);
        streamIntervalRef.current = null;
      }
    };
  }, [tab]);

  // Auto-analyse le meilleur joueur quand on ouvre l'onglet Joueurs ou quand les joueurs chargent
  useEffect(() => {
    if (tab === "players" && !selectedPlayer) {
      const list = bullsPlayers.length ? bullsPlayers : PLAYERS;
      const best = list.reduce((a, b) => (b.score > a.score ? b : a), list[0]);
      if (best) analyzePlayer(best);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, bullsPlayers]);

  useEffect(() => {
    const loadNbaData = async () => {
      setNbaLoading(true)
      setNbaError(null)
      const apiBase = import.meta.env.DEV ? 'http://localhost:3001' : ''
      try {
        const [playersRes, scoresRes] = await Promise.all([
          fetch(`${apiBase}/api/nba/players?teamId=${favoriteTeam.id}`),
          fetch(`${apiBase}/api/nba/live-scores`),
        ])
        if (!playersRes.ok) throw new Error('Impossible de charger les joueurs Bulls')
        if (!scoresRes.ok) throw new Error('Impossible de charger les scores live')
        const playersData = await playersRes.json()
        const scoresData = await scoresRes.json()
        const loadedPlayers = playersData.players || []
        setBullsPlayers(loadedPlayers)
        setSelectedPlayer(loadedPlayers[0] || null)
        setLiveScores(scoresData.games || [])
        // Fetch WNBA games en parallèle
        fetch("https://site.api.espn.com/apis/site/v2/sports/basketball/wnba/scoreboard")
          .then(r => r.json())
          .then(d => {
            const events = d.events || [];
            setWnbaLiveCount(events.filter(e => e.status?.type?.id === "2").length);
            setWnbaScores(events.map(ev => {
              const comp = ev.competitions?.[0] || {};
              const home = comp.competitors?.find(c => c.homeAway === "home") || {};
              const away = comp.competitors?.find(c => c.homeAway === "away") || {};
              const stateId = ev.status?.type?.id;
              return {
                id: ev.id,
                league: "wnba",
                status: stateId === "2" ? "live" : stateId === "3" ? "Final" : ev.status?.type?.shortDetail || "À venir",
                clock: ev.status?.displayClock || "",
                home: { name: home.team?.displayName || "", abbreviation: home.team?.abbreviation || "", score: home.score || "0" },
                away: { name: away.team?.displayName || "", abbreviation: away.team?.abbreviation || "", score: away.score || "0" },
              };
            }));
          })
          .catch(() => {});
      } catch (err) {
        console.error('NBA fetch error:', err)
        setNbaError(err.message)
      } finally {
        setNbaLoading(false)
      }
    }
    loadNbaData()
  }, [favoriteTeam.id])

  const analyzePlayer = async (player) => {
    setSelectedPlayer(player);
    setAiAnalysis("");
    setAiDone(false);
    setAiLoading(true);
    
    // Nettoyer l'intervalle précédent s'il existe
    if (streamIntervalRef.current) {
      clearInterval(streamIntervalRef.current);
      streamIntervalRef.current = null;
    }
    
    try {
      const res = await fetch(anthopicProxy, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: `T'es HoopIQ Scout, le meilleur œil du game. T'as vu jouer Magic Johnson, Kobe, LeBron — tu reconnais le talent en 10 secondes. Ton style : direct, imagé, avec des comparaisons NBA qui claquent. Chaque joueur est unique et ton analyse doit le montrer.

Analyse ${player.name} en exactement 4 bullets (•), en français, max 2 lignes par bullet. Format :
• [TITRE EN MAJUSCULES] : analyse percutante avec une référence NBA si pertinent

Données :
Poste: ${player.pos} | Équipe: ${player.team}
${player.pts} pts | ${player.ast} ast | ${player.reb} reb | ${player.fg}% au tir
Score HoopIQ: ${player.score}/100 | Tendance: ${player.trend > 0 ? "🔥 +" : "📉 "}${player.trend}

Termine par une phrase signature unique qui résume ce joueur en une image forte. Pas de blabla, que du feu.`
          }]
        })
      });
      
      const data = await res.json();
      const text = data?.completion?.[0]?.data?.text || data?.content?.map(b => b.text || "").join("") || JSON.stringify(data).slice(0, 800) || "Analyse non disponible.";
      
      let i = 0;
      const chunkSize = 12; // Augmenté de 4 à 12 pour moins de re-renders
      
      streamIntervalRef.current = setInterval(() => {
        if (i >= text.length) {
          setAiAnalysis(text);
          setAiDone(true);
          setAiLoading(false);
          clearInterval(streamIntervalRef.current);
          streamIntervalRef.current = null;
        } else {
          setAiAnalysis(text.slice(0, i));
          i += chunkSize;
        }
      }, 16);
    } catch (err) {
      console.error("Analyse error:", err);
      setAiAnalysis("❌ Erreur IA. Vérifie la connexion.");
      setAiDone(true);
      setAiLoading(false);
    }
  };

  const sendChat = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const msg = chatInput.trim(); setChatInput("");
    setChatHistory(h => [...h, { role: "user", text: msg }]);
    setChatLoading(true);
    try {
      const res = await fetch(anthopicProxy, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001", max_tokens: 1000,
          system: "Tu es HoopIQ IA, analyste basket expert. Reponds en francais, de facon concise et passionnee.",
          messages: chatHistory.slice(-4).concat({ role: "user", content: msg }).filter(m => m.text || m.content).map(m => ({ role: m.role, content: m.text || m.content })),
        })
      });
      const data = await res.json();
      const reply = data.content?.map(b => b.text || "").join("") || "Désolé, erreur.";
      setChatHistory(h => [...h, { role: "assistant", text: reply }]);
    } catch { setChatHistory(h => [...h, { role: "assistant", text: "❌ Erreur IA." }]); }
    setChatLoading(false);
  };

  const isAdmin = user.email === "admin@hoopiq.com";

  const ALL_TABS = [
    { id: "dashboard",   label: "Dashboard",  icon: "⚡" },
    { id: "live",        label: "Live",       icon: "🔴", badge: (liveScores.filter(g => g.status === "live" || g.status?.toLowerCase().includes("live")).length + wnbaLiveCount) || null },
    { id: "oracle",      label: "Oracle",     icon: "🔮" },
    { id: "duel",        label: "Duel IA",    icon: "⚔️" },
    { id: "prematch",    label: "Pronostics", icon: "⚡" },
    { id: "challenges",  label: "Défis",      icon: "🎯" },
    { id: "leaderboard", label: "Classement", icon: "🏆" },
    { sep: true },
    { id: "players",   label: "Joueurs",   icon: "🏀" },
    { id: "matches",   label: "Matchs",    icon: "📊" },
    { id: "scout",     label: "Scout",     icon: "🔍" },
    { id: "nfl-soon",  label: "NFL",       icon: "🏈", soon: true },
    { sep: true },
    { id: "vestiaire", label: "Vestiaire", icon: "💬" },
    { id: "cards",     label: "Cartes",    icon: "🎴" },
    { sep: true },
    { id: "chat",      label: "IA Chat",   icon: "🤖" },
    ...(isAdmin ? [{ id: "jarvis", label: "JARVIS", icon: "🦾" }] : []),
    { id: "agent",     label: "Agent IA",  icon: "🧠" },
    ...(isAdmin ? [{ id: "marketing", label: "Marketing", icon: "🚀" }] : []),
    { sep: true },
    { id: "account",   label: "Compte",    icon: "👤" },
  ];
  const TABS = ALL_TABS;
  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;700&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: ${C.orange}; border-radius: 4px; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        @keyframes glow-pulse { 0%,100%{box-shadow:0 0 0 0 rgba(255,92,0,0.4)} 50%{box-shadow:0 0 0 6px rgba(255,92,0,0)} }
        .nav-tab:hover { color: ${C.orange} !important; background: rgba(255,92,0,0.07) !important; }
        .player-row:hover { background: rgba(255,92,0,0.06) !important; cursor:pointer; }
        .stat-card:hover { border-color: rgba(255,92,0,0.35) !important; transform:translateY(-3px); box-shadow: 0 8px 32px rgba(0,0,0,0.4) !important; }
        .kpi-card { position: relative; overflow: hidden; }
        .kpi-card::after { content:''; position:absolute; top:0; left:0; right:0; height:2px; background: var(--kpi-color); opacity:.8; }
        .fade-in { animation: fadeUp .5s ease both; }
        .nav-sep { width: 1px; height: 20px; background: rgba(255,255,255,0.07); margin: 0 4px; align-self: center; flex-shrink: 0; }
        @keyframes nflTabPulse { 0%,100%{box-shadow:0 0 0 0 rgba(200,16,46,0.3)} 50%{box-shadow:0 0 8px 2px rgba(200,16,46,0.2)} }
        @keyframes nflModalIn { from{transform:scale(0.9) translateY(20px);opacity:0} to{transform:scale(1) translateY(0);opacity:1} }
      `}</style>

      {/* NFL TEASER MODAL */}
      {showNflTeaser && (() => {
        const closeTeaser = () => setShowNflTeaser(false);
        return (
          <div onClick={closeTeaser} style={{
            position: "fixed", inset: 0, zIndex: 2000,
            background: "rgba(0,0,0,0.92)", backdropFilter: "blur(20px)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
          }}>
            <div onClick={e => e.stopPropagation()} style={{
              background: "linear-gradient(145deg, #0d0005, #06060f)",
              border: "1px solid rgba(200,16,46,0.45)",
              borderRadius: 24, overflow: "hidden", maxWidth: 560, width: "100%",
              boxShadow: "0 0 100px rgba(200,16,46,0.25)",
              animation: "nflModalIn .35s cubic-bezier(.34,1.56,.64,1)",
            }}>
              {/* Cinematic NFL Hero Animation */}
              <div style={{ position: "relative", width: "100%", height: 260, background: "#000", overflow: "hidden" }}>
                <style>{`
                  @keyframes nflParticle { 0%{transform:translateY(0) translateX(0) scale(1);opacity:1} 100%{transform:translateY(-280px) translateX(var(--dx)) scale(0);opacity:0} }
                  @keyframes nflShieldPulse { 0%,100%{transform:scale(1);filter:drop-shadow(0 0 20px #C8102E)} 50%{transform:scale(1.06);filter:drop-shadow(0 0 40px #FFB612)} }
                  @keyframes nflScanline { 0%{transform:translateY(-100%)} 100%{transform:translateY(400%)} }
                  @keyframes nflTextReveal { 0%{opacity:0;letter-spacing:20px} 100%{opacity:1;letter-spacing:6px} }
                  @keyframes nflGlitch { 0%,94%,100%{transform:translateX(0)} 95%{transform:translateX(-4px)} 97%{transform:translateX(4px)} }
                  @keyframes nflLineGrow { from{width:0} to{width:140px} }
                  @keyframes nflVignette { 0%,100%{opacity:0.6} 50%{opacity:0.3} }
                `}</style>

                {/* Fond dégradé animé */}
                <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 60%, #3a0008 0%, #1a0003 40%, #000 100%)" }} />

                {/* Grille de terrain */}
                <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.08 }} viewBox="0 0 560 260">
                  {[0,56,112,168,224,280,336,392,448,504,560].map(x => (
                    <line key={x} x1={x} y1="0" x2={x} y2="260" stroke="#fff" strokeWidth="0.5"/>
                  ))}
                  {[0,52,104,156,208,260].map(y => (
                    <line key={y} x1="0" y1={y} x2="560" y2={y} stroke="#fff" strokeWidth="0.5"/>
                  ))}
                </svg>

                {/* Particles 🏈 */}
                {[...Array(14)].map((_, i) => (
                  <div key={i} style={{
                    position: "absolute",
                    left: `${8 + i * 6.5}%`,
                    bottom: `${10 + (i % 4) * 8}%`,
                    fontSize: i % 3 === 0 ? 18 : 13,
                    animation: `nflParticle ${2.2 + (i % 4) * 0.6}s ease-out ${i * 0.28}s infinite`,
                    "--dx": `${(i % 2 === 0 ? 1 : -1) * (20 + i * 5)}px`,
                    opacity: 0,
                  }}>🏈</div>
                ))}

                {/* Scanline cinéma */}
                <div style={{
                  position: "absolute", left: 0, right: 0, height: 2,
                  background: "linear-gradient(90deg, transparent, rgba(200,16,46,0.6), transparent)",
                  animation: "nflScanline 2.4s linear infinite",
                }} />

                {/* Bouclier central */}
                <div style={{
                  position: "absolute", inset: 0,
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10,
                }}>
                  <div style={{ fontSize: 64, animation: "nflShieldPulse 2s ease-in-out infinite" }}>🏈</div>
                  <div style={{
                    fontFamily: "'Bebas Neue', cursive", fontSize: 42, letterSpacing: 6, lineHeight: 1,
                    background: "linear-gradient(135deg, #C8102E, #FFB612, #C8102E)",
                    backgroundSize: "200%",
                    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                    animation: "nflTextReveal 1s ease both, nflGlitch 4s ease-in-out infinite",
                  }}>NFL ZONE</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ height: 1, width: 0, background: "#C8102E", animation: "nflLineGrow 1.2s ease .4s both" }} />
                    <span style={{ fontSize: 11, fontWeight: 800, color: "#FFB612", letterSpacing: 3, textTransform: "uppercase" }}>Bientôt sur HoopIQ</span>
                    <div style={{ height: 1, width: 0, background: "#C8102E", animation: "nflLineGrow 1.2s ease .4s both" }} />
                  </div>
                </div>

                {/* Vignette overlay */}
                <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0,0,0,0.7) 100%)", animation: "nflVignette 3s ease-in-out infinite" }} />
                {/* Gradient bas */}
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 60, background: "linear-gradient(transparent, #0d0005)" }} />
              </div>

              {/* Contenu */}
              <div style={{ padding: "24px 28px 28px", textAlign: "center" }}>
                <h2 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 44, letterSpacing: 3, margin: "0 0 6px",
                  background: "linear-gradient(135deg, #C8102E, #FFB612)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  NFL ZONE
                </h2>
                <p style={{ fontSize: 14, color: "#f0f0ff", marginBottom: 6, fontWeight: 600 }}>Bientôt disponible sur HoopIQ 🔥</p>
                <p style={{ fontSize: 12, color: "#6b6b88", lineHeight: 1.6, marginBottom: 20 }}>
                  32 équipes · Stars · Scores ESPN live · Analyse IA
                </p>
                <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 20, flexWrap: "wrap" }}>
                  {["Mahomes","Lamar Jackson","CeeDee Lamb","Micah Parsons"].map(tag => (
                    <span key={tag} style={{ fontSize: 11, fontWeight: 800, padding: "3px 10px", borderRadius: 20,
                      background: "rgba(200,16,46,0.12)", border: "1px solid rgba(200,16,46,0.3)", color: "#ff6b6b" }}>
                      {tag}
                    </span>
                  ))}
                </div>
                <button onClick={closeTeaser} style={{
                  width: "100%", padding: "13px", borderRadius: 14,
                  background: "linear-gradient(135deg, #C8102E, #a00d23)",
                  border: "none", color: "#fff", fontSize: 14, fontWeight: 800,
                  cursor: "pointer", fontFamily: "inherit",
                  boxShadow: "0 4px 24px rgba(200,16,46,0.4)",
                }}>
                  J'attends avec impatience ! 🏈
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* LAYOUT: sidebar + main */}
      <div style={{ display: "flex", minHeight: "100vh" }}>

      {/* SIDEBAR */}
      <nav style={{
        width: 220, flexShrink: 0, position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 100,
        background: "#0d0d1f", borderRight: `1px solid rgba(255,255,255,0.06)`,
        display: "flex", flexDirection: "column", overflowY: "auto", overflowX: "hidden",
      }}>
        {/* Logo */}
        <div style={{ padding: "20px 20px 16px", borderBottom: `1px solid rgba(255,255,255,0.06)` }}>
          <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 26, background: G.orange, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: 3 }}>HOOP IQ</div>
          <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1, marginTop: 2 }}>Intelligence Basket IA</div>
        </div>

        {/* Nav items */}
        <div style={{ flex: 1, padding: "12px 10px" }}>
          {TABS.map((t, i) => t.sep ? (
            <div key={`sep-${i}`} style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "8px 6px" }} />
          ) : t.soon ? (
            <button key={t.id} onClick={() => setShowNflTeaser(true)} style={{
              position: "relative", width: "100%", padding: "9px 12px", borderRadius: 10,
              border: "1px solid rgba(200,16,46,0.25)", cursor: "pointer",
              background: "rgba(200,16,46,0.07)", color: "#ff6b6b",
              fontWeight: 700, fontSize: 13, transition: "all .2s", fontFamily: "'DM Sans', sans-serif",
              display: "flex", alignItems: "center", gap: 10, marginBottom: 2, textAlign: "left",
              animation: "nflTabPulse 3s ease-in-out infinite",
            }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>{t.icon}</span>
              <span style={{ flex: 1 }}>{t.label}</span>
              <span style={{ fontSize: 8, fontWeight: 900, background: "#C8102E", color: "#fff", padding: "2px 5px", borderRadius: 5, letterSpacing: 0.5 }}>SOON</span>
            </button>
          ) : (
            <button key={t.id} className="nav-tab" onClick={() => setTab(t.id)} style={{
              position: "relative", width: "100%", padding: "9px 12px", borderRadius: 10, border: "none",
              cursor: "pointer", display: "flex", alignItems: "center", gap: 10, marginBottom: 2,
              background: tab === t.id ? "rgba(255,92,0,0.13)" : "transparent",
              color: tab === t.id ? C.orange : C.muted,
              fontWeight: tab === t.id ? 700 : 500,
              fontSize: 13, transition: "all .2s", fontFamily: "'DM Sans', sans-serif", textAlign: "left",
              borderLeft: tab === t.id ? `3px solid ${C.orange}` : "3px solid transparent",
            }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>{t.icon}</span>
              <span style={{ flex: 1 }}>{t.label}</span>
              {t.badge > 0 && (
                <span style={{ width: 18, height: 18, borderRadius: "50%", background: C.red, color: "#fff", fontSize: 9, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1, animation: "glow-pulse 2s infinite", flexShrink: 0 }}>{t.badge}</span>
              )}
            </button>
          ))}
        </div>

        {/* User footer */}
        <div style={{ padding: "14px 16px", borderTop: `1px solid rgba(255,255,255,0.06)`, display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar name={user.name} size={32} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name}</div>
            <Badge color={plan.color} style={{ fontSize: 9 }}>{plan.icon} {plan.name}</Badge>
          </div>
          <button onClick={onLogout} title="Déconnexion" style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 16, flexShrink: 0, padding: 4, lineHeight: 1 }}>⎋</button>
        </div>
      </nav>

      {/* CONTENT */}
      <div style={{ marginLeft: 220, flex: 1, minWidth: 0 }}>
      <div style={{ maxWidth: 1140, margin: "0 auto", padding: "28px 24px 80px" }}>

        {/* ── DASHBOARD ── */}
        {tab === "dashboard" && (
          <div className="fade-in">
            <div style={{ marginBottom: 28, display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div>
                <div style={{ fontSize: 13, color: C.muted, marginBottom: 4 }}>Bienvenue, {user.name} 👋</div>
                <h1 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 46, letterSpacing: 2, lineHeight: 1 }}>
                  TABLEAU DE <span style={{ background: G.orange, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>BORD</span>
                </h1>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                {liveScores.filter(g => g.status?.toLowerCase().includes("live")).length > 0 && (
                  <div onClick={() => setTab("live")} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 20, background: "rgba(255,77,109,0.1)", border: "1px solid rgba(255,77,109,0.3)" }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: C.red, animation: "pulse 1.2s infinite", display: "inline-block" }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: C.red }}>{liveScores.filter(g => g.status?.toLowerCase().includes("live")).length} match{liveScores.filter(g => g.status?.toLowerCase().includes("live")).length > 1 ? "s" : ""} en direct</span>
                  </div>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 20, background: C.surface, border: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: 12, color: C.muted }}>📅</span>
                  <span style={{ fontSize: 12, color: C.muted }}>{new Date().toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })}</span>
                </div>
              </div>
            </div>

            {/* KPI Row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
              {[
                { label: "Matchs analysés", val: "248", icon: "📊", sub: "+12 ce mois", color: C.blue },
                { label: "Joueurs suivis", val: "94", icon: "🏀", sub: "5 ligues actives", color: C.green },
                { label: "Précision IA", val: "89%", icon: "🎯", sub: "Sur 248 matchs", color: C.orange },
                { label: "Alertes actives", val: "7", icon: "🔔", sub: "Performance haute", color: C.gold },
              ].map((k, i) => (
                <div key={k.label} className="stat-card kpi-card" style={{
                  background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16,
                  padding: "18px 20px", transition: "all .25s", animationDelay: `${i * .08}s`,
                  boxShadow: `0 2px 16px rgba(0,0,0,0.25)`,
                  "--kpi-color": k.color,
                }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: `${k.color}18`, border: `1px solid ${k.color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{k.icon}</div>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: k.color, opacity: 0.7, marginTop: 6 }} />
                  </div>
                  <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 40, color: k.color, lineHeight: 1, letterSpacing: 1 }}>{k.val}</div>
                  <div style={{ fontSize: 12, color: C.text, fontWeight: 600, marginTop: 5 }}>{k.label}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{k.sub}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1.3fr 0.7fr", gap: 20, marginBottom: 20 }}>
              <Card>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <SectionTitle style={{ margin: 0 }}>🏀 NBA · WNBA Live</SectionTitle>
                  {[...liveScores, ...wnbaScores].filter(g => g.status === "live" || g.status?.toLowerCase().includes("live")).length > 0 && (
                    <span style={{ fontSize: 10, fontWeight: 800, color: C.red, letterSpacing: 1, display: "flex", alignItems: "center", gap: 5 }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.red, animation: "pulse 1.2s infinite", display: "inline-block" }} />
                      {[...liveScores, ...wnbaScores].filter(g => g.status === "live" || g.status?.toLowerCase().includes("live")).length} EN DIRECT
                    </span>
                  )}
                </div>
                {nbaLoading ? (
                  <div style={{ color: C.muted, fontSize: 13 }}>Chargement des scores...</div>
                ) : nbaError ? (
                  <div style={{ color: C.red, fontSize: 13 }}>{nbaError}</div>
                ) : [...liveScores, ...wnbaScores].length === 0 ? (
                  <div style={{ color: C.muted, fontSize: 13, textAlign: "center", padding: "20px 0" }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>🏀</div>
                    Aucun match aujourd'hui
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {[...liveScores, ...wnbaScores].map(game => {
                      const isLive = game.status === "live" || game.status?.toLowerCase().includes("live");
                      const isFinal = game.status === "Final" || game.status?.includes("Final");
                      const isWnba = game.league === "wnba";
                      const homeWin = isFinal && Number(game.home.score) > Number(game.away.score);
                      const awayWin = isFinal && Number(game.away.score) > Number(game.home.score);
                      return (
                        <div key={game.id} onClick={() => setTab("live")} style={{
                          padding: "14px 16px", borderRadius: 14, cursor: "pointer", transition: "all .2s",
                          background: isLive ? "rgba(255,77,109,0.06)" : "rgba(255,255,255,0.03)",
                          border: `1px solid ${isLive ? "rgba(255,77,109,0.3)" : C.border}`,
                          borderLeft: `3px solid ${isLive ? C.red : isFinal ? C.green : C.muted}`,
                        }}
                          onMouseEnter={e => e.currentTarget.style.background = "rgba(255,92,0,0.07)"}
                          onMouseLeave={e => e.currentTarget.style.background = isLive ? "rgba(255,77,109,0.06)" : "rgba(255,255,255,0.03)"}
                        >
                          {/* Status + horloge */}
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              {isWnba && <span style={{ fontSize: 9, fontWeight: 800, color: "#c084fc", background: "rgba(192,132,252,0.12)", padding: "1px 6px", borderRadius: 4, border: "1px solid rgba(192,132,252,0.25)" }}>🌸 WNBA</span>}
                              {isLive && <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.red, animation: "pulse 1.2s infinite", display: "inline-block" }} />}
                              <span style={{ fontSize: 10, fontWeight: 700, color: isLive ? C.red : isFinal ? C.green : C.muted, textTransform: "uppercase", letterSpacing: 1 }}>
                                {isLive ? "EN DIRECT" : isFinal ? "TERMINÉ" : game.status}
                              </span>
                            </div>
                            <span style={{ fontSize: 11, color: C.orange, fontFamily: "monospace", fontWeight: 700 }}>{game.clock}</span>
                          </div>

                          {/* Équipes + score */}
                          <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 8 }}>
                            <div>
                              <div style={{ fontWeight: homeWin ? 800 : 600, fontSize: 13, color: homeWin ? C.text : C.muted }}>{game.home.name || game.home.abbreviation}</div>
                              <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{game.home.abbreviation} · Domicile</div>
                            </div>
                            <div style={{ textAlign: "center", padding: "4px 12px", background: "rgba(255,255,255,0.04)", borderRadius: 10, minWidth: 90 }}>
                              <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 28, letterSpacing: 2, lineHeight: 1 }}>
                                <span style={{ color: homeWin ? C.orange : C.text }}>{game.home.score}</span>
                                <span style={{ color: C.muted, fontSize: 18, margin: "0 4px" }}>–</span>
                                <span style={{ color: awayWin ? C.orange : C.text }}>{game.away.score}</span>
                              </div>
                              {isLive && <div style={{ fontSize: 9, color: C.red, letterSpacing: 1, marginTop: 2 }}>● LIVE</div>}
                            </div>
                            <div style={{ textAlign: "right" }}>
                              <div style={{ fontWeight: awayWin ? 800 : 600, fontSize: 13, color: awayWin ? C.text : C.muted }}>{game.away.name || game.away.abbreviation}</div>
                              <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{game.away.abbreviation} · Extérieur</div>
                            </div>
                          </div>

                          <div style={{ marginTop: 10, fontSize: 10, color: C.muted, textAlign: "right" }}>Voir le box score complet →</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>

              <Card glow>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <SectionTitle style={{ margin: 0 }}>🏀 Équipe Favorite</SectionTitle>
                  <select
                    value={favoriteTeam.id}
                    onChange={e => {
                      const team = NBA_TEAMS.find(t => t.id === +e.target.value);
                      if (team) { setFavoriteTeam(team); setBullsPlayers([]); setSelectedPlayer(null); }
                    }}
                    style={{
                      background: "rgba(255,255,255,0.05)", border: `1px solid rgba(255,255,255,0.12)`,
                      color: favoriteTeam.color, borderRadius: 8, padding: "4px 8px",
                      fontSize: 12, fontWeight: 700, cursor: "pointer", outline: "none",
                      fontFamily: "inherit", maxWidth: 160,
                    }}
                  >
                    {NBA_TEAMS.sort((a,b) => a.name.localeCompare(b.name)).map(t => (
                      <option key={t.id} value={t.id} style={{ background: "#0d0d1f", color: "#fff" }}>{t.name}</option>
                    ))}
                  </select>
                </div>
                {nbaLoading ? (
                  <div style={{ color: C.muted, fontSize: 13 }}>Chargement {favoriteTeam.name}...</div>
                ) : bullsPlayers.length === 0 ? (
                  <div style={{ color: C.muted, fontSize: 13 }}>Aucun joueur trouvé.</div>
                ) : (
                  bullsPlayers.slice(0, 6).map(player => (
                    <div key={player.id} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                      <Avatar name={player.name} size={42} espnId={player.espnId} headshot={player.headshot} league={player.league} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700 }}>{player.name}</div>
                        <div style={{ fontSize: 12, color: C.muted }}>{player.pos} · {player.fg}% fg</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 18, color: C.orange }}>{player.score}</div>
                        <div style={{ fontSize: 11, color: player.trend >= 0 ? C.green : C.red }}>{player.trend >= 0 ? `+${player.trend}` : player.trend}</div>
                      </div>
                    </div>
                  ))
                )}
              </Card>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>
              {/* Top performers */}
              <Card>
                <SectionTitle>🏆 Top Performers IA</SectionTitle>
                {(bullsPlayers.length ? bullsPlayers.slice(0, 4) : PLAYERS.slice(0, 4)).map((p, i) => (
                  <div key={p.id} className="player-row" onClick={() => { setTab("players"); analyzePlayer(p); }} style={{
                    display: "flex", alignItems: "center", gap: 14, padding: "12px 8px",
                    borderRadius: 10, transition: "all .15s",
                    borderBottom: i < 3 ? `1px solid ${C.border}` : "none",
                  }}>
                    <span style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 18, color: i === 0 ? C.orange : C.muted, width: 20, textAlign: "center" }}>#{i + 1}</span>
                    <Avatar name={p.name} size={38} glow={i === 0} espnId={p.espnId} headshot={p.headshot} league={p.league} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{p.name} {p.hot && <span title="En feu">🔥</span>}</div>
                      <div style={{ fontSize: 12, color: C.muted }}>{p.team} · {p.pos}</div>
                    </div>
                    <div style={{ textAlign: "right", marginRight: 8 }}>
                      <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 22, color: C.orange }}>{p.pts}</div>
                      <div style={{ fontSize: 11, color: C.muted }}>pts/match</div>
                    </div>
                    <Ring score={p.score} size={56} />
                  </div>
                ))}
              </Card>

              {/* Sidebar */}
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {/* Next match */}
                <Card glow>
                  <SectionTitle>📅 Prochain match NBA</SectionTitle>
                  {(() => {
                    const next = liveScores.find(g => g.status !== "Final" && !g.status?.includes("Final")) || liveScores[0];
                    if (nbaLoading) return <div style={{ fontSize: 13, color: C.muted }}>Chargement...</div>;
                    if (!next) return <div style={{ fontSize: 13, color: C.muted }}>Aucun match à venir aujourd'hui.</div>;
                    const isLive = next.status === "live" || next.status?.toLowerCase().includes("live");
                    return (
                      <>
                        <div style={{ fontWeight: 700, marginBottom: 2 }}>{next.home.name || next.home.abbreviation}</div>
                        <div style={{ fontSize: 12, color: C.muted, marginBottom: 12 }}>vs {next.away.name || next.away.abbreviation} · {isLive ? "🔴 En direct" : next.status}</div>
                        {isLive && (
                          <div style={{ padding: "10px 12px", background: "rgba(255,77,109,0.06)", borderRadius: 8, fontSize: 13, borderLeft: `3px solid ${C.red}` }}>
                            🔴 <strong style={{ color: C.red }}>{next.home.score} – {next.away.score}</strong> · {next.clock}
                          </div>
                        )}
                        {!isLive && (
                          <div style={{ padding: "10px 12px", background: "rgba(255,92,0,0.06)", borderRadius: 8, fontSize: 13, borderLeft: `3px solid ${C.orange}` }}>
                            📅 Match prévu · Analyse IA disponible dans Oracle
                          </div>
                        )}
                      </>
                    );
                  })()}
                </Card>

                {/* Plan card */}
                <Card>
                  <SectionTitle>💳 Mon abonnement</SectionTitle>
                  <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 28, color: plan.color }}>{plan.icon} {plan.name}</div>
                  <div style={{ fontSize: 13, color: C.muted, margin: "4px 0 14px" }}>{plan.price}€ / mois · Renouvellement le 7 Juil</div>
                  <Btn variant="ghost" small full onClick={() => setTab("account")}>Gérer mon plan →</Btn>
                </Card>
              </div>
            </div>

            {/* Recent activity — vrais matchs ESPN */}
            <Card style={{ marginTop: 20 }}>
              <SectionTitle>⚡ Matchs récents</SectionTitle>
              {[...liveScores, ...wnbaScores].length === 0 ? (
                <div style={{ color: C.muted, fontSize: 13, textAlign: "center", padding: "16px 0" }}>Aucun match aujourd'hui — reviens ce soir 🏀</div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
                  {[...liveScores, ...wnbaScores].slice(0, 6).map(g => {
                    const isLive = g.status === "live" || g.status?.toLowerCase().includes("live");
                    const isFinal = g.status === "Final" || g.status?.includes("Final");
                    return (
                      <div key={g.id} onClick={() => setTab("live")} style={{ padding: "14px 16px", background: "rgba(255,255,255,0.03)", borderRadius: 12, border: `1px solid ${isLive ? "rgba(255,77,109,0.3)" : C.border}`, cursor: "pointer", transition: "all .2s" }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(255,92,0,0.06)"}
                        onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                          <span style={{ fontSize: 10, fontWeight: 800, color: isLive ? C.red : isFinal ? C.green : C.muted, letterSpacing: 1 }}>
                            {isLive ? "🔴 LIVE" : isFinal ? "✓ FINAL" : "🕐 À VENIR"}
                          </span>
                          {g.league === "wnba" && <span style={{ fontSize: 9, color: "#c084fc" }}>🌸 WNBA</span>}
                        </div>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{g.home.name || g.home.abbreviation}</div>
                        <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 24, color: isLive ? C.red : C.orange, letterSpacing: 1 }}>
                          {g.home.score} — {g.away.score}
                        </div>
                        <div style={{ fontSize: 12, color: C.muted }}>{g.away.name || g.away.abbreviation}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>
        )}

        {/* ── PLAYERS ── */}
        {tab === "players" && (() => {
          const allPlayers = bullsPlayers.length ? bullsPlayers : PLAYERS;
          const q = playerSearch.toLowerCase();
          const filteredPlayers = q
            ? allPlayers.filter(p =>
                p.name.toLowerCase().includes(q) ||
                (p.team || "").toLowerCase().includes(q) ||
                (p.pos || "").toLowerCase().includes(q)
              )
            : allPlayers;
          return (
            <div className="fade-in">
              {/* Analysis Modal */}
              {showAnalysisModal && selectedPlayer && (
                <div
                  onClick={() => setShowAnalysisModal(false)}
                  style={{
                    position: "fixed", inset: 0, zIndex: 1000,
                    background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    padding: 24, animation: "fadeIn .2s ease",
                  }}
                >
                  <div
                    onClick={e => e.stopPropagation()}
                    style={{
                      background: "#0d0d1a", border: "1px solid rgba(255,92,0,0.3)",
                      borderRadius: 24, padding: 36, maxWidth: 680, width: "100%",
                      maxHeight: "90vh", overflowY: "auto",
                      boxShadow: "0 0 60px rgba(255,92,0,0.15)",
                      animation: "slideUp .3s ease",
                    }}
                  >
                    <style>{`
                      @keyframes slideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                      @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
                    `}</style>
                    {/* Header modal */}
                    <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 28 }}>
                      <Avatar name={selectedPlayer.name} size={80} glow espnId={selectedPlayer.espnId} headshot={selectedPlayer.headshot} league={selectedPlayer.league} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 34, letterSpacing: 2, lineHeight: 1 }}>
                          {selectedPlayer.name}
                        </div>
                        <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>
                          {selectedPlayer.league === "wnba" && <span style={{ color: "#c084fc" }}>🌸 WNBA · </span>}
                          {selectedPlayer.team} · {selectedPlayer.pos}
                        </div>
                        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                          <Badge color={C.orange}>{selectedPlayer.pts} pts</Badge>
                          <Badge color={C.blue}>{selectedPlayer.ast} ast</Badge>
                          <Badge color={C.green}>{selectedPlayer.reb} reb</Badge>
                          <Badge color={C.gold}>{selectedPlayer.fg}% FG</Badge>
                        </div>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <Ring score={selectedPlayer.score} size={72} />
                        <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>Score HoopIQ</div>
                      </div>
                    </div>

                    {/* Stats bars */}
                    <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 16, padding: "18px 22px", marginBottom: 24 }}>
                      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.5, color: C.muted, textTransform: "uppercase", marginBottom: 16 }}>Statistiques</div>
                      {[
                        { label: "Points / match", v: selectedPlayer.pts, max: 35, c: C.orange },
                        { label: "Passes décisives", v: selectedPlayer.ast, max: 12, c: C.blue },
                        { label: "Rebonds", v: selectedPlayer.reb, max: 15, c: C.green },
                        { label: "% au tir", v: selectedPlayer.fg, max: 70, c: C.gold },
                      ].map(s => (
                        <div key={s.label} style={{ marginBottom: 14 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 5 }}>
                            <span style={{ color: C.muted }}>{s.label}</span>
                            <strong style={{ color: s.c }}>{s.v}{s.label.includes("%") ? "%" : ""}</strong>
                          </div>
                          <Bar value={s.v} max={s.max} color={s.c} />
                        </div>
                      ))}
                    </div>

                    {/* Analyse IA */}
                    <div style={{ background: "rgba(255,92,0,0.04)", border: "1px solid rgba(255,92,0,0.15)", borderRadius: 16, padding: "22px 24px", marginBottom: 24 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                        <Badge>🤖 IA</Badge>
                        <span style={{ fontSize: 13, fontWeight: 700 }}>Analyse HoopIQ Scout</span>
                        {aiLoading && <span style={{ fontSize: 12, color: C.orange }}>⏳ Génération...</span>}
                      </div>
                      {aiLoading && <div style={{ color: C.orange, fontSize: 14 }}>🔍 Analyse en cours...</div>}
                      {aiAnalysis && (
                        <p style={{ fontSize: 15, lineHeight: 1.9, whiteSpace: "pre-wrap", color: "#dde", margin: 0 }}>
                          {aiAnalysis}{!aiDone && <span style={{ animation: "blink 1s infinite", color: C.orange }}>▋</span>}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => setShowAnalysisModal(false)}
                      style={{
                        width: "100%", padding: "14px", borderRadius: 14,
                        background: "rgba(255,92,0,0.1)", border: "1px solid rgba(255,92,0,0.3)",
                        color: C.orange, fontSize: 14, fontWeight: 700,
                        cursor: "pointer", fontFamily: "inherit",
                      }}
                    >Fermer ✕</button>
                  </div>
                </div>
              )}

              <h1 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 46, letterSpacing: 2, marginBottom: 6 }}>ANALYSE <span style={{ color: C.orange }}>JOUEURS</span></h1>
              <p style={{ color: C.muted, fontSize: 14, marginBottom: 20 }}>Analyse IA automatique · Clique sur un joueur pour changer</p>

              {/* Search bar */}
              <div style={{ position: "relative", marginBottom: 24 }}>
                <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", fontSize: 16, color: C.muted, pointerEvents: "none" }}>🔍</span>
                <input
                  value={playerSearch}
                  onChange={e => setPlayerSearch(e.target.value)}
                  placeholder="Rechercher par nom, équipe ou poste..."
                  style={{
                    width: "100%", padding: "13px 18px 13px 44px",
                    borderRadius: 14, fontSize: 14, fontFamily: "inherit",
                    background: "rgba(255,255,255,0.05)",
                    border: `1px solid ${playerSearch ? "rgba(255,92,0,0.5)" : C.border}`,
                    color: C.text, outline: "none", boxSizing: "border-box",
                    transition: "border-color .2s",
                    boxShadow: playerSearch ? "0 0 0 3px rgba(255,92,0,0.08)" : "none",
                  }}
                />
                {playerSearch && (
                  <button
                    onClick={() => setPlayerSearch("")}
                    style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: C.muted, fontSize: 16, cursor: "pointer", padding: 4 }}
                  >✕</button>
                )}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {filteredPlayers.length === 0 && (
                    <div style={{ textAlign: "center", padding: 40, color: C.muted, fontSize: 14 }}>
                      Aucun joueur ne correspond à "{playerSearch}"
                    </div>
                  )}
                  {filteredPlayers.map(p => (
                    <div key={p.id} onClick={() => analyzePlayer(p)} style={{
                      background: selectedPlayer?.id === p.id ? "rgba(255,92,0,0.07)" : C.surface,
                      border: `1px solid ${selectedPlayer?.id === p.id ? "rgba(255,92,0,0.45)" : C.border}`,
                      borderRadius: 16, padding: "18px 20px", cursor: "pointer", transition: "all .2s",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <Avatar name={p.name} size={50} glow={selectedPlayer?.id === p.id} espnId={p.espnId} headshot={p.headshot} league={p.league} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: 15 }}>{p.name} {p.hot && "🔥"}</div>
                          <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>
                            {p.league === "wnba" && <span style={{ color: "#c084fc", marginRight: 4 }}>🌸</span>}{p.team} · {p.pos}
                          </div>
                          <div style={{ display: "flex", gap: 6 }}>
                            <Badge color={C.orange}>{p.pts} pts</Badge>
                            <Badge color={C.blue}>{p.ast} ast</Badge>
                            <Badge color={C.green}>{p.reb} reb</Badge>
                          </div>
                        </div>
                        <div style={{ textAlign: "center" }}>
                          <Ring score={p.score} size={60} />
                          <div style={{ fontSize: 12, fontWeight: 700, color: p.trend >= 0 ? C.green : C.red, marginTop: 2 }}>{p.trend >= 0 ? "▲" : "▼"} {Math.abs(p.trend)}</div>
                        </div>
                      </div>
                      <div style={{ marginTop: 14 }}>
                        <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>% au tir ({p.fg}%)</div>
                        <Bar value={p.fg} max={70} color={G.orange} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* AI Panel */}
                <div style={{ position: "sticky", top: 80, alignSelf: "start", display: "flex", flexDirection: "column", gap: 16 }}>
                  <Card glow={!!aiAnalysis}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                      <Badge>🤖 IA</Badge>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>Analyse · {selectedPlayer?.name}</span>
                      {aiLoading && <span style={{ fontSize: 12, color: C.orange }}>⏳ Génération...</span>}
                    </div>
                    {!aiAnalysis && !aiLoading && <p style={{ color: C.muted, fontSize: 13 }}>👆 Sélectionne un joueur pour lancer l'analyse IA.</p>}
                    {aiLoading && <div style={{ color: C.orange, fontSize: 13 }}>🔍 Analyse en cours...</div>}
                    {aiAnalysis && (
                      <div style={{ maxHeight: "260px", overflowY: "auto", paddingRight: 8 }}>
                        <p style={{ fontSize: 14, lineHeight: 1.85, whiteSpace: "pre-wrap", color: "#dde", margin: 0 }}>
                          {aiAnalysis}{!aiDone && <span style={{ animation: "blink 1s infinite", color: C.orange }}>▋</span>}
                        </p>
                      </div>
                    )}
                    {aiDone && (
                      <>
                        <div style={{ marginTop: 12, padding: "8px 12px", background: "rgba(255,92,0,0.08)", borderRadius: 8, fontSize: 11, color: C.muted }}>✅ Généré par Claude · Score HoopIQ : <strong style={{ color: C.orange }}>{selectedPlayer?.score}/100</strong></div>
                        <button
                          onClick={() => setShowAnalysisModal(true)}
                          style={{
                            marginTop: 14, width: "100%", padding: "12px 16px",
                            borderRadius: 12, cursor: "pointer", fontFamily: "inherit",
                            background: "linear-gradient(135deg, rgba(255,92,0,0.15), rgba(255,92,0,0.05))",
                            border: "1px solid rgba(255,92,0,0.4)",
                            color: C.orange, fontSize: 13, fontWeight: 700,
                            transition: "all .2s",
                          }}
                        >
                          Voir l'analyse complète 🔍
                        </button>
                      </>
                    )}
                  </Card>

                  {selectedPlayer && (
                    <Card>
                      <SectionTitle>Statistiques détaillées</SectionTitle>
                      {[
                        { label: "Points / match", v: selectedPlayer.pts, max: 35, c: C.orange },
                        { label: "Passes décisives", v: selectedPlayer.ast, max: 12, c: C.blue },
                        { label: "Rebonds", v: selectedPlayer.reb, max: 15, c: C.green },
                        { label: "% au tir", v: selectedPlayer.fg, max: 70, c: C.gold },
                      ].map(s => (
                        <div key={s.label} style={{ marginBottom: 14 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 5 }}>
                            <span style={{ color: C.muted }}>{s.label}</span>
                            <strong style={{ color: s.c }}>{s.v}{s.label.includes("%") ? "%" : ""}</strong>
                          </div>
                          <Bar value={s.v} max={s.max} color={s.c} />
                        </div>
                      ))}
                    </Card>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {/* ── MATCHES ── */}
        {tab === "matches" && <MatchesTab liveScores={liveScores} wnbaScores={wnbaScores} nbaLoading={nbaLoading} nbaError={nbaError} setTab={setTab} />}


        {/* ── CHAT ── */}
        {tab === "chat" && (
          <div className="fade-in">
            <h1 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 46, letterSpacing: 2, marginBottom: 6 }}>ASSISTANT <span style={{ color: C.orange }}>IA</span></h1>
            <p style={{ color: C.muted, fontSize: 14, marginBottom: 20 }}>Pose n'importe quelle question basket — powered by Claude</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 20, alignItems: "start" }}>
              <div>
                <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 18, padding: 20, height: 440, overflowY: "auto", display: "flex", flexDirection: "column", gap: 14, marginBottom: 14 }}>
                  {chatHistory.map((m, i) => (
                    <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", flexDirection: m.role === "user" ? "row-reverse" : "row" }}>
                      {m.role === "assistant" && (
                        <div style={{ width: 30, height: 30, borderRadius: "50%", background: G.orange, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>🤖</div>
                      )}
                      <div style={{
                        maxWidth: "78%", padding: "11px 15px", fontSize: 13, lineHeight: 1.7, whiteSpace: "pre-wrap",
                        borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                        background: m.role === "user" ? G.orange : "rgba(255,255,255,0.06)",
                        color: m.role === "user" ? "#fff" : "#dde",
                      }}>{m.text}</div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <div style={{ width: 30, height: 30, borderRadius: "50%", background: G.orange, display: "flex", alignItems: "center", justifyContent: "center" }}>🤖</div>
                      <div style={{ padding: "11px 15px", background: "rgba(255,255,255,0.06)", borderRadius: "16px 16px 16px 4px", color: C.orange, fontSize: 18, letterSpacing: 4 }}>• • •</div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendChat()}
                    placeholder="Ex: Qui est le meilleur marqueur ? Prédit le prochain match..."
                    style={{ flex: 1, padding: "13px 18px", borderRadius: 12, background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`, color: C.text, fontSize: 14, outline: "none", fontFamily: "'DM Sans', sans-serif" }} />
                  <Btn onClick={sendChat} disabled={chatLoading}>{chatLoading ? "..." : "→"}</Btn>
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                  {["Analyse Marcus Johnson", "Prochain match ?", "Meilleur défenseur ?", "Prédiction finale de saison"].map(s => (
                    <button key={s} onClick={() => setChatInput(s)} style={{ padding: "5px 12px", borderRadius: 16, border: `1px solid rgba(255,92,0,0.3)`, background: "rgba(255,92,0,0.06)", color: C.orange, fontSize: 11, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>{s}</button>
                  ))}
                </div>
              </div>

              {/* Sidebar info */}
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <Card>
                  <SectionTitle>🏀 Joueurs en forme</SectionTitle>
                  {PLAYERS.filter(p => p.hot).map(p => (
                    <div key={p.id} style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
                      <Avatar name={p.name} size={32} espnId={p.espnId} headshot={p.headshot} league={p.league} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{p.name} 🔥</div>
                        <div style={{ fontSize: 11, color: C.muted }}>{p.pts} pts · Score {p.score}</div>
                      </div>
                    </div>
                  ))}
                </Card>
                <Card>
                  <SectionTitle>📊 Stats rapides</SectionTitle>
                  {(() => {
                    const pool = bullsPlayers.length ? bullsPlayers : PLAYERS;
                    const scorer = pool.reduce((a, b) => b.pts > a.pts ? b : a, pool[0]);
                    const passer = pool.reduce((a, b) => b.ast > a.ast ? b : a, pool[0]);
                    const rebounder = pool.reduce((a, b) => b.reb > a.reb ? b : a, pool[0]);
                    return [
                      { l: "Meilleur marqueur", v: `${scorer?.name?.split(" ").pop()} · ${scorer?.pts}` },
                      { l: "Meilleur passeur", v: `${passer?.name?.split(" ").pop()} · ${passer?.ast}` },
                      { l: "Meilleur rebondeur", v: `${rebounder?.name?.split(" ").pop()} · ${rebounder?.reb}` },
                    ].map(s => (
                      <div key={s.l} style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: 11, color: C.muted }}>{s.l}</div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{s.v}</div>
                      </div>
                    ));
                  })()}
                </Card>
              </div>
            </div>
          </div>
        )}
{tab === "jarvis" && isAdmin && (
  <div className="fade-in" style={{ height: "calc(100vh - 114px)", marginTop: -28, marginLeft: -24, marginRight: -24 }}>
    <Jarvis />
  </div>
)}
        {/* ── AGENT ── */}
        {tab === "agent" && (
          <div className="fade-in" style={{ height: "calc(100vh - 120px)", marginTop: -28, marginLeft: -24, marginRight: -24 }}>
            <Agent />
          </div>
        )}

        {/* ── SCOUT ── */}
        {tab === "scout" && <Scout />}

        {/* ── MARKETING ── */}
        {tab === "marketing" && isAdmin && <Marketing />}
{tab === "cards" && (
  <div className="fade-in" style={{ height: "calc(100vh - 114px)", marginTop: -28, marginLeft: -24, marginRight: -24 }}>
    <Cards />
  </div>
)}
{tab === "live" && (
  <div className="fade-in" style={{ height: "calc(100vh - 114px)", marginTop: -28, marginLeft: -24, marginRight: -24 }}>
    <LiveCenter />
  </div>
)}
{tab === "oracle" && <Oracle />}
        {tab === "duel" && <Duel />}
        {tab === "prematch" && <PreMatch />}
        {tab === "challenges" && <Challenges />}
        {tab === "leaderboard" && <Leaderboard />}
{tab === "vestiaire" && (
  <div className="fade-in" style={{ height: "calc(100vh - 114px)", marginTop: -28, marginLeft: -24, marginRight: -24 }}>
    <Vestiaire user={user} />
  </div>
)}
        {/* ── ACCOUNT ── */}
        {tab === "account" && (
          <div className="fade-in">
            <h1 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 46, letterSpacing: 2, marginBottom: 24 }}>MON <span style={{ color: C.orange }}>COMPTE</span></h1>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
              {/* Profile */}
              <Card>
                <SectionTitle>👤 Profil</SectionTitle>
                <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
                  <Avatar name={user.name} size={60} glow />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 18 }}>{user.name}</div>
                    <div style={{ color: C.muted, fontSize: 13 }}>{user.email}</div>
                    <Badge color={plan.color} style={{ marginTop: 6 }}>{plan.icon} {plan.name}</Badge>
                  </div>
                </div>
                {[
                  { label: "Nom", val: user.name },
                  { label: "Email", val: user.email },
                  { label: "Membre depuis", val: "Juin 2026" },
                ].map(f => (
                  <div key={f.label} style={{ padding: "10px 0", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                    <span style={{ color: C.muted }}>{f.label}</span>
                    <span style={{ fontWeight: 500 }}>{f.val}</span>
                  </div>
                ))}
                <Btn variant="ghost" full style={{ marginTop: 16 }}>Modifier le profil</Btn>
              </Card>

              {/* Subscription */}
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <Card glow>
                  <SectionTitle>💳 Abonnement actuel</SectionTitle>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                    <div style={{ fontSize: 42 }}>{plan.icon}</div>
                    <div>
                      <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 32, color: plan.color }}>{plan.name}</div>
                      <div style={{ fontSize: 13, color: C.muted }}>{plan.price}€ / mois · Actif</div>
                    </div>
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    {plan.features.slice(0, 4).map(f => (
                      <div key={f} style={{ display: "flex", gap: 8, fontSize: 13, marginBottom: 6 }}>
                        <span style={{ color: C.green }}>✓</span>{f}
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <Btn variant="ghost" small>Annuler</Btn>
                    <Btn small full>Changer de plan →</Btn>
                  </div>
                </Card>

                {/* Upgrade options */}
                {PLANS.filter(p => p.id !== plan.id).map(p => (
                  <div key={p.id} style={{ background: `${p.color}0a`, border: `1px solid ${p.color}33`, borderRadius: 14, padding: "16px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <span style={{ fontSize: 26 }}>{p.icon}</span>
                      <div>
                        <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 20, color: p.color }}>{p.name}</div>
                        <div style={{ fontSize: 12, color: C.muted }}>{p.desc}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 24, color: p.color }}>{p.price}€/m</div>
                      <button style={{ fontSize: 12, color: p.color, background: "none", border: `1px solid ${p.color}55`, borderRadius: 6, padding: "3px 10px", cursor: "pointer", marginTop: 4 }}>
                        {p.id === "elite" ? "Contacter" : "Passer à +"} →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      </div>{/* /content wrapper */}
      </div>{/* /flex layout */}

      <HoopiqRadio />
    </div>
  );
}

/* ─────────────────────────────────────────
   ROOT
───────────────────────────────────────── */
const USER_STORAGE_KEY = "hoopiq_user";

function loadStoredUser() {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function Root() {
  const [user, setUser] = useState(loadStoredUser);
  const [screen, setScreen] = useState(user ? "app" : "landing"); // landing | app
  const [authMode, setAuthMode] = useState(null);  // login | signup | null

  const handleAuth = (mode) => setAuthMode(mode);
  const handleSuccess = (u) => {
    try { localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(u)); } catch { /* storage unavailable */ }
    setUser(u); setAuthMode(null); setScreen("app");
  };
  const handleLogout = () => {
    try { localStorage.removeItem(USER_STORAGE_KEY); } catch { /* storage unavailable */ }
    setUser(null); setScreen("landing");
  };

  return (
    <>
      {screen === "landing" && <Landing onAuth={handleAuth} />}
      {screen === "app" && user && <App user={user} onLogout={handleLogout} />}
      {authMode && <AuthModal mode={authMode} onClose={() => setAuthMode(null)} onSuccess={handleSuccess} />}
    </>
  );
}
