import { useState, useEffect } from "react";

const API_BASE = import.meta.env.DEV ? "http://localhost:3001" : "";

const EURO_TEAMS = [
  { name: "Real Madrid",         abbr: "MAD", country: "🇪🇸", color: "#FEBE10" },
  { name: "FC Barcelona",        abbr: "BAR", country: "🇪🇸", color: "#A50044" },
  { name: "Panathinaikos",       abbr: "PAN", country: "🇬🇷", color: "#007A33" },
  { name: "Olympiacos",          abbr: "OLY", country: "🇬🇷", color: "#CE1141" },
  { name: "Fenerbahce Beko",     abbr: "FEN", country: "🇹🇷", color: "#003087" },
  { name: "Anadolu Efes",        abbr: "EFE", country: "🇹🇷", color: "#F7A700" },
  { name: "Bayern Munich",       abbr: "BAY", country: "🇩🇪", color: "#DC052D" },
  { name: "Maccabi Tel Aviv",    abbr: "MAC", country: "🇮🇱", color: "#FFD700" },
  { name: "Monaco",              abbr: "MON", country: "🇲🇨", color: "#CE1141" },
  { name: "Virtus Bologna",      abbr: "VIR", country: "🇮🇹", color: "#000000" },
  { name: "ALBA Berlin",         abbr: "ALB", country: "🇩🇪", color: "#E2001A" },
  { name: "Baskonia",            abbr: "BAS", country: "🇪🇸", color: "#003DA5" },
  { name: "Partizan",            abbr: "PAR", country: "🇷🇸", color: "#231F20" },
  { name: "Paris Basketball",    abbr: "PAR", country: "🇫🇷", color: "#0055A4" },
  { name: "ASVEL Villeurbanne",  abbr: "ASV", country: "🇫🇷", color: "#003DA5" },
  { name: "Zalgiris",            abbr: "ZAL", country: "🇱🇹", color: "#007A33" },
  { name: "Red Star",            abbr: "RED", country: "🇷🇸", color: "#CE1141" },
  { name: "Maccabi Ra'anana",    abbr: "RAA", country: "🇮🇱", color: "#FFD700" },
];

const G = {
  orange: "linear-gradient(135deg, #ff5c00, #ff8c42)",
  surface: "rgba(255,255,255,0.03)",
  border: "rgba(255,255,255,0.08)",
  text: "#e8e8f0",
  muted: "#9a9ab0",
  bg: "#06060f",
};

function ask(prompt) {
  return fetch(`${API_BASE}/api/anthropic`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      provider: "groq",
      max_tokens: 900,
      system: "Tu es un expert Euroleague. Réponds UNIQUEMENT en JSON valide, rien d'autre.",
      messages: [{ role: "user", content: prompt }],
    }),
  })
    .then(r => r.json())
    .then(d => {
      const raw = (d.content || []).map(b => b.text || "").join("").trim();
      const m = raw.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      return m ? JSON.parse(m[0]) : null;
    });
}

// ── Standings ──────────────────────────────────────────────────────────────────
function Standings() {
  const [rows, setRows] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ask(`Génère le classement actuel Euroleague 2024-2025 (saison régulière terminée).
Retourne un tableau JSON de 18 équipes triées par rang :
[{"pos":1,"team":"Real Madrid","country":"🇪🇸","wins":26,"losses":8,"ptsFor":87,"ptsAgainst":78,"streak":"W3","form":"WWLWW"},...]
Utilise les vraies équipes Euroleague 2024-2025.`)
      .then(d => setRows(Array.isArray(d) ? d : null))
      .catch(() => setRows(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ textAlign: "center", padding: 60, color: G.muted }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>🏀</div>
      Chargement du classement...
    </div>
  );

  const fallback = EURO_TEAMS.slice(0, 10).map((t, i) => ({
    pos: i + 1, team: t.name, country: t.country,
    wins: 26 - i * 2, losses: 8 + i * 2,
    ptsFor: 88 - i, ptsAgainst: 76 + i,
    streak: i < 3 ? "W3" : "L1", form: "WWLWW",
  }));

  const data = rows || fallback;

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ color: G.muted, borderBottom: `1px solid ${G.border}` }}>
            {["#", "Équipe", "V", "D", "Pts+", "Pts-", "Série", "Forme"].map(h => (
              <th key={h} style={{ padding: "10px 8px", textAlign: h === "Équipe" ? "left" : "center", fontWeight: 600, fontSize: 11, letterSpacing: 1 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((r, i) => {
            const isTop8 = r.pos <= 8;
            return (
              <tr key={i} style={{
                borderBottom: `1px solid ${G.border}`,
                background: r.pos === 1 ? "rgba(255,215,0,0.04)" : r.pos <= 8 ? "rgba(255,92,0,0.03)" : "transparent",
                transition: "background .15s",
              }}>
                <td style={{ padding: "12px 8px", textAlign: "center" }}>
                  <span style={{
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    width: 24, height: 24, borderRadius: "50%", fontSize: 11, fontWeight: 800,
                    background: r.pos === 1 ? "rgba(255,215,0,0.2)" : r.pos <= 4 ? "rgba(255,92,0,0.15)" : "transparent",
                    color: r.pos === 1 ? "#FFD700" : isTop8 ? "#ff5c00" : G.muted,
                    fontFamily: "'Bebas Neue', cursive",
                  }}>{r.pos}</span>
                </td>
                <td style={{ padding: "12px 8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 16 }}>{r.country}</span>
                    <span style={{ color: G.text, fontWeight: 600 }}>{r.team}</span>
                  </div>
                </td>
                <td style={{ textAlign: "center", color: "#22d37a", fontFamily: "'Bebas Neue',cursive", fontSize: 15 }}>{r.wins}</td>
                <td style={{ textAlign: "center", color: "#ff6b6b", fontFamily: "'Bebas Neue',cursive", fontSize: 15 }}>{r.losses}</td>
                <td style={{ textAlign: "center", color: G.muted, fontFamily: "'Bebas Neue',cursive", fontSize: 14 }}>{r.ptsFor}</td>
                <td style={{ textAlign: "center", color: G.muted, fontFamily: "'Bebas Neue',cursive", fontSize: 14 }}>{r.ptsAgainst}</td>
                <td style={{ textAlign: "center" }}>
                  <span style={{ color: r.streak?.startsWith("W") ? "#22d37a" : "#ff6b6b", fontWeight: 700, fontSize: 12 }}>{r.streak}</span>
                </td>
                <td style={{ textAlign: "center" }}>
                  <div style={{ display: "flex", gap: 2, justifyContent: "center" }}>
                    {(r.form || "WWLWW").split("").map((f, fi) => (
                      <span key={fi} style={{
                        width: 12, height: 12, borderRadius: "50%",
                        background: f === "W" ? "#22d37a" : "#ff6b6b",
                        display: "inline-block",
                      }} />
                    ))}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div style={{ marginTop: 10, display: "flex", gap: 16, fontSize: 11, color: G.muted }}>
        <span><span style={{ color: "#ff5c00" }}>●</span> Top 8 → Playoffs</span>
        <span><span style={{ color: "#FFD700" }}>●</span> Leader</span>
      </div>
    </div>
  );
}

// ── Matchs récents ─────────────────────────────────────────────────────────────
function Matchs() {
  const [matchs, setMatchs] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ask(`Génère 6 matchs récents Euroleague 2024-2025 (journée 34 environ).
JSON : [{"home":"Real Madrid","away":"Panathinaikos","scoreHome":89,"scoreAway":76,"date":"12 Jun","round":"J34","mvp":"Sergio Llull","mvpPts":22},...]`)
      .then(d => setMatchs(Array.isArray(d) ? d : null))
      .catch(() => setMatchs(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ textAlign: "center", padding: 40, color: G.muted }}>Chargement des matchs...</div>;

  const data = matchs || [
    { home: "Real Madrid", away: "FC Barcelona", scoreHome: 91, scoreAway: 82, date: "12 Jun", round: "J34", mvp: "Sergio Llull", mvpPts: 24 },
    { home: "Panathinaikos", away: "Fenerbahce", scoreHome: 78, scoreAway: 71, date: "11 Jun", round: "J34", mvp: "Kendrick Nunn", mvpPts: 21 },
    { home: "Monaco", away: "ASVEL", scoreHome: 85, scoreAway: 79, date: "11 Jun", round: "J34", mvp: "Mike James", mvpPts: 28 },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {data.map((m, i) => {
        const homeWin = m.scoreHome > m.scoreAway;
        return (
          <div key={i} style={{
            background: G.surface, border: `1px solid ${G.border}`,
            borderRadius: 14, padding: "14px 18px",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: G.muted }}>{m.date} · {m.round}</span>
              <span style={{ fontSize: 11, color: "#ff5c00", fontWeight: 700 }}>TERMINÉ</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontWeight: homeWin ? 800 : 400, color: homeWin ? G.text : G.muted, flex: 1 }}>{m.home}</span>
              <div style={{ display: "flex", gap: 12, alignItems: "center", padding: "6px 16px", background: "rgba(255,92,0,0.1)", borderRadius: 10 }}>
                <span style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 22, color: homeWin ? "#22d37a" : G.text }}>{m.scoreHome}</span>
                <span style={{ color: G.muted, fontSize: 12 }}>-</span>
                <span style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 22, color: !homeWin ? "#22d37a" : G.text }}>{m.scoreAway}</span>
              </div>
              <span style={{ fontWeight: !homeWin ? 800 : 400, color: !homeWin ? G.text : G.muted, flex: 1, textAlign: "right" }}>{m.away}</span>
            </div>
            {m.mvp && (
              <div style={{ marginTop: 8, fontSize: 11, color: G.muted }}>
                🏆 MVP · <span style={{ color: "#FFD700", fontWeight: 600 }}>{m.mvp}</span> — <span style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 13, color: "#ff5c00" }}>{m.mvpPts} PTS</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Top joueurs ────────────────────────────────────────────────────────────────
function TopJoueurs() {
  const [players, setPlayers] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState("pts");

  const cats = [
    { id: "pts", label: "Marqueurs", color: "#ff5c00" },
    { id: "ast", label: "Passeurs",  color: "#4fa3ff" },
    { id: "reb", label: "Rebondeurs",color: "#22d37a" },
  ];

  useEffect(() => {
    ask(`Top 5 joueurs Euroleague 2024-2025 par statistiques.
JSON :
{
  "pts":[{"name":"Facundo Campazzo","team":"Real Madrid","country":"🇦🇷","val":18.4},{"name":"Mike James","team":"Monaco","country":"🇺🇸","val":17.9},{"name":"Scottie Wilbekin","team":"Maccabi","country":"🇺🇸","val":16.8},{"name":"Cory Higgins","team":"FC Barcelona","country":"🇺🇸","val":16.1},{"name":"Kendrick Nunn","team":"Panathinaikos","country":"🇺🇸","val":15.9}],
  "ast":[{"name":"Facundo Campazzo","team":"Real Madrid","country":"🇦🇷","val":7.2},{"name":"Mike James","team":"Monaco","country":"🇺🇸","val":6.8},{"name":"Lorenzo Brown","team":"Maccabi","country":"🇺🇸","val":5.9},{"name":"Sloukas","team":"Olympiacos","country":"🇬🇷","val":5.5},{"name":"Thomas","team":"ALBA","country":"🇩🇪","val":5.1}],
  "reb":[{"name":"Walter Tavares","team":"Real Madrid","country":"🇨🇻","val":8.9},{"name":"Nikola Milutinov","team":"Olympiacos","country":"🇷🇸","val":8.4},{"name":"Jan Vesely","team":"Fenerbahce","country":"🇨🇿","val":7.8},{"name":"Isaiah Hartenstein","team":"Fenerbahce","country":"🇩🇪","val":7.2},{"name":"Moustapha Fall","team":"ASVEL","country":"🇸🇳","val":7.1}]
}`)
      .then(d => setPlayers(d && typeof d === "object" ? d : null))
      .catch(() => setPlayers(null))
      .finally(() => setLoading(false));
  }, []);

  const catDef = cats.find(c => c.id === cat);

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {cats.map(c => (
          <button key={c.id} onClick={() => setCat(c.id)} style={{
            padding: "6px 16px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700,
            background: cat === c.id ? c.color : "rgba(255,255,255,0.06)",
            color: cat === c.id ? "#fff" : G.muted, transition: "all .15s",
          }}>{c.label}</button>
        ))}
      </div>
      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: G.muted }}>Chargement...</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {((players || {})[cat] || []).map((p, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 12,
              background: G.surface, border: `1px solid ${G.border}`, borderRadius: 12, padding: "12px 16px",
            }}>
              <span style={{
                width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                background: i === 0 ? "rgba(255,215,0,0.15)" : "rgba(255,255,255,0.05)",
                color: i === 0 ? "#FFD700" : G.muted, fontFamily: "'Bebas Neue',cursive", fontSize: 16, fontWeight: 800,
              }}>{i + 1}</span>
              <span style={{ fontSize: 16 }}>{p.country}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: G.text, fontSize: 14 }}>{p.name}</div>
                <div style={{ fontSize: 11, color: G.muted }}>{p.team}</div>
              </div>
              <span style={{
                fontFamily: "'Bebas Neue',cursive", fontSize: 26, color: catDef.color,
                background: `${catDef.color}18`, padding: "2px 12px", borderRadius: 8,
              }}>{p.val}</span>
              <span style={{ fontSize: 10, color: G.muted, fontWeight: 700 }}>{cat.toUpperCase()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Analyse IA ─────────────────────────────────────────────────────────────────
function AnalyseIA() {
  const [analyse, setAnalyse] = useState("");
  const [loading, setLoading] = useState(false);

  const genAnalyse = () => {
    setLoading(true);
    setAnalyse("");
    fetch(`${API_BASE}/api/anthropic`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider: "groq",
        max_tokens: 600,
        system: "Tu es un expert Euroleague. Réponds en français, style premium, concis.",
        messages: [{ role: "user", content: "Donne une analyse tactique de la saison Euroleague 2024-2025 en cours. Les tendances, l'équipe la plus forte, le joueur à surveiller, et un pronostic pour les playoffs. 4-5 phrases maximum." }],
      }),
    })
      .then(r => r.json())
      .then(d => setAnalyse((d.content || []).map(b => b.text || "").join("").trim()))
      .catch(() => setAnalyse("Erreur de connexion. Réessaie."))
      .finally(() => setLoading(false));
  };

  return (
    <div style={{ background: "rgba(255,92,0,0.04)", border: "1px solid rgba(255,92,0,0.2)", borderRadius: 16, padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <span style={{ fontSize: 24 }}>🤖</span>
        <div>
          <div style={{ fontFamily: "'Permanent Marker', cursive", fontSize: 18, color: "#ff5c00" }}>ANALYSE IA EUROLEAGUE</div>
          <div style={{ fontSize: 12, color: G.muted }}>Powered by HoopIQ Intelligence</div>
        </div>
      </div>
      {analyse ? (
        <p style={{ color: G.text, lineHeight: 1.7, fontSize: 14, margin: "0 0 14px" }}>{analyse}</p>
      ) : (
        <p style={{ color: G.muted, fontSize: 13, marginBottom: 14 }}>Clique pour générer une analyse tactique de la saison en cours.</p>
      )}
      <button onClick={genAnalyse} disabled={loading} style={{
        padding: "10px 24px", borderRadius: 10, border: "none", cursor: loading ? "not-allowed" : "pointer",
        background: loading ? "rgba(255,255,255,0.08)" : "linear-gradient(135deg, #ff5c00, #ff8c42)",
        color: "#fff", fontWeight: 800, fontSize: 13, opacity: loading ? 0.6 : 1,
      }}>{loading ? "Analyse en cours..." : "🔮 Générer l'analyse"}</button>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function Euroleague() {
  const [tab, setTab] = useState("standings");

  const tabs = [
    { id: "standings", label: "Classement", icon: "🏆" },
    { id: "matchs",    label: "Matchs",     icon: "📊" },
    { id: "joueurs",   label: "Joueurs",    icon: "⭐" },
    { id: "analyse",   label: "Analyse IA", icon: "🤖" },
  ];

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
          <span style={{ fontSize: 36 }}>🏀</span>
          <div>
            <h1 style={{ fontFamily: "'Permanent Marker', cursive", fontSize: 36, margin: 0, letterSpacing: 2 }}>
              EUROLEAGUE
            </h1>
            <div style={{ fontSize: 12, color: G.muted, letterSpacing: 1 }}>SAISON 2024-2025 · ANALYSE IA</div>
          </div>
        </div>
        {/* Drapeaux des nations */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
          {["🇪🇸","🇬🇷","🇹🇷","🇩🇪","🇮🇹","🇫🇷","🇷🇸","🇮🇱","🇲🇨","🇱🇹"].map((f, i) => (
            <span key={i} style={{ fontSize: 18 }}>{f}</span>
          ))}
        </div>
      </div>

      {/* Sous-onglets */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20, overflowX: "auto", paddingBottom: 4 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: "8px 18px", borderRadius: 20, border: "none", cursor: "pointer",
            background: tab === t.id ? "linear-gradient(135deg, #ff5c00, #ff8c42)" : "rgba(255,255,255,0.06)",
            color: tab === t.id ? "#fff" : G.muted, fontWeight: 700, fontSize: 12,
            whiteSpace: "nowrap", transition: "all .15s",
          }}>{t.icon} {t.label}</button>
        ))}
      </div>

      {/* Contenu */}
      <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 18, padding: 20 }}>
        {tab === "standings" && <Standings />}
        {tab === "matchs"    && <Matchs />}
        {tab === "joueurs"   && <TopJoueurs />}
        {tab === "analyse"   && <AnalyseIA />}
      </div>
    </div>
  );
}
