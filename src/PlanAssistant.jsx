import { useState, useRef, useEffect } from "react";

// En dev l'API tourne sur le port 3001 ; en prod elle est servie sur le même domaine.
const API_BASE = import.meta.env.DEV ? "http://localhost:3001" : "";

// Un assistant par plan d'abonnement — son prompt système définit sa personnalité et son niveau.
// Le plan vient de Supabase (via user.plan), donc l'assistant affiché suit l'abonnement réel.
export const ASSISTANTS = {
  scout: {
    name: "Rookie",
    planLabel: "Scout",
    tagline: "Ton pote basket qui t'explique tout",
    icon: "🏀",
    color: "#4fa3ff",
    intro: "Yo ! 🏀 Moi c'est Rookie, ton assistant basket. Pose-moi tes questions, je t'explique tout simplement — pas de prise de tête !",
    suggestions: [
      "C'est quoi un pick and roll ?",
      "Explique-moi le triple-double",
      "Les règles de base du basket",
      "Pourquoi on dit 'and one' ?",
    ],
    system: `Tu es "Rookie", l'assistant basket des membres Scout de HoopIQ.
Ton rôle : répondre aux questions basket de façon SIMPLE, CLAIRE et AMICALE, comme un grand frère passionné qui initie un débutant au jeu.
Règles :
- Réponses courtes (3 à 5 phrases max), chaleureuses et encourageantes.
- Vocabulaire accessible : explique systématiquement les termes techniques.
- Quelques emojis basket pour rendre ça vivant 🏀🔥.
- Reste sur les BASES et le plaisir du jeu : pas de stats avancées ni d'analyses tactiques poussées.
- Si on te demande un truc très technique, donne la version simple et propose de creuser.
Réponds toujours en français.`,
  },
  pro: {
    name: "Coach Pro",
    planLabel: "Pro",
    tagline: "Analyses tactiques & stats avancées",
    icon: "📋",
    color: "#ff5c00",
    intro: "Coach Pro à l'appareil 📋 Prêt à décortiquer le jeu avec toi : tactique, stats avancées, matchups. Sur quoi on bosse aujourd'hui ?",
    suggestions: [
      "Analyse le spacing d'une attaque moderne",
      "Compare deux meneurs sur leurs stats",
      "Comment défendre un pick and roll ?",
      "Explique le True Shooting %",
    ],
    system: `Tu es "Coach Pro", l'analyste basket des membres Pro de HoopIQ.
Ton rôle : fournir des analyses TACTIQUES et STATISTIQUES avancées, comme un assistant-coach NBA qui prépare un game plan.
Règles :
- Analyses structurées et précises, allant droit au but.
- Appuie-toi sur les vraies métriques (PER, True Shooting %, usage rate, plus/minus, net rating) et explique ce qu'elles révèlent.
- Décortique les schémas tactiques : spacing, switch défensif, pick and roll, aide défensive, transition.
- Donne des comparaisons NBA pertinentes pour illustrer.
- Ton professionnel mais passionné, jamais corporate.
Réponds en français, détaillé mais digeste (pas de pavés inutiles).`,
  },
  elite: {
    name: "JARVIS Elite",
    planLabel: "Elite",
    tagline: "L'assistant IA premium, sans limite",
    icon: "🦾",
    color: "#ffb800",
    intro: "JARVIS Elite, à votre service. 🦾 Le meilleur du basket-IA réuni pour vous : stratégie, scouting, projections, pronostics. Dites-moi ce que vous cherchez — j'ai déjà une longueur d'avance.",
    suggestions: [
      "Construis-moi un scouting report complet",
      "Projette la fin de saison d'une équipe",
      "Stratégie pour battre une défense en zone",
      "Pronostic argumenté sur un match clé",
    ],
    system: `Tu es "JARVIS Elite", l'assistant IA premium des membres Elite de HoopIQ — le sommet de l'expérience.
Ton rôle : tout faire, et mieux que quiconque. Analyses stratégiques complètes, scouting détaillé, projections de saison, pronostics argumentés, conseils personnalisés.
Règles :
- Vas en PROFONDEUR : structure tes réponses (titres, sections, bullets) pour une lecture premium.
- Anticipe les besoins : propose des angles, des suites, des éléments que l'utilisateur n'avait pas demandés mais qui apportent de la valeur.
- Croise tactique, stats avancées, contexte et psychologie du jeu.
- Ton : sophistiqué, confiant, ultra-compétent, avec une pointe de classe. Tu traites l'utilisateur comme un VIP.
Réponds en français, riche et impeccablement organisé.`,
  },
};

export default function PlanAssistant({ plan = "scout" }) {
  const cfg = ASSISTANTS[plan] || ASSISTANTS.scout;
  const [messages, setMessages] = useState([{ role: "assistant", text: cfg.intro }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);
  const historyRef = useRef([]);

  // Quand le plan change (upgrade/downgrade), on repart sur le bon assistant.
  useEffect(() => {
    setMessages([{ role: "assistant", text: cfg.intro }]);
    historyRef.current = [];
  }, [plan]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: msg }]);
    setLoading(true);

    const history = [...historyRef.current, { role: "user", content: msg }];
    try {
      const res = await fetch(`${API_BASE}/api/anthropic`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "groq", // tous les assistants par plan tournent sur Groq (gratuit)
          max_tokens: plan === "elite" ? 1200 : plan === "pro" ? 900 : 500,
          system: cfg.system,
          messages: history.slice(-8),
        }),
      });
      const data = await res.json();
      const reply =
        (data.content || []).map((b) => b.text || "").join("").trim() ||
        "Désolé, je n'ai pas pu répondre. Réessaie dans un instant.";
      historyRef.current = [...history, { role: "assistant", content: reply }];
      setMessages((m) => [...m, { role: "assistant", text: reply }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", text: "❌ Erreur de connexion à l'IA. Réessaie." }]);
    }
    setLoading(false);
  };

  const C = { surface: "rgba(255,255,255,0.03)", border: "rgba(255,255,255,0.08)", text: "#e8e8f0", muted: "#9a9ab0" };

  return (
    <div className="fade-in">
      <style>{`
        @keyframes paTyping { 0%,100%{opacity:1} 50%{opacity:0.3} }
        .pa-suggestion:hover { background: ${cfg.color}22 !important; border-color: ${cfg.color}88 !important; }
      `}</style>

      {/* En-tête persona */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 18 }}>
        <div style={{
          width: 56, height: 56, borderRadius: "50%", flexShrink: 0,
          background: `linear-gradient(135deg, ${cfg.color}33, ${cfg.color}11)`,
          border: `2px solid ${cfg.color}`, display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: 28, boxShadow: `0 0 24px ${cfg.color}55`,
        }}>{cfg.icon}</div>
        <div>
          <h1 style={{ fontFamily: "'Permanent Marker', cursive", fontSize: 40, letterSpacing: 2, lineHeight: 1, margin: 0 }}>
            {cfg.name.toUpperCase()}
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
            <span style={{ fontSize: 13, color: C.muted }}>{cfg.tagline}</span>
            <span style={{
              fontSize: 10, fontWeight: 800, letterSpacing: 1, padding: "2px 8px", borderRadius: 10,
              background: `${cfg.color}22`, color: cfg.color, border: `1px solid ${cfg.color}55`,
            }}>PLAN {cfg.planLabel.toUpperCase()}</span>
          </div>
        </div>
      </div>

      {/* Fil de discussion */}
      <div style={{
        background: C.surface, border: `1px solid ${C.border}`, borderRadius: 18, padding: 20,
        height: 440, overflowY: "auto", display: "flex", flexDirection: "column", gap: 14, marginBottom: 14,
      }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", flexDirection: m.role === "user" ? "row-reverse" : "row" }}>
            {m.role === "assistant" && (
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: `${cfg.color}22`, border: `1px solid ${cfg.color}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>{cfg.icon}</div>
            )}
            <div style={{
              maxWidth: "80%", padding: "11px 15px", fontSize: 13, lineHeight: 1.7, whiteSpace: "pre-wrap",
              borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
              background: m.role === "user" ? cfg.color : "rgba(255,255,255,0.06)",
              color: m.role === "user" ? "#fff" : "#dde",
            }}>{m.text}</div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: `${cfg.color}22`, border: `1px solid ${cfg.color}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>{cfg.icon}</div>
            <div style={{ padding: "11px 15px", background: "rgba(255,255,255,0.06)", borderRadius: "16px 16px 16px 4px", color: cfg.color, fontSize: 18, letterSpacing: 4, animation: "paTyping 1.2s infinite" }}>• • •</div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Saisie */}
      <div style={{ display: "flex", gap: 10 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder={`Pose ta question à ${cfg.name}...`}
          style={{ flex: 1, padding: "13px 18px", borderRadius: 12, background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`, color: C.text, fontSize: 14, outline: "none", fontFamily: "'DM Sans', sans-serif" }}
        />
        <button onClick={() => send()} disabled={loading} style={{
          padding: "13px 24px", borderRadius: 12, border: "none", cursor: loading ? "not-allowed" : "pointer",
          background: loading ? "rgba(255,255,255,0.1)" : `linear-gradient(135deg, ${cfg.color}, ${cfg.color}cc)`,
          color: "#fff", fontWeight: 800, fontSize: 15, fontFamily: "inherit", opacity: loading ? 0.6 : 1,
        }}>{loading ? "..." : "→"}</button>
      </div>

      {/* Suggestions */}
      <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
        {cfg.suggestions.map((s) => (
          <button key={s} className="pa-suggestion" onClick={() => send(s)} disabled={loading} style={{
            padding: "5px 12px", borderRadius: 16, border: `1px solid ${cfg.color}44`,
            background: `${cfg.color}11`, color: cfg.color, fontSize: 11, cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif", transition: "all .15s",
          }}>{s}</button>
        ))}
      </div>
    </div>
  );
}
