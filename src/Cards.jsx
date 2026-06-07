import { useState, useEffect, useRef } from "react";

const RARITY = {
  gold: { label: "OR LÉGENDAIRE", color: "#ffd700", glow: "rgba(255,215,0,0.9)", bg: "linear-gradient(160deg, #1a1000 0%, #3d2800 30%, #2a1a00 60%, #1a1000 100%)", border: "#ffd700", stars: 5, shine: "rgba(255,220,0,0.4)", chance: "0.5%" },
  legendary: { label: "Légendaire", color: "#ff5c00", glow: "rgba(255,92,0,0.8)", bg: "linear-gradient(160deg, #1a0500 0%, #3d1000 40%, #1a0500 100%)", border: "#ff5c00", stars: 5, shine: "rgba(255,150,0,0.3)", chance: "3%" },
  epic: { label: "Épique", color: "#c084fc", glow: "rgba(192,132,252,0.7)", bg: "linear-gradient(160deg, #0d0020 0%, #2d0060 40%, #0d0020 100%)", border: "#c084fc", stars: 4, shine: "rgba(200,100,255,0.2)", chance: "12%" },
  rare: { label: "Rare", color: "#60a5fa", glow: "rgba(96,165,250,0.6)", bg: "linear-gradient(160deg, #000d20 0%, #002050 40%, #000d20 100%)", border: "#60a5fa", stars: 3, shine: "rgba(60,120,255,0.2)", chance: "25%" },
  common: { label: "Commun", color: "#9ca3af", glow: "rgba(156,163,175,0.3)", bg: "linear-gradient(160deg, #0a0a0a 0%, #1c1c1c 40%, #0a0a0a 100%)", border: "#4b5563", stars: 1, shine: "rgba(150,150,150,0.1)", chance: "59.5%" },
};

// Joueurs actuels Bulls
const CURRENT_CARDS = [
  { id: 1, espnId: 2566769, name: "Zach LaVine", pos: "SG", team: "Chicago Bulls", era: "2025-26", pts: 24.8, ast: 4.2, reb: 4.5, fg: 47, score: 94, rarity: "legendary", trait: "ÉLECTRIQUE", action: "DUNK" },
  { id: 2, espnId: 4278133, name: "Coby White", pos: "PG", team: "Chicago Bulls", era: "2025-26", pts: 19.1, ast: 5.1, reb: 3.8, fg: 44, score: 88, rarity: "epic", trait: "EN FEU", action: "3-POINTS" },
  { id: 3, espnId: 3064514, name: "Nikola Vučević", pos: "C", team: "Chicago Bulls", era: "2025-26", pts: 17.6, ast: 3.2, reb: 10.9, fg: 50, score: 85, rarity: "epic", trait: "DOMINANT", action: "POST UP" },
  { id: 4, espnId: 4066648, name: "Patrick Williams", pos: "SF", team: "Chicago Bulls", era: "2025-26", pts: 13.1, ast: 2.1, reb: 4.8, fg: 48, score: 79, rarity: "rare", trait: "DÉFENSEUR", action: "BLOCK" },
  { id: 5, espnId: 4432174, name: "Ayo Dosunmu", pos: "SG", team: "Chicago Bulls", era: "2025-26", pts: 11.2, ast: 3.8, reb: 3.1, fg: 45, score: 75, rarity: "rare", trait: "RAPIDE", action: "LAYUP" },
  { id: 6, espnId: 4396993, name: "Matas Buzelis", pos: "PF", team: "Chicago Bulls", era: "2025-26", pts: 8.4, ast: 1.2, reb: 3.9, fg: 42, score: 70, rarity: "common", trait: "FUTUR", action: "SHOOT" },
];

// Légendes NBA — cartes OR ultra-rares
const LEGEND_CARDS = [
  { id: 101, espnId: 1439, name: "Michael Jordan", pos: "SG", team: "Chicago Bulls", era: "1984-1998", pts: 30.1, ast: 5.3, reb: 6.2, fg: 49.7, score: 100, rarity: "gold", trait: "LE PLUS GRAND", action: "FADEAWAY", legend: true, titles: 6, mvp: 5 },
  { id: 102, espnId: 1487, name: "Magic Johnson", pos: "PG", team: "L.A. Lakers", era: "1979-1996", pts: 19.5, ast: 11.2, reb: 7.2, fg: 52, score: 99, rarity: "gold", trait: "SHOWTIME", action: "NO-LOOK PASS", legend: true, titles: 5, mvp: 3 },
  { id: 103, espnId: 1752, name: "Larry Bird", pos: "SF", team: "Boston Celtics", era: "1979-1992", pts: 24.3, ast: 6.3, reb: 10.0, fg: 49.6, score: 98, rarity: "gold", trait: "THE HICK", action: "CLUTCH SHOT", legend: true, titles: 3, mvp: 3 },
  { id: 104, espnId: 1505, name: "Kareem Abdul-Jabbar", pos: "C", team: "L.A. Lakers", era: "1969-1989", pts: 24.6, ast: 3.6, reb: 11.2, fg: 55.9, score: 99, rarity: "gold", trait: "SKYHOOK", action: "SKY HOOK", legend: true, titles: 6, mvp: 6 },
  { id: 105, espnId: 2440, name: "Kobe Bryant", pos: "SG", team: "L.A. Lakers", era: "1996-2016", pts: 25.0, ast: 4.7, reb: 5.2, fg: 44.7, score: 98, rarity: "gold", trait: "MAMBA", action: "MAMBA SHOT", legend: true, titles: 5, mvp: 1 },
  { id: 106, espnId: 614, name: "Shaquille O'Neal", pos: "C", team: "L.A. Lakers", era: "1992-2011", pts: 23.7, ast: 2.5, reb: 10.9, fg: 58.2, score: 97, rarity: "gold", trait: "SUPERMAN", action: "MONSTER DUNK", legend: true, titles: 4, mvp: 1 },
  { id: 107, espnId: 773, name: "Tim Duncan", pos: "PF", team: "San Antonio Spurs", era: "1997-2016", pts: 19.0, ast: 3.0, reb: 10.8, fg: 50.6, score: 97, rarity: "gold", trait: "THE BIG FUNDAMENTAL", action: "BANK SHOT", legend: true, titles: 5, mvp: 2 },
  { id: 108, espnId: 1900, name: "Scottie Pippen", pos: "SF", team: "Chicago Bulls", era: "1987-2004", pts: 16.1, ast: 5.2, reb: 6.4, fg: 46.5, score: 95, rarity: "gold", trait: "ROBIN", action: "STEAL", legend: true, titles: 6, mvp: 0 },
];

const ALL_CARDS = [...CURRENT_CARDS, ...LEGEND_CARDS];

const PACKS = [
  { id: "standard", name: "Pack Standard", price: "Gratuit", cards: 3, desc: "3 cartes aléatoires · Pas de cartes OR", emoji: "📦", color: "#6b7280", goldChance: false },
  { id: "bulls", name: "Pack Bulls", price: "9€", cards: 5, desc: "5 cartes · 1 Rare garanti", emoji: "🐂", color: "#ff5c00", goldChance: false },
  { id: "elite", name: "Pack Élite", price: "29€", cards: 8, desc: "8 cartes · 1 Épique garanti · Chance OR", emoji: "👑", color: "#c084fc", goldChance: true },
  { id: "gold", name: "Pack Légendaire", price: "89€", cards: 5, desc: "5 cartes · 1 OR garanti 🏆", emoji: "✨", color: "#ffd700", goldChance: true, goldGuaranteed: true },
];

function PlayerPhoto({ espnId, name, size, isLegend }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const url = `https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/${espnId}.png&w=350&h=254`;

  return (
    <div style={{ width: size, height: size * 0.85, position: "relative", overflow: "hidden" }}>
      {!loaded && !error && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.28, fontWeight: 900, color: "rgba(255,255,255,0.2)" }}>{initials}</div>
      )}
      {error ? (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 4 }}>
          <div style={{ fontSize: size * 0.35 }}>{isLegend ? "🏆" : "🏀"}</div>
          <div style={{ fontSize: size * 0.12, fontWeight: 900, color: "rgba(255,255,255,0.5)", textAlign: "center" }}>{initials}</div>
        </div>
      ) : (
        <img src={url} alt={name}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center", opacity: loaded ? 1 : 0, transition: "opacity 0.4s ease", filter: isLegend ? "drop-shadow(0 4px 16px rgba(255,215,0,0.6))" : "drop-shadow(0 4px 12px rgba(0,0,0,0.8))" }}
        />
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

  const w = size === "small" ? 125 : size === "large" ? 310 : 200;
  const h = w * 1.45;
  const rotX = hovered ? ((mouse.y - 50) / 50) * -12 : 0;
  const rotY = hovered ? ((mouse.x - 50) / 50) * 12 : 0;
  const isGold = card.rarity === "gold";

  return (
    <div ref={ref} onClick={onClick} onMouseMove={onMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setMouse({ x: 50, y: 50 }); }}
      style={{
        width: w, height: h, borderRadius: 18, cursor: "pointer", position: "relative", flexShrink: 0,
        transform: `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg) ${hovered ? "scale(1.07)" : "scale(1)"}`,
        transition: "transform 0.12s ease",
        boxShadow: hovered
          ? `0 30px 70px ${r.glow}, 0 0 50px ${r.glow}${isGold ? ", 0 0 100px rgba(255,215,0,0.3)" : ""}`
          : `0 10px 30px rgba(0,0,0,0.7)`,
      }}>

      {/* Gold animated border */}
      {isGold && (
        <div style={{
          position: "absolute", inset: -2, borderRadius: 20, zIndex: 0,
          background: hovered
            ? `conic-gradient(from ${mouse.x * 3.6}deg, #ffd700, #ffaa00, #fff8a0, #ffd700, #ff8c00, #ffd700)`
            : "linear-gradient(135deg, #ffd700, #ffaa00, #fff8a0, #ffd700)",
          animation: !hovered ? "goldSpin 4s linear infinite" : "none",
        }} />
      )}

      <div style={{
        position: "absolute", inset: isGold ? 2 : 0, borderRadius: isGold ? 17 : 18,
        background: r.bg, border: isGold ? "none" : `2px solid ${r.border}`, overflow: "hidden", zIndex: 1,
      }}>
        {/* Holo shimmer */}
        {(isGold || card.rarity === "legendary" || card.rarity === "epic") && (
          <>
            <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at ${mouse.x}% ${mouse.y}%, ${r.shine} 0%, transparent 60%)`, pointerEvents: "none", zIndex: 2 }} />
            <div style={{ position: "absolute", inset: 0, background: isGold ? "repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,220,0,0.04) 2px, rgba(255,220,0,0.04) 4px)" : "repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(255,255,255,0.02) 3px, rgba(255,255,255,0.02) 6px)", pointerEvents: "none", zIndex: 1 }} />
          </>
        )}

        {/* Gold sparkles */}
        {isGold && hovered && [
          { top: "15%", left: "10%", delay: "0s" }, { top: "25%", right: "12%", delay: "0.3s" },
          { bottom: "30%", left: "8%", delay: "0.6s" }, { bottom: "20%", right: "10%", delay: "0.9s" },
        ].map((pos, i) => (
          <div key={i} style={{ position: "absolute", ...pos, fontSize: size === "small" ? 8 : 12, animation: "sparkle 1s ease-in-out infinite", animationDelay: pos.delay, zIndex: 3 }}>✦</div>
        ))}

        {/* Content */}
        <div style={{ padding: size === "small" ? 8 : 12, height: "100%", display: "flex", flexDirection: "column", position: "relative", zIndex: 3 }}>

          {/* Top bar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: size === "small" ? 5 : 7 }}>
            <div style={{ fontSize: size === "small" ? 7 : 9, fontWeight: 900, color: r.color, fontFamily: "monospace" }}>
              {isGold ? "✦✦✦✦✦" : "★".repeat(r.stars)}
            </div>
            <div style={{ fontSize: size === "small" ? 5 : 8, fontWeight: 800, color: r.color, background: `${r.color}20`, padding: "2px 6px", borderRadius: 4, border: `1px solid ${r.color}40`, letterSpacing: 0.8 }}>
              {card.trait}
            </div>
          </div>

          {/* Era badge for legends */}
          {card.legend && (
            <div style={{ textAlign: "center", marginBottom: size === "small" ? 3 : 5 }}>
              <span style={{ fontSize: size === "small" ? 6 : 8, background: "rgba(255,215,0,0.15)", color: "#ffd700", padding: "1px 8px", borderRadius: 4, fontWeight: 700, border: "1px solid rgba(255,215,0,0.3)" }}>
                LÉGENDE · {card.era}
              </span>
            </div>
          )}

          {/* Photo zone */}
          <div style={{
            flex: 1, borderRadius: 10, overflow: "hidden", marginBottom: size === "small" ? 5 : 7,
            background: isGold ? "linear-gradient(180deg, rgba(255,215,0,0.1) 0%, rgba(0,0,0,0.6) 100%)" : "rgba(0,0,0,0.4)",
            border: `1px solid ${r.color}30`, position: "relative",
            display: "flex", alignItems: "flex-end", justifyContent: "center",
          }}>
            <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 50% 110%, ${r.color}20 0%, transparent 60%)` }} />

            {/* Action + Score badges */}
            <div style={{ position: "absolute", top: 6, left: 6, fontSize: size === "small" ? 5 : 7, fontWeight: 900, color: "#fff", background: "rgba(0,0,0,0.75)", padding: "2px 5px", borderRadius: 3, letterSpacing: 0.8 }}>{card.action}</div>
            <div style={{ position: "absolute", top: 6, right: 6, width: size === "small" ? 22 : 30, height: size === "small" ? 22 : 30, borderRadius: "50%", background: isGold ? "linear-gradient(135deg,#ffd700,#ff8c00)" : r.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size === "small" ? 7 : 10, fontWeight: 900, color: isGold ? "#1a0800" : "#fff", fontFamily: "monospace", boxShadow: `0 0 12px ${r.glow}` }}>{card.score}</div>

            {/* Titles for legends */}
            {card.legend && card.titles > 0 && (
              <div style={{ position: "absolute", bottom: 6, left: 6, fontSize: size === "small" ? 6 : 9, color: "#ffd700", fontWeight: 800, background: "rgba(0,0,0,0.8)", padding: "2px 6px", borderRadius: 4 }}>
                🏆 × {card.titles}
              </div>
            )}

            <PlayerPhoto espnId={card.espnId} name={card.name} size={w - (size === "small" ? 16 : 24)} isLegend={card.legend} />
          </div>

          {/* Name */}
          <div style={{ textAlign: "center", marginBottom: size === "small" ? 4 : 6 }}>
            <div style={{ fontSize: size === "small" ? 8 : 12, fontWeight: 900, color: "#fff", letterSpacing: 0.3, lineHeight: 1.2, textShadow: isGold ? `0 0 20px #ffd700` : `0 0 15px ${r.color}` }}>{card.name}</div>
            <div style={{ fontSize: size === "small" ? 6 : 8, color: r.color, fontWeight: 700, marginTop: 1 }}>{card.pos} · {card.team}</div>
          </div>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: size === "small" ? 2 : 3 }}>
            {[{ l: "PTS", v: card.pts }, { l: "AST", v: card.ast }, { l: "REB", v: card.reb }].map(s => (
              <div key={s.l} style={{ background: "rgba(0,0,0,0.5)", borderRadius: 5, padding: size === "small" ? "2px 2px" : "4px 3px", textAlign: "center", border: `1px solid ${r.color}20` }}>
                <div style={{ fontSize: size === "small" ? 8 : 11, fontWeight: 900, color: r.color }}>{s.v}</div>
                <div style={{ fontSize: size === "small" ? 5 : 6, color: "#555", fontWeight: 700 }}>{s.l}</div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{ marginTop: size === "small" ? 3 : 5, textAlign: "center" }}>
            <div style={{ fontSize: size === "small" ? 5 : 7, color: isGold ? "#ffd70066" : "#333", fontFamily: "monospace" }}>
              {isGold ? "✦ HOOP IQ GOLD EDITION ✦" : `HOOPIQ · ${card.era} · #${String(card.id).padStart(3, "0")}`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PackOpening({ pack, onClose, onCardsRevealed }) {
  const [phase, setPhase] = useState("shake");
  const [cards, setCards] = useState([]);

  const generateCards = () => {
    let pool = [...CURRENT_CARDS];
    const result = [];

    if (pack.goldGuaranteed) {
      const goldCard = LEGEND_CARDS[Math.floor(Math.random() * LEGEND_CARDS.length)];
      result.push(goldCard);
      const rest = [...CURRENT_CARDS].sort(() => Math.random() - 0.5).slice(0, pack.cards - 1);
      return [...result, ...rest];
    }

    if (pack.id === "elite") {
      const epicCards = CURRENT_CARDS.filter(c => c.rarity === "epic" || c.rarity === "legendary");
      result.push(epicCards[Math.floor(Math.random() * epicCards.length)]);
      if (Math.random() < 0.15) {
        result.push(LEGEND_CARDS[Math.floor(Math.random() * LEGEND_CARDS.length)]);
      }
    }
    if (pack.id === "bulls") {
      const rareCards = CURRENT_CARDS.filter(c => c.rarity === "rare" || c.rarity === "epic" || c.rarity === "legendary");
      result.push(rareCards[Math.floor(Math.random() * rareCards.length)]);
    }

    const remaining = [...CURRENT_CARDS].sort(() => Math.random() - 0.5);
    while (result.length < pack.cards) {
      const card = remaining[result.length % remaining.length];
      if (!result.find(r => r.id === card.id)) result.push(card);
      else result.push(remaining[(result.length + 1) % remaining.length]);
    }
    return result.slice(0, pack.cards);
  };

  useEffect(() => {
    const c = generateCards();
    const t1 = setTimeout(() => setPhase("open"), 1200);
    const t2 = setTimeout(() => { setPhase("reveal"); setCards(c); }, 2400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const hasGold = cards.some(c => c.rarity === "gold");

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: hasGold && phase === "reveal" ? "radial-gradient(ellipse at center, #1a1000 0%, #000000 70%)" : "rgba(0,0,0,0.97)", backdropFilter: "blur(20px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif", transition: "background 1s" }}>
      <style>{`
        @keyframes shakeAnim { 0%,100%{transform:rotate(0) scale(1)} 25%{transform:rotate(-12deg) scale(1.08)} 75%{transform:rotate(12deg) scale(1.08)} }
        @keyframes explode { 0%{transform:scale(1);opacity:1} 60%{transform:scale(2);opacity:0.3} 100%{transform:scale(0);opacity:0} }
        @keyframes cardIn { from{opacity:0;transform:translateY(60px) scale(0.7) rotateY(180deg)} to{opacity:1;transform:translateY(0) scale(1) rotateY(0deg)} }
        @keyframes goldRain { 0%{transform:translateY(-20px) rotate(0deg);opacity:1} 100%{transform:translateY(100vh) rotate(720deg);opacity:0} }
        @keyframes goldPulse { 0%,100%{text-shadow:0 0 20px #ffd700} 50%{text-shadow:0 0 60px #ffd700, 0 0 100px #ffaa00} }
        @keyframes sparkle { 0%,100%{opacity:0;transform:scale(0)} 50%{opacity:1;transform:scale(1)} }
        @keyframes goldSpin { to { filter: hue-rotate(30deg); } }
      `}</style>

      {/* Gold rain effect */}
      {hasGold && phase === "reveal" && [...Array(20)].map((_, i) => (
        <div key={i} style={{
          position: "fixed", top: -20, left: `${Math.random() * 100}%`,
          fontSize: Math.random() * 16 + 8, animation: `goldRain ${Math.random() * 3 + 2}s linear ${Math.random() * 2}s infinite`,
          pointerEvents: "none", zIndex: 999,
        }}>✦</div>
      ))}

      {phase === "shake" && (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 120, animation: "shakeAnim 0.25s infinite", marginBottom: 30 }}>{pack.emoji}</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: "#fff", letterSpacing: 3 }}>OUVERTURE...</div>
          <div style={{ fontSize: 14, color: "#888", marginTop: 10 }}>{pack.name}</div>
        </div>
      )}

      {phase === "open" && (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 120, animation: "explode 1.2s forwards" }}>{pack.emoji}</div>
          <div style={{ fontSize: 36, fontWeight: 900, color: pack.color, marginTop: 20, letterSpacing: 3 }}>✨ RÉVÉLATION !</div>
        </div>
      )}

      {phase === "reveal" && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
          {hasGold && (
            <div style={{ fontSize: 28, fontWeight: 900, color: "#ffd700", letterSpacing: 3, animation: "goldPulse 1.5s ease-in-out infinite" }}>
              ✦ CARTE OR LÉGENDAIRE ✦
            </div>
          )}
          {!hasGold && <div style={{ fontSize: 20, fontWeight: 900, color: "#fff", letterSpacing: 2 }}>✨ TES CARTES !</div>}

          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center", maxWidth: "92vw" }}>
            {cards.map((card, i) => (
              <div key={card.id} style={{ animation: `cardIn 0.7s cubic-bezier(.34,1.56,.64,1) ${i * 0.14}s both` }}>
                <HoloCard card={card} size={cards.length > 6 ? "small" : "normal"} />
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={() => { onCardsRevealed(cards); onClose(); }} style={{
              padding: "14px 36px", borderRadius: 12, border: "none", cursor: "pointer",
              background: hasGold ? "linear-gradient(135deg,#ffd700,#ff8c00)" : "linear-gradient(135deg,#ff5c00,#ff8c42)",
              color: hasGold ? "#1a0800" : "#fff", fontWeight: 900, fontSize: 16, fontFamily: "inherit",
              boxShadow: hasGold ? "0 8px 40px rgba(255,215,0,0.6)" : "0 8px 30px rgba(255,92,0,0.5)",
            }}>Ajouter à ma collection →</button>
            <button onClick={onClose} style={{ padding: "14px 24px", borderRadius: 12, border: "1px solid #333", background: "transparent", color: "#666", cursor: "pointer", fontFamily: "inherit" }}>Fermer</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Cards() {
  const [view, setView] = useState("collection");
  const [collection, setCollection] = useState([CURRENT_CARDS[0], CURRENT_CARDS[2]]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [openingPack, setOpeningPack] = useState(null);
  const [filter, setFilter] = useState("all");
  const [notif, setNotif] = useState(null);

  const showNotif = (msg) => { setNotif(msg); setTimeout(() => setNotif(null), 4000); };

  const handleCardsRevealed = (cards) => {
    const newCards = cards.filter(c => !collection.find(col => col.id === c.id));
    setCollection(p => [...p, ...newCards]);
    const gold = newCards.find(c => c.rarity === "gold");
    if (gold) showNotif(`✦ LÉGENDAIRE OR ! ${gold.name} ajouté ! ✦`);
    else if (newCards.length) showNotif(`🎴 +${newCards.length} nouvelles cartes !`);
  };

  const filtered = filter === "all" ? collection
    : filter === "legend" ? collection.filter(c => c.rarity === "gold")
    : collection.filter(c => c.rarity === filter);

  const goldCount = collection.filter(c => c.rarity === "gold").length;

  return (
    <div style={{ minHeight: "100vh", background: "#06060f", color: "#f0f0ff", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;600;700;900&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: #ff5c00; border-radius: 4px; }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes goldSpin { to{filter:hue-rotate(30deg)} }
        @keyframes sparkle { 0%,100%{opacity:0;transform:scale(0) rotate(0deg)} 50%{opacity:1;transform:scale(1) rotate(180deg)} }
        @keyframes notifIn { from{opacity:0;transform:translateX(100px)} to{opacity:1;transform:translateX(0)} }
        @keyframes goldPulse { 0%,100%{box-shadow:0 0 20px rgba(255,215,0,0.3)} 50%{box-shadow:0 0 50px rgba(255,215,0,0.7)} }
        .pack-hover:hover { transform:translateY(-10px) scale(1.03) !important; }
      `}</style>

      {notif && (
        <div style={{ position: "fixed", top: 80, right: 24, zIndex: 500, background: notif.includes("OR") ? "linear-gradient(135deg,#ffd700,#ff8c00)" : "linear-gradient(135deg,#ff5c00,#ff8c42)", color: notif.includes("OR") ? "#1a0800" : "#fff", padding: "14px 24px", borderRadius: 14, fontWeight: 900, fontSize: 15, animation: "notifIn .4s ease", boxShadow: notif.includes("OR") ? "0 8px 40px rgba(255,215,0,0.6)" : "0 8px 40px rgba(255,92,0,0.5)" }}>{notif}</div>
      )}

      {openingPack && <PackOpening pack={openingPack} onClose={() => setOpeningPack(null)} onCardsRevealed={handleCardsRevealed} />}

      {selectedCard && (
        <div onClick={() => setSelectedCard(null)} style={{ position: "fixed", inset: 0, zIndex: 500, background: selectedCard.rarity === "gold" ? "radial-gradient(ellipse at center, #1a1000, #000)" : "rgba(0,0,0,0.92)", backdropFilter: "blur(16px)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 28 }}>
          <div onClick={e => e.stopPropagation()}>
            <HoloCard card={selectedCard} size="large" />
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 36, color: RARITY[selectedCard.rarity].color, letterSpacing: 2, textShadow: selectedCard.rarity === "gold" ? "0 0 30px #ffd700" : "none" }}>{selectedCard.name}</div>
            {selectedCard.legend && <div style={{ fontSize: 13, color: "#ffd700", marginBottom: 4 }}>🏆 {selectedCard.titles} titres NBA · {selectedCard.mvp} MVP</div>}
            <div style={{ fontSize: 13, color: "#666", marginBottom: 20 }}>{RARITY[selectedCard.rarity].label} · Score {selectedCard.score}/100</div>
            <div style={{ display: "flex", gap: 20, justifyContent: "center" }}>
              {[{ l: "Points", v: selectedCard.pts }, { l: "Passes", v: selectedCard.ast }, { l: "Rebonds", v: selectedCard.reb }, { l: "% Tir", v: `${selectedCard.fg}%` }].map(s => (
                <div key={s.l} style={{ textAlign: "center" }}>
                  <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 28, color: RARITY[selectedCard.rarity].color }}>{s.v}</div>
                  <div style={{ fontSize: 11, color: "#555" }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>
          <button onClick={() => setSelectedCard(null)} style={{ padding: "10px 28px", borderRadius: 10, border: "1px solid #333", background: "transparent", color: "#666", cursor: "pointer" }}>Fermer</button>
        </div>
      )}

      {/* Header */}
      <div style={{ background: "rgba(6,6,15,0.95)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "0 28px", height: 62, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 22, background: "linear-gradient(135deg,#ff5c00,#ff8c42)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: 3 }}>HOOP IQ · CARTES</div>
        <div style={{ display: "flex", gap: 4 }}>
          {[["collection", "🎴 Collection"], ["packs", "📦 Packs"]].map(([id, label]) => (
            <button key={id} onClick={() => setView(id)} style={{ padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer", background: view === id ? "rgba(255,92,0,0.15)" : "transparent", color: view === id ? "#ff5c00" : "#6b7280", fontWeight: 700, fontSize: 13, borderBottom: view === id ? "2px solid #ff5c00" : "2px solid transparent", transition: "all .2s", fontFamily: "inherit" }}>{label}</button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 16, fontSize: 13 }}>
          {goldCount > 0 && <span style={{ color: "#ffd700", fontWeight: 700 }}>✦ {goldCount} OR</span>}
          <span style={{ color: "#6b7280" }}>🃏 {collection.length} cartes</span>
        </div>
      </div>

      <div style={{ maxWidth: 1140, margin: "0 auto", padding: "28px 24px" }}>

        {/* COLLECTION */}
        {view === "collection" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, marginBottom: 28 }}>
              {[
                { l: "Total", v: collection.length, c: "#f0f0ff" },
                { l: "✦ OR", v: goldCount, c: "#ffd700" },
                { l: "Légendaires", v: collection.filter(c => c.rarity === "legendary").length, c: "#ff5c00" },
                { l: "Épiques", v: collection.filter(c => c.rarity === "epic").length, c: "#c084fc" },
                { l: "Rares", v: collection.filter(c => c.rarity === "rare").length, c: "#60a5fa" },
              ].map(s => (
                <div key={s.l} style={{ background: s.c === "#ffd700" ? "rgba(255,215,0,0.06)" : "rgba(255,255,255,0.04)", border: `1px solid ${s.c === "#ffd700" ? "rgba(255,215,0,0.3)" : "rgba(255,255,255,0.07)"}`, borderRadius: 14, padding: 16, textAlign: "center", animation: s.c === "#ffd700" && goldCount > 0 ? "goldPulse 2s ease-in-out infinite" : "none" }}>
                  <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 34, color: s.c }}>{s.v}</div>
                  <div style={{ fontSize: 11, color: "#6b7280" }}>{s.l}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
              {[["all","Toutes"],["gold","✦ OR"],["legendary","🔥 Légendaires"],["epic","💜 Épiques"],["rare","💙 Rares"],["common","⬜ Communes"]].map(([id,label]) => (
                <button key={id} onClick={() => setFilter(id)} style={{ padding: "6px 16px", borderRadius: 20, border: `1px solid ${filter === id ? (id === "gold" ? "#ffd700" : "#ff5c00") : "rgba(255,255,255,0.1)"}`, background: filter === id ? (id === "gold" ? "rgba(255,215,0,0.12)" : "rgba(255,92,0,0.12)") : "transparent", color: filter === id ? (id === "gold" ? "#ffd700" : "#ff5c00") : "#6b7280", fontSize: 12, cursor: "pointer", fontWeight: filter === id ? 700 : 500, fontFamily: "inherit" }}>{label}</button>
              ))}
            </div>

            {filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: 60, color: "#6b7280" }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>📦</div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{filter === "gold" ? "Pas encore de cartes OR !" : "Pas de cartes ici"}</div>
                {filter === "gold" && <div style={{ fontSize: 14, color: "#ffd700", marginTop: 8 }}>Ouvre un Pack Légendaire pour obtenir Jordan, Kobe, Magic...</div>}
                <button onClick={() => setView("packs")} style={{ marginTop: 20, padding: "12px 28px", borderRadius: 10, border: "none", background: filter === "gold" ? "linear-gradient(135deg,#ffd700,#ff8c00)" : "linear-gradient(135deg,#ff5c00,#ff8c42)", color: filter === "gold" ? "#1a0800" : "#fff", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                  Voir les packs →
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>
                {filtered.map((card, i) => (
                  <div key={card.id} style={{ animation: `float ${3 + i * 0.4}s ease-in-out infinite` }}>
                    <HoloCard card={card} size="normal" onClick={() => setSelectedCard(card)} />
                  </div>
                ))}
              </div>
            )}

            {/* Legends preview */}
            <div style={{ marginTop: 40, padding: 28, background: "linear-gradient(135deg, rgba(255,215,0,0.04), rgba(0,0,0,0.8))", borderRadius: 20, border: "1px solid rgba(255,215,0,0.2)" }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2, color: "#ffd700", textTransform: "uppercase", marginBottom: 8, fontFamily: "monospace" }}>✦ Cartes Légendes — Édition Or</div>
              <div style={{ fontSize: 13, color: "#888", marginBottom: 20 }}>Jordan · Magic · Bird · Kobe · Kareem · Shaq · Duncan · Pippen — Uniquement dans les Packs Légendaires</div>
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                {LEGEND_CARDS.map(card => {
                  const owned = collection.find(c => c.id === card.id);
                  return (
                    <div key={card.id} style={{ opacity: owned ? 1 : 0.2, filter: owned ? "none" : "grayscale(1) blur(2px)", transition: "all .3s" }}>
                      <HoloCard card={card} size="small" onClick={() => owned && setSelectedCard(card)} />
                    </div>
                  );
                })}
              </div>
              {!collection.some(c => c.rarity === "gold") && (
                <button onClick={() => setView("packs")} style={{ marginTop: 20, padding: "12px 28px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#ffd700,#ff8c00)", color: "#1a0800", fontWeight: 900, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 8px 30px rgba(255,215,0,0.4)" }}>
                  ✦ Obtenir des légendes →
                </button>
              )}
            </div>
          </div>
        )}

        {/* PACKS */}
        {view === "packs" && (
          <div>
            <h1 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 46, letterSpacing: 2, marginBottom: 8 }}>OUVRIR DES <span style={{ color: "#ff5c00" }}>PACKS</span></h1>
            <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 36 }}>Les cartes OR contiennent les plus grandes légendes NBA. Jordan, Kobe, Magic... à toi de jouer ! 🏆</p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 20, marginBottom: 40 }}>
              {PACKS.map(pack => (
                <div key={pack.id} className="pack-hover" onClick={() => setOpeningPack(pack)} style={{
                  background: pack.id === "gold" ? "linear-gradient(160deg,#1a1000,#3d2800,#1a1000)" : `linear-gradient(160deg, rgba(0,0,0,0.9), ${pack.color}20)`,
                  border: `2px solid ${pack.color}${pack.id === "gold" ? "dd" : "50"}`,
                  borderRadius: 22, padding: 36, textAlign: "center", cursor: "pointer", transition: "all .3s",
                  boxShadow: pack.id === "gold" ? "0 0 40px rgba(255,215,0,0.2)" : "none",
                  animation: pack.id === "gold" ? "goldPulse 3s ease-in-out infinite" : "none",
                }}>
                  {pack.id === "gold" && <div style={{ fontSize: 12, fontWeight: 800, color: "#ffd700", letterSpacing: 2, marginBottom: 10, textTransform: "uppercase" }}>✦ Édition Limitée ✦</div>}
                  <div style={{ fontSize: 80, marginBottom: 16, animation: "float 3s ease-in-out infinite" }}>{pack.emoji}</div>
                  <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 28, color: pack.color, letterSpacing: 1, marginBottom: 8 }}>{pack.name}</div>
                  <div style={{ fontSize: 13, color: "#888", marginBottom: 20, lineHeight: 1.7 }}>{pack.desc}</div>
                  <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 44, color: pack.color, marginBottom: 20 }}>{pack.price}</div>
                  <button style={{ width: "100%", padding: "14px", borderRadius: 12, border: "none", cursor: "pointer", background: pack.id === "gold" ? "linear-gradient(135deg,#ffd700,#ff8c00)" : `linear-gradient(135deg, ${pack.color}, ${pack.color}99)`, color: pack.id === "gold" ? "#1a0800" : "#fff", fontWeight: 900, fontSize: 16, fontFamily: "inherit", boxShadow: `0 8px 30px ${pack.color}40` }}>
                    Ouvrir →
                  </button>
                </div>
              ))}
            </div>

            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 18, padding: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2, color: "#ff5c00", textTransform: "uppercase", marginBottom: 20, fontFamily: "monospace" }}>📊 Probabilités</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 14 }}>
                {Object.entries(RARITY).map(([key, r]) => (
                  <div key={key} style={{ textAlign: "center", padding: 16, background: `${r.color}10`, borderRadius: 12, border: `1px solid ${r.color}30` }}>
                    <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 28, color: r.color }}>{r.chance}</div>
                    <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>{r.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 16, padding: "12px 16px", background: "rgba(255,215,0,0.06)", borderRadius: 10, border: "1px solid rgba(255,215,0,0.2)", fontSize: 13, color: "#ffd700" }}>
                ✦ Les cartes OR (Jordan, Kobe, Magic...) sont disponibles uniquement dans les Packs Élite et Légendaire
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
