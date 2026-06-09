import { useState, useRef } from "react";

const RARITY = {
  gold: { label: "OR LÉGENDAIRE", color: "#ffd700", glow: "rgba(255,215,0,0.9)", bg: "linear-gradient(160deg,#1a1000,#3d2800,#1a1000)", border: "#ffd700", stars: 5 },
  legendary: { label: "Légendaire", color: "#ff5c00", glow: "rgba(255,92,0,0.8)", bg: "linear-gradient(160deg,#1a0500,#3d1000,#1a0500)", border: "#ff5c00", stars: 5 },
  epic: { label: "Épique", color: "#c084fc", glow: "rgba(192,132,252,0.7)", bg: "linear-gradient(160deg,#0d0020,#2d0060,#0d0020)", border: "#c084fc", stars: 4 },
  rare: { label: "Rare", color: "#60a5fa", glow: "rgba(96,165,250,0.6)", bg: "linear-gradient(160deg,#000d20,#002050,#000d20)", border: "#60a5fa", stars: 3 },
  common: { label: "Commun", color: "#9ca3af", glow: "rgba(156,163,175,0.3)", bg: "linear-gradient(160deg,#0a0a0a,#1c1c1c,#0a0a0a)", border: "#4b5563", stars: 1 },
};

const NBA_TEAMS = [
  // ATLANTIC
  { id: "BOS", name: "Boston Celtics", city: "Boston", conf: "Est", color: "#007A33", players: [
    { id: 201, espnId: 3995, name: "Jayson Tatum", pos: "SF", pts: 26.9, ast: 4.9, reb: 8.1, fg: 47, score: 96, rarity: "legendary", trait: "MVP CANDIDAT" },
    { id: 202, espnId: 3992, name: "Jaylen Brown", pos: "SG", pts: 23.0, ast: 3.6, reb: 5.5, fg: 47, score: 89, rarity: "epic", trait: "CLUTCH" },
  ]},
  { id: "BKN", name: "Brooklyn Nets", city: "Brooklyn", conf: "Est", color: "#000000", players: [
    { id: 211, espnId: 6442, name: "Cam Thomas", pos: "SG", pts: 22.1, ast: 3.4, reb: 3.6, fg: 45, score: 82, rarity: "rare", trait: "SCOREUR" },
  ]},
  { id: "NYK", name: "New York Knicks", city: "New York", conf: "Est", color: "#F58426", players: [
    { id: 221, espnId: 3136193, name: "Jalen Brunson", pos: "PG", pts: 28.7, ast: 6.7, reb: 3.6, fg: 48, score: 93, rarity: "legendary", trait: "NYC KING" },
    { id: 222, espnId: 4066261, name: "Karl-Anthony Towns", pos: "C", pts: 24.0, ast: 3.1, reb: 13.9, fg: 52, score: 90, rarity: "legendary", trait: "BIG MAN" },
  ]},
  { id: "PHI", name: "Philadelphia 76ers", city: "Philadelphia", conf: "Est", color: "#006BB6", players: [
    { id: 231, espnId: 3059318, name: "Joel Embiid", pos: "C", pts: 34.7, ast: 5.6, reb: 11.0, fg: 53, score: 97, rarity: "legendary", trait: "MVP" },
    { id: 232, espnId: 4277905, name: "Tyrese Maxey", pos: "PG", pts: 25.9, ast: 6.2, reb: 3.9, fg: 47, score: 91, rarity: "legendary", trait: "EXPLOSIF" },
  ]},
  { id: "TOR", name: "Toronto Raptors", city: "Toronto", conf: "Est", color: "#CE1141", players: [
    { id: 241, espnId: 4432807, name: "Scottie Barnes", pos: "SF", pts: 19.9, ast: 6.1, reb: 8.2, fg: 47, score: 85, rarity: "epic", trait: "POLYVALENT" },
  ]},
  // CENTRAL
  { id: "CHI", name: "Chicago Bulls", city: "Chicago", conf: "Est", color: "#CE1141", players: [
    { id: 251, espnId: 2566769, name: "Zach LaVine", pos: "SG", pts: 24.8, ast: 4.2, reb: 4.5, fg: 47, score: 94, rarity: "legendary", trait: "ÉLECTRIQUE" },
    { id: 252, espnId: 4278133, name: "Coby White", pos: "PG", pts: 19.1, ast: 5.1, reb: 3.8, fg: 44, score: 88, rarity: "epic", trait: "EN FEU" },
  ]},
  { id: "CLE", name: "Cleveland Cavaliers", city: "Cleveland", conf: "Est", color: "#860038", players: [
    { id: 261, espnId: 4278129, name: "Donovan Mitchell", pos: "SG", pts: 26.6, ast: 6.1, reb: 5.1, fg: 47, score: 93, rarity: "legendary", trait: "SPIDA" },
    { id: 262, espnId: 3907387, name: "Darius Garland", pos: "PG", pts: 20.6, ast: 6.9, reb: 2.7, fg: 45, score: 87, rarity: "epic", trait: "CRÉATEUR" },
  ]},
  { id: "DET", name: "Detroit Pistons", city: "Detroit", conf: "Est", color: "#C8102E", players: [
    { id: 271, espnId: 4431765, name: "Cade Cunningham", pos: "PG", pts: 22.7, ast: 9.0, reb: 4.4, fg: 43, score: 88, rarity: "epic", trait: "FRANCHISE" },
  ]},
  { id: "IND", name: "Indiana Pacers", city: "Indiana", conf: "Est", color: "#002D62", players: [
    { id: 281, espnId: 4431679, name: "Tyrese Haliburton", pos: "PG", pts: 20.1, ast: 10.9, reb: 3.9, fg: 47, score: 91, rarity: "legendary", trait: "VISION" },
  ]},
  { id: "MIL", name: "Milwaukee Bucks", city: "Milwaukee", conf: "Est", color: "#00471B", players: [
    { id: 291, espnId: 3032977, name: "Giannis Antetokounmpo", pos: "PF", pts: 30.4, ast: 6.5, reb: 11.5, fg: 61, score: 98, rarity: "legendary", trait: "GREEK FREAK" },
    { id: 292, espnId: 2490149, name: "Damian Lillard", pos: "PG", pts: 24.3, ast: 7.1, reb: 4.4, fg: 43, score: 91, rarity: "legendary", trait: "CLUTCH TIME" },
  ]},
  // SOUTHEAST
  { id: "ATL", name: "Atlanta Hawks", city: "Atlanta", conf: "Est", color: "#C1D32F", players: [
    { id: 301, espnId: 3936299, name: "Trae Young", pos: "PG", pts: 25.7, ast: 10.8, reb: 3.3, fg: 43, score: 90, rarity: "legendary", trait: "ICE TRAE" },
  ]},
  { id: "CHA", name: "Charlotte Hornets", city: "Charlotte", conf: "Est", color: "#1D1160", players: [
    { id: 311, espnId: 4432174, name: "LaMelo Ball", pos: "PG", pts: 23.9, ast: 8.0, reb: 5.8, fg: 43, score: 89, rarity: "epic", trait: "MELO" },
  ]},
  { id: "MIA", name: "Miami Heat", city: "Miami", conf: "Est", color: "#98002E", players: [
    { id: 321, espnId: 6583, name: "Jimmy Butler", pos: "SF", pts: 20.8, ast: 5.3, reb: 5.3, fg: 48, score: 91, rarity: "legendary", trait: "PLAYOFF JIMMY" },
    { id: 322, espnId: 4432174, name: "Bam Adebayo", pos: "C", pts: 19.3, ast: 3.9, reb: 10.4, fg: 55, score: 87, rarity: "epic", trait: "ANCHOR" },
  ]},
  { id: "ORL", name: "Orlando Magic", city: "Orlando", conf: "Est", color: "#0077C0", players: [
    { id: 331, espnId: 4432807, name: "Paolo Banchero", pos: "PF", pts: 22.6, ast: 5.4, reb: 6.9, fg: 46, score: 88, rarity: "epic", trait: "PRIMO" },
  ]},
  { id: "WAS", name: "Washington Wizards", city: "Washington", conf: "Est", color: "#002B5C", players: [
    { id: 341, espnId: 4066648, name: "Kyle Kuzma", pos: "PF", pts: 22.2, ast: 4.5, reb: 7.2, fg: 44, score: 79, rarity: "rare", trait: "KUZMA" },
  ]},
  // NORTHWEST
  { id: "DEN", name: "Denver Nuggets", city: "Denver", conf: "Ouest", color: "#0E2240", players: [
    { id: 351, espnId: 3112335, name: "Nikola Jokić", pos: "C", pts: 26.4, ast: 9.0, reb: 12.4, fg: 58, score: 99, rarity: "legendary", trait: "JOKER" },
    { id: 352, espnId: 3062679, name: "Jamal Murray", pos: "PG", pts: 21.2, ast: 6.5, reb: 4.4, fg: 46, score: 88, rarity: "epic", trait: "MAP GOD" },
  ]},
  { id: "MIN", name: "Minnesota Timberwolves", city: "Minnesota", conf: "Ouest", color: "#0C2340", players: [
    { id: 361, espnId: 4065663, name: "Anthony Edwards", pos: "SG", pts: 25.9, ast: 5.1, reb: 5.4, fg: 46, score: 94, rarity: "legendary", trait: "ANT MAN" },
    { id: 362, espnId: 4066648, name: "Karl-Anthony Towns", pos: "C", pts: 21.4, ast: 3.0, reb: 8.3, fg: 50, score: 87, rarity: "epic", trait: "KAT" },
  ]},
  { id: "OKC", name: "Oklahoma City Thunder", city: "Oklahoma City", conf: "Ouest", color: "#007AC1", players: [
    { id: 371, espnId: 4277905, name: "Shai Gilgeous-Alexander", pos: "PG", pts: 30.1, ast: 6.2, reb: 5.5, fg: 53, score: 97, rarity: "legendary", trait: "SGA" },
  ]},
  { id: "POR", name: "Portland Trail Blazers", city: "Portland", conf: "Ouest", color: "#E03A3E", players: [
    { id: 381, espnId: 4432761, name: "Scoot Henderson", pos: "PG", pts: 14.9, ast: 5.8, reb: 3.8, fg: 41, score: 75, rarity: "rare", trait: "FUTUR" },
  ]},
  { id: "UTA", name: "Utah Jazz", city: "Utah", conf: "Ouest", color: "#002B5C", players: [
    { id: 391, espnId: 4432761, name: "Lauri Markkanen", pos: "PF", pts: 23.2, ast: 2.0, reb: 8.2, fg: 50, score: 84, rarity: "epic", trait: "FINNISHER" },
  ]},
  // PACIFIC
  { id: "GSW", name: "Golden State Warriors", city: "San Francisco", conf: "Ouest", color: "#1D428A", players: [
    { id: 401, espnId: 3975, name: "Stephen Curry", pos: "PG", pts: 26.4, ast: 5.1, reb: 4.5, fg: 45, score: 97, rarity: "legendary", trait: "SPLASH BROTHER" },
    { id: 402, espnId: 6589, name: "Draymond Green", pos: "PF", pts: 9.0, ast: 6.7, reb: 7.2, fg: 48, score: 83, rarity: "epic", trait: "IQ DÉFENSE" },
  ]},
  { id: "LAC", name: "LA Clippers", city: "Los Angeles", conf: "Ouest", color: "#C8102E", players: [
    { id: 411, espnId: 4065697, name: "Kawhi Leonard", pos: "SF", pts: 23.7, ast: 3.6, reb: 6.1, fg: 52, score: 93, rarity: "legendary", trait: "THE CLAW" },
    { id: 412, espnId: 3032977, name: "Paul George", pos: "SF", pts: 22.6, ast: 3.5, reb: 5.2, fg: 45, score: 88, rarity: "epic", trait: "PG13" },
  ]},
  { id: "LAL", name: "Los Angeles Lakers", city: "Los Angeles", conf: "Ouest", color: "#552583", players: [
    { id: 421, espnId: 1966, name: "LeBron James", pos: "SF", pts: 25.7, ast: 8.3, reb: 7.3, fg: 54, score: 98, rarity: "legendary", trait: "KING JAMES" },
    { id: 422, espnId: 3202, name: "Anthony Davis", pos: "C", pts: 24.7, ast: 3.5, reb: 12.6, fg: 56, score: 95, rarity: "legendary", trait: "THE BROW" },
  ]},
  { id: "PHX", name: "Phoenix Suns", city: "Phoenix", conf: "Ouest", color: "#1D1160", players: [
    { id: 431, espnId: 3136195, name: "Kevin Durant", pos: "SF", pts: 27.1, ast: 5.0, reb: 6.6, fg: 52, score: 96, rarity: "legendary", trait: "SLIM REAPER" },
    { id: 432, espnId: 3059318, name: "Devin Booker", pos: "SG", pts: 27.1, ast: 6.9, reb: 4.5, fg: 47, score: 93, rarity: "legendary", trait: "BOOK" },
  ]},
  { id: "SAC", name: "Sacramento Kings", city: "Sacramento", conf: "Ouest", color: "#5A2D81", players: [
    { id: 441, espnId: 4066648, name: "De'Aaron Fox", pos: "PG", pts: 26.6, ast: 5.9, reb: 4.4, fg: 50, score: 90, rarity: "legendary", trait: "SWIPA" },
  ]},
  // SOUTHWEST
  { id: "DAL", name: "Dallas Mavericks", city: "Dallas", conf: "Ouest", color: "#00538C", players: [
    { id: 451, espnId: 3945274, name: "Luka Dončić", pos: "PG", pts: 33.9, ast: 9.8, reb: 9.2, fg: 48, score: 99, rarity: "legendary", trait: "LUKA MAGIC" },
    { id: 452, espnId: 4066261, name: "Kyrie Irving", pos: "PG", pts: 25.6, ast: 5.2, reb: 5.0, fg: 49, score: 93, rarity: "legendary", trait: "UNCLE DREW" },
  ]},
  { id: "HOU", name: "Houston Rockets", city: "Houston", conf: "Ouest", color: "#CE1141", players: [
    { id: 461, espnId: 4432807, name: "Alperen Şengün", pos: "C", pts: 21.1, ast: 5.0, reb: 9.3, fg: 53, score: 86, rarity: "epic", trait: "TURK" },
    { id: 462, espnId: 4431765, name: "Jalen Green", pos: "SG", pts: 22.9, ast: 4.3, reb: 4.2, fg: 43, score: 84, rarity: "epic", trait: "BABY FACE" },
  ]},
  { id: "MEM", name: "Memphis Grizzlies", city: "Memphis", conf: "Ouest", color: "#5D76A9", players: [
    { id: 471, espnId: 4278129, name: "Ja Morant", pos: "PG", pts: 25.1, ast: 8.1, reb: 5.6, fg: 47, score: 92, rarity: "legendary", trait: "JA TIME" },
  ]},
  { id: "NOP", name: "New Orleans Pelicans", city: "New Orleans", conf: "Ouest", color: "#0C2340", players: [
    { id: 481, espnId: 4432174, name: "Zion Williamson", pos: "PF", pts: 22.9, ast: 5.0, reb: 5.8, fg: 57, score: 88, rarity: "epic", trait: "ZANOS" },
  ]},
  { id: "SAS", name: "San Antonio Spurs", city: "San Antonio", conf: "Ouest", color: "#C4CED4", players: [
    { id: 491, espnId: 4432761, name: "Victor Wembanyama", pos: "C", pts: 21.4, ast: 3.9, reb: 10.6, fg: 46, score: 95, rarity: "legendary", trait: "WEMBY" },
  ]},
];

const LEGEND_CARDS = [
  { id: 101, espnId: 1439, name: "Michael Jordan", pos: "SG", team: "Chicago Bulls", era: "1984-1998", pts: 30.1, ast: 5.3, reb: 6.2, fg: 49.7, score: 100, rarity: "gold", trait: "LE PLUS GRAND", titles: 6 },
  { id: 102, espnId: 1487, name: "Magic Johnson", pos: "PG", team: "L.A. Lakers", era: "1979-1996", pts: 19.5, ast: 11.2, reb: 7.2, fg: 52, score: 99, rarity: "gold", trait: "SHOWTIME", titles: 5 },
  { id: 103, espnId: 1752, name: "Larry Bird", pos: "SF", team: "Boston Celtics", era: "1979-1992", pts: 24.3, ast: 6.3, reb: 10.0, fg: 49.6, score: 98, rarity: "gold", trait: "THE HICK", titles: 3 },
  { id: 104, espnId: 2440, name: "Kobe Bryant", pos: "SG", team: "L.A. Lakers", era: "1996-2016", pts: 25.0, ast: 4.7, reb: 5.2, fg: 44.7, score: 98, rarity: "gold", trait: "MAMBA", titles: 5 },
  { id: 105, espnId: 614, name: "Shaquille O'Neal", pos: "C", team: "L.A. Lakers", era: "1992-2011", pts: 23.7, ast: 2.5, reb: 10.9, fg: 58.2, score: 97, rarity: "gold", trait: "SUPERMAN", titles: 4 },
  { id: 106, espnId: 1505, name: "Kareem Abdul-Jabbar", pos: "C", team: "L.A. Lakers", era: "1969-1989", pts: 24.6, ast: 3.6, reb: 11.2, fg: 55.9, score: 99, rarity: "gold", trait: "SKYHOOK", titles: 6 },
];

const PACKS = [
  { id: "standard", name: "Pack Standard", price: "Gratuit", cards: 3, desc: "3 cartes aléatoires", emoji: "📦", color: "#6b7280" },
  { id: "nba", name: "Pack NBA", price: "9€", cards: 5, desc: "5 cartes · 1 Rare garanti", emoji: "🏀", color: "#ff5c00" },
  { id: "allstar", name: "Pack All-Star", price: "29€", cards: 8, desc: "8 cartes · 1 Épique garanti", emoji: "⭐", color: "#c084fc" },
  { id: "legend", name: "Pack Légende", price: "89€", cards: 5, desc: "5 cartes · 1 OR garanti 🏆", emoji: "✨", color: "#ffd700" },
];

const ALL_PLAYERS = NBA_TEAMS.flatMap(t => t.players.map(p => ({ ...p, team: t.name, teamId: t.id, teamColor: t.color })));

function PlayerPhoto({ espnId, name, size }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const url = `https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/${espnId}.png&w=350&h=254`;
  return (
    <div style={{ width: size, height: size * 0.85, position: "relative", overflow: "hidden" }}>
      {!loaded && !error && <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.28, fontWeight: 900, color: "rgba(255,255,255,0.2)" }}>{initials}</div>}
      {error ? (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.35 }}>🏀</div>
      ) : (
        <img src={url} alt={name} onLoad={() => setLoaded(true)} onError={() => setError(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center", opacity: loaded ? 1 : 0, transition: "opacity 0.3s ease", filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.8))" }} />
      )}
    </div>
  );
}

function HoloCard({ card, size = "normal", onClick }) {
  const r = RARITY[card.rarity];
  const [mouse, setMouse] = useState({ x: 50, y: 50 });
  const [hovered, setHovered] = useState(false);
  const ref = useRef(null);
  const onMove = (e) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setMouse({ x: ((e.clientX - rect.left) / rect.width) * 100, y: ((e.clientY - rect.top) / rect.height) * 100 });
  };
  const w = size === "small" ? 120 : size === "large" ? 300 : 190;
  const h = w * 1.45;
  const rotX = hovered ? ((mouse.y - 50) / 50) * -12 : 0;
  const rotY = hovered ? ((mouse.x - 50) / 50) * 12 : 0;
  const isGold = card.rarity === "gold";

  return (
    <div ref={ref} onClick={onClick} onMouseMove={onMove} onMouseEnter={() => setHovered(true)} onMouseLeave={() => { setHovered(false); setMouse({ x: 50, y: 50 }); }}
      style={{ width: w, height: h, borderRadius: 16, cursor: "pointer", position: "relative", flexShrink: 0, transform: `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg) ${hovered ? "scale(1.07)" : "scale(1)"}`, transition: "transform 0.12s ease", boxShadow: hovered ? `0 25px 60px ${r.glow}, 0 0 40px ${r.glow}` : `0 8px 24px rgba(0,0,0,0.6)` }}>
      {isGold && <div style={{ position: "absolute", inset: -2, borderRadius: 18, background: hovered ? `conic-gradient(from ${mouse.x * 3.6}deg,#ffd700,#ffaa00,#fff8a0,#ffd700)` : "linear-gradient(135deg,#ffd700,#ffaa00,#ffd700)", zIndex: 0 }} />}
      <div style={{ position: "absolute", inset: isGold ? 2 : 0, borderRadius: isGold ? 15 : 16, background: r.bg, border: isGold ? "none" : `2px solid ${r.border}`, overflow: "hidden", zIndex: 1 }}>
        {(isGold || card.rarity === "legendary" || card.rarity === "epic") && (
          <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at ${mouse.x}% ${mouse.y}%, ${isGold ? "rgba(255,220,0,0.3)" : "rgba(255,150,0,0.2)"} 0%, transparent 60%)`, pointerEvents: "none", zIndex: 2 }} />
        )}
        <div style={{ padding: size === "small" ? 7 : 11, height: "100%", display: "flex", flexDirection: "column", position: "relative", zIndex: 3 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: size === "small" ? 4 : 6 }}>
            <div style={{ fontSize: size === "small" ? 6 : 8, fontWeight: 900, color: r.color, fontFamily: "monospace" }}>{isGold ? "✦✦✦✦✦" : "★".repeat(r.stars)}</div>
            <div style={{ fontSize: size === "small" ? 5 : 7, fontWeight: 800, color: r.color, background: `${r.color}20`, padding: "1px 5px", borderRadius: 3, border: `1px solid ${r.color}40` }}>{card.trait}</div>
          </div>
          {card.era && <div style={{ textAlign: "center", marginBottom: 3 }}><span style={{ fontSize: size === "small" ? 5 : 7, color: "#ffd700", background: "rgba(255,215,0,0.1)", padding: "1px 6px", borderRadius: 3, fontWeight: 700 }}>LÉGENDE · {card.era}</span></div>}
          <div style={{ flex: 1, borderRadius: 8, overflow: "hidden", marginBottom: size === "small" ? 4 : 6, background: "rgba(0,0,0,0.4)", border: `1px solid ${r.color}30`, position: "relative", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
            <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 50% 110%,${r.color}15 0%,transparent 60%)` }} />
            <div style={{ position: "absolute", top: 5, right: 5, width: size === "small" ? 20 : 28, height: size === "small" ? 20 : 28, borderRadius: "50%", background: isGold ? "linear-gradient(135deg,#ffd700,#ff8c00)" : r.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size === "small" ? 7 : 10, fontWeight: 900, color: isGold ? "#1a0800" : "#fff", fontFamily: "monospace" }}>{card.score}</div>
            {card.titles > 0 && <div style={{ position: "absolute", bottom: 4, left: 4, fontSize: size === "small" ? 5 : 8, color: "#ffd700", fontWeight: 800, background: "rgba(0,0,0,0.8)", padding: "1px 5px", borderRadius: 3 }}>🏆×{card.titles}</div>}
            <PlayerPhoto espnId={card.espnId} name={card.name} size={w - (size === "small" ? 14 : 22)} />
          </div>
          <div style={{ textAlign: "center", marginBottom: size === "small" ? 3 : 5 }}>
            <div style={{ fontSize: size === "small" ? 8 : 11, fontWeight: 900, color: "#fff", lineHeight: 1.2, textShadow: isGold ? "0 0 20px #ffd700" : `0 0 15px ${r.color}` }}>{card.name}</div>
            <div style={{ fontSize: size === "small" ? 6 : 8, color: r.color, fontWeight: 700, marginTop: 1 }}>{card.pos} · {(card.team || "").replace("Chicago ", "").replace("Los Angeles ", "LA ").slice(0, 18)}</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: size === "small" ? 2 : 3 }}>
            {[{ l: "PTS", v: card.pts }, { l: "AST", v: card.ast }, { l: "REB", v: card.reb }].map(s => (
              <div key={s.l} style={{ background: "rgba(0,0,0,0.5)", borderRadius: 5, padding: size === "small" ? "2px 1px" : "3px 2px", textAlign: "center", border: `1px solid ${r.color}20` }}>
                <div style={{ fontSize: size === "small" ? 8 : 10, fontWeight: 900, color: r.color }}>{s.v}</div>
                <div style={{ fontSize: size === "small" ? 4 : 6, color: "#555", fontWeight: 700 }}>{s.l}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: size === "small" ? 3 : 4, textAlign: "center" }}>
            <div style={{ fontSize: size === "small" ? 5 : 6, color: isGold ? "#ffd70055" : "#333", fontFamily: "monospace" }}>{isGold ? "✦ HOOPIQ GOLD ✦" : `HOOPIQ · #${String(card.id).padStart(3,"0")}`}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PackOpening({ pack, onClose, onDone }) {
  const [phase, setPhase] = useState("shake");
  const [cards, setCards] = useState([]);

  const generate = () => {
    if (pack.id === "legend") {
      const gold = LEGEND_CARDS[Math.floor(Math.random() * LEGEND_CARDS.length)];
      const rest = [...ALL_PLAYERS].sort(() => Math.random() - 0.5).slice(0, 4);
      return [gold, ...rest];
    }
    const pool = [...ALL_PLAYERS].sort(() => Math.random() - 0.5);
    const result = [];
    if (pack.id === "allstar") {
      const epic = pool.filter(p => p.rarity === "epic" || p.rarity === "legendary");
      if (epic.length) result.push(epic[Math.floor(Math.random() * epic.length)]);
      if (Math.random() < 0.1) result.push(LEGEND_CARDS[Math.floor(Math.random() * LEGEND_CARDS.length)]);
    }
    if (pack.id === "nba") {
      const rare = pool.filter(p => p.rarity === "rare" || p.rarity === "epic" || p.rarity === "legendary");
      if (rare.length) result.push(rare[Math.floor(Math.random() * rare.length)]);
    }
    while (result.length < pack.cards) {
      const c = pool[result.length % pool.length];
      if (!result.find(r => r.id === c.id)) result.push(c);
    }
    return result.slice(0, pack.cards);
  };

  useState(() => {
    const c = generate();
    const t1 = setTimeout(() => setPhase("open"), 1000);
    const t2 = setTimeout(() => { setPhase("reveal"); setCards(c); }, 2000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  });

  const hasGold = cards.some(c => c.rarity === "gold");

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: hasGold && phase === "reveal" ? "radial-gradient(ellipse at center,#1a1000,#000)" : "rgba(0,0,0,0.97)", backdropFilter: "blur(20px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans',sans-serif" }}>
      <style>{`@keyframes shk{0%,100%{transform:rotate(0) scale(1)}25%{transform:rotate(-10deg) scale(1.08)}75%{transform:rotate(10deg) scale(1.08)}} @keyframes exp{0%{transform:scale(1);opacity:1}100%{transform:scale(0);opacity:0}} @keyframes cin{from{opacity:0;transform:translateY(40px) scale(0.8) rotateY(180deg)}to{opacity:1;transform:none}} @keyframes gp{0%,100%{text-shadow:0 0 20px #ffd700}50%{text-shadow:0 0 60px #ffd700,0 0 100px #ffaa00}}`}</style>
      {phase === "shake" && <div style={{ textAlign: "center" }}><div style={{ fontSize: 120, animation: "shk 0.25s infinite", marginBottom: 24 }}>{pack.emoji}</div><div style={{ fontSize: 26, fontWeight: 900, color: "#fff", letterSpacing: 3 }}>OUVERTURE...</div></div>}
      {phase === "open" && <div style={{ textAlign: "center" }}><div style={{ fontSize: 120, animation: "exp 1s forwards" }}>{pack.emoji}</div><div style={{ fontSize: 36, fontWeight: 900, color: pack.color, marginTop: 20 }}>✨ RÉVÉLATION !</div></div>}
      {phase === "reveal" && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
          {hasGold && <div style={{ fontSize: 26, fontWeight: 900, color: "#ffd700", animation: "gp 1.5s infinite" }}>✦ CARTE OR LÉGENDAIRE ✦</div>}
          {!hasGold && <div style={{ fontSize: 20, fontWeight: 900, color: "#fff" }}>✨ TES CARTES !</div>}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", maxWidth: "92vw" }}>
            {cards.map((card, i) => (
              <div key={card.id} style={{ animation: `cin 0.6s cubic-bezier(.34,1.56,.64,1) ${i * 0.12}s both` }}>
                <HoloCard card={card} size={cards.length > 5 ? "small" : "normal"} />
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => { onDone(cards); onClose(); }} style={{ padding: "13px 32px", borderRadius: 12, border: "none", cursor: "pointer", background: hasGold ? "linear-gradient(135deg,#ffd700,#ff8c00)" : "linear-gradient(135deg,#ff5c00,#ff8c42)", color: hasGold ? "#1a0800" : "#fff", fontWeight: 900, fontSize: 15, fontFamily: "inherit" }}>Ajouter à ma collection →</button>
            <button onClick={onClose} style={{ padding: "13px 22px", borderRadius: 12, border: "1px solid #333", background: "transparent", color: "#666", cursor: "pointer", fontFamily: "inherit" }}>Fermer</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Cards() {
  const [view, setView] = useState("teams");
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [collection, setCollection] = useState([ALL_PLAYERS[0], ALL_PLAYERS[5]]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [openPack, setOpenPack] = useState(null);
  const [filter, setFilter] = useState("all");
  const [notif, setNotif] = useState(null);
  const [confFilter, setConfFilter] = useState("all");

  const showNotif = (msg) => { setNotif(msg); setTimeout(() => setNotif(null), 4000); };

  const handleDone = (cards) => {
    const newCards = cards.filter(c => !collection.find(col => col.id === c.id));
    setCollection(p => [...p, ...newCards]);
    const gold = newCards.find(c => c.rarity === "gold");
    if (gold) showNotif(`✦ OR LÉGENDAIRE ! ${gold.name} !`);
    else if (newCards.length) showNotif(`🎴 +${newCards.length} nouvelles cartes !`);
  };

  const filteredTeams = NBA_TEAMS.filter(t => confFilter === "all" || t.conf === confFilter);
  const filteredCollection = filter === "all" ? collection : filter === "gold" ? collection.filter(c => c.rarity === "gold") : collection.filter(c => c.rarity === filter);

  const TABS = [
    { id: "teams", label: "🌍 Équipes NBA" },
    { id: "collection", label: "🎴 Collection" },
    { id: "packs", label: "📦 Packs" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#06060f", color: "#f0f0ff", fontFamily: "'DM Sans',sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;600;700;900&display=swap'); *{box-sizing:border-box} ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-thumb{background:#ff5c00;border-radius:4px} @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}} @keyframes ni{from{opacity:0;transform:translateX(100px)}to{opacity:1;transform:translateX(0)}} @keyframes gp{0%,100%{box-shadow:0 0 20px rgba(255,215,0,.3)}50%{box-shadow:0 0 50px rgba(255,215,0,.7)}} .team-card:hover{transform:translateY(-4px) !important;border-color:rgba(255,92,0,0.4) !important;} .pack-h:hover{transform:translateY(-8px) scale(1.02) !important;}`}</style>

      {notif && <div style={{ position: "fixed", top: 80, right: 24, zIndex: 500, background: notif.includes("OR") ? "linear-gradient(135deg,#ffd700,#ff8c00)" : "linear-gradient(135deg,#ff5c00,#ff8c42)", color: notif.includes("OR") ? "#1a0800" : "#fff", padding: "13px 22px", borderRadius: 14, fontWeight: 900, fontSize: 14, animation: "ni .4s ease", boxShadow: "0 8px 40px rgba(255,92,0,0.5)" }}>{notif}</div>}

      {openPack && <PackOpening pack={openPack} onClose={() => setOpenPack(null)} onDone={handleDone} />}

      {selectedCard && (
        <div onClick={() => setSelectedCard(null)} style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(0,0,0,0.92)", backdropFilter: "blur(16px)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 24 }}>
          <div onClick={e => e.stopPropagation()}><HoloCard card={selectedCard} size="large" /></div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 32, color: RARITY[selectedCard.rarity].color, letterSpacing: 2 }}>{selectedCard.name}</div>
            <div style={{ fontSize: 13, color: "#888" }}>{RARITY[selectedCard.rarity].label} · Score {selectedCard.score}/100</div>
            {selectedCard.titles > 0 && <div style={{ fontSize: 14, color: "#ffd700", marginTop: 4 }}>🏆 {selectedCard.titles} titres NBA</div>}
          </div>
          <button onClick={() => setSelectedCard(null)} style={{ padding: "10px 26px", borderRadius: 10, border: "1px solid #333", background: "transparent", color: "#666", cursor: "pointer" }}>Fermer</button>
        </div>
      )}

      {/* Header */}
      <div style={{ background: "rgba(6,6,15,0.95)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 20, background: "linear-gradient(135deg,#ff5c00,#ff8c42)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: 3 }}>HOOP IQ · CARTES NBA</div>
        <div style={{ display: "flex", gap: 4 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setView(t.id)} style={{ padding: "7px 14px", borderRadius: 8, border: "none", cursor: "pointer", background: view === t.id ? "rgba(255,92,0,0.15)" : "transparent", color: view === t.id ? "#ff5c00" : "#6b7280", fontWeight: 700, fontSize: 12, borderBottom: view === t.id ? "2px solid #ff5c00" : "2px solid transparent", fontFamily: "inherit" }}>{t.label}</button>
          ))}
        </div>
        <div style={{ fontSize: 12, color: "#6b7280" }}>🃏 {collection.length} · {collection.filter(c => c.rarity === "gold").length > 0 && <span style={{ color: "#ffd700" }}>✦ {collection.filter(c => c.rarity === "gold").length} OR</span>}</div>
      </div>

      <div style={{ maxWidth: 1140, margin: "0 auto", padding: "24px" }}>

        {/* TEAMS VIEW */}
        {view === "teams" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <h1 style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 40, letterSpacing: 2 }}>30 ÉQUIPES <span style={{ color: "#ff5c00" }}>NBA</span></h1>
              <div style={{ display: "flex", gap: 8 }}>
                {[["all","Toutes"],["Est","Conférence Est"],["Ouest","Conférence Ouest"]].map(([id,label]) => (
                  <button key={id} onClick={() => setConfFilter(id)} style={{ padding: "6px 14px", borderRadius: 20, border: `1px solid ${confFilter === id ? "#ff5c00" : "rgba(255,255,255,0.1)"}`, background: confFilter === id ? "rgba(255,92,0,0.12)" : "transparent", color: confFilter === id ? "#ff5c00" : "#6b7280", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>{label}</button>
                ))}
              </div>
            </div>

            {selectedTeam ? (
              <div>
                <button onClick={() => setSelectedTeam(null)} style={{ marginBottom: 20, padding: "8px 20px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "#888", cursor: "pointer", fontFamily: "inherit" }}>← Toutes les équipes</button>
                <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24, padding: 20, background: `${selectedTeam.color}15`, borderRadius: 16, border: `1px solid ${selectedTeam.color}30` }}>
                  <div style={{ width: 16, height: 60, background: selectedTeam.color, borderRadius: 4 }} />
                  <div>
                    <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 36, letterSpacing: 1 }}>{selectedTeam.name}</div>
                    <div style={{ fontSize: 13, color: "#888" }}>Conférence {selectedTeam.conf} · {selectedTeam.players.length} joueurs</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                  {selectedTeam.players.map((p, i) => (
                    <div key={p.id} style={{ animation: `float ${3 + i * 0.5}s ease-in-out infinite` }}>
                      <HoloCard card={{ ...p, team: selectedTeam.name }} size="normal" onClick={() => setSelectedCard({ ...p, team: selectedTeam.name })} />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 14 }}>
                {filteredTeams.map(team => (
                  <div key={team.id} className="team-card" onClick={() => setSelectedTeam(team)} style={{ background: `${team.color}10`, border: `1px solid ${team.color}30`, borderRadius: 14, padding: "16px 18px", cursor: "pointer", transition: "all .2s" }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
                      <div style={{ width: 6, height: 40, background: team.color, borderRadius: 3, flexShrink: 0 }} />
                      <div>
                        <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 16, color: team.color, letterSpacing: 1 }}>{team.id}</div>
                        <div style={{ fontSize: 12, fontWeight: 700, lineHeight: 1.3 }}>{team.name}</div>
                        <div style={{ fontSize: 11, color: "#6b7280" }}>{team.conf}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: "#6b7280" }}>⭐ {team.players[0]?.name}</div>
                    <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 11, color: "#555" }}>{team.players.length} carte{team.players.length > 1 ? "s" : ""}</span>
                      <span style={{ fontSize: 11, color: team.color, fontWeight: 700 }}>Voir →</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* COLLECTION */}
        {view === "collection" && (
          <div>
            <h1 style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 40, letterSpacing: 2, marginBottom: 20 }}>MA <span style={{ color: "#ff5c00" }}>COLLECTION</span></h1>
            <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
              {[["all","Toutes"],["gold","✦ OR"],["legendary","🔥 Légendaires"],["epic","💜 Épiques"],["rare","💙 Rares"],["common","⬜ Communes"]].map(([id,label]) => (
                <button key={id} onClick={() => setFilter(id)} style={{ padding: "5px 14px", borderRadius: 20, border: `1px solid ${filter === id ? (id === "gold" ? "#ffd700" : "#ff5c00") : "rgba(255,255,255,0.1)"}`, background: filter === id ? (id === "gold" ? "rgba(255,215,0,0.12)" : "rgba(255,92,0,0.12)") : "transparent", color: filter === id ? (id === "gold" ? "#ffd700" : "#ff5c00") : "#6b7280", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>{label}</button>
              ))}
            </div>
            {filteredCollection.length === 0 ? (
              <div style={{ textAlign: "center", padding: 60, color: "#6b7280" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>Pas de cartes ici</div>
                <button onClick={() => setView("packs")} style={{ marginTop: 16, padding: "11px 26px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#ff5c00,#ff8c42)", color: "#fff", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Ouvrir des packs →</button>
              </div>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 18 }}>
                {filteredCollection.map((card, i) => (
                  <div key={card.id} style={{ animation: `float ${3 + i * 0.4}s ease-in-out infinite` }}>
                    <HoloCard card={card} size="normal" onClick={() => setSelectedCard(card)} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PACKS */}
        {view === "packs" && (
          <div>
            <h1 style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 40, letterSpacing: 2, marginBottom: 8 }}>OUVRIR DES <span style={{ color: "#ff5c00" }}>PACKS</span></h1>
            <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 32 }}>Obtiens les stars de toutes les équipes NBA + les légendes en OR 🏆</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 20, marginBottom: 36 }}>
              {PACKS.map(pack => (
                <div key={pack.id} className="pack-h" onClick={() => setOpenPack(pack)} style={{ background: pack.id === "legend" ? "linear-gradient(160deg,#1a1000,#3d2800)" : `linear-gradient(160deg,rgba(0,0,0,0.9),${pack.color}20)`, border: `2px solid ${pack.color}${pack.id === "legend" ? "cc" : "50"}`, borderRadius: 20, padding: 28, textAlign: "center", cursor: "pointer", transition: "all .3s", animation: pack.id === "legend" ? "gp 3s ease-in-out infinite" : "none" }}>
                  {pack.id === "legend" && <div style={{ fontSize: 11, color: "#ffd700", fontWeight: 800, letterSpacing: 2, marginBottom: 8 }}>✦ ÉDITION LIMITÉE ✦</div>}
                  <div style={{ fontSize: 70, marginBottom: 14, animation: "float 3s ease-in-out infinite" }}>{pack.emoji}</div>
                  <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 26, color: pack.color, letterSpacing: 1, marginBottom: 6 }}>{pack.name}</div>
                  <div style={{ fontSize: 12, color: "#888", marginBottom: 16, lineHeight: 1.6 }}>{pack.desc}</div>
                  <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 40, color: pack.color, marginBottom: 16 }}>{pack.price}</div>
                  <button style={{ width: "100%", padding: "12px", borderRadius: 10, border: "none", cursor: "pointer", background: pack.id === "legend" ? "linear-gradient(135deg,#ffd700,#ff8c00)" : `linear-gradient(135deg,${pack.color},${pack.color}99)`, color: pack.id === "legend" ? "#1a0800" : "#fff", fontWeight: 900, fontSize: 14, fontFamily: "inherit" }}>Ouvrir →</button>
                </div>
              ))}
            </div>
            <div style={{ background: "rgba(255,215,0,0.05)", border: "1px solid rgba(255,215,0,0.2)", borderRadius: 16, padding: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2, color: "#ffd700", textTransform: "uppercase", marginBottom: 14, fontFamily: "monospace" }}>✦ Légendes disponibles</div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                {LEGEND_CARDS.map(card => (
                  <HoloCard key={card.id} card={card} size="small" onClick={() => setSelectedCard(card)} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
