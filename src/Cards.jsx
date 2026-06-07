import { useState, useEffect, useRef } from "react";

const RARITY = {
  legendary: { label: "Légendaire", color: "#ff5c00", glow: "rgba(255,92,0,0.8)", bg: "linear-gradient(160deg, #1a0500 0%, #3d1000 40%, #1a0500 100%)", border: "#ff5c00", stars: 5, shine: "rgba(255,150,0,0.3)" },
  epic: { label: "Épique", color: "#c084fc", glow: "rgba(192,132,252,0.7)", bg: "linear-gradient(160deg, #0d0020 0%, #2d0060 40%, #0d0020 100%)", border: "#c084fc", stars: 4, shine: "rgba(200,100,255,0.2)" },
  rare: { label: "Rare", color: "#60a5fa", glow: "rgba(96,165,250,0.6)", bg: "linear-gradient(160deg, #000d20 0%, #002050 40%, #000d20 100%)", border: "#60a5fa", stars: 3, shine: "rgba(60,120,255,0.2)" },
  common: { label: "Commun", color: "#9ca3af", glow: "rgba(156,163,175,0.3)", bg: "linear-gradient(160deg, #0a0a0a 0%, #1c1c1c 40%, #0a0a0a 100%)", border: "#4b5563", stars: 1, shine: "rgba(150,150,150,0.1)" },
};

// Vraies photos NBA via ESPN CDN
const PLAYER_PHOTOS = {
  2566769: "https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/2566769.png&w=350&h=254",
  4278133: "https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/4278133.png&w=350&h=254",
  3064514: "https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/3064514.png&w=350&h=254",
  4066648: "https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/4066648.png&w=350&h=254",
  4432174: "https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/4432174.png&w=350&h=254",
  4396993: "https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/4396993.png&w=350&h=254",
};

const CARDS = [
  { id: 1, espnId: 2566769, name: "Zach LaVine", pos: "SG", team: "Chicago Bulls", pts: 24.8, ast: 4.2, reb: 4.5, fg: 47, blk: 0.4, stl: 0.9, score: 94, rarity: "legendary", trait: "ÉLECTRIQUE", action: "DUNK" },
  { id: 2, espnId: 4278133, name: "Coby White", pos: "PG", team: "Chicago Bulls", pts: 19.1, ast: 5.1, reb: 3.8, fg: 44, blk: 0.2, stl: 1.0, score: 88, rarity: "epic", trait: "EN FEU", action: "3-POINTS" },
  { id: 3, espnId: 3064514, name: "Nikola Vučević", pos: "C", team: "Chicago Bulls", pts: 17.6, ast: 3.2, reb: 10.9, fg: 50, blk: 0.9, stl: 0.8, score: 85, rarity: "epic", trait: "DOMINANT", action: "POST UP" },
  { id: 4, espnId: 4066648, name: "Patrick Williams", pos: "SF", team: "Chicago Bulls", pts: 13.1, ast: 2.1, reb: 4.8, fg: 48, blk: 0.7, stl: 1.1, score: 79, rarity: "rare", trait: "DÉFENSEUR", action: "BLOCK" },
  { id: 5, espnId: 4432174, name: "Ayo Dosunmu", pos: "SG", team: "Chicago Bulls", pts: 11.2, ast: 3.8, reb: 3.1, fg: 45, blk: 0.3, stl: 1.3, score: 75, rarity: "rare", trait: "RAPIDE", action: "LAYUP" },
  { id: 6, espnId: 4396993, name: "Matas Buzelis", pos: "PF", team: "Chicago Bulls", pts: 8.4, ast: 1.2, reb: 3.9, fg: 42, blk: 0.8, stl: 0.7, score: 70, rarity: "common", trait: "FUTUR", action: "SHOOT" },
];

const PACKS = [
  { id: "standard", name: "Pack Standard", price: "Gratuit", cards: 3, desc: "3 cartes aléatoires", emoji: "📦", color: "#6b7280" },
  { id: "bulls", name: "Pack Bulls", price: "9€", cards: 5, desc: "5 cartes + 1 Rare garanti", emoji: "🐂", color: "#ff5c00" },
  { id: "elite", name: "Pack Elite", price: "29€", cards: 8, desc: "8 cartes + 1 Épique garanti", emoji: "👑", color: "#c084fc" },
];

function PlayerPhoto({ espnId, name, size }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  if (error) {
    return (
      <div style={{
        width: size, height: size * 0.85,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: size * 0.3, fontWeight: 900, color: "#fff",
        background: "rgba(0,0,0,0.3)",
      }}>{initials}</div>
    );
  }

  return (
    <div style={{ width: size, height: size * 0.85, position: "relative", overflow: "hidden" }}>
      {!loaded && (
        <div style={{
          position: "absolute", inset: 0, display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: size * 0.3, fontWeight: 900, color: "rgba(255,255,255,0.3)",
        }}>{initials}</div>
      )}
      <img
        src={PLAYER_PHOTOS[espnId] || `https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/${espnId}.png&w=350&h=254`}
        alt={name}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        style={{
          width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center",
          opacity: loaded ? 1 : 0, transition: "opacity 0.3s ease",
          filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.8))",
        }}
      />
    </div>
  );
}

function HoloCard({ card, size = "normal", onClick }) {
  const r = RARITY[card.rarity];
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  const w = size === "small" ? 130 : size === "large" ? 300 : 195;
  const h = w * 1.45;
  const rotX = isHovered ? ((mousePos.y - 50) / 50) * -12 : 0;
  const rotY = isHovered ? ((mousePos.x - 50) / 50) * 12 : 0;

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setMousePos({ x: 50, y: 50 }); }}
      style={{
        width: w, height: h, borderRadius: 18, cursor: "pointer",
        position: "relative", flexShrink: 0,
        transform: `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg) ${isHovered ? "scale(1.06)" : "scale(1)"}`,
        transition: "transform 0.12s ease",
        boxShadow: isHovered
          ? `0 25px 60px ${r.glow}, 0 0 40px ${r.glow}, inset 0 0 30px rgba(255,255,255,0.05)`
          : `0 10px 30px rgba(0,0,0,0.6)`,
      }}
    >
      {/* Card shell */}
      <div style={{
        position: "absolute", inset: 0, borderRadius: 18,
        background: r.bg,
        border: `2px solid ${r.border}`,
        overflow: "hidden",
      }}>
        {/* Holographic shimmer layer */}
        {(card.rarity === "legendary" || card.rarity === "epic") && (
          <>
            <div style={{
              position: "absolute", inset: 0,
              background: `radial-gradient(ellipse at ${mousePos.x}% ${mousePos.y}%, ${r.shine} 0%, transparent 65%)`,
              pointerEvents: "none", zIndex: 2,
            }} />
            <div style={{
              position: "absolute", inset: 0,
              background: "repeating-linear-gradient(45deg, transparent 0px, transparent 3px, rgba(255,255,255,0.02) 3px, rgba(255,255,255,0.02) 6px)",
              pointerEvents: "none", zIndex: 1,
            }} />
          </>
        )}

        {/* Rainbow border glow on hover */}
        {isHovered && card.rarity === "legendary" && (
          <div style={{
            position: "absolute", inset: -2, borderRadius: 18,
            background: `conic-gradient(from ${mousePos.x * 3.6}deg, #ff5c00, #ff9500, #ffcc00, #ff5c00)`,
            zIndex: 0, opacity: 0.6,
          }} />
        )}

        {/* Content */}
        <div style={{ padding: size === "small" ? 8 : 12, height: "100%", display: "flex", flexDirection: "column", position: "relative", zIndex: 3 }}>

          {/* Top bar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: size === "small" ? 6 : 8 }}>
            <div style={{
              fontSize: size === "small" ? 7 : 9, fontWeight: 900,
              color: r.color, letterSpacing: 1.5, fontFamily: "monospace",
            }}>{"★".repeat(r.stars)}</div>
            <div style={{
              fontSize: size === "small" ? 6 : 8, fontWeight: 800,
              color: r.color, background: `${r.color}20`,
              padding: "2px 7px", borderRadius: 4, letterSpacing: 1,
              border: `1px solid ${r.color}40`,
            }}>{card.trait}</div>
          </div>

          {/* Player photo zone */}
          <div style={{
            flex: 1, position: "relative", overflow: "hidden",
            borderRadius: 10, marginBottom: size === "small" ? 6 : 8,
            background: "rgba(0,0,0,0.4)",
            border: `1px solid ${r.color}30`,
            display: "flex", alignItems: "flex-end", justifyContent: "center",
          }}>
            {/* Background court texture */}
            <div style={{
              position: "absolute", inset: 0,
              background: `radial-gradient(ellipse at 50% 100%, ${r.color}15 0%, transparent 60%)`,
            }} />

            {/* Action label */}
            <div style={{
              position: "absolute", top: 6, left: 6,
              fontSize: size === "small" ? 6 : 8, fontWeight: 900,
              color: "#fff", background: "rgba(0,0,0,0.7)",
              padding: "2px 6px", borderRadius: 4, letterSpacing: 1,
            }}>{card.action}</div>

            {/* Score badge */}
            <div style={{
              position: "absolute", top: 6, right: 6,
              width: size === "small" ? 24 : 32, height: size === "small" ? 24 : 32,
              borderRadius: "50%", background: r.color,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: size === "small" ? 8 : 11, fontWeight: 900, color: "#fff",
              fontFamily: "monospace", boxShadow: `0 0 12px ${r.glow}`,
            }}>{card.score}</div>

            <PlayerPhoto espnId={card.espnId} name={card.name} size={w - (size === "small" ? 16 : 24)} />
          </div>

          {/* Player name */}
          <div style={{ textAlign: "center", marginBottom: size === "small" ? 5 : 7 }}>
            <div style={{
              fontSize: size === "small" ? 9 : 13, fontWeight: 900,
              color: "#fff", letterSpacing: 0.3, lineHeight: 1.2,
              textShadow: `0 0 20px ${r.color}`,
            }}>{card.name}</div>
            <div style={{
              fontSize: size === "small" ? 7 : 9,
              color: r.color, fontWeight: 700, marginTop: 1,
            }}>{card.pos} · {card.team.replace("Chicago ", "")}</div>
          </div>

          {/* Stats row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: size === "small" ? 3 : 4 }}>
            {[
              { label: "PTS", val: card.pts },
              { label: "AST", val: card.ast },
              { label: "REB", val: card.reb },
            ].map(s => (
              <div key={s.label} style={{
                background: "rgba(0,0,0,0.5)",
                borderRadius: 6, padding: size === "small" ? "3px 2px" : "5px 4px",
                textAlign: "center", border: `1px solid ${r.color}25`,
              }}>
                <div style={{ fontSize: size === "small" ? 9 : 12, fontWeight: 900, color: r.color }}>{s.val}</div>
                <div style={{ fontSize: size === "small" ? 5 : 7, color: "#666", fontWeight: 700, letterSpacing: 0.5 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{ marginTop: size === "small" ? 4 : 6, textAlign: "center" }}>
            <div style={{ fontSize: size === "small" ? 6 : 8, color: "#444", fontFamily: "monospace", letterSpacing: 0.5 }}>
              HOOPIQ · 2025-26 · #{String(card.id).padStart(3, "0")}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PackOpening({ pack, onClose, onCardsRevealed }) {
  const [phase, setPhase] = useState("shake");
  const [revealedCards, setRevealedCards] = useState([]);

  const getRandomCards = () => {
    const shuffled = [...CARDS].sort(() => Math.random() - 0.5);
    const count = pack.id === "standard" ? 3 : pack.id === "bulls" ? 5 : 8;
    return shuffled.slice(0, count);
  };

  useEffect(() => {
    const cards = getRandomCards();
    const t1 = setTimeout(() => setPhase("open"), 1000);
    const t2 = setTimeout(() => { setPhase("reveal"); setRevealedCards(cards); }, 2000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.97)", backdropFilter: "blur(20px)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <style>{`
        @keyframes shakeAnim { 0%,100%{transform:rotate(0) scale(1)} 25%{transform:rotate(-10deg) scale(1.05)} 75%{transform:rotate(10deg) scale(1.05)} }
        @keyframes explode { 0%{transform:scale(1);opacity:1} 50%{transform:scale(1.5);opacity:0.5} 100%{transform:scale(0);opacity:0} }
        @keyframes cardIn { from{opacity:0;transform:translateY(40px) scale(0.8) rotateY(180deg)} to{opacity:1;transform:translateY(0) scale(1) rotateY(0deg)} }
        @keyframes sparkleAnim { 0%,100%{opacity:0;transform:scale(0) rotate(0deg)} 50%{opacity:1;transform:scale(1) rotate(180deg)} }
      `}</style>

      {phase === "shake" && (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 120, animation: "shakeAnim 0.2s infinite", marginBottom: 30 }}>{pack.emoji}</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: "#fff", letterSpacing: 3 }}>OUVERTURE...</div>
          <div style={{ fontSize: 15, color: "#666", marginTop: 10 }}>{pack.name}</div>
        </div>
      )}

      {phase === "open" && (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 120, animation: "explode 1s forwards" }}>{pack.emoji}</div>
          <div style={{ fontSize: 36, fontWeight: 900, color: "#ff5c00", marginTop: 20, letterSpacing: 2 }}>✨ RÉVÉLATION !</div>
        </div>
      )}

      {phase === "reveal" && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 28 }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: "#fff", letterSpacing: 2 }}>✨ TES CARTES !</div>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center", maxWidth: "90vw" }}>
            {revealedCards.map((card, i) => (
              <div key={card.id} style={{ animation: `cardIn 0.6s cubic-bezier(.34,1.56,.64,1) ${i * 0.12}s both` }}>
                <HoloCard card={card} size={revealedCards.length > 5 ? "small" : "normal"} />
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={() => { onCardsRevealed(revealedCards); onClose(); }} style={{
              padding: "14px 36px", borderRadius: 12, border: "none", cursor: "pointer",
              background: "linear-gradient(135deg,#ff5c00,#ff8c42)", color: "#fff",
              fontWeight: 900, fontSize: 16, fontFamily: "inherit",
              boxShadow: "0 8px 30px rgba(255,92,0,0.5)",
            }}>Ajouter à ma collection →</button>
            <button onClick={onClose} style={{
              padding: "14px 24px", borderRadius: 12, border: "1px solid #333",
              background: "transparent", color: "#666", cursor: "pointer", fontFamily: "inherit",
            }}>Fermer</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Cards() {
  const [view, setView] = useState("collection");
  const [collection, setCollection] = useState([CARDS[0], CARDS[2]]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [openingPack, setOpeningPack] = useState(null);
  const [filter, setFilter] = useState("all");
  const [notification, setNotification] = useState(null);

  const showNotif = (msg) => { setNotification(msg); setTimeout(() => setNotification(null), 3000); };

  const handleCardsRevealed = (cards) => {
    const newCards = cards.filter(c => !collection.find(col => col.id === c.id));
    setCollection(prev => [...prev, ...newCards]);
    showNotif(`🎴 +${newCards.length} nouvelles cartes ! ${newCards.find(c => c.rarity === "legendary") ? "🔥 LÉGENDAIRE !" : ""}`);
  };

  const filtered = filter === "all" ? collection : collection.filter(c => c.rarity === filter);

  return (
    <div style={{ minHeight: "100vh", background: "#06060f", color: "#f0f0ff", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;600;700;900&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: #ff5c00; border-radius: 4px; }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes notifIn { from{opacity:0;transform:translateX(100px)} to{opacity:1;transform:translateX(0)} }
        .pack-hover:hover { transform: translateY(-10px) scale(1.03) !important; box-shadow: 0 30px 60px rgba(255,92,0,0.3) !important; }
      `}</style>

      {/* Notification */}
      {notification && (
        <div style={{
          position: "fixed", top: 80, right: 24, zIndex: 500,
          background: "linear-gradient(135deg,#ff5c00,#ff8c42)", color: "#fff",
          padding: "14px 22px", borderRadius: 14, fontWeight: 800, fontSize: 15,
          animation: "notifIn .4s ease", boxShadow: "0 8px 40px rgba(255,92,0,0.5)",
        }}>{notification}</div>
      )}

      {/* Pack opening */}
      {openingPack && <PackOpening pack={openingPack} onClose={() => setOpeningPack(null)} onCardsRevealed={handleCardsRevealed} />}

      {/* Card detail */}
      {selectedCard && (
        <div onClick={() => setSelectedCard(null)} style={{
          position: "fixed", inset: 0, zIndex: 500, background: "rgba(0,0,0,0.9)",
          backdropFilter: "blur(16px)", display: "flex", alignItems: "center",
          justifyContent: "center", flexDirection: "column", gap: 28,
        }}>
          <div onClick={e => e.stopPropagation()}>
            <HoloCard card={selectedCard} size="large" />
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 36, color: RARITY[selectedCard.rarity].color, letterSpacing: 2 }}>{selectedCard.name}</div>
            <div style={{ fontSize: 14, color: "#666", marginBottom: 20 }}>{RARITY[selectedCard.rarity].label} · Score HoopIQ {selectedCard.score}/100</div>
            <div style={{ display: "flex", gap: 20, justifyContent: "center" }}>
              {[
                { l: "Points", v: selectedCard.pts },
                { l: "Passes", v: selectedCard.ast },
                { l: "Rebonds", v: selectedCard.reb },
                { l: "% Tir", v: `${selectedCard.fg}%` },
                { l: "Contres", v: selectedCard.blk },
                { l: "Interc.", v: selectedCard.stl },
              ].map(s => (
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
            <button key={id} onClick={() => setView(id)} style={{
              padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer",
              background: view === id ? "rgba(255,92,0,0.15)" : "transparent",
              color: view === id ? "#ff5c00" : "#6b7280", fontWeight: 700, fontSize: 13,
              borderBottom: view === id ? "2px solid #ff5c00" : "2px solid transparent",
              transition: "all .2s", fontFamily: "inherit",
            }}>{label}</button>
          ))}
        </div>
        <div style={{ fontSize: 13, color: "#6b7280" }}>🃏 {collection.length}/{CARDS.length} cartes</div>
      </div>

      <div style={{ maxWidth: 1140, margin: "0 auto", padding: "28px 24px" }}>

        {/* COLLECTION */}
        {view === "collection" && (
          <div>
            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 28 }}>
              {[
                { l: "Total", v: collection.length, c: "#f0f0ff" },
                { l: "Légendaires", v: collection.filter(c => c.rarity === "legendary").length, c: "#ff5c00" },
                { l: "Épiques", v: collection.filter(c => c.rarity === "epic").length, c: "#c084fc" },
                { l: "Rares", v: collection.filter(c => c.rarity === "rare").length, c: "#60a5fa" },
              ].map(s => (
                <div key={s.l} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 16, textAlign: "center" }}>
                  <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 36, color: s.c }}>{s.v}</div>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>{s.l}</div>
                </div>
              ))}
            </div>

            {/* Filters */}
            <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
              {[["all","Toutes"],["legendary","⭐ Légendaires"],["epic","💜 Épiques"],["rare","💙 Rares"],["common","⬜ Communes"]].map(([id,label]) => (
                <button key={id} onClick={() => setFilter(id)} style={{
                  padding: "6px 16px", borderRadius: 20,
                  border: `1px solid ${filter === id ? "#ff5c00" : "rgba(255,255,255,0.1)"}`,
                  background: filter === id ? "rgba(255,92,0,0.12)" : "transparent",
                  color: filter === id ? "#ff5c00" : "#6b7280",
                  fontSize: 12, cursor: "pointer", fontWeight: filter === id ? 700 : 500, fontFamily: "inherit",
                }}>{label}</button>
              ))}
            </div>

            {/* Cards */}
            {filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: 60, color: "#6b7280" }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>📦</div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>Pas de cartes ici</div>
                <button onClick={() => setView("packs")} style={{ marginTop: 20, padding: "12px 28px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#ff5c00,#ff8c42)", color: "#fff", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                  Ouvrir des packs →
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

            {/* All cards preview */}
            <div style={{ marginTop: 40, padding: 24, background: "rgba(255,255,255,0.03)", borderRadius: 18, border: "1px solid rgba(255,255,255,0.07)" }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2, color: "#ff5c00", textTransform: "uppercase", marginBottom: 20, fontFamily: "monospace" }}>🃏 Toutes les cartes disponibles</div>
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                {CARDS.map(card => {
                  const owned = collection.find(c => c.id === card.id);
                  return (
                    <div key={card.id} style={{ opacity: owned ? 1 : 0.25, filter: owned ? "none" : "grayscale(1) blur(1px)", transition: "all .3s" }}>
                      <HoloCard card={card} size="small" onClick={() => owned && setSelectedCard(card)} />
                    </div>
                  );
                })}
              </div>
              <div style={{ marginTop: 16, fontSize: 13, color: "#6b7280" }}>{collection.length}/{CARDS.length} cartes collectées · Ouvre des packs pour compléter ta collection !</div>
            </div>
          </div>
        )}

        {/* PACKS */}
        {view === "packs" && (
          <div>
            <h1 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 46, letterSpacing: 2, marginBottom: 8 }}>
              OUVRIR DES <span style={{ color: "#ff5c00" }}>PACKS</span>
            </h1>
            <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 36 }}>Chaque pack contient des cartes avec les vrais joueurs NBA ! Tente ta chance pour les légendaires 🔥</p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 24, marginBottom: 40 }}>
              {PACKS.map(pack => (
                <div key={pack.id} className="pack-hover" onClick={() => setOpeningPack(pack)} style={{
                  background: `linear-gradient(160deg, rgba(0,0,0,0.9), ${pack.color}20)`,
                  border: `1px solid ${pack.color}50`, borderRadius: 22, padding: 36,
                  textAlign: "center", cursor: "pointer", transition: "all .3s",
                }}>
                  <div style={{ fontSize: 80, marginBottom: 20, animation: "float 3s ease-in-out infinite" }}>{pack.emoji}</div>
                  <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 28, color: pack.color, letterSpacing: 1, marginBottom: 10 }}>{pack.name}</div>
                  <div style={{ fontSize: 13, color: "#888", marginBottom: 24, lineHeight: 1.7 }}>{pack.desc}</div>
                  <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 48, color: pack.color, marginBottom: 20 }}>{pack.price}</div>
                  <button style={{
                    width: "100%", padding: "14px", borderRadius: 12, border: "none", cursor: "pointer",
                    background: `linear-gradient(135deg, ${pack.color}, ${pack.color}99)`,
                    color: "#fff", fontWeight: 900, fontSize: 16, fontFamily: "inherit",
                    boxShadow: `0 8px 30px ${pack.color}40`,
                  }}>Ouvrir →</button>
                </div>
              ))}
            </div>

            {/* Odds table */}
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 18, padding: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2, color: "#ff5c00", textTransform: "uppercase", marginBottom: 20, fontFamily: "monospace" }}>📊 Probabilités par rareté</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
                {[
                  { r: "Légendaire", p: "5%", c: "#ff5c00", emoji: "⭐" },
                  { r: "Épique", p: "15%", c: "#c084fc", emoji: "💜" },
                  { r: "Rare", p: "30%", c: "#60a5fa", emoji: "💙" },
                  { r: "Commun", p: "50%", c: "#9ca3af", emoji: "⬜" },
                ].map(o => (
                  <div key={o.r} style={{ textAlign: "center", padding: 20, background: `${o.c}10`, borderRadius: 14, border: `1px solid ${o.c}30` }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>{o.emoji}</div>
                    <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 36, color: o.c }}>{o.p}</div>
                    <div style={{ fontSize: 12, color: "#888" }}>{o.r}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
