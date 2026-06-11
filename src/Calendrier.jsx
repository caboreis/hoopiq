import { useState } from "react";

const C = {
  bg: "#06060f", surface: "rgba(255,255,255,0.04)", border: "rgba(255,255,255,0.07)",
  orange: "#ff5c00", gold: "#ffd700", green: "#22d37a", red: "#ff4d6d",
  blue: "#4fa3ff", purple: "#c084fc", cyan: "#06b6d4", text: "#f0f0ff", muted: "#6b6b88",
};

// today = June 11 2026
const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

function daysUntil(dateStr) {
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return Math.round((d - TODAY) / 86400000);
}

const EVENTS = [
  // ─── FINALES NBA (EN COURS) ───
  { date: "2026-06-13", icon: "🏆", title: "Finales NBA – Match 5", desc: "New York à San Antonio · ABC 20h30 ET", cat: "finals", color: C.gold },
  { date: "2026-06-16", icon: "🏆", title: "Finales NBA – Match 6", desc: "San Antonio à New York · ABC 20h30 ET (si nécessaire)", cat: "finals", color: C.gold },
  { date: "2026-06-19", icon: "🏆", title: "Finales NBA – Match 7", desc: "New York à San Antonio · ABC 20h30 ET (si nécessaire)", cat: "finals", color: C.gold },
  // ─── DRAFT ───
  { date: "2026-06-13", icon: "📋", title: "Date limite retrait Draft", desc: "Dernier délai pour se retirer de la Draft 2026 (17h ET)", cat: "draft", color: C.blue },
  { date: "2026-06-23", icon: "🎓", title: "Draft NBA 2026 – 1er tour", desc: "ABC/ESPN · 20h00 ET", cat: "draft", color: C.blue },
  { date: "2026-06-24", icon: "🎓", title: "Draft NBA 2026 – 2e tour", desc: "ESPN · 20h00 ET", cat: "draft", color: C.blue },
  // ─── FREE AGENCY ───
  { date: "2026-06-30", icon: "🆓", title: "Négociations agents libres", desc: "Ouverture des négociations pour tous les agents libres · 18h00 ET", cat: "fa", color: C.green },
  { date: "2026-07-06", icon: "✍️", title: "Signature agents libres", desc: "Les équipes peuvent désormais signer des contrats · 12h01 ET", cat: "fa", color: C.green },
  // ─── SUMMER LEAGUE ───
  { date: "2026-07-03", icon: "☀️", title: "California Classic Summer League", desc: "Chase Center (SF) & Golden 1 Center (Sacramento) · Warriors, Lakers, Heat, Spurs…", cat: "summer", color: C.orange },
  { date: "2026-07-04", icon: "☀️", title: "Summer League Salt Lake City", desc: "Jon M. Huntsman Center · Jazz, Hawks, Grizzlies, Thunder", cat: "summer", color: C.orange },
  { date: "2026-07-09", icon: "☀️", title: "NBA Summer League Las Vegas", desc: "Toutes les équipes · Du 9 au 19 juillet", cat: "summer", color: C.orange },
  // ─── HALL OF FAME ───
  { date: "2026-08-14", icon: "🏛️", title: "Intronisation Hall of Fame 2026", desc: "Naismith Memorial Basketball Hall of Fame · Week-end 14-15 août", cat: "special", color: C.purple },
  // ─── SAISON 2026-27 ───
  { date: "2026-10-09", icon: "🇨🇳", title: "NBA China Games 2026", desc: "Dallas Mavericks vs Houston Rockets · Venetian Arena (Macao) · 9 & 11 octobre", cat: "intl", color: C.cyan },
  { date: "2026-11-07", icon: "🇲🇽", title: "NBA Mexico City Game", desc: "Denver Nuggets vs Indiana Pacers · Arena CDMX", cat: "intl", color: C.cyan },
  { date: "2027-01-14", icon: "🇫🇷", title: "NBA Paris Game 2027", desc: "San Antonio Spurs vs New Orleans Pelicans · Accor Arena", cat: "intl", color: C.cyan },
  { date: "2027-01-17", icon: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", title: "NBA Manchester Game 2027", desc: "San Antonio Spurs vs New Orleans Pelicans · Co-op Live", cat: "intl", color: C.cyan },
  { date: "2027-02-19", icon: "⭐", title: "NBA All-Star 2027", desc: "Phoenix, Arizona · 19-21 février", cat: "allstar", color: C.gold },
];

const CATEGORIES = [
  { id: "all",     label: "Tout",        icon: "📅" },
  { id: "finals",  label: "Finales",     icon: "🏆" },
  { id: "draft",   label: "Draft",       icon: "🎓" },
  { id: "fa",      label: "Free Agency", icon: "🆓" },
  { id: "summer",  label: "Summer",      icon: "☀️" },
  { id: "intl",    label: "Matchs Intl", icon: "🌍" },
  { id: "allstar", label: "All-Star",    icon: "⭐" },
  { id: "special", label: "Spécial",     icon: "🏛️" },
];

function CountdownBadge({ days }) {
  if (days < 0) return (
    <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 10, fontWeight: 800, background: "rgba(107,107,136,0.15)", color: C.muted }}>PASSÉ</span>
  );
  if (days === 0) return (
    <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 10, fontWeight: 800, background: "rgba(255,77,109,0.2)", color: C.red, animation: "shimmer 1.5s infinite" }}>AUJOURD'HUI 🔥</span>
  );
  if (days === 1) return (
    <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 10, fontWeight: 800, background: "rgba(255,92,0,0.2)", color: C.orange }}>DEMAIN</span>
  );
  if (days <= 7) return (
    <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 10, fontWeight: 800, background: "rgba(255,92,0,0.15)", color: C.orange }}>Dans {days}j</span>
  );
  if (days <= 30) return (
    <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 10, fontWeight: 800, background: "rgba(79,163,255,0.15)", color: C.blue }}>Dans {days}j</span>
  );
  return (
    <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 10, fontWeight: 800, background: "rgba(192,132,252,0.15)", color: C.purple }}>Dans {days}j</span>
  );
}

function EventCard({ event }) {
  const days = daysUntil(event.date);
  const isPast = days < 0;
  const isImminent = days >= 0 && days <= 3;

  const dateLabel = new Date(event.date).toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div style={{
      display: "flex", gap: 16, padding: "18px 20px",
      borderRadius: 16,
      background: isPast ? "rgba(255,255,255,0.02)" : isImminent ? `${event.color}0a` : C.surface,
      border: `1px solid ${isPast ? "rgba(255,255,255,0.04)" : isImminent ? `${event.color}35` : C.border}`,
      opacity: isPast ? 0.45 : 1,
      transition: "all 0.2s",
      boxShadow: isImminent && !isPast ? `0 0 20px ${event.color}10` : "none",
    }}>
      {/* Icon circle */}
      <div style={{
        width: 48, height: 48, borderRadius: 14, flexShrink: 0,
        background: isPast ? "rgba(255,255,255,0.04)" : `${event.color}18`,
        border: `1px solid ${isPast ? "rgba(255,255,255,0.08)" : `${event.color}35`}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 22,
      }}>{event.icon}</div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
          <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 17, letterSpacing: 0.8, color: isPast ? C.muted : C.text, lineHeight: 1.2 }}>
            {event.title}
          </div>
          <CountdownBadge days={days} />
        </div>
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 5, textTransform: "capitalize" }}>{dateLabel}</div>
        <div style={{ fontSize: 12, color: isPast ? C.muted : "rgba(240,240,255,0.7)", lineHeight: 1.5 }}>{event.desc}</div>
      </div>
    </div>
  );
}

export default function Calendrier() {
  const [cat, setCat] = useState("all");

  const filtered = EVENTS
    .filter(e => cat === "all" || e.cat === cat)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const upcoming = filtered.filter(e => daysUntil(e.date) >= 0);
  const past     = filtered.filter(e => daysUntil(e.date) < 0);

  // Prochain événement (countdown hero)
  const nextEvent = EVENTS.filter(e => daysUntil(e.date) >= 0).sort((a, b) => new Date(a.date) - new Date(b.date))[0];
  const nextDays  = nextEvent ? daysUntil(nextEvent.date) : null;

  return (
    <div className="fade-in">
      <style>{`
        @keyframes shimmer { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes countPulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.04)} }
      `}</style>

      {/* Hero banner */}
      <div style={{
        position: "relative", borderRadius: 20, overflow: "hidden",
        marginBottom: 28, padding: "32px 36px",
        background: "linear-gradient(135deg, rgba(255,92,0,0.12) 0%, rgba(192,132,252,0.08) 50%, rgba(6,182,212,0.08) 100%)",
        border: "1px solid rgba(255,92,0,0.2)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 20 }}>
          <div>
            <h1 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 46, letterSpacing: 2, lineHeight: 1, margin: 0 }}>
              DATES <span style={{ color: C.orange }}>CLÉS</span> NBA
            </h1>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginTop: 6 }}>
              Saisons 2025-26 · 2026-27 · Finales, Draft, Free Agency, All-Star…
            </p>
          </div>

          {/* Countdown hero vers prochain event */}
          {nextEvent && (
            <div style={{
              background: `${nextEvent.color}12`,
              border: `1px solid ${nextEvent.color}35`,
              borderRadius: 16, padding: "16px 24px", textAlign: "center", minWidth: 180,
              animation: "countPulse 3s ease-in-out infinite",
            }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: nextEvent.color, letterSpacing: 1.5, marginBottom: 4, textTransform: "uppercase" }}>
                {nextEvent.icon} Prochain événement
              </div>
              <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: nextDays === 0 ? 28 : 44, color: nextEvent.color, lineHeight: 1 }}>
                {nextDays === 0 ? "AUJOURD'HUI" : `J-${nextDays}`}
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 4, maxWidth: 160 }}>{nextEvent.title}</div>
            </div>
          )}
        </div>
      </div>

      {/* Category filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
        {CATEGORIES.map(c => (
          <button
            key={c.id}
            onClick={() => setCat(c.id)}
            style={{
              padding: "7px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700,
              border: `1px solid ${cat === c.id ? C.orange : C.border}`,
              background: cat === c.id ? "rgba(255,92,0,0.15)" : C.surface,
              color: cat === c.id ? C.orange : C.muted,
              cursor: "pointer", fontFamily: "inherit", transition: "all .2s",
            }}
          >
            {c.icon} {c.label}
          </button>
        ))}
      </div>

      {/* Upcoming events */}
      {upcoming.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2.5, color: C.orange, textTransform: "uppercase", marginBottom: 14, fontFamily: "monospace" }}>
            🔜 À VENIR — {upcoming.length} événement{upcoming.length > 1 ? "s" : ""}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {upcoming.map((e, i) => <EventCard key={`${e.date}-${i}`} event={e} />)}
          </div>
        </div>
      )}

      {/* Past events */}
      {past.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2.5, color: C.muted, textTransform: "uppercase", marginBottom: 14, fontFamily: "monospace" }}>
            ✓ PASSÉ — {past.length} événement{past.length > 1 ? "s" : ""}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {past.map((e, i) => <EventCard key={`past-${e.date}-${i}`} event={e} />)}
          </div>
        </div>
      )}

      {filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 0", color: C.muted }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📅</div>
          <div style={{ fontSize: 14 }}>Aucun événement dans cette catégorie</div>
        </div>
      )}
    </div>
  );
}
