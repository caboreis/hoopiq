import { useState, useRef, useEffect, useMemo } from "react";

const ARENA_PHOTOS = [
  "/jc-gellidon-XmYSlYrupL8-unsplash.jpg",
  "/edgar-chaparro-kB5DnieBLtM-unsplash.jpg",
  "/logan-weaver-lgnwvr-XcBPc0Q_2h8-unsplash.jpg",
  "/kylie-osullivan-BfaBLVCBTI8-unsplash.jpg",
];

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
    { id: 201, espnId: 4065648, name: "Jayson Tatum", pos: "SF", trait: "MVP CANDIDAT" },
    { id: 202, espnId: 3917376, name: "Jaylen Brown", pos: "SG", trait: "CLUTCH" },
  ]},
  { id: "BKN", name: "Brooklyn Nets", city: "Brooklyn", conf: "Est", color: "#000000", players: [
    { id: 211, espnId: 4432174, name: "Cam Thomas", pos: "SG", trait: "SCOREUR" },
  ]},
  { id: "NYK", name: "New York Knicks", city: "New York", conf: "Est", color: "#F58426", players: [
    { id: 221, espnId: 3934672, name: "Jalen Brunson", pos: "PG", trait: "NYC KING" },
    { id: 222, espnId: 3136195, name: "Karl-Anthony Towns", pos: "C", trait: "BIG MAN" },
  ]},
  { id: "PHI", name: "Philadelphia 76ers", city: "Philadelphia", conf: "Est", color: "#006BB6", players: [
    { id: 231, espnId: 3059318, name: "Joel Embiid", pos: "C", trait: "MVP" },
    { id: 232, espnId: 4431678, name: "Tyrese Maxey", pos: "PG", trait: "EXPLOSIF" },
  ]},
  { id: "TOR", name: "Toronto Raptors", city: "Toronto", conf: "Est", color: "#CE1141", players: [
    { id: 241, espnId: 4433134, name: "Scottie Barnes", pos: "SF", trait: "POLYVALENT" },
  ]},
  // CENTRAL
  { id: "CHI", name: "Chicago Bulls", city: "Chicago", conf: "Est", color: "#CE1141", players: [
    { id: 251, espnId: 3064440, name: "Zach LaVine", pos: "SG", trait: "ÉLECTRIQUE" },
    { id: 252, espnId: 4395651, name: "Coby White", pos: "PG", trait: "EN FEU" },
  ]},
  { id: "CLE", name: "Cleveland Cavaliers", city: "Cleveland", conf: "Est", color: "#860038", players: [
    { id: 261, espnId: 3908809, name: "Donovan Mitchell", pos: "SG", trait: "SPIDA" },
    { id: 262, espnId: 4396907, name: "Darius Garland", pos: "PG", trait: "CRÉATEUR" },
  ]},
  { id: "DET", name: "Detroit Pistons", city: "Detroit", conf: "Est", color: "#C8102E", players: [
    { id: 271, espnId: 4432166, name: "Cade Cunningham", pos: "PG", trait: "FRANCHISE" },
  ]},
  { id: "IND", name: "Indiana Pacers", city: "Indiana", conf: "Est", color: "#002D62", players: [
    { id: 281, espnId: 4396993, name: "Tyrese Haliburton", pos: "PG", trait: "VISION" },
  ]},
  { id: "MIL", name: "Milwaukee Bucks", city: "Milwaukee", conf: "Est", color: "#00471B", players: [
    { id: 291, espnId: 3032977, name: "Giannis Antetokounmpo", pos: "PF", trait: "GREEK FREAK" },
    { id: 292, espnId: 6606, name: "Damian Lillard", pos: "PG", trait: "CLUTCH TIME" },
  ]},
  // SOUTHEAST
  { id: "ATL", name: "Atlanta Hawks", city: "Atlanta", conf: "Est", color: "#C1D32F", players: [
    { id: 301, espnId: 4277905, name: "Trae Young", pos: "PG", trait: "ICE TRAE" },
  ]},
  { id: "CHA", name: "Charlotte Hornets", city: "Charlotte", conf: "Est", color: "#1D1160", players: [
    { id: 311, espnId: 4432816, name: "LaMelo Ball", pos: "PG", trait: "MELO" },
  ]},
  { id: "MIA", name: "Miami Heat", city: "Miami", conf: "Est", color: "#98002E", players: [
    { id: 321, espnId: 6430, name: "Jimmy Butler", pos: "SF", trait: "PLAYOFF JIMMY" },
    { id: 322, espnId: 4066261, name: "Bam Adebayo", pos: "C", trait: "ANCHOR" },
  ]},
  { id: "ORL", name: "Orlando Magic", city: "Orlando", conf: "Est", color: "#0077C0", players: [
    { id: 331, espnId: 4432573, name: "Paolo Banchero", pos: "PF", trait: "PRIMO" },
  ]},
  { id: "WAS", name: "Washington Wizards", city: "Washington", conf: "Est", color: "#002B5C", players: [
    { id: 341, espnId: 3134907, name: "Kyle Kuzma", pos: "PF", trait: "KUZMA" },
  ]},
  // NORTHWEST
  { id: "DEN", name: "Denver Nuggets", city: "Denver", conf: "Ouest", color: "#0E2240", players: [
    { id: 351, espnId: 3112335, name: "Nikola Jokić", pos: "C", trait: "JOKER" },
    { id: 352, espnId: 3936299, name: "Jamal Murray", pos: "PG", trait: "MAP GOD" },
  ]},
  { id: "MIN", name: "Minnesota Timberwolves", city: "Minnesota", conf: "Ouest", color: "#0C2340", players: [
    { id: 361, espnId: 4594268, name: "Anthony Edwards", pos: "SG", trait: "ANT MAN" },
    { id: 362, espnId: 3136195, name: "Karl-Anthony Towns", pos: "C", trait: "KAT" },
  ]},
  { id: "OKC", name: "Oklahoma City Thunder", city: "Oklahoma City", conf: "Ouest", color: "#007AC1", players: [
    { id: 371, espnId: 4278073, name: "Shai Gilgeous-Alexander", pos: "PG", trait: "SGA" },
  ]},
  { id: "POR", name: "Portland Trail Blazers", city: "Portland", conf: "Ouest", color: "#E03A3E", players: [
    { id: 381, espnId: 4683678, name: "Scoot Henderson", pos: "PG", trait: "FUTUR" },
  ]},
  { id: "UTA", name: "Utah Jazz", city: "Utah", conf: "Ouest", color: "#002B5C", players: [
    { id: 391, espnId: 4066336, name: "Lauri Markkanen", pos: "PF", trait: "FINNISHER" },
  ]},
  // PACIFIC
  { id: "GSW", name: "Golden State Warriors", city: "San Francisco", conf: "Ouest", color: "#1D428A", players: [
    { id: 401, espnId: 3975, name: "Stephen Curry", pos: "PG", trait: "SPLASH BROTHER" },
    { id: 402, espnId: 6589, name: "Draymond Green", pos: "PF", trait: "IQ DÉFENSE" },
  ]},
  { id: "LAC", name: "LA Clippers", city: "Los Angeles", conf: "Ouest", color: "#C8102E", players: [
    { id: 411, espnId: 6450, name: "Kawhi Leonard", pos: "SF", trait: "THE CLAW" },
    { id: 412, espnId: 4251, name: "Paul George", pos: "SF", trait: "PG13" },
  ]},
  { id: "LAL", name: "Los Angeles Lakers", city: "Los Angeles", conf: "Ouest", color: "#552583", players: [
    { id: 421, espnId: 1966, name: "LeBron James", pos: "SF", trait: "KING JAMES" },
    { id: 422, espnId: 6583, name: "Anthony Davis", pos: "C", trait: "THE BROW" },
    { id: 423, espnId: null, photo: "/players/shareef.jpg", name: "Shareef O'Neal", pos: "PF", trait: "SON OF SHAQ" },
  ]},
  { id: "PHX", name: "Phoenix Suns", city: "Phoenix", conf: "Ouest", color: "#1D1160", players: [
    { id: 431, espnId: 3202, name: "Kevin Durant", pos: "SF", trait: "SLIM REAPER" },
    { id: 432, espnId: 3136193, name: "Devin Booker", pos: "SG", trait: "BOOK" },
  ]},
  { id: "SAC", name: "Sacramento Kings", city: "Sacramento", conf: "Ouest", color: "#5A2D81", players: [
    { id: 441, espnId: 4066259, name: "De'Aaron Fox", pos: "PG", trait: "SWIPA" },
  ]},
  // SOUTHWEST
  { id: "DAL", name: "Dallas Mavericks", city: "Dallas", conf: "Ouest", color: "#00538C", players: [
    { id: 451, espnId: 3945274, name: "Luka Dončić", pos: "PG", trait: "LUKA MAGIC" },
    { id: 452, espnId: 6442, name: "Kyrie Irving", pos: "PG", trait: "UNCLE DREW" },
  ]},
  { id: "HOU", name: "Houston Rockets", city: "Houston", conf: "Ouest", color: "#CE1141", players: [
    { id: 461, espnId: 4871144, name: "Alperen Şengün", pos: "C", trait: "TURK" },
    { id: 462, espnId: 4437244, name: "Jalen Green", pos: "SG", trait: "BABY FACE" },
  ]},
  { id: "MEM", name: "Memphis Grizzlies", city: "Memphis", conf: "Ouest", color: "#5D76A9", players: [
    { id: 471, espnId: 4279888, name: "Ja Morant", pos: "PG", trait: "JA TIME" },
  ]},
  { id: "NOP", name: "New Orleans Pelicans", city: "New Orleans", conf: "Ouest", color: "#0C2340", players: [
    { id: 481, espnId: 4395628, name: "Zion Williamson", pos: "PF", trait: "ZANOS" },
  ]},
  { id: "SAS", name: "San Antonio Spurs", city: "San Antonio", conf: "Ouest", color: "#C4CED4", players: [
    { id: 491, espnId: 5104157, name: "Victor Wembanyama", pos: "C", trait: "WEMBY" },
  ]},
];

const LEGEND_CARDS = [
  { id: 101, espnId: 1035, photo: "/players/jordan.jpg",  name: "Michael Jordan",      pos: "SG", team: "Chicago Bulls",   era: "1984-1998", pts: 30.1, ast: 5.3, reb: 6.2,  fg: 49.7, score: 100, rarity: "gold", trait: "LE PLUS GRAND",        titles: 6 },
  { id: 107, espnId: null,  photo: "/players/pippen.jpg",  name: "Scottie Pippen",      pos: "SF", team: "Chicago Bulls",   era: "1987-2004", pts: 16.1, ast: 5.2, reb: 6.4,  fg: 47.8, score: 96,  rarity: "gold", trait: "NO BULLS WITHOUT PIP", titles: 6 },
  { id: 108, espnId: null,  photo: "/players/rodman.jpg",  name: "Dennis Rodman",       pos: "PF", team: "Chicago Bulls",   era: "1986-2000", pts: 7.3,  ast: 1.8, reb: 13.1, fg: 52.0, score: 94,  rarity: "gold", trait: "THE WORM",             titles: 5 },
  { id: 102, espnId: 2334,  photo: "/players/magic.jpg",   name: "Magic Johnson",       pos: "PG", team: "L.A. Lakers",    era: "1979-1996", pts: 19.5, ast: 11.2,reb: 7.2,  fg: 52.0, score: 99,  rarity: "gold", trait: "SHOWTIME",             titles: 5 },
  { id: 103, espnId: 2335,  photo: null,                    name: "Larry Bird",          pos: "SF", team: "Boston Celtics", era: "1979-1992", pts: 24.3, ast: 6.3, reb: 10.0, fg: 49.6, score: 98,  rarity: "gold", trait: "THE HICK",              titles: 3 },
  { id: 104, espnId: 110,   photo: "/players/kobe.jpg",    name: "Kobe Bryant",         pos: "SG", team: "L.A. Lakers",    era: "1996-2016", pts: 25.0, ast: 4.7, reb: 5.2,  fg: 44.7, score: 98,  rarity: "gold", trait: "MAMBA",                titles: 5 },
  { id: 105, espnId: 614,   photo: "/players/shaq.jpg",    name: "Shaquille O'Neal",    pos: "C",  team: "L.A. Lakers",    era: "1992-2011", pts: 23.7, ast: 2.5, reb: 10.9, fg: 58.2, score: 97,  rarity: "gold", trait: "SUPERMAN",             titles: 4 },
  { id: 106, espnId: 4145,  photo: "/players/kareem.jpg",  name: "Kareem Abdul-Jabbar", pos: "C",  team: "L.A. Lakers",    era: "1969-1989", pts: 24.6, ast: 3.6, reb: 11.2, fg: 55.9, score: 99,  rarity: "gold", trait: "SKYHOOK",              titles: 6 },
  { id: 109, espnId: null,  photo: "/players/duncan.jpg",  name: "Tim Duncan",          pos: "PF", team: "San Antonio",    era: "1997-2016", pts: 19.0, ast: 3.0, reb: 10.8, fg: 50.6, score: 97,  rarity: "gold", trait: "THE BIG FUNDAMENTAL",  titles: 5 },
];

const PACKS = [
  { id: "standard", name: "Pack Standard",  price: "Gratuit", cards: 3, desc: "3 cartes NBA aléatoires",           emoji: "📦", color: "#6b7280" },
  { id: "nba",      name: "Pack NBA",        price: "9€",      cards: 5, desc: "5 cartes · 1 Rare garanti",         emoji: "🏀", color: "#ff5c00" },
  { id: "wnba",     name: "Pack WNBA",       price: "9€",      cards: 5, desc: "5 joueuses · 1 Rare garanti 🌸",    emoji: "🌸", color: "#c084fc" },
  { id: "allstar",  name: "Pack All-Star",   price: "29€",     cards: 8, desc: "8 cartes · 1 Épique garanti",       emoji: "⭐", color: "#f5c842" },
  { id: "legend",   name: "Pack Légende",    price: "89€",     cards: 5, desc: "5 cartes · 1 OR garanti 🏆",        emoji: "✨", color: "#ffd700" },
];

// ── LÉGENDES WNBA (cartes OR) ──
const WNBA_LEGEND_CARDS = [
  { id: 801, espnId: null, photo: "/players/sue_bird.jpg", league: "wnba", name: "Sue Bird", pos: "PG", team: "Seattle Storm", era: "2002-2022", pts: 13.0, ast: 5.8, reb: 3.1, fg: 44, score: 100, rarity: "gold", trait: "LA PLUS GRANDE", titles: 4 },
  { id: 802, espnId: null, photo: "/players/diana.jpg", league: "wnba", name: "Diana Taurasi", pos: "PG", team: "Phoenix Mercury", teamColor: "#e56020", era: "2004-2023", pts: 19.9, ast: 4.5, reb: 3.9, fg: 43, score: 99, rarity: "gold", trait: "WHITE MAMBA", titles: 3 },
];

// ── CARTES EXCLUSIVES ELITE (variantes Black Edition réservées au plan Elite) ──
// Identité uniquement — pts/ast/reb/score sont récupérés en direct (voir hydrateWithLiveStats).
const ELITE_EXCLUSIVE_CARDS_META = [
  { id: 701, espnId: 1966, photo: null, name: "LeBron James", pos: "SF", team: "HoopIQ Black Edition", era: "EXCLUSIF ELITE", trait: "✦ BLACK EDITION", titles: 4 },
  { id: 702, espnId: 3975, photo: null, name: "Stephen Curry", pos: "PG", team: "HoopIQ Black Edition", era: "EXCLUSIF ELITE", trait: "✦ BLACK EDITION", titles: 4 },
];

// ── ROSTER WNBA COMPLET ──
// Identité uniquement — pts/ast/reb/score sont récupérés en direct (voir hydrateWithLiveStats).
const WNBA_PLAYERS_META = [
  // ── LÉGENDAIRES ──
  { id: 901, espnId: 4433403, league: "wnba", name: "Caitlin Clark",    pos: "PG", team: "Indiana Fever",      teamColor: "#C8102E", trait: "ROY 2024"            },
  { id: 902, espnId: 3149391, league: "wnba", name: "A'ja Wilson",       pos: "C",  team: "Las Vegas Aces",     teamColor: "#C8102E", trait: "MVP 2024"             },
  // ── ÉPIQUES ──
  { id: 903, espnId: 2998928, league: "wnba", name: "Breanna Stewart",  pos: "PF", team: "New York Liberty",   teamColor: "#86CEBC",      trait: "STEWIE"              },
  { id: 904, espnId: 4066533, league: "wnba", name: "Sabrina Ionescu",  pos: "PG", team: "New York Liberty",   teamColor: "#86CEBC",      trait: "TRIPLE-DOUBLE"       },
  { id: 905, espnId: 4433402, league: "wnba", name: "Angel Reese",      pos: "PF", team: "Atlanta Dream",      teamColor: "#C41230",      trait: "DOUBLE-DOUBLE QUEEN" },
  { id: 906, espnId: 3065570, league: "wnba", name: "Kelsey Plum",      pos: "PG", team: "Los Angeles Sparks", teamColor: "#9d7bd8",      trait: "CLUTCH QUEEN"        },
  { id: 907, espnId: 3917450, league: "wnba", name: "Napheesa Collier", pos: "PF", team: "Minnesota Lynx",     teamColor: "#236192",      trait: "PHEE"                },
  { id: 908, espnId: 2529140, league: "wnba", name: "Alyssa Thomas",    pos: "PF", team: "Phoenix Mercury",    teamColor: "#e56020",      trait: "TRIPLE MENACE"       },
  { id: 909, espnId: 2999101, league: "wnba", name: "Jonquel Jones",    pos: "PF", team: "New York Liberty",   teamColor: "#86CEBC",      trait: "MVP 2021"            },
  { id: 910, espnId: 4398674, league: "wnba", name: "Rhyne Howard",     pos: "SG", team: "Atlanta Dream",      teamColor: "#C41230",      trait: "ROY 2022"            },
  // ── RARES ──
  { id: 911, espnId: 2529122, league: "wnba", name: "Chelsea Gray",     pos: "PG", team: "Las Vegas Aces",     teamColor: "#C8102E",      trait: "FINALES MVP"         },
  { id: 912, espnId: 2987869, league: "wnba", name: "Jewell Loyd",      pos: "SG", team: "Las Vegas Aces",     teamColor: "#C8102E",      trait: "SCOREUSE"            },
  { id: 913, espnId: 869,     league: "wnba", name: "DeWanna Bonner",   pos: "SF", team: "Phoenix Mercury",    teamColor: "#e56020",      trait: "VÉTÉRANE"            },
  { id: 914, espnId: 2566106, league: "wnba", name: "Dearica Hamby",    pos: "PF", team: "Los Angeles Sparks", teamColor: "#9d7bd8",      trait: "ENERGY"              },
  { id: 915, espnId: 4432831, league: "wnba", name: "Aliyah Boston",    pos: "PF", team: "Indiana Fever",      teamColor: "#C8102E",      trait: "ROY 2023"            },
  // ── COMMUNES ──
  { id: 916, espnId: 2987891, league: "wnba", name: "Courtney Williams", pos: "PG", team: "Minnesota Lynx",    teamColor: "#236192",    trait: "WARRIOR"             },
  { id: 917, espnId: 2491205, league: "wnba", name: "Skylar Diggins",   pos: "PG", team: "Chicago Sky",        teamColor: "#418FDE",    trait: "POINT GOD"           },
];

// Auparavant pts/ast/reb/fg/score étaient codés en dur pour ~50 joueurs, un snapshot figé
// jamais mis à jour et présenté comme des stats réelles. Elles sont maintenant récupérées
// en direct via /api/player-stats/:league/:espnId (même source ESPN que le reste de l'app,
// même formule hoopiqScore que le tableau de bord Bulls) — voir hydrateWithLiveStats, appelé
// depuis le composant Cards.
const rarityFromScore = (score) => {
  if (score == null) return null; // pas de vraies stats → pas de carte, plutôt qu'un chiffre inventé
  if (score >= 90) return "legendary";
  if (score >= 75) return "epic";
  if (score >= 55) return "rare";
  return "common";
};

async function fetchLiveScore(apiBase, league, espnId) {
  try {
    const r = await fetch(`${apiBase}/api/player-stats/${league}/${espnId}`);
    if (!r.ok) return null;
    const d = await r.json();
    return d.score == null ? null : d;
  } catch {
    return null;
  }
}

function PlayerPhoto({ espnId, photo, name, size, league }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const sport = league === "wnba" ? "wnba" : "nba";
  const url = photo || (espnId ? `https://a.espncdn.com/combiner/i?img=/i/headshots/${sport}/players/full/${espnId}.png&w=350&h=254` : null);
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

function HoloCard({ card, size = "normal", onClick, locked = false }) {
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
            <div style={{ position: "absolute", inset: 0, backgroundImage: "url(/kylie-osullivan-BfaBLVCBTI8-unsplash.jpg)", backgroundSize: "cover", backgroundPosition: "center", opacity: 0.18 }} />
            <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 50% 110%,${r.color}15 0%,transparent 60%)` }} />
            <div style={{ position: "absolute", top: 5, right: 5, width: size === "small" ? 20 : 28, height: size === "small" ? 20 : 28, borderRadius: "50%", background: isGold ? "linear-gradient(135deg,#ffd700,#ff8c00)" : r.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size === "small" ? 7 : 10, fontWeight: 900, color: isGold ? "#1a0800" : "#fff", fontFamily: "monospace" }}>{card.score}</div>
            {card.titles > 0 && <div style={{ position: "absolute", bottom: 4, left: 4, fontSize: size === "small" ? 5 : 8, color: "#ffd700", fontWeight: 800, background: "rgba(0,0,0,0.8)", padding: "1px 5px", borderRadius: 3 }}>🏆×{card.titles}</div>}
            <PlayerPhoto espnId={card.espnId} photo={card.photo} name={card.name} size={w - (size === "small" ? 14 : 22)} league={card.league} />
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
        {/* Cadenas plan : la carte OR reste visible et brille dessous, mais verrouillée */}
        {locked && (
          <div style={{
            position: "absolute", inset: 0, zIndex: 5, borderRadius: isGold ? 15 : 16,
            background: "rgba(2,2,8,0.5)", display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: size === "small" ? 4 : 7,
          }}>
            <div style={{ fontSize: size === "small" ? 22 : 36, filter: "drop-shadow(0 0 10px rgba(255,215,0,0.6))" }}>🔒</div>
            <div style={{
              fontSize: size === "small" ? 6 : 9, fontWeight: 900, letterSpacing: 1, color: "#ffd700",
              background: "rgba(0,0,0,0.7)", padding: "2px 9px", borderRadius: 10, border: "1px solid rgba(255,215,0,0.5)",
            }}>PRO / ELITE</div>
          </div>
        )}
      </div>
    </div>
  );
}

function PackOpening({ pack, onClose, onDone, legendaryUnlocked = false, isElite = false, players, wnbaPlayers }) {
  const [phase, setPhase] = useState("shake");
  const [cards, setCards] = useState([]);

  const generate = () => {
    // players/wnbaPlayers viennent des stats live chargées par le composant parent — s'ils
    // sont encore vides (chargement en cours), on ne génère rien plutôt que planter.
    if (players.length === 0 && wnbaPlayers.length === 0) return [];
    const allLegends = [...LEGEND_CARDS, ...WNBA_LEGEND_CARDS];
    // Sans accès Légendaire, aucune carte OR ne peut tomber : on la remplace par une carte standard.
    const stripGold = (arr) => {
      if (legendaryUnlocked) return arr;
      const fallback = [...players, ...wnbaPlayers].filter(p => p.rarity !== "gold");
      return arr.map(c => c.rarity === "gold" ? fallback[Math.floor(Math.random() * fallback.length)] : c);
    };
    if (pack.id === "legend") {
      const gold = allLegends[Math.floor(Math.random() * allLegends.length)];
      const rest = [...players, ...wnbaPlayers].sort(() => Math.random() - 0.5).slice(0, 4);
      return stripGold([gold, ...rest]);
    }
    if (pack.id === "wnba") {
      const pool = [...wnbaPlayers].sort(() => Math.random() - 0.5);
      if (pool.length === 0) return [];
      const result = [];
      const rare = pool.filter(p => p.rarity === "rare" || p.rarity === "epic" || p.rarity === "legendary");
      if (rare.length) result.push(rare[Math.floor(Math.random() * rare.length)]);
      if (Math.random() < 0.08) result.push(WNBA_LEGEND_CARDS[Math.floor(Math.random() * WNBA_LEGEND_CARDS.length)]);
      while (result.length < pack.cards) {
        const c = pool[result.length % pool.length];
        if (!result.find(r => r.id === c.id)) result.push(c);
      }
      return stripGold(result.slice(0, pack.cards));
    }
    const pool = [...players].sort(() => Math.random() - 0.5);
    if (pool.length === 0) return [];
    const result = [];
    if (pack.id === "allstar") {
      const epic = pool.filter(p => p.rarity === "epic" || p.rarity === "legendary");
      if (epic.length) result.push(epic[Math.floor(Math.random() * epic.length)]);
      if (Math.random() < 0.1) result.push(allLegends[Math.floor(Math.random() * allLegends.length)]);
    }
    if (pack.id === "nba") {
      const rare = pool.filter(p => p.rarity === "rare" || p.rarity === "epic" || p.rarity === "legendary");
      if (rare.length) result.push(rare[Math.floor(Math.random() * rare.length)]);
    }
    while (result.length < pack.cards) {
      const c = pool[result.length % pool.length];
      if (!result.find(r => r.id === c.id)) result.push(c);
    }
    return stripGold(result.slice(0, pack.cards));
  };

  useState(() => {
    const c = generate();
    const t1 = setTimeout(() => setPhase("open"), 1000);
    const t2 = setTimeout(() => { setPhase("reveal"); setCards(c); }, 2000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  });

  const hasGold = cards.some(c => c.rarity === "gold");

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: (hasGold || isElite) && phase === "reveal" ? "radial-gradient(ellipse at center,#1a1000,#000)" : "rgba(0,0,0,0.97)", backdropFilter: "blur(20px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans',sans-serif" }}>
      <style>{`@keyframes shk{0%,100%{transform:rotate(0) scale(1)}25%{transform:rotate(-10deg) scale(1.08)}75%{transform:rotate(10deg) scale(1.08)}} @keyframes exp{0%{transform:scale(1);opacity:1}100%{transform:scale(0);opacity:0}} @keyframes cin{from{opacity:0;transform:translateY(40px) scale(0.8) rotateY(180deg)}to{opacity:1;transform:none}} @keyframes gp{0%,100%{text-shadow:0 0 20px #ffd700}50%{text-shadow:0 0 60px #ffd700,0 0 100px #ffaa00}} @keyframes elitePart{0%{transform:translateY(0) scale(1);opacity:0.9}100%{transform:translateY(-120px) scale(0.2);opacity:0}}`}</style>
      {/* Pluie de particules dorées — animation premium réservée au plan Elite */}
      {isElite && phase === "reveal" && (
        <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
          {Array.from({ length: 18 }).map((_, i) => (
            <div key={i} style={{
              position: "absolute", bottom: 0, left: `${(i * 5.5 + 4) % 100}%`,
              fontSize: 10 + (i % 4) * 4, animation: `elitePart ${1.6 + (i % 5) * 0.4}s ease-out ${(i % 6) * 0.25}s infinite`,
            }}>✦</div>
          ))}
        </div>
      )}
      {phase === "shake" && <div style={{ textAlign: "center" }}><div style={{ fontSize: 120, animation: "shk 0.25s infinite", marginBottom: 24 }}>{pack.emoji}</div><div style={{ fontSize: 26, fontWeight: 900, color: "#fff", letterSpacing: 3 }}>OUVERTURE...</div></div>}
      {phase === "open" && <div style={{ textAlign: "center" }}><div style={{ fontSize: 120, animation: "exp 1s forwards" }}>{pack.emoji}</div><div style={{ fontSize: 36, fontWeight: 900, color: pack.color, marginTop: 20 }}>✨ RÉVÉLATION !</div></div>}
      {phase === "reveal" && (
        <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
          {isElite && <div style={{ fontSize: 13, fontWeight: 900, letterSpacing: 3, color: "#ffd700", fontFamily: "monospace", animation: "gp 1.5s infinite" }}>✦ OUVERTURE PREMIUM ELITE ✦</div>}
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

const API_BASE = import.meta.env.DEV ? "http://localhost:3001" : "";

export default function Cards({ legendaryUnlocked = false, isElite = false, onUpgrade }) {
  const [view, setView] = useState("teams");
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [collection, setCollection] = useState(() => {
    // On recharge la collection sauvegardée pour qu'elle NE DISPARAISSE PLUS.
    try {
      const saved = localStorage.getItem("hoopiq_collection_v1");
      if (saved) {
        const arr = JSON.parse(saved);
        if (Array.isArray(arr) && arr.length) return arr;
      }
    } catch { /* ignore */ }
    return null; // null = pas encore de collection sauvegardée → 2 cartes de départ une fois les stats live chargées
  });
  const [selectedCard, setSelectedCard] = useState(null);
  const [lockedCard, setLockedCard] = useState(null); // carte OR verrouillée cliquée (plan Scout)
  const [openPack, setOpenPack] = useState(null);
  const [filter, setFilter] = useState("all");
  const [notif, setNotif] = useState(null);
  const [confFilter, setConfFilter] = useState("all");
  const [wnbaFilter, setWnbaFilter] = useState("all");
  const [arenaIdx, setArenaIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setArenaIdx(i => (i + 1) % ARENA_PHOTOS.length), 8000);
    return () => clearInterval(t);
  }, []);
  // Sauvegarde la collection à chaque ajout → elle reste pour toujours.
  useEffect(() => {
    if (collection === null) return;
    try { localStorage.setItem("hoopiq_collection_v1", JSON.stringify(collection)); } catch { /* ignore */ }
  }, [collection]);

  // ── Stats live (ESPN) pour tous les joueurs actuels — voir rarityFromScore/fetchLiveScore.
  // Les légendes (LEGEND_CARDS/WNBA_LEGEND_CARDS, retraitées) gardent leurs stats de carrière
  // fixes : il n'existe pas de "stats en direct" pour un joueur qui ne joue plus.
  const [liveStats, setLiveStats] = useState({});
  const [statsLoading, setStatsLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    const targets = [
      ...NBA_TEAMS.flatMap(t => t.players.map(p => ({ id: p.id, espnId: p.espnId, league: "nba" }))),
      ...WNBA_PLAYERS_META.map(p => ({ id: p.id, espnId: p.espnId, league: "wnba" })),
      ...ELITE_EXCLUSIVE_CARDS_META.map(p => ({ id: p.id, espnId: p.espnId, league: "nba" })),
    ].filter(t => t.espnId != null);
    (async () => {
      const results = await Promise.all(targets.map(async (t) => {
        const d = await fetchLiveScore(API_BASE, t.league, t.espnId);
        return [t.id, d];
      }));
      if (cancelled) return;
      const map = {};
      for (const [id, d] of results) if (d) map[id] = d;
      setLiveStats(map);
      setStatsLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const ALL_PLAYERS = useMemo(() => NBA_TEAMS.flatMap(t => t.players.map(p => {
    const s = liveStats[p.id];
    if (!s) return null;
    return { ...p, team: t.name, teamId: t.id, teamColor: t.color, pts: s.stats.pts, ast: s.stats.ast, reb: s.stats.reb, fg: s.stats.fg, score: s.score, rarity: rarityFromScore(s.score) };
  }).filter(Boolean)), [liveStats]);

  const WNBA_PLAYERS = useMemo(() => WNBA_PLAYERS_META.map(p => {
    const s = liveStats[p.id];
    if (!s) return null;
    return { ...p, pts: s.stats.pts, ast: s.stats.ast, reb: s.stats.reb, fg: s.stats.fg, score: s.score, rarity: rarityFromScore(s.score) };
  }).filter(Boolean), [liveStats]);

  const ELITE_EXCLUSIVE_CARDS = useMemo(() => ELITE_EXCLUSIVE_CARDS_META.map(p => {
    const s = liveStats[p.id];
    if (!s) return null;
    // "gold" est une teinte cosmétique fixe pour cette variante Black Edition, pas une note dérivée du score.
    return { ...p, pts: s.stats.pts, ast: s.stats.ast, reb: s.stats.reb, fg: s.stats.fg, score: s.score, rarity: "gold" };
  }).filter(Boolean), [liveStats]);

  const teamsHydrated = useMemo(() => NBA_TEAMS.map(t => ({ ...t, players: ALL_PLAYERS.filter(p => p.teamId === t.id) })), [ALL_PLAYERS]);

  // Deux cartes de départ, une fois — seulement si l'utilisateur n'avait pas déjà une collection sauvegardée.
  const seededRef = useRef(false);
  useEffect(() => {
    if (collection !== null || seededRef.current || ALL_PLAYERS.length < 6) return;
    seededRef.current = true;
    setCollection([ALL_PLAYERS[0], ALL_PLAYERS[5]]);
  }, [collection, ALL_PLAYERS]);

  const showNotif = (msg) => { setNotif(msg); setTimeout(() => setNotif(null), 4000); };

  // Une carte OR est verrouillée si l'utilisateur n'a pas l'accès Légendaire (plan Scout hors essai)
  const isLocked = (card) => card?.rarity === "gold" && !legendaryUnlocked;
  const openCard = (card) => { if (isLocked(card)) setLockedCard(card); else setSelectedCard(card); };
  // Le Pack Légende (OR garanti) est réservé aux plans Pro/Elite
  const openPackSafe = (pack) => { if (pack.id === "legend" && !legendaryUnlocked) setLockedCard({ pack: true }); else setOpenPack(pack); };

  const handleDone = (cards) => {
    const col = collection || [];
    const newCards = cards.filter(c => !col.find(existing => existing.id === c.id));
    setCollection(p => [...(p || []), ...newCards]);
    const gold = newCards.find(c => c.rarity === "gold");
    if (gold) showNotif(`✦ OR LÉGENDAIRE ! ${gold.name} !`);
    else if (newCards.length) showNotif(`🎴 +${newCards.length} nouvelles cartes !`);
  };

  const col = collection || [];
  const filteredTeams = teamsHydrated.filter(t => confFilter === "all" || t.conf === confFilter);
  const filteredCollection = col
    .filter(c => filter === "all" ? true : filter === "gold" ? c.rarity === "gold" : filter === "wnba" ? c.league === "wnba" : c.rarity === filter);

  const TABS = [
    { id: "teams",      label: "🌍 Équipes NBA" },
    { id: "wnba",       label: "🌸 WNBA" },
    { id: "collection", label: "🎴 Collection" },
    { id: "packs",      label: "📦 Packs" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#06060f", color: "#f0f0ff", fontFamily: "'DM Sans',sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;600;700;900&display=swap'); *{box-sizing:border-box} ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-thumb{background:#ff5c00;border-radius:4px} @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}} @keyframes ni{from{opacity:0;transform:translateX(100px)}to{opacity:1;transform:translateX(0)}} @keyframes gp{0%,100%{box-shadow:0 0 20px rgba(255,215,0,.3)}50%{box-shadow:0 0 50px rgba(255,215,0,.7)}} .team-card:hover{transform:translateY(-4px) !important;border-color:rgba(255,92,0,0.4) !important;} .pack-h:hover{transform:translateY(-8px) scale(1.02) !important;} @media(max-width:767px){.cards-teams-grid{grid-template-columns:1fr 1fr !important;} .cards-packs-grid{grid-template-columns:1fr !important;} .cards-header{font-size:28px !important;} button,a{min-height:44px;} input{font-size:16px !important;} .holo-legend-row{justify-content:center !important;}}`}</style>

      {notif && <div style={{ position: "fixed", top: 80, right: 24, zIndex: 500, background: notif.includes("OR") ? "linear-gradient(135deg,#ffd700,#ff8c00)" : "linear-gradient(135deg,#ff5c00,#ff8c42)", color: notif.includes("OR") ? "#1a0800" : "#fff", padding: "13px 22px", borderRadius: 14, fontWeight: 900, fontSize: 14, animation: "ni .4s ease", boxShadow: "0 8px 40px rgba(255,92,0,0.5)" }}>{notif}</div>}

      {statsLoading && (
        <div style={{ position: "fixed", top: 66, left: "50%", transform: "translateX(-50%)", zIndex: 500, background: "rgba(6,6,15,0.92)", border: "1px solid rgba(255,92,0,0.3)", color: "#ff8c42", padding: "7px 16px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
          ⏳ Chargement des stats en direct (ESPN)…
        </div>
      )}

      {openPack && <PackOpening pack={openPack} onClose={() => setOpenPack(null)} onDone={handleDone} legendaryUnlocked={legendaryUnlocked} isElite={isElite} players={ALL_PLAYERS} wnbaPlayers={WNBA_PLAYERS} />}

      {/* Modal carte OR verrouillée (plan Scout) */}
      {lockedCard && (
        <div onClick={() => setLockedCard(null)} style={{ position: "fixed", inset: 0, zIndex: 600, background: "rgba(0,0,0,0.9)", backdropFilter: "blur(16px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ maxWidth: 400, width: "100%", textAlign: "center", background: "linear-gradient(160deg,#1a1000,#0d0700)", border: "1px solid rgba(255,215,0,0.4)", borderRadius: 22, padding: "40px 30px", boxShadow: "0 0 60px rgba(255,215,0,0.2)" }}>
            <div style={{ fontSize: 56, marginBottom: 12, filter: "drop-shadow(0 0 16px rgba(255,215,0,0.6))" }}>🔒</div>
            <h2 style={{ fontFamily: "'Permanent Marker',cursive", fontSize: 30, letterSpacing: 1, color: "#ffd700", margin: "0 0 10px" }}>CARTE LÉGENDAIRE</h2>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.75)", lineHeight: 1.6, marginBottom: 26 }}>
              Débloque les cartes <b style={{ color: "#ffd700" }}>OR Légendaires</b> (Jordan, Kobe, Magic, Bird…) avec le plan <b>Pro</b> ou <b>Elite</b> 🚀
            </p>
            <button onClick={() => { setLockedCard(null); onUpgrade?.(); }} style={{ width: "100%", padding: "14px", borderRadius: 12, border: "none", cursor: "pointer", background: "linear-gradient(135deg,#ffd700,#ff8c00)", color: "#1a0800", fontWeight: 900, fontSize: 15, fontFamily: "inherit", marginBottom: 10 }}>
              💎 Passer à Pro / Elite →
            </button>
            <button onClick={() => setLockedCard(null)} style={{ width: "100%", padding: "11px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.15)", background: "transparent", color: "#888", cursor: "pointer", fontFamily: "inherit" }}>Plus tard</button>
          </div>
        </div>
      )}

      {selectedCard && (
        <div onClick={() => setSelectedCard(null)} style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(0,0,0,0.92)", backdropFilter: "blur(16px)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 24 }}>
          <div onClick={e => e.stopPropagation()}><HoloCard card={selectedCard} size="large" /></div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "'Permanent Marker',cursive", fontSize: 32, color: RARITY[selectedCard.rarity].color, letterSpacing: 2 }}>{selectedCard.name}</div>
            <div style={{ fontSize: 13, color: "#888" }}>{RARITY[selectedCard.rarity].label} · Score {selectedCard.score}/100</div>
            {selectedCard.titles > 0 && <div style={{ fontSize: 14, color: "#ffd700", marginTop: 4 }}>🏆 {selectedCard.titles} titre{selectedCard.titles > 1 ? "s" : ""} {selectedCard.league === "wnba" ? "WNBA" : "NBA"}</div>}
          </div>
          <button onClick={() => setSelectedCard(null)} style={{ padding: "10px 26px", borderRadius: 10, border: "1px solid #333", background: "transparent", color: "#666", cursor: "pointer" }}>Fermer</button>
        </div>
      )}

      {/* Header */}
      <div style={{ background: "rgba(6,6,15,0.95)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontFamily: "'Permanent Marker',cursive", fontSize: 20, background: "linear-gradient(135deg,#ff5c00,#ff8c42)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: 3 }}>HOOP IQ · CARTES NBA</div>
        <div style={{ display: "flex", gap: 4 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setView(t.id)} style={{ padding: "7px 14px", borderRadius: 8, border: "none", cursor: "pointer", background: view === t.id ? "rgba(255,92,0,0.15)" : "transparent", color: view === t.id ? "#ff5c00" : "#6b7280", fontWeight: 700, fontSize: 12, borderBottom: view === t.id ? "2px solid #ff5c00" : "2px solid transparent", fontFamily: "inherit" }}>{t.label}</button>
          ))}
        </div>
        <div style={{ fontSize: 12, color: "#6b7280" }}>🃏 {col.length} · {col.filter(c => c.rarity === "gold").length > 0 && <span style={{ color: "#ffd700" }}>✦ {col.filter(c => c.rarity === "gold").length} OR</span>}</div>
      </div>

      {/* Arena hero banner */}
      <div style={{ position: "relative", height: 160, overflow: "hidden" }}>
        {ARENA_PHOTOS.map((src, i) => (
          <div key={src} style={{
            position: "absolute", inset: 0,
            backgroundImage: `url(${src})`, backgroundSize: "cover", backgroundPosition: "center 30%",
            opacity: i === arenaIdx ? 1 : 0, transition: "opacity 2s ease-in-out",
          }} />
        ))}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(6,6,15,0.88) 0%, rgba(6,6,15,0.45) 100%)" }} />
        <div style={{ position: "relative", zIndex: 1, padding: "28px 32px", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <h1 style={{ fontFamily: "'Permanent Marker', cursive", fontSize: 46, letterSpacing: 2, lineHeight: 1, margin: 0, color: "#f0f0ff" }}>
            CARTES <span style={{ color: "#ff5c00" }}>NBA</span>
          </h1>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, marginTop: 6 }}>
            {col.length} carte{col.length > 1 ? "s" : ""} dans ta collection · 30 équipes · Légendes & Stars
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 1140, margin: "0 auto", padding: "24px" }}>

        {/* TEAMS VIEW */}
        {view === "teams" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <h1 style={{ fontFamily: "'Permanent Marker',cursive", fontSize: 40, letterSpacing: 2 }}>30 ÉQUIPES <span style={{ color: "#ff5c00" }}>NBA</span></h1>
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
                    <div style={{ fontFamily: "'Permanent Marker',cursive", fontSize: 36, letterSpacing: 1 }}>{selectedTeam.name}</div>
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
              <div className="cards-teams-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 14 }}>
                {filteredTeams.map(team => (
                  <div key={team.id} className="team-card" onClick={() => setSelectedTeam(team)} style={{ background: `${team.color}10`, border: `1px solid ${team.color}30`, borderRadius: 14, padding: "16px 18px", cursor: "pointer", transition: "all .2s" }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
                      <div style={{ width: 6, height: 40, background: team.color, borderRadius: 3, flexShrink: 0 }} />
                      <div>
                        <div style={{ fontFamily: "'Permanent Marker',cursive", fontSize: 16, color: team.color, letterSpacing: 1 }}>{team.id}</div>
                        <div style={{ fontSize: 12, fontWeight: 700, lineHeight: 1.3 }}>{team.name}</div>
                        <div style={{ fontSize: 11, color: "#6b7280" }}>{team.conf}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: "#6b7280" }}>⭐ {team.players[0]?.name || (statsLoading ? "Chargement…" : "—")}</div>
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

        {/* WNBA */}
        {view === "wnba" && (
          <div>
            <style>{`
              @keyframes wnbaGlow { 0%,100%{box-shadow:0 0 24px rgba(192,132,252,0.3)} 50%{box-shadow:0 0 48px rgba(192,132,252,0.6),0 0 80px rgba(255,92,0,0.2)} }
              .wnba-card:hover { transform: translateY(-6px) !important; }
            `}</style>

            {/* Hero WNBA */}
            <div style={{ position: "relative", borderRadius: 20, overflow: "hidden", marginBottom: 28, padding: "28px 32px", background: "linear-gradient(135deg,#12002a,#1a0050,#0d0020)", border: "1px solid rgba(192,132,252,0.25)" }}>
              <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 60% 80% at 80% 50%, rgba(192,132,252,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />
              <div style={{ position: "relative", zIndex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2, color: "#c084fc", textTransform: "uppercase", fontFamily: "monospace" }}>🌸 ÉDITION WNBA</span>
                  <div style={{ height: 1, flex: 1, background: "rgba(192,132,252,0.2)" }} />
                </div>
                <h1 style={{ fontFamily: "'Permanent Marker',cursive", fontSize: 48, letterSpacing: 2, lineHeight: 1, margin: 0, background: "linear-gradient(135deg,#fff,#c084fc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>STARS DE LA WNBA</h1>
                <p style={{ color: "rgba(192,132,252,0.7)", fontSize: 13, marginTop: 6 }}>{WNBA_PLAYERS.length} joueuses · 2 Légendes OR · Saison {new Date().getFullYear()}</p>
              </div>
            </div>

            {/* Filtre par équipe */}
            <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
              {[
                ["all", "Toutes"],
                ["Indiana Fever", "🔴 Fever"],
                ["Las Vegas Aces", "♠ Aces"],
                ["New York Liberty", "🩵 Liberty"],
                ["Chicago Sky", "🔵 Sky"],
                ["Minnesota Lynx", "🐾 Lynx"],
                ["Phoenix Mercury", "🌞 Mercury"],
                ["Atlanta Dream", "🌸 Dream"],
                ["Seattle Storm", "⚡ Storm"],
                ["Los Angeles Sparks", "💜 Sparks"],
              ].map(([id, label]) => (
                <button key={id} onClick={() => setWnbaFilter(id)} style={{
                  padding: "6px 16px", borderRadius: 20, fontFamily: "inherit", cursor: "pointer", fontSize: 12,
                  border: `1px solid ${wnbaFilter === id ? "#c084fc" : "rgba(192,132,252,0.2)"}`,
                  background: wnbaFilter === id ? "rgba(192,132,252,0.14)" : "transparent",
                  color: wnbaFilter === id ? "#c084fc" : "#6b7280",
                  transition: "all .2s",
                }}>{label}</button>
              ))}
            </div>

            {/* Grille cartes */}
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
              {WNBA_PLAYERS
                .filter(p => wnbaFilter === "all" || p.team === wnbaFilter)
                .map((player, i) => {
                  const isCC = player.id === 901;
                  return (
                    <div key={player.id} className="wnba-card" style={{ transition: "transform .2s", animation: `float ${3 + i * 0.5}s ease-in-out infinite` }}>
                      {/* Badge spécial Caitlin Clark */}
                      {isCC && (
                        <div style={{ textAlign: "center", marginBottom: 6 }}>
                          <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2, color: "#ffd700", background: "rgba(255,215,0,0.1)", padding: "3px 10px", borderRadius: 10, border: "1px solid rgba(255,215,0,0.3)", fontFamily: "monospace" }}>⭐ FRANCHISE PLAYER</span>
                        </div>
                      )}
                      <HoloCard
                        card={player}
                        size="normal"
                        onClick={() => openCard(player)}
                        locked={isLocked(player)}
                      />
                      {/* Info équipe sous la carte */}
                      <div style={{ marginTop: 8, textAlign: "center" }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: player.teamColor }}>{player.team}</div>
                        <div style={{ fontSize: 10, color: "#6b7280", marginTop: 2 }}>
                          {player.pts} pts · {player.ast} ast · {player.reb} reb
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Stats comparatives */}
            <div style={{ marginTop: 36, background: "rgba(192,132,252,0.04)", border: "1px solid rgba(192,132,252,0.15)", borderRadius: 16, padding: 24 }}>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2, color: "#c084fc", textTransform: "uppercase", marginBottom: 16, fontFamily: "monospace" }}>📊 CLASSEMENT SAISON {new Date().getFullYear()}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[...WNBA_PLAYERS].sort((a, b) => b.score - a.score).map((p, i) => (
                  <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 14px", borderRadius: 10, background: i === 0 ? "rgba(255,215,0,0.06)" : "rgba(255,255,255,0.02)", border: `1px solid ${i === 0 ? "rgba(255,215,0,0.2)" : "rgba(255,255,255,0.05)"}`, cursor: "pointer" }} onClick={() => setSelectedCard(p)}>
                    <span style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 22, color: i === 0 ? "#ffd700" : "#6b7280", width: 22, textAlign: "center" }}>#{i + 1}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{p.name} <span style={{ fontSize: 10, color: "#c084fc", background: "rgba(192,132,252,0.1)", padding: "1px 6px", borderRadius: 4, marginLeft: 4 }}>{p.trait}</span></div>
                      <div style={{ fontSize: 11, color: p.teamColor }}>{p.team} · {p.pos}</div>
                    </div>
                    <div style={{ display: "flex", gap: 20, fontSize: 12 }}>
                      <div style={{ textAlign: "center" }}><div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 18, color: "#ff5c00" }}>{p.pts}</div><div style={{ fontSize: 9, color: "#6b7280" }}>PTS</div></div>
                      <div style={{ textAlign: "center" }}><div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 18, color: "#22d37a" }}>{p.reb}</div><div style={{ fontSize: 9, color: "#6b7280" }}>REB</div></div>
                      <div style={{ textAlign: "center" }}><div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 18, color: "#4fa3ff" }}>{p.ast}</div><div style={{ fontSize: 9, color: "#6b7280" }}>AST</div></div>
                    </div>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: `${RARITY[p.rarity].color}20`, border: `2px solid ${RARITY[p.rarity].color}60`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Bebas Neue',cursive", fontSize: 16, color: RARITY[p.rarity].color }}>{p.score}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* WNBA Legends OR */}
            <div style={{ marginTop: 28, background: "linear-gradient(160deg,rgba(255,215,0,0.06),rgba(192,132,252,0.06))", border: "1px solid rgba(255,215,0,0.25)", borderRadius: 16, padding: 24, animation: "wnbaGlow 3s ease-in-out infinite" }}>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2, color: "#ffd700", textTransform: "uppercase", marginBottom: 6, fontFamily: "monospace" }}>✦ LÉGENDES OR WNBA</div>
              <p style={{ fontSize: 12, color: "#888", marginBottom: 18, marginTop: 0 }}>Ces cartes ultra-rares peuvent tomber dans un Pack Légende · 8% de chance dans le Pack WNBA</p>
              <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                {WNBA_LEGEND_CARDS.map((card, i) => (
                  <div key={card.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                    <div style={{ animation: `float ${3 + i * 0.8}s ease-in-out infinite` }}>
                      <HoloCard card={card} size="normal" onClick={() => openCard(card)} locked={isLocked(card)} />
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: "#ffd700" }}>{card.name}</div>
                      <div style={{ fontSize: 10, color: "#888" }}>{card.era} · {card.titles} titres 🏆</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* COLLECTION */}
        {view === "collection" && (
          <div>
            <h1 style={{ fontFamily: "'Permanent Marker',cursive", fontSize: 40, letterSpacing: 2, marginBottom: 20 }}>MA <span style={{ color: "#ff5c00" }}>COLLECTION</span></h1>
            <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
              {[["all","Toutes"],["gold","✦ OR"],["legendary","🔥 Légendaires"],["epic","💜 Épiques"],["rare","💙 Rares"],["common","⬜ Communes"],["wnba","🌸 WNBA"]].map(([id,label]) => (
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
                    <HoloCard card={card} size="normal" onClick={() => openCard(card)} locked={isLocked(card)} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PACKS */}
        {view === "packs" && (
          <div>
            <h1 style={{ fontFamily: "'Permanent Marker',cursive", fontSize: 40, letterSpacing: 2, marginBottom: 8 }}>OUVRIR DES <span style={{ color: "#ff5c00" }}>PACKS</span></h1>
            <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 32 }}>Obtiens les stars NBA · les joueuses WNBA · et les légendes OR 🏆</p>
            <div className="cards-packs-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 20, marginBottom: 36 }}>
              {PACKS.map(pack => (
                <div key={pack.id} className="pack-h" onClick={() => !statsLoading && openPackSafe(pack)} style={{ background: pack.id === "legend" ? "linear-gradient(160deg,#1a1000,#3d2800)" : `linear-gradient(160deg,rgba(0,0,0,0.9),${pack.color}20)`, border: `2px solid ${pack.color}${pack.id === "legend" ? "cc" : "50"}`, borderRadius: 20, padding: 28, textAlign: "center", cursor: statsLoading ? "default" : "pointer", opacity: statsLoading ? 0.5 : 1, transition: "all .3s", animation: pack.id === "legend" ? "gp 3s ease-in-out infinite" : "none" }}>
                  {pack.id === "legend" && <div style={{ fontSize: 11, color: "#ffd700", fontWeight: 800, letterSpacing: 2, marginBottom: 8 }}>✦ ÉDITION LIMITÉE ✦</div>}
                  <div style={{ fontSize: 70, marginBottom: 14, animation: "float 3s ease-in-out infinite" }}>{pack.emoji}</div>
                  <div style={{ fontFamily: "'Permanent Marker',cursive", fontSize: 26, color: pack.color, letterSpacing: 1, marginBottom: 6 }}>{pack.name}</div>
                  <div style={{ fontSize: 12, color: "#888", marginBottom: 16, lineHeight: 1.6 }}>{pack.desc}</div>
                  <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 44, color: pack.color, marginBottom: 16 }}>{pack.price}</div>
                  <button disabled={statsLoading} style={{ width: "100%", padding: "12px", borderRadius: 10, border: "none", cursor: statsLoading ? "default" : "pointer", background: pack.id === "legend" ? "linear-gradient(135deg,#ffd700,#ff8c00)" : `linear-gradient(135deg,${pack.color},${pack.color}99)`, color: pack.id === "legend" ? "#1a0800" : "#fff", fontWeight: 900, fontSize: 14, fontFamily: "inherit" }}>{statsLoading ? "⏳ Chargement…" : pack.id === "legend" && !legendaryUnlocked ? "🔒 Pro / Elite" : "Ouvrir →"}</button>
                </div>
              ))}
            </div>

            {/* Section exclusive — réservée au plan Elite */}
            {isElite && (
              <div style={{ background: "linear-gradient(135deg,rgba(255,215,0,0.08),rgba(0,0,0,0.4))", border: "1px solid rgba(255,215,0,0.35)", borderRadius: 16, padding: 24, marginBottom: 24, animation: "gp 3s ease-in-out infinite" }}>
                <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 3, color: "#ffd700", fontFamily: "monospace", marginBottom: 6 }}>👑 EXCLUSIF ELITE · BLACK EDITION</div>
                <p style={{ fontSize: 12, color: "#888", marginBottom: 18, marginTop: 0 }}>Variantes ultra-rares réservées aux membres Elite.</p>
                <div className="holo-legend-row" style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
                  {ELITE_EXCLUSIVE_CARDS.map(card => (
                    <HoloCard key={card.id} card={card} size="normal" onClick={() => openCard(card)} />
                  ))}
                </div>
              </div>
            )}

            <div style={{ background: "rgba(255,215,0,0.05)", border: "1px solid rgba(255,215,0,0.2)", borderRadius: 16, padding: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2, color: "#ffd700", textTransform: "uppercase", marginBottom: 6, fontFamily: "monospace" }}>✦ Légendes disponibles</div>
              <p style={{ fontSize: 12, color: "#888", marginBottom: 14, marginTop: 0 }}>NBA · Les Grands du jeu</p>
              <div className="holo-legend-row" style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
                {LEGEND_CARDS.map(card => (
                  <HoloCard key={card.id} card={card} size="small" onClick={() => openCard(card)} locked={isLocked(card)} />
                ))}
              </div>
              <div style={{ borderTop: "1px solid rgba(192,132,252,0.2)", paddingTop: 16 }}>
                <p style={{ fontSize: 12, color: "#c084fc", marginBottom: 14, marginTop: 0, fontWeight: 700 }}>🌸 WNBA · Les pionnières</p>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  {WNBA_LEGEND_CARDS.map(card => (
                    <HoloCard key={card.id} card={card} size="small" onClick={() => openCard(card)} locked={isLocked(card)} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
