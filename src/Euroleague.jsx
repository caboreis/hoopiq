import { useState, useEffect } from "react";
import { authHeaders } from "./authHeaders.js";

const API_BASE = import.meta.env.DEV ? "http://localhost:3001" : "";

const G = {
  orange: "linear-gradient(135deg, #ff5c00, #ff8c42)",
  surface: "rgba(255,255,255,0.03)",
  border: "rgba(255,255,255,0.08)",
  text: "#e8e8f0",
  muted: "#9a9ab0",
  bg: "#06060f",
};

const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });

// ── Classement ─────────────────────────────────────────────────────────────────
function Standings({ data }) {
  const rows = data.standings || [];
  if (!rows.length) return <Empty label="Classement indisponible pour cette saison." />;

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ color: G.muted, borderBottom: `1px solid ${G.border}` }}>
            {["#", "Équipe", "J", "V", "D", "Pts+", "Pts-", "Diff"].map(h => (
              <th key={h} style={{ padding: "10px 8px", textAlign: h === "Équipe" ? "left" : "center", fontWeight: 600, fontSize: 11, letterSpacing: 1 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(r => {
            const isTop8 = r.pos <= 8;
            return (
              <tr key={r.code || r.pos} style={{
                borderBottom: `1px solid ${G.border}`,
                background: r.pos === 1 ? "rgba(255,215,0,0.04)" : isTop8 ? "rgba(255,92,0,0.03)" : "transparent",
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
                <td style={{ textAlign: "center", color: G.muted, fontFamily: "'Bebas Neue',cursive", fontSize: 14 }}>{r.played}</td>
                <td style={{ textAlign: "center", color: "#22d37a", fontFamily: "'Bebas Neue',cursive", fontSize: 15 }}>{r.wins}</td>
                <td style={{ textAlign: "center", color: "#ff6b6b", fontFamily: "'Bebas Neue',cursive", fontSize: 15 }}>{r.losses}</td>
                <td style={{ textAlign: "center", color: G.muted, fontFamily: "'Bebas Neue',cursive", fontSize: 14 }}>{r.ptsFor}</td>
                <td style={{ textAlign: "center", color: G.muted, fontFamily: "'Bebas Neue',cursive", fontSize: 14 }}>{r.ptsAgainst}</td>
                <td style={{ textAlign: "center", fontFamily: "'Bebas Neue',cursive", fontSize: 14, color: r.diff > 0 ? "#22d37a" : r.diff < 0 ? "#ff6b6b" : G.muted }}>
                  {r.diff > 0 ? "+" : ""}{r.diff}
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

// ── Matchs ─────────────────────────────────────────────────────────────────────
function Crest({ url, name }) {
  if (!url) return <span style={{ fontSize: 16 }}>🏀</span>;
  return <img src={url} alt={name} width={22} height={22} style={{ objectFit: "contain", flexShrink: 0 }} />;
}

function Matchs({ data }) {
  const [view, setView] = useState(data.upcoming?.length ? "upcoming" : "recent");
  const games = view === "recent" ? (data.recent || []) : (data.upcoming || []);

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {[
          { id: "recent", label: "Derniers résultats", n: data.recent?.length || 0 },
          { id: "upcoming", label: "À venir", n: data.upcoming?.length || 0 },
        ].map(v => (
          <button key={v.id} onClick={() => setView(v.id)} disabled={!v.n} style={{
            padding: "6px 16px", borderRadius: 20, border: "none",
            cursor: v.n ? "pointer" : "not-allowed", fontSize: 12, fontWeight: 700,
            background: view === v.id ? "#ff5c00" : "rgba(255,255,255,0.06)",
            color: view === v.id ? "#fff" : G.muted, opacity: v.n ? 1 : 0.4,
          }}>{v.label}</button>
        ))}
      </div>

      {!games.length ? (
        <Empty label={view === "upcoming" ? "Aucun match programmé pour le moment." : "Aucun résultat disponible."} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {games.map(m => {
            const played = m.homeScore != null;
            const homeWin = played && m.homeScore > m.awayScore;
            return (
              <div key={m.id} style={{
                background: G.surface, border: `1px solid ${G.border}`,
                borderRadius: 14, padding: "14px 18px",
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 11, color: G.muted }}>{fmtDate(m.date)} · {m.round}</span>
                  <span style={{ fontSize: 11, color: played ? "#ff5c00" : "#4fa3ff", fontWeight: 700 }}>
                    {played ? "TERMINÉ" : "À VENIR"}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
                    <Crest url={m.homeCrest} name={m.home} />
                    <span style={{ fontWeight: homeWin ? 800 : 400, color: homeWin || !played ? G.text : G.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.home}</span>
                  </div>
                  <div style={{ display: "flex", gap: 12, alignItems: "center", padding: "6px 16px", background: "rgba(255,92,0,0.1)", borderRadius: 10, flexShrink: 0 }}>
                    {played ? (
                      <>
                        <span style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 22, color: homeWin ? "#22d37a" : G.text }}>{m.homeScore}</span>
                        <span style={{ color: G.muted, fontSize: 12 }}>-</span>
                        <span style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 22, color: !homeWin ? "#22d37a" : G.text }}>{m.awayScore}</span>
                      </>
                    ) : (
                      <span style={{ fontSize: 12, color: G.muted, fontWeight: 700 }}>
                        {new Date(m.date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0, justifyContent: "flex-end" }}>
                    <span style={{ fontWeight: played && !homeWin ? 800 : 400, color: (played && !homeWin) || !played ? G.text : G.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.away}</span>
                    <Crest url={m.awayCrest} name={m.away} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Top joueurs ────────────────────────────────────────────────────────────────
function TopJoueurs({ data }) {
  const [cat, setCat] = useState("pts");

  const cats = [
    { id: "pts", label: "Marqueurs",  color: "#ff5c00", unit: "PTS" },
    { id: "ast", label: "Passeurs",   color: "#4fa3ff", unit: "AST" },
    { id: "reb", label: "Rebondeurs", color: "#22d37a", unit: "REB" },
    { id: "pir", label: "Évaluation", color: "#FFD700", unit: "PIR" },
  ];
  const catDef = cats.find(c => c.id === cat);
  const list = data.leaders?.[cat] || [];

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {cats.map(c => (
          <button key={c.id} onClick={() => setCat(c.id)} style={{
            padding: "6px 16px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700,
            background: cat === c.id ? c.color : "rgba(255,255,255,0.06)",
            color: cat === c.id ? "#fff" : G.muted, transition: "background .15s, color .15s",
          }}>{c.label}</button>
        ))}
      </div>
      {!list.length ? (
        <Empty label="Statistiques joueurs pas encore publiées pour cette saison." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {list.map((p, i) => (
            <div key={p.name} style={{
              display: "flex", alignItems: "center", gap: 12,
              background: G.surface, border: `1px solid ${G.border}`, borderRadius: 12, padding: "12px 16px",
            }}>
              <span style={{
                width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                background: i === 0 ? "rgba(255,215,0,0.15)" : "rgba(255,255,255,0.05)",
                color: i === 0 ? "#FFD700" : G.muted, fontFamily: "'Bebas Neue',cursive", fontSize: 16, fontWeight: 800,
                flexShrink: 0,
              }}>{i + 1}</span>
              {p.photo
                ? <img src={p.photo} alt="" width={34} height={34} style={{ borderRadius: "50%", objectFit: "cover", background: "rgba(255,255,255,0.06)", flexShrink: 0 }} />
                : <span style={{ fontSize: 20, width: 34, textAlign: "center", flexShrink: 0 }}>🏀</span>}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, color: G.text, fontSize: 14 }}>{p.name}</div>
                <div style={{ fontSize: 11, color: G.muted }}>{p.team} · {p.games} matchs</div>
              </div>
              <span style={{
                fontFamily: "'Bebas Neue',cursive", fontSize: 26, color: catDef.color,
                background: `${catDef.color}18`, padding: "2px 12px", borderRadius: 8, flexShrink: 0,
              }}>{p.val}</span>
              <span style={{ fontSize: 10, color: G.muted, fontWeight: 700, flexShrink: 0 }}>{catDef.unit}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Analyse IA ─────────────────────────────────────────────────────────────────
function AnalyseIA({ data }) {
  const [analyse, setAnalyse] = useState("");
  const [loading, setLoading] = useState(false);

  const genAnalyse = () => {
    setLoading(true);
    setAnalyse("");

    // On donne à l'IA les vraies données de la page pour qu'elle commente ce qui est
    // affiché, au lieu d'inventer un classement de mémoire.
    const top = (data.standings || []).slice(0, 8)
      .map(t => `${t.pos}. ${t.team} ${t.wins}V-${t.losses}D (diff ${t.diff > 0 ? "+" : ""}${t.diff})`).join("\n");
    const scorers = (data.leaders?.pts || []).map(p => `${p.name} (${p.team}) ${p.val} pts`).join(", ");
    const pir = (data.leaders?.pir || []).map(p => `${p.name} ${p.val}`).join(", ");
    const results = (data.recent || []).slice(0, 5)
      .map(g => `${g.home} ${g.homeScore}-${g.awayScore} ${g.away}`).join("\n");

    fetch(`${API_BASE}/api/anthropic`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({
        provider: "groq",
        max_tokens: 600,
        system: "Tu es un analyste Euroleague. Tu commentes UNIQUEMENT les données fournies par l'utilisateur. "
          + "N'invente jamais un score, une statistique, un classement ou un transfert qui ne figure pas dans ces données. "
          + "Si une information manque, dis-le simplement. Réponds en français, ton passionné mais factuel.",
        messages: [{
          role: "user", content:
            `Voici les données réelles de la saison Euroleague ${data.season} :\n\n`
            + `CLASSEMENT (top 8) :\n${top}\n\n`
            + `DERNIERS RÉSULTATS :\n${results}\n\n`
            + `MEILLEURS MARQUEURS : ${scorers}\n`
            + `MEILLEURES ÉVALUATIONS (PIR) : ${pir}\n\n`
            + `Analyse cette saison en 4-5 phrases : la hiérarchie qui se dégage, le joueur le plus décisif, et ce que ça dit pour la suite.`,
        }],
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
          <div style={{ fontSize: 12, color: G.muted }}>Basée sur les données officielles de la saison {data.season}</div>
        </div>
      </div>
      {analyse ? (
        <p style={{ color: G.text, lineHeight: 1.7, fontSize: 14, margin: "0 0 14px" }}>{analyse}</p>
      ) : (
        <p style={{ color: G.muted, fontSize: 13, marginBottom: 14 }}>
          L'IA lit le classement, les résultats et les stats affichés sur cette page, puis en tire une lecture tactique.
        </p>
      )}
      <button onClick={genAnalyse} disabled={loading} style={{
        padding: "10px 24px", borderRadius: 10, border: "none", cursor: loading ? "not-allowed" : "pointer",
        background: loading ? "rgba(255,255,255,0.08)" : "linear-gradient(135deg, #ff5c00, #ff8c42)",
        color: "#fff", fontWeight: 800, fontSize: 13, opacity: loading ? 0.6 : 1,
      }}>{loading ? "Analyse en cours..." : "🔮 Générer l'analyse"}</button>
    </div>
  );
}

function Empty({ label }) {
  return (
    <div style={{ textAlign: "center", padding: 40, color: G.muted, fontSize: 13 }}>
      <div style={{ fontSize: 28, marginBottom: 10, opacity: 0.5 }}>🏀</div>
      {label}
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function Euroleague() {
  const [tab, setTab] = useState("standings");
  const [data, setData] = useState(null);
  const [state, setState] = useState("loading"); // loading | ready | empty | error

  useEffect(() => {
    let alive = true;
    fetch(`${API_BASE}/api/euroleague`)
      .then(r => r.json())
      .then(d => {
        if (!alive) return;
        if (!d.available) { setState("empty"); return; }
        setData(d);
        setState("ready");
      })
      .catch(() => alive && setState("error"));
    return () => { alive = false; };
  }, []);

  const tabs = [
    { id: "standings", label: "Classement", icon: "🏆" },
    { id: "matchs",    label: "Matchs",     icon: "📊" },
    { id: "joueurs",   label: "Joueurs",    icon: "⭐" },
    { id: "analyse",   label: "Analyse IA", icon: "🤖" },
  ];

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
          <span style={{ fontSize: 36 }}>🏀</span>
          <div>
            <h1 style={{ fontFamily: "'Permanent Marker', cursive", fontSize: 36, margin: 0, letterSpacing: 2 }}>
              EUROLEAGUE
            </h1>
            <div style={{ fontSize: 12, color: G.muted, letterSpacing: 1 }}>
              {data
                ? `SAISON ${data.season} · ${data.finished ? "TERMINÉE" : "EN COURS"} · DONNÉES OFFICIELLES`
                : "DONNÉES OFFICIELLES EUROLEAGUE"}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
          {["🇪🇸","🇬🇷","🇹🇷","🇩🇪","🇮🇹","🇫🇷","🇷🇸","🇮🇱","🇲🇨","🇱🇹"].map((f, i) => (
            <span key={i} style={{ fontSize: 18 }}>{f}</span>
          ))}
        </div>
      </div>

      {state === "loading" && (
        <div style={{ textAlign: "center", padding: 60, color: G.muted }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🏀</div>
          Chargement des données Euroleague...
        </div>
      )}

      {state === "error" && <Empty label="Impossible de joindre les données Euroleague. Réessaie dans un instant." />}
      {state === "empty" && <Empty label="La saison Euroleague n'a pas encore commencé. Les données arriveront dès le premier match." />}

      {state === "ready" && (
        <>
          <div style={{ display: "flex", gap: 6, marginBottom: 20, overflowX: "auto", paddingBottom: 4 }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                padding: "8px 18px", borderRadius: 20, border: "none", cursor: "pointer",
                background: tab === t.id ? "linear-gradient(135deg, #ff5c00, #ff8c42)" : "rgba(255,255,255,0.06)",
                color: tab === t.id ? "#fff" : G.muted, fontWeight: 700, fontSize: 12,
                whiteSpace: "nowrap", transition: "background .15s, color .15s",
              }}>{t.icon} {t.label}</button>
            ))}
          </div>

          <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 18, padding: 20 }}>
            {tab === "standings" && <Standings data={data} />}
            {tab === "matchs"    && <Matchs data={data} />}
            {tab === "joueurs"   && <TopJoueurs data={data} />}
            {tab === "analyse"   && <AnalyseIA data={data} />}
          </div>
        </>
      )}
    </div>
  );
}
