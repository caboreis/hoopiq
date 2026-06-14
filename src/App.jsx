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
import TradeSimulator from "./TradeSimulator.jsx";
import Calendrier from "./Calendrier.jsx";
import PlanAssistant, { ASSISTANTS } from "./PlanAssistant.jsx";
import { supabase, isSupabaseConfigured } from "./supabaseClient";
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

const API_BASE = import.meta.env.DEV ? "http://localhost:3001" : "";

// Lance un vrai paiement Stripe Checkout (redirige vers la page Stripe sécurisée)
async function startCheckout(planId, email) {
  const r = await fetch(`${API_BASE}/api/plans`);
  const { plans } = await r.json();
  const p = (plans || []).find(x => x.id === planId);
  if (!p?.priceId) throw new Error("Paiement indisponible pour le moment — réessaie dans un instant.");
  const res = await fetch(`${API_BASE}/api/create-checkout-session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      priceId: p.priceId,
      plan: planId,
      successUrl: `${window.location.origin}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${window.location.origin}/?checkout=cancel&plan=${encodeURIComponent(planId)}`,
      customerEmail: email || undefined,
    }),
  });
  const data = await res.json();
  if (!data.url) throw new Error(data.error || "Erreur Stripe — réessaie.");
  window.location.href = data.url;
}

// Hiérarchie des plans + plan minimum requis par onglet (les onglets absents = accès libre)
const PLAN_RANK = { scout: 1, pro: 2, elite: 3 };
const TAB_MIN_PLAN = {
  oracle: "pro",
  duel: "pro",
  prematch: "pro",
  scout: "pro",
  trade: "pro",
  chat: "pro",
};

// Comptes ADMIN : accès complet + outils admin (JARVIS ops / Marketing / Agent).
// L'authentification se fait via un VRAI compte Supabase (email + mot de passe choisi par
// l'admin) — il n'y a plus aucun mot de passe en dur dans le code. Emails en minuscules.
const ADMIN_EMAILS = [
  "jorgedosreis729@gmail.com",
];
const isAdminEmail = (email) => !!email && ADMIN_EMAILS.includes(email.trim().toLowerCase());

// Comptes VIP : accès Elite complet GRATUIT (sans Stripe). Toutes les features payantes
// débloquées (cartes OR, assistant JARVIS Elite, analyses…), MAIS sans les outils admin
// (pas d'onglets JARVIS admin / Marketing / Agent — ça reste réservé aux ADMIN_EMAILS).
// Ajoute les emails ici, en minuscules.
const VIP_EMAILS = [
  "dosreislopes.neusa@gmail.com",
];
const isVipEmail = (email) => !!email && VIP_EMAILS.includes(email.trim().toLowerCase());

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
      fontFamily: "'Permanent Marker', cursive", fontSize: size * 0.36, color: "#fff", letterSpacing: 1,
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
        fontSize={size * 0.22} fontWeight={800} fontFamily="'Permanent Marker', cursive"
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

function BallLogo({ size = 40, fontSize = 26 }) {
  const lw = Math.max(1.5, size * 0.048);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, userSelect: "none" }}>
      <style>{`
        @keyframes ballSpin3D {
          from { transform: rotateY(0deg); }
          to   { transform: rotateY(360deg); }
        }
      `}</style>
      {/* Perspective wrapper — donne l'effet 3D */}
      <div style={{ perspective: `${size * 5}px`, flexShrink: 0 }}>
        <div style={{
          position: "relative", width: size, height: size,
          borderRadius: "50%",
          background: `radial-gradient(circle at 36% 32%, #f8a255, #e86818, #c04510)`,
          boxShadow: `inset -${size*.12}px -${size*.1}px ${size*.2}px rgba(0,0,0,0.4),
                      inset ${size*.06}px ${size*.05}px ${size*.12}px rgba(255,200,120,0.2),
                      0 2px 14px rgba(0,0,0,0.55)`,
          overflow: "hidden",
          animation: "ballSpin3D 2.5s linear infinite",
        }}>
          {/* Ligne horizontale centrale */}
          <div style={{
            position: "absolute", left: 0, right: 0,
            top: `calc(50% - ${lw/2}px)`, height: lw,
            background: "#1c0500",
          }} />
          {/* Couture gauche — ellipse décalée à gauche, on voit son arc droit */}
          <div style={{
            position: "absolute",
            width: "82%", height: "200%",
            left: "-18%", top: "-50%",
            borderRadius: "50%",
            border: `${lw}px solid #1c0500`,
            background: "transparent",
          }} />
          {/* Couture droite — ellipse décalée à droite, on voit son arc gauche */}
          <div style={{
            position: "absolute",
            width: "82%", height: "200%",
            right: "-18%", top: "-50%",
            borderRadius: "50%",
            border: `${lw}px solid #1c0500`,
            background: "transparent",
          }} />
        </div>
      </div>
      <span style={{
        fontFamily: "'Permanent Marker', cursive", fontSize,
        background: G.orange, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        letterSpacing: 3, lineHeight: 1,
      }}>HOOP IQ</span>
    </div>
  );
}

/* ─────────────────────────────────────────
   HOOPIQ RADIO
───────────────────────────────────────── */
const SPOTIFY_SRC = "https://open.spotify.com/embed/playlist/37i9dQZF1DX0XUsuxWHRQd?utm_source=generator&theme=0";

function HoopiqRadio() {
  const [hovered, setHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "fixed", bottom: isMobile ? 80 : 20, right: 20, zIndex: 2100,
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
  "/images/hero1.jpg",
  "/images/hero2.jpg",
  "/images/hero3.jpg",
  "/images/hero4.jpg",
  "/jc-gellidon-XmYSlYrupL8-unsplash.jpg",
  "/edgar-chaparro-kB5DnieBLtM-unsplash.jpg",
  "/logan-weaver-lgnwvr-XcBPc0Q_2h8-unsplash.jpg",
  "/kylie-osullivan-BfaBLVCBTI8-unsplash.jpg",
];

function Landing({ onAuth, onChoosePlan }) {
  const [arenaIdx, setArenaIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setArenaIdx(i => (i + 1) % HERO_ARENAS.length), 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;700&family=Permanent+Marker&family=Bangers&display=swap');
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
        <BallLogo size={36} fontSize={26} />
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

        <h1 className="fade-in" style={{ fontFamily: "'Permanent Marker', cursive", fontSize: "clamp(60px, 10vw, 110px)", lineHeight: .9, marginTop: 24, letterSpacing: 2, animationDelay: ".1s" }}>
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
              <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 38, color: C.orange }}>{v}</div>
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
          <h2 style={{ fontFamily: "'Permanent Marker', cursive", fontSize: 52, letterSpacing: 1 }}>TOUT CE DONT TU AS <span style={{ color: C.orange }}>BESOIN</span></h2>
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
              <div style={{ fontFamily: "'Permanent Marker', cursive", fontSize: 22, letterSpacing: 1, marginBottom: 8 }}>{f.title}</div>
              <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.7, fontFamily: "'DM Sans', sans-serif" }}>{f.desc}</div>
            </Card>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section style={{ padding: "80px 40px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <SectionTitle>Tarifs</SectionTitle>
          <h2 style={{ fontFamily: "'Permanent Marker', cursive", fontSize: 52, letterSpacing: 1 }}>CHOISIS TON <span style={{ color: C.orange }}>NIVEAU</span></h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
          {PLANS.map((plan) => (
            <div key={plan.id} className="plan-card" style={{
              background: plan.popular ? `linear-gradient(160deg, rgba(255,92,0,0.1), rgba(255,140,66,0.05))` : C.surface,
              border: `1px solid ${plan.popular ? "rgba(255,92,0,0.4)" : C.border}`,
              borderRadius: 20, padding: 28, transition: "all .3s", cursor: "pointer", position: "relative",
              boxShadow: plan.popular ? `0 0 50px rgba(255,92,0,0.12)` : "none",
            }} onClick={() => onChoosePlan(plan.id)}>
              {plan.popular && <div style={{ position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)", background: G.orange, color: "#fff", fontSize: 11, fontWeight: 800, padding: "4px 16px", borderRadius: 20, letterSpacing: 1.5, whiteSpace: "nowrap" }}>⚡ PLUS POPULAIRE</div>}
              <div style={{ fontSize: 40, marginBottom: 12 }}>{plan.icon}</div>
              <div style={{ fontFamily: "'Permanent Marker', cursive", fontSize: 28, letterSpacing: 2, color: plan.color }}>{plan.name}</div>
              <div style={{ fontSize: 13, color: C.muted, marginBottom: 20, fontFamily: "'DM Sans', sans-serif" }}>{plan.desc}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 24 }}>
                <span style={{ fontFamily: "'Permanent Marker', cursive", fontSize: 52, color: plan.color }}>{plan.price}€</span>
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
        <div style={{ fontFamily: "'Permanent Marker', cursive", fontSize: 22, background: G.orange, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 12 }}>HOOP IQ</div>
        © 2026 HoopIQ · Propulsé par Claude AI · Tous droits réservés
      </footer>
    </div>
  );
}

/* ─────────────────────────────────────────
   AUTH MODAL
───────────────────────────────────────── */
/* Paywall — s'affiche quand un onglet nécessite un plan supérieur */
function PaywallModal({ tabId, user, onClose }) {
  const needed = TAB_MIN_PLAN[tabId] || "pro";
  const [busy, setBusy] = useState(null);
  const [err, setErr] = useState(null);
  const candidates = PLANS.filter(p => PLAN_RANK[p.id] >= PLAN_RANK[needed]);
  const pay = async (planId) => {
    setBusy(planId); setErr(null);
    try { await startCheckout(planId, user.email); }
    catch (e) { setErr(e.message); setBusy(null); }
  };
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 3500, background: "rgba(0,0,0,0.78)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 22, padding: 32, maxWidth: 420, width: "100%", position: "relative", boxShadow: "0 30px 100px rgba(0,0,0,0.7)" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 14, right: 16, background: "none", border: "none", color: C.muted, fontSize: 22, cursor: "pointer" }}>×</button>
        <div style={{ fontSize: 44, textAlign: "center", marginBottom: 8 }}>🔒</div>
        <h2 style={{ fontFamily: "'Permanent Marker', cursive", fontSize: 30, letterSpacing: 1, textAlign: "center", marginBottom: 8 }}>
          FONCTIONNALITÉ <span style={{ color: C.orange }}>{needed.toUpperCase()}</span>
        </h2>
        <p style={{ color: C.muted, fontSize: 13, textAlign: "center", marginBottom: 22, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.5 }}>
          Cette section est réservée au plan {needed === "pro" ? "Pro et au-delà" : "Elite"}.<br />
          Débloque-la en quelques secondes — paiement sécurisé Stripe.
        </p>
        {err && <div style={{ color: C.red, fontSize: 13, textAlign: "center", marginBottom: 12 }}>{err}</div>}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {candidates.map(p => (
            <button key={p.id} onClick={() => pay(p.id)} disabled={!!busy} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "14px 18px", borderRadius: 12, cursor: busy ? "wait" : "pointer",
              border: `1px solid ${p.color}55`, background: `${p.color}11`,
              color: C.text, fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 700,
              opacity: busy && busy !== p.id ? 0.5 : 1, transition: "all .2s",
            }}>
              <span>{p.icon} {p.name}{p.popular ? " · ⚡ populaire" : ""}</span>
              <span style={{ fontFamily: "'Permanent Marker', cursive", fontSize: 20, color: p.color }}>
                {busy === p.id ? "⏳" : `${p.price}€/m`}
              </span>
            </button>
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: 14, fontSize: 11, color: C.muted, fontFamily: "'DM Sans', sans-serif" }}>
          🔒 Paiement sécurisé Stripe · Annulation à tout moment
        </div>
      </div>
    </div>
  );
}

function AuthModal({ mode, onClose, onSuccess, initialPlan }) {
  const [m, setM] = useState(mode);
  const [step, setStep] = useState(m === "signup" ? 1 : 0); // 0=login, 1=info, 2=plan, 3=recap, 4=email à confirmer
  const [form, setForm] = useState({ name: "", email: "", password: "", plan: initialPlan || "pro" });
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
    // L'admin se connecte comme tout le monde, via son vrai compte Supabase (plus de backdoor).
    if (!isSupabaseConfigured) { setErrors({ general: "Connexion indisponible — réessaie plus tard." }); return; }
    setLoading(true); setErrors({});
    const { data, error } = await supabase.auth.signInWithPassword({
      email: form.email.trim(),
      password: form.password,
    });
    setLoading(false);
    if (error) {
      setErrors({
        general: /confirm/i.test(error.message)
          ? "Confirme d'abord ton email — regarde ta boîte mail 📬"
          : "Email ou mot de passe incorrect.",
      });
      return;
    }
    const u = data.user;
    onSuccess({
      name: u.user_metadata?.name || u.email.split("@")[0],
      email: u.email,
      plan: u.user_metadata?.plan || "scout",
      createdAt: u.created_at,
    });
  };

  const handleSignup = async (goToCheckout = false) => {
    const email = form.email.trim();
    if (!email || !form.password) { setErrors({ general: "Email et mot de passe requis." }); setStep(1); return; }
    if (form.password.length < 6) { setErrors({ general: "Mot de passe : 6 caractères minimum." }); setStep(1); return; }
    if (!isSupabaseConfigured) { setErrors({ general: "Inscription indisponible — réessaie plus tard." }); return; }
    setLoading(true); setErrors({});
    const name = form.name || email.split("@")[0];
    const { data, error } = await supabase.auth.signUp({
      email,
      password: form.password,
      options: { data: { name, plan: form.plan } },
    });
    if (error) {
      setLoading(false);
      setErrors({
        general: /already|registered/i.test(error.message)
          ? "Un compte existe déjà avec cet email — connecte-toi !"
          : error.message,
      });
      return;
    }
    if (goToCheckout) {
      try { await startCheckout(form.plan, email); return; } // redirige vers Stripe
      catch (e) { setErrors({ general: e.message }); }
    }
    setLoading(false);
    if (!data.session) { setStep(4); return; } // confirmation email requise
    onSuccess({ name, email, plan: form.plan, createdAt: data.user?.created_at });
  };

  const selectedPlan = PLANS.find(p => p.id === form.plan);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.75)", backdropFilter: "blur(10px)" }}>
      <div style={{ background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 22, padding: 36, width: "100%", maxWidth: 440, position: "relative", boxShadow: "0 30px 100px rgba(0,0,0,0.7)" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", color: C.muted, fontSize: 22, cursor: "pointer" }}>×</button>

        <div style={{ fontFamily: "'Permanent Marker', cursive", fontSize: 22, background: G.orange, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: 2, marginBottom: 24 }}>HOOP IQ</div>

        {/* LOGIN */}
        {m === "login" && (
          <div>
            <h2 style={{ fontFamily: "'Permanent Marker', cursive", fontSize: 34, letterSpacing: 1, marginBottom: 6 }}>Bon retour 👋</h2>
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
            <h2 style={{ fontFamily: "'Permanent Marker', cursive", fontSize: 34, letterSpacing: 1, marginBottom: 6 }}>Créer un compte</h2>
            <p style={{ color: C.muted, fontSize: 13, marginBottom: 24, fontFamily: "'DM Sans', sans-serif" }}>14 jours gratuits · Sans carte bancaire</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <input style={inputStyle} placeholder="Prénom ou pseudo" {...field("name")} />
              <input style={inputStyle} placeholder="Email" type="email" {...field("email")} />
              <input style={inputStyle} placeholder="Mot de passe" type="password" {...field("password")} />
              {errors.general && <div style={{ color: C.red, fontSize: 13 }}>{errors.general}</div>}
              <Btn full onClick={() => { setErrors({}); setStep(2); }}>Suivant : Choix du plan →</Btn>
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
            <h2 style={{ fontFamily: "'Permanent Marker', cursive", fontSize: 34, letterSpacing: 1, marginBottom: 6 }}>Ton plan</h2>
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
                  <div style={{ fontFamily: "'Permanent Marker', cursive", fontSize: 22, color: plan.color }}>{plan.price}€/m</div>
                </div>
              ))}
            </div>
            <Btn full onClick={() => setStep(3)}>Suivant : Paiement →</Btn>
            <Btn variant="ghost" full onClick={() => setStep(1)} style={{ marginTop: 8 }}>← Retour</Btn>
          </div>
        )}

        {/* SIGNUP STEP 3 — RECAP + vrai paiement Stripe */}
        {m === "signup" && step === 3 && (
          <div>
            <h2 style={{ fontFamily: "'Permanent Marker', cursive", fontSize: 34, letterSpacing: 1, marginBottom: 6 }}>C'est presque bon !</h2>
            <div style={{ background: `${selectedPlan.color}11`, border: `1px solid ${selectedPlan.color}33`, borderRadius: 10, padding: "10px 14px", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}>{selectedPlan.icon} Plan {selectedPlan.name} · 14j gratuits</span>
              <span style={{ fontFamily: "'Permanent Marker', cursive", fontSize: 20, color: selectedPlan.color }}>{selectedPlan.price}€/mois</span>
            </div>
            <p style={{ color: C.muted, fontSize: 13, marginBottom: 18, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.5 }}>
              Démarre gratuitement sans carte bancaire, ou active ton abonnement tout de suite — paiement 100% sécurisé via Stripe.
            </p>
            {errors.general && <div style={{ color: C.red, fontSize: 13, marginBottom: 12 }}>{errors.general}</div>}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Btn full onClick={() => handleSignup(false)} disabled={loading}>
                {loading ? "⏳ Création du compte..." : "Démarrer l'essai gratuit →"}
              </Btn>
              <Btn variant="gold" full onClick={() => handleSignup(true)} disabled={loading}>
                💳 S'abonner maintenant via Stripe
              </Btn>
            </div>
            <div style={{ textAlign: "center", marginTop: 14, fontSize: 11, color: C.muted, fontFamily: "'DM Sans', sans-serif" }}>
              🔒 Paiement sécurisé Stripe · Annulation à tout moment
            </div>
            <Btn variant="ghost" full onClick={() => setStep(2)} style={{ marginTop: 10 }}>← Retour</Btn>
          </div>
        )}

        {/* SIGNUP STEP 4 — confirmation email requise */}
        {m === "signup" && step === 4 && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>📬</div>
            <h2 style={{ fontFamily: "'Permanent Marker', cursive", fontSize: 34, letterSpacing: 1, marginBottom: 10 }}>Confirme ton email</h2>
            <p style={{ color: C.muted, fontSize: 14, marginBottom: 24, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6 }}>
              On t'a envoyé un lien de confirmation à<br />
              <b style={{ color: C.orange }}>{form.email}</b><br />
              Clique dessus, puis connecte-toi.
            </p>
            <Btn full onClick={() => { setM("login"); setStep(0); setErrors({}); }}>J'ai confirmé — Se connecter →</Btn>
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
      <h1 style={{ fontFamily: "'Permanent Marker', cursive", fontSize: 46, letterSpacing: 2, marginBottom: 8 }}>
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
                    <div style={{ fontFamily: "'Permanent Marker', cursive", fontSize: 32, color: isLive ? C.blue : accentColor }}>
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
                      <div style={{ fontFamily: "'Permanent Marker', cursive", fontSize: 26 }}>{game.home.score}</div>
                    </div>
                    <div style={{ fontSize: 11, color: C.muted }}>vs</div>
                    <div>
                      <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>{game.away.abbreviation}</div>
                      <div style={{ fontFamily: "'Permanent Marker', cursive", fontSize: 26 }}>{game.away.score}</div>
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
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
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
  const [nflVideoIdx, setNflVideoIdx] = useState(0);
  const NFL_VIDEOS = ["/videos/nfl.mp4", "/videos/nfl_girls.mp4", "/videos/nfl2.mp4"];
  const NFL_BEATS = [
    { src: "/music/beat1.mp3", label: "AWARDING" },
    { src: "/music/beat5.mp3", label: "TONY" },
    { src: "/music/beat6.mp3", label: "APPEAR" },
    { src: "/music/beat3.mp3", label: "DRILL FR" },
    { src: "/music/beat4.mp3", label: "ARGENT" },
    { src: "/music/beat2.mp3", label: "CLASH DRILL" },
  ];
  const [nflBeatIdx, setNflBeatIdx] = useState(0);
  const [nflBeatPlaying, setNflBeatPlaying] = useState(false);
  const nflAudioRef = useRef(null);
  // Relais vidéo : chaque vidéo joue NFL_VIDEO_SECONDS puis passe le relai à la suivante.
  // Les 3 <video> restent montées → leur currentTime est conservé, donc chacune reprend où elle s'était arrêtée.
  const NFL_VIDEO_SECONDS = 20;
  const nflVideoRefs = useRef([]);

  useEffect(() => {
    if (showNflTeaser) {
      setNflVideoIdx(0);
      setNflBeatIdx(0);
      setNflBeatPlaying(true);
    } else {
      setNflBeatPlaying(false);
      if (nflAudioRef.current) { nflAudioRef.current.pause(); nflAudioRef.current.currentTime = 0; }
    }
  }, [showNflTeaser]);

  // Joue la vidéo active, met les autres en pause SANS toucher leur currentTime (reprise au bon endroit)
  useEffect(() => {
    if (!showNflTeaser) return;
    nflVideoRefs.current.forEach((v, i) => {
      if (!v) return;
      if (i === nflVideoIdx) v.play().catch(() => {});
      else v.pause();
    });
  }, [showNflTeaser, nflVideoIdx]);

  // Minuteur de relais : au bout de 20 s, on passe à la vidéo suivante (boucle infinie)
  useEffect(() => {
    if (!showNflTeaser) return;
    const t = setTimeout(() => {
      setNflVideoIdx(i => (i + 1) % NFL_VIDEOS.length);
    }, NFL_VIDEO_SECONDS * 1000);
    return () => clearTimeout(t);
  }, [showNflTeaser, nflVideoIdx]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const a = nflAudioRef.current;
    if (!a) return;
    a.src = NFL_BEATS[nflBeatIdx].src;
    if (nflBeatPlaying) a.play().catch(() => {});
    else a.pause();
  }, [nflBeatIdx, nflBeatPlaying]);
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

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

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

  const isAdmin = isAdminEmail(user.email);

  // Gating par plan — un onglet verrouillé ouvre le paywall au lieu de changer d'onglet
  const [paywallTab, setPaywallTab] = useState(null);
  const planRank = PLAN_RANK[user.plan] || 1;
  const isTabLocked = (id) => !isAdmin && (PLAN_RANK[TAB_MIN_PLAN[id]] || 0) > planRank;
  const openTab = (id) => { if (isTabLocked(id)) setPaywallTab(id); else setTab(id); };
  useEffect(() => {
    if (isTabLocked(tab)) { setTab("dashboard"); setPaywallTab(tab); }
  }, [tab, user.plan]); // eslint-disable-line react-hooks/exhaustive-deps

  // Accès aux cartes OR Légendaires : Pro/Elite, admin, ou pendant l'essai gratuit (débloque tout)
  const cardsTrialActive = !isAdmin && !user.planPaid && !!user.createdAt &&
    (Date.now() - new Date(user.createdAt).getTime()) < 14 * 864e5;
  const legendaryUnlocked = isAdmin || user.plan === "pro" || user.plan === "elite" || cardsTrialActive;
  const isElitePlan = isAdmin || user.plan === "elite";

  // Assistant IA personnel selon le plan de l'utilisateur (Rookie / Coach Pro / JARVIS Elite)
  const myAssistant = ASSISTANTS[user.plan] || ASSISTANTS.scout;

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
    { id: "trade",      label: "Trade IA",  icon: "🔀" },
    { id: "calendrier", label: "Calendrier", icon: "📅" },
    { id: "nfl-soon",  label: "NFL",       icon: "🏈", soon: true },
    { sep: true },
    { id: "vestiaire", label: "Vestiaire", icon: "💬" },
    { id: "cards",     label: "Cartes",    icon: "🎴" },
    { sep: true },
    // Assistant client par plan (Rookie/Coach Pro/JARVIS Elite). L'admin garde son JARVIS ops à la place.
    ...(isAdmin ? [] : [{ id: "assistant", label: myAssistant.name, icon: myAssistant.icon }]),
    { id: "chat",      label: "IA Chat",   icon: "🤖" },
    ...(isAdmin ? [{ id: "jarvis", label: "JARVIS", icon: "🦾" }] : []),
    ...(isAdmin ? [{ id: "agent", label: "Agent IA", icon: "🧠" }] : []),
    ...(isAdmin ? [{ id: "marketing", label: "Marketing", icon: "🚀" }] : []),
    { sep: true },
    { id: "account",   label: "Compte",    icon: "👤" },
  ];
  const TABS = ALL_TABS;
  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;700&family=Permanent+Marker&family=Bangers&display=swap');
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
        @keyframes slideUp { from{transform:translateY(100%)} to{transform:translateY(0)} }
        @media (max-width: 767px) {
          * { -webkit-tap-highlight-color: transparent; }
          .kpi-grid { grid-template-columns: repeat(2,1fr) !important; }
          .dash-grid { grid-template-columns: 1fr !important; }
          .account-grid { grid-template-columns: 1fr !important; }
          .players-grid { grid-template-columns: 1fr !important; }
          h1 { font-size: 32px !important; }
          h2 { font-size: 24px !important; }
          .bebas-title { font-size: 28px !important; }
          button, a { min-height: 44px; }
          input, textarea { font-size: 16px !important; min-height: 44px; }
        }
      `}</style>

      {/* NFL TEASER MODAL */}
      {showNflTeaser && (() => {
        const closeTeaser = () => setShowNflTeaser(false);
        return (
          <div style={{
            position: "fixed", inset: 0, zIndex: 2000, overflow: "hidden",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {/* Relais de 3 vidéos NFL — toutes montées en permanence, une seule visible (fondu).
                Chacune reprend où elle s'était mise en pause grâce au currentTime conservé. */}
            {NFL_VIDEOS.map((src, i) => (
              <video
                key={src}
                ref={el => { nflVideoRefs.current[i] = el; }}
                muted playsInline loop preload="auto"
                style={{
                  position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover",
                  opacity: i === nflVideoIdx ? 1 : 0,
                  transition: "opacity 0.8s ease",
                }}
                src={src}
              />
            ))}

            {/* Overlay sombre pour lisibilité */}
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.55) 50%, rgba(0,0,0,0.8) 100%)" }} />

            {/* Bouton fermer */}
            <button onClick={closeTeaser} style={{
              position: "absolute", top: 20, right: 20, zIndex: 1,
              background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.2)",
              color: "#fff", fontSize: 22, width: 44, height: 44, borderRadius: "50%",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              backdropFilter: "blur(8px)",
            }}>×</button>

            {/* Texte overlay centré */}
            <div style={{ position: "relative", zIndex: 1, textAlign: "center", padding: "0 24px", maxWidth: 560 }}>
              <style>{`
                @keyframes nflTextReveal { 0%{opacity:0;letter-spacing:20px} 100%{opacity:1;letter-spacing:6px} }
                @keyframes nflLineGrow { from{width:0} to{width:120px} }
                @keyframes nflPulse { 0%,100%{opacity:1} 50%{opacity:0.7} }
              `}</style>

              <div style={{
                fontFamily: "'Permanent Marker', cursive", fontSize: "clamp(52px,12vw,96px)",
                letterSpacing: 6, lineHeight: 1, color: "#fff",
                textShadow: "0 0 40px rgba(200,16,46,0.9), 0 4px 24px rgba(0,0,0,0.8)",
                animation: "nflTextReveal 0.9s ease both",
              }}>NFL</div>

              <div style={{
                fontFamily: "'Permanent Marker', cursive", fontSize: "clamp(28px,6vw,48px)",
                letterSpacing: 10, color: "#FFB612",
                textShadow: "0 0 20px rgba(255,182,18,0.7)",
                animation: "nflTextReveal 0.9s ease 0.2s both",
              }}>COMING SOON</div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, margin: "18px 0" }}>
                <div style={{ height: 1, background: "#C8102E", animation: "nflLineGrow 1s ease 0.5s both" }} />
                <span style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.7)", letterSpacing: 3, whiteSpace: "nowrap" }}>BIENTÔT SUR HOOPIQ</span>
                <div style={{ height: 1, background: "#C8102E", animation: "nflLineGrow 1s ease 0.5s both" }} />
              </div>

              <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 32, flexWrap: "wrap" }}>
                {["Mahomes","Lamar Jackson","CeeDee Lamb","Micah Parsons"].map(tag => (
                  <span key={tag} style={{
                    fontSize: 12, fontWeight: 800, padding: "5px 14px", borderRadius: 20,
                    background: "rgba(200,16,46,0.25)", border: "1px solid rgba(200,16,46,0.5)",
                    color: "#fff", backdropFilter: "blur(6px)",
                  }}>{tag}</span>
                ))}
              </div>

              <button onClick={closeTeaser} style={{
                padding: "14px 40px", borderRadius: 50,
                background: "linear-gradient(135deg, #C8102E, #a00d23)",
                border: "none", color: "#fff", fontSize: 15, fontWeight: 800,
                cursor: "pointer", fontFamily: "inherit",
                boxShadow: "0 4px 32px rgba(200,16,46,0.6)",
                animation: "nflPulse 2s ease-in-out infinite",
              }}>
                J'attends avec impatience ! 🏈
              </button>
            </div>

            {/* ── BEAT PLAYER ── */}
            <audio
              ref={nflAudioRef}
              onEnded={() => setNflBeatIdx(i => (i + 1) % NFL_BEATS.length)}
            />
            <div style={{
              position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 2,
              background: "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(10,0,2,0.85) 100%)",
              backdropFilter: "blur(12px)",
              borderTop: "1px solid rgba(200,16,46,0.3)",
              padding: "14px 20px",
              display: "flex", alignItems: "center", gap: 14,
            }}>
              {/* Icône NFL */}
              <div style={{ fontSize: 22, flexShrink: 0 }}>🏈</div>

              {/* Beat name + barre de progression simulée */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: "'Permanent Marker', cursive", fontSize: 13, letterSpacing: 2,
                  color: "#C8102E", marginBottom: 3,
                }}>NFL BEATS</div>
                <div style={{
                  fontSize: 11, fontWeight: 700, color: "#fff", letterSpacing: 1,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>{NFL_BEATS[nflBeatIdx].label}</div>
                {/* Dots indicateur */}
                <div style={{ display: "flex", gap: 4, marginTop: 5 }}>
                  {NFL_BEATS.map((_, i) => (
                    <div key={i} onClick={() => { setNflBeatIdx(i); setNflBeatPlaying(true); }} style={{
                      width: i === nflBeatIdx ? 14 : 5, height: 4, borderRadius: 2,
                      background: i === nflBeatIdx ? "#C8102E" : "rgba(255,255,255,0.25)",
                      cursor: "pointer", transition: "all .3s",
                    }} />
                  ))}
                </div>
              </div>

              {/* Contrôles */}
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                <button onClick={() => setNflBeatIdx(i => (i - 1 + NFL_BEATS.length) % NFL_BEATS.length)} style={{
                  background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)",
                  color: "#fff", width: 34, height: 34, borderRadius: "50%",
                  cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center",
                }}>◀</button>

                <button onClick={() => setNflBeatPlaying(p => !p)} style={{
                  background: nflBeatPlaying ? "#C8102E" : "rgba(200,16,46,0.3)",
                  border: `1px solid #C8102E`,
                  color: "#fff", width: 42, height: 42, borderRadius: "50%",
                  cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: nflBeatPlaying ? "0 0 16px rgba(200,16,46,0.6)" : "none",
                  transition: "all .2s",
                }}>{nflBeatPlaying ? "⏸" : "▶"}</button>

                <button onClick={() => setNflBeatIdx(i => (i + 1) % NFL_BEATS.length)} style={{
                  background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)",
                  color: "#fff", width: 34, height: 34, borderRadius: "50%",
                  cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center",
                }}>▶</button>
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
        display: isMobile ? "none" : "flex", flexDirection: "column", overflowY: "auto", overflowX: "hidden",
      }}>
        {/* Logo */}
        <div style={{ padding: "16px 16px 14px", borderBottom: `1px solid rgba(255,255,255,0.06)` }}>
          <BallLogo size={34} fontSize={22} />
          <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1, marginTop: 4 }}>Intelligence Basket IA</div>
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
            <button key={t.id} className="nav-tab" onClick={() => openTab(t.id)} style={{
              position: "relative", width: "100%", padding: "9px 12px", borderRadius: 10, border: "none",
              cursor: "pointer", display: "flex", alignItems: "center", gap: 10, marginBottom: 2,
              background: tab === t.id ? "rgba(255,92,0,0.13)" : "transparent",
              color: tab === t.id ? C.orange : C.muted,
              fontWeight: tab === t.id ? 700 : 500,
              fontSize: 13, transition: "all .2s", fontFamily: "'DM Sans', sans-serif", textAlign: "left",
              borderLeft: tab === t.id ? `3px solid ${C.orange}` : "3px solid transparent",
              opacity: isTabLocked(t.id) ? 0.55 : 1,
            }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>{t.icon}</span>
              <span style={{ flex: 1 }}>{t.label}</span>
              {isTabLocked(t.id) && <span style={{ fontSize: 11, flexShrink: 0 }}>🔒</span>}
              {!isTabLocked(t.id) && t.badge > 0 && (
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

      {/* MOBILE BOTTOM NAV */}
      {isMobile && (() => {
        const BOTTOM_TABS = [
          { id: "dashboard", label: "Accueil", icon: "⚡" },
          { id: "live",      label: "Live",    icon: "🔴" },
          { id: "oracle",    label: "Oracle",  icon: "🔮" },
          { id: "cards",     label: "Cartes",  icon: "🎴" },
          { id: "__more__",  label: "Plus",    icon: "☰"  },
        ];
        return (
          <>
            {/* Bottom bar */}
            <div style={{
              position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 200,
              background: "#0d0d1f", borderTop: "1px solid rgba(255,255,255,0.08)",
              display: "flex", paddingBottom: "env(safe-area-inset-bottom, 0px)",
            }}>
              {BOTTOM_TABS.map(t => {
                const isActive = t.id === "__more__" ? showMobileMenu : tab === t.id;
                return (
                  <button key={t.id} onClick={() => {
                    if (t.id === "__more__") { setShowMobileMenu(m => !m); }
                    else { openTab(t.id); setShowMobileMenu(false); }
                  }} style={{
                    flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
                    justifyContent: "center", padding: "8px 4px", border: "none",
                    background: "transparent", cursor: "pointer", color: isActive ? C.orange : C.muted,
                    fontSize: 10, fontWeight: isActive ? 700 : 500, gap: 3, fontFamily: "'DM Sans', sans-serif",
                    minHeight: 56,
                  }}>
                    <span style={{ fontSize: 20 }}>{t.icon}</span>
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Full menu overlay */}
            {showMobileMenu && (
              <div style={{
                position: "fixed", inset: 0, zIndex: 199,
                background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)",
              }} onClick={() => setShowMobileMenu(false)}>
                <div onClick={e => e.stopPropagation()} style={{
                  position: "absolute", bottom: 64, left: 0, right: 0,
                  background: "#0d0d1f", borderTop: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "20px 20px 0 0", padding: "16px 16px 8px",
                  animation: "slideUp .25s ease",
                  maxHeight: "70vh", overflowY: "auto",
                }}>
                  <div style={{ width: 36, height: 4, background: "rgba(255,255,255,0.15)", borderRadius: 2, margin: "0 auto 16px" }} />
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                    {TABS.filter(t => !t.sep).map(t => {
                      const isActive = tab === t.id;
                      return (
                        <button key={t.id} onClick={() => { openTab(t.id); setShowMobileMenu(false); }} style={{
                          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                          padding: "12px 4px", borderRadius: 12, border: "none", cursor: "pointer",
                          background: isActive ? "rgba(255,92,0,0.15)" : "rgba(255,255,255,0.04)",
                          color: isActive ? C.orange : C.text,
                          fontSize: 11, fontWeight: isActive ? 700 : 400, gap: 4, fontFamily: "'DM Sans', sans-serif",
                          minHeight: 64, opacity: isTabLocked(t.id) ? 0.55 : 1, position: "relative",
                        }}>
                          <span style={{ fontSize: 22 }}>{t.icon}</span>
                          <span style={{ textAlign: "center", lineHeight: 1.2 }}>{t.label}{isTabLocked(t.id) ? " 🔒" : ""}</span>
                        </button>
                      );
                    })}
                  </div>
                  <div style={{ padding: "12px 0 4px", borderTop: "1px solid rgba(255,255,255,0.06)", marginTop: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Avatar name={user.name} size={28} />
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{user.name}</div>
                        <Badge color={plan.color} style={{ fontSize: 9 }}>{plan.icon} {plan.name}</Badge>
                      </div>
                    </div>
                    <button onClick={onLogout} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 14, padding: 8 }}>⎋ Déco</button>
                  </div>
                </div>
              </div>
            )}
          </>
        );
      })()}

      {/* CONTENT */}
      <div style={{ marginLeft: isMobile ? 0 : 220, flex: 1, minWidth: 0 }}>
      <div style={{ maxWidth: 1140, margin: "0 auto", padding: isMobile ? "16px 14px 90px" : "28px 24px 80px" }}>

        {/* ── DASHBOARD ── */}
        {tab === "dashboard" && (
          <div className="fade-in">
            <div style={{ marginBottom: 28, display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div>
                <div style={{ fontFamily: "'Permanent Marker', cursive", fontSize: 20, color: C.orange, marginBottom: 6, transform: "rotate(-2deg)" }}>Bienvenue, {user.name} 👋</div>
                <h1 style={{ fontFamily: "'Permanent Marker', cursive", fontSize: isMobile ? 30 : 44, letterSpacing: 0, lineHeight: 1.1 }}>
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
            <div className="kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: isMobile ? 10 : 16, marginBottom: 24 }}>
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
                  <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 44, color: k.color, lineHeight: 1, letterSpacing: 1 }}>{k.val}</div>
                  <div style={{ fontSize: 12, color: C.text, fontWeight: 600, marginTop: 5 }}>{k.label}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{k.sub}</div>
                </div>
              ))}
            </div>

            <div className="dash-grid" style={{ display: "grid", gridTemplateColumns: "1.3fr 0.7fr", gap: 20, marginBottom: 20 }}>
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
                              <div style={{ fontFamily: "'Permanent Marker', cursive", fontSize: 28, letterSpacing: 2, lineHeight: 1 }}>
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
                        <div style={{ fontFamily: "'Permanent Marker', cursive", fontSize: 18, color: C.orange }}>{player.score}</div>
                        <div style={{ fontSize: 11, color: player.trend >= 0 ? C.green : C.red }}>{player.trend >= 0 ? `+${player.trend}` : player.trend}</div>
                      </div>
                    </div>
                  ))
                )}
              </Card>
            </div>

            <div className="dash-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>
              {/* Top performers */}
              <Card>
                <SectionTitle>🏆 Top Performers IA</SectionTitle>
                {(bullsPlayers.length ? bullsPlayers.slice(0, 4) : PLAYERS.slice(0, 4)).map((p, i) => (
                  <div key={p.id} className="player-row" onClick={() => { setTab("players"); analyzePlayer(p); }} style={{
                    display: "flex", alignItems: "center", gap: 14, padding: "12px 8px",
                    borderRadius: 10, transition: "all .15s",
                    borderBottom: i < 3 ? `1px solid ${C.border}` : "none",
                  }}>
                    <span style={{ fontFamily: "'Permanent Marker', cursive", fontSize: 18, color: i === 0 ? C.orange : C.muted, width: 20, textAlign: "center" }}>#{i + 1}</span>
                    <Avatar name={p.name} size={38} glow={i === 0} espnId={p.espnId} headshot={p.headshot} league={p.league} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{p.name} {p.hot && <span title="En feu">🔥</span>}</div>
                      <div style={{ fontSize: 12, color: C.muted }}>{p.team} · {p.pos}</div>
                    </div>
                    <div style={{ textAlign: "right", marginRight: 8 }}>
                      <div style={{ fontFamily: "'Permanent Marker', cursive", fontSize: 22, color: C.orange }}>{p.pts}</div>
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
                  <div style={{ fontFamily: "'Permanent Marker', cursive", fontSize: 28, color: plan.color }}>{plan.icon} {plan.name}</div>
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
                        <div style={{ fontFamily: "'Permanent Marker', cursive", fontSize: 24, color: isLive ? C.red : C.orange, letterSpacing: 1 }}>
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
                        <div style={{ fontFamily: "'Permanent Marker', cursive", fontSize: 34, letterSpacing: 2, lineHeight: 1 }}>
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

              <h1 style={{ fontFamily: "'Permanent Marker', cursive", fontSize: 46, letterSpacing: 2, marginBottom: 6 }}>ANALYSE <span style={{ color: C.orange }}>JOUEURS</span></h1>
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

              <div className="players-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
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
        {tab === "assistant" && <PlanAssistant plan={user.plan} />}

        {tab === "chat" && (
          <div className="fade-in">
            <h1 style={{ fontFamily: "'Permanent Marker', cursive", fontSize: 46, letterSpacing: 2, marginBottom: 6 }}>ASSISTANT <span style={{ color: C.orange }}>IA</span></h1>
            <p style={{ color: C.muted, fontSize: 14, marginBottom: 20 }}>Pose n'importe quelle question basket — powered by Claude</p>
            <div className="dash-grid" style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 20, alignItems: "start" }}>
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
        {/* ── AGENT (admin uniquement) ── */}
        {tab === "agent" && isAdmin && (
          <div className="fade-in" style={{ height: "calc(100vh - 120px)", marginTop: -28, marginLeft: -24, marginRight: -24 }}>
            <Agent />
          </div>
        )}

        {/* ── SCOUT ── */}
        {tab === "scout" && <Scout />}
        {tab === "trade" && <TradeSimulator />}
        {tab === "calendrier" && <Calendrier />}

        {/* ── MARKETING ── */}
        {tab === "marketing" && isAdmin && <Marketing />}
{tab === "cards" && (
  <div className="fade-in" style={{ height: "calc(100vh - 114px)", marginTop: -28, marginLeft: -24, marginRight: -24 }}>
    <Cards plan={user.plan} legendaryUnlocked={legendaryUnlocked} isElite={isElitePlan} onUpgrade={() => setPaywallTab("cards-legendary")} />
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
            <h1 style={{ fontFamily: "'Permanent Marker', cursive", fontSize: 46, letterSpacing: 2, marginBottom: 24 }}>MON <span style={{ color: C.orange }}>COMPTE</span></h1>
            <div className="account-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
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
                      <div style={{ fontFamily: "'Permanent Marker', cursive", fontSize: 32, color: plan.color }}>{plan.name}</div>
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
                        <div style={{ fontFamily: "'Permanent Marker', cursive", fontSize: 20, color: p.color }}>{p.name}</div>
                        <div style={{ fontSize: 12, color: C.muted }}>{p.desc}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontFamily: "'Permanent Marker', cursive", fontSize: 24, color: p.color }}>{p.price}€/m</div>
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
      {user.trialExpired && (
        <div onClick={() => setPaywallTab("oracle")} style={{
          position: "fixed", top: 12, left: "50%", transform: "translateX(-50%)", zIndex: 1500,
          background: "linear-gradient(90deg, rgba(255,92,0,0.95), rgba(255,140,66,0.95))",
          color: "#fff", padding: "10px 20px", borderRadius: 30, fontSize: 13, fontWeight: 700,
          fontFamily: "'DM Sans', sans-serif", cursor: "pointer", whiteSpace: "nowrap",
          boxShadow: "0 8px 30px rgba(255,92,0,0.35)", maxWidth: "92vw", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          ⏰ Essai gratuit terminé — passe au niveau supérieur 🚀
        </div>
      )}
      {paywallTab && <PaywallModal tabId={paywallTab} user={user} onClose={() => setPaywallTab(null)} />}
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
    if (!raw) return null;
    const u = JSON.parse(raw);
    if (!u?.email || !u?.name || !u?._s) return null;
    if (u._s !== btoa(`hiq:${u.email}:2025`)) return null;
    // v2 = compte réel Supabase (ou accès admin) — les anciennes sessions simulées sont invalidées
    if (u._v !== 2 && !isAdminEmail(u.email)) return null;
    return u;
  } catch {
    return null;
  }
}

const PENDING_PLAN_KEY = "hoopiq_pending_plan";

/* Page plein écran de retour Stripe — succès ou annulation */
function CheckoutResultPage({ result, onClose, onRetry }) {
  const ok = result.type === "success";
  const plan = PLANS.find(p => p.id === result.plan);
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 4000, background: "rgba(4,4,12,0.96)", backdropFilter: "blur(14px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ textAlign: "center", maxWidth: 460, width: "100%", background: C.bg2, border: `1px solid ${ok ? "rgba(34,197,94,0.35)" : C.border}`, borderRadius: 24, padding: "48px 36px", boxShadow: ok ? "0 0 80px rgba(34,197,94,0.15)" : "0 30px 100px rgba(0,0,0,0.7)" }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>{ok ? "🎉" : "😕"}</div>
        <h1 style={{ fontFamily: "'Permanent Marker', cursive", fontSize: 42, letterSpacing: 2, marginBottom: 10, color: ok ? C.green : C.text }}>
          {ok ? "PAIEMENT CONFIRMÉ" : "PAIEMENT ANNULÉ"}
        </h1>
        {ok ? (
          <>
            {plan && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: `${plan.color}15`, border: `1px solid ${plan.color}44`, borderRadius: 30, padding: "8px 20px", marginBottom: 18 }}>
                <span style={{ fontSize: 20 }}>{plan.icon}</span>
                <span style={{ fontFamily: "'Permanent Marker', cursive", fontSize: 20, letterSpacing: 1, color: plan.color }}>PLAN {plan.name.toUpperCase()} ACTIVÉ</span>
              </div>
            )}
            <p style={{ color: C.muted, fontSize: 14, marginBottom: 28, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6 }}>
              Ton abonnement est actif. Un reçu t'a été envoyé par email.<br />Bienvenue dans le game 🏀
            </p>
            <Btn full onClick={onClose}>C'est parti →</Btn>
          </>
        ) : (
          <>
            <p style={{ color: C.muted, fontSize: 14, marginBottom: 28, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6 }}>
              Aucun débit n'a été effectué.<br />Ton compte reste actif, tu peux réessayer quand tu veux.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {result.plan && <Btn full onClick={onRetry}>💳 Réessayer le paiement →</Btn>}
              <Btn variant="ghost" full onClick={onClose}>Continuer sans abonnement</Btn>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function Root() {
  const [user, setUser] = useState(loadStoredUser);
  const [screen, setScreen] = useState(user ? "app" : "landing"); // landing | app
  const [authMode, setAuthMode] = useState(null);  // login | signup | null
  const [planPick, setPlanPick] = useState(null);  // plan présélectionné depuis la landing
  const [notice, setNotice] = useState(null);      // bannière info/succès
  const [checkoutResult, setCheckoutResult] = useState(null); // page succès/échec après Stripe

  const handleAuth = (mode) => setAuthMode(mode);
  const handleSuccess = (u) => {
    let plan = u.plan;
    // Un paiement Stripe effectué avant la connexion ? On applique le plan en attente.
    try {
      const pending = JSON.parse(localStorage.getItem(PENDING_PLAN_KEY) || "null");
      if (pending?.email === u.email && pending.plan) {
        plan = pending.plan;
        localStorage.removeItem(PENDING_PLAN_KEY);
        if (isSupabaseConfigured) supabase.auth.updateUser({ data: { plan } }).catch(() => {});
      }
    } catch { /* ignore */ }
    const signed = { ...u, plan, _v: 2, _s: btoa(`hiq:${u.email}:2025`) };
    try { localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(signed)); } catch { /* storage unavailable */ }
    setUser(signed); setAuthMode(null); setScreen("app");
  };
  const handleLogout = () => {
    try { localStorage.removeItem(USER_STORAGE_KEY); } catch { /* storage unavailable */ }
    if (isSupabaseConfigured) supabase.auth.signOut().catch(() => {});
    setUser(null); setAuthMode(null); setScreen("landing");
  };

  // Choix d'un plan depuis la landing : connecté → Stripe direct, sinon inscription
  const handleChoosePlan = (planId) => {
    if (user) {
      startCheckout(planId, user.email).catch(e => setNotice({ type: "info", text: e.message }));
    } else {
      setPlanPick(planId);
      setAuthMode("signup");
    }
  };

  // Session Supabase = source de vérité (restaure la session au chargement + login auto après confirmation email)
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const sync = (sUser) => {
      if (!sUser?.email) return;
      handleSuccess({
        name: sUser.user_metadata?.name || sUser.email.split("@")[0],
        email: sUser.email,
        plan: sUser.user_metadata?.plan || "scout",
        createdAt: sUser.created_at,
      });
    };
    supabase.auth.getSession().then(({ data }) => sync(data?.session?.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) sync(session.user);
    });
    return () => sub?.subscription?.unsubscribe?.();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Retour de Stripe Checkout — vérifie le paiement côté serveur et active le plan
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("checkout");
    if (!status) return;
    const sessionId = params.get("session_id");
    const cancelPlan = params.get("plan");
    window.history.replaceState({}, "", window.location.pathname);
    if (status === "cancel") {
      setCheckoutResult({ type: "cancel", plan: cancelPlan || null });
      return;
    }
    if (status !== "success" || !sessionId) return;
    (async () => {
      try {
        const r = await fetch(`${API_BASE}/api/checkout/verify?session_id=${encodeURIComponent(sessionId)}`);
        const d = await r.json();
        if (d.paid && d.plan) {
          setUser(prev => {
            if (!prev) {
              // Pas encore connecté (ex: email à confirmer) — le plan sera appliqué au prochain login
              if (d.email) {
                try { localStorage.setItem(PENDING_PLAN_KEY, JSON.stringify({ email: d.email, plan: d.plan })); } catch { /* ignore */ }
              }
              return prev;
            }
            const upd = { ...prev, plan: d.plan, planPaid: true };
            try { localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(upd)); } catch { /* ignore */ }
            return upd;
          });
          if (isSupabaseConfigured) supabase.auth.updateUser({ data: { plan: d.plan } }).catch(() => {});
          setCheckoutResult({ type: "success", plan: d.plan });
        } else {
          setNotice({ type: "info", text: "Paiement en cours de validation — réessaie dans un instant." });
        }
      } catch {
        setNotice({ type: "info", text: "Impossible de vérifier le paiement — contacte le support." });
      }
    })();
  }, []);

  // Plan payé vérifié depuis Supabase (table subscriptions) — prime sur le plan choisi à l'inscription
  useEffect(() => {
    if (!user?.email || isAdminEmail(user.email)) return;
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`${API_BASE}/api/subscription?email=${encodeURIComponent(user.email)}`);
        const d = await r.json();
        if (cancelled || !d?.plan || d.status !== "active") return;
        setUser(prev => {
          if (!prev || (prev.plan === d.plan && prev.planPaid)) return prev;
          const upd = { ...prev, plan: d.plan, planPaid: true };
          try { localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(upd)); } catch { /* ignore */ }
          return upd;
        });
      } catch { /* hors-ligne — on garde le plan local */ }
    })();
    return () => { cancelled = true; };
  }, [user?.email]); // eslint-disable-line react-hooks/exhaustive-deps

  // La bannière disparaît toute seule
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 7000);
    return () => clearTimeout(t);
  }, [notice]);

  // Hard guard — si user devient null alors qu'on est dans l'app, retour à landing
  useEffect(() => {
    if (!user && screen === "app") setScreen("landing");
  }, [user, screen]);

  // Essai gratuit 14 jours : sans abonnement payé, retour au plan Scout après expiration.
  // Admin et abonnés payants (planPaid) ne sont jamais rétrogradés.
  const TRIAL_MS = 14 * 24 * 60 * 60 * 1000;
  let appUser = user;
  if (user && isVipEmail(user.email)) {
    // VIP : Elite gratuit à vie (jamais rétrogradé), mais pas admin.
    appUser = { ...user, plan: "elite", planPaid: true, vip: true };
  } else if (
    user && !isAdminEmail(user.email) && !user.planPaid &&
    user.createdAt && (PLAN_RANK[user.plan] || 1) > 1 &&
    Date.now() - new Date(user.createdAt).getTime() > TRIAL_MS
  ) {
    appUser = { ...user, plan: "scout", trialExpired: true };
  }

  return (
    <>
      {screen === "landing" && <Landing onAuth={handleAuth} onChoosePlan={handleChoosePlan} />}
      {screen === "app" && user && <App user={appUser} onLogout={handleLogout} />}
      {authMode && <AuthModal mode={authMode} onClose={() => { setAuthMode(null); setPlanPick(null); }} onSuccess={handleSuccess} initialPlan={planPick} />}
      {checkoutResult && (
        <CheckoutResultPage
          result={checkoutResult}
          onClose={() => {
            setCheckoutResult(null);
            // Paiement réussi mais pas connecté (email à confirmer) → on l'amène au login
            if (checkoutResult.type === "success" && !user) setAuthMode("login");
          }}
          onRetry={() => {
            const planId = checkoutResult.plan;
            setCheckoutResult(null);
            startCheckout(planId, user?.email).catch(e => setNotice({ type: "info", text: e.message }));
          }}
        />
      )}
      {notice && (
        <div style={{
          position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)", zIndex: 3000,
          background: notice.type === "success" ? "rgba(18,110,55,0.96)" : "rgba(35,35,55,0.96)",
          color: "#fff", padding: "12px 22px", borderRadius: 12, fontSize: 14,
          fontFamily: "'DM Sans', sans-serif", boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", gap: 14, maxWidth: "90vw",
        }}>
          {notice.text}
          <span onClick={() => setNotice(null)} style={{ cursor: "pointer", opacity: 0.7, fontSize: 18 }}>×</span>
        </div>
      )}
    </>
  );
}
