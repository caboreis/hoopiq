import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

const API = import.meta.env.DEV ? "http://localhost:3001" : "";

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

const WEIGHT_CLASSES = [
  "Tous", "Heavyweight", "Light Heavyweight", "Middleweight",
  "Welterweight", "Lightweight", "Featherweight", "Bantamweight",
  "Flyweight", "Women's Strawweight", "Women's Bantamweight", "Women's Flyweight",
];

const RARITY_FILTERS = ["Tous", "gold", "legendary", "epic", "rare", "common"];

function FighterPhoto({ src, name, size }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const showPlaceholder = !src || error || !loaded;
  return (
    <div style={{ width: size, height: size * 0.85, position: "relative", overflow: "hidden" }}>
      {showPlaceholder && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontSize: size * 0.28, fontWeight: 900, color: (!src || error) ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.2)", fontFamily: "'Permanent Marker',cursive", letterSpacing: 2, textShadow: "0 2px 12px rgba(0,0,0,0.8)" }}>{initials}</div>
        </div>
      )}
      {src && !error && (
        <img src={src} alt={name} onLoad={() => setLoaded(true)} onError={() => setError(true)}
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
        <FighterPhoto src={fighter.headshot} name={fighter.name} size={160} />
      </div>

      {/* Nom + nickname */}
      <div style={{ marginBottom: 10, position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: C.text, lineHeight: 1.2 }}>{fighter.name}</div>
          {fighter.flag && <img src={fighter.flag} alt={fighter.country} style={{ width: 16, height: 12, objectFit: "cover", borderRadius: 2, flexShrink: 0 }} />}
        </div>
        {fighter.nickname && <div style={{ fontSize: 10, color: r.color, fontWeight: 700, letterSpacing: 0.5, marginTop: 2, marginBottom: 4 }}>"{fighter.nickname}"</div>}
        <Stars count={r.stars} color={r.color} />
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
          #{fighter.rank}
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
          <div style={{ fontSize: 18, fontFamily: "'Permanent Marker', cursive", color: r.color }}>{fighter.defenses}</div>
          <div style={{ fontSize: 9, color: C.muted, letterSpacing: 1 }}>DÉFENSES</div>
        </div>
      </div>

      {/* Score HoopIQ */}
      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ fontSize: 10, color: C.muted }}>Niveau HoopIQ</span>
          <span style={{ fontSize: 10, fontWeight: 700, color: r.color }}>{fighter.score}/100</span>
        </div>
        <StatBar value={fighter.score} color={r.color} />
      </div>
    </div>
  );
}

function FighterModal({ fighter, onClose }) {
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsErr, setStatsErr] = useState(false);

  useEffect(() => {
    if (!fighter) return;
    let active = true;
    setStats(null);
    setStatsErr(false);
    setStatsLoading(true);
    fetch(`${API}/api/mma/fighter/${fighter.espnId}/stats`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(d => { if (active) { setStats(d.stats); setStatsLoading(false); } })
      .catch(() => { if (active) { setStatsErr(true); setStatsLoading(false); } });
    return () => { active = false; };
  }, [fighter]);

  if (!fighter) return null;
  const r = RARITY[fighter.rarity];

  const statRows = stats ? [
    { label: "Précision de frappe", val: stats.strikeAccuracy, unit: "%", color: C.red },
    { label: "Précision takedowns", val: stats.takedownAccuracy, unit: "%", color: C.blue },
    { label: "Soumissions tentées / 15min", val: stats.submissionAvg, unit: "", color: r.color },
  ].filter(s => s.val != null) : [];

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
            <FighterPhoto src={fighter.headshot} name={fighter.name} size={90} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontFamily: "'Permanent Marker', cursive", letterSpacing: 1, color: C.text }}>{fighter.name}</div>
            <div style={{ fontSize: 12, color: r.color, fontWeight: 700, marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
              {fighter.nickname && <span>"{fighter.nickname}"</span>}
              {fighter.flag && <img src={fighter.flag} alt={fighter.country} style={{ width: 16, height: 12, objectFit: "cover", borderRadius: 2 }} />}
            </div>
            <Stars count={r.stars} color={r.color} />
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
        </div>

        {/* Bilan */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
          {[
            { label: "Victoires", val: fighter.wins, color: C.green },
            { label: "Défaites", val: fighter.losses, color: C.red },
            { label: "Défenses", val: fighter.defenses, color: r.color },
          ].map(({ label, val, color }) => (
            <div key={label} style={{ textAlign: "center", padding: 14, background: "rgba(255,255,255,0.04)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.07)" }}>
              <div style={{ fontSize: 28, fontFamily: "'Permanent Marker', cursive", color }}>{val}</div>
              <div style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Stats réelles ESPN (chargées à l'ouverture) */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: C.muted, letterSpacing: 1, marginBottom: 10 }}>STATS DE CAGE (ESPN)</div>
          {statsLoading && <div style={{ fontSize: 12, color: C.muted, padding: "8px 0" }}>Chargement…</div>}
          {statsErr && <div style={{ fontSize: 12, color: C.muted, padding: "8px 0" }}>Stats indisponibles pour ce combattant.</div>}
          {!statsLoading && !statsErr && statRows.length === 0 && (
            <div style={{ fontSize: 12, color: C.muted, padding: "8px 0" }}>Pas encore de stats de cage ESPN pour ce combattant.</div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {statRows.map(({ label, val, unit, color }) => (
              <div key={label}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: C.muted }}>{label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color }}>{val}{unit}</span>
                </div>
                <StatBar value={val} max={unit === "%" ? 100 : 5} color={color} />
              </div>
            ))}
          </div>
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
          <div style={{ padding: "10px 14px", background: "rgba(255,255,255,0.04)", borderRadius: 10, gridColumn: "1 / -1" }}>
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
  const [fighters, setFighters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [weightFilter, setWeightFilter] = useState("Tous");
  const [rarityFilter, setRarityFilter] = useState("Tous");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("score");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    let active = true;
    fetch(`${API}/api/mma/rankings`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(d => { if (active) { setFighters(d.fighters || []); setLoading(false); } })
      .catch(() => { if (active) { setError(true); setLoading(false); } });
    return () => { active = false; };
  }, []);

  const filtered = fighters
    .filter(f => weightFilter === "Tous" || f.weightClass === weightFilter)
    .filter(f => rarityFilter === "Tous" || f.rarity === rarityFilter)
    .filter(f => !search || f.name.toLowerCase().includes(search.toLowerCase()) || f.nickname.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sort === "score" ? b.score - a.score : sort === "wins" ? b.wins - a.wins : sort === "rank" ? a.rank - b.rank : b.defenses - a.defenses);

  const counts = { total: fighters.length, champs: fighters.filter(f => f.belt).length, gold: fighters.filter(f => f.rarity === "gold").length };

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
          {loading ? "Chargement du classement UFC en direct…" : `${counts.total} combattants classés · ${counts.champs} champions UFC · ${counts.gold} cartes OR`}
        </p>
      </div>

      {error && (
        <div style={{ padding: 20, background: "rgba(232,0,45,0.08)", border: "1px solid rgba(232,0,45,0.3)", borderRadius: 14, color: C.text, marginBottom: 24, fontSize: 14 }}>
          Impossible de charger le classement UFC pour le moment. Réessaie dans un instant.
        </div>
      )}

      {!error && (
        <>
          {/* KPIs */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: 12, marginBottom: 24 }}>
            {[
              { label: "Combattants", val: counts.total, color: C.red },
              { label: "Champions", val: counts.champs, color: C.gold },
              { label: "Cartes OR", val: counts.gold, color: "#ffd700" },
              { label: "Ligues", val: 1, color: C.blue },
            ].map(({ label, val, color }) => (
              <div key={label} style={{ padding: "14px 18px", background: C.surface, borderRadius: 14, border: `1px solid ${C.border}` }}>
                <div style={{ fontFamily: "'Permanent Marker', cursive", fontSize: 28, color }}>{loading ? "…" : val}</div>
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
              <option value="rank">Classement ↑</option>
              <option value="defenses">Défenses ↓</option>
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
          {loading ? (
            <div style={{ textAlign: "center", color: C.muted, padding: "60px 0", fontSize: 15 }}>Chargement des combattants…</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", color: C.muted, padding: "60px 0", fontSize: 15 }}>Aucun combattant trouvé.</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px,1fr))", gap: 18 }}>
              {filtered.map(f => <FighterCard key={`${f.id}:${f.weightClass}`} fighter={f} onClick={setSelected} />)}
            </div>
          )}
        </>
      )}

      {selected && <FighterModal fighter={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
