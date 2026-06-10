import { useState } from "react";

const C = {
  bg: "#06060f", bg2: "#0d0d1f",
  surface: "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.07)",
  orange: "#ff5c00", orangeL: "#ff8c42",
  gold: "#f5c842", green: "#22d37a",
  red: "#ff4d6d", blue: "#4fa3ff",
  text: "#f0f0ff", muted: "#6b6b88",
};

const SYSTEM_PROMPT = `Tu es HoopIQ Marketing Agent, un expert en marketing digital spécialisé dans le basket et les SaaS. Tu crées du contenu viral pour HoopIQ, une plateforme IA d'analyse basket.
Tu génères du contenu pour ces plateformes : TikTok, Instagram, Twitter/X, Reddit, Email, YouTube.
Infos sur HoopIQ : SaaS d'analyse basket propulsé par IA (Claude). Vrais joueurs NBA, vrais stats, prédictions en direct. Plans : Scout 9€, Pro 29€, Elite 89€/mois. URL : https://hoopiq-zeta.vercel.app. Spécialité : Chicago Bulls.
Style : français et anglais selon la plateforme, ton jeune et passionné, émojis, hooks viraux. Toujours inclure l'URL et un appel à l'action clair.
Quand tu génères du contenu, donne TOUJOURS : 1. Le texte prêt à copier-coller 2. Le meilleur moment pour poster 3. Les hashtags optimaux 4. Un conseil pour maximiser la portée`;

const TEMPLATES = [
  {
    category: "🎯 Lancement",
    items: [
      { label: "Post TikTok viral", prompt: "Crée un script TikTok viral de 30 secondes pour lancer HoopIQ. Hook accrocheur, montre l'IA analyser les Bulls, appel à l'action fort." },
      { label: "Post Instagram", prompt: "Crée un post Instagram avec caption et hashtags pour annoncer le lancement de HoopIQ. Mets en avant l'IA et les Bulls." },
      { label: "Tweet de lancement", prompt: "Crée 3 tweets percutants pour lancer HoopIQ sur Twitter/X. Maximum 280 caractères chacun." },
      { label: "Post Reddit r/nba", prompt: "Crée un post authentique pour r/nba présentant HoopIQ. Ton communautaire, pas trop commercial." },
    ]
  },
  {
    category: "📧 Email Marketing",
    items: [
      { label: "Email de lancement", prompt: "Écris un email de lancement pour HoopIQ. Objet accrocheur, présentation, offre de lancement, appel à l'action." },
      { label: "Email relance abonnés", prompt: "Écris un email pour convertir les utilisateurs gratuits en abonnés Pro. Mets en avant les fonctionnalités exclusives." },
      { label: "Newsletter hebdo", prompt: "Crée un template de newsletter hebdomadaire HoopIQ avec stats Bulls de la semaine et prédictions IA." },
    ]
  },
  {
    category: "🔥 Contenu Viral",
    items: [
      { label: "Idées TikTok (10)", prompt: "Génère 10 idées de vidéos TikTok virales pour HoopIQ. Chacune avec le concept, le hook et pourquoi ça peut devenir viral." },
      { label: "Stratégie Reddit", prompt: "Crée une stratégie complète pour promouvoir HoopIQ sur Reddit de façon authentique." },
      { label: "Challenge viral", prompt: "Invente un challenge viral lié à HoopIQ et au basket qu'on pourrait lancer sur TikTok/Instagram." },
    ]
  },
  {
    category: "💰 Publicité",
    items: [
      { label: "Pub Meta/Facebook", prompt: "Crée 3 variantes de publicités Meta Ads pour HoopIQ. Titre, description, appel à l'action. Cible : fans NBA 18-35 ans." },
      { label: "Google Ads", prompt: "Crée des annonces Google Ads pour HoopIQ avec les mots-clés principaux et 3 variantes d'annonces." },
      { label: "Budget 50€/mois", prompt: "Crée un plan publicitaire avec 50€/mois de budget pour promouvoir HoopIQ." },
    ]
  },
  {
    category: "🤝 Partenariats",
    items: [
      { label: "Message YouTubeur", prompt: "Écris un message de collaboration pour contacter un YouTubeur basket français." },
      { label: "Pitch investisseur", prompt: "Crée un elevator pitch de 60 secondes pour présenter HoopIQ à un investisseur." },
      { label: "Partenariat club", prompt: "Écris une proposition de partenariat pour un club de basket français." },
    ]
  },
];

export default function Marketing() {
  const [messages, setMessages] = useState([{
    role: "assistant",
    text: "🚀 Salut ! Je suis ton Agent Marketing HoopIQ.\n\nJe génère pour toi :\n• 📱 Posts TikTok / Instagram / Twitter viraux\n• 📧 Emails qui convertissent\n• 🎯 Pubs Facebook/Google optimisées\n• 🤝 Messages de partenariat\n\nClique sur un template à gauche ou pose ta question !"
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(null);

  const send = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput("");
    setMessages(m => [...m, { role: "user", text: msg }]);
    setLoading(true);
    try {
      const res = await fetch("http://localhost:3001/api/anthropic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: msg }],
        }),
      });
      const data = await res.json();
      const reply = data.content?.map(b => b.text || "").join("") || "Erreur de réponse.";
      setMessages(m => [...m, { role: "assistant", text: reply }]);
    } catch {
      setMessages(m => [...m, { role: "assistant", text: "❌ Erreur de connexion." }]);
    }
    setLoading(false);
  };

  const copyText = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div style={{ display: "flex", height: "calc(100vh - 62px)", background: C.bg, color: C.text, fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
        .tmpl-btn:hover { background: rgba(255,92,0,0.08) !important; color: #ff5c00 !important; }
        .msg-in { animation: fadeUp .3s ease; }
      `}</style>

      {/* SIDEBAR */}
      <div style={{ width: 240, background: C.bg2, borderRight: `1px solid ${C.border}`, overflowY: "auto", padding: 16, flexShrink: 0 }}>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2, color: C.orange, textTransform: "uppercase", marginBottom: 16 }}>Templates rapides</div>
        {TEMPLATES.map(cat => (
          <div key={cat.category} style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 8, fontWeight: 600 }}>{cat.category}</div>
            {cat.items.map(item => (
              <button key={item.label} className="tmpl-btn" onClick={() => send(item.prompt)} style={{
                width: "100%", textAlign: "left", padding: "8px 10px", borderRadius: 8,
                border: "none", background: "transparent", color: C.text,
                fontSize: 12, cursor: "pointer", marginBottom: 2,
                transition: "all .15s", lineHeight: 1.4,
              }}>
                {item.label} ↗
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* CHAT */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div style={{ background: C.bg2, borderBottom: `1px solid ${C.border}`, padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,92,0,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🚀</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>HoopIQ Marketing Agent</div>
              <div style={{ fontSize: 11, color: C.green }}>● Propulsé par Groq · Llama 3.3</div>
            </div>
          </div>
          <a href="https://hoopiq-zeta.vercel.app" target="_blank" rel="noreferrer" style={{ fontSize: 12, color: C.blue, textDecoration: "none", padding: "6px 12px", border: `1px solid rgba(79,163,255,0.3)`, borderRadius: 8 }}>
            🌍 Voir le site →
          </a>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
          {messages.map((m, i) => (
            <div key={i} className="msg-in" style={{ display: "flex", flexDirection: m.role === "user" ? "row-reverse" : "row", gap: 10, alignItems: "flex-start" }}>
              {m.role === "assistant" && (
                <div style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(255,92,0,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>🚀</div>
              )}
              <div style={{ maxWidth: "78%" }}>
                <div style={{
                  padding: "11px 15px", fontSize: 13, lineHeight: 1.75, whiteSpace: "pre-wrap",
                  borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                  background: m.role === "user" ? "rgba(255,92,0,0.15)" : C.surface,
                  border: m.role === "user" ? "none" : `1px solid ${C.border}`,
                  color: C.text,
                }}>{m.text}</div>
                {m.role === "assistant" && m.text.length > 50 && (
                  <button onClick={() => copyText(m.text, i)} style={{ marginTop: 6, padding: "4px 10px", borderRadius: 6, border: `1px solid ${C.border}`, background: copied === i ? "rgba(34,211,122,0.15)" : C.surface, color: copied === i ? C.green : C.muted, fontSize: 11, cursor: "pointer" }}>
                    {copied === i ? "✓ Copié !" : "📋 Copier"}
                  </button>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(255,92,0,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>🚀</div>
              <div style={{ padding: "11px 15px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: "16px 16px 16px 4px", color: C.orange, fontSize: 18, animation: "blink 1.2s infinite", letterSpacing: 4 }}>• • •</div>
            </div>
          )}
        </div>

        {/* Input */}
        <div style={{ background: C.bg2, borderTop: `1px solid ${C.border}`, padding: "12px 20px", display: "flex", gap: 10 }}>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()}
            placeholder="Ex: Crée un post TikTok viral pour les Bulls..."
            style={{ flex: 1, padding: "11px 16px", borderRadius: 10, background: C.surface, border: `1px solid ${C.border}`, color: C.text, fontSize: 13, outline: "none", fontFamily: "inherit" }} />
          <button onClick={() => send()} disabled={loading || !input.trim()} style={{ padding: "11px 20px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#ff5c00,#ff8c42)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
            Générer →
          </button>
        </div>
      </div>
    </div>
  );
}
