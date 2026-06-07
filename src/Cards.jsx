import { useState, useEffect, useRef } from "react";

const RARITY = {
  legendary: { label: "Légendaire", color: "#ff5c00", glow: "rgba(255,92,0,0.8)", bg: "linear-gradient(135deg, #1a0800, #3d1500, #1a0800)", border: "#ff5c00", stars: 5 },
  epic: { label: "Épique", color: "#a855f7", glow: "rgba(168,85,247,0.7)", bg: "linear-gradient(135deg, #0d0020, #1e0040, #0d0020)", border: "#a855f7", stars: 4 },
  rare: { label: "Rare", color: "#3b82f6", glow: "rgba(59,130,246,0.6)", bg: "linear-gradient(135deg, #001020, #002040, #001020)", border: "#3b82f6", stars: 3 },
  common: { label: "Commun", color: "#6b7280", glow: "rgba(107,114,128,0.4)", bg: "linear-gradient(135deg, #0a0a0a, #1a1a1a, #0a0a0a)", border: "#6b7280", stars: 1 },
};

const CARDS = [
  { id: 1, name: "Zach LaVine", pos: "SG", team: "Chicago Bulls", pts: 24.8, ast: 4.2, reb: 4.5, fg: 47, blk: 0.4, stl: 0.9, score: 94, rarity: "legendary", emoji: "⚡", trait: "ÉLECTRIQUE", initials: "ZL" },
  { id: 2, name: "Coby White", pos: "PG", team: "Chicago Bulls", pts: 19.1, ast: 5.1, reb: 3.8, fg: 44, blk: 0.2, stl: 1.0, score: 88, rarity: "epic", emoji: "🔥", trait: "EN FEU", initials: "CW" },
  { id: 3, name: "Nikola Vučević", pos: "C", team: "Chicago Bulls", pts: 17.6, ast: 3.2, reb: 10.9, fg: 50, blk: 0.9, stl: 0.8, score: 85, rarity: "epic", emoji: "🗿", trait: "DOMINANT", initials: "NV" },
  { id: 4, name: "Patrick Williams", pos: "SF", team: "Chicago Bulls", pts: 13.1, ast: 2.1, reb: 4.8, fg: 48, blk: 0.7, stl: 1.1, score: 79, rarity: "rare", emoji: "🛡️", trait: "DÉFENSEUR", initials: "PW" },
  { id: 5, name: "Ayo Dosunmu", pos: "SG", team: "Chicago Bulls", pts: 11.2, ast: 3.8, reb: 3.1, fg: 45, blk: 0.3, stl: 1.3, score: 75, rarity: "rare", emoji: "💨", trait: "RAPIDE", initials: "AD" },
  { id: 6, name: "Matas Buzelis", pos: "PF", team: "Chicago Bulls", pts: 8.4, ast: 1.2, reb: 3.9, fg: 42, blk: 0.8, stl: 0.7, score: 70, rarity: "common", emoji: "🌱", trait: "FUTUR", initials: "MB" },
];

const PACKS = [
  { id: "standard", name: "Pack Standard", price: "Free", cards: 3, desc: "3 cartes aléatoires", emoji: "📦", color: "#6b7280" },
  { id: "bulls", name: "Pack Bulls", price: "9€", cards: 5, desc: "5 cartes + 1 Rare garanti", emoji: "🐂", color: "#ff5c00" },
  { id: "elite", name: "Pack Elite", price: "29€", cards: 8, desc: "8 cartes + 1 Épique garanti", emoji: "👑", color: "#a855f7" },
];

function HoloCard({ card, size = "normal", onClick, isNew }) {
  const r = RARITY[card.rarity];
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePos({ x, y });
  };

  const rotX = isHovered ? ((mousePos.y - 50) / 50) * -15 : 0;
  const rotY = isHovered ? ((mousePos.x - 50) / 50) * 15 : 0;

  const w = size === "small" ? 140 : size === "large" ? 280 : 200;
  const h = w * 1.4;

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setMousePos({ x: 50, y: 50 }); }}
      style={{
        width: w, height: h, borderRadius: 16, cursor: "pointer",
        position: "relative", flexShrink: 0,
        transform: `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) ${isHovered ? "scale(1.05)" : "scale(1)"} ${isNew ? "scale(0) rotate(180deg)" : ""}`,
        transition: isNew ? "transform 0.6s cubic-bezier(.34,1.56,.64,1)" : "transform 0.15s ease",
        boxShadow: isHovered ? `0 20px 60px ${r.glow}, 0 0 30px ${r.glow}` : `0 8px 24px rgba(0,0,0,0.5)`,
        animation: isNew ? "cardReveal 0.6s cubic-bezier(.34,1.56,.64,1) forwards" : "none",
      }}
    >
      {/* Card background */}
      <div style={{
        position: "absolute", inset: 0, borderRadius: 16,
        background: r.bg, border: `2px solid ${r.border}`,
        overflow: "hidden",
      }}>
        {/* Holo effect */}
        {(card.rarity === "legendary" || card.rarity === "epic") && (
          <div style={{
            position: "absolute", inset: 0, borderRadius: 14,
            background: `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, rgba(255,255,255,0.15) 0%, transparent 60%)`,
            mixBlendMode: "overlay", pointerEvents: "none",
          }} />
        )}

        {/* Shimmer lines */}
        {card.rarity === "legendary" && (
          <div style={{
            position: "absolute", inset: 0,
            background: `repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(255,180,0,0.05) 4px, rgba(255,180,0,0.05) 8px)`,
            pointerEvents: "none",
          }} />
        )}

        {/* Content */}
        <div style={{ padding: size === "small" ? 10 : 14, height: "100%", display: "flex", flexDirection: "column" }}>
          {/* Top: rarity + trait */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ fontSize: size === "small" ? 8 : 10, fontWeight: 800, letterSpacing: 1.5, color: r.color, textTransform: "uppercase", fontFamily: "monospace" }}>
              {"★".repeat(r.stars)}
            </div>
            <div style={{ fontSize: size === "small" ? 7 : 9, fontWeight: 800, color: r.color, background: `${r.color}20`, padding: "2px 6px", borderRadius: 4, letterSpacing: 1 }}>
              {card.trait}
            </div>
          </div>

          {/* Avatar */}
          <div style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
            marginBottom: 8, position: "relative",
          }}>
            <div style={{
              width: size === "small" ? 60 : 90, height: size === "small" ? 60 : 90,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${r.color}40, ${r.color}10)`,
              border: `2px solid ${r.color}60`,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexDirection: "column",
            }}>
              <div style={{ fontSize: size === "small" ? 24 : 36 }}>{card.emoji}</div>
            </div>
            {/* Score ring */}
            <div style={{
              position: "absolute", bottom: 0, right: size === "small" ? 8 : 20,
              width: size === "small" ? 28 : 36, height: size === "small" ? 28 : 36,
              borderRadius: "50%", background: r.color,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: size === "small" ? 9 : 12, fontWeight: 900, color: "#fff",
              fontFamily: "monospace",
            }}>{card.score}</div>
          </div>

          {/* Name */}
          <div style={{ textAlign: "center", marginBottom: 6 }}>
            <div style={{ fontSize: size === "small" ? 10 : 14, fontWeight: 900, color: "#fff", letterSpacing: 0.5, lineHeight: 1.2 }}>{card.name}</div>
            <div style={{ fontSize: size === "small" ? 8 : 10, color: r.color, fontWeight: 700, marginTop: 2 }}>{card.pos} · {card.team}</div>
          </div>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4 }}>
            {[
              { label: "PTS", val: card.pts },
              { label: "AST", val: card.ast },
              { label: "REB", val: card.reb },
            ].map(s => (
              <div key={s.label} style={{
                background: "rgba(0,0,0,0.4)", borderRadius: 6, padding: size === "small" ? "3px 4px" : "5px 6px",
                textAlign: "center", border: `1px solid ${r.color}30`,
              }}>
                <div style={{ fontSize: size === "small" ? 10 : 13, fontWeight: 900, color: r.color }}>{s.val}</div>
                <div style={{ fontSize: size === "small" ? 6 : 8, color: "#888", fontWeight: 700, letterSpacing: 0.5 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Bottom */}
          <div style={{ marginTop: 6, textAlign: "center" }}>
            <div style={{ fontSize: size === "small" ? 7 : 9, color: "#666", fontFamily: "monospace" }}>HOOPIQ · SAISON 2025-26</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PackOpening({ pack, onClose, onCardsRevealed }) {
  const [phase, setPhase] = useState("shake"); // shake → open → reveal
  const [revealedCards, setRevealedCards] = useState([]);
  const [currentReveal, setCurrentReveal] = useState(0);

  const getRandomCards = () => {
    const shuffled = [...CARDS].sort(() => Math.random() - 0.5);
    const count = pack.id === "standard" ? 3 : pack.id === "bulls" ? 5 : 8;
    return shuffled.slice(0, count);
  };

  useEffect(() => {
    const cards = getRandomCards();
    setTimeout(() => setPhase("open"), 1200);
    setTimeout(() => {
      setPhase("reveal");
      setRevealedCards(cards);
    }, 2200);
  }, []);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.95)", backdropFilter: "blur(20px)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <style>{`
        @keyframes shake { 0%,100%{transform:rotate(0deg)} 20%{transform:rotate(-8deg)} 40%{transform:rotate(8deg)} 60%{transform:rotate(-5deg)} 80%{transform:rotate(5deg)} }
        @keyframes packOpen { 0%{transform:scale(1)} 50%{transform:scale(1.2)} 100%{transform:scale(0) rotate(180deg); opacity:0} }
        @keyframes cardReveal { from{transform:scale(0) rotate(180deg); opacity:0} to{transform:scale(1) rotate(0deg); opacity:1} }
        @keyframes sparkle { 0%,100%{opacity:0;transform:scale(0)} 50%{opacity:1;transform:scale(1)} }
      `}</style>

      {phase === "shake" && (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 100, animation: "shake 0.3s infinite", marginBottom: 24 }}>{pack.emoji}</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#fff", letterSpacing: 2 }}>OUVERTURE DU PACK...</div>
          <div style={{ fontSize: 14, color: "#888", marginTop: 8 }}>{pack.name}</div>
        </div>
      )}

      {phase === "open" && (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 100, animation: "packOpen 1s forwards" }}>{pack.emoji}</div>
          <div style={{ fontSize: 32, fontWeight: 900, color: "#ff5c00", letterSpacing: 2, marginTop: 24 }}>✨ RÉVÉLATION !</div>
        </div>
      )}

      {phase === "reveal" && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24, maxWidth: "90vw" }}>
          <div style={{ fontSize: 20, fontWeight: 900, color: "#fff", letterSpacing: 2 }}>✨ TES CARTES !</div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
            {revealedCards.map((card, i) => (
              <div key={card.id} style={{ animation: `cardReveal 0.6s cubic-bezier(.34,1.56,.64,1) ${i * 0.15}s both` }}>
                <HoloCard card={card} size="normal" />
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={() => { onCardsRevealed(revealedCards); onClose(); }} style={{
              padding: "14px 32px", borderRadius: 12, border: "none", cursor: "pointer",
              background: "linear-gradient(135deg,#ff5c00,#ff8c42)", color: "#fff",
              fontWeight: 800, fontSize: 16, fontFamily: "inherit",
            }}>
              Ajouter à ma collection →
            </button>
            <button onClick={onClose} style={{
              padding: "14px 24px", borderRadius: 12, border: "1px solid #333",
              background: "transparent", color: "#888", cursor: "pointer", fontFamily: "inherit",
            }}>
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Cards() {
  const [view, setView] = useState("collection"); // collection | packs | detail
  const [collection, setCollection] = useState([CARDS[0], CARDS[2]]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [openingPack, setOpeningPack] = useState(null);
  const [filter, setFilter] = useState("all");
  const [notification, setNotification] = useState(null);

  const showNotif = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handlePackOpen = (pack) => setOpeningPack(pack);

  const handleCardsRevealed = (cards) => {
    const newCards = cards.filter(c => !collection.find(col => col.id === c.id));
    setCollection(prev => [...prev, ...newCards]);
    showNotif(`+${newCards.length} nouvelles cartes ajoutées ! 🎉`);
  };

  const filtered = filter === "all" ? collection : collection.filter(c => c.rarity === filter);

  const rarityCount = (r) => collection.filter(c => c.rarity === r).length;

  return (
    <div style={{ minHeight: "100vh", background: "#06060f", color: "#f0f0ff", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;600;700;900&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: #ff5c00; border-radius: 4px; }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes glow { 0%,100%{box-shadow:0 0 20px rgba(255,92,0,0.3)} 50%{box-shadow:0 0 40px rgba(255,92,0,0.7)} }
        @keyframes slideIn { from{opacity:0;transform:translateY(-20px)} to{opacity:1;transform:translateY(0)} }
        .pack-card:hover { transform: translateY(-8px) scale(1.02) !important; }
        .filter-btn:hover { opacity: .8; }
      `}</style>

      {/* Notification */}
      {notification && (
        <div style={{
          position: "fixed", top: 80, right: 24, zIndex: 500,
          background: "linear-gradient(135deg,#ff5c00,#ff8c42)", color: "#fff",
          padding: "12px 20px", borderRadius: 12, fontWeight: 700, fontSize: 14,
          animation: "slideIn .3s ease", boxShadow: "0 8px 30px rgba(255,92,0,0.4)",
        }}>{notification}</div>
      )}

      {/* Pack opening modal */}
      {openingPack && (
        <PackOpening
          pack={openingPack}
          onClose={() => setOpeningPack(null)}
          onCardsRevealed={handleCardsRevealed}
        />
      )}

      {/* Card detail modal */}
      {selectedCard && (
        <div onClick={() => setSelectedCard(null)} style={{
          position: "fixed", inset: 0, zIndex: 500, background: "rgba(0,0,0,0.85)",
          backdropFilter: "blur(12px)", display: "flex", alignItems: "center",
          justifyContent: "center", flexDirection: "column", gap: 24,
        }}>
          <div onClick={e => e.stopPropagation()}>
            <HoloCard card={selectedCard} size="large" />
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 32, letterSpacing: 2, color: RARITY[selectedCard.rarity].color }}>{selectedCard.name}</div>
            <div style={{ fontSize: 14, color: "#888", marginBottom: 16 }}>{RARITY[selectedCard.rarity].label} · Score HoopIQ : {selectedCard.score}/100</div>
            <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
              {[
                { label: "Points", val: selectedCard.pts },
                { label: "Assists", val: selectedCard.ast },
                { label: "Rebonds", val: selectedCard.reb },
                { label: "% tir", val: `${selectedCard.fg}%` },
                { label: "Contres", val: selectedCard.blk },
                { label: "Steals", val: selectedCard.stl },
              ].map(s => (
                <div key={s.label} style={{ textAlign: "center" }}>
                  <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 24, color: RARITY[selectedCard.rarity].color }}>{s.val}</div>
                  <div style={{ fontSize: 11, color: "#666" }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
          <button onClick={() => setSelectedCard(null)} style={{ padding: "10px 24px", borderRadius: 10, border: "1px solid #333", background: "transparent", color: "#888", cursor: "pointer" }}>Fermer</button>
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
        <div style={{ display: "flex", gap: 16, fontSize: 13, color: "#6b7280" }}>
          <span>🃏 {collection.length} cartes</span>
          <span style={{ color: "#ff5c00" }}>🐂 Bulls</span>
        </div>
      </div>

      <div style={{ maxWidth: 1140, margin: "0 auto", padding: "28px 24px" }}>

        {/* COLLECTION */}
        {view === "collection" && (
          <div>
            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 28 }}>
              {[
                { label: "Total cartes", val: collection.length, color: "#f0f0ff" },
                { label: "Légendaires", val: rarityCount("legendary"), color: "#ff5c00" },
                { label: "Épiques", val: rarityCount("epic"), color: "#a855f7" },
                { label: "Rares", val: rarityCount("rare"), color: "#3b82f6" },
              ].map(s => (
                <div key={s.label} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 16, textAlign: "center" }}>
                  <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 36, color: s.color }}>{s.val}</div>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Filters */}
            <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
              {[["all", "Toutes"], ["legendary", "⭐ Légendaires"], ["epic", "💜 Épiques"], ["rare", "💙 Rares"], ["common", "⬜ Communes"]].map(([id, label]) => (
                <button key={id} className="filter-btn" onClick={() => setFilter(id)} style={{
                  padding: "6px 14px", borderRadius: 20, border: `1px solid ${filter === id ? "#ff5c00" : "rgba(255,255,255,0.1)"}`,
                  background: filter === id ? "rgba(255,92,0,0.12)" : "transparent",
                  color: filter === id ? "#ff5c00" : "#6b7280", fontSize: 12, cursor: "pointer",
                  fontWeight: filter === id ? 700 : 500, fontFamily: "inherit",
                }}>{label}</button>
              ))}
            </div>

            {/* Cards grid */}
            {filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: 60, color: "#6b7280" }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>📦</div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>Pas encore de cartes dans cette catégorie</div>
                <div style={{ fontSize: 14, marginTop: 8 }}>Ouvre des packs pour en obtenir !</div>
                <button onClick={() => setView("packs")} style={{ marginTop: 20, padding: "12px 28px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#ff5c00,#ff8c42)", color: "#fff", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                  Voir les packs →
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>
                {filtered.map(card => (
                  <div key={card.id} style={{ animation: "float 4s ease-in-out infinite", animationDelay: `${card.id * 0.3}s` }}>
                    <HoloCard card={card} size="normal" onClick={() => setSelectedCard(card)} />
                  </div>
                ))}
              </div>
            )}

            {/* All cards preview */}
            <div style={{ marginTop: 40, padding: 24, background: "rgba(255,255,255,0.03)", borderRadius: 18, border: "1px solid rgba(255,255,255,0.07)" }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2, color: "#ff5c00", textTransform: "uppercase", marginBottom: 16, fontFamily: "monospace" }}>🃏 Toutes les cartes disponibles</div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                {CARDS.map(card => {
                  const owned = collection.find(c => c.id === card.id);
                  return (
                    <div key={card.id} style={{ opacity: owned ? 1 : 0.3, filter: owned ? "none" : "grayscale(1)" }}>
                      <HoloCard card={card} size="small" onClick={() => owned && setSelectedCard(card)} />
                    </div>
                  );
                })}
              </div>
              <div style={{ marginTop: 16, fontSize: 13, color: "#6b7280" }}>
                {collection.length}/{CARDS.length} cartes collectées
              </div>
            </div>
          </div>
        )}

        {/* PACKS */}
        {view === "packs" && (
          <div>
            <h1 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 46, letterSpacing: 2, marginBottom: 8 }}>
              OUVRIR DES <span style={{ color: "#ff5c00" }}>PACKS</span>
            </h1>
            <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 32 }}>Chaque pack contient des cartes aléatoires — tente ta chance pour obtenir des légendaires !</p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginBottom: 40 }}>
              {PACKS.map(pack => (
                <div key={pack.id} className="pack-card" onClick={() => handlePackOpen(pack)} style={{
                  background: `linear-gradient(135deg, rgba(0,0,0,0.8), ${pack.color}15)`,
                  border: `1px solid ${pack.color}40`, borderRadius: 20, padding: 32,
                  textAlign: "center", cursor: "pointer", transition: "all .3s",
                  boxShadow: `0 0 30px ${pack.color}10`,
                }}>
                  <div style={{ fontSize: 64, marginBottom: 16, animation: "float 3s ease-in-out infinite" }}>{pack.emoji}</div>
                  <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 28, letterSpacing: 1, color: pack.color, marginBottom: 8 }}>{pack.name}</div>
                  <div style={{ fontSize: 13, color: "#888", marginBottom: 20, lineHeight: 1.6 }}>{pack.desc}</div>
                  <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 42, color: pack.color, marginBottom: 16 }}>{pack.price}</div>
                  <button style={{
                    width: "100%", padding: "12px", borderRadius: 12, border: "none", cursor: "pointer",
                    background: `linear-gradient(135deg, ${pack.color}, ${pack.color}aa)`,
                    color: "#fff", fontWeight: 800, fontSize: 15, fontFamily: "inherit",
                  }}>
                    Ouvrir le pack →
                  </button>
                </div>
              ))}
            </div>

            {/* Odds */}
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2, color: "#ff5c00", textTransform: "uppercase", marginBottom: 16, fontFamily: "monospace" }}>📊 Probabilités</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
                {[
                  { rarity: "Légendaire", pct: "5%", color: "#ff5c00" },
                  { rarity: "Épique", pct: "15%", color: "#a855f7" },
                  { rarity: "Rare", pct: "30%", color: "#3b82f6" },
                  { rarity: "Commun", pct: "50%", color: "#6b7280" },
                ].map(o => (
                  <div key={o.rarity} style={{ textAlign: "center", padding: 16, background: `${o.color}10`, borderRadius: 12, border: `1px solid ${o.color}30` }}>
                    <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 32, color: o.color }}>{o.pct}</div>
                    <div style={{ fontSize: 12, color: "#888" }}>{o.rarity}</div>
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
