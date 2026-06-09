import { useState, useEffect, useRef } from "react";
import { supabase, isSupabaseConfigured } from "./supabaseClient";

const C = {
  bg: "#06060f", bg2: "#0d0d1f", bg3: "#11112a",
  surface: "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.07)",
  orange: "#ff5c00", gold: "#ffd700",
  green: "#22d37a", red: "#ff4d6d",
  blue: "#4fa3ff", purple: "#c084fc",
  text: "#f0f0ff", muted: "#6b6b88",
};

const API_BASE = import.meta.env.DEV ? "http://localhost:3001" : "";

// 30 NBA teams (color tuned for visibility on dark bg)
const TEAMS = [
  ["ATL", "Atlanta Hawks", "#E03A3E"], ["BOS", "Boston Celtics", "#1db954"],
  ["BKN", "Brooklyn Nets", "#b0b0b8"], ["CHA", "Charlotte Hornets", "#9d7bd8"],
  ["CHI", "Chicago Bulls", "#CE1141"], ["CLE", "Cleveland Cavaliers", "#c8324d"],
  ["DAL", "Dallas Mavericks", "#4fa3ff"], ["DEN", "Denver Nuggets", "#4d94c7"],
  ["DET", "Detroit Pistons", "#e0556a"], ["GSW", "Golden State Warriors", "#ffc72c"],
  ["HOU", "Houston Rockets", "#CE1141"], ["IND", "Indiana Pacers", "#ffc633"],
  ["LAC", "LA Clippers", "#e0556a"], ["LAL", "Los Angeles Lakers", "#b388ff"],
  ["MEM", "Memphis Grizzlies", "#5D76A9"], ["MIA", "Miami Heat", "#e03a5f"],
  ["MIL", "Milwaukee Bucks", "#1db954"], ["MIN", "Minnesota Timberwolves", "#4fa3ff"],
  ["NOP", "New Orleans Pelicans", "#85714d"], ["NYK", "New York Knicks", "#f58426"],
  ["OKC", "Oklahoma City Thunder", "#4fa3ff"], ["ORL", "Orlando Magic", "#4d94c7"],
  ["PHI", "Philadelphia 76ers", "#4fa3ff"], ["PHX", "Phoenix Suns", "#b388ff"],
  ["POR", "Portland Trail Blazers", "#e0556a"], ["SAC", "Sacramento Kings", "#9d7bd8"],
  ["SAS", "San Antonio Spurs", "#C4CED4"], ["TOR", "Toronto Raptors", "#e03a5f"],
  ["UTA", "Utah Jazz", "#4d94c7"], ["WAS", "Washington Wizards", "#4fa3ff"],
];

const AVATAR_COLORS = ["#ff5c00", "#4fa3ff", "#22d37a", "#c084fc", "#ffd700", "#ff4d6d", "#1db954"];
function avatarColor(name) {
  let h = 0;
  for (let i = 0; i < (name || "").length; i++) h = (h * 31 + name.charCodeAt(i)) % 997;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}
const initial = (n) => (n || "?").trim().charAt(0).toUpperCase();
const fmtTime = (ts) => {
  try { return new Date(ts).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }); }
  catch { return ""; }
};

function SectionTitle({ children }) {
  return <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.5, color: C.muted, textTransform: "uppercase", margin: "16px 6px 6px", fontFamily: "monospace" }}>{children}</div>;
}

function RoomRow({ label, dot, prefix = "#", active, onSelect }) {
  return (
    <div onClick={onSelect} style={{
      display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderRadius: 8, cursor: "pointer",
      background: active ? "rgba(255,92,0,0.14)" : "transparent",
      color: active ? C.text : C.muted, fontSize: 13, fontWeight: active ? 700 : 500, marginBottom: 2,
      borderLeft: active ? `2px solid ${C.orange}` : "2px solid transparent",
    }}
    onMouseEnter={e => { if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
    onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}>
      {dot ? <span style={{ width: 7, height: 7, borderRadius: "50%", background: dot, flexShrink: 0 }} />
           : <span style={{ color: C.muted, opacity: 0.6 }}>{prefix}</span>}
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
    </div>
  );
}

export default function Vestiaire({ user }) {
  const me = user || { name: "Invité", email: "" };
  const [games, setGames] = useState([]);
  const [room, setRoom] = useState("general");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [aiThinking, setAiThinking] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const endRef = useRef(null);

  const scrollDown = () => setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 60);

  // Today's games → match rooms
  useEffect(() => {
    let active = true;
    fetch(`${API_BASE}/api/nba/livecenter`)
      .then(r => r.json())
      .then(d => { if (active) setGames(d.games || []); })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  // Room label for header + AI context
  const roomLabel = (() => {
    if (room === "general") return "Général";
    if (room.startsWith("team:")) {
      const ab = room.slice(5);
      return (TEAMS.find(t => t[0] === ab)?.[1]) || ab;
    }
    if (room.startsWith("match:")) {
      const g = games.find(x => `match:${x.id}` === room);
      return g ? `${g.home.abbr} vs ${g.away.abbr}` : "Match";
    }
    return room;
  })();

  // Load history + subscribe to realtime on room change
  useEffect(() => {
    let channel;
    let active = true;
    (async () => {
      if (!isSupabaseConfigured) { setMessages([]); return; }
      setLoadingMsgs(true);
      const { data, error } = await supabase
        .from("messages").select("*").eq("room", room)
        .order("created_at", { ascending: true }).limit(80);
      if (!active) return;
      if (error) console.error("[Vestiaire] Chargement échoué:", error.message, "— la table 'messages' existe-t-elle ? (lance supabase/messages.sql)");
      setMessages(data || []);
      setLoadingMsgs(false);
      scrollDown();
      channel = supabase
        .channel(`vestiaire:${room}`)
        .on("postgres_changes",
          { event: "INSERT", schema: "public", table: "messages", filter: `room=eq.${room}` },
          (payload) => {
            const row = payload.new;
            setMessages(prev => {
              // skip if already present (db id) or it's our own optimistic message (client_id)
              if (prev.some(m => (row.id != null && m.id === row.id) || (row.client_id && m.client_id === row.client_id))) return prev;
              return [...prev, row];
            });
            scrollDown();
          })
        .subscribe((status) => console.log("[Vestiaire] Realtime", room, "→", status));
    })();
    return () => { active = false; if (channel) supabase.removeChannel(channel); };
  }, [room]);

  // Optimistic post: the message ALWAYS appears instantly (pure React state),
  // then persists to Supabase if available. Works with or without Supabase.
  const postMessage = async ({ author, author_email, text, is_ai }) => {
    const client_id = (typeof crypto !== "undefined" && crypto.randomUUID)
      ? crypto.randomUUID()
      : `c_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
    const optimistic = { id: client_id, client_id, room, author, author_email, text, is_ai, created_at: new Date().toISOString() };
    setMessages(prev => [...prev, optimistic]);
    scrollDown();
    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from("messages")
        .insert({ room, author, author_email, text, is_ai, client_id });
      if (error) console.error("[Vestiaire] Envoi Supabase échoué:", error.message, "— le message reste affiché en local. Vérifie la table 'messages' (supabase/messages.sql).");
    }
  };

  const askHoopIQ = async (userText, history) => {
    setAiThinking(true);
    try {
      const context = history.slice(-8).map(m => `${m.author}: ${m.text}`).join("\n");
      const res = await fetch(`${API_BASE}/api/anthropic`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001", max_tokens: 250,
          system: `Tu es HoopIQ, l'assistant NBA d'un chat communautaire (le "Vestiaire"). Tu participes au salon "${roomLabel}". Réponds de façon courte (2-3 phrases max), fun et passionnée, en français, avec des emojis basket. Tu peux taquiner gentiment et donner des avis NBA.`,
          messages: [{ role: "user", content: `Contexte récent du salon:\n${context}\n\nMessage qui te mentionne: ${userText}` }],
        }),
      });
      const data = await res.json();
      const reply = data.content?.map(b => b.text || "").join("") || "🏀 Présent !";
      await postMessage({ author: "HoopIQ", author_email: "ai@hoopiq", text: reply, is_ai: true });
    } catch {
      await postMessage({ author: "HoopIQ", author_email: "ai@hoopiq", text: "❌ Je n'ai pas pu répondre, réessaie !", is_ai: true });
    }
    setAiThinking(false);
  };

  const send = async () => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    const historyForAI = [...messages, { author: me.name, text }];
    await postMessage({ author: me.name, author_email: me.email, text, is_ai: false });
    if (/@hoopiq/i.test(text)) askHoopIQ(text, historyForAI);
  };

  const liveGames = games.filter(g => g.status === "live");
  const otherGames = games.filter(g => g.status !== "live");

  return (
    <div style={{ height: "100%", display: "grid", gridTemplateColumns: "240px 1fr", background: C.bg, color: C.text, fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @keyframes msgIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        .vest-scroll::-webkit-scrollbar { width: 6px; } .vest-scroll::-webkit-scrollbar-thumb { background: rgba(255,92,0,0.4); border-radius: 4px; }
      `}</style>

      {/* Sidebar */}
      <div className="vest-scroll" style={{ background: C.bg2, borderRight: `1px solid ${C.border}`, overflowY: "auto", padding: 12 }}>
        <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 20, letterSpacing: 2, background: `linear-gradient(135deg,${C.orange},${C.gold})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", padding: "6px 8px 10px", borderBottom: `1px solid ${C.border}` }}>
          🏀 LE VESTIAIRE
        </div>

        <SectionTitle>Communauté</SectionTitle>
        <RoomRow label="général" active={room === "general"} onSelect={() => setRoom("general")} />

        <SectionTitle>🔴 Matchs en direct</SectionTitle>
        {liveGames.length ? liveGames.map(g => (
          <RoomRow key={g.id} label={`${g.home.abbr} vs ${g.away.abbr}`} dot={C.red} active={room === `match:${g.id}`} onSelect={() => setRoom(`match:${g.id}`)} />
        )) : <div style={{ fontSize: 11, color: C.muted, padding: "2px 10px", opacity: 0.7 }}>Aucun match live</div>}
        {otherGames.map(g => (
          <RoomRow key={g.id} label={`${g.home.abbr} vs ${g.away.abbr}`} dot={g.status === "final" ? C.muted : C.blue} active={room === `match:${g.id}`} onSelect={() => setRoom(`match:${g.id}`)} />
        ))}

        <SectionTitle>🏟️ Équipes NBA</SectionTitle>
        {TEAMS.map(([ab, name, color]) => (
          <RoomRow key={ab} label={name} dot={color} active={room === `team:${ab}`} onSelect={() => setRoom(`team:${ab}`)} />
        ))}
      </div>

      {/* Main */}
      <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Header */}
        <div style={{ height: 52, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 10, padding: "0 18px", background: "rgba(6,6,15,0.6)" }}>
          <span style={{ color: C.muted, fontSize: 18 }}>{room.startsWith("match:") ? "🔴" : "#"}</span>
          <span style={{ fontWeight: 800, fontSize: 15 }}>{roomLabel}</span>
          <span style={{ color: C.muted, fontSize: 12, marginLeft: 6 }}>· mentionne <strong style={{ color: C.orange }}>@hoopiq</strong> pour l'IA</span>
        </div>

        {/* Config banner */}
        {!isSupabaseConfigured && (
          <div style={{ background: "rgba(255,215,0,0.08)", borderBottom: `1px solid rgba(255,215,0,0.2)`, color: C.gold, fontSize: 12, padding: "8px 18px" }}>
            ⚠️ Mode local (pas de temps réel). Ajoute <code>VITE_SUPABASE_URL</code> + <code>VITE_SUPABASE_KEY</code> dans <code>.env</code> et crée la table <code>messages</code> pour activer le chat partagé en direct.
          </div>
        )}

        {/* Messages */}
        <div className="vest-scroll" style={{ flex: 1, overflowY: "auto", padding: "16px 18px", display: "flex", flexDirection: "column", gap: 14 }}>
          {loadingMsgs ? (
            <div style={{ color: C.muted, fontSize: 13, margin: "auto" }}>Chargement…</div>
          ) : messages.length === 0 ? (
            <div style={{ color: C.muted, fontSize: 13, margin: "auto", textAlign: "center" }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>💬</div>
              Sois le premier à parler dans <strong style={{ color: C.text }}>{roomLabel}</strong> !<br />
              <span style={{ fontSize: 12 }}>Astuce : écris <strong style={{ color: C.orange }}>@hoopiq</strong> pour discuter avec l'IA.</span>
            </div>
          ) : messages.map(m => (
            <div key={m.id} style={{ display: "flex", gap: 12, animation: "msgIn .2s ease" }}>
              <div style={{ width: 38, height: 38, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 15,
                background: m.is_ai ? `linear-gradient(135deg,${C.orange},${C.gold})` : avatarColor(m.author), color: m.is_ai ? "#1a1a00" : "#fff" }}>
                {m.is_ai ? "🤖" : initial(m.author)}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: m.is_ai ? C.gold : C.text }}>{m.author}{m.is_ai ? " 🏀" : ""}</span>
                  {m.is_ai && <span style={{ fontSize: 9, fontWeight: 800, color: C.orange, background: "rgba(255,92,0,0.12)", padding: "1px 6px", borderRadius: 10, letterSpacing: 0.5 }}>IA</span>}
                  <span style={{ fontSize: 11, color: C.muted }}>{fmtTime(m.created_at)}</span>
                </div>
                <div style={{ fontSize: 14, color: "#dde", lineHeight: 1.5, marginTop: 2, wordBreak: "break-word" }}>{m.text}</div>
              </div>
            </div>
          ))}
          {aiThinking && (
            <div style={{ display: "flex", gap: 12, alignItems: "center", color: C.orange }}>
              <div style={{ width: 38, height: 38, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: `linear-gradient(135deg,${C.orange},${C.gold})` }}>🤖</div>
              <span style={{ fontSize: 18, letterSpacing: 4 }}>• • •</span>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Input */}
        <div style={{ padding: "12px 18px", borderTop: `1px solid ${C.border}` }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", background: C.bg3, border: `1px solid ${C.border}`, borderRadius: 12, padding: "6px 8px 6px 14px" }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && send()}
              placeholder={`Message dans #${roomLabel.toLowerCase()}…  (mentionne @hoopiq)`}
              style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: C.text, fontSize: 14, fontFamily: "inherit" }}
            />
            <button onClick={send} disabled={!input.trim()} style={{
              padding: "8px 16px", borderRadius: 9, border: "none", cursor: input.trim() ? "pointer" : "default",
              background: input.trim() ? `linear-gradient(135deg,${C.orange},#ff8c42)` : "rgba(255,255,255,0.06)",
              color: input.trim() ? "#fff" : C.muted, fontWeight: 800, fontSize: 13, fontFamily: "inherit",
            }}>Envoyer</button>
          </div>
          <div style={{ fontSize: 10, color: C.muted, marginTop: 6, textAlign: "center" }}>
            Connecté en tant que <strong style={{ color: C.text }}>{me.name}</strong> · sois fair-play, on est entre passionnés 🏀
          </div>
        </div>
      </div>
    </div>
  );
}
