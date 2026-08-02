import { useState, useRef } from "react";
import { authHeaders } from "./authHeaders.js";

const API = import.meta.env.DEV ? "http://localhost:3001" : "";

const C = {
  bg: "#06060f", bg2: "#0d0d1f",
  orange: "#ff5c00", orangeL: "#ff8c42",
  green: "#22d37a", blue: "#4fa3ff", purple: "#a855f7",
  gold: "#f5c842", red: "#ff4d6d", cyan: "#22d3ee",
  text: "#f0f0ff", muted: "#6b6b88",
};

const NBA_TEAMS = [
  "Atlanta Hawks", "Boston Celtics", "Brooklyn Nets", "Charlotte Hornets",
  "Chicago Bulls", "Cleveland Cavaliers", "Dallas Mavericks", "Denver Nuggets",
  "Detroit Pistons", "Golden State Warriors", "Houston Rockets", "Indiana Pacers",
  "Los Angeles Clippers", "Los Angeles Lakers", "Memphis Grizzlies", "Miami Heat",
  "Milwaukee Bucks", "Minnesota Timberwolves", "New Orleans Pelicans", "New York Knicks",
  "Oklahoma City Thunder", "Orlando Magic", "Philadelphia 76ers", "Phoenix Suns",
  "Portland Trail Blazers", "Sacramento Kings", "San Antonio Spurs", "Toronto Raptors",
  "Utah Jazz", "Washington Wizards",
];

const STAR_PLAYERS = [
  "LeBron James", "Stephen Curry", "Kevin Durant", "Giannis Antetokounmpo",
  "Nikola Jokic", "Luka Doncic", "Jayson Tatum", "Joel Embiid",
  "Damian Lillard", "Kawhi Leonard", "Anthony Davis", "Devin Booker",
  "Trae Young", "Zion Williamson", "Victor Wembanyama", "Shai Gilgeous-Alexander",
  "Anthony Edwards", "Ja Morant", "Donovan Mitchell", "Karl-Anthony Towns",
];

function VerdictBadge({ text }) {
  const isPositif = text?.toLowerCase().includes("excellent") || text?.toLowerCase().includes("parfait") || text?.toLowerCase().includes("superbe");
  const isNegatif = text?.toLowerCase().includes("risqué") || text?.toLowerCase().includes("mauvais") || text?.toLowerCase().includes("désastreux");
  const color = isPositif ? C.green : isNegatif ? C.red : C.gold;
  return (
    <span style={{
      display: "inline-block", padding: "4px 14px", borderRadius: 20,
      background: `${color}20`, color, border: `1px solid ${color}44`,
      fontWeight: 800, fontSize: 13, letterSpacing: 1,
    }}>{text}</span>
  );
}

export default function TradeSimulator() {
  const [player, setPlayer] = useState("");
  const [fromTeam, setFromTeam] = useState("");
  const [toTeam, setToTeam] = useState("");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState("");
  const [done, setDone] = useState(false);
  const [showPlayerSug, setShowPlayerSug] = useState(false);
  const streamRef = useRef(null);

  const playerSuggestions = player.length >= 2
    ? STAR_PLAYERS.filter(p => p.toLowerCase().includes(player.toLowerCase())).slice(0, 5)
    : [];

  const simulate = async () => {
    if (!player.trim() || !toTeam) return;
    if (streamRef.current) clearInterval(streamRef.current);
    setLoading(true);
    setAnalysis("");
    setDone(false);

    try {
      const res = await fetch(`${API}/api/anthropic`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 1200,
          messages: [{
            role: "user",
            content: `Tu es JARVIS HoopIQ, le meilleur analyste trade NBA au monde. Tu combines l'expertise de Woj, Shams, et Adrian Wojnarowski.

Simule ce trade NBA :
**${player}**${fromTeam ? ` (actuellement aux ${fromTeam})` : ""} → **${toTeam}**

Structure ta réponse EXACTEMENT ainsi :

## 🔥 VERDICT GLOBAL
[1 phrase choc + note /10 pour chaque équipe]

## 📊 IMPACT STATS
[Comment les stats de ${player} vont évoluer avec ${toTeam} ? Donne des projections précises avec +/- par catégorie]

## 🤝 FIT TACTIQUE
[${player} joue-t-il bien avec les stars des ${toTeam} ? Style de jeu compatible ?]

## ⚖️ LES DEUX CÔTÉS DU TRADE
**${toTeam} 👍** : [ce qu'ils gagnent]
**Équipe d'origine 👎** : [ce qu'ils perdent]

## 🏆 CHANCES DE TITRE
[Avec ce trade, ${toTeam} peut-il gagner le titre ? Donne un pourcentage et compare aux autres favoris]

## 🔮 PRÉDICTION JARVIS
[Ta prédiction définitive — ce trade va-t-il marcher ? Dans 3 ans, bonne ou mauvaise décision ?]

Sois passionné, data-driven, en français. Parle comme un vrai insider NBA.`,
          }],
        }),
      });

      const data = await res.json();
      const text = data.content?.map(b => b.text || "").join("") || "Analyse indisponible.";

      let i = 0;
      streamRef.current = setInterval(() => {
        if (i >= text.length) {
          setAnalysis(text);
          setDone(true);
          setLoading(false);
          clearInterval(streamRef.current);
        } else {
          setAnalysis(text.slice(0, i));
          i += 20;
        }
      }, 14);
    } catch {
      setAnalysis("❌ Erreur JARVIS — réessaie.");
      setDone(true);
      setLoading(false);
    }
  };

  const reset = () => {
    setAnalysis("");
    setDone(false);
    setPlayer("");
    setFromTeam("");
    setToTeam("");
  };

  const renderAnalysis = (text) => {
    let verdictNext = false;
    return text.split("\n").map((line, i) => {
      if (line.startsWith("## ")) {
        const heading = line.replace("## ", "");
        verdictNext = /VERDICT GLOBAL/i.test(heading);
        return (
          <div key={i} style={{
            fontFamily: "'Permanent Marker', cursive", fontSize: 22,
            color: C.orange, letterSpacing: 1.5, marginTop: 20, marginBottom: 6,
          }}>{heading}</div>
        );
      }
      if (verdictNext && line.trim()) {
        verdictNext = false;
        return (
          <div key={i} style={{ marginTop: 4, marginBottom: 6 }}>
            <VerdictBadge text={line} />
          </div>
        );
      }
      if (line.startsWith("**") && line.includes("**")) {
        const parts = line.replace(/\*\*/g, "|||").split("|||");
        return (
          <div key={i} style={{ marginTop: 6, fontSize: 16, lineHeight: 1.7 }}>
            {parts.map((p, j) => j % 2 === 1
              ? <strong key={j} style={{ color: C.cyan }}>{p}</strong>
              : <span key={j} style={{ color: C.text }}>{p}</span>
            )}
          </div>
        );
      }
      if (line.startsWith("→") || line.startsWith("▸")) {
        return <div key={i} style={{ color: C.green, paddingLeft: 12, fontSize: 15, lineHeight: 1.7 }}>{line}</div>;
      }
      if (line.startsWith("🔮")) {
        return <div key={i} style={{ color: C.cyan, fontSize: 16, fontStyle: "italic", marginTop: 8, lineHeight: 1.7 }}>{line}</div>;
      }
      if (line.startsWith("🏆")) {
        return <div key={i} style={{ color: C.gold, fontSize: 16, fontWeight: 700, lineHeight: 1.7 }}>{line}</div>;
      }
      return <div key={i} style={{ fontSize: 16, lineHeight: 1.7, color: C.text }}>{line}</div>;
    });
  };

  return (
    <div className="fade-in">
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes slideIn { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        .ts-input { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 12px 16px; color: #f0f0ff; font-size: 15px; font-family: inherit; outline: none; width: 100%; box-sizing: border-box; transition: border .2s; }
        .ts-input:focus { border-color: #ff5c00; }
        .ts-input::placeholder { color: #6b6b88; }
        .ts-select { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 12px 16px; color: #f0f0ff; font-size: 15px; font-family: inherit; outline: none; width: 100%; box-sizing: border-box; cursor: pointer; appearance: none; transition: border .2s; }
        .ts-select:focus { border-color: #ff5c00; }
        .ts-select option { background: #0d0d1f; color: #f0f0ff; }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "'Permanent Marker', cursive", fontSize: 48, letterSpacing: 2, lineHeight: 1, marginBottom: 6 }}>
          TRADE <span style={{ color: C.orange }}>SIMULATOR</span>
        </h1>
        <p style={{ color: C.muted, fontSize: 14 }}>
          JARVIS analyse n'importe quel trade imaginaire — stats, fit, chimie, prédiction titre
        </p>
      </div>

      {/* Input card */}
      <div style={{
        background: "rgba(255,92,0,0.05)", border: "1px solid rgba(255,92,0,0.2)",
        borderRadius: 20, padding: 24, marginBottom: 24,
      }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 16, alignItems: "center", marginBottom: 20 }}>

          {/* Player */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: C.muted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>
              🏀 Joueur
            </div>
            <div style={{ position: "relative" }}>
              <input
                className="ts-input"
                placeholder="Ex: LeBron James"
                value={player}
                onChange={e => { setPlayer(e.target.value); setShowPlayerSug(true); }}
                onBlur={() => setTimeout(() => setShowPlayerSug(false), 150)}
              />
              {showPlayerSug && playerSuggestions.length > 0 && (
                <div style={{
                  position: "absolute", top: "100%", left: 0, right: 0, zIndex: 10,
                  background: "#0d0d1f", border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 10, marginTop: 4, overflow: "hidden",
                }}>
                  {playerSuggestions.map(s => (
                    <div key={s} onMouseDown={() => { setPlayer(s); setShowPlayerSug(false); }}
                      style={{ padding: "10px 14px", cursor: "pointer", fontSize: 14, color: C.text,
                        borderBottom: "1px solid rgba(255,255,255,0.05)" }}
                      onMouseEnter={e => e.target.style.background = "rgba(255,92,0,0.1)"}
                      onMouseLeave={e => e.target.style.background = "transparent"}
                    >{s}</div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: C.muted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>
                Équipe actuelle (optionnel)
              </div>
              <select className="ts-select" value={fromTeam} onChange={e => setFromTeam(e.target.value)}>
                <option value="">— Équipe actuelle —</option>
                {NBA_TEAMS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Arrow */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, paddingTop: 10 }}>
            <div style={{
              width: 44, height: 44, borderRadius: "50%",
              background: `linear-gradient(135deg, ${C.orange}, #c44000)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22, fontWeight: 900, color: "#fff", flexShrink: 0,
            }}>→</div>
            <div style={{ fontSize: 10, color: C.muted, fontWeight: 700, letterSpacing: 1 }}>TRADE</div>
          </div>

          {/* Destination */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: C.orange, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>
              🏆 Destination
            </div>
            <select className="ts-select" style={{ borderColor: "rgba(255,92,0,0.3)" }}
              value={toTeam} onChange={e => setToTeam(e.target.value)}>
              <option value="">— Choisir l'équipe —</option>
              {NBA_TEAMS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        {/* Preview banner */}
        {player && toTeam && (
          <div style={{
            background: "rgba(255,92,0,0.08)", border: "1px solid rgba(255,92,0,0.2)",
            borderRadius: 12, padding: "10px 16px", marginBottom: 16,
            display: "flex", alignItems: "center", gap: 10, animation: "slideIn .3s ease",
          }}>
            <span style={{ fontSize: 20 }}>🔥</span>
            <span style={{ fontSize: 15, color: C.text, fontWeight: 700 }}>
              <span style={{ color: C.orange }}>{player}</span>
              {fromTeam && <span style={{ color: C.muted, fontSize: 13 }}> ({fromTeam})</span>}
              <span style={{ color: C.muted }}> → </span>
              <span style={{ color: C.cyan }}>{toTeam}</span>
            </span>
          </div>
        )}

        {/* Simulate button */}
        <button
          onClick={simulate}
          disabled={loading || !player.trim() || !toTeam}
          style={{
            width: "100%", padding: "14px", borderRadius: 14, border: "none",
            background: loading || !player.trim() || !toTeam
              ? "rgba(255,255,255,0.05)"
              : `linear-gradient(135deg, ${C.orange}, #c44000)`,
            color: loading || !player.trim() || !toTeam ? C.muted : "#fff",
            fontSize: 16, fontWeight: 900, fontFamily: "inherit",
            cursor: loading || !player.trim() || !toTeam ? "default" : "pointer",
            letterSpacing: 2, textTransform: "uppercase", transition: "all .2s",
          }}
        >
          {loading ? "⏳ JARVIS ANALYSE..." : "🦾 JARVIS SIMULE CE TRADE"}
        </button>
      </div>

      {/* Analysis result */}
      {(analysis || loading) && (
        <div style={{
          background: "rgba(13,13,31,0.8)", border: "1px solid rgba(255,92,0,0.2)",
          borderRadius: 20, padding: 24, animation: "slideIn .4s ease",
        }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 24, animation: loading ? "pulse 1.2s infinite" : "none" }}>🦾</span>
              <div>
                <div style={{ fontFamily: "'Permanent Marker', cursive", fontSize: 20, color: C.orange, letterSpacing: 2 }}>
                  JARVIS TRADE REPORT
                </div>
                <div style={{ fontSize: 12, color: C.muted }}>
                  {player} → {toTeam}
                </div>
              </div>
            </div>
            {done && (
              <button onClick={reset} style={{
                padding: "6px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)",
                background: "transparent", color: C.muted, fontSize: 12,
                cursor: "pointer", fontFamily: "inherit",
              }}>
                Nouveau trade
              </button>
            )}
          </div>

          {/* Streaming text */}
          <div style={{ lineHeight: 1.8 }}>
            {renderAnalysis(analysis)}
            {!done && <span style={{ animation: "blink 1s infinite", color: C.orange, fontSize: 18 }}>▌</span>}
          </div>
        </div>
      )}

      {/* Quick suggestions */}
      {!analysis && !loading && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, color: C.muted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>
            🔥 Trades qui feraient EXPLOSER la NBA
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {[
              { player: "LeBron James", to: "San Antonio Spurs" },
              { player: "Stephen Curry", to: "New York Knicks" },
              { player: "Victor Wembanyama", to: "Los Angeles Lakers" },
              { player: "Giannis Antetokounmpo", to: "Golden State Warriors" },
              { player: "Luka Doncic", to: "Chicago Bulls" },
              { player: "Kevin Durant", to: "Boston Celtics" },
            ].map(s => (
              <button key={s.player + s.to}
                onClick={() => { setPlayer(s.player); setToTeam(s.to); }}
                style={{
                  padding: "8px 14px", borderRadius: 10,
                  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                  color: C.muted, fontSize: 13, cursor: "pointer", fontFamily: "inherit",
                  transition: "all .2s",
                }}
                onMouseEnter={e => { e.target.style.borderColor = C.orange + "44"; e.target.style.color = C.text; }}
                onMouseLeave={e => { e.target.style.borderColor = "rgba(255,255,255,0.08)"; e.target.style.color = C.muted; }}
              >
                {s.player} → {s.to}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
