import { useState } from "react";

const C = {
  bg: "#06060f", surface: "rgba(255,255,255,0.04)", border: "rgba(255,255,255,0.07)",
  orange: "#ff5c00", gold: "#ffd700", green: "#22d37a", red: "#ff4d6d",
  blue: "#4fa3ff", purple: "#c084fc", silver: "#C0C0C0", bronze: "#CD7F32",
  text: "#f0f0ff", muted: "#6b6b88",
};

const WEEKLY_DATA = [
  { rank: 1,  name: "KingJames23",    avatar: "👑", pts: 4850, correct: 23, streak: 7,  badge: "🥇", trend: "+2", team: "Lakers" },
  { rank: 2,  name: "StephCurryFan",  avatar: "⚡", pts: 4210, correct: 19, streak: 5,  badge: "🥈", trend: "=",  team: "Warriors" },
  { rank: 3,  name: "JokerFan777",    avatar: "🃏", pts: 3980, correct: 18, streak: 4,  badge: "🥉", trend: "+1", team: "Nuggets" },
  { rank: 4,  name: "HoopDreams99",   avatar: "🏀", pts: 3540, correct: 16, streak: 3,  badge: null, trend: "-1", team: "Celtics" },
  { rank: 5,  name: "BballAnalyst",   avatar: "📊", pts: 3200, correct: 15, streak: 2,  badge: null, trend: "+3", team: "Bucks" },
  { rank: 6,  name: "NBAWatcher",     avatar: "👀", pts: 2980, correct: 14, streak: 2,  badge: null, trend: "=",  team: "Heat" },
  { rank: 7,  name: "CourtVision",    avatar: "🎯", pts: 2750, correct: 13, streak: 1,  badge: null, trend: "-2", team: "Knicks" },
  { rank: 8,  name: "PronoKing",      avatar: "🔮", pts: 2500, correct: 12, streak: 4,  badge: null, trend: "+1", team: "Suns" },
  { rank: 9,  name: "FastBreak",      avatar: "💨", pts: 2200, correct: 11, streak: 1,  badge: null, trend: "=",  team: "Pacers" },
  { rank: 10, name: "IQmaster",       avatar: "🧠", pts: 1950, correct: 10, streak: 0,  badge: null, trend: "-1", team: "Bulls" },
];

const ME = { rank: 24, name: "Toi", avatar: "🏠", pts: 850, correct: 6, streak: 5, badge: null, trend: "+5", team: "Bulls", isMe: true };

function PodiumBlock({ player, height, delay }) {
  const colors = { 1: C.gold, 2: C.silver, 3: C.bronze };
  const color = colors[player.rank];
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", animation: `riseUp 0.6s ease ${delay}s both` }}>
      <div style={{ fontSize: 36, marginBottom: 6 }}>{player.avatar}</div>
      <div style={{ fontWeight: 800, fontSize: 13, color: C.text, marginBottom: 2 }}>{player.name}</div>
      <div style={{ fontSize: 11, color: C.muted, marginBottom: 10 }}>{player.pts.toLocaleString()} pts</div>
      <div style={{
        width: 80, height,
        background: `linear-gradient(180deg, ${color}40, ${color}15)`,
        border: `1px solid ${color}60`,
        borderRadius: "12px 12px 0 0",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", paddingTop: 12,
      }}>
        <div style={{ fontSize: 28 }}>{player.badge}</div>
        <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 28, color, lineHeight: 1 }}>#{player.rank}</div>
      </div>
    </div>
  );
}

export default function Leaderboard() {
  const [period, setPeriod] = useState("week");

  return (
    <div className="fade-in">
      <style>{`
        @keyframes riseUp { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes pulse { 0%,100%{box-shadow:0 0 0 0 rgba(255,215,0,0.4)} 50%{box-shadow:0 0 0 8px rgba(255,215,0,0)} }
        .lb-row:hover { background: rgba(255,92,0,0.06) !important; }
      `}</style>

      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 8, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 46, letterSpacing: 2, lineHeight: 1, margin: 0 }}>
            CLASSEMENT <span style={{ color: C.orange }}>HOOPIQ</span>
          </h1>
          <p style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>Meilleurs pronostiqueurs · Mis à jour en temps réel</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {[["week", "Cette semaine"], ["month", "Ce mois"], ["all", "All-time"]].map(([id, label]) => (
            <button key={id} onClick={() => setPeriod(id)} style={{
              padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600,
              cursor: "pointer", fontFamily: "inherit", transition: "all .2s",
              background: period === id ? "rgba(255,92,0,0.15)" : "transparent",
              border: `1px solid ${period === id ? "rgba(255,92,0,0.4)" : C.border}`,
              color: period === id ? C.orange : C.muted,
            }}>{label}</button>
          ))}
        </div>
      </div>

      {/* Stats bar */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 32 }}>
        {[
          { icon: "👥", label: "Joueurs actifs", val: "1 247" },
          { icon: "🎯", label: "Prédictions ce soir", val: "3 891" },
          { icon: "🔥", label: "Meilleure série", val: "12 jours" },
        ].map(s => (
          <div key={s.label} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "14px 18px", textAlign: "center" }}>
            <div style={{ fontSize: 22, marginBottom: 4 }}>{s.icon}</div>
            <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 26, color: C.orange }}>{s.val}</div>
            <div style={{ fontSize: 11, color: C.muted }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Podium */}
      <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-end", gap: 16, marginBottom: 40, padding: "0 20px" }}>
        <PodiumBlock player={WEEKLY_DATA[1]} height={110} delay={0.1} />
        <PodiumBlock player={WEEKLY_DATA[0]} height={150} delay={0} />
        <PodiumBlock player={WEEKLY_DATA[2]} height={90}  delay={0.2} />
      </div>

      {/* Leaderboard table */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 18, overflow: "hidden" }}>
        {/* Header */}
        <div style={{ display: "grid", gridTemplateColumns: "44px 1fr 80px 80px 70px 70px", gap: 8, padding: "12px 20px", borderBottom: `1px solid ${C.border}`, fontSize: 10, fontWeight: 800, color: C.muted, letterSpacing: 1.5, textTransform: "uppercase" }}>
          <span>#</span><span>Joueur</span><span style={{ textAlign: "right" }}>Points</span><span style={{ textAlign: "right" }}>Corrects</span><span style={{ textAlign: "center" }}>Série</span><span style={{ textAlign: "center" }}>Évol.</span>
        </div>

        {[...WEEKLY_DATA, ME].sort((a, b) => a.rank - b.rank).map((p, i) => {
          if (p.rank === 11 && !p.isMe) return (
            <div key="sep" style={{ padding: "8px 20px", fontSize: 11, color: C.muted, textAlign: "center", borderBottom: `1px solid ${C.border}` }}>• • •</div>
          );
          const rankColor = p.rank === 1 ? C.gold : p.rank === 2 ? C.silver : p.rank === 3 ? C.bronze : p.isMe ? C.orange : C.muted;
          const trendColor = p.trend?.startsWith("+") ? C.green : p.trend === "=" ? C.muted : C.red;
          return (
            <div key={p.rank} className="lb-row" style={{
              display: "grid", gridTemplateColumns: "44px 1fr 80px 80px 70px 70px", gap: 8,
              padding: "14px 20px", borderBottom: `1px solid ${C.border}`,
              background: p.isMe ? "rgba(255,92,0,0.05)" : "transparent",
              border: p.isMe ? `1px solid rgba(255,92,0,0.2)` : undefined,
              transition: "background .15s", cursor: "default",
              boxShadow: p.rank === 1 ? "0 0 0 1px rgba(255,215,0,0.1)" : undefined,
              animation: p.rank <= 3 ? `riseUp 0.5s ease ${p.rank * 0.05}s both` : undefined,
            }}>
              <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 20, color: rankColor, display: "flex", alignItems: "center" }}>
                {p.badge || `#${p.rank}`}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: "50%", background: `${rankColor}20`, border: `1px solid ${rankColor}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{p.avatar}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: p.isMe ? C.orange : C.text }}>{p.name} {p.isMe && <span style={{ fontSize: 10, color: C.orange }}>(Toi)</span>}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>{p.team}</div>
                </div>
              </div>
              <div style={{ textAlign: "right", fontFamily: "'Bebas Neue', cursive", fontSize: 18, color: rankColor, display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
                {p.pts.toLocaleString()}
              </div>
              <div style={{ textAlign: "right", fontSize: 13, color: C.text, display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
                {p.correct} ✓
              </div>
              <div style={{ textAlign: "center", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                {p.streak > 0 && <span style={{ fontSize: 12 }}>🔥</span>}
                <span style={{ color: p.streak > 0 ? C.orange : C.muted }}>{p.streak}j</span>
              </div>
              <div style={{ textAlign: "center", fontSize: 12, fontWeight: 700, color: trendColor, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {p.trend}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 16, fontSize: 11, color: C.muted, textAlign: "center" }}>
        🏆 Classement basé sur les prédictions des 7 derniers jours · Données simulées
      </div>
    </div>
  );
}
