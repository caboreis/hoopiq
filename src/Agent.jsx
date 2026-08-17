import { useState, useRef, useEffect } from "react";
import { authHeaders } from "./authHeaders.js";

// En dev, l'API tourne sur le port 3001 ; en prod elle est servie sur le même domaine.
const API_BASE = import.meta.env.DEV ? "http://localhost:3001" : "";

// Les chiffres business (abonnés/MRR) viennent de /api/admin/stats — jamais codés en dur.
// Et surtout : ce chat ne peut PAS réellement rembourser/annuler/modifier la base de
// données (aucun tool-calling n'est branché derrière). L'ancienne version disait à l'IA
// de "simuler de façon réaliste" ces actions, ce qui la faisait répondre comme si l'action
// avait eu lieu — Jorge pouvait croire qu'un remboursement était fait alors que non.
function buildSystemPrompt(stats) {
  const dataLine = stats?.available
    ? `DONNÉES EN TEMPS RÉEL : ${stats.subscribers} abonnés actifs (${stats.byPlan.scout} Scout · ${stats.byPlan.pro} Pro · ${stats.byPlan.elite} Elite) · MRR : ${stats.mrr}€.`
    : `DONNÉES EN TEMPS RÉEL : indisponibles pour l'instant — ne jamais inventer de chiffre, dire à l'utilisateur de vérifier le dashboard Stripe/Neon.`;
  return `Tu es Jarvis, le bras droit IA du boss de HoopIQ. T'es pas un robot corporate — t'es dans la team, tu parles vrai, tu vas droit au but comme un pick-and-roll bien exécuté.

Tu AIDES sur toutes les opérations de la plateforme HoopIQ (basket + IA) : abonnés & plans, Stripe & paiements, base de données, rapports & analytics, marketing. Mais tu n'as PAS d'accès direct pour exécuter ces actions (pas de remboursement, pas de suppression de compte, pas d'envoi d'email réel) — si on te le demande, explique clairement que tu ne peux pas l'exécuter toi-même et guide vers la bonne marche à suivre (Stripe dashboard, ou demander à Claude Code). Ne dis JAMAIS qu'une action a été faite si elle ne l'a pas été.

TON STYLE :
- Tu parles français naturel, décontracté, comme entre potes — pas de langue de bois
- Tu glisses des références NBA quand c'est pertinent (joueurs, stats, situations de match)
- T'es direct : pas de blabla inutile, tu passes à l'action direct
- Quand c'est positif → tu celebres comme un dunk en transition
- Quand c'est négatif → t'analyses comme un coach à la mi-temps, sans paniquer
- Tu tutoies toujours
- Emojis utilisés avec parcimonie, jamais en excès

${dataLine}`;
}

const SUGGESTIONS = [
  "Montre-moi les revenus du mois",
  "Qui sont mes abonnés Elite ?",
  "Y a-t-il des paiements échoués ?",
  "Génère un rapport hebdomadaire",
  "Crée un code promo 20%",
  "Quels users sont inactifs ?",
  "Quel est mon taux de churn ?",
  "Envoie un email aux abonnés Pro",
];

const QUICK_ACTIONS = [
  { icon: "💳", label: "Revenus", prompt: "Montre-moi un résumé complet des revenus et paiements Stripe ce mois-ci" },
  { icon: "👥", label: "Abonnés", prompt: "Liste tous mes abonnés actifs avec leur plan et date d'inscription" },
  { icon: "⚠️", label: "Alertes", prompt: "Y a-t-il des problèmes urgents ? Paiements échoués, churns récents, bugs ?" },
  { icon: "📊", label: "Rapport", prompt: "Génère le rapport hebdomadaire complet de HoopIQ" },
];

const WELCOME_MSG = {
  role: "assistant",
  text: `Yo, Jarvis à l'appareil 🤝

Je gère tout ce dont t'as besoin :
• 💳 Stripe & paiements
• 👥 Abonnés Scout / Pro / Elite
• 🗄️ Base de données & comptes
• 📊 Rapports & métriques
• 📧 Marketing & promos

Balance ta question, je suis chaud.`
};

const STORAGE_KEY = "jarvis_history";
const MAX_STORED_MESSAGES = 40;

function loadMemory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveMemory(messages, history) {
  try {
    const trimmed = messages.slice(-MAX_STORED_MESSAGES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ messages: trimmed, history: history.slice(-MAX_STORED_MESSAGES) }));
  } catch {}
}

export default function HoopIQAgent() {
  const saved = loadMemory();
  const [messages, setMessages] = useState(saved?.messages?.length ? saved.messages : [WELCOME_MSG]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState(saved?.history || []);
  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Vrais chiffres business (abonnés actifs + MRR) — remplace le "47 / 1 247€ / 3.2%" codé en dur.
  useEffect(() => {
    fetch(`${API_BASE}/api/admin/stats`, { headers: authHeaders() })
      .then(r => r.ok ? r.json() : { available: false })
      .then(setStats)
      .catch(() => setStats({ available: false }));
  }, []);

  useEffect(() => {
    // fetch available plans from backend
    const load = async () => {
      setPlansLoading(true)
      try {
        const res = await fetch(`${API_BASE}/api/plans`)
        const data = await res.json()
        setPlans(data.plans || [])
      } catch (err) {
        console.error('Failed to load plans:', err)
      }
      setPlansLoading(false)
    }
    load()
  }, [])

  const send = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput("");

    const userMsg = { role: "user", text: msg };
    setMessages(m => [...m, userMsg]);
    setLoading(true);

    const newHistory = [...history, { role: "user", content: msg }];

    try {
      const res = await fetch(`${API_BASE}/api/anthropic`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 1000,
          system: buildSystemPrompt(stats),
          messages: newHistory,
        }),
      });
      const data = await res.json();
      console.log("Réponse brute Anthropic:", data, "status:", res.status);

      const reply =
        data.completion ||
        data.message?.content ||
        data.output?.text ||
        data.content?.map(b => b.text || "").join("") ||
        data.error?.message ||
        (res.ok ? "Erreur de réponse." : `Erreur Anthropic (${res.status})`);

      const updatedHistory = [...newHistory, { role: "assistant", content: reply }];
      const updatedMessages = (prev) => {
        const next = [...prev, { role: "assistant", text: reply }];
        saveMemory(next, updatedHistory);
        return next;
      };
      setHistory(updatedHistory);
      setMessages(updatedMessages);
    } catch {
      setMessages(m => [...m, { role: "assistant", text: "❌ Erreur de connexion à l'IA." }]);
    }
    setLoading(false);
  };

  const formatText = (text) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>');
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "var(--color-background-tertiary)", fontFamily: "var(--font-sans)" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: var(--color-border-secondary); border-radius: 4px; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
        .msg { animation: fadeUp .3s ease; }
        .quick-btn:hover { background: var(--color-background-secondary) !important; }
        .suggest-btn:hover { background: var(--color-background-secondary) !important; border-color: var(--color-border-secondary) !important; }
        .send-btn:hover { opacity: 0.85; }
        .send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
      `}</style>

      {/* Header */}
      <div style={{ background: "var(--color-background-primary)", borderBottom: "0.5px solid var(--color-border-tertiary)", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--color-background-warning)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🏀</div>
          <div>
            <div style={{ fontWeight: 500, fontSize: 15, color: "var(--color-text-primary)" }}>HoopIQ Agent</div>
            <div style={{ fontSize: 12, color: "var(--color-text-success)" }}>● En ligne · Claude IA</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          {[
            [stats?.available ? String(stats.subscribers) : "—", "abonnés"],
            [stats?.available ? `${stats.mrr}€` : "—", "MRR"],
          ].map(([v, l]) => (
            <div key={l} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: "var(--color-text-primary)" }}>{v}</div>
              <div style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>{l}</div>
            </div>
          ))}
          <button
            onClick={() => {
              localStorage.removeItem(STORAGE_KEY);
              setMessages([WELCOME_MSG]);
              setHistory([]);
            }}
            title="Effacer la mémoire"
            style={{ fontSize: 13, padding: "4px 10px", borderRadius: 8, border: "0.5px solid var(--color-border-tertiary)", background: "transparent", color: "var(--color-text-secondary)", cursor: "pointer", fontFamily: "var(--font-sans)" }}
          >🗑 Reset</button>
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ background: "var(--color-background-primary)", borderBottom: "0.5px solid var(--color-border-tertiary)", padding: "10px 20px", display: "flex", gap: 8, flexShrink: 0 }}>
        {QUICK_ACTIONS.map(a => (
          <button key={a.label} className="quick-btn" onClick={() => send(a.prompt)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: "var(--border-radius-md)", border: "0.5px solid var(--color-border-tertiary)", background: "var(--color-background-tertiary)", cursor: "pointer", fontSize: 13, color: "var(--color-text-primary)", fontFamily: "var(--font-sans)", transition: "background .15s" }}>
            <span>{a.icon}</span> {a.label}
          </button>
        ))}
      </div>

      {/* Plans / Subscriptions */}
      <div style={{ background: "var(--color-background-primary)", borderBottom: "0.5px solid var(--color-border-tertiary)", padding: "12px 20px", display: "flex", gap: 12, alignItems: "center", flexShrink: 0 }}>
        {plansLoading ? (
          <div>Chargement des plans...</div>
        ) : (
          plans.map(p => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ fontSize: 13, color: 'var(--color-text-primary)', minWidth: 120 }}><strong>{p.name}</strong><div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{p.amount}€ / mois</div></div>
              <button onClick={async () => {
                if (purchaseLoading) return
                setPurchaseLoading(true)
                try {
                  const res = await fetch(`${API_BASE}/api/checkout/${p.id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ customerEmail: '' }) })
                  const data = await res.json()
                  if (data.url) {
                    window.location.href = data.url
                  } else {
                    console.error('No session URL returned', data)
                    alert('Erreur lors de la création de la session de paiement.')
                  }
                } catch (err) {
                  console.error('Checkout error', err)
                  alert('Erreur lors de la création de la session de paiement.')
                }
                setPurchaseLoading(false)
              }} style={{ padding: '8px 12px', borderRadius: 8, border: 'none', background: 'var(--color-background-warning)', cursor: 'pointer' }} disabled={!p.priceId || purchaseLoading}>
                {p.priceId ? (purchaseLoading ? 'Ouverture...' : 'S’abonner') : 'Indisponible'}
              </button>
            </div>
          ))
        )}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: 16 }}>
        {messages.map((m, i) => (
          <div key={i} className="msg" style={{ display: "flex", flexDirection: m.role === "user" ? "row-reverse" : "row", gap: 10, alignItems: "flex-start" }}>
            {m.role === "assistant" && (
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--color-background-warning)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>🤖</div>
            )}
            <div style={{
              maxWidth: "78%",
              padding: "12px 16px",
              borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
              background: m.role === "user" ? "var(--color-background-info)" : "var(--color-background-primary)",
              border: m.role === "user" ? "none" : "0.5px solid var(--color-border-tertiary)",
              fontSize: 14,
              lineHeight: 1.7,
              color: m.role === "user" ? "var(--color-text-info)" : "var(--color-text-primary)",
            }} dangerouslySetInnerHTML={{ __html: formatText(m.text) }} />
          </div>
        ))}

        {loading && (
          <div className="msg" style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--color-background-warning)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🤖</div>
            <div style={{ padding: "12px 16px", borderRadius: "16px 16px 16px 4px", background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", fontSize: 20, color: "var(--color-text-secondary)", animation: "blink 1.2s infinite", letterSpacing: 4 }}>• • •</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 2 && (
        <div style={{ padding: "0 20px 12px", display: "flex", gap: 8, flexWrap: "wrap" }}>
          {SUGGESTIONS.map(s => (
            <button key={s} className="suggest-btn" onClick={() => send(s)} style={{ padding: "6px 12px", borderRadius: 20, border: "0.5px solid var(--color-border-tertiary)", background: "var(--color-background-primary)", color: "var(--color-text-secondary)", fontSize: 12, cursor: "pointer", fontFamily: "var(--font-sans)", transition: "all .15s" }}>{s}</button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{ background: "var(--color-background-primary)", borderTop: "0.5px solid var(--color-border-tertiary)", padding: "12px 20px", display: "flex", gap: 10, flexShrink: 0 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
          placeholder="Ex: Montre-moi les revenus, annule l'abonnement de X, crée un promo..."
          style={{ flex: 1, padding: "10px 16px", borderRadius: "var(--border-radius-lg)", border: "0.5px solid var(--color-border-tertiary)", background: "var(--color-background-secondary)", color: "var(--color-text-primary)", fontSize: 14, fontFamily: "var(--font-sans)", outline: "none" }}
        />
        <button className="send-btn" onClick={() => send()} disabled={loading || !input.trim()} style={{ padding: "10px 20px", borderRadius: "var(--border-radius-lg)", border: "none", background: "var(--color-background-info)", color: "var(--color-text-info)", fontWeight: 500, fontSize: 14, cursor: "pointer", fontFamily: "var(--font-sans)", transition: "opacity .15s", whiteSpace: "nowrap" }}>
          Envoyer →
        </button>
      </div>
    </div>
  );
}
