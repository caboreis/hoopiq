import { useState, useEffect } from "react";

const API_BASE = import.meta.env.DEV ? "http://localhost:3001" : "";

const C = {
  bg: "#06060f", surface: "rgba(255,255,255,0.04)", border: "rgba(255,255,255,0.07)",
  orange: "#ff5c00", gold: "#ffd700", green: "#22d37a", red: "#ff4d6d",
  blue: "#4fa3ff", purple: "#c084fc", silver: "#C0C0C0", bronze: "#CD7F32",
  text: "#f0f0ff", muted: "#6b6b88",
};

const RANK_COLOR = { 1: C.gold, 2: C.silver, 3: C.bronze };
const MEDAL = { 1: "🥇", 2: "🥈", 3: "🥉" };
const initial = (name) => (name || "?").trim().charAt(0).toUpperCase();

function PodiumBlock({ player, height, delay }) {
  const color = RANK_COLOR[player.rank];
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", animation: `riseUp 0.6s ease ${delay}s both` }}>
      <div style={{
        width: 44, height: 44, borderRadius: "50%", marginBottom: 6,
        background: `${color}22`, border: `1px solid ${color}55`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'Bebas Neue', cursive", fontSize: 22, color,
      }}>{initial(player.name)}</div>
      <div style={{ fontWeight: 800, fontSize: 13, color: C.text, marginBottom: 2, maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{player.name}</div>
      <div style={{ fontSize: 11, color: C.muted, marginBottom: 10 }}>{player.points.toLocaleString()} pts</div>
      <div style={{
        width: 80, height,
        background: `linear-gradient(180deg, ${color}40, ${color}15)`,
        border: `1px solid ${color}60`,
        borderRadius: "12px 12px 0 0",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", paddingTop: 12,
      }}>
        <div style={{ fontSize: 28 }}>{MEDAL[player.rank]}</div>
        <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 28, color, lineHeight: 1 }}>#{player.rank}</div>
      </div>
    </div>
  );
}

export default function Leaderboard({ user }) {
  const [period, setPeriod] = useState("week");
  const [data, setData] = useState(null);
  const [state, setState] = useState("loading"); // loading | ready | error

  // On garde le classement précédent à l'écran pendant le chargement d'une autre
  // période — moins de clignotement qu'un retour à l'état "chargement".
  useEffect(() => {
    let alive = true;
    const q = new URLSearchParams({ period, ...(user?.email ? { email: user.email } : {}) });
    fetch(`${API_BASE}/api/leaderboard?${q}`)
      .then(r => r.json())
      .then(d => { if (alive) { setData(d); setState("ready"); } })
      .catch(() => alive && setState("error"));
    return () => { alive = false; };
  }, [period, user?.email]);

  const rows = data?.rows || [];
  const podium = rows.slice(0, 3);
  const totalCorrect = rows.reduce((s, r) => s + r.correct, 0);

  return (
    <div className="fade-in">
      <style>{`
        @keyframes riseUp { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .lb-row:hover { background: rgba(255,92,0,0.06) !important; }
      `}</style>

      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 8, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "'Permanent Marker', cursive", fontSize: 46, letterSpacing: 2, lineHeight: 1, margin: 0 }}>
            CLASSEMENT <span style={{ color: C.orange }}>HOOPIQ</span>
          </h1>
          <p style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>
            Classement des membres selon leurs pronos gagnés dans l'onglet Défis
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {[["week", "7 jours"], ["month", "30 jours"], ["all", "All-time"]].map(([id, label]) => (
            <button key={id} onClick={() => setPeriod(id)} style={{
              padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600,
              cursor: "pointer", fontFamily: "inherit", transition: "background .2s, border-color .2s, color .2s",
              background: period === id ? "rgba(255,92,0,0.15)" : "transparent",
              border: `1px solid ${period === id ? "rgba(255,92,0,0.4)" : C.border}`,
              color: period === id ? C.orange : C.muted,
            }}>{label}</button>
          ))}
        </div>
      </div>

      {state === "loading" && (
        <div style={{ textAlign: "center", padding: 70, color: C.muted }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🏆</div>
          Chargement du classement...
        </div>
      )}

      {state === "error" && (
        <div style={{ textAlign: "center", padding: 60, color: C.muted, fontSize: 13 }}>
          Impossible de charger le classement. Réessaie dans un instant.
        </div>
      )}

      {state === "ready" && rows.length === 0 && (
        <div style={{
          textAlign: "center", padding: "60px 30px", marginTop: 24,
          background: C.surface, border: `1px solid ${C.border}`, borderRadius: 18, color: C.muted,
        }}>
          <div style={{ fontSize: 40, marginBottom: 14, opacity: 0.6 }}>🏆</div>
          <div style={{ fontSize: 16, color: C.text, fontWeight: 700, marginBottom: 8 }}>
            Le classement est encore vide
          </div>
          <div style={{ fontSize: 13, lineHeight: 1.6, maxWidth: 420, margin: "0 auto" }}>
            Personne n'a encore de prono gagnant sur cette période.
            Va dans <strong style={{ color: C.orange }}>Défis</strong>, pronostique les matchs du jour,
            et tu apparaîtras ici dès qu'un match sera terminé.
          </div>
        </div>
      )}

      {state === "ready" && rows.length > 0 && (
        <>
          {/* Stats bar — comptages réels sur la période affichée */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, margin: "24px 0 32px" }}>
            {[
              { icon: "👥", label: "Membres classés", val: rows.length },
              { icon: "🎯", label: "Pronos gagnés", val: totalCorrect },
              { icon: "🏅", label: "Meilleur score", val: rows[0].points.toLocaleString() },
            ].map(s => (
              <div key={s.label} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "14px 18px", textAlign: "center" }}>
                <div style={{ fontSize: 22, marginBottom: 4 }}>{s.icon}</div>
                <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 26, color: C.orange }}>{s.val}</div>
                <div style={{ fontSize: 11, color: C.muted }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Podium — seulement quand il y a assez de monde pour que ça ait un sens */}
          {podium.length === 3 && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-end", gap: 16, marginBottom: 40, padding: "0 20px" }}>
              <PodiumBlock player={podium[1]} height={110} delay={0.1} />
              <PodiumBlock player={podium[0]} height={150} delay={0} />
              <PodiumBlock player={podium[2]} height={90} delay={0.2} />
            </div>
          )}

          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 18, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "44px 1fr 90px 80px 80px", gap: 8, padding: "12px 20px", borderBottom: `1px solid ${C.border}`, fontSize: 10, fontWeight: 800, color: C.muted, letterSpacing: 1.5, textTransform: "uppercase" }}>
              <span>#</span><span>Membre</span>
              <span style={{ textAlign: "right" }}>Points</span>
              <span style={{ textAlign: "right" }}>Gagnés</span>
              <span style={{ textAlign: "center" }}>Jours</span>
            </div>

            {rows.map(p => {
              const rankColor = RANK_COLOR[p.rank] || (p.isMe ? C.orange : C.muted);
              return (
                <div key={p.rank} className="lb-row" style={{
                  display: "grid", gridTemplateColumns: "44px 1fr 90px 80px 80px", gap: 8,
                  padding: "14px 20px", borderBottom: `1px solid ${C.border}`,
                  background: p.isMe ? "rgba(255,92,0,0.05)" : "transparent",
                  transition: "background .15s",
                }}>
                  <div style={{ fontFamily: "'Permanent Marker', cursive", fontSize: 20, color: rankColor, display: "flex", alignItems: "center" }}>
                    {MEDAL[p.rank] || `#${p.rank}`}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                    <div style={{ width: 34, height: 34, borderRadius: "50%", background: `${rankColor}20`, border: `1px solid ${rankColor}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: rankColor, flexShrink: 0 }}>
                      {initial(p.name)}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: p.isMe ? C.orange : C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {p.name} {p.isMe && <span style={{ fontSize: 10, color: C.orange }}>(toi)</span>}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right", fontFamily: "'Permanent Marker', cursive", fontSize: 18, color: rankColor, display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
                    {p.points.toLocaleString()}
                  </div>
                  <div style={{ textAlign: "right", fontSize: 13, color: C.text, display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
                    {p.correct} ✓
                  </div>
                  <div style={{ textAlign: "center", fontSize: 13, color: C.muted, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {p.daysPlayed}
                  </div>
                </div>
              );
            })}
          </div>

          {user?.email && !data?.me && (
            <div style={{ marginTop: 14, fontSize: 12, color: C.muted, textAlign: "center" }}>
              Tu n'es pas encore classé sur cette période — pose tes pronos dans <strong style={{ color: C.orange }}>Défis</strong>.
            </div>
          )}
        </>
      )}
    </div>
  );
}
