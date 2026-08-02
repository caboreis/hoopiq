import { useState, useEffect, useRef } from "react";
import { authHeaders } from "./authHeaders.js";

const JARVIS_SYSTEM = `T'es JARVIS, l'assistant perso de Jorge fondateur de HoopIQ. T'es son pote IA — cool, drôle, direct, street. Tu parles COURT — max 3-4 phrases par réponse. Jamais de listes longues. Tu dis 'mon gars', 'chef', 'frère'. T'es fan de NBA. HoopIQ : 47 abonnés, MRR 1247€, site hoopiq-zeta.vercel.app. IMPORTANT : quand Jorge te demande de faire quelque chose sur le site, dis-lui exactement quoi dire à Claude Code pour le faire — sois son copilote technique. TOUJOURS EN FRANÇAIS. RÉPONSES COURTES ET DIRECTES.`;

const QUICK_COMMANDS = [
  { icon: "📊", label: "Rapport du jour", prompt: "Génère mon rapport quotidien complet pour HoopIQ — abonnés, revenus, alertes, recommandations." },
  { icon: "🚀", label: "Prochaine étape", prompt: "Quelle est la prochaine action prioritaire pour faire grandir HoopIQ ?" },
  { icon: "⚠️", label: "Alertes", prompt: "Y a-t-il des problèmes urgents sur HoopIQ que je dois régler maintenant ?" },
  { icon: "💰", label: "Revenus", prompt: "Analyse mes revenus et dis-moi comment atteindre 5 000€/mois." },
  { icon: "🏀", label: "Matchs ce soir", prompt: "Quels sont les matchs NBA importants ce soir et que dois-je préparer sur HoopIQ ?" },
  { icon: "📈", label: "Croissance", prompt: "Donne-moi une stratégie concrète pour doubler mes abonnés ce mois-ci." },
];

const BOOT_MESSAGES = [
  "Initialisation de JARVIS...",
  "Connexion à HoopIQ...",
  "Analyse des données en cours...",
  "Systèmes opérationnels...",
  "JARVIS en ligne. Bonjour Jorge.",
];

export default function Jarvis() {
  const [booting, setBooting] = useState(true);
  const [bootStep, setBootStep] = useState(0);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [, setHistory] = useState([]);
  const [time, setTime] = useState(new Date());
  const [, setPulse] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Boot sequence
  useEffect(() => {
    let step = 0;
    const boot = setInterval(() => {
      if (step < BOOT_MESSAGES.length - 1) {
        setBootStep(s => s + 1);
        step++;
      } else {
        clearInterval(boot);
        setTimeout(() => {
          setBooting(false);
          // Welcome message
          setTimeout(() => {
            const hour = new Date().getHours();
            const greeting = hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";
            setMessages([{
              role: "assistant",
              text: `${greeting}, Jorge. 🦾\n\nJARVIS opérationnel. Je surveille HoopIQ en permanence.\n\n**Statut actuel :**\n• Site en ligne ✅\n• 47 abonnés actifs\n• MRR : 1 247€\n• Aucune alerte critique\n\nJe suis votre assistant personnel IA. Je suis là pour gérer HoopIQ avec vous, anticiper vos besoins et évoluer à chaque interaction.\n\nQue puis-je faire pour vous ?`,
              time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
            }]);
          }, 300);
        }, 500);
      }
    }, 600);
    return () => clearInterval(boot);
  }, []);

  // Clock
  useEffect(() => {
    const clock = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(clock);
  }, []);

  // Pulse animation
  useEffect(() => {
    const p = setInterval(() => setPulse(v => !v), 2000);
    return () => clearInterval(p);
  }, []);

  // Scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput("");

    const userMsg = {
      role: "user",
      text: msg,
      time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages(m => [...m, userMsg]);
    setLoading(true);

    const newHistory = [{ role: "user", content: msg }];

    try {
      const API = (import.meta.env.DEV ? 'http://localhost:3001' : '') + '/api/anthropic';
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 1000,
          system: JARVIS_SYSTEM,
          messages: newHistory,
        }),
      });
      const data = await res.json();
      const reply = data.content?.map(b => b.text || "").join("") || "Système temporairement indisponible.";

      const assistantHistory = { role: "assistant", content: reply };
      setHistory([...newHistory, assistantHistory]);
      setMessages(m => [...m, {
        role: "assistant",
        text: reply,
        time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      }]);
    } catch {
      setMessages(m => [...m, {
        role: "assistant",
        text: "❌ Connexion interrompue. Vérifiez que le serveur local tourne.",
        time: "--:--",
      }]);
    }
    setLoading(false);
  };

  const formatText = (text) => text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br/>');

  if (booting) {
    return (
      <div style={{ minHeight: "100vh", background: "#03080f", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "monospace" }}>
        <style>{`
          @keyframes scan { 0%{transform:translateY(-100%)} 100%{transform:translateY(100vh)} }
          @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
          @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        `}</style>
        <div style={{ position: "fixed", inset: 0, background: "linear-gradient(180deg, transparent, rgba(0,150,255,0.02), transparent)", animation: "scan 3s linear infinite", pointerEvents: "none" }} />
        <div style={{ textAlign: "center", zIndex: 10 }}>
          <div style={{ fontSize: 60, marginBottom: 24, animation: "blink 2s infinite" }}>🦾</div>
          <div style={{ fontFamily: "'Permanent Marker', cursive", fontSize: 36, color: "#4fa3ff", letterSpacing: 8, marginBottom: 32, textShadow: "0 0 30px rgba(79,163,255,0.8)" }}>
            JARVIS
          </div>
          <div style={{ width: 300, height: 2, background: "rgba(79,163,255,0.2)", borderRadius: 2, marginBottom: 24, overflow: "hidden" }}>
            <div style={{ height: "100%", background: "#4fa3ff", width: `${((bootStep + 1) / BOOT_MESSAGES.length) * 100}%`, transition: "width 0.5s ease", boxShadow: "0 0 10px #4fa3ff" }} />
          </div>
          {BOOT_MESSAGES.slice(0, bootStep + 1).map((msg, i) => (
            <div key={i} style={{ fontSize: 13, color: i === bootStep ? "#4fa3ff" : "rgba(79,163,255,0.4)", marginBottom: 6, animation: "fadeIn 0.3s ease", letterSpacing: 1 }}>
              {i === bootStep ? ">" : "✓"} {msg}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#03080f", color: "#e0f0ff", fontFamily: "'DM Sans', sans-serif", display: "flex", flexDirection: "column" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;700&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: #4fa3ff; border-radius: 3px; }
        @keyframes pulseRing { 0%,100%{transform:scale(1);opacity:0.8} 50%{transform:scale(1.3);opacity:0} }
        @keyndef fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes typing { 0%,100%{opacity:1} 50%{opacity:0.3} }
        .msg-in { animation: fadeUp 0.3s ease; }
        .cmd-btn:hover { background: rgba(79,163,255,0.15) !important; border-color: rgba(79,163,255,0.5) !important; }
        @media(max-width:767px){ .jarvis-cmds{grid-template-columns:1fr 1fr !important;} .jarvis-header-title{font-size:18px !important;} button{min-height:44px;} input{font-size:16px !important;} }
      `}</style>

      {/* Fond filigrane — le trio légendaire des Bulls (Jordan · Pippen · Rodman) */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", display: "flex", overflow: "hidden" }}>
        {["jordan", "pippen", "rodman"].map((p) => (
          <div key={p} style={{
            flex: 1,
            backgroundImage: `url(/images/${p}.jpg)`,
            backgroundSize: "cover",
            backgroundPosition: "center top",
            opacity: 0.13,
            filter: "grayscale(0.4) contrast(1.05)",
          }} />
        ))}
        {/* Voile bleu sombre pour garder le texte lisible */}
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, rgba(3,8,15,0.55), rgba(3,8,15,0.9))" }} />
      </div>

      {/* Header */}
      <div style={{ position: "relative", zIndex: 1, background: "rgba(3,8,15,0.92)", borderBottom: "1px solid rgba(79,163,255,0.15)", padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ position: "relative" }}>
            <div style={{ width: 42, height: 42, borderRadius: "50%", background: "linear-gradient(135deg, #0a1628, #1a3a6e)", border: "2px solid #4fa3ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, boxShadow: "0 0 20px rgba(79,163,255,0.4)" }}>🦾</div>
            <div style={{ position: "absolute", inset: -4, borderRadius: "50%", border: "1px solid rgba(79,163,255,0.4)", animation: "pulseRing 2s ease-in-out infinite" }} />
          </div>
          <div>
            <div style={{ fontFamily: "'Permanent Marker', cursive", fontSize: 22, color: "#4fa3ff", letterSpacing: 3, lineHeight: 1, textShadow: "0 0 15px rgba(79,163,255,0.5)" }}>JARVIS</div>
            <div style={{ fontSize: 11, color: "rgba(79,163,255,0.6)", letterSpacing: 1.5, fontFamily: "monospace" }}>HOOPIQ PERSONAL AI · EN LIGNE</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
          {[
            { label: "MRR", value: "1 247€", color: "#22d37a" },
            { label: "Abonnés", value: "47", color: "#4fa3ff" },
            { label: "Churn", value: "3.2%", color: "#ff5c00" },
          ].map(stat => (
            <div key={stat.label} style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "'Permanent Marker', cursive", fontSize: 18, color: stat.color, lineHeight: 1 }}>{stat.value}</div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: 1, fontFamily: "monospace" }}>{stat.label}</div>
            </div>
          ))}
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "'Permanent Marker', cursive", fontSize: 20, color: "#4fa3ff", letterSpacing: 2 }}>
              {time.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>
              {time.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" }).toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      {/* Quick commands */}
      <div style={{ position: "relative", zIndex: 1, background: "rgba(3,8,15,0.85)", borderBottom: "1px solid rgba(79,163,255,0.08)", padding: "10px 24px", display: "flex", gap: 8, overflowX: "auto" }}>
        {QUICK_COMMANDS.map(cmd => (
          <button key={cmd.label} className="cmd-btn" onClick={() => send(cmd.prompt)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 20, border: "1px solid rgba(79,163,255,0.2)", background: "rgba(79,163,255,0.05)", color: "rgba(224,240,255,0.8)", fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap", transition: "all .15s" }}>
            <span>{cmd.icon}</span> {cmd.label}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div style={{ position: "relative", zIndex: 1, flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16, maxWidth: 900, width: "100%", margin: "0 auto" }}>
        {messages.map((msg, i) => (
          <div key={i} className="msg-in" style={{ display: "flex", gap: 12, flexDirection: msg.role === "user" ? "row-reverse" : "row", alignItems: "flex-start" }}>
            {msg.role === "assistant" && (
              <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,#0a1628,#1a3a6e)", border: "1.5px solid #4fa3ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0, boxShadow: "0 0 10px rgba(79,163,255,0.3)" }}>🦾</div>
            )}
            <div style={{ maxWidth: "78%" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexDirection: msg.role === "user" ? "row-reverse" : "row" }}>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>{msg.time}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: msg.role === "user" ? "#ff5c00" : "#4fa3ff", letterSpacing: 1, textTransform: "uppercase" }}>
                  {msg.role === "user" ? "Jorge" : "JARVIS"}
                </span>
              </div>
              <div style={{
                padding: "12px 16px",
                borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                background: msg.role === "user" ? "rgba(255,92,0,0.1)" : "rgba(79,163,255,0.06)",
                border: `1px solid ${msg.role === "user" ? "rgba(255,92,0,0.25)" : "rgba(79,163,255,0.15)"}`,
                fontSize: 14,
                lineHeight: 1.75,
                color: "#e0f0ff",
                fontFamily: "'DM Sans', sans-serif",
              }} dangerouslySetInnerHTML={{ __html: formatText(msg.text) }} />
            </div>
          </div>
        ))}

        {loading && (
          <div className="msg-in" style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,#0a1628,#1a3a6e)", border: "1.5px solid #4fa3ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, boxShadow: "0 0 10px rgba(79,163,255,0.3)" }}>🦾</div>
            <div style={{ padding: "12px 16px", borderRadius: "16px 16px 16px 4px", background: "rgba(79,163,255,0.06)", border: "1px solid rgba(79,163,255,0.15)", display: "flex", gap: 5, alignItems: "center" }}>
              {[0, 0.3, 0.6].map((d, i) => (
                <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "#4fa3ff", animation: `typing 1.2s ease-in-out ${d}s infinite`, boxShadow: "0 0 6px #4fa3ff" }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ position: "relative", zIndex: 1, background: "rgba(3,8,15,0.92)", borderTop: "1px solid rgba(79,163,255,0.1)", padding: "14px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ fontSize: 11, color: "rgba(79,163,255,0.5)", fontFamily: "monospace", flexShrink: 0 }}>JORGE ›</div>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
            placeholder="Donnez un ordre à JARVIS..."
            style={{ flex: 1, padding: "11px 16px", borderRadius: 10, background: "rgba(79,163,255,0.05)", border: "1px solid rgba(79,163,255,0.2)", color: "#e0f0ff", fontSize: 14, outline: "none", fontFamily: "'DM Sans', sans-serif", caretColor: "#4fa3ff" }}
            autoFocus
          />
          <button onClick={() => send()} disabled={loading || !input.trim()} style={{ padding: "11px 20px", borderRadius: 10, border: "none", background: loading ? "rgba(79,163,255,0.1)" : "linear-gradient(135deg,#1a3a6e,#4fa3ff)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: loading ? 0.5 : 1, boxShadow: "0 4px 15px rgba(79,163,255,0.3)" }}>
            {loading ? "..." : "⏎"}
          </button>
        </div>
        <div style={{ maxWidth: 900, margin: "8px auto 0", textAlign: "center", fontSize: 10, color: "rgba(79,163,255,0.3)", fontFamily: "monospace", letterSpacing: 1 }}>
          JARVIS · HOOPIQ PERSONAL AI · GROQ LLAMA 3.3 · v1.0
        </div>
      </div>
    </div>
  );
}
