import { useState, useEffect, useRef } from "react";
import Agent from "./Agent.jsx";
import Marketing from "./Marketing.jsx";

/* ─────────────────────────────────────────
   DESIGN SYSTEM
───────────────────────────────────────── */
const C = {
  bg: "#06060f",
  bg2: "#0d0d1f",
  surface: "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.07)",
  orange: "#ff5c00",
  orangeL: "#ff8c42",
  gold: "#f5c842",
  green: "#22d37a",
  red: "#ff4d6d",
  blue: "#4fa3ff",
  text: "#f0f0ff",
  muted: "#6b6b88",
};

const G = {
  orange: `linear-gradient(135deg, ${C.orange}, ${C.orangeL})`,
  gold: `linear-gradient(135deg, #f5c842, #ffaa00)`,
  dark: `linear-gradient(160deg, #0d0d1f 0%, #06060f 100%)`,
  glow: `radial-gradient(ellipse 60% 40% at 50% 0%, rgba(255,92,0,0.18) 0%, transparent 70%)`,
};

/* ─────────────────────────────────────────
   DATA
───────────────────────────────────────── */
const PLANS = [
  {
    id: "scout",
    name: "Scout",
    price: "9",
    period: "/ mois",
    color: C.blue,
    icon: "🔭",
    desc: "Pour les fans passionnés",
    features: ["5 analyses joueurs / mois", "Résultats en temps réel", "Stats de base", "1 ligue au choix"],
    locked: ["IA Chat illimité", "Prédictions avancées", "Export PDF", "API Access"],
  },
  {
    id: "pro",
    name: "Pro",
    price: "29",
    period: "/ mois",
    color: C.orange,
    icon: "⚡",
    desc: "Pour les analystes sérieux",
    popular: true,
    features: ["Analyses joueurs illimitées", "IA Chat 24/7", "Prédictions IA avancées", "Toutes les ligues", "Export PDF & Excel"],
    locked: ["API Access", "Accès équipe (5 users)"],
  },
  {
    id: "elite",
    name: "Elite",
    price: "89",
    period: "/ mois",
    color: C.gold,
    icon: "👑",
    desc: "Pour les clubs & agences",
    features: ["Tout le plan Pro", "API Access complète", "Équipe jusqu'à 20 users", "Dashboard personnalisé", "Support prioritaire 24/7", "Rapports automatisés"],
    locked: [],
  },
];

const PLAYERS = [
  { id: 1, name: "Marcus Johnson", pos: "PG", team: "Paris Bulls", pts: 24.3, ast: 8.1, reb: 4.2, fg: 47, score: 92, trend: +3, hot: true },
  { id: 2, name: "Léo Dubois", pos: "SF", team: "Lyon Hawks", pts: 19.8, ast: 3.4, reb: 7.6, fg: 51, score: 87, trend: +1, hot: false },
  { id: 3, name: "Kevin Tran", pos: "C", team: "Paris Bulls", pts: 15.2, ast: 1.8, reb: 11.3, fg: 58, score: 84, trend: -2, hot: false },
  { id: 4, name: "Antoine Moreau", pos: "SG", team: "Marseille Jets", pts: 22.1, ast: 4.9, reb: 3.1, fg: 44, score: 81, trend: +5, hot: true },
  { id: 5, name: "Yann Forestier", pos: "PF", team: "Bordeaux Lions", pts: 17.6, ast: 2.2, reb: 9.8, fg: 53, score: 79, trend: +2, hot: false },
];

const MATCHES = [
  { id: 1, home: "Paris Bulls", away: "Lyon Hawks", hs: 98, as: 87, date: "04 Jun", done: true, mvp: "Marcus Johnson", pred: 72 },
  { id: 2, home: "Marseille Jets", away: "Paris Bulls", hs: 72, as: 91, date: "01 Jun", done: true, mvp: "Kevin Tran", pred: 55 },
  { id: 3, home: "Lyon Hawks", away: "Bordeaux Lions", hs: null, as: null, date: "10 Jun", done: false, pred: 67 },
  { id: 4, home: "Paris Bulls", away: "Marseille Jets", hs: null, as: null, date: "14 Jun", done: false, pred: 81 },
];

/* ─────────────────────────────────────────
   UTILS / ATOMS
───────────────────────────────────────── */
const px = (obj) => Object.entries(obj).map(([k, v]) => `${k}:${v}`).join(";");

function Avatar({ name, size = 44, glow }) {
  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: G.orange, display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Bebas Neue', cursive", fontSize: size * 0.36, color: "#fff", letterSpacing: 1,
      boxShadow: glow ? `0 0 24px rgba(255,92,0,0.55)` : `0 2px 10px rgba(0,0,0,0.5)`,
    }}>{initials}</div>
  );
}

function Badge({ children, color = C.orange }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 800, padding: "2px 9px", borderRadius: 20,
      background: `${color}22`, color, border: `1px solid ${color}44`,
      letterSpacing: 1.2, textTransform: "uppercase", fontFamily: "monospace",
    }}>{children}</span>
  );
}

function Ring({ score, size = 68 }) {
  const r = size / 2 - 6, c = 2 * Math.PI * r;
  const col = score >= 90 ? C.orange : score >= 80 ? C.gold : C.green;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={5} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={col} strokeWidth={5}
        strokeDasharray={c} strokeDashoffset={c * (1 - score / 100)} strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 1.3s cubic-bezier(.4,0,.2,1)" }} />
      <text x={size / 2} y={size / 2 + 5} textAnchor="middle" fill="#fff"
        fontSize={size * 0.22} fontWeight={800} fontFamily="'Bebas Neue', cursive"
        style={{ transform: `rotate(90deg)`, transformOrigin: `${size / 2}px ${size / 2}px` }}>{score}</text>
    </svg>
  );
}

function Bar({ value, max = 100, color = C.orange }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 4, height: 5, overflow: "hidden" }}>
      <div style={{ width: `${Math.min(100, (value / max) * 100)}%`, height: "100%", background: color, borderRadius: 4, transition: "width 1s ease" }} />
    </div>
  );
}

function Btn({ children, onClick, variant = "primary", small, full, disabled, style: sx }) {
  const base = {
    border: "none", cursor: disabled ? "not-allowed" : "pointer", fontWeight: 700,
    borderRadius: 10, transition: "all .2s", fontFamily: "inherit",
    padding: small ? "8px 18px" : "13px 28px", fontSize: small ? 13 : 15,
    width: full ? "100%" : undefined, opacity: disabled ? 0.5 : 1,
  };
  const variants = {
    primary: { background: G.orange, color: "#fff", boxShadow: `0 4px 20px rgba(255,92,0,0.35)` },
    ghost: { background: "rgba(255,255,255,0.06)", color: C.text, border: `1px solid ${C.border}` },
    outline: { background: "transparent", color: C.orange, border: `1px solid ${C.orange}` },
    gold: { background: G.gold, color: "#1a0e00", boxShadow: `0 4px 20px rgba(245,200,66,0.35)` },
  };
  return <button style={{ ...base, ...variants[variant], ...sx }} onClick={onClick} disabled={disabled}>{children}</button>;
}

function Card({ children, style: sx, glow }) {
  return (
    <div style={{
      background: C.surface, border: `1px solid ${glow ? "rgba(255,92,0,0.3)" : C.border}`,
      borderRadius: 18, padding: 24, backdropFilter: "blur(12px)",
      boxShadow: glow ? `0 0 40px rgba(255,92,0,0.08)` : "none",
      ...sx,
    }}>{children}</div>
  );
}

function SectionTitle({ children }) {
  return <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2.5, color: C.orange, textTransform: "uppercase", marginBottom: 18, fontFamily: "monospace" }}>{children}</div>;
}

/* ─────────────────────────────────────────
   LANDING PAGE
───────────────────────────────────────── */
function Landing({ onAuth }) {
  const [hovered, setHovered] = useState(null);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${C.bg}; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: ${C.orange}; border-radius: 4px; }
        @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @keyframes pulse-ring { 0% { transform: scale(1); opacity:.8; } 100% { transform: scale(1.5); opacity:0; } }
        @keyframes slide-up { from { opacity:0; transform:translateY(30px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        .plan-card:hover { transform: translateY(-6px) !important; }
        .glow-btn:hover { box-shadow: 0 8px 40px rgba(255,92,0,0.6) !important; transform:translateY(-2px); }
        .fade-in { animation: slide-up .7s ease both; }
      `}</style>

      {/* NAV */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 200, padding: "0 40px", height: 66, display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(6,6,15,0.85)", backdropFilter: "blur(24px)", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 26, background: G.orange, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: 3 }}>HOOP IQ</div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn variant="ghost" small onClick={() => onAuth("login")}>Connexion</Btn>
          <Btn small onClick={() => onAuth("signup")} style={{ boxShadow: "0 4px 20px rgba(255,92,0,0.4)" }}>Commencer →</Btn>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "120px 24px 80px", position: "relative" }}>
        {/* Background glow */}
        <div style={{ position: "absolute", inset: 0, background: G.glow, pointerEvents: "none" }} />
        {/* Orbs */}
        <div style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,92,0,0.06) 0%, transparent 70%)", top: "10%", left: "10%", animation: "float 8s ease-in-out infinite" }} />
        <div style={{ position: "absolute", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(79,163,255,0.05) 0%, transparent 70%)", bottom: "20%", right: "15%", animation: "float 11s ease-in-out infinite reverse" }} />

        <div className="fade-in" style={{ animationDelay: "0s" }}>
          <Badge color={C.orange}>🏀 IA Basket · Saison 2025-26</Badge>
        </div>

        <h1 className="fade-in" style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "clamp(60px, 10vw, 110px)", lineHeight: .9, marginTop: 24, letterSpacing: 2, animationDelay: ".1s" }}>
          L'INTELLIGENCE<br />
          <span style={{ background: G.orange, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>ARTIFICIELLE</span><br />
          DU BASKET
        </h1>

        <p className="fade-in" style={{ fontSize: 18, color: C.muted, maxWidth: 520, lineHeight: 1.8, marginTop: 24, fontFamily: "'DM Sans', sans-serif", animationDelay: ".2s" }}>
          Analyse en temps réel · Prédictions IA · Stats avancées · Scout de talent
          <br />Tout ce qu'il faut pour dominer le jeu.
        </p>

        <div className="fade-in" style={{ display: "flex", gap: 12, marginTop: 36, flexWrap: "wrap", justifyContent: "center", animationDelay: ".3s" }}>
          <button className="glow-btn" onClick={() => onAuth("signup")} style={{
            padding: "16px 36px", borderRadius: 12, border: "none", cursor: "pointer",
            background: G.orange, color: "#fff", fontWeight: 800, fontSize: 16,
            boxShadow: "0 4px 30px rgba(255,92,0,0.45)", transition: "all .2s", fontFamily: "'DM Sans', sans-serif",
          }}>Essai gratuit 14 jours →</button>
          <Btn variant="ghost" onClick={() => onAuth("login")}>Déjà membre ? Connexion</Btn>
        </div>

        {/* Social proof */}
        <div className="fade-in" style={{ marginTop: 48, display: "flex", gap: 32, alignItems: "center", animationDelay: ".4s" }}>
          {[["2 400+", "Analystes"], ["89%", "Précision IA"], ["48", "Ligues"]].map(([v, l]) => (
            <div key={l} style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 32, color: C.orange }}>{v}</div>
              <div style={{ fontSize: 12, color: C.muted, fontFamily: "'DM Sans', sans-serif" }}>{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ padding: "80px 40px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <SectionTitle>Fonctionnalités</SectionTitle>
          <h2 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 52, letterSpacing: 1 }}>TOUT CE DONT TU AS <span style={{ color: C.orange }}>BESOIN</span></h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20 }}>
          {[
            { icon: "🤖", title: "IA Générative", desc: "Analyses textuelles détaillées générées par Claude pour chaque joueur et match." },
            { icon: "📊", title: "Stats Avancées", desc: "Plus de 120 métriques par joueur. Efficacité, impact, +/-, heat maps." },
            { icon: "🎯", title: "Prédictions", desc: "Algorithme ML entraîné sur 10 ans de data. 89% de précision sur les résultats." },
            { icon: "⚡", title: "Temps Réel", desc: "Live scoring, notifications push, alertes de performance pendant les matchs." },
            { icon: "📁", title: "Rapports PDF", desc: "Export automatique de rapports personnalisés pour ton staff ou tes clients." },
            { icon: "🔗", title: "API Access", desc: "Intègre HoopIQ dans tes propres outils. Endpoints REST documentés." },
          ].map((f) => (
            <Card key={f.title} sx={{ transition: "all .3s" }} style={{ transition: "all .3s" }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>{f.icon}</div>
              <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 22, letterSpacing: 1, marginBottom: 8 }}>{f.title}</div>
              <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.7, fontFamily: "'DM Sans', sans-serif" }}>{f.desc}</div>
            </Card>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section style={{ padding: "80px 40px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <SectionTitle>Tarifs</SectionTitle>
          <h2 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 52, letterSpacing: 1 }}>CHOISIS TON <span style={{ color: C.orange }}>NIVEAU</span></h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
          {PLANS.map((plan) => (
            <div key={plan.id} className="plan-card" style={{
              background: plan.popular ? `linear-gradient(160deg, rgba(255,92,0,0.1), rgba(255,140,66,0.05))` : C.surface,
              border: `1px solid ${plan.popular ? "rgba(255,92,0,0.4)" : C.border}`,
              borderRadius: 20, padding: 28, transition: "all .3s", cursor: "pointer", position: "relative",
              boxShadow: plan.popular ? `0 0 50px rgba(255,92,0,0.12)` : "none",
            }} onClick={() => onAuth("signup")}>
              {plan.popular && <div style={{ position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)", background: G.orange, color: "#fff", fontSize: 11, fontWeight: 800, padding: "4px 16px", borderRadius: 20, letterSpacing: 1.5, whiteSpace: "nowrap" }}>⚡ PLUS POPULAIRE</div>}
              <div style={{ fontSize: 40, marginBottom: 12 }}>{plan.icon}</div>
              <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 28, letterSpacing: 2, color: plan.color }}>{plan.name}</div>
              <div style={{ fontSize: 13, color: C.muted, marginBottom: 20, fontFamily: "'DM Sans', sans-serif" }}>{plan.desc}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 24 }}>
                <span style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 52, color: plan.color }}>{plan.price}€</span>
                <span style={{ color: C.muted, fontSize: 14 }}>{plan.period}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
                {plan.features.map(f => (
                  <div key={f} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>
                    <span style={{ color: C.green }}>✓</span> {f}
                  </div>
                ))}
                {plan.locked.map(f => (
                  <div key={f} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, color: C.muted, fontFamily: "'DM Sans', sans-serif" }}>
                    <span>🔒</span> {f}
                  </div>
                ))}
              </div>
              <Btn variant={plan.popular ? "primary" : plan.id === "elite" ? "gold" : "ghost"} full>
                Choisir {plan.name} →
              </Btn>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: `1px solid ${C.border}`, padding: "40px", textAlign: "center", color: C.muted, fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 22, background: G.orange, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 12 }}>HOOP IQ</div>
        © 2026 HoopIQ · Propulsé par Claude AI · Tous droits réservés
      </footer>
    </div>
  );
}

/* ─────────────────────────────────────────
   AUTH MODAL
───────────────────────────────────────── */
function AuthModal({ mode, onClose, onSuccess }) {
  const [m, setM] = useState(mode);
  const [step, setStep] = useState(m === "signup" ? 1 : 0); // 0=login, 1=info, 2=plan, 3=payment
  const [form, setForm] = useState({ name: "", email: "", password: "", plan: "pro" });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const field = (key) => ({
    value: form[key],
    onChange: (e) => setForm(f => ({ ...f, [key]: e.target.value })),
  });

  const inputStyle = {
    width: "100%", padding: "12px 16px", borderRadius: 10,
    background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`,
    color: C.text, fontSize: 14, outline: "none", fontFamily: "'DM Sans', sans-serif",
    transition: "border-color .2s",
  };

  const handleLogin = async () => {
    if (!form.email || !form.password) { setErrors({ general: "Remplis tous les champs." }); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 900));
    onSuccess({ name: form.email.split("@")[0], email: form.email, plan: "pro" });
  };

  const handleSignup = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    onSuccess({ name: form.name || form.email.split("@")[0], email: form.email, plan: form.plan });
  };

  const selectedPlan = PLANS.find(p => p.id === form.plan);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.75)", backdropFilter: "blur(10px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 22, padding: 36, width: "100%", maxWidth: 440, position: "relative", boxShadow: "0 30px 100px rgba(0,0,0,0.7)" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", color: C.muted, fontSize: 22, cursor: "pointer" }}>×</button>

        <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 22, background: G.orange, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: 2, marginBottom: 24 }}>HOOP IQ</div>

        {/* LOGIN */}
        {m === "login" && (
          <div>
            <h2 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 34, letterSpacing: 1, marginBottom: 6 }}>Bon retour 👋</h2>
            <p style={{ color: C.muted, fontSize: 13, marginBottom: 24, fontFamily: "'DM Sans', sans-serif" }}>Connecte-toi pour accéder à ton dashboard</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <input style={inputStyle} placeholder="Email" type="email" {...field("email")} />
              <input style={inputStyle} placeholder="Mot de passe" type="password" {...field("password")} />
              {errors.general && <div style={{ color: C.red, fontSize: 13 }}>{errors.general}</div>}
              <Btn full onClick={handleLogin} disabled={loading}>{loading ? "Connexion..." : "Se connecter →"}</Btn>
            </div>
            <div style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: C.muted, fontFamily: "'DM Sans', sans-serif" }}>
              Pas encore membre ?{" "}
              <span style={{ color: C.orange, cursor: "pointer", fontWeight: 700 }} onClick={() => { setM("signup"); setStep(1); }}>S'inscrire</span>
            </div>
          </div>
        )}

        {/* SIGNUP STEP 1 */}
        {m === "signup" && step === 1 && (
          <div>
            <h2 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 34, letterSpacing: 1, marginBottom: 6 }}>Créer un compte</h2>
            <p style={{ color: C.muted, fontSize: 13, marginBottom: 24, fontFamily: "'DM Sans', sans-serif" }}>14 jours gratuits · Sans carte bancaire</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <input style={inputStyle} placeholder="Prénom ou pseudo" {...field("name")} />
              <input style={inputStyle} placeholder="Email" type="email" {...field("email")} />
              <input style={inputStyle} placeholder="Mot de passe" type="password" {...field("password")} />
              <Btn full onClick={() => setStep(2)}>Suivant : Choix du plan →</Btn>
            </div>
            <div style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: C.muted, fontFamily: "'DM Sans', sans-serif" }}>
              Déjà membre ?{" "}
              <span style={{ color: C.orange, cursor: "pointer", fontWeight: 700 }} onClick={() => setM("login")}>Se connecter</span>
            </div>
          </div>
        )}

        {/* SIGNUP STEP 2 — PLAN */}
        {m === "signup" && step === 2 && (
          <div>
            <h2 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 34, letterSpacing: 1, marginBottom: 6 }}>Ton plan</h2>
            <p style={{ color: C.muted, fontSize: 13, marginBottom: 20, fontFamily: "'DM Sans', sans-serif" }}>Tu peux changer à tout moment</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
              {PLANS.map(plan => (
                <div key={plan.id} onClick={() => setForm(f => ({ ...f, plan: plan.id }))} style={{
                  padding: "14px 18px", borderRadius: 12, cursor: "pointer", transition: "all .2s",
                  border: `1px solid ${form.plan === plan.id ? plan.color : C.border}`,
                  background: form.plan === plan.id ? `${plan.color}11` : "rgba(255,255,255,0.02)",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 22 }}>{plan.icon}</span>
                    <div>
                      <div style={{ fontWeight: 700, fontFamily: "'DM Sans', sans-serif" }}>{plan.name}</div>
                      <div style={{ fontSize: 12, color: C.muted }}>{plan.desc}</div>
                    </div>
                  </div>
                  <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 22, color: plan.color }}>{plan.price}€/m</div>
                </div>
              ))}
            </div>
            <Btn full onClick={() => setStep(3)}>Suivant : Paiement →</Btn>
            <Btn variant="ghost" full onClick={() => setStep(1)} style={{ marginTop: 8 }}>← Retour</Btn>
          </div>
        )}

        {/* SIGNUP STEP 3 — PAYMENT (simulated) */}
        {m === "signup" && step === 3 && (
          <div>
            <h2 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 34, letterSpacing: 1, marginBottom: 6 }}>Paiement</h2>
            <div style={{ background: `${selectedPlan.color}11`, border: `1px solid ${selectedPlan.color}33`, borderRadius: 10, padding: "10px 14px", marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}>{selectedPlan.icon} Plan {selectedPlan.name} · 14j gratuit</span>
              <span style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 20, color: selectedPlan.color }}>{selectedPlan.price}€/mois</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input style={inputStyle} placeholder="Numéro de carte  •••• •••• •••• ••••" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <input style={inputStyle} placeholder="MM / AA" />
                <input style={inputStyle} placeholder="CVC" />
              </div>
              <input style={inputStyle} placeholder="Nom sur la carte" />
              <Btn full onClick={handleSignup} disabled={loading} style={{ marginTop: 4 }}>
                {loading ? "⏳ Traitement..." : `Démarrer l'essai gratuit →`}
              </Btn>
            </div>
            <div style={{ textAlign: "center", marginTop: 14, fontSize: 11, color: C.muted, fontFamily: "'DM Sans', sans-serif" }}>
              🔒 Paiement sécurisé · Annulation à tout moment · Aucun débit pendant 14 jours
            </div>
            <Btn variant="ghost" full onClick={() => setStep(2)} style={{ marginTop: 10 }}>← Retour</Btn>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   DASHBOARD APP
───────────────────────────────────────── */
function App({ user, onLogout }) {
  const [tab, setTab] = useState("dashboard");
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiDone, setAiDone] = useState(false);
  const [chatHistory, setChatHistory] = useState([
  { role: "assistant", text: "Bonjour ! Je suis HoopIQ IA, ton analyste basket. Pose-moi une question !" }
]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [bullsPlayers, setBullsPlayers] = useState([]);
  const [liveScores, setLiveScores] = useState([]);
  const [nbaLoading, setNbaLoading] = useState(true);
  const [nbaError, setNbaError] = useState(null);
  const anthopicProxy = (import.meta.env.DEV ? 'http://localhost:3001' : '') + '/api/anthropic'
  const chatEndRef = useRef(null);
  const streamIntervalRef = useRef(null);
  const plan = PLANS.find(p => p.id === user.plan) || PLANS[1];

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatHistory]);

  useEffect(() => {
    // Cleanup intervalle de streaming quand le composant se démonte
    return () => {
      if (streamIntervalRef.current) {
        clearInterval(streamIntervalRef.current);
        streamIntervalRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const loadNbaData = async () => {
      setNbaLoading(true)
      setNbaError(null)
      const apiBase = import.meta.env.DEV ? 'http://localhost:3001' : ''
      try {
        const [playersRes, scoresRes] = await Promise.all([
          fetch(`${apiBase}/api/nba/players`),
          fetch(`${apiBase}/api/nba/live-scores`),
        ])
        if (!playersRes.ok) throw new Error('Impossible de charger les joueurs Bulls')
        if (!scoresRes.ok) throw new Error('Impossible de charger les scores live')
        const playersData = await playersRes.json()
        const scoresData = await scoresRes.json()
        setBullsPlayers(playersData.players || [])
        setLiveScores(scoresData.games || [])
      } catch (err) {
        console.error('NBA fetch error:', err)
        setNbaError(err.message)
      } finally {
        setNbaLoading(false)
      }
    }
    loadNbaData()
  }, [])

  useEffect(() => {
    if (bullsPlayers.length && (!selectedPlayer || selectedPlayer.team !== 'Chicago Bulls')) {
      setSelectedPlayer(bullsPlayers[0])
    }
  }, [bullsPlayers])

  const analyzePlayer = async (player) => {
    setSelectedPlayer(player);
    setAiAnalysis("");
    setAiDone(false);
    setAiLoading(true);
    
    // Nettoyer l'intervalle précédent s'il existe
    if (streamIntervalRef.current) {
      clearInterval(streamIntervalRef.current);
      streamIntervalRef.current = null;
    }
    
    try {
      const res = await fetch(anthopicProxy, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: `Tu es un scout NBA de classe mondiale. Analyse ce joueur en 4 points percutants (format bullet •), en français, style analytique premium. Données:\nNom: ${player.name}\nPoste: ${player.pos} | Équipe: ${player.team}\n${player.pts} pts | ${player.ast} ast | ${player.reb} reb | ${player.fg}% tir\nScore IA HoopIQ: ${player.score}/100 | Tendance: ${player.trend > 0 ? "+" : ""}${player.trend}\nSois précis, factuel, inspirant. Maximum 5 lignes au total.`
          }]
        })
      });
      
      const data = await res.json();
      const text = data?.completion?.[0]?.data?.text || data?.content?.map(b => b.text || "").join("") || JSON.stringify(data).slice(0, 800) || "Analyse non disponible.";
      
      let i = 0;
      const chunkSize = 12; // Augmenté de 4 à 12 pour moins de re-renders
      
      streamIntervalRef.current = setInterval(() => {
        if (i >= text.length) {
          setAiAnalysis(text);
          setAiDone(true);
          setAiLoading(false);
          clearInterval(streamIntervalRef.current);
          streamIntervalRef.current = null;
        } else {
          setAiAnalysis(text.slice(0, i));
          i += chunkSize;
        }
      }, 16);
    } catch (err) {
      console.error("Analyse error:", err);
      setAiAnalysis("❌ Erreur IA. Vérifie la connexion.");
      setAiDone(true);
      setAiLoading(false);
    }
  };

  const sendChat = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const msg = chatInput.trim(); setChatInput("");
    setChatHistory(h => [...h, { role: "user", text: msg }]);
    setChatLoading(true);
    try {
      const res = await fetch(anthopicProxy, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001", max_tokens: 1000,
          system: "Tu es HoopIQ IA, analyste basket expert. Reponds en francais, de facon concise et passionnee.",
          messages: chatHistory.slice(1).concat({ role: "user", content: msg }).map(m => ({ role: m.role, content: m.text })).filter(m => m.content && m.content.trim())
        })
      });
      const data = await res.json();
      const reply = data.content?.map(b => b.text || "").join("") || "Désolé, erreur.";
      setChatHistory(h => [...h, { role: "assistant", text: reply }]);
    } catch { setChatHistory(h => [...h, { role: "assistant", text: "❌ Erreur IA." }]); }
    setChatLoading(false);
  };

  const TABS = [
    { id: "dashboard", label: "Dashboard", icon: "⚡" },
    { id: "players", label: "Joueurs", icon: "🏀" },
    { id: "matches", label: "Matchs", icon: "📊" },
    { id: "chat", label: "IA Chat", icon: "🤖" },
    { id: "account", label: "Compte", icon: "👤" },
    { id: "agent", label: "Agent IA", icon: "🤖" },
    { id: "marketing", label: "Marketing", icon: "🚀" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;700&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: ${C.orange}; border-radius: 4px; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        .nav-tab:hover { color: ${C.orange} !important; }
        .player-row:hover { background: rgba(255,92,0,0.06) !important; cursor:pointer; }
        .stat-card:hover { border-color: rgba(255,92,0,0.3) !important; transform:translateY(-2px); }
        .fade-in { animation: fadeUp .5s ease both; }
      `}</style>

      {/* TOP NAV */}
      <nav style={{ position: "sticky", top: 0, zIndex: 100, height: 62, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px", background: "rgba(6,6,15,0.92)", backdropFilter: "blur(20px)", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 24, background: G.orange, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: 3 }}>HOOP IQ</div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 2 }}>
          {TABS.map(t => (
            <button key={t.id} className="nav-tab" onClick={() => setTab(t.id)} style={{
              padding: "8px 14px", borderRadius: 8, border: "none", cursor: "pointer",
              background: tab === t.id ? "rgba(255,92,0,0.12)" : "transparent",
              color: tab === t.id ? C.orange : C.muted, fontWeight: tab === t.id ? 700 : 500,
              fontSize: 13, transition: "all .2s", fontFamily: "'DM Sans', sans-serif",
              borderBottom: tab === t.id ? `2px solid ${C.orange}` : "2px solid transparent",
            }}>{t.icon} {t.label}</button>
          ))}
        </div>

        {/* User */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Badge color={plan.color}>{plan.icon} {plan.name}</Badge>
          <Avatar name={user.name} size={34} />
          <button onClick={onLogout} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 12 }}>Déconnexion</button>
        </div>
      </nav>

      {/* CONTENT */}
      <div style={{ maxWidth: 1140, margin: "0 auto", padding: "28px 24px" }}>

        {/* ── DASHBOARD ── */}
        {tab === "dashboard" && (
          <div className="fade-in">
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 13, color: C.muted, marginBottom: 4 }}>Bienvenue, {user.name} 👋</div>
              <h1 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 46, letterSpacing: 2, lineHeight: 1 }}>
                TABLEAU DE <span style={{ color: C.orange }}>BORD</span>
              </h1>
            </div>

            {/* KPI Row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
              {[
                { label: "Matchs analysés", val: "248", icon: "📊", sub: "+12 ce mois", color: C.blue },
                { label: "Joueurs suivis", val: "94", icon: "🏀", sub: "5 ligues actives", color: C.green },
                { label: "Précision IA", val: "89%", icon: "🎯", sub: "Sur 248 matchs", color: C.orange },
                { label: "Alertes actives", val: "7", icon: "🔔", sub: "Performance haute", color: C.gold },
              ].map((k, i) => (
                <div key={k.label} className="stat-card" style={{
                  background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16,
                  padding: 20, transition: "all .2s", animationDelay: `${i * .08}s`,
                }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{k.icon}</div>
                  <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 38, color: k.color, lineHeight: 1 }}>{k.val}</div>
                  <div style={{ fontSize: 12, color: C.text, fontWeight: 600, marginTop: 4 }}>{k.label}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{k.sub}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1.3fr 0.7fr", gap: 20, marginBottom: 20 }}>
              <Card>
                <SectionTitle>🏀 NBA Live</SectionTitle>
                {nbaLoading ? (
                  <div style={{ color: C.muted, fontSize: 13 }}>Chargement des scores en direct...</div>
                ) : nbaError ? (
                  <div style={{ color: C.red, fontSize: 13 }}>{nbaError}</div>
                ) : (
                  <div>
                    {liveScores.length === 0 ? (
                      <div style={{ color: C.muted, fontSize: 13 }}>Aucun match disponible pour le moment.</div>
                    ) : (
                      liveScores.map(game => (
                        <div key={game.id} style={{ padding: 14, borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}` }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <div style={{ fontSize: 13, color: C.muted }}>{game.status}</div>
                            <div style={{ fontSize: 11, color: C.orange }}>{game.clock}</div>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 700 }}>{game.home.name}</div>
                              <div style={{ fontSize: 12, color: C.muted }}>{game.away.name}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 24, color: C.orange }}>{game.home.score} — {game.away.score}</div>
                              <div style={{ fontSize: 11, color: C.muted }}>{game.home.abbreviation} vs {game.away.abbreviation}</div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </Card>

              <Card glow>
                <SectionTitle>Chicago Bulls Prioritaires</SectionTitle>
                {nbaLoading ? (
                  <div style={{ color: C.muted, fontSize: 13 }}>Chargement des Bulls...</div>
                ) : bullsPlayers.length === 0 ? (
                  <div style={{ color: C.muted, fontSize: 13 }}>Aucun joueur Bulls trouvé.</div>
                ) : (
                  bullsPlayers.slice(0, 6).map(player => (
                    <div key={player.id} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                      <Avatar name={player.name} size={42} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700 }}>{player.name}</div>
                        <div style={{ fontSize: 12, color: C.muted }}>{player.pos} · {player.fg}% fg</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 18, color: C.orange }}>{player.score}</div>
                        <div style={{ fontSize: 11, color: player.trend >= 0 ? C.green : C.red }}>{player.trend >= 0 ? `+${player.trend}` : player.trend}</div>
                      </div>
                    </div>
                  ))
                )}
              </Card>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>
              {/* Top performers */}
              <Card>
                <SectionTitle>🏆 Top Performers IA</SectionTitle>
                {(bullsPlayers.length ? bullsPlayers.slice(0, 4) : PLAYERS.slice(0, 4)).map((p, i) => (
                  <div key={p.id} className="player-row" onClick={() => { setTab("players"); analyzePlayer(p); }} style={{
                    display: "flex", alignItems: "center", gap: 14, padding: "12px 8px",
                    borderRadius: 10, transition: "all .15s",
                    borderBottom: i < 3 ? `1px solid ${C.border}` : "none",
                  }}>
                    <span style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 18, color: i === 0 ? C.orange : C.muted, width: 20, textAlign: "center" }}>#{i + 1}</span>
                    <Avatar name={p.name} size={38} glow={i === 0} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{p.name} {p.hot && <span title="En feu">🔥</span>}</div>
                      <div style={{ fontSize: 12, color: C.muted }}>{p.team} · {p.pos}</div>
                    </div>
                    <div style={{ textAlign: "right", marginRight: 8 }}>
                      <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 22, color: C.orange }}>{p.pts}</div>
                      <div style={{ fontSize: 11, color: C.muted }}>pts/match</div>
                    </div>
                    <Ring score={p.score} size={56} />
                  </div>
                ))}
              </Card>

              {/* Sidebar */}
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {/* Next match */}
                <Card glow>
                  <SectionTitle>📅 Prochain match</SectionTitle>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>Lyon Hawks</div>
                  <div style={{ fontSize: 12, color: C.muted, marginBottom: 12 }}>vs Bordeaux Lions · 10 Jun</div>
                  <div style={{ padding: "10px 12px", background: "rgba(255,92,0,0.06)", borderRadius: 8, fontSize: 13, borderLeft: `3px solid ${C.orange}` }}>
                    🎯 <strong style={{ color: C.orange }}>67%</strong> de chance de victoire Lyon selon l'IA
                  </div>
                </Card>

                {/* Plan card */}
                <Card>
                  <SectionTitle>💳 Mon abonnement</SectionTitle>
                  <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 28, color: plan.color }}>{plan.icon} {plan.name}</div>
                  <div style={{ fontSize: 13, color: C.muted, margin: "4px 0 14px" }}>{plan.price}€ / mois · Renouvellement le 7 Juil</div>
                  <Btn variant="ghost" small full onClick={() => setTab("account")}>Gérer mon plan →</Btn>
                </Card>
              </div>
            </div>

            {/* Recent activity */}
            <Card style={{ marginTop: 20 }}>
              <SectionTitle>⚡ Analyses récentes</SectionTitle>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
                {MATCHES.filter(m => m.done).map(m => (
                  <div key={m.id} style={{ padding: "14px 16px", background: "rgba(255,255,255,0.03)", borderRadius: 12, border: `1px solid ${C.border}` }}>
                    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>{m.home} vs {m.away}</div>
                    <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 22, color: C.orange }}>{m.hs} — {m.as}</div>
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>🏆 MVP: <strong style={{ color: C.text }}>{m.mvp}</strong></div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* ── PLAYERS ── */}
        {tab === "players" && (
          <div className="fade-in">
            <h1 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 46, letterSpacing: 2, marginBottom: 6 }}>ANALYSE <span style={{ color: C.orange }}>JOUEURS</span></h1>
            <p style={{ color: C.muted, fontSize: 14, marginBottom: 24 }}>Clique sur un joueur pour générer son analyse IA complète</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {bullsPlayers.length > 0 && (
                  <Card style={{ padding: 20, marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Chicago Bulls</div>
                        <div style={{ fontSize: 11, color: C.muted }}>Joueurs réels Bulls en priorité</div>
                      </div>
                      <Badge color={C.red}>Priorité</Badge>
                    </div>
                    <div style={{ display: 'grid', gap: 12 }}>
                      {bullsPlayers.slice(0, 6).map(p => (
                        <div key={p.id} onClick={() => analyzePlayer(p)} style={{
                          padding: 14, borderRadius: 14, background: selectedPlayer?.id === p.id ? 'rgba(255,92,0,0.08)' : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${selectedPlayer?.id === p.id ? 'rgba(255,92,0,0.45)' : C.border}`,
                          cursor: 'pointer', transition: 'all .2s',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <Avatar name={p.name} size={42} glow={selectedPlayer?.id === p.id} />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 700, fontSize: 14 }}>{p.name}</div>
                              <div style={{ fontSize: 11, color: C.muted }}>{p.pos} · {p.team}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 18, color: C.orange }}>{p.score}</div>
                              <div style={{ fontSize: 11, color: p.trend >= 0 ? C.green : C.red }}>{p.trend >= 0 ? `+${p.trend}` : p.trend}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
                {(bullsPlayers.length ? bullsPlayers : PLAYERS).map(p => (
                  <div key={p.id} onClick={() => analyzePlayer(p)} style={{
                    background: selectedPlayer?.id === p.id ? "rgba(255,92,0,0.07)" : C.surface,
                    border: `1px solid ${selectedPlayer?.id === p.id ? "rgba(255,92,0,0.45)" : C.border}`,
                    borderRadius: 16, padding: "18px 20px", cursor: "pointer", transition: "all .2s",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <Avatar name={p.name} size={50} glow={selectedPlayer?.id === p.id} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>{p.name} {p.hot && "🔥"}</div>
                        <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>{p.team} · {p.pos}</div>
                        <div style={{ display: "flex", gap: 6 }}>
                          <Badge color={C.orange}>{p.pts} pts</Badge>
                          <Badge color={C.blue}>{p.ast} ast</Badge>
                          <Badge color={C.green}>{p.reb} reb</Badge>
                        </div>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <Ring score={p.score} size={60} />
                        <div style={{ fontSize: 12, fontWeight: 700, color: p.trend >= 0 ? C.green : C.red, marginTop: 2 }}>{p.trend >= 0 ? "▲" : "▼"} {Math.abs(p.trend)}</div>
                      </div>
                    </div>
                    <div style={{ marginTop: 14 }}>
                      <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>% au tir ({p.fg}%)</div>
                      <Bar value={p.fg} max={70} color={G.orange} />
                    </div>
                  </div>
                ))}
              </div>

              {/* AI Panel */}
              <div style={{ position: "sticky", top: 80, alignSelf: "start", display: "flex", flexDirection: "column", gap: 16 }}>
                <Card glow={!!aiAnalysis}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                    <Badge>🤖 IA</Badge>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>Analyse · {selectedPlayer?.name}</span>
                    {aiLoading && <span style={{ fontSize: 12, color: C.orange }}>⏳ Génération...</span>}
                  </div>
                  {!aiAnalysis && !aiLoading && <p style={{ color: C.muted, fontSize: 13 }}>👆 Sélectionne un joueur pour lancer l'analyse IA.</p>}
                  {aiLoading && <div style={{ color: C.orange, fontSize: 13 }}>🔍 Analyse en cours...</div>}
                  {aiAnalysis && (
                    <div style={{ maxHeight: "400px", overflowY: "auto", paddingRight: 8 }}>
                      <p style={{ fontSize: 14, lineHeight: 1.85, whiteSpace: "pre-wrap", color: "#dde", margin: 0 }}>
                        {aiAnalysis}{!aiDone && <span style={{ animation: "blink 1s infinite", color: C.orange }}>▋</span>}
                      </p>
                    </div>
                  )}
                  {aiDone && <div style={{ marginTop: 12, padding: "8px 12px", background: "rgba(255,92,0,0.08)", borderRadius: 8, fontSize: 11, color: C.muted }}>✅ Généré par Claude · Score HoopIQ : <strong style={{ color: C.orange }}>{selectedPlayer?.score}/100</strong></div>}
                </Card>

                {selectedPlayer && (
                  <Card>
                    <SectionTitle>Statistiques détaillées</SectionTitle>
                    {[
                      { label: "Points / match", v: selectedPlayer.pts, max: 35, c: C.orange },
                      { label: "Passes décisives", v: selectedPlayer.ast, max: 12, c: C.blue },
                      { label: "Rebonds", v: selectedPlayer.reb, max: 15, c: C.green },
                      { label: "% au tir", v: selectedPlayer.fg, max: 70, c: C.gold },
                    ].map(s => (
                      <div key={s.label} style={{ marginBottom: 14 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 5 }}>
                          <span style={{ color: C.muted }}>{s.label}</span>
                          <strong style={{ color: s.c }}>{s.v}{s.label.includes("%") ? "%" : ""}</strong>
                        </div>
                        <Bar value={s.v} max={s.max} color={s.c} />
                      </div>
                    ))}
                  </Card>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── MATCHES ── */}
        {tab === "matches" && (
          <div className="fade-in">
            <h1 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 46, letterSpacing: 2, marginBottom: 24 }}>ANALYSE <span style={{ color: C.orange }}>MATCHS</span></h1>
            {nbaLoading ? (
              <div style={{ color: C.muted, fontSize: 14 }}>⏳ Chargement des matchs NBA...</div>
            ) : nbaError ? (
              <div style={{ color: C.red, fontSize: 14 }}>❌ {nbaError}</div>
            ) : liveScores.length === 0 ? (
              <div style={{ color: C.muted, fontSize: 14 }}>Aucun match disponible pour le moment.</div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 20 }}>
                {liveScores.map(game => {
                  const isBullsInvolved = game.home.abbreviation === "CHI" || game.away.abbreviation === "CHI";
                  const isFinished = game.status === "Final" || game.status?.includes("Final");
                  
                  return (
                    <Card key={game.id}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 15 }}>{game.home.name}</div>
                          <div style={{ fontSize: 12, color: C.muted }}>vs {game.away.name}</div>
                          <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>📅 {game.status}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          {isFinished ? (
                            <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 30, color: C.orange }}>{game.home.score}–{game.away.score}</div>
                          ) : (
                            <div>
                              <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 28, color: C.blue }}>{game.home.score}–{game.away.score}</div>
                              <div style={{ fontSize: 10, color: C.orange, marginTop: 2 }}>{game.clock}</div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Status badge */}
                      <div style={{ marginBottom: 14, display: "flex", gap: 8 }}>
                        {isBullsInvolved && (
                          <Badge color={C.orange}>🏀 CHICAGO BULLS</Badge>
                        )}
                        {isFinished ? (
                          <Badge color={C.green}>✓ TERMINÉ</Badge>
                        ) : (
                          <Badge color={C.blue}>⏱ EN DIRECT</Badge>
                        )}
                      </div>

                      {/* Score display */}
                      <div style={{ padding: 12, background: "rgba(255,255,255,0.03)", borderRadius: 8, marginBottom: 12 }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 50px 1fr", gap: 8, alignItems: "center", textAlign: "center" }}>
                          <div>
                            <div style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}>{game.home.abbreviation}</div>
                            <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 22, fontWeight: 700 }}>{game.home.score}</div>
                          </div>
                          <div style={{ fontSize: 11, color: C.muted }}>vs</div>
                          <div>
                            <div style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}>{game.away.abbreviation}</div>
                            <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 22, fontWeight: 700 }}>{game.away.score}</div>
                          </div>
                        </div>
                      </div>

                      {!isFinished && (
                        <div style={{ fontSize: 12, padding: "8px 12px", background: "rgba(100,150,255,0.1)", borderRadius: 8, borderLeft: `3px solid ${C.blue}` }}>
                          ⏱ Match en cours · {game.clock}
                        </div>
                      )}
                      {isFinished && (
                        <div style={{ fontSize: 12, padding: "8px 12px", background: "rgba(100,200,100,0.1)", borderRadius: 8, borderLeft: `3px solid ${C.green}` }}>
                          ✓ Match terminé
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── CHAT ── */}
        {tab === "chat" && (
          <div className="fade-in">
            <h1 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 46, letterSpacing: 2, marginBottom: 6 }}>ASSISTANT <span style={{ color: C.orange }}>IA</span></h1>
            <p style={{ color: C.muted, fontSize: 14, marginBottom: 20 }}>Pose n'importe quelle question basket — powered by Claude</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 20, alignItems: "start" }}>
              <div>
                <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 18, padding: 20, height: 440, overflowY: "auto", display: "flex", flexDirection: "column", gap: 14, marginBottom: 14 }}>
                  {chatHistory.map((m, i) => (
                    <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", flexDirection: m.role === "user" ? "row-reverse" : "row" }}>
                      {m.role === "assistant" && (
                        <div style={{ width: 30, height: 30, borderRadius: "50%", background: G.orange, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>🤖</div>
                      )}
                      <div style={{
                        maxWidth: "78%", padding: "11px 15px", fontSize: 13, lineHeight: 1.7, whiteSpace: "pre-wrap",
                        borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                        background: m.role === "user" ? G.orange : "rgba(255,255,255,0.06)",
                        color: m.role === "user" ? "#fff" : "#dde",
                      }}>{m.text}</div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <div style={{ width: 30, height: 30, borderRadius: "50%", background: G.orange, display: "flex", alignItems: "center", justifyContent: "center" }}>🤖</div>
                      <div style={{ padding: "11px 15px", background: "rgba(255,255,255,0.06)", borderRadius: "16px 16px 16px 4px", color: C.orange, fontSize: 18, letterSpacing: 4 }}>• • •</div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendChat()}
                    placeholder="Ex: Qui est le meilleur marqueur ? Prédit le prochain match..."
                    style={{ flex: 1, padding: "13px 18px", borderRadius: 12, background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`, color: C.text, fontSize: 14, outline: "none", fontFamily: "'DM Sans', sans-serif" }} />
                  <Btn onClick={sendChat} disabled={chatLoading}>{chatLoading ? "..." : "→"}</Btn>
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                  {["Analyse Marcus Johnson", "Prochain match ?", "Meilleur défenseur ?", "Prédiction finale de saison"].map(s => (
                    <button key={s} onClick={() => setChatInput(s)} style={{ padding: "5px 12px", borderRadius: 16, border: `1px solid rgba(255,92,0,0.3)`, background: "rgba(255,92,0,0.06)", color: C.orange, fontSize: 11, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>{s}</button>
                  ))}
                </div>
              </div>

              {/* Sidebar info */}
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <Card>
                  <SectionTitle>🏀 Joueurs en forme</SectionTitle>
                  {PLAYERS.filter(p => p.hot).map(p => (
                    <div key={p.id} style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
                      <Avatar name={p.name} size={32} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{p.name} 🔥</div>
                        <div style={{ fontSize: 11, color: C.muted }}>{p.pts} pts · Score {p.score}</div>
                      </div>
                    </div>
                  ))}
                </Card>
                <Card>
                  <SectionTitle>📊 Stats rapides</SectionTitle>
                  {[{ l: "Meilleur marqueur", v: "M. Johnson · 24.3" }, { l: "Meilleur passeur", v: "M. Johnson · 8.1" }, { l: "Meilleur rebondeur", v: "K. Tran · 11.3" }].map(s => (
                    <div key={s.l} style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 11, color: C.muted }}>{s.l}</div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{s.v}</div>
                    </div>
                  ))}
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* ── AGENT ── */}
        {tab === "agent" && (
          <div className="fade-in" style={{ height: "calc(100vh - 120px)", marginTop: -28, marginLeft: -24, marginRight: -24 }}>
            <Agent />
          </div>
        )}

        {/* ── MARKETING ── */}
        {tab === "marketing" && <Marketing />}

        {/* ── ACCOUNT ── */}
        {tab === "account" && (
          <div className="fade-in">
            <h1 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 46, letterSpacing: 2, marginBottom: 24 }}>MON <span style={{ color: C.orange }}>COMPTE</span></h1>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
              {/* Profile */}
              <Card>
                <SectionTitle>👤 Profil</SectionTitle>
                <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
                  <Avatar name={user.name} size={60} glow />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 18 }}>{user.name}</div>
                    <div style={{ color: C.muted, fontSize: 13 }}>{user.email}</div>
                    <Badge color={plan.color} style={{ marginTop: 6 }}>{plan.icon} {plan.name}</Badge>
                  </div>
                </div>
                {[
                  { label: "Nom", val: user.name },
                  { label: "Email", val: user.email },
                  { label: "Membre depuis", val: "Juin 2026" },
                ].map(f => (
                  <div key={f.label} style={{ padding: "10px 0", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                    <span style={{ color: C.muted }}>{f.label}</span>
                    <span style={{ fontWeight: 500 }}>{f.val}</span>
                  </div>
                ))}
                <Btn variant="ghost" full style={{ marginTop: 16 }}>Modifier le profil</Btn>
              </Card>

              {/* Subscription */}
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <Card glow>
                  <SectionTitle>💳 Abonnement actuel</SectionTitle>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                    <div style={{ fontSize: 42 }}>{plan.icon}</div>
                    <div>
                      <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 32, color: plan.color }}>{plan.name}</div>
                      <div style={{ fontSize: 13, color: C.muted }}>{plan.price}€ / mois · Actif</div>
                    </div>
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    {plan.features.slice(0, 4).map(f => (
                      <div key={f} style={{ display: "flex", gap: 8, fontSize: 13, marginBottom: 6 }}>
                        <span style={{ color: C.green }}>✓</span>{f}
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <Btn variant="ghost" small>Annuler</Btn>
                    <Btn small full>Changer de plan →</Btn>
                  </div>
                </Card>

                {/* Upgrade options */}
                {PLANS.filter(p => p.id !== plan.id).map(p => (
                  <div key={p.id} style={{ background: `${p.color}0a`, border: `1px solid ${p.color}33`, borderRadius: 14, padding: "16px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <span style={{ fontSize: 26 }}>{p.icon}</span>
                      <div>
                        <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 20, color: p.color }}>{p.name}</div>
                        <div style={{ fontSize: 12, color: C.muted }}>{p.desc}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 24, color: p.color }}>{p.price}€/m</div>
                      <button style={{ fontSize: 12, color: p.color, background: "none", border: `1px solid ${p.color}55`, borderRadius: 6, padding: "3px 10px", cursor: "pointer", marginTop: 4 }}>
                        {p.id === "elite" ? "Contacter" : "Passer à +"} →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   ROOT
───────────────────────────────────────── */
export default function Root() {
  const [screen, setScreen] = useState("landing"); // landing | app
  const [authMode, setAuthMode] = useState(null);  // login | signup | null
  const [user, setUser] = useState(null);

  const handleAuth = (mode) => setAuthMode(mode);
  const handleSuccess = (u) => { setUser(u); setAuthMode(null); setScreen("app"); };
  const handleLogout = () => { setUser(null); setScreen("landing"); };

  return (
    <>
      {screen === "landing" && <Landing onAuth={handleAuth} />}
      {screen === "app" && user && <App user={user} onLogout={handleLogout} />}
      {authMode && <AuthModal mode={authMode} onClose={() => setAuthMode(null)} onSuccess={handleSuccess} />}
    </>
  );
}
