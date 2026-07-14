import { useState } from "react";
import { createPortal } from "react-dom";

const C = {
  bg: "#06060f", bg2: "#0d0d1f",
  surface: "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.07)",
  red: "#e8002d", redL: "#ff4060",
  gold: "#ffd700", green: "#22d37a",
  blue: "#4fa3ff", text: "#f0f0ff", muted: "#6b6b88",
};

const G = {
  red: `linear-gradient(135deg, #e8002d, #ff4060)`,
  gold: `linear-gradient(135deg, #ffd700, #ffaa00)`,
};

const RARITY = {
  gold:      { label: "OR LÉGENDAIRE", color: "#ffd700", glow: "rgba(255,215,0,0.9)",  bg: "linear-gradient(160deg,#1a1000,#3d2800,#1a1000)", border: "#ffd700", stars: 5 },
  legendary: { label: "Légendaire",    color: "#e8002d", glow: "rgba(232,0,45,0.8)",   bg: "linear-gradient(160deg,#1a0005,#3d0010,#1a0005)", border: "#e8002d", stars: 5 },
  epic:      { label: "Épique",        color: "#c084fc", glow: "rgba(192,132,252,0.7)", bg: "linear-gradient(160deg,#0d0020,#2d0060,#0d0020)", border: "#c084fc", stars: 4 },
  rare:      { label: "Rare",          color: "#60a5fa", glow: "rgba(96,165,250,0.6)",  bg: "linear-gradient(160deg,#000d20,#002050,#000d20)", border: "#60a5fa", stars: 3 },
  common:    { label: "Commun",        color: "#9ca3af", glow: "rgba(156,163,175,0.3)", bg: "linear-gradient(160deg,#0a0a0a,#1c1c1c,#0a0a0a)", border: "#4b5563", stars: 1 },
};

const FIGHTERS = [
  // ── HEAVYWEIGHT ──
  { id: 1,  espnId: 2335639, name: "Jon Jones",             nickname: "BONES",         org: "UFC", belt: true,  weightClass: "Heavyweight",       record: "27-1-0", wins: 27, losses: 1, draws: 0, koPct: 48, subPct: 19, winStreak: 3,  rank: 1,  score: 99, rarity: "gold",      trait: "GOAT",          country: "🇺🇸", style: "Wrestling/BJJ" },
  { id: 2,  espnId: 4010976, name: "Tom Aspinall",          nickname: "THE TERMINATOR",org: "UFC", belt: true,  weightClass: "Heavyweight",       record: "15-3-0", wins: 15, losses: 3, draws: 0, koPct: 67, subPct: 13, winStreak: 5,  rank: 2,  score: 93, rarity: "legendary", trait: "KO MACHINE",    country: "🇬🇧", style: "Boxing/BJJ" },
  { id: 3,  espnId: 4426000, name: "Ciryl Gane",            nickname: "BON GAMIN",     org: "UFC", belt: false, weightClass: "Heavyweight",       record: "12-2-0", wins: 12, losses: 2, draws: 0, koPct: 42, subPct: 8,  winStreak: 2,  rank: 3,  score: 88, rarity: "epic",      trait: "TECHNIQUE",     country: "🇫🇷", style: "Kickboxing" },
  { id: 4,  espnId: 2504951, name: "Stipe Miocic",          nickname: "STIPE",         org: "UFC", belt: false, weightClass: "Heavyweight",       record: "20-4-0", wins: 20, losses: 4, draws: 0, koPct: 65, subPct: 5,  winStreak: 0,  rank: 4,  score: 85, rarity: "epic",      trait: "LÉGENDE",       country: "🇺🇸", style: "Boxing" },
  // ── LIGHT HEAVYWEIGHT ──
  { id: 5,  espnId: 4705658, name: "Alex Pereira",          nickname: "POATAN",        org: "UFC", belt: true,  weightClass: "Light Heavyweight", record: "11-2-0", wins: 11, losses: 2, draws: 0, koPct: 91, subPct: 0,  winStreak: 4,  rank: 1,  score: 98, rarity: "gold",      trait: "KO ARTISTE",    country: "🇧🇷", style: "Kickboxing" },
  { id: 6,  espnId: 3156612, name: "Jiří Procházka",        nickname: "DENISA",        org: "UFC", belt: false, weightClass: "Light Heavyweight", record: "30-4-1", wins: 30, losses: 4, draws: 1, koPct: 87, subPct: 3,  winStreak: 1,  rank: 2,  score: 91, rarity: "legendary", trait: "BERSERK",       country: "🇨🇿", style: "Kickboxing" },
  { id: 7,  espnId: 4425355, name: "Jamahal Hill",          nickname: "SWEET DREAMS",  org: "UFC", belt: false, weightClass: "Light Heavyweight", record: "12-2-0", wins: 12, losses: 2, draws: 0, koPct: 75, subPct: 0,  winStreak: 0,  rank: 3,  score: 87, rarity: "epic",      trait: "PUISSANCE",     country: "🇺🇸", style: "Boxing" },
  { id: 8,  espnId: 4273399, name: "Magomed Ankalaev",      nickname: "EAGLE",         org: "UFC", belt: false, weightClass: "Light Heavyweight", record: "20-1-1", wins: 20, losses: 1, draws: 1, koPct: 50, subPct: 30, winStreak: 8,  rank: 4,  score: 90, rarity: "legendary", trait: "INVAINCU",      country: "🇷🇺", style: "MMA" },
  // ── MIDDLEWEIGHT ──
  { id: 9,  espnId: 3166126, name: "Dricus Du Plessis",     nickname: "STILLKNOCKS",   org: "UFC", belt: true,  weightClass: "Middleweight",      record: "22-2-0", wins: 22, losses: 2, draws: 0, koPct: 59, subPct: 23, winStreak: 6,  rank: 1,  score: 94, rarity: "gold",      trait: "DUREZA",        country: "🇿🇦", style: "Boxing/BJJ" },
  { id: 10, espnId: 4285679, name: "Israel Adesanya",       nickname: "THE LAST STYLEBENDER", org: "UFC", belt: false, weightClass: "Middleweight", record: "24-3-0", wins: 24, losses: 3, draws: 0, koPct: 54, subPct: 0,  winStreak: 0,  rank: 2,  score: 93, rarity: "legendary", trait: "MAESTRO",       country: "🇳🇿", style: "Kickboxing" },
  { id: 11, espnId: 3093653, name: "Sean Strickland",       nickname: "TARZAN",        org: "UFC", belt: false, weightClass: "Middleweight",      record: "28-6-0", wins: 28, losses: 6, draws: 0, koPct: 39, subPct: 21, winStreak: 0,  rank: 3,  score: 86, rarity: "epic",      trait: "GUERRIER",      country: "🇺🇸", style: "Boxing" },
  { id: 12, espnId: 3009717, name: "Robert Whittaker",      nickname: "THE REAPER",    org: "UFC", belt: false, weightClass: "Middleweight",      record: "25-7-0", wins: 25, losses: 7, draws: 0, koPct: 40, subPct: 24, winStreak: 3,  rank: 4,  score: 87, rarity: "epic",      trait: "VÉTÉRAN",       country: "🇦🇺", style: "Boxing" },
  // ── WELTERWEIGHT ──
  { id: 13, espnId: 3332412, name: "Islam Makhachev",       nickname: "MAKHACHEV",     org: "UFC", belt: true,  weightClass: "Lightweight",       record: "26-1-0", wins: 26, losses: 1, draws: 0, koPct: 31, subPct: 54, winStreak: 12, rank: 1,  score: 99, rarity: "gold",      trait: "DOMINANT",      country: "🇷🇺", style: "Sambo/Grappling" },
  { id: 14, espnId: 3152929, name: "Leon Edwards",          nickname: "ROCKY",         org: "UFC", belt: true,  weightClass: "Welterweight",      record: "22-3-0", wins: 22, losses: 3, draws: 0, koPct: 41, subPct: 18, winStreak: 12, rank: 1,  score: 93, rarity: "gold",      trait: "CHAMPION",      country: "🇬🇧", style: "MMA" },
  { id: 15, espnId: 3088812, name: "Kamaru Usman",          nickname: "THE NIGERIAN NIGHTMARE", org: "UFC", belt: false, weightClass: "Welterweight", record: "20-4-0", wins: 20, losses: 4, draws: 0, koPct: 45, subPct: 30, winStreak: 0, rank: 2,  score: 91, rarity: "legendary", trait: "DOMINANT",      country: "🇳🇬", style: "Wrestling" },
  { id: 16, espnId: 3172112, name: "Belal Muhammad",        nickname: "REMEMBER THE NAME", org: "UFC", belt: false, weightClass: "Welterweight", record: "23-3-0", wins: 23, losses: 3, draws: 0, koPct: 30, subPct: 35, winStreak: 7, rank: 3,  score: 88, rarity: "epic",      trait: "GRIND",         country: "🇺🇸", style: "Wrestling" },
  // ── LIGHTWEIGHT ──
  { id: 17, espnId: 2504169, name: "Charles Oliveira",      nickname: "DO BRONX",      org: "UFC", belt: false, weightClass: "Lightweight",       record: "34-9-0", wins: 34, losses: 9, draws: 0, koPct: 35, subPct: 62, winStreak: 0,  rank: 2,  score: 94, rarity: "legendary", trait: "SUBMISSION KING", country: "🇧🇷", style: "BJJ" },
  { id: 18, espnId: 2506549, name: "Dustin Poirier",        nickname: "THE DIAMOND",   org: "UFC", belt: false, weightClass: "Lightweight",       record: "30-8-0", wins: 30, losses: 8, draws: 0, koPct: 57, subPct: 23, winStreak: 1,  rank: 4,  score: 88, rarity: "epic",      trait: "CŒUR",          country: "🇺🇸", style: "Boxing/BJJ" },
  { id: 19, espnId: 3022345, name: "Justin Gaethje",        nickname: "THE HIGHLIGHT", org: "UFC", belt: false, weightClass: "Lightweight",       record: "25-5-0", wins: 25, losses: 5, draws: 0, koPct: 76, subPct: 4,  winStreak: 1,  rank: 3,  score: 90, rarity: "legendary", trait: "WAR",           country: "🇺🇸", style: "Wrestling/Boxing" },
  // ── FEATHERWEIGHT ──
  { id: 20, espnId: 4350812, name: "Ilia Topuria",          nickname: "EL MATADOR",    org: "UFC", belt: true,  weightClass: "Featherweight",     record: "15-0-0", wins: 15, losses: 0, draws: 0, koPct: 87, subPct: 13, winStreak: 15, rank: 1,  score: 97, rarity: "gold",      trait: "INVAINCU",      country: "🇬🇪", style: "Boxing/BJJ" },
  { id: 21, espnId: 3949584, name: "Alex Volkanovski",      nickname: "THE GREAT",     org: "UFC", belt: false, weightClass: "Featherweight",     record: "26-4-0", wins: 26, losses: 4, draws: 0, koPct: 42, subPct: 19, winStreak: 0,  rank: 2,  score: 95, rarity: "legendary", trait: "LÉGENDE",       country: "🇦🇺", style: "Wrestling/Boxing" },
  { id: 22, espnId: 3045737, name: "Brian Ortega",          nickname: "T-CITY",        org: "UFC", belt: false, weightClass: "Featherweight",     record: "16-3-0", wins: 16, losses: 3, draws: 0, koPct: 25, subPct: 56, winStreak: 1,  rank: 5,  score: 83, rarity: "rare",      trait: "FINISHER",      country: "🇺🇸", style: "BJJ" },
  // ── BANTAMWEIGHT ──
  { id: 23, espnId: 3948572, name: "Merab Dvalishvili",     nickname: "THE MACHINE",   org: "UFC", belt: true,  weightClass: "Bantamweight",      record: "18-4-0", wins: 18, losses: 4, draws: 0, koPct: 22, subPct: 33, winStreak: 9,  rank: 1,  score: 92, rarity: "gold",      trait: "ROBOT",         country: "🇬🇪", style: "Wrestling" },
  { id: 24, espnId: 4205093, name: "Sean O'Malley",         nickname: "SUGAR",         org: "UFC", belt: false, weightClass: "Bantamweight",      record: "18-2-0", wins: 18, losses: 2, draws: 0, koPct: 67, subPct: 6,  winStreak: 0,  rank: 2,  score: 89, rarity: "epic",      trait: "STYLE",         country: "🇺🇸", style: "Boxing" },
  { id: 25, espnId: 4294504, name: "Cory Sandhagen",        nickname: "THE SANDMAN",   org: "UFC", belt: false, weightClass: "Bantamweight",      record: "18-5-0", wins: 18, losses: 5, draws: 0, koPct: 50, subPct: 11, winStreak: 2,  rank: 3,  score: 85, rarity: "epic",      trait: "CRÉATIF",       country: "🇺🇸", style: "Kickboxing" },
  // ── FLYWEIGHT ──
  { id: 26, espnId: 2560746, name: "Alexandre Pantoja",     nickname: "THE CANNIBAL",  org: "UFC", belt: true,  weightClass: "Flyweight",         record: "27-5-0", wins: 27, losses: 5, draws: 0, koPct: 30, subPct: 56, winStreak: 5,  rank: 1,  score: 91, rarity: "gold",      trait: "CHAMPION",      country: "🇧🇷", style: "BJJ" },
  { id: 27, espnId: 3027545, name: "Brandon Moreno",        nickname: "THE ASSASSIN BABY", org: "UFC", belt: false, weightClass: "Flyweight",    record: "22-7-2", wins: 22, losses: 7, draws: 2, koPct: 36, subPct: 41, winStreak: 0,  rank: 2,  score: 86, rarity: "epic",      trait: "VÉTÉRAN",       country: "🇲🇽", style: "BJJ/Boxing" },
  // ── WOMEN STRAWWEIGHT ──
  { id: 28, espnId: 4350762, name: "Zhang Weili",           nickname: "MAGNUM",        org: "UFC", belt: true,  weightClass: "W. Strawweight",   record: "24-3-0", wins: 24, losses: 3, draws: 0, koPct: 58, subPct: 25, winStreak: 5,  rank: 1,  score: 95, rarity: "gold",      trait: "WUSHU",         country: "🇨🇳", style: "Wushu/BJJ" },
  { id: 29, espnId: 2559934, name: "Carla Esparza",         nickname: "COOKIE MONSTER",org: "UFC", belt: false, weightClass: "W. Strawweight",   record: "19-7-0", wins: 19, losses: 7, draws: 0, koPct: 5,  subPct: 58, winStreak: 0,  rank: 3,  score: 79, rarity: "rare",      trait: "GRAPPLER",      country: "🇺🇸", style: "Wrestling" },
  // ── WOMEN BANTAMWEIGHT ──
  { id: 30, espnId: 2951361, name: "Julianna Peña",         nickname: "THE VENEZUELAN VIXEN", org: "UFC", belt: true, weightClass: "W. Bantamweight", record: "12-5-0", wins: 12, losses: 5, draws: 0, koPct: 25, subPct: 50, winStreak: 1,  rank: 1,  score: 87, rarity: "legendary", trait: "SLAYER",        country: "🇻🇪", style: "BJJ/Boxing" },
  { id: 31, espnId: 2554705, name: "Valentina Shevchenko",  nickname: "BULLET",        org: "UFC", belt: false, weightClass: "W. Flyweight",     record: "24-5-0", wins: 24, losses: 5, draws: 0, koPct: 50, subPct: 17, winStreak: 0,  rank: 2,  score: 96, rarity: "gold",      trait: "LÉGENDE",       country: "🇰🇬", style: "Muay Thai" },
  { id: 32, espnId: 3136287, name: "Alexa Grasso",          nickname: "ALEXA",         org: "UFC", belt: true,  weightClass: "W. Flyweight",     record: "16-3-2", wins: 16, losses: 3, draws: 2, koPct: 31, subPct: 38, winStreak: 2,  rank: 1,  score: 88, rarity: "epic",      trait: "SURPRISE",      country: "🇲🇽", style: "BJJ/Boxing" },
];

const WEIGHT_CLASSES = [
  "Tous", "Heavyweight", "Light Heavyweight", "Middleweight",
  "Welterweight", "Lightweight", "Featherweight", "Bantamweight",
  "Flyweight", "W. Strawweight", "W. Bantamweight", "W. Flyweight",
];

const RARITY_FILTERS = ["Tous", "gold", "legendary", "epic", "rare", "common"];

function FighterPhoto({ espnId, name, size }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const url = espnId ? `https://a.espncdn.com/combiner/i?img=/i/headshots/mma/players/full/${espnId}.png&w=350&h=254` : null;
  const showPlaceholder = !url || error || !loaded;
  return (
    <div style={{ width: size, height: size * 0.85, position: "relative", overflow: "hidden" }}>
      {showPlaceholder && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontSize: size * 0.28, fontWeight: 900, color: (!url || error) ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.2)", fontFamily: "'Permanent Marker',cursive", letterSpacing: 2, textShadow: "0 2px 12px rgba(0,0,0,0.8)" }}>{initials}</div>
        </div>
      )}
      {url && !error && (
        <img src={url} alt={name} onLoad={() => setLoaded(true)} onError={() => setError(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center", opacity: loaded ? 1 : 0, transition: "opacity 0.3s ease", filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.8))", position: "absolute", inset: 0 }} />
      )}
    </div>
  );
}

function Stars({ count, color }) {
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ fontSize: 10, color: i <= count ? color : "rgba(255,255,255,0.15)" }}>★</span>
      ))}
    </div>
  );
}

function StatBar({ value, max = 100, color }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 4, height: 4, overflow: "hidden" }}>
      <div style={{ width: `${Math.min(100, (value / max) * 100)}%`, height: "100%", background: color, borderRadius: 4, transition: "width 1s ease" }} />
    </div>
  );
}

function FighterCard({ fighter, onClick }) {
  const r = RARITY[fighter.rarity];
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={() => onClick(fighter)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: r.bg,
        border: `1.5px solid ${hovered ? r.color : r.border + "88"}`,
        borderRadius: 20,
        padding: "20px 18px",
        cursor: "pointer",
        transition: "all .25s",
        transform: hovered ? "translateY(-6px)" : "none",
        boxShadow: hovered ? `0 12px 50px ${r.glow.replace("0.9","0.4").replace("0.8","0.35").replace("0.7","0.3").replace("0.6","0.25")}` : "none",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Glow overlay */}
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 80% 40% at 50% 0%, ${r.glow.replace(/[\d.]+\)$/, "0.06)")} 0%, transparent 70%)`, pointerEvents: "none" }} />

      {/* Badge ceinture */}
      {fighter.belt && (
        <div style={{
          position: "absolute", top: 12, right: 12,
          background: G.gold, color: "#1a0e00",
          fontSize: 9, fontWeight: 800, padding: "2px 8px", borderRadius: 99,
          letterSpacing: 1,
        }}>🥋 CHAMPION</div>
      )}

      {/* Photo hero */}
      <div style={{ flex: 1, borderRadius: 12, overflow: "hidden", marginBottom: 12, background: "rgba(0,0,0,0.4)", border: `1px solid ${r.color}30`, position: "relative", display: "flex", alignItems: "flex-end", justifyContent: "center", minHeight: 110 }}>
        <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 50% 110%, ${r.color}15 0%, transparent 60%)` }} />
        <div style={{ position: "absolute", top: 6, right: 6, width: 30, height: 30, borderRadius: "50%", background: `${r.color}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900, color: "#fff", fontFamily: "monospace", zIndex: 2 }}>{fighter.score}</div>
        <FighterPhoto espnId={fighter.espnId} name={fighter.name} size={160} />
      </div>

      {/* Nom + nickname */}
      <div style={{ marginBottom: 10, position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: C.text, lineHeight: 1.2 }}>{fighter.name}</div>
          <span style={{ fontSize: 10, flexShrink: 0 }}>{fighter.country}</span>
        </div>
        <div style={{ fontSize: 10, color: r.color, fontWeight: 700, letterSpacing: 0.5, marginTop: 2, marginBottom: 4 }}>"{fighter.nickname}"</div>
        <Stars count={RARITY[fighter.rarity].stars} color={r.color} />
      </div>

      {/* Badges */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12, position: "relative", zIndex: 1 }}>
        <span style={{ fontSize: 9, fontWeight: 800, padding: "3px 8px", borderRadius: 99, background: `${r.color}18`, color: r.color, border: `1px solid ${r.color}44`, letterSpacing: 1 }}>
          {r.label}
        </span>
        <span style={{ fontSize: 9, fontWeight: 700, padding: "3px 8px", borderRadius: 99, background: "rgba(255,255,255,0.05)", color: C.muted, border: "1px solid rgba(255,255,255,0.1)" }}>
          {fighter.weightClass}
        </span>
        <span style={{ fontSize: 9, fontWeight: 800, padding: "3px 8px", borderRadius: 99, background: "rgba(232,0,45,0.15)", color: C.red, border: "1px solid rgba(232,0,45,0.3)" }}>
          {fighter.trait}
        </span>
      </div>

      {/* Record */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14, padding: "10px", background: "rgba(255,255,255,0.04)", borderRadius: 10, position: "relative", zIndex: 1 }}>
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: 18, fontFamily: "'Permanent Marker', cursive", color: C.green }}>{fighter.wins}</div>
          <div style={{ fontSize: 9, color: C.muted, letterSpacing: 1 }}>VICTOIRES</div>
        </div>
        <div style={{ width: 1, background: "rgba(255,255,255,0.08)" }} />
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: 18, fontFamily: "'Permanent Marker', cursive", color: C.red }}>{fighter.losses}</div>
          <div style={{ fontSize: 9, color: C.muted, letterSpacing: 1 }}>DÉFAITES</div>
        </div>
        <div style={{ width: 1, background: "rgba(255,255,255,0.08)" }} />
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: 18, fontFamily: "'Permanent Marker', cursive", color: r.color }}>{fighter.winStreak}</div>
          <div style={{ fontSize: 9, color: C.muted, letterSpacing: 1 }}>SÉRIE</div>
        </div>
      </div>

      {/* Stats bars */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, position: "relative", zIndex: 1 }}>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 10, color: C.muted }}>KO / TKO</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: C.red }}>{fighter.koPct}%</span>
          </div>
          <StatBar value={fighter.koPct} color={C.red} />
        </div>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 10, color: C.muted }}>Soumissions</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: C.blue }}>{fighter.subPct}%</span>
          </div>
          <StatBar value={fighter.subPct} color={C.blue} />
        </div>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 10, color: C.muted }}>Niveau HoopIQ</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: r.color }}>{fighter.score}/100</span>
          </div>
          <StatBar value={fighter.score} color={r.color} />
        </div>
      </div>

      {/* Style */}
      <div style={{ marginTop: 12, fontSize: 10, color: C.muted, textAlign: "right", position: "relative", zIndex: 1 }}>
        🥊 {fighter.style}
      </div>
    </div>
  );
}

function FighterModal({ fighter, onClose }) {
  if (!fighter) return null;
  const r = RARITY[fighter.rarity];
  return createPortal(
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 3500, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(14px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: r.bg, border: `1.5px solid ${r.color}`,
        borderRadius: 24, padding: 32, maxWidth: 460, width: "100%",
        maxHeight: "90vh", overflowY: "auto",
        boxShadow: `0 0 80px ${r.glow.replace(/[\d.]+\)$/, "0.25)")}`,
        position: "relative",
      }}>
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 18, background: "none", border: "none", color: C.muted, fontSize: 24, cursor: "pointer" }}>×</button>

        {/* Header modal */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
          <div style={{ width: 90, height: 76, borderRadius: 14, overflow: "hidden", background: `${r.color}15`, border: `2px solid ${r.color}44`, flexShrink: 0, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
            <FighterPhoto espnId={fighter.espnId} name={fighter.name} size={90} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontFamily: "'Permanent Marker', cursive", letterSpacing: 1, color: C.text }}>{fighter.name}</div>
            <div style={{ fontSize: 12, color: r.color, fontWeight: 700, marginBottom: 6 }}>"{fighter.nickname}" {fighter.country}</div>
            <Stars count={RARITY[fighter.rarity].stars} color={r.color} />
          </div>
          <div style={{ textAlign: "center", flexShrink: 0 }}>
            <div style={{ fontSize: 42, fontFamily: "'Permanent Marker', cursive", color: r.color }}>{fighter.score}</div>
            <div style={{ fontSize: 9, color: C.muted, letterSpacing: 1 }}>SCORE</div>
          </div>
        </div>

        {/* Badges */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
          {fighter.belt && <span style={{ fontSize: 11, fontWeight: 800, padding: "4px 12px", borderRadius: 99, background: G.gold, color: "#1a0e00" }}>🥋 CHAMPION</span>}
          <span style={{ fontSize: 11, fontWeight: 800, padding: "4px 12px", borderRadius: 99, background: `${r.color}22`, color: r.color, border: `1px solid ${r.color}44` }}>{r.label}</span>
          <span style={{ fontSize: 11, padding: "4px 12px", borderRadius: 99, background: "rgba(255,255,255,0.06)", color: C.muted, border: "1px solid rgba(255,255,255,0.1)" }}>{fighter.weightClass}</span>
          <span style={{ fontSize: 11, fontWeight: 800, padding: "4px 12px", borderRadius: 99, background: "rgba(232,0,45,0.15)", color: C.red, border: "1px solid rgba(232,0,45,0.25)" }}>{fighter.trait}</span>
        </div>

        {/* Bilan */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
          {[
            { label: "Victoires", val: fighter.wins, color: C.green },
            { label: "Défaites", val: fighter.losses, color: C.red },
            { label: "Série W.", val: fighter.winStreak, color: r.color },
          ].map(({ label, val, color }) => (
            <div key={label} style={{ textAlign: "center", padding: 14, background: "rgba(255,255,255,0.04)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.07)" }}>
              <div style={{ fontSize: 28, fontFamily: "'Permanent Marker', cursive", color }}>{val}</div>
              <div style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
          {[
            { label: "KO / TKO", val: fighter.koPct, color: C.red },
            { label: "Soumissions", val: fighter.subPct, color: C.blue },
            { label: "Score HoopIQ", val: fighter.score, color: r.color },
          ].map(({ label, val, color }) => (
            <div key={label}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: C.muted }}>{label}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color }}>{val}%</span>
              </div>
              <StatBar value={val} color={color} />
            </div>
          ))}
        </div>

        {/* Infos */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 13 }}>
          <div style={{ padding: "10px 14px", background: "rgba(255,255,255,0.04)", borderRadius: 10 }}>
            <div style={{ color: C.muted, fontSize: 10, marginBottom: 4 }}>RECORD</div>
            <div style={{ fontWeight: 700, color: C.text }}>{fighter.record}</div>
          </div>
          <div style={{ padding: "10px 14px", background: "rgba(255,255,255,0.04)", borderRadius: 10 }}>
            <div style={{ color: C.muted, fontSize: 10, marginBottom: 4 }}>ORGANISATION</div>
            <div style={{ fontWeight: 700, color: C.text }}>{fighter.org}</div>
          </div>
          <div style={{ padding: "10px 14px", background: "rgba(255,255,255,0.04)", borderRadius: 10 }}>
            <div style={{ color: C.muted, fontSize: 10, marginBottom: 4 }}>STYLE</div>
            <div style={{ fontWeight: 700, color: C.text }}>{fighter.style}</div>
          </div>
          <div style={{ padding: "10px 14px", background: "rgba(255,255,255,0.04)", borderRadius: 10 }}>
            <div style={{ color: C.muted, fontSize: 10, marginBottom: 4 }}>CLASSEMENT</div>
            <div style={{ fontWeight: 700, color: r.color }}>#{fighter.rank} {fighter.weightClass}</div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function MMA() {
  const [weightFilter, setWeightFilter] = useState("Tous");
  const [rarityFilter, setRarityFilter] = useState("Tous");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("score");
  const [selected, setSelected] = useState(null);

  const filtered = FIGHTERS
    .filter(f => weightFilter === "Tous" || f.weightClass === weightFilter)
    .filter(f => rarityFilter === "Tous" || f.rarity === rarityFilter)
    .filter(f => !search || f.name.toLowerCase().includes(search.toLowerCase()) || f.nickname.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sort === "score" ? b.score - a.score : sort === "wins" ? b.wins - a.wins : sort === "ko" ? b.koPct - a.koPct : b.winStreak - a.winStreak);

  const counts = { total: FIGHTERS.length, champs: FIGHTERS.filter(f => f.belt).length, gold: FIGHTERS.filter(f => f.rarity === "gold").length };

  return (
    <div className="fade-in">
      <style>{`
        .mma-filter { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); color: #6b6b88; border-radius: 8px; padding: 8px 14px; font-size: 13px; font-family: inherit; cursor: pointer; transition: all .2s; }
        .mma-filter.active { background: rgba(232,0,45,0.13); border-color: rgba(232,0,45,0.4); color: #e8002d; font-weight: 700; }
        .mma-filter:hover { border-color: rgba(232,0,45,0.3); color: #f0f0ff; }
        .mma-select { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); color: #f0f0ff; border-radius: 8px; padding: 8px 12px; font-size: 13px; font-family: inherit; cursor: pointer; outline: none; }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: "'Permanent Marker', cursive", fontSize: "clamp(32px,6vw,52px)", letterSpacing: 2, lineHeight: 1 }}>
          🥊 MMA <span style={{ background: G.red, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>FIGHTERS</span>
        </h1>
        <p style={{ color: C.muted, fontSize: 14, marginTop: 8 }}>
          {counts.total} combattants · {counts.champs} champions UFC · {counts.gold} cartes OR
        </p>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Combattants", val: counts.total, color: C.red },
          { label: "Champions", val: counts.champs, color: C.gold },
          { label: "Cartes OR", val: counts.gold, color: "#ffd700" },
          { label: "Ligues", val: 1, color: C.blue },
        ].map(({ label, val, color }) => (
          <div key={label} style={{ padding: "14px 18px", background: C.surface, borderRadius: 14, border: `1px solid ${C.border}` }}>
            <div style={{ fontFamily: "'Permanent Marker', cursive", fontSize: 28, color }}>{val}</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 20 }}>
        <input
          placeholder="🔍 Rechercher un combattant..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ padding: "9px 14px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: C.text, fontSize: 13, outline: "none", fontFamily: "inherit", minWidth: 220 }}
        />
        <select className="mma-select" value={sort} onChange={e => setSort(e.target.value)}>
          <option value="score">Score ↓</option>
          <option value="wins">Victoires ↓</option>
          <option value="ko">KO% ↓</option>
          <option value="streak">Série ↓</option>
        </select>
        <select className="mma-select" value={weightFilter} onChange={e => setWeightFilter(e.target.value)}>
          {WEIGHT_CLASSES.map(w => <option key={w} value={w}>{w}</option>)}
        </select>
      </div>

      {/* Rarity filters */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 28 }}>
        {RARITY_FILTERS.map(r => (
          <button key={r} className={`mma-filter${rarityFilter === r ? " active" : ""}`} onClick={() => setRarityFilter(r)}>
            {r === "Tous" ? "Tous" : r === "gold" ? "⭐ OR" : r === "legendary" ? "🔴 Légendaire" : r === "epic" ? "🟣 Épique" : r === "rare" ? "🔵 Rare" : "⚪ Commun"}
          </button>
        ))}
      </div>

      {/* Grille cartes */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", color: C.muted, padding: "60px 0", fontSize: 15 }}>Aucun combattant trouvé.</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px,1fr))", gap: 18 }}>
          {filtered.map(f => <FighterCard key={f.id} fighter={f} onClick={setSelected} />)}
        </div>
      )}

      {selected && <FighterModal fighter={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
